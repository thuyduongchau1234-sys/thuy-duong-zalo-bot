// ============================================================
// memory-engine.js — Trí Nhớ Dài Hạn (Giai Đoạn 2)
// ============================================================
// Module quản lý trí nhớ dài hạn của trợ lý bằng cách tự động
// trích xuất thông tin quan trọng và lưu trữ vào các file JSON.
// Không chặn luồng chat chính (chạy bất đồng bộ).
// ============================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';
import axios from 'axios';
import config from './config.js';
import logger from './logger.js';
import dataStore from './data-store.js';
import { createCard } from './image-generator.js';

const MEMORY_DIR = './data/memory';

class MemoryEngine {
  constructor() {
    // Đảm bảo thư mục lưu trữ trí nhớ tồn tại
    if (!existsSync(MEMORY_DIR)) {
      mkdirSync(MEMORY_DIR, { recursive: true });
    }

    // Các file lưu trữ theo danh mục
    this.files = {
      khach_hang: join(MEMORY_DIR, 'customers.json'),
      hoc_vien: join(MEMORY_DIR, 'students.json'),
      suc_khoe: join(MEMORY_DIR, 'health.json'),
      y_tuong: join(MEMORY_DIR, 'ideas.json'),
      du_an: join(MEMORY_DIR, 'projects.json'),
      tri_thuc: join(MEMORY_DIR, 'knowledge.json')
    };

    // Load dữ liệu lên bộ nhớ
    this.memories = {};
    for (const [category, filePath] of Object.entries(this.files)) {
      this.memories[category] = this._load(filePath, []);
    }
  }

