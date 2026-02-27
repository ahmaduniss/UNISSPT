import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import {
  Trophy,
  Plus,
  CheckCircle,
  Clock,
  Users,
  Target,
  Flame,
  Heart,
  Dumbbell,
  Award,
  X,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { AdminCompetition } from '@/types/workout';

type CompetitionType = 'daily_volume' | 'daily_sets' | 'cardio';

const MOCK_COMPETITIONS: AdminCompetition[] = [
  {
    id: 'comp1',
    type: 'daily_volume',
    title: 'Volume King',
    description: 'Lift the most total volume today',
    date: new Date().toISOString().split('T')[0],
    target: 15000,
    gymId: 'kabs',
    prize: 'Free protein shake',
    createdBy: 'admin',
    participants: [
      { userId: 'mock1', userName: 'Ahmad K.', progress: 12500, isCompleted: false, verifiedByAdmin: false },
      { userId: 'mock2', userName: 'Haikal M.', progress: 15200, isCompleted: true, verifiedByAdmin: false },
      { userId: 'mock3', userName: 'Omar S.', progress: 9800, isCompleted: false, verifiedByAdmin: false },
    ],
  },
  {
    id: 'comp2',
    type: 'daily_sets',
    title: 'Set Crusher',
    description: 'Complete the most sets today',
    date: new Date().toISOString().split('T')[0],
    target: 30,
    gymId: 'kabs',
    prize: '1 week free membership',
    createdBy: 'admin',
    participants: [
      { userId: 'mock2', userName: 'Haikal M.', progress: 32, isCompleted: true, verifiedByAdmin: true },
      { userId: 'mock4', userName: 'Yusuf A.', progress: 28, isCompleted: false, verifiedByAdmin: false },
    ],
  },
  {
    id: 'comp3',
    type: 'cardio',
    title: 'Cardio Challenge',
    description: '30 minutes of cardio exercises',
    date: new Date().toISOString().split('T')[0],
    target: 30,
    gymId: 'kabs',
    prize: 'Free gym towel',
    createdBy: 'admin',
    participants: [
      { userId: 'mock5', userName: 'Khalid R.', progress: 30, isCompleted: true, verifiedByAdmin: false },
    ],
  },
];

export default function AdminCompetitionsScreen() {
  const { selectedGymId, userId } = useApp();
  const [competitions, setCompetitions] = useState<AdminCompetition[]>(MOCK_COMPETITIONS);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newType, setNewType] = useState<CompetitionType>('daily_volume');
  const [newTarget, setNewTarget] = useState<string>('');
  const [newPrize, setNewPrize] = useState<string>('');

  const verifyMutation = trpc.competitions.verifyCompletion.useMutation({
    onSuccess: () => {
      console.log('[AdminCompetitions] Verification successful');
    },
    onError: (error) => {
      console.error('[AdminCompetitions] Verification failed:', error.message);
    },
  });

  const createMutation = trpc.admin.createCompetition.useMutation({
    onSuccess: (data) => {
      console.log('[AdminCompetitions] Competition created:', data.id);
    },
    onError: (error) => {
      console.error('[AdminCompetitions] Create failed:', error.message);
    },
  });

  const pendingVerifications = useMemo(() => {
    let count = 0;
    competitions.forEach((comp) => {
      comp.participants.forEach((p) => {
        if (p.isCompleted && !p.verifiedByAdmin) count++;
      });
    });
    return count;
  }, [competitions]);

  const handleVerify = useCallback((compId: string, participantUserId: string, participantName: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Verify Completion',
      `Verify ${participantName}'s competition completion? This will award them the prize.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: () => {
            setCompetitions((prev) =>
              prev.map((comp) => {
                if (comp.id !== compId) return comp;
                return {
                  ...comp,
                  participants: comp.participants.map((p) =>
                    p.userId === participantUserId ? { ...p, verifiedByAdmin: true } : p,
                  ),
                };
              }),
            );
            verifyMutation.mutate({
              competitionId: compId,
              userId: participantUserId,
              adminId: userId ?? 'admin',
            });
          },
        },
      ],
    );
  }, [verifyMutation, userId]);

  const handleCreate = useCallback(() => {
    if (!newTitle.trim() || !newDescription.trim() || !newTarget.trim()) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const targetNum = parseInt(newTarget, 10);
    if (isNaN(targetNum) || targetNum <= 0) {
      Alert.alert('Invalid Target', 'Target must be a positive number.');
      return;
    }

    const newComp: AdminCompetition = {
      id: `comp_${Date.now()}`,
      type: newType,
      title: newTitle.trim(),
      description: newDescription.trim(),
      date: new Date().toISOString().split('T')[0],
      target: targetNum,
      gymId: selectedGymId ?? 'kabs',
      prize: newPrize.trim() || undefined,
      createdBy: userId ?? 'admin',
      participants: [],
    };

    setCompetitions((prev) => [newComp, ...prev]);
    createMutation.mutate({
      gymId: selectedGymId ?? 'kabs',
      type: newType,
      title: newTitle.trim(),
      description: newDescription.trim(),
      target: targetNum,
      prize: newPrize.trim() || undefined,
      adminId: userId ?? 'admin',
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewDescription('');
    setNewTarget('');
    setNewPrize('');
    setNewType('daily_volume');
  }, [newTitle, newDescription, newType, newTarget, newPrize, selectedGymId, userId, createMutation]);

  const getTypeIcon = (type: CompetitionType) => {
    switch (type) {
      case 'daily_volume': return <Dumbbell color={Colors.dark.accent} size={18} />;
      case 'daily_sets': return <Target color="#3B82F6" size={18} />;
      case 'cardio': return <Heart color="#EF4444" size={18} />;
    }
  };

  const getTypeColor = (type: CompetitionType) => {
    switch (type) {
      case 'daily_volume': return Colors.dark.accent;
      case 'daily_sets': return '#3B82F6';
      case 'cardio': return '#EF4444';
    }
  };

  const getTypeUnit = (type: CompetitionType) => {
    switch (type) {
      case 'daily_volume': return 'kg';
      case 'daily_sets': return 'sets';
      case 'cardio': return 'min';
    }
  };

  const renderCompetition = useCallback(({ item }: { item: AdminCompetition }) => {
    const completedCount = item.participants.filter((p) => p.isCompleted).length;
    const verifiedCount = item.participants.filter((p) => p.verifiedByAdmin).length;
    const pendingCount = item.participants.filter((p) => p.isCompleted && !p.verifiedByAdmin).length;

    return (
      <View style={styles.compCard}>
        <View style={styles.compHeader}>
          <View style={styles.compTitleRow}>
            {getTypeIcon(item.type)}
            <View style={{ flex: 1 }}>
              <Text style={styles.compTitle}>{item.title}</Text>
              <Text style={styles.compDesc}>{item.description}</Text>
            </View>
          </View>
          {item.prize && (
            <View style={styles.prizeBadge}>
              <Award color={Colors.dark.gold} size={12} />
              <Text style={styles.prizeText}>{item.prize}</Text>
            </View>
          )}
        </View>

        <View style={styles.compMeta}>
          <View style={styles.compMetaItem}>
            <Users color={Colors.dark.textTertiary} size={14} />
            <Text style={styles.compMetaText}>{item.participants.length} participants</Text>
          </View>
          <View style={styles.compMetaItem}>
            <Target color={Colors.dark.textTertiary} size={14} />
            <Text style={styles.compMetaText}>Target: {item.target} {getTypeUnit(item.type)}</Text>
          </View>
          {pendingCount > 0 && (
            <View style={[styles.compMetaItem, { backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }]}>
              <Clock color="#EAB308" size={12} />
              <Text style={[styles.compMetaText, { color: '#EAB308', fontWeight: '600' as const }]}>{pendingCount} pending</Text>
            </View>
          )}
        </View>

        {item.participants.length > 0 && (
          <View style={styles.participantsList}>
            <Text style={styles.participantsTitle}>Participants</Text>
            {item.participants
              .sort((a, b) => b.progress - a.progress)
              .map((p, idx) => {
                const progress = Math.min(p.progress / item.target, 1);
                return (
                  <View key={p.userId} style={styles.participantRow}>
                    <View style={styles.participantLeft}>
                      <Text style={[
                        styles.participantRank,
                        idx === 0 && { color: Colors.dark.gold },
                      ]}>#{idx + 1}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={styles.participantNameRow}>
                          <Text style={styles.participantName}>{p.userName}</Text>
                          {p.verifiedByAdmin && (
                            <CheckCircle color={Colors.dark.success} size={14} />
                          )}
                        </View>
                        <View style={styles.participantProgress}>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${progress * 100}%` as any,
                                  backgroundColor: p.isCompleted ? Colors.dark.success : getTypeColor(item.type),
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {p.progress} / {item.target} {getTypeUnit(item.type)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {p.isCompleted && !p.verifiedByAdmin && (
                      <Pressable
                        onPress={() => handleVerify(item.id, p.userId, p.userName)}
                        style={({ pressed }) => [styles.verifyBtn, pressed && { opacity: 0.7 }]}
                      >
                        <CheckCircle color="#fff" size={14} />
                        <Text style={styles.verifyBtnText}>Verify</Text>
                      </Pressable>
                    )}
                    {p.verifiedByAdmin && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        )}
      </View>
    );
  }, [handleVerify]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Competitions',
          headerRight: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCreateModal(true);
              }}
              style={styles.headerAddBtn}
            >
              <Plus color={Colors.dark.accent} size={22} />
            </Pressable>
          ),
        }}
      />

      {pendingVerifications > 0 && (
        <View style={styles.pendingBanner}>
          <Clock color="#EAB308" size={18} />
          <Text style={styles.pendingText}>
            {pendingVerifications} completion{pendingVerifications > 1 ? 's' : ''} awaiting verification
          </Text>
        </View>
      )}

      <FlatList
        data={competitions}
        keyExtractor={(item) => item.id}
        renderItem={renderCompetition}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Trophy color={Colors.dark.textTertiary} size={48} />
            <Text style={styles.emptyTitle}>No Competitions</Text>
            <Text style={styles.emptySubtitle}>Create your first competition to engage members</Text>
          </View>
        }
      />

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Competition</Text>
              <Pressable onPress={() => setShowCreateModal(false)} style={styles.modalClose}>
                <X color={Colors.dark.textSecondary} size={22} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeSelector}>
                {([
                  { key: 'daily_volume' as const, label: 'Volume', icon: <Dumbbell color={newType === 'daily_volume' ? '#fff' : Colors.dark.textSecondary} size={16} /> },
                  { key: 'daily_sets' as const, label: 'Sets', icon: <Target color={newType === 'daily_sets' ? '#fff' : Colors.dark.textSecondary} size={16} /> },
                  { key: 'cardio' as const, label: 'Cardio', icon: <Heart color={newType === 'cardio' ? '#fff' : Colors.dark.textSecondary} size={16} /> },
                ]).map((t) => (
                  <Pressable
                    key={t.key}
                    onPress={() => setNewType(t.key)}
                    style={[styles.typeOption, newType === t.key && { backgroundColor: getTypeColor(t.key) }]}
                  >
                    {t.icon}
                    <Text style={[styles.typeOptionText, newType === t.key && { color: '#fff' }]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Volume King"
                placeholderTextColor={Colors.dark.textTertiary}
              />

              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Describe the challenge..."
                placeholderTextColor={Colors.dark.textTertiary}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Target ({getTypeUnit(newType)}) *</Text>
              <TextInput
                style={styles.input}
                value={newTarget}
                onChangeText={setNewTarget}
                placeholder={newType === 'daily_volume' ? '15000' : newType === 'daily_sets' ? '30' : '30'}
                placeholderTextColor={Colors.dark.textTertiary}
                keyboardType="number-pad"
              />

              <Text style={styles.inputLabel}>Prize (optional)</Text>
              <TextInput
                style={styles.input}
                value={newPrize}
                onChangeText={setNewPrize}
                placeholder="e.g. Free protein shake"
                placeholderTextColor={Colors.dark.textTertiary}
              />

              <Pressable
                onPress={handleCreate}
                style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.8 }]}
              >
                <Flame color="#fff" size={18} />
                <Text style={styles.createBtnText}>Create Competition</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pendingBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234, 179, 8, 0.15)',
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EAB308',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  compCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  compHeader: {
    marginBottom: 12,
  },
  compTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
  },
  compTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  compDesc: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 3,
  },
  prizeBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
    marginTop: 10,
    marginLeft: 30,
  },
  prizeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.gold,
  },
  compMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flexWrap: 'wrap' as const,
    marginBottom: 14,
  },
  compMetaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
  },
  compMetaText: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  participantsList: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    paddingTop: 14,
  },
  participantsTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  participantRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  participantLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  participantRank: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.dark.textTertiary,
    width: 28,
  },
  participantNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  participantProgress: {
    marginTop: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 2,
    overflow: 'hidden' as const,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%' as const,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
  },
  verifyBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.dark.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  verifyBtnText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  verifiedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    marginLeft: 10,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.dark.success,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: Colors.dark.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '85%' as const,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  input: {
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  createBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 24,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
