import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import type { Habit, DailyRecord, UserProgress } from '../types/habit.types';
import { loadHabits, saveHabits } from '../storage/habitsStorage';
import { loadRecords, saveRecords, pruneOldRecords } from '../storage/recordsStorage';
import { loadProgress, saveProgress, loadIsOnboarded, setOnboarded } from '../storage/userStorage';

// ─── Yardımcı ──────────────────────────────────────────────────────────────

async function safeSave(
    saveFn: () => Promise<void>,
    rollback: () => void,
    label: string,
): Promise<void> {
    try {
        await saveFn();
    } catch (e) {
        rollback();
        Alert.alert(
            'Kayıt hatası',
            `${label} kaydedilemedi. Depolama alanı dolu olabilir ya da bir hata oluştu.`,
            [{ text: 'Tamam' }],
        );
    }
}

// ─── Context tipi ──────────────────────────────────────────────────────────

interface AppContextType {
    isLoading: boolean;
    isOnboarded: boolean;
    completeOnboarding: () => Promise<void>;
    habits: Habit[];
    setHabits: (h: Habit[]) => Promise<void>;
    records: DailyRecord[];
    /**
     * Kayıtları günceller, 30 günden eskilerini otomatik temizler,
     * ardından AsyncStorage'a yazar. Hata olursa rollback yapar.
     */
    setRecords: (r: DailyRecord[]) => Promise<void>;
    userProgress: UserProgress;
    setUserProgress: (p: UserProgress) => Promise<void>;
    pendingLevelUp: number | null;
    setPendingLevelUp: (level: number | null) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

// ─── Provider ──────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [habits, setHabitsState] = useState<Habit[]>([]);
    const [records, setRecordsState] = useState<DailyRecord[]>([]);
    const [userProgress, setUserProgressState] = useState<UserProgress>({
        totalXp: 0,
        level: 1,
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: '',
        totalDone: 0,
    });
    const [pendingLevelUp, setPendingLevelUp] = useState<number | null>(null);

    // ── İlk yükleme ────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            const [onboarded, savedHabits, savedRecords, savedProgress] =
                await Promise.all([
                    loadIsOnboarded(),
                    loadHabits(),
                    loadRecords(),   // loadRecords içi zaten pruneOldRecords çağırıyor
                    loadProgress(),
                ]);
            setIsOnboarded(onboarded);
            setHabitsState(savedHabits);
            setRecordsState(savedRecords);
            setUserProgressState(savedProgress);
            setIsLoading(false);
        })();
    }, []);

    // ── Setter'lar ─────────────────────────────────────────────────────────

    const setHabits = useCallback(async (h: Habit[]): Promise<void> => {
        setHabitsState(h);
        await safeSave(
            () => saveHabits(h),
            () => setHabitsState(prev => prev),
            'Alışkanlıklar',
        );
    }, []);

    const setRecords = useCallback(async (r: DailyRecord[]): Promise<void> => {
        // Her yazma işleminde 30 günden eski kayıtları temizle.
        // Dizi böylece hiçbir zaman RECORDS_MAX_DAYS × aktif_alışkanlık_sayısı
        // kaydın ötesine geçmez.
        const pruned = pruneOldRecords(r);
        setRecordsState(pruned);
        await safeSave(
            () => saveRecords(pruned),
            () => setRecordsState(prev => prev),
            'Günlük kayıtlar',
        );
    }, []);

    const setUserProgress = useCallback(async (p: UserProgress): Promise<void> => {
        setUserProgressState(p);
        await safeSave(
            () => saveProgress(p),
            () => setUserProgressState(prev => prev),
            'İlerleme bilgileri',
        );
    }, []);

    const completeOnboarding = useCallback(async (): Promise<void> => {
        await setOnboarded();
        setIsOnboarded(true);
    }, []);

    // ── Render ─────────────────────────────────────────────────────────────

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
                pendingLevelUp,
                setPendingLevelUp,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}
