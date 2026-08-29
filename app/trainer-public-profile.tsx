import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Save } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { SPORTS } from '@/constants/sports';
import { trpc } from '@/lib/trpc';
import type { SportKey } from '@/types/workout';

export default function TrainerPublicProfileScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const profileQuery = trpc.marketplace.getMyProfile.useQuery();

  const [bio, setBio] = useState<string>('');
  const [specialties, setSpecialties] = useState<SportKey[]>([]);
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [yearsExperience, setYearsExperience] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);

  useEffect(() => {
    if (profileQuery.data) {
      setBio(profileQuery.data.bio ?? '');
      setSpecialties(profileQuery.data.specialties);
      setHourlyRate(profileQuery.data.hourlyRate != null ? String(profileQuery.data.hourlyRate) : '');
      setYearsExperience(profileQuery.data.yearsExperience != null ? String(profileQuery.data.yearsExperience) : '');
      setIsPublic(profileQuery.data.isPublic);
    }
  }, [profileQuery.data]);

  const saveMutation = trpc.marketplace.saveMyProfile.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      utils.marketplace.getMyProfile.invalidate();
      router.back();
    },
    onError: (error) => Alert.alert('Could not save', error.message),
  });

  const toggleSpecialty = useCallback((sport: SportKey) => {
    setSpecialties((prev) => (prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]));
  }, []);

  const handleSave = useCallback(() => {
    if (isPublic && specialties.length === 0) {
      Alert.alert('Add a specialty', 'Pick at least one sport before publishing your profile.');
      return;
    }
    saveMutation.mutate({
      bio: bio.trim() || undefined,
      specialties,
      hourlyRate: hourlyRate.trim() ? Number(hourlyRate) : undefined,
      yearsExperience: yearsExperience.trim() ? Number(yearsExperience) : undefined,
      isPublic,
    });
  }, [bio, specialties, hourlyRate, yearsExperience, isPublic, saveMutation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.publishRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.publishTitle}>Visible in Marketplace</Text>
            <Text style={styles.publishSub}>
              {isPublic ? 'Clients can find and book you' : 'Only you can see this profile'}
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ true: Colors.dark.accent, false: Colors.dark.border }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.label}>BIO</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell prospective clients about your coaching style, experience, results..."
          placeholderTextColor={Colors.dark.textTertiary}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>SPECIALTIES</Text>
        <View style={styles.sportRow}>
          {SPORTS.filter((s) => s.key !== 'general').map((s) => (
            <Pressable
              key={s.key}
              onPress={() => toggleSpecialty(s.key)}
              style={[styles.sportChip, specialties.includes(s.key) && styles.sportChipActive]}
            >
              <Text style={[styles.sportChipText, specialties.includes(s.key) && styles.sportChipTextActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>HOURLY RATE (optional, USD)</Text>
        <TextInput
          style={styles.input}
          value={hourlyRate}
          onChangeText={setHourlyRate}
          keyboardType="numeric"
          placeholder="e.g. 60"
          placeholderTextColor={Colors.dark.textTertiary}
        />

        <Text style={styles.label}>YEARS OF EXPERIENCE (optional)</Text>
        <TextInput
          style={styles.input}
          value={yearsExperience}
          onChangeText={setYearsExperience}
          keyboardType="numeric"
          placeholder="e.g. 5"
          placeholderTextColor={Colors.dark.textTertiary}
        />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleSave}
          disabled={saveMutation.isPending}
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
        >
          <Save color="#fff" size={18} />
          <Text style={styles.saveBtnText}>{saveMutation.isPending ? 'Saving...' : 'Save Profile'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  publishRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  publishTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  publishSub: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 18,
  },
  input: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '500' as const,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  bioInput: {
    minHeight: 110,
  },
  sportRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  sportChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sportChipActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  sportChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  sportChipTextActive: {
    color: '#fff',
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  saveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
