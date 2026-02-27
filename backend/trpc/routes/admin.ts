import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

interface AdminNotification {
  id: string;
  type: "verification_request" | "new_member" | "competition_complete" | "alert";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, string>;
}

const notifications: AdminNotification[] = [
  {
    id: "n1",
    type: "verification_request",
    title: "Verification Request",
    message: "Ahmad K. completed Volume King challenge and requests verification",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
    data: { competitionId: "comp1", userId: "mock1" },
  },
  {
    id: "n2",
    type: "new_member",
    title: "New Member Joined",
    message: "Tariq J. just joined the gym",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    data: { userId: "m8" },
  },
  {
    id: "n3",
    type: "competition_complete",
    title: "Competition Winner",
    message: "Haikal M. won Set Crusher challenge",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
    data: { competitionId: "comp2", userId: "mock2" },
  },
  {
    id: "n4",
    type: "alert",
    title: "Low Attendance Alert",
    message: "Gym attendance dropped 15% compared to last week",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

export const adminRouter = createTRPCRouter({
  getDashboard: publicProcedure
    .input(z.object({ gymId: z.string() }))
    .query(({ input }) => {
      console.log("[admin] getDashboard gym:", input.gymId);
      return {
        totalMembers: 156,
        activeToday: 28,
        newMembersThisWeek: 5,
        totalWorkoutsToday: 47,
        activeCompetitions: 3,
        pendingVerifications: 2,
        revenue: 12450,
        memberRetention: 82,
      };
    }),

  getNotifications: publicProcedure
    .input(z.object({ gymId: z.string() }))
    .query(({ input }) => {
      console.log("[admin] getNotifications gym:", input.gymId);
      return notifications;
    }),

  markNotificationRead: publicProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(({ input }) => {
      console.log("[admin] markRead:", input.notificationId);
      const notif = notifications.find((n) => n.id === input.notificationId);
      if (notif) notif.read = true;
      return { success: true };
    }),

  createCompetition: publicProcedure
    .input(
      z.object({
        gymId: z.string(),
        type: z.enum(["daily_volume", "daily_sets", "cardio"]),
        title: z.string().min(1),
        description: z.string().min(1),
        target: z.number().positive(),
        prize: z.string().optional(),
        adminId: z.string(),
      }),
    )
    .mutation(({ input }) => {
      console.log("[admin] createCompetition:", input.title, "by admin:", input.adminId);
      const id = `comp_${Date.now()}`;
      return {
        id,
        type: input.type,
        title: input.title,
        description: input.description,
        date: new Date().toISOString().split("T")[0],
        target: input.target,
        gymId: input.gymId,
        prize: input.prize,
        createdBy: input.adminId,
        participants: [],
      };
    }),

  updateMemberStatus: publicProcedure
    .input(
      z.object({
        memberId: z.string(),
        status: z.enum(["active", "inactive"]),
      }),
    )
    .mutation(({ input }) => {
      console.log("[admin] updateMemberStatus:", input.memberId, "->", input.status);
      return { success: true, memberId: input.memberId, status: input.status };
    }),

  sendAnnouncement: publicProcedure
    .input(
      z.object({
        gymId: z.string(),
        title: z.string().min(1),
        message: z.string().min(1),
        adminId: z.string(),
      }),
    )
    .mutation(({ input }) => {
      console.log("[admin] sendAnnouncement:", input.title, "gym:", input.gymId);
      return { success: true, id: `ann_${Date.now()}` };
    }),
});
