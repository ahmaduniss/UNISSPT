import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

interface Competition {
  id: string;
  type: "daily_volume" | "daily_sets" | "cardio";
  title: string;
  description: string;
  date: string;
  target: number;
  gymId: string;
  participants: {
    userId: string;
    userName: string;
    progress: number;
    isCompleted: boolean;
    verifiedByAdmin: boolean;
  }[];
  prize?: string;
  createdBy: string;
}

const today = new Date().toISOString().split("T")[0];

const competitions: Competition[] = [
  {
    id: "comp1",
    type: "daily_volume",
    title: "Volume King",
    description: "Lift the most total volume in a single session today",
    date: today,
    target: 15000,
    gymId: "kabs",
    participants: [
      { userId: "mock1", userName: "Ahmad K.", progress: 12500, isCompleted: false, verifiedByAdmin: false },
      { userId: "mock3", userName: "Omar S.", progress: 9800, isCompleted: false, verifiedByAdmin: false },
    ],
    prize: "Free protein shake",
    createdBy: "admin",
  },
  {
    id: "comp2",
    type: "daily_sets",
    title: "Set Crusher",
    description: "Complete the most sets today across all exercises",
    date: today,
    target: 30,
    gymId: "kabs",
    participants: [
      { userId: "mock2", userName: "Haikal M.", progress: 22, isCompleted: false, verifiedByAdmin: false },
    ],
    prize: "1 week free membership extension",
    createdBy: "admin",
  },
  {
    id: "comp3",
    type: "cardio",
    title: "Cardio Challenge",
    description: "Log 30 minutes of cardio exercises today",
    date: today,
    target: 30,
    gymId: "kabs",
    participants: [],
    prize: "Free gym towel",
    createdBy: "admin",
  },
];

export const competitionsRouter = createTRPCRouter({
  getActive: publicProcedure
    .input(z.object({ gymId: z.string() }))
    .query(({ input }) => {
      console.log("[competitions] getActive gym:", input.gymId);
      const todayStr = new Date().toISOString().split("T")[0];
      return competitions.filter(
        (c) => c.gymId === input.gymId && c.date === todayStr,
      );
    }),

  joinCompetition: publicProcedure
    .input(
      z.object({
        competitionId: z.string(),
        userId: z.string(),
        userName: z.string(),
      }),
    )
    .mutation(({ input }) => {
      console.log("[competitions] join:", input.competitionId, "by:", input.userName);
      const comp = competitions.find((c) => c.id === input.competitionId);
      if (!comp) return { success: false, error: "Competition not found" };
      const existing = comp.participants.find((p) => p.userId === input.userId);
      if (!existing) {
        comp.participants.push({
          userId: input.userId,
          userName: input.userName,
          progress: 0,
          isCompleted: false,
          verifiedByAdmin: false,
        });
      }
      return { success: true };
    }),

  updateProgress: publicProcedure
    .input(
      z.object({
        competitionId: z.string(),
        userId: z.string(),
        progress: z.number(),
      }),
    )
    .mutation(({ input }) => {
      console.log("[competitions] updateProgress:", input.competitionId, input.progress);
      const comp = competitions.find((c) => c.id === input.competitionId);
      if (!comp) return { success: false, error: "Competition not found" };
      const participant = comp.participants.find((p) => p.userId === input.userId);
      if (!participant) return { success: false, error: "Not a participant" };
      participant.progress = input.progress;
      participant.isCompleted = input.progress >= comp.target;
      return { success: true, isCompleted: participant.isCompleted };
    }),

  verifyCompletion: publicProcedure
    .input(
      z.object({
        competitionId: z.string(),
        userId: z.string(),
        adminId: z.string(),
      }),
    )
    .mutation(({ input }) => {
      console.log("[competitions] verify:", input.competitionId, "user:", input.userId, "by admin:", input.adminId);
      const comp = competitions.find((c) => c.id === input.competitionId);
      if (!comp) return { success: false, error: "Competition not found" };
      const participant = comp.participants.find((p) => p.userId === input.userId);
      if (!participant) return { success: false, error: "Not a participant" };
      participant.verifiedByAdmin = true;
      return { success: true };
    }),
});
