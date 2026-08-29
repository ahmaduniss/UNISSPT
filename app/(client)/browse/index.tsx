import { useRouter } from 'expo-router';
import { ChevronRight, Search as SearchIcon, UserRound } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { SPORTS } from '@/constants/sports';
import { trpc } from '@/lib/trpc';
import type { SportKey, TrainerProfile } from '@/types/workout';

type SportFilter = SportKey | 'all';

export default function BrowseCoachesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');

  const trainersQuery = trpc.marketplace.listTrainers.useQuery(
    sportFilter === 'all' ? {} : { sport: sportFilter },
  );
  const trainers = trainersQuery.data ?? [];

  const filters = useMemo<{ key: SportFilter; label: string }[]>(
    () => [{ key: 'all', label: 'All' }, ...SPORTS.filter((s) => s.key !== 'general')],
    [],
  );

  const handleOpen = useCallback((trainerId: string) => {
    router.push(`/trainer/${trainerId}` as any);
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse Coaches</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setSportFilter(f.key)}
            style={[styles.filterChip, sportFilter === f.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, sportFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {trainersQuery.isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={trainers}
          keyExtractor={(item) => item.trainerId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <SearchIcon color={Colors.dark.textTertiary} size={40} />
              <Text style={styles.emptyTitle}>No coaches found</Text>
              <Text style={styles.emptySubtitle}>Check back soon, or try a different sport</Text>
            </View>
          }
          renderItem={({ item }) => <TrainerCard trainer={item} onPress={() => handleOpen(item.trainerId)} />}
        />
      )}
    </View>
  );
}

function TrainerCard({ trainer, onPress }: { trainer: TrainerProfile; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}>
      <View style={styles.avatar}>
        <UserRound color={Colors.dark.accent} size={22} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{trainer.name}</Text>
        {trainer.specialties.length > 0 && (
          <Text style={styles.cardSpecialties} numberOfLines={1}>
            {trainer.specialties.map((s) => SPORTS.find((sp) => sp.key === s)?.label ?? s).join(' · ')}
          </Text>
        )}
        {trainer.bio && <Text style={styles.cardBio} numberOfLines={2}>{trainer.bio}</Text>}
        {trainer.hourlyRate != null && (
          <Text style={styles.cardRate}>${trainer.hourlyRate}/hr</Text>
        )}
      </View>
      <ChevronRight color={Colors.dark.textTertiary} size={18} />
    </Pressable>
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
  filterRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
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
  loadingState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  cardSpecialties: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
    marginTop: 3,
  },
  cardBio: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  cardRate: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    marginTop: 4,
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
});
