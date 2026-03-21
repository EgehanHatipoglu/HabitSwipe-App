/**
 * @deprecated Bu dosya yalnızca geriye dönük uyumluluk için tutulmaktadır.
 *
 * Yeni kod `src/utils/xpUtils` dosyasından doğrudan import etmelidir:
 *   import { calcLevel, calcLevelProgress } from '../utils/xpUtils';
 *
 * `ProgressScreen` ve diğer dokunulmayan dosyalar bu barrel üzerinden
 * çalışmaya devam eder; refactor gerektiğinde import path'leri güncellenebilir.
 */

export {
    BASE_XP,
    xpToReachLevel,
    xpForLevel,
    calcLevel,
    calcLevelProgress,
    xpInCurrentLevel,
} from '../utils/xpUtils';

/**
 * @deprecated `BASE_XP` kullanın.
 * `ProgressScreen` içindeki `XP_PER_LEVEL` referansı için alias.
 * Düz 100 değeri artık formüldeki temel birim olarak `BASE_XP` adını taşıyor.
 */
export { BASE_XP as XP_PER_LEVEL } from '../utils/xpUtils';
