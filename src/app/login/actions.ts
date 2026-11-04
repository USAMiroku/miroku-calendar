"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_MODE, supabaseServer } from "@/lib/supabase/server";

async function siteOrigin() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

/** Google is the only way to sign in. New people are signed up the first time they use it. */
export async function signInWithGoogle(form: FormData) {
  if (DEMO_MODE) redirect("/login?error=" + encodeURIComponent("Sign-in is not available in demo mode."));
  const next = String(form.get("next") ?? "/");
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/login?error=" + encodeURIComponent(error?.message ?? "Google sign-in is not set up yet."));
  redirect(data.url);
}

export async function signOut() {
  if (!DEMO_MODE) {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  }
  redirect("/");
}
