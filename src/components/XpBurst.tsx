import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
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
            withTiming(1, { duration: 200 }),
            withTiming(1, { duration: 600 }),
            withTiming(0, { duration: 400 }, (finished) => {
                if (finished) runOnJS(onDone)();
            }),
        );
        translateY.value = withTiming(-60, { duration: 1200 });
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.wrap, animStyle]} pointerEvents="none">
            <Text style={styles.text}>+{amount} XP</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        alignSelf: 'center',
        bottom: '40%',
        backgroundColor: '#22C55E',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 6,
    },
    text: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
