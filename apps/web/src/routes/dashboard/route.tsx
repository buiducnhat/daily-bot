import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  component: DashboardLayout,
  beforeLoad: async () => {
    const { data: session, error } = await authClient.getSession();
    if (!session || error) {
      redirect({ to: "/auth/sign-in", throw: true });
    }
    return { session };
  },
});

function DashboardLayout() {
  return <Outlet />;
}
