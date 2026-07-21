import fs from 'fs';

console.log('🚀 Rebuild hoàn chỉnh Phần 25 + Phần 26 vào Ebook...');

let html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');

// ===== BƯỚC 1: Xóa phần 25, 26 cũ đã chèn trước đó =====
// Xóa nội dung phần 25+26 trong body
const part25Start = html.indexOf('<!-- ==================== PHẦN 25 ====================');
const fabButton = html.indexOf('<button class="fab"');
if (part25Start !== -1 && fabButton !== -1 && part25Start < fabButton) {
  html = html.substring(0, part25Start) + html.substring(fabButton);
  console.log('✅ Đã xóa Phần 25+26 cũ trong body');
}

// Xóa TOC cũ của phần 25+26 trong modal
const toc25Start = html.indexOf('<div class="toc-part">\n  <div class="toc-part-title"><a href="#part-25">');
if (toc25Start !== -1) {
  // Find closing of part 26 toc
  const toc26End = html.indexOf('</div>', html.indexOf('</ul>', html.indexOf('#part-26">', toc25Start)) + 5) + 6;
  html = html.substring(0, toc25Start) + html.substring(toc26End);
  console.log('✅ Đã xóa TOC cũ của Phần 25+26 trong modal');
}

// Xóa mục lục chính cũ
const mainToc25 = html.indexOf('<li><a href="#part-25">');
if (mainToc25 !== -1) {
  const mainToc26End = html.indexOf('</li>', html.indexOf('<li><a href="#part-26">')) + 5;
  html = html.substring(0, mainToc25) + html.substring(mainToc26End);
  console.log('✅ Đã xóa mục lục chính cũ');
}

// ===== BƯỚC 2: Đọc dữ liệu nguồn =====
const clipboardRaw = fs.readFileSync('data/clipboard_content.txt', 'utf8');
const part26P1Raw = fs.readFileSync('data/full_user_prompt.txt', 'utf8');
const part26P2Remaining = fs.readFileSync('data/p2_remaining.txt', 'utf8');

// ===== BƯỚC 3: Hàm chuyển text thô thành HTML giữ nguyên 100% nội dung =====
function textToHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildQASection(rawText, partId, partTitle, overviewHtml) {
  const lines = rawText.split(/\r?\n/);
  let result = '';
  let currentQ = null; // {num, questionLines, answerLines, answerer}
  let allQAs = [];
  let inAnswer = false;
  let sectionHeaders = []; // {lineIdx, title}
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Detect CÂU HỎI / Câu N:
    const qMatch = trimmed.match(/^(?:CÂU HỎI|Câu)\s+(\d+)\s*:\s*(.*)/i);
    if (qMatch) {
      if (currentQ) {
        allQAs.push({...currentQ});
      }
      currentQ = {
        num: parseInt(qMatch[1]),
        questionLines: [],
        answerLines: [],
        answerer: ''
      };
      const rest = qMatch[2].replace(/^\*\s*/, '').trim();
      if (rest) currentQ.questionLines.push(rest);
      inAnswer = false;
      continue;
    }
    
    // Detect section headers (P1/, P2/, Đoàn...)
    if (/^P[12]\/\s*/i.test(trimmed) || /CÂU HỎI.*CỦA ĐOÀN/i.test(trimmed) || /^Các câu hỏi của/i.test(trimmed) || /^Câu hỏi của/i.test(trimmed)) {
      sectionHeaders.push({qaIndex: allQAs.length + (currentQ ? 1 : 0), title: trimmed});
      if (currentQ) {
        allQAs.push({...currentQ});
        currentQ = null;
        inAnswer = false;
      }
      continue;
    }
    
    // Detect answer header (TTS:... ĐÁP / Trả lời:)
    if (/^TTS\s*:?\s*.*ĐÁP/i.test(trimmed) || /^Trả lời\s*:/i.test(trimmed)) {
      inAnswer = true;
      if (currentQ) {
        currentQ.answerer = trimmed;
        if (/^Trả lời\s*:\s*(.+)/i.test(trimmed)) {
          const ansContent = trimmed.replace(/^Trả lời\s*:\s*/i, '').trim();
          if (ansContent) currentQ.answerLines.push(ansContent);
        }
      }
      continue;
    }
    
    if (!currentQ) continue;
    
    if (inAnswer) {
      currentQ.answerLines.push(trimmed);
    } else {
      // Question continuation (remove leading *)
      currentQ.questionLines.push(trimmed.replace(/^\*\s*/, ''));
    }
  }
  if (currentQ) allQAs.push({...currentQ});
  
  return {allQAs, sectionHeaders};
}

