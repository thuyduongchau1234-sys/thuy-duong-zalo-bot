// ============================================================
// send-daily-sample.js — Gửi thử nghiệm bài viết gợi ý qua Zalo
// ============================================================
import { Zalo } from 'zca-js';
import { readFileSync, existsSync, statSync } from 'fs';
import config from '../config.js';
import logger from '../logger.js';
import aiEngine from '../ai-engine.js';

async function sendDailySample() {
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

  logger.info('⏰ Generating sample Facebook post and image...');
  
  const chosenImage = {
    fileName: '04_self_love.png',
    topic: 'Thông điệp tư duy sâu sắc về việc phải biết trân trọng và yêu thương bản thân mình trước thì mới có thể ôm trọn và có được cả thế giới. Kêu gọi hành động thực hành động tác cụ thể: Hãy dành ra 2 phút nhắm mắt, đặt hai tay chéo ôm nhẹ đôi vai của chính mình, hít thở sâu để kết nối cơ thể, gửi lời cảm ơn và yêu thương đến bản thân, giúp xua tan mọi áp lực nội tâm ngay lập tức.'
  };

  const imagePath = `./data/daily_posts/${chosenImage.fileName}`;
  if (!existsSync(imagePath)) {
    console.error(`❌ File ảnh mẫu không tồn tại tại: ${imagePath}`);
    process.exit(1);
  }

  const prompt = `Bạn là Trợ lý AI đắc lực của chị Châu Thị Thùy Dương. Hãy soạn thảo một bài viết chia sẻ giá trị thực tế trên trang cá nhân Facebook (được viết theo đúng phong cách quy chuẩn của chị) dựa trên chủ đề và hình ảnh minh họa đính kèm.
Chủ đề bài đăng hôm nay: "${chosenImage.topic}"

BẮT BUỘC TUÂN THỦ QUY TẮC VIẾT SAU:
1. Câu Hook mở đầu (Quan trọng nhất): Phải dưới 15 từ, là một nghịch lý chấn động nhẹ hoặc một chiêm nghiệm sâu sắc đánh trúng tâm lý độc giả khiến họ "wow" và không thể lướt qua. Không dùng câu hỏi tu từ sáo rỗng hay lời chào mừng quen thuộc.
2. Thân bài: Chỉ chia sẻ DUY NHẤT một động tác thực hành cụ thể được nhắc tới trong chủ đề. Hãy kết nối trực tiếp giữa tâm lý/nội tâm và phản ứng vật lý trên cơ thể (Ví dụ: khi gồng gánh áp lực thì cơ vai gáy co cứng, khớp cắn nghiến chặt, trán nhăn). Viết dạng các đoạn văn mượt mà giàu chất thơ, tính trải nghiệm và hướng dẫn động tác với hiệu quả cảm nhận được tức thì để người đọc muốn lưu lại và làm theo ngay. Không viết gạch đầu dòng khô khan hay quảng cáo lộ liễu.
3. Lời nhắc thả lỏng cơ mặt ở cuối: Nhấn mạnh việc thả lỏng cơ mặt là điều cốt lõi, là cách trẻ hóa tự nhiên nhanh nhất. Hướng dẫn nhanh cách thả lỏng (Nhắm nhẹ mắt, tách nhẹ hai hàm răng để giải phóng khớp cắn, thả rơi hàm dưới, cảm nhận cơ trán giãn mềm và nở một nụ cười hàm tiếu...).
4. Quảng bá khóa học: Khéo léo nhắc nhở về khóa học sắc đẹp "Tam Thông Dưỡng Nhan" sắp tới của chị Dương để thu hút sự tò mò của học viên đăng ký.
5. Giọng văn: Trưởng thành, tự tin, bình an, giống như một người cố vấn tâm hồn sâu sắc (CEO ngành Wellness). Hạn chế tối đa dùng emoji (chỉ dùng 1-2 cái tinh tế).
6. CHỈ trả về nội dung bài viết hoàn chỉnh, không thêm tiêu đề hay lời dẫn giải nào khác.`;

  const postContent = await aiEngine.generateResponse(config.zalo.adminId, prompt);

  logger.info(`📤 Sending sample post and 3 image options to Admin Zalo ID: ${config.zalo.adminId}...`);

  // 1. Send the post content text message first
  await api.sendMessage({
    msg: `✨ **[BẢN MẪU BÀI ĐĂNG FACEBOOK HÀNG NGÀY]** ✨\n\n${postContent.trim()}`
  }, config.zalo.adminId);
  
  // Wait 1s
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Send 3 alternative images for her to choose from
  const imagesList = [
    '01_tea_detox.png',
    '02_chin_massage.png',
    '03_forehead_relaxation.png',
    '04_self_love.png'
  ];

  for (let k = 0; k < 3; k++) { // Send 3 options
    // Send 04_self_love first, then 01_tea_detox, then 02_chin_massage
    const idx = k === 0 ? 3 : k - 1; 
    const imgName = imagesList[idx];
    const imgPath = `./data/daily_posts/${imgName}`;
    if (existsSync(imgPath)) {
      const imgBuffer = readFileSync(imgPath);
      const stats = statSync(imgPath);
      const attachment = {
        data: imgBuffer,
        filename: imgName,
        metadata: {
          totalSize: stats.size,
          width: 800,
          height: 800
        }
      };
      await api.sendMessage({
        msg: `🖼️ **[LỰA CHỌN ${k + 1}]** - ${imgName}`,
        attachments: [attachment]
      }, config.zalo.adminId);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  logger.info('✅ Sample post and 3 image options sent successfully!');
  console.log('\n🎉 Đã gửi bài viết mẫu và 3 lựa chọn ảnh qua Zalo thành công!\n');
  process.exit(0);
}

sendDailySample().catch(console.error);
