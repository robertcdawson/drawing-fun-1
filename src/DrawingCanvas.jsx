import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGesture } from 'react-use-gesture';
import './App.css';
import Toolbar from './Toolbar';

const DrawingCanvas = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('black');
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const prevCoords = useRef({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasContext = canvas.getContext('2d');
      canvasContext.imageSmoothingEnabled = true;
      canvasContext.strokeStyle = selectedColor;
      setCtx(canvasContext);
    }
  }, [selectedColor]);

  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = selectedColor;
    }
  }, [selectedColor, ctx]);

  const getRelativePosition = useCallback((event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, [canvasRef]);

  const draw = useCallback((x, y) => {
    if (!ctx) return;
    const { x: prevX, y: prevY } = prevCoords.current;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.quadraticCurveTo(prevX, prevY, (x + prevX) / 2, (y + prevY) / 2);
    ctx.stroke();
    prevCoords.current = { x, y };
  }, [ctx]);

  const startDrawing = useCallback((x, y) => {
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    prevCoords.current = { x, y };
  }, [ctx]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const onGesture = useGesture({
    onDragStart: ({ event }) => {
      const { x, y } = getRelativePosition(event);
      if (x <= 45 && y >= window.innerHeight - 45) return;
      startDrawing(x, y);
    },
    onDrag: ({ event }) => {
      if (!isDrawing) return;
      const { x, y } = getRelativePosition(event);
      draw(x, y);
    },
    onDragEnd: stopDrawing,
  });

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  return (
    <>
      <canvas
        {...onGesture()}
        ref={canvasRef}
        style={{ touchAction: 'none', display: 'block' }}
        width={window.innerWidth}
        height={window.innerHeight}
      />
      <Toolbar selectedColor={selectedColor} setSelectedColor={setSelectedColor} canvasRef={canvasRef} clearCanvas={clearCanvas} />
    </>
  );
};

export default DrawingCanvas;
