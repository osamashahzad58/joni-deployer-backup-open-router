import React, { useState } from 'react';
import Landing from './components/Landing';
import NameCollection from './components/NameCollection';
import DeploymentProgress from './components/DeploymentProgress';
import LocalInstallProgress from './components/LocalInstallProgress';
import LocalInstallSuccess from './components/LocalInstallSuccess';
import ChannelSelection from './components/ChannelSelection';
import TelegramSetup from './components/TelegramSetup';
import TelegramPairing from './components/TelegramPairing';
import WhatsAppSetup from './components/WhatsAppSetup';
import ChannelSuccess from './components/ChannelSuccess';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('name-collection');
  const [username, setUsername] = useState('');
  const [deploymentData, setDeploymentData] = useState(null);
  const [shouldStartDeployment, setShouldStartDeployment] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [localInstallSessionId, setLocalInstallSessionId] = useState(null);

  const handleNameContinue = (sanitizedUsername) => {
    setUsername(sanitizedUsername);
    setCurrentScreen('landing');
  };

  const handleNameClose = () => {
    setCurrentScreen('name-collection');
    setUsername('');
  };

  const handleCreateAccount = () => {
    setShouldStartDeployment(true);
    
    const deploymentSessionId = `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('deploymentSessionId', deploymentSessionId);
    
    setCurrentScreen('deploying');
  };

  const handleInstallLocally = () => {
    const sessionId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setLocalInstallSessionId(sessionId);
    setCurrentScreen('local-installing');
  };

  const handleLocalInstallComplete = () => {
    setCurrentScreen('local-success');
  };

  const handleDeploymentComplete = (data) => {
    console.log('Deployment complete, data:', data);
    setDeploymentData(data || {});
    setCurrentScreen('channel-selection');
  };

  const handleChannelSelected = (channelId) => {
    console.log('Channel selected:', channelId);
    setSelectedChannel(channelId);
    
    if (channelId === 'telegram') {
      setCurrentScreen('telegram-setup');
    } else if (channelId === 'whatsapp') {
      setCurrentScreen('whatsapp-setup');
    } else if (channelId === 'discord') {
      setCurrentScreen('discord-setup');
    }
  };

  const handleTelegramConfigured = () => {
    setCurrentScreen('telegram-pairing');
  };

  const handleTelegramComplete = () => {
    setCurrentScreen('success');
  };

  const handleWhatsAppComplete = () => {
    setCurrentScreen('success');
  };

  const handleBackToChannelSelection = () => {
    setSelectedChannel(null);
    setCurrentScreen('channel-selection');
  };

  const getChannelName = () => {
    if (selectedChannel === 'telegram') return 'Telegram';
    if (selectedChannel === 'whatsapp') return 'WhatsApp';
    if (selectedChannel === 'discord') return 'Discord';
    return 'Channel';
  };

  return (
    <div className="app">
      <div className="app-background">
        <div className="octopus-left"></div>
        <div className="octopus-right"></div>
        <div className="bubbles">
          <div className="bubble bubble-1"></div>
          <div className="bubble bubble-2"></div>
          <div className="bubble bubble-3"></div>
          <div className="bubble bubble-4"></div>
          <div className="bubble bubble-5"></div>
        </div>
      </div>
      
      {/* Screen routing */}
      {currentScreen === 'name-collection' && (
        <NameCollection 
          onContinue={handleNameContinue}
          onClose={handleNameClose}
        />
      )}
      
      {currentScreen === 'landing' && (
        <Landing onCreateAccount={handleCreateAccount} onInstallLocally={handleInstallLocally} />
      )}

      {currentScreen === 'local-installing' && (
        <LocalInstallProgress
          sessionId={localInstallSessionId}
          onComplete={handleLocalInstallComplete}
        />
      )}

      {currentScreen === 'local-success' && (
        <LocalInstallSuccess onBack={() => setCurrentScreen('landing')} />
      )}
      
      {currentScreen === 'deploying' && (
        <DeploymentProgress 
          username={username}
          shouldStartDeployment={shouldStartDeployment}
          onComplete={handleDeploymentComplete} 
        />
      )}
      
      {currentScreen === 'channel-selection' && (
        <ChannelSelection 
          deploymentData={deploymentData}
          onChannelSelected={handleChannelSelected}
        />
      )}

      {currentScreen === 'telegram-setup' && (
        <TelegramSetup 
          deploymentData={deploymentData}
          onNext={handleTelegramConfigured}
          onBack={handleBackToChannelSelection}
        />
      )}

      {currentScreen === 'telegram-pairing' && (
        <TelegramPairing 
          deploymentData={deploymentData}
          onComplete={handleTelegramComplete}
          onBack={() => setCurrentScreen('telegram-setup')}
        />
      )}

      {currentScreen === 'whatsapp-setup' && (
        <WhatsAppSetup 
          deploymentData={deploymentData}
          onComplete={handleWhatsAppComplete}
          onBack={handleBackToChannelSelection}
        />
      )}

      {currentScreen === 'success' && (
        <ChannelSuccess 
          channelName={getChannelName()}
          deploymentData={deploymentData}
        />
      )}
    </div>
  );
}

export default App;
