# Drawing Fun 1

A full-screen web drawing app built with React and Vite. Draw with your finger, mouse, or stylus on a canvas that auto-saves your work and exports crisp PNGs.

## Features

- **Expressive brush** — Variable stroke width driven by stylus pressure or drawing speed, with smooth tapering between points.
- **Eraser** — Toggle eraser mode to reveal the white paper beneath existing strokes.
- **Color palette** — Eight preset colors, a custom color picker, and a row of recently used colors (persisted in local storage).
- **Brush size** — Adjust from 2 to 60 px via a slider or keyboard shortcuts.
- **Undo and redo** — Toolbar buttons, keyboard shortcuts, and touch gestures (two-finger tap to undo, three-finger tap to redo).
- **Share or save** — Export a high-resolution PNG via the Web Share API, with a direct download fallback.
- **Auto-save** — Strokes are saved to local storage after each mark, so a refresh or return visit restores your drawing.
- **Keyboard shortcuts** — Full shortcut support with a help modal (`?`) and platform-aware labels (⌘ on macOS, Ctrl elsewhere).
- **Touch-first UI** — The toolbar hides while you draw; popovers close on stroke start; coalesced pointer events keep strokes smooth.

## Getting started

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # production build (output in dist/)
npm run preview  # preview the production build locally
```

Open the dev server URL in a browser. The app fills the viewport — no setup beyond installing dependencies.

## Usage

### Drawing

- **Draw** — Click, tap, or use a stylus on the canvas.
- **Eraser** — Tap the eraser button or press `E` to toggle eraser mode.
- **Color** — Tap the color droplet or press `C` to open the palette. Pick a preset, choose a custom color, or select from recent colors.
- **Brush size** — Tap the size dot to open the slider, or press `[` / `]` to decrease or increase size.
- **Clear** — Tap the trash icon and confirm to erase the entire drawing.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `E` | Toggle eraser |
| `C` | Toggle color palette |
| `[` / `]` | Decrease / increase brush size |
| `⌘/Ctrl + Z` | Undo |
| `⌘/Ctrl + Shift + Z` or `Ctrl + Y` | Redo |
| `⌘/Ctrl + S` | Share or save drawing |
| `?` | Show keyboard shortcuts |
| `Esc` | Close popovers and dialogs |

Press `?` at any time to open the in-app help modal with the full list.

### Touch gestures

| Gesture | Action |
| --- | --- |
| Two-finger tap | Undo |
| Three-finger tap | Redo |

## Technology

- [React](https://react.dev/) 18
- [Vite](https://vite.dev/) 8
- HTML5 Canvas with pointer events (pen pressure, coalesced events)
- [Material Icons](https://fonts.google.com/icons) (round variant)
- Local storage for stroke and color persistence
