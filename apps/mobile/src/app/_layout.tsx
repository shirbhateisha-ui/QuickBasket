import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Provider } from 'react-redux';
import { selectIsLoggedIn, setCredentials } from '@quickbasket/store';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { loadAuth } from '@/lib/auth-storage';
import { store, useAppDispatch, useAppSelector } from '@/store';

function RootNavigator() {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const dispatch = useAppDispatch();
  const [hydrated, setHydrated] = useState(false);

  // Restore the session from secure storage before deciding which group to show.
  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await loadAuth();
      if (active && saved) dispatch(setCredentials(saved));
      if (active) setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, [dispatch]);

  // Keep the splash overlay visible until we know the auth state.
  if (!hydrated) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" options={{ headerShown: true, title: 'Product' }} />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </ThemeProvider>
    </Provider>
  );
}
