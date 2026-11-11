import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../api';
import { colors, radius } from '../theme';
import type { AuthResponse } from '../types';

type Props = {
  onAuthenticated: (result: AuthResponse) => Promise<void>;
};

export function AuthScreen({ onAuthenticated }: Props) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    if (isRegistering && (password.length < 12 || !phone.trim())) {
      setError('Use a password with at least 12 characters and add your phone number.');
      return;
    }

    setLoading(true);
    try {
      const result = isRegistering
        ? await api.register({
            email: email.trim().toLowerCase(),
            phone_number: phone.trim(),
            password,
            full_name: fullName.trim(),
          })
        : await api.login(email.trim().toLowerCase(), password);
      await onAuthenticated(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Feather name="sun" size={23} color={colors.white} />
          </View>
          <Text style={styles.brandName}>daymark</Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>{isRegistering ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>A little help remembering what matters.</Text>
        </View>

        <View style={styles.card}>
          {isRegistering ? (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setFullName}
                placeholder="How should we call you?"
                placeholderTextColor="#A0AAA3"
                style={styles.input}
                value={fullName}
              />
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                autoComplete="tel"
                keyboardType="phone-pad"
                onChangeText={setPhone}
                placeholder="+919876543210"
                placeholderTextColor="#A0AAA3"
                style={styles.input}
                value={phone}
              />
            </>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#A0AAA3"
            style={styles.input}
            value={email}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              autoCapitalize="none"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              onChangeText={setPassword}
              onSubmitEditing={submit}
              placeholder={isRegistering ? 'At least 12 characters' : 'Your password'}
              placeholderTextColor="#A0AAA3"
              secureTextEntry={!isPasswordVisible}
              style={[styles.input, styles.passwordInput]}
              value={password}
            />
            <Pressable
              accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              hitSlop={12}
              onPress={() => setIsPasswordVisible((visible) => !visible)}
              style={styles.eye}
            >
              <Feather name={isPasswordVisible ? 'eye-off' : 'eye'} size={18} color={colors.muted} />
            </Pressable>
          </View>

          {error ? (
            <View style={styles.error}>
              <Feather name="alert-circle" size={16} color={colors.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable disabled={loading} onPress={submit} style={({ pressed }) => [styles.submit, pressed && styles.pressed, loading && styles.disabled]}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.submitText}>{isRegistering ? 'Create account' : 'Sign in'}</Text>
                <Feather name="arrow-up-right" size={18} color={colors.white} />
              </>
            )}
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isRegistering ? 'Already have an account?' : 'New to daymark?'}
            </Text>
            <Pressable
              onPress={() => {
                setError('');
                setIsRegistering((registering) => !registering);
              }}
            >
              <Text style={styles.switchAction}>{isRegistering ? ' Sign in' : ' Create account'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: colors.paper },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 42 },
  brandMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green },
  brandName: { color: colors.ink, fontSize: 19, fontWeight: '700', letterSpacing: -0.5 },
  intro: { marginBottom: 22 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: 18, borderWidth: 1, borderColor: colors.line },
  label: { color: colors.ink, fontSize: 12, fontWeight: '600', marginBottom: 7, marginTop: 3 },
  input: { height: 47, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FCFDFB', paddingHorizontal: 13, color: colors.ink, fontSize: 14, marginBottom: 13 },
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { width: '100%', paddingRight: 48 },
  eye: { position: 'absolute', right: 14, top: 13 },
  error: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 14, paddingHorizontal: 2 },
  errorText: { flex: 1, color: colors.red, fontSize: 12, lineHeight: 17 },
  submit: { minHeight: 49, borderRadius: 13, backgroundColor: colors.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  submitText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.68 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 17 },
  switchText: { color: colors.muted, fontSize: 11 },
  switchAction: { color: colors.green, fontWeight: '700', fontSize: 11 },
});
