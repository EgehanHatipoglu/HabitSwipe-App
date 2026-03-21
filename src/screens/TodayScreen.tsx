import { useState, useContext, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppContext } from '../context/AppContext';
import SwipeStack from '../components/SwipeStack';
import EmptyState from '../components/EmptyState';
import XpBurst from '../components/XpBurst';
import { useHabitActions } from '../hooks/useHabitActions';

import type { Habit, SwipeStatus } from '../types/habit.types';
import type { RootStackParamList } from '../types/navigation.types';
import { todayStr } from '../utils/dateUtils';
import { hasTodayRecord } from '../utils/duplicateGuard';
import { calcLevel, calcLevelProgress } from '../utils/xpUtils';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TodayScreen() {
    const navigation = useNavigation<Nav>();
    const { habits, records, userProgress, setPendingLevelUp } = useContext(AppContext);
    const { handleSwipe } = useHabitActions();

    const today = todayStr();

    // ── Türetilmiş UI state ────────────────────────────────────────────────
    // queue ve doneCount, habits/records değiştikçe useEffect ile güncellenir.
    // commitSwipe her iki state'i de optimistic olarak güncellediğinden
    // swipe anında otomatik yenilenir — ayrı setQueue çağrısına gerek yok.
    const [queue, setQueue] = useState<Habit[]>(() =>
        habits.filter(h => h.isActive && !hasTodayRecord(records, h.id, today)),
    );
    const [doneCount, setDoneCount] = useState<number>(
        () => records.filter(r => r.date === today && r.status === 'done').length,
    );
    const [xpBurst, setXpBurst] = useState<number | null>(null);

    useEffect(() => {
        setQueue(habits.filter(h => h.isActive && !hasTodayRecord(records, h.id, today)));
        setDoneCount(records.filter(r => r.date === today && r.status === 'done').length);
    }, [habits, records, today]);

    // ── Swipe handler — yalnızca UI sorumluluğu ───────────────────────────
    // İş mantığı (XP hesabı, streak, record oluşturma, disk yazımı)
    // tamamen useHabitActions hook'una taşındı.
    // Bu fonksiyon sadece sonucu alıp animasyon / navigasyon tetikler.
    const onSwipe = useCallback(
        async (habit: Habit, status: SwipeStatus) => {
            const result = await handleSwipe(habit, status);

            // null → çifte swipe ya da disk hatası; UI dokunma
            if (!result) return;

            if (result.xpEarned > 0) {
                setXpBurst(result.xpEarned);
            }

            if (result.didLevelUp) {
                setPendingLevelUp(result.newLevel);
                setTimeout(
                    () => navigation.navigate('LevelUp', { newLevel: result.newLevel }),
                    600,
                );
            }
        },
        [handleSwipe, setPendingLevelUp, navigation],
    );

    // ── Türetilmiş gösterge değerleri ─────────────────────────────────────
    const totalActiveCount = habits.filter(h => h.isActive).length;
    const level            = calcLevel(userProgress.totalXp);
    const progress         = calcLevelProgress(userProgress.totalXp);

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle="dark-content" />

                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Bugün</Text>
                        <Text style={styles.date}>
                            {new Date().toLocaleDateString('tr-TR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </Text>
                    </View>
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>Lv {level}</Text>
                    </View>
                </View>

                <View style={styles.xpBarWrap}>
                    <View style={styles.xpBarBg}>
                        <View style={[styles.xpBarFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <Text style={styles.xpLabel}>{userProgress.totalXp} XP</Text>
                </View>

                <Text style={styles.counter}>
                    {queue.length > 0
                        ? `${queue.length} alışkanlık kaldı`
                        : `${doneCount}/${totalActiveCount} tamamlandı`}
                </Text>

                <View style={styles.stackArea}>
                    {queue.length > 0 ? (
                        <SwipeStack habits={queue} onSwipe={onSwipe} />
                    ) : (
                        <EmptyState
                            completedCount={doneCount}
                            totalCount={totalActiveCount}
                        />
                    )}
                    {xpBurst !== null && (
                        <XpBurst amount={xpBurst} onDone={() => setXpBurst(null)} />
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        🔥 {userProgress.currentStreak} günlük seri
                    </Text>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    greeting: { fontSize: 28, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    date: { fontSize: 14, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' },
    levelBadge: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 4,
    },
    levelText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    xpBarWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        gap: 10,
        marginBottom: 4,
    },
    xpBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    xpBarFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 3 },
    xpLabel: {
        fontSize: 12,
        color: '#8B5CF6',
        fontWeight: '600',
        minWidth: 52,
        textAlign: 'right',
    },
    counter: {
        textAlign: 'center',
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
        marginBottom: 8,
    },
    stackArea: { flex: 1, position: 'relative' },
    footer: { alignItems: 'center', paddingVertical: 14 },
    footerText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
});
