import * as z from "zod";

import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "../../lib/db";

const roleSchema = z.enum(["trainer", "client"]);

export const usersRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("id", ctx.userId)
      .single();
    if (error || !data) return null;
    return { id: data.id, name: data.name, role: data.role as z.infer<typeof roleSchema> };
  }),

  saveProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1), role: roleSchema.optional() }))
    .mutation(async ({ input, ctx }) => {
      const upsertData: Record<string, unknown> = { id: ctx.userId, name: input.name };
      if (input.role) upsertData.role = input.role;
      const { data, error } = await db
        .from("profiles")
        .upsert(upsertData)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { id: data.id, name: data.name, role: data.role as z.infer<typeof roleSchema> };
    }),
});
