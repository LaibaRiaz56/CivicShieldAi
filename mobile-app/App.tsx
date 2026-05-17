import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import ReportScreen from './src/screens/ReportScreen';
import ChatScreen from './src/screens/ChatScreen';
import MapScreen from './src/screens/MapScreen';

const Tab = createBottomTabNavigator();

const COLORS = { bg: '#080c14', card: '#0d1421', border: 'rgba(255,255,255,0.08)', blue: '#00a8ff', text: '#e8f0fe', muted: '#8899b4' };

const TABS = [
  { name: 'Home', component: HomeScreen, icon: '🛡️', label: 'Home' },
  { name: 'Report', component: ReportScreen, icon: '🚨', label: 'Report' },
  { name: 'Chat', component: ChatScreen, icon: '💬', label: 'Chat' },
  { name: 'Map', component: MapScreen, icon: '🗺️', label: 'Map' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.card,
              borderTopColor: COLORS.border,
              borderTopWidth: 1,
              paddingBottom: 8,
              paddingTop: 8,
              height: 72,
            },
            tabBarActiveTintColor: COLORS.blue,
            tabBarInactiveTintColor: COLORS.muted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
            tabBarIcon: ({ focused, color }) => {
              const tab = TABS.find(t => t.name === route.name);
              return (
                <View style={{
                  width: 40, height: 32, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: focused ? 'rgba(255, 255, 255, 1.0)' : 'transparent',
                  borderRadius: 10,
                }}>
                  <Text style={{ fontSize: 20 }}>{tab?.icon}</Text>
                </View>
              );
            },
          })}
        >
          {TABS.map(({ name, component, label }) => (
            <Tab.Screen key={name} name={name} component={component} options={{ title: label }} />
          ))}
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
