import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Mail,
  Users,
  LogOut,
  Pencil,
  Check,
  X,
  Megaphone,
  ChevronRight,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { trpc } from '@/lib/trpc';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userName, authEmail, setDisplayName, logout } = useApp();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftName, setDraftName] = useState<string>(userName ?? '');

  useEffect(() => {
    setDraftName(userName ?? '');
  }, [userName]);

  const clientsQuery = trpc.clients.list.useQuery();
  const clients = clientsQuery.data ?? [];
  const activeClients = useMemo(() => clients.filter((c) => c.status === 'active').length, [clients]);

  const publicProfileQuery = trpc.marketplace.getMyProfile.useQuery();
  const isPublished = publicProfileQuery.data?.isPublic ?? false;

  const saveProfileMutation = trpc.users.saveProfile.useMutation({
    onError: (error) => console.error('[Profile] saveProfile failed:', error.message),
  });

  const initials = useMemo(() => {
    const name = userName ?? 'T';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [userName]);

  const handleSaveName = useCallback(() => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setDisplayName(trimmed);
    saveProfileMutation.mutate({ name: trimmed });
    setIsEditing(false);
  }, [draftName, setDisplayName, saveProfileMutation]);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          logout();
          router.replace('/login');
        },
      },
    ]);
  }, [logout, router]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#1A1A2E', '#0B0B0F']}
          style={[styles.headerGradient, { paddingTop: insets.top + 24 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <LinearGradient
            colors={[Colors.dark.accent, '#C2410C']}
            style={styles.avatarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>

          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Your name"
                placeholderTextColor={Colors.dark.textTertiary}
                autoFocus
                onSubmitEditing={handleSaveName}
              />
              <Pressable onPress={handleSaveName} hitSlop={8} style={styles.editIconBtn}>
                <Check color={Colors.dark.success} size={20} />
              </Pressable>
              <Pressable onPress={() => { setDraftName(userName ?? ''); setIsEditing(false); }} hitSlop={8} style={styles.editIconBtn}>
                <X color={Colors.dark.danger} size={20} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setIsEditing(true)} style={styles.nameRow}>
              <Text style={styles.displayName}>{userName ?? 'Trainer'}</Text>
              <Pencil color={Colors.dark.textTertiary} size={14} />
            </Pressable>
          )}

          {authEmail && (
            <View style={styles.infoItem}>
              <Mail color={Colors.dark.textTertiary} size={13} />
              <Text style={styles.infoText}>{authEmail}</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Users color={Colors.dark.accent} size={20} />
            </View>
            <View>
              <Text style={styles.statValue}>{activeClients}</Text>
              <Text style={styles.statLabel}>Active Clients</Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/trainer-public-profile' as any)}
            style={({ pressed }) => [styles.marketplaceCard, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.statIcon}>
              <Megaphone color={Colors.dark.accent} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statValue}>Public Profile</Text>
              <Text style={styles.statLabel}>
                {isPublished ? 'Visible in marketplace' : 'Not published yet'}
              </Text>
            </View>
            <ChevronRight color={Colors.dark.textTertiary} size={18} />
          </Pressable>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
            testID="profile-logout"
          >
            <LogOut color={Colors.dark.danger} size={18} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: 'center' as const,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  nameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    letterSpacing: 0.5,
  },
  editRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    width: '100%' as const,
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  infoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 10,
  },
  infoText: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  statCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  marketplaceCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  logoutBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.danger,
  },
});
