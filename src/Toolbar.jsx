import React, { useCallback, useState, useEffect } from 'react';
import 'material-icons/iconfont/material-icons.css';
import { MIN_BRUSH, MAX_BRUSH } from './brush';
import { savePrompt, loadPrompt, saveRecentColors, loadRecentColors } from './storage';

const COLORS = ['black', 'red', 'yellow', 'blue', 'purple', 'green', 'orange', 'white'];
const NAMED_HEX = {
  black: '#000000', red: '#ff0000', yellow: '#ffff00', blue: '#0000ff',
  purple: '#800080', green: '#008000', orange: '#ffa500', white: '#ffffff',
};

// Quick style scaffolding for the AI prompt: tapping a chip appends a medium or
// look. It helps the artist think through the render — the sketch sets the
// composition, these set the texture and mood the model should fill in.
const STYLES = ['watercolor', 'oil painting', 'ink wash', 'pencil sketch', 'anime', 'photoreal', '3D render', 'pastel'];

const Toolbar = ({
  selectedColor,
  setSelectedColor,
  baseWidth,
  setBaseWidth,
  tool,
  setTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  exportPNG,
  clearCanvas,
  hidden,
}) => {
  // One popover at a time keeps the surface calm: 'color', 'size', 'ai', or null.
  const [popover, setPopover] = useState(null);
  const toggle = (name) => setPopover((p) => (p === name ? null : name));

  // The AI prompt travels with the drawing; load it once and persist on change.
  const [prompt, setPrompt] = useState(() => loadPrompt());
  const [copied, setCopied] = useState(false);
  useEffect(() => { savePrompt(prompt); }, [prompt]);

  // Recently used colors (presets and custom), most-recent first.
  const [recent, setRecent] = useState(() => loadRecentColors());

  // Single path for picking any color: select it, return to the brush, and
  // remember it. Keeps preset, custom, and recent picks consistent.
  const chooseColor = useCallback((color, { close = true } = {}) => {
    setSelectedColor(color);
    setTool('brush');
    setRecent((prev) => {
      const next = [color, ...prev.filter((c) => c !== color)].slice(0, 8);
      saveRecentColors(next);
      return next;
    });
    if (close) setPopover(null);
  }, [setSelectedColor, setTool]);

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

  const addStyle = useCallback((style) => {
    setPrompt((p) => {
      const t = p.trim();
      if (!t) return style;
      if (t.toLowerCase().includes(style.toLowerCase())) return p;
      return `${t.replace(/[,\s]+$/, '')}, ${style}`;
    });
  }, []);

  const copyPrompt = useCallback(async () => {
    if (!prompt.trim()) return;
    try {
      await navigator.clipboard.writeText(prompt.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // Clipboard blocked — the artist can still select the text manually.
    }
  }, [prompt]);

  // The handoff: copy the prompt so it's ready to paste, then share the crisp
  // sketch. Drop the image into any text-to-image / sketch-to-image app and the
  // prompt is already on the clipboard — the sketch becomes direction, not just
  // a picture.
  const handleSendToAI = useCallback(async () => {
    if (prompt.trim()) {
      try { await navigator.clipboard.writeText(prompt.trim()); } catch (e) { /* blocked */ }
    }
    await handleShare();
  }, [prompt, handleShare]);

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
          <div className="swatch-grid">
            {COLORS.map((color) => (
              <button
                type="button"
                key={color}
                className={`swatch${selectedColor === color ? ' swatch--active' : ''}`}
                onClick={() => chooseColor(color)}
                aria-label={`${color} brush`}
                title={color}
              >
                <span className="material-icons-round" style={{ color: swatchColor(color) }}>
                  water_drop
                </span>
              </button>
            ))}
          </div>

          <div className="color-extra">
            {/* Full-spectrum custom color — the 8 presets are a starting palette,
                not a painter's whole range. */}
            <label className="custom-swatch" title="Custom color">
              <input
                type="color"
                value={toHex(selectedColor)}
                onChange={(e) => chooseColor(e.target.value, { close: false })}
                aria-label="Custom color"
              />
            </label>

            {recent.length > 0 && (
              <div className="recent-row" aria-label="Recent colors">
                {recent.map((color, i) => (
                  <button
                    type="button"
                    key={`${color}-${i}`}
                    className={`recent-swatch${selectedColor === color ? ' recent-swatch--active' : ''}`}
                    style={{ background: swatchColor(color) }}
                    onClick={() => chooseColor(color)}
                    aria-label={`Recent color ${color}`}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {popover === 'ai' && (
        <div className="popover ai-popover" role="dialog" aria-label="Send to AI">
          <div className="ai-title">Render with AI</div>
          <textarea
            className="ai-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the finished piece — subject, style, mood, medium…"
            rows={3}
            aria-label="AI prompt"
          />
          <div className="ai-chips">
            {STYLES.map((style) => (
              <button type="button" key={style} className="ai-chip" onClick={() => addStyle(style)}>
                {style}
              </button>
            ))}
          </div>
          <div className="ai-actions">
            <button type="button" className="ai-btn ai-btn--primary" onClick={handleSendToAI}>
              <span className="material-icons-round">ios_share</span>
              Share sketch + prompt
            </button>
            <button type="button" className="ai-btn" onClick={copyPrompt} disabled={!prompt.trim()}>
              {copied ? 'Copied!' : 'Copy prompt'}
            </button>
          </div>
          <div className="ai-hint">Drop the sketch into any text-to-image app — the prompt is on your clipboard, ready to paste.</div>
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

          {/* Eraser — reveal the paper. A toggle, since it shares the same
              size and gestures as the brush. */}
          <button
            type="button"
            className={`tool-btn eraser-btn${tool === 'eraser' ? ' tool-btn--on' : ''}`}
            onClick={() => setTool(tool === 'eraser' ? 'brush' : 'eraser')}
            aria-label="Eraser"
            aria-pressed={tool === 'eraser'}
            title="Eraser"
          >
            <svg className="tool-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-4.95-4.95-4.95 4.95z" />
            </svg>
          </button>

          <span className="tool-divider" />

          {action(onUndo, 'undo', 'Undo', canUndo)}
          {action(onRedo, 'redo', 'Redo', canRedo)}

          {/* Send to AI — pair the sketch with a prompt for a text-to-image model. */}
          <button
            type="button"
            className={`tool-btn ai-trigger${popover === 'ai' ? ' tool-btn--on' : ''}`}
            onClick={() => toggle('ai')}
            aria-label="Render with AI"
            title="Render with AI"
          >
            <span className="material-icons-round">auto_awesome</span>
          </button>

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

// The native color input needs a #rrggbb value; map preset names, pass hex
// through, and fall back to black for anything unexpected.
function toHex(color) {
  if (typeof color === 'string' && color[0] === '#') return color;
  return NAMED_HEX[color] || '#000000';
}

// Clamp the little preview dot so very large brushes still fit in the button.
function dotSize(w) {
  return Math.max(6, Math.min(22, w));
}

export default Toolbar;
