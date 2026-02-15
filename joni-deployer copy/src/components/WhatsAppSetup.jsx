import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import './WhatsAppSetup.css';

const API_URL = 'http://localhost:3100';

function WhatsAppSetup({ deploymentData, onComplete, onBack }) {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQRCode();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQRCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_URL}/api/instance/channels/whatsapp/qr`,
        {
          params: {
            instanceIp: deploymentData.ip,
            authToken: deploymentData.token
          }
        }
      );

      if (response.data.qrCode) {
        setQrCode(response.data.qrCode);
      } else {
        setError('Failed to generate QR code');
      }
    } catch (err) {
      console.error('Failed to fetch QR code:', err);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/instance/channels/whatsapp/status`,
        {
          params: {
            instanceIp: deploymentData.ip,
            authToken: deploymentData.token
          }
        }
      );

      if (response.data.connected) {
        setConnected(true);
      }
    } catch (err) {
      console.error('Failed to check connection:', err);
    }
  };

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div className="whatsapp-setup-overlay">
      <div className="whatsapp-setup-modal">
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
          <div className="whatsapp-icon-large">
            <FaWhatsapp />
          </div>
          <h1 className="modal-title">Connect with WhatsApp</h1>
          <p className="modal-subtitle">Scan this QR code to connect</p>
        </div>

        {/* Instructions */}
        <div className="instructions-box">
          <div className="instruction-step">
            <div className="step-number">1</div>
            <div className="step-text">Open WhatsApp on your phone</div>
          </div>
          <div className="instruction-step">
            <div className="step-number">2</div>
            <div className="step-text">Tap Menu or Settings → Linked Devices</div>
          </div>
          <div className="instruction-step">
            <div className="step-number">3</div>
            <div className="step-text">Tap <strong>Link a Device</strong></div>
          </div>
          <div className="instruction-step">
            <div className="step-number">4</div>
            <div className="step-text">Point your phone at this QR code</div>
          </div>
        </div>

        {/* QR Code display */}
        <div className="qr-code-container">
          {loading ? (
            <div className="qr-loading">
              <span className="loading-spinner"></span>
              <span>Generating QR code...</span>
            </div>
          ) : error ? (
            <div className="qr-error">
              <div className="error-icon">⚠️</div>
              <div className="error-text">{error}</div>
              <button className="retry-button" onClick={fetchQRCode}>
                Retry
              </button>
            </div>
          ) : (
            <>
              <img src={qrCode} alt="WhatsApp QR Code" className="qr-code-image" />
              {connected && (
                <div className="connected-overlay">
                  <FaCheckCircle className="check-icon" />
                  <div className="connected-text">Connected!</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status indicator */}
        {!loading && !error && (
          <div className={`status-indicator ${connected ? 'connected' : 'waiting'}`}>
            <div className="status-dot"></div>
            <div className="status-text">
              {connected ? 'Successfully connected!' : 'Waiting for scan...'}
            </div>
          </div>
        )}

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
            className="continue-button"
            onClick={handleContinue}
            disabled={!connected}
          >
            Continue
            <FaCheckCircle />
          </button>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppSetup;
