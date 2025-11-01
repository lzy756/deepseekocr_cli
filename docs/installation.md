# Installation Guide (Windows & Linux)

本指南涵盖在 Windows 与 Linux 上安装与使用 DeepSeek-OCR CLI 的完整步骤与排错建议。

## 前置条件

请确认已具备：

- Node.js 18.0.0 或更高版本（推荐 LTS）
- npm（随 Node.js 一并安装）
- 可访问的 DeepSeek-OCR API 服务（Base URL 与 API Key）

### 检查 Node.js 版本

Windows（PowerShell）：

```powershell
node -v
# 应输出 v18.0.0 或更高
```

Linux（Bash）：

```bash
node -v
# 应输出 v18.0.0 或更高
```

未安装或版本过低时：
- 官方安装包：[https://nodejs.org/](https://nodejs.org/)
- Linux 推荐使用 nvm 管理多版本 Node.js：[nvm](https://github.com/nvm-sh/nvm)
- Windows 推荐使用 nvm-windows 管理多版本 Node.js：[nvm-windows](https://github.com/coreybutler/nvm-windows)

提示：
- Windows 也可用包管理器安装 Node.js：`winget install OpenJS.NodeJS.LTS` 或 `choco install nodejs-lts`。
- Linux 可用发行版包管理器（apt/dnf/yum/pacman 等）安装，但版本可能落后，建议使用 nvm。

## 安装方式

### 方式一：全局安装（推荐）

全局安装后可在任何目录使用 `deepseek-ocr`：

Windows（PowerShell）或 Linux（Bash）均通用：

```bash
npm install -g deepseek-ocr-cli
```

验证：

```bash
deepseek-ocr --version
```

说明：
- Linux 若提示权限问题，可使用 `sudo`（或改用 nvm）：

```bash
sudo npm install -g deepseek-ocr-cli
```

- Windows 通常无需管理员权限；若 Node.js 以系统范围安装，需在“以管理员身份运行”的 PowerShell 中执行。

### 方式二：项目本地安装

```bash
# 新建项目目录
mkdir my-ocr-project
cd my-ocr-project

# 初始化 npm
npm init -y

# 安装到项目依赖
npm install deepseek-ocr-cli
```

运行：

```bash
# 使用 npx 调用
npx deepseek-ocr --version
```

特点：
- 版本与项目绑定，互不影响
- 便于在不同项目使用不同版本

### 方式三：从源码安装

从 GitHub 仓库获取最新开发版本：

Windows（PowerShell）：

```powershell
git clone https://github.com/lzy756/deepseekocr_cli.git
cd deepseekocr_cli
npm install
npm link   # 将 deepseek-ocr 命令链接到全局
```

Linux（Bash）：

```bash
git clone https://github.com/lzy756/deepseekocr_cli.git
cd deepseekocr_cli
npm install
npm link   # 将 deepseek-ocr 命令链接到全局
```

验证：

```bash
deepseek-ocr --version
```

### 方式四：直接从 GitHub 安装

安装主分支最新代码或指定版本/分支：

```bash
# 主分支最新
npm install -g github:lzy756/deepseekocr_cli

# 指定 Tag（举例）
npm install -g github:lzy756/deepseekocr_cli#v1.0.0

# 指定分支（举例）
npm install -g github:lzy756/deepseekocr_cli#develop
```

## 平台要点

### Windows

PowerShell 执行策略（遇到脚本执行受限时）：

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

PATH 配置：全局 npm 可执行文件默认位于：

```
%APPDATA%\npm
```

检查是否在 PATH 中：

```powershell
$env:Path -split ';' | Where-Object { $_ -match 'npm' }
```

### Linux

权限问题：
1) 快速方案（不推荐长期使用）：

```bash
sudo npm install -g deepseek-ocr-cli
```

2) 推荐方案：调整 npm 前缀到用户目录：

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

3) 最佳实践：使用 nvm（隔离不同 Node 版本与全局包）：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
npm install -g deepseek-ocr-cli
```

## 安装后配置

### 1) 验证安装

```bash
deepseek-ocr --version
deepseek-ocr --help
```

### 2) 配置 API 凭据

```bash
deepseek-ocr config init
```

你将被询问：
- API Base URL：DeepSeek-OCR API 地址
- API Key：访问令牌

### 3) 测试连接

```bash
deepseek-ocr health check
deepseek-ocr health info
```

### 4) 准备测试文件

创建测试目录并准备示例图片：

Windows（PowerShell，建议使用 curl.exe 或 Invoke-WebRequest）：

```powershell
mkdir ocr-test
cd ocr-test

