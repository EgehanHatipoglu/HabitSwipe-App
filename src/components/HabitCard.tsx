import { useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import type { Habit, SwipeStatus } from '../types/habit.types';
import { CATEGORIES } from '../constants/categories';

const { width: SCREEN_W } = Dimensions.get('window');

// Kaç px sürüklenince swipe tamamlanır
const SWIPE_THRESHOLD = SCREEN_W * 0.38;

interface Props {
    habit: Habit;
    onSwipe: (status: SwipeStatus) => void;
    isTop: boolean;   // sadece en üstteki kart interaktif
    index: number;    // yığın sırasına göre arka kartlar küçülür
}

export default function HabitCard({ habit, onSwipe, isTop, index }: Props) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1 - index * 0.04);
    const cardY = useSharedValue(index * 10);

    // Üstteki kart swipe edilince alt kartlar animate olsun
    useEffect(() => {
        scale.value = withSpring(1 - index * 0.04, { damping: 15 });
        cardY.value = withSpring(index * 10, { damping: 15 });
    }, [index]);

    const gesture = Gesture.Pan()
        .enabled(isTop)
        .onUpdate((e) => {
            translateX.value = e.translationX;
            translateY.value = e.translationY * 0.3; // dikey hareketi kısıtla
        })
        .onEnd((e) => {
            if (e.translationX > SWIPE_THRESHOLD) {
                // Sağa swipe → done
                translateX.value = withTiming(SCREEN_W * 1.5, { duration: 280 });
                runOnJS(onSwipe)('done');
            } else if (e.translationX < -SWIPE_THRESHOLD) {
                // Sola swipe → missed
                translateX.value = withTiming(-SCREEN_W * 1.5, { duration: 280 });
                runOnJS(onSwipe)('missed');
            } else {
                // Eşiğe ulaşmadı, geri dön
                translateX.value = withSpring(0, { damping: 15 });
                translateY.value = withSpring(0, { damping: 15 });
            }
        });

    const cardStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-SCREEN_W / 2, 0, SCREEN_W / 2],
            [-14, 0, 14],
            Extrapolation.CLAMP,
        );
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value + cardY.value },
                { rotate: `${rotate}deg` },
                { scale: scale.value },
            ],
        };
    });

    // Sağa kaydırınca yeşil "Yaptım!" overlay
    const doneOverlayStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [0, SWIPE_THRESHOLD * 0.6],
            [0, 1],
            Extrapolation.CLAMP,
        ),
    }));

    // Sola kaydırınca kırmızı "Olmadı" overlay
    const missedOverlayStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [-SWIPE_THRESHOLD * 0.6, 0],
            [1, 0],
            Extrapolation.CLAMP,
        ),
    }));

    const cat = CATEGORIES[habit.category];

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.card, { backgroundColor: cat.bg }, cardStyle]}>

                {/* DONE overlay */}
                <Animated.View style={[styles.overlay, styles.doneOverlay, doneOverlayStyle]}>
                    <Ionicons name="checkmark-circle" size={52} color="#22C55E" />
                    <Text style={[styles.overlayText, { color: '#22C55E' }]}>Yaptım!</Text>
                </Animated.View>

                {/* MISSED overlay */}
                <Animated.View style={[styles.overlay, styles.missedOverlay, missedOverlayStyle]}>
                    <Ionicons name="close-circle" size={52} color="#EF4444" />
                    <Text style={[styles.overlayText, { color: '#EF4444' }]}>Olmadı</Text>
                </Animated.View>

                {/* Kart içeriği */}
                <View style={[styles.iconCircle, { backgroundColor: cat.color + '22' }]}>
                    <Ionicons name={cat.icon as any} size={40} color={cat.color} />
                </View>

                <Text style={styles.category}>{cat.label.toUpperCase()}</Text>
                <Text style={styles.title}>{habit.title}</Text>

                {habit.description ? (
                    <Text style={styles.description}>{habit.description}</Text>
                ) : null}

                <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                        <Ionicons name="flame" size={14} color="#F97316" />
                        <Text style={styles.metaText}>{habit.streak} gün</Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Ionicons name="flash" size={14} color="#8B5CF6" />
                        <Text style={styles.metaText}>+{habit.xpReward} XP</Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>
                            {habit.targetCount} {habit.targetUnit === 'min' ? 'dk' : 'kez'}
                        </Text>
                    </View>
                </View>

                {/* Swipe hint — sadece en üst kart */}
                {isTop && (
                    <View style={styles.hintRow}>
                        <Text style={styles.hintLeft}>← Olmadı</Text>
                        <Text style={styles.hintRight}>Yaptım! →</Text>
                    </View>
                )}
            </Animated.View>
        </GestureDetector>
    );
}

const CARD_W = SCREEN_W - 40;

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        width: CARD_W,
        alignSelf: 'center',
        borderRadius: 24,
        paddingHorizontal: 28,
        paddingTop: 36,
        paddingBottom: 28,
        alignItems: 'center',
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
        // Android shadow
        elevation: 6,
    },
    overlay: {
        position: 'absolute',
        top: 28,
        alignItems: 'center',
        gap: 6,
        zIndex: 10,
    },
    doneOverlay: { right: 24 },
    missedOverlay: { left: 24 },
    overlayText: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    category: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.5,
        color: '#9CA3AF',
        marginBottom: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 34,
    },
    description: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
        marginBottom: 28,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF99',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    metaText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    hintRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 4,
    },
    hintLeft: {
        fontSize: 12,
        color: '#EF444488',
        fontWeight: '500',
    },
    hintRight: {
        fontSize: 12,
        color: '#22C55E88',
        fontWeight: '500',
    },
});
