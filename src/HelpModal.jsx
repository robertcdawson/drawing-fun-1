import React, { useEffect, useRef } from 'react';
import { formatKey } from './keyboard';

// Each shortcut lists one or more `combos`. Keys within a combo are pressed
// together (joined with "+"); separate combos are alternatives (joined with
// "or"), so the modal never implies a chord that isn't real.
const SHORTCUTS = [
  { combos: [['E']], description: 'Toggle eraser' },
  { combos: [['C']], description: 'Toggle color palette' },
  { combos: [['[']], description: 'Decrease brush size' },
  { combos: [[']']], description: 'Increase brush size' },
  { combos: [['mod', 'Z']], description: 'Undo' },
  { combos: [['mod', 'Shift', 'Z'], ['Ctrl', 'Y']], description: 'Redo' },
  { combos: [['mod', 'S']], description: 'Share or save drawing' },
  { combos: [['?']], description: 'Show keyboard shortcuts' },
  { combos: [['Esc']], description: 'Close popovers and dialogs' },
];

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
          {SHORTCUTS.map(({ combos, description }) => (
            <li key={description} className="shortcut-row">
              <span className="shortcut-keys">
                {combos.map((combo, comboIndex) => (
                  <React.Fragment key={`${description}-combo-${comboIndex}`}>
                    {comboIndex > 0 && <span className="shortcut-or">or</span>}
                    {combo.map((key, keyIndex) => (
                      <React.Fragment key={`${description}-${comboIndex}-${key}-${keyIndex}`}>
                        {keyIndex > 0 && <span className="shortcut-sep">+</span>}
                        <kbd className="shortcut-kbd">{formatKey(key)}</kbd>
                      </React.Fragment>
                    ))}
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
