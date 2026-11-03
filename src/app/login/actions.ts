"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_MODE, supabaseServer } from "@/lib/supabase/server";

export async function sendSignInLink(form: FormData) {
  if (DEMO_MODE) redirect("/login?error=" + encodeURIComponent("Sign-in is not available in demo mode."));
  const email = String(form.get("email") ?? "").trim();
  const next = String(form.get("next") ?? "/");
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) redirect("/login?error=" + encodeURIComponent(error.message));
  redirect("/login?sent=1");
}

export async function signInWithGoogle(form: FormData) {
  if (DEMO_MODE) redirect("/login?error=" + encodeURIComponent("Sign-in is not available in demo mode."));
  const next = String(form.get("next") ?? "/");
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
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
