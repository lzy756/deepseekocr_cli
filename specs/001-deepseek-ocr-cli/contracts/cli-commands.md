# CLI Command Contracts

**Purpose**: Define the interface contract for all CLI commands  
**Format**: Command-line interface specifications  
**Date**: 2025-10-31

---

## Global Options

Available on all commands:

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--version` | `-V` | flag | - | Display CLI version |
| `--help` | `-h` | flag | - | Display help for command |
| `--verbose` | `-v` | flag | false | Enable verbose logging |
| `--output <format>` | `-o` | enum | text | Output format: `text`, `json` |

---

## 1. Configuration Commands

### 1.1 `config init`

**Purpose**: Initialize configuration interactively

**Usage**:
```bash
deepseek-ocr config init [options]
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--base-url <url>` | string | http://localhost:8000 | API base URL |
| `--api-key <key>` | string | (prompt) | API key |

**Behavior**:
- If options provided: Use values non-interactively
- If no options: Prompt user for each value
- Creates/updates config file
- Validates API key by testing connection
- Exits with code 0 on success, 1 on failure

**Examples**:
```bash
# Interactive mode
deepseek-ocr config init

# Non-interactive mode
deepseek-ocr config init --base-url http://api.example.com --api-key abc123
```

**Output** (text format):
```
✓ Configuration saved to: /home/user/.config/deepseek-ocr/config.json
✓ API key validated successfully
```

**Output** (JSON format):
```json
{
  "success": true,
  "configPath": "/home/user/.config/deepseek-ocr/config.json",
  "validated": true
}
```

---

### 1.2 `config show`

**Purpose**: Display current configuration

**Usage**:
```bash
deepseek-ocr config show [options]
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--mask-keys` | flag | true | Mask sensitive values |

**Behavior**:
- Reads configuration file
- Displays all settings
- Masks API key by default (show first 8 and last 8 chars)
- Exits with code 0

**Output** (text format):
```
Configuration (/home/user/.config/deepseek-ocr/config.json):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
api.baseUrl:          http://localhost:8000
api.apiKey:           AbCdEfGh...12345678
defaults.mode:        document_markdown
defaults.resolution:  Gundam
defaults.outputDir:   ./results
behavior.autoExtract: true
behavior.showProgress: true
behavior.maxRetries:  3
```

**Output** (JSON format):
```json
{
  "api": {
    "baseUrl": "http://localhost:8000",
    "apiKey": "AbCdEfGh...12345678"
  },
  "defaults": {
    "mode": "document_markdown",
    "resolution": "Gundam",
    "outputDir": "./results"
  },
  "behavior": {
    "autoExtract": true,
    "showProgress": true,
    "maxRetries": 3
  }
}
```

---

### 1.3 `config set <key> <value>`

**Purpose**: Set a single configuration value

**Usage**:
```bash
deepseek-ocr config set <key> <value>
```

**Arguments**:
| Argument | Type | Description |
|----------|------|-------------|
| `<key>` | string | Config key (dot-notation: `api.baseUrl`) |
| `<value>` | string | New value |

**Behavior**:
- Validates key exists in schema
- Type-coerces value (string → boolean/number if needed)
- Updates config file
- Exits with code 0 on success, 2 on invalid key

**Examples**:
```bash
deepseek-ocr config set api.baseUrl http://prod.example.com
deepseek-ocr config set defaults.mode free_ocr
deepseek-ocr config set behavior.autoExtract false
```

**Output** (text format):
```
✓ Set defaults.mode = free_ocr
```

---

## 2. OCR Commands

### 2.1 `image <file>`

**Purpose**: Perform OCR on a single image

**Usage**:
```bash
deepseek-ocr image <file> [options]
```

**Arguments**:
| Argument | Type | Description |
|----------|------|-------------|
| `<file>` | path | Path to image file (required) |

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `-m, --mode <mode>` | enum | (config) | OCR mode |
| `-r, --resolution <preset>` | enum | (config) | Resolution preset |
| `--prompt <text>` | string | - | Custom prompt (mode=custom only) |
| `--output-file <path>` | path | auto | Output ZIP file path |
| `--no-extract` | flag | false | Don't extract ZIP |

**Valid Modes**: `document_markdown`, `free_ocr`, `figure_parse`, `grounding_ocr`, `custom`

**Valid Resolutions**: `Tiny`, `Small`, `Base`, `Large`, `Gundam`

**Behavior**:
1. Validate image file exists and format supported
2. Check file size ≤ 20MB
3. Submit OCR request to API
4. Download result ZIP
5. Auto-extract if `--no-extract` not specified
6. Display summary

**Exit Codes**:
- 0: Success
- 1: API error or processing failed
- 2: Invalid arguments (file not found, invalid mode, etc.)

**Examples**:
```bash
# Basic usage (use config defaults)
deepseek-ocr image document.jpg

