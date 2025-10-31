# Feature Specification: DeepSeek-OCR CLI Tool

**Feature Branch**: `001-deepseek-ocr-cli`  
**Created**: 2025-10-31  
**Status**: Draft  
**Input**: User description: "构建完整的Node.js CLI工具，用于调用DeepSeek-OCR后端API，支持图像OCR、PDF处理、批量操作、任务管理和配置管理"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Image OCR (Priority: P1)

As a developer, I need to quickly perform OCR on a single image and view the results immediately, so I can extract text from screenshots, scanned documents, or photos without writing code.

**Why this priority**: This is the most fundamental and frequently used feature. It provides immediate value and allows users to verify the tool works correctly. It's the foundation for all other features.

**Independent Test**: Can be fully tested by running a single command with an image file and verifying Markdown output is generated. Delivers immediate OCR capability without any setup beyond API key configuration.

**Acceptance Scenarios**:

1. **Given** I have an image file on my computer, **When** I run `deepseek-ocr image photo.jpg`, **Then** the tool processes the image and saves the OCR result as a ZIP file with Markdown content
2. **Given** I have configured my API key, **When** I run `deepseek-ocr image document.png --mode document_markdown`, **Then** the tool returns formatted Markdown preserving the document layout
3. **Given** I want higher quality results, **When** I run `deepseek-ocr image scan.jpg --resolution Gundam`, **Then** the tool processes using the highest quality settings
4. **Given** I want JSON output for automation, **When** I run `deepseek-ocr image photo.jpg --output json`, **Then** the tool outputs results in machine-readable JSON format
5. **Given** processing fails due to network error, **When** the tool encounters the error, **Then** it displays a clear error message and suggests retry

---

### User Story 2 - Configuration Management (Priority: P1)

As a user, I need to securely store and manage my API credentials and preferences, so I don't have to provide them with every command and can use the tool across different environments.

**Why this priority**: Essential infrastructure for usability. Without easy configuration, users must pass API keys with every command, leading to security risks and poor user experience. This is a prerequisite for comfortable tool usage.

**Independent Test**: Can be fully tested by running config commands without any OCR operations. Delivers secure credential storage and preference management independently.

**Acceptance Scenarios**:

1. **Given** I'm using the tool for the first time, **When** I run `deepseek-ocr config init`, **Then** the tool prompts me interactively for API key and base URL, then saves them securely
2. **Given** I have multiple API keys for different environments, **When** I set environment variable `DEEPSEEK_API_KEY`, **Then** it overrides the config file setting for that session
3. **Given** I want to verify my configuration, **When** I run `deepseek-ocr config show`, **Then** the tool displays all settings with API key partially masked for security
4. **Given** I want to change default OCR mode, **When** I run `deepseek-ocr config set defaults.mode free_ocr`, **Then** subsequent commands use this as default unless overridden
5. **Given** the config file doesn't exist, **When** I run any OCR command, **Then** the tool prompts me to run `config init` first with clear instructions

---

### User Story 3 - PDF Document Processing (Priority: P2)

As a researcher or document processor, I need to OCR multi-page PDF documents and track progress, so I can digitize reports, papers, and books efficiently even for large files.

**Why this priority**: High-value feature for document processing use cases. While not as frequent as single images, PDF processing is a key differentiator and handles professional workflows.

**Independent Test**: Can be fully tested by processing PDF files of various sizes and verifying complete Markdown output with page separators. Delivers document digitization capability independently.

**Acceptance Scenarios**:

1. **Given** I have a small PDF (≤10 pages), **When** I run `deepseek-ocr pdf report.pdf`, **Then** the tool processes it synchronously and returns results immediately
2. **Given** I have a large PDF (>10 pages), **When** I run `deepseek-ocr pdf book.pdf`, **Then** the tool automatically submits it as an async task and polls for completion with progress updates
3. **Given** PDF processing is in progress, **When** I view the progress, **Then** the tool displays a progress bar showing percentage complete
4. **Given** I want to limit pages processed, **When** I run `deepseek-ocr pdf document.pdf --max-pages 20`, **Then** the tool only processes the first 20 pages
5. **Given** I want to interrupt a long-running task, **When** I press Ctrl+C, **Then** the tool gracefully exits with clear message about task continuing in background

