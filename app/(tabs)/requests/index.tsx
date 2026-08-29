import * as Haptics from 'expo-haptics';
import { Check, Inbox, X } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import type { BookingRequest } from '@/types/workout';

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const requestsQuery = trpc.bookings.incomingRequests.useQuery();
  const requests = requestsQuery.data ?? [];

  const respondMutation = trpc.bookings.respond.useMutation({
    onSuccess: () => {
      utils.bookings.incomingRequests.invalidate();
      utils.clients.list.invalidate();
    },
    onError: (error) => Alert.alert('Could not respond', error.message),
  });

  const handleRespond = useCallback((request: BookingRequest, accept: boolean) => {
    Haptics.impactAsync(accept ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    respondMutation.mutate({ requestId: request.id, accept });
  }, [respondMutation]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Requests</Text>
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
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptySubtitle}>
                Publish your public profile so clients can find and book you
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.clientName}</Text>
                <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
              </View>
              {item.message && <Text style={styles.cardMessage}>{item.message}</Text>}
              {item.status === 'pending' ? (
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => handleRespond(item, false)}
                    style={[styles.actionBtn, styles.declineBtn]}
                  >
                    <X color={Colors.dark.danger} size={16} />
                    <Text style={[styles.actionText, { color: Colors.dark.danger }]}>Decline</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRespond(item, true)}
                    style={[styles.actionBtn, styles.acceptBtn]}
                  >
                    <Check color="#fff" size={16} />
                    <Text style={[styles.actionText, { color: '#fff' }]}>Accept</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={[styles.statusBadge, item.status === 'accepted' ? styles.statusAccepted : styles.statusDeclined]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              )}
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
  actionRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
  },
  declineBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  acceptBtn: {
    backgroundColor: Colors.dark.success,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  statusBadge: {
    alignSelf: 'flex-start' as const,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
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
