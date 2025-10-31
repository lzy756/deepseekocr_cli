# Research: DeepSeek-OCR CLI Tool

**Date**: 2025-10-31  
**Phase**: 0 (Outline & Research)  
**Purpose**: Resolve all technical unknowns and establish implementation patterns

---

## 1. Commander.js Framework Research

### Decision: Commander.js as CLI Framework

**Rationale**:
- **User Requirement**: Explicitly specified "必须使用Commander.js作为CLI框架"
- **Mature & Stable**: Most popular Node.js CLI framework (28k+ GitHub stars)
- **Rich Features**: Subcommands, options parsing, help generation, custom help
- **TypeScript Support**: Full type definitions available
- **UNIX-compatible**: Supports POSIX-style options, stdin/stdout

**Key Features Used**:
1. **Program & Commands**: Main program + subcommands (config, image, pdf, batch, task)
2. **Options**: Global options (--verbose, --output json) + command-specific options
3. **Arguments**: Required/optional arguments with validation
4. **Help Text**: Auto-generated help with `.description()` and `.usage()`
5. **Version**: Automatic `--version` flag

**Example Structure**:
```javascript
const { program } = require('commander');

program
  .name('deepseek-ocr')
  .description('CLI tool for DeepSeek-OCR API')
  .version('1.0.0');

program
  .command('image <file>')
  .description('OCR a single image')
  .option('-m, --mode <mode>', 'OCR mode', 'document_markdown')
  .option('-r, --resolution <preset>', 'Resolution preset', 'Gundam')
  .option('-o, --output <path>', 'Output file path')
  .action((file, options) => {
    // Implementation
  });

program.parse(process.argv);
```

**Alternatives Considered**:
- **Yargs**: Feature-rich but heavier, more complex API
- **Oclif**: Too heavyweight for single CLI tool (designed for plugin architectures)
- **Meow**: Too minimal, lacks subcommand support

---

## 2. HTTP Client Research

### Decision: Axios for HTTP Communication

**Rationale**:
- **Promise-based**: Clean async/await syntax
- **Request/Response Interceptors**: Centralized auth header injection, error handling
- **Timeout Support**: Built-in request timeouts
- **Form Data**: Easy multipart/form-data for file uploads
- **Stream Support**: Download large ZIP files with progress tracking
- **Error Handling**: Distinguishes network errors from HTTP errors

**Example Usage**:
```javascript
const axios = require('axios');
const FormData = require('form-data');

const client = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 300000, // 5 minutes
  headers: { 'X-API-Key': apiKey }
});

// File upload
const form = new FormData();
form.append('file', fs.createReadStream(imagePath));
form.append('mode', 'document_markdown');

const response = await client.post('/api/v1/ocr/image', form, {
  headers: form.getHeaders(),
  responseType: 'arraybuffer' // For ZIP download
});
```

**Alternatives Considered**:
- **node-fetch**: Requires manual FormData handling, less feature-rich
- **Native http/https**: Too low-level, no automatic JSON parsing

---

## 3. Configuration Management Research

### Decision: conf Package for Config File

**Rationale**:
- **OS-Appropriate Paths**: Auto-detects correct config directory per OS
  - Linux/Mac: `~/.config/deepseek-ocr/config.json`
  - Windows: `%APPDATA%\deepseek-ocr\config.json`
- **Atomic Writes**: Prevents corruption during writes
- **Schema Validation**: Ensures config integrity
- **Defaults**: Merge defaults with user settings
- **Encryption**: Built-in encryption for sensitive values (API keys)

**Example Usage**:
```javascript
const Conf = require('conf');

const config = new Conf({
  projectName: 'deepseek-ocr',
  defaults: {
    api: {
      baseUrl: 'http://localhost:8000',
      apiKey: ''
    },
    defaults: {
      mode: 'document_markdown',
      resolution: 'Gundam'
    }
  },
  schema: {
    api: {
      type: 'object',
      properties: {
        baseUrl: { type: 'string' },
        apiKey: { type: 'string' }
      }
    }
  },
  encryptionKey: 'optional-encryption-key-for-apiKey'
});

// Usage
const apiKey = config.get('api.apiKey');
config.set('defaults.mode', 'free_ocr');
```

**Environment Variable Override**:
```javascript
const baseUrl = process.env.DEEPSEEK_BASE_URL || config.get('api.baseUrl');
const apiKey = process.env.DEEPSEEK_API_KEY || config.get('api.apiKey');
```

**Alternatives Considered**:
- **cosmiconfig**: More complex, supports many formats (overkill for this use case)
- **rc**: Legacy syntax, less modern

---

## 4. Progress Indicators Research

### Decision: cli-progress for Progress Bars

