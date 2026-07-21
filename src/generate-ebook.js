import fs from 'fs';
import path from 'path';

// Paths
const sourceFile = 'c:\\Users\\ABC\\Desktop\\Zalo_AI_Assistant_Setup\\src\\content.md';
const outputFile = 'c:\\Users\\ABC\\Desktop\\Zalo_AI_Assistant_Setup\\Tam_Thong_Duong_Nhan_Ebook.html';

// Read file
let rawText = '';
try {
  rawText = fs.readFileSync(sourceFile, 'utf-8');
} catch (e) {
  console.error('Error reading source file:', e);
  process.exit(1);
}

// Split into lines and filter metadata
let lines = rawText.split(/\r?\n/);
let startIndex = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('---')) {
    startIndex = i + 1;
    break;
  }
}
lines = lines.slice(startIndex);

// Parsing state
let htmlContent = '';
let chapters = [];
let currentChapter = null;
let currentSection = null;
let currentStory = null;
let currentDay = null;

// Helper to clean up text lines
function cleanLine(line) {
  return line.trim();
}

let inList = false;

// HTML template parts
const getHeader = () => `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tam Thông Dưỡng Nhan By Dương - Ebook</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --color-primary: #134e3a;      /* Emerald Green */
      --color-primary-light: #f0f7f4;
      --color-secondary: #c5a059;    /* Gold */
      --color-text-dark: #2e3833;
      --color-bg-light: #faf8f5;
      --font-header: 'Playfair Display', serif;
      --font-body: 'Montserrat', sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #f3ece4;
      font-family: var(--font-body);
      color: var(--color-text-dark);
      line-height: 1.8;
      font-size: 16px;
    }

    /* Container for the whole book */
    .ebook-container {
      max-width: 800px;
      margin: 40px auto;
      background-color: var(--color-bg-light);
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
      padding: 60px 80px;
    }

    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 800px;
      border: 2px solid var(--color-secondary);
      padding: 40px;
      text-align: center;
      margin-bottom: 80px;
      background-color: var(--color-primary-light);
      position: relative;
    }

    .cover-page::before {
      content: '';
      position: absolute;
      top: 10px;
      bottom: 10px;
      left: 10px;
      right: 10px;
      border: 1px dashed var(--color-secondary);
      pointer-events: none;
    }

    .cover-header {
      margin-top: 40px;
    }

    .cover-tag {
      font-size: 12px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--color-secondary);
      font-weight: 700;
      display: block;
      margin-bottom: 20px;
    }

    .cover-title {
      font-family: var(--font-header);
      font-size: 42px;
      color: var(--color-primary);
      margin: 0 0 15px 0;
      line-height: 1.2;
      font-weight: 700;
    }

    .cover-subtitle {
      font-size: 18px;
      font-style: italic;
      color: var(--color-text-dark);
      max-width: 500px;
      margin: 0 auto;
      line-height: 1.5;
    }

    .cover-center {
      margin: 40px 0;
    }

    .cover-logo {
      font-family: var(--font-header);
      font-size: 20px;
      color: var(--color-primary);
      border: 2px solid var(--color-primary);
      display: inline-block;
      padding: 10px 20px;
      letter-spacing: 4px;
      font-weight: 600;
      background-color: white;
    }

    .cover-footer {
      margin-bottom: 40px;
    }

    .cover-author {
      font-family: var(--font-header);
      font-size: 22px;
      font-weight: 500;
      color: var(--color-primary);
      margin-bottom: 5px;
    }

    .cover-desc {
      font-size: 13px;
      color: #666;
    }

    /* Table of Contents */
    .toc-section {
      margin-bottom: 80px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 40px;
      page-break-after: always;
    }

    .toc-title {
      font-family: var(--font-header);
      font-size: 28px;
      color: var(--color-primary);
      border-bottom: 2px solid var(--color-secondary);
      padding-bottom: 10px;
      margin-bottom: 30px;
    }

    .toc-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }

    .toc-item {
      margin-bottom: 15px;
    }

    .toc-link {
      display: flex;
      justify-content: space-between;
      text-decoration: none;
      color: var(--color-text-dark);
      font-weight: 500;
      transition: color 0.3s;
    }

    .toc-link:hover {
      color: var(--color-secondary);
    }

    .toc-chapter-title {
      font-family: var(--font-header);
      font-size: 18px;
    }

    /* Book formatting */
    .chapter-container {
      margin-bottom: 60px;
      page-break-before: always;
    }

    .chapter-header-box {
      text-align: center;
      margin-bottom: 50px;
      padding: 40px 0;
      border-bottom: 1px solid #eee;
    }

    .chapter-number {
      font-size: 14px;
      letter-spacing: 4px;
      color: var(--color-secondary);
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 10px;
      display: block;
    }

    .chapter-title {
      font-family: var(--font-header);
      font-size: 32px;
      color: var(--color-primary);
      margin: 0;
      line-height: 1.3;
    }

    .section-title {
      font-family: var(--font-header);
      font-size: 22px;
      color: var(--color-primary);
      margin-top: 40px;
      margin-bottom: 20px;
      border-left: 4px solid var(--color-secondary);
      padding-left: 15px;
    }

    .story-title {
      font-family: var(--font-header);
      font-size: 20px;
      color: var(--color-primary);
      margin-top: 35px;
      margin-bottom: 15px;
      background-color: var(--color-primary-light);
      padding: 10px 15px;
      border-radius: 4px;
    }

    .day-title {
      font-family: var(--font-header);
      font-size: 20px;
      color: var(--color-primary);
      margin-top: 35px;
      margin-bottom: 15px;
      border-bottom: 1px solid var(--color-secondary);
      padding-bottom: 5px;
    }

    .book-image {
      display: block;
      max-width: 90%;
      height: auto;
      margin: 35px auto;
      border: 1px solid var(--color-secondary);
      border-radius: 6px;
      padding: 6px;
      background-color: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
    }
    
    .book-image-caption {
      text-align: center;
      font-size: 13px;
      font-style: italic;
      color: #666;
      margin-top: -25px;
      margin-bottom: 35px;
    }

    /* Text elements */
    p {
      margin-top: 0;
      margin-bottom: 15px;
      text-align: justify;
    }

    p.lead-in {
      font-family: var(--font-header);
      font-size: 20px;
      font-style: italic;
      color: #555;
      text-align: center;
      margin-bottom: 40px;
      line-height: 1.6;
    }

    /* Styling dividers */
    .page-divider {
      border: 0;
      height: 1px;
      background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(197, 160, 89, 0.75), rgba(0, 0, 0, 0));
      margin: 40px 0;
    }

    .page-break {
      page-break-before: always;
      height: 10px;
    }

    /* Boxes */
    .lesson-box {
      background-color: #f7f9f6;
      border-left: 4px solid #7ea172;
      padding: 20px;
      margin: 25px 0;
      border-radius: 0 4px 4px 0;
    }

    .lesson-box strong {
      color: #3b5c31;
    }

    .quote-box {
      background-color: #fffdf9;
      border: 1px solid #f2e3c9;
      border-left: 4px solid var(--color-secondary);
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
      font-style: italic;
    }

    .exercise-box {
      background-color: var(--color-primary-light);
      border-left: 4px solid var(--color-primary);
      padding: 20px;
      margin: 25px 0;
      border-radius: 0 4px 4px 0;
    }

    .exercise-box strong {
      color: var(--color-primary);
    }

    /* Checkbox list */
    ul.check-list {
      list-style-type: none;
      padding-left: 10px;
      margin: 20px 0;
    }

    .checkbox-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .checkbox-item input[type="checkbox"] {
      margin-right: 12px;
      margin-top: 6px;
      accent-color: var(--color-primary);
      cursor: pointer;
    }

    /* Floating navigation for browser view */
    .print-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background-color: var(--color-primary);
      color: white;
      border: none;
      padding: 15px 25px;
      font-family: var(--font-body);
      font-size: 14px;
      font-weight: 600;
      border-radius: 30px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s;
      z-index: 1000;
    }

    .print-btn:hover {
      background-color: var(--color-secondary);
      transform: translateY(-2px);
    }

    /* Print styles */
    @media print {
      body {
        background-color: white;
      }
      .ebook-container {
        margin: 0;
        padding: 0;
        box-shadow: none;
        max-width: 100%;
      }
      .print-btn {
        display: none;
      }
      .cover-page {
        min-height: 95vh;
      }
    }
  </style>
</head>
<body>

  <button class="print-btn" onclick="window.print()">
    <i class="fa-solid fa-file-pdf"></i> Tải Xuống PDF / In Sách
  </button>

  <div class="ebook-container">
    <!-- COVER PAGE -->
    <div class="cover-page">
      <div class="cover-header">
        <span class="cover-tag">🌿 Dưỡng Sinh Đông Y Trẻ Hóa Tự Nhiên</span>
        <h1 class="cover-title">TAM THÔNG DƯỠNG NHAN</h1>
        <p class="cover-subtitle">Khai thông khí huyết – Đánh thức sức sống – Kiến tạo nhan sắc tự nhiên</p>
      </div>
      
      <div class="cover-center">
        <div class="cover-logo">DƯỠNG NHAN</div>
      </div>
      
      <div class="cover-footer">
        <div class="cover-author">Châu Thị Thùy Dương</div>
        <div class="cover-desc">Nhà Sáng Lập Phương Pháp Tam Thông Dưỡng Nhan</div>
      </div>
    </div>
`;

