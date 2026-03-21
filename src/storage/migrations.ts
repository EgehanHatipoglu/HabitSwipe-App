/**
 * Şema migration sistemi.
 *
 * ## Nasıl çalışır?
 *
 * Her uygulama açılışında AppContext, disk üzerindeki schema_version'ı okur.
 * Eksikse 0 kabul edilir (hiç migration çalışmamış = v1 öncesi kurulum).
 * MIGRATIONS dizisindeki her adım sırayla kontrol edilir; diskVersion'dan
 * büyük olanlar çalıştırılır. Tüm adımlar bittikten sonra CURRENT_SCHEMA_VERSION
 * diske yazılır.
 *
 * ## Yeni migration eklemek
 *
 * 1. MIGRATIONS dizisine yeni bir { version, description, run } nesnesi ekle.
 * 2. keys.ts'deki CURRENT_SCHEMA_VERSION'ı bir artır.
 * 3. Başka bir şey yapma — runner otomatik çalışır.
 *
 * ## Garantiler
 *
 * - Her migration yalnızca bir kez çalışır (version guard sayesinde).
 * - Migration başarısız olursa sürüm diske yazılmaz; bir sonraki açılışta tekrar dener.
 * - Bireysel migration'lar kendi içinde hata yakalar ve devam edebilir;
 *   kritik hatalar fırlatılır ve tüm runner durur.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    RECORDS_KEY,
    SCHEMA_VERSION_KEY,
    CURRENT_SCHEMA_VERSION,
} from './keys';
import { pruneRecords } from './recordsStorage';
import type { DailyRecord } from '../types/habit.types';

// ─── Migration adımları ────────────────────────────────────────────────────

interface MigrationStep {
    /** Bu adımın hedef versiyonu. diskVersion < version ise çalışır. */
    version: number;
    /** Geliştirici için açıklama — production'da gösterilmez. */
    description: string;
    /** Migration mantığı. Hata fırlatırsa runner durur. */
    run: () => Promise<void>;
}

const MIGRATIONS: MigrationStep[] = [
    // ── v1: İlk şema (mevcut kurulumları işaretle) ───────────────────────
    // Yeni kurulumlar doğrudan v2'ye başlayacak.
    // Eski kurulumların v0 → v1 geçişi "hiçbir şey yapma" anlamına geliyor;
    // yalnızca sürümü diske yazar.
    {
        version: 1,
        description: 'Baseline: mark existing installations as v1',
        run: async () => {
            // Veri dönüşümü yok; sadece versiyonlama başlatılıyor.
        },
    },

    // ── v2: İki katmanlı prune (gün + mutlak tavan) ──────────────────────
    // Problem: eski kurulumlar yalnızca gün bazlı prune yapıyordu.
    //   RECORDS_MAX_COUNT sabiti eklendi; bu migration mevcut kayıtları
    //   yeni kuralla hemen temizler. Bir sonraki loadRecords() çağrısında
    //   zaten temizlenecekti, ama migration sayesinde:
    //   (a) kullanıcı ilk açılışta büyük bir AsyncStorage ile karşılaşmaz,
    //   (b) RECORDS_MAX_DAYS veya RECORDS_MAX_COUNT değiştirilse bile
    //       eski veriler anında yeni kurala göre budanır.
    {
        version: 2,
        description: 'Apply dual-layer prune (day window + count cap) to existing records',
        run: async () => {
            const raw = await AsyncStorage.getItem(RECORDS_KEY);
            if (!raw) return;

            let records: DailyRecord[];
            try {
                records = JSON.parse(raw);
            } catch {
                // Bozuk JSON — silmek yerine bırak, loadRecords zaten [] döner.
                return;
            }

            const pruned = pruneRecords(records);

            // Sadece gerçekten küçüldüyse yaz; değişiklik yoksa disk I/O'sundan kaçın.
            if (pruned.length < records.length) {
                await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(pruned));
            }
        },
    },

    // ── Gelecek migration örneği ─────────────────────────────────────────
    // {
    //     version: 3,
    //     description: 'Add habitColor field with default value',
    //     run: async () => {
    //         const raw = await AsyncStorage.getItem(HABITS_KEY);
    //         if (!raw) return;
    //         const habits = JSON.parse(raw).map((h: Habit) => ({
    //             ...h,
    //             color: h.color ?? '#8B5CF6',
    //         }));
    //         await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    //     },
    // },
];

// ─── Runner ───────────────────────────────────────────────────────────────

/**
 * Uygulama açılışında çağrılır (AppContext ilk useEffect içinde).
 * Veri yüklenmesinden ÖNCE çalışmalıdır.
 *
 * @returns Herhangi bir migration çalıştıysa true.
 */
export async function runMigrations(): Promise<boolean> {
    const raw = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);
    const diskVersion = raw ? parseInt(raw, 10) : 0;

    if (diskVersion >= CURRENT_SCHEMA_VERSION) return false;

    const pending = MIGRATIONS.filter(m => m.version > diskVersion);
    if (pending.length === 0) return false;

    for (const step of pending) {
        try {
            await step.run();
        } catch (error) {
            // Migration başarısız — sürüm diske yazılmaz; bir sonraki açılışta yeniden dener.
            // Kritik hataları yukarı taşımak için fırlat.
            console.error(
                `[Migration] v${step.version} "${step.description}" başarısız:`,
                error,
            );
            throw error;
        }
    }

    // Tüm adımlar başarıyla tamamlandı — sürümü güncelle.
    await AsyncStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
    return true;
}
