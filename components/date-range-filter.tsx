import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangeFilterProps {
  onRangeChange: (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => void;
}

export function DateRangeFilter({ onRangeChange }: DateRangeFilterProps) {
  const [date, setDate] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isCustomRange, setIsCustomRange] = useState(false);

  const handlePresetChange = (value: string) => {
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined;

    switch (value) {
      case "this-week":
        from = new Date(today.setDate(today.getDate() - today.getDay()));
        to = new Date();
        setIsCustomRange(false);
        break;
      case "this-month":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date();
        setIsCustomRange(false);
        break;
      case "all-time":
        from = undefined;
        to = undefined;
        setIsCustomRange(false);
        break;
      case "custom":
        setIsCustomRange(true);
        return;
    }

    setDate({ from, to });
    onRangeChange({ from, to });
  };

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={handlePresetChange} defaultValue="all-time">
        <SelectTrigger
          className={cn(
            "w-[120px] bg-[#060606] text-white border-0 font-semibold text-xs hover:bg-white hover:text-[#E65F2B] transition-colors",
            "focus:ring-0 focus:ring-offset-0"
          )}
        >
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="this-week">This Week</SelectItem>
          <SelectItem value="this-month">This Month</SelectItem>
          <SelectItem value="all-time">All Time</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {isCustomRange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "bg-[#060606] text-white border-0 hover:bg-white hover:text-[#E65F2B] transition-colors",
                "focus:ring-0 focus:ring-offset-0",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={date}
              onSelect={(range) => {
                setDate(range || { from: undefined, to: undefined });
                onRangeChange(range || { from: undefined, to: undefined });
              }}
              initialFocus
              className="rounded-md border-0 bg-white/[0.15]"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
