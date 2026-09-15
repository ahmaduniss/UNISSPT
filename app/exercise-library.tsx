import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, Plus, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
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
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState<string>('');

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
    setNewExerciseName('');
    setAddModalVisible(true);
  };

  const handleSubmitCustom = () => {
    const name = newExerciseName.trim();
    if (!name) return;
    const exercise = {
      id: `custom_${Date.now()}`,
      name,
      muscleGroup: selectedGroup === 'All' ? 'Other' : selectedGroup,
      isCustom: true,
    };
    addCustomExercise(exercise);
    setAddModalVisible(false);
    if (mode === 'select') {
      addExerciseToWorkout(exercise);
      router.back();
    }
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

      <View style={styles.filterGrid}>
        {(['All', ...MUSCLE_GROUPS] as string[]).map((group) => (
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
      </View>

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

      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Exercise</Text>
              <Pressable onPress={() => setAddModalVisible(false)} hitSlop={8}>
                <X color={Colors.dark.textTertiary} size={20} />
              </Pressable>
            </View>
            <TextInput
              style={styles.modalInput}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder="Exercise name"
              placeholderTextColor={Colors.dark.textTertiary}
              autoFocus
              onSubmitEditing={handleSubmitCustom}
              returnKeyType="done"
            />
            <Pressable
              onPress={handleSubmitCustom}
              style={({ pressed }) => [styles.modalSaveBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.modalSaveBtnText}>Add Exercise</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  filterGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  chip: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  chipActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    textAlign: 'center' as const,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.dark.overlay,
    justifyContent: 'flex-end' as const,
  },
  modalSheet: {
    backgroundColor: Colors.dark.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  modalInput: {
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '500' as const,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalSaveBtn: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 20,
  },
  modalSaveBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