**Rationale**:
- **Multi-Bar Support**: Show progress for batch operations
- **Customizable**: Format, bar style, ETAs
- **Terminal-Safe**: Auto-detects TTY, gracefully degrades in non-interactive shells
- **Lightweight**: Small footprint

**Example Usage**:
```javascript
const cliProgress = require('cli-progress');

// Single progress bar (PDF processing)
const bar = new cliProgress.SingleBar({
  format: 'Processing |{bar}| {percentage}% | {value}/{total} pages',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591'
});

bar.start(100, 0);
// Update during polling
bar.update(progress * 100);
bar.stop();

// Multi-bar (batch processing)
const multibar = new cliProgress.MultiBar({
  format: '{filename} |{bar}| {percentage}%',
  clearOnComplete: false
});

const bars = files.map(file => 
  multibar.create(100, 0, { filename: file })
);
```

**Alternatives Considered**:
- **ora**: Spinner-only, no progress bars
- **listr**: Task list UI, too opinionated for our use case

---

## 5. Output Formatting Research

### Decision: chalk for Colored Output

**Rationale**:
- **Cross-Platform**: Works on Windows, Mac, Linux
- **Simple API**: `chalk.red('error')`, `chalk.green.bold('success')`
- **Auto-Detection**: Disables colors in non-TTY environments
- **Composable**: Chain styles and nest colors

**Example Usage**:
```javascript
const chalk = require('chalk');

console.log(chalk.green('✓ Success!'));
console.log(chalk.red('✗ Error:'), error.message);
console.log(chalk.cyan('Processing...'));
console.log(chalk.yellow('⚠ Warning:'), 'File large');
```

**JSON Output Support**:
```javascript
function output(data, options) {
  if (options.output === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else {
    // Human-readable colored output
    console.log(chalk.green('Status:'), data.status);
  }
}
```

---

## 6. Input Validation Research

### Decision: Custom Validator + Built-in Validation

**Rationale**:
- **File Validation**: Check existence, size, format before API call
- **Parameter Validation**: Validate modes, resolutions against API spec
- **Path Safety**: Prevent directory traversal attacks
- **Commander Integration**: Use `.argParser()` for type coercion

**Example Implementation**:
```javascript
// src/lib/validator.js
const fs = require('fs');
const path = require('path');

const SUPPORTED_MODES = [
  'document_markdown',
  'free_ocr',
  'figure_parse',
  'grounding_ocr',
  'custom'
];

const SUPPORTED_RESOLUTIONS = ['Tiny', 'Small', 'Base', 'Large', 'Gundam'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function validateImageFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const stats = fs.statSync(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${stats.size} bytes (max ${MAX_FILE_SIZE})`);
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
  if (!validExts.includes(ext)) {
    throw new Error(`Unsupported format: ${ext}. Supported: ${validExts.join(', ')}`);
  }
  
  return true;
}

