import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/types';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Onboarding'>;

export function OnboardingScreen(_props: Props) {
  return <OnboardingWizard />;
}
