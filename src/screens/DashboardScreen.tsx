import { useContext, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { AppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants/categories';
import { C } from '../constants/colors';
import { calcLevel, calcLevelProgress, xpForLevel, xpInCurrentLevel } from '../utils/xpUtils';
import { todayStr } from '../utils/dateUtils';
import type { DailyRecord, HabitCategory } from '../types/habit.types';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 72; // padding 20*2 + card padding 16*2

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useLast7DaysBar(records: DailyRecord[], habitCount: number) {
    return useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = [
                d.getFullYear(),
                String(d.getMonth() + 1).padStart(2, '0'),
                String(d.getDate()).padStart(2, '0'),
            ].join('-');

            const done  = records.filter(r => r.date === dateStr && r.status === 'done').length;
            const total = habitCount || 1;
            const ratio = Math.min(done / total, 1);
            const isToday = dateStr === todayStr();

            return {
                value: Math.round(ratio * 100),
                label: DAYS_TR[d.getDay() === 0 ? 6 : d.getDay() - 1],
                frontColor: isToday ? C.PRIMARY : C.PRIMARY + '77',
                topLabelComponent: ratio > 0.01 ? () => (
                    <Text style={{ fontSize: 9, color: C.TEXT_MUTED, marginBottom: 2 }}>
                        {Math.round(ratio * 100)}%
                    </Text>
                ) : undefined,
            };
        });
    }, [records, habitCount]);
}

function useLast30DaysXP(records: DailyRecord[]) {
    return useMemo(() => {
        return Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            const dateStr = [
                d.getFullYear(),
                String(d.getMonth() + 1).padStart(2, '0'),
                String(d.getDate()).padStart(2, '0'),
            ].join('-');

            const xp = records
                .filter(r => r.date === dateStr && r.status === 'done')
                .reduce((sum, r) => sum + r.xpEarned, 0);

            return {
                value: xp,
                dataPointColor: C.PRIMARY,
            };
        });
    }, [records]);
}

function useCategoryPie(records: DailyRecord[], habits: any[]) {
    return useMemo(() => {
        const counts: Partial<Record<HabitCategory, number>> = {};
        records.forEach(r => {
            if (r.status !== 'done') return;
            const habit = habits.find(h => h.id === r.habitId);
            if (!habit) return;
            counts[habit.category as HabitCategory] = (counts[habit.category as HabitCategory] ?? 0) + 1;
        });

        return (Object.entries(counts) as [HabitCategory, number][])
            .filter(([, v]) => v > 0)
            .map(([cat, count]) => ({
                value: count,
                color: CATEGORIES[cat]?.color ?? C.PRIMARY,
                text: CATEGORIES[cat]?.label ?? cat,
            }));
    }, [records, habits]);
}