# Custom mode and resolution
deepseek-ocr image scan.png -m grounding_ocr -r Gundam

# Custom output path
deepseek-ocr image photo.jpg --output-file my-result.zip

# Custom prompt mode
deepseek-ocr image chart.png -m custom --prompt "<image>\nExtract all numbers"

# JSON output
deepseek-ocr image doc.jpg -o json
```

**Output** (text format with progress):
```
Processing: document.jpg
Mode: document_markdown | Resolution: Gundam

Uploading... ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%
Processing... (this may take a minute)
Downloading... ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

✓ Success! 
  Result: document_result.zip
  Extracted: document_result/
  Processing time: 2.3s
  
Contents:
  - result.mmd (1.2 KB)
  - result_ori.mmd (3.4 KB)
  - metadata.json
  - images/ (2 images)
```

**Output** (JSON format):
```json
{
  "success": true,
  "inputFile": "document.jpg",
  "outputFile": "document_result.zip",
  "extractedDir": "document_result",
  "processingTime": 2.3,
  "metadata": {
    "model": "DeepSeek-OCR",
    "mode": "document_markdown",
    "resolution": "Gundam",
    "inputInfo": {
      "type": "image",
      "size": "1920x1080"
    }
  },
  "contents": {
    "markdown": "result.mmd",
    "original": "result_ori.mmd",
    "metadata": "metadata.json",
    "images": ["images/0.jpg", "images/1.jpg"]
  }
}
```

---

### 2.2 `pdf <file>`

**Purpose**: Perform OCR on a PDF document

**Usage**:
```bash
deepseek-ocr pdf <file> [options]
```

**Arguments**:
| Argument | Type | Description |
|----------|------|-------------|
| `<file>` | path | Path to PDF file (required) |

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `-m, --mode <mode>` | enum | (config) | OCR mode |
| `-r, --resolution <preset>` | enum | (config) | Resolution preset |
| `--prompt <text>` | string | - | Custom prompt (mode=custom only) |
| `--max-pages <n>` | number | 50 | Maximum pages to process |
| `--dpi <n>` | number | 144 | PDF rendering DPI (72-300) |
| `--sync` | flag | auto | Force synchronous mode |
| `--async` | flag | auto | Force asynchronous mode |
| `--output-file <path>` | path | auto | Output ZIP file path |
| `--no-extract` | flag | false | Don't extract ZIP |

**Behavior**:
1. Validate PDF file exists
2. Check file size ≤ 20MB
3. Auto-detect sync vs async based on page count (threshold: 10 pages)
   - ≤10 pages: Synchronous (unless `--async`)
   - >10 pages: Asynchronous (unless `--sync`)
4. If async:
   - Submit task
   - Poll with progress bar
   - Download when complete
5. If sync:
   - Submit and wait for response
6. Auto-extract if enabled
7. Display summary

**Exit Codes**:
- 0: Success
- 1: API error, processing failed, or task failed
- 2: Invalid arguments

**Examples**:
```bash
# Auto-detect sync/async
deepseek-ocr pdf document.pdf

# Force sync (small PDFs)
deepseek-ocr pdf small-doc.pdf --sync

# Force async with max pages
deepseek-ocr pdf large-book.pdf --async --max-pages 20

# Custom DPI
deepseek-ocr pdf scan.pdf --dpi 300
```

**Output** (async with progress):
```
Processing: large-document.pdf (45 pages)
Mode: document_markdown | Resolution: Gundam
Strategy: Asynchronous (>10 pages)

✓ Task submitted: 550e8400-e29b-41d4-a716-446655440000
⏳ Waiting for completion...

Processing ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% | 45/45 pages

✓ Task completed!
Downloading... ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

✓ Success!
  Result: large-document_result.zip
  Extracted: large-document_result/
  Processing time: 67.2s
  
