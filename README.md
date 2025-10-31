# DeepSeek-OCR CLI

[![npm version](https://img.shields.io/npm/v/deepseek-ocr-cli.svg)](https://www.npmjs.com/package/deepseek-ocr-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/deepseek-ocr-cli.svg)](https://nodejs.org)

Command-line tool for performing OCR (Optical Character Recognition) on images and PDFs using the DeepSeek-OCR API.

## Features

- 🖼️ **Image OCR**: Process single images (JPEG, PNG, WEBP, BMP)
- 📄 **PDF OCR**: Process PDF documents with automatic sync/async handling
- 📦 **Batch Processing**: Process multiple files concurrently
- ⚙️ **Configuration Management**: Store API credentials and preferences securely
- 📊 **Progress Tracking**: Real-time progress bars for long-running operations
- 🎯 **Multiple OCR Modes**: Document markdown, free OCR, figure parsing, grounding OCR, custom prompts
- 🎨 **Flexible Output**: Human-readable text or JSON format
- 🔄 **Task Management**: Monitor and download asynchronous tasks
- 💻 **Cross-platform**: Works on Windows, macOS, and Linux

## Prerequisites

- Node.js >= 18.0.0 (LTS)
- Access to DeepSeek-OCR API
- API key

## Installation

### Global Installation (Recommended)

```bash
npm install -g deepseek-ocr-cli
```

### Local Installation

```bash
npm install deepseek-ocr-cli
```

### From Source

```bash
git clone https://github.com/yourusername/deepseek-ocr-cli.git
cd deepseek-ocr-cli
npm install
npm link
```

## Quick Start

### 1. Configure API Credentials

```bash
deepseek-ocr config init
```

You'll be prompted for:
- API Base URL (default: http://localhost:8000)
- API Key

### 2. Verify Setup

```bash
deepseek-ocr health
```

### 3. Process Your First Image

```bash
deepseek-ocr image document.jpg
```

## Usage

### Configuration

```bash
# Initialize configuration interactively
deepseek-ocr config init

# Show current configuration
deepseek-ocr config show

# Set individual values
deepseek-ocr config set api.baseUrl http://api.example.com
deepseek-ocr config set defaults.mode free_ocr
```

### Image OCR

```bash
# Basic usage
deepseek-ocr image photo.jpg

# Specify mode and resolution
deepseek-ocr image scan.png --mode grounding_ocr --resolution Gundam

# Custom output path
deepseek-ocr image doc.jpg --output-file result.zip

# JSON output
deepseek-ocr image chart.png -o json
```

### PDF OCR

```bash
# Automatic sync/async selection
deepseek-ocr pdf document.pdf

# Force synchronous mode (small PDFs)
deepseek-ocr pdf small.pdf --sync

# Force asynchronous mode with options
deepseek-ocr pdf large-book.pdf --async --max-pages 50 --dpi 300
```

### Batch Processing

```bash
# Process all images in directory
deepseek-ocr batch images/

# Custom pattern and workers
deepseek-ocr batch scans/ --pattern "*.png" --workers 5

# Specify output directory
deepseek-ocr batch photos/ --output-dir processed/
```

### Task Management

```bash
# Check task status
deepseek-ocr task status <task-id>

# Download completed task
deepseek-ocr task download <task-id>

# List recent tasks
deepseek-ocr task list
```

### Service Health

```bash
# Check API service health
deepseek-ocr health

# Get model information
deepseek-ocr info
```

## OCR Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `document_markdown` | Structured document to Markdown with layout | Documents, reports (default) |
| `free_ocr` | Plain text extraction | Simple text extraction |
| `figure_parse` | Chart and figure parsing | Graphs, diagrams |
| `grounding_ocr` | OCR with coordinate information | When position data needed |
| `custom` | Custom prompt-based | Specific extraction needs |

## Resolution Presets

| Preset | Size | Speed | Quality | Use Case |
|--------|------|-------|---------|----------|
| `Tiny` | 512×512 | ⚡⚡⚡⚡⚡ | ⭐ | Quick preview |
| `Small` | 768×768 | ⚡⚡⚡⚡ | ⭐⭐ | Low-res images |
| `Base` | 1024×1024 | ⚡⚡⚡ | ⭐⭐⭐ | Balanced (default) |
| `Large` | 1280×1280 | ⚡⚡ | ⭐⭐⭐⭐ | High-res documents |
| `Gundam` | 1024×640 dynamic | ⚡ | ⭐⭐⭐⭐⭐ | Best quality |

## Configuration

Configuration is stored at:
- Linux/macOS: `~/.config/deepseek-ocr/config.json`
- Windows: `%APPDATA%\deepseek-ocr\config.json`

### Configuration Precedence

1. Command-line flags (highest priority)
2. Environment variables
3. Configuration file
4. Built-in defaults (lowest priority)

### Environment Variables

```bash
export DEEPSEEK_BASE_URL=http://api.example.com
export DEEPSEEK_API_KEY=your-api-key-here
```

## Examples

### Extract Text from Invoice

```bash
deepseek-ocr image invoice.jpg --mode document_markdown --resolution Gundam
```

### Process Scanned Book

```bash
deepseek-ocr pdf book.pdf --mode document_markdown --dpi 300
```

### Batch Process Screenshots

```bash
deepseek-ocr batch screenshots/ --mode free_ocr --workers 5
```

### Custom Extraction

```bash
deepseek-ocr image form.jpg --mode custom --prompt "<image>\nExtract all form fields as JSON"
```

## Troubleshooting

### "Missing API Key" Error

Run configuration setup:
```bash
deepseek-ocr config init
```

### "Service not ready" Error

Wait for model to load (1-2 minutes), then verify:
```bash
deepseek-ocr health
```

### "File too large" Error

Compress images or split large PDFs:
```bash
# Compress image
convert large.jpg -quality 85 -resize 2000x2000 compressed.jpg

# Split PDF
pdftk large.pdf burst
```

## Development

### Setup

```bash
git clone https://github.com/yourusername/deepseek-ocr-cli.git
cd deepseek-ocr-cli
npm install
```

### Run Tests

```bash
npm test
npm run test:coverage
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

```bash
npm run format
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Full Documentation](docs/)
- 🐛 [Report Issues](https://github.com/yourusername/deepseek-ocr-cli/issues)
- 💬 [Discussions](https://github.com/yourusername/deepseek-ocr-cli/discussions)

## Acknowledgments

- Built for the [DeepSeek-OCR](https://github.com/deepseek-ai/DeepSeek-OCR) API
- Powered by [Commander.js](https://github.com/tj/commander.js/), [Axios](https://axios-http.com/), and other great open-source libraries
