import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// The link in the sign-in email, and the return from Google sign-in, land here.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  // Google or Supabase may send back their own reason (for example a wrong client secret); show it.
  const reason = url.searchParams.get("error_description");
  const message = reason ? `Sign-in did not work: ${reason}` : "That sign-in link has expired. Please ask for a new one.";
  return NextResponse.redirect(new URL("/login?error=" + encodeURIComponent(message), url.origin));
}
