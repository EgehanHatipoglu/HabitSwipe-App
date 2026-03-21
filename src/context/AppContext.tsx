import {
    createContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    ReactNode,
} from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit, DailyRecord, UserProgress } from '../types/habit.types';
import { loadHabits, saveHabits } from '../storage/habitsStorage';
import { loadRecords, saveRecords, pruneRecords } from '../storage/recordsStorage';
import { loadProgress, saveProgress, loadIsOnboarded, setOnboarded } from '../storage/userStorage';
import { HABITS_KEY, RECORDS_KEY, PROGRESS_KEY } from '../storage/keys';
import { runMigrations } from '../storage/migrations';

// ─── Yardımcı ──────────────────────────────────────────────────────────────

async function safeSave(
    saveFn: () => Promise<void>,
    rollback: () => void,
    label: string,
): Promise<void> {
    try {
        await saveFn();
    } catch {
        rollback();
        Alert.alert(
            'Kayıt hatası',
            `${label} kaydedilemedi. Depolama alanı dolu olabilir.`,
            [{ text: 'Tamam' }],
        );
    }
}

// ─── Tipler ────────────────────────────────────────────────────────────────

/** commitSwipe'a geçilen önceki/sonraki durum çifti. */
interface SwipeSnapshot {
    habits: Habit[];
    records: DailyRecord[];
    progress: UserProgress;
}

interface AppContextType {
    isLoading: boolean;
    isOnboarded: boolean;
    completeOnboarding: () => Promise<void>;

    habits: Habit[];
    setHabits: (h: Habit[]) => Promise<void>;

    records: DailyRecord[];
    setRecords: (r: DailyRecord[]) => Promise<void>;

    userProgress: UserProgress;
    setUserProgress: (p: UserProgress) => Promise<void>;

    /**
     * Atomik swipe commit: üç state'i tek seferde günceller ve
     * tek bir AsyncStorage.multiSet çağrısıyla diske yazar.
     *
     * Disk yazımı başarısız olursa tüm state'ler `prev` değerlerine
     * geri döner — kısmi güncelleme imkânsız.
     */
    commitSwipe: (next: SwipeSnapshot) => Promise<void>;

    pendingLevelUp: number | null;
    setPendingLevelUp: (level: number | null) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

// ─── Provider ──────────────────────────────────────────────────────────────

const DEFAULT_PROGRESS: UserProgress = {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    bestStreak: 0,
    lastActiveDate: '',
    totalDone: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading]           = useState(true);
    const [isOnboarded, setIsOnboarded]       = useState(false);
    const [habits, setHabitsState]            = useState<Habit[]>([]);
    const [records, setRecordsState]          = useState<DailyRecord[]>([]);
    const [userProgress, setProgressState]    = useState<UserProgress>(DEFAULT_PROGRESS);
    const [pendingLevelUp, setPendingLevelUp] = useState<number | null>(null);

    // ── Rollback için ref snapshots ────────────────────────────────────────
    // useCallback'in stale closure sorunundan kaçınmak için state değerleri
    // her render'da ref'e yazılır. commitSwipe, en güncel değeri her zaman
    // ref üzerinden okur.
    const habitsRef   = useRef(habits);
    const recordsRef  = useRef(records);
    const progressRef = useRef(userProgress);

    useEffect(() => { habitsRef.current   = habits;       }, [habits]);
    useEffect(() => { recordsRef.current  = records;      }, [records]);
    useEffect(() => { progressRef.current = userProgress; }, [userProgress]);

    // ── İlk yükleme ────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            // Migration runner veri yüklenmesinden ÖNCE çalışmalı.
            // Başarısız olursa (fırlatırsa) hata yakalanır; uygulama yine de
            // açılır — runner bir sonraki açılışta tekrar dener.
            try {
                await runMigrations();
            } catch (error) {
                console.error('[AppContext] Migration başarısız, devam ediliyor:', error);
            }

            const [onboarded, savedHabits, savedRecords, savedProgress] =
                await Promise.all([
                    loadIsOnboarded(),
                    loadHabits(),
                    loadRecords(),
                    loadProgress(),
                ]);
            setIsOnboarded(onboarded);
            setHabitsState(savedHabits);
            setRecordsState(savedRecords);
            setProgressState(savedProgress);
            setIsLoading(false);
        })();
    }, []);

    // ── Tekil setter'lar (HabitsScreen, SettingsScreen vb. için) ──────────

    const setHabits = useCallback(async (h: Habit[]): Promise<void> => {
        setHabitsState(h);
        await safeSave(
            () => saveHabits(h),
            () => setHabitsState(prev => prev),
            'Alışkanlıklar',
        );
    }, []);

    const setRecords = useCallback(async (r: DailyRecord[]): Promise<void> => {
        const pruned = pruneRecords(r);
        setRecordsState(pruned);
        await safeSave(
            () => saveRecords(pruned),
            () => setRecordsState(prev => prev),
            'Günlük kayıtlar',
        );
    }, []);

    const setUserProgress = useCallback(async (p: UserProgress): Promise<void> => {
        setProgressState(p);
        await safeSave(
            () => saveProgress(p),
            () => setProgressState(prev => prev),
            'İlerleme bilgileri',
        );
    }, []);

    // ── Atomik swipe commit ────────────────────────────────────────────────
    /**
     * Swipe işleminin ürettiği üç yeni state'i alır ve şunları yapar:
     *
     * 1. Optimistic UI: üç React state eş zamanlı güncellenir (React 18
     *    otomatik batch sayesinde tek render tetiklenir).
     * 2. Atomik disk yazımı: multiSet ile üçü aynı anda yazılır.
     *    Tekli setItem çağrıları yerine multiSet kullanmak hem daha hızlı
     *    hem de "2 yazıldı, 3. yazılmadı" tutarsızlığını önler.
     * 3. Rollback: disk başarısız olursa ref'ten alınan snapshot ile
     *    üç state de eski haline döner.
     */
    const commitSwipe = useCallback(async (next: SwipeSnapshot): Promise<void> => {
        // Rollback için anlık snapshot — ref her zaman en güncel değeri tutar
        const prev = {
            habits:   habitsRef.current,
            records:  recordsRef.current,
            progress: progressRef.current,
        };

        // Optimistic update (tek render batch'i)
        setHabitsState(next.habits);
        setRecordsState(next.records);
        setProgressState(next.progress);

        try {
            await AsyncStorage.multiSet([
                [HABITS_KEY,   JSON.stringify(next.habits)],
                [RECORDS_KEY,  JSON.stringify(next.records)],
                [PROGRESS_KEY, JSON.stringify(next.progress)],
            ]);
        } catch (error) {
            // Tam rollback — kısmi yazım durumunda state/disk tutarsızlığı yok
            setHabitsState(prev.habits);
            setRecordsState(prev.records);
            setProgressState(prev.progress);

            Alert.alert(
                'Kayıt hatası',
                'Swipe işlemi kaydedilemedi. Lütfen tekrar dene.',
                [{ text: 'Tamam' }],
            );
            throw error; // hook'un başarısızlığı yakalamasına izin ver
        }
    }, []); // setState fonksiyonları kararlı; deps boş kalabilir

    const completeOnboarding = useCallback(async (): Promise<void> => {
        await setOnboarded();
        setIsOnboarded(true);
    }, []);

    return (
        <AppContext.Provider
            value={{
                isLoading,
                isOnboarded,
                completeOnboarding,
                habits,
                setHabits,
                records,
                setRecords,
                userProgress,
                setUserProgress,
                commitSwipe,
                pendingLevelUp,
                setPendingLevelUp,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}
