# Implementation Plan: DeepSeek-OCR CLI Tool

**Branch**: `001-deepseek-ocr-cli` | **Date**: 2025-10-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-deepseek-ocr-cli/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a complete Node.js CLI tool for calling the DeepSeek-OCR backend API, supporting image OCR, PDF processing, batch operations, task management, and configuration management. The CLI will use Commander.js as the framework, provide intuitive commands following UNIX philosophy, and abstract all API complexity while maintaining power and flexibility. Must support PDF and image recognition with resolution and OCR mode settings.

## Technical Context

**Language/Version**: Node.js >= 18.0.0 (LTS) with JavaScript (ES modules)  
**Primary Dependencies**: Commander.js (CLI framework), axios (HTTP client), conf (config management), cli-progress (progress bars), chalk (colored output)  
**Storage**: Configuration file at OS-appropriate location (e.g., ~/.config/deepseek-ocr/config.yaml), local task history in config directory  
**Testing**: Jest (unit tests), Nock (API mocking)  
**Target Platform**: Cross-platform (Windows, macOS, Linux) command-line tool
**Project Type**: Single standalone CLI application  
**Performance Goals**: Process single image OCR in <30s, batch 50 images in <5 minutes with 3 concurrent workers  
**Constraints**: Must handle API rate limiting gracefully, support files up to 20MB, clean exit on Ctrl+C  
**Scale/Scope**: Single-user local tool, ~10 commands, support for up to 100 concurrent batch operations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: CLI-First Design
- [x] Commands follow UNIX philosophy (composable, single purpose)
- [x] Sensible defaults provided for all required parameters
- [x] Both human-readable and JSON output formats supported
- [x] Progress feedback implemented for long-running operations
- [x] Help text (`--help`) comprehensive and clear

**Validation**: Spec defines clear command structure (image, pdf, batch, task, config) with sensible defaults (document_markdown mode, Gundam resolution). FR-005 requires JSON output support. FR-026 requires progress indicators. FR-002 requires --help for all commands.

### Principle II: API Client Abstraction
- [x] Client module independent of CLI framework
- [x] All HTTP communication centralized in client module
- [x] Client exposes async/await interface
- [x] Request validation occurs before API calls
- [x] Client is unit-testable with mocked responses

**Validation**: Constitution mandates `src/lib/client.js` separation. FR-047 requires local validation before API calls. All OCR operations use async/await pattern per API docs.

### Principle III: Configuration Management
- [x] Config file support implemented (`~/.config/deepseek-ocr/config.yaml`)
- [x] Environment variable support implemented
- [x] Command-line flag overrides supported
- [x] Configuration precedence clearly documented
- [x] No API keys committed to version control (`.gitignore` configured)

**Validation**: FR-006 specifies config file location. FR-007 requires environment variables. FR-008 requires CLI flag overrides. FR-013 prohibits key logging.

### Principle IV: Error Handling & User Feedback
- [x] API errors translated to user-friendly messages
- [x] Appropriate exit codes used (0=success, 1=error, 2=usage error)
- [x] Errors logged to stderr, results to stdout
- [x] Verbose/debug mode implemented (`--verbose` flag)
- [x] Network failures handled with retry logic

**Validation**: FR-045 requires friendly error messages. FR-003 specifies exit codes. FR-004 requires stderr/stdout separation. FR-044 requires --verbose support. FR-046 requires retry logic with exponential backoff.

### Principle V: Asynchronous Operations & Progress
- [x] Progress indicators shown for long operations
- [x] Task submission and polling supported
- [x] Exponential backoff for status polling implemented
- [x] Interruption handling (Ctrl+C) graceful
- [x] Temporary file cleanup on exit/error

**Validation**: FR-026 requires progress display. FR-037-041 define task management. FR-027 specifies exponential backoff polling. FR-028 requires graceful Ctrl+C handling. FR-054 requires cleanup.

### Security & Quality
- [x] API keys never logged or included in error messages
- [x] Input validation prevents directory traversal and injection
- [x] ESLint and Prettier configured
- [x] Unit tests cover API client and core logic (target >80%)
- [x] README includes installation, configuration, usage examples

**Validation**: FR-013 prohibits API key exposure. FR-047 requires input validation. Constitution mandates ESLint/Prettier. Quality standards require >80% coverage. SC-010 ensures 5-minute first-run experience requires good docs.

**GATE STATUS**: ✅ **PASSED** - All constitution principles satisfied by specification

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Node.js CLI Project Structure with Commander.js
deepseek-ocr-cli/
├── bin/
│   └── deepseek-ocr.js          # Executable entry point (#!/usr/bin/env node)
├── src/
│   ├── index.js                 # Main CLI setup with Commander.js
│   ├── commands/                # Command implementations
│   │   ├── config.js            # config init/show/set commands
│   │   ├── image.js             # image OCR command
│   │   ├── pdf.js               # PDF OCR command (sync & async)
│   │   ├── batch.js             # batch processing command
│   │   ├── task.js              # task status/download/list commands
│   │   └── health.js            # health check command
│   ├── lib/
│   │   ├── client.js            # API client (axios-based, constitution principle II)
│   │   ├── config-manager.js    # Configuration manager (principle III)
│   │   ├── progress.js          # Progress bars (cli-progress)
│   │   ├── output.js            # Output formatters (JSON/text, chalk)
│   │   ├── validator.js         # Input validation
│   │   └── utils.js             # Utilities (retry, file handling)
│   └── constants.js             # Constants (modes, resolutions, defaults)
├── tests/
│   ├── unit/                    # Unit tests
│   │   ├── client.test.js       # API client tests with nock
│   │   ├── config-manager.test.js
│   │   └── validator.test.js
│   ├── integration/             # Integration tests
│   │   └── commands.test.js     # Full command flow tests
│   └── fixtures/                # Test data
│       ├── test-image.jpg
│       └── test-pdf.pdf
├── docs/                        # User documentation
│   ├── installation.md
│   ├── usage.md
│   └── troubleshooting.md
├── package.json                 # Dependencies: commander, axios, conf, cli-progress, chalk
├── package-lock.json
├── README.md                    # Quick start + examples
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── .gitignore                   # Excludes node_modules, config files with keys
└── LICENSE
```

**Structure Decision**: 
- **Commander.js** as CLI framework per user requirement, handles argument parsing and subcommands
- **bin/deepseek-ocr.js** as npm executable entry point
- **Modular commands** in `src/commands/` for clean separation
- **API client abstraction** in `src/lib/client.js` enables future reuse (web UI, programmatic API)
- **Configuration precedence**: CLI flags > Environment variables > Config file > Defaults
- **Tests organized** by type with Jest + Nock for HTTP mocking

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations**: All constitution principles are satisfied by the specification and planned implementation.