Run `deepseek-ocr task status <task-id>` to check status later
```

---

### 2.3 `batch <directory>`

**Purpose**: Batch process multiple images in a directory

**Usage**:
```bash
deepseek-ocr batch <directory> [options]
```

**Arguments**:
| Argument | Type | Description |
|----------|------|-------------|
| `<directory>` | path | Directory containing images |

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `-m, --mode <mode>` | enum | (config) | OCR mode for all |
| `-r, --resolution <preset>` | enum | (config) | Resolution preset |
| `--pattern <glob>` | string | *.{jpg,png} | File pattern |
| `--workers <n>` | number | 3 | Concurrent workers |
| `--output-dir <path>` | path | `<dir>/results` | Output directory |
| `--no-extract` | flag | false | Don't extract ZIPs |

**Behavior**:
1. Scan directory for files matching pattern
2. Validate all files
3. Process concurrently (up to `workers` limit)
4. Show overall progress
5. Display summary table with success/failure status

**Exit Codes**:
- 0: All files processed successfully
- 1: Some files failed (partial success)

**Examples**:
```bash
# Process all JPGs in directory
deepseek-ocr batch scans/

# Custom pattern and workers
deepseek-ocr batch photos/ --pattern "*.png" --workers 5

# Specific output directory
deepseek-ocr batch images/ --output-dir processed/
```

**Output**:
```
Scanning: scans/
Found 15 images matching *.{jpg,png}

Processing with 3 workers...
Overall Progress ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% | 15/15 files

Batch Processing Results:
┌─────────────────────────┬────────┬────────────────────────────┐
│ File                    │ Status │ Result                     │
├─────────────────────────┼────────┼────────────────────────────┤
│ scan001.jpg             │ ✓      │ scan001_result.zip         │
│ scan002.jpg             │ ✓      │ scan002_result.zip         │
│ scan003.png             │ ✗      │ File too large (22MB)      │
│ ...                     │ ...    │ ...                        │
└─────────────────────────┴────────┴────────────────────────────┘

Summary:
  ✓ Successful: 14/15 (93%)
  ✗ Failed: 1/15 (7%)
  Total time: 2m 34s
  
Results saved to: scans/results/
```

**Output** (JSON format):
```json
{
  "summary": {
    "total": 15,
    "successful": 14,
    "failed": 1,
    "successRate": 0.93,
    "totalTime": 154.5
  },
  "results": [
    {
      "file": "scan001.jpg",
      "status": "success",
      "outputFile": "scan001_result.zip"
    },
    {
      "file": "scan003.png",
      "status": "failed",
      "error": "File too large (22MB)"
    }
  ]
}
```

---

## 3. Task Management Commands

### 3.1 `task status <task-id>`

**Purpose**: Query status of an asynchronous task

**Usage**:
```bash
deepseek-ocr task status <task-id> [options]
```

**Arguments**:
| Argument | Type | Description |
|----------|------|-------------|
| `<task-id>` | string | Task UUID |

**Options**: None (uses global `--output`)

**Behavior**:
- Query API for task status
- Display current state and progress
- Exit with code 0 if task exists, 1 if not found

**Examples**:
```bash
deepseek-ocr task status 550e8400-e29b-41d4-a716-446655440000
deepseek-ocr task status 550e8400-e29b-41d4-a716-446655440000 -o json
```

**Output** (text):
```
Task: 550e8400-e29b-41d4-a716-446655440000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status:    processing
Progress:  65% (29/45 pages)
Created:   2025-10-31 10:30:00
Started:   2025-10-31 10:30:05
Elapsed:   42s
```

**Output** (JSON):
```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 0.65,
  "createdAt": "2025-10-31T10:30:00.000Z",
  "startedAt": "2025-10-31T10:30:05.000Z",
  "completedAt": null,
  "downloadUrl": null
}
```

---

### 3.2 `task download <task-id>`

**Purpose**: Download result of completed task

**Usage**:
```bash
deepseek-ocr task download <task-id> [options]
```

**Arguments**:
| Argument | Type | Description |
|----------|------|-------------|
| `<task-id>` | string | Task UUID |

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--output-file <path>` | path | auto | Output ZIP path |
| `--no-extract` | flag | false | Don't extract ZIP |

**Behavior**:
- Check task status (must be `completed`)
- Download result ZIP
- Auto-extract if enabled
- Update job history

**Exit Codes**:
- 0: Success
- 1: Task not completed or download failed
- 2: Task not found

**Examples**:
```bash
deepseek-ocr task download 550e8400-e29b-41d4-a716-446655440000
deepseek-ocr task download <task-id> --output-file custom-name.zip
```

