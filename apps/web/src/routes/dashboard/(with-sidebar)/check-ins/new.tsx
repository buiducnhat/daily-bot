import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
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

export const Route = createFileRoute("/dashboard/(with-sidebar)/check-ins/new")(
  {
    component: NewCheckInPage,
  }
);

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

function NewCheckInPage() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId;

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
        navigate({ to: "/dashboard/check-ins" });
      },
      onError: (err) => {
        toast.error(err.message);
      },
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

  if (!organizationId) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/dashboard/check-ins">
          <Button size="icon" variant="ghost">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-2xl">Create New Check-in</h1>
      </div>

      {!currentOrg?.discordGuildId && (
        <div
          className="mb-6 border-yellow-500 border-l-4 bg-yellow-100 p-4 text-yellow-700"
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
  );
}
