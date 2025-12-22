import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type CronPickerProps = {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: i.toString().padStart(2, "0"),
}));

const MINUTES = ["0", "15", "30", "45"].map((m) => ({
  value: m,
  label: m.padStart(2, "0"),
}));

const DAYS = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
  { value: "0", label: "Sun" },
];

export function CronPicker({ value, onChange, className }: CronPickerProps) {
  const [minute, hour, , , daysRaw] = (value || "0 9 * * 1-5").split(" ");

  const selectedDays = React.useMemo(() => {
    if (daysRaw === "*") {
      return DAYS.map((d) => d.value);
    }

    // Handle ranges like 1-5
    if (daysRaw.includes("-")) {
      const [start, end] = daysRaw.split("-").map(Number);
      const days: string[] = [];
      for (let i = start; i <= end; i++) {
        days.push(i.toString());
      }
      return days;
    }

    // Handle lists like 1,2,3
    return daysRaw.split(",");
  }, [daysRaw]);

  const updateCron = (
    newHour: string,
    newMinute: string,
    newDays: string[]
  ) => {
    // Sort days to ensure consistency
    // Note: If all days selected, could use * but list is safer for now
    // Actually, simple list is fine.

    // Sort: 1,2,3,4,5,6,0 ? No, standard seems to be 0,1,2..6.
    // Let's just join them as is from the toggle group (which might be unordered based on click).
    // Better to sort them.
    const sortedDays = [...newDays]
      .sort((a, b) => {
        // Handle 0 (Sun) usually being first or last depending on pref, but numerical sort is fine
        return Number.parseInt(a, 10) - Number.parseInt(b, 10);
      })
      .join(",");

    onChange(`${newMinute} ${newHour} * * ${sortedDays}`);
  };

  const _currentMinute = MINUTES.find((m) => m.value === minute)
    ? minute
    : minute; // Support custom if exists?
  // If custom minute not in list, add it temporarily or specific handling?
  // Let's just trust valid cron for now.

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">Time:</span>
        <Select
          onValueChange={(v) => updateCron(v, minute, selectedDays)}
          value={hour}
        >
          <SelectTrigger>
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h.value} value={h.value}>
                {h.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>:</span>
        <Select
          onValueChange={(v) => updateCron(hour, v, selectedDays)}
          value={minute}
        >
          <SelectTrigger>
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
            {!MINUTES.find((m) => m.value === minute) && (
              <SelectItem value={minute}>{minute.padStart(2, "0")}</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-medium text-sm">Days:</span>
        <ToggleGroup
          className="flex-wrap justify-start"
          onValueChange={(v) => updateCron(hour, minute, v)}
          type="multiple"
          value={selectedDays}
        >
          {DAYS.map((day) => (
            <ToggleGroupItem
              aria-label={day.label}
              key={day.value}
              value={day.value}
            >
              {day.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
