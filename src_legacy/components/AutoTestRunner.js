import React, { useState, useEffect } from 'react';
import autoTester from '../utils/autoTester';
import './AutoTestRunner.css';

const AutoTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkTestStatus = () => {
      setIsRunning(autoTester.isRunning);
      setCurrentTest(autoTester.currentTest || '');
      
      if (autoTester.results.length > 0) {
        setResults(autoTester.results);
        setProgress((autoTester.results.length / autoTester.tests.length) * 100);
      }
    };

    const interval = setInterval(checkTestStatus, 500);
    return () => clearInterval(interval);
  }, []);

  const runTests = async () => {
    setResults(null);
    setProgress(0);
    await autoTester.runAllTests();
    setResults(autoTester.results);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return '#27ae60';
      case 'FAIL': return '#e74c3c';
      default: return '#f39c12';
    }
  };

  return (
    <div className="auto-test-runner">
      <div className="test-header">
        <h3>🤖 Automated App Tester</h3>
        <button 
          onClick={runTests} 
          disabled={isRunning}
          className={`test-btn ${isRunning ? 'running' : ''}`}
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {isRunning && (
        <div className="test-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="current-test">
            Running: {currentTest}
          </p>
        </div>
      )}

      {results && (
        <div className="test-results">
          <div className="results-summary">
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Total</span>
                <span className="stat-value">{results.length}</span>
              </div>
              <div className="stat pass">
                <span className="stat-label">Passed</span>
                <span className="stat-value">
                  {results.filter(r => r.status === 'PASS').length}
                </span>
              </div>
              <div className="stat fail">
                <span className="stat-label">Failed</span>
                <span className="stat-value">
                  {results.filter(r => r.status === 'FAIL').length}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Success Rate</span>
                <span className="stat-value">
                  {((results.filter(r => r.status === 'PASS').length / results.length) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="results-list">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`test-result ${result.status.toLowerCase()}`}
              >
                <div className="result-header">
                  <span className="result-icon">
                    {getStatusIcon(result.status)}
                  </span>
                  <span className="result-name">{result.name}</span>
                  <span className="result-duration">
                    {result.duration}ms
                  </span>
                </div>
                
                {result.status === 'PASS' && result.result && (
                  <div className="result-details success">
                    {result.result}
                  </div>
                )}
                
                {result.status === 'FAIL' && result.error && (
                  <div className="result-details error">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="test-info">
        <h4>Available Tests:</h4>
        <ul className="test-list">
          <li>✅ Page Load Test</li>
          <li>🧭 Navigation Test</li>
          <li>🔐 Auth Page Test</li>
          <li>📝 Form Input Test</li>
          <li>🖱️ Button Click Test</li>
          <li>🎨 Theme Toggle Test</li>
          <li>📱 Responsive Design Test</li>
          <li>⚠️ Error Handling Test</li>
          <li>⚡ Performance Test</li>
          <li>🧠 Memory Leak Test</li>
          <li>♿ Accessibility Test</li>
          <li>🐛 Console Error Test</li>
        </ul>
        
        <div className="test-tips">
          <p><strong>Tip:</strong> Add <code>?autotest=true</code> to URL to run tests automatically on page load.</p>
        </div>
      </div>
    </div>
  );
};

export default AutoTestRunner;