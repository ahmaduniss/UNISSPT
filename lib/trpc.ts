import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { Platform } from "react-native";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";
import { supabase } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (url) return url;

  // On web (including a Vercel deployment), the API is served from the same
  // origin as the app — no base URL needed, just hit `/api/trpc` directly.
  if (Platform.OS === "web") return "";

  throw new Error(
    "No API base URL configured. Set EXPO_PUBLIC_API_BASE_URL to your backend's URL.",
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {};
      },
    }),
  ],
});
