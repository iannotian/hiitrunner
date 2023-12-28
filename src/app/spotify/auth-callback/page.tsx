"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

// this page is redirected to after the user logs in with Spotify
// example redirect url: http://localhost:3000/spotify/auth-callback?code=XYZ...

export default function SpotifyAuthCallback() {
  const getToken = async (code: string) => {
    // stored in the previous step
    let codeVerifier = localStorage.getItem("codeVerifier");

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI as string;

    if (!codeVerifier) {
      console.error("No code verifier found in local storage");
      return;
    }

    const url = "https://accounts.spotify.com/api/token";

    const payload = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    };

    const body = await fetch(url, payload);
    const response = await body.json();

    console.log(response);

    localStorage.setItem("accessToken", response.access_token);
    localStorage.setItem("refreshToken", response.refresh_token);
    localStorage.setItem("expiresIn", response.expires_in);
    localStorage.setItem("storedAt", new Date().toISOString());
    localStorage.removeItem("codeVerifier");
  };

  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  React.useEffect(() => {
    const expiresIn = localStorage.getItem("expiresIn");
    const storedAt = localStorage.getItem("storedAt");

    if (expiresIn && storedAt) {
      const expiresInMs = parseInt(expiresIn) * 1000;
      const storedAtMs = new Date(storedAt).getTime();
      const nowMs = new Date().getTime();

      const timeLeft = expiresInMs - (nowMs - storedAtMs);

      if (timeLeft < 0) {
        console.log("Access token expired");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("expiresIn");
        localStorage.removeItem("storedAt");

        // TODO: refresh token flow instead of redirecting to spotify
        // refreshAccessToken(refreshToken: string).then(() => {
        //   window.location.href = "/";
        // });
      } else {
        console.log("Access token still valid");
        window.location.href = "/";
        return;
      }
    }

    if (code) {
      getToken(code as string).then(() => {
        window.location.href = "/";
      });
    }
  }, [code]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 max-w-screen-xl mx-auto">
      <div className="h-full">
        <h1 className="flex flex-col items-center text-6xl font-bold text-center gap-4 ">
          <span className="block">Working...</span>
          <span className="block text-4xl font-light text-gray-500 max-w-xl">
            This page will automatically redirect you to HIITRunner. If it
            doesn&apos;t, click{" "}
            <a href="/" className="underline">
              here
            </a>
            .
          </span>
        </h1>
      </div>
    </main>
  );
}
