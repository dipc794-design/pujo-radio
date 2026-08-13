"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { PLAYLISTS } from "../data/playlists";
import { Track, Playlist } from "../types";

function formatTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

const Clock = React.memo(function Clock() {
  const [time, setTime] = useState<{ hours: string; minutes: string; period: string } | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).formatToParts(now);
      setTime({
        hours: parts.find((p) => p.type === "hour")?.value || "12",
        minutes: parts.find((p) => p.type === "minute")?.value || "00",
        period: parts.find((p) => p.type === "dayPeriod")?.value || "AM",
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="text-xs text-white/60">KOLKATA --:--</div>;

  return (
    <div className="flex items-center gap-1 font-mono text-xs font-medium text-amber-200/90 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
      <span className="text-[10px] uppercase text-white/50">KOLKATA</span>
      <span className="text-white font-semibold">{time.hours}</span>
      <span className="animate-blink text-amber-400 font-bold">:</span>
      <span className="text-white font-semibold">{time.minutes}</span>
      <span className="text-[10px] text-amber-300/80 ml-0.5">{time.period}</span>
    </div>
  );
});

const ListenerCounter = React.memo(function ListenerCounter() {
  const [count, setCount] = useState(1428);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev + (Math.random() > 0.4 ? 1 : -1) * Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm text-xs">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="font-mono text-white/90">{count.toLocaleString()}</span>
      <span className="text-white/50 text-[11px] hidden sm:inline">listening along</span>
    </div>
  );
});

export default function NostalgiaApp() {
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist>(PLAYLISTS[0]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const desktopVinylRef = useRef<HTMLDivElement>(null);
  const mobileVinylRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = currentPlaylist.tracks[trackIndex] || currentPlaylist.tracks[0];

  const mountIframeInSlot = useCallback((iframe: HTMLIFrameElement) => {
    const isMobile = window.innerWidth < 640;
    const targetSlot = isMobile ? mobileVinylRef.current : desktopVinylRef.current;
    if (targetSlot && iframe && iframe.parentElement !== targetSlot) {
      targetSlot.appendChild(iframe);
    }
  }, []);

  const handleNext = useCallback(() => {
    setTrackIndex((prev) => (prev + 1) % currentPlaylist.tracks.length);
  }, [currentPlaylist.tracks.length]);

  const handlePrev = useCallback(() => {
    setTrackIndex((prev) => (prev - 1 + currentPlaylist.tracks.length) % currentPlaylist.tracks.length);
  }, [currentPlaylist.tracks.length]);

  useEffect(() => {
    let isMounted = true;
    const initYTPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      const iframeContainer = document.createElement("div");
      iframeContainer.id = "yt-player-element";
      const target = (window.innerWidth < 640 ? mobileVinylRef.current : desktopVinylRef.current) || document.body;
      target.appendChild(iframeContainer);

      playerRef.current = new window.YT.Player("yt-player-element", {
        videoId: currentTrack.videoId,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: (e: any) => {
            if (!isMounted) return;
            mountIframeInSlot(e.target.getIframe());
            setDuration(e.target.getDuration() || currentTrack.duration);
          },
          onStateChange: (e: any) => {
            if (!isMounted) return;
            if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            else if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
            else if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              handleNext();
            }
          },
          onError: () => handleNext(),
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initYTPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => { if (isMounted) initYTPlayer(); };
    }

    const handleResize = () => {
      if (playerRef.current?.getIframe) mountIframeInSlot(playerRef.current.getIframe());
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (timerRef.current) clearInterval(timerRef.current);
      if (playerRef.current?.destroy) playerRef.current.destroy();
    };
  }, [currentTrack.videoId, mountIframeInSlot, handleNext]);

  useEffect(() => {
    if (playerRef.current?.loadVideoById) {
      playerRef.current.loadVideoById(currentTrack.videoId);
      setCurrentTime(0);
      setDuration(currentTrack.duration);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          const t = playerRef.current.getCurrentTime();
          const d = playerRef.current.getDuration();
          if (t !== undefined) setCurrentTime(t);
          if (d && d > 0) setDuration(d);
        }
      }, 400);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const handleSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!playerRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const targetTime = (clickX / rect.width) * duration;
    playerRef.current.seekTotargetTime, true);
    setCurrentTime(targetTime);
  };

  const percentage = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-between overflow-hidden">
      <div className="fixed inset-0 -z-20 hero-bg bg-cover bg-center transition-all duration-700">
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/80" />
      </div>

      <div
        className="fixed inset-0 -z-10 pointer-events-none opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='noiseFilter'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23noiseFilter)'/></svg>")`,
        }}
      />

      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-4 pointer-events-none">
        <div className="pointer-events-auto"><Clock /></div>
        <div className="pointer-events-auto"><ListenerCounter /></div>
        <div className="pointer-events-auto relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/90"
          >
            <span className="text-amber-400 font-semibold">📻 Playlist</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel p-2 shadow-2xl z-50">
              {PLAYLISTS.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => { setCurrentPlaylist(pl); setTrackIndex(0); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-white/10 text-white"
                >
                  <p className="font-semibold">{pl.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="my-auto text-center px-4 pt-20 pb-36 max-w-2xl select-none pointer-events-none">
        <span className="inline-block text-xs font-mono tracking-widest text-amber-300/80 uppercase bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-amber-500/20 mb-3">
          {currentPlaylist.subtitle}
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif tracking-tight text-amber-100/90 drop-shadow-md">
          {currentPlaylist.name}
        </h1>
      </div>

      <footer className="w-full max-w-xl p-4 pb-6 z-20">
        <div className="glass-panel rounded-[26px] p-4 shadow-2xl w-full flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0 rounded-full overflow-hidden shadow-2xl border border-white/20 bg-black w-16 h-16 sm:w-20 sm:h-20">
              <div
                className={`absolute inset-0 rounded-full animate-spin-slow ${isPlaying ? "" : "[animation-play-state:paused]"}`}
                style={{ background: "radial-gradient(circle, #222 10%, #111 25%, #2a2a2a 40%, #111 55%, #222 70%, #000 85%)" }}
              >
                <div ref={mobileVinylRef} className="yt-player-container w-full h-full rounded-full overflow-hidden opacity-90 sm:hidden" />
                <div ref={desktopVinylRef} className="yt-player-container w-full h-full rounded-full overflow-hidden opacity-90 hidden sm:block" />
              </div>
              <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-black/80 ring-2 ring-white/50 shadow-inner pointer-events-none z-10" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{currentTrack.title}</h2>
              <p className="text-xs text-white/70 truncate mt-0.5">{currentTrack.artist}</p>
              {currentTrack.film && <p className="text-[11px] text-amber-300/80 truncate">{currentTrack.film}</p>}
            </div>
          </div>

          <div
            onPointerDown={handleSeek}
            className="group relative flex items-center h-5 cursor-pointer touch-none select-none w-full"
          >
            <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full relative"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono text-white/60">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handlePrev} className="p-2 text-white/80 active:scale-95">⏮️</button>
              <button
                onClick={handleTogglePlay}
                className="w-12 h-12 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-lg ring-1 ring-white/25 active:scale-95 text-lg font-bold"
              >
                {isPlaying ? "⏸️" : "▶️"}
              </button>
              <button onClick={handleNext} className="p-2 text-white/80 active:scale-95">⏭️</button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
            }
