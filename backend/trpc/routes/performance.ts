import * as z from "zod";

import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "../../lib/db";

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

function mapTest(row: Record<string, any>) {
  return {
    id: row.id,
    clientId: row.client_id,
    metricId: row.metric_id,
    metricName: row.metric_name,
    unit: row.unit,
    value: Number(row.value),
    recordedAt: row.recorded_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export const performanceRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input, ctx }) => {
      await assertCanViewClient(input.clientId, ctx.userId);
      const { data, error } = await db
        .from("performance_tests")
        .select("*")
        .eq("client_id", input.clientId)
        .order("recorded_at", { ascending: false });
      if (error) return [];
      return (data ?? []).map(mapTest);
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        metricId: z.string(),
        metricName: z.string(),
        unit: z.string(),
        value: z.number(),
        recordedAt: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertOwnsClient(input.clientId, ctx.userId);
      const { data, error } = await db
        .from("performance_tests")
        .insert({
          client_id: input.clientId,
          trainer_id: ctx.userId,
          metric_id: input.metricId,
          metric_name: input.metricName,
          unit: input.unit,
          value: input.value,
          recorded_at: input.recordedAt,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapTest(data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { error } = await db
        .from("performance_tests")
        .delete()
        .eq("id", input.id)
        .eq("trainer_id", ctx.userId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }),
});
