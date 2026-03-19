export type RootStackParamList = {
    Onboarding: undefined;
    Main: undefined;
    HabitForm: { habitId?: string }; // undefined = yeni, string = düzenle
    LevelUp: { newLevel: number };
};

export type TabParamList = {
    Today: undefined;
    Progress: undefined;
    Habits: undefined;
    Settings: undefined;
};
