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
