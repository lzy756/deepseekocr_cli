import { Command } from 'commander';
import { resolve, basename, extname, dirname, join } from 'path';
import { validatePdfFile, validateMode, validateResolution, validateDPI, validateMaxPages, validateCustomPrompt } from '../lib/validator.js';
import OCRClient from '../lib/client.js';
import { getEffectiveConfig, validateConfig } from '../lib/config-precedence.js';
import { printSuccess, printError, printInfo, printKeyValue, printSection, printSummary, printWarning } from '../lib/output.js';
import { createProgressBar, uploadProgressHandler, taskProgressHandler } from '../lib/progress.js';
import { extractZip, ensureDir, readMetadataFromZip, parseZipContents } from '../lib/utils.js';
import { MODES } from '../constants.js';
import { addTaskToHistory } from './task.js';

// PDF page threshold for auto-detection (sync vs async)
const AUTO_ASYNC_THRESHOLD = 10;

// Ctrl+C flag
let ctrlCPressed = false;

/**
 * Handle Ctrl+C gracefully
 */
function setupCtrlCHandler(taskId) {
  process.on('SIGINT', () => {
    if (!ctrlCPressed) {
      ctrlCPressed = true;
      console.log();
      printWarning('Received Ctrl+C. Exiting gracefully...');
      printInfo(`Your task (${taskId}) is still running on the server.`);
      printInfo('You can check its status later using:');
      printInfo(`  deepseek-ocr task status ${taskId}`);
      printInfo('Or download results when ready:');
      printInfo(`  deepseek-ocr task download ${taskId}`);
      process.exit(0);
    }
  });
}

/**
 * Handle PDF OCR command
 */
