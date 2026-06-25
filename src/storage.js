// Persistence: never lose an idea. The stroke model is serialized to
// localStorage so a refresh, a phone call, or returning hours later brings the
// drawing back exactly as it was left — the foundation of "refine later".

const KEY = 'drawing-fun:v1';
const PROMPT_KEY = 'drawing-fun:prompt';
const RECENT_KEY = 'drawing-fun:recent';

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

// The AI prompt is the artist's intent for how a text-to-image model should
// render the sketch. Persisting it means the idea — composition AND direction —
// travels together and survives a refresh, just like the strokes.
export function savePrompt(text) {
  try {
    localStorage.setItem(PROMPT_KEY, text);
  } catch (e) {
    // Storage unavailable — the prompt still works in-memory this session.
  }
}

export function loadPrompt() {
  try {
    return localStorage.getItem(PROMPT_KEY) || '';
  } catch (e) {
    return '';
  }
}

// Recently used colors — including custom-mixed ones — so the artist can return
// to a hue without re-picking it, keeping a consistent palette across a piece.
export function saveRecentColors(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch (e) {
    // Non-fatal — recents are a convenience, not core data.
  }
}

export function loadRecentColors() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
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
