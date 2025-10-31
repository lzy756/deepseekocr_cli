#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createConfigCommand } from './commands/config.js';
import { createImageCommand } from './commands/image.js';
import { createPdfCommand } from './commands/pdf.js';
import { createBatchCommand } from './commands/batch.js';
import { createTaskCommand } from './commands/task.js';
import { createHealthCommand } from './commands/health.js';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

// Create Commander program
const program = new Command();

program
  .name('deepseek-ocr')
  .description('CLI tool for DeepSeek-OCR API')
  .version(packageJson.version, '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help information');

// Global options
program
  .option('--verbose', 'Enable verbose logging')
  .option('--output <format>', 'Output format (text or json)', 'text')
  .option('--api-key <key>', 'DeepSeek-OCR API key (overrides config)')
  .option('--base-url <url>', 'API base URL (overrides config)');

// Register commands
program.addCommand(createConfigCommand());
program.addCommand(createImageCommand());
program.addCommand(createPdfCommand());
program.addCommand(createBatchCommand());
program.addCommand(createTaskCommand());
program.addCommand(createHealthCommand());

// Parse arguments
program.parse(process.argv);

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

export default program;
