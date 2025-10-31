# Quick Start Guide: DeepSeek-OCR CLI

**Purpose**: Get developers up and running in 5 minutes  
**Audience**: Developers setting up the CLI for the first time  
**Date**: 2025-10-31

---

## Prerequisites

- Node.js >= 18.0.0 (LTS)
- npm or yarn
- Access to DeepSeek-OCR API (running or remote)
- API key

**Check Node.js version**:
```bash
node --version  # Should be v18.0.0 or higher
```

---

## Installation

### Option 1: Global Install (Recommended for End Users)

```bash
npm install -g deepseek-ocr-cli

# Verify installation
deepseek-ocr --version
```

### Option 2: Local Project Install

```bash
npm install deepseek-ocr-cli

# Run via npx
npx deepseek-ocr --version
```

### Option 3: From Source (Development)

```bash
# Clone repository
git clone https://github.com/yourusername/deepseek-ocr-cli.git
cd deepseek-ocr-cli

# Install dependencies
npm install

# Link for global usage
npm link

# Verify
deepseek-ocr --version
```

---

## Configuration

### Step 1: Initialize Configuration

Run the interactive setup:

```bash
deepseek-ocr config init
```

**Prompts**:
```
? API Base URL: (http://localhost:8000) 
? API Key: ****************************************
```

**Output**:
```
✓ Configuration saved to: /home/user/.config/deepseek-ocr/config.json
✓ API key validated successfully
```

### Step 2: Verify Configuration

```bash
deepseek-ocr config show
```

**Expected Output**:
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

### Step 3: Test Connection

```bash
deepseek-ocr health
```

**Expected Output** (if service is healthy):
```
Service Health Check:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status:       ✓ healthy
Model Loaded: ✓ yes
Timestamp:    2025-10-31 12:00:00
Base URL:     http://localhost:8000
```

---

## Your First OCR

### Example 1: Process a Single Image

**Prepare a test image** (e.g., `document.jpg`)

**Run OCR**:
```bash
deepseek-ocr image document.jpg
```

**Expected Output**:
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
```

**Check Results**:
```bash
ls -la document_result/
```

**Output**:
```
total 24
drwxr-xr-x 3 user user 4096 Oct 31 12:00 .
drwxr-xr-x 4 user user 4096 Oct 31 12:00 ..
-rw-r--r-- 1 user user 1234 Oct 31 12:00 result.mmd
-rw-r--r-- 1 user user 3456 Oct 31 12:00 result_ori.mmd
-rw-r--r-- 1 user user  256 Oct 31 12:00 metadata.json
drwxr-xr-x 2 user user 4096 Oct 31 12:00 images
```

**View Markdown Result**:
```bash
cat document_result/result.mmd
```

---

### Example 2: Process a PDF (Automatic Mode)

**Small PDF** (≤10 pages, synchronous):
```bash
deepseek-ocr pdf small-document.pdf
```

**Large PDF** (>10 pages, asynchronous):
```bash
deepseek-ocr pdf large-book.pdf
```

**Expected Output** (async):
```
Processing: large-book.pdf (45 pages)
Mode: document_markdown | Resolution: Gundam
Strategy: Asynchronous (>10 pages)

✓ Task submitted: 550e8400-e29b-41d4-a716-446655440000
⏳ Waiting for completion...

Processing ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% | 45/45 pages

✓ Task completed!
Downloading... ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

✓ Success!
  Result: large-book_result.zip
  Extracted: large-book_result/
  Processing time: 67.2s
```

---

### Example 3: Batch Process Multiple Images

**Prepare a directory** with multiple images:
```
images/
├── scan001.jpg
├── scan002.jpg
├── scan003.png
└── scan004.jpg
```

**Run batch processing**:
```bash
deepseek-ocr batch images/
```

**Expected Output**:
```
Scanning: images/
Found 4 images matching *.{jpg,png}

Processing with 3 workers...
Overall Progress ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% | 4/4 files

Batch Processing Results:
┌─────────────────┬────────┬─────────────────────────┐
│ File            │ Status │ Result                  │
├─────────────────┼────────┼─────────────────────────┤
│ scan001.jpg     │ ✓      │ scan001_result.zip      │
│ scan002.jpg     │ ✓      │ scan002_result.zip      │
│ scan003.png     │ ✓      │ scan003_result.zip      │
│ scan004.jpg     │ ✓      │ scan004_result.zip      │
└─────────────────┴────────┴─────────────────────────┘

Summary:
  ✓ Successful: 4/4 (100%)
  Total time: 12s
  
Results saved to: images/results/
```

---

## Common Operations

### Change OCR Mode

```bash
# Free text OCR (no layout preservation)
deepseek-ocr image document.jpg --mode free_ocr

# OCR with coordinate information
deepseek-ocr image form.jpg --mode grounding_ocr

# Chart/figure parsing
deepseek-ocr image chart.png --mode figure_parse
```

### Change Resolution

```bash
# Fast preview (lowest quality)
deepseek-ocr image scan.jpg --resolution Tiny

