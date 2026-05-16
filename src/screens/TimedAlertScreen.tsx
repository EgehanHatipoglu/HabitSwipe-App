import { useContext, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring, withTiming,
    runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants/categories';
import { C } from '../constants/colors';
import { useHabitActions } from '../hooks/useHabitActions';
import XpBurst from '../components/XpBurst';
import { useState } from 'react';
import type { RootStackParamList } from '../types/navigation.types';
import type { SwipeStatus } from '../types/habit.types';

type Props = NativeStackScreenProps<RootStackParamList, 'TimedAlert'>;

const { width: W } = Dimensions.get('window');
const THRESHOLD = W * 0.38;

export default function TimedAlertScreen() {
    const navigation = useNavigation();
    const route = useRoute<Props['route']>();
    const { habits, pendingTimedHabit, setPendingTimedHabit, snoozeTimedHabit, setPendingLevelUp } = useContext(AppContext);
    const { handleSwipe } = useHabitActions();

    const habit = pendingTimedHabit ?? habits.find(h => h.id === route.params.habitId);
    const [xpBurst, setXpBurst] = useState<number | null>(null);
    const [swiped, setSwiped] = useState(false);

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const dismiss = useCallback(() => {
        setPendingTimedHabit(null);
        navigation.goBack();
    }, [setPendingTimedHabit, navigation]);

    const onSwipe = useCallback(async (status: SwipeStatus) => {
        if (!habit || swiped) return;
        setSwiped(true);
        const result = await handleSwipe(habit, status);
        if (result?.xpEarned && result.xpEarned > 0) {
            setXpBurst(result.xpEarned);
        }
        if (result?.didLevelUp) {
            setPendingLevelUp(result.newLevel);
            setTimeout(() => {
                dismiss();
                setTimeout(() => {
                    (navigation as any).navigate('LevelUp', { newLevel: result.newLevel });
                }, 300);
            }, 700);
        } else {
            setTimeout(dismiss, 700);
        }
    }, [habit, swiped, handleSwipe, setPendingLevelUp, dismiss, navigation]);

    const gesture = Gesture.Pan()
        .onUpdate(e => {
            translateX.value = e.translationX;
            translateY.value = e.translationY * 0.3;
        })
        .onEnd(e => {
            if (e.translationX > THRESHOLD) {
                translateX.value = withTiming(W * 1.5, { duration: 280 });
                runOnJS(onSwipe)('done');
            } else if (e.translationX < -THRESHOLD) {
                translateX.value = withTiming(-W * 1.5, { duration: 280 });
                runOnJS(onSwipe)('missed');
            } else {
                translateX.value = withSpring(0, { damping: 15 });
                translateY.value = withSpring(0, { damping: 15 });
            }
        });

    const cardStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-W / 2, 0, W / 2],
            [-12, 0, 12],
            Extrapolation.CLAMP,
        );
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate}deg` },
            ],
        };
    });

    const doneOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, THRESHOLD * 0.6], [0, 1], Extrapolation.CLAMP),
    }));

    const missedOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [-THRESHOLD * 0.6, 0], [1, 0], Extrapolation.CLAMP),
    }));

    if (!habit) return null;
    const cat = CATEGORIES[habit.category];

    return (
        <GestureHandlerRootView style={styles.root}>
            <View style={styles.backdrop} />

            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="time" size={20} color={C.PRIMARY} />
                    <Text style={styles.headerText}>Şimdi Zamanı!</Text>
                </View>

                {/* Swipe card */}
                <GestureDetector gesture={gesture}>
                    <Animated.View style={[styles.card, { backgroundColor: cat.bg }, cardStyle]}>

                        <Animated.View style={[styles.overlay, styles.doneOverlay, doneOpacity]}>
                            <Ionicons name="checkmark-circle" size={52} color={C.DONE} />
                            <Text style={[styles.overlayText, { color: C.DONE }]}>Yaptım!</Text>
                        </Animated.View>

                        <Animated.View style={[styles.overlay, styles.missedOverlay, missedOpacity]}>
                            <Ionicons name="close-circle" size={52} color={C.MISSED} />
                            <Text style={[styles.overlayText, { color: C.MISSED }]}>Olmadı</Text>
                        </Animated.View>

                        <View style={[styles.iconCircle, { backgroundColor: cat.color + '22' }]}>
                            <Ionicons name={cat.icon as any} size={40} color={cat.color} />
                        </View>

                        <Text style={styles.catLabel}>{cat.label.toUpperCase()}</Text>
                        <Text style={styles.habitTitle}>{habit.title}</Text>
                        {habit.description ? (
                            <Text style={styles.habitDesc}>{habit.description}</Text>
                        ) : null}

                        <View style={styles.metaRow}>
                            <View style={styles.metaChip}>
                                <Ionicons name="flame" size={13} color={C.STREAK} />
                                <Text style={styles.metaText}>{habit.streak} gün</Text>
                            </View>
                            <View style={styles.metaChip}>
                                <Ionicons name="flash" size={13} color={C.PRIMARY} />
                                <Text style={styles.metaText}>+{habit.xpReward} XP</Text>
                            </View>
                        </View>

                        <View style={styles.hintRow}>
                            <Text style={styles.hintLeft}>← Olmadı</Text>
                            <Text style={styles.hintRight}>Yaptım! →</Text>
                        </View>
                    </Animated.View>
                </GestureDetector>

                {/* Snooze */}
                <TouchableOpacity
                    style={styles.snoozeBtn}
                    onPress={() => snoozeTimedHabit(habit.id)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="alarm-outline" size={16} color={C.TEXT_SUB} />
                    <Text style={styles.snoozeTxt}>10 dk ertele</Text>
                </TouchableOpacity>
            </View>

            {xpBurst !== null && (
                <XpBurst amount={xpBurst} onDone={() => setXpBurst(null)} />
            )}
        </GestureHandlerRootView>
    );
}

const CARD_W = W - 48;

const styles = StyleSheet.create({
    root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.60)',
    },
    container: {
        width: W - 24,
        alignItems: 'center',
        gap: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: C.PRIMARY_LIGHT,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    headerText: {
        fontSize: 15,
        fontWeight: '700',
        color: C.PRIMARY_DARK,
        fontFamily: 'Arial',
    },
    card: {
        width: CARD_W,
        borderRadius: 24,
        paddingHorizontal: 28,
        paddingTop: 36,
        paddingBottom: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 10,
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
    overlayText: { fontSize: 16, fontWeight: '700' },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    catLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.5,
        color: '#9CA3AF',
        marginBottom: 6,
    },
    habitTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: C.TEXT_MAIN,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 32,
        fontFamily: 'Arial',
    },
    habitDesc: {
        fontSize: 14,
        color: C.TEXT_SUB,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
        marginBottom: 24,
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
    metaText: { fontSize: 12, color: '#374151', fontWeight: '500' },
    hintRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    hintLeft: { fontSize: 12, color: `${C.MISSED}88`, fontWeight: '500' },
    hintRight: { fontSize: 12, color: `${C.DONE}88`, fontWeight: '500' },
    snoozeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    snoozeTxt: { fontSize: 13, color: '#fff', fontWeight: '500' },
});
