import type { Habit } from '../types/habit.types';
import { todayStr } from './dateUtils';

/**
 * Dün'ün tarihini YYYY-MM-DD formatında döner.
 * Yerel saat kullanır, UTC değil.
 */
function yesterdayStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Bir alışkanlık "done" olarak işaretlendiğinde streak'i günceller.
 *
 * Kurallar:
 *   - lastDoneDate === today    → zaten bugün yapıldı, dokunma (çifte swipe koruması)
 *   - lastDoneDate === dün      → ardışık gün, streak bir artar
 *   - lastDoneDate === undefined veya daha eski → seri koptu, 1'den başla
 */
export function updateHabitOnDone(habit: Habit): Habit {
    const today = todayStr();

    // Çifte kayıt koruması
    if (habit.lastDoneDate === today) {
        return habit;
    }

    const yesterday = yesterdayStr();
    const isConsecutive = habit.lastDoneDate === yesterday;
    const newStreak = isConsecutive ? habit.streak + 1 : 1;

    return {
        ...habit,
        streak: newStreak,
        lastDoneDate: today,
    };
}

/**
 * Bir alışkanlık "missed" olarak işaretlendiğinde streak'i sıfırlar.
 * lastDoneDate'e dokunmaz — geçmiş bilgi korunur.
 */
export function updateHabitOnMissed(habit: Habit): Habit {
    return {
        ...habit,
        streak: 0,
    };
}
