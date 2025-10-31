# Troubleshooting Guide

Common issues and solutions for DeepSeek-OCR CLI.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Issues](#configuration-issues)
- [API Connection Issues](#api-connection-issues)
- [File Processing Issues](#file-processing-issues)
- [Performance Issues](#performance-issues)
- [Error Messages](#error-messages)

## Installation Issues

### "command not found: deepseek-ocr"

**Problem**: CLI not found after installation.

**Solutions:**

1. **Verify Installation:**
   ```bash
   npm list -g deepseek-ocr-cli
   ```

2. **Check npm Global Path:**
   ```bash
   npm config get prefix
   ```
   
   Ensure this path is in your system PATH.

3. **Reinstall Globally:**
   ```bash
   npm uninstall -g deepseek-ocr-cli
   npm install -g deepseek-ocr-cli
   ```

4. **Use npx (alternative):**
   ```bash
   npx deepseek-ocr-cli --version
   ```

### "Permission Denied" (macOS/Linux)

**Problem**: EACCES error during global installation.

**Solutions:**

1. **Use sudo (quick fix):**
   ```bash
   sudo npm install -g deepseek-ocr-cli
   ```

2. **Change npm directory (recommended):**
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   npm install -g deepseek-ocr-cli
   ```

3. **Use nvm (best practice):**
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install --lts
   npm install -g deepseek-ocr-cli
   ```

### "Node Version Incompatible"

**Problem**: Node.js version too old.

**Solution:**

```bash
# Check version
node --version

# Update Node.js to LTS (18.x or higher)
# Using nvm:
nvm install --lts
nvm use --lts

# Or download from nodejs.org
```

## Configuration Issues

### "Missing API Key"

**Problem**: API key not configured.

**Solutions:**

1. **Run Configuration Wizard:**
   ```bash
   deepseek-ocr config init
   ```

2. **Set Environment Variable:**
   ```bash
   export DEEPSEEK_API_KEY=sk-your-key-here
   ```

3. **Use Command-Line Flag:**
   ```bash
   deepseek-ocr image doc.jpg --api-key sk-your-key-here
   ```

### "Config File Not Found"

**Problem**: Configuration file missing or corrupted.

**Solution:**

```bash
# Reinitialize configuration
deepseek-ocr config init

# Or manually create config directory:
# Linux/macOS:
mkdir -p ~/.config/deepseek-ocr

# Windows:
mkdir %APPDATA%\deepseek-ocr
```

### "Invalid Configuration"

**Problem**: Configuration file has invalid syntax.

**Solution:**

```bash
# View current config
deepseek-ocr config show

# Reset by removing and recreating
# Linux/macOS:
rm ~/.config/deepseek-ocr/config.json
deepseek-ocr config init

# Windows:
del %APPDATA%\deepseek-ocr\config.json
deepseek-ocr config init
```

## API Connection Issues

### "Service Unreachable" / "ECONNREFUSED"

**Problem**: Cannot connect to API server.

**Solutions:**

1. **Check Service Status:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Verify Base URL:**
   ```bash
   deepseek-ocr config show
   # Check if base URL is correct
   ```

3. **Update Base URL:**
   ```bash
   deepseek-ocr config set api.baseUrl http://correct-url:8000
   ```

4. **Test Health:**
   ```bash
   deepseek-ocr health check --verbose
   ```

### "401 Unauthorized" / "403 Forbidden"

**Problem**: Authentication failed.

**Solutions:**

1. **Verify API Key:**
   ```bash
   deepseek-ocr config show
   # Check if API key is correct (partially masked)
   ```

2. **Update API Key:**
   ```bash
   deepseek-ocr config set api.key sk-correct-key-here
   ```

3. **Test Connection:**
   ```bash
   deepseek-ocr health check
   ```

4. **Check Key Format:**
   - Should start with `sk-`
   - No leading/trailing spaces
   - Correct length

### "Timeout" / "ETIMEDOUT"

**Problem**: Request timed out.

**Solutions:**

1. **Check Network:**
   ```bash
   ping api.example.com
   ```

2. **Increase Timeout:**
   ```bash
   deepseek-ocr config set api.timeout 60000  # 60 seconds
   ```

3. **Check Firewall:**
   - Ensure port 8000 (or configured port) is open
   - Check corporate firewall/proxy settings

4. **Use VPN (if required):**
   - Connect to VPN if API is internal
   - Check VPN configuration

### "DNS Lookup Failed" / "ENOTFOUND"

**Problem**: Hostname cannot be resolved.

**Solutions:**

1. **Check Hostname:**
   ```bash
   nslookup api.example.com
   ```

2. **Use IP Address:**
   ```bash
   deepseek-ocr config set api.baseUrl http://192.168.1.100:8000
   ```

3. **Check DNS Settings:**
   - Verify network DNS configuration
   - Try different DNS server (8.8.8.8)

## File Processing Issues

### "File Not Found"

**Problem**: Input file doesn't exist.

**Solutions:**

1. **Use Absolute Path:**
   ```bash
   deepseek-ocr image /full/path/to/document.jpg
   ```

2. **Check File Exists:**
   ```bash
   # Linux/macOS:
   ls -la document.jpg
   
   # Windows:
   dir document.jpg
   ```

3. **Check Permissions:**
   ```bash
   # Linux/macOS:
   chmod 644 document.jpg
   ```

### "File Too Large"

**Problem**: File exceeds 20MB limit.

**Solutions:**

1. **Compress Image:**
   ```bash
   # Using ImageMagick
   convert large.jpg -quality 85 -resize 2000x2000 compressed.jpg
   
   # Using ffmpeg
   ffmpeg -i large.jpg -q:v 5 compressed.jpg
   ```

2. **Split PDF:**
   ```bash
   # Using pdftk
   pdftk large.pdf burst
   
   # Using ghostscript
   gs -sDEVICE=pdfwrite -dNOPAUSE -dBATCH \
      -dFirstPage=1 -dLastPage=10 \
      -sOutputFile=part1.pdf large.pdf
   ```

3. **Reduce PDF DPI:**
   ```bash
   deepseek-ocr pdf scan.pdf --dpi 150  # Instead of 300
   ```

### "Unsupported File Format"

**Problem**: File format not supported.

**Supported Formats:**
- Images: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`
- Documents: `.pdf`

**Solutions:**

1. **Convert Format:**
   ```bash
   # Convert to JPEG
   convert document.tiff document.jpg
   
   # Convert to PNG
   convert image.gif image.png
   ```

2. **Check Extension:**
   ```bash
   # Rename if extension is wrong
   mv document.JPG document.jpg
   ```

### "Corrupt File" / "Invalid Format"

**Problem**: File is corrupted or invalid.

**Solutions:**

1. **Verify File:**
   ```bash
   # Check file type
   file document.jpg
   
   # View file info
   identify document.jpg  # ImageMagick
   ```

2. **Re-export/Save:**
   - Open in image editor
   - Save as new file
   - Use supported format

3. **Repair PDF:**
   ```bash
   # Using ghostscript
   gs -o repaired.pdf -sDEVICE=pdfwrite corrupt.pdf
   ```

### "Processing Failed" / "Task Failed"

**Problem**: OCR processing failed.

**Solutions:**

1. **Check File Quality:**
   - Image resolution too low
   - Image too blurry
   - Text too small

2. **Try Different Mode:**
   ```bash
   # Try free_ocr instead of document_markdown
   deepseek-ocr image doc.jpg --mode free_ocr
   ```

3. **Adjust Resolution:**
   ```bash
   # Try higher resolution
   deepseek-ocr image doc.jpg --resolution Gundam
   ```

4. **Check Logs:**
   ```bash
   deepseek-ocr image doc.jpg --verbose
   ```

## Performance Issues

### "Processing Too Slow"

**Problem**: OCR takes very long.

**Solutions:**

1. **Use Lower Resolution:**
   ```bash
   deepseek-ocr image doc.jpg --resolution Small
   ```

2. **Reduce PDF DPI:**
   ```bash
   deepseek-ocr pdf scan.pdf --dpi 150
   ```

3. **Use Async for Large Files:**
   ```bash
   deepseek-ocr pdf large.pdf --async
   ```

4. **Reduce Batch Workers:**
   ```bash
   deepseek-ocr batch images/ --workers 3
   ```

### "High Memory Usage"

**Problem**: CLI uses too much memory.

**Solutions:**

1. **Process Files Individually:**
   ```bash
   # Instead of batch, use loop
   for file in images/*; do
     deepseek-ocr image "$file"
   done
   ```

2. **Reduce Batch Size:**
   ```bash
   deepseek-ocr batch images/ --workers 1
   ```

3. **Close Other Applications:**
   - Free up system memory
   - Check background processes

### "Rate Limit Exceeded"

**Problem**: Too many API requests.

**Solutions:**

1. **Reduce Batch Workers:**
   ```bash
   deepseek-ocr batch images/ --workers 2
   ```

2. **Add Delays:**
   ```bash
   for file in images/*; do
     deepseek-ocr image "$file"
     sleep 5  # Wait 5 seconds
   done
   ```

3. **Use Async Mode:**
   ```bash
   deepseek-ocr pdf large.pdf --async
   ```

## Error Messages

### "ECONNRESET"

**Cause**: Connection reset by server.

**Solutions:**
- Retry the operation
- Check network stability
- Reduce concurrent requests

### "EPIPE" / "Broken Pipe"

**Cause**: Connection closed unexpectedly.

**Solutions:**
- Retry the operation
- Check server logs
- Verify server capacity

### "ERR_INVALID_ARG_TYPE"

**Cause**: Invalid command-line argument.

**Solutions:**
- Check command syntax: `deepseek-ocr --help`
- Use quotes for arguments with spaces
- Verify option values

### "ValidationError"

**Cause**: Invalid parameter value.

**Solutions:**
- Check allowed values:
  - Mode: `document_markdown`, `free_ocr`, `figure_parse`, `grounding_ocr`, `custom`
  - Resolution: `Tiny`, `Small`, `Base`, `Large`, `Gundam`
  - DPI: 72-300
  - Max Pages: 1-100

### "Task Not Found" / "404"

**Cause**: Task ID doesn't exist or expired.

**Solutions:**
- Verify task ID is correct
- Check if task expired (1 hour TTL)
- Use `deepseek-ocr task list` to see recent tasks

### "Task Expired" / "410"

**Cause**: Task results expired.

**Solutions:**
- Tasks expire after 1 hour
- Download results immediately after completion
- Resubmit the task if needed

## Advanced Debugging

### Enable Verbose Logging

```bash
# Show detailed request/response
deepseek-ocr image doc.jpg --verbose
```

### Capture Full Output

```bash
# Save all output to file
deepseek-ocr image doc.jpg > output.log 2>&1
```

### JSON Output for Parsing

```bash
# Machine-readable output
deepseek-ocr image doc.jpg --json
```

### Test API Directly

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test with API key
curl -H "Authorization: Bearer sk-your-key" \
     http://localhost:8000/model/info
```

### Check System Resources

```bash
# Check disk space
df -h

# Check memory
free -m  # Linux
vm_stat  # macOS

# Check processes
ps aux | grep deepseek
```

## Getting Help

If you still experience issues:

1. **Check Documentation:**
   - [Installation Guide](installation.md)
   - [Usage Guide](usage.md)
   - [README](../README.md)

2. **Search GitHub Issues:**
   - https://github.com/yourusername/deepseek-ocr-cli/issues

3. **Create New Issue:**
   Include:
   - CLI version: `deepseek-ocr --version`
   - Node.js version: `node --version`
   - Operating system
   - Complete error message
   - Steps to reproduce
   - Command used

4. **Community Support:**
   - GitHub Discussions
   - Stack Overflow (tag: deepseek-ocr)

## Preventive Measures

### Regular Maintenance

```bash
# Update CLI
npm update -g deepseek-ocr-cli

# Clear npm cache
npm cache clean --force

# Prune old task history
# Automatically done (7 days)
```

### Best Practices

1. **Test Before Batch:**
   ```bash
   # Test single file first
   deepseek-ocr image test.jpg
   ```

2. **Use Health Check:**
   ```bash
   # Verify service before heavy work
   deepseek-ocr health check
   ```

3. **Monitor Resources:**
   - Watch disk space
   - Monitor API usage
   - Check network stability

4. **Backup Configuration:**
   ```bash
   # Linux/macOS
   cp ~/.config/deepseek-ocr/config.json ~/config-backup.json
   
   # Windows
   copy %APPDATA%\deepseek-ocr\config.json config-backup.json
   ```

## Quick Reference

### Common Commands

```bash
# Health check
deepseek-ocr health check

# Show config
deepseek-ocr config show

# Test single image
deepseek-ocr image test.jpg --verbose

# Check version
deepseek-ocr --version

# Get help
deepseek-ocr --help
deepseek-ocr image --help
```

### Diagnostic Checklist

- [ ] Node.js version >= 18.0.0
- [ ] CLI installed: `deepseek-ocr --version`
- [ ] Configuration valid: `deepseek-ocr config show`
- [ ] API accessible: `deepseek-ocr health check`
- [ ] File exists and readable
- [ ] File size < 20MB
- [ ] Supported file format
- [ ] Network connection stable

