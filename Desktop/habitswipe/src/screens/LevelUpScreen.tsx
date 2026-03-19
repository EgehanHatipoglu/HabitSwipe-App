import { useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Dimensions, Animated, Easing,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../types/navigation.types';

type Props = NativeStackScreenProps<RootStackParamList, 'LevelUp'>;

const { width: W, height: H } = Dimensions.get('window');
const ACCENT = '#8B5CF6';

// Konfeti parçacığı renkleri
const CONFETTI_COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#F97316', '#EC4899'];

// Tek bir konfeti parçacığı
function ConfettiPiece({ delay, color }: { delay: number; color: string }) {
    const startX = Math.random() * W;
    const endX = startX + (Math.random() - 0.5) * 200;
    const size = 6 + Math.random() * 8;
    const isRect = Math.random() > 0.5;

    const translateY = useRef(new Animated.Value(-20)).current;
    const translateX = useRef(new Animated.Value(startX)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const duration = 1800 + Math.random() * 1000;
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1, duration: 100, useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: H * 0.75, duration, easing: Easing.in(Easing.quad), useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: endX, duration, useNativeDriver: true,
                }),
                Animated.timing(rotate, {
                    toValue: 6, duration, useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(duration * 0.7),
                    Animated.timing(opacity, {
                        toValue: 0, duration: duration * 0.3, useNativeDriver: true,
                    }),
                ]),
            ]),
        ]).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 6],
        outputRange: ['0deg', `${360 * 3 + Math.random() * 360}deg`],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: isRect ? size : size * 1.2,
                height: isRect ? size * 0.4 : size * 1.2,
                borderRadius: isRect ? 2 : size * 0.6,
                backgroundColor: color,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate: spin }],
            }}
        />
    );
}

// Level numarasına göre unvan
function getTitle(level: number): string {
    if (level < 3) return 'Yeni başlayan';
    if (level < 6) return 'Çaylak';
    if (level < 10) return 'Azimli';
    if (level < 15) return 'Kararlı';
    if (level < 20) return 'Uzman';
    if (level < 30) return 'Usta';
    return 'Efsane';
}

function getEmoji(level: number): string {
    if (level < 3) return '🌱';
    if (level < 6) return '⚡';
    if (level < 10) return '🔥';
    if (level < 15) return '💎';
    if (level < 20) return '🏆';
    if (level < 30) return '👑';
    return '🌟';
}

// Kart için scale-in animasyonu
function useScaleIn(delay = 300) {
    const scale = useRef(new Animated.Value(0.6)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1, friction: 6, tension: 80, useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1, duration: 250, useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    return { scale, opacity };
}

export default function LevelUpScreen() {
    const navigation = useNavigation();
    const route = useRoute<Props['route']>();
    const { newLevel } = route.params;

    const { scale, opacity } = useScaleIn(200);

    // Arka plan karartma
    const bgOpacity = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(bgOpacity, {
            toValue: 1, duration: 300, useNativeDriver: true,
        }).start();
    }, []);

    // 30 konfeti parçacığı
    const confetti = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        delay: i * 60,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }));

    return (
        <View style={styles.root}>
            {/* Arka plan overlay */}
            <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]} />

            {/* Konfeti */}
            {confetti.map(c => (
                <ConfettiPiece key={c.id} delay={c.delay} color={c.color} />
            ))}

            {/* Kart */}
            <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
                <Text style={styles.emoji}>{getEmoji(newLevel)}</Text>

                <Text style={styles.levelUpLabel}>SEVİYE ATLADI!</Text>
                <Text style={styles.levelNum}>{newLevel}</Text>
                <Text style={styles.rankTitle}>{getTitle(newLevel)}</Text>

                <View style={styles.divider} />

                <Text style={styles.message}>
                    {newLevel === 2
                        ? 'İlk seviyeni geçtin.\nDevam et, bu sadece başlangıç!'
                        : `${newLevel - 1}. seviyeden ${newLevel}. seviyeye\nyükseldin. Harika iş!`}
                </Text>

                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.85}
                >
                    <Ionicons name="flash" size={18} color="#fff" />
                    <Text style={styles.btnText}>Devam et</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const CARD_W = W * 0.82;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    card: {
        width: CARD_W,
        backgroundColor: '#fff',
        borderRadius: 28,
        paddingHorizontal: 28,
        paddingTop: 36,
        paddingBottom: 28,
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 40,
        elevation: 20,
    },
    emoji: {
        fontSize: 56,
        marginBottom: 8,
    },
    levelUpLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2.5,
        color: ACCENT,
    },
    levelNum: {
        fontSize: 80,
        fontWeight: '900',
        color: '#111827',
        lineHeight: 88,
        letterSpacing: -2,
    },
    rankTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 4,
    },
    divider: {
        width: 48,
        height: 3,
        backgroundColor: ACCENT + '30',
        borderRadius: 2,
        marginVertical: 10,
    },
    message: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 8,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: ACCENT,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 36,
        marginTop: 8,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
