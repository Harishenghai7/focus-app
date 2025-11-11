import React, { useState } from 'react';
import AutoTestRunner from './AutoTestRunner';
import './TestButton.css';

const TestButton = () => {
  const [showTester, setShowTester] = useState(false);

  return (
    <>
      <button 
        className="test-button"
        onClick={() => setShowTester(true)}
        title="Open Automated Tester (Ctrl+Shift+T)"
        aria-label="Open automated app tester"
      >
        🧪
      </button>
      
      {showTester && (
        <div className="test-modal-overlay" onClick={() => setShowTester(false)}>
          <div className="test-modal" onClick={(e) => e.stopPropagation()}>
            <div className="test-modal-header">
              <h2>🤖 Automated App Tester</h2>
              <button 
                className="test-close-btn" 
                onClick={() => setShowTester(false)}
              >
                ×
              </button>
            </div>
            <AutoTestRunner />
          </div>
        </div>
      )}
    </>
  );
};

export default TestButton;