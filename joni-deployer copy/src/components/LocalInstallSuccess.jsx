import React from 'react';
import { FaCheckCircle, FaBook } from 'react-icons/fa';
import './DeploymentProgress.css';

function LocalInstallSuccess({ onBack }) {
  const joniFixReadme = 'joni-fix/README-INSTALL-ONLY.md';
  return (
    <div className="deployment-progress-overlay">
      <div className="deployment-progress-modal local-success-modal">
        <div className="progress-header">
          <FaCheckCircle className="success-icon" style={{ fontSize: 64, color: '#22c55e', marginBottom: 16 }} />
          <h1 className="progress-title">התקנה מקומית הושלמה / Local install complete</h1>
          <p className="progress-subtitle">
            JONI was installed on this machine using the same API keys (OpenRouter Sonnet 4.5 + Gemini 3 Pro image).
          </p>
        </div>
        <div className="local-success-instructions">
          <p><strong>⚠️ Do not use <code>~/JONI</code> — that path is only for EC2 deploy. Use the <strong>joni-fix</strong> folder.</strong></p>
          <p><strong>From the joni-fix directory (e.g. <code>cd ~/Desktop/joni-fix</code>):</strong></p>
          <ul>
            <li>Start gateway: <code>docker compose up -d joni-gateway</code></li>
            <li>TUI: <code>docker compose run --rm joni-cli tui</code></li>
            <li>Logs: <code>docker compose logs -f joni-gateway</code></li>
          </ul>
          <p className="path-note"><strong>Token mismatch?</strong> If you see &quot;gateway token mismatch&quot;, the token in <code>~/.joni/joni.json</code> must match <code>JONI_GATEWAY_TOKEN</code> in <code>joni-fix/.env</code>. Set the same value in <code>joni-fix/.env</code> and run <code>docker compose up -d --force-recreate joni-gateway</code>.</p>
          <p className="readme-ref">
            <FaBook /> Full instructions: <strong>{joniFixReadme}</strong> (in the joni-fix project).
          </p>
        </div>
        <button type="button" className="create-account-button" onClick={onBack} style={{ maxWidth: 280, marginTop: 24 }}>
          Back to start
        </button>
      </div>
    </div>
  );
}

export default LocalInstallSuccess;
