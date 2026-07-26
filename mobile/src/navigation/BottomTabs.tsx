import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TabParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ProfileScreen from '../screens/ProfileScreen';

const NAVY = '#0B1220';
const GOLD = '#D4AF37';

const Tab = createBottomTabNavigator<TabParamList>();

const icons: Record<
  Exclude<keyof TabParamList, 'Scan'>,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  Home: 'home-variant',
  History: 'folder-multiple-outline',
  Subscription: 'crown-outline',
  Profile: 'account-circle',
};

function ScanTabPlaceholder() {
  return null;
}

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={icons[route.name as Exclude<keyof TabParamList, 'Scan'>]}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Documents' }} />
      <Tab.Screen
        name="Scan"
        component={ScanTabPlaceholder}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: () => (
            <View style={styles.fab}>
              <MaterialCommunityIcons name="line-scan" size={26} color={NAVY} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('Upload');
          },
        })}
      />
      <Tab.Screen name="Subscription" component={SubscriptionScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: NAVY, borderTopWidth: 0, height: 64, paddingBottom: 8 },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
