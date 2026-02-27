import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, Plus, Check } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import Colors from '@/constants/colors';
import { MUSCLE_GROUPS } from '@/constants/exercises';
import { useApp } from '@/contexts/AppContext';

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { allExercises, addExerciseToWorkout, addCustomExercise } = useApp();

  const [search, setSearch] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  const filtered = useMemo(() => {
    let list = allExercises;
    if (selectedGroup !== 'All') {
      list = list.filter((e) => e.muscleGroup === selectedGroup);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return list;
  }, [allExercises, selectedGroup, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((ex) => {
      if (!groups[ex.muscleGroup]) groups[ex.muscleGroup] = [];
      groups[ex.muscleGroup].push(ex);
    });
    return groups;
  }, [filtered]);

  const handleSelect = (exercise: typeof allExercises[0]) => {
    if (mode === 'select') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      addExerciseToWorkout(exercise);
      router.back();
    }
  };

  const handleAddCustom = () => {
    Alert.prompt(
      'Add Custom Exercise',
      'Enter the exercise name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (name?: string) => {
            if (name && name.trim()) {
              const exercise = {
                id: `custom_${Date.now()}`,
                name: name.trim(),
                muscleGroup: selectedGroup === 'All' ? 'Other' : selectedGroup,
                isCustom: true,
              };
              addCustomExercise(exercise);
              if (mode === 'select') {
                addExerciseToWorkout(exercise);
                router.back();
              }
            }
          },
        },
      ],
      'plain-text',
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Search color={Colors.dark.textTertiary} size={18} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises..."
          placeholderTextColor={Colors.dark.textTertiary}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Pressable
          onPress={() => setSelectedGroup('All')}
          style={[styles.chip, selectedGroup === 'All' && styles.chipActive]}
        >
          <Text style={[styles.chipText, selectedGroup === 'All' && styles.chipTextActive]}>
            All
          </Text>
        </Pressable>
        {MUSCLE_GROUPS.map((group) => (
          <Pressable
            key={group}
            onPress={() => setSelectedGroup(group)}
            style={[styles.chip, selectedGroup === group && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedGroup === group && styles.chipTextActive]}>
              {group}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(grouped).map(([group, exercises]) => (
          <View key={group} style={styles.groupSection}>
            <Text style={styles.groupTitle}>{group}</Text>
            {exercises.map((exercise) => (
              <Pressable
                key={exercise.id}
                onPress={() => handleSelect(exercise)}
                style={({ pressed }) => [
                  styles.exerciseRow,
                  mode === 'select' && pressed && styles.exerciseRowPressed,
                ]}
                disabled={mode !== 'select'}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {exercise.isCustom && (
                    <View style={styles.customBadge}>
                      <Text style={styles.customBadgeText}>CUSTOM</Text>
                    </View>
                  )}
                </View>
                {mode === 'select' && (
                  <View style={styles.selectIcon}>
                    <Plus color={Colors.dark.accent} size={18} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        ))}

        <Pressable
          onPress={handleAddCustom}
          style={styles.addCustomBtn}
        >
          <Plus color={Colors.dark.accent} size={18} />
          <Text style={styles.addCustomText}>Add Custom Exercise</Text>
        </Pressable>
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
  searchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.dark.card,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
    paddingVertical: 14,
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  chipActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  groupSection: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  },
  exerciseRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  exerciseRowPressed: {
    opacity: 0.7,
    backgroundColor: Colors.dark.cardElevated,
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.dark.text,
  },
  customBadge: {
    backgroundColor: Colors.dark.cardElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
    letterSpacing: 0.5,
  },
  selectIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addCustomBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed' as const,
  },
  addCustomText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
});
