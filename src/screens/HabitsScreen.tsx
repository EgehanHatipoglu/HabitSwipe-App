import { useContext } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants/categories';
import type { Habit } from '../types/habit.types';
import type { RootStackParamList } from '../types/navigation.types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HabitsScreen() {
    const navigation = useNavigation<Nav>();
    const { habits, setHabits } = useContext(AppContext);
    const active = habits.filter(h => h.isActive);

    const handleDelete = (habit: Habit) => {
        Alert.alert(
            'Alışkanlığı sil',
            `"${habit.title}" silinecek. Emin misin?`,
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        // setHabits zaten saveHabits'i await ediyor,
                        // ayrıca deleteHabit çağırmaya gerek yok.
                        await setHabits(habits.filter(h => h.id !== habit.id));
                    },
                },
            ],
        );
    };

    const handleToggleActive = async (habit: Habit) => {
        const updated = habits.map(h =>
            h.id === habit.id ? { ...h, isActive: !h.isActive } : h,
        );
        await setHabits(updated);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Alışkanlıklar</Text>
                    <Text style={styles.subtitle}>{active.length} aktif</Text>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('HabitForm', {})}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {habits.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="list-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>Henüz alışkanlık yok</Text>
                    <Text style={styles.emptyDesc}>
                        Sağ üstteki + butonuna basarak ilk alışkanlığını ekle.
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyBtn}
                        onPress={() => navigation.navigate('HabitForm', {})}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.emptyBtnText}>İlk alışkanlığı ekle</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={habits}
                    keyExtractor={h => h.id}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    renderItem={({ item }) => (
                        <HabitRow
                            habit={item}
                            onEdit={() => navigation.navigate('HabitForm', { habitId: item.id })}
                            onDelete={() => handleDelete(item)}
                            onToggle={() => handleToggleActive(item)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

function HabitRow({
    habit, onEdit, onDelete, onToggle,
}: {
    habit: Habit;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: () => void;
}) {
    const cat = CATEGORIES[habit.category];

    return (
        <TouchableOpacity
            style={[styles.row, !habit.isActive && styles.rowInactive]}
            onPress={onEdit}
            activeOpacity={0.7}
        >
            <View style={[styles.iconWrap, { backgroundColor: cat.color + '18' }]}>
                <Ionicons name={cat.icon as any} size={22} color={habit.isActive ? cat.color : '#9CA3AF'} />
            </View>

            <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, !habit.isActive && styles.rowTitleInactive]}>
                    {habit.title}
                </Text>
                <View style={styles.rowMeta}>
                    <Text style={styles.rowMetaText}>{cat.label}</Text>
                    <Text style={styles.dot}>·</Text>
                    <Ionicons name="flash" size={11} color="#8B5CF6" />
                    <Text style={styles.rowMetaText}>+{habit.xpReward} XP</Text>
                    {habit.streak > 0 && (
                        <>
                            <Text style={styles.dot}>·</Text>
                            <Ionicons name="flame" size={11} color="#F97316" />
                            <Text style={styles.rowMetaText}>{habit.streak} gün</Text>
                        </>
                    )}
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity onPress={onToggle} hitSlop={8} style={styles.actionBtn}>
                    <Ionicons
                        name={habit.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                        size={22}
                        color={habit.isActive ? '#6B7280' : '#22C55E'}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
    addBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#8B5CF6',
        alignItems: 'center', justifyContent: 'center',
        marginTop: 4,
    },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    separator: { height: 0.5, backgroundColor: '#E5E7EB', marginLeft: 68 },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, gap: 12,
        backgroundColor: '#FAFAFA',
    },
    rowInactive: { opacity: 0.45 },
    iconWrap: {
        width: 44, height: 44, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    rowBody: { flex: 1, gap: 4 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
    rowTitleInactive: { color: '#9CA3AF' },
    rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rowMetaText: { fontSize: 12, color: '#6B7280' },
    dot: { fontSize: 12, color: '#D1D5DB' },
    actions: { flexDirection: 'row', gap: 2, alignItems: 'center' },
    actionBtn: { padding: 6 },
    emptyWrap: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 40, gap: 10,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginTop: 8 },
    emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
    emptyBtn: {
        marginTop: 8, backgroundColor: '#8B5CF6',
        paddingHorizontal: 24, paddingVertical: 12,
        borderRadius: 20,
    },
    emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
