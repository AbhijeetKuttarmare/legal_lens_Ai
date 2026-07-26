import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import UploadScreen from '../screens/UploadScreen';
import ReportScreen from '../screens/ReportScreen';
import ChatScreen from '../screens/ChatScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'LegalLens AI' }} />
      <Stack.Screen name="Upload" component={UploadScreen} options={{ title: 'Upload Document' }} />
      <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Document Report' }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.fileName })}
      />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
    </Stack.Navigator>
  );
}
