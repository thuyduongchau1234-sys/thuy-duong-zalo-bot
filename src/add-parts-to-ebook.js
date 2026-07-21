import fs from 'fs';

console.log('🚀 Bắt đầu thêm 2 phần mới vào Ebook...');

let html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');
const clipboard = fs.readFileSync('data/clipboard_content.txt', 'utf8');
const fullPrompt = fs.readFileSync('data/full_user_prompt.txt', 'utf8');

// ===== PHẦN 1: Xây dựng HTML cho Phần 25 (Clipboard - GD Ngọc Lâm 01/2026 - 20 câu) =====
function buildPart25(rawText) {
  const lines = rawText.split(/\r?\n/).filter(l => l.trim() !== '');
  
  let htmlContent = `
<!-- ==================== PHẦN 25 ==================== -->
<div class="part" id="part-25">
  <h2>Phần 25: Giải Đáp Đặc Biệt Về Lễ Tiễn Thiền Tông Sư Ngọc Lâm Về Phật Giới (01/2026)</h2>
  
  <div class="chapter" id="part-25-ch-0">
    <h3>Tổng Quan</h3>
    <div class="qa-block">
      <div class="answer">
        <p>Thiền tông sư Anh Tuấn trả lời 20 câu hỏi từ các Phật tử về Lễ Tiễn Thiền Tông Sư Ngọc Lâm về Phật Giới. Các câu hỏi xoay quanh nghi thức chuẩn tiễn về Phật giới, nhà Lưu Cốt, kiểm chứng Công Đức, trang phục Đạo Phật Thiền Tông, và các vấn đề thực tiễn liên quan đến tang lễ theo Thiền Tông.</p>
      </div>
    </div>
  </div>
`;

  // Parse câu hỏi từ clipboard
  let currentQuestion = '';
  let currentAnswer = '';
  let currentQNum = 0;
  let questions = [];
  
  for (const line of lines) {
    const qMatch = line.match(/^Câu\s+(\d+)\s*:\s*(.*)/i);
    const aMatch = line.match(/^Trả lời\s*:\s*(.*)/i);
    
    if (qMatch) {
      // Save previous Q&A
      if (currentQNum > 0) {
        questions.push({ num: currentQNum, question: currentQuestion, answer: currentAnswer });
      }
      currentQNum = parseInt(qMatch[1]);
      currentQuestion = qMatch[2] || '';
      currentAnswer = '';
    } else if (aMatch) {
      currentAnswer = aMatch[1] || '';
    } else if (currentAnswer !== '' || (currentQNum > 0 && !currentQuestion)) {
      // Continuation of answer
      if (currentAnswer) {
        currentAnswer += '\n' + line;
      } else if (currentQuestion) {
        currentQuestion += ' ' + line;
      }
    } else if (currentQNum > 0 && currentQuestion) {
      // Continuation of question (before answer)
      currentQuestion += ' ' + line;
    }
  }
  // Save last Q&A
  if (currentQNum > 0) {
    questions.push({ num: currentQNum, question: currentQuestion, answer: currentAnswer });
  }
  
  console.log(`  Phần 25: Tìm thấy ${questions.length} câu hỏi`);
  
  // Generate HTML for each question
  for (const q of questions) {
    const answerParagraphs = q.answer.split('\n')
      .filter(l => l.trim() !== '')
      .map(l => `        <p>${escapeHtml(l.trim())}</p>`)
      .join('\n');
    
    htmlContent += `
  <div class="qa-block" id="part-25-q${q.num}">
    <div class="question">
      <span class="q-number">Câu ${q.num}:</span>
      <p>${escapeHtml(q.question.trim())}</p>
    </div>
    <div class="answer">
      <p class="answerer"><strong>TTS Anh Tuấn đáp:</strong></p>
${answerParagraphs}
    </div>
  </div>
`;
  }
  
  htmlContent += `</div>\n`;
  return htmlContent;
}

