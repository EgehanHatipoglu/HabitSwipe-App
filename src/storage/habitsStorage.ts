import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from '../types/habit.types';
import { HABITS_KEY } from './keys';

/**
 * Tüm alışkanlıkları diskten yükler. Hata durumunda boş dizi döner.
 */
export async function loadHabits(): Promise<Habit[]> {
    try {
        const raw = await AsyncStorage.getItem(HABITS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Alışkanlık listesinin tamamını diske yazar.
 *
 * ## Neden sadece bu iki fonksiyon?
 *
 * Ekleme, güncelleme ve silme işlemleri `AppContext.setHabits(nextArray)`
 * üzerinden yapılır; `setHabits` zaten bu fonksiyonu çağırır.
 * Ayrı `addHabit` / `updateHabit` / `deleteHabit` fonksiyonları eklemek:
 *
 *   - Gereksiz disk okuma + yazma döngüsü yaratır (her biri önce loadHabits()
 *     çağırır, sonra saveHabits() çağırır — context state ile senkronizasyon
 *     zor).
 *   - `commitSwipe`'ın atomik multiSet yazımıyla çelişir.
 *   - Hangi kod yolunun "gerçek" yol olduğunu belirsizleştirir.
 *
 * Yazma operasyonlarını tek bir noktada (AppContext) tutmak bu sorunları önler.
 */
export async function saveHabits(habits: Habit[]): Promise<void> {
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}
