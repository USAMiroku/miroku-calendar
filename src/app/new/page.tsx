import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, isAnyAdmin } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/supabase/server";
import NewOrgForm from "@/components/NewOrgForm";

export const dynamic = "force-dynamic";

export default async function NewOrganization() {
  if (!DEMO_MODE && !(await currentUser())) redirect("/login?next=/new");
  const allowed = await isAnyAdmin();
  return (
    <main className="container" style={{ maxWidth: 640 }}>
      <p className="no-print"><Link href="/">← All calendars</Link></p>
      <h1>New organization</h1>
      {DEMO_MODE && <p className="notice">Demo mode: nothing is saved until a database is connected.</p>}
      {allowed ? (
        <NewOrgForm />
      ) : (
        <p className="notice">Only an admin of an existing organization can create a new one.</p>
      )}
    </main>
  );
}
