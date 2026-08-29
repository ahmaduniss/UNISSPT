import { useRouter } from 'expo-router';
import { ChevronRight, Search, UserRound } from 'lucide-react-native';
import React, { useCallback } from 'react';
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
import { trpc } from '@/lib/trpc';

export default function MyCoachesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const coachesQuery = trpc.clients.myCoaches.useQuery();
  const coaches = coachesQuery.data ?? [];

  const handleOpenCoach = useCallback((clientRecordId: string) => {
    router.push(`/coach/${clientRecordId}` as any);
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Coaches</Text>
      </View>

      {coachesQuery.isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={coaches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <UserRound color={Colors.dark.textTertiary} size={40} />
              <Text style={styles.emptyTitle}>No coaches yet</Text>
              <Text style={styles.emptySubtitle}>
                Browse trainers and send a booking request to get started
              </Text>
              <Pressable
                onPress={() => router.push('/(client)/browse' as any)}
                style={styles.browseBtn}
              >
                <Search color="#fff" size={16} />
                <Text style={styles.browseBtnText}>Browse Coaches</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleOpenCoach(item.id)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.trainerName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.trainerName}</Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.goal || 'No goal set yet'}
                </Text>
              </View>
              <ChevronRight color={Colors.dark.textTertiary} size={18} />
            </Pressable>
          )}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
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
  browseBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
  },
  browseBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
