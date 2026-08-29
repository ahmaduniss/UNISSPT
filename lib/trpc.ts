import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";
import { supabase } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!url) {
    throw new Error(
      "Rork did not set EXPO_PUBLIC_RORK_API_BASE_URL, please use support",
    );
  }
  return url;
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
