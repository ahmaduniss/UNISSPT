import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Repeat,
  Share2,
  TrendingUp,
} from 'lucide-react-native';
import React, { useCallback, useState, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { workoutHistory, repeatWorkout, weeklyVolume, weeklyWorkouts, shareWorkoutToFeed, socialFeed } = useApp();
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const totalStats = useMemo(() => {
    const totalSessions = workoutHistory.length;
    const totalVolume = workoutHistory.reduce((s, w) => s + w.totalVolume, 0);
    const totalDuration = workoutHistory.reduce((s, w) => s + w.duration, 0);
    return { totalSessions, totalVolume, totalDuration };
  }, [workoutHistory]);

  const handleRepeat = useCallback((workout: typeof workoutHistory[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    repeatWorkout(workout);
    router.navigate('/(tabs)/workout' as any);
  }, [repeatWorkout, router]);

  const handleShare = useCallback((workout: typeof workoutHistory[0]) => {
    const alreadyShared = socialFeed.some((p) => p.workoutId === workout.id);
    if (alreadyShared || sharedIds.has(workout.id)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    shareWorkoutToFeed(workout);
    setSharedIds((prev) => new Set(prev).add(workout.id));
  }, [shareWorkoutToFeed, socialFeed, sharedIds]);

  const isWorkoutShared = useCallback((workoutId: string) => {
    return sharedIds.has(workoutId) || socialFeed.some((p) => p.workoutId === workoutId);
  }, [socialFeed, sharedIds]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyWorkouts}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {weeklyVolume >= 1000
                ? `${(weeklyVolume / 1000).toFixed(1)}k`
                : weeklyVolume}
            </Text>
            <Text style={styles.statLabel}>Weekly Vol (kg)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalStats.totalSessions}</Text>
            <Text style={styles.statLabel}>All Time</Text>
          </View>
        </View>

        {workoutHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar color={Colors.dark.textTertiary} size={40} />
            <Text style={styles.emptyTitle}>No Workouts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete your first session and it will show up here
            </Text>
          </View>
        ) : (
          workoutHistory.map((workout) => {
            const isExpanded = expandedId === workout.id;
            return (
              <Pressable
                key={workout.id}
                onPress={() => setExpandedId(isExpanded ? null : workout.id)}
                style={styles.workoutCard}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardName}>{workout.name}</Text>
                    <Text style={styles.cardMeta}>
                      {formatDate(workout.date)} at {formatTime(workout.date)}
                    </Text>
                  </View>
                  <View style={styles.cardRight}>
                    {isExpanded ? (
                      <ChevronUp color={Colors.dark.textTertiary} size={20} />
                    ) : (
                      <ChevronDown color={Colors.dark.textTertiary} size={20} />
                    )}
                  </View>
                </View>

                <View style={styles.cardStats}>
                  <View style={styles.cardStatItem}>
                    <TrendingUp color={Colors.dark.accent} size={14} />
                    <Text style={styles.cardStatText}>
                      {workout.totalVolume.toLocaleString()} kg
                    </Text>
                  </View>
                  <Text style={styles.cardStatDivider}>·</Text>
                  <Text style={styles.cardStatText}>
                    {formatDuration(workout.duration)}
                  </Text>
                  <Text style={styles.cardStatDivider}>·</Text>
                  <Text style={styles.cardStatText}>
                    {workout.exercises.length} exercises
                  </Text>
                </View>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {workout.exercises.map((ex, idx) => (
                      <View key={`${ex.exerciseId}-${idx}`} style={styles.exerciseRow}>
                        <Text style={styles.exerciseRowName}>{ex.exerciseName}</Text>
                        <View style={styles.setsList}>
                          {ex.sets.map((set, sIdx) => (
                            <Text key={sIdx} style={styles.setText}>
                              {set.completed ? '✓' : '○'} {set.weight}kg × {set.reps}
                            </Text>
                          ))}
                        </View>
                      </View>
                    ))}
                    <View style={styles.expandedActions}>
                      <Pressable
                        onPress={() => handleRepeat(workout)}
                        style={styles.repeatBtn}
                      >
                        <Repeat color={Colors.dark.accent} size={16} />
                        <Text style={styles.repeatText}>Repeat</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleShare(workout)}
                        style={[
                          styles.shareBtn,
                          isWorkoutShared(workout.id) && styles.shareBtnShared,
                        ]}
                        disabled={isWorkoutShared(workout.id)}
                      >
                        <Share2
                          color={isWorkoutShared(workout.id) ? Colors.dark.success : Colors.dark.text}
                          size={16}
                        />
                        <Text style={[
                          styles.shareText,
                          isWorkoutShared(workout.id) && styles.shareTextShared,
                        ]}>
                          {isWorkoutShared(workout.id) ? 'Shared' : 'Share'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
    textAlign: 'center' as const,
    marginTop: 6,
    lineHeight: 20,
  },
  workoutCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    marginLeft: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  cardMeta: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  cardStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 10,
    gap: 6,
  },
  cardStatItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  cardStatText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  cardStatDivider: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
  },
  expandedContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
  },
  exerciseRow: {
    marginBottom: 12,
  },
  exerciseRowName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
    marginBottom: 4,
  },
  setsList: {
    gap: 2,
  },
  setText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    paddingLeft: 12,
  },
  expandedActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 6,
  },
  repeatBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 10,
  },
  repeatText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 10,
  },
  shareBtnShared: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  shareTextShared: {
    color: Colors.dark.success,
  },
});
