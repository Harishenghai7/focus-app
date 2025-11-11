import React, { useState, useEffect } from 'react';
import { enhancedAITracker } from '../utils/enhancedAITracker';
import EnhancedAIDashboard from './EnhancedAIDashboard';
import './EnhancedAIButton.css';

const EnhancedAIButton = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [bugCount, setBugCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const updateBugCount = () => {
      const bugs = enhancedAITracker.getBugReports();
      const criticalBugs = bugs.filter(b => b.severity === 'high').length;
      setBugCount(bugs.length);
      
      // Blink if there are critical bugs
      setIsBlinking(criticalBugs > 0);
    };

    updateBugCount();
    const interval = setInterval(updateBugCount, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <button 
        className={`enhanced-ai-button ${isBlinking ? 'blinking' : ''}`}
        onClick={() => setShowDashboard(true)}
        title="Enhanced AI Monitor (Ctrl+Shift+E)"
        aria-label="Open enhanced AI monitoring dashboard"
      >
        🔍
        {bugCount > 0 && (
          <span className="bug-badge">{bugCount}</span>
        )}
      </button>
      
      <EnhancedAIDashboard 
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </>
  );
};

export default EnhancedAIButton;