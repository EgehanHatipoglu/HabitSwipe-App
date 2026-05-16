import { useContext, useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppContext } from '../context/AppContext';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import HabitFormScreen from '../screens/HabitFormScreen';
import LevelUpScreen from '../screens/LevelUpScreen';
import TimedAlertScreen from '../screens/TimedAlertScreen';
import type { RootStackParamList } from '../types/navigation.types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { isOnboarded, pendingTimedHabit, setPendingTimedHabit } = useContext(AppContext);
    const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

    // pendingTimedHabit set edilince TimedAlert modali aç
    useEffect(() => {
        if (!pendingTimedHabit || !navRef.current) return;
        // Navigasyon hazır olduğunda navigate et
        navRef.current.navigate('TimedAlert', { habitId: pendingTimedHabit.id });
    }, [pendingTimedHabit]);

    return (
        <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isOnboarded ? (
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                ) : (
                    <>
                        <Stack.Screen name="Main" component={TabNavigator} />
                        <Stack.Screen
                            name="HabitForm"
                            component={HabitFormScreen}
                            options={{
                                presentation: 'modal',
                                headerShown: true,
                                title: 'Alışkanlık Ekle',
                            }}
                        />
                        <Stack.Screen
                            name="LevelUp"
                            component={LevelUpScreen}
                            options={{
                                presentation: 'transparentModal',
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="TimedAlert"
                            component={TimedAlertScreen}
                            options={{
                                presentation: 'transparentModal',
                                headerShown: false,
                            }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
