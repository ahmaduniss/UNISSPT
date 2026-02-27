import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Save,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { DEFAULT_EXERCISES, MUSCLE_GROUPS } from '@/constants/exercises';
import { useApp } from '@/contexts/AppContext';
import { RoutineExercise } from '@/types/workout';

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { saveRoutine, allExercises } = useApp();

  const [name, setName] = useState<string>('');
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [pickerGroup, setPickerGroup] = useState<string>('All');
  const [pickerSearch, setPickerSearch] = useState<string>('');

  const filteredExercises = React.useMemo(() => {
    let list = allExercises;
    if (pickerGroup !== 'All') {
      list = list.filter((e) => e.muscleGroup === pickerGroup);
    }
    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return list;
  }, [allExercises, pickerGroup, pickerSearch]);

  const addExercise = useCallback((ex: typeof allExercises[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExercises((prev) => [
      ...prev,
      { exerciseId: ex.id, exerciseName: ex.name, targetSets: 3 },
    ]);
    setShowPicker(false);
  }, []);

  const removeExercise = useCallback((idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const moveExercise = useCallback((idx: number, direction: 'up' | 'down') => {
    setExercises((prev) => {
      const arr = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= arr.length) return arr;
      [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
      return arr;
    });
  }, []);

  const updateSets = useCallback((idx: number, sets: number) => {
    setExercises((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], targetSets: Math.max(1, sets) };
      return arr;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a routine name.');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Add at least one exercise to your routine.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveRoutine({
      id: `routine_${Date.now()}`,
      name: name.trim(),
      exercises,
    });
    router.back();
  }, [name, exercises, saveRoutine, router]);

  if (showPicker) {
    return (
      <View style={styles.container}>
        <View style={styles.pickerHeader}>
          <Pressable onPress={() => setShowPicker(false)}>
            <Text style={styles.pickerCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.pickerTitle}>Add Exercise</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.pickerSearch}>
          <TextInput
            style={styles.pickerSearchInput}
            value={pickerSearch}
            onChangeText={setPickerSearch}
            placeholder="Search..."
            placeholderTextColor={Colors.dark.textTertiary}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerFilters}
        >
          <Pressable
            onPress={() => setPickerGroup('All')}
            style={[styles.chip, pickerGroup === 'All' && styles.chipActive]}
          >
            <Text style={[styles.chipText, pickerGroup === 'All' && styles.chipTextActive]}>All</Text>
          </Pressable>
          {MUSCLE_GROUPS.map((g) => (
            <Pressable
              key={g}
              onPress={() => setPickerGroup(g)}
              style={[styles.chip, pickerGroup === g && styles.chipActive]}
            >
              <Text style={[styles.chipText, pickerGroup === g && styles.chipTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
          {filteredExercises.map((ex) => (
            <Pressable
              key={ex.id}
              onPress={() => addExercise(ex)}
              style={({ pressed }) => [styles.pickerRow, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.pickerRowText}>{ex.name}</Text>
              <Plus color={Colors.dark.accent} size={18} />
            </Pressable>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>ROUTINE NAME</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Push Day, Leg Day..."
          placeholderTextColor={Colors.dark.textTertiary}
        />

        <Text style={[styles.label, { marginTop: 24 }]}>EXERCISES</Text>

        {exercises.map((ex, idx) => (
          <View key={`${ex.exerciseId}-${idx}`} style={styles.exerciseCard}>
            <View style={styles.exerciseCardTop}>
              <Text style={styles.exerciseCardName}>{ex.exerciseName}</Text>
              <View style={styles.exerciseCardActions}>
                <Pressable
                  onPress={() => moveExercise(idx, 'up')}
                  disabled={idx === 0}
                  style={[styles.moveBtn, idx === 0 && styles.moveBtnDisabled]}
                >
                  <ArrowUp color={idx === 0 ? Colors.dark.textTertiary : Colors.dark.text} size={14} />
                </Pressable>
                <Pressable
                  onPress={() => moveExercise(idx, 'down')}
                  disabled={idx === exercises.length - 1}
                  style={[styles.moveBtn, idx === exercises.length - 1 && styles.moveBtnDisabled]}
                >
                  <ArrowDown
                    color={idx === exercises.length - 1 ? Colors.dark.textTertiary : Colors.dark.text}
                    size={14}
                  />
                </Pressable>
                <Pressable onPress={() => removeExercise(idx)} style={styles.moveBtn}>
                  <Trash2 color={Colors.dark.danger} size={14} />
                </Pressable>
              </View>
            </View>
            <View style={styles.setsRow}>
              <Text style={styles.setsLabel}>Target Sets:</Text>
              <Pressable
                onPress={() => updateSets(idx, ex.targetSets - 1)}
                style={styles.setsBtn}
              >
                <Text style={styles.setsBtnText}>−</Text>
              </Pressable>
              <Text style={styles.setsValue}>{ex.targetSets}</Text>
              <Pressable
                onPress={() => updateSets(idx, ex.targetSets + 1)}
                style={styles.setsBtn}
              >
                <Text style={styles.setsBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable
          onPress={() => {
            setShowPicker(true);
            setPickerSearch('');
            setPickerGroup('All');
          }}
          style={styles.addExBtn}
        >
          <Plus color={Colors.dark.accent} size={18} />
          <Text style={styles.addExText}>Add Exercise</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
        >
          <Save color="#fff" size={18} />
          <Text style={styles.saveBtnText}>Save Routine</Text>
        </Pressable>
      </View>
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
    paddingBottom: 100,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '600' as const,
  },
  exerciseCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  exerciseCardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  exerciseCardName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    flex: 1,
  },
  exerciseCardActions: {
    flexDirection: 'row' as const,
    gap: 6,
  },
  moveBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  moveBtnDisabled: {
    opacity: 0.4,
  },
  setsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 10,
    gap: 10,
  },
  setsLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  setsBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  setsBtnText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  setsValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    width: 28,
    textAlign: 'center' as const,
  },
  addExBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed' as const,
    marginTop: 4,
  },
  addExText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  saveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  pickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  pickerCancel: {
    fontSize: 15,
    color: Colors.dark.accent,
    fontWeight: '600' as const,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  pickerSearch: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  pickerSearchInput: {
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.dark.text,
  },
  pickerFilters: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  pickerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pickerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  pickerRowText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.dark.text,
  },
});
