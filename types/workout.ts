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
  notes?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  previousSets?: WorkoutSet[];
}

export interface Workout {
  id: string;
  clientId: string;
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
  usageCount?: number;
}

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
}

export interface ActiveWorkout {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  startTime: number;
  exercises: WorkoutExercise[];
}

export type ClientStatus = 'active' | 'inactive';

export type SportKey = 'basketball' | 'track_field' | 'football' | 'general';

export type UserRole = 'trainer' | 'client';

export type BookingStatus = 'pending' | 'accepted' | 'declined';

export interface BookingRequest {
  id: string;
  clientUserId: string;
  trainerId: string;
  clientName: string;
  message?: string | null;
  status: BookingStatus;
  createdAt: string;
  respondedAt?: string | null;
}

export interface TrainerProfile {
  trainerId: string;
  name: string;
  bio?: string | null;
  specialties: SportKey[];
  hourlyRate?: number | null;
  yearsExperience?: number | null;
  avatarUrl?: string | null;
  isPublic: boolean;
}

export interface Client {
  id: string;
  trainerId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  goal?: string | null;
  notes?: string | null;
  startingWeightKg?: number | null;
  status: ClientStatus;
  avatarUrl?: string | null;
  sport: SportKey;
  createdAt: string;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  unit: string;
  lowerIsBetter?: boolean;
  isCustom?: boolean;
}

export interface PerformanceTest {
  id: string;
  clientId: string;
  metricId: string;
  metricName: string;
  unit: string;
  value: number;
  recordedAt: string;
  notes?: string | null;
  createdAt: string;
}

export interface ProgressPhoto {
  id: string;
  clientId: string;
  storagePath: string;
  url: string;
  takenAt: string;
  weightKg?: number | null;
  notes?: string | null;
  createdAt: string;
}
