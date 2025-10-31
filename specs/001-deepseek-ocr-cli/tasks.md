---
description: "Task list for DeepSeek-OCR CLI Tool implementation"
---

# Tasks: DeepSeek-OCR CLI Tool

**Input**: Design documents from `/specs/001-deepseek-ocr-cli/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-commands.md

**Tests**: Tests are NOT explicitly requested in the specification, therefore test tasks are EXCLUDED from this implementation plan.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Constitution Alignment**: All tasks align with the five core principles:
- **Principle I**: CLI-First Design (Commander.js framework, help text, JSON/text output)
- **Principle II**: API Client Abstraction (centralized axios-based HTTP client in `src/lib/client.js`)
- **Principle III**: Configuration Management (conf package, env vars, CLI flags with precedence)
- **Principle IV**: Error Handling & User Feedback (exit codes, chalk for colored output, error translation)
- **Principle V**: Asynchronous Operations & Progress (cli-progress bars, task polling with exponential backoff, graceful Ctrl+C)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

## Path Conventions

Single project structure:
- Source: `src/`, `bin/`
- Tests: `tests/`
- Documentation: `docs/`, `README.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Node.js project with package.json and npm dependencies (Commander.js 11.0+, axios 1.6+, conf 11.0+, cli-progress 3.12+, chalk 5.3+, form-data 4.0+)
- [x] T002 Create project directory structure: `bin/`, `src/`, `src/commands/`, `src/lib/`, `tests/`, `docs/`
- [x] T003 [P] Configure ESLint with .eslintrc.json for Node.js and ES modules
- [x] T004 [P] Configure Prettier with .prettierrc for code formatting
- [x] T005 [P] Create .gitignore excluding node_modules, config files with keys, and test outputs
- [x] T006 Create bin/deepseek-ocr.js executable entry point with shebang #!/usr/bin/env node
- [x] T007 Create README.md with installation, configuration, and usage examples

**Checkpoint**: Project structure ready with dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create src/constants.js defining MODES, RESOLUTIONS, DEFAULTS, and LIMITS constants per API specification
- [x] T009 Implement src/lib/validator.js with functions: validateImageFile, validatePdfFile, validateMode, validateResolution (with file size, format, and parameter validation)
- [x] T010 Implement src/lib/client.js as axios-based API client with methods: healthCheck, getModelInfo, ocrImage, ocrPdfSync, ocrPdfAsync, getTaskStatus, downloadTaskResult (include axios-retry configuration with exponential backoff)
- [x] T011 Implement src/lib/config-manager.js using conf package with OS-appropriate config paths, schema validation, and encryption for API keys
- [x] T012 [P] Implement src/lib/output.js with formatters for human-readable text output (chalk) and JSON output (JSON.stringify)
- [x] T013 [P] Implement src/lib/progress.js wrapper around cli-progress for single-bar and multi-bar progress indicators
- [x] T014 [P] Implement src/lib/utils.js with utility functions: retry logic, file handling, ZIP extraction, temporary file cleanup
- [x] T015 Create src/index.js as main CLI entry point setting up Commander.js program with global options (--version, --help, --verbose, --output)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - Configuration Management (Priority: P1) 🎯 MVP Foundation

**Goal**: Enable users to securely store and manage API credentials and preferences, providing comfortable tool usage without passing API keys with every command

**Independent Test**: Run config commands without any OCR operations to verify credential storage and preference management work independently

**Why First**: Configuration is essential infrastructure for all OCR operations. Without easy configuration, users must pass API keys with every command, leading to security risks and poor UX. This is a prerequisite for comfortable use of User Story 1.

### Implementation for User Story 2

- [x] T016 [US2] Implement src/commands/config.js with config init command (interactive prompts for API key and base URL using Commander.js .prompt())
- [x] T017 [P] [US2] Add config show command to src/commands/config.js (display all settings with API key masking: first 8 + "..." + last 8 chars)
- [x] T018 [P] [US2] Add config set command to src/commands/config.js (update individual settings with dot-notation keys like api.baseUrl)
- [x] T019 [US2] Integrate config commands with config-manager.js for file I/O and validation
- [x] T020 [US2] Add configuration precedence logic: CLI flags > Environment variables > Config file > Defaults
- [x] T021 [US2] Test config file creation at ~/.config/deepseek-ocr/config.yaml (Linux/Mac) or %APPDATA%\deepseek-ocr\config.yaml (Windows)

**Checkpoint**: Configuration management fully functional - users can store credentials securely

---

## Phase 4: User Story 1 - Quick Image OCR (Priority: P1) 🎯 MVP Core

**Goal**: Enable developers to quickly perform OCR on a single image and view results immediately, providing the most fundamental and frequently used feature

