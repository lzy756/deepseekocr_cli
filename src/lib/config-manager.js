/**
 * Configuration Manager
 * Handles reading and writing configuration using conf package
 */

import Conf from 'conf';
import { DEFAULTS } from '../constants.js';

const schema = {
  api: {
    type: 'object',
    properties: {
      baseUrl: {
        type: 'string',
        format: 'uri',
        default: DEFAULTS.BASE_URL,
      },
      key: {
        type: 'string',
        default: DEFAULTS.API_KEY,
      },
    },
  },
  defaults: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        default: DEFAULTS.MODE,
      },
      resolution: {
        type: 'string',
        default: DEFAULTS.RESOLUTION,
      },
      outputDir: {
        type: 'string',
        default: DEFAULTS.OUTPUT_DIR,
      },
    },
  },
  behavior: {
    type: 'object',
    properties: {
      autoExtract: {
        type: 'boolean',
        default: DEFAULTS.AUTO_EXTRACT,
      },
      showProgress: {
        type: 'boolean',
        default: DEFAULTS.SHOW_PROGRESS,
      },
      maxRetries: {
        type: 'number',
        default: DEFAULTS.MAX_RETRIES,
      },
    },
  },
};

class ConfigManager {
  constructor() {
    this.config = new Conf({
      projectName: 'deepseek-ocr',
      schema,
      defaults: {
        api: {
          baseUrl: DEFAULTS.BASE_URL,
          apiKey: '',
        },
        defaults: {
          mode: DEFAULTS.MODE,
          resolution: DEFAULTS.RESOLUTION,
          outputDir: DEFAULTS.OUTPUT_DIR,
        },
        behavior: {
          autoExtract: DEFAULTS.AUTO_EXTRACT,
          showProgress: DEFAULTS.SHOW_PROGRESS,
          maxRetries: DEFAULTS.MAX_RETRIES,
        },
      },
    });
  }

  /**
   * Get configuration value
   * @param {string} key - Config key (dot notation)
   * @param {*} defaultValue - Default if not found
   * @returns {*} Configuration value
   */
  get(key, defaultValue) {
    return this.config.get(key, defaultValue);
  }

  /**
   * Set configuration value
   * @param {string} key - Config key (dot notation)
   * @param {*} value - Value to set
   */
  set(key, value) {
    this.config.set(key, value);
  }

  /**
   * Check if key exists
   * @param {string} key - Config key
   * @returns {boolean} True if exists
   */
  has(key) {
    return this.config.has(key);
  }

  /**
   * Delete a key
   * @param {string} key - Config key
   */
  delete(key) {
    this.config.delete(key);
  }

  /**
   * Get all configuration
   * @returns {object} All configuration
   */
  getAll() {
    return this.config.store;
  }

  /**
   * Get config file path
   * @returns {string} Config file path
   */
  getPath() {
    return this.config.path;
  }

  /**
   * Clear all configuration
   */
  clear() {
    this.config.clear();
  }

  /**
   * Get effective value with precedence: env var > config file > default
   * @param {string} key - Config key
   * @param {string} envVar - Environment variable name
   * @param {*} cliValue - Value from CLI flag
   * @param {*} defaultValue - Default value
   * @returns {*} Effective value
   */
  getEffective(key, envVar, cliValue, defaultValue) {
    // Highest priority: CLI flag
    if (cliValue !== undefined && cliValue !== null) {
      return cliValue;
    }

    // Second priority: Environment variable
    if (envVar && process.env[envVar]) {
      return process.env[envVar];
    }

    // Third priority: Config file
    const configValue = this.get(key);
    if (configValue !== undefined && configValue !== null && configValue !== '') {
      return configValue;
    }

    // Lowest priority: Default
    return defaultValue;
  }

  /**
   * Mask API key for display
   * @param {string} key - API key
   * @returns {string} Masked key
   */
  static maskApiKey(key) {
    if (!key || key.length < 16) {
      return '***';
    }
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
  }
}

export default ConfigManager;
