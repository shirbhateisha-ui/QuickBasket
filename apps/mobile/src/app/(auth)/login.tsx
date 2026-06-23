import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { login } from '@/lib/auth';

export default function LoginScreen() {
  const theme = useTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await login({ phone: phone.trim(), password });
      // Auth state flips -> Stack.Protected redirects to (tabs) automatically.
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not log in. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ThemedText type="title">Welcome back</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Log in to QuickBasket
        </ThemedText>

        <View style={styles.form}>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone (10 digits)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            autoCapitalize="none"
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

          <Pressable
            onPress={onSubmit}
            disabled={busy}
            style={[styles.button, busy && styles.buttonDisabled]}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              {busy ? 'Logging in…' : 'Log in'}
            </ThemedText>
          </Pressable>

          <View style={styles.row}>
            <ThemedText type="small" themeColor="textSecondary">
              New here?{' '}
            </ThemedText>
            <Link href="/register">
              <ThemedText type="linkPrimary">Create an account</ThemedText>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, padding: Spacing.four, gap: Spacing.two, justifyContent: 'center' },
  form: { gap: Spacing.three, marginTop: Spacing.four },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  error: { color: '#e5484d' },
  button: {
    backgroundColor: '#208AEF',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
