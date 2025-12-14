import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/dashboard/(with-sidebar)/")({
  component: DashboardIndexPage,
});

function DashboardIndexPage() {
  const { session } = Route.useRouteContext();
  const privateData = useQuery(orpc.privateData.queryOptions());

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="glass-panel rounded-xl">
        <h1 className="mb-4 bg-linear-to-r font-bold text-3xl">Dashboard</h1>
        <p className="mb-2 text-lg">
          Welcome,{" "}
          <span className="font-semibold text-primary">
            {session?.user.name}
          </span>
        </p>
        <p className="mb-6 text-muted-foreground">
          API Message: {privateData.data?.message}
        </p>
        <div className="flex gap-4">
          <Button asChild variant="default">
            <Link to="/create-organization">Create New Organization</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/dashboard/settings">Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
