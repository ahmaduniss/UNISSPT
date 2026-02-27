import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MapPin, Lock, ChevronRight, User } from 'lucide-react-native';
import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { GYMS } from '@/constants/exercises';
import { useApp } from '@/contexts/AppContext';

export default function GymSelectScreen() {
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const [selectedGym, setSelectedGym] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSelectGym = (gymId: string, active: boolean) => {
    if (!active) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedGym(gymId);
  };

  const handleContinue = () => {
    if (!selectedGym) return;
    const gym = GYMS.find((g) => g.id === selectedGym);
    if (gym) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeOnboarding(gym.name, gym.id, displayName.trim() || undefined);
      router.replace('/(tabs)/home' as any);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
      <LinearGradient
        colors={['#1a0f00', '#0B0B0F', '#0B0B0F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.stepLabel}>GET STARTED</Text>
        <Text style={styles.title}>Join UNISS</Text>
        <Text style={styles.subtitle}>Enter your name and choose your gym</Text>

        <View style={styles.nameInputContainer}>
          <User color={Colors.dark.textTertiary} size={18} />
          <TextInput
            style={styles.nameInput}
            placeholder="Your display name"
            placeholderTextColor={Colors.dark.textTertiary}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            returnKeyType="done"
            testID="display-name-input"
          />
        </View>

        <View style={styles.gymList}>
          {GYMS.map((gym) => {
            const isSelected = selectedGym === gym.id;
            return (
              <Pressable
                key={gym.id}
                onPress={() => handleSelectGym(gym.id, gym.active)}
                style={({ pressed }) => [
                  styles.gymCard,
                  isSelected && styles.gymCardSelected,
                  !gym.active && styles.gymCardDisabled,
                  pressed && gym.active && styles.gymCardPressed,
                ]}
                testID={`gym-${gym.id}`}
              >
                <View style={styles.gymLeft}>
                  <View style={[styles.gymIcon, isSelected && styles.gymIconSelected]}>
                    {gym.active ? (
                      <MapPin color={isSelected ? '#fff' : Colors.dark.textTertiary} size={20} />
                    ) : (
                      <Lock color={Colors.dark.textTertiary} size={18} />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.gymName, !gym.active && styles.gymNameDisabled]}>
                      {gym.name}
                    </Text>
                    <Text style={styles.gymLocation}>{gym.location}</Text>
                  </View>
                </View>
                {!gym.active && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>COMING SOON</Text>
                  </View>
                )}
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <View style={styles.selectedDot} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      <View style={styles.bottomSection}>
        <Pressable
          onPress={handleContinue}
          disabled={!selectedGym}
          style={({ pressed }) => [
            styles.continueButton,
            !selectedGym && styles.continueButtonDisabled,
            pressed && selectedGym ? styles.continueButtonPressed : null,
          ]}
          testID="continue-button"
        >
          <LinearGradient
            colors={selectedGym ? [Colors.dark.accent, Colors.dark.accentDark] : ['#333', '#222']}
            style={styles.continueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.continueText, !selectedGym && styles.continueTextDisabled]}>
              CONTINUE
            </Text>
            <ChevronRight color={selectedGym ? '#fff' : '#666'} size={20} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginBottom: 32,
  },
  gymList: {
    gap: 12,
  },
  gymCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gymCardSelected: {
    borderColor: Colors.dark.accent,
    backgroundColor: '#1C1508',
  },
  gymCardDisabled: {
    opacity: 0.5,
  },
  gymCardPressed: {
    opacity: 0.8,
  },
  gymLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  gymIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  gymIconSelected: {
    backgroundColor: Colors.dark.accent,
  },
  gymName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    letterSpacing: 0.5,
  },
  gymNameDisabled: {
    color: Colors.dark.textTertiary,
  },
  gymLocation: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  comingSoonBadge: {
    backgroundColor: Colors.dark.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  selectedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.dark.accent,
  },
  bottomSection: {
    paddingTop: 16,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  continueGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 18,
    gap: 8,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 2,
  },
  continueTextDisabled: {
    color: '#666',
  },
  nameInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    paddingVertical: 14,
    fontWeight: '500' as const,
  },
});
