// Brush engine: turn raw pointer signals into expressive, variable-width marks,
// and render strokes (live and on full redraw) from the retained stroke model.
//
// A stroke is a small vector record so it can be undone, persisted, and
// re-rendered crisply at any resolution:
//   { color: string, points: [{ x, y, w }] }   // coords in logical (CSS) units

export const MIN_BRUSH = 2;
export const MAX_BRUSH = 60;
export const DEFAULT_BRUSH = 8;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Map a base brush size + the way the artist is moving into a stroke width for
// one point. A real stylus drives width from pressure; a finger has no pressure
// signal, so we derive expressiveness from speed (fast = thinner, slow = thicker).
// The result is a line that tapers and swells, carrying the gesture's energy.
export function pointWidth(baseWidth, { pressure = 0, speed = 0, usePressure = false }) {
  let factor;
  if (usePressure) {
    // pressure 0..1 -> 0.3..1.0 of the base size
    factor = 0.3 + 0.7 * clamp(pressure, 0, 1);
  } else {
    // speed in logical px/ms; ~2.2 px/ms is a fast flick. Thin to 40% when fast.
    const t = clamp(speed / 2.2, 0, 1);
    factor = 1 - 0.6 * t;
  }
  return clamp(baseWidth * factor, 0.75, MAX_BRUSH * 1.5);
}

// Draw a single stroke as a ribbon of round-capped capsules. With densely
// sampled points (coalesced pointer events) the overlapping round caps form a
// smooth, variable-width line — simple and reliable, no curve-fitting needed.
export function drawStroke(ctx, stroke) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;

  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // A single tap leaves a dot, so the surface always responds to a touch.
  if (pts.length === 1) {
    const p = pts[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.w / 2), 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    ctx.beginPath();
    ctx.lineWidth = (a.w + b.w) / 2;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

// Draw just the most recent segment of the stroke in progress, so live drawing
// stays smooth without redrawing the whole canvas every frame.
export function drawLastSegment(ctx, stroke) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (pts.length === 1) {
    const p = pts[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.w / 2), 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  ctx.beginPath();
  ctx.lineWidth = (a.w + b.w) / 2;
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

// Render a whole drawing. `scale` lets export re-render at higher resolution
// from the same logical coordinates (lossless, since strokes are vectors).
export function renderStrokes(ctx, strokes, scale = 1) {
  if (scale !== 1) {
    ctx.save();
    ctx.scale(scale, scale);
  }
  for (const stroke of strokes) drawStroke(ctx, stroke);
  if (scale !== 1) ctx.restore();
}
