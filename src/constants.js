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
  POLL_INTERVAL: 2000, // ms
  MAX_POLL_INTERVAL: 30000, // ms
  TIMEOUT: 30000, // ms
  OUTPUT_DIR: './results',
  AUTO_EXTRACT: true,
  SHOW_PROGRESS: true,
  WORKERS: 3,
  BASE_URL: 'http://localhost:8000',
  DPI: 144,
  MAX_PAGES: 50,
};

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