# 使用 curl.exe（注意 .exe）
curl.exe -L -o test.jpg https://example.com/sample-image.jpg

# 或使用 Invoke-WebRequest
# Invoke-WebRequest -Uri https://example.com/sample-image.jpg -OutFile test.jpg

deepseek-ocr image test.jpg
```

Linux（Bash）：

```bash
mkdir -p ocr-test
cd ocr-test
curl -L -o test.jpg https://example.com/sample-image.jpg
deepseek-ocr image test.jpg
```

## 更新

全局安装：

```bash
npm update -g deepseek-ocr-cli
```

项目本地安装：

```bash
npm update deepseek-ocr-cli
```

源码安装：

```bash
cd deepseekocr_cli
git pull origin master
npm install
```

## 卸载与清理

全局卸载：

```bash
npm uninstall -g deepseek-ocr-cli
```

项目卸载：

```bash
npm uninstall deepseek-ocr-cli
```

源码卸载（取消链接，并按需删除仓库）：

Windows（PowerShell）：

```powershell
npm unlink
cd ..
Remove-Item -Recurse -Force .\deepseekocr_cli
```

Linux（Bash）：

```bash
npm unlink
cd ..
rm -rf ./deepseekocr_cli
```

清理配置（本工具使用 Conf，项目名为 `deepseek-ocr`）：

Linux：

```bash
rm -rf ~/.config/deepseek-ocr
```

Windows（PowerShell）：

```powershell
Remove-Item -Recurse -Force $env:APPDATA\deepseek-ocr
```

## 安装故障排查

### “command not found”/“不是内部或外部命令”

1) 检查 PATH：

Windows（PowerShell）：

```powershell
$env:Path -split ';' | Where-Object { $_ -match 'npm' }
```

Linux（Bash）：

```bash
echo "$PATH" | tr ':' '\n' | grep npm
```

2) 重新全局安装：

```bash
npm uninstall -g deepseek-ocr-cli
npm install -g deepseek-ocr-cli
```

3) 使用完整路径：

```bash
npm root -g
# 进入上述目录的 ../bin，直接运行 deepseek-ocr 可执行文件
```

### 权限相关错误（EACCES/EPERM）

- Linux：优先使用 nvm 或将 npm 前缀改为用户目录（见上文“Linux”小节）。
- Windows：在需要时以管理员身份打开 PowerShell 执行一次安装。

### 网络/代理问题

设置 npm 代理：

```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

若公司网络做 SSL 检查：

```bash
npm config set strict-ssl false
```

### 版本冲突

查看已安装版本：

```bash
npm list -g deepseek-ocr-cli
```

清理缓存并重装：

```bash
npm uninstall -g deepseek-ocr-cli
npm cache clean --force
npm install -g deepseek-ocr-cli
```

## 下一步

1. 阅读 [Usage 使用指南](usage.md) 获取详细命令示例
2. 查看 README 中的[配置选项](../README.md#configuration)
3. 体验 [Quick Start 快速开始](../README.md#quick-start)
4. 若遇问题，参考 [Troubleshooting 故障排查](troubleshooting.md)

## 支持与反馈

若仍有安装问题：

1. 查看 GitHub Issues：https://github.com/lzy756/deepseekocr_cli/issues
2. 新建 Issue 并附上：
   - Node.js 版本（`node -v`）
   - npm 版本（`npm -v`）
   - 操作系统版本与平台（Windows/Linux）
   - 完整报错信息与日志
   - 已尝试的步骤

