import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  component: DashboardLayout,
  beforeLoad: async ({ location }) => {
    const { data: session, error } = await authClient.getSession();
    if (!session || error) {
      throw redirect({ to: "/auth/sign-in" });
    }

    if (session.session.activeOrganizationId) {
      return { session };
    }

    const { data: orgs } = await authClient.organization.list();
    if (!orgs || orgs.length === 0) {
      if (location.pathname !== "/dashboard/create-organization") {
        throw redirect({ to: "/dashboard/create-organization" });
      }
    } else {
      await authClient.organization.setActive({
        organizationId: orgs[0].id,
      });
    }

    return { session };
  },
});

function DashboardLayout() {
  return <Outlet />;
}
