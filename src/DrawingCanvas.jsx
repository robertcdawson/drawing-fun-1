import React, { useRef, useState, useEffect, useCallback } from 'react';
import './App.css';
import Toolbar from './Toolbar';
import {
  pointWidth,
  drawLastSegment,
  renderStrokes,
  DEFAULT_BRUSH,
} from './brush';
import { loadStrokes, makeDebouncedSaver, clearStrokes } from './storage';

// Gesture thresholds: a multi-finger "tap" (undo/redo) must be quick and still.
const TAP_MS = 350;
const TAP_MOVE = 14; // logical px

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const logicalSize = useRef({ w: 0, h: 0 });

  // Retained stroke model — the source of truth for redraw, undo, persist, export.
  const strokesRef = useRef(loadStrokes());
  const redoRef = useRef([]);
  const currentStroke = useRef(null);
  const lastPoint = useRef(null); // {x, y, t} for speed-based width

  // Multi-touch bookkeeping for undo/redo gestures.
  const pointers = useRef(new Map());
  const sessionStart = useRef(0);
  const maxPointers = useRef(0);

  const [selectedColor, setSelectedColor] = useState('black');
  const [baseWidth, setBaseWidth] = useState(DEFAULT_BRUSH);
  const [isDrawing, setIsDrawing] = useState(false);
  // Bumped whenever history changes so the toolbar can reflect undo/redo state.
  const [historyVersion, setHistoryVersion] = useState(0);

  const selectedColorRef = useRef(selectedColor);
  const baseWidthRef = useRef(baseWidth);
  useEffect(() => { selectedColorRef.current = selectedColor; }, [selectedColor]);
  useEffect(() => { baseWidthRef.current = baseWidth; }, [baseWidth]);

  const save = useRef(makeDebouncedSaver()).current;
  const bumpHistory = useCallback(() => setHistoryVersion((v) => v + 1), []);

  const redrawAll = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { w, h } = logicalSize.current;
    ctx.clearRect(0, 0, w, h);
    renderStrokes(ctx, strokesRef.current);
  }, []);

  // Size the backing store to the device pixel ratio so lines are crisp, not
  // soft, on high-density phone screens. Redraw the retained strokes after,
  // so a resize / orientation change never blanks or misaligns the work.
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in logical units
    ctx.imageSmoothingEnabled = true;
    ctxRef.current = ctx;
    logicalSize.current = { w, h };
    redrawAll();
  }, [redrawAll]);

  useEffect(() => {
    setupCanvas();
    let raf = null;
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(setupCanvas);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [setupCanvas]);

  const relPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const widthForEvent = (nativeEvent, x, y, t) => {
    const usePressure = nativeEvent.pointerType === 'pen' && nativeEvent.pressure > 0;
    let speed = 0;
    if (lastPoint.current) {
      const dt = Math.max(1, t - lastPoint.current.t);
      const dx = x - lastPoint.current.x;
      const dy = y - lastPoint.current.y;
      speed = Math.hypot(dx, dy) / dt;
    }
    const target = pointWidth(baseWidthRef.current, {
      pressure: nativeEvent.pressure,
      speed,
      usePressure,
    });
    // Smooth the width so it swells and tapers instead of jittering point-to-point.
    const prevW = lastPoint.current ? lastPoint.current.w : target;
    return prevW * 0.5 + target * 0.5;
  };

  // Abort the in-progress single-finger stroke (e.g. a second finger landed for
  // an undo gesture) without committing it; wipe its pixels via a full redraw.
  const abortStroke = useCallback(() => {
    if (currentStroke.current) {
      currentStroke.current = null;
      lastPoint.current = null;
      redrawAll();
    }
  }, [redrawAll]);

  const undo = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    redoRef.current.push(strokesRef.current.pop());
    redrawAll();
    save(strokesRef.current);
    bumpHistory();
  }, [redrawAll, save, bumpHistory]);

  const redo = useCallback(() => {
    if (redoRef.current.length === 0) return;
    strokesRef.current.push(redoRef.current.pop());
    redrawAll();
    save(strokesRef.current);
    bumpHistory();
  }, [redrawAll, save, bumpHistory]);

  const onPointerDown = useCallback((e) => {
    const native = e.nativeEvent;
    const { x, y } = relPos(e);
    try { canvasRef.current.setPointerCapture?.(e.pointerId); } catch (err) { /* pointer already gone */ }

    if (pointers.current.size === 0) {
      sessionStart.current = e.timeStamp;
      maxPointers.current = 0;
    }
    pointers.current.set(e.pointerId, { startX: x, startY: y, x, y });
    maxPointers.current = Math.max(maxPointers.current, pointers.current.size);

    // Second finger => this is a gesture, not a mark: drop the in-progress stroke.
    if (pointers.current.size >= 2) {
      abortStroke();
      setIsDrawing(false);
      return;
    }

    // Single finger: begin a new stroke. (Redo is cleared only once the stroke
    // is committed, so a multi-finger gesture — which starts as one finger —
    // doesn't wipe the redo stack before its undo/redo fires.)
    const t = e.timeStamp;
    lastPoint.current = null;
    const w = widthForEvent(native, x, y, t);
    currentStroke.current = { color: selectedColorRef.current, points: [{ x, y, w }] };
    lastPoint.current = { x, y, t, w };
    setIsDrawing(true);
    // Render the initial dot so a tap is felt immediately.
    drawLastSegment(ctxRef.current, currentStroke.current);
  }, [abortStroke]);

  const onPointerMove = useCallback((e) => {
    const tracked = pointers.current.get(e.pointerId);
    if (tracked) { tracked.x = e.clientX; tracked.y = e.clientY; }
    if (!currentStroke.current || pointers.current.size >= 2) return;

    // Coalesced events give us every sample the OS captured between frames, for
    // smoother, denser strokes than the throttled pointermove alone.
    const events = native_coalesced(e);
    for (const ev of events) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const t = ev.timeStamp || e.timeStamp;
      const w = widthForEvent(ev, x, y, t);
      currentStroke.current.points.push({ x, y, w });
      lastPoint.current = { x, y, t, w };
      drawLastSegment(ctxRef.current, currentStroke.current);
    }
  }, []);

  const endSession = useCallback((e) => {
    // Decide what the just-finished touch session was: a drawn stroke, or a
    // multi-finger tap that means undo / redo.
    const duration = e.timeStamp - sessionStart.current;
    let moved = 0;
    for (const p of pointers.current.values()) {
      moved = Math.max(moved, Math.hypot(p.x - p.startX, p.y - p.startY));
    }
    const isTap = duration < TAP_MS && moved < TAP_MOVE;
    const peak = maxPointers.current;

    if (peak >= 2) {
      if (isTap && peak === 2) undo();
      else if (isTap && peak >= 3) redo();
    } else if (currentStroke.current) {
      // Commit the finished stroke into history and persist. A fresh stroke
      // invalidates any redo history.
      strokesRef.current.push(currentStroke.current);
      redoRef.current = [];
      currentStroke.current = null;
      lastPoint.current = null;
      save(strokesRef.current);
      bumpHistory();
    }
    setIsDrawing(false);
  }, [undo, redo, save, bumpHistory]);

  const onPointerUp = useCallback((e) => {
    try { canvasRef.current.releasePointerCapture?.(e.pointerId); } catch (err) { /* already released */ }
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) endSession(e);
  }, [endSession]);

  const clearCanvas = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current = [];
    redoRef.current = [];
    currentStroke.current = null;
    clearStrokes();
    redrawAll();
    bumpHistory();
  }, [redrawAll, bumpHistory]);

  // Render the current drawing to a PNG data URL at higher resolution. Vectors
  // re-render losslessly, so handoff (to a person or a text-to-image model) and
  // refine-later both get a crisp image, not a blurry screen capture.
  const exportPNG = useCallback((scale = 3) => {
    const { w, h } = logicalSize.current;
    const out = document.createElement('canvas');
    out.width = Math.round(w * scale);
    out.height = Math.round(h * scale);
    const octx = out.getContext('2d');
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, out.width, out.height);
    octx.lineCap = 'round';
    octx.lineJoin = 'round';
    renderStrokes(octx, strokesRef.current, scale);
    return out.toDataURL('image/png');
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        style={{ touchAction: 'none', display: 'block' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <Toolbar
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        baseWidth={baseWidth}
        setBaseWidth={setBaseWidth}
        onUndo={undo}
        onRedo={redo}
        canUndo={strokesRef.current.length > 0}
        canRedo={redoRef.current.length > 0}
        exportPNG={exportPNG}
        clearCanvas={clearCanvas}
        hidden={isDrawing}
      />
    </>
  );
};

// Native coalesced pointer samples, with a graceful fallback.
function native_coalesced(e) {
  const native = e.nativeEvent;
  if (native && typeof native.getCoalescedEvents === 'function') {
    const list = native.getCoalescedEvents();
    if (list && list.length) return list;
  }
  return [native || e];
}

export default DrawingCanvas;
