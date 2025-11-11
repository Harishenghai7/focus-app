import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './KeyboardShortcutsHelp.css';

const shortcuts = [
  { key: 'Alt + H', description: 'Go to Home' },
  { key: 'Alt + E', description: 'Go to Explore' },
  { key: 'Alt + C', description: 'Create Post' },
  { key: 'Alt + B', description: 'Go to Boltz' },
  { key: 'Alt + P', description: 'Go to Profile' },
  { key: 'Alt + M', description: 'Go to Messages' },
  { key: 'Alt + N', description: 'Go to Notifications' },
  { key: 'Alt + S', description: 'Go to Settings' },
  { key: '/', description: 'Focus Search' },
  { key: 'Esc', description: 'Close Modal/Go Back' },
  { key: '?', description: 'Show Keyboard Shortcuts' },
];

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Show shortcuts help with '?' key
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="shortcuts-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <motion.div
            className="keyboard-shortcuts-modal"
            role="dialog"
            aria-labelledby="shortcuts-title"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="shortcuts-header">
              <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
              <button
                className="shortcuts-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close keyboard shortcuts"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="shortcuts-content">
              <ul className="shortcuts-list" role="list">
                {shortcuts.map((shortcut, index) => (
                  <motion.li
                    key={index}
                    className="shortcut-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <kbd className="shortcut-key">{shortcut.key}</kbd>
                    <span className="shortcut-description">{shortcut.description}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="shortcuts-footer">
              <p className="shortcuts-hint">
                Press <kbd>?</kbd> to toggle this help
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
