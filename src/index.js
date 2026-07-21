// ============================================================
// index.js — Zalo AI Assistant (Personal Account)
// ============================================================
// Bot chính — kết nối Zalo cá nhân qua zca-js,
// lắng nghe tin nhắn và phản hồi bằng AI.
//
// Cách chạy:
//   1. Lần đầu: node src/login.js (scan QR)
//   2. Sau đó: npm start
// ============================================================

import { Zalo, ThreadType, FriendEventType, GroupEventType } from 'zca-js';
import { readFileSync, writeFileSync, existsSync, unlinkSync, statSync } from 'fs';
import path from 'path';
import axios from 'axios';
import cron from 'node-cron';
import config from './config.js';
import logger from './logger.js';
import aiEngine from './ai-engine.js';
import dataStore from './data-store.js';
import { createCard } from './image-generator.js';
import { startWebServer } from './web-server.js';
import { runAutoUpdate } from './auto-update-promotions.js';

// ── Rate Limiter ─────────────────────────────────────────
const messageTimestamps = [];
function isRateLimited() {
  const now = Date.now();
  // Xóa timestamps cũ hơn 1 phút
  while (messageTimestamps.length > 0 && messageTimestamps[0] < now - 60000) {
    messageTimestamps.shift();
  }
  return messageTimestamps.length >= config.rateLimit.maxMessagesPerMinute;
}

