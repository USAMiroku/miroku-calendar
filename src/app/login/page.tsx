import type { Metadata } from "next";
import { redirect } from "next/navigation";
import GoogleButton from "@/components/GoogleButton";
import { currentUser } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  if (await currentUser()) redirect(next);
  return (
    <main className="container">
      <div className="auth-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/izunome-logo.png" alt="" width={72} height={72} />
        <h1>Sign in to Miroku Calendar</h1>
        <p className="muted">Use your Google account. If it’s your first time, this also creates your account.</p>
        {DEMO_MODE && <p className="notice">Demo mode: sign-in is off until a database is connected.</p>}
        <GoogleButton next={next} big />
        {sp.error && <p className="notice" style={{ marginTop: 16 }}>{sp.error}</p>}
        <p className="fine">
          Anyone can read the published calendars without signing in. To add or change events, sign in and
          ask to join your organization; an admin approves you.
        </p>
      </div>
    </main>
  );
}
