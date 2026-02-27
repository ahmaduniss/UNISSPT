import { Exercise } from '@/types/workout';

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Legs',
  'Arms',
  'Core',
  'Cardio',
  'Olympic',
] as const;

export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'e1', name: 'Barbell Bench Press', muscleGroup: 'Chest' },
  { id: 'e2', name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { id: 'e3', name: 'Dumbbell Flyes', muscleGroup: 'Chest' },
  { id: 'e4', name: 'Cable Crossover', muscleGroup: 'Chest' },
  { id: 'e5', name: 'Push-ups', muscleGroup: 'Chest' },
  { id: 'e6', name: 'Decline Bench Press', muscleGroup: 'Chest' },

  { id: 'e10', name: 'Conventional Deadlift', muscleGroup: 'Back' },
  { id: 'e11', name: 'Barbell Row', muscleGroup: 'Back' },
  { id: 'e12', name: 'Pull-ups', muscleGroup: 'Back' },
  { id: 'e13', name: 'Lat Pulldown', muscleGroup: 'Back' },
  { id: 'e14', name: 'Seated Cable Row', muscleGroup: 'Back' },
  { id: 'e15', name: 'T-Bar Row', muscleGroup: 'Back' },
  { id: 'e16', name: 'Face Pull', muscleGroup: 'Back' },

  { id: 'e20', name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { id: 'e21', name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { id: 'e22', name: 'Front Raise', muscleGroup: 'Shoulders' },
  { id: 'e23', name: 'Arnold Press', muscleGroup: 'Shoulders' },
  { id: 'e24', name: 'Rear Delt Fly', muscleGroup: 'Shoulders' },
  { id: 'e25', name: 'Upright Row', muscleGroup: 'Shoulders' },

  { id: 'e30', name: 'Barbell Squat', muscleGroup: 'Legs' },
  { id: 'e31', name: 'Leg Press', muscleGroup: 'Legs' },
  { id: 'e32', name: 'Romanian Deadlift', muscleGroup: 'Legs' },
  { id: 'e33', name: 'Leg Curl', muscleGroup: 'Legs' },
  { id: 'e34', name: 'Leg Extension', muscleGroup: 'Legs' },
  { id: 'e35', name: 'Calf Raise', muscleGroup: 'Legs' },
  { id: 'e36', name: 'Bulgarian Split Squat', muscleGroup: 'Legs' },
  { id: 'e37', name: 'Hip Thrust', muscleGroup: 'Legs' },
  { id: 'e38', name: 'Hack Squat', muscleGroup: 'Legs' },

  { id: 'e40', name: 'Barbell Curl', muscleGroup: 'Arms' },
  { id: 'e41', name: 'Tricep Pushdown', muscleGroup: 'Arms' },
  { id: 'e42', name: 'Hammer Curl', muscleGroup: 'Arms' },
  { id: 'e43', name: 'Skull Crusher', muscleGroup: 'Arms' },
  { id: 'e44', name: 'Preacher Curl', muscleGroup: 'Arms' },
  { id: 'e45', name: 'Overhead Tricep Extension', muscleGroup: 'Arms' },
  { id: 'e46', name: 'Concentration Curl', muscleGroup: 'Arms' },
  { id: 'e47', name: 'Dips', muscleGroup: 'Arms' },

  { id: 'e50', name: 'Plank', muscleGroup: 'Core' },
  { id: 'e51', name: 'Cable Crunch', muscleGroup: 'Core' },
  { id: 'e52', name: 'Hanging Leg Raise', muscleGroup: 'Core' },
  { id: 'e53', name: 'Russian Twist', muscleGroup: 'Core' },
  { id: 'e54', name: 'Ab Wheel Rollout', muscleGroup: 'Core' },

  { id: 'e60', name: 'Treadmill Run', muscleGroup: 'Cardio' },
  { id: 'e61', name: 'Rowing Machine', muscleGroup: 'Cardio' },
  { id: 'e62', name: 'Assault Bike', muscleGroup: 'Cardio' },
  { id: 'e63', name: 'Jump Rope', muscleGroup: 'Cardio' },

  { id: 'e70', name: 'Power Clean', muscleGroup: 'Olympic' },
  { id: 'e71', name: 'Snatch', muscleGroup: 'Olympic' },
  { id: 'e72', name: 'Clean and Jerk', muscleGroup: 'Olympic' },
];

export const GYMS = [
  { id: 'kabs', name: 'KABS UNDERGROUND', location: 'Downtown', active: true },
  { id: 'ironworks', name: 'IRONWORKS GYM', location: 'East Side', active: false },
  { id: 'titan', name: 'TITAN FITNESS', location: 'Westfield', active: false },
  { id: 'apex', name: 'APEX ATHLETICS', location: 'North Quarter', active: false },
];
