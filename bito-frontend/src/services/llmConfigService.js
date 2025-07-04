/**
 * LLM Configuration Service
 * Manages OpenAI API keys, model settings, and LLM preferences
 */

const STORAGE_KEYS = {
  API_KEY: 'openai-api-key',
  MODEL_SETTINGS: 'llm-model-settings',
  USAGE_STATS: 'llm-usage-stats',
  USER_PREFERENCES: 'llm-user-preferences'
};

const DEFAULT_MODEL_SETTINGS = {
  model: 'gpt-4',
  temperature: 0.1,
  maxTokens: 2000,
  timeout: 30000
};

const DEFAULT_USER_PREFERENCES = {
  autoApplyHighConfidence: true,
  confidenceThreshold: 0.8,
  showReasoningDetails: true,
  enableBatchOperations: true,
  saveSuccessfulMappings: true
};

// Simple encryption for API key storage
const createSimpleCipher = (key) => {
  const encrypt = (text) => {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  };
  
  const decrypt = (encrypted) => {
    try {
      const text = atob(encrypted);
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch {
      return null;
    }
  };
  
  return { encrypt, decrypt };
};

const CIPHER_KEY = 'bito-csv-llm-key-2025';
const cipher = createSimpleCipher(CIPHER_KEY);

export class LLMConfigService {
  static setApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key');
    }
    
    try {
      const encrypted = cipher.encrypt(apiKey);
      localStorage.setItem(STORAGE_KEYS.API_KEY, encrypted);
      return true;
    } catch (error) {
      console.error('Failed to store API key:', error);
      return false;
    }
  }

  static getApiKey() {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.API_KEY);
      if (!encrypted) return null;
      
      return cipher.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  static removeApiKey() {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  }

  static hasApiKey() {
    return !!this.getApiKey();
  }

  static validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return { isValid: false, error: 'API key is required' };
    }
    
    if (!apiKey.startsWith('sk-')) {
      return { isValid: false, error: 'API key must start with "sk-"' };
    }
    
    if (apiKey.length < 20) {
      return { isValid: false, error: 'API key appears to be too short' };
    }
    
    return { isValid: true };
  }

  static async testApiKey(apiKey = null) {
    const keyToTest = apiKey || this.getApiKey();
    if (!keyToTest) return false;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyToTest}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        })
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  static getModelSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MODEL_SETTINGS);
      if (!stored) return DEFAULT_MODEL_SETTINGS;
      
      const settings = JSON.parse(stored);
      return { ...DEFAULT_MODEL_SETTINGS, ...settings };
    } catch {
      return DEFAULT_MODEL_SETTINGS;
    }
  }

  static setModelSettings(settings) {
    try {
      const currentSettings = this.getModelSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem(STORAGE_KEYS.MODEL_SETTINGS, JSON.stringify(newSettings));
      return newSettings;
    } catch (error) {
      console.error('Failed to save model settings:', error);
      throw error;
    }
  }
}

export default LLMConfigService;
