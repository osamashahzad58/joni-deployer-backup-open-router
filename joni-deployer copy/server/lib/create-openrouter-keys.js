/**
 * Create 2 OpenRouter API keys (Claude Sonnet 4.5 + Gemini 3 Pro image preview).
 * Used before deployment so the deploy script can receive them via env.
 * Requires OPENROUTER_MANAGEMENT_KEY in environment (from .env).
 */
const BASE = 'https://openrouter.ai/api/v1';

const MODELS = [
  { name: 'joni-claude-sonnet-4-5', model: 'openrouter/anthropic/claude-sonnet-4-5', envKey: 'sonnet45Key' },
  { name: 'joni-gemini-3-pro-image-preview', model: 'google/gemini-3-pro-image-preview', envKey: 'gemini3ProKey' },
];

/**
 * Create a single OpenRouter API key.
 * @param {string} managementKey - OPENROUTER_MANAGEMENT_KEY
 * @param {string} name - Key name
 * @param {number|null} limitDollars - Optional spending limit in USD (e.g. 50 for $50). 0 or null = no limit.
 * @returns {Promise<{ key: string }>}
 */
async function createKey(managementKey, name, limitDollars = 0) {
  const payload = {
    name,
    limit: limitDollars > 0 ? limitDollars : 0,
    limit_reset: limitDollars > 0 ? null : null, // null = one-time cap when limit set
    expires_at: null, // never expire
  };
  const res = await fetch(`${BASE}/keys`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${managementKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Create both OpenRouter keys. Returns { sonnet45Key, gemini3ProKey }.
 * @param {string} managementKey - OPENROUTER_MANAGEMENT_KEY
 * @returns {Promise<{ sonnet45Key: string, gemini3ProKey: string }>}
 */
async function createOpenRouterKeys(managementKey) {
  return createOpenRouterKeysWithLimit(managementKey, 0);
}

/**
 * Create both OpenRouter keys with an optional credit limit (e.g. $50). Keys only, no deployment.
 * @param {string} managementKey - OPENROUTER_MANAGEMENT_KEY
 * @param {number} limitDollars - Optional spending limit in USD per key (default 50). 0 = no limit.
 * @returns {Promise<{ sonnet45Key: string, gemini3ProKey: string }>}
 */
async function createOpenRouterKeysWithLimit(managementKey, limitDollars = 50) {
  if (!managementKey || !managementKey.trim()) {
    throw new Error('Missing OPENROUTER_MANAGEMENT_KEY in .env or environment');
  }
  const keys = {};
  for (const { name, envKey } of MODELS) {
    const result = await createKey(managementKey, name, limitDollars);
    keys[envKey] = result.key;
  }
  return keys;
}

module.exports = { createOpenRouterKeys, createOpenRouterKeysWithLimit };
