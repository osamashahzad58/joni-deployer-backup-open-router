import React from 'react';
import { FaCheckCircle, FaRocket } from 'react-icons/fa';
import './ChannelSuccess.css';

function ChannelSuccess({ channelName, deploymentData }) {
  const handleStartChatting = () => {
    // Redirect to JONI gateway or show connection details
    window.open(`http://${deploymentData.ip}:18890`, '_blank');
  };

  return (
    <div className="channel-success-overlay">
      <div className="channel-success-modal">
        {/* Progress bar - all complete! */}
        <div className="progress-bar-container">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="progress-step active" />
          ))}
        </div>

        {/* Success animation */}
        <div className="success-animation">
          <div className="success-circle">
            <FaCheckCircle className="success-icon" />
          </div>
          <div className="success-particles">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`particle particle-${i + 1}`} />
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="modal-header">
          <h1 className="modal-title">Connected Successfully!</h1>
          <p className="modal-subtitle">
            Your JONI is ready on {channelName}
          </p>
        </div>

        {/* Connection details */}
        <div className="connection-details">
          <div className="detail-item">
            <div className="detail-label">Instance IP</div>
            <div className="detail-value">{deploymentData.ip || 'N/A'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Channel</div>
            <div className="detail-value">{channelName}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Status</div>
            <div className="detail-value status-active">
              <span className="status-dot"></span>
              Active
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="next-steps">
          <h3 className="next-steps-title">What's Next?</h3>
          <ul className="next-steps-list">
            <li>Open your {channelName} app</li>
            <li>Start a conversation with your bot</li>
            <li>Try asking JONI anything!</li>
          </ul>
        </div>

        {/* Action button */}
        <button className="start-button" onClick={handleStartChatting}>
          <FaRocket />
          <span>Start Chatting</span>
        </button>
      </div>
    </div>
  );
}

export default ChannelSuccess;