function randomDelay() {
  const { minDelay, maxDelay } = config.rateLimit;
  return minDelay + Math.random() * (maxDelay - minDelay);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Gửi trạng thái "đang soạn tin..." liên tục trong khi chờ AI xử lý
function startTypingIndicator(api, threadId, threadType) {
  // Gửi phát đầu tiên ngay lập tức
  api.sendTypingEvent(threadId, threadType).catch(() => {});
  
  // Gửi lại mỗi 1500ms
  const intervalId = setInterval(() => {
    api.sendTypingEvent(threadId, threadType).catch(() => {});
  }, 1500);
  
  return () => clearInterval(intervalId);
}

// Phân giải tên hiển thị chính xác của người dùng
async function resolveSenderName(senderId, api, fallbackName = null) {
  if (!senderId) return fallbackName || 'Khách hàng';
  
  // 1. Thử lấy từ dataStore
  const storedUser = dataStore.getUser(senderId);
  if (storedUser && storedUser.displayName && storedUser.displayName !== 'Unknown' && storedUser.displayName !== 'Ẩn danh') {
    return storedUser.displayName;
  }
  
  // 2. Thử lấy từ fallbackName nếu có và hợp lệ
  if (fallbackName && fallbackName !== 'Unknown' && fallbackName !== 'Ẩn danh') {
    dataStore.upsertUser(senderId, fallbackName);
    return fallbackName;
  }
  
  // 3. Gọi API Zalo để lấy
  if (api) {
    try {
      const userInfo = await api.getUserInfo(senderId);
      const profiles = userInfo?.changed_profiles || userInfo?.unchanged_profiles || {};
      const profile = profiles[senderId] || Object.values(profiles)[0];
      const name = profile?.displayName || profile?.zaloName || profile?.name;
      if (name) {
        dataStore.upsertUser(senderId, name);
        return name;
      }
    } catch (err) {
      logger.warn('Failed to fetch user info in resolveSenderName', { senderId, err: err.message });
    }
  }
  
  return fallbackName || 'Khách hàng';
}


function isTargetGroupForWelcome(groupName) {
  if (!groupName) return false;
  const name = groupName.toLowerCase();
  
  // Loại bỏ dấu tiếng Việt để so sánh cho chính xác
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  
  const matchesBeauty = normalized.includes("nang") && normalized.includes("tam") && normalized.includes("sac") && normalized.includes("dep");
  const matchesKhoeDep = normalized.includes("khoe") && normalized.includes("dep") && normalized.includes("tinh") && normalized.includes("thuc");
  const matchesTamThong = normalized.includes("tam") && normalized.includes("thong") && normalized.includes("duong") && normalized.includes("nhan");
  const matchesAI = normalized.includes("lam") && normalized.includes("chu") && normalized.includes("ai") && normalized.includes("nang") && normalized.includes("tam") && normalized.includes("phien") && normalized.includes("ban");
  
  return matchesBeauty || matchesKhoeDep || matchesTamThong || matchesAI;
}

// Hàng đợi lưu các cuộc trò chuyện đang diễn ra cần tóm tắt
const pendingSummaries = new Map(); // userId -> { lastActivity: timestamp, needsSummary: boolean, displayName: string, incomingCount: number }

async function updatePendingSummary(userId, api, isIncoming = false) {
  if (userId === config.zalo.adminId) return;
  
  let displayName = 'Khách hàng Zalo';
  const userObj = dataStore.getUser(userId);
  if (userObj && userObj.displayName && userObj.displayName !== 'Unknown') {
    displayName = userObj.displayName;
  } else if (api) {
    try {
      const userInfo = await api.getUserInfo(userId);
      const profiles = userInfo?.changed_profiles || userInfo?.unchanged_profiles || {};
      const profile = profiles[userId] || Object.values(profiles)[0];
      const name = profile?.displayName || profile?.zaloName || profile?.name;
      if (name) {
        displayName = name;
        dataStore.upsertUser(userId, displayName);
      }
    } catch (err) {
      logger.warn('Failed to fetch user info for summary tracking', { userId, err: err.message });
    }
  }
  
  const existing = pendingSummaries.get(userId) || { incomingCount: 0 };
  pendingSummaries.set(userId, {
    lastActivity: Date.now(),
    needsSummary: true,
    displayName: displayName,
    incomingCount: existing.incomingCount + (isIncoming ? 1 : 0)
  });
}

// ── Main Bot ─────────────────────────────────────────────

async function startBot() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       🌿 ZALO AI ASSISTANT — STARTING...                 ║');
  console.log('║       Trợ Lý Ảo Chị Thùy Dương                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── Step 1: Load credentials ───────────────────────────
  const credPath = config.zalo.credentialsPath;

  if (!existsSync(credPath)) {
    console.error('❌ Chưa đăng nhập Zalo!');
    console.error('   Chạy lệnh sau để đăng nhập: npm run login');
    process.exit(1);
  }

  let credentials;
  try {
    credentials = JSON.parse(readFileSync(credPath, 'utf-8'));
    logger.info('📁 Loaded credentials', { loginTime: credentials.loginTime });
  } catch (error) {
    console.error('❌ File credentials bị lỗi. Hãy đăng nhập lại: npm run login');
    process.exit(1);
  }

  // ── Step 2: Connect to Zalo ────────────────────────────
  logger.info('🔌 Connecting to Zalo...');

  const zalo = new Zalo({ selfListen: true });

  let api;
  try {
    api = await zalo.login({
      cookie: credentials.cookies,
      imei: credentials.imei,
      userAgent: credentials.userAgent,
    });
    logger.info('✅ Connected to Zalo successfully!');
    
    // Khởi động Web Server cục bộ phục vụ Landing Page & các cổng API
    startWebServer(api);
  } catch (error) {
    logger.error('❌ Failed to connect to Zalo', { error: error.message });
    console.error('\n❌ Không thể kết nối Zalo. Có thể credentials đã hết hạn.');
    console.error('   Hãy đăng nhập lại: npm run login\n');
    process.exit(1);
  }

  // ── Step 3: Auto-sync all joined groups ─────────────────
  try {
    logger.info('🔄 Syncing all joined Zalo groups...');
    const allGroupsRes = await api.getAllGroups();
    const groupIds = Object.keys(allGroupsRes?.gridVerMap || {});
    
    if (groupIds.length > 0) {
      logger.info(`📋 Found ${groupIds.length} joined groups. Fetching group info...`);
      
      // getGroupInfo accepts an array of group IDs
      const groupInfoRes = await api.getGroupInfo(groupIds);
      const gridInfoMap = groupInfoRes?.gridInfoMap || {};
      
      let newCount = 0;
      const defaultPurpose = 'Thực hành phương pháp tam thông dưỡng nhan, chăm sóc làm đẹp tự nhiên và dinh dưỡng sức khỏe.';
      
      for (const gid of groupIds) {
        const groupName = gridInfoMap[gid]?.name || 'Group Chat';
        const groupNameLower = groupName.toLowerCase();
        
        // Bỏ qua không tự động duyệt nhóm Gia Đình Yêu Thương
        const isExcluded = 
          gid === '1752645408761511922' || 
          groupNameLower.includes('gia đình yêu thương') ||
          groupNameLower.includes('gia dinh yeu thuong');

        if (isExcluded) {
          logger.info(`👥 Skip auto-approving/syncing excluded group: "${groupName}" (${gid})`);
          continue;
        }

        if (!dataStore.isGroupApproved(gid)) {
          dataStore.approveGroup(gid, groupName, defaultPurpose);
          newCount++;
          logger.info(`✅ Auto-approved group: "${groupName}" (${gid})`);
        } else {
          // Update group name if it changed
          if (groupName) {
            const existing = dataStore.getApprovedGroup(gid);
            if (existing && existing.name !== groupName) {
              dataStore.approveGroup(gid, groupName, existing.purpose);
              logger.info(`🔄 Updated group name: "${groupName}" (${gid})`);
            }
          }
        }
      }
      
      const totalApproved = dataStore.getApprovedGroups().length;
      logger.info(`✅ Group sync complete: ${newCount} new groups approved. Total active: ${totalApproved}`);
    } else {
      logger.info('📋 No joined groups found.');
    }
  } catch (syncError) {
    logger.warn('⚠️ Failed to auto-sync groups (bot will still work with manually approved groups)', { error: syncError.message });
  }

  // ── Step 4: Listen for messages ────────────────────────
  logger.info('👂 Listening for messages...');

  api.listener.on('message', async (message) => {
    try {
      logger.info('📩 Raw message event received:', {
        type: message.type,
        threadId: message.threadId,
        isSelf: message.isSelf,
        content: message.data?.content,
      });

      // Chỉ xử lý tin nhắn cá nhân và tin nhắn nhóm
      if (message.type !== ThreadType.User && message.type !== ThreadType.Group) {
        return;
      }

      const content = message.data.content;
      let userMessage = '';
      let imageUrl = null;

      if (typeof content === 'string') {
        userMessage = content.trim();
      } else if (content && typeof content === 'object') {
        // Lấy text message (nếu có)
        userMessage = (content.title || content.text || content.description || '').trim();
        // Tìm URL ảnh theo tất cả các field Zalo có thể trả về
        imageUrl = content.href || content.thumb || content.url || content.normalUrl ||
                   content.thumbUrl || content.imageUrl || null;
        
        // Nếu là tin nhắn GIF hoặc sticker thì bỏ qua
        if (content.type === 'gif' || content.type === 'sticker') {
          imageUrl = null;
        }
        
        // Nếu không có text và có link nhưng không phải ảnh, dùng link làm nội dung text
        if (!userMessage && imageUrl) {
          const lowerUrl = imageUrl.toLowerCase();
          const isImageUrl = lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/) ||
                             lowerUrl.includes('photo') || lowerUrl.includes('image') ||
                             lowerUrl.includes('img') || lowerUrl.includes('thumb');
          if (!isImageUrl) {
            // Đây là link/URL thông thường, không phải ảnh → chuyển thành text
            userMessage = imageUrl;
            imageUrl = null;
          }
        }
        
        // Log để debug nếu cần
        if (imageUrl || userMessage) {
          logger.info('📎 Parsed object message', { userMessage: userMessage?.substring(0, 80), imageUrl: imageUrl?.substring(0, 80), contentType: content.type });
        }
      }
      
      // Kiểm tra attachment ảnh trực tiếp trong message.data (một số phiên bản zca-js)
      if (!imageUrl && message.data?.attachment?.type === 'photo') {
        imageUrl = message.data.attachment.url || message.data.attachment.href || null;
      }

      if (!userMessage && !imageUrl) {
        return;
      }

      // Bỏ qua tin nhắn do chính bot gửi (ngoại trừ các lệnh bắt đầu bằng '#')
      if (message.isSelf && !userMessage.startsWith('#')) {
        return;
      }

      const threadId = message.threadId;

      // Kiểm tra quyền Admin (Chỉ có chính bot gửi hoặc tài khoản Admin chỉ định mới dùng được các lệnh bắt đầu bằng '#')
      const senderId = message.data?.senderId || message.data?.uid || message.data?.uidFrom || '';
      const isAdmin = message.isSelf || 
                      threadId === config.zalo.adminId || 
                      senderId === config.zalo.adminId;

      // ── Get ID Command ────────────────────────────────
      if (userMessage.toLowerCase() === '#id') {
        if (!isAdmin) {
          logger.warn('🚫 Non-admin tried to execute #id', { threadId, senderId });
          return;
        }
        await api.sendMessage(`🆔 ID của cuộc trò chuyện này là: ${threadId}`, threadId);
        return;
      }

      // ── Group Entry Approval Command (Skill 04) ───────
      if (userMessage.startsWith('#duyet ')) {
        if (!isAdmin) {
          logger.warn('🚫 Non-admin tried to execute #duyet', { threadId, senderId });
          return;
        }
        const cmdParts = userMessage.substring('#duyet '.length).trim().split(/\s+/);
        const targetGroupId = cmdParts[0];
        const purpose = userMessage.substring('#duyet '.length + targetGroupId.length).trim() || 
                        'Chia sẻ kiến thức về sức khỏe, thảo dược thiên nhiên và làm đẹp tự nhiên.';
        
        if (targetGroupId) {
          let groupName = 'Group Chat';
          try {
            const groupInfoRes = await api.getGroupInfo(targetGroupId);
            if (groupInfoRes?.gridInfoMap?.[targetGroupId]?.name) {
              groupName = groupInfoRes.gridInfoMap[targetGroupId].name;
            }
          } catch (err) {
            logger.warn('Failed to fetch group info from API in #duyet command', err);
          }

          dataStore.approveGroup(targetGroupId, groupName, purpose);
          const welcomeMsg = `Chào cả nhà,\nEm là trợ lý của chị Thùy Dương 🌿\nRất vui được đồng hành cùng cả nhà ạ!`;
          try {
            await api.sendMessage(welcomeMsg, targetGroupId, ThreadType.Group);
            logger.info('✅ Approved group welcome greeting sent successfully', { targetGroupId });
            dataStore.upsertUser(targetGroupId, groupName);
            dataStore.logMessage(targetGroupId, 'outgoing', welcomeMsg);
            dataStore.addToConversation(targetGroupId, 'assistant', welcomeMsg);
            dataStore.setGreetingStep(targetGroupId, 1);
            
            await api.sendMessage(`✅ Đã duyệt nhóm "${groupName}" thành công!\n🎯 Mục đích hoạt động: "${purpose}"\n🤖 Bot đã bắt đầu Greeting Step 1.`, threadId);
          } catch (err) {
            logger.error('Failed to send welcome to approved group', err);
            await api.sendMessage(`❌ Duyệt nhóm lưu database thành công nhưng lỗi gửi tin chào mừng: ${err.message}`, threadId);
          }
          return;
        }
      }

      if (userMessage.startsWith('#mucdich ')) {
        if (!isAdmin) {
          logger.warn('🚫 Non-admin tried to execute #mucdich', { threadId, senderId });
          return;
        }
        const cmdParts = userMessage.substring('#mucdich '.length).trim().split(/\s+/);
        const targetGroupId = cmdParts[0];
        const newPurpose = userMessage.substring('#mucdich '.length + targetGroupId.length).trim();
        
        if (targetGroupId && newPurpose) {
          const group = dataStore.getApprovedGroup(targetGroupId);
          if (!group) {
            await api.sendMessage(`❌ Nhóm này chưa được duyệt hoạt động. Hãy duyệt trước bằng cú pháp: #duyet ${targetGroupId}`, threadId);
            return;
          }
          
          let groupName = group.name;
          try {
            const groupInfoRes = await api.getGroupInfo(targetGroupId);
            if (groupInfoRes?.gridInfoMap?.[targetGroupId]?.name) {
              groupName = groupInfoRes.gridInfoMap[targetGroupId].name;
            }
          } catch (err) {
            logger.warn('Failed to fetch group info from API', err);
          }
          
          dataStore.approveGroup(targetGroupId, groupName, newPurpose);
          await api.sendMessage(`✅ Đã cập nhật mục đích hoạt động cho nhóm "${groupName}" thành:\n💬 "${newPurpose}"`, threadId);
        } else {
          await api.sendMessage(`❌ Sai cú pháp! Vui lòng dùng: #mucdich [groupId] [mục đích mới]`, threadId);
        }
        return;
      }

      // ── Manual CEO Briefing Command (Skill 08) ────────
      if (userMessage.toLowerCase() === '#baocao') {
        if (!isAdmin) {
          logger.warn('🚫 Non-admin tried to execute #baocao', { threadId, senderId });
          return;
        }
        const stats = dataStore.getDailyStats();
        const today = new Date().toISOString().split('T')[0];
        const activeLeads = Object.values(dataStore.users).filter(u => u.lastContact.startsWith(today) && u.leadScore > 0);
        const leadsList = activeLeads.map(l => `• ${l.displayName} (Score: ${l.leadScore}, Tags: ${l.tags.join(', ') || 'Chưa gắn'})`).join('\n') || '• Không có Lead mới tương tác.';

        const reportMsg = 
          `📊 BÁO CÁO CEO TRỰC TIẾP 📊\n` +
          `📅 Ngày: ${stats.date}\n` +
          `━━━━━━━━━━━━━━━━━━━\n\n` +
          `👥 Tương tác trong ngày:\n` +
          `• Số khách hàng chat: ${stats.uniqueUsers} người\n` +
          `• Tổng số tin nhắn: ${stats.totalMessages} tin\n` +
          `  - Tin gửi đến Zalo: ${stats.incoming} tin\n` +
          `  - Bot phản hồi: ${stats.outgoing} tin\n\n` +
          `🎯 Khách hàng tiềm năng & Đối tác hoạt động:\n` +
          `${leadsList}\n\n` +
          `📈 Tổng số khách hàng tích lũy: ${stats.totalUsersAllTime} người\n` +
          `💬 Tổng số tin nhắn tích lũy: ${stats.totalMessagesAllTime} tin\n\n` +
          `🚀 Hệ thống hoạt động bình thường!`;

        try {
          if (config.zalo.adminId) {
            await api.sendMessage(reportMsg, config.zalo.adminId);
            await api.sendMessage(`✅ Báo cáo CEO đã được gửi qua Zalo cá nhân của chị!`, threadId);
          } else {
            await api.sendMessage(reportMsg, threadId);
          }
        } catch (err) {
          logger.error('Failed to send manual report to Zalo Admin', err);
          await api.sendMessage(`❌ Lỗi gửi báo cáo: ${err.message}`, threadId);
        }
        return;
      }

      // ── Test Nurturing Post Command (Skill 05 Test) ─────
      if (userMessage.toLowerCase() === '#testcare') {
        if (!isAdmin) {
          logger.warn('🚫 Non-admin tried to execute #testcare', { threadId, senderId });
          return;
        }
        
        const isGroup = message.type === ThreadType.Group;
        if (!isGroup) {
          await api.sendMessage(`❌ Lệnh #testcare chỉ chạy được từ trong nhóm đã duyệt!`, threadId);
          return;
        }

        if (!dataStore.isGroupApproved(threadId)) {
          await api.sendMessage(`❌ Nhóm này chưa được duyệt! Hãy duyệt nhóm trước bằng lệnh #duyet.`, threadId);
          return;
        }

        await api.sendMessage(`🔄 Đang thử nghiệm sinh nội dung và đăng ảnh Quote Card cho nhóm này...`, threadId);
        
        let tempImagePath = null;
        try {
          let groupName = 'Group Chat';
          try {
            const groupInfoRes = await api.getGroupInfo(threadId);
            if (groupInfoRes?.gridInfoMap?.[threadId]?.name) {
              groupName = groupInfoRes.gridInfoMap[threadId].name;
            }
          } catch (err) {
            logger.warn('Failed to fetch group info in #testcare', err);
          }

          const group = dataStore.getApprovedGroup(threadId);
          const timeOfDay = 'Buổi sáng (8:00)'; // Giả lập buổi sáng để test
          
          const nurturingData = await aiEngine.generateGroupNurturingPost(groupName, group.purpose, timeOfDay);
          tempImagePath = await createCard(nurturingData.quote, timeOfDay, threadId);

          const imageBuffer = readFileSync(tempImagePath);
          const stats = statSync(tempImagePath);
          const attachment = {
            data: imageBuffer,
            filename: `nurturing_${threadId}.png`,
            metadata: {
              totalSize: stats.size,
              width: 800,
              height: 800
            }
          };

          const msgObject = {
            msg: nurturingData.post,
            attachments: [attachment]
          };

          await api.sendMessage(msgObject, threadId, ThreadType.Group);
          
          if (tempImagePath && existsSync(tempImagePath)) {
            unlinkSync(tempImagePath);
          }
          
          await api.sendMessage(`✅ Thử nghiệm hoàn tất thành công!`, threadId);
        } catch (err) {
          logger.error('Failed in #testcare execution', err);
          if (tempImagePath && existsSync(tempImagePath)) {
            unlinkSync(tempImagePath);
          }
          await api.sendMessage(`❌ Thử nghiệm thất bại: ${err.message}`, threadId);
        }
        return;
      }

      // ── Request Daily Post Draft Command ────────
      if (userMessage.toLowerCase() === '#vietbai') {
        if (!isAdmin) {
          logger.warn('🚫 Non-admin tried to execute #vietbai', { threadId, senderId });
          return;
        }
        await api.sendMessage(`🔄 Đang chuẩn bị bài viết nháp và các tùy chọn hình ảnh cho chị...`, threadId);
        try {
          await generateDailyPostDraft(threadId);
        } catch (err) {
          logger.error('Failed to manually generate daily post via #vietbai', err);
          await api.sendMessage(`❌ Gặp lỗi khi sinh bài viết: ${err.message}`, threadId);
        }
        return;
      }

      logger.info('💬 Message received', {
        threadId,
        type: message.type === ThreadType.Group ? 'Group' : 'User',
        message: userMessage.substring(0, 100),
      });

      // Nếu là tin nhắn nhóm, ta CHỈ xử lý gửi Greeting 2 và Greeting 3 nếu nhóm đã được duyệt
      if (message.type === ThreadType.Group) {
        // Quyền Admin lấy ID nhóm nhanh
        if (isAdmin && userMessage.toLowerCase() === '#id') {
          await api.sendMessage(`🆔 ID của nhóm này là: ${threadId}`, threadId);
          return;
        }

        if (!dataStore.isGroupApproved(threadId)) {
          logger.debug('👥 Ignored message from unapproved group', { threadId });
          return;
        }

        // Cập nhật tên nhóm thực tế nếu có
        let groupName = 'Group Chat';
        try {
          const groupInfoRes = await api.getGroupInfo(threadId);
          if (groupInfoRes?.gridInfoMap?.[threadId]?.name) {
            groupName = groupInfoRes.gridInfoMap[threadId].name;
          }
        } catch (err) {
          logger.warn('Failed to fetch group info in message listener', err);
        }

        // Đảm bảo thông tin nhóm được cập nhật trong dataStore
        dataStore.upsertUser(threadId, groupName);
        // Đặt greetingStep của nhóm thành 3 để bỏ qua onboarding tin nhắn mẫu
        dataStore.setGreetingStep(threadId, 3);

        // Đối với nhóm Thiền Tông "An Toàn Cùng Nhau Về Quê":
        // Không gửi bất kỳ phản hồi nào, không trả lời tag tên, chỉ log và bỏ qua hoàn toàn.
        const isThienTongGroup =
          threadId === '1056022212136573959' ||
          groupName.toLowerCase().includes('an toàn cùng nhau về quê') ||
          groupName.toLowerCase().includes('an toan cung nhau ve que') ||
          groupName.toLowerCase().includes('an toàn cùng nhau') ||
          groupName.toLowerCase().includes('an toan cung nhau');

        if (isThienTongGroup) {
          logger.info(`👥 Ignored mention/message in Thien Tong group "${groupName}" (${threadId}) as per instruction.`);
          return;
        }

        // Kiểm tra xem bot có được nhắc tên trực tiếp, quote tin nhắn của bot, hoặc chứa từ khóa định danh rõ ràng không
        const ownId = api.getOwnId ? api.getOwnId() : '';
        const hasOwnIdMention = Array.isArray(message.data?.mentions) && 
          message.data.mentions.some(m => String(m.uid) === String(ownId));
        
        const isQuoteToSelf = message.data?.quote && String(message.data.quote.ownerId) === String(ownId);

        const lowerMsg = userMessage.toLowerCase();
        const hasAssistantKeywords = 
          lowerMsg.includes('dương assistant') ||
          lowerMsg.includes('assistant dương') ||
          lowerMsg.includes('trợ lý của chị dương') ||
          lowerMsg.includes('trợ lý dương') ||
          lowerMsg.includes('trợ lý của dương') ||
          lowerMsg.includes('trợ lý ơi') ||
          lowerMsg.includes('bot ơi') ||
          lowerMsg.includes('trợ lý thùy dương');

        const isMentioned = hasOwnIdMention || isQuoteToSelf || hasAssistantKeywords;

        if (isMentioned) {
          // Loại bỏ tag @mention để lấy câu hỏi sạch
          const cleanMessage = userMessage.replace(/@[^\s]+/g, '').trim();
          
          if (!imageUrl && message.data?.attachment?.type === 'photo') {
            imageUrl = message.data.attachment.url;
          }
          
          logger.info('👥 Bot mentioned in approved group, generating AI reply...', { threadId, cleanMessage });
          
          // Phân giải tên hiển thị chính xác của người gửi trong nhóm
          const rawSenderName = message.data?.senderName || message.data?.displayName || null;
          const senderName = await resolveSenderName(senderId, api, rawSenderName);
          
          const stopTyping = startTypingIndicator(api, threadId, ThreadType.Group);
          let response;
          try {
            response = await aiEngine.generateResponse(threadId, cleanMessage, imageUrl, api, senderName, senderId);
          } finally {
            stopTyping();
          }

          
          // Độ trễ tự nhiên
          const minDelay = config.rateLimit.minDelay || 1000;
          const maxDelay = config.rateLimit.maxDelay || 3000;
          const replyDelay = minDelay + Math.random() * (maxDelay - minDelay);
          await delay(replyDelay);
          
          // Chia tin nhắn dài thành nhiều phần (Zalo giới hạn ~2000 ký tự)
          const parts = splitMessage(response, 2000);
          for (const part of parts) {
            await api.sendMessage(part, threadId, ThreadType.Group);
            if (parts.length > 1) {
              await delay(500); // Delay giữa các phần
            }
          }
          logger.info('✅ Mention response sent to group successfully', { groupId: threadId });
          
          dataStore.logMessage(threadId, 'outgoing', response);
          // Không gọi addToConversation ở đây vì aiEngine.generateResponse đã tự lưu rồi để tránh trùng lặp
        }
        return; // Luôn kết thúc đối với nhóm (không chạy tiếp xuống AI)
      }

      const userId = threadId;

      // Cập nhật hoạt động cho hàng đợi tóm tắt (chỉ áp dụng cho tin nhắn cá nhân không phải từ admin gửi)
      if (userId !== config.zalo.adminId) {
        updatePendingSummary(userId, api, true).catch(err => logger.error('Error updating pending summary for incoming message', err));
      }

      // Rate limiting
      if (isRateLimited()) {
        logger.warn('⚠️ Rate limited, skipping response', { userId });
        return;
      }

      // Track user
      const rawSenderName = message.data?.senderName || message.data?.displayName || null;
      const senderName = await resolveSenderName(userId, api, rawSenderName);
      dataStore.upsertUser(userId, senderName);
      dataStore.logMessage(userId, 'incoming', userMessage);

      // ── Lead Scoring ─────────────────────────────────
      let scoreChange = 1;
      let scoreReason = 'Gửi tin nhắn';

      const lowerMsg = userMessage.toLowerCase();
      const highIntentKeywords = ['sản phẩm', 'thảo dược', 'giá', 'phí', 'đặt hàng',
        'bao nhiêu', 'mua', 'spa', 'dưỡng da', 'liệu trình', 'chăm sóc da', 'làm đẹp'];

      if (highIntentKeywords.some(kw => lowerMsg.includes(kw))) {
        scoreChange = 5;
        scoreReason = `Quan tâm: "${userMessage.substring(0, 50)}"`;
      }

      // Detect phone number
      const phoneRegex = /0\d{9,10}/;
      if (phoneRegex.test(userMessage)) {
        scoreChange = 10;
        scoreReason = `Gửi SĐT: ${userMessage.match(phoneRegex)[0]}`;
      }

      dataStore.updateLeadScore(userId, scoreChange, scoreReason);

      // ── Escalation to Human (Skill 09) ─────────────────
      let escalationIntent = null;
      if (lowerMsg.includes('hợp tác') || lowerMsg.includes('dự án') || lowerMsg.includes('kết hợp') || lowerMsg.includes('partner') || lowerMsg.includes('đại lý')) {
        escalationIntent = 'Hợp tác';
      } else if (lowerMsg.includes('nhượng quyền') || lowerMsg.includes('mở chi nhánh') || lowerMsg.includes('góp vốn') || lowerMsg.includes('đầu tư')) {
        escalationIntent = 'Đầu tư';
      } else if (lowerMsg.includes('khiếu nại') || lowerMsg.includes('lỗi') || lowerMsg.includes('dị ứng') || lowerMsg.includes('không hài lòng') || lowerMsg.includes('hoàn tiền') || lowerMsg.includes('phản ứng')) {
        escalationIntent = 'Khiếu nại/Phản hồi';
      } else if (lowerMsg.includes('mua') || lowerMsg.includes('đặt hàng') || lowerMsg.includes('đặt lịch') || lowerMsg.includes('liệu trình') || lowerMsg.includes('chuyển khoản') || lowerMsg.includes('thanh toán')) {
        escalationIntent = 'Mua hàng/Đặt lịch';
      }

      if (escalationIntent) {
        logger.info(`🚨 Escalation detected: "${escalationIntent}". Forwarding to Zalo Admin...`);
        if (config.zalo.adminId) {
          // Cố gắng phân giải tên thật của khách hàng để chị Dương biết chính xác đó là ai
          let clientName = senderName || 'Ẩn danh';
          if (clientName === 'Ẩn danh' || clientName === 'Unknown') {
            const storedUser = dataStore.getUser(userId);
            if (storedUser && storedUser.displayName && storedUser.displayName !== 'Unknown') {
              clientName = storedUser.displayName;
            } else if (api) {
              try {
                const userInfo = await api.getUserInfo(userId);
                const profiles = userInfo?.changed_profiles || userInfo?.unchanged_profiles || {};
                const profile = profiles[userId] || Object.values(profiles)[0];
                const name = profile?.displayName || profile?.zaloName || profile?.name;
                if (name) {
                  clientName = name;
                  dataStore.upsertUser(userId, clientName);
                }
              } catch (err) {
                logger.warn('Failed to fetch user info for escalation alert', { userId, err: err.message });
              }
            }
          }

          const alertMsg = `🚨 [CẢNH BÁO KHÁCH HÀNG CẦN CHĂM SÓC]\n\n` +
            `👤 Khách hàng: **${clientName}**\n` +
            `🎯 Nhu cầu: ${escalationIntent.toUpperCase()}\n\n` +
            `💬 Tin nhắn gốc:\n"${userMessage}"\n\n` +
            `👉 Chị Thùy Dương vào ô chat chăm sóc **${clientName}** nhé!\n` +
            `*(Zalo ID: ${userId})*`;
          
          api.sendMessage(alertMsg, config.zalo.adminId).catch(err => 
            logger.error('Failed to send Zalo escalation alert to admin', err)
          );
        }
      }

      // ── Lead Classification (Skill 07) ─────────────────
      const userObj = dataStore.getUser(userId);
      if (userObj) {
        if (escalationIntent === 'Hợp tác' || escalationIntent === 'Đầu tư') {
          if (!userObj.tags.includes('Đối tác')) {
            userObj.tags.push('Đối tác');
            dataStore.updateLeadScore(userId, 5, 'Phân loại: Đối tác');
          }
        } else if (escalationIntent === 'Mua hàng/Đặt lịch') {
          if (!userObj.tags.includes('Khách hàng tiềm năng')) {
            userObj.tags.push('Khách hàng tiềm năng');
            dataStore.updateLeadScore(userId, 10, 'Phân loại: Khách hàng tiềm năng');
          }
        } else if (escalationIntent === 'Khiếu nại/Lỗi') {
          if (!userObj.tags.includes('Khách hàng hiện tại')) {
            userObj.tags.push('Khách hàng hiện tại');
            dataStore.updateLeadScore(userId, 5, 'Phân loại: Khách hàng hiện tại (khiếu nại/báo lỗi)');
          }
        } else if (lowerMsg.includes('quảng cáo') || lowerMsg.includes('bán hàng') || lowerMsg.includes('chào sản phẩm') || lowerMsg.includes('vay vốn') || lowerMsg.includes('tuyển dụng') || lowerMsg.includes('tiền điện tử') || lowerMsg.includes('crypto')) {
          if (!userObj.tags.includes('Spam')) {
            userObj.tags.push('Spam');
            dataStore.updateLeadScore(userId, -10, 'Phân loại: Spam quảng cáo');
          }
        }
      }

      const stopTyping = startTypingIndicator(api, userId, ThreadType.User);
      let aiResponse;
      try {
        aiResponse = await aiEngine.generateResponse(userId, userMessage, imageUrl, api, senderName, userId);
      } finally {
        stopTyping();
      }


      // Delay ngẫu nhiên để tự nhiên hơn (không reply ngay lập tức)
      const replyDelay = randomDelay();
      logger.debug(`⏳ Waiting ${Math.round(replyDelay)}ms before replying...`);
      await delay(replyDelay);

      // ── Send Reply ───────────────────────────────────
      // Chia tin nhắn dài thành nhiều phần (Zalo giới hạn ~2000 ký tự)
      const parts = splitMessage(aiResponse, 2000);

      for (const part of parts) {
        try {
          await api.sendMessage(part, userId);
          messageTimestamps.push(Date.now());

          if (parts.length > 1) {
            await delay(500); // Delay giữa các phần
          }
        } catch (sendError) {
          logger.error('❌ Failed to send message', {
            userId,
            error: sendError.message,
          });
        }
      }

      // Log outgoing
      dataStore.logMessage(userId, 'outgoing', aiResponse);

      // Cập nhật hoạt động sau tin nhắn đi của bot
      if (userId !== config.zalo.adminId) {
        updatePendingSummary(userId, api, false).catch(err => logger.error('Error updating pending summary for outgoing message', err));
      }

      logger.info('✅ Reply sent', {
        userId,
        responseLength: aiResponse.length,
        delay: `${Math.round(replyDelay)}ms`,
      });

    } catch (error) {
      logger.error('❌ Error handling message', {
        error: error.message,
        stack: error.stack,
      });
    }
  });

  // ── Auto greeting when a friend is added ────────────────
  api.listener.on('friend_event', async (event) => {
    try {
      logger.info('👤 Friend event received', { type: event.type, threadId: event.threadId });
      
      // Tự động chấp nhận lời mời kết bạn mới
      if (event.type === FriendEventType.REQUEST) {
        const userId = event.data?.fromUid || event.threadId;
        logger.info('👤 Friend request received, auto-accepting...', { userId });
        try {
          await api.acceptFriendRequest(userId);
          logger.info('✅ Friend request accepted successfully', { userId });
        } catch (err) {
          logger.error('❌ Failed to accept friend request', { userId, error: err.message });
        }
      }

      if (event.type === FriendEventType.ADD) {
        const userId = event.threadId;
        logger.info('👤 New friend added, sending auto greeting', { userId });

        const greeting = 
          `Chào anh/chị,\n` +
          `Em là Trợ Lý AI của chị Thùy Dương 🌿 Rất vui được kết nối với anh/chị ạ!\n\n` +
          `Chị Thùy Dương là chuyên gia xây dựng thương hiệu cá nhân bằng phương pháp **Tam Thông Dưỡng Nhan** (thông tắc và điêu khắc cơ mặt thuần tự nhiên bằng dụng cụ sừng hoặc bằng tay để trẻ hóa, nâng cơ và nắn chỉnh gương mặt).\n\n` +
          `Em luôn sẵn sàng đồng hành hỗ trợ anh/chị về:\n` +
          `💆‍♀️ **Phương pháp Tam Thông Dưỡng Nhan & massage tự nhiên** (Nội dung chính)\n\n` +
          `Bên cạnh đó, em cũng hỗ trợ các thông tin bổ trợ như:\n` +
          `💊 Tư vấn Sức khỏe chủ động, Dinh dưỡng Nutrilite (Amway) & Chăm sóc da Artistry\n` +
          `💖 Thấu hiểu nội tâm, giữ gìn hạnh phúc gia đình & nuôi dạy con\n` +
          `🚀 Định hướng phát triển bản thân & xây dựng thương hiệu cá nhân\n\n` +
          `Anh/chị đang quan tâm đến nội dung nào nhất, hãy nhắn cho em biết nhé! 🌸✨`;

        // Delay ngẫu nhiên để tự nhiên hơn (1.5 - 3 giây)
        const replyDelay = 1500 + Math.random() * 1500;
        await delay(replyDelay);

        await api.sendMessage(greeting, userId);
        logger.info('✅ Auto greeting sent to new friend successfully', { userId });

        // Ghi nhận vào DB/Lịch sử trò chuyện và cập nhật step lập tức
        dataStore.upsertUser(userId, null);
        dataStore.logMessage(userId, 'outgoing', greeting);
        dataStore.addToConversation(userId, 'assistant', greeting);
        dataStore.setGreetingStep(userId, 1);
      }
    } catch (err) {
      logger.error('❌ Failed to handle friend_event greeting', { error: err.message });
    }
  });

  // ── Auto greeting when bot is added to a Zalo Group ─────
  api.listener.on('group_event', async (event) => {
    try {
      logger.info('👥 Group event received', { type: event.type, isSelf: event.isSelf, threadId: event.threadId });
      if (event.type === GroupEventType.JOIN && event.isSelf) {
        const groupId = event.threadId;

        // ── Tự động duyệt nhóm mới và gửi lời chào ngay lập tức ──
        let groupName = 'Nhóm mới';
        try {
          const groupInfoRes = await api.getGroupInfo(groupId);
          if (groupInfoRes?.gridInfoMap?.[groupId]?.name) {
            groupName = groupInfoRes.gridInfoMap[groupId].name;
          }
        } catch (err) {
          logger.warn('Failed to fetch group name during group_event', err);
        }

        const defaultPurpose = 'Thực hành phương pháp tam thông dưỡng nhan, chăm sóc làm đẹp tự nhiên và dinh dưỡng sức khỏe.';
        dataStore.approveGroup(groupId, groupName, defaultPurpose);

        logger.info('👥 Bot added to group, auto-approved and sending welcome greeting', { groupId, groupName });
        const greeting = `Chào cả nhà,\nEm là trợ lý của chị Thùy Dương 🌿\nRất vui được đồng hành cùng cả nhà trong nhóm ${groupName} ạ! Chúc cả nhà mình thực hành tam thông dưỡng nhan thật hiệu quả! 🌸💆‍♀️✨`;

        // Delay ngẫu nhiên để tự nhiên hơn (1.5 - 3 giây)
        const replyDelay = 1500 + Math.random() * 1500;
        await delay(replyDelay);

        await api.sendMessage(greeting, groupId, ThreadType.Group);
        logger.info('✅ Group welcome greeting sent successfully', { groupId });

        // Ghi nhận vào DB/Lịch sử trò chuyện và cập nhật step lập tức
        dataStore.upsertUser(groupId, groupName);
        dataStore.logMessage(groupId, 'outgoing', greeting);
        dataStore.addToConversation(groupId, 'assistant', greeting);
        dataStore.setGreetingStep(groupId, 1);
      } else if (event.type === GroupEventType.JOIN && !event.isSelf) {
        const groupId = event.threadId || event.data?.groupId;
        let groupName = event.data?.groupName;
        
        if (!groupName) {
          try {
            const groupInfoRes = await api.getGroupInfo(groupId);
            if (groupInfoRes?.gridInfoMap?.[groupId]?.name) {
              groupName = groupInfoRes.gridInfoMap[groupId].name;
            }
          } catch (err) {
            logger.warn('Failed to fetch group name for new member join', err);
          }
        }

        if (groupName && isTargetGroupForWelcome(groupName)) {
          const updateMembers = event.data?.updateMembers || [];
          const memberNames = updateMembers.map(m => m.dName || 'thành viên mới').join(', ');
          
          logger.info(`👥 New member(s) joined target group "${groupName}": ${memberNames}. Generating welcome message...`);
          
          // Lời chào mặc định
          let welcomeMsg = `Chào mừng anh/chị ${memberNames} đã đến với ngôi nhà "${groupName}"! 🌿🌸\n` +
            `Dương là trợ lý của chị Thùy Dương, rất vui được đồng hành cùng cả nhà mình ạ! Chúc anh/chị có những trải nghiệm tuyệt vời cùng mọi người! 💆‍♀️✨`;
            
          // Thử gọi AI tạo lời chào ấm áp, cá nhân hóa
          try {
            const groupInfo = dataStore.getApprovedGroup(groupId);
            const purpose = groupInfo ? groupInfo.purpose : 'Thực hành chăm sóc sức khỏe, làm đẹp tự nhiên và phát triển bản thân.';
            
            const prompt = `Bạn là Trợ Lý AI của chị Thùy Dương. Có thành viên mới tên là "${memberNames}" vừa tham gia vào nhóm Zalo "${groupName}" với mục đích: "${purpose}".
Hãy viết một tin nhắn chào mừng ngắn gọn (chỉ 2 đến 3 câu ngắn), cực kỳ ấm áp, thân thiện, tràn đầy năng lượng tích cực để chào đón thành viên mới này vào nhóm. 
Yêu cầu:
1. Xưng "Dương" (trợ lý của chị Thùy Dương) và gọi họ là anh/chị/cả nhà. Nghiêm cấm xưng "em".
2. Đính kèm các emoji sinh động phù hợp (🌿🌸💆‍♀️✨).
3. Không ghi tiêu đề hay giải thích gì thêm, chỉ trả về duy nhất nội dung tin nhắn chào mừng.`;

            const aiResponse = await aiEngine.generateResponse(groupId, prompt, null, null, memberNames);
            if (aiResponse && aiResponse.trim().length > 10 && !aiResponse.includes('Xin lỗi anh/chị') && !aiResponse.includes('bận chút')) {
              welcomeMsg = aiResponse.trim();
            }
          } catch (aiErr) {
            logger.warn('Failed to generate personalized welcome message via AI, using fallback template', aiErr);
          }
          
          // Delay ngẫu nhiên 1 - 2.5 giây cho tự nhiên
          const replyDelay = 1000 + Math.random() * 1500;
          await delay(replyDelay);
          
          await api.sendMessage(welcomeMsg, groupId, ThreadType.Group);
          logger.info(`✅ Welcome message sent to group "${groupName}" successfully!`);
          
          dataStore.logMessage(groupId, 'outgoing', welcomeMsg);
          dataStore.addToConversation(groupId, 'assistant', welcomeMsg);
        }
      }
    } catch (err) {
      logger.error('❌ Failed to handle group_event greeting', { error: err.message });
    }
  });

  // ── Listener Event Handlers ────────────────────────────
  api.listener.on('closed', (code, reason) => {
    logger.warn('🔌 Listener connection closed, exiting process to trigger auto-restart...', { code, reason });
    process.exit(1);
  });

  api.listener.on('error', (error) => {
    logger.error('⚠️ Listener encountered an error, exiting process to trigger auto-restart...', { error: error.message || error });
    process.exit(1);
  });

  // ── Start listener ─────────────────────────────────────
  api.listener.start({ retryOnClose: true });

  // ── Daily CEO Briefing (Skill 08) ───────────────────────
  // Chạy lúc 08:00 sáng hàng ngày: '0 8 * * *'
  cron.schedule('0 8 * * *', async () => {
    try {
      logger.info('⏰ Running Daily CEO Briefing job...');
      
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localNow = new Date(now.getTime() - (offset * 60 * 1000));
      const today = localNow.toISOString().split('T')[0];
      
      const yesterday = new Date(now.getTime() - (offset * 60 * 1000) - (24 * 60 * 60 * 1000));
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Lấy danh sách khách hàng tương tác hôm qua
      const yesterdayMessages = dataStore.messages.filter(m => m.timestamp.startsWith(yesterdayStr));
      const yesterdayUserIds = Array.from(new Set(yesterdayMessages.map(m => m.userId)));
      
      const activeUsersYesterday = yesterdayUserIds.filter(userId => {
        if (userId === config.zalo.adminId) return false;
        const isGroup = dataStore.approvedGroups.some(g => (typeof g === 'string' && g === userId) || (g && g.id === userId));
        return !isGroup;
      });

      const chatList = activeUsersYesterday.map(userId => {
        const u = dataStore.users[userId];
        const name = u ? u.displayName : 'Khách hàng ẩn';
        const tags = (u && u.tags && u.tags.length > 0) ? ` (Tags: ${u.tags.join(', ')})` : '';
        return `• ${name}${tags}`;
      }).join('\n') || '• Không có khách hàng tương tác mới.';

      // Lấy danh sách nhắc lịch chăm sóc khách hàng hôm nay (Khách liệu trình)
      const remindersPath = './data/reminders.json';
      let dueReminders = [];
      if (existsSync(remindersPath)) {
        try {
          const reminders = JSON.parse(readFileSync(remindersPath, 'utf-8'));
          dueReminders = reminders.filter(r => r.status === 'pending' && r.targetDate <= today);
        } catch (e) {
          logger.error('Failed to parse reminders.json in CEO Briefing', e);
        }
      }

      const remindersList = dueReminders.map(r => `• **${r.userName}**: ${r.reason}`).join('\n') || '• Không có lịch nhắc khách hôm nay.';

      const reportMsg = 
        `📊 BÁO CÁO CEO MỖI SÁNG 📊\n` +
        `📅 Ngày báo cáo: ${today}\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `💬 Khách hàng đã tương tác hôm qua (${yesterdayStr}):\n` +
        `${chatList}\n\n` +
        `⏰ Lịch nhắc chăm sóc khách hàng hôm nay:\n` +
        `${remindersList}\n\n` +
        `🚀 Hệ thống hoạt động bình thường! Chúc chị Thùy Dương một ngày tuyệt vời!`;

      if (config.zalo.adminId) {
        await api.sendMessage(reportMsg, config.zalo.adminId);
        logger.info('📤 Daily CEO Briefing sent successfully to Zalo Admin');
      } else {
        logger.warn('⚠️ No adminId configured, skipping Daily CEO Briefing');
      }
    } catch (err) {
      logger.error('❌ Failed to run Daily CEO Briefing', { error: err.message });
    }
  });

  // ── Daily Zoom Practice Link Broadcast ─────────────────
  // Chạy lúc 20:55 hàng ngày: '55 20 * * *'
  cron.schedule('55 20 * * *', async () => {
    try {
      const groups = dataStore.getApprovedGroups();
      if (groups.length === 0) {
        logger.info('⏰ Zoom broadcast: No approved groups to send Zoom link.');
        return;
      }

      logger.info(`⏰ Starting Zoom link broadcast...`);
      
      const zoomMessage = 
        `🌸 Cả nhà mình ơi! Chỉ còn 5 phút nữa (lúc 9h tối) là đến giờ thực hành Tam thông dưỡng nhan qua Zoom rồi ạ.\n\n` +
        `Cả nhà cùng chuẩn bị dụng cụ sừng hoặc dầu dưỡng, thả lỏng cơ thể và vào phòng Zoom đồng hành cùng chị Thùy Dương nhé! 🌿💆‍♀️✨\n\n` +
        `🎬 Link tham gia Zoom: https://us06web.zoom.us/j/7778888699\n` +
        `🔹 ID cuộc họp: 777 888 8699\n` +
        `🔹 Mật mã: 88\n\n` +
        `Hẹn gặp cả nhà mình trong phòng Zoom lúc 9h tối nay nhé! 💖🌸`;

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        
        // Chỉ gửi đến 3 nhóm cụ thể theo yêu cầu của chị Dương:
        // 1. Khỏe và đẹp tỉnh thức (ID: 4603724706821695811)
        // 2. Thực hành tam thông dưỡng nhan (ID: 5046923348046707114)
        // 3. Cộng đồng nâng tầm sắc đẹp phụ nữ Việt Nam (ID: 2757351269333325796)
        const groupNameLower = (group.name || '').toLowerCase();
        const isTargetGroup = 
          group.id === '5046923348046707114' ||
          group.id === '4603724706821695811' ||
          group.id === '2757351269333325796' ||
          groupNameLower.includes('khỏe và đẹp tỉnh thức') ||
          groupNameLower.includes('khoe va dep tinh thuc') ||
          groupNameLower.includes('thực hành tam thông dưỡng nhan') ||
          groupNameLower.includes('thuc hanh tam thong duong nhan') ||
          groupNameLower.includes('cộng đồng nâng tầm sắc đẹp phụ nữ việt nam') ||
          groupNameLower.includes('cong dong nang tam sac dep phu nu viet nam');

        if (!isTargetGroup) {
          logger.info(`⏰ Zoom broadcast: Bỏ qua nhóm "${group.name}" (${group.id}) không thuộc danh sách nhận Zoom.`);
          continue;
        }

        try {
          await api.sendMessage(zoomMessage, group.id, ThreadType.Group);
          logger.info(`✅ Broadcasted Zoom link to group "${group.name}" (${group.id})`);
          dataStore.logMessage(group.id, 'outgoing', zoomMessage);

          // Tránh gửi dồn dập cùng lúc, delay 2-4 giây giữa các nhóm
          if (i < groups.length - 1) {
            const delayTime = 2000 + Math.random() * 2000;
            await delay(delayTime);
          }
        } catch (groupError) {
          logger.error(`❌ Failed to send Zoom link to group ${group.id}`, { error: groupError.message });
        }
      }
    } catch (err) {
      logger.error('❌ Failed to run Zoom link broadcast schedule', { error: err.message });
    }
  });

  // ── Daily Noon Zoom Practice Link Broadcast ─────────────
  // Chạy lúc 11:25 trưa vào thứ 2, 4, 6: '25 11 * * 1,3,5'
  cron.schedule('25 11 * * 1,3,5', async () => {
    try {
      const groups = dataStore.getApprovedGroups();
      if (groups.length === 0) {
        logger.info('⏰ Zoom noon broadcast: No approved groups to send Zoom link.');
        return;
      }

      logger.info(`⏰ Starting Noon Zoom link broadcast...`);
      
      const zoomMessage = 
        `🌸 Cả nhà mình ơi! Chỉ còn ít phút nữa (lúc 11h30 trưa) là đến giờ thực hành Tam thông dưỡng nhan qua Zoom rồi ạ.\n\n` +
        `Cả nhà cùng chuẩn bị dụng cụ sừng hoặc dầu dưỡng, tranh thủ giờ nghỉ trưa để cùng đả thông cơ mặt và cổ vai gáy đồng hành cùng chị Thùy Dương nhé! 🌿💆‍♀️✨\n\n` +
        `🎬 Link tham gia Zoom: https://us06web.zoom.us/j/7778888699\n` +
        `🔹 ID cuộc họp: 777 888 8699\n` +
        `🔹 Mật mã: 88\n\n` +
        `Hẹn gặp cả nhà mình trong phòng Zoom trưa nay nhé! 💖🌸`;

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        
        // Loại trừ các nhóm theo yêu cầu: vui chơi đà lạt, làm chủ AI, đồng hành hôm nay, Thiền Tông
        const groupNameLower = (group.name || '').toLowerCase();
        const isExcludedGroup = 
          group.id === '2322904723701475740' || // Vui Chơi Đà lạt - nha trang
          group.id === '5984264378532620972' || // Làm Chủ AI- Nâng Tầm Phiên Bản
          group.id === '1540827798594831042' || // Đồng Hành Hôm Nay - Vươn Xa Ngày Mai
          group.id === '1056022212136573959' || // Nhóm Thiền Tông
          group.id === '1752645408761511922' || // Gia Đình Yêu Thương
          groupNameLower.includes('vui chơi đà lạt') ||
          groupNameLower.includes('vui choi da lat') ||
          groupNameLower.includes('làm chủ ai') ||
          groupNameLower.includes('lam chu ai') ||
          groupNameLower.includes('đồng hành hôm nay') ||
          groupNameLower.includes('dong hanh hom nay') ||
          groupNameLower.includes('an toàn cùng nhau về quê') ||
          groupNameLower.includes('an toan cung nhau ve que') ||
          groupNameLower.includes('an toàn cùng nhau') ||
          groupNameLower.includes('an toan cung nhau') ||
          groupNameLower.includes('gia đình yêu thương') ||
          groupNameLower.includes('gia dinh yeu thuong');

        if (isExcludedGroup) {
          logger.info(`⏰ Zoom noon broadcast: Bỏ qua nhóm "${group.name}" (${group.id}) theo danh sách loại trừ.`);
          continue;
        }

        try {
          await api.sendMessage(zoomMessage, group.id, ThreadType.Group);
          logger.info(`✅ Broadcasted Noon Zoom link to group "${group.name}" (${group.id})`);
          dataStore.logMessage(group.id, 'outgoing', zoomMessage);

          // Delay 2-4 giây giữa các nhóm
          if (i < groups.length - 1) {
            const delayTime = 2000 + Math.random() * 2000;
            await delay(delayTime);
          }
        } catch (groupError) {
          logger.error(`❌ Failed to send Noon Zoom link to group ${group.id}`, { error: groupError.message });
        }
      }
    } catch (err) {
      logger.error('❌ Failed to run Noon Zoom link broadcast schedule', { error: err.message });
    }
  });

  // ── Daily Early Morning Thien Tong Zoom Link (Nhóm An Toàn Cùng Nhau Về Quê) ──
  // Chạy lúc 4:55 sáng hàng ngày: '55 4 * * *'
  // Nhóm này chuyên về Thiền Tông – chỉ gửi link Zoom, không nói chuyện thêm
  cron.schedule('55 4 * * *', async () => {
    try {
      const groups = dataStore.getApprovedGroups();
      if (groups.length === 0) {
        logger.info('⏰ Thien Tong Zoom broadcast: No approved groups found.');
        return;
      }

      logger.info(`⏰ Starting Thien Tong early morning Zoom link broadcast...`);

      // Tin nhắn gửi link Zoom đọc sách sáng kèm lời mời lịch sự, ấm áp
      const thienTongZoomMessage =
        `🌸 Em mời cả nhà mình cùng vào phòng Zoom đọc sách sáng nay ạ:\n` +
        `https://us06web.zoom.us/j/7778888699\n` +
        `Passcode: 88`;

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];

        // Chỉ gửi đến nhóm "An Toàn Cùng Nhau Về Quê" (ID: 1056022212136573959)
        const groupNameLower = (group.name || '').toLowerCase();
        const isThienTongGroup =
          group.id === '1056022212136573959' || // An Toàn Cùng Nhau Về Quê
          groupNameLower.includes('an toàn cùng nhau về quê') ||
          groupNameLower.includes('an toan cung nhau ve que') ||
          groupNameLower.includes('an toàn cùng nhau') ||
          groupNameLower.includes('an toan cung nhau');

        if (!isThienTongGroup) {
          logger.info(`⏰ Thien Tong Zoom: Bỏ qua nhóm "${group.name}" (${group.id}) không phải nhóm Thiền Tông.`);
          continue;
        }

        try {
          await api.sendMessage(thienTongZoomMessage, group.id, ThreadType.Group);
          logger.info(`✅ Sent Thien Tong morning Zoom link to group "${group.name}" (${group.id})`);
          dataStore.logMessage(group.id, 'outgoing', thienTongZoomMessage);

          if (i < groups.length - 1) {
            const delayTime = 2000 + Math.random() * 2000;
            await delay(delayTime);
          }
        } catch (groupError) {
          logger.error(`❌ Failed to send Thien Tong Zoom link to group ${group.id}`, { error: groupError.message });
        }
      }
    } catch (err) {
      logger.error('❌ Failed to run Thien Tong morning Zoom broadcast', { error: err.message });
    }
  });

  // ── Daily 12:00 PM Relaxation Reminder for Chị Tuyết ─────
  // Chạy lúc 12:00 trưa hàng ngày: '0 12 * * *'
  cron.schedule('0 12 * * *', async () => {
    try {
      logger.info('⏰ Starting daily 12:00 PM relaxation reminder for Chị Tuyết...');
      const tuyetUserId = '5428890398497221111';
      const relaxationMsg = 
        `🌸 Lời nhắc yêu thương buổi trưa dành cho chị Tuyết 🌸\n\n` +
        `Chị Tuyết ơi, trưa rồi chị nhớ dành ít phút nghỉ ngơi và thả lỏng nhé:\n` +
        `✨ Thả lỏng cơ mặt (tách nhẹ hai hàm răng, thả rơi hàm dưới, giữ nụ cười hàm tiếu)\n` +
        `✨ Thả lỏng cơ thể (thả rơi hai vai, hít sâu thở nhẹ)\n` +
        `✨ Thả lỏng tâm trí (để mọi lo toan lại đằng sau, đón nhận sự bình an)\n\n` +
        `Chúc chị Tuyết có một buổi trưa thật an yên và tràn đầy năng lượng! 💖🌿`;

      await api.sendMessage(relaxationMsg, tuyetUserId, ThreadType.User);
      logger.info(`✅ Sent daily 12:00 PM relaxation reminder to Chị Tuyết (${tuyetUserId})`);
      dataStore.logMessage(tuyetUserId, 'outgoing', relaxationMsg);
    } catch (err) {
      logger.error('❌ Failed to send daily relaxation reminder to Chị Tuyết', { error: err.message });
    }
  });

  // Hàm phụ trợ để chọn ảnh nền dựa trên nội dung bài đăng AI
  function getNurturingBgImage(postText) {
    const text = (postText || '').toLowerCase();
    
    if (text.includes('trán') || text.includes('frontalis')) {
      return './data/daily_posts/01_co_tran.png';
    }
    if (text.includes('má') || text.includes('rãnh cười') || text.includes('zygomaticus')) {
      return './data/daily_posts/02_co_ma.png';
    }
    if (text.includes('nhai') || text.includes('quai hàm') || text.includes('khớp cắn') || text.includes('masseter')) {
      return './data/daily_posts/03_co_nhai.png';
    }
    if (text.includes('nọng cằm') || text.includes('dưới cằm') || text.includes('platysma')) {
      return './data/daily_posts/05_nong_cam.png';
    }
    if (text.includes('vai gáy') || text.includes('cổ vai') || text.includes('bả vai') || text.includes('shoulder')) {
      return './data/daily_posts/06_vai_gay.png';
    }
    if (text.includes('mắt') || text.includes('quầng mắt') || text.includes('orbicularis oculi') || text.includes('chân chim')) {
      return './data/daily_posts/mfr_6_eye.png';
    }
    if (text.includes('vỗ mặt') || text.includes('vỗ nhẹ') || text.includes('tapotement')) {
      return './data/daily_posts/00_vo_mat.png';
    }
    if (text.includes('môi') || text.includes('khóe miệng') || text.includes('orbicularis oris')) {
      return './data/daily_posts/mfr_12_orbicularis_oris.png';
    }
    if (text.includes('thả lỏng cơ mặt') || text.includes('thả lỏng mặt')) {
      return './data/daily_posts/huong_dan_tha_long_co_mat.jpg';
    }
    
    // Nếu không khớp từ khóa nào, chọn xoay tua các ảnh phong cách sống để tạo sự đa dạng
    const fallbackImages = [
      './data/daily_posts/01_tea_detox.png',
      './data/daily_posts/02_chin_massage.png',
      './data/daily_posts/03_forehead_relaxation.png',
      './data/daily_posts/04_self_love.png',
      './data/daily_posts/huong_dan_tha_long_co_mat.jpg'
    ];
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return fallbackImages[dayOfYear % fallbackImages.length];
  }

  // ── Daily Group Nurturing (Skill 04) ────────────────────
  async function runGroupNurturing(timeOfDay) {
    try {
      const groups = dataStore.getApprovedGroups();
      if (groups.length === 0) {
        logger.info('⏰ No approved groups to send nurturing posts.');
        return;
      }

      logger.info(`⏰ Starting group nurturing posts for ${timeOfDay} to ${groups.length} groups...`);
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        let tempImagePath = null;
        try {
          let groupName = group.name;
          try {
            const groupInfoRes = await api.getGroupInfo(group.id);
            if (groupInfoRes?.gridInfoMap?.[group.id]?.name) {
              groupName = groupInfoRes.gridInfoMap[group.id].name;
              dataStore.approveGroup(group.id, groupName, group.purpose);
            }
          } catch (err) {
            logger.warn('Failed to fetch group info from API during nurturing schedule, using local storage name', { groupId: group.id, error: err.message });
          }

          // Bỏ qua các nhóm không thuộc diện chăm sóc tự động (Thiền Tông, vui chơi đà lạt...)
          const nameLower = (groupName || '').toLowerCase();
          const isExcludedNurturing =
            group.id === '2322904723701475740' ||
            group.id === '1056022212136573959' || // Nhóm Thiền Tông
            group.id === '1752645408761511922' || // Gia Đình Yêu Thương
            nameLower.includes('vui chơi đà lạt') ||
            nameLower.includes('vui choi da lat') ||
            nameLower.includes('an toàn cùng nhau về quê') ||
            nameLower.includes('an toan cung nhau ve que') ||
            nameLower.includes('an toàn cùng nhau') ||
            nameLower.includes('an toan cung nhau') ||
            nameLower.includes('gia đình yêu thương') ||
            nameLower.includes('gia dinh yeu thuong');

          if (isExcludedNurturing) {
            logger.info(`⏰ Group Nurturing: Bỏ qua nhóm "${groupName}" (${group.id}) theo yêu cầu loại trừ.`);
            continue;
          }

          // Bỏ qua nhóm Tinh Hoa Nhân Hiệu và nhóm AI Money theo yêu cầu (không gửi 3 thông điệp mỗi ngày)
          if (groupName && (
            groupName.toLowerCase().includes('tinh hoa nhân hiệu') || 
            groupName.toLowerCase().includes('tinh hoa nhan hieu') ||
            groupName.toLowerCase().includes('ai money')
          )) {
            logger.info(`⏰ Group Nurturing: Bỏ qua nhóm "${groupName}" (${group.id}) theo yêu cầu.`);
            continue;
          }

          // Sinh bài đăng AI chứa { post, quote }
          const nurturingData = await aiEngine.generateGroupNurturingPost(groupName, group.purpose, timeOfDay);
          
          // Lấy ảnh nền khớp từ khóa thông minh
          const chosenBgImage = getNurturingBgImage(nurturingData.post);

          // Tạo Quote/Tip card tương ứng với ảnh nền
          tempImagePath = await createCard(nurturingData.quote, timeOfDay, group.id, chosenBgImage);

          // Đọc file ảnh vừa tạo để chuyển sang Buffer gửi kèm metadata nhằm tránh lỗi imageMetadataGetter của zca-js
          const imageBuffer = readFileSync(tempImagePath);
          const stats = statSync(tempImagePath);
          const attachment = {
            data: imageBuffer,
            filename: `nurturing_${group.id}.png`,
            metadata: {
              totalSize: stats.size,
              width: 800,
              height: 800
            }
          };

          // Gửi tin nhắn kèm ảnh lên Zalo nhóm
          const msgObject = {
            msg: nurturingData.post,
            attachments: [attachment]
          };

          await api.sendMessage(msgObject, group.id, ThreadType.Group);
          logger.info(`✅ Sent nurturing post and image card to group "${groupName}" (${group.id}) successfully`, { timeOfDay });
          
          dataStore.logMessage(group.id, 'outgoing', nurturingData.post);

          // Dọn dẹp ảnh tạm thời
          if (tempImagePath && existsSync(tempImagePath)) {
            unlinkSync(tempImagePath);
            logger.debug(`Cleaned up temp image: ${tempImagePath}`);
          }

          // Tránh delay cho nhóm cuối cùng
          if (i < groups.length - 1) {
            const isTesting = process.env.NODE_ENV === 'test';
            const delayBetweenGroups = isTesting 
              ? (2000 + Math.random() * 2000) 
              : (180000 + Math.random() * 120000); // 3 - 5 phút (180s - 300s)
            
            logger.info(`⏳ Waiting ${Math.round(delayBetweenGroups / 1000)}s before posting to the next group...`);
            await delay(delayBetweenGroups);
          }
        } catch (groupError) {
          logger.error(`❌ Failed to send nurturing post to group ${group.id}`, { error: groupError.message });
          // Đảm bảo dọn dẹp ảnh tạm thời nếu gặp lỗi giữa chừng
          try {
            if (tempImagePath && existsSync(tempImagePath)) {
              unlinkSync(tempImagePath);
            }
          } catch (cleanupErr) {
            logger.warn(`Failed to clean up temp image in catch block`, cleanupErr);
          }
        }
      }
    } catch (err) {
      logger.error('❌ Failed to run group nurturing scheduler', { error: err.message });
    }
  }

  // Chạy duy nhất 1 lần/ngày lúc 08:00 sáng hàng ngày (Chị Dương yêu cầu giảm tần suất để tránh làm phiền)
  cron.schedule('0 8 * * *', () => runGroupNurturing('Buổi sáng (8:00)'));

  // ── CRM Customer Care Reminders (Nhắc lịch chăm sóc hàng ngày) ───────
  cron.schedule('30 8 * * *', async () => {
    try {
      logger.info('⏰ Running CRM customer care reminders check...');
      const remindersPath = './data/reminders.json';
      if (!existsSync(remindersPath)) return;

      let reminders = [];
      try {
        reminders = JSON.parse(readFileSync(remindersPath, 'utf-8'));
      } catch (e) {
        logger.error('Failed to parse reminders.json in cron job', e);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const dueReminders = reminders.filter(r => r.status === 'pending' && r.targetDate <= today);

      if (dueReminders.length === 0) {
        logger.info('⏰ CRM check: No pending reminders for today.');
        return;
      }

      logger.info(`⏰ CRM check: Found ${dueReminders.length} pending reminders due today!`);

      for (const reminder of dueReminders) {
        try {
          const prompt = `Bạn là Trợ Lý AI của chị Châu Thị Thùy Dương. Hãy soạn thảo một tin nhắn hỏi thăm chăm sóc khách hàng cực kỳ ấm áp, tinh tế và thân thiện.
Khách hàng tên là: "${reminder.userName}"
Lý do cần hỏi thăm chăm sóc: "${reminder.reason}"

Yêu cầu tin nhắn:
1. Xưng "Dương" (trợ lý của chị Thùy Dương), gọi khách hàng là anh/chị/tên riêng.
2. Giọng điệu ân cần, quan tâm, đậm chất chăm sóc Wellness tự nhiên.
3. Nội dung ngắn gọn khoảng 3-4 câu, đi thẳng vào mục đích hỏi thăm tình trạng và mời họ chia sẻ phản hồi.
4. Đính kèm các emoji thích hợp (🌸🌿💆‍♀️✨).
5. Chỉ trả về nội dung tin nhắn mẫu, không thêm bất cứ tiêu đề hay lời dẫn giải nào khác.`;

          const sampleMessage = await aiEngine.generateResponse(reminder.userId, prompt);
          
          if (config.zalo.adminId) {
            const reminderAlert = 
              `⏰ **[NHẮC LỊCH CHĂM SÓC KHÁCH HÀNG]**\n` +
              `━━━━━━━━━━━━━━━━━━━\n` +
              `👤 Khách hàng: **${reminder.userName}**\n` +
              `🆔 Zalo ID: \`${reminder.userId}\`\n` +
              `🎯 Lý do nhắc: ${reminder.reason}\n\n` +
              `💬 **Mẫu tin nhắn hỏi thăm gợi ý (chị chỉ cần copy gửi khách):**\n` +
              `---------------------------\n` +
              `"${sampleMessage.trim()}"\n` +
              `---------------------------\n\n` +
              `👉 Chị Dương vui lòng nhắn tin hỏi thăm khách hàng nhé!`;

            await api.sendMessage(reminderAlert, config.zalo.adminId);
            logger.info(`📤 CRM reminder notification sent to Zalo Admin for user ${reminder.userName}`);
          }

          reminder.status = 'sent';
          reminder.sentDate = today;
        } catch (reminderErr) {
          logger.error(`❌ Failed to send CRM reminder for user ${reminder.userName}`, reminderErr);
        }
      }

      writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
    } catch (err) {
      logger.error('❌ Failed in CRM reminders cron execution', err);
    }
  });

  // ── Weekly Sunday CEO Briefing (Báo cáo CEO tổng hợp tuần qua Zalo) ─────
  cron.schedule('0 21 * * 0', async () => {
    try {
      logger.info('⏰ Running Weekly Sunday CEO Briefing...');
      const stats = dataStore.getDailyStats();

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const weeklyLeads = Object.values(dataStore.users).filter(u => {
        return u.lastContact >= sevenDaysAgoStr && u.leadScore > 0;
      });

      const topLeads = weeklyLeads
        .sort((a, b) => b.leadScore - a.leadScore)
        .slice(0, 5);

      const leadsList = topLeads.map((l, idx) => 
        `${idx + 1}. **${l.displayName || 'Ẩn danh'}** (Điểm tiềm năng: ${l.leadScore}, Gắn thẻ: ${l.tags.join(', ') || 'Chưa gắn'})\n` +
        `   - Tương tác cuối: ${l.lastContact}`
      ).join('\n') || '• Không có khách hàng mới nổi bật trong tuần.';

      const weeklyReportMsg = 
        `📊 **BÁO CÁO CEO TỔNG HỢP HÀNG TUẦN** 📊\n` +
        `📅 Tuần lễ kết thúc vào: ${new Date().toLocaleDateString('vi-VN')}\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `👥 **Tương tác tích lũy toàn thời gian:**\n` +
        `• Tổng số khách hàng đã lưu: ${stats.totalUsersAllTime} người\n` +
        `• Tổng số tin nhắn đã xử lý: ${stats.totalMessagesAllTime} tin\n\n` +
        `🎯 **TOP 5 KHÁCH HÀNG TIỀM NĂNG TRONG TUẦN:**\n` +
        `${leadsList}\n\n` +
        `🚀 Hệ thống chatbot và landing page hoạt động ổn định!\n` +
        `Chúc chị Thùy Dương có một tuần mới nhiều năng lượng và bùng nổ đơn hàng! 🌿💆‍♀️✨`;

      if (config.zalo.adminId) {
        await api.sendMessage(weeklyReportMsg, config.zalo.adminId);
        logger.info('📤 Weekly Sunday CEO Briefing sent successfully to Zalo Admin');
      }
    } catch (err) {
      logger.error('❌ Failed to run Weekly Sunday CEO Briefing', err);
    }
  });

  // Helper for generating daily post draft manually or automatically
  async function generateDailyPostDraft(targetId) {
    logger.info('⏰ Running Facebook Post Generator for: ' + targetId);
    
    let chosenImage = {
      day: new Date().toLocaleDateString('vi-VN', { weekday: 'long' }),
      topic: "Kỹ thuật vỗ nhẹ bằng các đầu ngón tay trên toàn bộ khuôn mặt theo hướng từ dưới lên trên, từ trong ra ngoài, giúp đánh thức các mao mạch, tăng sinh collagen tự nhiên và làm săn chắc cơ mặt toàn diện.",
      title: "VỖ NHẸ ĐẢ THÔNG TOÀN MẶT",
      fileName: "00_vo_mat.png"
    };

    let pinData = null;
    try {
      const pinsPath = path.join(process.cwd(), 'Thuvien_5000_Pinterest_Pins.json');
      if (existsSync(pinsPath)) {
        const pins = JSON.parse(readFileSync(pinsPath, 'utf-8'));
        if (Array.isArray(pins) && pins.length > 0) {
          // Lấy Pin duy nhất cho mỗi ngày dựa trên ngày trong năm (dayOfYear % pins.length)
          const now = new Date();
          const start = new Date(now.getFullYear(), 0, 0);
          const diff = now - start;
          const oneDay = 1000 * 60 * 60 * 24;
          const dayOfYear = Math.floor(diff / oneDay);

          const pinIndex = dayOfYear % pins.length;
          pinData = pins[pinIndex];
          
          logger.info(`📚 Picked Pin ID: ${pinData.id} for daily post draft (Index: ${pinIndex})`);
          
          chosenImage.title = pinData.title || pinData.imageText || "TAM THÔNG DƯỠNG NHAN";
          chosenImage.topic = `Danh mục: ${pinData.category || 'Dưỡng sinh'} - Chủ đề: ${pinData.subject || 'Làm đẹp'} - Tiêu đề Pin: ${pinData.title}\nÝ tưởng: ${pinData.facebook || pinData.description}`;
          
          // Xác định ảnh nền phù hợp cho từng chủ đề
          const textToSearch = `${pinData.category} ${pinData.subject} ${pinData.title} ${pinData.description}`.toLowerCase();
          if (textToSearch.includes('trán') || textToSearch.includes('forehead')) {
            chosenImage.fileName = '01_co_tran.png';
          } else if (textToSearch.includes('má') || textToSearch.includes('rãnh cười') || textToSearch.includes('cheek') || textToSearch.includes('cười')) {
            chosenImage.fileName = '02_co_ma.png';
          } else if (textToSearch.includes('nhai') || textToSearch.includes('cắn') || textToSearch.includes('hàm') || textToSearch.includes('jaw') || textToSearch.includes('masseter')) {
            chosenImage.fileName = '03_co_nhai.png';
          } else if (textToSearch.includes('mắt') || textToSearch.includes('bọng') || textToSearch.includes('eye')) {
            chosenImage.fileName = '04_co_mat.png';
          } else if (textToSearch.includes('cằm') || textToSearch.includes('nọng') || textToSearch.includes('chin')) {
            chosenImage.fileName = '05_nong_cam.png';
          } else if (textToSearch.includes('vai gáy') || textToSearch.includes('cổ') || textToSearch.includes('neck') || textToSearch.includes('shoulder')) {
            chosenImage.fileName = '06_vai_gay.png';
          } else {
            chosenImage.fileName = '00_vo_mat.png';
          }
        }
      }
    } catch (err) {
      logger.error('⚠️ Failed to load Pin from Thuvien_5000_Pinterest_Pins.json, fallback to static massaging list', err);
    }

    const prompt = `Bạn là Trợ lý AI đắc lực của chị Châu Thị Thùy Dương. Hãy soạn thảo một bài viết chia sẻ giá trị thực tế trên trang cá nhân Facebook (được viết theo đúng phong cách quy chuẩn của chị) dựa trên chủ đề kiến thức đính kèm.
Chủ đề bài đăng hôm nay (${chosenImage.day}): "${chosenImage.topic}"

BẮT BUỘC TUÂN THỦ QUY TẮC VIẾT SAU:
1. Câu Hook mở đầu (Quan trọng nhất): Phải dưới 15 từ, là một nghịch lý chấn động nhẹ hoặc một chiêm nghiệm sâu sắc đánh trúng tâm lý độc giả khiến họ "wow" và không thể lướt qua. Không dùng câu hỏi tu từ sáo rỗng hay lời chào mừng quen thuộc.
2. Thân bài: Chỉ chia sẻ DUY NHẤT một động tác thực hành cụ thể hoặc một kiến thức giải pháp cốt lõi được nhắc tới trong chủ đề hôm nay. Hãy kết nối trực tiếp giữa tâm lý/nội tâm và phản ứng vật lý trên cơ thể (Ví dụ: khi gồng gánh áp lực thì cơ vai gáy co cứng, khớp cắn nghiến chặt, trán nhăn). Viết dạng các đoạn văn mượt mà giàu chất thơ, tính trải nghiệm và hướng dẫn cụ thể với hiệu quả cảm nhận được tức thì để người đọc muốn lưu lại và làm theo ngay. Không viết gạch đầu dòng khô khan hay quảng cáo lộ liễu.
3. Lời nhắc thả lỏng cơ mặt ở cuối: Nhấn mạnh việc thả lỏng cơ mặt là điều cốt lõi, là cách trẻ hóa tự nhiên nhanh nhất. Hướng dẫn nhanh cách thả lỏng (Nhắm nhẹ mắt, tách nhẹ hai hàm răng để giải phóng khớp cắn, thả rơi hàm dưới, cảm nhận cơ trán giãn mềm và nở một nụ cười hàm tiếu...).
4. Quảng bá khóa học: Khéo léo nhắc nhở về khóa học sắc đẹp "Tam Thông Dưỡng Nhan" hoặc phong cách sống của chị Dương để thu hút sự tò mò của học viên đăng ký.
5. Giọng văn: Trưởng thành, tự tin, bình an, giống như một người cố vấn tâm hồn sâu sắc (CEO ngành Wellness). Hạn chế tối đa dùng emoji (chỉ dùng 1-2 cái tinh tế).
6. CHỈ trả về nội dung bài viết hoàn chỉnh, không thêm tiêu đề hay lời dẫn giải nào khác.`;

    const postContent = await aiEngine.generateResponse(targetId, prompt);

    // Send the post content text message first
    await api.sendMessage({
      msg: `✨ **[GỢI Ý BÀI ĐĂNG FACEBOOK HÀNG NGÀY]** ✨\n\n${postContent.trim()}`
    }, targetId);
    
    await delay(1000);

    // Trích xuất câu Hook đầu tiên của bài viết để chèn lên ảnh
    const postLines = postContent.split('\n').map(l => l.trim()).filter(Boolean);
    const rawHook = postLines[0] || 'Thả lỏng để trẻ hóa tự nhiên';
    const cleanHook = rawHook.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '').trim();

    logger.info('🎨 Generating dynamic quote cards with hook: ' + cleanHook);

    try {
      // Đường dẫn ảnh minh họa tương ứng của động tác làm nền
      const bgImagePath = path.join(process.cwd(), 'data', 'daily_posts', chosenImage.fileName);

      // 1. Tạo Lựa chọn 1: Ảnh Quote Card dùng ảnh minh họa động tác tương ứng làm nền
      const cardPath1 = await createCard(cleanHook, 'sáng', targetId, bgImagePath, chosenImage.title);
      
      // 2. Tạo Lựa chọn 2: Ảnh Quote Card dùng nền gradient nghệ thuật theo buổi
      const cardPath2 = await createCard(cleanHook, 'sáng', targetId, null, chosenImage.title);

      // Gửi Lựa chọn 1
      if (existsSync(cardPath1)) {
        const imgBuffer = readFileSync(cardPath1);
        const stats = statSync(cardPath1);
        await api.sendMessage({
          msg: `🖼️ **[LỰA CHỌN 1]** - Ảnh Quote thiết kế riêng (Nền minh họa động tác tương ứng)`,
          attachments: [{
            data: imgBuffer,
            filename: 'Lua_chon_1_Minh_hoa.png',
            metadata: { totalSize: stats.size, width: 800, height: 800 }
          }]
        }, targetId);
        await delay(1500);
        unlinkSync(cardPath1); // Xóa file tạm
      }

      // Gửi Lựa chọn 2
      if (existsSync(cardPath2)) {
        const imgBuffer = readFileSync(cardPath2);
        const stats = statSync(cardPath2);
        await api.sendMessage({
          msg: `🎨 **[LỰA CHỌN 2]** - Ảnh Quote thiết kế riêng (Nền Gradient nghệ thuật)`,
          attachments: [{
            data: imgBuffer,
            filename: 'Lua_chon_2_Gradient.png',
            metadata: { totalSize: stats.size, width: 800, height: 800 }
          }]
        }, targetId);
        await delay(1500);
        unlinkSync(cardPath2); // Xóa file tạm
      }

      logger.info('📤 Dynamic quote cards generated and sent to Zalo Admin successfully');
    } catch (cardErr) {
      logger.error('❌ Failed to generate dynamic quote cards', cardErr);
      await api.sendMessage({
        msg: `⚠️ Không thể sinh ảnh Quote Card động do lỗi hệ thống. Chị vui lòng dùng ảnh có sẵn trong máy nhé ạ!`
      }, targetId);
    }
  }

  // ── Daily 11:00 AM Facebook Post Draft Notification (Chị Dương đặt hàng) ──
  cron.schedule('0 11 * * *', async () => {
    try {
      logger.info('⏰ Running Daily 11:00 AM Facebook Post Generator...');
      
      if (!config.zalo.adminId) {
        logger.warn('⏰ Admin Zalo ID is not configured, skipping 11:00 AM Facebook post generation.');
        return;
      }

      await generateDailyPostDraft(config.zalo.adminId);
      logger.info('📤 Daily 11:00 AM Facebook post and 3 image options sent to Zalo Admin successfully');
    } catch (err) {
      logger.error('❌ Failed to run Daily 11:00 AM Facebook Post Generator', err);
    }
  });

  // ── Daily 8:00 AM Auto-Update Amway Promotions ──
  cron.schedule('0 8 * * *', async () => {
    try {
      await runAutoUpdate();
    } catch (err) {
      logger.error('❌ Failed to run auto promotion update cron', err);
    }
  });

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       🎉 BOT IS RUNNING!                                 ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  AI Provider:  ${config.ai.provider.padEnd(39)}║`);
  console.log(`║  Rate Limit:   ${config.rateLimit.maxMessagesPerMinute} msg/min                             ║`);
  console.log(`║  Reply Delay:  ${config.rateLimit.minDelay}-${config.rateLimit.maxDelay}ms                            ║`);
  console.log('║                                                          ║');
  console.log('║  Commands: #menu #san_pham #tu_van #faq                   ║');
  console.log('║  Press Ctrl+C to stop                                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── Periodic Stats Log ─────────────────────────────────
  setInterval(() => {
    const stats = dataStore.getDailyStats();
    logger.info('📊 Stats', stats);
  }, 3600000); // Mỗi 1 giờ

  // ── Periodic Summary Check (Tổng hợp cuộc hội thoại sau 15 phút idle) ─────
  setInterval(async () => {
    const now = Date.now();
    const idleTimeout = 15 * 60 * 1000; // 15 phút không hoạt động
    
    for (const [userId, info] of pendingSummaries.entries()) {
      if (info.needsSummary && (now - info.lastActivity >= idleTimeout)) {
        // Đánh dấu là đã xử lý
        info.needsSummary = false;

        // Chỉ tạo báo cáo khi có ít nhất 1 tin nhắn mới từ khách hàng gửi đến trong phiên này
        if (!info.incomingCount || info.incomingCount === 0) {
          logger.info('⏰ Conversation idle but no new incoming messages from user. Skipping summary.', { userId, displayName: info.displayName });
          continue;
        }

        logger.info('⏰ Conversation idle for user, generating summary...', { userId, displayName: info.displayName, incomingCount: info.incomingCount });

        // Reset đếm số tin nhắn mới
        info.incomingCount = 0;

        try {
          const history = dataStore.getConversationHistory(userId);
          // Chỉ tóm tắt nếu có ít nhất 2 tin nhắn trao đổi
          if (history && history.length >= 2) {
            const summaryText = await aiEngine.generateConversationSummary(userId, info.displayName, history);
            
            if (config.zalo.adminId) {
              await api.sendMessage(summaryText, config.zalo.adminId);
              logger.info('✅ Sent conversation summary to admin Zalo', { userId, displayName: info.displayName });
            } else {
              logger.warn('⚠️ adminId not configured, cannot send conversation summary');
            }
          }
        } catch (err) {
          logger.error('❌ Error generating/sending summary', { userId, error: err.message });
          // Khôi phục lại trạng thái để thử lại lần sau
          info.needsSummary = true;
        }
      }
    }
  }, 60000); // Quét mỗi 1 phút

  // Quét cập nhật khuyến mãi ngay khi khởi động bot
  setTimeout(async () => {
    try {
      await runAutoUpdate();
    } catch (err) {
      logger.error('❌ Failed to run initial auto promotion update', err);
    }
  }, 10000); // Chờ 10 giây sau khi bot khởi động ổn định
}

// ── Utilities ────────────────────────────────────────────

function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];

  const parts = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      parts.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf('\n', maxLen);
    if (splitAt === -1 || splitAt < maxLen * 0.5) {
      splitAt = remaining.lastIndexOf(' ', maxLen);
    }
    if (splitAt === -1) splitAt = maxLen;

    parts.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).trimStart();
  }
  return parts;
}

// ── Graceful Shutdown ────────────────────────────────────

process.on('SIGTERM', () => {
  logger.info('🛑 Shutting down...');
  dataStore.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 Shutting down (Ctrl+C)...');
  dataStore.close();
  process.exit(0);
});

// ── Start ────────────────────────────────────────────────
startBot().catch(error => {
  logger.error('💥 Fatal error', { error: error.message });
  dataStore.close();
  process.exit(1);
});
