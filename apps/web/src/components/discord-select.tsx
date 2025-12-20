import { IconCheck, IconChevronDown, IconX } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ChannelSelectProps = {
  channels: { id: string; name: string }[] | undefined;
  value: string;
  onValueChange: (value: string) => void;
  isLoading?: boolean;
};

export function ChannelSelect({
  channels,
  value,
  onValueChange,
  isLoading,
}: ChannelSelectProps) {
  const selectedChannel = channels?.find((c) => c.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="w-full justify-between"
          disabled={isLoading}
          variant="outline"
        >
          {selectedChannel
            ? `# ${selectedChannel.name}`
            : isLoading
              ? "Loading..."
              : "Select Channel"}
          <IconChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="h-[300px] w-[300px] overflow-y-auto">
        {channels?.map((channel) => (
          <DropdownMenuItem
            key={channel.id}
            onSelect={() => onValueChange(channel.id)}
          >
            <IconCheck
              className={cn(
                "mr-2 h-4 w-4",
                value === channel.id ? "opacity-100" : "opacity-0"
              )}
            />
            # {channel.name}
          </DropdownMenuItem>
        ))}
        {channels?.length === 0 && (
          <DropdownMenuItem disabled>No channels found</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type ParticipantSelectProps = {
  members:
    | { id: string; username: string; avatar: string | null }[]
    | undefined;
  value: { id: string; username: string }[];
  onValueChange: (value: { id: string; username: string }[]) => void;
  isLoading?: boolean;
};

export function ParticipantSelect({
  members,
  value,
  onValueChange,
  isLoading,
}: ParticipantSelectProps) {
  const selectedIds = new Set(value.map((v) => v.id));

  const handleSelect = (member: { id: string; username: string }) => {
    if (selectedIds.has(member.id)) {
      onValueChange(value.filter((v) => v.id !== member.id));
    } else {
      onValueChange([...value, member]);
    }
  };

  const removeParticipant = (id: string) => {
    onValueChange(value.filter((v) => v.id !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((p) => (
            <Badge
              className="flex items-center gap-1"
              key={p.id}
              variant="secondary"
            >
              {p.username}
              <button
                className="ml-1 rounded-full hover:text-destructive"
                onClick={() => removeParticipant(p.id)}
                type="button"
              >
                <IconX size={14} />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="w-full justify-between"
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? "Loading members..." : "Add Participants"}
            <IconChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="h-[300px] w-[300px] overflow-y-auto"
        >
          {members?.map((member) => (
            <DropdownMenuCheckboxItem
              checked={selectedIds.has(member.id)}
              key={member.id}
              onCheckedChange={() =>
                handleSelect({ id: member.id, username: member.username })
              }
            >
              <div className="flex items-center gap-2">
                {member.avatar ? (
                  <img
                    alt=""
                    className="h-6 w-6 rounded-full"
                    src={`https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png`}
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gray-200" />
                )}
                <span>{member.username}</span>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
          {members?.length === 0 && (
            <DropdownMenuItem disabled>No members found</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
