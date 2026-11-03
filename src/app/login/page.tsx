import { sendSignInLink } from "./actions";
import { DEMO_MODE } from "@/lib/supabase/server";

export default async function Login({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="container" style={{ maxWidth: 440 }}>
      <h1>Editor sign-in</h1>
      {DEMO_MODE && <p className="notice">Demo mode: sign-in is off until a database is connected. You can still look around the editor pages.</p>}
      {sp.sent ? (
        <p>Check your email for a sign-in link. You can close this page.</p>
      ) : (
        <form action={sendSignInLink} style={{ display: "grid", gap: 10 }}>
          <label htmlFor="email">Your email address</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
          <input type="hidden" name="next" value={sp.next ?? "/"} />
          <button className="btn primary" type="submit">Email me a sign-in link</button>
          <small style={{ color: "var(--muted)" }}>No password needed. Only people an admin has invited can edit.</small>
        </form>
      )}
      {sp.error && <p className="notice">{sp.error}</p>}
    </main>
  );
}
