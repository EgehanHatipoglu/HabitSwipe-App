import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from '../types/habit.types';

const KEY = 'habits';

export async function loadHabits(): Promise<Habit[]> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(habits));
}

export async function addHabit(habit: Habit): Promise<void> {
    const existing = await loadHabits();
    await saveHabits([...existing, habit]);
}

export async function updateHabit(updated: Habit): Promise<void> {
    const existing = await loadHabits();
    await saveHabits(existing.map(h => (h.id === updated.id ? updated : h)));
}

// NOT: deleteHabit burada TANIMLI DEĞİL.
// Silme işlemi AppContext üzerinden setHabits([...filtered]) ile yapılır.
// setHabits içi zaten saveHabits'i çağırdığı için ayrı bir deleteHabit
// fonksiyonu çifte yazma ve yarış koşuluna yol açar.