// ─── Ekran ────────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
    const { userProgress, records, habits } = useContext(AppContext);

    const level         = calcLevel(userProgress.totalXp);
    const levelProgress = calcLevelProgress(userProgress.totalXp);
    const xpEarned      = xpInCurrentLevel(userProgress.totalXp);
    const xpNeeded      = xpForLevel(level);

    const activeHabits  = habits.filter(h => h.isActive);
    const today         = todayStr();
    const todayDone     = records.filter(r => r.date === today && r.status === 'done').length;

    const barData    = useLast7DaysBar(records, activeHabits.length);
    const lineData   = useLast30DaysXP(records);
    const pieData    = useCategoryPie(records, habits);

    const hasLineData = lineData.some(d => d.value > 0);
    const hasPieData  = pieData.length > 0;

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.pageTitle}>Dashboard</Text>

                {/* ── Level & XP Kartı ───────────────────────────────────── */}
                <View style={styles.levelCard}>
                    <View style={styles.levelTop}>
                        <View style={styles.levelLeft}>
                            <Text style={styles.levelLabel}>Seviye</Text>
                            <Text style={styles.levelNum}>{level}</Text>
                        </View>
                        <View style={styles.xpCircle}>
                            <Text style={styles.xpCircleNum}>{userProgress.totalXp}</Text>
                            <Text style={styles.xpCircleLabel}>XP</Text>
                        </View>
                    </View>
                    <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${levelProgress * 100}%` as any }]} />
                    </View>
                    <Text style={styles.progressHint}>
                        {xpEarned} / {xpNeeded} XP — sonraki seviye
                    </Text>
                </View>

                {/* ── Stat Kartları ──────────────────────────────────────── */}
                <View style={styles.statGrid}>
                    <StatCard icon="flame" iconColor={C.STREAK}  label="Seri"        value={`${userProgress.currentStreak} gün`} />
                    <StatCard icon="trophy" iconColor="#F59E0B"   label="En iyi"      value={`${userProgress.bestStreak} gün`} />
                    <StatCard icon="checkmark-circle" iconColor={C.DONE} label="Toplam" value={`${userProgress.totalDone}`} />
                    <StatCard icon="today" iconColor={C.PRIMARY}  label="Bugün"       value={`${todayDone}/${activeHabits.length}`} />
                </View>

                {/* ── Son 7 Gün Bar Chart ────────────────────────────────── */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Son 7 Gün — Tamamlanma %</Text>
                    <BarChart
                        data={barData}
                        barWidth={CHART_W / 9}
                        spacing={CHART_W / 18}
                        roundedTop
                        roundedBottom
                        hideRules
                        hideAxesAndRules
                        yAxisThickness={0}
                        xAxisThickness={0}
                        maxValue={100}
                        noOfSections={4}
                        width={CHART_W}
                        height={120}
                        labelWidth={CHART_W / 7}
                        xAxisLabelTextStyle={{ fontSize: 11, color: C.TEXT_MUTED }}
                        isAnimated
                    />
                </View>

                {/* ── Son 30 Gün XP Line Chart ───────────────────────────── */}
                {hasLineData && (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Son 30 Gün — Günlük XP</Text>
                        <LineChart
                            data={lineData}
                            width={CHART_W}
                            height={120}
                            color={C.PRIMARY}
                            thickness={2}
                            startFillColor={C.PRIMARY + '44'}
                            endFillColor={C.PRIMARY + '00'}
                            areaChart
                            curved
                            hideDataPoints
                            hideRules
                            hideAxesAndRules
                            yAxisThickness={0}
                            xAxisThickness={0}
                            isAnimated
                        />
                    </View>
                )}

                {/* ── Kategori Dağılımı Pie Chart ────────────────────────── */}
                {hasPieData && (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Kategori Dağılımı</Text>
                        <View style={styles.pieRow}>
                            <PieChart
                                data={pieData}
                                radius={70}
                                innerRadius={42}
                                donut
                                centerLabelComponent={() => (
                                    <View style={styles.pieCenter}>
                                        <Text style={styles.pieCenterNum}>{userProgress.totalDone}</Text>
                                        <Text style={styles.pieCenterLabel}>toplam</Text>
                                    </View>
                                )}
                                isAnimated
                            />
                            <View style={styles.pieLegend}>
                                {pieData.map((item, i) => (
                                    <View key={i} style={styles.legendRow}>
                                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                        <Text style={styles.legendText}>{item.text}</Text>
                                        <Text style={styles.legendValue}>{item.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* ── Alışkanlık Streaks ─────────────────────────────────── */}
                {activeHabits.length > 0 && (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Alışkanlık Serileri</Text>
                        {activeHabits.map(habit => {
                            const cat = CATEGORIES[habit.category];
                            const maxStreak = Math.max(...activeHabits.map(h => h.streak), 1);
                            const pct = habit.streak / maxStreak;
                            return (
                                <View key={habit.id} style={styles.streakRow}>
                                    <View style={styles.streakLeft}>
                                        <View style={[styles.streakIcon, { backgroundColor: cat.color + '20' }]}>
                                            <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                                        </View>
                                        <Text style={styles.streakName} numberOfLines={1}>{habit.title}</Text>
                                    </View>
                                    <View style={styles.streakBarWrap}>
                                        <View style={[styles.streakBar, { width: `${Math.max(pct * 100, 4)}%` as any, backgroundColor: cat.color }]} />
                                    </View>
                                    <View style={styles.streakCount}>
                                        <Ionicons name="flame" size={12} color={C.STREAK} />
                                        <Text style={styles.streakNum}>{habit.streak}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Alt Bileşen ──────────────────────────────────────────────────────────────

function StatCard({ icon, iconColor, label, value }: {
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

// ─── Stiller ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.SAFE_BG },
    scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48, gap: 14 },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: C.TEXT_MAIN,
        letterSpacing: -0.5,
        marginBottom: 4,
        fontFamily: 'Arial',
    },

    // Level card
    levelCard: {
        backgroundColor: C.CARD_BG,
        borderRadius: 20,
        padding: 20,
        borderWidth: 0.5,
        borderColor: C.BORDER,
    },
    levelTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    levelLeft: { gap: 2 },
    levelLabel: { fontSize: 13, color: C.TEXT_SUB, fontWeight: '500' },
    levelNum: { fontSize: 48, fontWeight: '800', color: C.TEXT_MAIN, lineHeight: 54, fontFamily: 'Arial' },
    xpCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: C.PRIMARY + '18',
        alignItems: 'center', justifyContent: 'center',
    },
    xpCircleNum: { fontSize: 18, fontWeight: '800', color: C.PRIMARY },
    xpCircleLabel: { fontSize: 11, color: C.PRIMARY, fontWeight: '600', marginTop: -2 },
    progressBg: { height: 8, backgroundColor: C.BORDER, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
    progressFill: { height: '100%', backgroundColor: C.PRIMARY, borderRadius: 4 },
    progressHint: { fontSize: 12, color: C.TEXT_MUTED },

    // Stat grid
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: {
        flex: 1, minWidth: '44%',
        backgroundColor: C.CARD_BG,
        borderRadius: 16, padding: 16,
        borderWidth: 0.5, borderColor: C.BORDER, gap: 4,
    },
    statValue: { fontSize: 22, fontWeight: '700', color: C.TEXT_MAIN, marginTop: 4 },
    statLabel: { fontSize: 12, color: C.TEXT_SUB },

    // Chart card
    chartCard: {
        backgroundColor: C.CARD_BG,
        borderRadius: 20, padding: 20,
        borderWidth: 0.5, borderColor: C.BORDER, gap: 16,
    },
    chartTitle: { fontSize: 15, fontWeight: '700', color: C.TEXT_MAIN },

    // Pie
    pieRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    pieCenter: { alignItems: 'center' },
    pieCenterNum: { fontSize: 22, fontWeight: '800', color: C.TEXT_MAIN },
    pieCenterLabel: { fontSize: 11, color: C.TEXT_MUTED },
    pieLegend: { flex: 1, gap: 8 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { flex: 1, fontSize: 12, color: C.TEXT_SUB },
    legendValue: { fontSize: 12, fontWeight: '600', color: C.TEXT_MAIN },

    // Streak bars
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 6,
    },
    streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 110 },
    streakIcon: {
        width: 24, height: 24, borderRadius: 6,
        alignItems: 'center', justifyContent: 'center',
    },
    streakName: { flex: 1, fontSize: 12, color: C.TEXT_MAIN, fontWeight: '500' },
    streakBarWrap: {
        flex: 1, height: 8,
        backgroundColor: C.BORDER,
        borderRadius: 4, overflow: 'hidden',
    },
    streakBar: { height: '100%', borderRadius: 4 },
    streakCount: { flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 30 },
    streakNum: { fontSize: 12, fontWeight: '600', color: C.TEXT_MAIN },
});
