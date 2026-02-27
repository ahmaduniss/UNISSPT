import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

const routineExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  targetSets: z.number(),
});

interface SharedRoutine {
  id: string;
  name: string;
  exercises: { exerciseId: string; exerciseName: string; targetSets: number }[];
  creatorId: string;
  creatorName: string;
  gymId: string;
  usageCount: number;
  isCoach: boolean;
  createdAt: string;
}

const sharedRoutines: SharedRoutine[] = [
  {
    id: "sr1",
    name: "Haikal's Power Builder",
    exercises: [
      { exerciseId: "1", exerciseName: "Barbell Bench Press", targetSets: 4 },
      { exerciseId: "2", exerciseName: "Barbell Squat", targetSets: 4 },
      { exerciseId: "3", exerciseName: "Deadlift", targetSets: 3 },
      { exerciseId: "5", exerciseName: "Overhead Press", targetSets: 3 },
    ],
    creatorId: "coach1",
    creatorName: "Coach Haikal",
    gymId: "kabs",
    usageCount: 87,
    isCoach: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sr2",
    name: "Abu Ali's Hypertrophy Split",
    exercises: [
      { exerciseId: "1", exerciseName: "Barbell Bench Press", targetSets: 4 },
      { exerciseId: "6", exerciseName: "Dumbbell Row", targetSets: 4 },
      { exerciseId: "7", exerciseName: "Lateral Raises", targetSets: 3 },
      { exerciseId: "4", exerciseName: "Pull Ups", targetSets: 3 },
    ],
    creatorId: "coach2",
    creatorName: "Coach Abu Ali",
    gymId: "kabs",
    usageCount: 65,
    isCoach: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const routinesRouter = createTRPCRouter({
  getShared: publicProcedure
    .input(
      z.object({
        gymId: z.string(),
      }),
    )
    .query(({ input }) => {
      console.log("[routines] getShared gym:", input.gymId);
      return sharedRoutines
        .filter((r) => r.gymId === input.gymId)
        .sort((a, b) => b.usageCount - a.usageCount);
    }),

  shareRoutine: publicProcedure
    .input(
      z.object({
        name: z.string(),
        exercises: z.array(routineExerciseSchema),
        creatorId: z.string(),
        creatorName: z.string(),
        gymId: z.string(),
        isCoach: z.boolean().default(false),
      }),
    )
    .mutation(({ input }) => {
      console.log("[routines] shareRoutine:", input.name, "by:", input.creatorName);
      const routine: SharedRoutine = {
        id: `sr_${Date.now()}`,
        name: input.name,
        exercises: input.exercises,
        creatorId: input.creatorId,
        creatorName: input.creatorName,
        gymId: input.gymId,
        usageCount: 0,
        isCoach: input.isCoach,
        createdAt: new Date().toISOString(),
      };
      sharedRoutines.push(routine);
      return routine;
    }),

  incrementUsage: publicProcedure
    .input(z.object({ routineId: z.string() }))
    .mutation(({ input }) => {
      console.log("[routines] incrementUsage:", input.routineId);
      const routine = sharedRoutines.find((r) => r.id === input.routineId);
      if (routine) {
        routine.usageCount += 1;
      }
      return { success: true };
    }),

  getTrending: publicProcedure
    .input(z.object({ gymId: z.string(), limit: z.number().default(10) }))
    .query(({ input }) => {
      console.log("[routines] getTrending gym:", input.gymId);
      return sharedRoutines
        .filter((r) => r.gymId === input.gymId)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, input.limit);
    }),
});