const getFooter = () => `
  </div>
</body>
</html>
`;

// Simple parser logic
let index = 0;
let parsedChapters = [];

while (index < lines.length) {
  let line = cleanLine(lines[index]);

  // Remove duplicate chapter signals (like "chương 11", "chương 22")
  if (line.match(/^chương \d{2,}$/i)) {
    index++;
    continue;
  }

  // Chapter start
  if (line.match(/^CHƯƠNG \d+$/i)) {
    let chNum = line;
    index++;
    let chTitle = '';
    while (index < lines.length && cleanLine(lines[index]) === '') {
      index++;
    }
    if (index < lines.length) {
      chTitle = cleanLine(lines[index]);
      index++;
    }
    // Also check if next line is part of title (if it is uppercase)
    while (index < lines.length && cleanLine(lines[index]) !== '' && !lines[index].startsWith('___') && !lines[index].startsWith('PHẦN') && lines[index] === lines[index].toUpperCase()) {
      chTitle += ' - ' + cleanLine(lines[index]);
      index++;
    }

    currentChapter = { number: chNum, title: chTitle, content: [] };
    parsedChapters.push(currentChapter);
    continue;
  }

  // Separator
  if (line.startsWith('___')) {
    if (currentChapter) {
      currentChapter.content.push({ type: 'divider' });
    }
    index++;
    continue;
  }

  // Section Header (PHẦN I, PHẦN II...)
  if (line.match(/^PHẦN [I|V|X|L]+$/i)) {
    let secNum = line;
    index++;
    let secTitle = '';
    while (index < lines.length && cleanLine(lines[index]) === '') {
      index++;
    }
    if (index < lines.length) {
      secTitle = cleanLine(lines[index]);
      index++;
    }
    // Check if next lines are part of header
    while (index < lines.length && cleanLine(lines[index]) !== '' && !lines[index].startsWith('___') && lines[index] === lines[index].toUpperCase()) {
      secTitle += ' - ' + cleanLine(lines[index]);
      index++;
    }
    
    if (currentChapter) {
      currentChapter.content.push({ type: 'section', number: secNum, title: secTitle });
    }
    continue;
  }

  // Story Header (CÂU CHUYỆN 1, 2...)
  if (line.match(/^CÂU CHUYỆN \d+$/i)) {
    let storyNum = line;
    index++;
    let storyTitle = '';
    while (index < lines.length && cleanLine(lines[index]) === '') {
      index++;
    }
    if (index < lines.length) {
      storyTitle = cleanLine(lines[index]);
      index++;
    }
    if (currentChapter) {
      currentChapter.content.push({ type: 'story', number: storyNum, title: storyTitle });
    }
    continue;
  }

  // Day Header (NGÀY 1, NGÀY 2...)
  if (line.match(/^NGÀY \d+$/i)) {
    let dayNum = line;
    index++;
    let dayTitle = '';
    while (index < lines.length && cleanLine(lines[index]) === '') {
      index++;
    }
    if (index < lines.length && !cleanLine(lines[index]).startsWith('___')) {
      dayTitle = cleanLine(lines[index]);
      index++;
    }
    if (currentChapter) {
      currentChapter.content.push({ type: 'day', number: dayNum, title: dayTitle });
    }
    continue;
  }

  // Regular line / paragraphs
  if (line !== '') {
    if (currentChapter) {
      currentChapter.content.push({ type: 'text', text: line });
    }
  }

  index++;
}

