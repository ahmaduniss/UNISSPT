import * as z from "zod";

import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "../../lib/db";

const sportSchema = z.enum(["basketball", "track_field", "football", "general"]);

function mapClient(row: Record<string, any>, includeNotes = true) {
  return {
    id: row.id,
    trainerId: row.trainer_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    goal: row.goal,
    notes: includeNotes ? row.notes : null,
    startingWeightKg: row.starting_weight_kg,
    status: row.status as "active" | "inactive",
    avatarUrl: row.avatar_url,
    sport: (row.sport ?? "general") as z.infer<typeof sportSchema>,
    createdAt: row.created_at,
  };
}

export const clientsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await db
      .from("clients")
      .select("*")
      .eq("trainer_id", ctx.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapClient(row));
  }),

  getById: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await db
        .from("clients")
        .select("*")
        .eq("id", input.clientId)
        .single();
      if (error || !data) return null;
      const isTrainer = data.trainer_id === ctx.userId;
      const isLinkedClient = data.user_id === ctx.userId;
      if (!isTrainer && !isLinkedClient) return null;
      return mapClient(data, isTrainer);
    }),

  myCoaches: protectedProcedure.query(async ({ ctx }) => {
    const { data: rows, error } = await db
      .from("clients")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false });
    if (error || !rows || rows.length === 0) return [];

    const trainerIds = [...new Set(rows.map((r) => r.trainer_id))];
    const [{ data: profiles }, { data: trainerProfiles }] = await Promise.all([
      db.from("profiles").select("id, name").in("id", trainerIds),
      db.from("trainer_profiles").select("*").in("trainer_id", trainerIds),
    ]);

    return rows.map((row) => {
      const profile = profiles?.find((p) => p.id === row.trainer_id);
      const tp = trainerProfiles?.find((t) => t.trainer_id === row.trainer_id);
      return {
        ...mapClient(row, false),
        trainerName: profile?.name ?? "Coach",
        trainerBio: tp?.bio ?? null,
        trainerAvatarUrl: tp?.avatar_url ?? null,
      };
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().optional(),
        phone: z.string().optional(),
        goal: z.string().optional(),
        notes: z.string().optional(),
        startingWeightKg: z.number().optional(),
        sport: sportSchema.optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await db
        .from("clients")
        .insert({
          trainer_id: ctx.userId,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          goal: input.goal || null,
          notes: input.notes || null,
          starting_weight_kg: input.startingWeightKg ?? null,
          sport: input.sport ?? "general",
          status: "active",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapClient(data);
    }),

  update: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        goal: z.string().optional(),
        notes: z.string().optional(),
        startingWeightKg: z.number().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        sport: sportSchema.optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { clientId, ...rest } = input;
      const updates: Record<string, unknown> = {};
      if (rest.name !== undefined) updates.name = rest.name;
      if (rest.email !== undefined) updates.email = rest.email || null;
      if (rest.phone !== undefined) updates.phone = rest.phone || null;
      if (rest.goal !== undefined) updates.goal = rest.goal || null;
      if (rest.notes !== undefined) updates.notes = rest.notes || null;
      if (rest.startingWeightKg !== undefined) updates.starting_weight_kg = rest.startingWeightKg;
      if (rest.status !== undefined) updates.status = rest.status;
      if (rest.sport !== undefined) updates.sport = rest.sport;

      const { data, error } = await db
        .from("clients")
        .update(updates)
        .eq("id", clientId)
        .eq("trainer_id", ctx.userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapClient(data);
    }),

  archive: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { error } = await db
        .from("clients")
        .update({ status: "inactive" })
        .eq("id", input.clientId)
        .eq("trainer_id", ctx.userId);
      if (error) throw new Error(error.message);
      return { success: true };
    }),
});
