import React, { useState, useEffect } from 'react';
import LLMConfigService from '../../services/llmConfigService';
import AnimatedModal from './AnimatedModal';

const LLMSettingsModal = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const existingKey = LLMConfigService.getApiKey();
      if (existingKey) {
        setApiKey('sk-' + '*'.repeat(existingKey.length - 10) + existingKey.slice(-7));
      }
    }
  }, [isOpen]);

  const handleSaveApiKey = async () => {
    setError('');
    
    const validation = LLMConfigService.validateApiKey(apiKey);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setIsTestingKey(true);
    const isValid = await LLMConfigService.testApiKey(apiKey);
    
    if (isValid) {
      LLMConfigService.setApiKey(apiKey);
      setTestResult('success');
      setTimeout(() => {
        onClose();
        setTestResult(null);
      }, 1500);
    } else {
      setError('API key test failed. Please check your key and try again.');
      setTestResult('error');
    }
    setIsTestingKey(false);
  };

  const handleRemoveApiKey = () => {
    LLMConfigService.removeApiKey();
    setApiKey('');
    setTestResult(null);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-primary)] p-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-dmSerif gradient-text">
              AI-Powered CSV Import Settings
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full h-12 px-4 pr-12 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] font-outfit placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-xs mt-1 font-outfit">{error}</p>
              )}
              {testResult === 'success' && (
                <p className="text-green-500 text-xs mt-1 font-outfit">✅ API key verified successfully!</p>
              )}
            </div>

            <div className="bg-[var(--color-info-surface)] border border-[var(--color-info-border)] rounded-lg p-3">
              <h4 className="font-medium text-[var(--color-info-text)] text-sm mb-1 font-outfit">How it works</h4>
              <ul className="text-[var(--color-info-text)] text-xs space-y-1 font-outfit">
                <li>• AI analyzes your CSV structure intelligently</li>
                <li>• Suggests optimal widget mappings with confidence scores</li>
                <li>• Only headers and sample data are sent (privacy-first)</li>
                <li>• Falls back to basic import if API is unavailable</li>
              </ul>
            </div>

            <div className="bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] rounded-lg p-3">
              <h4 className="font-medium text-[var(--color-warning-text)] text-sm mb-1 font-outfit">🔒 Privacy & Security</h4>
              <p className="text-[var(--color-warning-text)] text-xs font-outfit">
                Your API key is encrypted and stored locally. Only CSV headers and sample rows are sent to OpenAI for analysis.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              {LLMConfigService.hasApiKey() && (
                <button
                  onClick={handleRemoveApiKey}
                  className="flex-1 h-12 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-outfit font-medium"
                >
                  Remove Key
                </button>
              )}
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKey || isTestingKey}
                className="flex-1 h-12 bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] hover:from-[var(--color-brand-600)] hover:to-[var(--color-brand-700)] disabled:from-[var(--color-surface-elevated)] disabled:to-[var(--color-surface-elevated)] disabled:text-[var(--color-text-tertiary)] text-white rounded-lg transition-all duration-200 font-outfit font-semibold shadow-sm"
              >
                {isTestingKey ? 'Testing...' : 'Save & Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default LLMSettingsModal;
