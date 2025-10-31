/**
 * API Client for DeepSeek-OCR
 * Handles all HTTP communication with the API
 */

import axios from 'axios';
import axiosRetry from 'axios-retry';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { DEFAULTS } from '../constants.js';

export class OCRClient {
  /**
   * Create API client instance
   * @param {string} baseURL - API base URL
   * @param {string} apiKey - API key for authentication
   * @param {object} options - Additional options
   */
  constructor(baseURL, apiKey, options = {}) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.maxRetries = options.maxRetries || DEFAULTS.MAX_RETRIES;

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 300000, // 5 minutes
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: this.maxRetries,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Retry on network errors or 5xx status codes
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response && error.response.status >= 500)
        );
      },
      onRetry: (retryCount, error) => {
        if (options.verbose) {
          console.log(`Retry ${retryCount}/${this.maxRetries}: ${error.message}`);
        }
      },
    });
  }

  /**
   * Health check
   * @returns {Promise<object>} Health status
   */
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Get model information
   * @returns {Promise<object>} Model info
   */
  async getModelInfo() {
    const response = await this.client.get('/api/v1/info');
    return response.data;
  }

  /**
   * OCR image file
   * @param {string} imagePath - Path to image file
   * @param {object} options - OCR options
   * @returns {Promise<Buffer>} ZIP file content
   */
  async ocrImage(imagePath, options = {}) {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath), {
      filename: path.basename(imagePath),
    });
    form.append('mode', options.mode || DEFAULTS.MODE);
    form.append('resolution_preset', options.resolution || DEFAULTS.RESOLUTION);
    
    if (options.customPrompt) {
      form.append('custom_prompt', options.customPrompt);
    }

    const response = await this.client.post('/api/v1/ocr/image', form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer',
      onUploadProgress: options.onUploadProgress,
      onDownloadProgress: options.onDownloadProgress,
    });

    return Buffer.from(response.data);
  }

  /**
   * OCR image from URL
   * @param {string} imageUrl - Image URL
   * @param {object} options - OCR options
   * @returns {Promise<Buffer>} ZIP file content
   */
  async ocrImageUrl(imageUrl, options = {}) {
    const form = new FormData();
    form.append('image_url', imageUrl);
    form.append('mode', options.mode || DEFAULTS.MODE);
    form.append('resolution_preset', options.resolution || DEFAULTS.RESOLUTION);
    
    if (options.customPrompt) {
      form.append('custom_prompt', options.customPrompt);
    }

    const response = await this.client.post('/api/v1/ocr/image', form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer',
      onDownloadProgress: options.onDownloadProgress,
    });

    return Buffer.from(response.data);
  }

  /**
   * OCR PDF synchronously
   * @param {string} pdfPath - Path to PDF file
   * @param {object} options - OCR options
   * @returns {Promise<Buffer>} ZIP file content
   */
  async ocrPdfSync(pdfPath, options = {}) {
    const form = new FormData();
    form.append('file', fs.createReadStream(pdfPath), {
      filename: path.basename(pdfPath),
      contentType: 'application/pdf',
    });
    form.append('mode', options.mode || DEFAULTS.MODE);
    form.append('resolution_preset', options.resolution || DEFAULTS.RESOLUTION);
    form.append('dpi', options.dpi || DEFAULTS.DPI);
    
    if (options.maxPages) {
      form.append('max_pages', options.maxPages);
    }
    if (options.customPrompt) {
      form.append('custom_prompt', options.customPrompt);
    }

    const response = await this.client.post('/api/v1/ocr/pdf', form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer',
      timeout: 600000, // 10 minutes for sync PDF
      onUploadProgress: options.onUploadProgress,
      onDownloadProgress: options.onDownloadProgress,
    });

    return Buffer.from(response.data);
  }

  /**
   * OCR PDF asynchronously (submit task)
   * @param {string} pdfPath - Path to PDF file
   * @param {object} options - OCR options
   * @returns {Promise<string>} Task ID
   */
  async ocrPdfAsync(pdfPath, options = {}) {
    const form = new FormData();
    form.append('file', fs.createReadStream(pdfPath), {
      filename: path.basename(pdfPath),
      contentType: 'application/pdf',
    });
    form.append('mode', options.mode || DEFAULTS.MODE);
    form.append('resolution_preset', options.resolution || DEFAULTS.RESOLUTION);
    form.append('dpi', options.dpi || DEFAULTS.DPI);
    
    if (options.maxPages) {
      form.append('max_pages', options.maxPages);
    }
    if (options.customPrompt) {
      form.append('custom_prompt', options.customPrompt);
    }

    const response = await this.client.post('/api/v1/ocr/pdf/async', form, {
      headers: form.getHeaders(),
      onUploadProgress: options.onUploadProgress,
    });

    return response.data.task_id;
  }

  /**
   * Get task status
   * @param {string} taskId - Task ID
   * @returns {Promise<object>} Task status
   */
  async getTaskStatus(taskId) {
    const response = await this.client.get(`/api/v1/ocr/task/${taskId}`);
    return response.data;
  }

  /**
   * Download task result
   * @param {string} taskId - Task ID
   * @param {object} options - Download options
   * @returns {Promise<Buffer>} ZIP file content
   */
  async downloadTaskResult(taskId, options = {}) {
    const response = await this.client.get(`/api/v1/ocr/task/${taskId}/download`, {
      responseType: 'arraybuffer',
      onDownloadProgress: options.onDownloadProgress,
    });

    return Buffer.from(response.data);
  }

  /**
   * Wait for task completion with polling
   * @param {string} taskId - Task ID
   * @param {object} options - Polling options
   * @returns {Promise<object>} Final task status
   */
  async waitForTask(taskId, options = {}) {
    const initialDelay = options.initialDelay || DEFAULTS.POLL_INTERVAL;
    const maxDelay = options.maxDelay || DEFAULTS.MAX_POLL_INTERVAL;
    const timeout = options.timeout || 600000; // 10 minutes default
    const onProgress = options.onProgress || (() => {});

    const startTime = Date.now();
    let delay = initialDelay;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(`Task timeout after ${timeout / 1000}s`);
      }

      // Query status
      const status = await this.getTaskStatus(taskId);
      
      // Call progress callback
      onProgress(status);

      // Check completion
      if (status.status === 'completed') {
        return status;
      } else if (status.status === 'failed') {
        const errorMsg = status.error?.message || 'Unknown error';
        throw new Error(`Task failed: ${errorMsg}`);
      }

      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, maxDelay);
    }
  }
}

export default OCRClient;
