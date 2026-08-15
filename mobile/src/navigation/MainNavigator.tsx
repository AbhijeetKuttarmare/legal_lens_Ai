import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import BottomTabs from './BottomTabs';
import UploadScreen from '../screens/UploadScreen';
import ReportScreen from '../screens/ReportScreen';
import ChatScreen from '../screens/ChatScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import CreditCheckoutScreen from '../screens/CreditCheckoutScreen';
import CompareScreen from '../screens/CompareScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';
import { useAppTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  const t = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: t.headerBg },
        headerTintColor: t.textOnHeader,
        headerTitleStyle: { color: t.textOnHeader },
      }}
    >
      <Stack.Screen name="Tabs" component={BottomTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Upload" component={UploadScreen} options={{ title: 'Upload Document' }} />
      <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Document Report' }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.fileName })}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={({ route }) => ({ title: `Upgrade to ${route.params.planName}` })}
      />
      <Stack.Screen
        name="CreditCheckout"
        component={CreditCheckoutScreen}
        options={{ title: 'Buy Document Credits' }}
      />
      <Stack.Screen name="Compare" component={CompareScreen} options={{ title: 'Compare Documents' }} />
      <Stack.Screen name="Templates" component={TemplatesScreen} options={{ title: 'Document Templates' }} />
      <Stack.Screen
        name="ThemeSettings"
        component={ThemeSettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
