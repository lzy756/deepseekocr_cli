/**
 * Constants for DeepSeek-OCR CLI
 * Defines valid modes, resolutions, defaults, and limits per API specification
 */

export const MODES = {
  DOCUMENT_MARKDOWN: 'document_markdown',
  FREE_OCR: 'free_ocr',
  FIGURE_PARSE: 'figure_parse',
  GROUNDING_OCR: 'grounding_ocr',
  CUSTOM: 'custom',
};

export const RESOLUTIONS = {
  TINY: 'Tiny',
  SMALL: 'Small',
  BASE: 'Base',
  LARGE: 'Large',
  GUNDAM: 'Gundam',
};

export const DEFAULTS = {
  MODE: MODES.DOCUMENT_MARKDOWN,
  RESOLUTION: RESOLUTIONS.GUNDAM,
  MAX_RETRIES: 3,
  POLL_INTERVAL: 500, // ms - Fast initial polling for quick tasks
  MAX_POLL_INTERVAL: 10000, // ms - Max 10s between polls (reduced from 30s)
  POLL_TIMEOUT: 600000, // 10 minutes for async task polling
  TIMEOUT: 30000, // ms
  OUTPUT_DIR: './results',
  AUTO_EXTRACT: true,
  SHOW_PROGRESS: true,
  WORKERS: 3,
  BASE_URL: 'http://localhost:8000',
  API_KEY: '',  // Default empty API key
  DPI: 144,
  MAX_PAGES: 50,
};

// Task-related constants
export const TASK_RETENTION_DAYS = 7; // Days to keep task history
export const INITIAL_POLL_DELAY = 2000; // ms - Initial delay before first poll
export const MAX_POLL_DELAY = 30000; // ms - Maximum delay between polls
export const TASK_MAX_WAIT_TIME = 3600000; // ms - 1 hour max wait time for tasks

export const LIMITS = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  MAX_PDF_PAGES: 50,
  MAX_QUEUE_SIZE: 100,
  MIN_DPI: 72,
  MAX_DPI: 300,
  SYNC_ASYNC_THRESHOLD: 10, // pages
};

export const SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
export const SUPPORTED_PDF_FORMATS = ['.pdf'];

export const EXIT_CODES = {
  SUCCESS: 0,
  ERROR: 1,
  USAGE_ERROR: 2,
};

export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  CLIENT: 'client',
};

// Validate constants at module load
if (DEFAULTS.POLL_INTERVAL > DEFAULTS.MAX_POLL_INTERVAL) {
  throw new Error('Invalid configuration: POLL_INTERVAL cannot be greater than MAX_POLL_INTERVAL');
}

if (DEFAULTS.POLL_INTERVAL < 100) {
  throw new Error('Invalid configuration: POLL_INTERVAL must be at least 100ms');
}

if (DEFAULTS.MAX_POLL_INTERVAL > 60000) {
  throw new Error('Invalid configuration: MAX_POLL_INTERVAL should not exceed 60000ms (1 minute)');
}