**Independent Test**: Run a single command with an image file and verify Markdown output is generated, delivering immediate OCR capability without any setup beyond configuration

**Dependencies**: Requires User Story 2 (config) to be complete for API credentials

### Implementation for User Story 1

- [x] T022 [US1] Implement src/commands/image.js with image command accepting file path as required argument
- [x] T023 [US1] Add options to image command: --mode, --resolution, --prompt (for custom mode), --output (custom output path), --no-extract
- [x] T024 [US1] Integrate image command with validator.js for file validation (existence, size ≤20MB, format: jpg/png/webp/bmp)
- [x] T025 [US1] Integrate image command with client.js ocrImage method for API call
- [x] T026 [US1] Add progress indicator using progress.js during upload and processing
- [x] T027 [US1] Implement ZIP download and auto-extraction using utils.js extractZip function
- [x] T028 [US1] Add error handling with user-friendly messages via output.js (401 → "Check API key", 413 → "File too large")
- [x] T029 [US1] Support JSON output format when --output json flag is used
- [x] T030 [US1] Display result summary showing ZIP path, extracted directory, processing time, and contents list

**Checkpoint**: User Story 1 fully functional - users can perform single image OCR with immediate results

---

## Phase 5: User Story 3 - PDF Document Processing (Priority: P2)

**Goal**: Enable users to OCR multi-page PDF documents with progress tracking, efficiently digitizing reports, papers, and books even for large files

**Independent Test**: Process PDF files of various sizes (small ≤10 pages synchronously, large >10 pages asynchronously) and verify complete Markdown output with page separators

**Dependencies**: Requires User Stories 1 & 2 to be complete (uses client.js and config.js)

### Implementation for User Story 3

- [x] T031 [US3] Implement src/commands/pdf.js with pdf command accepting file path as required argument
- [x] T032 [US3] Add options to pdf command: --mode, --resolution, --max-pages (1-100), --dpi (72-300), --sync (force sync), --async (force async), --output, --no-extract
- [x] T033 [US3] Implement auto-detection logic for sync vs async based on page count (threshold: 10 pages)
- [x] T034 [US3] Integrate pdf command with validator.js for PDF validation (existence, size ≤20MB, format)
- [x] T035 [US3] Implement synchronous path using client.js ocrPdfSync method with progress indicator
- [x] T036 [US3] Implement asynchronous path using client.js ocrPdfAsync method, returning task_id
- [x] T037 [US3] Implement task polling with exponential backoff (initial: 2s, max: 30s) and progress bar showing percentage
- [x] T038 [US3] Add Ctrl+C handler for graceful exit with message that task continues on server
- [x] T039 [US3] Implement result download after async completion using client.js downloadTaskResult
- [x] T040 [US3] Support ZIP auto-extraction with page separator markers in result.mmd
- [x] T041 [US3] Add error handling for PDF-specific errors (corrupt file, page limit exceeded)

**Checkpoint**: PDF processing fully functional for both small (sync) and large (async) documents

---

## Phase 6: User Story 4 - Batch Processing (Priority: P2)

**Goal**: Enable users to batch process multiple images or PDFs concurrently, efficiently handling large volumes without running commands manually one by one

**Independent Test**: Process a directory of multiple files and verify all results are generated with individual status tracking

**Dependencies**: Requires User Stories 1 & 2 to be complete (uses image OCR functionality)

### Implementation for User Story 4

- [x] T042 [US4] Implement src/commands/batch.js with batch command accepting directory path as required argument
- [x] T043 [US4] Add options to batch command: --mode, --resolution, --pattern (glob pattern like "*.png"), --workers (default: 3), --output-dir (default: <dir>/results)
- [x] T044 [US4] Implement directory scanning using glob patterns to find matching files
- [x] T045 [US4] Create concurrent processing pool with configurable worker limit using Promise.all with chunking
- [x] T046 [US4] Integrate with progress.js multi-bar for overall progress display (e.g., "Processing 15/50 files")
- [x] T047 [US4] Implement per-file error handling: continue processing remaining files if individual files fail
- [x] T048 [US4] Generate summary table using output.js showing success/failure status for each file
- [x] T049 [US4] Save results to output-dir with auto-created subdirectory structure
- [x] T050 [US4] Display batch statistics: total files, successful, failed, total time

**Checkpoint**: Batch processing fully functional - users can process multiple files efficiently

---

## Phase 7: User Story 5 - Task Management (Priority: P3)

**Goal**: Enable users to check status of previously submitted tasks and download their results, supporting asynchronous workflows

**Independent Test**: Submit tasks via async PDF command and then use task commands to check status and download

**Dependencies**: Requires User Story 3 (PDF async) to be complete as it creates tasks to manage

