import React from 'react';
import DrawingCanvas from './DrawingCanvas';

function App() {
  return (
    <div
      className="App"
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <DrawingCanvas />
    </div>
  );
}

export default App;
