import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { register } from '@/lib/auth';

export default function RegisterScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await register({ name: name.trim(), phone: phone.trim(), password });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create account. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.backgroundSelected }];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ThemedText type="title">Create account</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Join QuickBasket
        </ThemedText>

        <View style={styles.form}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone (10 digits)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            autoCapitalize="none"
            style={inputStyle}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password (min 8 chars)"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            style={inputStyle}
          />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            style={inputStyle}
          />

          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

          <Pressable
            onPress={onSubmit}
            disabled={busy}
            style={[styles.button, busy && styles.buttonDisabled]}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              {busy ? 'Creating…' : 'Create account'}
            </ThemedText>
          </Pressable>

          <View style={styles.row}>
            <ThemedText type="small" themeColor="textSecondary">
              Already have an account?{' '}
            </ThemedText>
            <Link href="/login">
              <ThemedText type="linkPrimary">Log in</ThemedText>
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
