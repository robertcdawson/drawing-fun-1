// Platform-aware keyboard helpers shared by the toolbar tooltips and the help
// modal, so the displayed modifier key (Cmd on Apple, Ctrl elsewhere) stays
// consistent everywhere shortcuts are surfaced.

export function isApplePlatform() {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    || navigator.userAgentData?.platform === 'macOS';
}

// The primary action modifier as a display label.
export function modLabel() {
  return isApplePlatform() ? '⌘' : 'Ctrl';
}

// Map a key token to its display label. 'mod' resolves to the platform
// modifier; every other token is shown verbatim.
export function formatKey(key) {
  if (key === 'mod') return modLabel();
  return key;
}
