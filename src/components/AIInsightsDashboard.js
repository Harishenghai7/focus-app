import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAITracker } from './AITrackerProvider';
import './AIInsightsDashboard.css';

const AIInsightsDashboard = ({ isOpen, onClose }) => {
  const { getInsights, getHeatmapData, getSessionSummary } = useAITracker();
  const [insights, setInsights] = useState([]);
  const [heatmapData, setHeatmapData] = useState({});
  const [sessionSummary, setSessionSummary] = useState({});
  const [activeTab, setActiveTab] = useState('insights');

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const refreshData = () => {
    setInsights(getInsights());
    setHeatmapData(getHeatmapData());
    setSessionSummary(getSessionSummary());
  };

  const renderInsights = () => (
    <div className="insights-container">
      <h3>🤖 AI-Generated Insights</h3>
      {insights.length === 0 ? (
        <p className="no-insights">Collecting data... Insights will appear shortly.</p>
      ) : (
        <div className="insights-list">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              className={`insight-card ${insight.priority}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="insight-header">
                <span className={`insight-type ${insight.type}`}>
                  {insight.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`insight-priority ${insight.priority}`}>
                  {insight.priority.toUpperCase()}
                </span>
              </div>
              <p className="insight-message">{insight.message}</p>
              {insight.actionable && (
                <button className="insight-action">Take Action</button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHeatmap = () => (
    <div className="heatmap-container">
      <h3>🔥 User Interaction Heatmap</h3>
      <div className="heatmap-stats">
        <div className="stat">
          <span className="stat-label">Hotspots</span>
          <span className="stat-value">{Object.keys(heatmapData).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total Clicks</span>
          <span className="stat-value">
            {Object.values(heatmapData).reduce((sum, data) => sum + (data.clicks || 0), 0)}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Hover Points</span>
          <span className="stat-value">
            {Object.values(heatmapData).reduce((sum, data) => sum + (data.hovers || 0), 0)}
          </span>
        </div>
      </div>
      <div className="heatmap-visualization">
        {Object.entries(heatmapData).map(([key, data]) => {
          const [x, y] = key.split('_').map(n => parseInt(n) * 10);
          const intensity = Math.min((data.clicks + data.hovers * 0.5) / 10, 1);
          
          return (
            <div
              key={key}
              className="heatmap-point"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                opacity: intensity,
                backgroundColor: `rgba(255, ${255 - intensity * 200}, 0, ${intensity})`
              }}
              title={`Clicks: ${data.clicks}, Hovers: ${data.hovers}`}
            />
          );
        })}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-container">
      <h3>📊 Session Analytics</h3>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Session Overview</h4>
          <div className="analytics-stats">
            <div className="stat">
              <span className="stat-label">Session ID</span>
              <span className="stat-value">{sessionSummary.sessionId?.slice(-8)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Events Tracked</span>
              <span className="stat-value">{sessionSummary.eventCount || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Heatmap Points</span>
              <span className="stat-value">{sessionSummary.heatmapPoints || 0}</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Behavior Patterns</h4>
          <div className="patterns-list">
            {sessionSummary.patterns && Object.entries(sessionSummary.patterns).map(([key, pattern]) => (
              <div key={key} className="pattern-item">
                <span className="pattern-name">{key.toUpperCase()}</span>
                <span className="pattern-value">
                  {typeof pattern === 'object' ? JSON.stringify(pattern).slice(0, 50) + '...' : pattern}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h4>AI Insights Summary</h4>
          <div className="insights-summary">
            <div className="insight-count high">
              High Priority: {insights.filter(i => i.priority === 'high').length}
            </div>
            <div className="insight-count medium">
              Medium Priority: {insights.filter(i => i.priority === 'medium').length}
            </div>
            <div className="insight-count low">
              Low Priority: {insights.filter(i => i.priority === 'low').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="ai-insights-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="ai-insights-dashboard"
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dashboard-header">
            <h2>🤖 AI Behavior Analytics</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="dashboard-tabs">
            <button
              className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              🧠 Insights
            </button>
            <button
              className={`tab ${activeTab === 'heatmap' ? 'active' : ''}`}
              onClick={() => setActiveTab('heatmap')}
            >
              🔥 Heatmap
            </button>
            <button
              className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Analytics
            </button>
          </div>

          <div className="dashboard-content">
            {activeTab === 'insights' && renderInsights()}
            {activeTab === 'heatmap' && renderHeatmap()}
            {activeTab === 'analytics' && renderAnalytics()}
          </div>

          <div className="dashboard-footer">
            <button onClick={refreshData} className="refresh-btn">
              🔄 Refresh Data
            </button>
            <span className="last-updated">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIInsightsDashboard;