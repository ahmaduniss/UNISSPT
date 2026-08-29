import { createTRPCRouter } from "./create-context";
import { bookingsRouter } from "./routes/bookings";
import { clientsRouter } from "./routes/clients";
import { marketplaceRouter } from "./routes/marketplace";
import { performanceRouter } from "./routes/performance";
import { progressPhotosRouter } from "./routes/progressPhotos";
import { routinesRouter } from "./routes/routines";
import { usersRouter } from "./routes/users";
import { workoutsRouter } from "./routes/workouts";

export const appRouter = createTRPCRouter({
  clients: clientsRouter,
  workouts: workoutsRouter,
  routines: routinesRouter,
  progressPhotos: progressPhotosRouter,
  performance: performanceRouter,
  marketplace: marketplaceRouter,
  bookings: bookingsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
