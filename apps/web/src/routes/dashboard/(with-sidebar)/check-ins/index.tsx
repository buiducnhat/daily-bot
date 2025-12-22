import {
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/dashboard/(with-sidebar)/check-ins/")({
  component: CheckInsPage,
});

function CheckInsPage() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId;

  const { data: checkins, refetch } = useQuery(
    orpc.checkIns.list.queryOptions({
      input: { organizationId: organizationId! },
      enabled: !!organizationId,
    })
  );

  const { data: orgs } = authClient.useListOrganizations();
  const currentOrg = orgs?.find((o) => o.id === organizationId);

  const deleteMutation = useMutation(
    orpc.checkIns.delete.mutationOptions({
      onSuccess: () => refetch(),
      onError: (err) => toast.error(err.message),
    })
  );

  if (!checkins) {
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
        {checkins.length === 0 ? (
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
          checkins.map((checkin) => (
            <Card key={checkin.id}>
              <CardHeader className="flex items-center justify-between">
                <div className="flex flex-col">
                  <CardTitle>{checkin.name}</CardTitle>
                  <CardDescription>Schedule: {checkin.cron}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      <span className="sr-only">Open menu</span>
                      <IconDotsVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        params={{ checkInId: checkin.id.toString() }}
                        to="/dashboard/check-ins/$checkInId"
                      >
                        <IconEdit /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteMutation.mutate({ id: checkin.id })}
                      variant="destructive"
                    >
                      <IconTrash />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1">
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-muted-foreground text-xs dark:bg-stone-800 dark:text-stone-200">
                    {checkin.participants.length} Participants
                  </span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-600 text-xs dark:bg-blue-900 dark:text-blue-200">
                    Channel: {checkin.channelId}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
