import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import {
  Megaphone,
  Send,
  CheckCircle,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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

const QUICK_TEMPLATES = [
  { title: 'Gym Closure', message: 'The gym will be closed on [date] for [reason]. We apologize for any inconvenience.' },
  { title: 'New Equipment', message: 'We just added new equipment to the gym! Come check out the [equipment name].' },
  { title: 'Competition Reminder', message: "Don't forget about today's competition! Check the app for details and join before it ends." },
  { title: 'Schedule Change', message: 'Please note the updated gym hours: [new hours]. This change takes effect [date].' },
];

export default function AdminAnnounceScreen() {
  const router = useRouter();
  const { selectedGymId, userId } = useApp();
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [sent, setSent] = useState<boolean>(false);

  const sendMutation = trpc.admin.sendAnnouncement.useMutation({
    onSuccess: () => {
      console.log('[AdminAnnounce] Announcement sent');
    },
    onError: (error) => {
      console.error('[AdminAnnounce] Send failed:', error.message);
    },
  });

  const handleSend = useCallback(() => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Missing Info', 'Please enter both a title and message.');
      return;
    }

    Alert.alert(
      'Send Announcement',
      'This will be sent to all gym members. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            sendMutation.mutate({
              gymId: selectedGymId ?? 'kabs',
              title: title.trim(),
              message: message.trim(),
              adminId: userId ?? 'admin',
            });
            setSent(true);
          },
        },
      ],
    );
  }, [title, message, selectedGymId, userId, sendMutation]);

  const handleUseTemplate = useCallback((template: typeof QUICK_TEMPLATES[0]) => {
    Haptics.selectionAsync();
    setTitle(template.title);
    setMessage(template.message);
  }, []);

  if (sent) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Announcement' }} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle color={Colors.dark.success} size={48} />
          </View>
          <Text style={styles.successTitle}>Announcement Sent!</Text>
          <Text style={styles.successSubtitle}>All gym members have been notified.</Text>
          <Pressable
            onPress={() => {
              setSent(false);
              setTitle('');
              setMessage('');
            }}
            style={({ pressed }) => [styles.newBtn, pressed && { opacity: 0.8 }]}
          >
            <Megaphone color="#fff" size={18} />
            <Text style={styles.newBtnText}>Send Another</Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.backBtnText}>Back to Dashboard</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Send Announcement' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerInfo}>
            <View style={styles.headerIconBg}>
              <Megaphone color={Colors.dark.accent} size={24} />
            </View>
            <Text style={styles.headerTitle}>Broadcast to Members</Text>
            <Text style={styles.headerSubtitle}>Send an announcement to all gym members</Text>
          </View>

          <Text style={styles.inputLabel}>Quick Templates</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templatesRow}
          >
            {QUICK_TEMPLATES.map((t, i) => (
              <Pressable
                key={i}
                onPress={() => handleUseTemplate(t)}
                style={({ pressed }) => [styles.templateChip, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.templateText}>{t.title}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Announcement title"
            placeholderTextColor={Colors.dark.textTertiary}
            maxLength={100}
          />

          <Text style={styles.inputLabel}>Message *</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={message}
            onChangeText={setMessage}
            placeholder="Write your announcement message..."
            placeholderTextColor={Colors.dark.textTertiary}
            multiline
            numberOfLines={6}
            maxLength={500}
          />
          <Text style={styles.charCount}>{message.length}/500</Text>

          <Pressable
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              (!title.trim() || !message.trim()) && styles.sendBtnDisabled,
            ]}
            disabled={!title.trim() || !message.trim()}
          >
            <Send color="#fff" size={18} />
            <Text style={styles.sendBtnText}>Send to All Members</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  centered: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerInfo: {
    alignItems: 'center' as const,
    marginBottom: 28,
  },
  headerIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
    marginTop: 20,
  },
  templatesRow: {
    gap: 8,
    paddingVertical: 2,
  },
  templateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  templateText: {
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
    minHeight: 140,
    textAlignVertical: 'top' as const,
  },
  charCount: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    textAlign: 'right' as const,
    marginTop: 6,
  },
  sendBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 17,
    marginTop: 28,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  successContainer: {
    alignItems: 'center' as const,
    paddingHorizontal: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.dark.textTertiary,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  newBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 30,
  },
  newBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  backBtn: {
    marginTop: 14,
    paddingVertical: 10,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
});
