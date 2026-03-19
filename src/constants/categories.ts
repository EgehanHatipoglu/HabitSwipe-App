import type { HabitCategory } from '../types/habit.types';

interface CategoryConfig {
    label: string;
    color: string;
    bg: string;
    icon: string;
}

export const CATEGORIES: Record<HabitCategory, CategoryConfig> = {
    health: {
        label: 'Sağlık',
        color: '#22C55E',
        bg: '#F0FDF4',
        icon: 'heart-outline',
    },
    fitness: {
        label: 'Spor',
        color: '#3B82F6',
        bg: '#EFF6FF',
        icon: 'barbell-outline',
    },
    study: {
        label: 'Öğrenme',
        color: '#8B5CF6',
        bg: '#F5F3FF',
        icon: 'book-outline',
    },
    mindfulness: {
        label: 'Farkındalık',
        color: '#F59E0B',
        bg: '#FFFBEB',
        icon: 'leaf-outline',
    },
    social: {
        label: 'Sosyal',
        color: '#EC4899',
        bg: '#FDF2F8',
        icon: 'people-outline',
    },
    custom: {
        label: 'Özel',
        color: '#6B7280',
        bg: '#F9FAFB',
        icon: 'star-outline',
    },
};