// ===== BƯỚC 4: Build Phần 25 =====
function buildPart25() {
  const raw = clipboardRaw.replace(/^\uFEFF/, ''); // Remove BOM
  const lines = raw.split(/\r?\n/);
  
  let partHtml = `\n<!-- ==================== PHẦN 25 ==================== -->
<div class="part-section" id="part-25">
  <h2 class="part-section-title">Phần 25: Giải Đáp Đặc Biệt Về Lễ Tiễn Thiền Tông Sư Ngọc Lâm Về Phật Giới (01/2026)</h2>
  
  <div class="chapter" id="part-25-overview">
    <p class="answer" style="font-style:italic;color:var(--primary)">Thiền tông sư Anh Tuấn trả lời 20 câu hỏi từ các Phật tử về Lễ Tiễn Thiền Tông Sư Ngọc Lâm về Phật Giới.</p>
  </div>\n`;

  const {allQAs, sectionHeaders} = buildQASection(raw, 'part-25', '', '');
  console.log(`  Phần 25: ${allQAs.length} câu hỏi`);
  
  // Render section headers + QAs
  let qaIdx = 0;
  let headerIdx = 0;
  
  for (let i = 0; i < allQAs.length; i++) {
    // Check if a section header goes before this QA
    while (headerIdx < sectionHeaders.length && sectionHeaders[headerIdx].qaIndex <= i) {
      partHtml += `  <h3 class="chapter-title" id="part-25-sec-${headerIdx}">${textToHtml(sectionHeaders[headerIdx].title)}</h3>\n`;
      headerIdx++;
    }
    
    const qa = allQAs[i];
    const qText = qa.questionLines.map(l => `      <p>${textToHtml(l)}</p>`).join('\n');
    const aText = qa.answerLines.map(l => `      <p>${textToHtml(l)}</p>`).join('\n');
    
    partHtml += `
  <div class="q-and-a" id="part-25-q${qa.num}">
    <div class="question"><i class="fa-solid fa-circle-question icon-gold"></i> Câu ${qa.num}:</div>
${qText}
    <div class="answer-header"><i class="fa-solid fa-pen-fancy icon-teal"></i> ${qa.answerer ? textToHtml(qa.answerer) : 'Trả lời:'}</div>
${aText}
  </div>\n`;
  }
  
  partHtml += `  <a href="#top" class="back-to-top">▲ Về đầu trang</a>\n</div>\n`;
  return partHtml;
}

// ===== BƯỚC 5: Build Phần 26 =====
function buildPart26() {
  // Gộp 3 nguồn: P1 (từ full_user_prompt) + P2 (câu 1-18 từ full_user_prompt) + P2 (câu 19-40 từ p2_remaining)
  
  // Extract raw content from full_user_prompt (remove XML tags)
  let p1Raw = part26P1Raw;
  const userReqStart = p1Raw.indexOf('TRÍCH');
  if (userReqStart !== -1) p1Raw = p1Raw.substring(userReqStart);
  p1Raw = p1Raw.replace(/<\/?USER_REQUEST>/g, '').replace(/<truncated.*$/gm, '').replace(/NOTE:.*$/gm, '');
  
  // Combine P1 content + P2 remaining
  const fullPart26 = p1Raw + '\n' + part26P2Remaining;
  
  let partHtml = `\n<!-- ==================== PHẦN 26 ==================== -->
<div class="part-section" id="part-26">
  <h2 class="part-section-title">Phần 26: Giải Đáp 56 Câu Hỏi Về Lễ Tiễn Thiền Tông Sư Ngọc Lâm Về Phật Giới – Phần 4 (26/02/2026)</h2>\n`;

  const {allQAs, sectionHeaders} = buildQASection(fullPart26, 'part-26', '', '');
  console.log(`  Phần 26: ${allQAs.length} câu hỏi`);
  
  // Render
  let headerIdx = 0;
  
  for (let i = 0; i < allQAs.length; i++) {
    while (headerIdx < sectionHeaders.length && sectionHeaders[headerIdx].qaIndex <= i) {
      const hdr = sectionHeaders[headerIdx];
      partHtml += `\n  <h3 class="chapter-title" id="part-26-sec-${headerIdx}">${textToHtml(hdr.title)}</h3>\n`;
      headerIdx++;
    }
    
    const qa = allQAs[i];
    const qText = qa.questionLines.map(l => `      <p>${textToHtml(l)}</p>`).join('\n');
    const aText = qa.answerLines.map(l => `      <p>${textToHtml(l)}</p>`).join('\n');
    
    partHtml += `
  <div class="q-and-a" id="part-26-q${qa.num}">
    <div class="question"><i class="fa-solid fa-circle-question icon-gold"></i> Câu ${qa.num}:</div>
${qText}
    <div class="answer-header"><i class="fa-solid fa-pen-fancy icon-teal"></i> ${qa.answerer ? textToHtml(qa.answerer) : 'TTS: ANH TUẤN ĐÁP'}</div>
${aText}
  </div>\n`;
  }
  
  // Add footer address
  partHtml += `
  <div style="text-align:center;margin-top:40px;padding:20px;background:var(--bg-alt);border-radius:8px;border:1px dashed var(--gold)">
    <p style="font-weight:700;color:var(--primary)">ĐC: Chùa Thiền Tông Tân Diệu Số 273 Ấp Chánh Hội, Xã Hậu Nghĩa, Tỉnh Tây Ninh.</p>
    <p style="color:var(--gold);font-weight:600">Nơi chuyên dạy Giác Ngộ và Giải Thoát.</p>
  </div>
  <a href="#top" class="back-to-top">▲ Về đầu trang</a>
</div>\n`;
  return partHtml;
}

