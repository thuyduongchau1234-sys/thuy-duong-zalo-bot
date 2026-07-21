// ============================================================
// send-zoom-now.js — Send Zoom Link to Thien Tong Group Manually
// ============================================================
import { Zalo, ThreadType } from 'zca-js';
import { readFileSync, existsSync } from 'fs';
import config from './config.js';
import logger from './logger.js';

async function main() {
  const credPath = config.zalo.credentialsPath;
  if (!existsSync(credPath)) {
    console.error('❌ Credentials file not found. Please log in first.');
    process.exit(1);
  }

  const credentials = JSON.parse(readFileSync(credPath, 'utf-8'));
  const zalo = new Zalo({ selfListen: false });

  try {
    console.log('🔌 Connecting to Zalo to send Zoom link...');
    const api = await zalo.login({
      cookie: credentials.cookies,
      imei: credentials.imei,
      userAgent: credentials.userAgent,
    });

    const targetGroupId = '1056022212136573959'; // An Toàn Cùng Nhau Về Quê
    const thienTongZoomMessage =
      `🌸 Em mời cả nhà mình cùng vào phòng Zoom đọc sách sáng nay ạ:\n` +
      `https://us06web.zoom.us/j/7778888699\n` +
      `Passcode: 88`;

    console.log(`📤 Sending Zoom link to group ${targetGroupId}...`);
    await api.sendMessage(thienTongZoomMessage, targetGroupId, ThreadType.Group);
    console.log('✅ Sent Zoom link successfully!');
    
    // Log to store if possible
    try {
      const { default: dataStore } = await import('./data-store.js');
      dataStore.logMessage(targetGroupId, 'outgoing', thienTongZoomMessage);
    } catch (e) {
      // ignore
    }

  } catch (error) {
    console.error('❌ Failed to send Zoom link:', error.message);
    process.exit(1);
  }
}

main();