  /**
   * Trích xuất và lưu trí nhớ từ lượt chat vừa rồi
   * Chạy bất đồng bộ trong background
   */
  async extractAndSave(userId, userMessage, aiResponse, api = null) {
    try {
      const user = dataStore.getUser(userId);
      const userName = user ? user.displayName : 'Unknown';

      // Không tự tạo bài đăng nhân hiệu từ tin nhắn của chính Admin để tránh spam
      const isAdminUser = userId === config.zalo.adminId;

      logger.info('🧠 Memory Engine: Analyzing interaction for memory & brand post extraction...', { userId, userName });

      // Nạp danh sách khách hàng để ánh xạ chéo nếu người nói là Admin
      let userListContext = '';
      if (isAdminUser) {
        const userList = Object.values(dataStore.users)
          .filter(u => u.id !== config.zalo.adminId)
          .map(u => ({ id: u.id, name: u.displayName }));
        userListContext = `
Dưới đây là danh sách khách hàng/đối tác hiện có trong cơ sở dữ liệu hệ thống (chị Dương có thể nhắc tên họ):
${JSON.stringify(userList, null, 2)}

Nếu người dùng là chị Châu Thị Thùy Dương (Admin) đang ghi chú hoặc lên lịch chăm sóc cho một người trong danh sách này (hoặc khách mới):
- "targetClientId": Ghi ID tương ứng từ danh sách trên (hoặc "new_client" nếu khách mới hoàn toàn chưa có trong danh sách).
- "targetClientName": Tên thật của khách hàng được nhắc tới.
Nếu chị Dương chỉ đang tâm sự, hỏi đáp thông thường hoặc dạy quy tắc chung (không nói về khách hàng cụ thể), hãy đặt targetClientId và targetClientName là null.`;
      }

      const prompt = `Bạn là hệ thống trích xuất trí nhớ và lên lịch chăm sóc khách hàng của Trợ Lý AI Châu Thị Thùy Dương.
Hãy phân tích lượt hội thoại dưới đây giữa người dùng (user) và trợ lý (assistant) để:
1. Trích xuất thông tin quan trọng cần nhớ lâu dài.
2. Xác định xem có cần lên lịch nhắc nhở chăm sóc khách hàng tiếp theo hay không (ví dụ: sau khi tư vấn liệu trình, hướng dẫn massage mặt hoặc khuyên dùng sản phẩm).
${userListContext}

Nội dung hội thoại:
- Người dùng (${userName}): "${userMessage}"
- Trợ lý AI: "${aiResponse}"

Yêu cầu 1: Trích xuất trí nhớ (chỉ khi thông tin thuộc các nhóm khách hàng, học viên, sức khỏe, dự án, tri thức mới có giá trị lâu dài).
Yêu cầu 2: Tự động trích xuất lịch nhắc chăm sóc khách hàng tiếp theo:
   - reminderDays: Số ngày cần nhắc nhở chăm sóc (ví dụ: 3, 7, 30), hoặc null nếu không cần.
   - reminderReason: Lý do chi tiết cần nhắn tin hỏi thăm khách (ví dụ: "Hỏi thăm tình trạng cơ mặt cân đối sau 7 ngày đả thông", "Theo dõi phản ứng da sau 3 ngày đổi sản phẩm"), hoặc null.

Yêu cầu trả về định dạng JSON duy nhất như sau (không thêm bất kỳ từ giải thích nào ngoài JSON):
{
  "hasMemory": true,
  "category": "khach_hang" | "hoc_vien" | "suc_khoe" | "y_tuong" | "du_an" | "tri_thuc",
  "subject": "Tiêu đề ngắn gọn của ghi nhớ",
  "summary": "Tóm tắt ngắn gọn nhưng đầy đủ thông tin chi tiết cần nhớ",
  "keywords": ["từ khóa 1", "từ khóa 2"],
  "nextAction": "Việc cần làm tiếp theo hoặc null",
  "reminderDays": 7 | 30 | null,
  "reminderReason": "Lý do hỏi thăm chăm sóc hoặc null",
  "targetClientId": string | null,
  "targetClientName": string | null
}
Hoặc nếu không có thông tin cần nhớ/nhắc nhở:
{
  "hasMemory": false,
  "reminderDays": null,
  "reminderReason": null,
  "targetClientId": null,
  "targetClientName": null
}
`;

      const resultText = await this._callAI(prompt);
      if (!resultText) return;

      const memoryData = this._parseJson(resultText);
      if (!memoryData) {
        logger.debug('🧠 Memory Engine: Failed to parse extraction result', { userId });
        return;
      }

      // Xác định thông tin đích (chuyển hướng chéo từ Admin sang Khách hàng nếu cần)
      let finalUserId = userId;
      let finalUserName = userName;

      if (isAdminUser && memoryData.targetClientId) {
        if (memoryData.targetClientId !== 'new_client') {
          finalUserId = memoryData.targetClientId;
          const targetUser = dataStore.getUser(finalUserId);
          finalUserName = targetUser ? targetUser.displayName : (memoryData.targetClientName || 'Khách hàng');
        } else if (memoryData.targetClientName) {
          finalUserId = 'new_user_' + Date.now();
          finalUserName = memoryData.targetClientName;
          dataStore.upsertUser(finalUserId, finalUserName);
        }
      }

      // 1. Xử lý lưu trí nhớ dài hạn
      if (memoryData.hasMemory) {
        const category = this.files[memoryData.category] ? memoryData.category : 'tri_thuc';
        
        const newRecord = {
          id: this._generateId(),
          userId: finalUserId,
          userName: finalUserName,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
          subject: memoryData.subject,
          summary: memoryData.summary,
          keywords: memoryData.keywords || [],
          nextAction: memoryData.nextAction || null
        };

        this.memories[category].push(newRecord);
        this._save(this.files[category], this.memories[category]);

        logger.info('🧠 Memory Engine: Extracted and saved new memory record!', {
          userId: finalUserId,
          category,
          subject: newRecord.subject,
          nextAction: newRecord.nextAction
        });
      }

      // 1b. Xử lý tự động lên lịch nhắc nhở chăm sóc khách hàng (CRM Reminders)
      const shouldScheduleReminder = memoryData.reminderDays && memoryData.reminderReason && 
        (!isAdminUser || (isAdminUser && memoryData.targetClientId));

      if (shouldScheduleReminder) {
        const remindersPath = './data/reminders.json';
        let reminders = [];
        if (existsSync(remindersPath)) {
          try {
            reminders = JSON.parse(readFileSync(remindersPath, 'utf-8'));
          } catch (e) {
            logger.warn('Failed to parse reminders.json, resetting to empty array', e);
          }
        }

        // Tính toán ngày cần nhắc nhở
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + parseInt(memoryData.reminderDays, 10));
        const targetDateStr = targetDate.toISOString().split('T')[0];

        const newReminder = {
          id: this._generateId(),
          userId: finalUserId,
          userName: finalUserName,
          createdDate: new Date().toISOString().split('T')[0],
          targetDate: targetDateStr,
          reason: memoryData.reminderReason,
          status: 'pending'
        };

        reminders.push(newReminder);
        writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));

