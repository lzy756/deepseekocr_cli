<!--
Sync Impact Report:
===================
Version change: Initial → 1.0.0
Modified principles: N/A (Initial version)
Added sections:
  - Core Principles (5 principles defined)
  - Technology Standards
  - Security & Quality Requirements
  - Governance
Templates requiring updates:
  ✅ plan-template.md - Aligned with constitution principles
  ✅ spec-template.md - Scope and requirements match constitution standards
  ✅ tasks-template.md - Task categorization supports all principles
Follow-up TODOs: None
-->

# DeepSeek-OCR CLI Tool Constitution

## Core Principles

### I. CLI-First Design

**Principle**: Build a user-friendly command-line tool that abstracts API complexity while maintaining power and flexibility.

**Rules**:
- MUST follow UNIX philosophy: do one thing well, composable with other tools
- MUST provide intuitive commands with sensible defaults
- MUST support both interactive and scripted usage
- MUST handle stdin/stdout for pipeline integration where applicable
- MUST provide clear progress feedback for long-running operations
- MUST offer both human-readable and JSON output formats

**Rationale**: CLI tools are the primary interface for developers and automation systems. A well-designed CLI reduces cognitive load and accelerates adoption.

### II. API Client Abstraction

**Principle**: Encapsulate all API interactions in a clean, reusable client module separate from CLI concerns.

**Rules**:
- Client module MUST be independent of CLI framework
- MUST handle all HTTP communication, authentication, retries, and error handling
- MUST expose promise-based or async/await interface
- MUST validate requests before sending to API
- MUST normalize API responses into consistent data structures
- Client module MUST be testable in isolation with mock responses

**Rationale**: Separation of concerns enables code reuse (e.g., future web UI), easier testing, and maintainability. API changes are contained to one module.

### III. Configuration Management

**Principle**: Provide flexible, secure configuration management that supports both interactive setup and automation.

**Rules**:
- MUST support configuration file (`~/.config/deepseek-ocr/config.yaml` or similar)
- MUST support environment variables (e.g., `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`)
- MUST support command-line flags for per-invocation overrides
- MUST never commit API keys or sensitive data to version control
- MUST provide `config init` command for interactive setup
- Configuration precedence: CLI flags > Environment variables > Config file > Defaults

**Rationale**: Different usage scenarios (development, CI/CD, production) require different configuration approaches. Clear precedence rules prevent confusion.

### IV. Error Handling & User Feedback

**Principle**: Provide clear, actionable error messages and graceful failure handling.

**Rules**:
- MUST catch and translate all API errors into user-friendly messages
- MUST use appropriate exit codes (0 = success, 1 = general error, 2 = usage error, etc.)
- MUST log errors to stderr, results to stdout
- MUST provide verbose/debug mode for troubleshooting (e.g., `--verbose` flag)
- MUST handle network failures with retry logic and clear timeout messages
- MUST validate inputs before API calls to fail fast

**Rationale**: Poor error messages frustrate users and increase support burden. Clear feedback and proper exit codes enable automation and debugging.

### V. Asynchronous Operations & Progress

**Principle**: Handle long-running operations gracefully with progress indicators and task management.

**Rules**:
- MUST provide progress bars or status updates for long operations (e.g., large PDF processing)
- MUST support background task submission and status polling
- MUST allow users to check status of previously submitted tasks
- MUST implement exponential backoff for status polling
- MUST provide options to wait for completion or return immediately with task ID
- MUST clean up temporary files and handle interruptions (Ctrl+C) gracefully

**Rationale**: OCR processing can take significant time for large documents. Users need visibility into progress and the ability to manage long-running tasks.

## Technology Standards

### Stack Requirements

- **Runtime**: Node.js >= 18.0.0 (LTS)
- **Language**: JavaScript (ES modules) or TypeScript (preferred for type safety)
- **CLI Framework**: Commander.js or Yargs (for argument parsing) OR Inquirer.js (for interactive prompts)
- **HTTP Client**: Axios or Node-fetch (with retry logic)
- **Configuration**: cosmiconfig or conf (for config file management)
- **Progress Display**: cli-progress or ora (for spinners/progress bars)
- **Output Formatting**: chalk (colors), table (tabular data), marked-terminal (markdown in terminal)
- **File Handling**: fs-extra, archiver/unzipper (for ZIP handling)
- **Testing**: Jest or Vitest (unit tests), Supertest or Nock (API mocking)

### Project Structure

```
deepseek-ocr-cli/
├── src/
│   ├── index.js                 # CLI entry point
│   ├── commands/                # Command implementations
│   │   ├── config.js            # config init/show/set
│   │   ├── image.js             # image OCR
│   │   ├── pdf.js               # PDF OCR
│   │   ├── batch.js             # batch processing
│   │   └── task.js              # task management
│   ├── lib/
│   │   ├── client.js            # API client
│   │   ├── config.js            # Configuration manager
│   │   ├── progress.js          # Progress tracking
│   │   └── utils.js             # Utilities (retry, validation)
│   └── constants.js             # Constants (defaults, enums)
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests with mock API
│   └── fixtures/                # Test data
├── docs/                        # User documentation
├── package.json
├── README.md
└── .gitignore                   # MUST exclude config files with keys
```

### Dependencies Management

- MUST pin major versions in `package.json` to avoid breaking changes
- MUST use `package-lock.json` or `yarn.lock` for reproducible builds
- MUST minimize dependencies (prefer built-in Node.js modules where possible)
- MUST audit dependencies regularly (`npm audit`)

## Security & Quality Requirements

### Security

1. **API Key Protection**:
   - MUST never log API keys
   - MUST never include keys in error messages
   - Config files with keys MUST have restrictive permissions (0600)
   - MUST use HTTPS for API communication in production

2. **Input Validation**:
   - MUST validate file paths to prevent directory traversal
   - MUST validate file sizes before upload
   - MUST sanitize user inputs before passing to API

3. **Dependency Security**:
   - MUST run `npm audit` before releases
   - MUST address high/critical vulnerabilities promptly

### Quality Standards

1. **Code Quality**:
   - MUST use ESLint with reasonable rules (Airbnb, Standard, or similar)
   - MUST use Prettier for consistent formatting
   - MUST document public APIs with JSDoc comments
   - SHOULD achieve >80% code coverage for business logic

2. **Testing**:
   - MUST test all API client methods with mocked responses
   - MUST test error handling paths (network failures, invalid responses)
   - MUST test configuration precedence rules
   - SHOULD test CLI commands with integration tests

3. **Documentation**:
   - MUST provide comprehensive README with installation, configuration, and usage examples
   - MUST include inline help text (`--help`) for all commands and options
   - MUST document all configuration options
   - MUST provide troubleshooting guide for common issues

## Governance

### Amendment Process

1. Proposed changes MUST be documented in a pull request with rationale
2. Breaking changes require MAJOR version bump (semantic versioning)
3. New principles require team review and approval
4. All amendments MUST update this constitution's version and last amended date

### Compliance Review

- All feature specifications MUST reference applicable constitution principles
- All pull requests MUST verify compliance in description or comments
- Constitution violations MUST be explicitly justified with alternatives considered

### Version Policy

This constitution follows semantic versioning:
- **MAJOR**: Backward-incompatible governance changes (removing/redefining principles)
- **MINOR**: New principles or sections added
- **PATCH**: Clarifications, wording improvements, typo fixes

### Supersedence

This constitution supersedes all other project practices and guidelines. In case of conflict, constitution principles take precedence.

**Version**: 1.0.0 | **Ratified**: 2025-10-31 | **Last Amended**: 2025-10-31
