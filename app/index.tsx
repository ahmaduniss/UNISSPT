import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Dumbbell, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function WelcomeScreen() {
  const router = useRouter();

  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { isOnboarded, isLoading, isAuthenticated } = useApp();

  useEffect(() => {
    if (!isLoading && isAuthenticated && isOnboarded) {
      router.replace('/(tabs)/home' as any);
    } else if (!isLoading && isAuthenticated && !isOnboarded) {
      router.replace('/gym-select' as any);
    } else if (!isLoading && !isAuthenticated) {
      // Stay on welcome, user will tap to go to login
    }
  }, [isLoading, isOnboarded, isAuthenticated]);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  if (isLoading || (isAuthenticated && isOnboarded)) {
    return <View style={styles.container} />;
  }

  const handleGetStarted = () => {
    router.push('/login' as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0f00', '#0B0B0F', '#0B0B0F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <View style={styles.decorTop}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.decorLine,
              {
                opacity: 0.03 + i * 0.015,
                top: 60 + i * 35,
                transform: [{ rotate: '-12deg' }, { scaleX: 1.5 }],
              },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + 40,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[Colors.dark.accent, Colors.dark.accentDark]}
            style={styles.iconBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Dumbbell color="#fff" size={36} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>UNISS</Text>
        <Text style={styles.subtitle}>MULTI-GYM WORKOUT PLATFORM</Text>

        <View style={styles.divider} />

        <Text style={styles.description}>
          Track your lifts. Compete with your gym.{'\n'}Get stronger every session.
        </Text>

        <View style={styles.features}>
          {['Real-time workout tracking', 'Gym leaderboards & competition', 'AI-powered progress insights'].map(
            (feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ),
          )}
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomSection,
          {
            paddingBottom: insets.bottom + 24,
            opacity: buttonAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Pressable
          onPress={handleGetStarted}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          testID="get-started-button"
        >
          <LinearGradient
            colors={[Colors.dark.accent, Colors.dark.accentDark]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>GET STARTED</Text>
            <ChevronRight color="#fff" size={20} />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  decorTop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'hidden' as const,
  },
  decorLine: {
    position: 'absolute' as const,
    left: -50,
    right: -50,
    height: 1,
    backgroundColor: Colors.dark.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 28,
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: {
    fontSize: 52,
    fontWeight: '900' as const,
    color: Colors.dark.text,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
    letterSpacing: 3,
    marginTop: 8,
  },
  divider: {
    width: 48,
    height: 3,
    backgroundColor: Colors.dark.accent,
    marginTop: 28,
    marginBottom: 20,
    borderRadius: 2,
  },
  description: {
    fontSize: 17,
    color: Colors.dark.textSecondary,
    lineHeight: 26,
  },
  features: {
    marginTop: 36,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.accent,
  },
  featureText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  bottomSection: {
    paddingHorizontal: 32,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 18,
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 2,
  },
});
