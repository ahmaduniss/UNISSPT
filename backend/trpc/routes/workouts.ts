import * as z from "zod";

import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "../../lib/db";

const workoutSetSchema = z.object({
  weight: z.number(),
  reps: z.number(),
  completed: z.boolean(),
  notes: z.string().optional(),
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

async function assertOwnsClient(clientId: string, trainerId: string) {
  const { data, error } = await db
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("trainer_id", trainerId)
    .single();
  if (error || !data) throw new Error("Client not found");
}

async function assertCanViewClient(clientId: string, userId: string) {
  const { data, error } = await db
    .from("clients")
    .select("id, trainer_id, user_id")
    .eq("id", clientId)
    .single();
  if (error || !data) throw new Error("Client not found");
  if (data.trainer_id !== userId && data.user_id !== userId) {
    throw new Error("Client not found");
  }
}

export const workoutsRouter = createTRPCRouter({
  getHistory: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input, ctx }) => {
      await assertCanViewClient(input.clientId, ctx.userId);
      const { data, error } = await db
        .from("workouts")
        .select("*")
        .eq("client_id", input.clientId)
        .order("date", { ascending: false });
      if (error) return [];
      return (data ?? []).map((row) => ({
        id: row.id,
        clientId: row.client_id,
        name: row.name,
        date: row.date,
        duration: row.duration,
        totalVolume: row.total_volume,
        exercises: row.exercises as z.infer<typeof workoutExerciseSchema>[],
      }));
    }),

  saveWorkout: protectedProcedure
    .input(z.object({ clientId: z.string(), workout: workoutSchema }))
    .mutation(async ({ input, ctx }) => {
      await assertOwnsClient(input.clientId, ctx.userId);
      const { error } = await db.from("workouts").upsert({
        id: input.workout.id,
        client_id: input.clientId,
        trainer_id: ctx.userId,
        name: input.workout.name,
        date: input.workout.date,
        duration: input.workout.duration,
        total_volume: input.workout.totalVolume,
        exercises: input.workout.exercises,
      });
      if (error) throw new Error(error.message);
      return { success: true, workout: { ...input.workout, clientId: input.clientId } };
    }),

  deleteWorkout: protectedProcedure
    .input(z.object({ clientId: z.string(), workoutId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await assertOwnsClient(input.clientId, ctx.userId);
      const { error } = await db
        .from("workouts")
        .delete()
        .eq("id", input.workoutId)
        .eq("client_id", input.clientId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }),
});
