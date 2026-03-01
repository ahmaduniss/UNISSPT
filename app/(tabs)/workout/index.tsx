import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Plus,
  Check,
  Trash2,
  Clock,
  X,
  Dumbbell,
  Repeat2,
  Zap,
  BookOpen,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import type { Exercise } from '@/types/workout';

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    activeWorkout,
    allExercises,
    updateSet,
    toggleSetComplete,
    addSetToExercise,
    removeExerciseFromWorkout,
    replaceExerciseInWorkout,
    finishWorkout,
    discardWorkout,
    startFreestyleWorkout,
  } = useApp();

  const [alternativeModal, setAlternativeModal] = useState<{
    visible: boolean;
    exerciseIndex: number;
    exerciseName: string;
    muscleGroup: string;
  }>({ visible: false, exerciseIndex: -1, exerciseName: '', muscleGroup: '' });
  const modalAnim = useRef(new Animated.Value(0)).current;

  const [elapsed, setElapsed] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeWorkout) {
      const update = () => {
        setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
      };
      update();
      intervalRef.current = setInterval(update, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      setElapsed(0);
    }
  }, [activeWorkout?.startTime]);

  const formatTime = useMemo(() => {
    const hrs = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [elapsed]);

  const totalVolume = useMemo(() => {
    if (!activeWorkout) return 0;
    let vol = 0;
    activeWorkout.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed) vol += set.weight * set.reps;
      });
    });
    return vol;
  }, [activeWorkout]);

  const handleFinish = useCallback(() => {
    Alert.alert('Finish Workout', 'Save this workout to your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          finishWorkout();
        },
      },
    ]);
  }, [finishWorkout]);

  const handleDiscard = useCallback(() => {
    Alert.alert('Discard Workout', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          discardWorkout();
        },
      },
    ]);
  }, [discardWorkout]);

  const handleRemoveExercise = useCallback((index: number, name: string) => {
    Alert.alert('Remove Exercise', `Remove ${name} from this workout?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeExerciseFromWorkout(index),
      },
    ]);
  }, [removeExerciseFromWorkout]);

  const openAlternativeModal = useCallback((exerciseIndex: number) => {
    if (!activeWorkout) return;
    const exercise = activeWorkout.exercises[exerciseIndex];
    const matched = allExercises.find((e) => e.id === exercise.exerciseId);
    const muscleGroup = matched?.muscleGroup ?? '';
    setAlternativeModal({ visible: true, exerciseIndex, exerciseName: exercise.exerciseName, muscleGroup });
    Animated.spring(modalAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }, [activeWorkout, allExercises, modalAnim]);

  const closeAlternativeModal = useCallback(() => {
    Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setAlternativeModal({ visible: false, exerciseIndex: -1, exerciseName: '', muscleGroup: '' });
    });
  }, [modalAnim]);

  const alternatives = useMemo(() => {
    if (!alternativeModal.visible || !activeWorkout) return [];
    const currentIds = new Set(activeWorkout.exercises.map((e) => e.exerciseId));
    return allExercises.filter(
      (e) => e.muscleGroup === alternativeModal.muscleGroup && !currentIds.has(e.id)
    );
  }, [alternativeModal.visible, alternativeModal.muscleGroup, activeWorkout, allExercises]);

  const handleSelectAlternative = useCallback((exercise: Exercise) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    replaceExerciseInWorkout(alternativeModal.exerciseIndex, exercise);
    closeAlternativeModal();
  }, [alternativeModal.exerciseIndex, replaceExerciseInWorkout, closeAlternativeModal]);

  if (!activeWorkout) {
    return (
      <View style={[styles.container, styles.emptyContainer, { paddingTop: insets.top }]}>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIcon}>
            <Dumbbell color={Colors.dark.textTertiary} size={48} />
          </View>
          <Text style={styles.emptyTitle}>Ready to Train?</Text>
          <Text style={styles.emptySubtitle}>Start a session to begin tracking</Text>
          <Pressable
            onPress={() => {
              startFreestyleWorkout('Freestyle Session');
            }}
            style={styles.startBtn}
          >
            <Zap color="#fff" size={18} />
            <Text style={styles.startBtnText}>Start Freestyle</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/routines' as any)}
            style={styles.routinesBtn}
          >
            <BookOpen color={Colors.dark.accent} size={18} />
            <Text style={styles.routinesBtnText}>Browse Routines</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.workoutName}>{activeWorkout.name}</Text>
          <View style={styles.timerRow}>
            <Clock color={Colors.dark.accent} size={14} />
            <Text style={styles.timerText}>{formatTime}</Text>
            <Text style={styles.volumeText}>{totalVolume.toLocaleString()} kg</Text>
          </View>
        </View>
        <View style={styles.topActions}>
          <Pressable onPress={handleDiscard} style={styles.discardBtn} hitSlop={8}>
            <X color={Colors.dark.danger} size={20} />
          </Pressable>
          <Pressable
            onPress={handleFinish}
            style={styles.finishBtn}
          >
            <Check color="#fff" size={18} />
            <Text style={styles.finishText}>Finish</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeWorkout.exercises.map((exercise, exIdx) => (
          <View key={`${exercise.exerciseId}-${exIdx}`} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
              <View style={styles.exerciseActions}>
                <Pressable
                  onPress={() => openAlternativeModal(exIdx)}
                  style={styles.swapBtn}
                  hitSlop={8}
                  testID={`suggest-alt-${exIdx}`}
                >
                  <Repeat2 color={Colors.dark.accentLight} size={15} />
                  <Text style={styles.swapBtnText}>Swap</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRemoveExercise(exIdx, exercise.exerciseName)}
                  hitSlop={8}
                >
                  <Trash2 color={Colors.dark.textTertiary} size={16} />
                </Pressable>
              </View>
            </View>

            <View style={styles.setHeader}>
              <Text style={[styles.setHeaderText, styles.setNumCol]}>SET</Text>
              <Text style={[styles.setHeaderText, styles.setPrevCol]}>PREV</Text>
              <Text style={[styles.setHeaderText, styles.setWeightCol]}>KG</Text>
              <Text style={[styles.setHeaderText, styles.setRepsCol]}>REPS</Text>
              <Text style={[styles.setHeaderText, styles.setCheckCol]}></Text>
            </View>

            {exercise.sets.map((set, setIdx) => {
              const prevSet = exercise.previousSets?.[setIdx];
              return (
                <View
                  key={setIdx}
                  style={[styles.setRow, set.completed && styles.setRowCompleted]}
                >
                  <Text style={[styles.setNum, styles.setNumCol]}>{setIdx + 1}</Text>
                  <Text style={[styles.prevText, styles.setPrevCol]}>
                    {prevSet ? `${prevSet.weight}×${prevSet.reps}` : '—'}
                  </Text>
                  <View style={styles.setWeightCol}>
                    <TextInput
                      style={styles.setInput}
                      value={set.weight > 0 ? set.weight.toString() : ''}
                      placeholder={prevSet ? prevSet.weight.toString() : '0'}
                      placeholderTextColor={Colors.dark.textTertiary}
                      keyboardType="numeric"
                      onChangeText={(v) => {
                        const num = parseInt(v) || 0;
                        updateSet(exIdx, setIdx, 'weight', num);
                      }}
                    />
                  </View>
                  <View style={styles.setRepsCol}>
                    <TextInput
                      style={styles.setInput}
                      value={set.reps > 0 ? set.reps.toString() : ''}
                      placeholder={prevSet ? prevSet.reps.toString() : '0'}
                      placeholderTextColor={Colors.dark.textTertiary}
                      keyboardType="numeric"
                      onChangeText={(v) => {
                        const num = parseInt(v) || 0;
                        updateSet(exIdx, setIdx, 'reps', num);
                      }}
                    />
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleSetComplete(exIdx, setIdx);
                    }}
                    style={[styles.checkBtn, set.completed && styles.checkBtnCompleted]}
                  >
                    <Check
                      color={set.completed ? '#fff' : Colors.dark.textTertiary}
                      size={16}
                    />
                  </Pressable>
                </View>
              );
            })}

            <Pressable
              onPress={() => addSetToExercise(exIdx)}
              style={styles.addSetBtn}
            >
              <Plus color={Colors.dark.accent} size={14} />
              <Text style={styles.addSetText}>Add Set</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={() => router.push('/exercise-library?mode=select' as any)}
          style={styles.addExerciseBtn}
          testID="add-exercise"
        >
          <Plus color={Colors.dark.accent} size={20} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={alternativeModal.visible}
        transparent
        animationType="none"
        onRequestClose={closeAlternativeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeAlternativeModal}>
          <Animated.View
            style={[
              styles.modalSheet,
              {
                transform: [{
                  translateY: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0],
                  }),
                }],
                opacity: modalAnim,
              },
            ]}
          >
            <View onStartShouldSetResponder={() => true}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Equipment taken?</Text>
              <Text style={styles.modalSubtitle}>
                Pick an alternative for{' '}
                <Text style={styles.modalHighlight}>{alternativeModal.exerciseName}</Text>
              </Text>
              <Text style={styles.modalGroupLabel}>{alternativeModal.muscleGroup} alternatives</Text>
              <ScrollView
                style={styles.modalList}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {alternatives.length === 0 ? (
                  <Text style={styles.noAltsText}>No alternatives available</Text>
                ) : (
                  alternatives.map((alt) => (
                    <Pressable
                      key={alt.id}
                      onPress={() => handleSelectAlternative(alt)}
                      style={({ pressed }) => [
                        styles.altRow,
                        pressed && styles.altRowPressed,
                      ]}
                    >
                      <View style={styles.altInfo}>
                        <Text style={styles.altName}>{alt.name}</Text>
                        {alt.isCustom && (
                          <View style={styles.altCustomBadge}>
                            <Text style={styles.altCustomText}>CUSTOM</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.altSwapIcon}>
                        <Repeat2 color={Colors.dark.accent} size={16} />
                      </View>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  emptyContainer: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyContent: {
    alignItems: 'center' as const,
    paddingHorizontal: 40,
    width: '100%' as const,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.dark.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.dark.textTertiary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },
  startBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    width: '100%' as const,
    marginBottom: 12,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  routinesBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  routinesBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
  },
  topBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  timerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
    fontVariant: ['tabular-nums' as const],
  },
  volumeText: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginLeft: 8,
  },
  topActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  discardBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  finishBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.dark.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  finishText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  exerciseHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 14,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
    flex: 1,
  },
  exerciseActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  swapBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(253, 186, 116, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  swapBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.accentLight,
  },
  setHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
    marginBottom: 6,
  },
  setHeaderText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    letterSpacing: 0.5,
  },
  setNumCol: {
    width: 36,
    textAlign: 'center' as const,
  },
  setPrevCol: {
    width: 64,
    textAlign: 'center' as const,
  },
  setWeightCol: {
    flex: 1,
    alignItems: 'center' as const,
  },
  setRepsCol: {
    flex: 1,
    alignItems: 'center' as const,
  },
  setCheckCol: {
    width: 36,
  },
  setRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 2,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  setNum: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  prevText: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
  },
  setInput: {
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    textAlign: 'center' as const,
    width: 60,
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.dark.inputBg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 4,
  },
  checkBtnCompleted: {
    backgroundColor: Colors.dark.success,
  },
  addSetBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 10,
    gap: 6,
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
  },
  addSetText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  addExerciseBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed' as const,
  },
  addExerciseText: {
    fontSize: 15,
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
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '60%' as const,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.border,
    alignSelf: 'center' as const,
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 16,
  },
  modalHighlight: {
    color: Colors.dark.accent,
    fontWeight: '700' as const,
  },
  modalGroupLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  modalList: {
    maxHeight: 300,
  },
  noAltsText: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
    textAlign: 'center' as const,
    paddingVertical: 24,
  },
  altRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  altRowPressed: {
    opacity: 0.7,
    backgroundColor: Colors.dark.inputBg,
  },
  altInfo: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  altName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.dark.text,
  },
  altCustomBadge: {
    backgroundColor: Colors.dark.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  altCustomText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
    letterSpacing: 0.5,
  },
  altSwapIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
