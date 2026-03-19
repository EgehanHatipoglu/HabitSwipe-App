import { useContext, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { clearAllData } from '../storage/userStorage';
import { calcLevel } from '../constants/xp';

const ACCENT = '#8B5CF6';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function SettingsScreen() {
    const { userProgress, setUserProgress, setHabits, habits } =
        useContext(AppContext);

    const [notifEnabled, setNotifEnabled] = useState(false);
    const [notifHour, setNotifHour] = useState(20);
    const [darkMode, setDarkMode] = useState(false); // faz 2

    const level = calcLevel(userProgress.totalXp);
    const totalHabits = habits.filter(h => h.isActive).length;

    const handleReset = () => {
        Alert.alert(
            'Tüm veriyi sıfırla',
            'XP, streak, alışkanlıklar ve tüm kayıtlar silinecek. Bu işlem geri alınamaz.',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sıfırla',
                    style: 'destructive',
                    onPress: async () => {
                        await clearAllData();
                        setHabits([]);
                        setUserProgress({
                            totalXp: 0, level: 1, currentStreak: 0,
                            bestStreak: 0, lastActiveDate: '', totalDone: 0,
                        });
                    },
                },
            ],
        );
    };

    const cycleHour = () => {
        // 06 → 08 → 10 → 12 → 18 → 20 → 22 → 06
        const options = [6, 8, 10, 12, 18, 20, 22];
        const idx = options.indexOf(notifHour);
        setNotifHour(options[(idx + 1) % options.length]);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                <Text style={styles.pageTitle}>Ayarlar</Text>

                {/* Profil kartı */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarEmoji}>
                            {level < 6 ? '🌱' : level < 15 ? '🔥' : level < 25 ? '💎' : '👑'}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileLevel}>Seviye {level}</Text>
                        <Text style={styles.profileSub}>
                            {userProgress.totalXp} XP · {userProgress.bestStreak} en uzun seri
                        </Text>
                    </View>
                </View>

                {/* Bildirimler */}
                <Section title="Bildirimler">
                    <SettingRow
                        icon="notifications-outline"
                        iconColor="#3B82F6"
                        label="Günlük hatırlatma"
                        right={
                            <Switch
                                value={notifEnabled}
                                onValueChange={setNotifEnabled}
                                trackColor={{ false: '#E5E7EB', true: ACCENT + '66' }}
                                thumbColor={notifEnabled ? ACCENT : '#fff'}
                            />
                        }
                    />
                    {notifEnabled && (
                        <SettingRow
                            icon="time-outline"
                            iconColor="#6B7280"
                            label="Hatırlatma saati"
                            right={
                                <TouchableOpacity onPress={cycleHour} style={styles.timeChip}>
                                    <Text style={styles.timeChipText}>
                                        {String(notifHour).padStart(2, '0')}:00
                                    </Text>
                                    <Ionicons name="chevron-forward" size={14} color={ACCENT} />
                                </TouchableOpacity>
                            }
                        />
                    )}
                </Section>

                {/* Görünüm */}
                <Section title="Görünüm">
                    <SettingRow
                        icon="moon-outline"
                        iconColor="#6366F1"
                        label="Koyu tema"
                        note="Yakında"
                        right={
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: '#E5E7EB', true: ACCENT + '66' }}
                                thumbColor={darkMode ? ACCENT : '#fff'}
                                disabled
                            />
                        }
                    />
                </Section>

                {/* Uygulama bilgisi */}
                <Section title="Uygulama">
                    <SettingRow
                        icon="stats-chart-outline"
                        iconColor="#10B981"
                        label="Aktif alışkanlık"
                        right={<Text style={styles.infoVal}>{totalHabits}</Text>}
                    />
                    <SettingRow
                        icon="checkmark-done-outline"
                        iconColor="#F59E0B"
                        label="Toplam yapılan"
                        right={<Text style={styles.infoVal}>{userProgress.totalDone}</Text>}
                    />
                    <SettingRow
                        icon="flash-outline"
                        iconColor={ACCENT}
                        label="Toplam XP"
                        right={<Text style={styles.infoVal}>{userProgress.totalXp}</Text>}
                    />
                </Section>

                {/* Faz 2 — bulut */}
                <Section title="Hesap (Yakında)">
                    <SettingRow
                        icon="cloud-upload-outline"
                        iconColor="#9CA3AF"
                        label="Supabase ile senkronize et"
                        note="Faz 2"
                        right={<Ionicons name="lock-closed-outline" size={16} color="#D1D5DB" />}
                        disabled
                    />
                    <SettingRow
                        icon="people-outline"
                        iconColor="#9CA3AF"
                        label="Arkadaş ekle & leaderboard"
                        note="Faz 2"
                        right={<Ionicons name="lock-closed-outline" size={16} color="#D1D5DB" />}
                        disabled
                    />
                </Section>

                {/* Tehlike bölgesi */}
                <Section title="Tehlike bölgesi">
                    <TouchableOpacity style={styles.dangerRow} onPress={handleReset} activeOpacity={0.7}>
                        <View style={[styles.rowIcon, { backgroundColor: '#FEF2F2' }]}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </View>
                        <Text style={styles.dangerLabel}>Tüm veriyi sıfırla</Text>
                        <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </Section>

                <Text style={styles.version}>HabitSwipe v0.1.0 — MVP</Text>

            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Alt bileşenler ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionCard}>{children}</View>
        </View>
    );
}

