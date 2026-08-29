import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Dumbbell, UserRound, ArrowRight } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import type { UserRole } from '@/types/workout';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState<string>('');

  const saveProfileMutation = trpc.users.saveProfile.useMutation({
    onSuccess: async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await utils.users.getProfile.invalidate();
      router.replace((role === 'trainer' ? '/(tabs)/clients' : '/(client)/home') as any);
    },
    onError: (error) => Alert.alert('Could not save', error.message),
  });

  const handleContinue = useCallback(() => {
    if (!role) {
      Alert.alert('Pick one', 'Are you a trainer or looking for one?');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter your name.');
      return;
    }
    saveProfileMutation.mutate({ name: name.trim(), role });
  }, [role, name, saveProfileMutation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.title}>Welcome to UNISS</Text>
        <Text style={styles.subtitle}>Let&apos;s set up your account</Text>

        <Text style={styles.label}>I AM A...</Text>
        <View style={styles.roleRow}>
          <Pressable
            onPress={() => setRole('trainer')}
            style={[styles.roleCard, role === 'trainer' && styles.roleCardActive]}
          >
            <Dumbbell color={role === 'trainer' ? '#fff' : Colors.dark.accent} size={26} />
            <Text style={[styles.roleTitle, role === 'trainer' && styles.roleTitleActive]}>Trainer</Text>
            <Text style={[styles.roleSub, role === 'trainer' && styles.roleSubActive]}>
              I coach clients
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRole('client')}
            style={[styles.roleCard, role === 'client' && styles.roleCardActive]}
          >
            <UserRound color={role === 'client' ? '#fff' : Colors.dark.accent} size={26} />
            <Text style={[styles.roleTitle, role === 'client' && styles.roleTitleActive]}>Client</Text>
            <Text style={[styles.roleSub, role === 'client' && styles.roleSubActive]}>
              I want a trainer
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>YOUR NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Ahmad Younis"
          placeholderTextColor={Colors.dark.textTertiary}
        />

        <Pressable
          onPress={handleContinue}
          disabled={saveProfileMutation.isPending}
          style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.9 }]}
        >
          <LinearGradient
            colors={[Colors.dark.accent, Colors.dark.accentDark]}
            style={styles.continueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueText}>
              {saveProfileMutation.isPending ? 'Saving...' : 'Continue'}
            </Text>
            <ArrowRight color="#fff" size={18} />
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginTop: 6,
    marginBottom: 32,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 28,
  },
  roleCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center' as const,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
  },
  roleCardActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  roleTitleActive: {
    color: '#fff',
  },
  roleSub: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    textAlign: 'center' as const,
  },
  roleSubActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  input: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '500' as const,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 32,
  },
  continueBtn: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginTop: 'auto' as const,
  },
  continueGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 18,
    gap: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
});
