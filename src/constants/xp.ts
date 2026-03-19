/** Her seviye için gereken XP miktarı */
export const XP_PER_LEVEL = 100;

/**
 * Toplam XP'den mevcut seviyeyi hesaplar.
 * Level 1'den başlar.
 */
export function calcLevel(totalXp: number): number {
    return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

/**
 * Mevcut seviyede ilerleme oranını döner (0‒1 arası).
 * Örneğin 150 XP → seviye 2, %50 ilerleme → 0.5
 */
export function calcLevelProgress(totalXp: number): number {
    return (totalXp % XP_PER_LEVEL) / XP_PER_LEVEL;
}
