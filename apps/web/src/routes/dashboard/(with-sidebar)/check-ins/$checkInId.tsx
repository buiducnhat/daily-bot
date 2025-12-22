import { IconChevronLeft, IconPlus, IconTrash } from "@tabler/icons-react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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

export const Route = createFileRoute(
  "/dashboard/(with-sidebar)/check-ins/$checkInId"
)({
  component: EditCheckInPage,
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

function EditCheckInPage() {
  const { checkInId } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId;

  const { data: checkIn, isLoading: isLoadingCheckIn } = useQuery(
    orpc.checkIns.get.queryOptions({
      input: { id: Number(checkInId) },
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

  const updateMutation = useMutation(
    orpc.checkIns.update.mutationOptions({
      onSuccess: () => {
        toast.success("Check-in updated");
        navigate({ to: "/dashboard/check-ins" });
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const form = useForm({
    defaultValues: {
      name: checkIn?.name ?? "",
      cron: checkIn?.cron ?? "0 9 * * 1-5",
      channelId: checkIn?.channelId ?? "",
      participants:
        checkIn?.participants.map((p) => ({
          id: p.discordUser.discordId,
          username: p.discordUser.username,
        })) ?? [],
      questions: checkIn?.questions ?? [],
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({
        id: Number(checkInId),
        name: value.name,
        cron: value.cron,
        channelId: value.channelId,
        questions: value.questions,
        participants: value.participants,
      });
    },
  });

  if (isLoadingCheckIn || !checkIn) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link to="/dashboard/check-ins">
          <Button size="icon" variant="ghost">
            <IconChevronLeft />
          </Button>
        </Link>
        <h1 className="font-bold text-2xl">Edit Check-in</h1>
      </div>

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

          <form.Field mode="array" name="questions">
            {(field) => (
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Questions</FieldLabel>
                  <Button
                    onClick={() => field.pushValue("")}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <IconPlus className="size-4" />
                    Add Question
                  </Button>
                </div>
                <div className="space-y-2">
                  {field.state.value.map((_, i) => (
                    <div className="flex gap-2" key={i}>
                      <Input
                        onChange={(e) =>
                          field.handleChange((prev) => {
                            const next = [...prev];
                            next[i] = e.target.value;
                            return next;
                          })
                        }
                        placeholder={`Question ${i + 1}`}
                        value={field.state.value[i]}
                      />
                      <Button
                        disabled={field.state.value.length <= 1}
                        onClick={() => field.removeValue(i)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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
            <Button disabled={!canSubmit} type="submit">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
