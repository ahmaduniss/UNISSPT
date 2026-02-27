import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import {
  Search,
  UserCheck,
  UserX,
  Dumbbell,
  Calendar,
  ChevronDown,
  Filter,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { GymMember } from '@/types/workout';

type SportFilter = 'All' | 'Powerlifting' | 'CrossFit' | 'Bodybuilding' | 'General';
type SortBy = 'name' | 'workouts' | 'recent';

const MOCK_MEMBERS: GymMember[] = [
  { id: 'm1', name: 'Ahmad K.', joinDate: '2025-06-01', totalWorkouts: 48, lastVisit: '2026-02-20', sport: 'Powerlifting', status: 'active' },
  { id: 'm2', name: 'Haikal M.', joinDate: '2025-04-15', totalWorkouts: 92, lastVisit: '2026-02-21', sport: 'CrossFit', status: 'active' },
  { id: 'm3', name: 'Omar S.', joinDate: '2025-07-10', totalWorkouts: 42, lastVisit: '2026-02-19', sport: 'Powerlifting', status: 'active' },
  { id: 'm4', name: 'Yusuf A.', joinDate: '2025-09-01', totalWorkouts: 35, lastVisit: '2026-02-21', sport: 'CrossFit', status: 'active' },
  { id: 'm5', name: 'Khalid R.', joinDate: '2025-05-20', totalWorkouts: 67, lastVisit: '2026-02-20', sport: 'Bodybuilding', status: 'active' },
  { id: 'm6', name: 'Faisal T.', joinDate: '2025-11-01', totalWorkouts: 30, lastVisit: '2026-02-18', sport: 'Bodybuilding', status: 'active' },
  { id: 'm7', name: 'Nasser B.', joinDate: '2026-01-05', totalWorkouts: 25, lastVisit: '2026-02-17', sport: 'Powerlifting', status: 'inactive' },
  { id: 'm8', name: 'Tariq J.', joinDate: '2025-08-12', totalWorkouts: 38, lastVisit: '2026-02-21', sport: 'CrossFit', status: 'active' },
  { id: 'm9', name: 'Saeed M.', joinDate: '2025-12-10', totalWorkouts: 18, lastVisit: '2026-02-15', sport: 'General', status: 'inactive' },
  { id: 'm10', name: 'Hamad A.', joinDate: '2026-02-01', totalWorkouts: 8, lastVisit: '2026-02-21', sport: 'General', status: 'active' },
];

const SPORTS: SportFilter[] = ['All', 'Powerlifting', 'CrossFit', 'Bodybuilding', 'General'];

export default function AdminMembersScreen() {
  const { selectedGymId } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sportFilter, setSportFilter] = useState<SportFilter>('All');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [members, setMembers] = useState<GymMember[]>(MOCK_MEMBERS);

  const updateStatusMutation = trpc.admin.updateMemberStatus.useMutation({
    onSuccess: (data) => {
      console.log('[AdminMembers] Status updated:', data.memberId, data.status);
    },
    onError: (error) => {
      console.error('[AdminMembers] Status update failed:', error.message);
    },
  });

  const filteredMembers = useMemo(() => {
    let result = [...members];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }

    if (sportFilter !== 'All') {
      result = result.filter((m) => m.sport === sportFilter);
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'workouts':
        result.sort((a, b) => b.totalWorkouts - a.totalWorkouts);
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
        break;
    }

    return result;
  }, [members, searchQuery, sportFilter, sortBy]);

  const handleToggleStatus = useCallback((member: GymMember) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newStatus = member.status === 'active' ? 'inactive' : 'active';

    Alert.alert(
      `${newStatus === 'active' ? 'Activate' : 'Deactivate'} Member`,
      `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus === 'inactive' ? 'destructive' : 'default',
          onPress: () => {
            setMembers((prev) =>
              prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m)),
            );
            updateStatusMutation.mutate({ memberId: member.id, status: newStatus });
          },
        },
      ],
    );
  }, [updateStatusMutation]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const getSportColor = (sport: string) => {
    switch (sport) {
      case 'Powerlifting': return '#EF4444';
      case 'CrossFit': return '#3B82F6';
      case 'Bodybuilding': return Colors.dark.accent;
      default: return Colors.dark.textTertiary;
    }
  };

  const activeCount = useMemo(() => members.filter((m) => m.status === 'active').length, [members]);
  const inactiveCount = useMemo(() => members.filter((m) => m.status === 'inactive').length, [members]);

  const renderMember = useCallback(({ item }: { item: GymMember }) => (
    <View style={[styles.memberCard, item.status === 'inactive' && styles.memberInactive]}>
      <View style={styles.memberHeader}>
        <View style={styles.memberLeft}>
          <View style={[styles.avatar, { backgroundColor: getSportColor(item.sport) + '20' }]}>
            <Text style={[styles.avatarText, { color: getSportColor(item.sport) }]}>
              {item.name.charAt(0)}
            </Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.memberName}>{item.name}</Text>
              <View style={[styles.statusDot, item.status === 'active' ? styles.statusActive : styles.statusInactiveDot]} />
            </View>
            <View style={styles.sportBadge}>
              <Text style={[styles.sportText, { color: getSportColor(item.sport) }]}>{item.sport}</Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => handleToggleStatus(item)}
          style={({ pressed }) => [
            styles.statusBtn,
            item.status === 'active' ? styles.statusBtnActive : styles.statusBtnInactive,
            pressed && { opacity: 0.7 },
          ]}
        >
          {item.status === 'active' ? (
            <UserCheck color={Colors.dark.success} size={16} />
          ) : (
            <UserX color={Colors.dark.danger} size={16} />
          )}
        </Pressable>
      </View>

      <View style={styles.memberStats}>
        <View style={styles.memberStat}>
          <Dumbbell color={Colors.dark.textTertiary} size={14} />
          <Text style={styles.memberStatText}>{item.totalWorkouts} workouts</Text>
        </View>
        <View style={styles.memberStat}>
          <Calendar color={Colors.dark.textTertiary} size={14} />
          <Text style={styles.memberStatText}>Joined {formatDate(item.joinDate)}</Text>
        </View>
        <Text style={styles.lastVisit}>Last visit: {getDaysAgo(item.lastVisit)}</Text>
      </View>
    </View>
  ), [handleToggleStatus]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Member Management' }} />

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.dark.success }]}>
          <Text style={styles.summaryNumber}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.dark.danger }]}>
          <Text style={styles.summaryNumber}>{inactiveCount}</Text>
          <Text style={styles.summaryLabel}>Inactive</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#3B82F6' }]}>
          <Text style={styles.summaryNumber}>{members.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search color={Colors.dark.textTertiary} size={18} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search members..."
            placeholderTextColor={Colors.dark.textTertiary}
            testID="member-search"
          />
        </View>
      </View>

      <View style={styles.filtersRow}>
        <FlatList
          horizontal
          data={SPORTS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setSportFilter(item);
              }}
              style={[styles.filterChip, sportFilter === item && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, sportFilter === item && styles.filterChipTextActive]}>
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>{filteredMembers.length} members</Text>
        <View style={styles.sortButtons}>
          {(['name', 'workouts', 'recent'] as SortBy[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSortBy(s)}
              style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
            >
              <Text style={[styles.sortChipText, sortBy === s && styles.sortChipTextActive]}>
                {s === 'name' ? 'Name' : s === 'workouts' ? 'Workouts' : 'Recent'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: Colors.dark.text,
  },
  filtersRow: {
    paddingBottom: 8,
  },
  filtersList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterChipActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  sortRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultCount: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
  },
  sortButtons: {
    flexDirection: 'row' as const,
    gap: 6,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.dark.cardElevated,
  },
  sortChipActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.dark.textTertiary,
  },
  sortChipTextActive: {
    color: Colors.dark.accent,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  memberCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  memberInactive: {
    opacity: 0.6,
  },
  memberHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  memberLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  nameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: Colors.dark.success,
  },
  statusInactiveDot: {
    backgroundColor: Colors.dark.danger,
  },
  sportBadge: {
    marginTop: 3,
  },
  sportText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statusBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statusBtnActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusBtnInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  memberStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
  },
  memberStat: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
  },
  memberStatText: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  lastVisit: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginLeft: 'auto' as const,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.dark.textTertiary,
  },
});