// ===== PHẦN 2: Xây dựng HTML cho Phần 26 (User prompt - GD 56 câu hỏi Phần 4 - 26/02/2026) =====
function buildPart26(rawText) {
  // Lấy nội dung từ sau <USER_REQUEST> đến hết
  let content = rawText;
  const startTag = content.indexOf('TRÍCH');
  if (startTag !== -1) {
    content = content.substring(startTag);
  }
  // Remove XML tags
  content = content.replace(/<\/?USER_REQUEST>/g, '');
  content = content.replace(/<truncated.*$/gm, '');
  content = content.replace(/NOTE:.*$/gm, '');
  
  const lines = content.split(/\r?\n/);
  
  let htmlContent = `
<!-- ==================== PHẦN 26 ==================== -->
<div class="part" id="part-26">
  <h2>Phần 26: Giải Đáp 56 Câu Hỏi Về Lễ Tiễn TTS Ngọc Lâm Về Phật Giới – Phần 4 (26/02/2026)</h2>
  
  <div class="chapter" id="part-26-ch-0">
    <h3>Tổng Quan</h3>
    <div class="qa-block">
      <div class="answer">
        <p>Giải đáp 56 câu hỏi về Lễ Tiễn Thiền Tông Sư Ngọc Lâm về Phật Giới – Phần 4 (ngày 26/02/2026). Gồm 2 phần chính:</p>
        <p><strong>P1:</strong> 16 câu hỏi của chị Nguyễn Thị Trường Giang, TP. HCM + 2 câu hỏi của Đoàn Thiền Tông Nghệ An.</p>
        <p><strong>P2:</strong> 40 câu hỏi của chị Hoàng Thị Thu Hồng.</p>
        <p>Thiền tông sư Anh Tuấn giải đáp.</p>
      </div>
    </div>
  </div>
`;

  // Parse sections P1 and P2
  let currentSection = '';
  let currentQNum = 0;
  let currentQuestion = '';
  let currentAnswer = '';
  let questions = [];
  let sectionTitle = '';
  let inAnswer = false;
  let globalQNum = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Detect section headers
    const p1Match = line.match(/^P1\/\s*(.*)/i);
    const p2Match = line.match(/^P2\/\s*(.*)/i);
    
    if (p1Match) {
      if (currentQNum > 0 && (currentQuestion || currentAnswer)) {
        questions.push({ section: currentSection, num: currentQNum, globalNum: globalQNum, question: currentQuestion, answer: currentAnswer, sectionTitle });
      }
      currentSection = 'P1';
      sectionTitle = p1Match[1] || '16 Câu Hỏi Chị Nguyễn Thị Trường Giang TP. HCM';
      currentQNum = 0;
      currentQuestion = '';
      currentAnswer = '';
      inAnswer = false;
      continue;
    }
    
    if (p2Match) {
      if (currentQNum > 0 && (currentQuestion || currentAnswer)) {
        questions.push({ section: currentSection, num: currentQNum, globalNum: globalQNum, question: currentQuestion, answer: currentAnswer, sectionTitle });
      }
      currentSection = 'P2';
      sectionTitle = p2Match[1] || '40 Câu Hỏi Của Chị Hoàng Thị Thu Hồng';
      currentQNum = 0;
      currentQuestion = '';
      currentAnswer = '';
      inAnswer = false;
      continue;
    }
    
    // Detect "2 CÂU HỎI CỦA ĐOÀN THIỀN TÔNG NGHỆ AN"
    if (line.match(/CÂU HỎI.*CỦA ĐOÀN THIỀN TÔNG NGHỆ AN/i)) {
      if (currentQNum > 0 && (currentQuestion || currentAnswer)) {
        questions.push({ section: currentSection, num: currentQNum, globalNum: globalQNum, question: currentQuestion, answer: currentAnswer, sectionTitle });
      }
      currentSection = 'P1-NA';
      sectionTitle = '2 Câu Hỏi Của Đoàn Thiền Tông Nghệ An';
      currentQNum = 0;
      currentQuestion = '';
      currentAnswer = '';
      inAnswer = false;
      continue;
    }
    
    // Detect question
    const qMatch = line.match(/^CÂU HỎI\s+(\d+)\s*:\s*(.*)/i);
    if (qMatch) {
      if (currentQNum > 0 && (currentQuestion || currentAnswer)) {
        questions.push({ section: currentSection, num: currentQNum, globalNum: globalQNum, question: currentQuestion, answer: currentAnswer, sectionTitle });
      }
      currentQNum = parseInt(qMatch[1]);
      globalQNum++;
      currentQuestion = qMatch[2] ? qMatch[2].replace(/^\*/, '').trim() : '';
      currentAnswer = '';
      inAnswer = false;
      continue;
    }
    
    // Detect answer start
    const aMatch = line.match(/^TTS\s*:?\s*.*ĐÁP\s*/i);
    if (aMatch) {
      inAnswer = true;
      continue;
    }
    
    // Detect sub-questions (HỎI Ý)
    const hoiYMatch = line.match(/^HỎI Ý\s*(\d+)\s*:\s*(.*)/i);
    if (hoiYMatch && !inAnswer) {
      currentQuestion += '\n' + line;
      continue;
    }
    
    // Accumulate content
    if (inAnswer) {
      currentAnswer += (currentAnswer ? '\n' : '') + line;
    } else if (currentQNum > 0) {
      // Question continuation
      const cleanLine = line.replace(/^\*/, '').trim();
      if (cleanLine) {
        currentQuestion += (currentQuestion ? '\n' : '') + cleanLine;
      }
    }
  }
  
  // Save last Q&A
  if (currentQNum > 0 && (currentQuestion || currentAnswer)) {
    questions.push({ section: currentSection, num: currentQNum, globalNum: globalQNum, question: currentQuestion, answer: currentAnswer, sectionTitle });
  }
  
  console.log(`  Phần 26: Tìm thấy ${questions.length} câu hỏi`);
  
  // Group by section
  const sections = {};
  for (const q of questions) {
    const key = q.section;
    if (!sections[key]) {
      sections[key] = { title: q.sectionTitle, questions: [] };
    }
    sections[key].questions.push(q);
  }
  
  let sectionIdx = 0;
  for (const [key, section] of Object.entries(sections)) {
    sectionIdx++;
    htmlContent += `
  <div class="chapter" id="part-26-ch-${sectionIdx}">
    <h3>${escapeHtml(section.title)}</h3>
`;
    
    for (const q of section.questions) {
      const questionParagraphs = q.question.split('\n')
        .filter(l => l.trim() !== '')
        .map(l => `      <p>${escapeHtml(l.trim())}</p>`)
        .join('\n');
      
      const answerParagraphs = q.answer.split('\n')
        .filter(l => l.trim() !== '')
        .map(l => {
          const trimmed = l.trim();
          // Bold for section headers (THỨ, PHẦN, TRƯỜNG HỢP, CẤP BẬC, VIỆC, TRẢ LỜI)
          if (/^(THỨ \d+|PHẦN \d+|PHẦN THỨ \d+|TRƯỜNG HỢP \d+|CẤP BẬC|TRẢ LỜI|VIỆC \d+)\s*:/i.test(trimmed)) {
            return `        <p><strong>${escapeHtml(trimmed)}</strong></p>`;
          }
          return `        <p>${escapeHtml(trimmed)}</p>`;
        })
        .join('\n');
      
      htmlContent += `
    <div class="qa-block" id="part-26-s${sectionIdx}-q${q.num}">
      <div class="question">
        <span class="q-number">Câu ${q.num}:</span>
${questionParagraphs}
      </div>
      <div class="answer">
        <p class="answerer"><strong>TTS Anh Tuấn đáp:</strong></p>
${answerParagraphs}
      </div>
    </div>
`;
    }
    
    htmlContent += `  </div>\n`;
  }
  
  htmlContent += `</div>\n`;
  return htmlContent;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== BUILD CONTENT =====
