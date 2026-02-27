import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

interface GymAnalytics {
  gymId: string;
  totalMembers: number;
  activeToday: number;
  totalWorkoutsThisWeek: number;
  totalVolumeThisWeek: number;
  averageSessionDuration: number;
  peakHours: { hour: number; count: number }[];
  topExercises: { name: string; count: number }[];
  memberRetention: number;
  sportBreakdown: { sport: string; count: number }[];
}

const gymAnalytics: Record<string, GymAnalytics> = {
  kabs: {
    gymId: "kabs",
    totalMembers: 156,
    activeToday: 28,
    totalWorkoutsThisWeek: 312,
    totalVolumeThisWeek: 4850000,
    averageSessionDuration: 3720,
    peakHours: [
      { hour: 6, count: 15 },
      { hour: 7, count: 22 },
      { hour: 8, count: 18 },
      { hour: 16, count: 25 },
      { hour: 17, count: 32 },
      { hour: 18, count: 28 },
      { hour: 19, count: 20 },
      { hour: 20, count: 14 },
    ],
    topExercises: [
      { name: "Barbell Bench Press", count: 189 },
      { name: "Barbell Squat", count: 167 },
      { name: "Deadlift", count: 142 },
      { name: "Pull Ups", count: 128 },
      { name: "Overhead Press", count: 98 },
    ],
    memberRetention: 0.82,
    sportBreakdown: [
      { sport: "Bodybuilding", count: 58 },
      { sport: "Powerlifting", count: 42 },
      { sport: "CrossFit", count: 31 },
      { sport: "General", count: 25 },
    ],
  },
};

export const analyticsRouter = createTRPCRouter({
  getGymAnalytics: publicProcedure
    .input(z.object({ gymId: z.string() }))
    .query(({ input }) => {
      console.log("[analytics] getGymAnalytics gym:", input.gymId);
      return gymAnalytics[input.gymId] ?? null;
    }),

  getGymMembers: publicProcedure
    .input(
      z.object({
        gymId: z.string(),
        search: z.string().optional(),
        limit: z.number().default(20),
      }),
    )
    .query(({ input }) => {
      console.log("[analytics] getGymMembers gym:", input.gymId);
      const members = [
        { id: "m1", name: "Ahmad K.", joinDate: "2025-06-01", totalWorkouts: 48, lastVisit: "2026-02-20", sport: "Powerlifting" },
        { id: "m2", name: "Haikal M.", joinDate: "2025-04-15", totalWorkouts: 92, lastVisit: "2026-02-21", sport: "CrossFit" },
        { id: "m3", name: "Omar S.", joinDate: "2025-07-10", totalWorkouts: 42, lastVisit: "2026-02-19", sport: "Powerlifting" },
        { id: "m4", name: "Yusuf A.", joinDate: "2025-09-01", totalWorkouts: 35, lastVisit: "2026-02-21", sport: "CrossFit" },
        { id: "m5", name: "Khalid R.", joinDate: "2025-05-20", totalWorkouts: 67, lastVisit: "2026-02-20", sport: "Bodybuilding" },
        { id: "m6", name: "Faisal T.", joinDate: "2025-11-01", totalWorkouts: 30, lastVisit: "2026-02-18", sport: "Bodybuilding" },
        { id: "m7", name: "Nasser B.", joinDate: "2026-01-05", totalWorkouts: 25, lastVisit: "2026-02-17", sport: "Powerlifting" },
        { id: "m8", name: "Tariq J.", joinDate: "2025-08-12", totalWorkouts: 38, lastVisit: "2026-02-21", sport: "CrossFit" },
      ];
      let filtered = members;
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = members.filter((m) => m.name.toLowerCase().includes(s));
      }
      return filtered.slice(0, input.limit);
    }),
});
