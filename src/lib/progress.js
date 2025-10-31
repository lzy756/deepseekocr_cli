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
    clearOnComplete: false,
    stopOnComplete: true,
  });

  bar.start(total, 0);
  return bar;
}

/**
 * Create multi-bar container
 * @returns {object} Multi-bar instance
 */
export function createMultiBar() {
  return new cliProgress.MultiBar({
    format: `{filename} ${chalk.cyan('{bar}')} {percentage}%`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: false,
  });
}

/**
 * Create multi-progress bar (alias for createMultiBar)
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
