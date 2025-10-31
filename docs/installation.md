# Installation Guide

This guide covers all methods for installing DeepSeek-OCR CLI tool.

## Prerequisites

Before installing, ensure you have:

- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm**: Comes bundled with Node.js
- **Operating System**: Windows, macOS, or Linux
- **DeepSeek-OCR API**: Access to a running DeepSeek-OCR API server

### Check Node.js Version

```bash
node --version
# Should output v18.0.0 or higher
```

If Node.js is not installed or outdated:
- Download from [nodejs.org](https://nodejs.org/)
- Use a version manager like [nvm](https://github.com/nvm-sh/nvm) (recommended)

## Installation Methods

### Method 1: Global Installation (Recommended)

Install globally to use `deepseek-ocr` command from anywhere:

```bash
npm install -g deepseek-ocr-cli
```

**Verify Installation:**

```bash
deepseek-ocr --version
```

**Benefits:**
- Command available system-wide
- Easy to use from any directory
- Automatic PATH configuration

**Note:** On some systems, you may need to use `sudo`:

```bash
sudo npm install -g deepseek-ocr-cli
```

### Method 2: Local Installation

Install locally in your project:

```bash
# Create a new directory
mkdir my-ocr-project
cd my-ocr-project

# Initialize npm project
npm init -y

# Install locally
npm install deepseek-ocr-cli
```

**Run Commands:**

```bash
# Using npx
npx deepseek-ocr --version

# Or add to package.json scripts
```

**Benefits:**
- Project-specific version
- No global namespace pollution
- Easy version management per project

### Method 3: From Source

Install directly from GitHub repository:

```bash
# Clone repository
git clone https://github.com/yourusername/deepseek-ocr-cli.git
cd deepseek-ocr-cli

# Install dependencies
npm install

# Link globally (makes command available)
npm link
```

**Verify Installation:**

```bash
deepseek-ocr --version
```

**Benefits:**
- Latest development version
- Ability to contribute/modify
- Full source code access

### Method 4: Direct from GitHub

Install specific version/branch:

```bash
# Install latest from main branch
npm install -g github:yourusername/deepseek-ocr-cli

# Install specific version
npm install -g github:yourusername/deepseek-ocr-cli#v1.0.0

# Install from specific branch
npm install -g github:yourusername/deepseek-ocr-cli#develop
```

## Platform-Specific Notes

### Windows

**PowerShell Execution Policy:**

If you encounter script execution errors:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**PATH Configuration:**

Global npm packages are installed to:
```
%APPDATA%\npm
```

Ensure this is in your PATH environment variable.

### macOS/Linux

**Permission Issues:**

If global installation fails:

1. **Option 1: Use sudo** (quick fix)
   ```bash
   sudo npm install -g deepseek-ocr-cli
   ```

2. **Option 2: Change npm's default directory** (recommended)
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Option 3: Use nvm** (best practice)
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install --lts
   npm install -g deepseek-ocr-cli
   ```

## Post-Installation Setup

### 1. Verify Installation

```bash
# Check version
deepseek-ocr --version

# Check help
deepseek-ocr --help
```

### 2. Configure API Credentials

```bash
# Run interactive configuration
deepseek-ocr config init
```

You'll be prompted for:
- **API Base URL**: Your DeepSeek-OCR API endpoint
- **API Key**: Your authentication key

### 3. Test Connection

```bash
# Check service health
deepseek-ocr health check

# Get model information
deepseek-ocr health info
```

### 4. Prepare Test Files

Create a test directory with sample files:

```bash
mkdir ocr-test
cd ocr-test

# Download sample image (or use your own)
curl -o test.jpg https://example.com/sample-image.jpg

# Test OCR
deepseek-ocr image test.jpg
```

## Updating

### Global Installation

```bash
npm update -g deepseek-ocr-cli
```

### Local Installation

```bash
npm update deepseek-ocr-cli
```

### From Source

```bash
cd deepseek-ocr-cli
git pull origin main
npm install
```

## Uninstallation

### Global Installation

```bash
npm uninstall -g deepseek-ocr-cli
```

### Local Installation

```bash
npm uninstall deepseek-ocr-cli
```

### From Source

```bash
npm unlink
# Optionally delete cloned directory
rm -rf deepseek-ocr-cli
```

### Clean Configuration

To remove all configuration and history:

**Linux/macOS:**
```bash
rm -rf ~/.config/deepseek-ocr
```

**Windows:**
```powershell
Remove-Item -Recurse -Force $env:APPDATA\deepseek-ocr
```

## Troubleshooting Installation

### "command not found" Error

**Solution 1: Check PATH**

```bash
# macOS/Linux
echo $PATH | grep npm

# Windows
echo %PATH% | findstr npm
```

**Solution 2: Reinstall Globally**

```bash
npm uninstall -g deepseek-ocr-cli
npm install -g deepseek-ocr-cli
```

**Solution 3: Use Full Path**

Find where npm installs global packages:

```bash
npm root -g
```

Then use full path to executable.

### "Permission Denied" Error

See platform-specific notes above for solutions.

### "EACCES" Error

Change npm's default directory or use nvm (see macOS/Linux section).

### Network/Proxy Issues

Configure npm proxy:

```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

For corporate networks with SSL inspection:

```bash
npm config set strict-ssl false
```

### Version Conflicts

Check installed versions:

```bash
npm list -g deepseek-ocr-cli
```

Remove all versions and reinstall:

```bash
npm uninstall -g deepseek-ocr-cli
npm cache clean --force
npm install -g deepseek-ocr-cli
```

## Next Steps

After successful installation:

1. 📖 Read the [Usage Guide](usage.md) for detailed command examples
2. 🔧 Review [Configuration Options](../README.md#configuration)
3. 🚀 Try the [Quick Start Tutorial](../README.md#quick-start)
4. 🐛 Check [Troubleshooting Guide](troubleshooting.md) if you encounter issues

## Support

If you continue to experience installation issues:

1. Check the [GitHub Issues](https://github.com/yourusername/deepseek-ocr-cli/issues)
2. Create a new issue with:
   - Your Node.js version (`node --version`)
   - Your npm version (`npm --version`)
   - Your operating system
   - The complete error message
   - Steps you've tried

