import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { CronPicker } from "@/components/cron-picker";
import { ChannelSelect, ParticipantSelect } from "@/components/discord-select";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/dashboard/(with-sidebar)/check-ins")({
  component: CheckInsPage,
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  cron: z.string().min(1, "Cron schedule is required"),
  channelId: z.string().min(1, "Channel is required"),
  participants: z
    .array(
      z.object({
        id: z.string(),
        username: z.string(),
      })
    )
    .min(1, "At least one participant is required"),
  questions: z.array(z.string()),
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

  const createMutation = useMutation(
    orpc.checkIns.create.mutationOptions({
      onSuccess: () => {
        toast.success("Check-in created");
        form.reset();
        refetch();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const deleteMutation = useMutation(
    orpc.checkIns.delete.mutationOptions({
      onSuccess: () => refetch(),
      onError: (err) => toast.error(err.message),
    })
  );

  const form = useForm({
    defaultValues: {
      name: "",
      cron: "0 9 * * 1-5",
      channelId: "",
      participants: [] as { id: string; username: string }[],
      questions: [
        "What did you do yesterday?",
        "What will you do today?",
        "Blockers?",
      ],
    },

    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (!organizationId) {
        return;
      }
      if (!currentOrg?.discordGuildId) {
        toast.error("Please connect Discord in Settings first.");
        return;
      }

      await createMutation.mutateAsync({
        organizationId,
        name: value.name,
        cron: value.cron,
        guildId: currentOrg.discordGuildId,
        channelId: value.channelId,
        questions: value.questions,
        participants: value.participants,
      });
    },
  });

  if (!standups) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Check-ins</h1>
        {!currentOrg?.discordGuildId && (
          <div
            className="border-yellow-500 border-l-4 bg-yellow-100 p-4 text-yellow-700"
            role="alert"
          >
            <p>
              Warning: No Discord server linked.{" "}
              <Link className="font-bold underline" to="/dashboard/settings">
                Go to Settings
              </Link>
            </p>
          </div>
        )}
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

        <div className="mt-8 border-t pt-6">
          <h2 className="mb-4 font-semibold text-xl">Create New Check-in</h2>
          <form
            className="max-w-xl space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field name="name">
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                    }
                  >
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Engineering Daily"
                      value={field.state.value}
                    />
                    {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                )}
              </form.Field>

              <form.Field name="cron">
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                    }
                  >
                    <FieldLabel htmlFor={field.name}>Cron Schedule</FieldLabel>
                    <CronPicker
                      onChange={(v) => field.handleChange(v)}
                      value={field.state.value}
                    />
                    {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                )}
              </form.Field>

              <form.Field name="channelId">
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                    }
                  >
                    <FieldLabel htmlFor={field.name}>Channel</FieldLabel>
                    <ChannelSelect
                      channels={channels}
                      isLoading={isLoadingChannels}
                      onValueChange={field.handleChange}
                      value={field.state.value}
                    />
                    {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                )}
              </form.Field>

              <form.Field name="participants">
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                    }
                  >
                    <FieldLabel htmlFor={field.name}>Participants</FieldLabel>
                    <ParticipantSelect
                      isLoading={isLoadingMembers}
                      members={members}
                      onValueChange={field.handleChange}
                      value={field.state.value}
                    />
                    {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  disabled={!(canSubmit && currentOrg?.discordGuildId)}
                  type="submit"
                >
                  {isSubmitting ? "Creating..." : "Create Check-in"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </div>
    </div>
  );
}
