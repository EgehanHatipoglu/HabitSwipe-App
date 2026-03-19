import type { UserProgress } from '../types/habit.types';
import { todayStr } from './dateUtils';

/**
 * Alışkanlık tamamlandığında streak ve lastActiveDate günceller.
 * Ardışık günlerde streak artar; bir gün atlanırsa sıfırlanır.
 */
export function updateStreakOnDone(progress: UserProgress): UserProgress {
    const today = todayStr();
    const last = progress.lastActiveDate;

    // Bugün zaten sayıldıysa streak'i değiştirme
    if (last === today) {
        return progress;
    }

    // Dünden devam ediyor mu?
    const yesterday = (() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const newStreak = last === yesterday ? progress.currentStreak + 1 : 1;
    const bestStreak = Math.max(newStreak, progress.bestStreak);

    return {
        ...progress,
        currentStreak: newStreak,
        bestStreak,
        lastActiveDate: today,
    };
}

/**
 * Alışkanlık kaçırıldığında progress'i olduğu gibi bırakır.
 * (Streak sadece tamamlanan günlerde ilerler.)
 */
export function updateStreakOnMissed(progress: UserProgress): UserProgress {
    return progress;
}
