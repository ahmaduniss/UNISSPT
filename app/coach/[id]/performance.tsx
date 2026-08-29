import { useLocalSearchParams } from 'expo-router';
import { Activity, TrendingUp } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { sportLabel } from '@/constants/sports';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import type { PerformanceTest } from '@/types/workout';

export default function CoachPerformanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMetricsForSport } = useApp();

  const coachesQuery = trpc.clients.myCoaches.useQuery();
  const relationship = coachesQuery.data?.find((c) => c.id === id);

  const testsQuery = trpc.performance.list.useQuery({ clientId: id }, { enabled: !!id });
  const tests = testsQuery.data ?? [];

  const knownMetrics = useMemo(
    () => getMetricsForSport(relationship?.sport ?? 'general'),
    [getMetricsForSport, relationship?.sport],
  );

  const groups = useMemo(() => {
    const byMetric: Record<string, PerformanceTest[]> = {};
    tests.forEach((t) => {
      if (!byMetric[t.metricId]) byMetric[t.metricId] = [];
      byMetric[t.metricId].push(t);
    });
    return Object.entries(byMetric).map(([metricId, entries]) => {
      const sorted = entries.slice().sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      const known = knownMetrics.find((m) => m.id === metricId);
      const best = sorted.reduce((acc, curr) => {
        if (known?.lowerIsBetter) return curr.value < acc.value ? curr : acc;
        return curr.value > acc.value ? curr : acc;
      }, sorted[0]);
      return { metricId, name: sorted[0].metricName, unit: sorted[0].unit, entries: sorted, best };
    });
  }, [tests, knownMetrics]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Activity color={Colors.dark.accent} size={18} />
          <Text style={styles.headerText}>{sportLabel(relationship?.sport ?? 'general')} Testing</Text>
        </View>

        {groups.length === 0 && (
          <View style={styles.emptyState}>
            <Activity color={Colors.dark.textTertiary} size={40} />
            <Text style={styles.emptyTitle}>No results yet</Text>
            <Text style={styles.emptySubtitle}>Your coach hasn&apos;t logged any test results yet</Text>
          </View>
        )}

        {groups.map((group) => (
          <View key={group.metricId} style={styles.metricCard}>
            <Text style={styles.metricName}>{group.name}</Text>
            <View style={styles.metricBestRow}>
              <TrendingUp color={Colors.dark.success} size={13} />
              <Text style={styles.metricBest}>Best: {group.best.value} {group.unit}</Text>
              <Text style={styles.metricCount}>· {group.entries.length} logged</Text>
            </View>
            <View style={styles.historyList}>
              {group.entries.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.historyRow}>
                  <Text style={styles.historyValue}>{entry.value} {entry.unit}</Text>
                  <Text style={styles.historyDate}>{formatDate(entry.recordedAt)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

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
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 18,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  metricCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  metricName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  metricBestRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginTop: 4,
  },
  metricBest: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.success,
  },
  metricCount: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  historyList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    gap: 8,
  },
  historyRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  historyValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 4,
    textAlign: 'center' as const,
    paddingHorizontal: 30,
  },
});
