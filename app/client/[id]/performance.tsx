import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { sportLabel } from '@/constants/sports';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import type { PerformanceMetric, PerformanceTest } from '@/types/workout';

export default function ClientPerformanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMetricsForSport, addCustomMetric } = useApp();
  const utils = trpc.useUtils();

  const clientQuery = trpc.clients.getById.useQuery({ clientId: id });
  const testsQuery = trpc.performance.list.useQuery({ clientId: id }, { enabled: !!id });
  const tests = testsQuery.data ?? [];
  const client = clientQuery.data;

  const metrics = useMemo(() => getMetricsForSport(client?.sport ?? 'general'), [getMetricsForSport, client?.sport]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logModal, setLogModal] = useState<PerformanceMetric | null>(null);
  const [logValue, setLogValue] = useState<string>('');
  const [logNotes, setLogNotes] = useState<string>('');
  const [addMetricModal, setAddMetricModal] = useState<boolean>(false);
  const [newMetricName, setNewMetricName] = useState<string>('');
  const [newMetricUnit, setNewMetricUnit] = useState<string>('');
  const [newMetricLowerBetter, setNewMetricLowerBetter] = useState<boolean>(false);

  const createTestMutation = trpc.performance.create.useMutation({
    onSuccess: () => {
      utils.performance.list.invalidate({ clientId: id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLogModal(null);
      setLogValue('');
      setLogNotes('');
    },
    onError: (error) => Alert.alert('Could not save result', error.message),
  });

  const deleteTestMutation = trpc.performance.delete.useMutation({
    onSuccess: () => utils.performance.list.invalidate({ clientId: id }),
    onError: (error) => Alert.alert('Could not delete', error.message),
  });

  const testsByMetric = useMemo(() => {
    const map: Record<string, PerformanceTest[]> = {};
    tests.forEach((t) => {
      if (!map[t.metricId]) map[t.metricId] = [];
      map[t.metricId].push(t);
    });
    return map;
  }, [tests]);

  const bestForMetric = useCallback((metric: PerformanceMetric, entries: PerformanceTest[]) => {
    if (entries.length === 0) return null;
    return entries.reduce((best, curr) => {
      if (metric.lowerIsBetter) return curr.value < best.value ? curr : best;
      return curr.value > best.value ? curr : best;
    }, entries[0]);
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openLogModal = useCallback((metric: PerformanceMetric) => {
    setLogModal(metric);
    setLogValue('');
    setLogNotes('');
  }, []);

  const handleSubmitLog = useCallback(() => {
    if (!logModal) return;
    const value = Number(logValue);
    if (!logValue.trim() || Number.isNaN(value)) {
      Alert.alert('Invalid value', `Enter a number in ${logModal.unit}.`);
      return;
    }
    createTestMutation.mutate({
      clientId: id,
      metricId: logModal.id,
      metricName: logModal.name,
      unit: logModal.unit,
      value,
      recordedAt: new Date().toISOString(),
      notes: logNotes.trim() || undefined,
    });
  }, [logModal, logValue, logNotes, id, createTestMutation]);

  const handleDeleteTest = useCallback((test: PerformanceTest) => {
    Alert.alert('Delete Result', `Remove this ${test.metricName} entry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteTestMutation.mutate({ id: test.id });
        },
      },
    ]);
  }, [deleteTestMutation]);

  const handleAddCustomMetric = useCallback(() => {
    if (!newMetricName.trim() || !newMetricUnit.trim()) {
      Alert.alert('Missing info', 'Enter both a name and a unit.');
      return;
    }
    addCustomMetric(client?.sport ?? 'general', {
      id: `custom_${Date.now()}`,
      name: newMetricName.trim(),
      unit: newMetricUnit.trim(),
      lowerIsBetter: newMetricLowerBetter,
      isCustom: true,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAddMetricModal(false);
    setNewMetricName('');
    setNewMetricUnit('');
    setNewMetricLowerBetter(false);
  }, [newMetricName, newMetricUnit, newMetricLowerBetter, client?.sport, addCustomMetric]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Activity color={Colors.dark.accent} size={18} />
          <Text style={styles.headerText}>{sportLabel(client?.sport ?? 'general')} Testing</Text>
        </View>

        {metrics.map((metric) => {
          const entries = (testsByMetric[metric.id] ?? []).slice().sort(
            (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
          );
          const best = bestForMetric(metric, entries);
          const isExpanded = expandedId === metric.id;

          return (
            <View key={metric.id} style={styles.metricCard}>
              <Pressable
                onPress={() => setExpandedId(isExpanded ? null : metric.id)}
                style={styles.metricHeader}
              >
                <View style={styles.metricInfo}>
                  <Text style={styles.metricName}>{metric.name}</Text>
                  {best ? (
                    <View style={styles.metricBestRow}>
                      <TrendingUp color={Colors.dark.success} size={13} />
                      <Text style={styles.metricBest}>
                        Best: {best.value} {metric.unit}
                      </Text>
                      <Text style={styles.metricLast}>· {entries.length} logged</Text>
                    </View>
                  ) : (
                    <Text style={styles.metricEmpty}>No results yet</Text>
                  )}
                </View>
                {isExpanded ? (
                  <ChevronUp color={Colors.dark.textTertiary} size={18} />
                ) : (
                  <ChevronDown color={Colors.dark.textTertiary} size={18} />
                )}
              </Pressable>

              <Pressable
                onPress={() => openLogModal(metric)}
                style={({ pressed }) => [styles.logBtn, pressed && { opacity: 0.85 }]}
              >
                <Plus color="#fff" size={14} />
                <Text style={styles.logBtnText}>Log Result</Text>
              </Pressable>

              {isExpanded && entries.length > 0 && (
                <View style={styles.historyList}>
                  {entries.map((entry) => (
                    <View key={entry.id} style={styles.historyRow}>
                      <View>
                        <Text style={styles.historyValue}>{entry.value} {entry.unit}</Text>
                        <Text style={styles.historyDate}>{formatDate(entry.recordedAt)}</Text>
                        {entry.notes && <Text style={styles.historyNotes}>{entry.notes}</Text>}
                      </View>
                      <Pressable onPress={() => handleDeleteTest(entry)} hitSlop={8}>
                        <Trash2 color={Colors.dark.textTertiary} size={15} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <Pressable
          onPress={() => setAddMetricModal(true)}
          style={({ pressed }) => [styles.addMetricBtn, pressed && { opacity: 0.7 }]}
        >
          <Plus color={Colors.dark.accent} size={16} />
          <Text style={styles.addMetricText}>Add Custom Metric</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={!!logModal} transparent animationType="slide" onRequestClose={() => setLogModal(null)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{logModal?.name}</Text>
              <Pressable onPress={() => setLogModal(null)} hitSlop={8}>
                <X color={Colors.dark.textTertiary} size={20} />
              </Pressable>
            </View>
            <Text style={styles.modalLabel}>VALUE ({logModal?.unit})</Text>
            <TextInput
              style={styles.modalInput}
              value={logValue}
              onChangeText={setLogValue}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.dark.textTertiary}
              autoFocus
            />
            <Text style={styles.modalLabel}>NOTES (optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={logNotes}
              onChangeText={setLogNotes}
              placeholder="e.g. approach jump, hand-timed..."
              placeholderTextColor={Colors.dark.textTertiary}
            />
            <Pressable
              onPress={handleSubmitLog}
              disabled={createTestMutation.isPending}
              style={({ pressed }) => [styles.modalSaveBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.modalSaveBtnText}>
                {createTestMutation.isPending ? 'Saving...' : 'Save Result'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={addMetricModal} transparent animationType="slide" onRequestClose={() => setAddMetricModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Metric</Text>
              <Pressable onPress={() => setAddMetricModal(false)} hitSlop={8}>
                <X color={Colors.dark.textTertiary} size={20} />
              </Pressable>
            </View>
            <Text style={styles.modalLabel}>NAME</Text>
            <TextInput
              style={styles.modalInput}
              value={newMetricName}
              onChangeText={setNewMetricName}
              placeholder="e.g. Reaction Time"
              placeholderTextColor={Colors.dark.textTertiary}
              autoFocus
            />
            <Text style={styles.modalLabel}>UNIT</Text>
            <TextInput
              style={styles.modalInput}
              value={newMetricUnit}
              onChangeText={setNewMetricUnit}
              placeholder="e.g. sec, in, reps"
              placeholderTextColor={Colors.dark.textTertiary}
            />
            <Pressable
              onPress={() => setNewMetricLowerBetter(!newMetricLowerBetter)}
              style={styles.toggleRow}
            >
              <View style={[styles.checkbox, newMetricLowerBetter && styles.checkboxActive]}>
                {newMetricLowerBetter && <View style={styles.checkboxDot} />}
              </View>
              <Text style={styles.toggleText}>Lower value is better (e.g. sprint times)</Text>
            </Pressable>
            <Pressable
              onPress={handleAddCustomMetric}
              style={({ pressed }) => [styles.modalSaveBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.modalSaveBtnText}>Add Metric</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  metricHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  metricInfo: {
    flex: 1,
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
  metricLast: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  metricEmpty: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  logBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: Colors.dark.accent,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  logBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  historyList: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    gap: 10,
  },
  historyRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  historyValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 1,
  },
  historyNotes: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    maxWidth: 240,
  },
  addMetricBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed' as const,
  },
  addMetricText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.dark.overlay,
    justifyContent: 'flex-end' as const,
  },
  modalSheet: {
    backgroundColor: Colors.dark.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '500' as const,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  toggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginTop: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxActive: {
    borderColor: Colors.dark.accent,
  },
  checkboxDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: Colors.dark.accent,
  },
  toggleText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  modalSaveBtn: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 24,
  },
  modalSaveBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
