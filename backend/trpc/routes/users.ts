import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

interface User {
  id: string;
  name: string;
  gymId: string;
  sport: string;
  role: "member" | "coach" | "admin";
  joinDate: string;
  totalWorkouts: number;
  totalVolume: number;
  streak: number;
}

const users: Record<string, User> = {};

export const usersRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        gymId: z.string(),
        sport: z.string().default("General"),
      }),
    )
    .mutation(({ input }) => {
      console.log("[users] register:", input.name, "gym:", input.gymId);
      const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const user: User = {
        id,
        name: input.name,
        gymId: input.gymId,
        sport: input.sport,
        role: "member",
        joinDate: new Date().toISOString(),
        totalWorkouts: 0,
        totalVolume: 0,
        streak: 0,
      };
      users[id] = user;
      return user;
    }),

  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      console.log("[users] getProfile:", input.userId);
      return users[input.userId] ?? null;
    }),

  updateProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        sport: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      console.log("[users] updateProfile:", input.userId);
      const user = users[input.userId];
      if (!user) return { success: false, error: "User not found" };
      if (input.name) user.name = input.name;
      if (input.sport) user.sport = input.sport;
      return { success: true, user };
    }),

  updateStats: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        totalWorkouts: z.number(),
        totalVolume: z.number(),
        streak: z.number(),
      }),
    )
    .mutation(({ input }) => {
      console.log("[users] updateStats:", input.userId);
      const user = users[input.userId];
      if (!user) return { success: false, error: "User not found" };
      user.totalWorkouts = input.totalWorkouts;
      user.totalVolume = input.totalVolume;
      user.streak = input.streak;
      return { success: true };
    }),
});
