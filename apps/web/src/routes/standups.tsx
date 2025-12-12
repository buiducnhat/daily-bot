import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChannelSelect, ParticipantSelect } from "@/components/discord-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/standups")({
  component: StandupsPage,
});

function StandupsPage() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId;

  const { data: standups, refetch } = useQuery(
    orpc.standups.list.queryOptions({
      input: { organizationId: organizationId! },
      enabled: !!organizationId,
    })
  );

  const { data: channels, isLoading: isLoadingChannels } = useQuery(
    orpc.discord.getGuildChannels.queryOptions({
      input: { organizationId: organizationId! },
      enabled: !!organizationId,
    })
  );

  const { data: members, isLoading: isLoadingMembers } = useQuery(
    orpc.discord.getGuildMembers.queryOptions({
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

  const [name, setName] = useState("");
  const [cron, setCron] = useState("0 9 * * 1-5");
  const [questions] = useState([
    "What did you do yesterday?",
    "What will you do today?",
    "Blockers?",
  ]);
  const [channelId, setChannelId] = useState("");
  const [participants, setParticipants] = useState<
    { id: string; username: string }[]
  >([]);

  const createMutation = useMutation(
    orpc.standups.create.mutationOptions({
      onSuccess: () => {
        toast.success("Standup created");
        setName("");
        setParticipants([]);
        setChannelId("");
        refetch();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const deleteMutation = useMutation(
    orpc.standups.delete.mutationOptions({
      onSuccess: () => refetch(),
      onError: (err) => toast.error(err.message),
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      return;
    }
    if (!currentOrg?.discordGuildId) {
      toast.error("Please connect Discord in Settings first.");
      return;
    }

    createMutation.mutate({
      organizationId,
      name,
      cron,
      guildId: currentOrg.discordGuildId,
      channelId,
      questions,
      participants: participants.map((p) => ({
        id: p.id,
        username: p.username,
      })),
    });
  };

  if (!standups) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Standups</h1>
        {!currentOrg?.discordGuildId && (
          <div
            className="border-yellow-500 border-l-4 bg-yellow-100 p-4 text-yellow-700"
            role="alert"
          >
            <p>
              Warning: No Discord server linked.{" "}
              <Link className="font-bold underline" to="/settings">
                Go to Settings
              </Link>
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {standups.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-gray-50 py-10 text-center">
            <p className="text-muted-foreground">No standups configured yet.</p>
            {!currentOrg?.discordGuildId && (
              <p className="mt-2 text-destructive text-sm">
                Connect Discord to start.
              </p>
            )}
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
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600 text-xs">
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

        <div className="mt-8 border-t pt-6">
          <h2 className="mb-4 font-semibold text-xl">Create New Standup</h2>
          <form className="max-w-xl space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering Daily"
                required
                value={name}
              />
            </div>

            <div>
              <Label htmlFor="cron">Cron Schedule</Label>
              <Input
                id="cron"
                onChange={(e) => setCron(e.target.value)}
                placeholder="0 9 * * 1-5"
                required
                value={cron}
              />
              <p className="mt-1 text-gray-500 text-xs">
                Min Hour Day Month Weekday
              </p>
            </div>

            <div>
              <Label>Channel</Label>
              <ChannelSelect
                channels={channels}
                isLoading={isLoadingChannels}
                onValueChange={setChannelId}
                value={channelId}
              />
            </div>

            <div>
              <Label>Participants</Label>
              <ParticipantSelect
                isLoading={isLoadingMembers}
                members={members}
                onValueChange={setParticipants}
                value={participants}
              />
            </div>

            <Button
              disabled={createMutation.isPending || !currentOrg?.discordGuildId}
              type="submit"
            >
              {createMutation.isPending ? "Creating..." : "Create Standup"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
