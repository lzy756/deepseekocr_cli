import ConfigManager from './config-manager.js';
import { DEFAULTS } from '../constants.js';

/**
 * Get effective configuration with precedence:
 * CLI flags > Environment variables > Config file > Defaults
 * 
 * @param {Object} cliOptions - Options from Commander.js
 * @returns {Object} Effective configuration
 */
export function getEffectiveConfig(cliOptions = {}) {
  const configManager = new ConfigManager();
  
  // Start with defaults
  const config = {
    api: {
      key: DEFAULTS.API_KEY,
      baseUrl: DEFAULTS.BASE_URL,
      timeout: DEFAULTS.TIMEOUT
    },
    defaults: {
      mode: DEFAULTS.MODE,
      resolution: DEFAULTS.RESOLUTION,
      dpi: DEFAULTS.DPI,
      maxPages: DEFAULTS.MAX_PAGES,
      workers: DEFAULTS.WORKERS,
      pollInterval: DEFAULTS.POLL_INTERVAL,
      pollTimeout: DEFAULTS.POLL_TIMEOUT
    }
  };

  // Layer 3: Config file (overrides defaults)
  const fileConfig = configManager.getAll();
  if (fileConfig.api) {
    config.api = { ...config.api, ...fileConfig.api };
  }
  if (fileConfig.defaults) {
    config.defaults = { ...config.defaults, ...fileConfig.defaults };
  }

  // Layer 2: Environment variables (overrides config file)
  if (process.env.DEEPSEEK_OCR_API_KEY) {
    config.api.key = process.env.DEEPSEEK_OCR_API_KEY;
  }
  if (process.env.DEEPSEEK_OCR_BASE_URL) {
    config.api.baseUrl = process.env.DEEPSEEK_OCR_BASE_URL;
  }
  if (process.env.DEEPSEEK_OCR_TIMEOUT) {
    config.api.timeout = parseInt(process.env.DEEPSEEK_OCR_TIMEOUT, 10);
  }
  if (process.env.DEEPSEEK_OCR_MODE) {
    config.defaults.mode = process.env.DEEPSEEK_OCR_MODE;
  }
  if (process.env.DEEPSEEK_OCR_RESOLUTION) {
    config.defaults.resolution = process.env.DEEPSEEK_OCR_RESOLUTION;
  }
  if (process.env.DEEPSEEK_OCR_DPI) {
    config.defaults.dpi = parseInt(process.env.DEEPSEEK_OCR_DPI, 10);
  }
  if (process.env.DEEPSEEK_OCR_MAX_PAGES) {
    config.defaults.maxPages = parseInt(process.env.DEEPSEEK_OCR_MAX_PAGES, 10);
  }
  if (process.env.DEEPSEEK_OCR_WORKERS) {
    config.defaults.workers = parseInt(process.env.DEEPSEEK_OCR_WORKERS, 10);
  }

  // Layer 1: CLI flags (highest priority)
  if (cliOptions.apiKey) {
    config.api.key = cliOptions.apiKey;
  }
  if (cliOptions.baseUrl) {
    config.api.baseUrl = cliOptions.baseUrl;
  }
  if (cliOptions.mode) {
    config.defaults.mode = cliOptions.mode;
  }
  if (cliOptions.resolution) {
    config.defaults.resolution = cliOptions.resolution;
  }
  if (cliOptions.dpi) {
    config.defaults.dpi = parseInt(cliOptions.dpi, 10);
  }
  if (cliOptions.maxPages) {
    config.defaults.maxPages = parseInt(cliOptions.maxPages, 10);
  }
  if (cliOptions.workers) {
    config.defaults.workers = parseInt(cliOptions.workers, 10);
  }

  return config;
}

/**
 * Validate effective configuration
 * Throws error if required configuration is missing
 * 
 * @param {Object} config - Configuration object from getEffectiveConfig
 * @throws {Error} If API key is missing
 */
export function validateConfig(config) {
  if (!config.api.key) {
    throw new Error(
      'API key is required. Set it via:\n' +
      '  1. CLI flag: --api-key YOUR_KEY\n' +
      '  2. Environment variable: DEEPSEEK_OCR_API_KEY=YOUR_KEY\n' +
      '  3. Config file: deepseek-ocr config set api.key YOUR_KEY\n' +
      '  4. Interactive setup: deepseek-ocr config init'
    );
  }

  if (!config.api.baseUrl) {
    throw new Error('API base URL is required');
  }
}

/**
 * Get API key with precedence
 * Convenience function for commands that only need the API key
 * 
 * @param {Object} cliOptions - Options from Commander.js
 * @returns {string} API key
 */
export function getApiKey(cliOptions = {}) {
  const config = getEffectiveConfig(cliOptions);
  validateConfig(config);
  return config.api.key;
}

/**
 * Get base URL with precedence
 * Convenience function for commands that only need the base URL
 * 
 * @param {Object} cliOptions - Options from Commander.js
 * @returns {string} Base URL
 */
export function getBaseUrl(cliOptions = {}) {
  const config = getEffectiveConfig(cliOptions);
  validateConfig(config);
  return config.api.baseUrl;
}

export default {
  getEffectiveConfig,
  validateConfig,
  getApiKey,
  getBaseUrl
};
