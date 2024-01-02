"use client";

import React from "react";
import { SpotifySearchbox } from "@/components/ui/spotify-searchbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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

interface SpotifyRecommendationsResponse {
  tracks: {
    id: string;
    name: string;
    artists: {
      name: string;
    }[];
    album: {
      name: string;
      images: {
        url: string;
        height: number;
        width: number;
      }[];
    };
    type: "track";
  }[];
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

const generatePlaylist = async ({
  seedArtists,
  seedTracks,
  minTempo,
  maxTempo,
}: {
  seedArtists: string[];
  seedTracks: string[];
  minTempo: number;
  maxTempo: number;
}): Promise<SpotifyRecommendationsResponse | undefined> => {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token found in local storage");
    return;
  }

  const params = new URLSearchParams({
    seed_artists: seedArtists.join(","),
    seed_tracks: seedTracks.join(","),
    min_tempo: minTempo.toString(),
    max_tempo: maxTempo.toString(),
    market: "US",
  });

  const url = `https://api.spotify.com/v1/recommendations?${params.toString()}`;

  const payload = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const body = await fetch(url, payload);
  const response = await body.json();

  if ("error" in response) {
    if (
      response.error.status === 401 &&
      response.error.message === "The access token expired"
    ) {
      // the access token expired, so we need to refresh it
      refreshAccessToken();
      // try again with the new access token
      return generatePlaylist({ seedArtists, seedTracks, minTempo, maxTempo });
    }

    return;
  }

  return response;
};

const getCurrentUser = async (): Promise<{ id: string } | undefined> => {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token found in local storage");
    return;
  }

  const url = `https://api.spotify.com/v1/me`;

  const payload = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const body = await fetch(url, payload);
  const response = await body.json();

  if ("error" in response) {
    if (
      response.error.status === 401 &&
      response.error.message === "The access token expired"
    ) {
      // the access token expired, so we need to refresh it
      refreshAccessToken();
      // try again with the new access token
      return getCurrentUser();
    }

    return;
  }

  return response as { id: string };
};

const createPlaylist = async ({
  userId,
  name,
  description,
}: {
  userId: string;
  name: string;
  description: string;
}): Promise<{ id: string } | undefined> => {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token found in local storage");
    return;
  }

  const url = `https://api.spotify.com/v1/users/${userId}/playlists`;

  const payload = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name,
      description,
    }),
  };

  const body = await fetch(url, payload);
  const response = await body.json();

  if ("error" in response) {
    if (
      response.error.status === 401 &&
      response.error.message === "The access token expired"
    ) {
      // the access token expired, so we need to refresh it
      refreshAccessToken();
      // try again with the new access token
      return createPlaylist({ userId, name, description });
    }

    return;
  }

  return response as { id: string };
};

const addTracksToPlaylist = async ({
  userId,
  playlistId,
  trackIds,
}: {
  userId: string;
  playlistId: string;
  trackIds: string[];
}): Promise<void | undefined> => {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.error("No access token found in local storage");
    return;
  }

  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

  const payload = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      uris: trackIds.map((id) => `spotify:track:${id}`),
    }),
  };

  const body = await fetch(url, payload);
  const response = await body.json();

  if ("error" in response) {
    if (
      response.error.status === 401 &&
      response.error.message === "The access token expired"
    ) {
      // the access token expired, so we need to refresh it
      refreshAccessToken();
      // try again with the new access token
      return addTracksToPlaylist({ userId, playlistId, trackIds });
    }

    return;
  }
};

const handleSavePlaylistButtonClick = async ({
  playlistName,
  trackIds,
}: {
  playlistName: string;
  trackIds: string[];
}) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    console.error("No current user found");
    return;
  }

  const playlist = await createPlaylist({
    userId: currentUser.id,
    name: playlistName,
    description: "A playlist generated by HIITRunner",
  });

  if (!playlist) {
    console.error("No playlist found");
    return;
  }

  await addTracksToPlaylist({
    userId: currentUser.id,
    playlistId: playlist.id,
    trackIds,
  });
};

