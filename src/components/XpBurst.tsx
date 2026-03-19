import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    Easing,
    runOnJS,
} from 'react-native-reanimated';

interface Props {
    amount: number;
    onDone: () => void;
}

export default function XpBurst({ amount, onDone }: Props) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        opacity.value = withSequence(
            withTiming(1, { duration: 150 }),
            withTiming(1, { duration: 600 }),
            withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }),
        );
        translateY.value = withTiming(-60, { duration: 1050 }, (finished) => {
            if (finished) runOnJS(onDone)();
        });
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.container, style]} pointerEvents="none">
            <Text style={styles.text}>+{amount} XP</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        bottom: '42%',
        zIndex: 100,
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
    },
    text: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
