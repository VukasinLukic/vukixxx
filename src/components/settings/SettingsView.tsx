import React, { useEffect } from 'react';
import { useAIStore } from '@/stores/aiStore';
import type { LLMProviderId } from '@/types';
import './Settings.css';

const PROVIDER_DESCRIPTIONS: Record<LLMProviderId, string> = {
  ollama: 'Free, local inference. Requires Ollama installed and running.',
  gemini: 'Google AI Studio free tier. Requires API key.',
  claude: 'Anthropic Claude API. Requires API key.',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  unknown: { label: 'Not checked', className: 'status-unknown' },
  checking: { label: 'Checking...', className: 'status-checking' },
  available: { label: 'Connected', className: 'status-available' },
  unavailable: { label: 'Unavailable', className: 'status-unavailable' },
};

export const SettingsView: React.FC = () => {
  const {
    activeProviderId,
    providers,
    providerStatus,
    setActiveProvider,
    updateProviderConfig,
    checkProviderStatus,
    checkAllProviders,
  } = useAIStore();

  // Check all providers on mount
  useEffect(() => {
    checkAllProviders();
  }, [checkAllProviders]);

  const providerIds: LLMProviderId[] = ['ollama', 'gemini', 'claude'];

  return (
    <div className="settings-container">
      <div className="settings-content">
        <h2 className="settings-title">Settings</h2>

        {/* AI Provider Selection */}
        <section className="settings-section">
          <h3 className="settings-section-title">AI Provider</h3>
          <p className="settings-section-desc">
            Choose which LLM provider to use for auto-classification and smart suggestions.
          </p>

          <div className="provider-cards">
            {providerIds.map(id => {
              const config = providers[id];
              const status = STATUS_LABELS[providerStatus[id]] || STATUS_LABELS.unknown;
              const isActive = activeProviderId === id;

              return (
                <div
                  key={id}
                  className={`provider-card ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveProvider(id)}
                >
                  <div className="provider-card-header">
                    <div className="provider-name">{config.name}</div>
                    <span className={`provider-status ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="provider-desc">{PROVIDER_DESCRIPTIONS[id]}</p>

                  {/* Model input */}
                  <div className="provider-field">
                    <label>Model</label>
                    <input
                      type="text"
                      value={config.model}
                      onChange={e => updateProviderConfig(id, { model: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      placeholder="Model name"
                    />
                  </div>

                  {/* URL for Ollama */}
                  {id === 'ollama' && (
                    <div className="provider-field">
                      <label>Base URL</label>
                      <input
                        type="text"
                        value={config.baseUrl || ''}
                        onChange={e => updateProviderConfig(id, { baseUrl: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        placeholder="http://localhost:11434"
                      />
                    </div>
                  )}

                  {/* API Key for Gemini/Claude */}
                  {(id === 'gemini' || id === 'claude') && (
                    <div className="provider-field">
                      <label>API Key</label>
                      <input
                        type="password"
                        value={config.apiKey || ''}
                        onChange={e => updateProviderConfig(id, { apiKey: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        placeholder="Enter API key..."
                      />
                    </div>
                  )}

                  <button
                    className="provider-test-btn"
                    onClick={e => {
                      e.stopPropagation();
                      checkProviderStatus(id);
                    }}
                  >
                    Test Connection
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* About Section */}
        <section className="settings-section">
          <h3 className="settings-section-title">About</h3>
          <div className="settings-about">
            <div className="about-item">
              <span className="about-label">Version</span>
              <span className="about-value">1.0.0</span>
            </div>
            <div className="about-item">
              <span className="about-label">Platform</span>
              <span className="about-value">
                {'__TAURI_INTERNALS__' in window ? 'Desktop (Tauri)' : 'Browser'}
              </span>
            </div>
            <div className="about-item">
              <span className="about-label">Storage</span>
              <span className="about-value">
                {'__TAURI_INTERNALS__' in window ? 'File System' : 'IndexedDB'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
