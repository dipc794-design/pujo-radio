"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { PLAYLISTS } from "../data/playlists";
import { Track, Playlist } from "../types";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${m}:${pad(s)}`;
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
      const formatter = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const parts = formatter.formatToParts(now);
      const hours = parts.find((p) => p.type === "hour")?.value || "12";
      const minutes = parts.find((p) => p.type === "minute")?.value || "00";
      const period = parts.find((p) => p.type === "dayPeriod")?.value || "AM";
      setTime({ hours, minutes, period });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="text-xs tracking-wider text-white/60">KOLKATA --:--</div>;

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-amber-200/90 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
      <span className="text-[10px] uppercase text-white/50 tracking-wider">KOLKATA</span>
      <span className="text-white font-semibold">{time.hours}</span>
      <span className="animate-blink text-amber-400 font-bold">:</span>
      <span className="text-white font-semibold">{time.minutes}</span>
      <span className="text-[10px] text-amber-300/80 font-sans ml-0.5">{time.period}</span>
    </div>
  );
});

const ListenerCounter = React.memo(function ListenerCounter() {
  const [count, setCount] = useState<number>(1428);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev + (Math.random() > 0.4 ? 1 : -1) * Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm text-xs">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="font-mono font-medium text-white/90">{count.toLocaleString()}</span>
      <span className="text-white/50 text-[11px] hidden sm:inline">listening along</span>
    </div>
  );
});

interface TopNavProps {
  currentPlaylist: Playlist;
  playlists: Playlist[];
  onSelectPlaylist: (playlist: Playlist) => void;
}

const TopNav = React.memo(function TopNav({
  currentPlaylist,
  playlists,
  onSelectPlaylist,
}: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-[max(1rem,env(safe-area-inset-top))] pointer-events-none">
      <div className="pointer-events-auto">
        <Clock />
      </div>

      <div className="pointer-events-auto">
        <ListenerCounter />
      </div>

      <div className="pointer-events-auto relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/90 transition-all active:scale-95"
          aria-label="Select Playlist"
        >
          <span className="text-amber-400 font-semibold">📻 Playlist</span>
          <span className="max-w-[100px] truncate hidden md:inline text-white/70">
            • {currentPlaylist.name}
          </span>
          <svg className="w-3.5 h-3.5 text-white/60 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-panel p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-amber-300 uppercase border-b border-white/10 mb-1">
              Select Nostalgia Channel
            </div>
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => {
                  onSelectPlaylist(pl);
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors text-xs flex flex-col gap-0.5 ${
                  pl.id === currentPlaylist.id
                    ? "bg-amber-500/20 text-white font-medium border border-amber-500/30"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="font-semibold">{pl.name}</span>
                <span className="text-[10px] text-white/50">{pl.subtitle} ({pl.tracks.length} tracks)</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
});

interface VinylDiscProps {
  isPlaying: boolean;
  sizeClass?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const VinylDisc = React.memo(function VinylDisc({
  isPlaying,
  sizeClass = "w-20 h-20",
  containerRef,
}: VinylDiscProps) {
  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden shadow-2xl border border-white/20 bg-black ${sizeClass}`}
    >
      <div
        className={`absolute inset-0 rounded-full animate-spin-slow transition-all duration-300 ${
          isPlaying ? "" : "[animation-play-state:paused]"
        }`}
        style={{
          background:
            "radial-gradient(circle, #222 10%, #111 25%, #2a2a2a 40%, #111 55%, #222 70%, #000 85%)",
        }}
      >
        <div ref={containerRef} className="yt-player-container w-full h-full rounded-full overflow-hidden opacity-90" />
      </div>

      <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-black/80 ring-2 ring-white/50 shadow-inner pointer-events-none z-10" />
    </div>
  );
});

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

const SeekBar = React.memo(function SeekBar({
  currentTime,
  duration,
  onSeek,
}: SeekBarProps) {
  const isDragging = useRef(false);
  const railRef = useRef<HTMLDivElement>(null);

  const calculateProgress = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!railRef.current || duration <= 0) return;
      const rect = railRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = clickX / rect.width;
      onSeek(percentage * duration);
    },
    [duration, onSeek]
  );

  const percentage = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div
      ref={railRef}
      onPointerDown={(e) => {
        isDragging.current = true;
        calculateProgress(e);
      }}
      onPointerMove={(e) => {
        if (isDragging.current) {
          calculateProgress(e);
        }
      }}
      onPointerUp={() => {
        isDragging.current = false;
      }}
      className="group relative flex items-center h-6 cursor-pointer touch-none select-none w-full"
    >
      <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-75 relative"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-amber-200 blur-[2px]" />
        </div>
      </div>

      <div
        className="absolute w-3 h-3 bg-white rounded-full shadow-lg border border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2"
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
});

