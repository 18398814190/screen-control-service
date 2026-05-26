const WebSocket = require('ws');
const robot = require('@jitsi/robotjs');
const os = require('os');
const dgram = require('dgram');
const { exec } = require('child_process');

// ===================== 解析命令行参数 =====================
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    deviceName: null,
    ipAddress: null,
    wsPort: 8080,
    udpPort: 8888
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--name':
      case '-n':
        config.deviceName = args[++i];
        break;
      case '--ip':
      case '-i':
        config.ipAddress = args[++i];
        break;
      case '--port':
      case '-p':
        config.wsPort = parseInt(args[++i]);
        break;
      case '--udp-port':
        config.udpPort = parseInt(args[++i]);
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: ControlTV.exe [options]

Options:
  --name, -n <name>      Device name (e.g., Display-1)
  --ip, -i <ip>          IP address (optional, auto-detect if not set)
  --port, -p <port>      WebSocket port (default: 8080)
  --udp-port <port>      UDP broadcast port (default: 8888)
  --help, -h             Show help
        `);
        process.exit(0);
        break;
    }
  }

  return config;
}

const CLI_CONFIG = parseArgs();

// ===================== 配置项 =====================
const DEVICE_NAME = CLI_CONFIG.deviceName || "大屏-1";
const WEB_SOCKET_PORT = CLI_CONFIG.wsPort;
const UDP_BROADCAST_PORT = CLI_CONFIG.udpPort;
const HEARTBEAT_TIMEOUT = 60000;

// 1. 获取本机IP
function getLocalIP() {
  if (CLI_CONFIG.ipAddress) {
    return CLI_CONFIG.ipAddress;
  }
  
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}
const LOCAL_IP = getLocalIP();

// 2. UDP广播：每2秒向局域网发送【设备名称+IP】（平板自动搜索）
const udpClient = dgram.createSocket('udp4');
udpClient.bind(() => udpClient.setBroadcast(true));
setInterval(() => {
  const msg = JSON.stringify({ name: DEVICE_NAME, ip: LOCAL_IP, port: WEB_SOCKET_PORT });
  udpClient.send(Buffer.from(msg), UDP_BROADCAST_PORT, '255.255.255.255');
}, 2000);

// 3. WebSocket服务（接收平板指令）
const wss = new WebSocket.Server({ port: WEB_SOCKET_PORT });
console.log(`✅ ${DEVICE_NAME} 启动成功 | IP: ${LOCAL_IP}:${WEB_SOCKET_PORT}`);

// 4. 指令映射（完整功能支持）
const keyMap = {
  // 方向键
  arrow_up: 'up', arrow_down: 'down', arrow_left: 'left', arrow_right: 'right',
  // 功能键
  key_space: 'space', key_enter: 'enter', key_esc: 'escape',
  key_f: 'f', key_f5: 'f5', key_f11: 'f11',
  // 音量控制
  vol_up: 'audio_vol_up', vol_down: 'audio_vol_down',
  // 组合键
  ctrl_r: 'ctrl_r', ctrl_w: 'ctrl_w', ctrl_pgup: 'ctrl_pgup', ctrl_pgdn: 'ctrl_pgdn',
  win_tab: 'win_tab', alt_f4: 'alt_f4',
  // 文件/链接控制
  open_web: 'open_web',
  // 鼠标控制
  mouse_left_click: 'mouse_left', mouse_right_click: 'mouse_right',
  mouse_move: 'mouse_move', mouse_drag: 'mouse_drag'
};

// 5. 执行指令
wss.on('connection', (ws) => {
  console.log(`📱 平板已连接 ${DEVICE_NAME}`);
  
  // 心跳相关变量
  let heartbeatTimeoutTimer = null;
  let isAlive = true;
  
  // 重置心跳超时计时器
  function resetHeartbeatTimeout() {
    if (heartbeatTimeoutTimer) {
      clearTimeout(heartbeatTimeoutTimer);
    }
    heartbeatTimeoutTimer = setTimeout(() => {
      console.log(`❌ 心跳超时，平板连接断开 ${DEVICE_NAME}`);
      isAlive = false;
      ws.terminate();
    }, HEARTBEAT_TIMEOUT);
  }
  
  // 启动心跳（等待客户端发送ping）
  function startHeartbeat() {
    // 立即开始计时，等待客户端ping
    resetHeartbeatTimeout();
  }
  
  // 停止心跳
  function stopHeartbeat() {
    if (heartbeatTimeoutTimer) {
      clearTimeout(heartbeatTimeoutTimer);
      heartbeatTimeoutTimer = null;
    }
  }
  
  // 启动心跳检测
  startHeartbeat();
  
  ws.on('message', (cmd) => {
    let cmdData;
    let result = {
      success: false,
      command: '',
      message: '未知指令格式'
    };
    
    try {
      // 尝试解析JSON格式指令
      cmdData = JSON.parse(cmd.toString());
    } catch (e) {
      // 非JSON格式，作为普通指令处理
      const cmdStr = cmd.toString();
      result.command = cmdStr;
      if (keyMap[cmdStr]) {
        try {
          if (keyMap[cmdStr].startsWith('mouse_')) {
            result.message = '鼠标指令需要JSON格式';
          } else if (cmdStr === 'ctrl_r') {
            // 特殊处理：Ctrl+R
            robot.keyTap('r', ['control']);
            result = {
              success: true,
              command: cmdStr,
              message: '执行成功: Ctrl+R'
            };
          } else if (cmdStr === 'win_tab') {
            // 特殊处理：Win+Tab
            robot.keyTap('tab', ['command']);
            result = {
              success: true,
              command: cmdStr,
              message: '执行成功: Win+Tab'
            };
          } else if (cmdStr === 'alt_f4') {
            // 特殊处理：Alt+F4
            robot.keyTap('f4', ['alt']);
            result = {
              success: true,
              command: cmdStr,
              message: '执行成功: Alt+F4'
            };
          } else if (cmdStr === 'ctrl_w') {
            // Ctrl+W 关闭当前页
            robot.keyTap('w', ['control']);
            result = {
              success: true,
              command: cmdStr,
              message: '执行成功: Ctrl+W'
            };
          } else if (cmdStr === 'ctrl_pgup') {
            // Ctrl+PgUp 上一标签页
            robot.keyTap('pageup', ['control']);
            result = {
              success: true,
              command: cmdStr,
              message: '执行成功: Ctrl+PgUp'
            };
          } else if (cmdStr === 'ctrl_pgdn') {
            // Ctrl+PgDn 下一标签页
            robot.keyTap('pagedown', ['control']);
            result = {
              success: true,
              command: cmdStr,
              message: '执行成功: Ctrl+PgDn'
            };
          } else if (cmdStr === 'open_web') {
            result.message = '打开网站/文件需要JSON格式';
          } else {
            robot.keyTap(keyMap[cmdStr]);
            result = {
              success: true,
              command: cmdStr,
              message: `执行成功: ${keyMap[cmdStr]}`
            };
          }
        } catch (error) {
          result = {
            success: false,
            command: cmdStr,
            message: `执行失败: ${error.message}`
          };
        }
      }
      ws.send(JSON.stringify(result));
      return;
    }
    
    // 处理JSON格式指令
    const { type, data } = cmdData;
    result.command = type;
    
    // 处理心跳响应（客户端发送ping，服务端回复pong）
    if (type === 'ping') {
      resetHeartbeatTimeout();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
      return;
    }
    
    if (type === 'mouse_left_click' && data && data.x !== undefined && data.y !== undefined) {
      try {
        robot.moveMouse(data.x, data.y);
        robot.mouseClick();
        result = {
          success: true,
          command: type,
          message: `执行成功: 鼠标左键点击 (${data.x}, ${data.y})`
        };
      } catch (error) {
        result = {
          success: false,
          command: type,
          message: `执行失败: ${error.message}`
        };
      }
    } else if (type === 'mouse_right_click' && data && data.x !== undefined && data.y !== undefined) {
      try {
        robot.moveMouse(data.x, data.y);
        robot.mouseClick('right');
        result = {
          success: true,
          command: type,
          message: `执行成功: 鼠标右键点击 (${data.x}, ${data.y})`
        };
      } catch (error) {
        result = {
          success: false,
          command: type,
          message: `执行失败: ${error.message}`
        };
      }
    } else if (type === 'mouse_move' && data && data.x !== undefined && data.y !== undefined) {
      try {
        robot.moveMouse(data.x, data.y);
        result = {
          success: true,
          command: type,
          message: `执行成功: 鼠标移动到 (${data.x}, ${data.y})`
        };
      } catch (error) {
        result = {
          success: false,
          command: type,
          message: `执行失败: ${error.message}`
        };
      }
    } else if (type === 'mouse_drag' && data && data.startX !== undefined && data.startY !== undefined && data.endX !== undefined && data.endY !== undefined) {
      try {
        robot.moveMouse(data.startX, data.startY);
        robot.mouseToggle('down');
        robot.moveMouse(data.endX, data.endY);
        robot.mouseToggle('up');
        result = {
          success: true,
          command: type,
          message: `执行成功: 鼠标拖动 (${data.startX}, ${data.startY}) → (${data.endX}, ${data.endY})`
        };
      } catch (error) {
        result = {
          success: false,
          command: type,
          message: `执行失败: ${error.message}`
        };
      }
    } else if (type === 'open_web' && data) {
      try {
        if (data.url) {
          exec(`start ${data.url}`, (error) => {
            if (error) {
              result = {
                success: false,
                command: type,
                message: `执行失败: ${error.message}`
              };
            }
          });
          result = {
            success: true,
            command: type,
            message: `执行成功: 打开链接 ${data.url}`
          };
        } else if (data.file_path) {
          exec(`start "" "${data.file_path}"`, (error) => {
            if (error) {
              result = {
                success: false,
                command: type,
                message: `执行失败: ${error.message}`
              };
            }
          });
          result = {
            success: true,
            command: type,
            message: `执行成功: 打开文件 ${data.file_path}`
          };
        } else {
          result = {
            success: false,
            command: type,
            message: '执行失败: 缺少url或file_path参数'
          };
        }
      } catch (error) {
        result = {
          success: false,
          command: type,
          message: `执行失败: ${error.message}`
        };
      }
    } else if (keyMap[type]) {
      try {
        if (type === 'ctrl_r') {
          // 特殊处理：Ctrl+R
          robot.keyTap('r', ['control']);
          result = {
            success: true,
            command: type,
            message: '执行成功: Ctrl+R'
          };
        } else if (type === 'win_tab') {
          // 特殊处理：Win+Tab
          robot.keyTap('tab', ['command']);
          result = {
            success: true,
            command: type,
            message: '执行成功: Win+Tab'
          };
        } else if (type === 'alt_f4') {
          // 特殊处理：Alt+F4
          robot.keyTap('f4', ['alt']);
          result = {
            success: true,
            command: type,
            message: '执行成功: Alt+F4'
          };
        } else if (type === 'ctrl_w') {
          // Ctrl+W 关闭当前页
          robot.keyTap('w', ['control']);
          result = {
            success: true,
            command: type,
            message: '执行成功: Ctrl+W'
          };
        } else if (type === 'ctrl_pgup') {
          // Ctrl+PgUp 上一标签页
          robot.keyTap('pageup', ['control']);
          result = {
            success: true,
            command: type,
            message: '执行成功: Ctrl+PgUp'
          };
        } else if (type === 'ctrl_pgdn') {
          // Ctrl+PgDn 下一标签页
          robot.keyTap('pagedown', ['control']);
          result = {
            success: true,
            command: type,
            message: '执行成功: Ctrl+PgDn'
          };
        } else {
          robot.keyTap(keyMap[type]);
          result = {
            success: true,
            command: type,
            message: `执行成功: ${keyMap[type]}`
          };
        }
      } catch (error) {
        result = {
          success: false,
          command: type,
          message: `执行失败: ${error.message}`
        };
      }
    }
    
    ws.send(JSON.stringify(result));
  });
  
  ws.on('close', () => {
    stopHeartbeat();
    console.log(`📱 平板断开 ${DEVICE_NAME}`);
  });
  
  ws.on('error', (error) => {
    console.log(`❌ WebSocket错误 ${DEVICE_NAME}:`, error.message);
    stopHeartbeat();
  });
});