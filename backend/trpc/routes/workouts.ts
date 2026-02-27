import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

const workoutSetSchema = z.object({
  weight: z.number(),
  reps: z.number(),
  completed: z.boolean(),
});

const workoutExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  sets: z.array(workoutSetSchema),
  previousSets: z.array(workoutSetSchema).optional(),
});

const workoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  duration: z.number(),
  exercises: z.array(workoutExerciseSchema),
  totalVolume: z.number(),
});

const workouts: Record<string, z.infer<typeof workoutSchema>[]> = {};

export const workoutsRouter = createTRPCRouter({
  getHistory: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      console.log("[workouts] getHistory for user:", input.userId);
      return workouts[input.userId] ?? [];
    }),

  saveWorkout: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        workout: workoutSchema,
      }),
    )
    .mutation(({ input }) => {
      console.log("[workouts] saveWorkout for user:", input.userId, "workout:", input.workout.name);
      if (!workouts[input.userId]) {
        workouts[input.userId] = [];
      }
      workouts[input.userId].unshift(input.workout);
      return { success: true, workout: input.workout };
    }),

  deleteWorkout: publicProcedure
    .input(z.object({ userId: z.string(), workoutId: z.string() }))
    .mutation(({ input }) => {
      console.log("[workouts] deleteWorkout:", input.workoutId);
      if (workouts[input.userId]) {
        workouts[input.userId] = workouts[input.userId].filter(
          (w) => w.id !== input.workoutId,
        );
      }
      return { success: true };
    }),

  syncHistory: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        workouts: z.array(workoutSchema),
      }),
    )
    .mutation(({ input }) => {
      console.log("[workouts] syncHistory for user:", input.userId, "count:", input.workouts.length);
      workouts[input.userId] = input.workouts;
      return { success: true, count: input.workouts.length };
    }),
});