### Implementation for User Story 5

- [x] T051 [US5] Implement src/commands/task.js with task status <task-id> command
- [x] T052 [P] [US5] Add task download <task-id> command to src/commands/task.js with --output option
- [x] T053 [P] [US5] Add task wait <task-id> command that polls until completion then auto-downloads
- [x] T054 [P] [US5] Add task list command showing recent tasks from local history
- [x] T055 [US5] Implement local job history storage in ~/.config/deepseek-ocr/history.json
- [x] T056 [US5] Add history management: append new tasks, update status on check, prune entries older than 7 days
- [x] T057 [US5] Integrate task status command with client.js getTaskStatus method
- [x] T058 [US5] Integrate task download command with client.js downloadTaskResult method
- [x] T059 [US5] Display task information: status, progress, timestamps, error details (if failed)
- [x] T060 [US5] Format task list output as table with columns: Task ID, Status, Input File, Submitted timestamp
- [x] T061 [US5] Add error handling for 404 (task not found), 410 (task expired)

**Checkpoint**: Task management fully functional - users can monitor and retrieve async operations

---

## Phase 8: User Story 6 - Service Health Monitoring (Priority: P3)

**Goal**: Enable users to check if OCR service is available and properly configured for troubleshooting and setup verification

**Independent Test**: Run health commands against API without any OCR processing to verify service verification capability

**Dependencies**: Requires User Story 2 (config) for API connection details

### Implementation for User Story 6

- [x] T062 [US6] Implement src/commands/health.js with health command (no arguments)
- [x] T063 [P] [US6] Add info command to health.js displaying model configuration
- [x] T064 [US6] Integrate health command with client.js healthCheck method
- [x] T065 [US6] Integrate info command with client.js getModelInfo method
- [x] T066 [US6] Display health status: service status (healthy/unhealthy), model loaded (yes/no), timestamp
- [x] T067 [US6] Display model information: model name, supported modes list, supported resolutions list, version
- [x] T068 [US6] Add --verbose flag support showing detailed connection information (base URL, response headers)
- [x] T069 [US6] Handle service unreachable errors with troubleshooting suggestions (check URL, verify service running)
- [x] T070 [US6] Support JSON output format for health and info commands

**Checkpoint**: Service health monitoring fully functional - users can verify setup and troubleshoot

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T071 Enhance error messages across all commands with actionable suggestions (e.g., "File not found: check path", "API key invalid: run config init")
- [x] T072 Add comprehensive --help text to all commands with usage examples
- [x] T073 Implement proper exit codes throughout: 0 (success), 1 (errors), 2 (usage errors)
- [x] T074 Add verbose logging mode (--verbose flag) showing detailed HTTP request/response information
- [x] T075 Implement temporary file cleanup on exit and error conditions using utils.js
- [x] T076 [P] Create docs/installation.md with installation methods (npm global, local, from source)
- [x] T077 [P] Create docs/usage.md with comprehensive command examples and workflows
- [x] T078 [P] Create docs/troubleshooting.md with common errors and solutions
- [x] T079 Update README.md with badges, quick start guide, and links to full documentation
- [x] T080 Add package.json scripts: test, lint, lint:fix, format for development workflow
- [x] T081 Verify all constitution principles are implemented: CLI-first design, API abstraction, config management, error handling, async operations
- [x] T082 Run quickstart.md validation: verify 5-minute setup experience from installation to first OCR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 2 - Config (Phase 3)**: Depends on Foundational - Must complete before User Story 1
- **User Story 1 - Image OCR (Phase 4)**: Depends on Config (US2) completion
- **User Story 3 - PDF (Phase 5)**: Depends on Config (US2) and Image (US1) completion
- **User Story 4 - Batch (Phase 6)**: Depends on Image (US1) completion
- **User Story 5 - Task Management (Phase 7)**: Depends on PDF async (US3) completion
- **User Story 6 - Health (Phase 8)**: Depends on Config (US2) completion (can run in parallel with US1)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Foundational (Phase 2)
    ↓
US2: Config (P1) ← Must complete first
    ↓
    ├─→ US1: Image OCR (P1) ← MVP Core
    │       ↓
    │       ├─→ US3: PDF (P2)
    │       │       ↓
    │       │       └─→ US5: Task Management (P3)
    │       │
    │       └─→ US4: Batch (P2)
    │
    └─→ US6: Health (P3) ← Can run parallel with US1