function SettingRow({
    icon, iconColor, label, note, right, disabled,
}: {
    icon: IoniconsName;
    iconColor: string;
    label: string;
    note?: string;
    right?: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <View style={[styles.settingRow, disabled && { opacity: 0.45 }]}>
            <View style={[styles.rowIcon, { backgroundColor: iconColor + '18' }]}>
                <Ionicons name={icon} size={18} color={iconColor} />
            </View>
            <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{label}</Text>
                {note && <Text style={styles.rowNote}>{note}</Text>}
            </View>
            {right}
        </View>
    );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAFA' },
    scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48, gap: 8 },

    pageTitle: {
        fontSize: 28, fontWeight: '800', color: '#111827',
        letterSpacing: -0.5, marginBottom: 8,
    },

    profileCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#fff', borderRadius: 20,
        borderWidth: 0.5, borderColor: '#E5E7EB',
        padding: 18, marginBottom: 8,
    },
    avatar: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#F5F3FF',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarEmoji: { fontSize: 26 },
    profileInfo: { gap: 3 },
    profileLevel: { fontSize: 17, fontWeight: '700', color: '#111827' },
    profileSub: { fontSize: 13, color: '#6B7280' },

    section: { gap: 6 },
    sectionTitle: {
        fontSize: 11, fontWeight: '600', color: '#9CA3AF',
        letterSpacing: 1, textTransform: 'uppercase',
        paddingLeft: 4,
    },
    sectionCard: {
        backgroundColor: '#fff', borderRadius: 16,
        borderWidth: 0.5, borderColor: '#E5E7EB',
        overflow: 'hidden',
    },

    settingRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 14, paddingVertical: 13,
        borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
    },
    rowIcon: {
        width: 34, height: 34, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    rowBody: { flex: 1 },
    rowLabel: { fontSize: 15, color: '#111827', fontWeight: '500' },
    rowNote: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },

    infoVal: { fontSize: 15, fontWeight: '600', color: '#374151' },

    timeChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: ACCENT + '12', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 5,
    },
    timeChipText: { fontSize: 14, fontWeight: '700', color: ACCENT },

    dangerRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 14, paddingVertical: 13,
    },
    dangerLabel: { flex: 1, fontSize: 15, color: '#EF4444', fontWeight: '500' },

    version: {
        textAlign: 'center', fontSize: 12,
        color: '#D1D5DB', marginTop: 12,
    },
});
