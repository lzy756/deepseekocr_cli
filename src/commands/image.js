import { Command } from 'commander';
import { resolve, basename, extname, dirname, join } from 'path';
import { statSync } from 'fs';
import chalk from 'chalk';
import { validateImageFile, validateMode, validateResolution, validateCustomPrompt } from '../lib/validator.js';
import OCRClient from '../lib/client.js';
import { getEffectiveConfig, validateConfig } from '../lib/config-precedence.js';
import { printSuccess, printError, printWarning, printInfo, printVerboseInfo, printVerboseSuccess, printKeyValue, printSection, printSummary } from '../lib/output.js';
import { createProgressBar, uploadProgressHandler } from '../lib/progress.js';
import { extractZip, ensureDir, readMetadataFromZip, parseZipContents } from '../lib/utils.js';
import { MODES } from '../constants.js';

/**
 * Handle image OCR command
 */
async function handleImageOcr(imagePath, options, command) {
  const startTime = Date.now();

  // Get global options from parent command (do this outside try-catch for error handling)
  const globalOpts = command.optsWithGlobals();
  const verbose = options.verbose || globalOpts.verbose;
  const outputFormat = options.output || globalOpts.output || 'text';
  const jsonOutput = outputFormat === 'json';

  let progressBar = null;  // Declare progress bar at function scope for cleanup
  let config = null;  // Declare config at function scope for error reporting
  let mode = null;  // Declare mode at function scope for error reporting

  try {
    // Resolve absolute path
    const absolutePath = resolve(imagePath);

    // Get effective configuration
    config = getEffectiveConfig({
      apiKey: options.apiKey || globalOpts.apiKey,
      baseUrl: options.baseUrl || globalOpts.baseUrl,
      mode: options.mode,
      resolution: options.resolution
    });
    
    // Validate configuration
    validateConfig(config);
    
    // Validate image file
    if (verbose && !jsonOutput) {
      printVerboseInfo(`Validating image file: ${absolutePath}`);
    }
    validateImageFile(absolutePath);
    
    if (verbose && !jsonOutput) {
      printVerboseSuccess('Image file validation passed');
    }
    
    // Validate mode and resolution
    mode = options.mode || config.defaults.mode;
    const resolution = options.resolution || config.defaults.resolution;
    
    if (verbose && !jsonOutput) {
      printVerboseInfo('Validating OCR parameters...');
      console.log(`    Mode: ${mode}`);
      console.log(`    Resolution: ${resolution}`);
    }
    
    validateMode(mode);
    validateResolution(resolution);
    
    if (verbose && !jsonOutput) {
      printVerboseSuccess('Parameters validated');
    }
    
    // Validate custom prompt if in custom mode
    if (mode === MODES.CUSTOM) {
      if (!options.prompt) {
        throw new Error('Custom prompt is required when using custom mode. Use --prompt "your prompt here"');
      }
      validateCustomPrompt(options.prompt);
      if (verbose && !jsonOutput) {
        printVerboseInfo(`Custom prompt: ${options.prompt}`);
      }
    }
    
    // Initialize API client
    if (verbose && !jsonOutput) {
      printVerboseInfo(`Connecting to API: ${config.api.baseUrl}`);
    }

    const client = new OCRClient(config.api.baseUrl, config.api.key, {
      timeout: config.api.timeout,
      verbose: verbose,
      onRetryCallback: (retryCount, error, maxRetries) => {
        try {
          // Temporarily stop progress bar to show retry message cleanly
          const hadProgressBar = !!progressBar;
          if (progressBar) {
            try {
              progressBar.stop();
              progressBar = null;
            } catch (e) {
              // Ignore errors
            }
          }

          // Show retry message
          console.log();  // Empty line before message
          if (error.response && error.response.status >= 500) {
            printWarning(`Server error (${error.response.status}), retrying ${retryCount}/${maxRetries}...`);

            // Show detailed error in verbose mode
            if (verbose) {
              // Show request context
              console.log(chalk.gray('  Request context:'));
              console.log(chalk.gray(`    • File: ${basename(imagePath)}`));
              const displayMode = mode || options.mode || '(unknown)';
              const displayResolution = options.resolution || (config ? config.defaults.resolution : '(unknown)');
              console.log(chalk.gray(`    • Mode: ${displayMode}`));
              console.log(chalk.gray(`    • Resolution: ${displayResolution}`));

              // Show error response
              if (error.response.data) {
                try {
                  let errorData = error.response.data;

                  // Convert Buffer to string if needed
                  if (Buffer.isBuffer(errorData)) {
                    errorData = errorData.toString('utf-8');
                  }

                  // Try to parse as JSON for pretty printing
                  if (typeof errorData === 'string') {
                    try {
                      const parsed = JSON.parse(errorData);
                      console.log(chalk.gray('  Server response:'));
                      const formatted = JSON.stringify(parsed, null, 2)
                        .split('\n')
                        .map(line => `    ${line}`)
                        .join('\n');
                      console.log(chalk.gray(formatted));
                    } catch (e) {
                      // Not JSON, print as string (truncate if too long)
                      const responsePreview = errorData.length > 200
                        ? errorData.substring(0, 200) + '...'
                        : errorData;
                      console.log(chalk.gray(`  Server response: ${responsePreview}`));
                    }
                  } else {
                    console.log(chalk.gray(`  Server response: ${JSON.stringify(errorData, null, 2)}`));
                  }
                } catch (e) {
                  console.log(chalk.gray(`  Server response: [Unable to parse]`));
                }
              }
            }
          } else if (verbose) {
            printInfo(`⚠ Retry ${retryCount}/${maxRetries}: ${error.message}`);
          }
          console.log();  // Empty line after message

          // Recreate progress bar if it existed
          if (hadProgressBar && !jsonOutput) {
            progressBar = createProgressBar('Uploading and processing');
          }
        } catch (callbackError) {
          // Ensure retry callback errors don't break the retry mechanism
          console.error(chalk.red('Warning: Error in retry callback:'), callbackError.message);
        }
      }
    });
    
    if (verbose && !jsonOutput) {
      printVerboseSuccess('API client initialized');
    }
    
    // Prepare request data
    const requestData = {
      mode,
      resolution
    };
    
    if (mode === MODES.CUSTOM && options.prompt) {
      requestData.custom_prompt = options.prompt;
    }
    
    if (!jsonOutput) {
      console.log(); // Empty line before section
      printSection('Image OCR');
      printKeyValue('File', basename(absolutePath));
      printKeyValue('Mode', mode);
      printKeyValue('Resolution', resolution);
      if (mode === MODES.CUSTOM) {
        printKeyValue('Prompt', options.prompt);
      }
      console.log();
    }
    
    // Perform OCR
    if (verbose && !jsonOutput) {
      console.log(); // Empty line before sending
      printVerboseInfo('Sending OCR request to API...');
      console.log(); // Empty line after, before progress bar
    }
    
    // Create progress bar for upload
    if (!jsonOutput) {
      progressBar = createProgressBar('Uploading and processing');
    }
    
    // Prepare options with progress handler
    const imageOptions = {
      ...requestData,
      onUploadProgress: progressBar ? uploadProgressHandler(progressBar) : undefined
    };
    
    const result = await client.ocrImage(
      absolutePath,
      imageOptions
    );

    // Stop progress bar after successful request
    if (progressBar) {
      progressBar.stop();
      progressBar = null;
    }
    
    if (verbose && !jsonOutput) {
      printVerboseSuccess('OCR request completed successfully');
    }
    
    // Handle response
    if (!result) {
      throw new Error('Invalid response from API: missing data');
    }
    
    // Check if result is ZIP file (Buffer)
    if (Buffer.isBuffer(result)) {
      // Save ZIP file
      const outputDir = options.outputPath ? dirname(resolve(options.outputPath)) : dirname(absolutePath);
      const outputName = options.outputPath ? basename(options.outputPath, extname(options.outputPath)) : basename(absolutePath, extname(absolutePath));
      const zipPath = join(outputDir, `${outputName}_result.zip`);
      
      // Ensure output directory exists
      await ensureDir(outputDir);
      
      // Save ZIP file
      if (verbose && !jsonOutput) {
        printVerboseInfo(`Saving result to: ${zipPath}`);
      }
      
      const { writeFileSync } = await import('fs');
      writeFileSync(zipPath, result);
      
      if (!jsonOutput) {
        printSuccess(`Result saved to: ${zipPath}`);
      }
      
      // Extract ZIP if not disabled
      let extractedDir = null;
      if (!options.noExtract) {
        extractedDir = join(outputDir, `${outputName}_result`);
        
        if (verbose && !jsonOutput) {
          printVerboseInfo('Extracting ZIP archive...');
        } else if (!jsonOutput) {
          printInfo('Extracting result files...');
        }
        
        await extractZip(zipPath, extractedDir);
        
        if (!jsonOutput) {
          printSuccess(`Extracted to: ${extractedDir}`);
        }
        
        if (verbose && !jsonOutput) {
          // List extracted files
          const { readdirSync, statSync } = await import('fs');
          const files = readdirSync(extractedDir);
          printVerboseInfo(`Extracted ${files.length} file(s):`);
          files.forEach(file => {
            const filePath = join(extractedDir, file);
            const stats = statSync(filePath);
            const size = stats.isDirectory() ? 'dir' : `${(stats.size / 1024).toFixed(1)}KB`;
            console.log(`    - ${file} (${size})`);
          });
        }
      }
      
      // Read metadata from ZIP
      const metadata = await readMetadataFromZip(zipPath);
      const contents = await parseZipContents(zipPath);
      
      const endTime = Date.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);
      
      // Output results
      if (jsonOutput) {
        console.log(JSON.stringify({
          success: true,
          file: basename(absolutePath),
          mode,
          resolution,
          zipPath,
          extractedDir,
          processingTime: `${processingTime}s`,
          metadata,
          contents
        }, null, 2));
      } else {
        console.log();
        
        // Count result files from contents object
        let fileCount = 0;
        const fileList = [];
        if (contents) {
          if (contents.markdown) { fileCount++; fileList.push(contents.markdown); }
          if (contents.original) { fileCount++; fileList.push(contents.original); }
          if (contents.metadata) { fileCount++; fileList.push(contents.metadata); }
          if (contents.visualizationPdf) { fileCount++; fileList.push(contents.visualizationPdf); }
          if (contents.images) { fileCount += contents.images.length; fileList.push(...contents.images); }
        }
        
        printSummary({
          'Processing Time': `${processingTime}s`,
          'ZIP File': zipPath,
          'Extracted Directory': extractedDir || '(not extracted)',
          'Result Files': fileCount
        });
        
        if (fileList.length > 0) {
          console.log();
          printInfo('Contents:');
          fileList.forEach(file => {
            console.log(`  - ${file}`);
          });
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
          processingTime: `${processingTime}s`,
          result: result
        }, null, 2));
      } else {
        console.log();
        printSummary({
          'Processing Time': `${processingTime}s`,
          'Status': 'Success'
        });
        console.log();
        printInfo('Result:');
        console.log(JSON.stringify(result, null, 2));
      }
    }
    
  } catch (error) {
    // Stop progress bar on error
    if (progressBar) {
      progressBar.stop();
      progressBar = null;
    }

    if (jsonOutput) {
      console.error(JSON.stringify({
        success: false,
        error: error.message,
        file: basename(imagePath)
      }, null, 2));
    } else {
      printError(`Failed to process image: ${error.message}`);

      // User-friendly error messages
      if (error.response) {
        const status = error.response.status;
        console.log();

        // Verbose mode: show detailed error information first
        if (verbose) {
          printInfo('Error Details:');
          printInfo(`  - HTTP Status: ${status} ${error.response.statusText || ''}`);
          printInfo(`  - Request URL: ${error.config?.url || 'unknown'}`);
          printInfo(`  - Request Method: ${error.config?.method?.toUpperCase() || 'unknown'}`);

          // Show request parameters
          if (error.config) {
            printInfo('  - Request Parameters:');
            const displayMode = mode || options.mode || '(unknown)';
            const displayResolution = options.resolution || (config ? config.defaults.resolution : '(unknown)');
            printInfo(`      • Mode: ${displayMode}`);
            printInfo(`      • Resolution: ${displayResolution}`);
            if (mode === MODES.CUSTOM && options.prompt) {
              const promptPreview = options.prompt.length > 100
                ? options.prompt.substring(0, 100) + '...'
                : options.prompt;
              printInfo(`      • Custom Prompt: ${promptPreview}`);
            }
            const fileSize = statSync(imagePath).size;
            const fileSizeKB = (fileSize / 1024).toFixed(2);
            printInfo(`      • File: ${basename(imagePath)} (${fileSizeKB} KB)`);
          }

          // Show response data
          if (error.response.data) {
            try {
              let errorData = error.response.data;

              // Convert Buffer to string if needed
              if (Buffer.isBuffer(errorData)) {
                errorData = errorData.toString('utf-8');
              }

              // Try to parse and format JSON
              if (typeof errorData === 'string') {
                try {
                  const parsed = JSON.parse(errorData);
                  printInfo('  - Response:');
                  const formatted = JSON.stringify(parsed, null, 2)
                    .split('\n')
                    .map(line => `    ${line}`)
                    .join('\n');
                  console.log(chalk.gray(formatted));
                } catch (e) {
                  // Not JSON, print as plain text (truncate if too long)
                  const responsePreview = errorData.length > 500
                    ? errorData.substring(0, 500) + '...'
                    : errorData;
                  printInfo(`  - Response: ${responsePreview}`);
                }
              } else {
                printInfo(`  - Response: ${JSON.stringify(errorData, null, 2)}`);
              }
            } catch (e) {
              printInfo(`  - Response: [Unable to parse response data]`);
            }
          }
          console.log();
        }

        // User-friendly suggestions
        if (status === 401 || status === 403) {
          printInfo('Authentication failed. Please check your API key:');
          printInfo('  - Run: deepseek-ocr config init');
          printInfo('  - Or set: DEEPSEEK_OCR_API_KEY environment variable');
          printInfo('  - Or use: --api-key YOUR_KEY');
        } else if (status === 413) {
          printInfo('File is too large. Maximum size is 20MB.');
          printInfo('Try using a smaller image or compress it first.');
        } else if (status === 400) {
          printInfo('Bad request. Check your parameters:');
          printInfo(`  - Mode: ${options.mode || 'default'}`);
          printInfo(`  - Resolution: ${options.resolution || 'default'}`);
        } else if (status >= 500) {
          printInfo('Server error occurred. This may indicate:');
          printInfo('  - The OCR service encountered an internal error');
          printInfo('  - The image format may not be fully supported');
          printInfo('  - The server may be overloaded');
          printInfo('  - Please check server logs for more details');
        }
      } else if (verbose) {
        // Network errors or other issues
        console.log();
        printInfo('Error Details:');
        printInfo(`  - Error Type: ${error.code || 'Unknown'}`);
        printInfo(`  - Message: ${error.message}`);
        if (error.stack) {
          console.log(chalk.gray(error.stack));
        }
      }
    }

    process.exit(1);
  } finally {
    // Ensure progress bar is always cleaned up
    if (progressBar) {
      try {
        progressBar.stop();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  }
}

/**
 * Create image command
 */
export function createImageCommand() {
  const image = new Command('image')
    .description('Perform OCR on a single image')
    .argument('<file>', 'Path to image file (jpg, png, webp, bmp)')
    .option('-m, --mode <mode>', 'OCR mode (document_markdown, free_ocr, figure_parse, grounding_ocr, custom)')
    .option('-r, --resolution <resolution>', 'Resolution (Tiny, Small, Base, Large, Gundam)')
    .option('-p, --prompt <prompt>', 'Custom prompt (required for custom mode)')
    .option('-o, --output-path <path>', 'Custom output path for result files')
    .option('--no-extract', 'Do not auto-extract ZIP file')
    .option('--verbose', 'Enable verbose logging')
    .option('--json', 'Output in JSON format')
    .action(handleImageOcr);

  return image;
}

export default createImageCommand;
