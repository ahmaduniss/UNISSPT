import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Clock,
  Camera,
  ChevronRight,
  BarChart3,
  Activity,
  UserRound,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';

export default function CoachOverviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const coachesQuery = trpc.clients.myCoaches.useQuery();
  const relationship = coachesQuery.data?.find((c) => c.id === id);

  const historyQuery = trpc.workouts.getHistory.useQuery({ clientId: id }, { enabled: !!id });
  const photosQuery = trpc.progressPhotos.list.useQuery({ clientId: id }, { enabled: !!id });
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

  const formatVolume = (vol: number) => (vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol.toString());

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (coachesQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.dark.accent} />
      </View>
    );
  }

  if (!relationship) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Coach not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: relationship.trainerName }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1A1A2E', Colors.dark.background]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.avatarLarge}>
            <UserRound color={Colors.dark.accent} size={32} />
          </View>
          <Text style={styles.coachName}>{relationship.trainerName}</Text>
          {relationship.goal && <Text style={styles.goal}>Goal: {relationship.goal}</Text>}
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

        <View style={styles.linkRow}>
          <Pressable onPress={() => router.push(`/coach/${id}/history` as any)} style={styles.linkBtn}>
            <Clock color={Colors.dark.accent} size={16} />
            <Text style={styles.linkText}>History</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/coach/${id}/photos` as any)} style={styles.linkBtn}>
            <Camera color={Colors.dark.accent} size={16} />
            <Text style={styles.linkText}>{photos.length} Photos</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/coach/${id}/performance` as any)} style={styles.linkBtn}>
            <Activity color={Colors.dark.accent} size={16} />
            <Text style={styles.linkText}>Testing</Text>
          </Pressable>
        </View>

        {stats.lastWorkout && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              <Pressable onPress={() => router.push(`/coach/${id}/history` as any)}>
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
              </View>
            ))}
          </View>
        )}

        {history.length === 0 && (
          <View style={styles.emptyState}>
            <BarChart3 color={Colors.dark.textTertiary} size={36} />
            <Text style={styles.emptyTitle}>No sessions logged yet</Text>
            <Text style={styles.emptySubtitle}>
              Your coach hasn&apos;t logged a workout for you yet — check back soon
            </Text>
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
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  coachName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  goal: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 6,
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
  linkRow: {
    flexDirection: 'row' as const,
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 20,
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
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 40,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    textAlign: 'center' as const,
    marginTop: 6,
    lineHeight: 19,
  },
});
