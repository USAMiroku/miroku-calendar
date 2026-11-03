import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when no database is configured: the app runs read-only on the built-in sample data. */
export const DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY;

/** A Supabase client acting as the signed-in user (or anonymous), for server components and actions. */
export async function supabaseServer() {
  if (DEMO_MODE) throw new Error("Supabase is not configured (demo mode)");
  const store = await cookies();
  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a server component: cookies are refreshed by the middleware instead.
        }
      },
    },
  });
}
