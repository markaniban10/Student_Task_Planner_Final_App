import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AddTaskScreen from './AddTaskScreen';
import { DrawerProvider, navigationRef } from './DrawerContext';
import HistoryScreen from './HistoryScreen';
import HomeScreen from './HomeScreen';
import { SettingsProvider } from './SettingsContext';
import SettingsScreen from './SettingsScreen';
import { TasksProvider } from './TasksContext';
import { ThemeProvider, useTheme } from './ThemeContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tabs: "Tasks" (HomeScreen) and "History" (HistoryScreen)
function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // our screens draw their own header
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.border },
        tabBarIcon: ({ focused, color, size }) => {
          const iconNames = {
            Tasks: focused ? 'calendar' : 'calendar-outline',
            History: focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline',
          };
          return <Ionicons name={iconNames[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tasks" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

// Everything that needs the theme colors lives here
function AppContent() {
  const { colors, isDark } = useTheme();

  // Colors for the navigation container (rebuilt only when the theme changes)
  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: isDark,
      colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.header,
        text: colors.headerText,
        border: colors.border,
      },
    }),
    [colors, isDark]
  );

  // The top bar used by the Add Task and Settings screens
  const stackHeaderOptions = {
    headerStyle: { backgroundColor: colors.header },
    headerTintColor: colors.headerText,
    headerTitleStyle: { fontWeight: '700' },
    contentStyle: { backgroundColor: colors.background },
  };

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="AddTask"
            component={AddTaskScreen}
            options={({ route }) => ({
              ...stackHeaderOptions,
              title: route.params?.taskId ? 'Edit Task' : 'New Task',
            })}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ ...stackHeaderOptions, title: 'Settings' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Each provider shares one kind of data with every screen:
          theme colors, saved tasks, settings, and the side menu */}
      <ThemeProvider>
        <TasksProvider>
          <SettingsProvider>
            <DrawerProvider>
              <AppContent />
            </DrawerProvider>
          </SettingsProvider>
        </TasksProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
