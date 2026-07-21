// ============================================================
// extract-spa-prices.js — Script to Extract Spa Pricing via Gemini Multimodal
// ============================================================

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import config from '../config.js';

const MENU_DIR = './tài liệu spa/hình menu spa thùy dương sg';
const OUTPUT_FILE = './data/spa_price_list.md';

async function extractPrices() {
  console.log('🏁 Khởi động trích xuất bảng giá dịch vụ Spa Thùy Dương...');
  
  const apiKey = config.ai.geminiApiKey;
  if (!apiKey) {
    console.error('❌ Lỗi: Chưa cấu hình GEMINI_API_KEY trong file .env');
    process.exit(1);
  }

  // 1. Quét danh sách file ảnh trong thư mục
  if (!fs.existsSync(MENU_DIR)) {
    console.error(`❌ Thư mục không tồn tại: ${MENU_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(MENU_DIR)
    .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
    .sort();

  if (files.length === 0) {
    console.log('⚠️ Không tìm thấy ảnh nào trong thư mục menu.');
    process.exit(0);
  }

  console.log(`📸 Tìm thấy ${files.length} file ảnh menu spa.`);
  
  let finalMarkdownReport = `# 💆‍♀️ BẢNG GIÁ DỊCH VỤ SPA THÙY DƯƠNG (SÀI GÒN)\n\n*(Thông tin được trích xuất tự động từ hình ảnh menu thực tế bằng Gemini)*\n\n`;

  const model = config.ai.geminiModel;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // 2. Lặp qua từng file ảnh để gọi Gemini trích xuất thông tin
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(MENU_DIR, filename);
    console.log(`\n⏳ Đang xử lý ảnh [${i + 1}/${files.length}]: ${filename}...`);

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

      const prompt = `Bạn là một trợ lý nhập liệu chính xác. Đây là ảnh chụp một phần bảng giá menu dịch vụ của spa Thùy Dương ở Sài Gòn.
Hãy đọc kỹ hình ảnh và trích xuất tất cả các thông tin dịch vụ hiển thị trong ảnh bao gồm:
- Tên dịch vụ/Liệu trình
- Giá tiền (đơn vị VNĐ)
- Thời gian thực hiện hoặc mô tả ngắn (nếu có ghi trong ảnh)

Yêu cầu trả về:
- Định dạng bảng Markdown rõ ràng.
- Ghi nhận chính xác giá tiền hiển thị trên ảnh (không đoán mò).
- Chỉ trả về phần bảng Markdown dịch vụ, không thêm các câu giải thích đầu đuôi khác.`;

      const response = await axios.post(url, {
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 45000,
      });

      const extractedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (extractedText) {
        console.log(`✅ Đã trích xuất thành công ảnh ${filename}`);
        finalMarkdownReport += `### 📄 Phần Menu ${i + 1} (${filename})\n\n${extractedText.trim()}\n\n---\n\n`;
      } else {
        console.warn(`⚠️ Phản hồi từ Gemini rỗng cho file ${filename}`);
      }

    } catch (err) {
      console.error(`❌ Lỗi khi xử lý file ${filename}:`, err.message);
    }
  }

  // 3. Ghi kết quả tổng hợp ra file
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, finalMarkdownReport, 'utf-8');
  console.log(`\n🎉 HOÀN THÀNH TRÍCH XUẤT! Bảng giá tổng hợp đã được lưu tại: ${OUTPUT_FILE}`);
}

extractPrices().catch(err => {
  console.error('❌ Lỗi chạy script:', err);
});
