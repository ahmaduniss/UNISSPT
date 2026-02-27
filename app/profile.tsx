import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  MapPin,
  Dumbbell,
  Flame,
  TrendingUp,
  Award,
  BarChart3,
  ChevronRight,
  LogOut,
  Settings,
  Crown,
  Calendar,
  Weight,
} from 'lucide-react-native';
import React, { useMemo, useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    userName,
    authEmail,
    selectedGym,
    workoutHistory,
    weeklyVolume,
    weeklyWorkouts,
    currentStreak,
    achievements,
    analyticsData,
    userRole,
    logout,
  } = useApp();

  const unlockedAchievements = useMemo(() => {
    return achievements.filter((a) => a.unlockedAt).length;
  }, [achievements]);

  const totalAchievements = achievements.length;

  const memberSince = useMemo(() => {
    if (workoutHistory.length === 0) return 'New member';
    const oldest = workoutHistory[workoutHistory.length - 1];
    const d = new Date(oldest.date);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [workoutHistory]);

  const totalVolume = useMemo(() => {
    return workoutHistory.reduce((s, w) => s + w.totalVolume, 0);
  }, [workoutHistory]);

  const totalDuration = useMemo(() => {
    const secs = workoutHistory.reduce((s, w) => s + w.duration, 0);
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }, [workoutHistory]);

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toString();
  };

  const initials = useMemo(() => {
    const name = userName ?? 'A';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [userName]);

  const roleBadgeColor = useMemo(() => {
    if (userRole === 'admin') return '#EF4444';
    if (userRole === 'coach') return '#3B82F6';
    return Colors.dark.accent;
  }, [userRole]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            logout();
            router.replace('/login');
          },
        },
      ],
    );
  }, [logout, router]);

  const statsGrid = useMemo(() => [
    {
      label: 'Workouts',
      value: workoutHistory.length.toString(),
      icon: Dumbbell,
      color: Colors.dark.accent,
    },
    {
      label: 'Streak',
      value: `${currentStreak}d`,
      icon: Flame,
      color: '#EF4444',
    },
    {
      label: 'Total Volume',
      value: `${formatVolume(totalVolume)} kg`,
      icon: Weight,
      color: '#22C55E',
    },
    {
      label: 'Time Trained',
      value: totalDuration,
      icon: Calendar,
      color: '#8B5CF6',
    },
  ], [workoutHistory.length, currentStreak, totalVolume, totalDuration]);

  const menuItems = useMemo(() => [
    {
      label: 'Analytics',
      icon: BarChart3,
      color: Colors.dark.accent,
      onPress: () => router.push('/analytics' as any),
    },
    {
      label: 'Achievements',
      icon: Award,
      color: Colors.dark.gold,
      badge: `${unlockedAchievements}/${totalAchievements}`,
      onPress: () => router.push('/achievements' as any),
    },
    {
      label: 'My Routines',
      icon: TrendingUp,
      color: '#22C55E',
      onPress: () => router.push('/routines' as any),
    },
  ], [router, unlockedAchievements, totalAchievements]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#1A1A2E', '#0B0B0F']}
          style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[Colors.dark.accent, '#C2410C']}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <View style={[styles.roleBadge, { backgroundColor: roleBadgeColor }]}>
              <Crown color="#fff" size={10} />
              <Text style={styles.roleBadgeText}>{userRole.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.displayName}>{userName ?? 'Athlete'}</Text>

          <View style={styles.infoRow}>
            {authEmail && (
              <View style={styles.infoItem}>
                <Mail color={Colors.dark.textTertiary} size={13} />
                <Text style={styles.infoText}>{authEmail}</Text>
              </View>
            )}
            {selectedGym && (
              <View style={styles.infoItem}>
                <MapPin color={Colors.dark.textTertiary} size={13} />
                <Text style={styles.infoText}>{selectedGym}</Text>
              </View>
            )}
          </View>

          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.thisWeekCard}>
            <Text style={styles.thisWeekLabel}>THIS WEEK</Text>
            <View style={styles.thisWeekRow}>
              <View style={styles.thisWeekStat}>
                <Text style={styles.thisWeekValue}>{weeklyWorkouts}</Text>
                <Text style={styles.thisWeekUnit}>sessions</Text>
              </View>
              <View style={styles.thisWeekDivider} />
              <View style={styles.thisWeekStat}>
                <Text style={styles.thisWeekValue}>{formatVolume(weeklyVolume)}</Text>
                <Text style={styles.thisWeekUnit}>kg lifted</Text>
              </View>
              <View style={styles.thisWeekDivider} />
              <View style={styles.thisWeekStat}>
                <Text style={styles.thisWeekValue}>{analyticsData.avgDuration > 0 ? `${analyticsData.avgDuration}` : '—'}</Text>
                <Text style={styles.thisWeekUnit}>avg min</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {statsGrid.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <stat.icon color={stat.color} size={18} />
                </View>
                <Text style={styles.statCardValue}>{stat.value}</Text>
                <Text style={styles.statCardLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {analyticsData.personalRecords.length > 0 && (
            <View style={styles.prSection}>
              <Text style={styles.sectionTitle}>Personal Records</Text>
              <View style={styles.prList}>
                {analyticsData.personalRecords.slice(0, 4).map((pr, idx) => (
                  <View key={idx} style={styles.prItem}>
                    <View style={styles.prLeft}>
                      <View style={[styles.prRank, idx === 0 && { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                        <Text style={[styles.prRankText, idx === 0 && { color: Colors.dark.gold }]}>
                          {idx + 1}
                        </Text>
                      </View>
                      <Text style={styles.prName} numberOfLines={1}>{pr.exercise}</Text>
                    </View>
                    <Text style={styles.prWeight}>{pr.weight} kg × {pr.reps}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.menuSection}>
            {menuItems.map((item, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  item.onPress();
                }}
                style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
                testID={`profile-menu-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                  <item.icon color={item.color} size={18} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <View style={styles.menuRight}>
                  {item.badge && (
                    <Text style={styles.menuBadge}>{item.badge}</Text>
                  )}
                  <ChevronRight color={Colors.dark.textTertiary} size={16} />
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
            testID="profile-logout"
          >
            <LogOut color={Colors.dark.danger} size={18} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: 'center' as const,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginBottom: 14,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  roleBadge: {
    position: 'absolute' as const,
    bottom: -4,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.8,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
  },
  memberSince: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 8,
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  thisWeekCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  thisWeekLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  thisWeekRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
  },
  thisWeekStat: {
    alignItems: 'center' as const,
  },
  thisWeekValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  thisWeekUnit: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  thisWeekDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.dark.border,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: '48%' as any,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    flexGrow: 1,
    flexBasis: '46%' as any,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  statCardLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  prSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  prList: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  prItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  prLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  prRank: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  prRankText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
  },
  prName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    flex: 1,
  },
  prWeight: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
  },
  menuSection: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    overflow: 'hidden' as const,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    flex: 1,
  },
  menuRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  menuBadge: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.textTertiary,
  },
  logoutBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.danger,
  },
});