interface PlayerProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  desktopVinylRef: React.RefObject<HTMLDivElement | null>;
  mobileVinylRef: React.RefObject<HTMLDivElement | null>;
}

const DesktopPlayer = React.memo(function DesktopPlayer({
  track,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  desktopVinylRef,
}: Omit<PlayerProps, "mobileVinylRef">) {
  return (
    <div className="hidden sm:flex items-center gap-4 glass-panel rounded-full p-3 pr-5 shadow-2xl max-w-xl w-full">
      <VinylDisc isPlaying={isPlaying} containerRef={desktopVinylRef} />

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-white truncate tracking-tight">
            {track.title}
          </h2>
          {track.year && (
            <span className="text-[10px] text-amber-300/80 font-mono shrink-0">
              {track.year}
            </span>
          )}
        </div>
        <p className="text-[12.5px] text-white/70 truncate">
          {track.artist} {track.film ? `• ${track.film}` : ""}
        </p>

        <div className="mt-0.5">
          <SeekBar currentTime={currentTime} duration={duration} onSeek={onSeek} />
        </div>

        <div className="flex justify-between text-[10.5px] font-mono text-white/50 -mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-2 border-l border-white/10 shrink-0">
        <button
          onClick={onPrev}
          aria-label="Previous Track"
          className="p-2 text-white/70 hover:text-white transition-colors active:scale-95"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="w-12 h-12 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-[0_4px_20px_rgba(245,158,11,0.5)] ring-1 ring-white/30 hover:scale-105 active:scale-95 transition-all"
        >
          {isPlaying ? (
            <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 fill-black translate-x-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={onNext}
          aria-label="Next Track"
          className="p-2 text-white/70 hover:text-white transition-colors active:scale-95"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 18h2V6h-2zm-11-6l8.5 6V6z" />
          </svg>
        </button>
      </div>
    </div>
  );
});

const MobilePlayer = React.memo(function MobilePlayer({
  track,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  mobileVinylRef,
}: Omit<PlayerProps, "desktopVinylRef">) {
  return (
    <div className="sm:hidden glass-panel rounded-[26px] p-4 shadow-2xl w-full flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <VinylDisc isPlaying={isPlaying} sizeClass="w-16 h-16" containerRef={mobileVinylRef} />

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white truncate">{track.title}</h2>
          <p className="text-xs text-white/70 truncate mt-0.5">{track.artist}</p>
          {track.film && <p className="text-[11px] text-amber-300/80 truncate">{track.film}</p>}
        </div>
      </div>

      <div className="w-full">
        <SeekBar currentTime={currentTime} duration={duration} onSeek={onSeek} />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[11px] font-mono text-white/60 flex items-center gap-1">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            aria-label="Previous Track"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white active:scale-95"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-[52px] h-[52px] rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-[0_4px_20px_rgba(245,158,11,0.5)] ring-1 ring-white/25 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <svg className="w-6 h-6 fill-black" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 fill-black translate-x-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={onNext}
            aria-label="Next Track"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white active:scale-95"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 18h2V6h-2zm-11-6l8.5 6V6z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

export default function NostalgiaApp() {
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist>(PLAYLISTS[0]);
  const [trackIndex, setTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

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

      const target =
        (window.innerWidth < 640 ? mobileVinylRef.current : desktopVinylRef.current) ||
        document.body;

      target.appendChild(iframeContainer);

      playerRef.current = new window.YT.Player("yt-player-element", {
        videoId: currentTrack.videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            if (!isMounted) return;
            const iframe = event.target.getIframe();
            mountIframeInSlot(iframe);
            setDuration(event.target.getDuration() || currentTrack.duration);
          },
          onStateChange: (event: any) => {
            if (!isMounted) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              handleNext();
            }
          },
          onError: (event: any) => {
            console.warn("YouTube Player error:", event.data);
            handleNext();
          },
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
      window.onYouTubeIframeAPIReady = () => {
        if (isMounted) initYTPlayer();
      };
    }

    const handleResize = () => {
      if (playerRef.current && playerRef.current.getIframe) {
        mountIframeInSlot(playerRef.current.getIframe());
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (timerRef.current) clearInterval(timerRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [currentTrack.videoId, mountIframeInSlot, handleNext]);

  useEffect(() => {
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(currentTrack.videoId);
      setCurrentTime(0);
      setDuration(currentTrack.duration);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const t = playerRef.current.getCurrentTime();
          const d = playerRef.current.getDuration();
          if (t !== undefined) setCurrentTime(t);
          if (d && d > 0) setDuration(d);
        }
      }, 400);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleTogglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((seconds: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  }, []
