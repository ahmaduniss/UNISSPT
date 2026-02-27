import { useRouter } from 'expo-router';
import {
  TrendingUp,
  Target,
  Clock,
  Flame,
  BarChart3,
  Award,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { analyticsData } = useApp();

  const maxWeeklyVolume = useMemo(() => {
    return Math.max(...analyticsData.weeklyData.map((w) => w.volume), 1);
  }, [analyticsData.weeklyData]);

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toString();
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroGrid}>
          <View style={[styles.heroCard, styles.heroCardWide]}>
            <View style={styles.heroIconRow}>
              <TrendingUp color={Colors.dark.accent} size={20} />
              <Text style={styles.heroLabel}>Total Volume</Text>
            </View>
            <Text style={styles.heroValue}>{formatVolume(analyticsData.totalVolume)} kg</Text>
          </View>
          <View style={styles.heroCard}>
            <View style={styles.heroIconRow}>
              <Target color={Colors.dark.success} size={18} />
              <Text style={styles.heroLabel}>Sessions</Text>
            </View>
            <Text style={styles.heroValue}>{analyticsData.totalSessions}</Text>
          </View>
          <View style={styles.heroCard}>
            <View style={styles.heroIconRow}>
              <Flame color="#EF4444" size={18} />
              <Text style={styles.heroLabel}>Streak</Text>
            </View>
            <Text style={styles.heroValue}>{analyticsData.streak}d</Text>
          </View>
          <View style={styles.heroCard}>
            <View style={styles.heroIconRow}>
              <Clock color={Colors.dark.accentLight} size={18} />
              <Text style={styles.heroLabel}>Total Time</Text>
            </View>
            <Text style={styles.heroValue}>{formatDuration(analyticsData.totalDuration)}</Text>
          </View>
          <View style={styles.heroCard}>
            <View style={styles.heroIconRow}>
              <BarChart3 color={Colors.dark.gold} size={18} />
              <Text style={styles.heroLabel}>Avg Volume</Text>
            </View>
            <Text style={styles.heroValue}>{formatVolume(analyticsData.avgVolume)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <View style={styles.chartContainer}>
            {analyticsData.weeklyData.map((week) => {
              const height = maxWeeklyVolume > 0 ? Math.max((week.volume / maxWeeklyVolume) * 120, 4) : 4;
              return (
                <View key={week.week} style={styles.chartBar}>
                  <Text style={styles.chartValue}>
                    {week.volume > 0 ? formatVolume(week.volume) : '—'}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height },
                        week.volume > 0 && styles.barFillActive,
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel}>{week.week}</Text>
                  <Text style={styles.chartSessions}>{week.sessions}s</Text>
                </View>
              );
            })}
          </View>
        </View>

        {analyticsData.personalRecords.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award color={Colors.dark.gold} size={18} />
              <Text style={styles.sectionTitle}>Personal Records</Text>
            </View>
            {analyticsData.personalRecords.map((pr, idx) => (
              <View key={pr.exercise} style={styles.prRow}>
                <Text style={styles.prRank}>#{idx + 1}</Text>
                <View style={styles.prInfo}>
                  <Text style={styles.prName}>{pr.exercise}</Text>
                  <Text style={styles.prDetail}>
                    {pr.weight} kg x {pr.reps} reps
                  </Text>
                </View>
                <Text style={styles.prWeight}>{pr.weight} kg</Text>
              </View>
            ))}
          </View>
        )}

        {analyticsData.topMuscleGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Muscle Groups</Text>
            {analyticsData.topMuscleGroups.map(([group, count], idx) => {
              const maxCount = analyticsData.topMuscleGroups[0]?.[1] ?? 1;
              const width = `${Math.max((count / maxCount) * 100, 8)}%` as const;
              return (
                <View key={group} style={styles.muscleRow}>
                  <Text style={styles.muscleName}>{group}</Text>
                  <View style={styles.muscleBarTrack}>
                    <View style={[styles.muscleBarFill, { width }]} />
                  </View>
                  <Text style={styles.muscleCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        )}

        {analyticsData.topExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Performed Exercises</Text>
            {analyticsData.topExercises.map(([name, count], idx) => (
              <View key={name} style={styles.exerciseRow}>
                <View style={styles.exerciseRank}>
                  <Text style={styles.exerciseRankText}>{idx + 1}</Text>
                </View>
                <Text style={styles.exerciseName}>{name}</Text>
                <Text style={styles.exerciseCount}>{count}x</Text>
              </View>
            ))}
          </View>
        )}

        {analyticsData.totalSessions === 0 && (
          <View style={styles.emptyState}>
            <BarChart3 color={Colors.dark.textTertiary} size={48} />
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete workouts to see your analytics here
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
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
  scrollContent: {
    padding: 20,
  },
  heroGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    flex: 1,
    minWidth: '45%' as unknown as number,
  },
  heroCardWide: {
    minWidth: '100%' as unknown as number,
  },
  heroIconRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 14,
  },
  chartContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 20,
    height: 200,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    gap: 6,
  },
  chartValue: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.dark.textTertiary,
  },
  barTrack: {
    width: 32,
    height: 120,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 6,
    justifyContent: 'flex-end' as const,
    overflow: 'hidden' as const,
  },
  barFill: {
    width: '100%' as const,
    backgroundColor: Colors.dark.border,
    borderRadius: 6,
  },
  barFillActive: {
    backgroundColor: Colors.dark.accent,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
  },
  chartSessions: {
    fontSize: 10,
    color: Colors.dark.textTertiary,
  },
  prRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  prRank: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.dark.gold,
    width: 32,
  },
  prInfo: {
    flex: 1,
  },
  prName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  prDetail: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  prWeight: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.dark.accent,
  },
  muscleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
    gap: 12,
  },
  muscleName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    width: 80,
  },
  muscleBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.dark.card,
    borderRadius: 5,
    overflow: 'hidden' as const,
  },
  muscleBarFill: {
    height: '100%' as const,
    backgroundColor: Colors.dark.accent,
    borderRadius: 5,
  },
  muscleCount: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    width: 32,
    textAlign: 'right' as const,
  },
  exerciseRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  exerciseRank: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  exerciseRankText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.dark.text,
  },
  exerciseCount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 60,
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
    marginTop: 6,
    textAlign: 'center' as const,
  },
});
