import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Dumbbell, ArrowRight, UserPlus, LogIn } from 'lucide-react-native';
import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, signup, isAuthenticated, userRole, hasProfile, isProfileLoading } = useApp();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isAuthenticated || isProfileLoading) return;
    if (!hasProfile) {
      router.replace('/onboarding' as any);
    } else if (userRole === 'client') {
      router.replace('/(client)/home' as any);
    } else {
      router.replace('/(tabs)/clients' as any);
    }
  }, [isAuthenticated, isProfileLoading, hasProfile, userRole]);

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const validateEmail = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  };

  const handleSubmit = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!password) {
      setError('Please enter a password');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isSignUp) {
        console.log('[Login] Signing up with email:', email.trim());
        await signup(email.trim(), password);
      } else {
        console.log('[Login] Logging in with email:', email.trim());
        await login(email.trim(), password);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('[Login] Auth error:', err);
      setError(err?.message || 'Something went wrong. Please try again.');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setConfirmPassword('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.container]}>
      <LinearGradient
        colors={['#1a0f00', '#0B0B0F', '#0B0B0F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <View style={styles.gridOverlay}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[styles.gridLine, { top: 60 + i * 50, opacity: 0.02 + (i % 3) * 0.01 }]}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.logoRow}>
              <LinearGradient
                colors={[Colors.dark.accent, Colors.dark.accentDark]}
                style={styles.logoBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Dumbbell color="#fff" size={28} />
              </LinearGradient>
              <Text style={styles.logoText}>UNISS</Text>
            </View>

            <Text style={styles.title}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? 'Sign up as a trainer or a client to get started'
                : 'Log in to continue'}
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.form,
              {
                opacity: formAnim,
                transform: [{ translateX: shakeAnim }],
              },
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={styles.inputRow}>
                <Mail color={Colors.dark.textTertiary} size={18} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  testID="email-input"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputRow}>
                <Lock color={Colors.dark.textTertiary} size={18} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  secureTextEntry={!showPassword}
                  returnKeyType={isSignUp ? 'next' : 'done'}
                  onSubmitEditing={() => {
                    if (isSignUp) {
                      confirmRef.current?.focus();
                    } else {
                      handleSubmit();
                    }
                  }}
                  testID="password-input"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={12}
                  testID="toggle-password"
                >
                  {showPassword ? (
                    <EyeOff color={Colors.dark.textTertiary} size={18} />
                  ) : (
                    <Eye color={Colors.dark.textTertiary} size={18} />
                  )}
                </Pressable>
              </View>
            </View>

            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <View style={styles.inputRow}>
                  <Lock color={Colors.dark.textTertiary} size={18} />
                  <TextInput
                    ref={confirmRef}
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.dark.textTertiary}
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    testID="confirm-password-input"
                  />
                </View>
              </View>
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              testID="submit-button"
            >
              <LinearGradient
                colors={[Colors.dark.accent, Colors.dark.accentDark]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSignUp ? (
                  <UserPlus color="#fff" size={20} />
                ) : (
                  <LogIn color="#fff" size={20} />
                )}
                <Text style={styles.submitText}>
                  {isSubmitting
                    ? 'Please wait...'
                    : isSignUp
                    ? 'CREATE ACCOUNT'
                    : 'LOG IN'}
                </Text>
                {!isSubmitting && <ArrowRight color="#fff" size={18} />}
              </LinearGradient>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={toggleMode}
              style={({ pressed }) => [
                styles.toggleButton,
                pressed && styles.toggleButtonPressed,
              ]}
              testID="toggle-mode-button"
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Already have an account? '
                  : "Don't have an account? "}
                <Text style={styles.toggleTextAccent}>
                  {isSignUp ? 'Log In' : 'Sign Up'}
                </Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  flex: {
    flex: 1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden' as const,
  },
  gridLine: {
    position: 'absolute' as const,
    left: -20,
    right: -20,
    height: 1,
    backgroundColor: Colors.dark.accent,
    transform: [{ rotate: '-8deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  header: {
    marginBottom: 36,
  },
  logoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    marginBottom: 32,
  },
  logoBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.dark.text,
    letterSpacing: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    paddingVertical: 16,
    fontWeight: '500' as const,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorText: {
    fontSize: 14,
    color: Colors.dark.danger,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginTop: 4,
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 18,
    gap: 10,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1.5,
  },
  dividerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
  },
  toggleButton: {
    alignItems: 'center' as const,
    paddingVertical: 12,
  },
  toggleButtonPressed: {
    opacity: 0.7,
  },
  toggleText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
  },
  toggleTextAccent: {
    color: Colors.dark.accent,
    fontWeight: '700' as const,
  },
});
