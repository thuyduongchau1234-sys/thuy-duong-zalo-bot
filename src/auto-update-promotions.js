import fs from 'fs';
import path from 'path';
import axios from 'axios';
import config from './config.js';
import logger from './logger.js';
import memoryEngine from './memory-engine.js';
import aiEngine from './ai-engine.js';

export async function runAutoUpdate() {
  logger.info("🤖 Starting automatic Amway promotion update check...");

  try {
    // 1. Fetch trang chủ Amway VN để tìm các link khuyến mãi nổi bật trong HTML
    const homepageUrl = 'https://www.amway.com.vn/vn/';
    const response = await axios.get(homepageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    const html = response.data;
    // Regex tìm các đường dẫn khuyến mãi hoặc tin tức trong các thẻ href
    // Ví dụ: /vn/khuyen-mai/... hoặc /vn/tin-tuc/... hoặc các link tương tự
    const urlRegex = /\/vn\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/g;
    let match;
    const candidateUrls = new Set();

    while ((match = urlRegex.exec(html)) !== null) {
      const url = match[0];
      if (url.includes('khuyen-mai') || url.includes('promotion') || url.includes('tin-tuc') || url.includes('news')) {
        candidateUrls.add(`https://www.amway.com.vn${url}`);
      }
    }

    logger.info(`📋 Found ${candidateUrls.size} candidate promotion/news URLs on homepage.`);

    // 2. Quét qua các URL ứng viên và phân tích bằng Gemini
    let updatedCount = 0;
    const limit = 3; // Chỉ phân tích tối đa 3 link mới nhất để tránh tốn API token
    let processed = 0;

    for (const url of candidateUrls) {
      if (processed >= limit) break;
      processed++;

      logger.info(`🔍 Fetching candidate page: ${url}`);
      try {
        const pageRes = await axios.get(url, { timeout: 15000 });
        const pageHtml = pageRes.data;

        // Trích xuất text thô từ HTML để gửi cho AI phân tích
        const cleanText = pageHtml
          .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
          .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000); // Lấy tối đa 8000 ký tự đầu tiên

        // Dùng Gemini phân tích xem đây có phải là chương trình khuyến mãi/sản phẩm mới của Amway hay không
        const prompt = `
Hãy phân tích nội dung trang web dưới đây của Amway Việt Nam.
Xác định xem đây có phải là:
1. Một chương trình khuyến mãi (mua sản phẩm được tặng quà, giảm giá, v.v.)
2. Hoặc một sản phẩm mới ra mắt.

Nếu ĐÚNG, hãy trả về kết quả dưới dạng JSON (chỉ trả về JSON duy nhất, không thêm bớt chữ nào ngoài khối JSON):
{
  "isPromotionOrNewProduct": true,
  "subject": "[Tên chương trình khuyến mãi hoặc sản phẩm mới]",
  "summary": "[Tóm tắt chi tiết thể lệ, điều kiện tham gia, quà tặng, sản phẩm áp dụng và thời gian diễn ra]",
  "keywords": ["khuyen mai", "amway", "[các từ khóa liên quan]"]
}

Nếu KHÔNG PHẢI, hãy trả về JSON:
{
  "isPromotionOrNewProduct": false
}

NỘI DUNG TRANG WEB:
${cleanText}
`;

        const aiResponseRaw = await aiEngine._callGemini([{ role: 'user', content: prompt }], true);
        const result = JSON.parse(aiResponseRaw);

        if (result.isPromotionOrNewProduct) {
          // Kiểm tra xem tri thức này đã được lưu chưa để tránh trùng lặp
          const existingMemories = memoryEngine.getUserMemories(config.zalo.adminId);
          const isDuplicate = existingMemories.some(m => m.subject.toLowerCase() === result.subject.toLowerCase());

          if (!isDuplicate) {
            // Lưu vào kho tri thức của bot (knowledge.json)
            memoryEngine.saveMemory(config.zalo.adminId, {
              category: 'tri_thuc',
              subject: result.subject,
              summary: result.summary + ` (Cập nhật tự động từ nguồn: ${url})`,
              keywords: result.keywords || ['khuyen mai', 'amway']
            });

            logger.info(`✅ Successfully auto-updated promotion: ${result.subject}`);
            updatedCount++;

            // Gửi tin nhắn thông báo cho chị Dương qua Zalo Admin
            const adminId = config.zalo.adminId;
            if (adminId) {
              const notificationMessage = `🤖 **[TỰ ĐỘNG CẬP NHẬT KHUYẾN MÃI]** 🤖\n\nEm vừa tự động quét hệ thống Amway và cập nhật chương trình mới:\n✨ **${result.subject}** ✨\n\n📝 **Tóm tắt thể lệ:**\n${result.summary}\n\n👉 *Em đã ghi nhớ thông tin này vào bộ não tri thức để sẵn sàng tư vấn chính xác cho đội nhóm và khách hàng của chị rồi nhé!* 🌸`;
              // Gửi qua hàm sendMessage của zalo client
              if (global.zaloClient) {
                await global.zaloClient.sendMessage(adminId, { msg: notificationMessage });
              }
            }
          }
        }
      } catch (err) {
        logger.error(`Error processing candidate URL ${url}:`, err.message);
      }
    }

    logger.info(`🎉 Auto-update completed. New promotions added: ${updatedCount}`);
  } catch (error) {
    logger.error("Failed to run auto promotion update:", error.message);
  }
}
