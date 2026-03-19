import type { DailyRecord } from '../types/habit.types';

/**
 * Belirli bir alışkanlık için bugün zaten kayıt var mı kontrol eder.
 * Aynı kart iki kez swipe edilmesini önler.
 */
export function hasTodayRecord(
    records: DailyRecord[],
    habitId: string,
    dateStr: string,
): boolean {
    return records.some(r => r.habitId === habitId && r.date === dateStr);
}
