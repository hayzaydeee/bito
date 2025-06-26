import React, { useState, useEffect } from 'react';
import LLMConfigService from '../../services/llmConfigService';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-card rounded-xl shadow-xl p-6 m-4 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
            AI-Powered CSV Import Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                {showApiKey ? '🙈' : '👁️'}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
            {testResult === 'success' && (
              <p className="text-green-500 text-xs mt-1">✅ API key verified successfully!</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 text-sm mb-1">How it works</h4>
            <ul className="text-blue-800 text-xs space-y-1">
              <li>• AI analyzes your CSV structure intelligently</li>
              <li>• Suggests optimal widget mappings with confidence scores</li>
              <li>• Only headers and sample data are sent (privacy-first)</li>
              <li>• Falls back to basic import if API is unavailable</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-medium text-yellow-900 text-sm mb-1">🔒 Privacy & Security</h4>
            <p className="text-yellow-800 text-xs">
              Your API key is encrypted and stored locally. Only CSV headers and sample rows are sent to OpenAI for analysis.
            </p>
          </div>

          <div className="flex space-x-3">
            {LLMConfigService.hasApiKey() && (
              <button
                onClick={handleRemoveApiKey}
                className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm"
              >
                Remove Key
              </button>
            )}
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey || isTestingKey}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isTestingKey ? 'Testing...' : 'Save & Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMSettingsModal;
