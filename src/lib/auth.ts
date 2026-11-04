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

export interface MyOrg {
  id: string;
  slug: string;
  name: string;
  role: Role;
}

/** The organizations the signed-in person belongs to. */
export async function myOrganizations(): Promise<MyOrg[]> {
  if (DEMO_MODE) return [];
  const sb = await supabaseServer();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return [];
  const { data } = await sb.from("memberships").select("role, organizations(id, slug, name)").eq("user_id", u.user.id);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[])
    .filter((m) => m.organizations)
    .map((m) => ({ id: m.organizations.id, slug: m.organizations.slug, name: m.organizations.name, role: m.role as Role }))
    .sort((a, b) => a.name.localeCompare(b.name));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/** A friendly first name for the header, from the Google profile or the email. */
export function displayName(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null) {
  if (!user) return "";
  const full = (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined;
  return full?.trim() || user.email || "";
}
