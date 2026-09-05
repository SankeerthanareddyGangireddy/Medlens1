import { AppShell } from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