---

### User Story 4 - Batch Processing (Priority: P2)

As a user with many files to process, I need to batch process multiple images or PDFs concurrently, so I can efficiently handle large volumes of documents without running commands manually one by one.

**Why this priority**: Critical for productivity when dealing with multiple files. Enables professional-scale usage and automation scenarios.

**Independent Test**: Can be fully tested by processing a directory of multiple files and verifying all results are generated. Delivers bulk processing capability independently.

**Acceptance Scenarios**:

1. **Given** I have a directory with multiple images, **When** I run `deepseek-ocr batch images/`, **Then** the tool processes all images concurrently and saves individual result files
2. **Given** I want to control concurrency, **When** I run `deepseek-ocr batch scans/ --workers 5`, **Then** the tool processes up to 5 files in parallel
3. **Given** some files fail during batch processing, **When** processing completes, **Then** the tool shows a summary table with success/failure status for each file
4. **Given** I want to process specific file types, **When** I run `deepseek-ocr batch docs/ --pattern "*.png"`, **Then** the tool only processes PNG files
5. **Given** batch processing is underway, **When** I view progress, **Then** the tool displays overall progress (e.g., "Processing 15/50 files")

---

### User Story 5 - Task Management (Priority: P3)

As a user managing long-running operations, I need to check status of previously submitted tasks and download their results, so I can work asynchronously and retrieve results later.

**Why this priority**: Enhances async workflow but less frequently used than direct processing. Valuable for advanced users and automation scenarios.

**Independent Test**: Can be fully tested by submitting tasks via API and then using CLI to check status and download. Delivers task lifecycle management independently.

**Acceptance Scenarios**:

1. **Given** I have a task ID from a previous async operation, **When** I run `deepseek-ocr task status <task-id>`, **Then** the tool displays current status, progress, and timestamps
2. **Given** a task has completed, **When** I run `deepseek-ocr task download <task-id>`, **Then** the tool downloads the result ZIP file
3. **Given** I want to see all my recent tasks, **When** I run `deepseek-ocr task list`, **Then** the tool displays a table of recent tasks with status
4. **Given** I want to wait for a specific task, **When** I run `deepseek-ocr task wait <task-id>`, **Then** the tool polls and automatically downloads when complete
5. **Given** a task has failed, **When** I check its status, **Then** the tool displays the error message and suggests troubleshooting steps

---

### User Story 6 - Service Health Monitoring (Priority: P3)

As a user or system administrator, I need to check if the OCR service is available and properly configured, so I can troubleshoot connection issues and verify setup.

**Why this priority**: Diagnostic feature primarily for troubleshooting. Important for setup and debugging but not core workflow.

**Independent Test**: Can be fully tested by running health commands against API without any OCR processing. Delivers service verification capability independently.

**Acceptance Scenarios**:

1. **Given** the service is running, **When** I run `deepseek-ocr health`, **Then** the tool displays service status and model loaded state
2. **Given** I want detailed service information, **When** I run `deepseek-ocr info`, **Then** the tool displays model name, supported modes, resolutions, and version
3. **Given** the service is unreachable, **When** I run `deepseek-ocr health`, **Then** the tool displays connection error with troubleshooting suggestions
4. **Given** I'm debugging configuration, **When** I run `deepseek-ocr health --verbose`, **Then** the tool shows detailed connection information including base URL used

---

### Edge Cases

- **What happens when the image file is corrupted or in an unsupported format?**
  - Tool validates file format before upload, displays clear error message listing supported formats (JPEG, PNG, WEBP, BMP)
  
- **What happens when the file size exceeds API limits?**
  - Tool checks file size locally before upload, displays error with current limit and suggests compression or splitting

- **What happens when API key is invalid or expired?**
  - Tool receives 401 error, displays message to check API key with instructions to run `config init`

- **What happens when network connection is lost during processing?**
  - Tool implements retry logic (exponential backoff) for sync operations
  - For async operations, task continues on server; tool can reconnect and check status later

- **What happens when the config file is corrupted?**
  - Tool catches parsing errors, displays warning, and falls back to environment variables or prompts for reinitialization

