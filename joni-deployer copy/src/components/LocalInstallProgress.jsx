import React, { useState, useEffect, useRef } from 'react';
import { FaLaptop, FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './DeploymentProgress.css';

const API_BASE = import.meta.env?.VITE_API_BASE ?? 'http://localhost:3100';

function LocalInstallProgress({ sessionId, onComplete }) {
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [openRouterKeys, setOpenRouterKeys] = useState(null);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('🐙 Preparing local install...');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const eventSourceRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session. Please start from the beginning.');
      return;
    }

    const eventSource = new EventSource(
      `${API_BASE}/api/install-local?sessionId=${encodeURIComponent(sessionId)}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'log') {
        setLogs(prev => [...prev, data.message]);
        setStatusMessage(data.message.slice(0, 80) + (data.message.length > 80 ? '...' : ''));
      } else if (data.type === 'openrouter-keys' && data.keys) {
        setOpenRouterKeys(data.keys);
      } else if (data.type === 'complete') {
        setIsCompleted(true);
        setStatusMessage('🎉 JONI installed locally!');
        clearInterval(timerRef.current);
        setTimeout(() => onComplete(), 2000);
      } else if (data.type === 'error') {
        setError(data.message);
        clearInterval(timerRef.current);
      }
    };

    eventSource.onerror = () => {
      setError('Connection lost. Please check the backend server.');
      clearInterval(timerRef.current);
    };

    timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);

    return () => {
      eventSource.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, onComplete]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="deployment-progress-overlay">
      <div className="deployment-progress-modal">
        <div className="progress-header">
          <h1 className="progress-title">
            {error ? 'Local install failed' : isCompleted ? 'Install complete' : 'Installing JONI locally'}
          </h1>
          <p className="progress-subtitle">
            {error ? 'Something went wrong' : isCompleted ? 'JONI is ready on this machine' : 'Creating API keys and running install script from joni-fix'}
          </p>
          <div className="progress-timer">{formatTime(elapsedTime)}</div>
        </div>
        {error && (
          <div className="error-box">
            <p>{error}</p>
          </div>
        )}
        {openRouterKeys && (
          <div className="openrouter-keys-box">
            <p className="openrouter-keys-title">🔑 OpenRouter API keys (שמור — לא יוצג שוב)</p>
            <p className="openrouter-keys-warn">Save these; they will not be shown again.</p>
            <div className="openrouter-keys-list">
              <div className="openrouter-key-row">
                <span className="openrouter-key-label">Sonnet 4.5:</span>
                <code className="openrouter-key-value">{openRouterKeys.sonnet45Key}</code>
              </div>
              <div className="openrouter-key-row">
                <span className="openrouter-key-label">Gemini 3 Pro (image preview):</span>
                <code className="openrouter-key-value">{openRouterKeys.gemini3ProKey}</code>
              </div>
            </div>
          </div>
        )}
        {!error && (
          <div className="status-message">
            <div className="status-icon">
              <FaLaptop className="spinning" style={{ animation: 'none' }} />
            </div>
            <div className="status-text">{statusMessage}</div>
          </div>
        )}
        <div className="logs-section">
          <button
            type="button"
            className="logs-toggle"
            onClick={() => setShowLogs(!showLogs)}
          >
            {showLogs ? <FaChevronUp /> : <FaChevronDown />}
            <span>Logs ({logs.length})</span>
          </button>
          {showLogs && (
            <div className="logs-container">
              <div className="logs-content">
                {logs.length === 0 && !error ? (
                  <p className="logs-empty">Waiting for output...</p>
                ) : (
                  logs.map((line, i) => (
                    <div key={i} className="log-line">
                      <span className="log-message">{line}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocalInstallProgress;
