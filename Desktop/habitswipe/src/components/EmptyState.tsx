import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    completedCount: number;
    totalCount: number;
}

export default function EmptyState({ completedCount, totalCount }: Props) {
    const allDone = completedCount === totalCount && totalCount > 0;

    return (
        <View style={styles.container}>
            <Ionicons
                name={allDone ? 'trophy' : 'calendar-outline'}
                size={72}
                color={allDone ? '#F59E0B' : '#D1D5DB'}
            />
            <Text style={styles.title}>
                {allDone ? 'Günü tamamladın!' : 'Bugün alışkanlık yok'}
            </Text>
            <Text style={styles.subtitle}>
                {allDone
                    ? `${completedCount} alışkanlıktan ${completedCount} tanesini yaptın 🎉`
                    : 'Alışkanlıklar sekmesinden yeni ekleyebilirsin.'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginTop: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
});
