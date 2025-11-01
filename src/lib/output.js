/**
 * Output formatters
 * Handles formatted console output (text/JSON) with colors
 */

import chalk from 'chalk';

/**
 * Format output based on format type
 * @param {*} data - Data to output
 * @param {string} format - 'text' or 'json'
 */
export function formatOutput(data, format = 'text') {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else {
    // Text format handled by caller
    return data;
  }
}

/**
 * Print success message
 * @param {string} message - Success message
 */
export function printSuccess(message) {
  console.log(chalk.green('✓'), message);
}

/**
 * Print error message
 * @param {string} message - Error message
 * @param {string} [detail] - Optional error detail
 */
export function printError(message, detail) {
  console.error(chalk.red('✗ Error:'), message);
  if (detail) {
    console.error(chalk.gray('  Details:'), detail);
  }
}

/**
 * Print warning message
 * @param {string} message - Warning message
 */
export function printWarning(message) {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Print info message
 * @param {string} message - Info message
 */
export function printInfo(message) {
  console.log(chalk.cyan(message));
}

/**
 * Print verbose info message with [*] prefix
 * @param {string} message - Info message
 */
export function printVerboseInfo(message) {
  console.log(chalk.cyan('[*] ' + message));
}

/**
 * Print verbose success message with [✓] prefix
 * @param {string} message - Success message
 */
export function printVerboseSuccess(message) {
  console.log(chalk.green('[✓] ' + message));
}

/**
 * Print section header
 * @param {string} title - Section title
 */
export function printSection(title) {
  console.log('\n' + chalk.bold(title));
  console.log('━'.repeat(Math.min(title.length, 60)));
}

/**
 * Print key-value pair
 * @param {string} key - Key name
 * @param {*} value - Value
 * @param {number} indent - Indentation level
 */
export function printKeyValue(key, value, indent = 0) {
  const padding = '  '.repeat(indent);
  const keyFormatted = chalk.cyan(key.padEnd(20));
  console.log(`${padding}${keyFormatted} ${value}`);
}

/**
 * Print table from array of objects
 * @param {Array} data - Array of row objects
 * @param {Array} columns - Column definitions (optional, will be inferred from data if not provided)
 */
export function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.gray('  No data'));
    return;
  }

  // If columns not provided, infer from first row
  if (!columns && data.length > 0) {
    columns = Object.keys(data[0]).map(key => ({
      key: key,
      header: key
    }));
  }

  // Calculate column widths
  const widths = columns.map((col) => {
    const headerWidth = col.header.length;
    const dataWidth = Math.max(
      ...data.map((row) => String(row[col.key] || '').length)
    );
    return Math.max(headerWidth, dataWidth);
  });

  // Print header
  const header = columns
    .map((col, i) => col.header.padEnd(widths[i]))
    .join(' │ ');
  console.log(chalk.bold(header));
  console.log('─'.repeat(header.length));

  // Print rows
  data.forEach((row) => {
    const line = columns
      .map((col, i) => {
        const value = String(row[col.key] || '');
        return value.padEnd(widths[i]);
      })
      .join(' │ ');
    console.log(line);
  });
}

/**
 * Print processing summary
 * @param {object} summary - Summary object
 */
export function printSummary(summary) {
  console.log();
  printSection('Summary');
  
  // Handle batch summary format (with successful/total)
  if (summary.successful !== undefined) {
    const successRate = summary.total > 0
      ? ((summary.successful / summary.total) * 100).toFixed(1)
      : 0;
    printKeyValue('Total', summary.total);
    printKeyValue('Successful', `${summary.successful} (${successRate}%)`);
    if (summary.failed) {
      printKeyValue('Failed', summary.failed);
    }
  }
  
  // Handle numeric processingTime
  if (typeof summary.processingTime === 'number') {
    printKeyValue('Processing time', `${summary.processingTime.toFixed(1)}s`);
  }
  
  if (summary.totalTime) {
    const mins = Math.floor(summary.totalTime / 60);
    const secs = (summary.totalTime % 60).toFixed(0);
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    printKeyValue('Total time', timeStr);
  }
  
  // Handle custom key-value pairs (for single file operations)
  Object.keys(summary).forEach(key => {
    if (!['successful', 'total', 'failed', 'processingTime', 'totalTime'].includes(key)) {
      printKeyValue(key, summary[key]);
    }
  });
}

/**
 * Print file contents list
 * @param {object} contents - Contents object
 */
export function printContents(contents) {
  console.log(chalk.bold('\nContents:'));
  if (contents.markdown) {
    console.log(chalk.gray('  - result.mmd'));
  }
  if (contents.original) {
    console.log(chalk.gray('  - result_ori.mmd'));
  }
  if (contents.metadata) {
    console.log(chalk.gray('  - metadata.json'));
  }
  if (contents.images && contents.images.length > 0) {
    console.log(chalk.gray(`  - images/ (${contents.images.length} images)`));
  }
  if (contents.visualizationPdf) {
    console.log(chalk.gray('  - result_layouts.pdf'));
  }
}

export default {
  formatOutput,
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printVerboseInfo,
  printVerboseSuccess,
  printSection,
  printKeyValue,
  printTable,
  printSummary,
  printContents,
};
