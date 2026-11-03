import { DEMO_MODE, supabaseServer } from "./supabase/server";

export type Role = "admin" | "editor";

export async function currentUser() {
  if (DEMO_MODE) return null;
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return data.user;
}

/** The signed-in person's role in an organization, or null. In demo mode everyone is a (read-only) admin. */
export async function roleIn(orgId: string): Promise<Role | null> {
  if (DEMO_MODE) return "admin";
  const sb = await supabaseServer();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const { data } = await sb.from("memberships").select("role").eq("org_id", orgId).eq("user_id", u.user.id).maybeSingle();
  return (data?.role as Role) ?? null;
}

/** True when the signed-in person is an admin of at least one organization (they may create new ones). */
export async function isAnyAdmin(): Promise<boolean> {
  if (DEMO_MODE) return true;
  const sb = await supabaseServer();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return false;
  const { data } = await sb.from("memberships").select("org_id").eq("user_id", u.user.id).eq("role", "admin").limit(1);
  return (data?.length ?? 0) > 0;
}