function validateMode(mode) {
  if (!SUPPORTED_MODES.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Supported: ${SUPPORTED_MODES.join(', ')}`);
  }
  return mode;
}

module.exports = {
  validateImageFile,
  validatePdfFile,
  validateMode,
  validateResolution
};
```

---

## 7. Error Handling & Retry Logic Research

### Decision: Exponential Backoff with axios-retry

**Rationale**:
- **Automatic Retries**: Configure once, applies to all requests
- **Exponential Backoff**: 1s, 2s, 4s delays
- **Selective Retry**: Only retry on network errors and 5xx status codes
- **Configurable**: Max retries, delay, conditions

**Example Implementation**:
```javascript
const axios = require('axios');
const axiosRetry = require('axios-retry');

const client = axios.create({
  baseURL: config.get('api.baseUrl'),
  timeout: 300000,
  headers: { 'X-API-Key': config.get('api.apiKey') }
});

// Configure retry logic
axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay, // 1s, 2s, 4s
  retryCondition: (error) => {
    // Retry on network errors or 5xx
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response && error.response.status >= 500);
  },
  onRetry: (retryCount, error) => {
    console.log(chalk.yellow(`Retry ${retryCount}/3: ${error.message}`));
  }
});
```

**Error Translation**:
```javascript
function handleApiError(error) {
  if (error.response) {
    // HTTP error
    const status = error.response.status;
    const detail = error.response.data?.detail || 'Unknown error';
    
    if (status === 401) {
      console.error(chalk.red('✗ Authentication failed. Check API key.'));
      console.error('Run: deepseek-ocr config init');
    } else if (status === 400) {
      console.error(chalk.red('✗ Bad request:'), detail);
    } else if (status === 413) {
      console.error(chalk.red('✗ File too large. Try compressing the file.'));
    } else {
      console.error(chalk.red(`✗ HTTP ${status}:`), detail);
    }
  } else if (error.request) {
    // Network error
    console.error(chalk.red('✗ Network error. Is the service running?'));
    console.error('Check:', config.get('api.baseUrl'));
  } else {
    console.error(chalk.red('✗ Error:'), error.message);
  }
  
  process.exit(1);
}
```

---

## 8. Asynchronous Task Polling Research

### Decision: Custom Polling with Exponential Backoff

**Rationale**:
- **Progressive Delay**: Start 2s, max 30s (per spec FR-027)
- **Progress Tracking**: Update cli-progress bar during polling
- **Cancellation**: Handle Ctrl+C gracefully
- **Timeout**: Optional max wait time

**Example Implementation**:
```javascript
async function waitForTask(client, taskId, options = {}) {
  const {
    initialDelay = 2000,
    maxDelay = 30000,
    timeout = 600000, // 10 minutes
    onProgress = null
  } = options;
  
  const startTime = Date.now();
  let delay = initialDelay;
  
  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeout) {
      throw new Error('Task timeout');
    }
    
    // Query status
    const status = await client.getTaskStatus(taskId);
    
    // Update progress callback
    if (onProgress) {
      onProgress(status);
    }
    
    // Check completion
    if (status.status === 'completed') {
      return status;
    } else if (status.status === 'failed') {
      throw new Error(`Task failed: ${status.error?.message}`);
    }
    
    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, maxDelay); // Cap at maxDelay
  }
}
```

**Graceful Ctrl+C Handling**:
```javascript
let isShuttingDown = false;

process.on('SIGINT', () => {
  if (isShuttingDown) {
    process.exit(1);
  }
  
  isShuttingDown = true;
  console.log(chalk.yellow('\n\n⚠ Interrupted. Task continues on server.'));
  console.log(`Check status: deepseek-ocr task status ${currentTaskId}`);
  process.exit(0);
});
```

---

## 9. Testing Strategy Research

### Decision: Jest + Nock for Unit/Integration Tests

**Rationale**:
- **Jest**: Most popular Node.js testing framework, built-in mocking
- **Nock**: HTTP mocking library, intercepts axios requests
- **Coverage**: Jest has built-in coverage reporting
- **Snapshot Testing**: Useful for CLI output validation

**Test Structure**:
```javascript
// tests/unit/client.test.js
const nock = require('nock');
const OCRClient = require('../../src/lib/client');

describe('OCRClient', () => {
  let client;
  
  beforeEach(() => {
    client = new OCRClient('http://localhost:8000', 'test-key');
  });
  
  afterEach(() => {
    nock.cleanAll();
  });
  
  test('health check returns status', async () => {
    nock('http://localhost:8000')
      .get('/health')
      .reply(200, { status: 'healthy', model_loaded: true });
    
    const health = await client.healthCheck();
    expect(health.status).toBe('healthy');
  });
  
  test('ocr image with file upload', async () => {
    const mockZip = Buffer.from('fake-zip-content');
    
    nock('http://localhost:8000')
      .post('/api/v1/ocr/image')
      .reply(200, mockZip, { 'Content-Type': 'application/zip' });
    
    const result = await client.ocrImage('test.jpg');
    expect(result).toBeInstanceOf(Buffer);
  });
  
  test('handles 401 authentication error', async () => {
    nock('http://localhost:8000')
      .get('/api/v1/info')
      .reply(401, { detail: 'Invalid API Key' });
    
    await expect(client.getModelInfo()).rejects.toThrow();
  });
});
```

**Integration Tests**:
```javascript
// tests/integration/commands.test.js
const { execSync } = require('child_process');

describe('CLI Commands', () => {
  test('config init creates config file', () => {
    const output = execSync('node bin/deepseek-ocr.js config init', {
      input: 'http://localhost:8000\ntest-key\n'
    }).toString();
    
    expect(output).toContain('Configuration saved');
  });
  
  test('image command with invalid file shows error', () => {
    expect(() => {
      execSync('node bin/deepseek-ocr.js image nonexistent.jpg');
    }).toThrow(/File not found/);
  });
});
```

---

## 10. Package Distribution Research

### Decision: npm Package with bin Entry

**package.json Structure**:
```json
{
  "name": "deepseek-ocr-cli",
  "version": "1.0.0",
  "description": "CLI tool for DeepSeek-OCR API",
  "main": "src/index.js",
  "bin": {
    "deepseek-ocr": "bin/deepseek-ocr.js"
  },
  "scripts": {
    "start": "node bin/deepseek-ocr.js",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/ tests/",
    "lint:fix": "eslint src/ tests/ --fix",
    "format": "prettier --write 'src/**/*.js' 'tests/**/*.js'"
  },
  "keywords": ["ocr", "deepseek", "cli", "pdf", "image"],
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "axios": "^1.6.0",
    "axios-retry": "^3.8.0",
    "conf": "^11.0.0",
    "cli-progress": "^3.12.0",
    "chalk": "^5.3.0",
    "form-data": "^4.0.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nock": "^13.4.0",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0"
  }
}
```

**Installation Methods**:
```bash
# Global install (recommended for end users)
npm install -g deepseek-ocr-cli
deepseek-ocr --version

# Local project install
npm install deepseek-ocr-cli
npx deepseek-ocr --version

# From source (development)
git clone https://github.com/user/deepseek-ocr-cli
cd deepseek-ocr-cli
npm install
npm link
deepseek-ocr --version
```

---

## 11. Resolution and Mode Support

### API-Defined Constraints

**Supported OCR Modes** (from API docs):
1. `document_markdown` - Document to Markdown with layout preservation
2. `free_ocr` - Plain text OCR
3. `figure_parse` - Chart and figure parsing
4. `grounding_ocr` - OCR with coordinate information
5. `custom` - Custom prompt (requires `--prompt` parameter)

**Supported Resolutions** (from API docs):
1. `Tiny` - 512×512, fastest, lowest quality
2. `Small` - 768×768
3. `Base` - 1024×1024, balanced
4. `Large` - 1280×1280
5. `Gundam` - 1024×640 with dynamic cropping, highest quality

**Validation Constants**:
```javascript
// src/constants.js
module.exports = {
  MODES: {
    DOCUMENT_MARKDOWN: 'document_markdown',
    FREE_OCR: 'free_ocr',
    FIGURE_PARSE: 'figure_parse',
    GROUNDING_OCR: 'grounding_ocr',
    CUSTOM: 'custom'
  },
  
  RESOLUTIONS: {
    TINY: 'Tiny',
    SMALL: 'Small',
    BASE: 'Base',
    LARGE: 'Large',
    GUNDAM: 'Gundam'
  },
  
  DEFAULTS: {
    MODE: 'document_markdown',
    RESOLUTION: 'Gundam',
    MAX_RETRIES: 3,
    POLL_INTERVAL: 2000,
    MAX_POLL_INTERVAL: 30000
  },
  
  LIMITS: {
    MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
    MAX_PDF_PAGES: 50
  }
};
```

---

## 12. PDF and Image Recognition Requirements

### PDF Processing (Per User Requirement)

**Sync vs Async Decision Logic**:
```javascript
function shouldUseAsync(pdfPath, options) {
  // User explicit flag
  if (options.sync) return false;
  if (options.async) return true;
  
  // Auto-detect based on page count
  const pageCount = getPdfPageCount(pdfPath);
  return pageCount > 10; // Threshold from spec
}
```

**Page Count Detection**:
```javascript
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function getPdfPageCount(pdfPath) {
  try {
    // Use pdfinfo if available
    const { stdout } = await execAsync(`pdfinfo "${pdfPath}"`);
    const match = stdout.match(/Pages:\s+(\d+)/);
    if (match) return parseInt(match[1]);
  } catch (e) {
    // Fallback: estimate from file size
    const stats = fs.statSync(pdfPath);
    return Math.ceil(stats.size / (100 * 1024)); // Rough estimate
  }
  return 1;
}
```

### Image Recognition (Per User Requirement)

**Supported Formats** (from API docs):
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WEBP (.webp)
- BMP (.bmp)

**Format Validation**:
```javascript
const SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];

function validateImageFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_IMAGE_FORMATS.includes(ext)) {
    throw new Error(
      `Unsupported image format: ${ext}\n` +
      `Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`
    );
  }
}
```

---

## 13. Best Practices Summary

### Code Quality Standards

**ESLint Configuration** (.eslintrc.json):
```json
{
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "no-console": "off",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

**Prettier Configuration** (.prettierrc):
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Security Best Practices

1. **API Key Protection**:
   - Never log API keys
   - Encrypt in config file (conf encryption)
   - Mask when displaying config
   - Add to .gitignore

2. **Input Sanitization**:
   - Validate file paths (prevent `../` traversal)
   - Check file sizes before upload
   - Validate parameter values

3. **Dependency Security**:
   - Run `npm audit` regularly
   - Pin major versions in package.json
   - Keep dependencies updated

---

## Research Complete ✅

All technical decisions resolved:
- ✅ Commander.js for CLI framework (user requirement)
- ✅ Axios + axios-retry for HTTP with retries
- ✅ conf for cross-platform config management
- ✅ cli-progress for progress indicators
- ✅ chalk for colored output
- ✅ Custom validation with API spec constants
- ✅ Exponential backoff polling strategy
- ✅ Jest + Nock for testing
- ✅ npm package distribution with bin entry
- ✅ Support for all 5 OCR modes and 5 resolutions
- ✅ PDF and image recognition per user requirements

**Ready for Phase 1**: Design & Contracts
