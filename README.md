# ControlTV — 大屏远程控制服务

> 通过平板/手机远程控制大屏电脑的键盘、鼠标、浏览器等操作。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-Windows-blue)]()

---

## 架构概览

```
 ┌──────────────┐       WebSocket        ┌──────────────────┐
 │  平板/手机    │ ◄──────────────────────► │  大屏电脑          │
 │  remote.html │   ws://192.168.x:8080   │  ControlTV.exe   │
 │              │                         │  (server.js)     │
 └──────────────┘                         │  ↓ robotjs       │
                                          │  键盘/鼠标/浏览器  │
       UDP 广播 (8888) ← 自动发现设备        └──────────────────┘
```

- **服务端**（`server.js`）：部署在大屏 Windows 电脑上，负责接收指令并模拟键鼠操作。
- **控制端**（`remote.html`）：在平板或手机上用浏览器打开，通过 WebSocket 发送控制指令。
- **UDP 广播**：大屏电脑每 2 秒向外广播设备名称+IP，方便控制端自动发现设备。

---

## 功能特性

### ⌨️ 键盘遥控
- 完整 QWERTY 键盘，支持字母、数字、符号
- **修饰键**：Shift、Ctrl、Alt、Win、Caps（单按生效）
- **Shift 组合符号**：`@` `#` `$` `%` `^` `&` `*` `(` `)` `_` `+` `~` `:` 等
- **打字输入框**：粘贴密码/URL/路径等长文本，一键发送输入
- 功能键 F1-F12

### 🖱️ 鼠标遥控
- **触控板**：滑动手势控制鼠标指针
- **方向键 D-Pad**：上下左右微调，支持点按和长按
- 左键点击 / 右键点击
- 鼠标拖动（JSON 指令）

### ⚡ 快捷操作
- `Ctrl+R` 刷新页面、`Ctrl+W` 关闭标签页
- `Ctrl+PgUp` / `Ctrl+PgDn` 切换标签
- `Alt+F4` 关闭窗口、`Win+Tab` 任务视图
- F5 刷新、F11 全屏
- 音量+ / 音量-

### 🧭 导航键
- 方向键（↑ ↓ ← →）
- Esc、Tab、Enter、Space、Backspace、Delete
- Home、End、PgUp、PgDn、Insert

### 🌐 Open 面板
- 输入 URL，远程打开浏览器
- 输入文件路径，远程打开本地文件/程序

### 🔌 设备发现
- UDP 广播自动发现局域网内的大屏设备
- 支持自定义设备名称和端口

### 📱 响应式控制面板
- `remote.html` 适配桌面端（侧边栏布局）和移动端（底部 Tab 导航）
- 移动端键盘支持横向滚动，避免按键挤压

---

## 快速开始

### 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | ≥ 18 |
| npm | ≥ 8 |
| 操作系统 | Windows（robotjs 仅支持 Windows/macOS/Linux 桌面环境） |
| Python | 2.7 或 3.x（robotjs 编译依赖，仅开发环境需要） |
| Visual Studio Build Tools | robotjs 编译依赖（仅开发环境需要） |

### 1. 克隆项目

```bash
git clone git@gitee.com:yourname/ControlTV.git
cd ControlTV
```

### 2. 安装依赖

```bash
npm install
```

> 如果 `@jitsi/robotjs` 安装失败，请确认已安装 Visual Studio Build Tools 的 C++ 桌面开发工具。

### 3. 启动服务

```bash
npm start
```

或双击 `start.bat`。

启动后控制台显示：

```
✅ Display-1 启动成功 | IP: 192.168.1.100:8080
```

### 4. 打开控制面板

在平板或手机上用浏览器打开 `remote.html`，输入大屏电脑的 IP:Port，点击 **Connect**。

> 也可以通过局域网内任意设备在浏览器输 `http://192.168.1.100:8080` 直接访问（需配合静态文件服务或把 remote.html 放在可访问的位置）。

---

## 打包部署

### 一键打包

```bash
# 方式一：双击运行
一键打包脚本.bat

# 方式二：命令行
npm run build
```

