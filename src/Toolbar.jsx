import React, { useCallback } from 'react';
import 'material-icons/iconfont/material-icons.css';

const Toolbar = ({ selectedColor, setSelectedColor, canvasRef, clearCanvas }) => {
  const colors = ['black', 'red', 'yellow', 'blue', 'purple', 'green', 'orange', 'white'];

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const { width, height } = canvas;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempContext = tempCanvas.getContext('2d');
      tempContext.fillStyle = '#ffffff'; // set background color to white
      tempContext.fillRect(0, 0, width, height);
      tempContext.drawImage(canvas, 0, 0);
      const url = tempCanvas.toDataURL();
      const link = document.createElement('a');
      link.href = url;
      link.download = 'drawing.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [canvasRef]);

  return (
    <div id="toolbar" style={{ position: 'fixed', bottom: 10, left: 10, right: 10, height: 50, borderRadius: 25, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      {colors.map((color, index) => (
        <a onClick={() => setSelectedColor(color)} alt="{color}" key={index}><span className="material-icons-round md-34" style={{ color: color, textShadow: selectedColor === color ? '0 0 5px white' : '' }}>water_drop</span></a>
      ))}
      <a onClick={handleDownload} alt="Download drawing"><span className="material-icons-round md-34">download_for_offline</span></a>
      <a onClick={clearCanvas} alt="Clear canvas"><span className="material-icons-round md-34">delete_forever</span></a>
    </div>
  );
};

export default Toolbar;
