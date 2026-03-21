/**
 * AsyncStorage anahtar sabitleri — tek kaynak.
 * Tüm storage modülleri ve clearAllData buradan import eder.
 * String literal'ı iki ayrı yerde yazmak tip güvenliği sağlamaz;
 * bu sabitler sayesinde refactor veya isimlendirme hatası imkânsız olur.
 */
export const HABITS_KEY    = 'habits'        as const;
export const RECORDS_KEY   = 'daily_records' as const;
export const PROGRESS_KEY  = 'user_progress' as const;
export const ONBOARDED_KEY = 'onboarded'     as const;

/**
 * Disk şeması versiyon anahtarı.
 * Migration runner her açılışta bu değeri okur; eksikse 0 kabul eder.
 * Migration tamamlanınca güncel CURRENT_SCHEMA_VERSION buraya yazılır.
 */
export const SCHEMA_VERSION_KEY     = 'schema_version' as const;

/**
 * Uygulamanın beklediği güncel şema versiyonu.
 * Yeni bir migration eklendiğinde bu sayıyı bir artır ve
 * migrations.ts'e karşılık gelen adımı ekle.
 */
export const CURRENT_SCHEMA_VERSION = 2;
