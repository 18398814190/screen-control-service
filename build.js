/**
 * 打包脚本
 * 1. 使用 pkg 将 server.js 打包为 ControlTV.exe
 * 2. 将 bat/txt 辅助文件复制到 dist 目录
 *
 * 用法: node build.js
 * 输出: dist/
 *   ├── ControlTV.exe           (打包后的可执行文件)
 *   ├── prebuilds/win32-x64/    (robotjs 原生模块，必须随 exe 分发)
 *   ├── start.bat               (启动脚本，读取 config.txt 启动 exe)
 *   ├── config.bat              (设备配置脚本)
 *   ├── autostart.bat           (开机自启配置脚本)
 *   └── config.txt              (默认配置文件)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');
const EXE_NAME = 'ControlTV.exe';

// ==================== 辅助函数 ====================

function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  log('COPY', `${path.basename(src)} → ${path.relative(__dirname, dest)}`);
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function cleanDist() {
  if (!fs.existsSync(DIST_DIR)) return;

  const entries = fs.readdirSync(DIST_DIR);
  let cleaned = 0;
  let locked = [];

  for (const entry of entries) {
    const fullPath = path.join(DIST_DIR, entry);
    try {
      if (fs.lstatSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      cleaned++;
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EPERM') {
        locked.push(entry);
      } else {
        throw err;
      }
    }
  }

  if (locked.length > 0) {
    console.error(`\n[ERROR] Cannot clean, these files are in use:`);
    locked.forEach(f => console.error(`  - ${f}`));
    console.error(`\nPlease close ControlTV.exe and any File Explorer windows in dist\, then retry.\n`);
    process.exit(1);
  }

  log('CLEAN', `Cleaned ${cleaned} file(s)`);
}

// ==================== 主流程 ====================

function main() {
  console.log('========================================');
  console.log('  ControlTV 打包脚本');
  console.log('========================================\n');

  // Step 1: 确保 dist 目录存在
  log('STEP 1', '准备 dist 目录...');
  ensureDir(DIST_DIR);

  // Step 2: 清理旧产物
  log('STEP 2', '清理旧产物...');
  cleanDist();

  // Step 3: 使用 pkg 打包
  log('STEP 3', '正在打包 server.js → ControlTV.exe ...');
  log('PKG', '这可能需要 1-2 分钟，请耐心等待...');

  try {
    // pkg 打包命令（使用系统 Node 18 以避免 pkg 兼容性问题）
    // --targets node18-win-x64  指定目标平台
    // --output dist/ControlTV.exe  输出路径
    const pkgBin = path.join(__dirname, 'node_modules', '.bin', 'pkg');
    const cmd = `"${pkgBin}" server.js --targets node18-win-x64 --output "${DIST_DIR}/${EXE_NAME}"`;
    log('PKG', `执行: ${cmd}`);

    execSync(cmd, {
      cwd: __dirname,
      stdio: 'inherit',
      timeout: 300000  // 5 分钟超时
    });

    log('PKG', 'exe 打包完成');

  // Step 3.5: 复制 robotjs 原生模块（.node 不能打进 exe）
  log('STEP 3.5', '复制 robotjs 原生模块...');
  const prebuildSrc = path.join(__dirname, 'node_modules', '@jitsi', 'robotjs', 'prebuilds', 'win32-x64');
  const prebuildDest = path.join(DIST_DIR, 'prebuilds', 'win32-x64');
  if (fs.existsSync(prebuildSrc)) {
    copyDir(prebuildSrc, prebuildDest);
    log('COPY', `prebuilds/win32-x64/ → dist/prebuilds/win32-x64/`);
  } else {
    log('WARN', 'robotjs prebuilds 目录不存在! exe 将无法加载 robotjs');
  }
  } catch (err) {
    console.error('\n❌ pkg 打包失败:', err.message);
    console.error('   请检查:');
    console.error('   1. 是否已安装 pkg (npm install)');
    console.error('   2. server.js 是否有语法错误');
    process.exit(1);
  }

  // Step 4: 复制辅助文件
  log('STEP 4', '复制辅助文件...');

  const filesToCopy = ['start.bat', 'config.bat', 'autostart.bat', 'config.txt'];
  for (const file of filesToCopy) {
    const src = path.join(__dirname, file);
    const dest = path.join(DIST_DIR, file);
    if (fs.existsSync(src)) {
      copyFile(src, dest);
    } else {
      log('WARN', `源文件不存在, 跳过: ${file}`);
    }
  }

  // Step 5: 输出结果
  console.log('\n========================================');
  console.log('  ✅ 打包完成!');
  console.log('========================================');
  console.log(`\n输出目录: ${DIST_DIR}`);
  console.log('\n文件列表:');
  const distFiles = fs.readdirSync(DIST_DIR);
  for (const file of distFiles) {
    const stat = fs.statSync(path.join(DIST_DIR, file));
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);
    console.log(`  ${file.padEnd(22)} ${sizeMB} MB`);
  }

  console.log('\n交付给大屏电脑时，将 dist 目录下全部文件复制过去即可。');
  console.log('大屏电脑上双击 start.bat 启动服务。\n');
}

main();
