import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Heart,
  TrendingUp,
  Flame,
  Award,
  Dumbbell,
  Users,
  Zap,
  Play,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { MOCK_FRIENDS } from '@/mocks/social';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';

type TabType = 'feed' | 'friends' | 'trending';

const POST_ICONS = {
  workout: Dumbbell,
  pr: Award,
  streak: Flame,
  achievement: Award,
} as const;

const POST_COLORS = {
  workout: Colors.dark.accent,
  pr: Colors.dark.gold,
  streak: Colors.dark.success,
  achievement: Colors.dark.gold,
} as const;

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { socialFeed, toggleLikePost, allRoutines, startRoutineWorkout, selectedGymId, userId } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  const feedQuery = trpc.social.getFeed.useQuery(
    { gymId: selectedGymId ?? 'kabs', limit: 20 },
    { enabled: !!selectedGymId && activeTab === 'feed', staleTime: 30000 },
  );

  const trendingQuery = trpc.routines.getTrending.useQuery(
    { gymId: selectedGymId ?? 'kabs', limit: 10 },
    { enabled: !!selectedGymId && activeTab === 'trending', staleTime: 60000 },
  );

  const mergedFeed = useMemo(() => {
    if (feedQuery.data?.items && feedQuery.data.items.length > 0) {
      const backendPosts = feedQuery.data.items.map((p) => ({
        id: p.id,
        userName: p.userName,
        type: p.type as 'workout' | 'pr' | 'streak' | 'achievement',
        content: p.content,
        timestamp: new Date(p.timestamp).toLocaleString(),
        likes: p.likes,
        likedByUser: userId ? p.likedBy.includes(userId) : false,
        volume: p.volume,
        workoutId: p.workoutId,
      }));
      const localOnlyPosts = socialFeed.filter(
        (local) => !backendPosts.some((bp) => bp.id === local.id),
      );
      return [...localOnlyPosts, ...backendPosts];
    }
    return socialFeed;
  }, [feedQuery.data, socialFeed, userId]);

  const trendingRoutines = useMemo(() => {
    if (trendingQuery.data && trendingQuery.data.length > 0) {
      return trendingQuery.data.map((r) => ({
        id: r.id,
        name: r.name,
        exercises: r.exercises,
        isCoach: r.isCoach,
        coachName: r.creatorName,
        usageCount: r.usageCount,
      }));
    }
    return allRoutines
      .filter((r) => r.isCoach)
      .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
      .slice(0, 5);
  }, [trendingQuery.data, allRoutines]);

  const handleLike = useCallback((postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLikePost(postId);
  }, [toggleLikePost]);

  const handleStartTrending = useCallback((routine: typeof trendingRoutines[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startRoutineWorkout(routine);
    router.navigate('/(tabs)/workout' as any);
  }, [startRoutineWorkout, router]);

  const tabs: { key: TabType; label: string; icon: typeof Heart }[] = [
    { key: 'feed', label: 'Feed', icon: Zap },
    { key: 'friends', label: 'Friends', icon: Users },
    { key: 'trending', label: 'Trending', icon: TrendingUp },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Icon
                color={isActive ? Colors.dark.accent : Colors.dark.textTertiary}
                size={16}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'feed' && (
          <>
            {mergedFeed.length === 0 && (
              <View style={styles.emptyState}>
                <Zap color={Colors.dark.textTertiary} size={40} />
                <Text style={styles.emptyTitle}>No Posts Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Share your workouts from the History tab to see them here
                </Text>
              </View>
            )}
            {mergedFeed.map((post) => {
              const Icon = POST_ICONS[post.type] ?? Dumbbell;
              const iconColor = POST_COLORS[post.type] ?? Colors.dark.accent;
              return (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={[styles.postAvatar, { borderColor: iconColor }]}>
                      <Text style={styles.postAvatarText}>
                        {post.userName === 'You' ? '🏋️' : post.userName.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.postHeaderInfo}>
                      <View style={styles.postNameRow}>
                        <Text style={[
                          styles.postUserName,
                          post.userName === 'You' && { color: Colors.dark.accent },
                        ]}>
                          {post.userName}
                        </Text>
                        <View style={[styles.postTypeBadge, { backgroundColor: `${iconColor}20` }]}>
                          <Icon color={iconColor} size={12} />
                          <Text style={[styles.postTypeText, { color: iconColor }]}>
                            {post.type === 'pr' ? 'PR' : post.type === 'streak' ? 'Streak' : post.type === 'achievement' ? 'Badge' : 'Workout'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.postTimestamp}>{post.timestamp}</Text>
                    </View>
                  </View>
                  <Text style={styles.postContent}>{post.content}</Text>
                  {post.volume !== undefined && post.volume > 0 && (
                    <View style={styles.postVolume}>
                      <TrendingUp color={Colors.dark.accent} size={14} />
                      <Text style={styles.postVolumeText}>
                        {post.volume.toLocaleString()} kg volume
                      </Text>
                    </View>
                  )}
                  <View style={styles.postFooter}>
                    <Pressable
                      onPress={() => handleLike(post.id)}
                      style={styles.postLikes}
                      hitSlop={8}
                    >
                      <Heart
                        color={post.likedByUser ? '#EF4444' : Colors.dark.textTertiary}
                        size={16}
                        fill={post.likedByUser ? '#EF4444' : 'transparent'}
                      />
                      <Text style={[
                        styles.postLikeCount,
                        post.likedByUser && { color: '#EF4444' },
                      ]}>
                        {post.likes}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'friends' && (
          <View style={styles.friendsList}>
            {MOCK_FRIENDS.map((friend) => (
              <View key={friend.id} style={styles.friendRow}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>
                    {friend.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendStatus}>{friend.status}</Text>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    friend.status.includes('today') && styles.statusDotActive,
                  ]}
                />
              </View>
            ))}
          </View>
        )}

        {activeTab === 'trending' && (
          <View style={styles.trendingList}>
            {trendingRoutines.map((routine, idx) => (
              <View key={routine.id} style={styles.trendingCard}>
                <View style={styles.trendingRank}>
                  <Text style={styles.trendingRankText}>#{idx + 1}</Text>
                </View>
                <View style={styles.trendingInfo}>
                  <Text style={styles.trendingName}>{routine.name}</Text>
                  <Text style={styles.trendingCreator}>by {routine.coachName}</Text>
                  <Text style={styles.trendingMeta}>
                    {routine.exercises.length} exercises · {routine.exercises.reduce((s, e) => s + e.targetSets, 0)} sets
                  </Text>
                </View>
                <View style={styles.trendingActions}>
                  <Pressable
                    onPress={() => handleStartTrending(routine)}
                    style={styles.trendingStartBtn}
                    testID={`start-trending-${idx}`}
                  >
                    <Play color="#fff" size={14} fill="#fff" />
                  </Pressable>
                  {routine.usageCount !== undefined && (
                    <View style={styles.trendingUses}>
                      <Users color={Colors.dark.textTertiary} size={11} />
                      <Text style={styles.trendingUsesText}>{routine.usageCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
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
  tabBar: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.dark.card,
  },
  tabActive: {
    backgroundColor: Colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textTertiary,
  },
  tabTextActive: {
    color: Colors.dark.accent,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 60,
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
  postCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
  },
  postAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  postTypeBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  postTypeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  postTimestamp: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 21,
  },
  postVolume: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.dark.cardElevated,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  postVolumeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  postFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
  },
  postLikes: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  postLikeCount: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
  },
  friendsList: {
    gap: 8,
  },
  friendRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
  },
  friendAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  friendAvatarText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 14,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  friendStatus: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.textTertiary,
  },
  statusDotActive: {
    backgroundColor: Colors.dark.success,
  },
  trendingList: {
    gap: 8,
  },
  trendingCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
  },
  trendingRank: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  trendingRankText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.dark.accent,
  },
  trendingInfo: {
    flex: 1,
    marginLeft: 14,
  },
  trendingName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  trendingCreator: {
    fontSize: 12,
    color: Colors.dark.accent,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  trendingMeta: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  trendingActions: {
    alignItems: 'center' as const,
    gap: 6,
    marginLeft: 12,
  },
  trendingStartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  trendingUses: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
  },
  trendingUsesText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.dark.textTertiary,
  },
});
