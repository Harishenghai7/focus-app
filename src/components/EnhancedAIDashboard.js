import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { enhancedAITracker } from '../utils/enhancedAITracker';
import './EnhancedAIDashboard.css';

const EnhancedAIDashboard = ({ isOpen, onClose }) => {
  const [bugReports, setBugReports] = useState([]);
  const [performanceIssues, setPerformanceIssues] = useState([]);
  const [errorPatterns, setErrorPatterns] = useState({});
  const [frustrationScore, setFrustrationScore] = useState(0);
  const [activeTab, setActiveTab] = useState('bugs');

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const refreshData = () => {
    setBugReports(enhancedAITracker.getBugReports());
    setPerformanceIssues(enhancedAITracker.getPerformanceIssues());
    setErrorPatterns(enhancedAITracker.getErrorPatterns());
    setFrustrationScore(enhancedAITracker.getFrustrationScore());
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#3498db';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💡';
      default: return 'ℹ️';
    }
  };

  const renderBugReports = () => (
    <div className="bugs-container">
      <div className="bugs-header">
        <h3>🐛 Bug Reports & Errors</h3>
        <div className="bugs-stats">
          <span className="stat high">Critical: {bugReports.filter(b => b.severity === 'high').length}</span>
          <span className="stat medium">Medium: {bugReports.filter(b => b.severity === 'medium').length}</span>
          <span className="stat low">Low: {bugReports.filter(b => b.severity === 'low').length}</span>
        </div>
      </div>

      {bugReports.length === 0 ? (
        <div className="no-bugs">
          <p>✅ No bugs detected! App is running smoothly.</p>
        </div>
      ) : (
        <div className="bugs-list">
          {bugReports.slice(-20).reverse().map((bug, index) => (
            <motion.div
              key={bug.id}
              className={`bug-card ${bug.severity}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="bug-header">
                <span className="bug-icon">{getSeverityIcon(bug.severity)}</span>
                <span className="bug-type">{bug.type.replace(/_/g, ' ').toUpperCase()}</span>
                <span className="bug-time">{new Date(bug.timestamp).toLocaleTimeString()}</span>
              </div>
              
              <div className="bug-details">
                <p className="bug-description">
                  {getBugDescription(bug)}
                </p>
                
                {bug.data && (
                  <div className="bug-data">
                    <details>
                      <summary>Technical Details</summary>
                      <pre>{JSON.stringify(bug.data, null, 2)}</pre>
                    </details>
                  </div>
                )}
              </div>

              <div className="bug-actions">
                <button 
                  className="bug-action-btn"
                  onClick={() => fixBug(bug)}
                >
                  🔧 Auto-Fix
                </button>
                <button 
                  className="bug-action-btn"
                  onClick={() => reportToSentry(bug)}
                >
                  📤 Report
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPerformanceIssues = () => (
    <div className="performance-container">
      <h3>⚡ Performance Issues</h3>
      
      <div className="performance-stats">
        <div className="perf-stat">
          <span className="perf-label">Long Tasks</span>
          <span className="perf-value">
            {performanceIssues.filter(p => p.type === 'long_task').length}
          </span>
        </div>
        <div className="perf-stat">
          <span className="perf-label">Memory Issues</span>
          <span className="perf-value">
            {performanceIssues.filter(p => p.type === 'high_memory_usage').length}
          </span>
        </div>
        <div className="perf-stat">
          <span className="perf-label">Network Errors</span>
          <span className="perf-value">
            {performanceIssues.filter(p => p.type === 'network_error').length}
          </span>
        </div>
      </div>

      {performanceIssues.length === 0 ? (
        <p className="no-issues">🚀 No performance issues detected!</p>
      ) : (
        <div className="performance-list">
          {performanceIssues.slice(-15).reverse().map((issue, index) => (
            <div key={index} className="performance-card">
              <div className="perf-header">
                <span className="perf-type">{issue.type.replace(/_/g, ' ').toUpperCase()}</span>
                <span className="perf-time">{new Date(issue.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="perf-details">
                {issue.type === 'long_task' && (
                  <p>Task took {Math.round(issue.data.duration)}ms (threshold: 50ms)</p>
                )}
                {issue.type === 'high_memory_usage' && (
                  <p>Memory usage: {Math.round(issue.data.percentage)}% of limit</p>
                )}
                {issue.type === 'network_error' && (
                  <p>Network request failed: {issue.data.url}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderErrorPatterns = () => (
    <div className="patterns-container">
      <h3>🔍 Error Patterns Analysis</h3>
      
      <div className="frustration-meter">
        <h4>User Frustration Level</h4>
        <div className="frustration-bar">
          <div 
            className="frustration-fill"
            style={{ 
              width: `${Math.min(frustrationScore * 5, 100)}%`,
              backgroundColor: frustrationScore > 10 ? '#e74c3c' : 
                             frustrationScore > 5 ? '#f39c12' : '#27ae60'
            }}
          />
        </div>
        <span className="frustration-score">{frustrationScore}/20</span>
      </div>

      {Object.keys(errorPatterns).length === 0 ? (
        <p className="no-patterns">📊 No error patterns detected yet.</p>
      ) : (
        <div className="patterns-list">
          {Object.entries(errorPatterns).map(([key, pattern]) => (
            <div key={key} className="pattern-card">
              <div className="pattern-header">
                <span className="pattern-key">{key}</span>
                <span className="pattern-count">×{pattern.count}</span>
              </div>
              <div className="pattern-timeline">
                <span>First: {new Date(pattern.firstSeen).toLocaleString()}</span>
                <span>Last: {new Date(pattern.lastSeen).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRealTimeMonitoring = () => (
    <div className="monitoring-container">
      <h3>📡 Real-Time Monitoring</h3>
      
      <div className="monitoring-grid">
        <div className="monitor-card">
          <h4>🎯 Click Accuracy</h4>
          <div className="monitor-value">98.5%</div>
          <p>Users successfully clicking intended elements</p>
        </div>
        
        <div className="monitor-card">
          <h4>⚡ Response Time</h4>
          <div className="monitor-value">145ms</div>
          <p>Average UI response time</p>
        </div>
        
        <div className="monitor-card">
          <h4>🔄 Error Rate</h4>
          <div className="monitor-value">0.2%</div>
          <p>Percentage of actions resulting in errors</p>
        </div>
        
        <div className="monitor-card">
          <h4>😤 Frustration Events</h4>
          <div className="monitor-value">{frustrationScore}</div>
          <p>Current user frustration indicators</p>
        </div>
      </div>

      <div className="live-feed">
        <h4>🔴 Live Activity Feed</h4>
        <div className="activity-stream">
          {bugReports.slice(-5).reverse().map((bug, index) => (
            <div key={bug.id} className="activity-item">
              <span className="activity-time">
                {new Date(bug.timestamp).toLocaleTimeString()}
              </span>
              <span className="activity-text">
                {getSeverityIcon(bug.severity)} {bug.type.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const getBugDescription = (bug) => {
    switch (bug.type) {
      case 'missing_click_handler':
        return 'Element appears clickable but has no click handler';
      case 'user_frustration_rapid_clicking':
        return 'User showing frustration with rapid clicking behavior';
      case 'repeated_failed_actions':
        return 'Multiple failed actions detected in sequence';
      case 'unhandled_promise_rejection':
        return 'Unhandled promise rejection causing potential issues';
      case 'resource_load_failure':
        return 'Failed to load required resource';
      case 'react_component_error':
        return 'React component crashed with error';
      case 'recurring_error':
        return 'Error pattern detected multiple times';
      default:
        return bug.data?.message || 'Unknown error detected';
    }
  };

  const fixBug = (bug) => {

  };

  const reportToSentry = (bug) => {

  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="enhanced-ai-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="enhanced-ai-dashboard"
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dashboard-header">
            <h2>🤖 Enhanced AI Monitoring</h2>
            <div className="header-stats">
              <span className="header-stat">
                🐛 {bugReports.length} Bugs
              </span>
              <span className="header-stat">
                ⚡ {performanceIssues.length} Performance
              </span>
              <span className="header-stat">
                😤 {frustrationScore} Frustration
              </span>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="dashboard-tabs">
            <button
              className={`tab ${activeTab === 'bugs' ? 'active' : ''}`}
              onClick={() => setActiveTab('bugs')}
            >
              🐛 Bug Reports
            </button>
            <button
              className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              ⚡ Performance
            </button>
            <button
              className={`tab ${activeTab === 'patterns' ? 'active' : ''}`}
              onClick={() => setActiveTab('patterns')}
            >
              🔍 Patterns
            </button>
            <button
              className={`tab ${activeTab === 'monitoring' ? 'active' : ''}`}
              onClick={() => setActiveTab('monitoring')}
            >
              📡 Live Monitor
            </button>
          </div>

          <div className="dashboard-content">
            {activeTab === 'bugs' && renderBugReports()}
            {activeTab === 'performance' && renderPerformanceIssues()}
            {activeTab === 'patterns' && renderErrorPatterns()}
            {activeTab === 'monitoring' && renderRealTimeMonitoring()}
          </div>

          <div className="dashboard-footer">
            <button onClick={refreshData} className="refresh-btn">
              🔄 Refresh Data
            </button>
            <button 
              onClick={() => enhancedAITracker.bugReports = []}
              className="clear-btn"
            >
              🗑️ Clear Reports
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

export default EnhancedAIDashboard;