import React, { useState } from 'react';
import { FaTelegram, FaWhatsapp, FaDiscord, FaStar } from 'react-icons/fa';
import './ChannelSelection.css';

const channels = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: FaWhatsapp,
    description: 'Scan QR code to connect',
    color: '#25D366',
    recommended: true
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: FaTelegram,
    description: 'Create bot with BotFather',
    color: '#0088cc'
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: FaDiscord,
    description: 'Configure Discord bot',
    color: '#5865F2'
  }
];

function ChannelSelection({ deploymentData, onChannelSelected }) {
  const [selectedChannel, setSelectedChannel] = useState(null);

  const handleContinue = () => {
    if (selectedChannel) {
      onChannelSelected(selectedChannel);
    }
  };

  return (
    <div className="channel-selection-overlay">
      <div className="channel-selection-modal">
        {/* Progress bar */}
        <div className="progress-bar-container">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`progress-step ${step <= 3 ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Title */}
        <div className="modal-header">
          <h1 className="modal-title">Choose Your Channel</h1>
          <p className="modal-subtitle">Select how you want to communicate with JONI</p>
        </div>

        {/* Channel cards */}
        <div className="channels-grid">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const isSelected = selectedChannel === channel.id;
            
            return (
              <div
                key={channel.id}
                className={`channel-card ${isSelected ? 'selected' : ''} ${channel.recommended ? 'recommended' : ''}`}
                onClick={() => setSelectedChannel(channel.id)}
              >
                {channel.recommended && (
                  <div className="recommended-badge">
                    <FaStar className="star-icon" />
                    <span>RECOMMENDED</span>
                  </div>
                )}
                
                <div className="channel-icon-wrapper" style={{ '--channel-color': channel.color }}>
                  <Icon className="channel-icon" />
                </div>
                
                <h3 className="channel-name">{channel.name}</h3>
                <p className="channel-description">{channel.description}</p>
              </div>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          className="continue-button"
          onClick={handleContinue}
          disabled={!selectedChannel}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default ChannelSelection;
