export type RootStackParamList = {
    Onboarding: undefined;
    Main: undefined;
    HabitForm: { habitId?: string };
    LevelUp: { newLevel: number };
    TimedAlert: { habitId: string };
};

export type TabParamList = {
    Today: undefined;
    Dashboard: undefined;
    Habits: undefined;
    Settings: undefined;
};
