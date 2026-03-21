import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyRecord } from '../types/habit.types';
import { RECORDS_KEY } from './keys';

// ─── Sınır sabitleri ───────────────────────────────────────────────────────

/**
 * Kaç günlük kaydı tutacağımız.
 * Bu değer değişirse eski kayıtlar bir sonraki pruneOldRecords() çağrısında
 * otomatik temizlenir; migration gerekli değildir çünkü prune idempotent.
 */
export const RECORDS_MAX_DAYS = 30;

/**
 * Mutlak kayıt sayısı tavanı.
 *
 * Hesap: 30 gün × 50 alışkanlık = 1500. Bunu aşan durumlarda
 * (örneğin kullanıcı RECORDS_MAX_DAYS'i artırırsa veya çok fazla alışkanlık
 * eklerse) gün penceresinin yanı sıra bu tavan devreye girer ve
 * AsyncStorage'ın şişmesini önler.
 *
 * Değer değiştirilirse bir migration (bkz. migrations.ts) tetiklenmesi
 * ÖNERİLİR; aksi hâlde disk temizliği yalnızca bir sonraki yazımda olur.
 */
export const RECORDS_MAX_COUNT = 1_500;

// ─── Prune ────────────────────────────────────────────────────────────────

/**
 * Kayıt dizisini iki katmanlı filtreyle temizler:
 *
 * Katman 1 — Zaman penceresi:
 *   RECORDS_MAX_DAYS günden eski kayıtları atar.
 *   YYYY-MM-DD formatı lexicographic sıralamada kronolojik sırayla
 *   örtüştüğünden Date nesnesi gereksizdir; string karşılaştırması yeterli.
 *
 * Katman 2 — Mutlak tavan:
 *   Zaman penceresinden geçen kayıtlar hâlâ RECORDS_MAX_COUNT'u aşıyorsa
 *   (olağandışı ama mümkün), en eski kayıtlar atılır; en yeni olanlar tutulur.
 *
 * Her iki katman da idempotent: aynı dizi üzerinde defalarca çalıştırmak
 * hep aynı sonucu verir.
 */
export function pruneRecords(records: DailyRecord[]): DailyRecord[] {
    // ── Katman 1: Gün penceresi ────────────────────────────────────────────
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RECORDS_MAX_DAYS);

    const cutoffStr = [
        cutoff.getFullYear(),
        String(cutoff.getMonth() + 1).padStart(2, '0'),
        String(cutoff.getDate()).padStart(2, '0'),
    ].join('-');

    const byDate = records.filter(r => r.date >= cutoffStr);

    // ── Katman 2: Mutlak tavan ────────────────────────────────────────────
    if (byDate.length <= RECORDS_MAX_COUNT) return byDate;

    // Tarihe göre sırala (eski → yeni), sonra son RECORDS_MAX_COUNT kaydı al
    const sorted = [...byDate].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(sorted.length - RECORDS_MAX_COUNT);
}

/**
 * @deprecated pruneRecords() kullanın.
 * Geriye dönük uyumluluk için alias olarak bırakıldı;
 * bir sonraki majör refactor'da silinecek.
 */
export const pruneOldRecords = pruneRecords;

// ─── CRUD ─────────────────────────────────────────────────────────────────

export async function loadRecords(): Promise<DailyRecord[]> {
    try {
        const raw = await AsyncStorage.getItem(RECORDS_KEY);
        if (!raw) return [];
        // Diskten okurken de temizle — eski versiyondan kalmış şişmiş veya
        // RECORDS_MAX_DAYS değiştirilmiş olabilir.
        return pruneRecords(JSON.parse(raw));
    } catch {
        return [];
    }
}

export async function saveRecords(records: DailyRecord[]): Promise<void> {
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export async function addRecord(record: DailyRecord): Promise<void> {
    const existing = await loadRecords();
    await saveRecords([...existing, record]);
}

export async function getRecordsByDate(date: string): Promise<DailyRecord[]> {
    const all = await loadRecords();
    return all.filter(r => r.date === date);
}

export async function getRecentRecords(days: number): Promise<DailyRecord[]> {
    const all = await loadRecords();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return all.filter(r => r.date >= cutoffStr);
}