// ===== BƯỚC 6: Build & Insert =====
const part25Html = buildPart25();
const part26Html = buildPart26();

// Insert before FAB button
const fabIdx = html.indexOf('<button class="fab"');
if (fabIdx === -1) {
  console.error('❌ Không tìm thấy FAB button!');
  process.exit(1);
}
html = html.substring(0, fabIdx) + part25Html + '\n' + part26Html + '\n' + html.substring(fabIdx);
console.log('✅ Đã chèn nội dung Phần 25+26');

// ===== BƯỚC 7: Update TOC in Modal =====
const tocPart25 = `<div class="toc-part">
  <div class="toc-part-title"><a href="#part-25">Phần 25: Giải Đáp Đặc Biệt Về Lễ Tiễn TTS Ngọc Lâm Về Phật Giới (01/2026)</a></div>
  <ul class="toc-chapters">
    <li><a href="#part-25-q1">Câu 1 – Câu 10</a></li>
    <li><a href="#part-25-q11">Câu 11 – Câu 20</a></li>
  </ul>
</div>
<div class="toc-part">
  <div class="toc-part-title"><a href="#part-26">Phần 26: Giải Đáp 56 Câu Hỏi Về Lễ Tiễn TTS Ngọc Lâm – Phần 4 (26/02/2026)</a></div>
  <ul class="toc-chapters">
    <li><a href="#part-26-sec-0">P1: 16 Câu Hỏi Chị Nguyễn Thị Trường Giang</a></li>
    <li><a href="#part-26-sec-1">2 Câu Hỏi Đoàn Thiền Tông Nghệ An</a></li>
    <li><a href="#part-26-sec-2">P2: 40 Câu Hỏi Chị Hoàng Thị Thu Hồng</a></li>
  </ul>
</div>`;

// Find last toc-part div before modal closing
const closingModalScript = html.indexOf('</div>\n\n<script>');
if (closingModalScript !== -1) {
  const searchArea = html.substring(0, closingModalScript);
  const lastUlClose = searchArea.lastIndexOf('</ul>\n</div>');
  if (lastUlClose !== -1) {
    const tocInsertPoint = lastUlClose + '</ul>\n</div>'.length;
    html = html.substring(0, tocInsertPoint) + '\n' + tocPart25 + html.substring(tocInsertPoint);
    console.log('✅ Đã chèn TOC modal');
  }
}

// Update main TOC (H2 Mục Lục section)
const mainTocH2 = html.indexOf('<h2>Mục Lục</h2>');
if (mainTocH2 !== -1) {
  const part24InToc = html.indexOf('Phần 24', mainTocH2);
  if (part24InToc !== -1) {
    const part24Li = html.indexOf('</li>', part24InToc);
    if (part24Li !== -1) {
      const tocInsert = part24Li + '</li>'.length;
      html = html.substring(0, tocInsert) + `
    <li><a href="#part-25">Phần 25: Giải Đáp Đặc Biệt Về Lễ Tiễn TTS Ngọc Lâm Về Phật Giới (01/2026)</a></li>
    <li><a href="#part-26">Phần 26: Giải Đáp 56 Câu Hỏi Về Lễ Tiễn TTS Ngọc Lâm – Phần 4 (26/02/2026)</a></li>` + html.substring(tocInsert);
      console.log('✅ Đã cập nhật Mục Lục chính');
    }
  }
}

// ===== BƯỚC 8: Fix CSS cho dễ đọc (người lớn tuổi) =====
// Tăng cỡ chữ, canh lề trái phải, max-width nhỏ hơn
const cssInsertPoint = html.indexOf('</style>');
const cssAdditions = `
    /* === CSS BỔ SUNG: Dễ đọc cho người lớn tuổi === */
    .container { padding: 50px 60px; max-width: 820px; }
    body { font-size: 17px; line-height: 2; }
    p { text-align: justify; margin: 0 0 1.2em; }
    .q-and-a { padding: 24px 28px; margin-bottom: 26px; }
    .question { font-size: 17px; line-height: 1.9; }
    .answer p, .q-and-a p { font-size: 17px; line-height: 2; text-align: justify; }
    .answer-header { font-size: 16px; }
    .part-section-title { font-size: 23px; }
    .chapter-title { font-size: 18px; }
    @media(max-width:768px) {
      .container { padding: 24px 18px; }
      body { font-size: 16px; }
      .q-and-a { padding: 18px 16px; }
    }
  `;
html = html.substring(0, cssInsertPoint) + cssAdditions + '\n' + html.substring(cssInsertPoint);
console.log('✅ Đã thêm CSS canh lề + chữ to dễ đọc');

// ===== BƯỚC 9: Lưu file =====
fs.writeFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', html, 'utf8');
console.log(`\n✅ HOÀN THÀNH! Kích thước: ${(html.length / 1024).toFixed(0)} KB`);
