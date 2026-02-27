export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  isCustom?: boolean;
}

export interface WorkoutSet {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  previousSets?: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  duration: number;
  exercises: WorkoutExercise[];
  totalVolume: number;
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  isCoach?: boolean;
  coachName?: string;
  usageCount?: number;
}

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
}

export interface ActiveWorkout {
  id: string;
  name: string;
  startTime: number;
  exercises: WorkoutExercise[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  totalVolume: number;
  streak: number;
  visits: number;
  sport: string;
}

export interface SocialPost {
  id: string;
  userName: string;
  type: 'workout' | 'pr' | 'streak';
  content: string;
  timestamp: string;
  likes: number;
  volume?: number;
}

export interface Gym {
  id: string;
  name: string;
  location: string;
  active: boolean;
}

export interface Competition {
  id: string;
  type: 'daily_volume' | 'daily_sets' | 'cardio';
  title: string;
  description: string;
  date: string;
  target?: number;
  userProgress: number;
  isCompleted: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  requirement: number;
  category: 'volume' | 'sessions' | 'streak' | 'social' | 'competition';
}

export interface SharedPost {
  id: string;
  userName: string;
  type: 'workout' | 'pr' | 'streak' | 'achievement';
  content: string;
  timestamp: string;
  likes: number;
  likedByUser: boolean;
  volume?: number;
  workoutId?: string;
}

export type UserRole = 'member' | 'coach' | 'admin';

export interface GymMember {
  id: string;
  name: string;
  joinDate: string;
  totalWorkouts: number;
  lastVisit: string;
  sport: string;
  status: 'active' | 'inactive';
}

export interface AdminCompetition {
  id: string;
  type: 'daily_volume' | 'daily_sets' | 'cardio';
  title: string;
  description: string;
  date: string;
  target: number;
  gymId: string;
  prize?: string;
  createdBy: string;
  participants: {
    userId: string;
    userName: string;
    progress: number;
    isCompleted: boolean;
    verifiedByAdmin: boolean;
  }[];
}

export interface GymAnalytics {
  gymId: string;
  totalMembers: number;
  activeToday: number;
  totalWorkoutsThisWeek: number;
  totalVolumeThisWeek: number;
  averageSessionDuration: number;
  peakHours: { hour: number; count: number }[];
  topExercises: { name: string; count: number }[];
  memberRetention: number;
  sportBreakdown: { sport: string; count: number }[];
}
