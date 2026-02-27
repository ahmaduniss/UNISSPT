import { createTRPCRouter } from "./create-context";
import { adminRouter } from "./routes/admin";
import { analyticsRouter } from "./routes/analytics";
import { competitionsRouter } from "./routes/competitions";
import { leaderboardsRouter } from "./routes/leaderboards";
import { routinesRouter } from "./routes/routines";
import { socialRouter } from "./routes/social";
import { usersRouter } from "./routes/users";
import { workoutsRouter } from "./routes/workouts";

export const appRouter = createTRPCRouter({
  workouts: workoutsRouter,
  leaderboards: leaderboardsRouter,
  social: socialRouter,
  competitions: competitionsRouter,
  routines: routinesRouter,
  analytics: analyticsRouter,
  users: usersRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
