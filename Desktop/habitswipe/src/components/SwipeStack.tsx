import { View, StyleSheet, Dimensions } from 'react-native';
import type { Habit, SwipeStatus } from '../types/habit.types';
import HabitCard from './HabitCard';

const { height: SCREEN_H } = Dimensions.get('window');

// Aynı anda ekranda gösterilecek kart sayısı (arka plan için)
const VISIBLE_CARDS = 3;

interface Props {
    habits: Habit[];
    onSwipe: (habit: Habit, status: SwipeStatus) => void;
}

export default function SwipeStack({ habits, onSwipe }: Props) {
    // En üstteki kart slice'ın son elemanı (index 0 = en alt görsel)
    const visible = habits.slice(0, VISIBLE_CARDS).reverse();

    return (
        <View style={styles.container}>
            {visible.map((habit, i) => {
                const isTop = i === visible.length - 1;
                // index 0 = en üst kart (scale 1), büyüdükçe arka plana gider
                const stackIndex = visible.length - 1 - i;

                return (
                    <HabitCard
                        key={habit.id}
                        habit={habit}
                        isTop={isTop}
                        index={stackIndex}
                        onSwipe={(status) => onSwipe(habit, status)}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        // Kart yığını için alan
        height: SCREEN_H * 0.58,
    },
});
