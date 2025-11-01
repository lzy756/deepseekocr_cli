import { Command } from 'commander';
import { resolve, join, basename } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import OCRClient from '../lib/client.js';
import { getEffectiveConfig, validateConfig } from '../lib/config-precedence.js';
import { printSuccess, printError, printInfo, printKeyValue, printSection, printSummary, printTable } from '../lib/output.js';
import { createProgressBar } from '../lib/progress.js';
import { extractZip } from '../lib/utils.js';

/**
 * Get history file path
 */
function getHistoryPath() {
  const configDir = process.platform === 'win32'
    ? join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'deepseek-ocr')
    : join(homedir(), '.config', 'deepseek-ocr');
  
  return join(configDir, 'history.json');
}

/**
 * Load task history
 */
function loadHistory() {
  const historyPath = getHistoryPath();
  
  if (!existsSync(historyPath)) {
    return [];
  }
  
  try {
    const content = readFileSync(historyPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

/**
 * Save task history
 */
function saveHistory(history) {
  const historyPath = getHistoryPath();
  const configDir = process.platform === 'win32'
    ? join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'deepseek-ocr')
    : join(homedir(), '.config', 'deepseek-ocr');

  // Ensure directory exists using sync method
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
}

/**
 * Add task to history
 */
function addTaskToHistory(taskId, inputFile) {
  const history = loadHistory();
  
  // Check if task already exists
  const existingIndex = history.findIndex(h => h.task_id === taskId);
  
  if (existingIndex >= 0) {
    // Update existing
    history[existingIndex].last_checked = new Date().toISOString();
  } else {
    // Add new
    history.push({
      task_id: taskId,
      input_file: inputFile,
      submitted_at: new Date().toISOString(),
      last_checked: new Date().toISOString(),
      status: 'pending'
    });
  }
  
  saveHistory(history);
}

/**
 * Update task status in history
 */
function updateTaskStatus(taskId, status, error = null) {
  const history = loadHistory();
  const taskIndex = history.findIndex(h => h.task_id === taskId);
  
  if (taskIndex >= 0) {
    history[taskIndex].status = status;
    history[taskIndex].last_checked = new Date().toISOString();
    if (error) {
      history[taskIndex].error = error;
    }
    saveHistory(history);
  }
}

/**
 * Prune old tasks (older than 7 days)
 */
function pruneOldTasks() {
  const history = loadHistory();
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  const filtered = history.filter(h => {
    const submittedDate = new Date(h.submitted_at).getTime();
    return submittedDate > sevenDaysAgo;
  });
  
  if (filtered.length < history.length) {
    saveHistory(filtered);
  }
}

/**
 * Handle task status command
 */
async function handleTaskStatus(taskId, options) {
  try {
    // Get effective configuration
    const config = getEffectiveConfig({
      apiKey: options.apiKey || options.parent?.optsWithGlobals()?.apiKey,
      baseUrl: options.baseUrl || options.parent?.optsWithGlobals()?.baseUrl
    });
    
    // Validate configuration
    validateConfig(config);
    
    // Initialize API client
    const client = new OCRClient(config.api.baseUrl, config.api.key, {
      timeout: config.api.timeout
    });
    
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    if (!jsonOutput) {
      printSection('Task Status');
      printKeyValue('Task ID', taskId);
      console.log();
      printInfo('Checking status...');
    }
    
    // Get task status
    const status = await client.getTaskStatus(taskId);
    
    // Update history
    updateTaskStatus(taskId, status.status, status.error);
    
    if (jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        task_id: taskId,
        status: status.status,
        progress: status.progress,
        timestamps: status.timestamps,
        error: status.error || null
      }, null, 2));
    } else {
      console.log();
      printSummary({
        'Status': status.status,
        'Progress': `${Math.round(status.progress * 100)}%`,
        'Submitted': status.timestamps?.submitted || 'Unknown',
        'Started': status.timestamps?.started || 'Not started',
        'Completed': status.timestamps?.completed || 'Not completed'
      });
      
      if (status.error) {
        console.log();
        printError(`Error: ${status.error}`);
      }
      
      if (status.status === 'completed') {
        console.log();
        printSuccess('Task completed successfully! Use "deepseek-ocr task download" to retrieve results.');
      } else if (status.status === 'failed') {
        console.log();
        printError('Task failed. Check the error message above.');
      } else if (status.status === 'pending' || status.status === 'processing') {
        console.log();
        printInfo('Task is still processing. Check again later or use "deepseek-ocr task wait" to wait for completion.');
      }
    }
    
  } catch (error) {
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    if (jsonOutput) {
      console.error(JSON.stringify({
        success: false,
        error: error.message,
        task_id: taskId
      }, null, 2));
    } else {
      printError(`Failed to check task status: ${error.message}`);
      
      if (error.response) {
        const status = error.response.status;
        console.log();
        if (status === 404) {
          printInfo('Task not found. Possible reasons:');
          printInfo('  - Invalid task ID');
          printInfo('  - Task expired (tasks expire after 1 hour)');
        } else if (status === 410) {
          printInfo('Task has expired. Results are no longer available.');
        }
      }
    }
    
    process.exit(1);
  }
}

