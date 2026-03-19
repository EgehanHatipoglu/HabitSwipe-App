import { useState, useContext, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Dimensions, ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants/categories';
import type { Habit, HabitCategory } from '../types/habit.types';

const { width: W } = Dimensions.get('window');
const ACCENT = '#8B5CF6';

// Hazır başlangıç alışkanlıkları — kullanıcı bunlardan seçer
const STARTER_HABITS: Omit<Habit, 'id' | 'createdAt' | 'streak'>[] = [
    { title: '10 dk meditasyon', description: 'Sabah gözünü açınca', category: 'mindfulness', targetCount: 10, targetUnit: 'min', xpReward: 15, isActive: true },
    { title: 'Su iç', description: '8 bardak hedefi', category: 'health', targetCount: 8, targetUnit: 'times', xpReward: 10, isActive: true },
    { title: '30 dk egzersiz', description: 'Yürüyüş, koşu, spor', category: 'fitness', targetCount: 30, targetUnit: 'min', xpReward: 25, isActive: true },
    { title: 'İngilizce çalış', description: 'Uygulama veya podcast', category: 'study', targetCount: 20, targetUnit: 'min', xpReward: 20, isActive: true },
    { title: 'Kitap oku', description: 'En az 10 sayfa', category: 'study', targetCount: 10, targetUnit: 'min', xpReward: 15, isActive: true },
    { title: 'Sağlıklı beslen', description: 'Fast food yok', category: 'health', targetCount: 3, targetUnit: 'times', xpReward: 20, isActive: true },
    { title: 'Uyku düzeni', description: 'Aynı saatte yat', category: 'mindfulness', targetCount: 1, targetUnit: 'times', xpReward: 10, isActive: true },
    { title: 'Arkadaşlarla iletişim', description: 'Bir mesaj veya arama', category: 'social', targetCount: 1, targetUnit: 'times', xpReward: 10, isActive: true },
    { title: 'Günlük yaz', description: '5 dk özet', category: 'mindfulness', targetCount: 5, targetUnit: 'min', xpReward: 10, isActive: true },
    { title: 'Spor yap', description: 'Gym veya ev antrenmanı', category: 'fitness', targetCount: 1, targetUnit: 'times', xpReward: 30, isActive: true },
];

function generateId() {
    return `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Slide verileri
const SLIDES = [
    {
        icon: 'flash' as const,
        color: ACCENT,
        bg: '#F5F3FF',
        title: 'Alışkanlık\ngeliştirmenin\nen kolay yolu',
        desc: 'Her gün kartları swipe et.\nSağa → yaptım. Sola → olmadı.',
    },
    {
        icon: 'flame' as const,
        color: '#F97316',
        bg: '#FFF7ED',
        title: 'Serileri kır,\nseviyeleri atla',
        desc: "Her tamamlanan alışkanlık XP kazandırır.\nStreak'ini koru, level atla.",
    },
    {
        icon: 'trophy' as const,
        color: '#F59E0B',
        bg: '#FFFBEB',
        title: 'Küçük adımlar,\nbüyük sonuçlar',
        desc: 'Günde sadece birkaç dakika yeterli.\nKonsistanlık her şeydir.',
    },
];

export default function OnboardingScreen() {
    const { completeOnboarding, setHabits } = useContext(AppContext);
    const [step, setStep] = useState<'slides' | 'pick'>('slides');
    const [slideIdx, setSlideIdx] = useState(0);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const fadeTransition = (cb: () => void) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
            cb();
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
    };

    const nextSlide = () => {
        if (slideIdx < SLIDES.length - 1) {
            fadeTransition(() => setSlideIdx(i => i + 1));
        } else {
            fadeTransition(() => setStep('pick'));
        }
    };

    const toggleHabit = (idx: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(idx)) {
                next.delete(idx);
            } else {
                next.add(idx);
            }
            return next;
        });
    };

    const handleFinish = async () => {
        const now = new Date().toISOString();
        const chosenHabits: Habit[] = Array.from(selected).map(idx => ({
            ...STARTER_HABITS[idx],
            id: generateId(),
            streak: 0,
            createdAt: now,
        }));
        // Hiç seçmemişse bile devam et — sonra Habits'ten ekleyebilir
        setHabits(chosenHabits);
        await completeOnboarding();
    };

    const slide = SLIDES[slideIdx];

    return (
        <SafeAreaView style={styles.safe}>
            <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>

                {step === 'slides' ? (
                    <View style={styles.slideWrap}>
                        {/* İkon alanı */}
                        <View style={[styles.iconBubble, { backgroundColor: slide.bg }]}>
                            <Ionicons name={slide.icon} size={72} color={slide.color} />
                        </View>

                        {/* Metin */}
                        <View style={styles.textBlock}>
                            <Text style={styles.slideTitle}>{slide.title}</Text>
                            <Text style={styles.slideDesc}>{slide.desc}</Text>
                        </View>

                        {/* Dots */}
                        <View style={styles.dots}>
                            {SLIDES.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        i === slideIdx && { width: 20, backgroundColor: ACCENT },
                                    ]}
                                />
                            ))}
                        </View>

                        {/* İleri */}
                        <TouchableOpacity style={styles.primaryBtn} onPress={nextSlide} activeOpacity={0.85}>
                            <Text style={styles.primaryBtnText}>
                                {slideIdx < SLIDES.length - 1 ? 'Devam et' : 'Başlayalım →'}
                            </Text>
                        </TouchableOpacity>

                        {slideIdx < SLIDES.length - 1 && (
                            <TouchableOpacity onPress={() => fadeTransition(() => setStep('pick'))} style={styles.skipBtn}>
                                <Text style={styles.skipText}>Atla</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    /* HABİT SEÇİM EKRANI */
                    <View style={{ flex: 1 }}>
                        <View style={styles.pickHeader}>
                            <Text style={styles.pickTitle}>İlk alışkanlıklarını seç</Text>
                            <Text style={styles.pickSub}>
                                {selected.size === 0
                                    ? 'En az 1 tane seç, sonra istediğin kadar ekleyebilirsin'
                                    : `${selected.size} alışkanlık seçildi`}
                            </Text>
                        </View>

                        <ScrollView
                            contentContainerStyle={styles.habitGrid}
                            showsVerticalScrollIndicator={false}
                        >
                            {STARTER_HABITS.map((h, i) => {
                                const cat = CATEGORIES[h.category];
                                const active = selected.has(i);
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[
                                            styles.habitChip,
                                            active && { backgroundColor: cat.color + '14', borderColor: cat.color },
                                        ]}
                                        onPress={() => toggleHabit(i)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.habitChipIcon, { backgroundColor: cat.color + '20' }]}>
                                            <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                                        </View>
                                        <View style={styles.habitChipBody}>
                                            <Text style={[styles.habitChipTitle, active && { color: cat.color }]}>
                                                {h.title}
                                            </Text>
                                            <Text style={styles.habitChipDesc}>{h.description}</Text>
                                        </View>
                                        {active && (
                                            <Ionicons name="checkmark-circle" size={20} color={cat.color} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.pickFooter}>
                            <TouchableOpacity
                                style={[styles.primaryBtn, selected.size === 0 && styles.primaryBtnDisabled]}
                                onPress={handleFinish}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.primaryBtnText}>
                                    {selected.size === 0 ? 'Şimdilik atla' : `${selected.size} alışkanlıkla başla →`}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAFA' },

    // Slides
    slideWrap: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 32, gap: 0,
    },
    iconBubble: {
        width: 160, height: 160, borderRadius: 80,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 40,
    },
    textBlock: { alignItems: 'center', marginBottom: 36 },
    slideTitle: {
        fontSize: 34, fontWeight: '800', color: '#111827',
        textAlign: 'center', lineHeight: 42, letterSpacing: -0.5, marginBottom: 16,
    },
    slideDesc: {
        fontSize: 16, color: '#6B7280', textAlign: 'center',
        lineHeight: 24,
    },
    dots: { flexDirection: 'row', gap: 6, marginBottom: 40 },
    dot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#D1D5DB',
    },

    // Pick
    pickHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
    pickTitle: { fontSize: 26, fontWeight: '800', color: '#111827', letterSpacing: -0.5, marginBottom: 4 },
    pickSub: { fontSize: 14, color: '#6B7280' },
    habitGrid: { paddingHorizontal: 20, gap: 10, paddingBottom: 20 },
    habitChip: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#fff', borderRadius: 16,
        borderWidth: 0.5, borderColor: '#E5E7EB',
        padding: 14,
    },
    habitChipIcon: {
        width: 40, height: 40, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    habitChipBody: { flex: 1 },
    habitChipTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
    habitChipDesc: { fontSize: 12, color: '#9CA3AF' },
    pickFooter: { padding: 20, paddingBottom: 28 },

    // Shared
    primaryBtn: {
        width: '100%', backgroundColor: ACCENT,
        borderRadius: 16, paddingVertical: 16,
        alignItems: 'center',
    },
    primaryBtnDisabled: { backgroundColor: '#C4B5FD' },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    skipBtn: { marginTop: 16, padding: 8 },
    skipText: { fontSize: 14, color: '#9CA3AF' },
});
