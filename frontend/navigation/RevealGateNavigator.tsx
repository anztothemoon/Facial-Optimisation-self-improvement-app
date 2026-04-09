import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import type { RevealStackParamList } from './types';
import { FaceRevealScreen } from '../screens/FaceRevealScreen';
import { PaywallScreen } from '../screens/PaywallScreen';

const Stack = createNativeStackNavigator<RevealStackParamList>();

export function RevealGateNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="FaceReveal"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="FaceReveal" component={FaceRevealScreen} />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ animation: 'fade_from_bottom', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
