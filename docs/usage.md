# Usage Guide

Comprehensive guide to using DeepSeek-OCR CLI for all OCR tasks.

## Table of Contents

- [Configuration](#configuration)
- [Image OCR](#image-ocr)
- [PDF OCR](#pdf-ocr)
- [Batch Processing](#batch-processing)
- [Task Management](#task-management)
- [Health Monitoring](#health-monitoring)
- [Advanced Usage](#advanced-usage)

## Configuration

### Initial Setup

Run the interactive configuration wizard:

```bash
deepseek-ocr config init
```

**Prompts:**
- **API Base URL**: Enter your DeepSeek-OCR API endpoint (e.g., `http://localhost:8000`)
- **API Key**: Enter your authentication key

### View Configuration

```bash
deepseek-ocr config show
```

**Output:**
```
API Settings:
  Base URL: http://localhost:8000
  API Key: sk-1234...abcd (masked)

Defaults:
  Mode: document_markdown
  Resolution: Gundam
  Poll Interval: 2000ms
  Poll Timeout: 600000ms
```

### Update Configuration

```bash
# Change base URL
deepseek-ocr config set api.baseUrl http://api.example.com

# Change default mode
deepseek-ocr config set defaults.mode free_ocr

# Change default resolution
deepseek-ocr config set defaults.resolution Large
```

### Configuration Locations

- **Linux/macOS**: `~/.config/deepseek-ocr/config.json`
- **Windows**: `%APPDATA%\deepseek-ocr\config.json`

### Environment Variables

Override configuration with environment variables:

```bash
# Set API key
export DEEPSEEK_API_KEY=sk-your-key-here

# Set base URL
export DEEPSEEK_BASE_URL=http://api.example.com

# Use in commands
deepseek-ocr image photo.jpg
```

### Priority Order

1. **Command-line flags** (highest)
2. **Environment variables**
3. **Configuration file**
4. **Built-in defaults** (lowest)

## Image OCR

### Basic Usage

Process a single image:

```bash
deepseek-ocr image document.jpg
```

### Supported Formats

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- BMP (`.bmp`)

Maximum file size: **20MB**

### OCR Modes

#### Document Markdown (Default)

Best for structured documents:

```bash
deepseek-ocr image report.png --mode document_markdown
```

**Use cases:**
- Business documents
- Reports
- Forms
- Structured text

#### Free OCR

Plain text extraction:

```bash
deepseek-ocr image screenshot.png --mode free_ocr
```

**Use cases:**
- Screenshots
- Simple text
- Quick extraction

#### Figure Parse

Charts and diagrams:

```bash
deepseek-ocr image chart.png --mode figure_parse
```

**Use cases:**
- Graphs
- Charts
- Diagrams
- Visual data

#### Grounding OCR

OCR with coordinate information:

```bash
deepseek-ocr image form.jpg --mode grounding_ocr
```

**Use cases:**
- Form field extraction
- Layout analysis
- Position-aware extraction

#### Custom Mode

Custom prompt-based extraction:

```bash
deepseek-ocr image invoice.jpg --mode custom --prompt "<image>\nExtract all invoice fields"
```

**Use cases:**
- Specific extraction needs
- Structured data extraction
- Custom formats

### Resolution Presets

```bash
# High quality (recommended)
deepseek-ocr image doc.jpg --resolution Gundam

# Balanced (default)
deepseek-ocr image doc.jpg --resolution Base

# Fast processing
deepseek-ocr image doc.jpg --resolution Tiny
```

| Preset | Size | Speed | Quality |
|--------|------|-------|---------|
| Tiny | 512×512 | Fastest | Lowest |
| Small | 768×768 | Fast | Low |
| Base | 1024×1024 | Medium | Medium |
| Large | 1280×1280 | Slow | High |
| Gundam | 1024×640 dynamic | Slowest | Highest |

### Output Options

#### Text Output (Default)

```bash
deepseek-ocr image doc.jpg
```

**Output:**
```
Image OCR
File: doc.jpg
Mode: document_markdown
Resolution: Gundam

✓ Uploading and processing... 100%

Processing Time: 5.23s
ZIP File: /path/to/doc_result.zip
Extracted Directory: /path/to/doc_result
Result Files: 2

Contents:
  - result.mmd
  - metadata.json
```

#### JSON Output

```bash
deepseek-ocr image doc.jpg --json
```

**Output:**
```json
{
  "success": true,
  "file": "doc.jpg",
  "mode": "document_markdown",
  "resolution": "Gundam",
  "processingTime": "5.23s",
  "zipPath": "/path/to/doc_result.zip",
  "extractedDir": "/path/to/doc_result",
  "contents": ["result.mmd", "metadata.json"]
}
```

### Custom Output Path

```bash
deepseek-ocr image doc.jpg --output-path /path/to/output.zip
```

### Skip Auto-Extraction

```bash
deepseek-ocr image doc.jpg --no-extract
```

## PDF OCR

### Basic Usage

```bash
deepseek-ocr pdf document.pdf
```

### Auto-Detection (Sync vs Async)

The CLI automatically chooses the processing mode:

- **≤10 pages**: Synchronous (immediate results)
- **>10 pages**: Asynchronous (task-based)

### Force Synchronous Mode

For small PDFs, process immediately:

```bash
deepseek-ocr pdf small.pdf --sync
```

**Best for:**
- PDFs with ≤10 pages
- Quick results needed
- Small documents

### Force Asynchronous Mode

For large PDFs, use async processing:

```bash
deepseek-ocr pdf large-book.pdf --async
```

**Best for:**
- PDFs with >10 pages
- Large documents
- Long-running tasks

### PDF-Specific Options

#### Page Limit

Process only first N pages:

```bash
deepseek-ocr pdf book.pdf --max-pages 50
```

Range: 1-100 pages

#### DPI Setting

Set image quality for PDF rendering:

```bash
deepseek-ocr pdf scan.pdf --dpi 300
```

Range: 72-300 DPI
- **72 DPI**: Fast, low quality
- **150 DPI**: Balanced (default)
- **300 DPI**: High quality, slower

### Async Task Handling

#### Wait for Completion

```bash
deepseek-ocr pdf large.pdf --async
```

**Output:**
```
PDF OCR
File: large.pdf
Pages: 50 (async mode selected)

✓ Task created: task_abc123def456
⏳ Waiting for task to complete...
Press Ctrl+C to cancel (task will continue on server)

Processing... 45% [████████░░░░░░░░░░░░]

✓ Task completed successfully!
```

#### Graceful Cancellation

Press **Ctrl+C** to stop waiting:

```
^C
⚠ Cancelled by user
✓ Task continues on server
✓ Use 'deepseek-ocr task status task_abc123def456' to check progress
```

## Batch Processing

### Basic Usage

Process all images in a directory:

```bash
deepseek-ocr batch images/
```

### File Patterns

#### All Supported Files

```bash
deepseek-ocr batch scans/  # All .jpg, .png, .pdf, etc.
```

#### Specific Extensions

```bash
# Only PNG files
deepseek-ocr batch photos/ --pattern "*.png"

# Only JPEG files
deepseek-ocr batch scans/ --pattern "*.jpg"

# Only PDFs
deepseek-ocr batch documents/ --pattern "*.pdf"
```

### Concurrent Workers

Control parallel processing:

```bash
# Default: 3 workers
deepseek-ocr batch images/

# More workers (faster, more API load)
deepseek-ocr batch images/ --workers 10

# Single worker (sequential)
deepseek-ocr batch images/ --workers 1
```

**Recommendations:**
- **3 workers**: Balanced (default)
- **5-10 workers**: Fast processing, good server
- **1 worker**: API rate limits, slow connection

### Output Directory

```bash
# Default: <directory>/results
deepseek-ocr batch images/

# Custom output directory
deepseek-ocr batch images/ --output-dir /path/to/results
```

### Progress Display

```bash
deepseek-ocr batch images/ --workers 3
```

**Output:**
```
Batch OCR Processing
Directory: /path/to/images
Pattern: *
Found 25 valid file(s) to process

[████████████░░░░░░░░] 60% | 15/25 | photo5.jpg | ✓ Success

Batch Processing Complete
Total Files: 25
Successful: 23
Failed: 2
Total Time: 45.67s

Detailed Results:
┌─────────────────┬──────────┬─────────────────────┐
│ File            │ Status   │ Output/Error        │
├─────────────────┼──────────┼─────────────────────┤
│ photo1.jpg      │ ✓ Success│ photo1_result.zip   │
│ photo2.jpg      │ ✓ Success│ photo2_result.zip   │
│ corrupt.jpg     │ ✗ Failed │ File too large      │
...
```

### Error Handling

Batch processing continues even if individual files fail:

```bash
deepseek-ocr batch mixed/
```

**Output:**
```
Skipping 2 invalid file(s):
  - document.txt: Unsupported file format
  - corrupt.jpg: File exceeds 20MB limit

Processing 23 valid files...
```

## Task Management

### Check Task Status

```bash
deepseek-ocr task status task_abc123def456
```

**Output:**
```
Task Status
Task ID: task_abc123def456

Status: processing
Progress: 45%
Submitted: 2025-01-15 10:30:00
Started: 2025-01-15 10:30:05
Completed: Not completed

⏳ Task is still processing. Check again later.
```

### Download Completed Task

```bash
deepseek-ocr task download task_abc123def456
```

**Output:**
```
Task Download
Task ID: task_abc123def456

✓ Downloading result... 100%
✓ Result saved to: ./task_abc123def456_result.zip
✓ Extracting result files...
✓ Extracted to: ./task_abc123def456_result

ZIP File: ./task_abc123def456_result.zip
Extracted Directory: ./task_abc123def456_result
```

### Wait and Auto-Download

```bash
deepseek-ocr task wait task_abc123def456
```

Waits for task completion and automatically downloads result.

### List Recent Tasks

```bash
deepseek-ocr task list
```

**Output:**
```
Task History
Showing 5 task(s) from the last 7 days

┌──────────────────────┬───────────┬────────────┬─────────────────────┐
│ Task ID              │ Status    │ Input File │ Submitted           │
├──────────────────────┼───────────┼────────────┼─────────────────────┤
│ task_abc123def456    │ completed │ book.pdf   │ 1/15/2025, 10:30 AM │
│ task_xyz789ghi012    │ pending   │ scan.pdf   │ 1/15/2025, 11:00 AM │
...
```

## Health Monitoring

### Check Service Health

```bash
deepseek-ocr health check
```

**Output:**
```
Service Health Check

Service Status: ✓ healthy
Model Loaded: ✓ Yes
Response Time: 127ms
Timestamp: 2025-01-15T10:30:00.000Z

✓ Service is healthy and ready to process requests
```

### Get Model Information

```bash
deepseek-ocr health info
```

**Output:**
```
Model Information

Model Name: DeepSeek-OCR-v1
Version: 1.0.0

Supported Modes:
  - document_markdown
  - free_ocr
  - figure_parse
  - grounding_ocr
  - custom

Supported Resolutions:
  - Tiny
  - Small
  - Base
  - Large
  - Gundam
```

### Verbose Output

```bash
deepseek-ocr health check --verbose
```

Shows detailed connection information and headers.

## Advanced Usage

### Override API Credentials

```bash
# Use different API key
deepseek-ocr image doc.jpg --api-key sk-different-key

# Use different base URL
deepseek-ocr image doc.jpg --base-url http://other-server.com
```

### Combine Options

```bash
deepseek-ocr image invoice.jpg \
  --mode custom \
  --prompt "<image>\nExtract all fields" \
  --resolution Gundam \
  --output-path results/invoice.zip \
  --json
```

### Scripting

Use in shell scripts:

```bash
#!/bin/bash

# Process all invoices
for file in invoices/*.jpg; do
  echo "Processing $file..."
  deepseek-ocr image "$file" \
    --mode document_markdown \
    --output-path "results/$(basename "$file" .jpg).zip"
done

echo "All invoices processed!"
```

### JSON Parsing

Parse JSON output in scripts:

```bash
# Using jq
result=$(deepseek-ocr image doc.jpg --json)
status=$(echo "$result" | jq -r '.success')

if [ "$status" = "true" ]; then
  echo "Success!"
  path=$(echo "$result" | jq -r '.zipPath')
  echo "Result: $path"
fi
```

### Error Handling in Scripts

```bash
#!/bin/bash

# Process with error handling
if deepseek-ocr image document.jpg --json > result.json 2> error.log; then
  echo "✓ OCR successful"
  cat result.json
else
  echo "✗ OCR failed"
  cat error.log
  exit 1
fi
```

## Common Workflows

### Workflow 1: Process Scanned Documents

```bash
# 1. Check service is ready
deepseek-ocr health check

# 2. Process all scans in directory
deepseek-ocr batch scans/ \
  --mode document_markdown \
  --resolution Gundam \
  --workers 5 \
  --output-dir processed/

# 3. Review results
ls processed/
```

### Workflow 2: Large Book Digitization

```bash
# 1. Submit async task
deepseek-ocr pdf large-book.pdf \
  --async \
  --max-pages 100 \
  --dpi 300

# Output: Task ID: task_abc123

# 2. Check status periodically
deepseek-ocr task status task_abc123

# 3. Download when complete
deepseek-ocr task download task_abc123
```

### Workflow 3: Invoice Processing

```bash
# Process invoices with custom extraction
for invoice in invoices/*.jpg; do
  deepseek-ocr image "$invoice" \
    --mode custom \
    --prompt "<image>\nExtract: invoice number, date, total, vendor" \
    --resolution Gundam \
    --json > "results/$(basename "$invoice" .jpg).json"
done
```

## Tips and Best Practices

### Performance

1. **Use appropriate resolution**: `Gundam` for quality, `Tiny` for speed
2. **Batch processing**: Use `--workers` based on API capacity
3. **Async for large files**: PDFs >10 pages

### Quality

1. **High DPI for scans**: Use `--dpi 300` for scanned PDFs
2. **Gundam resolution**: Best quality for important documents
3. **Custom prompts**: Specific extraction needs

### Error Prevention

1. **Check file size**: Keep under 20MB
2. **Validate format**: Use supported formats only
3. **Test connection**: Run `health check` first

## Next Steps

- 📖 Read [Troubleshooting Guide](troubleshooting.md) for common issues
- 🔧 Explore [Configuration Options](../README.md#configuration)
- 💡 Check [Examples](../README.md#examples) for more use cases

