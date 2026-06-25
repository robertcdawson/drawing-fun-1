import React, { useCallback, useState, useEffect } from 'react';
import 'material-icons/iconfont/material-icons.css';
import { MIN_BRUSH, MAX_BRUSH } from './brush';

const COLORS = ['black', 'red', 'yellow', 'blue', 'purple', 'green', 'orange', 'white'];

const Toolbar = ({
  selectedColor,
  setSelectedColor,
  baseWidth,
  setBaseWidth,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  exportPNG,
  clearCanvas,
  hidden,
}) => {
  // One popover at a time keeps the surface calm: 'color', 'size', or null.
  const [popover, setPopover] = useState(null);
  const toggle = (name) => setPopover((p) => (p === name ? null : name));

  // The moment a stroke begins, dismiss any open popover so nothing lingers
  // between the artist and the canvas.
  useEffect(() => {
    if (hidden) setPopover(null);
  }, [hidden]);

  // Share the drawing as a crisp PNG. The native share sheet is the cheapest
  // bridge to "send it somewhere else" — Photos, Messages, or a text-to-image
  // AI app. Falls back to a direct download where sharing files isn't supported.
  const handleShare = useCallback(async () => {
    const dataUrl = exportPNG(3);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'drawing.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My drawing' });
        return;
      }
    } catch (e) {
      // Share cancelled or unsupported — fall through to download.
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'drawing.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [exportPNG]);

  const handleClear = useCallback(() => {
    if (window.confirm('Clear the whole drawing? This cannot be undone.')) {
      clearCanvas();
      setPopover(null);
    }
  }, [clearCanvas]);

  const action = (onClick, icon, label, enabled = true) => (
    <button
      type="button"
      className="tool-btn"
      onClick={onClick}
      disabled={!enabled}
      aria-label={label}
      title={label}
    >
      <span className="material-icons-round">{icon}</span>
    </button>
  );

  return (
    <>
      {popover === 'color' && (
        <div className="popover color-popover" role="dialog" aria-label="Colors">
          {COLORS.map((color) => (
            <button
              type="button"
              key={color}
              className={`swatch${selectedColor === color ? ' swatch--active' : ''}`}
              onClick={() => { setSelectedColor(color); setPopover(null); }}
              aria-label={`${color} brush`}
              title={color}
            >
              <span className="material-icons-round" style={{ color: swatchColor(color) }}>
                water_drop
              </span>
            </button>
          ))}
        </div>
      )}

      {popover === 'size' && (
        <div className="popover size-popover" role="dialog" aria-label="Brush size">
          <span
            className="size-preview"
            style={{ width: baseWidth, height: baseWidth, background: swatchColor(selectedColor) }}
          />
          <input
            className="size-slider"
            type="range"
            min={MIN_BRUSH}
            max={MAX_BRUSH}
            value={baseWidth}
            onChange={(e) => setBaseWidth(Number(e.target.value))}
            onPointerUp={() => setPopover(null)}
            aria-label="Brush size"
          />
        </div>
      )}

      <div id="toolbar" className={`toolbar${hidden ? ' toolbar--hidden' : ''}`}>
        <div className="toolbar-bar">
          {/* Active color — tap to reveal the palette. Keeps the bar uncluttered
              while leaving the current color always visible. */}
          <button
            type="button"
            className={`tool-btn color-btn${popover === 'color' ? ' tool-btn--on' : ''}`}
            onClick={() => toggle('color')}
            aria-label="Color"
            title="Color"
          >
            <span className="material-icons-round" style={{ color: swatchColor(selectedColor) }}>
              water_drop
            </span>
          </button>

          {/* Brush size — the current size shown as a literal dot. */}
          <button
            type="button"
            className={`tool-btn size-btn${popover === 'size' ? ' tool-btn--on' : ''}`}
            onClick={() => toggle('size')}
            aria-label="Brush size"
            title="Brush size"
          >
            <span className="size-dot" style={{ width: dotSize(baseWidth), height: dotSize(baseWidth) }} />
          </button>

          <span className="tool-divider" />

          {action(onUndo, 'undo', 'Undo', canUndo)}
          {action(onRedo, 'redo', 'Redo', canRedo)}
          {action(handleShare, 'ios_share', 'Share or save')}
          {action(handleClear, 'delete_forever', 'Clear drawing')}
        </div>
      </div>
    </>
  );
};

// 'white' would be invisible; render it as a near-white so the droplet (and its
// ring when active) stays visible against the dark pill and white canvas.
function swatchColor(color) {
  return color === 'white' ? '#fafafa' : color;
}

// Clamp the little preview dot so very large brushes still fit in the button.
function dotSize(w) {
  return Math.max(6, Math.min(22, w));
}

export default Toolbar;
