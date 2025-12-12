import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getUser } from "@/functions/get-user";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();

  const privateData = useQuery(orpc.privateData.queryOptions());

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <div className="glass-panel rounded-xl p-8">
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
            <Link to="/settings">Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
