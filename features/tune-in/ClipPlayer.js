"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import { CLIP_SECONDS, LISTEN_TIERS } from "@/lib/games/tune-in/engine";
import { teamInk } from "@/lib/games/core/teams";

const BARS = 24;

/**
 * Play/pause control for the song clip. Plays only while `enabled` (the turn is
 * running) and reports how far into the clip it has got through `onHeard`.
 *
 * @param {{ src: string, enabled: boolean, heardSeconds: number, color: string, onHeard: (seconds: number) => void }} props
 */
export function ClipPlayer({ src, enabled, heardSeconds, color, onHeard }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [failed, setFailed] = useState(false);

  // The turn stopped (paused, time up, round over): stop the music with it.
  useEffect(() => {
    if (!enabled) audioRef.current?.pause();
  }, [enabled]);

  // A new song: start from the top.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, [src]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || !enabled) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (audio.ended || audio.currentTime >= audio.duration - 0.2) audio.currentTime = 0;
    try {
      setFailed(false);
      await audio.play();
    } catch {
      setFailed(true);
    }
  };

  const progress = Math.min(1, position / CLIP_SECONDS);
  const heard = Math.min(1, heardSeconds / CLIP_SECONDS);

  return (
    <div className="flex flex-col items-center gap-5">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setPosition(t);
          onHeard(Math.floor(t));
        }}
      />

      <button
        type="button"
        onClick={toggle}
        disabled={!enabled}
        aria-label={playing ? "Pause the song" : "Play the song"}
        aria-pressed={playing}
        className="press relative grid size-28 place-items-center rounded-full border-2 border-edge disabled:opacity-50 sm:size-36"
        style={{ background: color, color: teamInk(color) }}
      >
        {playing ? (
          <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full opacity-20" style={{ background: color }} />
        ) : null}
        {playing ? <PauseIcon size={44} strokeWidth={3} /> : <PlayIcon size={44} className="translate-x-0.5" />}
      </button>

      {/* Equaliser: dances while the clip plays. */}
      <div aria-hidden="true" className="flex h-10 w-full max-w-xs items-end justify-center gap-1">
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            className={`w-1.5 rounded-full ${playing ? "eq-bar" : ""}`}
            style={{
              background: color,
              opacity: playing ? 0.9 : 0.3,
              height: playing ? undefined : `${20 + ((i * 37) % 50)}%`,
              animationDelay: `${(i * 97) % 700}ms`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md">
        <div className="relative h-2.5 rounded-full bg-[var(--line-strong)]" role="presentation">
          <div className="absolute inset-y-0 left-0 rounded-full opacity-40" style={{ width: `${heard * 100}%`, background: color }} />
          <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200" style={{ width: `${progress * 100}%`, background: color }} />
          {LISTEN_TIERS.filter(([upTo]) => Number.isFinite(upTo)).map(([upTo]) => (
            <span
              key={upTo}
              aria-hidden="true"
              className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-foreground/40"
              style={{ left: `${(upTo / CLIP_SECONDS) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-xs tabular-nums text-subtle">
          <span>{Math.floor(position)}s</span>
          <span>Heard {heardSeconds}s of {CLIP_SECONDS}s</span>
        </div>
        {failed ? (
          <p role="alert" className="mt-2 text-center text-sm text-miss">
            The clip won’t play. Pause and swap for another song.
          </p>
        ) : null}
      </div>
    </div>
  );
}
