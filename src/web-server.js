// ============================================================
// web-server.js — Landing Page HTTP Server & API Endpoints
// ============================================================
// Server HTTP nội bộ viết bằng Node.js thuần để phục vụ:
//   - Tệp tĩnh của Landing Page (index.html, style.css, app.js, images...)
//   - API POST /api/analyze-face (phân tích ảnh selfie bằng AI)
//   - API POST /api/contact-request (nhận yêu cầu đặt lịch hẹn, báo Zalo Admin)
// ============================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import aiEngine from './ai-engine.js';
import config from './config.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');

// Danh sách Content-Type mở rộng
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * Khởi chạy Web Server
 * @param {import('zca-js').API} api - Zalo API instance để gửi tin nhắn thông báo cho admin
 */
export function startWebServer(api) {
  const PORT = process.env.PORT || 3000;

  const server = http.createServer(async (req, res) => {
    const { method, url } = req;

    // ── Xử lý API Endpoints ──────────────────────────────
    if (method === 'POST') {
      // 1. Phân tích khuôn mặt tự động bằng AI (Đông y / Diện Chẩn)
      if (url === '/api/analyze-face') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            if (!data.image) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Thiếu hình ảnh phân tích.' }));
              return;
            }

            // Phân tách header Data URL (ví dụ: data:image/jpeg;base64,...)
            const matches = data.image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (!matches) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Định dạng hình ảnh không hợp lệ.' }));
              return;
            }

            const mimeType = matches[1];
            const base64Data = matches[2];

            logger.info(`📸 API analyze-face called (MimeType: ${mimeType})`);
            
            // Gọi AI phân tích
            const result = await aiEngine.analyzeFace(base64Data, mimeType);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, result }));
          } catch (err) {
            logger.error('Error in analyze-face API', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Đã xảy ra lỗi khi phân tích hình ảnh: ' + err.message }));
          }
        });
        return;
      }

      // 2. Đăng ký thông tin liên hệ / Khách hàng tiềm năng
      if (url === '/api/contact-request') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const { name, phone, email, needs, analysis } = data;

            if (!name || !phone) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Vui lòng cung cấp đầy đủ Tên và Số điện thoại.' }));
              return;
            }

            logger.info(`📞 Đăng ký tư vấn từ Landing Page: ${name} - ${phone}`);

            // Gửi tin nhắn thông báo cho Zalo Admin
            const adminId = config.zalo.adminId;
            if (api && adminId) {
              let notification = 
                `🔔 [ĐĂNG KÝ TƯ VẤN MỚI TỪ LANDING PAGE]\n` +
                `━━━━━━━━━━━━━━━━━━━\n` +
                `👤 Họ và tên: ${name}\n` +
                `📞 Số điện thoại: ${phone}\n` +
                `📧 Email: ${email || 'Không có'}\n` +
                `🎯 Nhu cầu tư vấn: ${needs || 'Chưa chọn'}\n`;

              if (analysis) {
                // Cắt bớt phần báo cáo nếu quá dài tránh quá hạn chế ký tự Zalo
                notification += `📊 Bản chẩn đoán mặt AI đính kèm:\n${analysis.substring(0, 800)}...\n`;
              }

              notification += `📅 Thời gian: ${new Date().toLocaleString('vi-VN')}\n` +
                `━━━━━━━━━━━━━━━━━━━\n` +
                `👉 Chị Thùy Dương vui lòng liên hệ chăm sóc khách hàng nhé! 🌸`;

              await api.sendMessage(notification, adminId);
              logger.info('📤 Đã gửi tin nhắn báo động Zalo Admin thành công');
            } else {
              logger.warn('⚠️ Thiếu Zalo API instance hoặc ADMIN_ZALO_ID để gửi thông báo đặt lịch');
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            logger.error('Error in contact-request API', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Đã xảy ra lỗi khi đăng ký: ' + err.message }));
          }
        });
        return;
      }
    }

    // ── Phục vụ các tệp tĩnh (Static Web Server) ───────────
    if (method === 'GET' || method === 'HEAD') {
      let safeUrl = url.split('?')[0]; // Lọc query params
      if (safeUrl === '/') {
        safeUrl = '/index.html';
      }

      const filePath = path.join(PUBLIC_DIR, safeUrl);

      // Phòng chống Directory Traversal Attack
      if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stats.size,
          'Cache-Control': 'public, max-age=3600',
        });

        if (method === 'HEAD') {
          res.end();
          return;
        }

        const stream = fs.createReadStream(filePath);
        stream.on('error', (streamErr) => {
          logger.error(`Error streaming file ${filePath}`, streamErr);
          if (!res.headersSent) {
            res.writeHead(500);
            res.end('Internal Server Error');
          }
        });
        stream.pipe(res);
      });
      return;
    }

    // 405 Method Not Allowed
    res.writeHead(405);
    res.end('Method Not Allowed');
  });

  server.listen(PORT, () => {
    logger.info(`🚀 Web Server Landing Page running on http://localhost:${PORT}`);
    console.log(`🚀 Web Server Landing Page running on http://localhost:${PORT}`);
  });

  return server;
}
