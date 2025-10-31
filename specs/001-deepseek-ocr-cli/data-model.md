# Data Model: DeepSeek-OCR CLI Tool

**Date**: 2025-10-31  
**Phase**: 1 (Design & Contracts)  
**Purpose**: Define data structures and domain entities

---

## 1. Core Entities

### 1.1 Configuration

**Description**: User settings including API credentials, default preferences, and behavior flags.

**Storage**: `~/.config/deepseek-ocr/config.json` (Linux/Mac) or `%APPDATA%\deepseek-ocr\config.json` (Windows)

**Structure**:
```javascript
{
  api: {
    baseUrl: string,      // API base URL (default: "http://localhost:8000")
    apiKey: string        // Encrypted API key (required)
  },
  defaults: {
    mode: string,         // Default OCR mode (default: "document_markdown")
    resolution: string,   // Default resolution preset (default: "Gundam")
    outputDir: string     // Default output directory (default: "./results")
  },
  behavior: {
    autoExtract: boolean, // Auto-extract ZIP results (default: true)
    showProgress: boolean,// Show progress bars (default: true)
    maxRetries: number    // Max HTTP retry attempts (default: 3)
  }
}
```

**Validation Rules**:
- `baseUrl` must be valid HTTP/HTTPS URL
- `apiKey` must not be empty for API operations
- `mode` must be one of: `document_markdown`, `free_ocr`, `figure_parse`, `grounding_ocr`, `custom`
- `resolution` must be one of: `Tiny`, `Small`, `Base`, `Large`, `Gundam`
- `maxRetries` must be 0-10

**State Transitions**: N/A (stateless configuration)

---

### 1.2 OCRRequest

**Description**: Parameters for a single OCR operation (image or PDF).

**Lifecycle**: Created → Validated → Submitted → (Pending if async) → Completed/Failed

**Structure**:
```javascript
{
  // Input
  inputType: 'file' | 'url' | 'base64',
  inputPath: string?,    // File path (if type=file)
  inputUrl: string?,     // URL (if type=url)
  inputData: string?,    // Base64 data (if type=base64)
  
  // Parameters
  mode: string,          // OCR mode
  resolution: string,    // Resolution preset
  customPrompt: string?, // Required if mode=custom
  maxPages: number?,     // PDF only: max pages to process
  dpi: number?,          // PDF only: rendering DPI (default: 144)
  
  // Output
  outputPath: string?,   // Custom output path
  autoExtract: boolean,  // Extract ZIP automatically
  
  // Metadata
  createdAt: Date,
  isAsync: boolean       // Whether to use async endpoint
}
```

**Validation Rules**:
- Exactly one of `inputPath`, `inputUrl`, `inputData` must be provided
- If `mode` = `custom`, `customPrompt` is required
- If `inputType` = `file`:
  - File must exist
  - File size ≤ 20MB
  - Extension must match image (.jpg, .png, .webp, .bmp) or PDF (.pdf)
- `maxPages` must be 1-100
- `dpi` must be 72-300

---

### 1.3 OCRResult

**Description**: Processed output from an OCR operation.

**Storage**: ZIP file containing Markdown, metadata, and extracted images.

**Structure**:
```javascript
{
  // File reference
  zipPath: string,          // Path to result ZIP file
  extractedPath: string?,   // Path to extracted directory (if auto-extracted)
  
  // Content
  markdown: string,         // Clean Markdown content (from result.mmd)
  originalMarkdown: string, // Original with coordinates (from result_ori.mmd)
  
  // Metadata (from metadata.json in ZIP)
  metadata: {
    model: string,          // "DeepSeek-OCR"
    mode: string,           // OCR mode used
    resolution: string,     // Resolution used
    processingTime: number, // Seconds
    timestamp: string,      // ISO 8601
    inputInfo: {
      type: 'image' | 'pdf',
      size: string?,        // Image dimensions "WxH"
      pages: number?        // PDF page count
    }
  },
  
  // Extracted assets
  images: string[],         // Paths to extracted images
  visualizationPdf: string?,// Path to layout visualization (PDF only)
  
  // Timestamps
  downloadedAt: Date,
  extractedAt: Date?
}
```

**State Transitions**:
1. **Downloaded**: ZIP file saved locally
2. **Extracted**: ZIP contents extracted to directory
3. **Loaded**: Markdown and metadata parsed into memory

---

### 1.4 Task

**Description**: Asynchronous operation state for long-running PDF processing.

**Lifecycle**: Submitted → Pending → Processing → Completed/Failed

**Structure**:
```javascript
{
  // Identification
  taskId: string,         // UUID from API
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: number,       // 0.0 to 1.0
  
  // Timestamps
  createdAt: Date,        // When submitted
  startedAt: Date?,       // When processing began
  completedAt: Date?,     // When finished
  
  // Input reference
  inputFile: string,      // Original file path
  parameters: {
    mode: string,
    resolution: string,
    maxPages: number?
  },
  
  // Result
  downloadUrl: string?,   // API download URL (when completed)
  resultPath: string?,    // Local result path (when downloaded)
  
  // Error (if failed)
  error: {
    message: string,
    type: string          // Exception type
  }?
}
```

