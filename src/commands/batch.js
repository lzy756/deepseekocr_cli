import { Command } from 'commander';
import { resolve, join, basename, extname } from 'path';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { validateImageFile, validatePdfFile, validateMode, validateResolution, validateCustomPrompt } from '../lib/validator.js';
import OCRClient from '../lib/client.js';
import { getEffectiveConfig, validateConfig } from '../lib/config-precedence.js';
import { printError, printInfo, printKeyValue, printSection, printSummary, printTable } from '../lib/output.js';
import { createMultiProgressBar } from '../lib/progress.js';
import { extractZip, ensureDir } from '../lib/utils.js';
import { MODES } from '../constants.js';

/**
 * Scan directory for files matching pattern
 */
async function scanDirectory(dirPath, pattern) {
  const files = [];
  const entries = await readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    
    if (entry.isFile()) {
      // Simple pattern matching (e.g., "*.png", "*.jpg", "*.pdf")
      if (pattern === '*' || pattern === '*.*') {
        // Accept all files that are images or PDFs
        const ext = extname(entry.name).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.pdf'].includes(ext)) {
          files.push(fullPath);
        }
      } else if (pattern.startsWith('*.')) {
        // Extension pattern (e.g., "*.png")
        const targetExt = pattern.substring(1).toLowerCase();
        const fileExt = extname(entry.name).toLowerCase();
        if (fileExt === targetExt) {
          files.push(fullPath);
        }
      } else {
        // Exact match or substring
        if (entry.name.includes(pattern)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  return files;
}

/**
 * Validate a single file (image or PDF)
 */
function validateFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  
  if (['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext)) {
    validateImageFile(filePath);
    return 'image';
  } else if (ext === '.pdf') {
    validatePdfFile(filePath);
    return 'pdf';
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }
}

/**
 * Process a single file
 */
async function processSingleFile(client, filePath, fileType, requestData, outputDir, options, progressBar, fileIndex, _totalFiles) {
  const fileName = basename(filePath);
  const fileNameWithoutExt = basename(filePath, extname(filePath));
  
  try {
    if (progressBar) {
      progressBar.update(fileIndex, { filename: fileName, status: 'Processing' });
    }
    
    let result;
    if (fileType === 'image') {
      result = await client.ocrImage(filePath, requestData);
    } else {
      // For batch, we use sync processing for PDFs
      result = await client.ocrPdfSync(filePath, requestData);
    }
    
    // Handle result
    if (Buffer.isBuffer(result)) {
      // Save ZIP file
      const zipPath = join(outputDir, `${fileNameWithoutExt}_result.zip`);
      const { writeFileSync } = await import('fs');
      writeFileSync(zipPath, result);
      
      // Extract ZIP if not disabled
      if (!options.noExtract) {
        const extractedDir = join(outputDir, `${fileNameWithoutExt}_result`);
        await extractZip(zipPath, extractedDir);
      }
      
      if (progressBar) {
        progressBar.update(fileIndex, { filename: fileName, status: '✓ Success' });
      }
      
      return {
        file: fileName,
        status: 'success',
        output: zipPath
      };
    } else {
      // Direct response - save as JSON
      const jsonPath = join(outputDir, `${fileNameWithoutExt}_result.json`);
      const { writeFileSync } = await import('fs');
      writeFileSync(jsonPath, JSON.stringify(result, null, 2));
      
      if (progressBar) {
        progressBar.update(fileIndex, { filename: fileName, status: '✓ Success' });
      }
      
      return {
        file: fileName,
        status: 'success',
        output: jsonPath
      };
    }
  } catch (error) {
    if (progressBar) {
      progressBar.update(fileIndex, { filename: fileName, status: '✗ Failed' });
    }
    
    return {
      file: fileName,
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * Process files in chunks (concurrent pool)
 * Note: Uses simple chunk-based concurrency control. For more advanced use cases,
 * consider using a library like p-queue for dynamic work pool management.
 * The current implementation is sufficient for CLI batch processing where the
 * bottleneck is API calls, not task scheduling.
 */
async function processInChunks(client, files, fileTypes, requestData, outputDir, options, workers) {
  const results = [];
  const totalFiles = files.length;
  
  // Create progress bar
  let multiBar = null;
  let progressBar = null;
  
  if (!options.json) {
    multiBar = createMultiProgressBar();
    progressBar = multiBar.create(totalFiles, 0, {
      filename: 'Starting...',
      status: 'Waiting'
    }, {
      format: '[{bar}] {percentage}% | {value}/{total} | {filename} | {status}'
    });
  }
  
  // Process in chunks
  for (let i = 0; i < files.length; i += workers) {
    const chunk = files.slice(i, i + workers);
    const chunkTypes = fileTypes.slice(i, i + workers);
    
    const chunkPromises = chunk.map((file, idx) => {
      const fileIndex = i + idx;
      return processSingleFile(
        client,
        file,
        chunkTypes[idx],
        requestData,
        outputDir,
        options,
        progressBar,
        fileIndex,
        totalFiles
      );
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  if (multiBar) {
    multiBar.stop();
  }
  
  return results;
}

/**
 * Handle batch OCR command
 */
async function handleBatchOcr(directoryPath, options) {
  const startTime = Date.now();
  
  try {
    // Resolve absolute path
    const absolutePath = resolve(directoryPath);
    
    // Validate directory exists
    if (!existsSync(absolutePath)) {
      throw new Error(`Directory not found: ${absolutePath}`);
    }
    
    const stats = await stat(absolutePath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${absolutePath}`);
    }
    
    // Get effective configuration
    const config = getEffectiveConfig({
      apiKey: options.apiKey || options.parent?.optsWithGlobals()?.apiKey,
      baseUrl: options.baseUrl || options.parent?.optsWithGlobals()?.baseUrl,
      mode: options.mode,
      resolution: options.resolution
    });
    
    // Validate configuration
    validateConfig(config);
    
    // Validate mode and resolution
    const mode = options.mode || config.defaults.mode;
    const resolution = options.resolution || config.defaults.resolution;
    
    validateMode(mode);
    validateResolution(resolution);
    
    // Validate custom prompt if in custom mode
    if (mode === MODES.CUSTOM) {
      if (!options.prompt) {
        throw new Error('Custom prompt is required when using custom mode. Use --prompt "your prompt here"');
      }
      validateCustomPrompt(options.prompt);
    }
    
    // Scan directory for files
    const pattern = options.pattern || '*';
    
    if (!options.json) {
      printSection('Batch OCR Processing');
      printKeyValue('Directory', absolutePath);
      printKeyValue('Pattern', pattern);
      printKeyValue('Mode', mode);
      printKeyValue('Resolution', resolution);
      if (mode === MODES.CUSTOM) {
        printKeyValue('Prompt', options.prompt);
      }
      console.log();
      printInfo('Scanning directory...');
    }
    
    const files = await scanDirectory(absolutePath, pattern);
    
    if (files.length === 0) {
      throw new Error(`No files found matching pattern: ${pattern}`);
    }
    
    // Validate all files and determine types
    const validFiles = [];
    const validFileTypes = [];
    const invalidFiles = [];

    for (const file of files) {
      try {
        const type = validateFile(file);
        validFiles.push(file);
        validFileTypes.push(type);
      } catch (error) {
        invalidFiles.push({ file: basename(file), error: error.message });
      }
    }

    if (invalidFiles.length > 0 && !options.json) {
      printInfo(`Skipping ${invalidFiles.length} invalid file(s):`);
      invalidFiles.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`);
      });
      console.log();
    }

    if (validFiles.length === 0) {
      throw new Error('No valid files to process');
    }
    
    if (!options.json) {
      printInfo(`Found ${validFiles.length} valid file(s) to process`);
      console.log();
    }
    
    // Determine output directory
    const outputDir = options.outputDir ? resolve(options.outputDir) : join(absolutePath, 'results');
    await ensureDir(outputDir);
    
    if (!options.json) {
      printKeyValue('Output Directory', outputDir);
      printKeyValue('Workers', options.workers);
      console.log();
    }
    
    // Initialize API client
    const client = new OCRClient(config.api.baseUrl, config.api.key, {
      timeout: config.api.timeout
    });
    
    // Prepare request data
    const requestData = {
      mode,
      resolution
    };
    
    if (mode === MODES.CUSTOM && options.prompt) {
      requestData.custom_prompt = options.prompt;
    }
    
    // Process files in chunks
    const results = await processInChunks(
      client,
      validFiles,
      validFileTypes,
      requestData,
      outputDir,
      options,
      options.workers
    );
    
    // Calculate statistics
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    
    // Output results
    if (options.json) {
      console.log(JSON.stringify({
        success: true,
        directory: absolutePath,
        pattern,
        mode,
        resolution,
        outputDir,
        statistics: {
          total: validFiles.length,
          successful,
          failed,
          totalTime: `${totalTime}s`
        },
        results
      }, null, 2));
    } else {
      console.log();
      printSection('Batch Processing Complete');
      
      printSummary({
        'Total Files': validFiles.length,
        'Successful': successful,
        'Failed': failed,
        'Total Time': `${totalTime}s`,
        'Output Directory': outputDir
      });
      
      // Display detailed results table
      if (results.length > 0) {
        console.log();
        printInfo('Detailed Results:');
        
        const tableData = results.map(r => ({
          'File': r.file,
          'Status': r.status === 'success' ? '✓ Success' : '✗ Failed',
          'Output/Error': r.status === 'success' ? basename(r.output) : r.error
        }));
        
        printTable(tableData);
      }
    }
    
  } catch (error) {
    const outputFormat = options.json ? 'json' : 'text';
    
    if (outputFormat === 'json') {
      console.error(JSON.stringify({
        success: false,
        error: error.message,
        directory: directoryPath
      }, null, 2));
    } else {
      printError(`Batch processing failed: ${error.message}`);
      
      // User-friendly error messages
      if (error.response) {
        const status = error.response.status;
        console.log();
        if (status === 401 || status === 403) {
          printInfo('Authentication failed. Please check your API key:');
          printInfo('  - Run: deepseek-ocr config init');
          printInfo('  - Or set: DEEPSEEK_OCR_API_KEY environment variable');
          printInfo('  - Or use: --api-key YOUR_KEY');
        }
      }
    }
    
    process.exit(1);
  }
}

/**
 * Create batch command
 */
export function createBatchCommand() {
  const batch = new Command('batch')
    .description('Batch process multiple images or PDFs from a directory')
    .argument('<directory>', 'Path to directory containing files')
    .option('-m, --mode <mode>', 'OCR mode (document_markdown, free_ocr, figure_parse, grounding_ocr, custom)')
    .option('-r, --resolution <resolution>', 'Resolution (Tiny, Small, Base, Large, Gundam)')
    .option('-p, --prompt <prompt>', 'Custom prompt (required for custom mode)')
    .option('--pattern <pattern>', 'File pattern (e.g., "*.png", "*.jpg", "*")', '*')
    .option('-w, --workers <number>', 'Number of concurrent workers', parseInt, 3)
    .option('-o, --output-dir <path>', 'Custom output directory (default: <directory>/results)')
    .option('--no-extract', 'Do not auto-extract ZIP files')
    .option('--json', 'Output in JSON format')
    .action(handleBatchOcr);

  return batch;
}

export default createBatchCommand;