打包过程：
1. 使用 `pkg` 将 `server.js` 编译为 `ControlTV.exe`
2. 复制 `@jitsi/robotjs` 的原生模块（`.node` 文件必须随 exe 分发）
3. 复制辅助脚本（`start.bat`、`config.bat`、`autostart.bat`、`config.txt`）

输出目录 `dist/` 的文件结构：

```
dist/
├── ControlTV.exe               # 打包后的可执行文件
├── start.bat                   # 启动脚本
├── config.bat                  # 设备配置脚本
├── autostart.bat               # 开机自启配置
├── config.txt                  # 默认配置文件
└── prebuilds/win32-x64/        # robotjs 原生模块（必须保留）
```

### 部署到大屏电脑

将 `dist/` 目录下**全部文件**复制到大屏电脑，然后：

```bash
# 1. 配置设备名称（可选，默认 Display-1）
config.bat

# 2. 启动服务
start.bat

# 3.（可选）设置开机自启
autostart.bat
```

---

## 配置说明

### config.txt

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `DEVICE_NAME` | 设备名称，用于 UDP 广播发现 | `Display-1` |
| `IP_ADDRESS` | 绑定的 IP 地址，留空自动检测 | (自动检测) |
| `WS_PORT` | WebSocket 服务端口 | `8080` |

### 命令行参数（ControlTV.exe）

```bash
ControlTV.exe [options]

Options:
  --name, -n <name>     设备名称（默认: Display-1）
  --ip, -i <ip>         绑定的 IP 地址（留空自动检测）
  --port, -p <port>     WebSocket 端口（默认: 8080）
  --udp-port <port>     UDP 广播端口（默认: 8888）
  --help, -h            帮助信息
```

**示例：**

```bash
# 使用默认配置
ControlTV.exe

# 自定义名称和端口
ControlTV.exe --name "展厅大屏-1" --port 9090

# 指定 IP
ControlTV.exe --name "会议屏" --ip 192.168.1.50
```

---

## remote.html 使用介绍

`remote.html` 是 Web 端的远程控制面板，需要在浏览器中打开使用。

### 连接设备

**桌面端：**
1. 在左侧 Sidebar 的 **Device** 输入框中填写大屏电脑的 IP 和端口，例如 `192.168.1.100:8080`
2. 点击 **Connect** 按钮
3. 状态灯变绿、按钮显示 "Disconnected" 即连接成功

**手机端：**
1. 页面顶部 Top Bar 中填写 IP 和端口
2. 点击右侧 **Connect** 按钮
3. 连接成功后底部会出现 Tab 导航栏

### 功能面板

| Tab 名称 | 功能说明 |
|----------|----------|
| **Quick** | 快捷操作：刷新、关闭标签、全屏、Alt+F4 等 |
| **Navigation** | 方向键 + Esc/Tab/Enter/Space 等导航编辑键 |
| **Keyboard** | 完整键盘布局 + 打字输入框 |
| **Mouse** | 触控板 + D-Pad 方向微调 + 左右键点击 |
| **Open** | 远程打开 URL 或本地文件/程序 |

### Keyboard 面板详解

- **打字输入框**：最上方的输入框，粘贴文本后点击 **Type** 或按回车键，文本将逐字输入到大屏电脑上。
- **功能键行**（F1-F12）：快速功能键。
- **数字符号行**：`` `1234567890-= ← ``，Backspace 删除。
- **Shift 符号行**：`@#$%^&*()_+~:`，直接点击这些按钮即可输入对应符号（无需手动 Shift 组合）。
- **字母键盘**：QWERTY 布局 + Tab/Caps/Shift/Ctrl/Win/Alt 修饰键。
- **方向键**：集成在键盘右下角。
- **修饰键**（Shift/Ctrl/Alt/Win/Caps）：单击即可发送对应按键。

### Mouse 面板详解

- **触控板**：在灰色区域内滑动手指/鼠标，控制大屏上的光标移动。
- **D-Pad 方向键**：点击 ↑↓←→ 微调光标位置（单步 20px），**长按**可连续移动。
- **左键点击** / **右键点击**：单击按钮触发。

### 手机端适配

- 屏幕宽度 ≤768px 时自动切换为移动端布局
- Sidebar 隐藏，改为顶部连接条
- 底部 Tab 导航切换功能面板
- 键盘支持横向滚动，不会被挤压变形

---

