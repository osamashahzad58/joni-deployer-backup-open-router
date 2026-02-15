import React, { useState } from 'react';
import { FaTelegram, FaWhatsapp, FaDiscord, FaArrowLeft } from 'react-icons/fa';
import './ChannelSelector.css';

const channels = [
  {
    id: 'telegram',
    name: 'Telegram',
    icon: FaTelegram,
    description: 'Fast and secure messaging',
    color: '#0088cc'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: FaWhatsapp,
    description: 'End-to-end encrypted chat',
    color: '#25D366'
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: FaDiscord,
    description: 'Voice, video, and text',
    color: '#5865F2'
  }
];

function ChannelSelector({ deploymentData, onBack }) {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [currentStep] = useState(3); // Progress at step 3 of 4 (after deployment)

  const handleContinue = () => {
    if (selectedChannel) {
      console.log('Selected channel:', selectedChannel);
      console.log('Deployment data:', deploymentData);
      // Here you would typically:
      // 1. Send channel selection to the backend
      // 2. Configure the channel on the deployed instance
      // 3. Show final confirmation screen
      alert(`Channel selected: ${selectedChannel}\nInstance IP: ${deploymentData?.ip || 'N/A'}`);
    }
  };

  return (
    <div className="channel-selector-overlay">
      <div className="channel-selector-modal">
        {/* Back button */}
        <button className="back-button" onClick={onBack}>
          <FaArrowLeft />
        </button>

        {/* Progress bar */}
        <div className="progress-bar-container">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`progress-step ${step <= currentStep ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Title and subtitle */}
        <div className="modal-header">
          <h1 className="modal-title">Choose Communication Channel</h1>
          <p className="modal-subtitle">Available options</p>
        </div>

        {/* Channel cards */}
        <div className="channels-grid">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const isSelected = selectedChannel === channel.id;
            
            return (
              <div
                key={channel.id}
                className={`channel-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedChannel(channel.id)}
              >
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

export default ChannelSelector;
