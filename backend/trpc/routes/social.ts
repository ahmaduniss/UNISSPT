import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  type: "workout" | "pr" | "streak" | "achievement";
  content: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
  volume?: number;
  workoutId?: string;
  gymId: string;
}

const feedPosts: FeedPost[] = [
  {
    id: "sp1",
    userId: "mock1",
    userName: "Ahmad K.",
    type: "workout",
    content: "Just crushed a heavy leg day — 12,500 kg total volume!",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 8,
    likedBy: [],
    volume: 12500,
    gymId: "kabs",
  },
  {
    id: "sp2",
    userId: "mock2",
    userName: "Haikal M.",
    type: "pr",
    content: "New PR on Deadlift: 180kg x 3! 💪",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: 15,
    likedBy: [],
    gymId: "kabs",
  },
  {
    id: "sp3",
    userId: "mock3",
    userName: "Omar S.",
    type: "streak",
    content: "12-day gym streak and counting! Who's with me?",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    likes: 6,
    likedBy: [],
    gymId: "kabs",
  },
  {
    id: "sp4",
    userId: "mock4",
    userName: "Yusuf A.",
    type: "workout",
    content: "Upper body push day done — bench hit 100kg for 5 reps!",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    likes: 11,
    likedBy: [],
    volume: 8200,
    gymId: "kabs",
  },
  {
    id: "sp5",
    userId: "mock5",
    userName: "Khalid R.",
    type: "achievement",
    content: "Unlocked the '50 Workouts' achievement! Halfway to legend status 🏆",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    likes: 20,
    likedBy: [],
    gymId: "kabs",
  },
];

export const socialRouter = createTRPCRouter({
  getFeed: publicProcedure
    .input(
      z.object({
        gymId: z.string(),
        cursor: z.number().optional(),
        limit: z.number().default(20),
      }),
    )
    .query(({ input }) => {
      console.log("[social] getFeed gym:", input.gymId);
      const gymPosts = feedPosts
        .filter((p) => p.gymId === input.gymId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const start = input.cursor ?? 0;
      const items = gymPosts.slice(start, start + input.limit);
      return {
        items,
        nextCursor: start + input.limit < gymPosts.length ? start + input.limit : null,
      };
    }),

  createPost: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        userName: z.string(),
        gymId: z.string(),
        type: z.enum(["workout", "pr", "streak", "achievement"]),
        content: z.string(),
        volume: z.number().optional(),
        workoutId: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      console.log("[social] createPost by:", input.userName);
      const post: FeedPost = {
        id: `post_${Date.now()}`,
        userId: input.userId,
        userName: input.userName,
        type: input.type,
        content: input.content,
        timestamp: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        volume: input.volume,
        workoutId: input.workoutId,
        gymId: input.gymId,
      };
      feedPosts.unshift(post);
      return post;
    }),

  toggleLike: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(({ input }) => {
      console.log("[social] toggleLike post:", input.postId, "by:", input.userId);
      const post = feedPosts.find((p) => p.id === input.postId);
      if (!post) {
        return { success: false, error: "Post not found" };
      }
      const likedIndex = post.likedBy.indexOf(input.userId);
      if (likedIndex >= 0) {
        post.likedBy.splice(likedIndex, 1);
        post.likes = Math.max(0, post.likes - 1);
      } else {
        post.likedBy.push(input.userId);
        post.likes += 1;
      }
      return { success: true, likes: post.likes, liked: likedIndex < 0 };
    }),
});