export default function Home() {
  const [spotifySearchResults, setSpotifySearchResults] =
    React.useState<SpotifySearchResult>();
  const [selection, setSelection] = React.useState<{
    name: string;
    id: string;
    type: string;
  }>();
  const [BPMRange, setBPMRange] = React.useState<[number, number]>([170, 180]);
  const [playlist, setPlaylist] =
    React.useState<SpotifyRecommendationsResponse>();
  const [playlistIsSaved, setPlaylistIsSaved] = React.useState(false);

  React.useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user || !("id" in user)) {
        window.location.href = "/";
      }
    });
  }, []);

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
        <div className="fixed bottom-0 right-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none cursor-pointer flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            onClick={() => {
              localStorage.removeItem("storedAt");
              localStorage.removeItem("expiresIn");
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              window.location.href = "/";
            }}
          >
            Log Out
          </a>
        </div>
      </div>
      <div className="flex flex-shrink-0">
        <Card className="flex flex-col gap-6 p-8">
          <h1 className="text-xl font-bold">Generate playlist</h1>
          <div className="flex flex-col gap-4">
            <Label htmlFor="artist">Artist/Track</Label>
            <SpotifySearchbox
              spotifyResponse={
                spotifySearchResults ||
                ({
                  artists: { items: [] },
                  tracks: { items: [] },
                } as SpotifySearchResult)
              }
              selectedItem={selection}
              onInputChange={debouncedSearch}
              onSelect={({ name, id, type }) => {
                setSelection({ name, id, type });
              }}
            />
            {/* {selection && (
            <Badge className="inline-block">{`${selection?.name} (${selection?.type})`}</Badge>
          )} */}
          </div>
          <div className="flex flex-col gap-4">
            <Label htmlFor="bpm">BPM</Label>
            <Slider
              id="bpm"
              step={5}
              defaultValue={[170, 180]}
              max={220}
              min={120}
              minStepsBetweenThumbs={1}
              onValueCommit={(value) => {
                setBPMRange([value[0], value[1]]);
              }}
            />
          </div>
          <Drawer
            onClose={() => {
              setPlaylistIsSaved(false);
              setPlaylist(undefined);
            }}
          >
            <DrawerTrigger
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              disabled={!selection}
              onClick={() => {
                generatePlaylist({
                  seedArtists:
                    selection?.type === "artist" ? [selection?.id] : [""],
                  seedTracks:
                    selection?.type === "track" ? [selection?.id] : [""],
                  minTempo: BPMRange[0],
                  maxTempo: BPMRange[1],
                }).then((response) => {
                  console.log(response);
                  setPlaylist(response);
                });
              }}
            >
              Generate
            </DrawerTrigger>
            <DrawerContent className="flex flex-col gap-4 justify-center items-center">
              <DrawerHeader>
                <DrawerTitle>{`${selection?.name} Workout Playlist (${BPMRange[0]} - ${BPMRange[1]} BPM)`}</DrawerTitle>
                <DrawerDescription>
                  Take a look at your new workout playlist!
                </DrawerDescription>
              </DrawerHeader>
              <Card className="flex flex-col gap-6 p-8 max-h-[50vh] overflow-y-scroll">
                {playlist?.tracks.map((track) => {
                  return (
                    <div key={track.id} className="flex flex-row gap-4">
                      <img
                        className="w-16 h-16"
                        src={track.album.images[2].url}
                        alt={track.name}
                      />
                      <div className="flex flex-col">
                        <h2 className="text-md font-bold">{track.name}</h2>
                        <p className="text-sm font-light">
                          {track.artists
                            .map((artist) => artist.name)
                            .join(", ")}
                        </p>
                        <p className="text-sm font-light italic">
                          {track.album.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </Card>
              <DrawerFooter className="">
                <div className="flex gap-2">
                  <DrawerClose>
                    <Button
                      variant="outline"
                      onClick={() => setPlaylist(undefined)}
                    >
                      Cancel
                    </Button>
                  </DrawerClose>
                  <Button
                    onClick={() => {
                      handleSavePlaylistButtonClick({
                        playlistName: `${selection?.name} Workout Playlist (${BPMRange[0]} - ${BPMRange[1]} BPM)`,
                        trackIds:
                          playlist?.tracks.map((track) => track.id) || [],
                      }).then(() => {
                        setPlaylistIsSaved(true);
                      });
                    }}
                    disabled={playlistIsSaved}
                  >
                    {playlistIsSaved
                      ? "Playlist Saved!"
                      : "Save Playlist to Spotify"}
                  </Button>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </Card>
      </div>
      <p></p>
    </main>
  );
}
