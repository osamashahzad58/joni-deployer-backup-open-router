import React, { useState, useEffect, useRef } from 'react';
import { FaSpinner } from 'react-icons/fa';
import './DeploymentProgress.css';

const API_BASE = import.meta.env?.VITE_API_BASE ?? 'http://localhost:3100';

function DeploymentProgress({ username, shouldStartDeployment = false, onComplete }) {
  const [deploymentData, setDeploymentData] = useState(null);
  const [openRouterKeys, setOpenRouterKeys] = useState(null);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!username?.trim() || !shouldStartDeployment) {
      if (!username?.trim()) setError('No username provided.');
      else setError('Please start deployment from the beginning.');
      return;
    }

    const sessionId = sessionStorage.getItem('deploymentSessionId');
    if (!sessionId) {
      setError('Invalid session. Please start from the beginning.');
      return;
    }

    const eventSource = new EventSource(
      `${API_BASE}/api/deploy?username=${encodeURIComponent(username)}&sessionId=${encodeURIComponent(sessionId)}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'openrouter-keys' && data.keys) {
        setOpenRouterKeys(data.keys);
      } else if (data.type === 'complete') {
        sessionStorage.removeItem('deploymentSessionId');
        setDeploymentData(data.data);
        eventSource.close();
        setTimeout(() => onComplete(data.data), 1500);
      } else if (data.type === 'error') {
        setError(data.message);
        sessionStorage.removeItem('deploymentSessionId');
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setError('Connection lost. Please check the server.');
      sessionStorage.removeItem('deploymentSessionId');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [username, shouldStartDeployment, onComplete]);

  return (
    <div className="deployment-progress-overlay">
      <div className="deployment-progress-modal">
        <div className="progress-header">
          <h1 className="progress-title">
            {error ? 'Deployment Failed' : deploymentData ? 'Complete' : 'Deploying'}
          </h1>
          <p className="progress-subtitle">
            {error ? 'Something went wrong' : deploymentData ? 'Redirecting...' : 'This may take 10–15 minutes'}
          </p>
        </div>

        {error && (
          <div className="error-box">
            <p>{error}</p>
          </div>
        )}

        {openRouterKeys && (
          <div className="openrouter-keys-box">
            <p className="openrouter-keys-title">🔑 OpenRouter keys (save — not shown again)</p>
            <div className="openrouter-keys-list">
              <div className="openrouter-key-row">
                <span className="openrouter-key-label">Sonnet 4.5:</span>
                <code className="openrouter-key-value">{openRouterKeys.sonnet45Key}</code>
              </div>
              <div className="openrouter-key-row">
                <span className="openrouter-key-label">Gemini 3 Pro:</span>
                <code className="openrouter-key-value">{openRouterKeys.gemini3ProKey}</code>
              </div>
            </div>
          </div>
        )}

        {!error && !deploymentData && (
          <div className="status-message">
            <FaSpinner className="spinning" />
            <span>Deploying...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeploymentProgress;