/**
 * Handle task download command
 */
async function handleTaskDownload(taskId, options) {
  try {
    // Get effective configuration
    const config = getEffectiveConfig({
      apiKey: options.apiKey || options.parent?.optsWithGlobals()?.apiKey,
      baseUrl: options.baseUrl || options.parent?.optsWithGlobals()?.baseUrl
    });
    
    // Validate configuration
    validateConfig(config);
    
    // Initialize API client
    const client = new OCRClient(config.api.baseUrl, config.api.key, {
      timeout: config.api.timeout
    });
    
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    if (!jsonOutput) {
      printSection('Task Download');
      printKeyValue('Task ID', taskId);
      console.log();
    }
    
    // Create progress bar
    let progressBar = null;
    if (!jsonOutput) {
      progressBar = createProgressBar('Downloading result');
    }
    
    // Download result
    const result = await client.downloadTaskResult(taskId, {
      onDownloadProgress: progressBar ? (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded / event.total) * 100);
          progressBar.update(percent);
        }
      } : undefined
    });
    
    if (progressBar) {
      progressBar.stop();
    }
    
    // Determine output path
    const outputPath = options.outputPath ? resolve(options.outputPath) : resolve(`./${taskId}_result.zip`);
    const outputDir = options.outputPath ? resolve(options.outputPath).replace(/\.[^.]+$/, '') : resolve(`./${taskId}_result`);
    
    // Save result
    writeFileSync(outputPath, result);
    
    if (!jsonOutput) {
      printSuccess(`Result saved to: ${outputPath}`);
    }
    
    // Extract if not disabled
    let extractedDir = null;
    if (!options.noExtract) {
      if (!jsonOutput) {
        printInfo('Extracting result files...');
      }
      
      await extractZip(outputPath, outputDir);
      extractedDir = outputDir;
      
      if (!jsonOutput) {
        printSuccess(`Extracted to: ${extractedDir}`);
      }
    }
    
    // Update history
    updateTaskStatus(taskId, 'completed');
    
    if (jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        task_id: taskId,
        output_path: outputPath,
        extracted_dir: extractedDir
      }, null, 2));
    } else {
      console.log();
      printSummary({
        'ZIP File': outputPath,
        'Extracted Directory': extractedDir || '(not extracted)'
      });
    }
    
  } catch (error) {
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    if (jsonOutput) {
      console.error(JSON.stringify({
        success: false,
        error: error.message,
        task_id: taskId
      }, null, 2));
    } else {
      printError(`Failed to download task result: ${error.message}`);
      
      if (error.response) {
        const status = error.response.status;
        console.log();
        if (status === 404) {
          printInfo('Task not found or result not available. Possible reasons:');
          printInfo('  - Task is not yet completed (check status first)');
          printInfo('  - Task expired (results expire after 1 hour)');
          printInfo('  - Invalid task ID');
        } else if (status === 410) {
          printInfo('Task result has expired and is no longer available.');
        }
      }
    }
    
    process.exit(1);
  }
}

/**
 * Handle task wait command
 */
