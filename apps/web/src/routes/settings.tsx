import { env } from "@daily-bot/env/web";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId;

  const { data: discordGuilds, isLoading: isLoadingGuilds } = useQuery(
    orpc.discord.listUserGuilds.queryOptions({
      enabled: !!organizationId,
    })
  );

  const { refetch: refetchOrg } = authClient.useListOrganizations();

  const connectMutation = useMutation(
    orpc.discord.connectGuild.mutationOptions({
      onSuccess: () => {
        toast.success("Connected to Discord Server");
        refetchOrg();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  // const disconnectMutation = useMutation(
  //   orpc.discord.disconnectGuild.mutationOptions({
  //     onSuccess: () => {
  //       toast.success("Disconnected from Discord Server");
  //       refetchOrg();
  //     },
  //     onError: (err) => {
  //       toast.error(err.message);
  //     },
  //   })
  // );

  if (!organizationId) {
    return <div className="p-8">Please select an organization.</div>;
  }

  const handleConnect = (guildId: string) => {
    connectMutation.mutate({
      organizationId,
      discordGuildId: guildId,
    });
  };

  const handleAddBot = (guildId: string) => {
    const clientId = env.VITE_DISCORD_CLIENT_ID;
    const permissions = "34359920640"; // Administrator

    const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=${permissions}&guild_id=${guildId}&disable_guild_select=true`;

    window.open(url, "_blank", "width=800,height=600");
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 font-bold text-2xl">Organization Settings</h1>

      <div className="mb-6 rounded-lg border bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-4 font-semibold text-xl">Discord Connection</h2>
        <p className="mb-4 text-gray-500 dark:text-gray-400">
          Connect your Discord server to enable the standup bot for this
          organization.
        </p>

        {discordGuilds ? (
          <div className="grid gap-4">
            {discordGuilds.length === 0 && (
              <p>
                No eligible servers found. You must be an Admin or have 'Manage
                Server' permissions.
              </p>
            )}
            {discordGuilds.map((guild) => (
              <div
                className="flex items-center justify-between rounded border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                key={guild.id}
              >
                <div className="flex items-center gap-3">
                  {guild.icon ? (
                    <img
                      alt={guild.name}
                      className="h-10 w-10 rounded-full"
                      src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-bold text-lg dark:bg-gray-700">
                      {guild.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium">{guild.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded bg-indigo-600 px-3 py-1.5 font-medium text-sm text-white transition-colors hover:bg-indigo-700"
                    onClick={() => handleAddBot(guild.id)}
                    type="button"
                  >
                    1. Add Bot
                  </button>
                  <button
                    className="rounded border border-gray-300 px-3 py-1.5 font-medium text-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    disabled={connectMutation.isPending}
                    onClick={() => handleConnect(guild.id)}
                    type="button"
                  >
                    {connectMutation.isPending
                      ? "Connecting..."
                      : "2. Link to Org"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center">
            {isLoadingGuilds ? (
              <p>Loading Discord servers...</p>
            ) : (
              <p>
                Could not load Discord servers. Make sure you are signed in with
                Discord.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
