import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardShell from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Redirect to onboarding if not completed and user is admin
  if (!session.user.onboardingCompleted && session.user.isAdmin) {
    redirect("/onboarding");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
