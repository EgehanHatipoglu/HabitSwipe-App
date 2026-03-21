import { useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { clearAllData } from '../storage/userStorage';

const ACCENT = '#8B5CF6';

export default function SettingsScreen() {
    const { setHabits, setRecords, setUserProgress } = useContext(AppContext);

    const handleClearData = () => {
        Alert.alert(
            'Tüm verileri sil',
            'Alışkanlıklar, kayıtlar ve ilerleme bilgileri silinecek. Bu işlem geri alınamaz.',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        await clearAllData();
                        // Context state'lerini sıfırla
                        await setHabits([]);
                        await setRecords([]);
                        await setUserProgress({
                            totalXp: 0,
                            level: 1,
                            currentStreak: 0,
                            bestStreak: 0,
                            lastActiveDate: '',
                            totalDone: 0,
                        });
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>Ayarlar</Text>

                {/* Uygulama bilgisi */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Uygulama</Text>
                    <SettingRow
                        icon="information-circle-outline"
                        label="Sürüm"
                        value="1.0.0"
                    />
                </View>

                {/* Veri yönetimi */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Veri</Text>
                    <TouchableOpacity
                        style={styles.dangerRow}
                        onPress={handleClearData}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        <Text style={styles.dangerText}>Tüm verileri sıfırla</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function SettingRow({
    icon,
    label,
    value,
}: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value?: string;
}) {
    return (
        <View style={styles.row}>
            <Ionicons name={icon} size={20} color="#6B7280" />
            <Text style={styles.rowLabel}>{label}</Text>
            {value && <Text style={styles.rowValue}>{value}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAFA' },
    scroll: { padding: 20, gap: 24, paddingBottom: 48 },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    section: { gap: 4 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
        paddingHorizontal: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowLabel: { flex: 1, fontSize: 15, color: '#111827' },
    rowValue: { fontSize: 14, color: '#9CA3AF' },
    dangerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#FECACA',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    dangerText: { fontSize: 15, color: '#EF4444', fontWeight: '500' },
});
