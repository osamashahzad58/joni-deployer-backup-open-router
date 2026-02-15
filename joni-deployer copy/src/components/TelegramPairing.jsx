import React, { useState, useEffect } from 'react';
import { FaTelegram, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import './TelegramPairing.css';

const API_URL = 'http://localhost:3100';

function TelegramPairing({ deploymentData, onComplete, onBack }) {
  const [pairingCode, setPairingCode] = useState('');
  const [displayCode, setDisplayCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingCode, setFetchingCode] = useState(true);

  useEffect(() => {
    fetchPairingCode();
  }, []);

  const fetchPairingCode = async () => {
    setFetchingCode(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_URL}/api/instance/channels/telegram/pairing-code`,
        {
          params: {
            instanceIp: deploymentData.ip,
            authToken: deploymentData.token
          }
        }
      );

      if (response.data.code) {
        setDisplayCode(response.data.code);
      } else {
        setError('Failed to generate pairing code');
      }
    } catch (err) {
      console.error('Failed to fetch pairing code:', err);
      setError('Failed to fetch pairing code. Please try again.');
    } finally {
      setFetchingCode(false);
    }
  };

  const handleVerify = async () => {
    if (!pairingCode.trim()) {
      setError('Please enter the pairing code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/api/instance/channels/telegram/verify`,
        {
          instanceIp: deploymentData.ip,
          authToken: deploymentData.token,
          pairingCode: pairingCode.trim()
        }
      );

      if (response.data.verified) {
        onComplete();
      } else {
        setError('Invalid pairing code. Please try again.');
      }
    } catch (err) {
      console.error('Failed to verify pairing:', err);
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="telegram-pairing-overlay">
      <div className="telegram-pairing-modal">
        {/* Progress bar */}
        <div className="progress-bar-container">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`progress-step ${step <= 3 ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Header */}
        <div className="modal-header">
          <div className="telegram-icon-large">
            <FaTelegram />
          </div>
          <h1 className="modal-title">Verify Your Bot</h1>
          <p className="modal-subtitle">Complete the pairing process</p>
        </div>

        {/* Instructions */}
        <div className="instructions-box">
          <div className="instruction-step">
            <div className="step-number">1</div>
            <div className="step-text">Open your Telegram bot</div>
          </div>
          <div className="instruction-step">
            <div className="step-number">2</div>
            <div className="step-text">Tap <strong>Start</strong></div>
          </div>
          <div className="instruction-step">
            <div className="step-number">3</div>
            <div className="step-text">Copy the pairing code shown in the bot</div>
          </div>
        </div>

        {/* Expected code display (for demo) */}
        {displayCode && (
          <div className="expected-code-box">
            <div className="expected-code-label">Expected Pairing Code:</div>
            <div className="expected-code">{displayCode}</div>
            <div className="expected-code-hint">
              (This is what your bot will show you)
            </div>
          </div>
        )}

        {fetchingCode && (
          <div className="fetching-code">
            <span className="loading-spinner"></span>
            <span>Generating pairing code...</span>
          </div>
        )}

        {/* Pairing code input */}
        <div className="pairing-input-section">
          <label className="input-label">
            Enter Pairing Code from Bot
          </label>
          <input
            type="text"
            className="pairing-input"
            placeholder="Enter code..."
            value={pairingCode}
            onChange={(e) => {
              setPairingCode(e.target.value);
              setError('');
            }}
            disabled={loading || fetchingCode}
          />
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="button-group">
          <button
            className="back-button-text"
            onClick={onBack}
            disabled={loading}
          >
            Back
          </button>
          <button
            className="verify-button"
            onClick={handleVerify}
            disabled={loading || fetchingCode || !pairingCode.trim()}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <span>Verify & Activate</span>
                <FaCheckCircle />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TelegramPairing;
