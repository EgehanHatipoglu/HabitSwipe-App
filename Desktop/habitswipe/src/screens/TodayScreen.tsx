import { useState, useContext, useCallback } from 'react';
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

import type { Habit, SwipeStatus, DailyRecord } from '../types/habit.types';
import type { RootStackParamList } from '../types/navigation.types';
import { todayStr } from '../utils/dateUtils';
import { hasTodayRecord } from '../utils/duplicateGuard';
import { updateStreakOnDone, updateStreakOnMissed } from '../utils/streakUtils';
import { calcLevel, calcLevelProgress } from '../constants/xp';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Demo alışkanlıklar — gerçekte AppContext'ten gelecek
const DEMO_HABITS: Habit[] = [
    {
        id: '1', title: '10 dk meditasyon', description: 'Nefes egzersizi ile başla',
        category: 'mindfulness', targetCount: 10, targetUnit: 'min',
        xpReward: 15, isActive: true, streak: 4, createdAt: new Date().toISOString(),
    },
    {
        id: '2', title: 'Su iç', description: '8 bardak su',
        category: 'health', targetCount: 8, targetUnit: 'times',
        xpReward: 10, isActive: true, streak: 7, createdAt: new Date().toISOString(),
    },
    {
        id: '3', title: 'İngilizce çalış',
        category: 'study', targetCount: 20, targetUnit: 'min',
        xpReward: 20, isActive: true, streak: 2, createdAt: new Date().toISOString(),
    },
    {
        id: '4', title: '30 dk koş',
        category: 'fitness', targetCount: 30, targetUnit: 'min',
        xpReward: 25, isActive: true, streak: 1, createdAt: new Date().toISOString(),
    },
];

export default function TodayScreen() {
    const navigation = useNavigation<Nav>();
    const { records, setRecords, userProgress, setUserProgress, setPendingLevelUp } =
        useContext(AppContext);

    const [queue, setQueue] = useState<Habit[]>(
        DEMO_HABITS.filter(h => !hasTodayRecord(records, h.id, todayStr())),
    );
    const [doneCount, setDoneCount] = useState(0);
    const [xpBurst, setXpBurst] = useState<number | null>(null);
    const today = todayStr();

    const handleSwipe = useCallback((habit: Habit, status: SwipeStatus) => {
        if (hasTodayRecord(records, habit.id, today)) return;

        const newRecord: DailyRecord = {
            id: `${habit.id}-${today}`,
            habitId: habit.id,
            date: today,
            status,
            xpEarned: status === 'done' ? habit.xpReward : 0,
            createdAt: new Date().toISOString(),
        };
        setRecords([...records, newRecord]);
        setQueue(prev => prev.filter(h => h.id !== habit.id));

        if (status === 'done') {
            setDoneCount(c => c + 1);
            const newXp = userProgress.totalXp + habit.xpReward;
            const oldLevel = calcLevel(userProgress.totalXp);
            const newLevel = calcLevel(newXp);
            setUserProgress({
                ...updateStreakOnDone(userProgress),
                totalXp: newXp,
                level: newLevel,
                totalDone: userProgress.totalDone + 1,
            });
            setXpBurst(habit.xpReward);
            if (newLevel > oldLevel) {
                setPendingLevelUp(newLevel);
                setTimeout(() => navigation.navigate('LevelUp', { newLevel }), 600);
            }
        } else {
            setUserProgress(updateStreakOnMissed(userProgress));
        }
    }, [records, userProgress, today]);

    const level = calcLevel(userProgress.totalXp);
    const progress = calcLevelProgress(userProgress.totalXp);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle="dark-content" />

                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Bugün</Text>
                        <Text style={styles.date}>
                            {new Date().toLocaleDateString('tr-TR', {
                                weekday: 'long', day: 'numeric', month: 'long',
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
                        : `${doneCount}/${DEMO_HABITS.length} tamamlandı`}
                </Text>

                <View style={styles.stackArea}>
                    {queue.length > 0 ? (
                        <SwipeStack habits={queue} onSwipe={handleSwipe} />
                    ) : (
                        <EmptyState completedCount={doneCount} totalCount={DEMO_HABITS.length} />
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
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8,
    },
    greeting: { fontSize: 28, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    date: { fontSize: 14, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' },
    levelBadge: {
        backgroundColor: '#8B5CF6', paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 20, marginTop: 4,
    },
    levelText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    xpBarWrap: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 24, gap: 10, marginBottom: 4,
    },
    xpBarBg: {
        flex: 1, height: 6, backgroundColor: '#E5E7EB',
        borderRadius: 3, overflow: 'hidden',
    },
    xpBarFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 3 },
    xpLabel: { fontSize: 12, color: '#8B5CF6', fontWeight: '600', minWidth: 52, textAlign: 'right' },
    counter: { textAlign: 'center', fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginBottom: 8 },
    stackArea: { flex: 1, position: 'relative' },
    footer: { alignItems: 'center', paddingVertical: 14 },
    footerText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
});
