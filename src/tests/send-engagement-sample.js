// ============================================================
// send-engagement-sample.js — Gửi thử nghiệm tin nhắn tương tác nhóm kiểu Bích cô giáo
// ============================================================
import { Zalo } from 'zca-js';
import { readFileSync, existsSync, statSync } from 'fs';
import sharp from 'sharp';
import path from 'path';
import config from '../config.js';
import logger from '../logger.js';

async function sendEngagementSample() {
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

  logger.info('⏰ Creating custom brand card overlay...');

  const width = 800;
  const height = 800;

  // Thiết kế khung chữ viền vàng nghệ thuật như mẫu của cô giáo
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <!-- Văn bản phía trên hộp viền vàng -->
      <text x="400" y="270" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1" filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.8))">
        đánh thức vẻ đẹp tự nhiên
      </text>
      
      <!-- Hộp viền vàng sang trọng ở giữa -->
      <rect x="150" y="320" width="500" height="150" rx="15" fill="rgba(15, 23, 42, 0.45)" stroke="#d4af37" stroke-width="4" filter="drop-shadow(3px 3px 5px rgba(0,0,0,0.5))" />
      
      <!-- Văn bản chính trong hộp viền vàng -->
      <text x="400" y="412" font-family="Georgia, Times New Roman, serif" font-size="44" font-weight="bold" fill="#d4af37" text-anchor="middle" letter-spacing="3" filter="drop-shadow(1px 1px 2px rgba(0,0,0,0.5))">
        LÀM CHỦ DIỆN MẠO
      </text>
      
      <!-- Văn bản phía dưới hộp viền vàng -->
      <text x="400" y="535" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1" filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.8))">
        bằng tâm thái bình an
      </text>
    </svg>
  `;

  const bgPath = path.join(process.cwd(), 'data', 'user_face_preferred.png');
  if (!existsSync(bgPath)) {
    console.error('❌ File user_face_preferred.png không tồn tại làm nền.');
    process.exit(1);
  }

  const outputPath = path.join(process.cwd(), 'data', 'temp_images', 'engagement_sample.png');
  
  // Ghép đè khung chữ lên ảnh chân dung của chị Dương
  await sharp(bgPath)
    .resize(width, height)
    .composite([{
      input: Buffer.from(svg),
      top: 0,
      left: 0
    }])
    .png()
    .toFile(outputPath);

  logger.info(`✅ Custom engagement card generated at: ${outputPath}`);

  // Soạn bài viết theo văn phong khuyến khích hành động kiểu cô giáo Bích
  const messageText = 
    `Dương đây, các chị yêu ơi! 🕒 Nửa ngày đã trôi qua rồi, các chị đã dành ra 1 phút để thả lỏng cơ mặt và mỉm cười chưa ạ? \n\n` +
    `Hãy cùng Dương thực hành ngay và chia sẻ hoạt động hoặc cảm xúc của các chị lúc này nhé 📊. Nuôi dưỡng vẻ đẹp tự nhiên bắt đầu từ việc thấu hiểu và làm chủ diện mạo chính mình 💆‍♀️. \n\n` +
    `Theo các chị, điều gì làm cản trở sự thư thái của mình nhất trong một ngày làm việc bận rộn 💬?`;

  const imageBuffer = readFileSync(outputPath);
  const stats = statSync(outputPath);
  const attachment = {
    data: imageBuffer,
    filename: 'engagement_sample.png',
    metadata: {
      totalSize: stats.size,
      width: 800,
      height: 800
    }
  };

  const msgObject = {
    msg: `✨ **[BẢN MẪU TIN NHẮN TƯƠNG TÁC NHÓM]** ✨\n\n${messageText}`,
    attachments: [attachment]
  };

  logger.info(`📤 Sending sample engagement message to Admin Zalo: ${config.zalo.adminId}...`);
  await api.sendMessage(msgObject, config.zalo.adminId);
  logger.info('✅ Sample engagement message sent successfully!');
  console.log('\n🎉 Đã gửi bài viết tương tác mẫu và ảnh qua Zalo thành công!\n');
  process.exit(0);
}

sendEngagementSample().catch(console.error);
