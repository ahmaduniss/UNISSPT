import { Routine } from '@/types/workout';

export const COACH_ROUTINES: Routine[] = [
  {
    id: 'cr1',
    name: "Haikal's Power Builder",
    isCoach: true,
    coachName: 'Haikal M.',
    usageCount: 1247,
    exercises: [
      { exerciseId: 'e1', exerciseName: 'Barbell Bench Press', targetSets: 5 },
      { exerciseId: 'e30', exerciseName: 'Barbell Squat', targetSets: 5 },
      { exerciseId: 'e10', exerciseName: 'Conventional Deadlift', targetSets: 3 },
      { exerciseId: 'e20', exerciseName: 'Overhead Press', targetSets: 4 },
      { exerciseId: 'e11', exerciseName: 'Barbell Row', targetSets: 4 },
    ],
  },
  {
    id: 'cr2',
    name: "Abu Ali's Hypertrophy Split",
    isCoach: true,
    coachName: 'Abu Ali',
    usageCount: 983,
    exercises: [
      { exerciseId: 'e2', exerciseName: 'Incline Dumbbell Press', targetSets: 4 },
      { exerciseId: 'e3', exerciseName: 'Dumbbell Flyes', targetSets: 3 },
      { exerciseId: 'e4', exerciseName: 'Cable Crossover', targetSets: 3 },
      { exerciseId: 'e41', exerciseName: 'Tricep Pushdown', targetSets: 4 },
      { exerciseId: 'e43', exerciseName: 'Skull Crusher', targetSets: 3 },
      { exerciseId: 'e21', exerciseName: 'Lateral Raise', targetSets: 4 },
    ],
  },
  {
    id: 'cr3',
    name: "Sara's Athletic Circuit",
    isCoach: true,
    coachName: 'Sara K.',
    usageCount: 756,
    exercises: [
      { exerciseId: 'e30', exerciseName: 'Barbell Squat', targetSets: 4 },
      { exerciseId: 'e37', exerciseName: 'Hip Thrust', targetSets: 4 },
      { exerciseId: 'e12', exerciseName: 'Pull-ups', targetSets: 3 },
      { exerciseId: 'e5', exerciseName: 'Push-ups', targetSets: 3 },
      { exerciseId: 'e52', exerciseName: 'Hanging Leg Raise', targetSets: 3 },
    ],
  },
];
