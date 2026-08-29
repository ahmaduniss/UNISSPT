import * as z from "zod";

import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "../../lib/db";

function mapRequest(row: Record<string, any>) {
  return {
    id: row.id,
    clientUserId: row.client_user_id,
    trainerId: row.trainer_id,
    clientName: row.client_name,
    message: row.message,
    status: row.status as "pending" | "accepted" | "declined",
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

export const bookingsRouter = createTRPCRouter({
  sendRequest: protectedProcedure
    .input(z.object({ trainerId: z.string(), message: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { data: profile } = await db.from("profiles").select("name").eq("id", ctx.userId).single();
      const { data, error } = await db
        .from("booking_requests")
        .insert({
          client_user_id: ctx.userId,
          trainer_id: input.trainerId,
          client_name: profile?.name ?? "A client",
          message: input.message || null,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapRequest(data);
    }),

  sentRequests: protectedProcedure.query(async ({ ctx }) => {
    const { data: rows, error } = await db
      .from("booking_requests")
      .select("*")
      .eq("client_user_id", ctx.userId)
      .order("created_at", { ascending: false });
    if (error || !rows) return [];

    const trainerIds = [...new Set(rows.map((r) => r.trainer_id))];
    const { data: profiles } = await db.from("profiles").select("id, name").in("id", trainerIds);

    return rows.map((row) => ({
      ...mapRequest(row),
      trainerName: profiles?.find((p) => p.id === row.trainer_id)?.name ?? "Trainer",
    }));
  }),

  incomingRequests: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await db
      .from("booking_requests")
      .select("*")
      .eq("trainer_id", ctx.userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map(mapRequest);
  }),

  respond: protectedProcedure
    .input(z.object({ requestId: z.string(), accept: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const { data: request, error: fetchError } = await db
        .from("booking_requests")
        .select("*")
        .eq("id", input.requestId)
        .eq("trainer_id", ctx.userId)
        .single();
      if (fetchError || !request) throw new Error("Request not found");

      const { error: updateError } = await db
        .from("booking_requests")
        .update({
          status: input.accept ? "accepted" : "declined",
          responded_at: new Date().toISOString(),
        })
        .eq("id", input.requestId);
      if (updateError) throw new Error(updateError.message);

      if (input.accept) {
        const { error: clientError } = await db
          .from("clients")
          .upsert(
            {
              trainer_id: ctx.userId,
              user_id: request.client_user_id,
              name: request.client_name,
              status: "active",
            },
            { onConflict: "trainer_id,user_id" },
          );
        if (clientError) throw new Error(clientError.message);
      }

      return { success: true };
    }),
});
