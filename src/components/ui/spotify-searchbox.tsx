"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
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
      type: "artist";
    }[];
  };

  tracks: {
    items: {
      id: string;
      name: string;
      type: "track";
    }[];
  };
}

export function SpotifySearchbox({
  spotifyResponse,
  selectedItem,
  onInputChange,
  onSelect,
}: {
  spotifyResponse: SpotifySearchResult;
  selectedItem?: {
    name: string;
    id: string;
    type: string;
  };
  onInputChange: (value: string) => void;
  onSelect: ({
    name,
    id,
    type,
  }: {
    name: string;
    id: string;
    type: string;
  }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const allItems = React.useMemo(
    () => [...spotifyResponse.artists.items, ...spotifyResponse.tracks.items],
    [spotifyResponse]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {inputValue
            ? `${selectedItem?.name} (${selectedItem?.type})`
            : "Search Spotify"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Track or artist name"
            onValueChange={onInputChange}
          />
          <CommandEmpty>No results found.</CommandEmpty>
          {spotifyResponse.artists?.items.length > 0 && (
            <CommandGroup>
              {allItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={(currentValue) => {
                    console.log({
                      name: item.name,
                      id: item.id,
                      currentValue,
                    });
                    onSelect({ name: item.name, id: item.id, type: item.type });
                    setInputValue(item.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedItem?.id === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="">
                    <p>{item.name}</p>
                    <p>{item.type}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