// Convert parsed chapters structure into beautiful HTML blocks
let mainContentHtml = '';

// Generate TOC
let tocHtml = `<div class="toc-section">
  <h2 class="toc-title"><i class="fa-solid fa-list-ol"></i> MỤC LỤC SÁCH</h2>
  <ul class="toc-list">`;

parsedChapters.forEach((ch, idx) => {
  const chId = `chapter-${idx + 1}`;
  tocHtml += `
    <li class="toc-item">
      <a href="#${chId}" class="toc-link">
        <span class="toc-chapter-title"><strong>${ch.number}</strong>: ${ch.title}</span>
      </a>
    </li>`;
});
tocHtml += `
  </ul>
</div>`;

mainContentHtml += tocHtml;

// Helper to convert plain lines to styled HTML
function processChapterContent(chapter, chapterIndex) {
  let chHtml = `<div class="chapter-container" id="chapter-${chapterIndex + 1}">`;
  
  // Chapter Header Box
  chHtml += `
    <div class="chapter-header-box">
      <span class="chapter-number">${chapter.number}</span>
      <h1 class="chapter-title">${chapter.title}</h1>
    </div>
  `;

  // Insert illustrations for specific chapters
  if (chapter.title.includes('SỨC KHỎE LÀ GỐC RỄ')) {
    chHtml += `
      <img src="public/images/vietnamese_natural_beauty.png" class="book-image" alt="Vẻ đẹp tự nhiên">
      <div class="book-image-caption">Hình: Vẻ đẹp tự nhiên, rạng rỡ của người phụ nữ bắt đầu từ sức khỏe bên trong</div>
    `;
  } else if (chapter.title.includes('13 ĐIỂM TẮC')) {
    chHtml += `
      <img src="public/images/vietnamese_massage_diagram.png" class="book-image" alt="Bản đồ các điểm tắc cơ trên khuôn mặt">
      <div class="book-image-caption">Hình: Sơ đồ các điểm tắc nghẽn cơ và hướng đi của khí huyết trên gương mặt</div>
    `;
  } else if (chapter.title.includes('NGHỆ THUẬT ĐIÊU KHẮC')) {
    chHtml += `
      <img src="public/images/vietnamese_spa_massage.png" class="book-image" alt="Kỹ thuật massage điêu khắc cơ mặt">
      <div class="book-image-caption">Hình: Động tác massage giải phóng cơ cứng và nâng cơ mặt tự nhiên</div>
    `;
  } else if (chapter.title.includes('TRIẾT LÝ CỐT LÕI')) {
    chHtml += `
      <img src="public/images/spa_natural_ingredients.png" class="book-image" alt="Nguyên liệu spa tự nhiên">
      <div class="book-image-caption">Hình: Dược liệu Đông y tự nhiên và các liệu pháp dưỡng sinh an toàn</div>
    `;
  } else if (chapter.title.includes('TÂM AN')) {
    chHtml += `
      <img src="public/images/vietnamese_meditation_peace.png" class="book-image" alt="Tâm an thái độ sống">
      <div class="book-image-caption">Hình: Sự bình an nội tâm giải phóng thần thái tự nhiên trên gương mặt</div>
    `;
  } else if (chapter.title.includes('HÀNH TRÌNH 21 NGÀY')) {
    chHtml += `
      <img src="public/images/wellness_journal_challenge.png" class="book-image" alt="Sổ nhật ký khỏe đẹp">
      <div class="book-image-caption">Hình: Nuôi dưỡng thói quen tự yêu thương và chăm sóc bản thân mỗi ngày</div>
    `;
  }

  let inCheckboxList = false;
  
  let i = 0;
  while (i < chapter.content.length) {
    let item = chapter.content[i];

    if (item.type === 'divider') {
      if (inCheckboxList) {
        chHtml += '</ul>';
        inCheckboxList = false;
      }
      chHtml += '<hr class="page-divider">';
      i++;
      continue;
    }

    if (item.type === 'section') {
      if (inCheckboxList) {
        chHtml += '</ul>';
        inCheckboxList = false;
      }
      chHtml += `<h2 class="section-title">${item.number} ${item.title ? ': ' + item.title : ''}</h2>`;
      i++;
      continue;
    }

    if (item.type === 'story') {
      if (inCheckboxList) {
        chHtml += '</ul>';
        inCheckboxList = false;
      }
      chHtml += `<h3 class="story-title"><i class="fa-solid fa-book-open"></i> ${item.number}: ${item.title}</h3>`;
      i++;
      continue;
    }

    if (item.type === 'day') {
      if (inCheckboxList) {
        chHtml += '</ul>';
        inCheckboxList = false;
      }
      chHtml += `<h3 class="day-title"><i class="fa-solid fa-calendar-day"></i> ${item.number} ${item.title ? ' — ' + item.title : ''}</h3>`;
      i++;
      continue;
    }

    if (item.type === 'text') {
      let txt = item.text;

      // Checkbox list parsing (lines starting with '□' or '[]' or '-')
      if (txt.startsWith('□') || txt.startsWith('[]') || txt.startsWith('[ ]')) {
        if (!inCheckboxList) {
          chHtml += '<ul class="check-list">';
          inCheckboxList = true;
        }
        let cleaned = txt.replace(/^□|\[\]|\[ \]/, '').trim();
        chHtml += `<li class="checkbox-item"><input type="checkbox"> <span>${cleaned}</span></li>`;
        i++;
        continue;
      }

      // If not checkbox, but list is open, close it
      if (inCheckboxList) {
        chHtml += '</ul>';
        inCheckboxList = false;
      }

      // Check for lead-in/introduction text: if it's the very first text in the chapter, make it italicized
      let isFirstText = true;
      for (let prevIdx = i - 1; prevIdx >= 0; prevIdx--) {
        if (chapter.content[prevIdx].type === 'text') {
          isFirstText = false;
          break;
        }
      }
      
      if (isFirstText && (chapter.title.includes('SỨC KHỎE') || chapter.title.includes('TRIẾT LÝ') || chapter.title.includes('TÂM AN'))) {
        chHtml += `<p class="lead-in">${txt}</p>`;
        i++;
        continue;
      }

      // Special boxes
      if (txt.startsWith('🌱 Bài học:') || txt.startsWith('🌱 Bài học')) {
        let content = txt.replace(/^🌱\s*Bài học:?\s*/, '').trim();
        // check if next items are also part of the lesson box
        while (i + 1 < chapter.content.length && chapter.content[i+1].type === 'text' && !chapter.content[i+1].text.startsWith('✨') && !chapter.content[i+1].text.startsWith('🌿') && !chapter.content[i+1].text.startsWith('🌱') && !chapter.content[i+1].text.startsWith('___')) {
          content += '<br>' + chapter.content[i+1].text;
          i++;
        }
        chHtml += `<div class="lesson-box"><i class="fa-solid fa-leaf" style="color: #7ea172; margin-right: 8px;"></i><strong>Bài Học Rút Ra:</strong><p style="margin-top: 10px; margin-bottom: 0;">${content}</p></div>`;
        i++;
        continue;
      }

      if (txt.startsWith('✨') || txt.startsWith('✨ Điều tôi muốn gửi đến bạn:')) {
        let content = txt.replace(/^✨\s*(Điều tôi muốn gửi đến bạn:?)?\s*/, '').trim();
        while (i + 1 < chapter.content.length && chapter.content[i+1].type === 'text' && !chapter.content[i+1].text.startsWith('🌱') && !chapter.content[i+1].text.startsWith('🌿') && !chapter.content[i+1].text.startsWith('✨') && !chapter.content[i+1].text.startsWith('___')) {
          content += '<br>' + chapter.content[i+1].text;
          i++;
        }
        chHtml += `<div class="quote-box"><strong><i class="fa-solid fa-wand-magic-sparkles" style="color: var(--color-secondary); margin-right: 8px;"></i>Thông điệp gửi bạn:</strong><p style="margin-top: 10px; margin-bottom: 0; font-style: italic;">${content}</p></div>`;
        i++;
        continue;
      }

      if (txt.startsWith('🌿 Bài tập') || txt.startsWith('🌿')) {
        let content = txt.replace(/^🌿\s*(Bài tập\s*\d*\s*phút:?)?\s*/, '').trim();
        while (i + 1 < chapter.content.length && chapter.content[i+1].type === 'text' && !chapter.content[i+1].text.startsWith('🌱') && !chapter.content[i+1].text.startsWith('✨') && !chapter.content[i+1].text.startsWith('🌿') && !chapter.content[i+1].text.startsWith('___')) {
          content += '<br>' + chapter.content[i+1].text;
          i++;
        }
        chHtml += `<div class="exercise-box"><strong><i class="fa-solid fa-spa" style="color: var(--color-primary); margin-right: 8px;"></i>Thực hành nhanh:</strong><p style="margin-top: 10px; margin-bottom: 0;">${content}</p></div>`;
        i++;
        continue;
      }

      // Default paragraph
      chHtml += `<p>${txt}</p>`;
      i++;
    }
  }

  if (inCheckboxList) {
    chHtml += '</ul>';
  }

  chHtml += `</div>`;
  return chHtml;
}

parsedChapters.forEach((ch, idx) => {
  mainContentHtml += processChapterContent(ch, idx);
});

// Write to output HTML file
const finalHtml = getHeader() + mainContentHtml + getFooter();
try {
  fs.writeFileSync(outputFile, finalHtml, 'utf-8');
  console.log(`✅ Ebook generated successfully at: ${outputFile}`);
} catch (e) {
  console.error('Error writing output file:', e);
}
