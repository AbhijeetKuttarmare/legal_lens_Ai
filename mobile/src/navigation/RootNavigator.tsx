import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAuthenticated, setUnauthenticated } from '../store/authSlice';
import { loadSession } from '../auth/session';
import AppLoadingSplash from '../components/AppLoadingSplash';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';

const SPLASH_IMAGE = require('../../assets/SplashscreenAI.png');

function SessionCheckSplash() {
  return (
    <View style={styles.checkSplash}>
      <Image source={SPLASH_IMAGE} style={styles.checkSplashImage} resizeMode="cover" />
    </View>
  );
}

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const user = useAppSelector((s) => s.auth.user);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await loadSession();
      if (user) {
        dispatch(setAuthenticated(user));
      } else {
        dispatch(setUnauthenticated());
      }
      setSessionChecked(true);
    })();
  }, [dispatch]);

  // Session check is near-instant (local storage read); show a bare branded
  // frame for it rather than forcing every launch through the full onboarding
  // carousel. The carousel (with its "Get Started" CTA) is only for
  // logged-out/first-time users, decided once we actually know auth status.
  if (!sessionChecked || status === 'idle') {
    return <SessionCheckSplash />;
  }

  if (status !== 'authenticated' && !onboardingDone) {
    return <AppLoadingSplash onFinish={() => setOnboardingDone(true)} />;
  }

  let content;
  if (status === 'authenticated' && !user?.profileComplete) {
    content = <CompleteProfileScreen />;
  } else if (status === 'authenticated') {
    content = <MainNavigator />;
  } else {
    content = <AuthNavigator />;
  }

  return <NavigationContainer>{content}</NavigationContainer>;
}

const styles = StyleSheet.create({
  checkSplash: { flex: 1, backgroundColor: '#0B1220' },
  checkSplashImage: { width: '100%', height: '100%' },
});
