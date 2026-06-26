import React, { useEffect, useRef } from 'react';

const SHORTCUTS = [
  { keys: ['B'], description: 'Select brush' },
  { keys: ['E'], description: 'Select eraser' },
  { keys: ['C'], description: 'Toggle color palette' },
  { keys: ['[', ']'], description: 'Decrease / increase brush size' },
  { keys: ['mod', 'Z'], description: 'Undo' },
  { keys: ['mod', 'Shift', 'Z'], description: 'Redo' },
  { keys: ['Ctrl', 'Y'], description: 'Redo (Windows)' },
  { keys: ['mod', 'S'], description: 'Share or save drawing' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close popovers and dialogs' },
];

function isApplePlatform() {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    || (navigator.userAgentData?.platform === 'macOS');
}

function formatKey(key) {
  if (key === 'mod') return isApplePlatform() ? '⌘' : 'Ctrl';
  if (key === 'Shift') return 'Shift';
  if (key === 'Esc') return 'Esc';
  return key;
}

const HelpModal = ({ open, onClose }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="help-modal-title" className="modal-title">Keyboard shortcuts</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <ul className="shortcut-list">
          {SHORTCUTS.map(({ keys, description }) => (
            <li key={description} className="shortcut-row">
              <span className="shortcut-keys">
                {keys.map((key, index) => (
                  <React.Fragment key={`${description}-${key}-${index}`}>
                    {index > 0 && <span className="shortcut-sep">+</span>}
                    <kbd className="shortcut-kbd">{formatKey(key)}</kbd>
                  </React.Fragment>
                ))}
              </span>
              <span className="shortcut-desc">{description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HelpModal;