**Output**:
```
Task: 550e8400-e29b-41d4-a716-446655440000
Status: completed ✓

Downloading... ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

✓ Downloaded: result_550e8400-e29b-41d4-a716-446655440000.zip
✓ Extracted: result_550e8400-e29b-41d4-a716-446655440000/
```

---

### 3.3 `task list`

**Purpose**: List recent tasks from history

**Usage**:
```bash
deepseek-ocr task list [options]
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--limit <n>` | number | 10 | Max tasks to show |
| `--status <status>` | enum | all | Filter by status |

**Valid Statuses**: `all`, `pending`, `processing`, `completed`, `failed`

**Behavior**:
- Read local job history
- Display recent tasks in table format
- Auto-refresh status for pending/processing tasks

**Examples**:
```bash
deepseek-ocr task list
deepseek-ocr task list --limit 20
deepseek-ocr task list --status completed
```

**Output**:
```
Recent Tasks (last 10):
┌──────────────────────────────────────┬──────────────┬────────────────────┬─────────────────────┐
│ Task ID                              │ Status       │ Input File         │ Submitted           │
├──────────────────────────────────────┼──────────────┼────────────────────┼─────────────────────┤
│ 550e8400...                          │ completed ✓  │ document.pdf       │ 2025-10-31 10:30:00 │
│ 661f9511...                          │ processing   │ large-book.pdf     │ 2025-10-31 11:15:23 │
│ 772fa622...                          │ failed ✗     │ corrupt.pdf        │ 2025-10-31 09:45:12 │
└──────────────────────────────────────┴──────────────┴────────────────────┴─────────────────────┘

Tip: Use `deepseek-ocr task status <task-id>` for details
```

---

## 4. Health Commands

### 4.1 `health`

**Purpose**: Check API service health

**Usage**:
```bash
deepseek-ocr health [options]
```

**Options**: None (uses global `--output`)

**Behavior**:
- Call `/health` endpoint
- Display service status and model readiness
- Exit with code 0 if healthy, 1 if unhealthy

**Examples**:
```bash
deepseek-ocr health
deepseek-ocr health -o json
```

**Output** (healthy):
```
Service Health Check:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status:       ✓ healthy
Model Loaded: ✓ yes
Timestamp:    2025-10-31 12:00:00
Base URL:     http://localhost:8000
```

**Output** (unhealthy):
```
Service Health Check:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status:       ✗ unhealthy
Model Loaded: ✗ no
Timestamp:    2025-10-31 12:00:00
Base URL:     http://localhost:8000

⚠ Service is not ready. Wait a few minutes for model loading.
```

---

### 4.2 `info`

**Purpose**: Display API model information

**Usage**:
```bash
deepseek-ocr info [options]
```

**Options**: None (uses global `--output`)

**Behavior**:
- Call `/api/v1/info` endpoint
- Display model configuration
- Exit with code 0 on success, 1 on error

**Output**:
```
DeepSeek-OCR Model Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Model:          DeepSeek-OCR
Inference:      vllm
Max Concurrency: 100
Version:        1.0.0

Supported Modes:
  • document_markdown - Structured document to Markdown
  • free_ocr - Plain text extraction
  • figure_parse - Chart/figure parsing
  • grounding_ocr - OCR with coordinates
  • custom - Custom prompt-based

Supported Resolutions:
  • Tiny (512×512) - Fastest
  • Small (768×768)
  • Base (1024×1024) - Balanced
  • Large (1280×1280)
  • Gundam (1024×640) - Highest quality
```

---

## 5. Error Responses

All commands follow consistent error format:

**Text Format**:
```
✗ Error: <user-friendly message>
  
  Details: <technical details if --verbose>
  
  Suggestion: <how to fix>
```

**JSON Format**:
```json
{
  "success": false,
  "error": {
    "type": "validation",
    "message": "File not found: nonexistent.jpg",
    "suggestion": "Check the file path and try again"
  }
}
```

---

## Contract Summary

**Total Commands**: 11
- Configuration: 3 (init, show, set)
- OCR: 3 (image, pdf, batch)
- Task Management: 3 (status, download, list)
- Health: 2 (health, info)

**Key Design Principles**:
1. ✅ UNIX philosophy: Single purpose, composable
2. ✅ Sensible defaults from configuration
3. ✅ Both text and JSON output formats
4. ✅ Progress indicators for long operations
5. ✅ Comprehensive help text
6. ✅ Consistent error handling
7. ✅ Proper exit codes

**Contracts Complete** ✅
