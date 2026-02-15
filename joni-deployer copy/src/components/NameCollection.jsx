import React, { useState, useEffect, useRef } from 'react';
import './NameCollection.css';

function NameCollection({ onContinue, onClose }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus on input field when modal appears
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const sanitizeUsername = (name) => {
    // Remove special chars, convert to lowercase, replace spaces with hyphens
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const validateUsername = (name) => {
    if (!name || name.trim() === '') {
      return 'Please enter your name';
    }
    
    const sanitized = sanitizeUsername(name);
    if (sanitized.length === 0) {
      return 'Please use letters, numbers, or spaces';
    }
    
    if (sanitized.length > 20) {
      return 'Name is too long (max 20 characters)';
    }
    
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    const sanitizedUsername = sanitizeUsername(username);
    onContinue(sanitizedUsername);
  };

  const handleChange = (e) => {
    setUsername(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const isButtonDisabled = !username || username.trim() === '';

  return (
    <div className="name-collection-overlay">
      <div className="name-collection-modal">
        {/* Close button */}
        <button className="close-button" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* Progress bar */}
        <div className="progress-bar-container">
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: '25%' }}></div>
          </div>
          <div className="progress-label">1/4</div>
        </div>

        {/* Octopus icon */}
        <div className="octopus-icon">
          🐙
        </div>

        {/* Greeting text */}
        <div className="greeting-text">
          <h2>Hi, my name is Joni.</h2>
          <p>What's your name?</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="name-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Your Name
            </label>
            <input
              ref={inputRef}
              id="username"
              type="text"
              className={`form-input ${error ? 'error' : ''}`}
              placeholder="Enter your name"
              value={username}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              maxLength={30}
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <button
            type="submit"
            className="continue-button"
            disabled={isButtonDisabled}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export default NameCollection;