# Highest quality (slowest)
deepseek-ocr image important-doc.jpg --resolution Gundam
```

### Custom Output Path

```bash
deepseek-ocr image doc.jpg --output-file custom-name.zip
```

### JSON Output (for automation)

```bash
deepseek-ocr image doc.jpg -o json > result.json
```

---

## Task Management

### Check Task Status

If you interrupted an async operation or want to check progress:

```bash
deepseek-ocr task status <task-id>
```

**Example**:
```bash
deepseek-ocr task status 550e8400-e29b-41d4-a716-446655440000
```

### Download Completed Task

```bash
deepseek-ocr task download <task-id>
```

### List Recent Tasks

```bash
deepseek-ocr task list
```

**Output**:
```
Recent Tasks (last 10):
┌──────────────────────────────────────┬────────────┬──────────────┬─────────────────────┐
│ Task ID                              │ Status     │ Input File   │ Submitted           │
├──────────────────────────────────────┼────────────┼──────────────┼─────────────────────┤
│ 550e8400...                          │ completed  │ document.pdf │ 2025-10-31 10:30:00 │
│ 661f9511...                          │ processing │ book.pdf     │ 2025-10-31 11:15:23 │
└──────────────────────────────────────┴────────────┴──────────────┴─────────────────────┘
```

---

## Troubleshooting

### Issue: "Missing API Key"

**Error**:
```
✗ Error: API key not configured
  
  Run: deepseek-ocr config init
```

**Solution**:
Run `deepseek-ocr config init` to set up configuration.

---

### Issue: "Service not ready"

**Error**:
```
✗ Error: Model not ready
  
  Details: Service responded with status=unhealthy, model_loaded=false
  
  Suggestion: Wait a few minutes for model loading. Check: http://localhost:8000/health
```

**Solution**:
1. Check service is running: `curl http://localhost:8000/health`
2. Wait 1-2 minutes for model to load
3. Verify with: `deepseek-ocr health`

---

### Issue: "File too large"

**Error**:
```
✗ Error: File too large: 25165824 bytes (max 20971520)
  
  Suggestion: Compress the file or split the PDF into smaller parts
```

**Solution**:
1. **For images**: Compress with ImageMagick
   ```bash
   convert large.jpg -quality 85 -resize 2000x2000 compressed.jpg
   ```

2. **For PDFs**: Split into smaller files
   ```bash
   pdftk large.pdf burst
   ```

---

### Issue: "Invalid mode"

**Error**:
```
✗ Error: Invalid mode: unknown_mode
  
  Supported modes: document_markdown, free_ocr, figure_parse, grounding_ocr, custom
```

**Solution**:
Use one of the supported modes. Check available modes:
```bash
deepseek-ocr info
```

---

## Next Steps

### 1. Explore All Commands

```bash
deepseek-ocr --help
deepseek-ocr image --help
deepseek-ocr pdf --help
deepseek-ocr batch --help
```

### 2. Customize Defaults

Change default OCR mode:
```bash
deepseek-ocr config set defaults.mode free_ocr
```

Change default resolution:
```bash
deepseek-ocr config set defaults.resolution Base
```

### 3. Integrate with Scripts

**Example Bash Script**:
```bash
#!/bin/bash
# process-scans.sh

for file in scans/*.jpg; do
    echo "Processing: $file"
    deepseek-ocr image "$file" -o json > "${file%.jpg}.json"
done

echo "All scans processed!"
```

**Example Python Script**:
```python
import subprocess
import json

def ocr_image(image_path):
    result = subprocess.run(
        ['deepseek-ocr', 'image', image_path, '-o', 'json'],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

# Usage
result = ocr_image('document.jpg')
print(f"Processing time: {result['processingTime']}s")
```

---

## Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `deepseek-ocr config init` | Set up configuration |
| `deepseek-ocr config show` | View current settings |
| `deepseek-ocr health` | Check service status |
| `deepseek-ocr image <file>` | OCR single image |
| `deepseek-ocr pdf <file>` | OCR PDF document |
| `deepseek-ocr batch <dir>` | Batch process images |
| `deepseek-ocr task status <id>` | Check task status |
| `deepseek-ocr task list` | List recent tasks |

### Common Options

| Option | Description |
|--------|-------------|
| `-m, --mode <mode>` | OCR mode |
| `-r, --resolution <preset>` | Resolution preset |
| `-o, --output json` | JSON output format |
| `-v, --verbose` | Verbose logging |
| `--no-extract` | Don't auto-extract ZIP |

---

## Getting Help

- **CLI Help**: `deepseek-ocr --help`
- **Command Help**: `deepseek-ocr <command> --help`
- **Model Info**: `deepseek-ocr info`
- **Service Status**: `deepseek-ocr health`

---

**Quick Start Complete!** 🎉

You're now ready to use DeepSeek-OCR CLI. For advanced usage, see the full documentation.
