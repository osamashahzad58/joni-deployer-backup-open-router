import React, { useState } from 'react';
import { FaTelegram, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import './TelegramSetup.css';

const API_URL = 'http://localhost:3100';

const steps = [
  { number: 1, text: 'Open Telegram' },
  { number: 2, text: 'Search for @BotFather' },
  { number: 3, text: 'Tap Start' },
  { number: 4, text: 'Type /newbot' },
  { number: 5, text: 'Choose bot name and username' },
  { number: 6, text: 'Copy the Access Token' }
];

function TelegramSetup({ deploymentData, onNext, onBack }) {
  const [botToken, setBotToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    if (!botToken.trim()) {
      setError('Please enter your bot token');
      return;
    }

    // Validate token format
    if (!botToken.includes(':') || botToken.length < 20) {
      setError('Invalid token format. Token should look like: 123456:ABC-DEF1234...');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/instance/channels/telegram/configure`, {
        instanceIp: deploymentData.ip,
        authToken: deploymentData.token,
        botToken: botToken.trim()
      });

      if (response.data.success) {
        onNext(botToken.trim());
      } else {
        setError('Failed to configure Telegram bot');
      }
    } catch (err) {
      console.error('Failed to configure Telegram:', err);
      setError(err.response?.data?.message || 'Failed to configure Telegram. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="telegram-setup-overlay">
      <div className="telegram-setup-modal">
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
          <h1 className="modal-title">Setup Telegram Bot</h1>
          <p className="modal-subtitle">Follow these steps to create your bot</p>
        </div>

        {/* Steps */}
        <div className="steps-container">
          {steps.map((step) => (
            <div key={step.number} className="step-item">
              <div className="step-number">{step.number}</div>
              <div className="step-text">{step.text}</div>
            </div>
          ))}
        </div>

        {/* Token input */}
        <div className="token-input-section">
          <label className="input-label">
            Paste Your Bot Token
          </label>
          <input
            type="text"
            className="token-input"
            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            value={botToken}
            onChange={(e) => {
              setBotToken(e.target.value);
              setError('');
            }}
            disabled={loading}
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
            className="next-button"
            onClick={handleNext}
            disabled={loading || !botToken.trim()}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <span>Next</span>
                <FaCheckCircle />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TelegramSetup;
