import React, { useState } from 'react';
import { useAITracker } from './AITrackerProvider';
import AIInsightsDashboard from './AIInsightsDashboard';
import './AITrackingButton.css';

const AITrackingButton = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const { getSessionSummary } = useAITracker();

  const handleClick = () => {
    setShowDashboard(true);
  };

  return (
    <>
      <button 
        className="ai-tracking-button"
        onClick={handleClick}
        title="View AI Analytics (Ctrl+Shift+I)"
        aria-label="Open AI behavior analytics dashboard"
      >
        🤖
      </button>
      
      <AIInsightsDashboard 
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </>
  );
};

export default AITrackingButton;