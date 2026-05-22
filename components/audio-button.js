"use client";

import { useRef, useState } from "react";

export function AudioButton({ src, label }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const hasAudio = Boolean(src && src.trim());

  const handleClick = async () => {
    if (!hasAudio) {
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
      audioRef.current.addEventListener("pause", () => setIsPlaying(false));
      audioRef.current.addEventListener("play", () => setIsPlaying(true));
    }

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("音频播放失败:", error);
      setIsPlaying(false);
    }
  };

  return (
    <button
      type="button"
      className={`audio-btn ${hasAudio ? "has-audio" : "disabled"} ${isPlaying ? "playing" : ""}`}
      onClick={handleClick}
      title={hasAudio ? `播放：${label}` : "暂无音频"}
      aria-label={hasAudio ? `播放：${label}` : "暂无音频"}
    >
      {hasAudio ? (isPlaying ? "停" : "播") : "无"}
    </button>
  );
}