const part25Html = buildPart25(clipboard);
const part26Html = buildPart26(fullPrompt);

// ===== BUILD TOC ENTRIES =====
const tocPart25 = `<div class="toc-part">
  <div class="toc-part-title"><a href="#part-25">Phần 25: Giải Đáp Đặc Biệt Về Lễ Tiễn TTS Ngọc Lâm Về Phật Giới (01/2026)</a></div>
  <ul class="toc-chapters">
    <li><a href="#part-25-ch-0">Tổng Quan</a></li>
    <li><a href="#part-25-q1">Câu 1 – Câu 10</a></li>
    <li><a href="#part-25-q11">Câu 11 – Câu 20</a></li>
  </ul>
</div>`;

const tocPart26 = `<div class="toc-part">
  <div class="toc-part-title"><a href="#part-26">Phần 26: Giải Đáp 56 Câu Hỏi Về Lễ Tiễn TTS Ngọc Lâm – Phần 4 (26/02/2026)</a></div>
  <ul class="toc-chapters">
    <li><a href="#part-26-ch-0">Tổng Quan</a></li>
    <li><a href="#part-26-ch-1">P1: 16 Câu Hỏi Chị Nguyễn Thị Trường Giang TP. HCM</a></li>
    <li><a href="#part-26-ch-2">2 Câu Hỏi Đoàn Thiền Tông Nghệ An</a></li>
    <li><a href="#part-26-ch-3">P2: 40 Câu Hỏi Chị Hoàng Thị Thu Hồng</a></li>
  </ul>
</div>`;

