// ============================================================
// send-nurturing-sample.js — Gửi thử nghiệm thiệp chào buổi sáng có ảnh chị Dương qua Zalo
// ============================================================
import { Zalo } from 'zca-js';
import { readFileSync, existsSync, statSync } from 'fs';
import config from '../config.js';
import logger from '../logger.js';
import aiEngine from '../ai-engine.js';
import { createCard } from '../image-generator.js';

async function sendNurturingSample() {
  const credPath = config.zalo.credentialsPath;

  if (!existsSync(credPath)) {
    console.error('❌ File credentials không tồn tại. Hãy đăng nhập trước.');
    process.exit(1);
  }

  const credentials = JSON.parse(readFileSync(credPath, 'utf-8'));
  
  const zalo = new Zalo({
    imageMetadataGetter: async (filePath) => {
      const stats = statSync(filePath);
      return {
        width: 800,
        height: 800,
        size: stats.size,
      };
    }
  });

  logger.info('🔌 Connecting to Zalo...');
  const api = await zalo.login({
    cookie: credentials.cookies,
    imei: credentials.imei,
    userAgent: credentials.userAgent,
  });

  if (!config.zalo.adminId) {
    console.error('❌ ADMIN_ZALO_ID không được cấu hình trong .env');
    process.exit(1);
  }

  logger.info('⏰ Generating group morning nurturing post and quote card...');
  
  const nurturingData = await aiEngine.generateGroupNurturingPost(
    'Tam Thông Dưỡng Nhan By Dương',
    'Lan tỏa phương pháp trẻ hóa và chăm sóc sức khỏe chủ động',
    'Buổi sáng (8:00)'
  );

  logger.info(`Quote generated: "${nurturingData.quote}"`);

  // Tạo ảnh thiệp chào với nền là ảnh mẫu trán xoay tua của chị Dương để test viền vàng dưới cằm
  const tempImagePath = await createCard(nurturingData.quote, 'Buổi sáng (8:00)', 'sample_nurturing', './data/daily_posts/03_forehead_relaxation.png');

  logger.info(`Image created at: ${tempImagePath}`);
  logger.info(`📤 Sending sample nurturing card to Admin Zalo ID: ${config.zalo.adminId}...`);

  const imageBuffer = readFileSync(tempImagePath);
  const stats = statSync(tempImagePath);
  const attachment = {
    data: imageBuffer,
    filename: 'morning_nurturing.png',
    metadata: {
      totalSize: stats.size,
      width: 800,
      height: 800
    }
  };

  const msgObject = {
    msg: `✨ **[BẢN MẪU TIN NHẮN CHÀO BUỔI SÁNG GỬI NHÓM ZALO]** ✨\n\n${nurturingData.post}`,
    attachments: [attachment]
  };

  await api.sendMessage(msgObject, config.zalo.adminId);
  logger.info('✅ Sample nurturing post sent successfully!');
  console.log('\n🎉 Đã gửi bài viết chào buổi sáng mẫu và ảnh qua Zalo thành công!\n');
  process.exit(0);
}

sendNurturingSample().catch(console.error);
