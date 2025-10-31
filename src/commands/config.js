import { Command } from 'commander';
import ConfigManager from '../lib/config-manager.js';
import { printSuccess, printError, printInfo, printKeyValue, printSection } from '../lib/output.js';
import { DEFAULTS } from '../constants.js';
import readline from 'readline';

// Initialize config manager
const configManager = new ConfigManager();

/**
 * Create readline interface for interactive prompts
 */
function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompt user for input
 */
function question(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Handle config init command
 * Interactive prompt for API key and base URL
 */
async function handleConfigInit() {
  try {
    printSection('Configuration Initialization');
    printInfo('This wizard will help you set up your DeepSeek-OCR configuration.');
    console.log();

    const rl = createPrompt();

    // Prompt for API key
    const apiKey = await question(rl, 'Enter your DeepSeek-OCR API key: ');
    if (!apiKey || apiKey.trim() === '') {
      rl.close();
      printError('API key is required');
      process.exit(1);
    }

    // Prompt for base URL (with default)
    const defaultBaseUrl = DEFAULTS.BASE_URL;
    const baseUrlPrompt = `Enter API base URL (default: ${defaultBaseUrl}): `;
    const baseUrl = await question(rl, baseUrlPrompt);
    const finalBaseUrl = baseUrl.trim() || defaultBaseUrl;

    // Prompt for default mode (with default)
    const defaultMode = DEFAULTS.MODE;
    const modePrompt = `Enter default OCR mode (default: ${defaultMode}): `;
    const mode = await question(rl, modePrompt);
    const finalMode = mode.trim() || defaultMode;

    // Prompt for default resolution (with default)
    const defaultResolution = DEFAULTS.RESOLUTION;
    const resolutionPrompt = `Enter default resolution (default: ${defaultResolution}): `;
    const resolution = await question(rl, resolutionPrompt);
    const finalResolution = resolution.trim() || defaultResolution;

    rl.close();

    // Save configuration
    configManager.set('api.key', apiKey.trim());
    configManager.set('api.baseUrl', finalBaseUrl);
    configManager.set('defaults.mode', finalMode);
    configManager.set('defaults.resolution', finalResolution);

    console.log();
    printSuccess('Configuration saved successfully!');
    printInfo(`Config file: ${configManager.getPath()}`);
    
    // Display saved config
    console.log();
    handleConfigShow({ json: false });
  } catch (error) {
    printError(`Failed to initialize configuration: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle config show command
 * Display all settings with API key masking
 */
function handleConfigShow(options = {}) {
  try {
    const config = configManager.getAll();
    
    if (options.json) {
      // In JSON mode, mask the API key
      const maskedConfig = { ...config };
      if (maskedConfig.api && maskedConfig.api.key) {
        maskedConfig.api.key = ConfigManager.maskApiKey(maskedConfig.api.key);
      }
      console.log(JSON.stringify(maskedConfig, null, 2));
      return;
    }

    printSection('Current Configuration');
    printInfo(`Config file: ${configManager.getPath()}`);
    console.log();

    if (Object.keys(config).length === 0) {
      printInfo('No configuration found. Run "deepseek-ocr config init" to set up.');
      return;
    }

    // Display API settings
    if (config.api) {
      printKeyValue('API Key', config.api.key ? ConfigManager.maskApiKey(config.api.key) : '(not set)');
      printKeyValue('Base URL', config.api.baseUrl || DEFAULTS.BASE_URL);
      printKeyValue('Timeout', `${config.api.timeout || DEFAULTS.TIMEOUT}ms`);
    } else {
      printKeyValue('API Key', '(not set)');
      printKeyValue('Base URL', DEFAULTS.BASE_URL);
      printKeyValue('Timeout', `${DEFAULTS.TIMEOUT}ms`);
    }

    // Display default settings
    console.log();
    if (config.defaults) {
      printKeyValue('Default Mode', config.defaults.mode || DEFAULTS.MODE);
      printKeyValue('Default Resolution', config.defaults.resolution || DEFAULTS.RESOLUTION);
      printKeyValue('Default DPI', config.defaults.dpi || DEFAULTS.DPI);
      printKeyValue('Default Max Pages', config.defaults.maxPages || DEFAULTS.MAX_PAGES);
    } else {
      printKeyValue('Default Mode', DEFAULTS.MODE);
      printKeyValue('Default Resolution', DEFAULTS.RESOLUTION);
      printKeyValue('Default DPI', DEFAULTS.DPI);
      printKeyValue('Default Max Pages', DEFAULTS.MAX_PAGES);
    }
  } catch (error) {
    printError(`Failed to show configuration: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle config set command
 * Update individual settings with dot-notation keys
 */
function handleConfigSet(key, value, options = {}) {
  try {
    if (!key || !value) {
      printError('Both key and value are required');
      printInfo('Usage: deepseek-ocr config set <key> <value>');
      printInfo('Example: deepseek-ocr config set api.baseUrl http://localhost:8000');
      process.exit(1);
    }

    // Set the value
    configManager.set(key, value);

    if (options.json) {
      console.log(JSON.stringify({ success: true, key, value: key.includes('key') ? ConfigManager.maskApiKey(value) : value }));
    } else {
      printSuccess(`Configuration updated: ${key}`);
      const displayValue = key.includes('key') ? ConfigManager.maskApiKey(value) : value;
      printKeyValue(key, displayValue);
    }
  } catch (error) {
    printError(`Failed to set configuration: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle config get command
 * Get a single configuration value
 */
function handleConfigGet(key, options = {}) {
  try {
    if (!key) {
      printError('Key is required');
      printInfo('Usage: deepseek-ocr config get <key>');
      printInfo('Example: deepseek-ocr config get api.baseUrl');
      process.exit(1);
    }

    const value = configManager.get(key);
    
    if (value === undefined) {
      printError(`Configuration key not found: ${key}`);
      process.exit(1);
    }

    if (options.json) {
      const displayValue = key.includes('key') ? ConfigManager.maskApiKey(value) : value;
      console.log(JSON.stringify({ key, value: displayValue }));
    } else {
      const displayValue = key.includes('key') ? ConfigManager.maskApiKey(value) : value;
      printKeyValue(key, displayValue);
    }
  } catch (error) {
    printError(`Failed to get configuration: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle config delete command
 * Delete a configuration key
 */
function handleConfigDelete(key, options = {}) {
  try {
    if (!key) {
      printError('Key is required');
      printInfo('Usage: deepseek-ocr config delete <key>');
      printInfo('Example: deepseek-ocr config delete defaults.mode');
      process.exit(1);
    }

    configManager.delete(key);

    if (options.json) {
      console.log(JSON.stringify({ success: true, deleted: key }));
    } else {
      printSuccess(`Configuration key deleted: ${key}`);
    }
  } catch (error) {
    printError(`Failed to delete configuration: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle config path command
 * Display configuration file path
 */
function handleConfigPath(options = {}) {
  try {
    const path = configManager.getPath();
    
    if (options.json) {
      console.log(JSON.stringify({ path }));
    } else {
      printInfo(`Config file location: ${path}`);
    }
  } catch (error) {
    printError(`Failed to get configuration path: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle config clear command
 * Clear all configuration
 */
function handleConfigClear(options = {}) {
  try {
    configManager.clear();

    if (options.json) {
      console.log(JSON.stringify({ success: true, message: 'Configuration cleared' }));
    } else {
      printSuccess('Configuration cleared successfully');
    }
  } catch (error) {
    printError(`Failed to clear configuration: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Create config command
 */
export function createConfigCommand() {
  const config = new Command('config')
    .description('Manage configuration');

  // config init
  config
    .command('init')
    .description('Initialize configuration with interactive prompts')
    .action(handleConfigInit);

  // config show
  config
    .command('show')
    .description('Display all configuration settings')
    .option('--json', 'Output in JSON format')
    .action(handleConfigShow);

  // config set
  config
    .command('set <key> <value>')
    .description('Set a configuration value (use dot notation for nested keys)')
    .option('--json', 'Output in JSON format')
    .action(handleConfigSet);

  // config get
  config
    .command('get <key>')
    .description('Get a configuration value')
    .option('--json', 'Output in JSON format')
    .action(handleConfigGet);

  // config delete
  config
    .command('delete <key>')
    .alias('del')
    .description('Delete a configuration key')
    .option('--json', 'Output in JSON format')
    .action(handleConfigDelete);

  // config path
  config
    .command('path')
    .description('Display configuration file path')
    .option('--json', 'Output in JSON format')
    .action(handleConfigPath);

  // config clear
  config
    .command('clear')
    .description('Clear all configuration')
    .option('--json', 'Output in JSON format')
    .action(handleConfigClear);

  return config;
}

export default createConfigCommand;