async function handleTaskWait(taskId, options) {
  try {
    // Get effective configuration
    const config = getEffectiveConfig({
      apiKey: options.apiKey || options.parent?.optsWithGlobals()?.apiKey,
      baseUrl: options.baseUrl || options.parent?.optsWithGlobals()?.baseUrl
    });
    
    // Validate configuration
    validateConfig(config);
    
    // Initialize API client
    const client = new OCRClient(config.api.baseUrl, config.api.key, {
      timeout: config.api.timeout
    });
    
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    if (!jsonOutput) {
      printSection('Task Wait');
      printKeyValue('Task ID', taskId);
      console.log();
      printInfo('Waiting for task to complete...');
      printInfo('Press Ctrl+C to cancel (task will continue on server)');
      console.log();
    }
    
    // Create progress bar
    let progressBar = null;
    if (!jsonOutput) {
      progressBar = createProgressBar('Processing', 100);
    }
    
    // Poll for completion with exponential backoff
    const startTime = Date.now();
    const maxWaitTime = 3600000; // 1 hour timeout
    let delay = 2000; // Start with 2 seconds
    const maxDelay = 30000; // Max 30 seconds
    let completed = false;

    while (!completed) {
      // Check timeout
      if (Date.now() - startTime > maxWaitTime) {
        if (progressBar) {
          progressBar.stop();
        }
        throw new Error(`Task wait timeout after ${maxWaitTime / 1000}s. Task may still be running on server. Task ID: ${taskId}`);
      }

      try {
        const status = await client.getTaskStatus(taskId);
        
        // Update progress bar
        if (progressBar) {
          const percent = Math.round(status.progress * 100);
          progressBar.update(percent);
        }
        
        // Update history
        updateTaskStatus(taskId, status.status, status.error);
        
        if (status.status === 'completed') {
          if (progressBar) {
            progressBar.stop();
          }
          
          if (!jsonOutput) {
            printSuccess('Task completed successfully!');
            console.log();
            printInfo('Downloading result...');
          }
          
          // Download result
          const result = await client.downloadTaskResult(taskId);
          
          // Determine output path
          const outputPath = options.outputPath ? resolve(options.outputPath) : resolve(`./${taskId}_result.zip`);
          const outputDir = options.outputPath ? resolve(options.outputPath).replace(/\.[^.]+$/, '') : resolve(`./${taskId}_result`);
          
          // Save result
          writeFileSync(outputPath, result);
          
          if (!jsonOutput) {
            printSuccess(`Result saved to: ${outputPath}`);
          }
          
          // Extract if not disabled
          let extractedDir = null;
          if (!options.noExtract) {
            if (!jsonOutput) {
              printInfo('Extracting result files...');
            }
            
            await extractZip(outputPath, outputDir);
            extractedDir = outputDir;
            
            if (!jsonOutput) {
              printSuccess(`Extracted to: ${extractedDir}`);
            }
          }
          
          if (jsonOutput) {
            console.log(JSON.stringify({
              success: true,
              task_id: taskId,
              status: 'completed',
              output_path: outputPath,
              extracted_dir: extractedDir
            }, null, 2));
          } else {
            console.log();
            printSummary({
              'ZIP File': outputPath,
              'Extracted Directory': extractedDir || '(not extracted)'
            });
          }
          
          completed = true;
        } else if (status.status === 'failed') {
          if (progressBar) {
            progressBar.stop();
          }
          
          throw new Error(`Task failed: ${status.error || 'Unknown error'}`);
        }
        
        // Wait before next check (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, maxDelay);
        
      } catch (error) {
        if (progressBar) {
          progressBar.stop();
        }
        throw error;
      }
    }
    
  } catch (error) {
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    if (jsonOutput) {
      console.error(JSON.stringify({
        success: false,
        error: error.message,
        task_id: taskId
      }, null, 2));
    } else {
      printError(`Failed to wait for task: ${error.message}`);
    }
    
    process.exit(1);
  }
}

/**
 * Handle task list command
 */
function handleTaskList(options) {
  try {
    // Prune old tasks first
    pruneOldTasks();
    
    const history = loadHistory();
    
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    if (history.length === 0) {
      if (jsonOutput) {
        console.log(JSON.stringify({
          success: true,
          tasks: []
        }, null, 2));
      } else {
        printInfo('No tasks found in history.');
        printInfo('Task history shows tasks from the last 7 days.');
      }
      return;
    }
    
    if (jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        tasks: history
      }, null, 2));
    } else {
      printSection('Task History');
      printInfo(`Showing ${history.length} task(s) from the last 7 days`);
      console.log();
      
      const tableData = history.map(task => ({
        'Task ID': task.task_id,
        'Status': task.status,
        'Input File': basename(task.input_file || 'Unknown'),
        'Submitted': new Date(task.submitted_at).toLocaleString()
      }));
      
      printTable(tableData);
    }
    
  } catch (error) {
    const outputFormat = options.output || options.parent?.optsWithGlobals()?.output || 'text';
    const jsonOutput = outputFormat === 'json';
    
    if (jsonOutput) {
      console.error(JSON.stringify({
        success: false,
        error: error.message
      }, null, 2));
    } else {
      printError(`Failed to list tasks: ${error.message}`);
    }
    
    process.exit(1);
  }
}

/**
 * Create task command
 */
export function createTaskCommand() {
  const task = new Command('task')
    .description('Manage asynchronous OCR tasks');
  
  // task status <task-id>
  task
    .command('status')
    .description('Check status of a task')
    .argument('<task-id>', 'Task ID to check')
    .option('--json', 'Output in JSON format')
    .action(handleTaskStatus);
  
  // task download <task-id>
  task
    .command('download')
    .description('Download result of a completed task')
    .argument('<task-id>', 'Task ID to download')
    .option('-o, --output-path <path>', 'Custom output path for result ZIP file')
    .option('--no-extract', 'Do not auto-extract ZIP file')
    .option('--json', 'Output in JSON format')
    .action(handleTaskDownload);
  
  // task wait <task-id>
  task
    .command('wait')
    .description('Wait for task to complete and auto-download result')
    .argument('<task-id>', 'Task ID to wait for')
    .option('-o, --output-path <path>', 'Custom output path for result ZIP file')
    .option('--no-extract', 'Do not auto-extract ZIP file')
    .option('--json', 'Output in JSON format')
    .action(handleTaskWait);
  
  // task list
  task
    .command('list')
    .description('List recent tasks from history')
    .option('--json', 'Output in JSON format')
    .action(handleTaskList);
  
  return task;
}

// Export function for adding tasks to history
export { addTaskToHistory };

export default createTaskCommand;
