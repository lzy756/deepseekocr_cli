/**
 * Progress indicators
 * Wrapper around cli-progress for consistent progress display
 */

import cliProgress from 'cli-progress';
import chalk from 'chalk';

/**
 * Create single progress bar
 * @param {string} label - Progress bar label
 * @param {number} total - Total value
 * @returns {object} Progress bar instance
 */
export function createProgressBar(label, total = 100) {
  const bar = new cliProgress.SingleBar({
    format: `${label} ${chalk.cyan('{bar}')} {percentage}% | {value}/{total}`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: true,  // Auto-clear on completion
    stopOnComplete: true,
    autopadding: true,
  });

  bar.start(total, 0);

  // Add cleanup handlers for process termination
  const cleanup = () => {
    try {
      bar.stop();
    } catch (e) {
      // Ignore errors during cleanup
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  return bar;
}

/**
 * Create multi-progress bar
 * @returns {object} Multi-bar instance
 */
export function createMultiProgressBar() {
  return new cliProgress.MultiBar({
    format: `{filename} ${chalk.cyan('{bar}')} {percentage}%`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: false,
  });
}

// Alias for backward compatibility
export const createMultiBar = createMultiProgressBar;

/**
 * Create upload progress handler
 * @param {object} bar - Progress bar instance
 * @returns {function} Progress handler
 */
export function uploadProgressHandler(bar) {
  return (progressEvent) => {
    if (progressEvent.total) {
      const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
      bar.update(percent);
    }
  };
}

/**
 * Create download progress handler
 * @param {object} bar - Progress bar instance
 * @returns {function} Progress handler
 */
export function downloadProgressHandler(bar) {
  return (progressEvent) => {
    if (progressEvent.total) {
      const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
      bar.update(percent);
    }
  };
}

/**
 * Create task polling progress handler
 * @param {object} bar - Progress bar instance
 * @returns {function} Progress handler
 */
export function taskProgressHandler(bar) {
  return (status) => {
    const percent = Math.round(status.progress * 100);
    bar.update(percent);
  };
}

export default {
  createProgressBar,
  createMultiBar,
  createMultiProgressBar,
  uploadProgressHandler,
  downloadProgressHandler,
  taskProgressHandler,
};
