import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProgress } from '../types/habit.types';

const PROGRESS_KEY = 'user_progress';
const ONBOARDED_KEY = 'onboarded';

const DEFAULT_PROGRESS: UserProgress = {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    bestStreak: 0,
    lastActiveDate: '',
    totalDone: 0,
};

export async function loadProgress(): Promise<UserProgress> {
    try {
        const raw = await AsyncStorage.getItem(PROGRESS_KEY);
        return raw ? { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } : DEFAULT_PROGRESS;
    } catch {
        return DEFAULT_PROGRESS;
    }
}

export async function saveProgress(progress: UserProgress): Promise<void> {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export async function loadIsOnboarded(): Promise<boolean> {
    try {
        const val = await AsyncStorage.getItem(ONBOARDED_KEY);
        return val === 'true';
    } catch {
        return false;
    }
}

export async function setOnboarded(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}

export async function clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([PROGRESS_KEY, ONBOARDED_KEY, 'habits', 'daily_records']);
}
