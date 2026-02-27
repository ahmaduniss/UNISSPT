import {
  Trophy,
  Flame,
  MapPin,
  Loader,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { MOCK_LEADERBOARD, SPORT_CATEGORIES } from '@/mocks/leaderboard';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';

const MEDAL_COLORS = [Colors.dark.gold, Colors.dark.silver, Colors.dark.bronze];

export default function LeaderboardsScreen() {
  const insets = useSafeAreaInsets();
  const { selectedGymId } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const leaderboardQuery = trpc.leaderboards.getLeaderboard.useQuery(
    { gymId: selectedGymId ?? 'kabs', sport: selectedCategory === 'All' ? undefined : selectedCategory },
    { enabled: !!selectedGymId, staleTime: 30000 },
  );

  const backendData = useMemo(() => {
    if (leaderboardQuery.data && leaderboardQuery.data.length > 0) {
      return leaderboardQuery.data.map((e) => ({
        id: e.id,
        name: e.name,
        totalVolume: e.totalVolume,
        streak: e.streak,
        visits: e.visits,
        sport: e.sport,
      }));
    }
    return null;
  }, [leaderboardQuery.data]);

  const filtered = useMemo(() => {
    if (backendData) return backendData;
    if (selectedCategory === 'All') return MOCK_LEADERBOARD;
    return MOCK_LEADERBOARD.filter((e) => e.sport === selectedCategory);
  }, [selectedCategory, backendData]);

  const topThree = useMemo(() => filtered.slice(0, 3), [filtered]);
  const rest = useMemo(() => filtered.slice(3), [filtered]);

  const podiumOrder = useMemo(() => {
    if (topThree.length < 3) return topThree;
    return [topThree[1], topThree[0], topThree[2]];
  }, [topThree]);

  const formatVolume = (vol: number) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toString();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {SPORT_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.filterChip,
                selectedCategory === cat && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {topThree.length >= 3 && (
          <View style={styles.podium}>
            {podiumOrder.map((entry, idx) => {
              const actualRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
              const heights = [100, 130, 80];
              const medalColor = MEDAL_COLORS[actualRank - 1];
              return (
                <View key={entry.id} style={styles.podiumCol}>
                  <View style={styles.podiumAvatar}>
                    <Text style={[styles.podiumInitial, { color: medalColor }]}>
                      {entry.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {entry.name}
                  </Text>
                  <Text style={styles.podiumVolume}>{formatVolume(entry.totalVolume)} kg</Text>
                  <View
                    style={[
                      styles.podiumBar,
                      {
                        height: heights[idx],
                        backgroundColor: medalColor,
                      },
                    ]}
                  >
                    <Text style={styles.podiumRank}>#{actualRank}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.listSection}>
          {rest.map((entry, idx) => (
            <View key={entry.id} style={styles.listRow}>
              <Text style={styles.listRank}>{idx + 4}</Text>
              <View style={styles.listAvatar}>
                <Text style={styles.listAvatarText}>{entry.name.charAt(0)}</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{entry.name}</Text>
                <View style={styles.listMeta}>
                  <Flame color={Colors.dark.accent} size={12} />
                  <Text style={styles.listMetaText}>{entry.streak} day streak</Text>
                  <MapPin color={Colors.dark.textTertiary} size={12} />
                  <Text style={styles.listMetaText}>{entry.visits} visits</Text>
                </View>
              </View>
              <Text style={styles.listVolume}>{formatVolume(entry.totalVolume)} kg</Text>
            </View>
          ))}
        </View>
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
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
  filterRow: {
    gap: 8,
    paddingBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
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
  podium: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'center' as const,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 8,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center' as const,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 6,
  },
  podiumInitial: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 2,
    textAlign: 'center' as const,
  },
  podiumVolume: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  podiumBar: {
    width: '100%' as const,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    opacity: 0.85,
  },
  podiumRank: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#fff',
  },
  listSection: {
    gap: 2,
  },
  listRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  listRank: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.dark.textTertiary,
    width: 28,
    textAlign: 'center' as const,
  },
  listAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 6,
  },
  listAvatarText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  listMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 3,
  },
  listMetaText: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginRight: 6,
  },
  listVolume: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
  },
});
