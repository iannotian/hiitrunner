"use client";

import React from "react";
import { SpotifySearchbox } from "@/components/ui/spotify-searchbox";
import { useDebounce } from "./debounce";

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

interface SpotifyErrorResponse {
  error: {
    status: number;
    message: string;
  };
}

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    console.error("No refresh token found in local storage");
    return;
  }

  const url = `https://accounts.spotify.com/api/token`;

  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string,
    }),
  };

  const body = await fetch(url, payload);
  const response = await body.json();

  if ("error" in response) {
    console.error(response.error);
    return;
  }

  localStorage.setItem("accessToken", response.access_token);
  localStorage.setItem("refreshToken", response.refresh_token);
};

export default function Home() {
  const [spotifySearchResults, setSpotifySearchResults] =
    React.useState<SpotifySearchResult>();
  const [selection, setSelection] = React.useState<{
    name: string;
    id: string;
    type: string;
  }>();

  const getSpotifySearchResults = async (query: string) => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("No access token found in local storage");
      return;
    }

    const url = `https://api.spotify.com/v1/search?q=${query}&type=artist,track&limit=3`;

    const payload = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const body = await fetch(url, payload);
    const response = (await body.json()) as
      | SpotifySearchResult
      | SpotifyErrorResponse;

    if ("error" in response) {
      if (
        response.error.status === 401 &&
        response.error.message === "The access token expired"
      ) {
        // the access token expired, so we need to refresh it
        refreshAccessToken();
        // try again with the new access token
        getSpotifySearchResults(query);
      }

      return;
    }

    setSpotifySearchResults(response);
  };

  const debouncedSearch = useDebounce(getSpotifySearchResults, 500);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 max-w-screen-xl mx-auto">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://github.com/iannotian"
            target="_blank"
            rel="noopener noreferrer"
          >
            HIITRunner by @ian.not.ian
          </a>
        </div>
      </div>
      <div>
        <SpotifySearchbox
          spotifyResponse={
            spotifySearchResults ||
            ({
              artists: { items: [] },
              tracks: { items: [] },
            } as SpotifySearchResult)
          }
          selectedId={selection?.id}
          onInputChange={debouncedSearch}
          onSelect={({ name, id, type }) => {
            setSelection({ name, id, type });
            setSpotifySearchResults(undefined);
          }}
        />
        <pre>{JSON.stringify(selection, undefined, 4)}</pre>
      </div>
      <p></p>
    </main>
  );
}
