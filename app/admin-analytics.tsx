import { Stack } from 'expo-router';
import {
  Users,
  TrendingUp,
  Clock,
  Dumbbell,
  BarChart3,
  Activity,
  Percent,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';

export default function AdminAnalyticsScreen() {
  const { selectedGymId } = useApp();

  const analyticsQuery = trpc.analytics.getGymAnalytics.useQuery(
    { gymId: selectedGymId ?? 'kabs' },
    { enabled: !!selectedGymId, staleTime: 60000 },
  );

  const data = analyticsQuery.data;

  const maxPeakHour = useMemo(() => {
    if (!data?.peakHours.length) return 1;
    return Math.max(...data.peakHours.map((h) => h.count));
  }, [data]);

  const maxExerciseCount = useMemo(() => {
    if (!data?.topExercises.length) return 1;
    return Math.max(...data.topExercises.map((e) => e.count));
  }, [data]);

  const maxSportCount = useMemo(() => {
    if (!data?.sportBreakdown.length) return 1;
    return Math.max(...data.sportBreakdown.map((s) => s.count));
  }, [data]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hrs}h ${remainMins}m`;
    }
    return `${mins}m`;
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return '12pm';
    return `${hour - 12}pm`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}k`;
    return vol.toString();
  };

  const getSportColor = (sport: string) => {
    switch (sport) {
      case 'Bodybuilding': return Colors.dark.accent;
      case 'Powerlifting': return '#EF4444';
      case 'CrossFit': return '#3B82F6';
      default: return Colors.dark.textTertiary;
    }
  };

  if (analyticsQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Gym Analytics' }} />
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Gym Analytics' }} />
        <Text style={styles.noDataText}>No analytics data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Gym Analytics' }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { borderLeftColor: Colors.dark.success }]}>
            <Users color={Colors.dark.success} size={18} />
            <Text style={styles.overviewValue}>{data.totalMembers}</Text>
            <Text style={styles.overviewLabel}>Members</Text>
          </View>
          <View style={[styles.overviewCard, { borderLeftColor: Colors.dark.accent }]}>
            <TrendingUp color={Colors.dark.accent} size={18} />
            <Text style={styles.overviewValue}>{data.activeToday}</Text>
            <Text style={styles.overviewLabel}>Active Today</Text>
          </View>
          <View style={[styles.overviewCard, { borderLeftColor: '#3B82F6' }]}>
            <Dumbbell color="#3B82F6" size={18} />
            <Text style={styles.overviewValue}>{data.totalWorkoutsThisWeek}</Text>
            <Text style={styles.overviewLabel}>Workouts/Wk</Text>
          </View>
          <View style={[styles.overviewCard, { borderLeftColor: '#8B5CF6' }]}>
            <Clock color="#8B5CF6" size={18} />
            <Text style={styles.overviewValue}>{formatDuration(data.averageSessionDuration)}</Text>
            <Text style={styles.overviewLabel}>Avg Session</Text>
          </View>
        </View>

        <View style={styles.wideCard}>
          <View style={styles.cardHeader}>
            <BarChart3 color={Colors.dark.accent} size={18} />
            <Text style={styles.cardTitle}>Weekly Volume</Text>
          </View>
          <Text style={styles.bigStat}>{formatVolume(data.totalVolumeThisWeek)} kg</Text>
          <Text style={styles.bigStatLabel}>Total volume this week across all members</Text>
        </View>

        <View style={styles.wideCard}>
          <View style={styles.cardHeader}>
            <Percent color={Colors.dark.success} size={18} />
            <Text style={styles.cardTitle}>Member Retention</Text>
          </View>
          <View style={styles.retentionRow}>
            <Text style={styles.retentionValue}>{Math.round(data.memberRetention * 100)}%</Text>
            <View style={styles.retentionBar}>
              <View style={[styles.retentionFill, { width: `${data.memberRetention * 100}%` as any }]} />
            </View>
          </View>
          <Text style={styles.retentionLabel}>
            {data.memberRetention >= 0.8 ? 'Excellent retention rate' : data.memberRetention >= 0.6 ? 'Good retention rate' : 'Needs improvement'}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity color="#3B82F6" size={18} />
            <Text style={styles.sectionTitle}>Peak Hours</Text>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.barChart}>
              {data.peakHours.map((h) => (
                <View key={h.hour} style={styles.barItem}>
                  <Text style={styles.barValue}>{h.count}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${(h.count / maxPeakHour) * 100}%` as any,
                          backgroundColor: h.count === maxPeakHour ? Colors.dark.accent : '#3B82F6',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{formatHour(h.hour)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Dumbbell color={Colors.dark.accent} size={18} />
            <Text style={styles.sectionTitle}>Top Exercises</Text>
          </View>
          <View style={styles.listCard}>
            {data.topExercises.map((ex, idx) => (
              <View key={ex.name} style={styles.listRow}>
                <View style={styles.listLeft}>
                  <Text style={[styles.listRank, idx === 0 && { color: Colors.dark.gold }]}>#{idx + 1}</Text>
                  <Text style={styles.listName}>{ex.name}</Text>
                </View>
                <View style={styles.listRight}>
                  <View style={styles.listBar}>
                    <View
                      style={[
                        styles.listBarFill,
                        { width: `${(ex.count / maxExerciseCount) * 100}%` as any },
                      ]}
                    />
                  </View>
                  <Text style={styles.listCount}>{ex.count}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users color={Colors.dark.success} size={18} />
            <Text style={styles.sectionTitle}>Sport Breakdown</Text>
          </View>
          <View style={styles.listCard}>
            {data.sportBreakdown.map((sport) => (
              <View key={sport.sport} style={styles.sportRow}>
                <View style={styles.sportLeft}>
                  <View style={[styles.sportDot, { backgroundColor: getSportColor(sport.sport) }]} />
                  <Text style={styles.sportName}>{sport.sport}</Text>
                </View>
                <View style={styles.sportRight}>
                  <View style={styles.sportBar}>
                    <View
                      style={[
                        styles.sportBarFill,
                        {
                          width: `${(sport.count / maxSportCount) * 100}%` as any,
                          backgroundColor: getSportColor(sport.sport),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.sportCount}>{sport.count} members</Text>
                </View>
              </View>
            ))}
          </View>
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
  centered: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  noDataText: {
    fontSize: 16,
    color: Colors.dark.textTertiary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  overviewGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 16,
  },
  overviewCard: {
    width: '48%' as any,
    flexBasis: '48%' as any,
    flexGrow: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  wideCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  bigStat: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  bigStatLabel: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  retentionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  retentionValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.dark.success,
  },
  retentionBar: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 5,
    overflow: 'hidden' as const,
  },
  retentionFill: {
    height: '100%' as const,
    backgroundColor: Colors.dark.success,
    borderRadius: 5,
  },
  retentionLabel: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  chartCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  barChart: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-between' as const,
    height: 140,
  },
  barItem: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.dark.textTertiary,
  },
  barTrack: {
    width: 20,
    height: 100,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 4,
    overflow: 'hidden' as const,
    justifyContent: 'flex-end' as const,
  },
  barFill: {
    width: '100%' as const,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.dark.textTertiary,
  },
  listCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  listRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  listLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  listRank: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.dark.textTertiary,
    width: 26,
  },
  listName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    flex: 1,
  },
  listRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    width: 120,
  },
  listBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  listBarFill: {
    height: '100%' as const,
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
  },
  listCount: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
    width: 30,
    textAlign: 'right' as const,
  },
  sportRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  sportLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  sportDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sportName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  sportRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    width: 150,
  },
  sportBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  sportBarFill: {
    height: '100%' as const,
    borderRadius: 3,
  },
  sportCount: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.dark.textTertiary,
    width: 70,
    textAlign: 'right' as const,
  },
});
