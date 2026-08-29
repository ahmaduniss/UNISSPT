import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Search, Plus, UserRound } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { sportLabel } from '@/constants/sports';
import { trpc } from '@/lib/trpc';
import type { Client } from '@/types/workout';

type StatusFilter = 'active' | 'inactive' | 'all';

export default function ClientsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  const clientsQuery = trpc.clients.list.useQuery();
  const clients = clientsQuery.data ?? [];

  const filtered = useMemo(() => {
    let list = clients;
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [clients, statusFilter, search]);

  const activeCount = useMemo(() => clients.filter((c) => c.status === 'active').length, [clients]);

  const handleOpenClient = useCallback((client: Client) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/client/${client.id}` as any);
  }, [router]);

  const renderClient = useCallback(({ item }: { item: Client }) => (
    <Pressable
      onPress={() => handleOpenClient(item)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName}>{item.name}</Text>
          {item.sport !== 'general' && (
            <View style={styles.sportPill}>
              <Text style={styles.sportPillText}>{sportLabel(item.sport)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {item.goal ? item.goal : item.email ?? 'No goal set'}
        </Text>
      </View>
      {item.status === 'inactive' && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
        </View>
      )}
    </Pressable>
  ), [handleOpenClient]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Clients</Text>
          <Text style={styles.subtitle}>{activeCount} active</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/add-client' as any);
          }}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
          testID="add-client-button"
        >
          <Plus color="#fff" size={20} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <Search color={Colors.dark.textTertiary} size={18} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search clients..."
          placeholderTextColor={Colors.dark.textTertiary}
        />
      </View>

      <View style={styles.filterRow}>
        {(['active', 'inactive', 'all'] as StatusFilter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setStatusFilter(f)}
            style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, statusFilter === f && styles.filterChipTextActive]}>
              {f === 'active' ? 'Active' : f === 'inactive' ? 'Inactive' : 'All'}
            </Text>
          </Pressable>
        ))}
      </View>

      {clientsQuery.isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={clientsQuery.isFetching}
          onRefresh={() => clientsQuery.refetch()}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <UserRound color={Colors.dark.textTertiary} size={40} />
              <Text style={styles.emptyTitle}>
                {clients.length === 0 ? 'No clients yet' : 'No matches'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {clients.length === 0
                  ? 'Add your first client to start logging their workouts'
                  : 'Try a different search or filter'}
              </Text>
              {clients.length === 0 && (
                <Pressable
                  onPress={() => router.push('/add-client' as any)}
                  style={styles.emptyAddBtn}
                >
                  <Plus color="#fff" size={16} />
                  <Text style={styles.emptyAddBtnText}>Add Client</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  searchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.inputBg,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  card: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
  },
  cardInfo: {
    flex: 1,
  },
  cardNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  sportPill: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sportPillText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
    letterSpacing: 0.3,
  },
  cardMeta: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  inactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inactiveBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.dark.danger,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 80,
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
  emptyAddBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
