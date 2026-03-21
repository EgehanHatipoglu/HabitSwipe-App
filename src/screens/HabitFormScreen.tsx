import { useState, useContext, useLayoutEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants/categories';
import type { Habit, HabitCategory, TargetUnit } from '../types/habit.types';
import type { RootStackParamList } from '../types/navigation.types';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitForm'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function generateId() {
    return `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const XP_OPTIONS = [5, 10, 15, 20, 25, 30];

export default function HabitFormScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<Props['route']>();
    const { habits, setHabits } = useContext(AppContext);

    const editId = route.params?.habitId;
    const existing = editId ? habits.find(h => h.id === editId) : undefined;

    const [title, setTitle] = useState(existing?.title ?? '');
    const [description, setDesc] = useState(existing?.description ?? '');
    const [category, setCategory] = useState<HabitCategory>(existing?.category ?? 'health');
    const [targetCount, setTarget] = useState(String(existing?.targetCount ?? '1'));
    const [targetUnit, setUnit] = useState<TargetUnit>(existing?.targetUnit ?? 'times');
    const [xpReward, setXp] = useState(existing?.xpReward ?? 10);

    useLayoutEffect(() => {
        navigation.setOptions({ title: editId ? 'Düzenle' : 'Yeni alışkanlık' });
    }, [editId]);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Hata', 'Alışkanlık adı boş olamaz.');
            return;
        }
        const count = parseInt(targetCount, 10);
        if (isNaN(count) || count < 1) {
            Alert.alert('Hata', 'Hedef sayısı geçerli bir sayı olmalı.');
            return;
        }

        if (editId && existing) {
            const updated: Habit = {
                ...existing,
                title: title.trim(),
                description: description.trim() || undefined,
                category, targetCount: count, targetUnit, xpReward,
            };
            await setHabits(habits.map(h => h.id === editId ? updated : h));
        } else {
            const newHabit: Habit = {
                id: generateId(),
                title: title.trim(),
                description: description.trim() || undefined,
                category, targetCount: count, targetUnit, xpReward,
                isActive: true,
                streak: 0,
                createdAt: new Date().toISOString(),
            };
            await setHabits([...habits, newHabit]);
        }
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Field label="Alışkanlık adı">
                    <TextInput
                        style={styles.input}
                        placeholder="ör. 10 dk meditasyon"
                        placeholderTextColor="#9CA3AF"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={60}
                        autoFocus
                    />
                </Field>

                <Field label="Açıklama (isteğe bağlı)">
                    <TextInput
                        style={[styles.input, styles.inputMulti]}
                        placeholder="ör. Sabah kalktıktan hemen sonra"
                        placeholderTextColor="#9CA3AF"
                        value={description}
                        onChangeText={setDesc}
                        maxLength={120}
                        multiline
                        numberOfLines={2}
                    />
                </Field>

                <Field label="Kategori">
                    <View style={styles.chipGrid}>
                        {(Object.keys(CATEGORIES) as HabitCategory[]).map(key => {
                            const cat = CATEGORIES[key];
                            const active = category === key;
                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.catChip,
                                        active && { backgroundColor: cat.color + '18', borderColor: cat.color },
                                    ]}
                                    onPress={() => setCategory(key)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name={cat.icon as any} size={16} color={active ? cat.color : '#9CA3AF'} />
                                    <Text style={[styles.catChipText, active && { color: cat.color }]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Field>

                <Field label="Günlük hedef">
                    <View style={styles.targetRow}>
                        <TextInput
                            style={[styles.input, styles.targetInput]}
                            placeholder="1"
                            placeholderTextColor="#9CA3AF"
                            value={targetCount}
                            onChangeText={setTarget}
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                        <TouchableOpacity
                            style={[styles.unitBtn, targetUnit === 'times' && styles.unitBtnActive]}
                            onPress={() => setUnit('times')}
                        >
                            <Text style={[styles.unitText, targetUnit === 'times' && styles.unitTextActive]}>kez</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.unitBtn, targetUnit === 'min' && styles.unitBtnActive]}
                            onPress={() => setUnit('min')}
                        >
                            <Text style={[styles.unitText, targetUnit === 'min' && styles.unitTextActive]}>dakika</Text>
                        </TouchableOpacity>
                    </View>
                </Field>

                <Field label="XP ödülü">
                    <View style={styles.xpRow}>
                        {XP_OPTIONS.map(val => (
                            <TouchableOpacity
                                key={val}
                                style={[styles.xpChip, xpReward === val && styles.xpChipActive]}
                                onPress={() => setXp(val)}
                            >
                                <Text style={[styles.xpChipText, xpReward === val && styles.xpChipTextActive]}>
                                    +{val}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Field>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                    <Text style={styles.saveBtnText}>
                        {editId ? 'Değişiklikleri kaydet' : 'Alışkanlık ekle'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
}

const ACCENT = '#8B5CF6';

const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: '#FAFAFA' },
    content: { padding: 20, gap: 20, paddingBottom: 48 },
    field: { gap: 8 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', letterSpacing: 0.2 },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12, borderWidth: 0.5, borderColor: '#E5E7EB',
        paddingHorizontal: 14, paddingVertical: 13,
        fontSize: 15, color: '#111827',
    },
    inputMulti: { minHeight: 72, textAlignVertical: 'top' },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 20, borderWidth: 0.5, borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    catChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    targetRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    targetInput: { width: 72, textAlign: 'center' },
    unitBtn: {
        paddingHorizontal: 16, paddingVertical: 13,
        borderRadius: 12, borderWidth: 0.5, borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    unitBtnActive: { backgroundColor: ACCENT + '12', borderColor: ACCENT },
    unitText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    unitTextActive: { color: ACCENT, fontWeight: '600' },
    xpRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    xpChip: {
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 20, borderWidth: 0.5, borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    xpChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
    xpChipText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
    xpChipTextActive: { color: '#fff' },
    saveBtn: {
        backgroundColor: ACCENT, borderRadius: 16,
        paddingVertical: 16, alignItems: 'center',
        marginTop: 8,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