- **What happens when output file already exists?**
  - Tool prompts for confirmation to overwrite or suggests alternative filename with timestamp

- **What happens when user interrupts (Ctrl+C) during processing?**
  - Sync operations: Clean cancellation with partial results saved if possible
  - Async operations: Graceful exit with message that task continues on server

- **What happens when the ZIP result file is corrupted?**
  - Tool validates ZIP integrity after download, displays error and offers retry option

## Requirements *(mandatory)*

### Functional Requirements

**Core CLI Operations:**

- **FR-001**: System MUST provide a command-line interface accessible via `deepseek-ocr` command after installation
- **FR-002**: System MUST support all commands with `--help` flag showing usage, options, and examples
- **FR-003**: System MUST use appropriate exit codes (0 for success, 1 for errors, 2 for usage errors)
- **FR-004**: System MUST output errors to stderr and results to stdout following UNIX conventions
- **FR-005**: System MUST support both human-readable and JSON output formats via `--output` flag

**Configuration Management:**

- **FR-006**: System MUST support configuration file at `~/.config/deepseek-ocr/config.yaml` (or OS-appropriate location)
- **FR-007**: System MUST support environment variables `DEEPSEEK_API_KEY` and `DEEPSEEK_BASE_URL`
- **FR-008**: System MUST support command-line flags that override environment variables and config file
- **FR-009**: System MUST provide `config init` command for interactive configuration setup
- **FR-010**: System MUST provide `config show` command displaying current configuration with masked API keys
- **FR-011**: System MUST provide `config set <key> <value>` command for updating individual settings
- **FR-012**: System MUST validate API key format and connectivity when saving configuration
- **FR-013**: System MUST never log, display, or commit full API keys to files tracked by version control

**Image OCR:**

- **FR-014**: System MUST support `image` command accepting file path as required argument
- **FR-015**: System MUST support all 5 OCR modes: document_markdown, free_ocr, figure_parse, grounding_ocr, custom
- **FR-016**: System MUST support all 5 resolution presets: Tiny, Small, Base, Large, Gundam
- **FR-017**: System MUST support custom prompts via `--prompt` flag when mode is custom
- **FR-018**: System MUST support `--output` flag to specify result file path (default: auto-generated name)
- **FR-019**: System MUST auto-extract ZIP results by default with option to disable via `--no-extract`
- **FR-020**: System MUST validate image file exists and format is supported before upload

**PDF Processing:**

- **FR-021**: System MUST support `pdf` command accepting file path as required argument
- **FR-022**: System MUST automatically choose sync or async mode based on file size (default threshold: 10 pages)
- **FR-023**: System MUST support `--sync` flag to force synchronous processing for small PDFs
- **FR-024**: System MUST support `--max-pages` flag to limit number of pages processed
- **FR-025**: System MUST support `--dpi` flag to control PDF rendering quality (default: 144)
- **FR-026**: System MUST display progress indicator (progress bar or spinner) during processing
- **FR-027**: System MUST implement polling with exponential backoff for async operations (start: 2s, max: 30s)
- **FR-028**: System MUST handle Ctrl+C gracefully, allowing users to exit while preserving background task

**Batch Processing:**

- **FR-029**: System MUST support `batch` command accepting directory path as required argument
- **FR-030**: System MUST support `--pattern` flag for file filtering (default: all supported image formats)
- **FR-031**: System MUST support `--workers` flag to control concurrency (default: 3)
- **FR-032**: System MUST process files concurrently up to worker limit
- **FR-033**: System MUST display overall progress showing completed/total files
- **FR-034**: System MUST generate summary table showing success/failure status for each file
- **FR-035**: System MUST continue processing remaining files if individual files fail
- **FR-036**: System MUST save results to `results/` subdirectory within source directory

**Task Management:**

- **FR-037**: System MUST support `task status <task-id>` command to query task state
- **FR-038**: System MUST support `task download <task-id>` command to retrieve completed results
- **FR-039**: System MUST support `task wait <task-id>` command to poll until completion then auto-download
- **FR-040**: System MUST support `task list` command to display recent tasks (requires local history tracking)
- **FR-041**: System MUST display task information including status, progress, timestamps, and error if failed

