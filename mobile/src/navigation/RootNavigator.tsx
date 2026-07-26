import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAuthenticated, setUnauthenticated } from '../store/authSlice';
import { loadSession } from '../auth/session';
import AppLoadingSplash from '../components/AppLoadingSplash';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

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

  if (!splashDone || !sessionChecked || status === 'idle') {
    return <AppLoadingSplash onFinish={() => setSplashDone(true)} />;
  }

  return (
    <NavigationContainer>
      {status === 'authenticated' ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
