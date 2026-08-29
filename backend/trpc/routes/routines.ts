import * as z from "zod";

import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "../../lib/db";

const routineExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  targetSets: z.number(),
});

function mapRoutine(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    exercises: row.exercises as z.infer<typeof routineExerciseSchema>[],
    usageCount: row.usage_count,
    createdAt: row.created_at,
  };
}

export const routinesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await db
      .from("trainer_routines")
      .select("*")
      .eq("trainer_id", ctx.userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map(mapRoutine);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        exercises: z.array(routineExerciseSchema),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await db
        .from("trainer_routines")
        .insert({
          trainer_id: ctx.userId,
          name: input.name,
          exercises: input.exercises,
          usage_count: 0,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapRoutine(data);
    }),

  delete: protectedProcedure
    .input(z.object({ routineId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { error } = await db
        .from("trainer_routines")
        .delete()
        .eq("id", input.routineId)
        .eq("trainer_id", ctx.userId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }),

  incrementUsage: protectedProcedure
    .input(z.object({ routineId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { data: existing } = await db
        .from("trainer_routines")
        .select("usage_count")
        .eq("id", input.routineId)
        .eq("trainer_id", ctx.userId)
        .single();
      if (!existing) return { success: false };
      await db
        .from("trainer_routines")
        .update({ usage_count: (existing.usage_count ?? 0) + 1 })
        .eq("id", input.routineId);
      return { success: true };
    }),
});
