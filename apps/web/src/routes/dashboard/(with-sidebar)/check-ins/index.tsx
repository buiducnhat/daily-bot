import { IconPlus } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/dashboard/(with-sidebar)/check-ins/")({
  component: CheckInsPage,
});

function CheckInsPage() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId;

  const { data: standups, refetch } = useQuery(
    orpc.checkIns.list.queryOptions({
      input: { organizationId: organizationId! },
      enabled: !!organizationId,
    })
  );

  const { data: orgs } = authClient.useListOrganizations();
  // Cast type to include discordGuildId since it's in our DB schema
  const currentOrg = orgs?.find((o) => o.id === organizationId) as
    | {
        id: string;
        name: string;
        slug: string;
        discordGuildId?: string | null;
      }
    | undefined;

  const deleteMutation = useMutation(
    orpc.checkIns.delete.mutationOptions({
      onSuccess: () => refetch(),
      onError: (err) => toast.error(err.message),
    })
  );

  if (!standups) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Check-ins</h1>

        <div className="flex gap-2">
          {!currentOrg?.discordGuildId && (
            <div
              className="mr-4 flex items-center border-yellow-500 border-l-4 bg-yellow-100 p-2 text-sm text-yellow-700"
              role="alert"
            >
              <p>
                Warning: No Discord server linked.{" "}
                <Link className="font-bold underline" to="/dashboard/settings">
                  Settings
                </Link>
              </p>
            </div>
          )}
          <Link to="/dashboard/check-ins/new">
            <Button disabled={!currentOrg?.discordGuildId}>
              <IconPlus />
              New Check-in
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        {standups.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center">
            <p className="text-muted-foreground">
              No check-ins configured yet.
            </p>
            {!currentOrg?.discordGuildId && (
              <p className="mt-2 text-destructive text-sm">
                Connect Discord to start.
              </p>
            )}
            <div className="mt-4">
              <Link to="/dashboard/check-ins/new">
                <Button disabled={!currentOrg?.discordGuildId}>
                  Create your first check-in
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          standups.map((standup) => (
            <div
              className="flex items-center justify-between rounded-lg border p-4 shadow-sm"
              key={standup.id}
            >
              <div>
                <h3 className="font-semibold text-lg">{standup.name}</h3>
                <p className="text-muted-foreground text-sm">
                  Schedule: {standup.cron}
                </p>
                <div className="mt-1 flex gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-muted-foreground text-xs">
                    {standup.participants.length} Participants
                  </span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-600 text-xs">
                    Channel: {standup.channelId}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => {
                  deleteMutation.mutate({ id: standup.id });
                }}
                size="sm"
                variant="outline"
              >
                Delete
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
