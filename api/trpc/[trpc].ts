import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "../../backend/trpc/app-router";
import { createContext } from "../../backend/trpc/create-context";

export const config = {
  runtime: "edge",
};

export default function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
}
