import { Command } from 'commander';
import OCRClient from '../lib/client.js';
import { getEffectiveConfig, validateConfig } from '../lib/config-precedence.js';
import { printSuccess, printError, printInfo, printKeyValue, printSection, printSummary } from '../lib/output.js';

/**
 * Handle health check command
 */
async function handleHealthCheck(options) {
  try {
    // Get effective configuration
    const config = getEffectiveConfig({
      apiKey: options.apiKey || options.parent?.optsWithGlobals()?.apiKey,
      baseUrl: options.baseUrl || options.parent?.optsWithGlobals()?.baseUrl
    });
    
    // Validate configuration
    validateConfig(config);
    
    // Initialize API client
    const client = new OCRClient(config.api.baseUrl, config.api.key, {
      timeout: config.api.timeout
    });
    
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    const verbose = options.verbose || options.parent?.optsWithGlobals()?.verbose;
    
    if (!jsonOutput) {
      printSection('Service Health Check');
      printInfo('Checking service status...');
      console.log();
    }
    
    // Perform health check
    const startTime = Date.now();
    const health = await client.healthCheck();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        status: health.status,
        model_loaded: health.model_loaded,
        timestamp: new Date().toISOString(),
        response_time_ms: responseTime,
        base_url: verbose ? config.api.baseUrl : undefined,
        headers: verbose ? health.headers : undefined
      }, null, 2));
    } else {
      const statusIcon = health.status === 'healthy' ? '✓' : '✗';
      const modelIcon = health.model_loaded ? '✓' : '✗';
      
      printSummary({
        'Service Status': `${statusIcon} ${health.status}`,
        'Model Loaded': `${modelIcon} ${health.model_loaded ? 'Yes' : 'No'}`,
        'Response Time': `${responseTime}ms`,
        'Timestamp': new Date().toISOString()
      });
      
      if (verbose) {
        console.log();
        printInfo('Connection Details:');
        printKeyValue('  Base URL', config.api.baseUrl);
        
        if (health.headers) {
          console.log();
          printInfo('Response Headers:');
          Object.entries(health.headers).forEach(([key, value]) => {
            console.log(`    ${key}: ${value}`);
          });
        }
      }
      
      console.log();
      if (health.status === 'healthy' && health.model_loaded) {
        printSuccess('Service is healthy and ready to process requests');
      } else if (health.status === 'healthy' && !health.model_loaded) {
        printInfo('Service is healthy but model is not loaded yet');
      } else {
        printError('Service is not healthy');
      }
    }
    
  } catch (error) {
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    if (jsonOutput) {
      console.error(JSON.stringify({
        success: false,
        error: error.message,
        status: 'unreachable'
      }, null, 2));
    } else {
      printError(`Health check failed: ${error.message}`);
      
      console.log();
      printInfo('Troubleshooting:');
      printInfo('  1. Check if the service is running');
      printInfo('  2. Verify the base URL is correct:');
      printInfo('     - Run: deepseek-ocr config show');
      printInfo('     - Or use: --base-url <url>');
      printInfo('  3. Check your network connection');
      printInfo('  4. Verify API key is valid (authentication errors)');
      
      if (error.code === 'ENOTFOUND') {
        console.log();
        printError('DNS lookup failed - the hostname could not be resolved');
      } else if (error.code === 'ECONNREFUSED') {
        console.log();
        printError('Connection refused - the service is not reachable');
      } else if (error.code === 'ETIMEDOUT') {
        console.log();
        printError('Connection timed out - the service took too long to respond');
      }
    }
    
    process.exit(1);
  }
}

/**
 * Handle model info command
 */
async function handleModelInfo(options) {
  try {
    // Get effective configuration
    const config = getEffectiveConfig({
      apiKey: options.apiKey || options.parent?.optsWithGlobals()?.apiKey,
      baseUrl: options.baseUrl || options.parent?.optsWithGlobals()?.baseUrl
    });
    
    // Validate configuration
    validateConfig(config);
    
    // Initialize API client
    const client = new OCRClient(config.api.baseUrl, config.api.key, {
      timeout: config.api.timeout
    });
    
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    const verbose = options.verbose || options.parent?.optsWithGlobals()?.verbose;
    
    if (!jsonOutput) {
      printSection('Model Information');
      printInfo('Retrieving model configuration...');
      console.log();
    }
    
    // Get model info
    const info = await client.getModelInfo();
    
    if (jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        model: info.model_name,
        supported_modes: info.supported_modes,
        supported_resolutions: info.supported_resolutions,
        version: info.version,
        base_url: verbose ? config.api.baseUrl : undefined
      }, null, 2));
    } else {
      printSummary({
        'Model Name': info.model_name || 'Unknown',
        'Version': info.version || 'Unknown'
      });
      
      if (info.supported_modes && info.supported_modes.length > 0) {
        console.log();
        printInfo('Supported Modes:');
        info.supported_modes.forEach(mode => {
          console.log(`  - ${mode}`);
        });
      }
      
      if (info.supported_resolutions && info.supported_resolutions.length > 0) {
        console.log();
        printInfo('Supported Resolutions:');
        info.supported_resolutions.forEach(resolution => {
          console.log(`  - ${resolution}`);
        });
      }
      
      if (verbose) {
        console.log();
        printInfo('Connection Details:');
        printKeyValue('  Base URL', config.api.baseUrl);
      }
    }
    
  } catch (error) {
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    if (jsonOutput) {
      console.error(JSON.stringify({
        success: false,
        error: error.message
      }, null, 2));
    } else {
      printError(`Failed to retrieve model information: ${error.message}`);
      
      console.log();
      printInfo('Troubleshooting:');
      printInfo('  1. Check if the service is running');
      printInfo('  2. Verify the base URL is correct');
      printInfo('  3. Check your API key is valid');
      printInfo('  4. Ensure the model is loaded (run: deepseek-ocr health)');
    }
    
    process.exit(1);
  }
}

/**
 * Create health command
 */
export function createHealthCommand() {
  const health = new Command('health')
    .description('Check service health and model information');
  
  // health (check service status)
  health
    .command('check')
    .description('Check if OCR service is available and healthy')
    .option('--verbose', 'Show detailed connection information')
    .option('--json', 'Output in JSON format')
    .action(handleHealthCheck);
  
  // health info (get model information)
  health
    .command('info')
    .description('Display model configuration and capabilities')
    .option('--verbose', 'Show detailed connection information')
    .option('--json', 'Output in JSON format')
    .action(handleModelInfo);
  
  // Default action (when just "health" is called without subcommand)
  health
    .action(handleHealthCheck);
  
  return health;
}

export default createHealthCommand;
