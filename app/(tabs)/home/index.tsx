import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Zap,
  BookOpen,
  TrendingUp,
  Repeat,
  Sparkles,
  BarChart3,
  Award,
  Target,
  Check,
  User,
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    selectedGym,
    workoutHistory,
    weeklyVolume,
    weeklyWorkouts,
    startFreestyleWorkout,
    repeatWorkout,
    competitions,
    achievements,
    currentStreak,
  } = useApp();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const recentWorkouts = useMemo(() => {
    return workoutHistory.slice(0, 2);
  }, [workoutHistory]);

  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => a.unlockedAt).length;
  }, [achievements]);

  const aiInsight = useMemo(() => {
    if (workoutHistory.length === 0) {
      return "Start your first workout to unlock AI-powered insights about your training!";
    }
    if (workoutHistory.length < 3) {
      return `You've completed ${workoutHistory.length} workout${workoutHistory.length > 1 ? 's' : ''}. Keep going — after 3 sessions, I'll start analyzing your progress patterns.`;
    }
    const totalVol = workoutHistory.reduce((s, w) => s + w.totalVolume, 0);
    return `You've lifted ${(totalVol / 1000).toFixed(1)}t total across ${workoutHistory.length} sessions. Your consistency is building real momentum — keep pushing!`;
  }, [workoutHistory]);

  const handleStartFreestyle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startFreestyleWorkout('Freestyle Session');
    router.navigate('/(tabs)/workout' as any);
  }, [startFreestyleWorkout, router]);

  const handleRepeatWorkout = useCallback((workout: typeof workoutHistory[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    repeatWorkout(workout);
    router.navigate('/(tabs)/workout' as any);
  }, [repeatWorkout, router]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toString();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.gymName}>{selectedGym ?? 'UNISS'}</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/profile' as any);
              }}
              style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] }]}
              testID="profile-button"
            >
              <User color={Colors.dark.text} size={20} />
            </Pressable>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statValue}>{weeklyWorkouts}</Text>
              <Text style={styles.statLabel}>this week</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statValue}>{formatVolume(weeklyVolume)}</Text>
              <Text style={styles.statLabel}>kg lifted</Text>
            </View>
            {currentStreak > 0 && (
              <View style={[styles.statBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>{currentStreak}</Text>
                <Text style={styles.statLabel}>streak</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.quickActions}>
          <Pressable
            onPress={handleStartFreestyle}
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            testID="start-freestyle"
          >
            <LinearGradient
              colors={[Colors.dark.accent, '#C2410C']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Zap color="#fff" size={24} />
              <Text style={styles.actionTitle}>Start Freestyle</Text>
              <Text style={styles.actionSub}>Empty session, add as you go</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.push('/routines' as any)}
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            testID="browse-routines"
          >
            <View style={styles.actionSecondary}>
              <BookOpen color={Colors.dark.accent} size={24} />
              <Text style={styles.actionTitle2}>Browse Routines</Text>
              <Text style={styles.actionSub2}>Saved & coach templates</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.shortcutsRow}>
          <Pressable
            onPress={() => router.push('/analytics' as any)}
            style={({ pressed }) => [styles.shortcutBtn, pressed && { opacity: 0.7 }]}
          >
            <BarChart3 color={Colors.dark.accent} size={18} />
            <Text style={styles.shortcutText}>Analytics</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/achievements' as any)}
            style={({ pressed }) => [styles.shortcutBtn, pressed && { opacity: 0.7 }]}
          >
            <Award color={Colors.dark.gold} size={18} />
            <Text style={styles.shortcutText}>{unlockedCount} Badges</Text>
          </Pressable>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Sparkles color={Colors.dark.accent} size={18} />
            <Text style={styles.insightLabel}>AI INSIGHT</Text>
          </View>
          <Text style={styles.insightText}>{aiInsight}</Text>
        </View>

        {competitions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Target color={Colors.dark.accent} size={18} />
                <Text style={styles.sectionTitle}>Daily Challenges</Text>
              </View>
            </View>
            {competitions.map((comp) => {
              const progress = comp.target ? Math.min(comp.userProgress / comp.target, 1) : 0;
              return (
                <View key={comp.id} style={styles.compCard}>
                  <View style={styles.compHeader}>
                    <View style={styles.compTitleRow}>
                      <Text style={styles.compTitle}>{comp.title}</Text>
                      {comp.isCompleted && (
                        <View style={styles.compCompletedBadge}>
                          <Check color="#fff" size={12} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.compDesc}>{comp.description}</Text>
                  </View>
                  <View style={styles.compProgressTrack}>
                    <View
                      style={[
                        styles.compProgressFill,
                        { width: `${progress * 100}%` as unknown as number },
                        comp.isCompleted && styles.compProgressCompleted,
                      ]}
                    />
                  </View>
                  <Text style={styles.compProgressText}>
                    {comp.userProgress}{comp.target ? ` / ${comp.target}` : ''}{' '}
                    {comp.type === 'daily_volume' ? 'kg' : comp.type === 'daily_sets' ? 'sets' : 'min'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {recentWorkouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TrendingUp color={Colors.dark.accent} size={18} />
                <Text style={styles.sectionTitle}>Recent Sessions</Text>
              </View>
            </View>
            {recentWorkouts.map((workout) => (
              <View key={workout.id} style={styles.recentCard}>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{workout.name}</Text>
                  <Text style={styles.recentMeta}>
                    {formatDate(workout.date)} · {formatDuration(workout.duration)} · {formatVolume(workout.totalVolume)} kg
                  </Text>
                  <Text style={styles.recentExercises}>
                    {workout.exercises.map((e) => e.exerciseName).join(', ')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleRepeatWorkout(workout)}
                  style={styles.repeatBtn}
                  hitSlop={8}
                >
                  <Repeat color={Colors.dark.accent} size={18} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  gymName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    letterSpacing: 1,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 16,
  },
  statBadge: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
  },
  quickActions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 14,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  actionCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  actionGradient: {
    padding: 20,
    minHeight: 130,
    justifyContent: 'flex-end' as const,
    gap: 6,
  },
  actionSecondary: {
    padding: 20,
    minHeight: 130,
    justifyContent: 'flex-end' as const,
    gap: 6,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  actionSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  actionTitle2: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  actionSub2: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  shortcutsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 20,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  shortcutText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  insightCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.accent,
  },
  insightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
    letterSpacing: 1.5,
  },
  insightText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 21,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  compCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  compHeader: {
    marginBottom: 10,
  },
  compTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  compTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  compCompletedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.success,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  compDesc: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  compProgressTrack: {
    height: 6,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  compProgressFill: {
    height: '100%' as const,
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
  },
  compProgressCompleted: {
    backgroundColor: Colors.dark.success,
  },
  compProgressText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    marginTop: 6,
  },
  miniLeaderboard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  miniLeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  miniLeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  miniLeaderRank: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.dark.textSecondary,
    width: 28,
  },
  miniLeaderName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  miniLeaderVolume: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  viewAllBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    marginTop: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  recentCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  recentMeta: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 3,
  },
  recentExercises: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  repeatBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 12,
  },
  adminBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 52, 96, 0.4)',
    gap: 12,
  },
  adminBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0f3460',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  adminBannerText: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  adminBannerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  adminBannerSubtitle: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  switchBackBtn: {
    alignItems: 'center' as const,
    paddingVertical: 8,
    marginBottom: 16,
  },
  switchBackText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
});
