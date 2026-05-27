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
  // ==================== 方向键 ====================
  arrow_up: 'up', arrow_down: 'down', arrow_left: 'left', arrow_right: 'right',

  // ==================== 导航键 ====================
  key_tab: 'tab', key_home: 'home', key_end: 'end',
  key_pageup: 'pageup', key_pagedown: 'pagedown',

  // ==================== 编辑键 ====================
  key_space: 'space', key_enter: 'enter', key_esc: 'escape',
  key_backspace: 'backspace', key_delete: 'delete', key_insert: 'insert',

  // ==================== 数字键 0-9 ====================
  key_0: '0', key_1: '1', key_2: '2', key_3: '3', key_4: '4',
  key_5: '5', key_6: '6', key_7: '7', key_8: '8', key_9: '9',

  // ==================== 字母键 A-Z ====================
  key_a: 'a', key_b: 'b', key_c: 'c', key_d: 'd', key_e: 'e',
  key_f: 'f', key_g: 'g', key_h: 'h', key_i: 'i', key_j: 'j',
  key_k: 'k', key_l: 'l', key_m: 'm', key_n: 'n', key_o: 'o',
  key_p: 'p', key_q: 'q', key_r: 'r', key_s: 's', key_t: 't',
  key_u: 'u', key_v: 'v', key_w: 'w', key_x: 'x', key_y: 'y', key_z: 'z',

  // ==================== 功能键 F1-F12 ====================
  key_f1: 'f1', key_f2: 'f2', key_f3: 'f3', key_f4: 'f4',
  key_f5: 'f5', key_f6: 'f6', key_f7: 'f7', key_f8: 'f8',
  key_f9: 'f9', key_f10: 'f10', key_f11: 'f11', key_f12: 'f12',

  // ==================== 符号键（无 Shift） ====================
  key_minus: '-', key_equal: '=',
  key_bracket_left: '[', key_bracket_right: ']',
  key_backslash: '\\', key_semicolon: ';', key_quote: "'",
  key_comma: ',', key_period: '.', key_slash: '/', key_backtick: '`',

  // ==================== 符号键（Shift 组合） ====================
  key_at: 'SHIFT:2', key_hash: 'SHIFT:3', key_dollar: 'SHIFT:4',
  key_percent: 'SHIFT:5', key_caret: 'SHIFT:6', key_ampersand: 'SHIFT:7',
  key_asterisk: 'SHIFT:8', key_paren_left: 'SHIFT:9', key_paren_right: 'SHIFT:0',
  key_underscore: 'SHIFT:-', key_plus: 'SHIFT:=', key_tilde: 'SHIFT:`',
  key_colon: 'SHIFT:;', key_double_quote: "SHIFT:'",
  key_angle_left: 'SHIFT:,', key_angle_right: 'SHIFT:.', key_question: 'SHIFT:/',
  key_brace_left: 'SHIFT:[', key_brace_right: 'SHIFT:]', key_pipe: 'SHIFT:\\',

  // ==================== 修饰键（单独按下） ====================
  key_caps: 'capslock', key_shift: 'shift', key_ctrl: 'control',
  key_alt: 'alt', key_win: 'command',

  // ==================== 文本输入（需 JSON 格式） ====================
  key_type: 'TYPE_STRING',

  // ==================== 音量控制 ====================
  vol_up: 'audio_vol_up', vol_down: 'audio_vol_down',

  // ==================== 组合键 ====================
  ctrl_r: 'ctrl_r', ctrl_w: 'ctrl_w',
  ctrl_pgup: 'ctrl_pgup', ctrl_pgdn: 'ctrl_pgdn',
  win_tab: 'win_tab', alt_f4: 'alt_f4',

  // ==================== 文件/链接控制（需 JSON 格式） ====================
  open_web: 'open_web',

  // ==================== 鼠标控制（需 JSON 格式） ====================
  mouse_left_click: 'mouse_left', mouse_right_click: 'mouse_right',
  mouse_move: 'mouse_move', mouse_move_delta: 'mouse_move_delta',
  mouse_drag: 'mouse_drag'
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
          } else if (keyMap[cmdStr] === 'TYPE_STRING') {
            result.message = '输入文本需要JSON格式: {"type":"key_type","text":"..."} ';
          } else if (keyMap[cmdStr].startsWith('SHIFT:')) {
            robot.keyTap(keyMap[cmdStr].slice(6), ['shift']);
            result = {
              success: true,
              command: cmdStr,
              message: `执行成功: ${keyMap[cmdStr]}`
            };
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
    
    if (type === 'mouse_left_click') {
      try {
        robot.mouseClick();
        result = { success: true, command: type, message: '执行成功: 鼠标左键点击' };
      } catch (error) {
        result = { success: false, command: type, message: `执行失败: ${error.message}` };
      }
    } else if (type === 'mouse_right_click') {
      try {
        robot.mouseClick('right');
        result = { success: true, command: type, message: '执行成功: 鼠标右键点击' };
      } catch (error) {
        result = { success: false, command: type, message: `执行失败: ${error.message}` };
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
    } else if (type === 'mouse_move_delta' && data && data.dx !== undefined && data.dy !== undefined) {
      try {
        const pos = robot.getMousePos();
        robot.moveMouse(Math.max(0, pos.x + data.dx), Math.max(0, pos.y + data.dy));
        result = {
          success: true,
          command: type,
          message: `执行成功: 鼠标相对移动 (${data.dx}, ${data.dy})`
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
    } else if (type === 'key_type' && data && data.text) {
      try {
        const text = String(data.text);
        // 逐字输入，连续相同字符之间加延迟，避免被操作系统合并
        for (let i = 0; i < text.length; i++) {
          robot.typeString(text[i]);
          // 如果下一个字符与当前字符相同，等待 30ms
          if (i < text.length - 1 && text[i] === text[i + 1]) {
            const end = Date.now() + 30;
            while (Date.now() < end) { /* wait */ }
          }
        }
        result = {
          success: true,
          command: type,
          message: `执行成功: 输入文本 (${text.length} 字符)`
        };
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
        } else if (keyMap[type].startsWith('SHIFT:')) {
          robot.keyTap(keyMap[type].slice(6), ['shift']);
          result = {
            success: true,
            command: type,
            message: `执行成功: ${keyMap[type]}`
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