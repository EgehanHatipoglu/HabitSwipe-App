import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyRecord } from '../types/habit.types';

const KEY = 'daily_records';

export async function loadRecords(): Promise<DailyRecord[]> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
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

/** Belirli bir tarihteki tüm kayıtları döner */
export async function getRecordsByDate(date: string): Promise<DailyRecord[]> {
    const all = await loadRecords();
    return all.filter(r => r.date === date);
}

/** Son N günün kayıtlarını döner (istatistik için) */
export async function getRecentRecords(days: number): Promise<DailyRecord[]> {
    const all = await loadRecords();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return all.filter(r => r.date >= cutoffStr);
}
