// ============================================================
// change-avatar.js — Thay đổi ảnh đại diện Zalo
// ============================================================
import { Zalo } from 'zca-js';
import { readFileSync, existsSync, statSync } from 'fs';
import config from './config.js';
import logger from './logger.js';

async function changeAvatar() {
  const credPath = config.zalo.credentialsPath;

  if (!existsSync(credPath)) {
    console.error('❌ File credentials không tồn tại. Hãy đăng nhập trước.');
    process.exit(1);
  }

  const credentials = JSON.parse(readFileSync(credPath, 'utf-8'));
  
  // Custom imageMetadataGetter to return size and dimensions of avatar
  const zalo = new Zalo({
    imageMetadataGetter: async (filePath) => {
      const stats = statSync(filePath);
      return {
        width: 1024,
        height: 1024,
        size: stats.size, // Correct key is 'size', not 'totalSize'
      };
    }
  });

  logger.info('🔌 Connecting to Zalo...');
  const api = await zalo.login({
    cookie: credentials.cookies,
    imei: credentials.imei,
    userAgent: credentials.userAgent,
  });

  const avatarPath = 'C:/Users/ABC/.gemini/antigravity-ide/brain/8f61be5c-e31e-4e93-a065-8ec8da016afc/brand_avatar_1782447822592.png';
  logger.info(`✍️ Uploading avatar from: "${avatarPath}"...`);

  try {
    const updateRes = await api.changeAccountAvatar(avatarPath);
    logger.info('✅ Avatar updated successfully!', updateRes);
    console.log(`\n🎉 Đã đổi ảnh đại diện Zalo thành công!\n`);
  } catch (error) {
    logger.error('❌ Failed to update profile avatar', { error: error.message });
  }

  process.exit(0);
}

changeAvatar().catch(console.error);
