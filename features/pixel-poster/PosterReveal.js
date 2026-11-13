"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The poster is scrambled into tiles AND blurred; both ease off together.
 * Index = engine stage, most hidden first.
 *
 *  - BLUR_CQW:       blur radius, as a % of the poster's displayed width (cqw)
 *  - SCRAMBLE_FIXED: share of tiles back in their home spot (the rest are swapped around)
 */
const BLUR_CQW = [2.4, 1];
const SCRAMBLE_FIXED = [0, 0.5];
const SCRAMBLE_COLS = 4;
const SCRAMBLE_ROWS = 5;

/** One decoded image per URL per page load. */
const images = new Map();

function loadImage(src) {
  if (!images.has(src)) {
    images.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => {
          images.delete(src);
          reject(new Error("Poster failed to load"));
        };
        img.src = src;
      }),
    );
  }
  return images.get(src);
}

/** Small seeded RNG (mulberry32), so a poster scrambles the same way on every render. */
function seededRandom(text) {
  let seed = 2166136261;
  for (const char of text) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Where each tile is drawn: `layout[slot] = tile`. The first `fixedShare` of a
 * fixed random order sit at home; the rest rotate one place along a shuffled
 * cycle, so none of them lands home by accident. Tiles only ever snap home as
 * stages advance, never move away.
 */
function scrambleLayout(key, fixedShare) {
  const count = SCRAMBLE_COLS * SCRAMBLE_ROWS;
  const random = seededRandom(key);
  const homeOrder = shuffled([...Array(count).keys()], random);
  const fixedCount = Math.round(count * fixedShare);
  const loose = homeOrder.slice(fixedCount);
  const layout = [...Array(count).keys()];
  if (loose.length >= 2) loose.forEach((slot, i) => (layout[slot] = loose[(i + 1) % loose.length]));
  return layout;
}

function drawScrambled(canvas, img, layout) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  // Integer tile edges so neighbours meet without seams; a thin gutter shows the grid.
  const xs = Array.from({ length: SCRAMBLE_COLS + 1 }, (_, i) => Math.round((i * w) / SCRAMBLE_COLS));
  const ys = Array.from({ length: SCRAMBLE_ROWS + 1 }, (_, i) => Math.round((i * h) / SCRAMBLE_ROWS));
  const gap = Math.max(1, Math.round(w / 200));
  layout.forEach((tile, slot) => {
    const [tc, tr] = [tile % SCRAMBLE_COLS, Math.floor(tile / SCRAMBLE_COLS)];
    const [sc, sr] = [slot % SCRAMBLE_COLS, Math.floor(slot / SCRAMBLE_COLS)];
    const sw = Math.min(xs[tc + 1] - xs[tc], xs[sc + 1] - xs[sc]);
    const sh = Math.min(ys[tr + 1] - ys[tr], ys[sr + 1] - ys[sr]);
    ctx.drawImage(img, xs[tc], ys[tr], sw, sh, xs[sc] + gap / 2, ys[sr] + gap / 2, sw - gap, sh - gap);
  });
}

/**
 * A movie poster, scrambled and blurred, at reveal `stage` (0 = most hidden).
 *
 * @param {{ src: string, stage: number, seedKey: string, className?: string }} props
 */
export function PosterReveal({ src, stage, seedKey, className = "" }) {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState({ src: null, img: null, failed: false });
  const img = loaded.src === src ? loaded.img : null;
  const failed = loaded.src === src && loaded.failed;

  useEffect(() => {
    let active = true;
    loadImage(src).then(
      (image) => active && setLoaded({ src, img: image, failed: false }),
      () => active && setLoaded({ src, img: null, failed: true }),
    );
    return () => {
      active = false;
    };
  }, [src]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    drawScrambled(canvas, img, scrambleLayout(seedKey, SCRAMBLE_FIXED[stage] ?? 1));
  }, [img, stage, seedKey]);

  const ratio = img ? `${img.naturalWidth} / ${img.naturalHeight}` : "2 / 3";
  // Scaled up a touch so the blur's soft, see-through edges stay outside the frame.
  const canvasStyle = { filter: `blur(${BLUR_CQW[stage] ?? 0}cqw)`, transform: "scale(1.08)", transition: "filter 600ms ease" };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-surface-strong ${className}`}
      style={{ aspectRatio: ratio, containerType: "inline-size" }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Scrambled, blurred movie poster"
        className={`block size-full transition-opacity duration-300 ${img ? "opacity-100" : "opacity-0"}`}
        style={canvasStyle}
      />
      {!img ? (
        <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted">
          {failed ? "This poster didn’t load." : <span className="size-8 animate-spin rounded-full border-2 border-line-strong border-t-accent" />}
        </div>
      ) : null}
    </div>
  );
}
