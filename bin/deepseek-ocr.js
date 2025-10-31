#!/usr/bin/env node

/**
 * DeepSeek-OCR CLI Tool
 * Executable entry point
 */

import('../src/index.js').catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
