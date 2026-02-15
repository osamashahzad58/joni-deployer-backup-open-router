import React, { useState } from 'react';
import { FaRocket, FaShieldAlt, FaBolt, FaServer, FaLaptop, FaKey, FaCopy } from 'react-icons/fa';
import './Landing.css';

const API_BASE = import.meta.env?.VITE_API_BASE ?? 'http://localhost:3100';

function Landing({ onCreateAccount, onInstallLocally }) {
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState(null);
  const [openRouterKeys, setOpenRouterKeys] = useState(null);
  const [keysLimit, setKeysLimit] = useState(50);
  const [copied, setCopied] = useState(null);

  const [ec2Loading, setEc2Loading] = useState(false);
  const [ec2Error, setEc2Error] = useState(null);
  const [ec2Result, setEc2Result] = useState(null);

  const handleCreateKeys = async () => {
    setKeysLoading(true);
    setKeysError(null);
    setOpenRouterKeys(null);
    try {
      const res = await fetch(`${API_BASE}/api/create-openrouter-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: keysLimit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create keys');
      setOpenRouterKeys(data);
    } catch (err) {
      setKeysError(err.message);
    } finally {
      setKeysLoading(false);
    }
  };

  const copyKey = (label, value) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAllKeys = () => {
    if (!openRouterKeys) return;
    const text = `Sonnet 4.5: ${openRouterKeys.sonnet45Key}\nGemini 3 Pro (image): ${openRouterKeys.gemini3ProKey}`;
    navigator.clipboard.writeText(text);
    setCopied('all');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLaunchEc2 = async () => {
    setEc2Loading(true);
    setEc2Error(null);
    setEc2Result(null);
    try {
      const res = await fetch(`${API_BASE}/api/launch-ec2`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to launch EC2');
      setEc2Result(data);
    } catch (err) {
      setEc2Error(err.message);
    } finally {
      setEc2Loading(false);
    }
  };

  const copyEc2 = (label, value) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        {/* Hero section */}
        <div className="hero-section">
          <div className="logo-container">
            <div className="logo-glow"></div>
            <h1 className="logo-text">
              <span className="logo-j">J</span>
              <span className="logo-oni">ONI</span>
            </h1>
          </div>
          
          <h2 className="hero-title">Your Personal AI Gateway</h2>
          <p className="hero-subtitle">
            Deploy your own secure instance in minutes. Connect with Telegram, WhatsApp, or Discord.
          </p>

          {/* Feature highlights */}
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <FaRocket />
              </div>
              <div className="feature-text">
                <h3>Quick Deploy</h3>
                <p>10-15 minutes setup</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <FaShieldAlt />
              </div>
              <div className="feature-text">
                <h3>Private & Secure</h3>
                <p>Your own AWS instance</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <FaBolt />
              </div>
              <div className="feature-text">
                <h3>Always On</h3>
                <p>24/7 availability</p>
              </div>
            </div>
          </div>

          {/* Install choice: Instance vs Local */}
          <p className="install-choice-label">בחר אופן התקנה / Choose installation:</p>
          <div className="install-choice-buttons">
            <button className="install-option-button install-option-instance" onClick={onCreateAccount}>
              <FaServer className="install-option-icon" />
              <span className="install-option-title">התקן על Instance / Deploy to cloud</span>
              <span className="install-option-desc">AWS EC2, Docker, Gateway</span>
            </button>
            <button className="install-option-button install-option-local" onClick={onInstallLocally}>
              <FaLaptop className="install-option-icon" />
              <span className="install-option-title">התקן מקומית / Install locally</span>
              <span className="install-option-desc">Docker on this machine, same API keys</span>
            </button>
          </div>

          {/* Create OpenRouter keys only (no instance) */}
          <div className="openrouter-create-section">
            <p className="openrouter-create-label">
              <FaKey /> Create OpenRouter API keys (keys only, no instance)
            </p>
            <div className="openrouter-create-row">
              <label className="openrouter-create-limit-label">
                Credit limit ($):{' '}
                <input
                  type="number"
                  min={0}
                  max={10000}
                  value={keysLimit}
                  onChange={(e) => setKeysLimit(Number(e.target.value) || 50)}
                  className="openrouter-create-limit-input"
                  disabled={keysLoading}
                />
              </label>
              <button
                type="button"
                className="openrouter-create-btn"
                onClick={handleCreateKeys}
                disabled={keysLoading}
              >
                {keysLoading ? 'Creating…' : `Create keys ($${keysLimit} limit)`}
              </button>
            </div>
            {keysError && <p className="openrouter-create-error">{keysError}</p>}
            {openRouterKeys && (
              <div className="openrouter-keys-box">
                <p className="openrouter-keys-title">🔑 OpenRouter API keys — save these; they won’t be shown again.</p>
                <button type="button" className="copy-key-btn copy-all-btn" onClick={copyAllKeys}>
                  {copied === 'all' ? 'Copied!' : 'Copy all'}
                </button>
                <div className="openrouter-keys-list">
                  <div className="openrouter-key-row">
                    <span className="openrouter-key-label">Sonnet 4.5:</span>
                    <div className="openrouter-key-value-wrap">
                      <code className="openrouter-key-value">{openRouterKeys.sonnet45Key}</code>
                      <button type="button" className="copy-key-btn" onClick={() => copyKey('sonnet', openRouterKeys.sonnet45Key)}>
                        {copied === 'sonnet' ? 'Copied!' : <FaCopy />}
                      </button>
                    </div>
                  </div>
                  <div className="openrouter-key-row">
                    <span className="openrouter-key-label">Gemini 3 Pro (image preview):</span>
                    <div className="openrouter-key-value-wrap">
                      <code className="openrouter-key-value">{openRouterKeys.gemini3ProKey}</code>
                      <button type="button" className="copy-key-btn" onClick={() => copyKey('gemini', openRouterKeys.gemini3ProKey)}>
                        {copied === 'gemini' ? 'Copied!' : <FaCopy />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Spin up EC2 instance only (no JONI install) */}
          <div className="ec2-only-section">
            <p className="ec2-only-label">
              <FaServer /> Spin up EC2 instance only
            </p>
            <button
              type="button"
              className="ec2-only-btn"
              onClick={handleLaunchEc2}
              disabled={ec2Loading}
            >
              {ec2Loading ? 'Launching…' : 'Spin up EC2 instance'}
            </button>
            {ec2Error && <p className="ec2-only-error">{ec2Error}</p>}
            {ec2Result && (
              <div className="ec2-result-box">
                <p className="ec2-result-title">EC2 instance launched</p>
                <div className="ec2-result-list">
                  <div className="ec2-result-row">
                    <span className="ec2-result-label">Instance ID:</span>
                    <div className="ec2-result-value-wrap">
                      <code className="ec2-result-value">{ec2Result.instanceId}</code>
                      <button type="button" className="copy-key-btn" onClick={() => copyEc2('ec2-id', ec2Result.instanceId)}>
                        {copied === 'ec2-id' ? 'Copied!' : <FaCopy />}
                      </button>
                    </div>
                  </div>
                  <div className="ec2-result-row">
                    <span className="ec2-result-label">Public IP:</span>
                    <div className="ec2-result-value-wrap">
                      <code className="ec2-result-value">{ec2Result.publicIp}</code>
                      <button type="button" className="copy-key-btn" onClick={() => copyEc2('ec2-ip', ec2Result.publicIp)}>
                        {copied === 'ec2-ip' ? 'Copied!' : <FaCopy />}
                      </button>
                    </div>
                  </div>
                  <div className="ec2-result-row">
                    <span className="ec2-result-label">Region:</span>
                    <code className="ec2-result-value">{ec2Result.region}</code>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="footer-note">
            Powered by AWS • OpenClaw Gateway • Claude
          </p>
        </div>
      </div>
    </div>
  );
}

export default Landing;
