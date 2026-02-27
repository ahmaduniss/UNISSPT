import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Users,
  Trophy,
  BarChart3,
  Bell,
  Shield,
  TrendingUp,
  UserPlus,
  Dumbbell,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Megaphone,
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedGym, selectedGymId, userName } = useApp();

  const dashboardQuery = trpc.admin.getDashboard.useQuery(
    { gymId: selectedGymId ?? 'kabs' },
    { enabled: !!selectedGymId, staleTime: 30000 },
  );

  const notificationsQuery = trpc.admin.getNotifications.useQuery(
    { gymId: selectedGymId ?? 'kabs' },
    { enabled: !!selectedGymId, staleTime: 15000 },
  );

  const unreadCount = useMemo(() => {
    return notificationsQuery.data?.filter((n) => !n.read).length ?? 0;
  }, [notificationsQuery.data]);

  const recentNotifications = useMemo(() => {
    return (notificationsQuery.data ?? []).slice(0, 3);
  }, [notificationsQuery.data]);

  const dashboard = dashboardQuery.data;

  const handleNavigate = useCallback((route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  }, [router]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'verification_request': return <AlertCircle color="#EAB308" size={18} />;
      case 'new_member': return <UserPlus color={Colors.dark.success} size={18} />;
      case 'competition_complete': return <Trophy color={Colors.dark.gold} size={18} />;
      default: return <Bell color={Colors.dark.accent} size={18} />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (dashboardQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBanner}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            style={styles.bannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerLeft}>
                <View style={styles.adminBadge}>
                  <Shield color="#fff" size={14} />
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
                <Text style={styles.bannerTitle}>{selectedGym ?? 'Gym'}</Text>
                <Text style={styles.bannerSubtitle}>Welcome back, {userName ?? 'Coach'}</Text>
              </View>
              <Pressable
                onPress={() => handleNavigate('/admin-notifications')}
                style={styles.bellBtn}
              >
                <Bell color="#fff" size={22} />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: 'rgba(34, 197, 94, 0.08)' }]}>
            <Users color={Colors.dark.success} size={20} />
            <Text style={styles.statNumber}>{dashboard?.totalMembers ?? 0}</Text>
            <Text style={styles.statDesc}>Total Members</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(249, 115, 22, 0.08)' }]}>
            <TrendingUp color={Colors.dark.accent} size={20} />
            <Text style={styles.statNumber}>{dashboard?.activeToday ?? 0}</Text>
            <Text style={styles.statDesc}>Active Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
            <Dumbbell color="#3B82F6" size={20} />
            <Text style={styles.statNumber}>{dashboard?.totalWorkoutsToday ?? 0}</Text>
            <Text style={styles.statDesc}>Workouts Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(234, 179, 8, 0.08)' }]}>
            <Trophy color={Colors.dark.gold} size={20} />
            <Text style={styles.statNumber}>{dashboard?.activeCompetitions ?? 0}</Text>
            <Text style={styles.statDesc}>Competitions</Text>
          </View>
        </View>

        {(dashboard?.pendingVerifications ?? 0) > 0 && (
          <Pressable
            onPress={() => handleNavigate('/admin-competitions')}
            style={({ pressed }) => [styles.alertBanner, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.alertLeft}>
              <AlertCircle color="#EAB308" size={20} />
              <View>
                <Text style={styles.alertTitle}>{dashboard?.pendingVerifications} Pending Verifications</Text>
                <Text style={styles.alertSubtitle}>Tap to review competition completions</Text>
              </View>
            </View>
            <ChevronRight color={Colors.dark.textTertiary} size={18} />
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Pressable
              onPress={() => handleNavigate('/admin-members')}
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
              testID="admin-members"
            >
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
                <Users color={Colors.dark.success} size={22} />
              </View>
              <Text style={styles.actionLabel}>Members</Text>
              <Text style={styles.actionSublabel}>{dashboard?.totalMembers ?? 0} total</Text>
            </Pressable>

            <Pressable
              onPress={() => handleNavigate('/admin-competitions')}
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
              testID="admin-competitions"
            >
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]}>
                <Trophy color={Colors.dark.gold} size={22} />
              </View>
              <Text style={styles.actionLabel}>Competitions</Text>
              <Text style={styles.actionSublabel}>Manage & verify</Text>
            </Pressable>

            <Pressable
              onPress={() => handleNavigate('/admin-analytics')}
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
              testID="admin-analytics"
            >
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <BarChart3 color="#3B82F6" size={22} />
              </View>
              <Text style={styles.actionLabel}>Analytics</Text>
              <Text style={styles.actionSublabel}>Gym insights</Text>
            </Pressable>

            <Pressable
              onPress={() => handleNavigate('/admin-announce')}
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
              testID="admin-announce"
            >
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
                <Megaphone color={Colors.dark.accent} size={22} />
              </View>
              <Text style={styles.actionLabel}>Announce</Text>
              <Text style={styles.actionSublabel}>Send updates</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{dashboard?.memberRetention ?? 0}%</Text>
              <Text style={styles.metricLabel}>Retention Rate</Text>
              <View style={styles.metricBar}>
                <View style={[styles.metricBarFill, { width: `${dashboard?.memberRetention ?? 0}%` as any, backgroundColor: Colors.dark.success }]} />
              </View>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{dashboard?.newMembersThisWeek ?? 0}</Text>
              <Text style={styles.metricLabel}>New This Week</Text>
              <View style={styles.metricBar}>
                <View style={[styles.metricBarFill, { width: '60%' as any, backgroundColor: '#3B82F6' }]} />
              </View>
            </View>
          </View>
        </View>

        {recentNotifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            {recentNotifications.map((notif) => (
              <View
                key={notif.id}
                style={[styles.notifCard, !notif.read && styles.notifUnread]}
              >
                <View style={styles.notifIcon}>
                  {getNotificationIcon(notif.type)}
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                  <View style={styles.notifTime}>
                    <Clock color={Colors.dark.textTertiary} size={12} />
                    <Text style={styles.notifTimeText}>{formatTimeAgo(notif.timestamp)}</Text>
                  </View>
                </View>
                {!notif.read && <View style={styles.notifDot} />}
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
  centered: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerBanner: {
    marginHorizontal: -20,
    marginBottom: 20,
  },
  bannerGradient: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  bannerContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  bannerLeft: {
    flex: 1,
  },
  adminBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start' as const,
    marginBottom: 12,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 1.5,
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  bellBadge: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%' as any,
    flexBasis: '48%' as any,
    flexGrow: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    marginTop: 8,
  },
  statDesc: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  alertBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    marginBottom: 24,
  },
  alertLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#EAB308',
  },
  alertSubtitle: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  actionCard: {
    width: '48%' as any,
    flexBasis: '48%' as any,
    flexGrow: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  actionSublabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 3,
  },
  metricsRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
    marginTop: 4,
    marginBottom: 10,
  },
  metricBar: {
    height: 4,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  metricBarFill: {
    height: '100%' as const,
    borderRadius: 2,
  },
  notifCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  notifUnread: {
    borderColor: 'rgba(249, 115, 22, 0.2)',
    backgroundColor: 'rgba(249, 115, 22, 0.04)',
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  notifMessage: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  notifTime: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 6,
  },
  notifTimeText: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.accent,
    alignSelf: 'center' as const,
  },
});
