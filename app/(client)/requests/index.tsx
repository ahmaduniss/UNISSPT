import { useRouter } from 'expo-router';
import { Inbox } from 'lucide-react-native';
import React from 'react';
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

export default function SentRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const requestsQuery = trpc.bookings.sentRequests.useQuery();
  const requests = requestsQuery.data ?? [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Requests</Text>
      </View>

      {requestsQuery.isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Inbox color={Colors.dark.textTertiary} size={40} />
              <Text style={styles.emptyTitle}>No requests sent</Text>
              <Text style={styles.emptySubtitle}>Browse coaches and send a booking request</Text>
              <Pressable
                onPress={() => router.push('/(client)/browse' as any)}
                style={styles.browseBtn}
              >
                <Text style={styles.browseBtnText}>Browse Coaches</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.trainerName}</Text>
                <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
              </View>
              {item.message && <Text style={styles.cardMessage}>{item.message}</Text>}
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'accepted' && styles.statusAccepted,
                  item.status === 'declined' && styles.statusDeclined,
                ]}
              >
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
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
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  cardDate: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  cardMessage: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start' as const,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.dark.cardElevated,
  },
  statusAccepted: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  statusDeclined: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
});
