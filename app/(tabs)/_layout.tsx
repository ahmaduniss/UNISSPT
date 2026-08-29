import { Tabs, useRouter } from 'expo-router';
import { Users, BookOpen, User, Dumbbell, ChevronRight, Inbox } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';

function ActiveWorkoutBanner({ bottom }: { bottom: number }) {
  const { activeWorkout } = useApp();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(80)).current;
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeWorkout ? 0 : 80,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [activeWorkout]);

  useEffect(() => {
    if (!activeWorkout) return;
    const tick = () => {
      const secs = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setElapsed(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeWorkout]);

  if (!activeWorkout) return null;

  return (
    <Animated.View
      style={[styles.bannerWrap, { bottom: bottom + 8, transform: [{ translateY: slideAnim }] }]}
      pointerEvents="box-none"
    >
      <Pressable
        style={({ pressed }) => [styles.banner, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        onPress={() => router.navigate('/(tabs)/workout' as any)}
      >
        <View style={styles.bannerPulse}>
          <View style={styles.bannerDot} />
        </View>
        <Dumbbell color="#fff" size={16} />
        <Text style={styles.bannerName} numberOfLines={1}>
          {activeWorkout.clientName} · {activeWorkout.name}
        </Text>
        <Text style={styles.bannerTime}>{elapsed}</Text>
        <ChevronRight color="rgba(255,255,255,0.5)" size={16} />
      </Pressable>
    </Animated.View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 49 + insets.bottom;

  const incomingRequestsQuery = trpc.bookings.incomingRequests.useQuery();
  const pendingCount = useMemo(
    () => (incomingRequestsQuery.data ?? []).filter((r) => r.status === 'pending').length,
    [incomingRequestsQuery.data],
  );

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.dark.accent,
          tabBarInactiveTintColor: Colors.dark.textTertiary,
          tabBarStyle: {
            backgroundColor: Colors.dark.tabBar,
            borderTopColor: Colors.dark.border,
            borderTopWidth: 0.5,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600' as const,
            letterSpacing: 0.3,
          },
        }}
      >
        <Tabs.Screen
          name="clients"
          options={{
            title: 'Clients',
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: 'Requests',
            tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />,
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          }}
        />
        <Tabs.Screen
          name="routines"
          options={{
            title: 'Routines',
            tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="workout"
          options={{ href: null }}
        />
      </Tabs>

      <ActiveWorkoutBanner bottom={TAB_BAR_HEIGHT} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bannerWrap: {
    position: 'absolute' as const,
    left: 12,
    right: 12,
    zIndex: 999,
  },
  banner: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerPulse: {
    width: 10,
    height: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    opacity: 0.9,
  },
  bannerName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  bannerTime: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums' as const],
  },
});
