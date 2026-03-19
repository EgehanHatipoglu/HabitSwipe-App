import { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppContext } from '../context/AppContext';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import HabitFormScreen from '../screens/HabitFormScreen';
import LevelUpScreen from '../screens/LevelUpScreen';
import type { RootStackParamList } from '../types/navigation.types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { isOnboarded } = useContext(AppContext);

    return (
        <NavigationContainer>
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
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
