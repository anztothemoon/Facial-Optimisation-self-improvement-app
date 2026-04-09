import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import type { MainStackParamList } from './types';
import {
  AICoachChatScreen,
  DashboardScreen,
  FaceAnalysisScreen,
  FaceBodyWorkoutsScreen,
  LooksmaxProtocolScreen,
  MotionFitnessScreen,
  ProfileScreen,
  ProgressPhotosScreen,
  LegalScreen,
  RecommendationsScreen,
  TrackerScreen,
} from '../screens';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="FaceAnalysis"
        component={FaceAnalysisScreen}
        options={{ animation: 'fade_from_bottom', presentation: 'card' }}
      />
      <Stack.Screen
        name="LooksmaxProtocol"
        component={LooksmaxProtocolScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Recommendations"
        component={RecommendationsScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
      <Stack.Screen
        name="FaceBodyWorkouts"
        component={FaceBodyWorkoutsScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
      <Stack.Screen
        name="MotionFitness"
        component={MotionFitnessScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ProgressPhotos"
        component={ProgressPhotosScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Tracker"
        component={TrackerScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Legal"
        component={LegalScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AICoachChat"
        component={AICoachChatScreen}
        options={{ presentation: 'modal', animation: 'fade_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
