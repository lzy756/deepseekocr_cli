/**
 * Input validation utilities
 * Validates files, parameters, and other inputs before API calls
 */

import fs from 'fs';
import path from 'path';
import {
  MODES,
  RESOLUTIONS,
  LIMITS,
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_PDF_FORMATS,
} from '../constants.js';

/**
 * Validate image file
 * @param {string} filePath - Path to image file
 * @throws {Error} If validation fails
 * @returns {boolean} True if valid
 */
export function validateImageFile(filePath) {
  // Check existence
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Check it's a file
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${filePath}`);
  }

  // Check size
  if (stats.size > LIMITS.MAX_FILE_SIZE) {
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const limitMB = (LIMITS.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    throw new Error(`File too large: ${sizeMB}MB (max ${limitMB}MB)\n  Suggestion: Compress the image before processing`);
  }

  // Check format
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_IMAGE_FORMATS.includes(ext)) {
    throw new Error(
      `Unsupported image format: ${ext}\n  Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`
    );
  }

  return true;
}

/**
 * Validate PDF file
 * @param {string} filePath - Path to PDF file
 * @throws {Error} If validation fails
 * @returns {boolean} True if valid
 */
export function validatePdfFile(filePath) {
  // Check existence
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Check it's a file
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${filePath}`);
  }

  // Check size
  if (stats.size > LIMITS.MAX_FILE_SIZE) {
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const limitMB = (LIMITS.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    throw new Error(`File too large: ${sizeMB}MB (max ${limitMB}MB)\n  Suggestion: Split the PDF into smaller parts`);
  }

  // Check format
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_PDF_FORMATS.includes(ext)) {
    throw new Error(`Unsupported format: ${ext}. Must be a PDF file.`);
  }

  return true;
}

/**
 * Validate OCR mode
 * @param {string} mode - OCR mode
 * @throws {Error} If invalid
 * @returns {string} The validated mode
 */
export function validateMode(mode) {
  const validModes = Object.values(MODES);
  if (!validModes.includes(mode)) {
    throw new Error(
      `Invalid mode: ${mode}\n  Supported modes: ${validModes.join(', ')}`
    );
  }
  return mode;
}

/**
 * Validate resolution preset
 * @param {string} resolution - Resolution preset
 * @throws {Error} If invalid
 * @returns {string} The validated resolution
 */
export function validateResolution(resolution) {
  const validResolutions = Object.values(RESOLUTIONS);
  if (!validResolutions.includes(resolution)) {
    throw new Error(
      `Invalid resolution: ${resolution}\n  Supported resolutions: ${validResolutions.join(', ')}`
    );
  }
  return resolution;
}

/**
 * Validate DPI value
 * @param {number} dpi - DPI value
 * @throws {Error} If invalid
 * @returns {number} The validated DPI
 */
export function validateDPI(dpi) {
  const dpiNum = parseInt(dpi, 10);
  if (isNaN(dpiNum) || dpiNum < LIMITS.MIN_DPI || dpiNum > LIMITS.MAX_DPI) {
    throw new Error(`Invalid DPI: ${dpi}. Must be between ${LIMITS.MIN_DPI} and ${LIMITS.MAX_DPI}`);
  }
  return dpiNum;
}

/**
 * Validate max pages
 * @param {number} maxPages - Maximum pages
 * @throws {Error} If invalid
 * @returns {number} The validated max pages
 */
export function validateMaxPages(maxPages) {
  const pages = parseInt(maxPages, 10);
  if (isNaN(pages) || pages < 1 || pages > LIMITS.MAX_PDF_PAGES) {
    throw new Error(`Invalid max pages: ${maxPages}. Must be between 1 and ${LIMITS.MAX_PDF_PAGES}`);
  }
  return pages;
}

/**
 * Validate workers count
 * @param {number} workers - Number of workers
 * @throws {Error} If invalid
 * @returns {number} The validated workers count
 */
export function validateWorkers(workers) {
  const num = parseInt(workers, 10);
  if (isNaN(num) || num < 1 || num > 20) {
    throw new Error(`Invalid workers count: ${workers}. Must be between 1 and 20`);
  }
  return num;
}

/**
 * Validate custom prompt is not empty
 * @param {string} prompt - Custom prompt
 * @throws {Error} If prompt is empty
 * @returns {boolean} True if valid
 */
export function validateCustomPrompt(prompt) {
  if (!prompt || prompt.trim() === '') {
    throw new Error('Custom prompt cannot be empty');
  }
  return true;
}
