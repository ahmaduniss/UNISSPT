import * as z from "zod";

import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "../../lib/db";

const BUCKET = "progress-photos";

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

function mapPhoto(row: Record<string, any>) {
  const { data } = db.storage.from(BUCKET).getPublicUrl(row.storage_path);
  return {
    id: row.id,
    clientId: row.client_id,
    storagePath: row.storage_path,
    url: data.publicUrl,
    takenAt: row.taken_at,
    weightKg: row.weight_kg,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export const progressPhotosRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input, ctx }) => {
      await assertCanViewClient(input.clientId, ctx.userId);
      const { data, error } = await db
        .from("progress_photos")
        .select("*")
        .eq("client_id", input.clientId)
        .order("taken_at", { ascending: false });
      if (error) return [];
      return (data ?? []).map(mapPhoto);
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        storagePath: z.string(),
        takenAt: z.string(),
        weightKg: z.number().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertOwnsClient(input.clientId, ctx.userId);
      const { data, error } = await db
        .from("progress_photos")
        .insert({
          client_id: input.clientId,
          trainer_id: ctx.userId,
          storage_path: input.storagePath,
          taken_at: input.takenAt,
          weight_kg: input.weightKg ?? null,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapPhoto(data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { data: photo, error: fetchError } = await db
        .from("progress_photos")
        .select("storage_path, trainer_id")
        .eq("id", input.id)
        .single();
      if (fetchError || !photo || photo.trainer_id !== ctx.userId) {
        throw new Error("Photo not found");
      }
      await db.storage.from(BUCKET).remove([photo.storage_path]);
      const { error } = await db.from("progress_photos").delete().eq("id", input.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }),
});
