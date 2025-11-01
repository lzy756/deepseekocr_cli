/**
 * Command utility functions
 * Helpers for reducing code duplication across commands
 */

/**
 * Get merged command options (local + global)
 * @param {object} options - Local options from command
 * @param {object} command - Commander command object
 * @returns {object} Merged options
 */
export function getCommandOptions(options, command) {
  const globalOpts = command?.optsWithGlobals() || {};

  return {
    apiKey: options.apiKey || globalOpts.apiKey,
    baseUrl: options.baseUrl || globalOpts.baseUrl,
    verbose: options.verbose || globalOpts.verbose,
    output: options.output || globalOpts.output,
    mode: options.mode || globalOpts.mode,
    resolution: options.resolution || globalOpts.resolution,
    dpi: options.dpi || globalOpts.dpi,
    maxPages: options.maxPages || globalOpts.maxPages,
  };
}

/**
 * Check if JSON output is requested
 * @param {object} options - Command options
 * @param {object} command - Commander command object
 * @returns {boolean} True if JSON output
 */
export function isJsonOutput(options, command) {
  const globalOpts = command?.optsWithGlobals() || {};
  const outputFormat = options.output || globalOpts.output || 'text';
  return outputFormat === 'json';
}

export default {
  getCommandOptions,
  isJsonOutput,
};
