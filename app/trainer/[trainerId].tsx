import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { UserRound, DollarSign, Award, Send, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { SPORTS } from '@/constants/sports';
import { trpc } from '@/lib/trpc';

export default function TrainerDetailScreen() {
  const { trainerId } = useLocalSearchParams<{ trainerId: string }>();
  const [requestModal, setRequestModal] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const trainerQuery = trpc.marketplace.getTrainer.useQuery({ trainerId });
  const trainer = trainerQuery.data;

  const sentRequestsQuery = trpc.bookings.sentRequests.useQuery();
  const existingRequest = sentRequestsQuery.data?.find((r) => r.trainerId === trainerId);

  const sendRequestMutation = trpc.bookings.sendRequest.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      sentRequestsQuery.refetch();
      setRequestModal(false);
      setMessage('');
      Alert.alert('Request Sent', `${trainer?.name} will be notified of your request.`);
    },
    onError: (error) => Alert.alert('Could not send request', error.message),
  });

  const handleSend = useCallback(() => {
    sendRequestMutation.mutate({ trainerId, message: message.trim() || undefined });
  }, [trainerId, message, sendRequestMutation]);

  if (trainerQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.dark.accent} />
      </View>
    );
  }

  if (!trainer) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Trainer not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: trainer.name }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1A1A2E', Colors.dark.background]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.avatarLarge}>
            <UserRound color={Colors.dark.accent} size={36} />
          </View>
          <Text style={styles.trainerName}>{trainer.name}</Text>
          {trainer.specialties.length > 0 && (
            <View style={styles.specialtiesRow}>
              {trainer.specialties.map((s) => (
                <View key={s} style={styles.specialtyPill}>
                  <Text style={styles.specialtyPillText}>
                    {SPORTS.find((sp) => sp.key === s)?.label ?? s}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>

        <View style={styles.statsRow}>
          {trainer.hourlyRate != null && (
            <View style={styles.statBadge}>
              <DollarSign color={Colors.dark.accent} size={16} />
              <Text style={styles.statValue}>${trainer.hourlyRate}/hr</Text>
            </View>
          )}
          {trainer.yearsExperience != null && (
            <View style={styles.statBadge}>
              <Award color={Colors.dark.accent} size={16} />
              <Text style={styles.statValue}>{trainer.yearsExperience}y experience</Text>
            </View>
          )}
        </View>

        {trainer.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{trainer.bio}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {existingRequest ? (
          <View style={[styles.statusBanner, existingRequest.status === 'accepted' && styles.statusBannerAccepted]}>
            <Text style={styles.statusBannerText}>
              {existingRequest.status === 'pending' && 'Request pending...'}
              {existingRequest.status === 'accepted' && "You're connected with this coach"}
              {existingRequest.status === 'declined' && 'Request declined'}
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => setRequestModal(true)}
            style={({ pressed }) => [styles.requestBtn, pressed && { opacity: 0.85 }]}
          >
            <Send color="#fff" size={18} />
            <Text style={styles.requestBtnText}>Request Booking</Text>
          </Pressable>
        )}
      </View>

      <Modal visible={requestModal} transparent animationType="slide" onRequestClose={() => setRequestModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Message {trainer.name}</Text>
              <Pressable onPress={() => setRequestModal(false)} hitSlop={8}>
                <X color={Colors.dark.textTertiary} size={20} />
              </Pressable>
            </View>
            <TextInput
              style={styles.modalInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Tell them about your goals..."
              placeholderTextColor={Colors.dark.textTertiary}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <Pressable
              onPress={handleSend}
              disabled={sendRequestMutation.isPending}
              style={({ pressed }) => [styles.modalSendBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.modalSendBtnText}>
                {sendRequestMutation.isPending ? 'Sending...' : 'Send Request'}
              </Text>
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
  centered: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.dark.textTertiary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center' as const,
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  trainerName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  specialtiesRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 10,
    justifyContent: 'center' as const,
  },
  specialtyPill: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  specialtyPillText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  bioSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 21,
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  requestBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  requestBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  statusBanner: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  statusBannerAccepted: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
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
  modalInput: {
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.dark.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalSendBtn: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 20,
  },
  modalSendBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
