export type HabitCategory =
  | 'health'
  | 'fitness'
  | 'study'
  | 'mindfulness'
  | 'social'
  | 'custom';

export type TargetUnit = 'times' | 'min';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: HabitCategory;
  targetCount: number;
  targetUnit: TargetUnit;
  xpReward: number;
  isActive: boolean;
  streak: number;
  /**
   * Alışkanlığın en son "done" olarak işaretlendiği gün (YYYY-MM-DD).
   * Streak hesabı bu alana dayanır — undefined ise henüz hiç yapılmamış demektir.
   */
  lastDoneDate?: string;
  createdAt: string; // ISO string
}

export type SwipeStatus = 'done' | 'missed';

export interface DailyRecord {
  id: string;
  habitId: string;
  date: string;       // YYYY-MM-DD — yerel saat, UTC DEĞİL
  status: SwipeStatus;
  xpEarned: number;
  createdAt: string;
}

export interface UserProgress {
  totalXp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalDone: number;
}
