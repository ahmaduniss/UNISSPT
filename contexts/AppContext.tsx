import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_EXERCISES } from '@/constants/exercises';
import { COACH_ROUTINES } from '@/mocks/routines';
import { MOCK_SOCIAL_FEED } from '@/mocks/social';
import {
  Achievement,
  ActiveWorkout,
  Competition,
  Exercise,
  Routine,
  SharedPost,
  UserRole,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '@/types/workout';
import { DEFAULT_ACHIEVEMENTS } from '@/constants/achievements';
import { generateDailyCompetitions } from '@/constants/competitions';
import { trpc } from '@/lib/trpc';

const STORAGE_KEYS = {
  onboarded: 'uniss_onboarded',
  gym: 'uniss_gym',
  gymId: 'uniss_gym_id',
  history: 'uniss_history',
  exercises: 'uniss_exercises',
  routines: 'uniss_routines',
  active: 'uniss_active',
  socialFeed: 'uniss_social_feed',
  achievements: 'uniss_achievements',
  competitions: 'uniss_competitions',
  competitionDate: 'uniss_competition_date',
  userId: 'uniss_user_id',
  userName: 'uniss_user_name',
  userRole: 'uniss_user_role',
  authEmail: 'uniss_auth_email',
  authToken: 'uniss_auth_token',
} as const;

export const [AppProvider, useApp] = createContextHook(() => {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [selectedGym, setSelectedGym] = useState<string | null>(null);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [savedRoutines, setSavedRoutines] = useState<Routine[]>([]);
  const [socialFeed, setSocialFeed] = useState<SharedPost[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('member');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const initQuery = useQuery({
    queryKey: ['app-init'],
    queryFn: async () => {
      console.log('[AppContext] Loading persisted state...');
      const [onboarded, gym, gymId, history, exercises, routines, active, feed, achv, comps, compDate, storedUserId, storedUserName, storedRole, storedAuthEmail, storedAuthToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.onboarded),
        AsyncStorage.getItem(STORAGE_KEYS.gym),
        AsyncStorage.getItem(STORAGE_KEYS.gymId),
        AsyncStorage.getItem(STORAGE_KEYS.history),
        AsyncStorage.getItem(STORAGE_KEYS.exercises),
        AsyncStorage.getItem(STORAGE_KEYS.routines),
        AsyncStorage.getItem(STORAGE_KEYS.active),
        AsyncStorage.getItem(STORAGE_KEYS.socialFeed),
        AsyncStorage.getItem(STORAGE_KEYS.achievements),
        AsyncStorage.getItem(STORAGE_KEYS.competitions),
        AsyncStorage.getItem(STORAGE_KEYS.competitionDate),
        AsyncStorage.getItem(STORAGE_KEYS.userId),
        AsyncStorage.getItem(STORAGE_KEYS.userName),
        AsyncStorage.getItem(STORAGE_KEYS.userRole),
        AsyncStorage.getItem(STORAGE_KEYS.authEmail),
        AsyncStorage.getItem(STORAGE_KEYS.authToken),
      ]);
      console.log('[AppContext] State loaded, onboarded:', onboarded);

      const today = new Date().toISOString().split('T')[0];
      let parsedComps = comps ? JSON.parse(comps) as Competition[] : [];
      if (compDate !== today) {
        parsedComps = generateDailyCompetitions();
      }

      const mockPosts: SharedPost[] = MOCK_SOCIAL_FEED.map((p) => ({
        ...p,
        likedByUser: false,
      }));
      const savedFeed = feed ? JSON.parse(feed) as SharedPost[] : mockPosts;

      return {
        onboarded: onboarded === 'true',
        gym,
        gymId,
        history: history ? JSON.parse(history) as Workout[] : [],
        exercises: exercises ? JSON.parse(exercises) as Exercise[] : [],
        routines: routines ? JSON.parse(routines) as Routine[] : [],
        active: active ? JSON.parse(active) as ActiveWorkout : null,
        feed: savedFeed,
        achievements: achv ? JSON.parse(achv) as Achievement[] : DEFAULT_ACHIEVEMENTS,
        competitions: parsedComps,
        competitionDate: today,
        userId: storedUserId,
        userName: storedUserName,
        userRole: (storedRole as UserRole) || 'member',
        authEmail: storedAuthEmail,
        isAuthenticated: !!storedAuthToken,
      };
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (initQuery.data) {
      setIsOnboarded(initQuery.data.onboarded);
      setSelectedGym(initQuery.data.gym);
      setSelectedGymId(initQuery.data.gymId);
      setUserId(initQuery.data.userId);
      setUserName(initQuery.data.userName);
      setUserRole(initQuery.data.userRole);
      setIsAuthenticated(initQuery.data.isAuthenticated);
      setAuthEmail(initQuery.data.authEmail);
      setWorkoutHistory(initQuery.data.history);
      setCustomExercises(initQuery.data.exercises);
      setSavedRoutines(initQuery.data.routines);
      setActiveWorkout(initQuery.data.active);
      setSocialFeed(initQuery.data.feed);
      setAchievements(initQuery.data.achievements);
      setCompetitions(initQuery.data.competitions);
      saveMutation.mutate({ key: STORAGE_KEYS.competitionDate, value: initQuery.data.competitionDate });
      saveMutation.mutate({ key: STORAGE_KEYS.competitions, value: JSON.stringify(initQuery.data.competitions) });
      setIsLoading(false);
    } else if (initQuery.isError) {
      console.error('[AppContext] Failed to load state:', initQuery.error);
      setIsLoading(false);
    }
  }, [initQuery.data, initQuery.isError, initQuery.error]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await AsyncStorage.setItem(key, value);
    },
    onError: (error) => {
      console.error('[AppContext] Save failed:', error);
    },
  });

  const registerMutation = trpc.users.register.useMutation({
    onSuccess: (data) => {
      console.log('[AppContext] User registered on backend:', data.id);
      setUserId(data.id);
      setUserName(data.name);
      saveMutation.mutate({ key: STORAGE_KEYS.userId, value: data.id });
      saveMutation.mutate({ key: STORAGE_KEYS.userName, value: data.name });
    },
    onError: (error) => {
      console.error('[AppContext] Backend registration failed (offline ok):', error.message);
    },
  });

  const saveWorkoutMutation = trpc.workouts.saveWorkout.useMutation({
    onSuccess: () => {
      console.log('[AppContext] Workout synced to backend');
    },
    onError: (error) => {
      console.error('[AppContext] Backend workout sync failed (offline ok):', error.message);
    },
  });

  const submitScoreMutation = trpc.leaderboards.submitScore.useMutation({
    onSuccess: () => {
      console.log('[AppContext] Leaderboard score submitted');
      queryClient.invalidateQueries({ queryKey: [['leaderboards', 'getLeaderboard']] });
    },
    onError: (error) => {
      console.error('[AppContext] Leaderboard submit failed (offline ok):', error.message);
    },
  });

  const createPostMutation = trpc.social.createPost.useMutation({
    onSuccess: () => {
      console.log('[AppContext] Post synced to backend');
      queryClient.invalidateQueries({ queryKey: [['social', 'getFeed']] });
    },
    onError: (error) => {
      console.error('[AppContext] Backend post sync failed (offline ok):', error.message);
    },
  });

  const toggleLikeMutation = trpc.social.toggleLike.useMutation({
    onError: (error) => {
      console.error('[AppContext] Backend like toggle failed (offline ok):', error.message);
    },
  });

  const updateStatsMutation = trpc.users.updateStats.useMutation({
    onError: (error) => {
      console.error('[AppContext] Backend stats update failed (offline ok):', error.message);
    },
  });

  const login = useCallback(async (email: string, password: string) => {
    console.log('[AppContext] Logging in:', email);
    const storedHash = await AsyncStorage.getItem(`uniss_pwd_${email}`);
    if (!storedHash) {
      throw new Error('No account found with this email. Please sign up first.');
    }
    if (storedHash !== password) {
      throw new Error('Incorrect password. Please try again.');
    }
    const token = `token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setIsAuthenticated(true);
    setAuthEmail(email);
    saveMutation.mutate({ key: STORAGE_KEYS.authEmail, value: email });
    saveMutation.mutate({ key: STORAGE_KEYS.authToken, value: token });
  }, [saveMutation]);

  const signup = useCallback(async (email: string, password: string) => {
    console.log('[AppContext] Signing up:', email);
    const existing = await AsyncStorage.getItem(`uniss_pwd_${email}`);
    if (existing) {
      throw new Error('An account with this email already exists. Please log in.');
    }
    await AsyncStorage.setItem(`uniss_pwd_${email}`, password);
    const token = `token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setIsAuthenticated(true);
    setAuthEmail(email);
    saveMutation.mutate({ key: STORAGE_KEYS.authEmail, value: email });
    saveMutation.mutate({ key: STORAGE_KEYS.authToken, value: token });
  }, [saveMutation]);

  const logout = useCallback(async () => {
    console.log('[AppContext] Logging out');
    setIsAuthenticated(false);
    setAuthEmail(null);
    setIsOnboarded(false);
    await AsyncStorage.removeItem(STORAGE_KEYS.authToken);
    await AsyncStorage.removeItem(STORAGE_KEYS.authEmail);
  }, []);

  const completeOnboarding = useCallback((gymName: string, gymId: string, displayName?: string) => {
    console.log('[AppContext] Completing onboarding, gym:', gymName, 'gymId:', gymId);
    setIsOnboarded(true);
    setSelectedGym(gymName);
    setSelectedGymId(gymId);
    saveMutation.mutate({ key: STORAGE_KEYS.onboarded, value: 'true' });
    saveMutation.mutate({ key: STORAGE_KEYS.gym, value: gymName });
    saveMutation.mutate({ key: STORAGE_KEYS.gymId, value: gymId });

    const name = displayName || 'Athlete';
    registerMutation.mutate({ name, gymId, sport: 'General' });
  }, [saveMutation, registerMutation]);

  const allExercises = useMemo(() => {
    return [...DEFAULT_EXERCISES, ...customExercises];
  }, [customExercises]);

  const allRoutines = useMemo(() => {
    return [...COACH_ROUTINES, ...savedRoutines];
  }, [savedRoutines]);

  const startFreestyleWorkout = useCallback((name: string) => {
    console.log('[AppContext] Starting freestyle workout:', name);
    const workout: ActiveWorkout = {
      id: Date.now().toString(),
      name,
      startTime: Date.now(),
      exercises: [],
    };
    setActiveWorkout(workout);
    saveMutation.mutate({ key: STORAGE_KEYS.active, value: JSON.stringify(workout) });
  }, [saveMutation]);

  const startRoutineWorkout = useCallback((routine: Routine) => {
    console.log('[AppContext] Starting routine workout:', routine.name);
    const exercises: WorkoutExercise[] = routine.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: Array.from({ length: ex.targetSets }, () => ({
        weight: 0,
        reps: 0,
        completed: false,
      })),
      previousSets: getPreviousSetsForExercise(ex.exerciseId),
    }));
    const workout: ActiveWorkout = {
      id: Date.now().toString(),
      name: routine.name,
      startTime: Date.now(),
      exercises,
    };
    setActiveWorkout(workout);
    saveMutation.mutate({ key: STORAGE_KEYS.active, value: JSON.stringify(workout) });
  }, [saveMutation, workoutHistory]);

  const repeatWorkout = useCallback((workout: Workout) => {
    console.log('[AppContext] Repeating workout:', workout.name);
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
      name: workout.name,
      startTime: Date.now(),
      exercises,
    };
    setActiveWorkout(active);
    saveMutation.mutate({ key: STORAGE_KEYS.active, value: JSON.stringify(active) });
  }, [saveMutation]);

  const getPreviousSetsForExercise = (exerciseId: string): WorkoutSet[] => {
    for (let i = workoutHistory.length - 1; i >= 0; i--) {
      const found = workoutHistory[i].exercises.find((e) => e.exerciseId === exerciseId);
      if (found) return found.sets;
    }
    return [];
  };

  const addExerciseToWorkout = useCallback((exercise: Exercise) => {
    if (!activeWorkout) return;
    console.log('[AppContext] Adding exercise:', exercise.name);
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
    saveMutation.mutate({ key: STORAGE_KEYS.active, value: JSON.stringify(updated) });
  }, [activeWorkout, saveMutation, workoutHistory]);

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
      saveMutation.mutate({ key: STORAGE_KEYS.active, value: JSON.stringify(updated) });
    },
    [activeWorkout, saveMutation],
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
      saveMutation.mutate({ key: STORAGE_KEYS.active, value: JSON.stringify(updated) });
    },
    [activeWorkout, saveMutation],
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
      saveMutation.mutate({ key: STORAGE_KEYS.active, value: JSON.stringify(updated) });
    },
    [activeWorkout, saveMutation],
  );

  const removeExerciseFromWorkout = useCallback(
    (exerciseIndex: number) => {
      if (!activeWorkout) return;
      const updated = {
        ...activeWorkout,
        exercises: activeWorkout.exercises.filter((_, i) => i !== exerciseIndex),
      };
      setActiveWorkout(updated);
      saveMutation.mutate({ key: STORAGE_KEYS.active, value: JSON.stringify(updated) });
    },
    [activeWorkout, saveMutation],
  );

  const replaceExerciseInWorkout = useCallback(
    (exerciseIndex: number, newExercise: Exercise) => {
      if (!activeWorkout) return;
      console.log('[AppContext] Replacing exercise at index', exerciseIndex, 'with', newExercise.name);
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
      saveMutation.mutate({ key: STORAGE_KEYS.active, value: JSON.stringify(updated) });
    },
    [activeWorkout, saveMutation, workoutHistory],
  );

  const checkAchievements = useCallback((history: Workout[], feed: SharedPost[], comps: Competition[]) => {
    const updated = achievements.map((a) => {
      if (a.unlockedAt) return a;
      let progress = 0;
      switch (a.id) {
        case 'first_workout':
          progress = history.length >= 1 ? 1 : 0;
          break;
        case 'five_workouts':
          progress = history.length >= 5 ? 1 : 0;
          break;
        case 'twenty_workouts':
          progress = history.length >= 20 ? 1 : 0;
          break;
        case 'fifty_workouts':
          progress = history.length >= 50 ? 1 : 0;
          break;
        case 'volume_10k': {
          const total = history.reduce((s, w) => s + w.totalVolume, 0);
          progress = total >= 10000 ? 1 : 0;
          break;
        }
        case 'volume_100k': {
          const total2 = history.reduce((s, w) => s + w.totalVolume, 0);
          progress = total2 >= 100000 ? 1 : 0;
          break;
        }
        case 'volume_500k': {
          const total3 = history.reduce((s, w) => s + w.totalVolume, 0);
          progress = total3 >= 500000 ? 1 : 0;
          break;
        }
        case 'share_first':
          progress = feed.some((p) => p.userName === 'You') ? 1 : 0;
          break;
        case 'share_five': {
          const userPosts = feed.filter((p) => p.userName === 'You').length;
          progress = userPosts >= 5 ? 1 : 0;
          break;
        }
        case 'comp_first':
          progress = comps.some((c) => c.isCompleted) ? 1 : 0;
          break;
        case 'comp_five': {
          const completedComps = comps.filter((c) => c.isCompleted).length;
          progress = completedComps >= 5 ? 1 : 0;
          break;
        }
        case 'streak_7': {
          const streak = calculateStreak(history);
          progress = streak >= 7 ? 1 : 0;
          break;
        }
        case 'streak_30': {
          const streak2 = calculateStreak(history);
          progress = streak2 >= 30 ? 1 : 0;
          break;
        }
      }
      if (progress >= 1) {
        return { ...a, unlockedAt: new Date().toISOString() };
      }
      return a;
    });

    const hasChanges = updated.some((a, i) => a.unlockedAt !== achievements[i].unlockedAt);
    if (hasChanges) {
      setAchievements(updated);
      saveMutation.mutate({ key: STORAGE_KEYS.achievements, value: JSON.stringify(updated) });
    }
    return updated;
  }, [achievements, saveMutation]);

  const calculateStreak = (history: Workout[]): number => {
    if (history.length === 0) return 0;
    const dates = [...new Set(history.map((w) => new Date(w.date).toISOString().split('T')[0]))].sort().reverse();
    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const curr = new Date(dates[i]);
      const prev = new Date(dates[i + 1]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const finishWorkout = useCallback(() => {
    if (!activeWorkout) return;
    console.log('[AppContext] Finishing workout:', activeWorkout.name);
    const duration = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
    let totalVolume = 0;
    let totalSets = 0;
    activeWorkout.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed) {
          totalVolume += set.weight * set.reps;
          totalSets++;
        }
      });
    });

    const completed: Workout = {
      id: activeWorkout.id,
      name: activeWorkout.name,
      date: new Date().toISOString(),
      duration,
      exercises: activeWorkout.exercises,
      totalVolume,
    };

    const updatedHistory = [completed, ...workoutHistory];
    setWorkoutHistory(updatedHistory);
    setActiveWorkout(null);
    saveMutation.mutate({ key: STORAGE_KEYS.history, value: JSON.stringify(updatedHistory) });
    saveMutation.mutate({ key: STORAGE_KEYS.active, value: '' });
    AsyncStorage.removeItem(STORAGE_KEYS.active);

    if (userId) {
      saveWorkoutMutation.mutate({
        userId,
        workout: {
          id: completed.id,
          name: completed.name,
          date: completed.date,
          duration: completed.duration,
          exercises: completed.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            sets: ex.sets,
          })),
          totalVolume: completed.totalVolume,
        },
      });

      const totalVolume = updatedHistory.reduce((s, w) => s + w.totalVolume, 0);
      submitScoreMutation.mutate({
        userId,
        userName: userName ?? 'Athlete',
        gymId: selectedGymId ?? 'kabs',
        sport: 'General',
        totalVolume,
        streak: calculateStreak(updatedHistory),
        visits: updatedHistory.length,
      });

      updateStatsMutation.mutate({
        userId,
        totalWorkouts: updatedHistory.length,
        totalVolume,
        streak: calculateStreak(updatedHistory),
      });
    }

    const updatedComps = competitions.map((comp) => {
      if (comp.isCompleted) return comp;
      let newProgress = comp.userProgress;
      if (comp.type === 'daily_volume') {
        newProgress += totalVolume;
      } else if (comp.type === 'daily_sets') {
        newProgress += totalSets;
      } else if (comp.type === 'cardio') {
        const cardioDuration = activeWorkout.exercises
          .filter((ex) => {
            const found = allExercises.find((e) => e.id === ex.exerciseId);
            return found?.muscleGroup === 'Cardio';
          })
          .reduce((s, _) => s + Math.floor(duration / activeWorkout.exercises.length), 0);
        newProgress += Math.floor(cardioDuration / 60);
      }
      const isCompleted = comp.target ? newProgress >= comp.target : false;
      return { ...comp, userProgress: newProgress, isCompleted };
    });
    setCompetitions(updatedComps);
    saveMutation.mutate({ key: STORAGE_KEYS.competitions, value: JSON.stringify(updatedComps) });

    checkAchievements(updatedHistory, socialFeed, updatedComps);

    return completed;
  }, [activeWorkout, workoutHistory, saveMutation, competitions, allExercises, socialFeed, checkAchievements, userId, userName, selectedGymId, saveWorkoutMutation, submitScoreMutation, updateStatsMutation]);

  const discardWorkout = useCallback(() => {
    console.log('[AppContext] Discarding workout');
    setActiveWorkout(null);
    AsyncStorage.removeItem(STORAGE_KEYS.active);
  }, []);

  const addCustomExercise = useCallback(
    (exercise: Exercise) => {
      console.log('[AppContext] Adding custom exercise:', exercise.name);
      const updated = [...customExercises, exercise];
      setCustomExercises(updated);
      saveMutation.mutate({ key: STORAGE_KEYS.exercises, value: JSON.stringify(updated) });
    },
    [customExercises, saveMutation],
  );

  const saveRoutine = useCallback(
    (routine: Routine) => {
      console.log('[AppContext] Saving routine:', routine.name);
      const updated = [...savedRoutines, routine];
      setSavedRoutines(updated);
      saveMutation.mutate({ key: STORAGE_KEYS.routines, value: JSON.stringify(updated) });
    },
    [savedRoutines, saveMutation],
  );

  const deleteRoutine = useCallback(
    (routineId: string) => {
      const updated = savedRoutines.filter((r) => r.id !== routineId);
      setSavedRoutines(updated);
      saveMutation.mutate({ key: STORAGE_KEYS.routines, value: JSON.stringify(updated) });
    },
    [savedRoutines, saveMutation],
  );

  const shareWorkoutToFeed = useCallback((workout: Workout) => {
    console.log('[AppContext] Sharing workout to feed:', workout.name);
    const post: SharedPost = {
      id: `user_${Date.now()}`,
      userName: userName ?? 'You',
      type: 'workout',
      content: `Just finished "${workout.name}" — ${workout.exercises.length} exercises, ${workout.totalVolume.toLocaleString()} kg total volume!`,
      timestamp: 'Just now',
      likes: 0,
      likedByUser: false,
      volume: workout.totalVolume,
      workoutId: workout.id,
    };
    const updated = [post, ...socialFeed];
    setSocialFeed(updated);
    saveMutation.mutate({ key: STORAGE_KEYS.socialFeed, value: JSON.stringify(updated) });
    checkAchievements(workoutHistory, updated, competitions);

    if (userId && selectedGymId) {
      createPostMutation.mutate({
        userId,
        userName: userName ?? 'Athlete',
        gymId: selectedGymId,
        type: 'workout',
        content: post.content,
        volume: workout.totalVolume,
        workoutId: workout.id,
      });
    }
  }, [socialFeed, saveMutation, workoutHistory, competitions, checkAchievements, userId, userName, selectedGymId, createPostMutation]);

  const isAdmin = useMemo(() => userRole === 'admin' || userRole === 'coach', [userRole]);

  const switchRole = useCallback((role: UserRole) => {
    console.log('[AppContext] Switching role to:', role);
    setUserRole(role);
    saveMutation.mutate({ key: STORAGE_KEYS.userRole, value: role });
  }, [saveMutation]);

  const toggleLikePost = useCallback((postId: string) => {
    const updated = socialFeed.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          likedByUser: !p.likedByUser,
          likes: p.likedByUser ? p.likes - 1 : p.likes + 1,
        };
      }
      return p;
    });
    setSocialFeed(updated);
    saveMutation.mutate({ key: STORAGE_KEYS.socialFeed, value: JSON.stringify(updated) });

    if (userId) {
      toggleLikeMutation.mutate({ postId, userId });
    }
  }, [socialFeed, saveMutation, userId, toggleLikeMutation]);

  const weeklyVolume = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return workoutHistory
      .filter((w) => new Date(w.date).getTime() > oneWeekAgo)
      .reduce((sum, w) => sum + w.totalVolume, 0);
  }, [workoutHistory]);

  const weeklyWorkouts = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return workoutHistory.filter((w) => new Date(w.date).getTime() > oneWeekAgo).length;
  }, [workoutHistory]);

  const currentStreak = useMemo(() => calculateStreak(workoutHistory), [workoutHistory]);

  const analyticsData = useMemo(() => {
    const totalSessions = workoutHistory.length;
    const totalVolume = workoutHistory.reduce((s, w) => s + w.totalVolume, 0);
    const totalDuration = workoutHistory.reduce((s, w) => s + w.duration, 0);
    const avgVolume = totalSessions > 0 ? Math.round(totalVolume / totalSessions) : 0;
    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    const muscleGroupMap: Record<string, number> = {};
    const exerciseFrequency: Record<string, number> = {};
    workoutHistory.forEach((w) => {
      w.exercises.forEach((ex) => {
        const found = allExercises.find((e) => e.id === ex.exerciseId);
        const group = found?.muscleGroup ?? 'Other';
        muscleGroupMap[group] = (muscleGroupMap[group] ?? 0) + 1;
        exerciseFrequency[ex.exerciseName] = (exerciseFrequency[ex.exerciseName] ?? 0) + 1;
      });
    });

    const topMuscleGroups = Object.entries(muscleGroupMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topExercises = Object.entries(exerciseFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const weeklyData: { week: string; volume: number; sessions: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = Date.now() - i * 7 * 24 * 60 * 60 * 1000;
      const weekWorkouts = workoutHistory.filter((w) => {
        const t = new Date(w.date).getTime();
        return t > weekStart && t <= weekEnd;
      });
      weeklyData.push({
        week: `W${4 - i}`,
        volume: weekWorkouts.reduce((s, w) => s + w.totalVolume, 0),
        sessions: weekWorkouts.length,
      });
    }

    const personalRecords: { exercise: string; weight: number; reps: number }[] = [];
    const prMap: Record<string, { weight: number; reps: number }> = {};
    workoutHistory.forEach((w) => {
      w.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (set.completed) {
            const key = ex.exerciseName;
            if (!prMap[key] || set.weight > prMap[key].weight) {
              prMap[key] = { weight: set.weight, reps: set.reps };
            }
          }
        });
      });
    });
    Object.entries(prMap)
      .sort((a, b) => b[1].weight - a[1].weight)
      .slice(0, 8)
      .forEach(([exercise, data]) => {
        personalRecords.push({ exercise, ...data });
      });

    return {
      totalSessions,
      totalVolume,
      totalDuration,
      avgVolume,
      avgDuration,
      topMuscleGroups,
      topExercises,
      weeklyData,
      personalRecords,
      streak: currentStreak,
    };
  }, [workoutHistory, allExercises, currentStreak]);

  return {
    isLoading,
    isOnboarded,
    selectedGym,
    selectedGymId,
    userId,
    userName,
    workoutHistory,
    activeWorkout,
    customExercises,
    savedRoutines,
    allExercises,
    allRoutines,
    weeklyVolume,
    weeklyWorkouts,
    socialFeed,
    achievements,
    competitions,
    currentStreak,
    userRole,
    isAdmin,
    analyticsData,
    isAuthenticated,
    authEmail,
    login,
    signup,
    logout,
    switchRole,
    completeOnboarding,
    startFreestyleWorkout,
    startRoutineWorkout,
    repeatWorkout,
    addExerciseToWorkout,
    updateSet,
    toggleSetComplete,
    addSetToExercise,
    removeExerciseFromWorkout,
    replaceExerciseInWorkout,
    finishWorkout,
    discardWorkout,
    addCustomExercise,
    saveRoutine,
    deleteRoutine,
    shareWorkoutToFeed,
    toggleLikePost,
  };
});
