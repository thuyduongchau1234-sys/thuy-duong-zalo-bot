import { Zalo } from 'zca-js';
import { readFileSync, existsSync } from 'fs';
import config from '../config.js';

async function testFindUser() {
  const credPath = config.zalo.credentialsPath;
  if (!existsSync(credPath)) {
    console.error('❌ File credentials không tồn tại!');
    return;
  }

  const credentials = JSON.parse(readFileSync(credPath, 'utf-8'));
  const zalo = new Zalo({ selfListen: true });
  
  try {
    const api = await zalo.login({
      cookie: credentials.cookies,
      imei: credentials.imei,
      userAgent: credentials.userAgent,
    });
    console.log('✅ Đã đăng nhập thành công!');
    
    const phone = '0939994149';
    console.log(`🔍 Đang tìm người dùng cho số điện thoại: ${phone}...`);
    const user = await api.findUser(phone);
    console.log('👤 Thông tin người dùng tìm thấy:', JSON.stringify(user, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ LỖI:', err.message);
    process.exit(1);
  }
}

testFindUser();
