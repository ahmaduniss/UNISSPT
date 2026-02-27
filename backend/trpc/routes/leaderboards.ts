import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

interface LeaderboardEntry {
  id: string;
  name: string;
  totalVolume: number;
  streak: number;
  visits: number;
  sport: string;
  gymId: string;
}

const leaderboardEntries: LeaderboardEntry[] = [
  { id: "lb1", name: "Ahmad K.", totalVolume: 185000, streak: 15, visits: 48, sport: "Powerlifting", gymId: "kabs" },
  { id: "lb2", name: "Omar S.", totalVolume: 162000, streak: 12, visits: 42, sport: "Powerlifting", gymId: "kabs" },
  { id: "lb3", name: "Haikal M.", totalVolume: 148000, streak: 22, visits: 55, sport: "CrossFit", gymId: "kabs" },
  { id: "lb4", name: "Yusuf A.", totalVolume: 134000, streak: 8, visits: 35, sport: "CrossFit", gymId: "kabs" },
  { id: "lb5", name: "Khalid R.", totalVolume: 128000, streak: 18, visits: 40, sport: "Bodybuilding", gymId: "kabs" },
  { id: "lb6", name: "Faisal T.", totalVolume: 115000, streak: 10, visits: 30, sport: "Bodybuilding", gymId: "kabs" },
  { id: "lb7", name: "Nasser B.", totalVolume: 105000, streak: 6, visits: 25, sport: "Powerlifting", gymId: "kabs" },
  { id: "lb8", name: "Tariq J.", totalVolume: 98000, streak: 14, visits: 38, sport: "CrossFit", gymId: "kabs" },
  { id: "lb9", name: "Saif D.", totalVolume: 92000, streak: 5, visits: 22, sport: "Bodybuilding", gymId: "kabs" },
  { id: "lb10", name: "Rashed Q.", totalVolume: 85000, streak: 9, visits: 28, sport: "General", gymId: "kabs" },
];

export const leaderboardsRouter = createTRPCRouter({
  getLeaderboard: publicProcedure
    .input(
      z.object({
        gymId: z.string(),
        sport: z.string().optional(),
      }),
    )
    .query(({ input }) => {
      console.log("[leaderboards] getLeaderboard gym:", input.gymId, "sport:", input.sport);
      let entries = leaderboardEntries.filter((e) => e.gymId === input.gymId);
      if (input.sport && input.sport !== "All") {
        entries = entries.filter((e) => e.sport === input.sport);
      }
      return entries.sort((a, b) => b.totalVolume - a.totalVolume);
    }),

  submitScore: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        userName: z.string(),
        gymId: z.string(),
        sport: z.string(),
        totalVolume: z.number(),
        streak: z.number(),
        visits: z.number(),
      }),
    )
    .mutation(({ input }) => {
      console.log("[leaderboards] submitScore:", input.userName, input.totalVolume);
      const existing = leaderboardEntries.findIndex((e) => e.id === input.userId);
      const entry: LeaderboardEntry = {
        id: input.userId,
        name: input.userName,
        totalVolume: input.totalVolume,
        streak: input.streak,
        visits: input.visits,
        sport: input.sport,
        gymId: input.gymId,
      };
      if (existing >= 0) {
        leaderboardEntries[existing] = entry;
      } else {
        leaderboardEntries.push(entry);
      }
      return { success: true };
    }),
});
