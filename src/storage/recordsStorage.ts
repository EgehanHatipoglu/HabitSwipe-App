import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyRecord } from '../types/habit.types';

const KEY = 'daily_records';

/** AsyncStorage'da tutulacak maksimum gün sayısı. */
export const RECORDS_MAX_DAYS = 30;

/**
 * Verilen kayıt dizisinden RECORDS_MAX_DAYS günden eski olanları atar.
 * ProgressScreen'deki "Son 7 gün" gibi grafikler için 30 gün fazlasıyla yeterli.
 *
 * Karşılaştırma string sıralamasıyla yapılır (YYYY-MM-DD formatı
 * lexicographic sıralamada kronolojik sırayla örtüşür, bu yüzden
 * Date nesnesine çevirmek gerekmez).
 */
export function pruneOldRecords(records: DailyRecord[]): DailyRecord[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RECORDS_MAX_DAYS);

    // "YYYY-MM-DD" — sıfır doldurmak için padStart şart
    const cutoffStr = [
        cutoff.getFullYear(),
        String(cutoff.getMonth() + 1).padStart(2, '0'),
        String(cutoff.getDate()).padStart(2, '0'),
    ].join('-');

    return records.filter(r => r.date >= cutoffStr);
}

// ─── CRUD ─────────────────────────────────────────────────────────────────

export async function loadRecords(): Promise<DailyRecord[]> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return [];
        // Diskten okurken de temizle — eski sürümden kalmış şişmiş veriler için
        return pruneOldRecords(JSON.parse(raw));
    } catch {
        return [];
    }
}

export async function saveRecords(records: DailyRecord[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(records));
}

export async function addRecord(record: DailyRecord): Promise<void> {
    const existing = await loadRecords();
    await saveRecords([...existing, record]);
}

/** Belirli bir tarihteki tüm kayıtları döner. */
export async function getRecordsByDate(date: string): Promise<DailyRecord[]> {
    const all = await loadRecords();
    return all.filter(r => r.date === date);
}

/** Son N günün kayıtlarını döner (istatistik için). */
export async function getRecentRecords(days: number): Promise<DailyRecord[]> {
    const all = await loadRecords();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return all.filter(r => r.date >= cutoffStr);
}