// ===== INSERT INTO HTML =====

// 1. Insert content before FAB button
const fabMarker = '<!-- ====== FAB + Modal Mục Lục ====== -->';
let fabIdx = html.indexOf(fabMarker);
if (fabIdx === -1) {
  // Try alternate marker
  fabIdx = html.indexOf('<button class="fab"');
}
if (fabIdx === -1) {
  console.error('❌ Không tìm thấy vị trí chèn nội dung (FAB button)!');
  process.exit(1);
}

console.log(`✅ Tìm thấy vị trí chèn nội dung tại index ${fabIdx}`);
html = html.substring(0, fabIdx) + '\n' + part25Html + '\n' + part26Html + '\n' + html.substring(fabIdx);

// 2. Insert TOC entries before closing modal div
// Find the last toc-part div (Part 24)
const lastTocPart = html.lastIndexOf('</div>\n\n    </div>');
if (lastTocPart === -1) {
  // Try alternate: find closing of part-24 TOC
  const part24TocEnd = html.indexOf('</div>', html.indexOf('part-24-g1'));
  console.log('Using alternate TOC insertion point');
}

// Better approach: find the closing </div> after the last toc-part
const closingModalBody = html.indexOf('    </div>\n  </div>\n</div>\n\n<script>');
if (closingModalBody !== -1) {
  // Insert before the closing div of modal-body
  const insertPoint = html.lastIndexOf('</div>', closingModalBody - 1);
  const insertPoint2 = html.lastIndexOf('</div>', insertPoint - 1);
  // Actually, insert after the last toc-part div
  const lastTocPartEnd = html.lastIndexOf('</div>\n<div class="toc-part">');
  
  // Simplest: find the last "</ul>\n</div>" before the modal closing divs
  const searchArea = html.substring(0, closingModalBody);
  const lastUlClose = searchArea.lastIndexOf('</ul>\n</div>');
  if (lastUlClose !== -1) {
    const tocInsertPoint = lastUlClose + '</ul>\n</div>'.length;
    console.log(`✅ Tìm thấy vị trí chèn TOC tại index ${tocInsertPoint}`);
    html = html.substring(0, tocInsertPoint) + '\n' + tocPart25 + '\n' + tocPart26 + '\n' + html.substring(tocInsertPoint);
  } else {
    console.error('❌ Không tìm thấy vị trí chèn TOC!');
  }
} else {
  console.error('❌ Không tìm thấy modal closing!');
}

// 3. Update the main TOC (H2 section) if it exists
const mainTocH2 = html.indexOf('<h2>Mục Lục</h2>');
if (mainTocH2 !== -1) {
  // Find the closing </div> of the main TOC section
  // Look for the pattern with existing TOC links
  const part24MainToc = html.indexOf('Phần 24', mainTocH2);
  if (part24MainToc !== -1) {
    // Find the </li> after Part 24 line
    const part24Li = html.indexOf('</li>', part24MainToc);
    if (part24Li !== -1) {
      const tocInsert = part24Li + '</li>'.length;
      const newTocEntries = `
    <li><a href="#part-25">Phần 25: Giải Đáp Đặc Biệt Về Lễ Tiễn TTS Ngọc Lâm Về Phật Giới (01/2026)</a></li>
    <li><a href="#part-26">Phần 26: Giải Đáp 56 Câu Hỏi Về Lễ Tiễn TTS Ngọc Lâm – Phần 4 (26/02/2026)</a></li>`;
      html = html.substring(0, tocInsert) + newTocEntries + html.substring(tocInsert);
      console.log('✅ Đã thêm vào Mục Lục chính');
    }
  }
}

// Save
fs.writeFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', html, 'utf8');
console.log(`\n✅ Hoàn thành! File đã được cập nhật.`);
console.log(`   Kích thước mới: ${html.length} bytes (trước: 1,811,362 bytes)`);
