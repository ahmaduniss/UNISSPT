import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Zap,
  BookOpen,
  Clock,
  Camera,
  ChevronRight,
  Pencil,
  BarChart3,
  Repeat,
  Activity,
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { sportLabel } from '@/constants/sports';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import type { Workout } from '@/types/workout';

export default function ClientOverviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { startFreestyleWorkout, repeatWorkout } = useApp();

  const clientQuery = trpc.clients.getById.useQuery({ clientId: id });
  const historyQuery = trpc.workouts.getHistory.useQuery(
    { clientId: id },
    { enabled: !!id },
  );
  const photosQuery = trpc.progressPhotos.list.useQuery(
    { clientId: id },
    { enabled: !!id },
  );

  const client = clientQuery.data;
  const history = historyQuery.data ?? [];
  const photos = photosQuery.data ?? [];

  const stats = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekWorkouts = history.filter((w) => new Date(w.date).getTime() > oneWeekAgo);
    return {
      totalWorkouts: history.length,
      weekWorkouts: weekWorkouts.length,
      weekVolume: weekWorkouts.reduce((s, w) => s + w.totalVolume, 0),
      lastWorkout: history[0] ?? null,
    };
  }, [history]);

  const formatVolume = (vol: number) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toString();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleStartFreestyle = useCallback(() => {
    if (!client) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startFreestyleWorkout(client, 'Freestyle Session');
    router.navigate('/(tabs)/workout' as any);
  }, [client, startFreestyleWorkout, router]);

  const handleBrowseRoutines = useCallback(() => {
    if (!client) return;
    router.push(`/(tabs)/routines?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}` as any);
  }, [client, router]);

  const handleRepeat = useCallback((workout: Workout) => {
    if (!client) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    repeatWorkout(client, workout);
    router.navigate('/(tabs)/workout' as any);
  }, [client, repeatWorkout, router]);

  if (clientQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.dark.accent} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Client not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: client.name,
          headerRight: () => (
            <Pressable onPress={() => router.push(`/client/${client.id}/edit` as any)} hitSlop={8}>
              <Pencil color={Colors.dark.text} size={18} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1A1A2E', Colors.dark.background]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{client.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.clientName}>{client.name}</Text>
          <View style={styles.sportBadge}>
            <Activity color={Colors.dark.accent} size={11} />
            <Text style={styles.sportBadgeText}>{sportLabel(client.sport)}</Text>
          </View>
          {client.goal && <Text style={styles.clientGoal}>{client.goal}</Text>}
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{stats.weekWorkouts}</Text>
            <Text style={styles.statLabel}>this week</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{formatVolume(stats.weekVolume)}</Text>
            <Text style={styles.statLabel}>kg lifted</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>all time</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Pressable
            onPress={handleStartFreestyle}
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          >
            <LinearGradient
              colors={[Colors.dark.accent, '#C2410C']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Zap color="#fff" size={22} />
              <Text style={styles.actionTitle}>Log Workout</Text>
              <Text style={styles.actionSub}>Start freestyle</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleBrowseRoutines}
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          >
            <View style={styles.actionSecondary}>
              <BookOpen color={Colors.dark.accent} size={22} />
              <Text style={styles.actionTitle2}>From Routine</Text>
              <Text style={styles.actionSub2}>Use a saved template</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.linkRow}>
          <Pressable
            onPress={() => router.push(`/client/${client.id}/history` as any)}
            style={styles.linkBtn}
          >
            <Clock color={Colors.dark.accent} size={16} />
            <Text style={styles.linkText}>History</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/client/${client.id}/photos` as any)}
            style={styles.linkBtn}
          >
            <Camera color={Colors.dark.accent} size={16} />
            <Text style={styles.linkText}>{photos.length} Photos</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/client/${client.id}/analytics` as any)}
            style={styles.linkBtn}
          >
            <BarChart3 color={Colors.dark.accent} size={16} />
            <Text style={styles.linkText}>Analytics</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/client/${client.id}/performance` as any)}
            style={styles.linkBtn}
          >
            <Activity color={Colors.dark.accent} size={16} />
            <Text style={styles.linkText}>Testing</Text>
          </Pressable>
        </View>

        {stats.lastWorkout && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              <Pressable onPress={() => router.push(`/client/${client.id}/history` as any)}>
                <ChevronRight color={Colors.dark.textTertiary} size={18} />
              </Pressable>
            </View>
            {history.slice(0, 3).map((workout) => (
              <View key={workout.id} style={styles.recentCard}>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{workout.name}</Text>
                  <Text style={styles.recentMeta}>
                    {formatDate(workout.date)} · {formatVolume(workout.totalVolume)} kg
                  </Text>
                </View>
                <Pressable onPress={() => handleRepeat(workout)} style={styles.repeatBtn} hitSlop={8}>
                  <Repeat color={Colors.dark.accent} size={18} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {history.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySubtitle}>Log {client.name}&apos;s first workout to get started</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  centered: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.dark.textTertiary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center' as const,
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  avatarLargeText: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.dark.accent,
  },
  clientName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  sportBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  sportBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
    letterSpacing: 0.3,
  },
  clientGoal: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statBadge: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  actionCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  actionGradient: {
    padding: 18,
    minHeight: 110,
    justifyContent: 'flex-end' as const,
    gap: 6,
  },
  actionSecondary: {
    padding: 18,
    minHeight: 110,
    justifyContent: 'flex-end' as const,
    gap: 6,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  actionSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  actionTitle2: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  actionSub2: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  linkRow: {
    flexDirection: 'row' as const,
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  linkBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  recentCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  recentMeta: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 3,
  },
  repeatBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 40,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    textAlign: 'center' as const,
    marginTop: 6,
    lineHeight: 19,
  },
});
