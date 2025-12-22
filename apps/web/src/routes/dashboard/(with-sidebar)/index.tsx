import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/(with-sidebar)/")({
  component: DashboardIndexPage,
});

function DashboardIndexPage() {
  const { session } = Route.useRouteContext();

  return (
    <div>
      <h1 className="mb-4 font-bold text-2xl">Dashboard</h1>
      <p className="mb-2">
        Welcome,{" "}
        <span className="font-semibold text-primary">{session?.user.name}</span>
      </p>
    </div>
  );
}