## 项目结构

```
ControlTV/
├── server.js              # 服务端主程序（WebSocket + robotjs + UDP 广播）
├── remote.html            # Web 远程控制面板（纯静态，无需服务器）
├── build.js               # 打包脚本（pkg 编译 exe）
├── 一键打包脚本.bat        # Windows 一键打包脚本
├── start.bat              # 启动脚本（读取 config.txt 启动 exe）
├── config.bat             # 设备配置脚本（生成 config.txt）
├── autostart.bat          # 开机自启配置脚本
├── config.txt             # 配置文件
├── package.json           # 项目配置
├── package-lock.json      # 依赖锁定
└── dist/                  # 打包输出目录
    ├── ControlTV.exe
    ├── start.bat
    ├── config.bat
    ├── autostart.bat
    ├── config.txt
    └── prebuilds/win32-x64/
```

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 运行环境 | Node.js 18+ |
| WebSocket | [ws](https://github.com/websockets/ws) v8 |
| 键鼠模拟 | [@jitsi/robotjs](https://github.com/jitsi/robotjs) v0.6 |
| UDP 广播 | Node.js 内置 `dgram` |
| 打包工具 | [pkg](https://github.com/vercel/pkg) v5.8 |
| 前端 | 纯 HTML/CSS/JS，无框架依赖 |

---

## 常见问题

### Q: robotjs 安装失败？

确保已安装：
- **Python** 2.7 或 3.x，并添加到 PATH
- **Visual Studio Build Tools** 的「使用 C++ 的桌面开发」工作负载
- 或以管理员身份运行 `npm install --global windows-build-tools`

### Q: pkg 打包失败或 exe 无法运行？

1. 确保使用 Node 18（pkg 对更高版本兼容性不佳）
2. 打包后 `dist/prebuilds/` 目录必须保留，内含 robotjs 的原生 `.node` 模块
3. 如遇到 `Cannot find module` 错误，检查 `dist/prebuilds/win32-x64/` 是否存在

### Q: WebSocket 连接不上？

1. 确认大屏电脑的防火墙允许 `8080` 端口（或其他自定义端口）
2. 确认控制端和大屏在同一局域网内
3. 试着用浏览器访问 `http://大屏IP:8080` 测试端口是否开放

### Q: 连续输入相同字符（如 `//`、`哈哈`）会丢失？

已修复。v1.4 版本起，`key_type` 指令对连续相同字符自动插入 30ms 延迟，确保每个字符都被正确输入。

### Q: 如何让服务开机自动启动？

双击 `autostart.bat`，选择 `1. Enable AutoStart`。原理是将 `start.bat` 的快捷方式放入 Windows 启动文件夹。

---

## License

MIT

---

# ControlTV — Remote Control Service for Large Screens

> Control keyboard, mouse, and browser on a large-screen PC from your tablet or phone.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-Windows-blue)]()

---

## Architecture

```
 ┌──────────────┐       WebSocket        ┌──────────────────┐
 │  Tablet/Phone │ ◄──────────────────────► │  Large-Screen PC │
 │  remote.html  │   ws://192.168.x:8080   │  ControlTV.exe   │
 │               │                         │  (server.js)     │
 └──────────────┘                         │  ↓ robotjs       │
                                          │  Kbd/Mouse/App   │
       UDP Broadcast (8888) ← Device Discovery  └──────────────────┘
```

- **Server** (`server.js`): Runs on the large-screen Windows PC. Receives commands and simulates keyboard/mouse input.
- **Client** (`remote.html`): Open in a browser on any device. Sends control commands via WebSocket.
- **UDP Broadcast**: The PC broadcasts its name + IP every 2 seconds for auto-discovery.

---

## Features

### ⌨️ Keyboard Remote
- Full QWERTY layout: letters, numbers, symbols
- **Modifier keys**: Shift, Ctrl, Alt, Win, Caps
- **Shift-combined symbols**: `@` `#` `$` `%` `^` `&` `*` `(` `)` `_` `+` `~` `:` and more
- **Type text box**: Paste long text (passwords, URLs, paths) and send with one click
- Function keys F1–F12

### 🖱️ Mouse Remote
- **Trackpad**: Swipe to move cursor
- **D-Pad**: Arrow keys for precise cursor movement, with tap and long-press support
- Left click / Right click
- Drag support (via JSON command)

### ⚡ Quick Actions
- `Ctrl+R` refresh, `Ctrl+W` close tab
- `Ctrl+PgUp` / `Ctrl+PgDn` switch tabs
- `Alt+F4` close window, `Win+Tab` task view
- F5 refresh, F11 fullscreen
- Volume up / down

### 🧭 Navigation Keys
- Arrow keys (↑ ↓ ← →)
- Esc, Tab, Enter, Space, Backspace, Delete
- Home, End, PgUp, PgDn, Insert

### 🌐 Open Panel
- Open a URL remotely in the browser
- Open a local file or program remotely

### 🔌 Device Discovery
- UDP broadcast for auto-discovery of devices on the LAN
- Customizable device name and port

### 📱 Responsive Control Panel
- `remote.html` adapts to desktop (sidebar layout) and mobile (bottom tab navigation)
- Mobile keyboard supports horizontal scrolling to prevent key squeezing

---

## Quick Start

### Prerequisites

| Dependency | Version |
|------------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 8 |
| OS | Windows (robotjs supports Windows/macOS/Linux desktops) |
| Python | 2.7 or 3.x (robotjs compile dependency, dev only) |
| Visual Studio Build Tools | robotjs compile dependency (dev only) |

### 1. Clone

```bash
git clone git@gitee.com:yourname/ControlTV.git
cd ControlTV
```

### 2. Install Dependencies

```bash
npm install
```

> If `@jitsi/robotjs` fails to install, ensure Visual Studio Build Tools with C++ Desktop Development is installed.

### 3. Start Server

```bash
npm start
```

Or double-click `start.bat`.

Console output on success:

```
✅ Display-1 启动成功 | IP: 192.168.1.100:8080
```

### 4. Open Control Panel

Open `remote.html` in a browser on your tablet/phone. Enter the PC's IP:Port and click **Connect**.

---

## Build & Deploy

### One-Click Build

```bash
# Option 1: Double-click
一键打包脚本.bat

# Option 2: Command line
npm run build
```

Build process:
1. Compile `server.js` to `ControlTV.exe` using `pkg`
2. Copy `@jitsi/robotjs` native modules (`.node` files must ship with the exe)
3. Copy helper scripts (`start.bat`, `config.bat`, `autostart.bat`, `config.txt`)

Output directory `dist/`:

```
dist/
├── ControlTV.exe               # Packaged executable
├── start.bat                   # Launch script
├── config.bat                  # Device configuration
├── autostart.bat               # Auto-start setup
├── config.txt                  # Default config file
└── prebuilds/win32-x64/        # robotjs native modules (required)
```

### Deploy to Large-Screen PC

Copy **all files** from `dist/` to the target PC, then:

```bash
# 1. Configure device name (optional, default: Display-1)
config.bat

# 2. Start the service
start.bat

# 3. (Optional) Enable auto-start on boot
autostart.bat
```

---

## Configuration

### config.txt

| Parameter | Description | Default |
|-----------|-------------|---------|
| `DEVICE_NAME` | Device name for UDP broadcast discovery | `Display-1` |
| `IP_ADDRESS` | IP address to bind (empty = auto-detect) | (auto) |
| `WS_PORT` | WebSocket server port | `8080` |

### Command Line Arguments (ControlTV.exe)

```bash
ControlTV.exe [options]

Options:
  --name, -n <name>     Device name (default: Display-1)
  --ip, -i <ip>         IP address to bind (empty = auto-detect)
  --port, -p <port>     WebSocket port (default: 8080)
  --udp-port <port>     UDP broadcast port (default: 8888)
  --help, -h            Show help
```

**Examples:**

```bash
# Default settings
ControlTV.exe

# Custom name and port
ControlTV.exe --name "Hall-Screen-1" --port 9090

# Specify IP
ControlTV.exe --name "Meeting-Screen" --ip 192.168.1.50
```

---

## remote.html Usage Guide

`remote.html` is the web-based remote control panel. Open it in any modern browser.

### Connecting

**Desktop:**
1. In the left sidebar, enter the PC's IP and port, e.g. `192.168.1.100:8080`
2. Click **Connect**
3. The status dot turns green and the button shows "Disconnected" when connected

**Mobile:**
1. Use the top bar to enter IP and port
2. Tap **Connect** on the right
3. Once connected, bottom tab navigation appears

### Tab Overview

| Tab | Description |
|-----|-------------|
| **Quick** | Shortcuts: refresh, close tab, fullscreen, Alt+F4, etc. |
| **Navigation** | Arrow keys + Esc/Tab/Enter/Space and editing keys |
| **Keyboard** | Full keyboard layout + text typing input |
| **Mouse** | Trackpad + D-Pad arrow keys + left/right click |
| **Open** | Open URL or local file/program remotely |

### Keyboard Tab

- **Type Text Input**: Paste text into the input box at the top, click **Type** or press Enter to send the text character by character.
- **Function Keys** (F1-F12): Quick function keys.
- **Number/Symbol Row**: `` `1234567890-= ← `` with Backspace.
- **Shift Symbols Row**: `@#$%^&*()_+~:` — click any of these directly to type the symbol.
- **Letter Keyboard**: QWERTY layout with Tab/Caps/Shift/Ctrl/Win/Alt modifier keys.
- **Arrow Keys**: Integrated at the bottom-right of the keyboard.
- **Modifier Keys** (Shift/Ctrl/Alt/Win/Caps): Tap to send the corresponding key.

### Mouse Tab

- **Trackpad**: Slide your finger/mouse in the gray area to move the cursor on the large screen.
- **D-Pad**: Tap ↑↓←→ to nudge the cursor (20px per step). **Long-press** for continuous movement.
- **Left Click** / **Right Click**: Tap the buttons to click.

### Mobile Adaptation

- Automatically switches to mobile layout at ≤768px screen width
- Sidebar hidden; replaced by a top connection bar
- Bottom tabs for switching between panels
- Keyboard supports horizontal scrolling to prevent key squeezing

---

## Project Structure

```
ControlTV/
├── server.js              # Main server (WebSocket + robotjs + UDP broadcast)
├── remote.html            # Web remote control panel (static, no server needed)
├── build.js               # Build script (pkg compilation)
├── 一键打包脚本.bat        # Windows one-click build
├── start.bat              # Launch script (reads config.txt, starts exe)
├── config.bat             # Device configuration (generates config.txt)
├── autostart.bat          # Auto-start setup script
├── config.txt             # Configuration file
├── package.json           # Project metadata
├── package-lock.json      # Dependency lock
└── dist/                  # Build output
    ├── ControlTV.exe
    ├── start.bat
    ├── config.bat
    ├── autostart.bat
    ├── config.txt
    └── prebuilds/win32-x64/
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| WebSocket | [ws](https://github.com/websockets/ws) v8 |
| Input Simulation | [@jitsi/robotjs](https://github.com/jitsi/robotjs) v0.6 |
| UDP Broadcast | Node.js built-in `dgram` |
| Bundler | [pkg](https://github.com/vercel/pkg) v5.8 |
| Frontend | Pure HTML/CSS/JS, no framework |

---

## FAQ

### Q: robotjs fails to install?

Make sure you have:
- **Python** 2.7 or 3.x added to PATH
- **Visual Studio Build Tools** with "Desktop development with C++"
- Or run `npm install --global windows-build-tools` as Administrator

### Q: pkg build fails or the exe won't run?

1. Use Node 18 (pkg has compatibility issues with newer versions)
2. The `dist/prebuilds/` directory must be kept — it contains robotjs native `.node` modules
3. If you see `Cannot find module`, check that `dist/prebuilds/win32-x64/` exists

### Q: WebSocket won't connect?

1. Ensure the PC's firewall allows port `8080` (or your custom port)
2. Ensure both devices are on the same LAN
3. Try `http://PC-IP:8080` in a browser to test if the port is open

### Q: Repeated characters (e.g. `//`, `哈哈`) get lost?

Fixed in v1.4. The `key_type` command now inserts a 30ms delay between consecutive identical characters to ensure each one is typed correctly.

### Q: How to start the service automatically on boot?

Run `autostart.bat` and select `1. Enable AutoStart`. This creates a shortcut to `start.bat` in the Windows Startup folder.

---

## License

MIT
