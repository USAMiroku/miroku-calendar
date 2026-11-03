import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /miroku-canada/canada → the current month. */
export default async function CurrentMonth({ params }: { params: Promise<{ org: string; cal: string }> }) {
  const { org, cal } = await params;
  const now = new Date();
  redirect(`/${org}/${cal}/${now.getFullYear()}/${now.getMonth() + 1}`);
}
