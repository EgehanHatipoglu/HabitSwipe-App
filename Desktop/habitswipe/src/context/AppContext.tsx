import { createContext, useState, useEffect, ReactNode } from 'react';
import type { Habit, DailyRecord, UserProgress } from '../types/habit.types';
import { loadHabits, saveHabits } from '../storage/habitsStorage';
import { loadRecords, saveRecords } from '../storage/recordsStorage';
import { loadProgress, saveProgress, loadIsOnboarded, setOnboarded } from '../storage/userStorage';

interface AppContextType {
    isLoading: boolean;
    isOnboarded: boolean;
    completeOnboarding: () => Promise<void>;
    habits: Habit[];
    setHabits: (h: Habit[]) => void;
    records: DailyRecord[];
    setRecords: (r: DailyRecord[]) => void;
    userProgress: UserProgress;
    setUserProgress: (p: UserProgress) => void;
    pendingLevelUp: number | null;
    setPendingLevelUp: (level: number | null) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [habits, setHabitsState] = useState<Habit[]>([]);
    const [records, setRecordsState] = useState<DailyRecord[]>([]);
    const [userProgress, setUserProgressState] = useState<UserProgress>({
        totalXp: 0, level: 1, currentStreak: 0,
        bestStreak: 0, lastActiveDate: '', totalDone: 0,
    });
    const [pendingLevelUp, setPendingLevelUp] = useState<number | null>(null);

    // Uygulama açılışında AsyncStorage'dan yükle
    useEffect(() => {
        (async () => {
            const [onboarded, savedHabits, savedRecords, savedProgress] = await Promise.all([
                loadIsOnboarded(),
                loadHabits(),
                loadRecords(),
                loadProgress(),
            ]);
            setIsOnboarded(onboarded);
            setHabitsState(savedHabits);
            setRecordsState(savedRecords);
            setUserProgressState(savedProgress);
            setIsLoading(false);
        })();
    }, []);

    // Setter'lar: state + AsyncStorage'ı birlikte günceller
    const setHabits = (h: Habit[]) => {
        setHabitsState(h);
        saveHabits(h);
    };

    const setRecords = (r: DailyRecord[]) => {
        setRecordsState(r);
        saveRecords(r);
    };

    const setUserProgress = (p: UserProgress) => {
        setUserProgressState(p);
        saveProgress(p);
    };

    const completeOnboarding = async () => {
        await setOnboarded();
        setIsOnboarded(true);
    };

    return (
        <AppContext.Provider value={{
            isLoading,
            isOnboarded, completeOnboarding,
            habits, setHabits,
            records, setRecords,
            userProgress, setUserProgress,
            pendingLevelUp, setPendingLevelUp,
        }}>
            {children}
        </AppContext.Provider>
    );
}
