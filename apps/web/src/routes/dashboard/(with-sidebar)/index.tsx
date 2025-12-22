import { IconBell, IconCheck } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/dashboard/(with-sidebar)/")({
  component: DashboardIndexPage,
});

function DashboardIndexPage() {
  const { data: sessionData } = authClient.useSession();
  const organizationId = sessionData?.session.activeOrganizationId;
  const [selectedCheckInId, setSelectedCheckInId] = useState<string | null>(
    null
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );

  const { data: checkins } = useQuery(
    orpc.checkIns.list.queryOptions({
      input: { organizationId: organizationId! },
      enabled: !!organizationId,
    })
  );

  // Auto-select first check-in
  useEffect(() => {
    if (checkins && checkins.length > 0 && !selectedCheckInId) {
      setSelectedCheckInId(checkins[0].id.toString());
    }
  }, [checkins, selectedCheckInId]);

  const { data: responses } = useQuery(
    orpc.checkIns.responses.queryOptions({
      input: {
        organizationId: organizationId!,
        checkInId: selectedCheckInId ? Number(selectedCheckInId) : undefined,
      },
      enabled: !!organizationId && !!selectedCheckInId,
    })
  );

  const remindMutation = useMutation(
    orpc.checkIns.remind.mutationOptions({
      onSuccess: () => {
        toast.success("Reminders sent successfully");
        setSelectedParticipants([]);
      },
      onError: (err: Error) => {
        toast.error(`Failed to send reminders: ${err.message}`);
      },
    })
  );

  const currentCheckIn = useMemo(
    () => checkins?.find((c) => c.id.toString() === selectedCheckInId),
    [checkins, selectedCheckInId]
  );

  const participantsStatus = useMemo(() => {
    if (!(currentCheckIn && responses)) {
      return [];
    }
    return currentCheckIn.participants.map((p) => {
      const hasResponse = responses.some(
        (r) => r.discordUser.discordId === p.discordUser.discordId
      );
      return {
        ...p,
        hasResponse,
      };
    });
  }, [currentCheckIn, responses]);

  const handleSelectParticipant = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedParticipants((prev) => [...prev, id]);
    } else {
      setSelectedParticipants((prev) => prev.filter((p) => p !== id));
    }
  };

  const handleRemindSelected = () => {
    if (!selectedCheckInId || selectedParticipants.length === 0) {
      return;
    }

    // Find internal user IDs (integers) based on checked Discord IDs (or internal IDs)
    // The participants list from `checkins` has `discordUser.id` which is the internal ID.
    // Let's use internal ID for selection.

    remindMutation.mutate({
      checkInId: Number(selectedCheckInId),
      discordUserIds: selectedParticipants.map(Number),
    });
  };

  const handleRemindOne = (internalId: number) => {
    if (!selectedCheckInId) {
      return;
    }
    remindMutation.mutate({
      checkInId: Number(selectedCheckInId),
      discordUserIds: [internalId],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Dashboard</h1>
        <Select
          onValueChange={setSelectedCheckInId}
          value={selectedCheckInId || ""}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Check-in" />
          </SelectTrigger>
          <SelectContent>
            {checkins?.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCheckInId ? (
        <>
          {/* Participants Section */}
          <div className="flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Participants</h2>
              <Button
                disabled={
                  selectedParticipants.length === 0 || remindMutation.isPending
                }
                onClick={handleRemindSelected}
                variant="secondary"
              >
                <IconBell />
                Remind Selected ({selectedParticipants.length})
              </Button>
            </div>

            <div className="flex flex-wrap gap-4">
              {participantsStatus.map((p) => (
                <div
                  className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5"
                  key={p.id}
                >
                  <Checkbox
                    checked={selectedParticipants.includes(
                      p.discordUser.id.toString()
                    )}
                    id={`p-${p.id}`}
                    onCheckedChange={(c) =>
                      handleSelectParticipant(
                        p.discordUser.id.toString(),
                        c as boolean
                      )
                    }
                  />
                  <Avatar className="size-6">
                    {/* Placeholder for avatar */}
                    <AvatarFallback>
                      {p.discordUser.username.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{p.discordUser.username}</span>
                  {p.hasResponse ? (
                    <IconCheck className="size-4 text-green-500" />
                  ) : (
                    <Button
                      className="size-6 rounded-full"
                      disabled={remindMutation.isPending}
                      onClick={() => handleRemindOne(p.discordUser.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <IconBell className="size-3 text-yellow-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Responses Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead className="w-[150px]">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses && responses.length > 0 ? (
                  responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell className="align-top font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarFallback>
                              {response.discordUser.username
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {response.discordUser.username}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {Object.entries(response.answers).map(
                            ([question, answer]) => (
                              <div className="" key={question}>
                                <p className="font-semibold text-muted-foreground text-xs">
                                  {question}
                                </p>
                                <p className="whitespace-pre-wrap text-sm">
                                  {answer as string}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {dayjs(response.createdAt).format(
                          "HH:mm:ss DD/MM/YYYY"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center text-muted-foreground"
                      colSpan={3}
                    >
                      No responses yet for this check-in today.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            Select a check-in to view details
          </p>
        </div>
      )}
    </div>
  );
}
