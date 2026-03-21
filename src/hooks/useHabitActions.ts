import { useContext, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import type { Habit, SwipeStatus, DailyRecord, UserProgress } from '../types/habit.types';
import { todayStr } from '../utils/dateUtils';
import { hasTodayRecord } from '../utils/duplicateGuard';
import { pruneRecords } from '../storage/recordsStorage';
import { updateHabitOnDone, updateHabitOnMissed } from '../utils/habitStreakUtils';
import { updateStreakOnDone, updateStreakOnMissed } from '../utils/streakUtils';
import { calcLevel } from '../utils/xpUtils';

// ─── Dönüş tipi ────────────────────────────────────────────────────────────

export interface SwipeResult {
    /** Kazanılan XP — 'missed' durumunda 0. */
    xpEarned: number;
    /** Seviye atlandıysa true. */
    didLevelUp: boolean;
    /** Güncel seviye (atlanmış olsun ya da olmasın). */
    newLevel: number;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

/**
 * Swipe iş mantığını kapsülleyen hook.
 *
 * Sorumluluklar:
 *   - Günlük kayıt oluşturma
 *   - Habit streak hesaplama
 *   - XP ve level hesaplama
 *   - User progress streak güncelleme
 *   - commitSwipe ile atomik state + disk yazımı
 *
 * TodayScreen bu hook'u kullanır ve yalnızca UI sorumluluğunu taşır:
 * XP burst animasyonu gösterme ve LevelUp ekranına yönlendirme.
 */
export function useHabitActions() {
    const { habits, records, userProgress, commitSwipe } = useContext(AppContext);

    const handleSwipe = useCallback(
        async (habit: Habit, status: SwipeStatus): Promise<SwipeResult | null> => {
            const today = todayStr();

            // Çifte kayıt koruması
            if (hasTodayRecord(records, habit.id, today)) return null;

            // ── 1. Yeni günlük kayıt ──────────────────────────────────────
            const newRecord: DailyRecord = {
                id: `${habit.id}-${today}`,
                habitId: habit.id,
                date: today,
                status,
                xpEarned: status === 'done' ? habit.xpReward : 0,
                createdAt: new Date().toISOString(),
            };

            // Records'u prune ile birlikte güncelle
            const nextRecords = pruneRecords([...records, newRecord]);

            // ── 2. Habit streak ───────────────────────────────────────────
            const nextHabits = habits.map(h =>
                h.id !== habit.id
                    ? h
                    : status === 'done'
                    ? updateHabitOnDone(h)
                    : updateHabitOnMissed(h),
            );

            // ── 3. User progress ──────────────────────────────────────────
            let nextProgress: UserProgress;
            let newLevel  = calcLevel(userProgress.totalXp);
            let didLevelUp = false;

            if (status === 'done') {
                const newTotalXp = userProgress.totalXp + habit.xpReward;
                const oldLevel   = calcLevel(userProgress.totalXp);
                newLevel   = calcLevel(newTotalXp);
                didLevelUp = newLevel > oldLevel;

                nextProgress = {
                    ...updateStreakOnDone(userProgress),
                    totalXp:   newTotalXp,
                    level:     newLevel,
                    totalDone: userProgress.totalDone + 1,
                };
            } else {
                nextProgress = updateStreakOnMissed(userProgress);
            }

            // ── 4. Atomik commit ──────────────────────────────────────────
            // commitSwipe:
            //   - Üç state'i aynı anda günceller (tek React render batch)
            //   - AsyncStorage.multiSet ile tek yazım
            //   - Disk hatasında tam rollback
            try {
                await commitSwipe({
                    habits:   nextHabits,
                    records:  nextRecords,
                    progress: nextProgress,
                });
            } catch {
                // commitSwipe hata alert'ini zaten gösterdi; null dönerek
                // TodayScreen'in UI güncellemesi yapmamasını sağlıyoruz.
                return null;
            }

            return {
                xpEarned: status === 'done' ? habit.xpReward : 0,
                didLevelUp,
                newLevel,
            };
        },
        // habits/records/userProgress değişince yeni closure gerekli
        [habits, records, userProgress, commitSwipe],
    );

    return { handleSwipe };
}
