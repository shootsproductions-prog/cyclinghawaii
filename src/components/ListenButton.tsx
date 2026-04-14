"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  audioUrl: string;
}

export default function ListenButton({ audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Create a single audio element per button
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleEnd = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("ended", handleEnd);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch((err) => console.error("Audio play failed:", err));
    } else {
      audio.pause();
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isPlaying ? "Pause Laura" : "Listen to Laura"}
      title={isPlaying ? "Pause" : "Listen to Laura"}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-strava text-white transition-all hover:bg-brand hover:scale-110 shrink-0"
    >
      {isLoading ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="animate-spin"
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
        </svg>
      ) : isPlaying ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