async function handlePdfOcr(pdfPath, options) {
  const startTime = Date.now();
  
  try {
    // Resolve absolute path
    const absolutePath = resolve(pdfPath);
    
    // Get effective configuration
    const config = getEffectiveConfig({
      apiKey: options.apiKey || options.parent?.optsWithGlobals()?.apiKey,
      baseUrl: options.baseUrl || options.parent?.optsWithGlobals()?.baseUrl,
      mode: options.mode,
      resolution: options.resolution,
      dpi: options.dpi,
      maxPages: options.maxPages
    });
    
    // Validate configuration
    validateConfig(config);
    
    // Validate PDF file
    if (options.verbose || options.parent?.optsWithGlobals()?.verbose) {
      printInfo(`Validating PDF file: ${absolutePath}`);
    }
    validatePdfFile(absolutePath);
    
    // Validate mode and resolution
    const mode = options.mode || config.defaults.mode;
    const resolution = options.resolution || config.defaults.resolution;
    const dpi = options.dpi || config.defaults.dpi;
    const maxPages = options.maxPages || config.defaults.maxPages;
    
    validateMode(mode);
    validateResolution(resolution);
    validateDPI(dpi);
    validateMaxPages(maxPages);
    
    // Validate custom prompt if in custom mode
    if (mode === MODES.CUSTOM) {
      if (!options.prompt) {
        throw new Error('Custom prompt is required when using custom mode. Use --prompt "your prompt here"');
      }
      validateCustomPrompt(options.prompt);
    }
    
    // Initialize API client
    const client = new OCRClient(config.api.baseUrl, config.api.key, {
      timeout: config.api.timeout
    });
    
    // Prepare request data
    const requestData = {
      mode,
      resolution,
      dpi,
      max_pages: maxPages
    };
    
    if (mode === MODES.CUSTOM && options.prompt) {
      requestData.custom_prompt = options.prompt;
    }
    
    // Determine output format
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    // Determine sync vs async
    let useAsync = false;
    
    if (options.sync) {
      useAsync = false;
      if (!jsonOutput && (options.verbose || options.parent?.optsWithGlobals()?.verbose)) {
        printInfo('Forcing synchronous processing (--sync flag)');
      }
    } else if (options.async) {
      useAsync = true;
      if (!jsonOutput && (options.verbose || options.parent?.optsWithGlobals()?.verbose)) {
        printInfo('Forcing asynchronous processing (--async flag)');
      }
    } else {
      // Auto-detect based on max_pages
      useAsync = maxPages > AUTO_ASYNC_THRESHOLD;
      if (!jsonOutput && (options.verbose || options.parent?.optsWithGlobals()?.verbose)) {
        printInfo(`Auto-detected ${useAsync ? 'async' : 'sync'} mode (max_pages=${maxPages}, threshold=${AUTO_ASYNC_THRESHOLD})`);
      }
    }
    
    if (!jsonOutput) {
      printSection('PDF OCR');
      printKeyValue('File', basename(absolutePath));
      printKeyValue('Mode', mode);
      printKeyValue('Resolution', resolution);
      printKeyValue('DPI', dpi);
      printKeyValue('Max Pages', maxPages);
      printKeyValue('Processing', useAsync ? 'Asynchronous' : 'Synchronous');
      if (mode === MODES.CUSTOM) {
        printKeyValue('Prompt', options.prompt);
      }
      console.log();
    }
    
    let result;
    
    if (useAsync) {
      // Asynchronous processing
      if (!jsonOutput) {
        printInfo('Uploading PDF for asynchronous processing...');
      }
      
      // Create progress bar for upload
      let uploadBar = null;
      if (!jsonOutput) {
        uploadBar = createProgressBar('Uploading');
      }
      
      // Prepare options for async request
      const asyncOptions = {
        ...requestData,
        onUploadProgress: uploadBar ? uploadProgressHandler(uploadBar) : undefined
      };
      
      // Start async task
      const taskResponse = await client.ocrPdfAsync(
        absolutePath,
        asyncOptions
      );
      
      if (uploadBar) {
        uploadBar.stop();
      }
      
      if (!taskResponse || !taskResponse.task_id) {
        throw new Error('Invalid response from API: missing task_id');
      }
      
      const taskId = taskResponse.task_id;
      
      // Add to history
      addTaskToHistory(taskId, absolutePath);
      
      if (!jsonOutput) {
        printSuccess(`Task created: ${taskId}`);
        printInfo('Waiting for task to complete...');
        console.log();
      }
      
      // Setup Ctrl+C handler
      setupCtrlCHandler(taskId);
      
      // Create progress bar for task
      let taskBar = null;
      if (!jsonOutput) {
        taskBar = createProgressBar('Processing');
      }
      
      // Wait for task completion
      const completedTask = await client.waitForTask(
        taskId,
        {
          initialDelay: config.defaults.pollInterval,
          timeout: config.defaults.pollTimeout,
          onProgress: taskBar ? taskProgressHandler(taskBar) : undefined
        }
      );
      
      if (taskBar) {
        taskBar.stop();
      }
      
      if (!completedTask || completedTask.status !== 'completed') {
        throw new Error(`Task failed with status: ${completedTask?.status || 'unknown'}`);
      }
      
      if (!jsonOutput) {
        printSuccess('Task completed successfully');
        printInfo('Downloading results...');
      }
      
      // Download result
      const resultBuffer = await client.downloadTaskResult(taskId);
      result = { data: resultBuffer };
      
    } else {
      // Synchronous processing
      let progressBar = null;
      if (!jsonOutput) {
        progressBar = createProgressBar('Uploading and processing');
      }
      
      // Prepare options for sync request
      const syncOptions = {
        ...requestData,
        onUploadProgress: progressBar ? uploadProgressHandler(progressBar) : undefined
      };
      
      const resultBuffer = await client.ocrPdfSync(
        absolutePath,
        syncOptions
      );
      result = { data: resultBuffer };
      
      if (progressBar) {
        progressBar.stop();
      }
    }
    
    // Handle response (same as image command)
    if (!result || !result.data) {
      throw new Error('Invalid response from API: missing data');
    }
    
    // Check if result is ZIP file (Buffer)
    if (Buffer.isBuffer(result.data)) {
      // Save ZIP file
      const outputDir = options.outputPath ? dirname(resolve(options.outputPath)) : dirname(absolutePath);
      const outputName = options.outputPath ? basename(options.outputPath, extname(options.outputPath)) : basename(absolutePath, extname(absolutePath));
      const zipPath = join(outputDir, `${outputName}_result.zip`);
      
      // Ensure output directory exists
      await ensureDir(outputDir);
      
      // Save ZIP file
      const { writeFileSync } = await import('fs');
      writeFileSync(zipPath, result.data);
      
      if (!jsonOutput) {
        printSuccess(`Result saved to: ${zipPath}`);
      }
      
      // Extract ZIP if not disabled
      let extractedDir = null;
      if (!options.noExtract) {
        extractedDir = join(outputDir, `${outputName}_result`);
        
        if (!jsonOutput) {
          printInfo('Extracting result files...');
        }
        
        await extractZip(zipPath, extractedDir);
        
        if (!jsonOutput) {
          printSuccess(`Extracted to: ${extractedDir}`);
        }
      }
      
      // Read metadata from ZIP
      const metadata = await readMetadataFromZip(zipPath);
      const contents = await parseZipContents(zipPath);
      
      const endTime = Date.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);
      
      // Count total files from contents object
      let fileCount = 0;
      if (contents) {
        if (contents.markdown) fileCount++;
        if (contents.original) fileCount++;
        if (contents.metadata) fileCount++;
        if (contents.visualizationPdf) fileCount++;
        fileCount += (contents.images || []).length;
      }
      
      // Output results
      if (jsonOutput) {
        console.log(JSON.stringify({
          success: true,
          file: basename(absolutePath),
          mode,
          resolution,
          dpi,
          maxPages,
          processing: useAsync ? 'async' : 'sync',
          zipPath,
          extractedDir,
          processingTime: `${processingTime}s`,
          metadata,
          contents
        }, null, 2));
      } else {
        console.log();
        printSummary({
          'Processing Time': `${processingTime}s`,
          'ZIP File': zipPath,
          'Extracted Directory': extractedDir || '(not extracted)',
          'Result Files': fileCount
        });
        
        if (contents && fileCount > 0) {
          console.log();
          printInfo('Contents:');
          if (contents.markdown) console.log(`  - ${contents.markdown}`);
          if (contents.original) console.log(`  - ${contents.original}`);
          if (contents.metadata) console.log(`  - ${contents.metadata}`);
          if (contents.visualizationPdf) console.log(`  - ${contents.visualizationPdf}`);
          if (contents.images && contents.images.length > 0) {
            console.log(`  - images/ (${contents.images.length} files)`);
          }
        }
        
        if (metadata) {
          console.log();
          printInfo('Metadata:');
          console.log(JSON.stringify(metadata, null, 2));
        }
      }
    } else {
      // Direct response (not ZIP)
      const endTime = Date.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);
      
      if (jsonOutput) {
        console.log(JSON.stringify({
          success: true,
          file: basename(absolutePath),
          mode,
          resolution,
          dpi,
          maxPages,
          processing: useAsync ? 'async' : 'sync',
          processingTime: `${processingTime}s`,
          result: result.data
        }, null, 2));
      } else {
        console.log();
        printSummary({
          'Processing Time': `${processingTime}s`,
          'Status': 'Success'
        });
        console.log();
        printInfo('Result:');
        console.log(JSON.stringify(result.data, null, 2));
      }
    }
    
  } catch (error) {
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    if (jsonOutput) {
      console.error(JSON.stringify({
        success: false,
        error: error.message,
        file: basename(pdfPath)
      }, null, 2));
    } else {
      printError(`Failed to process PDF: ${error.message}`);
      
      // User-friendly error messages
      if (error.response) {
        const status = error.response.status;
        console.log();
        if (status === 401 || status === 403) {
          printInfo('Authentication failed. Please check your API key:');
          printInfo('  - Run: deepseek-ocr config init');
          printInfo('  - Or set: DEEPSEEK_OCR_API_KEY environment variable');
          printInfo('  - Or use: --api-key YOUR_KEY');
        } else if (status === 413) {
          printInfo('File is too large. Maximum size is 20MB.');
          printInfo('Try reducing the number of pages with --max-pages');
        } else if (status === 400) {
          printInfo('Bad request. Check your parameters:');
          printInfo(`  - Mode: ${options.mode || 'default'}`);
          printInfo(`  - Resolution: ${options.resolution || 'default'}`);
          printInfo(`  - DPI: ${options.dpi || 'default'}`);
          printInfo(`  - Max Pages: ${options.maxPages || 'default'}`);
        } else if (status >= 500) {
          printInfo('Server error. Please try again later.');
        }
      }
    }
    
    process.exit(1);
  }
}

/**
 * Create PDF command
 */
export function createPdfCommand() {
  const pdf = new Command('pdf')
    .description('Perform OCR on a PDF document')
    .argument('<file>', 'Path to PDF file')
    .option('-m, --mode <mode>', 'OCR mode (document_markdown, free_ocr, figure_parse, grounding_ocr, custom)')
    .option('-r, --resolution <resolution>', 'Resolution (Tiny, Small, Base, Large, Gundam)')
    .option('-d, --dpi <dpi>', 'DPI for rendering (72-300)', parseInt)
    .option('--max-pages <pages>', 'Maximum pages to process (1-100)', parseInt)
    .option('-p, --prompt <prompt>', 'Custom prompt (required for custom mode)')
    .option('--sync', 'Force synchronous processing')
    .option('--async', 'Force asynchronous processing')
    .option('-o, --output-path <path>', 'Custom output path for result files')
    .option('--no-extract', 'Do not auto-extract ZIP file')
    .option('--verbose', 'Enable verbose logging')
    .option('--json', 'Output in JSON format')
    .action(handlePdfOcr);

  return pdf;
}

export default createPdfCommand;
