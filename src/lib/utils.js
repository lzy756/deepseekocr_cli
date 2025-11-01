/**
 * Utility functions
 * General helpers for file handling, retry logic, ZIP extraction, etc.
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);

/**
 * Extract ZIP file to directory
 * @param {string} zipPath - Path to ZIP file
 * @param {string} outputDir - Output directory
 * @returns {Promise<string>} Output directory path
 */
export async function extractZip(zipPath, outputDir) {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Try using adm-zip package if available
  try {
    const AdmZip = await import('adm-zip').then(m => m.default).catch(() => null);

    if (AdmZip) {
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();

      // Validate all entries before extraction to prevent path traversal
      const resolvedOutputDir = path.resolve(outputDir);
      for (const entry of entries) {
        const entryPath = path.join(resolvedOutputDir, entry.entryName);
        const resolvedEntryPath = path.resolve(entryPath);

        // Check if the resolved path is within the output directory
        if (!resolvedEntryPath.startsWith(resolvedOutputDir + path.sep) && resolvedEntryPath !== resolvedOutputDir) {
          throw new Error(`Unsafe ZIP entry detected: ${entry.entryName}. Path traversal attempt blocked.`);
        }
      }

      // Safe to extract
      zip.extractAllTo(outputDir, true);
      return outputDir;
    }

    // If AdmZip not available, fallback to command-line
    throw new Error('adm-zip not available');
  } catch (error) {
    // Fallback to command-line unzip
    if (process.platform === 'win32') {
      try {
        await execAsync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outputDir}' -Force"`);
      } catch (psError) {
        throw new Error(`Failed to extract ZIP file: ${psError.message}. Please extract manually or install adm-zip package.`);
      }
    } else {
      try {
        await execAsync(`unzip -o "${zipPath}" -d "${outputDir}"`);
      } catch (unzipError) {
        throw new Error(`Failed to extract ZIP file: ${unzipError.message}. Please install unzip or extract manually.`);
      }
    }
    return outputDir;
  }
}

/**
 * Get file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Generate output filename from input filename
 * @param {string} inputPath - Input file path
 * @param {string} suffix - Suffix to add
 * @param {string} ext - New extension
 * @returns {string} Output filename
 */
export function generateOutputFilename(inputPath, suffix = '_result', ext = '.zip') {
  const basename = path.basename(inputPath, path.extname(inputPath));
  return basename + suffix + ext;
}

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path
 */
export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Clean up temporary files
 * @param {Array<string>} filePaths - File paths to delete
 */
export function cleanupFiles(filePaths) {
  filePaths.forEach((filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {object} options - Retry options
 * @returns {Promise<*>} Result of function
 */
export async function retry(fn, options = {}) {
  const maxAttempts = options.maxAttempts || 3;
  const initialDelay = options.initialDelay || 1000;
  const maxDelay = options.maxDelay || 10000;
  const onRetry = options.onRetry || (() => {});

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        onRetry(attempt, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get current file's directory (ESM equivalent of __dirname)
 * @param {string} importMetaUrl - import.meta.url
 * @returns {string} Directory path
 */
export function getDirname(importMetaUrl) {
  const __filename = fileURLToPath(importMetaUrl);
  return dirname(__filename);
}

/**
 * Parse ZIP file contents and return metadata
 * @param {string} zipPath - Path to ZIP file
 * @returns {Promise<object>} ZIP contents metadata
 */
export async function parseZipContents(zipPath) {
  try {
    const AdmZip = await import('adm-zip').then(m => m.default).catch(() => null);
    
    if (!AdmZip) {
      return null;
    }

    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    const contents = {
      markdown: null,
      original: null,
      metadata: null,
      images: [],
      visualizationPdf: null,
    };

    entries.forEach((entry) => {
      const name = entry.entryName;
      if (name === 'result.mmd') {
        contents.markdown = name;
      } else if (name === 'result_ori.mmd') {
        contents.original = name;
      } else if (name === 'metadata.json') {
        contents.metadata = name;
      } else if (name === 'result_layouts.pdf') {
        contents.visualizationPdf = name;
      } else if (name.startsWith('images/') && name.match(/\.(jpg|png)$/)) {
        contents.images.push(name);
      }
    });

    return contents;
  } catch (error) {
    return null;
  }
}

/**
 * Read metadata.json from ZIP file
 * @param {string} zipPath - Path to ZIP file
 * @returns {Promise<object|null>} Metadata object or null
 */
export async function readMetadataFromZip(zipPath) {
  try {
    const AdmZip = await import('adm-zip').then(m => m.default).catch(() => null);
    
    if (!AdmZip) {
      return null;
    }

    const zip = new AdmZip(zipPath);
    const entry = zip.getEntry('metadata.json');
    
    if (entry) {
      const content = zip.readAsText(entry);
      return JSON.parse(content);
    }

    return null;
  } catch (error) {
    return null;
  }
}

export default {
  extractZip,
  formatFileSize,
  generateOutputFilename,
  ensureDir,
  cleanupFiles,
  retry,
  sleep,
  getDirname,
  parseZipContents,
  readMetadataFromZip,
};
