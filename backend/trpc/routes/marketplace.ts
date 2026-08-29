import * as z from "zod";

import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "../../lib/db";

const sportSchema = z.enum(["basketball", "track_field", "football", "general"]);

function mapTrainerProfile(row: Record<string, any>, name: string) {
  return {
    trainerId: row.trainer_id,
    name,
    bio: row.bio,
    specialties: (row.specialties ?? []) as z.infer<typeof sportSchema>[],
    hourlyRate: row.hourly_rate,
    yearsExperience: row.years_experience,
    avatarUrl: row.avatar_url,
    isPublic: row.is_public,
  };
}

export const marketplaceRouter = createTRPCRouter({
  listTrainers: protectedProcedure
    .input(z.object({ sport: sportSchema.optional() }).optional())
    .query(async ({ input }) => {
      const { data: rows, error } = await db
        .from("trainer_profiles")
        .select("*")
        .eq("is_public", true)
        .order("updated_at", { ascending: false });
      if (error || !rows || rows.length === 0) return [];

      const trainerIds = rows.map((r) => r.trainer_id);
      const { data: profiles } = await db.from("profiles").select("id, name").in("id", trainerIds);

      const mapped = rows.map((row) => {
        const profile = profiles?.find((p) => p.id === row.trainer_id);
        return mapTrainerProfile(row, profile?.name ?? "Trainer");
      });

      if (input?.sport) {
        return mapped.filter((t) => t.specialties.includes(input.sport as any));
      }
      return mapped;
    }),

  getTrainer: protectedProcedure
    .input(z.object({ trainerId: z.string() }))
    .query(async ({ input }) => {
      const { data: row, error } = await db
        .from("trainer_profiles")
        .select("*")
        .eq("trainer_id", input.trainerId)
        .eq("is_public", true)
        .single();
      if (error || !row) return null;
      const { data: profile } = await db.from("profiles").select("name").eq("id", input.trainerId).single();
      return mapTrainerProfile(row, profile?.name ?? "Trainer");
    }),

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await db
      .from("trainer_profiles")
      .select("*")
      .eq("trainer_id", ctx.userId)
      .single();
    if (error || !data) return null;
    return mapTrainerProfile(data, "");
  }),

  saveMyProfile: protectedProcedure
    .input(
      z.object({
        bio: z.string().optional(),
        specialties: z.array(sportSchema).optional(),
        hourlyRate: z.number().optional(),
        yearsExperience: z.number().optional(),
        avatarUrl: z.string().optional(),
        isPublic: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await db
        .from("trainer_profiles")
        .upsert({
          trainer_id: ctx.userId,
          bio: input.bio ?? null,
          specialties: input.specialties ?? [],
          hourly_rate: input.hourlyRate ?? null,
          years_experience: input.yearsExperience ?? null,
          avatar_url: input.avatarUrl ?? null,
          is_public: input.isPublic ?? false,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapTrainerProfile(data, "");
    }),
});