```

### MVP Delivery Path

**Minimal Viable Product** (deliver value ASAP):
1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: US2 Config ← Users can configure
4. Phase 4: US1 Image OCR ← Users can perform basic OCR
5. **DEPLOY MVP** - Users have core functionality

### Within Each User Story

- Validation logic before API calls
- API client integration before command implementation
- Progress indicators before user-facing commands
- Error handling integrated with implementation
- Output formatting (text/JSON) as final step

### Parallel Opportunities

- **Phase 1 (Setup)**: T003 (ESLint), T004 (Prettier), T005 (.gitignore) can run in parallel
- **Phase 2 (Foundational)**: T012 (output.js), T013 (progress.js), T014 (utils.js) can run in parallel after T008-T011
- **Within US2**: T017 (config show), T018 (config set) can run in parallel after T016
- **Within US5**: T052 (task download), T053 (task wait), T054 (task list) can run in parallel after T051
- **Within US6**: T063 (info command) can run in parallel with T062 (health command)
- **Phase 9 (Polish)**: T076 (installation.md), T077 (usage.md), T078 (troubleshooting.md) can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# After T008-T011 complete, launch in parallel:
T012: "Implement src/lib/output.js with formatters"
T013: "Implement src/lib/progress.js wrapper"
T014: "Implement src/lib/utils.js with utilities"

# Each works on different files, no conflicts
```

---

## Parallel Example: User Story 2 (Config)

```bash
# After T016 (config init) completes, launch in parallel:
T017: "Add config show command to src/commands/config.js"
T018: "Add config set command to src/commands/config.js"

# Both add different commands to same file, but different functions
```

---

## Implementation Strategy

### MVP First (US2 Config + US1 Image OCR Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: US2 Configuration Management
4. Complete Phase 4: US1 Quick Image OCR
5. **STOP and VALIDATE**: Test configuration and basic image OCR
6. Deploy/demo MVP with core functionality

**Estimated MVP Timeline**: 5-7 days for single developer

### Incremental Delivery

1. Setup + Foundational + Config (US2) → Users can configure ✓
2. Add Image OCR (US1) → **MVP DEPLOYED** ✓
3. Add PDF Processing (US3) → Multi-page document support ✓
4. Add Batch Processing (US4) → Bulk operations ✓
5. Add Task Management (US5) → Async workflow ✓
6. Add Health Monitoring (US6) → Diagnostics ✓
7. Polish → Production-ready

**Estimated Full Timeline**: 12-15 days for single developer

### Parallel Team Strategy

With 3 developers after Foundational phase:
- **Developer A**: US2 Config → US1 Image OCR (critical path)
- **Developer B**: Wait for US1 → US3 PDF → US5 Task Management
- **Developer C**: Wait for US1 → US4 Batch + US6 Health

---

## Notes

- **[P] markers**: Tasks marked [P] operate on different files or independent functions, allowing true parallel execution
- **[Story] labels**: Map each task to specific user story for traceability and independent story completion
- **No test tasks**: Tests not explicitly requested in specification, therefore excluded from implementation plan
- **Constitution compliance**: All tasks designed to uphold the five core principles defined in plan.md
- **File size limits**: API enforces 20MB file size limit - validation must catch this before upload
- **Resolution defaults**: "Gundam" preset (1024×640 dynamic crop) provides highest quality per specification
- **Error handling**: All commands must translate API errors to user-friendly messages with suggestions
- **Exit codes**: Must use 0 (success), 1 (errors), 2 (usage errors) per constitution Principle IV
- **Progress feedback**: Required for operations >5 seconds per user assumptions
- **Config precedence**: CLI flags override environment variables, which override config file, which override defaults
- **Async threshold**: 10 pages is the sync/async boundary per specification
- **Task TTL**: Server-side tasks expire after 3600 seconds (1 hour) per specification
- **Batch concurrency**: Default 3 workers provides balance without overwhelming API
- **Commit frequency**: Commit after completing each user story phase for clean git history

---

## Success Criteria Validation

After implementation, verify against spec.md success criteria:

- **SC-001**: ✓ Users can process single image in <30s (US1)
- **SC-002**: ✓ Users complete initial setup in <2 minutes using config init (US2)
- **SC-003**: ✓ 95% of operations succeed on first attempt with proper error handling
- **SC-004**: ✓ 50 images processed in <5 minutes with batch mode (US4)
- **SC-005**: ✓ Clear actionable error messages for 100% of common error scenarios
- **SC-006**: ✓ Users can interrupt operations (Ctrl+C) and resume later (US3, US5)
- **SC-007**: ✓ Zero security warnings (no API keys in logs, proper file permissions)
- **SC-008**: ✓ 90% user satisfaction with CLI usability (help text, error messages)
- **SC-009**: ✓ Automatic retry succeeds within 3 attempts for 95% of transient failures
- **SC-010**: ✓ Installation to first successful OCR in <5 minutes (quickstart.md validation)
