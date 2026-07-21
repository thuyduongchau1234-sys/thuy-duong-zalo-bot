// ============================================================
// image-generator.js — Dynamic Quote Card Generator
// ============================================================
// Module này tạo hình ảnh Quote/Tip Card tự động dưới dạng PNG.
// Hỗ trợ tự động chọn màu nền Gradient theo khung giờ,
// tự động wrap chữ tiếng Việt, và chèn 2 logo của anh Cường.
// ============================================================

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import logger from './logger.js';

/**
 * Escape các ký tự đặc biệt cho SVG XML
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Tự động wrap chữ tiếng Việt theo độ dài dòng chỉ định (giữ nguyên từ)
 */
function wrapText(text, maxCharsPerLine = 38) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Đọc logo và chuyển đổi thành base64 URI để embed trực tiếp vào SVG.
 * Hỗ trợ các định dạng .png, .jpg, .jpeg, .svg
 */
function getLogoBase64(logoNumber) {
  const extensions = ['.png', '.jpg', '.jpeg', '.svg'];
  const dir = path.join(process.cwd(), 'data', 'logos');
  
  for (const ext of extensions) {
    const filePath = path.join(dir, `logo${logoNumber}${ext}`);
    if (fs.existsSync(filePath)) {
      try {
        const buffer = fs.readFileSync(filePath);
        const mimeType = ext === '.svg' ? 'image/svg+xml' : `image/${ext.substring(1)}`;
        logger.debug(`Loaded logo${logoNumber} from ${filePath}`);
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
      } catch (err) {
        logger.error(`Error reading logo${logoNumber}${ext}`, err);
      }
    }
  }
  return null;
}

/**
 * Sinh ảnh Quote Card dưới dạng file PNG tạm thời
 * @param {string} text - Câu trích dẫn/Tip ngắn hiển thị trên ảnh
 * @param {string} timeOfDay - Buổi đăng bài ("sáng", "trưa", "tối") để đổi màu nền
 * @param {string} groupId - ID nhóm để đặt tên file tạm thời tránh xung đột
 * @returns {Promise<string>} Đường dẫn tuyệt đối đến file PNG tạm thời được tạo ra
 */