        logger.info('🧠 Memory Engine: Automatically scheduled a CRM customer care reminder', newReminder);
      }

      // 2. [ĐÃ TẮT] Tạo và gửi bài đăng nhân hiệu — Chị Dương yêu cầu tắt vì bài viết chưa đủ sâu và gây phiền (24/06/2026)
      // Để bật lại: bỏ comment đoạn code bên dưới
      /*
      if (memoryData.hasBrandPost && !isAdminUser && api && config.zalo.adminId) {
        logger.info('🧠 Memory Engine: Proposing brand building post for Admin...', { userId });
        
        // Tạo ảnh quote card
        const quoteText = memoryData.brandPostQuote || 'Sức khỏe đến từ sự thả lỏng và lưu thông khí huyết.';
        let tempImagePath = null;
        try {
          tempImagePath = await createCard(quoteText, 'tối', `proposal_${userId}`);
          
          const imageBuffer = readFileSync(tempImagePath);
          const stats = statSync(tempImagePath);
          const attachment = {
            data: imageBuffer,
            filename: `proposal_${userId}.png`,
            metadata: {
              totalSize: stats.size,
              width: 800,
              height: 800
            }
          };

          const adminMsg = 
            `💡 **[ĐỀ XUẤT BÀI ĐĂNG PHÁT TRIỂN NHÂN HIỆU]**\n` +
            `Chào chị Thùy Dương, từ cuộc trò chuyện thực tế vừa rồi của chị với khách hàng **${userName}**, em đề xuất bài viết này để đăng Facebook/Zalo phát triển thương hiệu cá nhân của chị nhé:\n` +
            `━━━━━━━━━━━━━━━━━━━\n\n` +
            `${memoryData.brandPostText}\n\n` +
            `🖼️ *Hình ảnh Quote Card gợi ý được đính kèm bên dưới!*`;

          const msgObject = {
            msg: adminMsg,
            attachments: [attachment]
          };

          await api.sendMessage(msgObject, config.zalo.adminId);
          logger.info('🧠 Memory Engine: Sent brand post proposal to Admin successfully!');
        } catch (postErr) {
          logger.error('🧠 Memory Engine: Failed to generate/send proposed brand post to admin', postErr);
        } finally {
          // Clean up temp image
          if (tempImagePath && existsSync(tempImagePath)) {
            try {
              unlinkSync(tempImagePath);
            } catch (err) {
              logger.warn('Failed to clean up proposal temp image', err);
            }
          }
        }
      }
      */

    } catch (error) {
      logger.error('🧠 Memory Engine Error during extraction', { userId, error: error.message });
    }
  }

  /**
   * Lấy toàn bộ trí nhớ liên quan đến một người dùng cụ thể
   */
  getUserMemories(userId) {
    const userMemories = [];
    for (const [category, list] of Object.entries(this.memories)) {
      const filtered = list.filter(m => m.userId === userId);
      filtered.forEach(m => {
        userMemories.push({
          category,
          date: m.date,
          subject: m.subject,
          summary: m.summary,
          nextAction: m.nextAction
        });
      });
    }
    // Sắp xếp theo ngày tăng dần để prompt đọc theo trình tự thời gian
    return userMemories.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Tìm kiếm bộ nhớ bằng ngôn ngữ tự nhiên hoặc từ khóa
   */
  searchMemories(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [category, list] of Object.entries(this.memories)) {
      const matches = list.filter(m => 
        m.subject.toLowerCase().includes(lowerQuery) || 
        m.summary.toLowerCase().includes(lowerQuery) ||
        (m.userName && m.userName.toLowerCase().includes(lowerQuery)) ||
        (m.keywords && m.keywords.some(k => k.toLowerCase().includes(lowerQuery)))
      );
      matches.forEach(m => {
        results.push({ category, ...m });
      });
    }
    return results;
  }

  // ── Helper Methods ─────────────────────────────────────

  _load(filePath, defaultValue) {
    try {
      if (existsSync(filePath)) {
        const raw = readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (error) {
      logger.warn(`Failed to load memory file ${filePath}`, { error: error.message });
    }
    return defaultValue;
  }

  _save(filePath, data) {
    try {
      writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error(`Failed to save memory file ${filePath}`, { error: error.message });
    }
  }

  _generateId() {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  _parseJson(text) {
    try {
      let cleanJson = text.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.substring(7);
      }
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
      return JSON.parse(cleanJson.trim());
    } catch (e) {
      logger.warn('Failed to parse AI memory extraction JSON', { raw: text, error: e.message });
      return null;
    }
  }

  /**
   * Gọi AI trực tiếp sử dụng config hiện tại để tránh import vòng tròn
   */
  async _callAI(prompt) {
    const provider = config.ai.provider;
    if (provider === 'gemini') {
      return this._callGeminiDirect(prompt);
    } else if (provider === 'openai') {
      return this._callOpenAIDirect(prompt);
    }
    return null;
  }

  async _callGeminiDirect(prompt) {
    const apiKey = config.ai.geminiApiKey;
    if (!apiKey) return null;

    const model = config.ai.geminiModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const postData = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2, // Thấp để chính xác nhất
        responseMimeType: 'application/json'
      }
    };

    try {
      const response = await axios.post(url, postData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      });
      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
      logger.error('Gemini call error in memory engine', { error: error.message });
      return null;
    }
  }

  async _callOpenAIDirect(prompt) {
    const apiKey = config.ai.openaiApiKey;
    if (!apiKey) return null;

    const url = `${config.ai.openaiBaseUrl}/chat/completions`;
    const postData = {
      model: config.ai.openaiModel,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    };

    try {
      const response = await axios.post(url, postData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 20000
      });
      return response.data?.choices?.[0]?.message?.content || null;
    } catch (error) {
      logger.error('OpenAI call error in memory engine', { error: error.message });
      return null;
    }
  }
}

export default new MemoryEngine();