**Service Monitoring:**

- **FR-042**: System MUST support `health` command to check service availability and model status
- **FR-043**: System MUST support `info` command to display model configuration and supported options
- **FR-044**: System MUST support `--verbose` flag on all commands for detailed logging

**Error Handling:**

- **FR-045**: System MUST catch all API errors and translate to user-friendly messages
- **FR-046**: System MUST implement retry logic with exponential backoff for network failures (max 3 retries)
- **FR-047**: System MUST validate all inputs locally before API calls (file existence, format, size)
- **FR-048**: System MUST provide actionable error messages with suggestions for resolution
- **FR-049**: System MUST log detailed error information when `--verbose` flag is used

**Output & Results:**

- **FR-050**: System MUST download ZIP results from API
- **FR-051**: System MUST auto-extract ZIP contents to directory by default
- **FR-052**: System MUST preserve all files from ZIP including Markdown, metadata, and extracted images
- **FR-053**: System MUST support displaying extracted Markdown content directly in terminal when requested
- **FR-054**: System MUST clean up temporary files after successful operations

### Key Entities

- **Configuration**: User settings including API credentials (base_url, api_key), default preferences (mode, resolution, output_dir), and behavior flags (auto_extract, show_progress, max_retries)

- **Task**: Asynchronous operation state including task_id, status (pending/processing/completed/failed), progress percentage, timestamps (created_at, started_at, completed_at), and error details if failed

- **OCRResult**: Processed output containing Markdown content, original output with coordinates, metadata (processing time, mode, resolution), extracted images, and visualization files

- **JobHistory**: Local record of submitted tasks for tracking including task_id, input_file, mode, submission_time, and final_status (for `task list` command)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can process a single image and view results in under 30 seconds (including API processing time)

- **SC-002**: Users can complete initial setup (API key configuration) in under 2 minutes using `config init` command

- **SC-003**: 95% of common operations (image OCR, PDF processing) succeed on first attempt without errors

- **SC-004**: Users can process 50 images in batch mode in under 5 minutes (with default concurrency)

- **SC-005**: CLI provides clear actionable error messages with resolution steps for 100% of common error scenarios (invalid API key, network failure, file not found, unsupported format)

- **SC-006**: Users can interrupt any long-running operation (Ctrl+C) and resume or check status later without data loss

- **SC-007**: All commands execute with zero security warnings (no API keys in logs, proper file permissions on config)

- **SC-008**: Users report 90% satisfaction with CLI usability in initial testing (based on help text clarity, command intuitiveness, error message quality)

- **SC-009**: Tool handles API rate limiting and network timeouts gracefully with automatic retry, succeeding within 3 retry attempts for 95% of transient failures

- **SC-010**: Installation and first successful OCR operation completed in under 5 minutes by new users following documentation

## Assumptions

1. **Node.js Environment**: Users have Node.js 18+ installed (specified in documentation as prerequisite)

2. **API Availability**: DeepSeek-OCR API is accessible and properly configured before CLI tool usage

3. **File System Access**: Users have read permission for input files and write permission for output directory

4. **Network Connectivity**: Stable internet connection available for API communication (retry logic handles transient failures)

5. **Default OCR Mode**: `document_markdown` is most commonly used mode, set as default

6. **Default Resolution**: `Gundam` provides best quality/speed tradeoff for most use cases

7. **Async Threshold**: Files >10 pages benefit from async processing to avoid timeouts

8. **Concurrency Limit**: 3 concurrent workers provides good balance without overwhelming API or local system

9. **Configuration Location**: OS-standard config directory is acceptable (`~/.config/` on Linux/Mac, `%APPDATA%` on Windows)

10. **ZIP Extraction**: Users prefer auto-extracted results over raw ZIP files for immediate access to Markdown

11. **Task History**: Local task history stored in config directory persists across sessions

12. **Progress Feedback**: Users want visual feedback for operations >5 seconds

13. **Authentication**: API key authentication is sufficient (no OAuth or multi-factor requirements)

14. **Single User**: CLI designed for single-user local usage (no multi-user or permission management)

15. **English Messages**: Error messages and help text in English (internationalization can be added later)
