import { env } from "@daily-bot/env/web";
import NiceModal from "@ebay/nice-modal-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BaseAlertDialog } from "@/components/base-alert-dialog";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/dashboard/(with-sidebar)/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId;

  const { data: activeGuild } = useQuery(
    orpc.discord.getGuild.queryOptions({
      input: { organizationId: organizationId! },
      enabled: !!organizationId,
    })
  );

  authClient.useListOrganizations();

  if (!organizationId) {
    return <div className="p-8">Please select an organization.</div>;
  }

  const handleManualConnect = () => {
    const clientId = env.VITE_DISCORD_CLIENT_ID;
    const permissions = "34359920640"; // Administrator
    const redirectUri = `${env.VITE_SERVER_URL}/discord/callback`;

    // State is the organizationId to link to
    const state = organizationId;

    const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=${permissions}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}`;

    window.open(url, "_blank", "width=800,height=600");
  };

  return (
    <div>
      <h1 className="mb-6 font-bold text-2xl">Organization Settings</h1>

      <div className="mb-6 rounded-lg border p-6 shadow">
        <h2 className="mb-4 font-semibold text-xl">Discord Connection</h2>
        <p className="mb-4 text-muted-foreground">
          Connect your Discord server to enable the check-in bot for this
          organization.
        </p>

        {activeGuild && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
            <div className="flex items-center gap-4">
              {activeGuild.icon ? (
                <img
                  alt={activeGuild.name}
                  className="h-12 w-12 rounded-full border border-green-200"
                  src={`https://cdn.discordapp.com/icons/${activeGuild.id}/${activeGuild.icon}.png`}
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-200 font-bold text-green-800 text-lg">
                  {activeGuild.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{activeGuild.name}</h3>
                <p className="flex items-center gap-1.5 font-medium text-green-700 text-sm dark:text-green-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  Connected & Active
                </p>
              </div>
            </div>
          </div>
        )}

        {!activeGuild && (
          <div>
            <p className="mb-4 text-muted-foreground text-sm">
              You need to connect a Discord server to use the bot. You must have
              "Manage Server" permissions on the server you want to connect.
            </p>
            <button
              className="rounded bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
              onClick={handleManualConnect}
              type="button"
            >
              Connect Discord Server
            </button>
          </div>
        )}

        {activeGuild && (
          <div className="mt-4">
            <button
              className="text-destructive text-sm hover:underline"
              onClick={() => {
                NiceModal.show(BaseAlertDialog, {
                  title: "Disconnect Discord Server",
                  description: "Are you sure you want to disconnect?",
                  actionText: "Disconnect",
                  action: () => {
                    handleManualConnect();
                  },
                });
              }}
              type="button"
            >
              Connect to a different server
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
