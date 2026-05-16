import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TodayScreen from '../screens/TodayScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HabitsScreen from '../screens/HabitsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import type { TabParamList } from '../types/navigation.types';
import { C } from '../constants/colors';

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, [IoniconsName, IoniconsName]> = {
    Today: ['today', 'today-outline'],
    Dashboard: ['bar-chart', 'bar-chart-outline'],
    Habits: ['list', 'list-outline'],
    Settings: ['settings', 'settings-outline'],
};

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    const [active, inactive] = TAB_ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
                    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
                },
                tabBarActiveTintColor: C.PRIMARY,
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    borderTopWidth: 0.5,
                    borderTopColor: '#E5E7EB',
                    paddingBottom: 6,
                    paddingTop: 4,
                    height: 62,
                },
                headerShown: false,
            })}
        >
            <Tab.Screen name="Today" component={TodayScreen} options={{ title: 'Bugün' }} />
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
            <Tab.Screen name="Habits" component={HabitsScreen} options={{ title: 'Alışkanlıklar' }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
        </Tab.Navigator>
    );
}