export async function createCard(text, timeOfDay, groupId, backgroundImagePath = null, customTitle = null) {
  const width = 800;
  const height = 800;
  
  const safeText = (text || '').normalize('NFC');
  const normTime = (timeOfDay || '').toLowerCase();
  let gradientHtml = '';
  let defaultTitle = '';
  
  // 1. Lựa chọn màu sắc Gradient & Tiêu đề theo buổi (Chủ đề Sức khỏe / Thảo dược / Spa / Làm đẹp)
  if (normTime.includes('sáng') || normTime.includes('8:00') || normTime.includes('morning')) {
    gradientHtml = `
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#11998e"/>
        <stop offset="100%" stop-color="#38ef7d"/>
      </linearGradient>
    `;
    defaultTitle = 'NĂNG LƯỢNG NGÀY MỚI';
  } else if (normTime.includes('trưa') || normTime.includes('12:00') || normTime.includes('noon')) {
    gradientHtml = `
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff758c"/>
        <stop offset="100%" stop-color="#ff7eb3"/>
      </linearGradient>
    `;
    defaultTitle = 'BÍ QUYẾT DƯỠNG SINH';
  } else if (normTime.includes('tối') || normTime.includes('19:00') || normTime.includes('evening') || normTime.includes('night')) {
    gradientHtml = `
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3a6073"/>
        <stop offset="100%" stop-color="#16222f"/>
      </linearGradient>
    `;
    defaultTitle = 'DƯỠNG NHAN & CHIÊM NGHIỆM';
  } else {
    gradientHtml = `
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#134e5e"/>
        <stop offset="100%" stop-color="#71b280"/>
      </linearGradient>
    `;
    defaultTitle = 'SỨC KHỎE TỰ NHIÊN';
  }

  if (customTitle) {
    defaultTitle = customTitle;
  }

  // 2. Wrap văn bản
  const lines = wrapText(safeText, 28);
  // Tính toán vị trí Y xuất phát để căn giữa đoạn văn
  const lineHeight = 52;
  const startY = 400 - ((lines.length - 1) * lineHeight) / 2;
  
  const textSpanHtml = lines.map((line, index) => {
    return `<tspan x="400" y="${startY + index * lineHeight}" text-anchor="middle">${escapeXml(line)}</tspan>`;
  }).join('\n');

  // 3. Đọc logo base64 (hoặc vẽ placeholder)
  const logo1Base64 = getLogoBase64(1);
  const logo2Base64 = getLogoBase64(2);
  
  const logo1Html = logo1Base64 
    ? `<image href="${logo1Base64}" x="80" y="660" width="70" height="70" />`
    : '';
    
  const logo2Html = logo2Base64 
    ? `<image href="${logo2Base64}" x="650" y="660" width="70" height="70" />`
    : '';

  // 4. Kiểm tra có ảnh nền không (ưu tiên tham số truyền vào, sau đó đến ảnh mặc định)
  const bgPath = backgroundImagePath || path.join(process.cwd(), 'data', 'user_face_preferred.png');
  let backgroundHtml = `<rect width="100%" height="100%" fill="url(#bg)" />`;
  let overlayCardHtml = `
    <!-- Card Overlay (Glassmorphism Effect) -->
    <rect x="50" y="50" width="700" height="700" rx="28" fill="rgba(15, 23, 42, 0.5)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2" />
    
    <!-- Header Title -->
    <text x="400" y="140" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">
      ${escapeXml(defaultTitle)}
    </text>
    
    <!-- Subtle Decorative Line -->
    <line x1="250" y1="175" x2="550" y2="175" stroke="rgba(255, 255, 255, 0.3)" stroke-width="2" />
    
    <!-- Quote Content -->
    <text font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle">
      ${textSpanHtml}
    </text>
    
    <!-- Branding & Logos Footer -->
    <text x="400" y="695" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="rgba(255, 255, 255, 0.5)" text-anchor="middle" letter-spacing="2">
      CHỊ THÙY DƯƠNG
    </text>
    
    ${logo1Html}
    ${logo2Html}
  `;

  let useComposite = false;
  if (fs.existsSync(bgPath)) {
    try {
      useComposite = true;
      backgroundHtml = ''; // SVG background is transparent, sharp will compose it over the background photo
      
      // Cấu hình lại chữ cho cân đối với hộp viền vàng ở dưới cằm (không che mặt)
      const bannerLines = wrapText(safeText, 34);
      const bannerLineHeight = 36;
      const bannerStartY = 618 - ((bannerLines.length - 1) * bannerLineHeight) / 2;
      const bannerTextSpans = bannerLines.map((line, index) => {
        return `<tspan x="400" y="${bannerStartY + index * bannerLineHeight}" text-anchor="middle">${escapeXml(line)}</tspan>`;
      }).join('\n');

      overlayCardHtml = `
        <!-- Hộp viền vàng sang trọng dịch xuống vùng ngực (Y=550) tránh che mặt -->
        <rect x="150" y="550" width="500" height="120" rx="15" fill="rgba(15, 23, 42, 0.55)" stroke="#d4af37" stroke-width="3" filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.5))" />
        
        <!-- Văn bản phía trên hộp viền vàng -->
        <text x="400" y="505" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1.5" filter="drop-shadow(2px 2px 3px rgba(0,0,0,0.8))">
          ${escapeXml(defaultTitle)}
        </text>
        
        <!-- Văn bản chính trong hộp viền vàng -->
        <text font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#d4af37" text-anchor="middle">
          ${bannerTextSpans}
        </text>
        
        <!-- Văn bản phía dưới hộp viền vàng -->
        <text x="400" y="722" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2" filter="drop-shadow(2px 2px 3px rgba(0,0,0,0.8))">
          TAM THÔNG DƯỠNG NHAN
        </text>
      `;
    } catch (bgErr) {
      logger.error('Failed to prepare layout for background image card', bgErr);
    }
  }

  // 5. Tạo SVG string hoàn chỉnh
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        ${gradientHtml}
      </defs>
      
      <!-- Background -->
      ${backgroundHtml}
      
      <!-- Overlays and Text -->
      ${overlayCardHtml}
    </svg>
  `;

  // 5. Render SVG thành file PNG bằng Sharp
  const outputDir = path.join(process.cwd(), 'data', 'temp_images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `nurturing_${groupId || 'default'}.png`);
  
  try {
    if (useComposite) {
      // Composite the transparent SVG overlay on top of her background photo
      await sharp(bgPath)
        .resize(width, height)
        .composite([{
          input: Buffer.from(svg),
          top: 0,
          left: 0
        }])
        .png()
        .toFile(outputPath);
    } else {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
    }
      
    logger.info(`✅ Generated nurturing image successfully at: ${outputPath}`);
    return outputPath;
  } catch (err) {
    logger.error('❌ Failed to compile SVG to PNG using sharp', err);
    throw err;
  }
}
