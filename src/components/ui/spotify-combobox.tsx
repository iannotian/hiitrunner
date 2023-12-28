"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import cn from "clsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SpotifySearchResult {
  artists: {
    items: {
      id: string;
      name: string;
    }[];
  };

  tracks: {
    items: {
      id: string;
      name: string;
    }[];
  };
}

export function SpotifySearchbox({
  spotifyResponse,
  onChange,
}: {
  spotifyResponse: SpotifySearchResult;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {value
            ? [
                ...spotifyResponse.artists.items,
                ...spotifyResponse.tracks.items,
              ].find((item) => item.name === value)?.name
            : "Search Spotify"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Track or artist name"
            onValueChange={onChange}
          />
          <CommandEmpty>No artists found.</CommandEmpty>
          {spotifyResponse.artists?.items.length > 0 && (
            <CommandGroup>
              {[
                ...spotifyResponse.artists.items,
                ...spotifyResponse.tracks.items,
              ].map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
