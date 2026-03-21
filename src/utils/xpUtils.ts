/**
 * XP ve seviye hesaplama yardımcıları.
 *
 * ## Tasarım kararı: neden progressive formula?
 *
 * Düz `XP_PER_LEVEL = 100` yaklaşımı seviye 1→2 ile seviye 50→51'i eşit
 * zorluğa sahip kılar. Progressive bir formül oyun döngüsünü daha tatmin
 * edici yapar: ilk seviyeler hızlı geçer (motivasyon), üst seviyeler
 * uzun sürer (uzun vadeli hedef).
 *
 * ## Formül: Üçgen sayı tabanlı ölçekleme
 *
 * Seviye n'den n+1'e geçmek için gereken XP:
 *   `xpForLevel(n) = BASE_XP * n`
 *
 * Seviye n'ye ulaşmak için gereken toplam XP (seviye 1'den başlayarak):
 *   `xpToReachLevel(n) = BASE_XP * (n-1) * n / 2`
 *
 * Örnekler (BASE_XP = 100):
 *   Seviye 1 → 2 :  100 XP gerekli  (toplam:  100)
 *   Seviye 2 → 3 :  200 XP gerekli  (toplam:  300)
 *   Seviye 3 → 4 :  300 XP gerekli  (toplam:  600)
 *   Seviye 5 → 6 :  500 XP gerekli  (toplam: 1500)
 *   Seviye 10 → 11: 1000 XP gerekli (toplam: 5500)
 *
 * Seviye, total XP'den kapalı form çözümüyle hesaplanır:
 *   `level = floor((1 + sqrt(1 + 8 * totalXp / BASE_XP)) / 2)`
 * Bu sayede döngüye gerek kalmaz; O(1) karmaşıklık.
 */

/** Temel XP birimi. Formüldeki tüm çarpanlar bu değere bağlıdır. */
export const BASE_XP = 100;

/**
 * Seviye `level`'a sıfırdan ulaşmak için gereken toplam XP.
 * Seviye 1 için 0 döner (başlangıç seviyesi, XP gerektirmez).
 *
 * @example xpToReachLevel(1) === 0
 * @example xpToReachLevel(2) === 100
 * @example xpToReachLevel(3) === 300
 */
export function xpToReachLevel(level: number): number {
    return BASE_XP * (level - 1) * level / 2;
}

/**
 * Seviye `level` içinde tamamlanması gereken toplam XP miktarı.
 * (Bir sonraki seviyeye geçmek için o level içinde ne kadar XP kazanmak gerekir.)
 *
 * @example xpForLevel(1) === 100  (0   → 100 XP arası)
 * @example xpForLevel(2) === 200  (100 → 300 XP arası)
 * @example xpForLevel(5) === 500  (1000→ 1500 XP arası)
 */
export function xpForLevel(level: number): number {
    return BASE_XP * level;
}

/**
 * Toplam XP'den mevcut seviyeyi hesaplar.
 * Kapalı form: döngü olmadan O(1).
 *
 * @example calcLevel(0)   === 1
 * @example calcLevel(99)  === 1
 * @example calcLevel(100) === 2
 * @example calcLevel(300) === 3
 */
export function calcLevel(totalXp: number): number {
    if (totalXp <= 0) return 1;
    return Math.floor((1 + Math.sqrt(1 + 8 * totalXp / BASE_XP)) / 2);
}

/**
 * Mevcut seviyedeki ilerlemeyi 0–1 arasında döner.
 *
 * @example calcLevelProgress(0)   === 0      (seviye 1, %0)
 * @example calcLevelProgress(50)  === 0.5    (seviye 1, %50)
 * @example calcLevelProgress(100) === 0      (seviye 2, yeni başladı)
 * @example calcLevelProgress(200) === 0.5    (seviye 2, %50)
 */
export function calcLevelProgress(totalXp: number): number {
    const level  = calcLevel(totalXp);
    const earned = totalXp - xpToReachLevel(level);   // bu level içinde kazanılan
    const needed = xpForLevel(level);                  // bu level için gereken toplam
    return earned / needed;
}

/**
 * Mevcut seviyede kazanılan XP miktarı.
 * ProgressScreen'deki "X / Y XP" gösterimi için kullanılır.
 *
 * @example xpInCurrentLevel(150) === 50   (seviye 2, 100'den 50 ilerledi)
 */
export function xpInCurrentLevel(totalXp: number): number {
    return totalXp - xpToReachLevel(calcLevel(totalXp));
}
