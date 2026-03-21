import { useContext, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { calcLevel, calcLevelProgress, XP_PER_LEVEL } from '../constants/xp';
import { todayStr } from '../utils/dateUtils';
import type { DailyRecord } from '../types/habit.types';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const ACCENT = '#8B5CF6';

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * Son 7 güne ait tamamlama oranlarını hesaplar.
 *
 * Önceki kodda `ReturnType<typeof useContext<typeof AppContext>>['records']`
 * yazılmıştı — useContext generic parametre almaz, bu tip geçersizdi.
 * Doğrusu parametre tipini açıkça `DailyRecord[]` olarak belirtmek.
 */
function useLast7Days(
    records: DailyRecord[],
    habitCount: number,
) {
    return useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = [
                d.getFullYear(),
                String(d.getMonth() + 1).padStart(2, '0'),
                String(d.getDate()).padStart(2, '0'),
            ].join('-');

            const done = records.filter(
                r => r.date === dateStr && r.status === 'done',
            ).length;
            const total = habitCount || 1;

            return {
                day: DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1],
                ratio: Math.min(done / total, 1),
                isToday: dateStr === todayStr(),
            };
        });
    }, [records, habitCount]);
}

// ─── Ekran ────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
    const { userProgress, records, habits } = useContext(AppContext);
    const level = calcLevel(userProgress.totalXp);
    const levelProgress = calcLevelProgress(userProgress.totalXp);
    const xpInLevel = userProgress.totalXp % XP_PER_LEVEL;

    const activeHabits = habits.filter(h => h.isActive);
    const week = useLast7Days(records, activeHabits.length);

    const today = todayStr();
    const todayDone = records.filter(
        r => r.date === today && r.status === 'done',
    ).length;
    const todayTotal = activeHabits.length;

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.pageTitle}>İlerleme</Text>

                {/* Level kartı */}
                <View style={styles.levelCard}>
                    <View style={styles.levelTop}>
                        <View>
                            <Text style={styles.levelLabel}>Seviye</Text>
                            <Text style={styles.levelNum}>{level}</Text>
                        </View>
                        <View style={styles.xpCircle}>
                            <Text style={styles.xpCircleNum}>{userProgress.totalXp}</Text>
                            <Text style={styles.xpCircleLabel}>XP</Text>
                        </View>
                    </View>
                    <View style={styles.progressBg}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${levelProgress * 100}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressHint}>
                        {xpInLevel} / {XP_PER_LEVEL} XP — sonraki seviye
                    </Text>
                </View>

                {/* Stat kartları */}
                <View style={styles.statGrid}>
                    <StatCard
                        icon="flame"
                        iconColor="#F97316"
                        label="Mevcut seri"
                        value={`${userProgress.currentStreak} gün`}
                    />
                    <StatCard
                        icon="trophy"
                        iconColor="#F59E0B"
                        label="En uzun seri"
                        value={`${userProgress.bestStreak} gün`}
                    />
                    <StatCard
                        icon="checkmark-circle"
                        iconColor="#22C55E"
                        label="Toplam yapılan"
                        value={`${userProgress.totalDone}`}
                    />
                    <StatCard
                        icon="today"
                        iconColor={ACCENT}
                        label="Bugün"
                        value={`${todayDone}/${todayTotal}`}
                    />
                </View>

                {/* Son 7 gün bar grafiği */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Son 7 gün</Text>
                    <View style={styles.barRow}>
                        {week.map((day, i) => (
                            <View key={i} style={styles.barCol}>
                                <View style={styles.barWrap}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: `${Math.max(day.ratio * 100, 4)}%`,
                                                backgroundColor: day.isToday
                                                    ? ACCENT
                                                    : day.ratio > 0
                                                    ? ACCENT + '66'
                                                    : '#E5E7EB',
                                            },
                                        ]}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.barLabel,
                                        day.isToday && { color: ACCENT, fontWeight: '600' },
                                    ]}
                                >
                                    {day.day}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Her alışkanlığın streak'i */}
                {activeHabits.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Alışkanlık serileri</Text>
                        {activeHabits.map(habit => (
                            <View key={habit.id} style={styles.habitRow}>
                                <Text style={styles.habitName} numberOfLines={1}>
                                    {habit.title}
                                </Text>
                                <View style={styles.habitStreak}>
                                    <Ionicons name="flame" size={14} color="#F97316" />
                                    <Text style={styles.habitStreakNum}>{habit.streak}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Alt bileşen ──────────────────────────────────────────────────────────

function StatCard({
    icon,
    iconColor,
    label,
    value,
}: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    iconColor: string;
    label: string;
    value: string;
}) {
    return (
        <View style={styles.statCard}>
            <Ionicons name={icon} size={22} color={iconColor} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

// ─── Stiller ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAFA' },
    scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 14 },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
        marginBottom: 4,
    },

    levelCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    levelTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    levelLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginBottom: 2 },
    levelNum: { fontSize: 48, fontWeight: '800', color: '#111827', lineHeight: 54 },
    xpCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: ACCENT + '18',
        alignItems: 'center',
        justifyContent: 'center',
    },
    xpCircleNum: { fontSize: 18, fontWeight: '800', color: ACCENT },
    xpCircleLabel: { fontSize: 11, color: ACCENT, fontWeight: '600', marginTop: -2 },
    progressBg: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 4 },
    progressHint: { fontSize: 12, color: '#9CA3AF' },

    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: {
        flex: 1,
        minWidth: '44%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
        gap: 4,
    },
    statValue: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 4 },
    statLabel: { fontSize: 12, color: '#6B7280' },

    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 },

    barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100 },
    barCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
    barWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
    bar: { width: '100%', borderRadius: 4, minHeight: 4 },
    barLabel: { fontSize: 11, color: '#9CA3AF' },

    habitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F3F4F6',
    },
    habitName: { flex: 1, fontSize: 14, color: '#374151', marginRight: 8 },
    habitStreak: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    habitStreakNum: { fontSize: 14, fontWeight: '600', color: '#F97316' },
});
