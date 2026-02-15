'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const DEPLOY_API_BASE = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_DEPLOY_API_BASE || 'http://localhost:3100') : '';

const PLANS = [
  { id: 'light', title: 'Light Usage', description: 'For Occasional Tasks', price: 99 },
  { id: 'standard', title: 'Standard Usage', description: 'For Regular Daily Work', price: 199 },
  { id: 'heavy', title: 'Heavy Usage', description: 'For Intensive, Ongoing Execution', price: 249 },
];

const CHANNELS = [
  { id: 'whatsapp', name: 'WhatsApp', recommended: true },
  { id: 'telegram', name: 'Telegram', recommended: false },
  { id: 'discord', name: 'Discord', recommended: false },
];

// Demo-only fake card details (do not use for real payments)
const DEMO_CARD = {
  number: '4242 4242 4242 4242',
  name: 'Jane Smith',
  expire: '12/28',
  cvv: '123',
};

const GetStartedModal = ({ isOpen, onClose, initialStep = 1, initialDeploymentData = null, onSaveInstance, onMarkChannelCompleted, onStartDeploy }) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState('heavy');
  const [cardNumber, setCardNumber] = useState(DEMO_CARD.number);
  const [nameOnCard, setNameOnCard] = useState(DEMO_CARD.name);
  const [expire, setExpire] = useState(DEMO_CARD.expire);
  const [cvv, setCvv] = useState(DEMO_CARD.cvv);
  const [deploymentData, setDeploymentData] = useState(null);
  const [deployError, setDeployError] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState('whatsapp');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [telegramConfigureLoading, setTelegramConfigureLoading] = useState(false);
  const [telegramConfigureError, setTelegramConfigureError] = useState(null);
  const [telegramConfigureWarning, setTelegramConfigureWarning] = useState(null);
  const [telegramVerifyLoading, setTelegramVerifyLoading] = useState(false);
  const [telegramVerifyError, setTelegramVerifyError] = useState(null);
  const eventSourceRef = useRef(null);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[2];

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCardNumber(DEMO_CARD.number);
      setNameOnCard(DEMO_CARD.name);
      setExpire(DEMO_CARD.expire);
      setCvv(DEMO_CARD.cvv);
      setDeploymentData(null);
      setDeployError(null);
      setTelegramBotToken('');
      setPairingCode('');
      setTelegramConfigureError(null);
      setTelegramConfigureWarning(null);
      setTelegramVerifyError(null);
    } else if (initialStep && initialStep > 1) {
      setStep(initialStep);
      if (initialDeploymentData && (initialDeploymentData.ip || initialDeploymentData.token)) {
        setDeploymentData(initialDeploymentData);
      }
    }
  }, [isOpen, initialStep, initialDeploymentData]);

  // Start deployment when step 4 (loading) is reached
  useEffect(() => {
    if (!isOpen || step !== 4 || !name?.trim() || !DEPLOY_API_BASE) {
      if (step !== 4 && eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    setDeployError(null);
    const sessionId = `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('deploymentSessionId', sessionId);

    const eventSource = new EventSource(
      `${DEPLOY_API_BASE}/api/deploy?username=${encodeURIComponent(name.trim())}&sessionId=${encodeURIComponent(sessionId)}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'complete') {
          sessionStorage.removeItem('deploymentSessionId');
          const dataPayload = data.data || {};
          setDeploymentData(dataPayload);
          onSaveInstance?.(dataPayload);
          eventSource.close();
          eventSourceRef.current = null;
          setTimeout(() => setStep(5), 500);
        } else if (data.type === 'error') {
          setDeployError(data.message || 'Deployment failed');
          sessionStorage.removeItem('deploymentSessionId');
          eventSource.close();
          eventSourceRef.current = null;
        }
      } catch (_) {}
    };

    eventSource.onerror = () => {
      setDeployError('Connection lost. Please check the deploy server.');
      sessionStorage.removeItem('deploymentSessionId');
      eventSource.close();
      eventSourceRef.current = null;
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [isOpen, step, name]);

  if (typeof document === 'undefined' || !isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleContinueStep1 = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleContinueStep2 = () => setStep(3);

  const handleContinueStep3 = (e) => {
    e.preventDefault();
    if (!name?.trim()) return;
    setDeployError(null);
    onStartDeploy?.();
    setStep(4);
    if (!DEPLOY_API_BASE) {
      setDeployError('Deploy server not configured. Set NEXT_PUBLIC_DEPLOY_API_BASE in .env.local.');
    }
  };

  const handleBack = () => {
    if (step === 4 && eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      sessionStorage.removeItem('deploymentSessionId');
    }
    setStep(step === 6 ? 5 : step === 7 ? 6 : step === 8 ? 7 : step === 9 ? 8 : step - 1);
  };

  const BOTFATHER_URL = 'https://t.me/BotFather';

  const TELEGRAM_STEP2_STEPS = [
    'Open BotFather in Telegram',
    'Tap Start',
    'Press on /newbot',
    'Choose a name for your bot',
    'Choose a username ending in "bot"',
    'Copy the Access Token you receive',
  ];

  const handleChannelContinue = () => {
    if (selectedChannelId === 'telegram') {
      setStep(6);
    } else {
      onMarkChannelCompleted?.();
      onClose();
    }
  };

  const handleOpenBotFather = () => window.open(BOTFATHER_URL, '_blank', 'noopener,noreferrer');

  const handleTelegramStep2Next = async (e) => {
    e.preventDefault();
    if (!telegramBotToken.trim()) return;
    if (!DEPLOY_API_BASE) {
      setTelegramConfigureError('Deploy server not configured (NEXT_PUBLIC_DEPLOY_API_BASE).');
      return;
    }
    if (!deploymentData?.ip || !deploymentData?.token) {
      setTelegramConfigureError('Instance not ready. Complete deployment first.');
      return;
    }
    setTelegramConfigureError(null);
    setTelegramConfigureLoading(true);
    try {
      const res = await fetch(`${DEPLOY_API_BASE}/api/instance/channels/telegram/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceIp: deploymentData.ip,
          authToken: deploymentData.token,
          botToken: telegramBotToken.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to configure Telegram');
      }
      setTelegramConfigureWarning(data.warning || null);
      setStep(8);
    } catch (err) {
      setTelegramConfigureError(err.message || 'Failed to configure Telegram. Please try again.');
    } finally {
      setTelegramConfigureLoading(false);
    }
  };

  const TELEGRAM_FINAL_STEPS = [
    'Open your new bot in Telegram',
    'Tap Start',
    'Copy the Pairing Code shown in chat',
    'Paste it below',
  ];

  const handleVerifyActivate = async (e) => {
    e.preventDefault();
    if (!pairingCode.trim()) return;
    if (!DEPLOY_API_BASE) {
      setTelegramVerifyError('Deploy server not configured.');
      return;
    }
    if (!deploymentData?.ip || !deploymentData?.token) {
      setTelegramVerifyError('Instance not ready.');
      return;
    }
    setTelegramVerifyError(null);
    setTelegramVerifyLoading(true);
    try {
      const res = await fetch(`${DEPLOY_API_BASE}/api/instance/channels/telegram/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceIp: deploymentData.ip,
          authToken: deploymentData.token,
          pairingCode: pairingCode.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to verify pairing');
      }
      setStep(9);
    } catch (err) {
      setTelegramVerifyError(err.message || 'Failed to verify pairing. Please try again.');
    } finally {
      setTelegramVerifyLoading(false);
    }
  };

  const handleOpenTelegramSuccess = () => {
    onMarkChannelCompleted?.();
    window.open('https://t.me', '_blank', 'noopener,noreferrer');
    onClose();
  };

  const modalContent = (
    <div className="get-started-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Get started with Joni">
      <div className={`get-started-modal ${step >= 2 ? 'get-started-modal--plan-step' : ''} ${step === 3 ? 'get-started-modal--payment-step' : ''} ${step === 4 ? 'get-started-modal--loading-step' : ''} ${step === 5 ? 'get-started-modal--channel-step' : ''} ${step === 6 ? 'get-started-modal--telegram-step' : ''} ${step === 7 ? 'get-started-modal--telegram-step2' : ''} ${step === 8 ? 'get-started-modal--telegram-final' : ''} ${step === 9 ? 'get-started-modal--telegram-success' : ''}`} onClick={(e) => e.stopPropagation()}>
        {step === 1 ? (
          <button type="button" className="get-started-modal-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : step === 9 ? null : (
          <button type="button" className="get-started-modal-back" onClick={handleBack} aria-label="Back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {step !== 9 && (
          <div className="get-started-modal-progress">
            {(step >= 5 && step <= 8 ? [1, 2, 3, 4] : [1, 2, 3]).map((i) => (
              <span
                key={i}
                className={`get-started-modal-progress-dot ${step >= 5 && step <= 8 ? (i <= 3 ? 'active' : '') : i <= step ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="get-started-modal-body">
            <div className="get-started-modal-joni">
              <img src="/assets/banner/starfish.png" alt="Joni" className="get-started-modal-starfish img-fluid" />
            </div>
            <p className="get-started-modal-greeting">Hi, my name is Joni. What&apos;s your name?</p>

            <form onSubmit={handleContinueStep1} className="get-started-modal-form">
              <label htmlFor="get-started-name" className="get-started-modal-label">Your Name</label>
              <input
                id="get-started-name"
                type="text"
                className="get-started-modal-input"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="get-started-modal-btn">
                Continue
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="get-started-modal-body get-started-modal-body--plans">
            <h2 className="get-started-modal-plan-title">Choose your plan</h2>
            <div className="get-started-modal-plans">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className={`get-started-modal-plan-card ${selectedPlanId === plan.id ? 'get-started-modal-plan-card--selected' : ''}`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="get-started-modal-plan-head">
                    <span className="get-started-modal-plan-name">{plan.title}</span>
                    <span className={`get-started-modal-plan-price ${selectedPlanId === plan.id ? 'get-started-modal-plan-price--selected' : ''}`}>
                      ${plan.price} <span className="get-started-modal-plan-period">/month</span>
                    </span>
                  </div>
                  <p className="get-started-modal-plan-desc">{plan.description}</p>
                </button>
              ))}
            </div>
            <button type="button" className="get-started-modal-btn get-started-modal-btn--step2" onClick={handleContinueStep2}>
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="get-started-modal-body get-started-modal-body--payment">
            <h2 className="get-started-modal-plan-title">Complete your payment</h2>
            <div className="get-started-modal-summary">
              <div className="get-started-modal-summary-row">
                <span className="get-started-modal-summary-label">Plan</span>
                <span className="get-started-modal-summary-value">{selectedPlan.title}</span>
              </div>
              <div className="get-started-modal-summary-row">
                <span className="get-started-modal-summary-label">Price</span>
                <span className="get-started-modal-summary-value get-started-modal-summary-price">
                  ${selectedPlan.price} <span className="get-started-modal-plan-period">/month</span>
                </span>
              </div>
            </div>
            <form onSubmit={handleContinueStep3} className="get-started-modal-form get-started-modal-form--payment">
              <label htmlFor="get-started-card-number" className="get-started-modal-label">Card Number</label>
              <input
                id="get-started-card-number"
                type="text"
                className="get-started-modal-input"
                placeholder="XXXX XXXX XXXX XXXX"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
              <label htmlFor="get-started-name-on-card" className="get-started-modal-label">Name on Card</label>
              <input
                id="get-started-name-on-card"
                type="text"
                className="get-started-modal-input"
                placeholder="Name on card"
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
              />
              <div className="get-started-modal-payment-row">
                <div className="get-started-modal-payment-field">
                  <label htmlFor="get-started-expire" className="get-started-modal-label">Expire</label>
                  <input
                    id="get-started-expire"
                    type="text"
                    className="get-started-modal-input"
                    placeholder="MM/YY"
                    value={expire}
                    onChange={(e) => setExpire(e.target.value)}
                  />
                </div>
                <div className="get-started-modal-payment-field">
                  <label htmlFor="get-started-cvv" className="get-started-modal-label">CVV</label>
                  <input
                    id="get-started-cvv"
                    type="text"
                    className="get-started-modal-input"
                    placeholder="CVV"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="get-started-modal-btn">
                Continue
              </button>
            </form>
          </div>
        )}

        {step === 4 && (
          <div className="get-started-modal-body get-started-modal-body--loading">
            <div className="get-started-modal-loading-starfish-wrap">
              <img src="/assets/banner/starfish.png" alt="" className="get-started-modal-loading-starfish img-fluid" />
            </div>
            <p className="get-started-modal-loading-text">Loading</p>
            {deployError && (
              <div className="get-started-modal-deploy-error">
                {deployError}
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="get-started-modal-body get-started-modal-body--channel">
            <h2 className="get-started-modal-channel-title">Choose Communication Channel</h2>
            <p className="get-started-modal-channel-subtitle">Available options</p>
            <div className="get-started-modal-channels">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  className={`get-started-modal-channel-card ${selectedChannelId === ch.id ? 'get-started-modal-channel-card--selected' : ''} ${ch.recommended ? 'get-started-modal-channel-card--recommended' : ''}`}
                  onClick={() => setSelectedChannelId(ch.id)}
                >
                  {ch.recommended && (
                    <span className="get-started-modal-channel-badge">RECOMMENDED</span>
                  )}
                  <img src={`/assets/social/${ch.id}.svg`} alt="" className="get-started-modal-channel-icon" />
                  <span className="get-started-modal-channel-name">{ch.name}</span>
                </button>
              ))}
            </div>
            <button type="button" className="get-started-modal-btn get-started-modal-btn--channel" onClick={handleChannelContinue}>
              Continue
            </button>
          </div>
        )}

        {step === 6 && (
          <div className="get-started-modal-body get-started-modal-body--telegram">
            <h2 className="get-started-modal-telegram-title">Step 1 – Connect Telegram</h2>
            <p className="get-started-modal-telegram-instruction">
              To get started, you need to create a new Telegram bot.
            </p>
            <div className="get-started-modal-telegram-qr-wrap">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(BOTFATHER_URL)}`}
                alt="Scan to open BotFather"
                className="get-started-modal-telegram-qr"
              />
              <img src="/assets/social/telegram.svg" alt="" className="get-started-modal-telegram-qr-center" aria-hidden />
            </div>
            <button type="button" className="get-started-modal-btn get-started-modal-btn--botfather" onClick={handleOpenBotFather}>
              Open BotFather
            </button>
            <button type="button" className="get-started-modal-telegram-next-link" onClick={() => setStep(7)}>
              Next
            </button>
          </div>
        )}

        {step === 7 && (
          <div className="get-started-modal-body get-started-modal-body--telegram-step2">
            <h2 className="get-started-modal-telegram-title">Step 2 – Create your Telegram bot</h2>
            <ol className="get-started-modal-telegram-steps-list">
              {TELEGRAM_STEP2_STEPS.map((text, idx) => (
                <li key={idx} className="get-started-modal-telegram-steps-item">{text}</li>
              ))}
            </ol>
            <div className="get-started-modal-telegram-important">
              In the same message where you receive the Access Token, you will also see a link to your newly created bot.
            </div>
            <form onSubmit={handleTelegramStep2Next} className="get-started-modal-form get-started-modal-form--telegram-token">
              <label htmlFor="get-started-telegram-token" className="get-started-modal-label">Access Token</label>
              <input
                id="get-started-telegram-token"
                type="text"
                className="get-started-modal-input"
                placeholder="Paste your Access Token here"
                value={telegramBotToken}
                onChange={(e) => { setTelegramBotToken(e.target.value); setTelegramConfigureError(null); }}
                disabled={telegramConfigureLoading}
              />
              {telegramConfigureError && (
                <p className="get-started-modal-field-error" role="alert">{telegramConfigureError}</p>
              )}
              <button type="submit" className="get-started-modal-btn get-started-modal-btn--telegram-next" disabled={telegramConfigureLoading}>
                {telegramConfigureLoading ? 'Configuring…' : 'Next'}
              </button>
            </form>
          </div>
        )}

        {step === 8 && (
          <div className="get-started-modal-body get-started-modal-body--telegram-final">
            <h2 className="get-started-modal-telegram-title">Final step – Connect your bot</h2>
            {telegramConfigureWarning && (
              <p className="get-started-modal-warning" role="alert" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', fontSize: '0.9rem' }}>
                {telegramConfigureWarning}
              </p>
            )}
            <ol className="get-started-modal-telegram-final-steps">
              {TELEGRAM_FINAL_STEPS.map((text, idx) => (
                <li key={idx} className="get-started-modal-telegram-final-steps-item">
                  <span className="get-started-modal-telegram-final-num">{idx + 1}</span>
                  {text}
                </li>
              ))}
            </ol>
            <form onSubmit={handleVerifyActivate} className="get-started-modal-form get-started-modal-form--telegram-token">
              <label htmlFor="get-started-pairing-code" className="get-started-modal-label">Pairing Code</label>
              <input
                id="get-started-pairing-code"
                type="text"
                className="get-started-modal-input"
                placeholder="ABCDE12345"
                value={pairingCode}
                onChange={(e) => { setPairingCode(e.target.value); setTelegramVerifyError(null); }}
                disabled={telegramVerifyLoading}
              />
              {telegramVerifyError && (
                <p className="get-started-modal-field-error" role="alert">{telegramVerifyError}</p>
              )}
              <button type="submit" className="get-started-modal-btn get-started-modal-btn--verify" disabled={telegramVerifyLoading}>
                {telegramVerifyLoading ? 'Verifying…' : 'Verify & Activate'}
              </button>
            </form>
          </div>
        )}

        {step === 9 && (
          <div className="get-started-modal-body get-started-modal-body--telegram-success">
            <div className="get-started-modal-success-icon" aria-hidden>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" stroke="#22c55e" strokeWidth="3" fill="none"/>
                <path d="M20 32l8 8 16-16" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="get-started-modal-success-title">Telegram Connected Successfully</h2>
            <p className="get-started-modal-success-subtitle">You&apos;re ready to start.</p>
            <button type="button" className="get-started-modal-btn get-started-modal-btn--open-telegram" onClick={handleOpenTelegramSuccess}>
              <img src="/assets/social/telegram.svg" alt="" className="get-started-modal-btn-telegram-icon" aria-hidden />
              Open Telegram
            </button>
            <p className="get-started-modal-success-footer">
              From this point forward, all interaction happens in Telegram.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GetStartedModal;