**State Transitions**:
```
Submitted ──→ Pending ──→ Processing ──→ Completed
                  │             │              ↓
                  │             │         Downloaded
                  │             ↓
                  └──────→ Failed
```

**Validation Rules**:
- `progress` must be 0.0-1.0
- If `status` = `completed`, `downloadUrl` must be present
- If `status` = `failed`, `error` must be present
- Timestamps must be chronologically ordered

---

### 1.5 JobHistory

**Description**: Local record of submitted tasks for tracking via `task list` command.

**Storage**: `~/.config/deepseek-ocr/history.json`

**Structure**:
```javascript
{
  jobs: [
    {
      taskId: string,
      inputFile: string,
      mode: string,
      submittedAt: Date,
      finalStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'unknown',
      resultPath: string?,
      lastCheckedAt: Date
    }
  ]
}
```

**Operations**:
- **Add**: When task submitted
- **Update**: When status checked or result downloaded
- **Prune**: Remove entries older than 7 days

**Validation Rules**:
- Max 100 entries (auto-prune oldest)
- Each `taskId` must be unique

---

## 2. Value Objects

### 2.1 Mode

**Description**: OCR processing mode.

**Type**: Enum

**Values**:
- `document_markdown` - Structured document to Markdown
- `free_ocr` - Plain text extraction
- `figure_parse` - Chart/figure parsing
- `grounding_ocr` - OCR with coordinates
- `custom` - Custom prompt-based

**Default**: `document_markdown`

---

### 2.2 Resolution

**Description**: Image processing resolution preset.

**Type**: Enum

**Values**:
- `Tiny` - 512×512 (fastest, lowest quality)
- `Small` - 768×768
- `Base` - 1024×1024 (balanced)
- `Large` - 1280×1280
- `Gundam` - 1024×640 dynamic crop (highest quality)

**Default**: `Gundam`

---

### 2.3 ApiError

**Description**: Structured error from API or client.

**Structure**:
```javascript
{
  statusCode: number?,    // HTTP status code (if HTTP error)
  errorType: string,      // 'network' | 'auth' | 'validation' | 'server' | 'client'
  message: string,        // User-friendly error message
  detail: string?,        // Technical details
  suggestion: string?,    // How to fix
  retryable: boolean      // Whether operation can be retried
}
```

**Error Type Mapping**:
- `401` → `auth` (not retryable)
- `400`, `413` → `validation` (not retryable)
- `500`, `503` → `server` (retryable)
- Network errors → `network` (retryable)

---

## 3. Relationships

```
Configuration
    ↓ (uses defaults)
OCRRequest ──→ Task (if async)
    ↓              ↓
OCRResult    JobHistory (records)
```

---

## 4. Data Flow Examples

### 4.1 Synchronous Image OCR

```
User Input
    ↓
OCRRequest (validated)
    ↓
API Call (with retry)
    ↓
OCRResult (ZIP downloaded)
    ↓ (if autoExtract)
Extracted Directory
    ↓
Display summary
```

### 4.2 Asynchronous PDF OCR

```
User Input
    ↓
OCRRequest (validated)
    ↓
API Call (submit)
    ↓
Task (created, status=pending)
    ↓
JobHistory (add entry)
    ↓
Poll Loop (with progress)
    ↓
Task (status=completed)
    ↓
Download Result
    ↓
OCRResult (ZIP + extracted)
    ↓
JobHistory (update)
```

### 4.3 Batch Processing

```
Directory Scan
    ↓
List<File>
    ↓ (for each, parallel)
OCRRequest (validated)
    ↓
API Call (with retry)
    ↓
OCRResult or Error
    ↓ (collect)
Summary Report
```

---

## 5. Persistence Strategy

### 5.1 Configuration

- **Format**: JSON (via `conf` package)
- **Location**: OS-appropriate config directory
- **Encryption**: API key encrypted at rest
- **Backup**: None (user responsible)

### 5.2 Job History

- **Format**: JSON
- **Location**: `~/.config/deepseek-ocr/history.json`
- **Retention**: 7 days, max 100 entries
- **Sync**: Append-only writes, atomic

### 5.3 OCR Results

- **Format**: ZIP files (from API)
- **Location**: User-specified or `./results/`
- **Cleanup**: User-managed (CLI provides no auto-delete)
- **Extracted**: Subdirectories next to ZIP

---

## 6. Data Model Summary

| Entity | Storage | Mutable | Lifetime |
|--------|---------|---------|----------|
| Configuration | config.json | Yes | Persistent |
| OCRRequest | Memory only | No | Per-operation |
| OCRResult | ZIP file + extracted | No | User-managed |
| Task | Memory + JobHistory | Yes (status updates) | Until downloaded |
| JobHistory | history.json | Yes (append/prune) | 7 days |

---

**Data Model Complete** ✅

All entities, relationships, and validation rules defined. Ready for contract generation.
