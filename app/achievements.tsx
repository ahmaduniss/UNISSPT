import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function AchievementsScreen() {
  const { achievements } = useApp();

  const unlocked = useMemo(() => achievements.filter((a) => a.unlockedAt), [achievements]);
  const locked = useMemo(() => achievements.filter((a) => !a.unlockedAt), [achievements]);

  const categories = ['sessions', 'volume', 'streak', 'social', 'competition'] as const;
  const categoryLabels: Record<string, string> = {
    sessions: 'Workout Milestones',
    volume: 'Volume Goals',
    streak: 'Consistency',
    social: 'Community',
    competition: 'Competitions',
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{unlocked.length}</Text>
            <Text style={styles.summaryLabel}>Unlocked</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: Colors.dark.textTertiary }]}>
              {locked.length}
            </Text>
            <Text style={styles.summaryLabel}>Remaining</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: Colors.dark.accent }]}>
              {achievements.length}
            </Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>

        {categories.map((cat) => {
          const items = achievements.filter((a) => a.category === cat);
          if (items.length === 0) return null;
          return (
            <View key={cat} style={styles.section}>
              <Text style={styles.sectionTitle}>{categoryLabels[cat]}</Text>
              {items.map((achievement) => {
                const isUnlocked = !!achievement.unlockedAt;
                return (
                  <View
                    key={achievement.id}
                    style={[
                      styles.achievementCard,
                      isUnlocked && styles.achievementCardUnlocked,
                    ]}
                  >
                    <View style={[styles.iconContainer, isUnlocked && styles.iconContainerUnlocked]}>
                      <Text style={styles.iconText}>{achievement.icon}</Text>
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={[styles.achievementTitle, !isUnlocked && styles.lockedText]}>
                        {achievement.title}
                      </Text>
                      <Text style={styles.achievementDescription}>
                        {achievement.description}
                      </Text>
                      {isUnlocked && achievement.unlockedAt && (
                        <Text style={styles.unlockedDate}>
                          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      )}
                    </View>
                    {isUnlocked ? (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkBadgeText}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.lockBadge}>
                        <Text style={styles.lockBadgeText}>🔒</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
        <View style={{ height: 40 }} />
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
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center' as const,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center' as const,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.dark.border,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.success,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  achievementCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.border,
  },
  achievementCardUnlocked: {
    borderLeftColor: Colors.dark.success,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    opacity: 0.4,
  },
  iconContainerUnlocked: {
    opacity: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  iconText: {
    fontSize: 22,
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 14,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  lockedText: {
    color: Colors.dark.textSecondary,
  },
  achievementDescription: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  unlockedDate: {
    fontSize: 11,
    color: Colors.dark.success,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.success,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
  checkBadgeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700' as const,
  },
  lockBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
  lockBadgeText: {
    fontSize: 14,
  },
});
