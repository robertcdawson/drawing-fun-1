// Persistence: never lose an idea. The stroke model is serialized to
// localStorage so a refresh, a phone call, or returning hours later brings the
// drawing back exactly as it was left — the foundation of "refine later".

const KEY = 'drawing-fun:v1';

export function saveStrokes(strokes) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, strokes }));
  } catch (e) {
    // Storage can be full or disabled (private mode); drawing still works in-memory.
  }
}

export function loadStrokes() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.strokes)) return data.strokes;
  } catch (e) {
    // Corrupt or unavailable storage — start with a clean canvas.
  }
  return [];
}

export function clearStrokes() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    // Ignore — there's nothing more we can do.
  }
}

// Coalesce rapid saves (one per stroke) into a single write shortly after the
// artist pauses, so persistence never costs us drawing smoothness.
export function makeDebouncedSaver(delay = 400) {
  let timer = null;
  return (strokes) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      saveStrokes(strokes);
      timer = null;
    }, delay);
  };
}
