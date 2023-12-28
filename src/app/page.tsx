"use client";

import React from "react";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  React.useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (accessToken && refreshToken) {
      router.push("/home");
    }
  }, [router]);

  const generateCodeVerifier = () => {
    const array = new Uint8Array(32); // 32 bytes will give us a 43+ character string
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  };

  const sha256 = async (plain: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await window.crypto.subtle.digest("SHA-256", data);
    return hash;
  };

  const base64urlencode = (a: ArrayBuffer) => {
    const uintArray = new Uint8Array(a);
    const numberArray = Array.from(uintArray);
    return btoa(String.fromCharCode.apply(null, numberArray))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  const generateCodeChallenge = async (codeVerifier: string) => {
    const hashed = await sha256(codeVerifier);
    return base64urlencode(hashed);
  };

  const setupPKCE = async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    return { codeVerifier, codeChallenge };
  };

  const getSpotifyAuthUrl = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI as string;
    const scopes = ["playlist-modify-public", "playlist-modify-private"];

    setupPKCE().then(({ codeChallenge, codeVerifier }) => {
      localStorage.setItem("codeVerifier", codeVerifier); // cleared in spotify/auth-callback/page.tsx

      const queryParams = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        scope: scopes.join(" "),
        redirect_uri: redirectUri,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
      });

      window.location.href = `https://accounts.spotify.com/authorize?${queryParams.toString()}`;
    });
  };

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
        <h1 className="flex flex-col text-6xl font-bold text-center gap-4">
          <span className="block">HIITRunner</span>
          <span className="block text-4xl font-light text-gray-500 max-w-xl">
            Effortlessly create a BPM-tailored workout playlist with just your
            favorite artist&apos;s name.
          </span>
        </h1>
      </div>
      <div className="flex mb-32 text-center">
        <button
          type="button"
          onClick={() => getSpotifyAuthUrl()}
          className="group cursor-pointer rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`text-2xl font-semibold`}>
            Sign in with Spotify{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
        </button>
      </div>
    </main>
  );
}
