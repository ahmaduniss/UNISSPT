import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_EXERCISES } from '@/constants/exercises';
import { DEFAULT_METRICS } from '@/constants/sports';
import {
  ActiveWorkout,
  Exercise,
  PerformanceMetric,
  Routine,
  SportKey,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '@/types/workout';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';

type ClientRef = { id: string; name: string };

const STORAGE_KEYS = {
  exercises: 'uniss_exercises',
  metrics: 'uniss_custom_metrics',
  active: 'uniss_active',
  userName: 'uniss_user_name',
} as const;

const EMPTY_CUSTOM_METRICS: Record<SportKey, PerformanceMetric[]> = {
  basketball: [],
  track_field: [],
  football: [],
  general: [],
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [customMetrics, setCustomMetrics] = useState<Record<SportKey, PerformanceMetric[]>>(EMPTY_CUSTOM_METRICS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const utils = trpc.useUtils();

  const initQuery = useQuery({
    queryKey: ['app-init'],
    queryFn: async () => {
      const [exercises, metrics, active, storedUserName, { data: { session } }] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.exercises),
        AsyncStorage.getItem(STORAGE_KEYS.metrics),
        AsyncStorage.getItem(STORAGE_KEYS.active),
        AsyncStorage.getItem(STORAGE_KEYS.userName),
        supabase.auth.getSession(),
      ]);

      return {
        exercises: exercises ? JSON.parse(exercises) as Exercise[] : [],
        metrics: metrics ? JSON.parse(metrics) as Record<SportKey, PerformanceMetric[]> : EMPTY_CUSTOM_METRICS,
        active: active ? JSON.parse(active) as ActiveWorkout : null,
        userId: session?.user.id ?? null,
        userName: storedUserName,
        authEmail: session?.user.email ?? null,
        isAuthenticated: !!session,
      };
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (initQuery.data) {
      setUserId(initQuery.data.userId);
      setUserName(initQuery.data.userName);
      setIsAuthenticated(initQuery.data.isAuthenticated);
      setAuthEmail(initQuery.data.authEmail);
      setCustomExercises(initQuery.data.exercises);
      setCustomMetrics(initQuery.data.metrics);
      setActiveWorkout(initQuery.data.active);
      setIsLoading(false);
    } else if (initQuery.isError) {
      console.error('[AppContext] Failed to load state:', initQuery.error);
      setIsLoading(false);
    }
  }, [initQuery.data, initQuery.isError, initQuery.error]);

  const persist = useCallback((key: string, value: string) => {
    AsyncStorage.setItem(key, value).catch((error) => {
      console.error('[AppContext] Persist failed:', key, error);
    });
  }, []);

  const profileQuery = trpc.users.getProfile.useQuery(undefined, { enabled: isAuthenticated });
  const userRole = profileQuery.data?.role ?? null;
  const hasProfile = !!profileQuery.data;
  const isProfileLoading = isAuthenticated && profileQuery.isLoading;

  useEffect(() => {
    if (profileQuery.data?.name) {
      setUserName(profileQuery.data.name);
      persist(STORAGE_KEYS.userName, profileQuery.data.name);
    }
  }, [profileQuery.data?.name, persist]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Incorrect email or password. Please try again.');
      }
      throw new Error(error.message);
    }
    setIsAuthenticated(true);
    setAuthEmail(email);
    setUserId(data.user.id);
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('An account with this email already exists. Please log in.');
      }
      throw new Error(error.message);
    }
    setIsAuthenticated(true);
    setAuthEmail(email);
    if (data.user) setUserId(data.user.id);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAuthEmail(null);
    setUserId(null);
    setUserName(null);
  }, []);

  const setDisplayName = useCallback((name: string) => {
    setUserName(name);
    persist(STORAGE_KEYS.userName, name);
  }, [persist]);

  const allExercises = useMemo(() => {
    return [...DEFAULT_EXERCISES, ...customExercises];
  }, [customExercises]);

  const addCustomExercise = useCallback(
    (exercise: Exercise) => {
      const updated = [...customExercises, exercise];
      setCustomExercises(updated);
      persist(STORAGE_KEYS.exercises, JSON.stringify(updated));
    },
    [customExercises, persist],
  );

  const getMetricsForSport = useCallback((sport: SportKey): PerformanceMetric[] => {
    return [...DEFAULT_METRICS[sport], ...customMetrics[sport]];
  }, [customMetrics]);

  const addCustomMetric = useCallback(
    (sport: SportKey, metric: PerformanceMetric) => {
      const updated = { ...customMetrics, [sport]: [...customMetrics[sport], metric] };
      setCustomMetrics(updated);
      persist(STORAGE_KEYS.metrics, JSON.stringify(updated));
    },
    [customMetrics, persist],
  );

  // History of the client currently being trained, used only to prefill
  // "previous session" placeholders while logging a live workout.
  const clientHistoryQuery = trpc.workouts.getHistory.useQuery(
    { clientId: activeWorkout?.clientId ?? '' },
    { enabled: !!activeWorkout?.clientId && isAuthenticated },
  );
  const clientHistory = useMemo(() => clientHistoryQuery.data ?? [], [clientHistoryQuery.data]);

  const getPreviousSetsForExercise = useCallback((exerciseId: string): WorkoutSet[] => {
    for (const workout of clientHistory) {
      const found = workout.exercises.find((e) => e.exerciseId === exerciseId);
      if (found) return found.sets;
    }
    return [];
  }, [clientHistory]);

  const startFreestyleWorkout = useCallback((client: ClientRef, name: string) => {
    const workout: ActiveWorkout = {
      id: Date.now().toString(),
      clientId: client.id,
      clientName: client.name,
      name,
      startTime: Date.now(),
      exercises: [],
    };
    setActiveWorkout(workout);
    persist(STORAGE_KEYS.active, JSON.stringify(workout));
  }, [persist]);

  const startRoutineWorkout = useCallback((client: ClientRef, routine: Routine, history: Workout[]) => {
    const findPrevious = (exerciseId: string): WorkoutSet[] => {
      for (const w of history) {
        const found = w.exercises.find((e) => e.exerciseId === exerciseId);
        if (found) return found.sets;
      }
      return [];
    };
    const exercises: WorkoutExercise[] = routine.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: Array.from({ length: ex.targetSets }, () => ({
        weight: 0,
        reps: 0,
        completed: false,
      })),
      previousSets: findPrevious(ex.exerciseId),
    }));
    const workout: ActiveWorkout = {
      id: Date.now().toString(),
      clientId: client.id,
      clientName: client.name,
      name: routine.name,
      startTime: Date.now(),
      exercises,
    };
    setActiveWorkout(workout);
    persist(STORAGE_KEYS.active, JSON.stringify(workout));
  }, [persist]);

  const repeatWorkout = useCallback((client: ClientRef, workout: Workout) => {
    const exercises: WorkoutExercise[] = workout.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: ex.sets.map(() => ({
        weight: 0,
        reps: 0,
        completed: false,
      })),
      previousSets: ex.sets,
    }));
    const active: ActiveWorkout = {
      id: Date.now().toString(),
      clientId: client.id,
      clientName: client.name,
      name: workout.name,
      startTime: Date.now(),
      exercises,
    };
    setActiveWorkout(active);
    persist(STORAGE_KEYS.active, JSON.stringify(active));
  }, [persist]);

  const addExerciseToWorkout = useCallback((exercise: Exercise) => {
    if (!activeWorkout) return;
    const newExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [{ weight: 0, reps: 0, completed: false }],
      previousSets: getPreviousSetsForExercise(exercise.id),
    };
    const updated = {
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, newExercise],
    };
    setActiveWorkout(updated);
    persist(STORAGE_KEYS.active, JSON.stringify(updated));
  }, [activeWorkout, persist, getPreviousSetsForExercise]);

  const updateSet = useCallback(
    (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
      if (!activeWorkout) return;
      const updated = { ...activeWorkout };
      const exercises = [...updated.exercises];
      const exercise = { ...exercises[exerciseIndex] };
      const sets = [...exercise.sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      exercise.sets = sets;
      exercises[exerciseIndex] = exercise;
      updated.exercises = exercises;
      setActiveWorkout(updated);
      persist(STORAGE_KEYS.active, JSON.stringify(updated));
    },
    [activeWorkout, persist],
  );

  const toggleSetComplete = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      if (!activeWorkout) return;
      const updated = { ...activeWorkout };
      const exercises = [...updated.exercises];
      const exercise = { ...exercises[exerciseIndex] };
      const sets = [...exercise.sets];
      sets[setIndex] = { ...sets[setIndex], completed: !sets[setIndex].completed };
      exercise.sets = sets;
      exercises[exerciseIndex] = exercise;
      updated.exercises = exercises;
      setActiveWorkout(updated);
      persist(STORAGE_KEYS.active, JSON.stringify(updated));
    },
    [activeWorkout, persist],
  );

  const updateSetNotes = useCallback(
    (exerciseIndex: number, setIndex: number, notes: string) => {
      if (!activeWorkout) return;
      const updated = { ...activeWorkout };
      const exercises = [...updated.exercises];
      const exercise = { ...exercises[exerciseIndex] };
      const sets = [...exercise.sets];
      sets[setIndex] = { ...sets[setIndex], notes };
      exercise.sets = sets;
      exercises[exerciseIndex] = exercise;
      updated.exercises = exercises;
      setActiveWorkout(updated);
      persist(STORAGE_KEYS.active, JSON.stringify(updated));
    },
    [activeWorkout, persist],
  );

  const removeSetFromExercise = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      if (!activeWorkout) return;
      const updated = { ...activeWorkout };
      const exercises = [...updated.exercises];
      const exercise = { ...exercises[exerciseIndex] };
      exercise.sets = exercise.sets.filter((_, i) => i !== setIndex);
      exercises[exerciseIndex] = exercise;
      updated.exercises = exercises;
      setActiveWorkout(updated);
      persist(STORAGE_KEYS.active, JSON.stringify(updated));
    },
    [activeWorkout, persist],
  );

  const addSetToExercise = useCallback(
    (exerciseIndex: number) => {
      if (!activeWorkout) return;
      const updated = { ...activeWorkout };
      const exercises = [...updated.exercises];
      const exercise = { ...exercises[exerciseIndex] };
      exercise.sets = [...exercise.sets, { weight: 0, reps: 0, completed: false }];
      exercises[exerciseIndex] = exercise;
      updated.exercises = exercises;
      setActiveWorkout(updated);
      persist(STORAGE_KEYS.active, JSON.stringify(updated));
    },
    [activeWorkout, persist],
  );

  const removeExerciseFromWorkout = useCallback(
    (exerciseIndex: number) => {
      if (!activeWorkout) return;
      const updated = {
        ...activeWorkout,
        exercises: activeWorkout.exercises.filter((_, i) => i !== exerciseIndex),
      };
      setActiveWorkout(updated);
      persist(STORAGE_KEYS.active, JSON.stringify(updated));
    },
    [activeWorkout, persist],
  );

  const replaceExerciseInWorkout = useCallback(
    (exerciseIndex: number, newExercise: Exercise) => {
      if (!activeWorkout) return;
      const updated = { ...activeWorkout };
      const exercises = [...updated.exercises];
      const oldExercise = exercises[exerciseIndex];
      exercises[exerciseIndex] = {
        ...oldExercise,
        exerciseId: newExercise.id,
        exerciseName: newExercise.name,
        previousSets: getPreviousSetsForExercise(newExercise.id),
      };
      updated.exercises = exercises;
      setActiveWorkout(updated);
      persist(STORAGE_KEYS.active, JSON.stringify(updated));
    },
    [activeWorkout, persist, getPreviousSetsForExercise],
  );

  const saveWorkoutMutation = trpc.workouts.saveWorkout.useMutation({
    onSuccess: (_data, variables) => {
      utils.workouts.getHistory.invalidate({ clientId: variables.clientId });
    },
    onError: (error) => {
      console.error('[AppContext] saveWorkout failed:', error.message);
      Alert.alert('Sync failed', 'The workout was not saved to the server. Check your connection and try again from history.');
    },
  });

  const finishWorkout = useCallback((): boolean => {
    if (!activeWorkout) return false;
    const duration = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
    let totalVolume = 0;
    let totalSets = 0;
    activeWorkout.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.weight > 0 && set.reps > 0) {
          totalVolume += set.weight * set.reps;
          totalSets++;
        }
      });
    });

    if (totalSets === 0) {
      Alert.alert('No Sets Logged', 'Log at least one set with weight and reps before finishing.');
      return false;
    }

    const completed: Workout = {
      id: activeWorkout.id,
      clientId: activeWorkout.clientId,
      name: activeWorkout.name,
      date: new Date().toISOString(),
      duration,
      exercises: activeWorkout.exercises,
      totalVolume,
    };

    setActiveWorkout(null);
    AsyncStorage.removeItem(STORAGE_KEYS.active);

    saveWorkoutMutation.mutate({ clientId: activeWorkout.clientId, workout: completed });

    return true;
  }, [activeWorkout, saveWorkoutMutation]);

  const discardWorkout = useCallback(() => {
    setActiveWorkout(null);
    AsyncStorage.removeItem(STORAGE_KEYS.active);
  }, []);

  return {
    isLoading,
    userId,
    userName,
    activeWorkout,
    customExercises,
    allExercises,
    isAuthenticated,
    authEmail,
    userRole,
    hasProfile,
    isProfileLoading,
    login,
    signup,
    logout,
    setDisplayName,
    startFreestyleWorkout,
    startRoutineWorkout,
    repeatWorkout,
    addExerciseToWorkout,
    updateSet,
    updateSetNotes,
    toggleSetComplete,
    addSetToExercise,
    removeSetFromExercise,
    removeExerciseFromWorkout,
    replaceExerciseInWorkout,
    finishWorkout,
    discardWorkout,
    addCustomExercise,
    getMetricsForSport,
    addCustomMetric,
  };
});
