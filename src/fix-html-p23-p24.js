import fs from 'fs';

const htmlPath = 'Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html';

console.log('🔄 Bắt đầu sửa lỗi cấu trúc hiển thị Phần 23 và Phần 24 trong Ebook...');

if (!fs.existsSync(htmlPath)) {
  console.error('❌ Không tìm thấy file:', htmlPath);
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

// Hàm nhóm các câu hỏi từ Câu 11 trở đi cho một Part
function processPartContent(partNum, partContent) {
  // Tìm thẻ đóng </div> của chapter đầu tiên (Câu 1 – Câu 10)
  // Chapter đầu tiên thường kết thúc sau câu 10
  const firstChapterEnd = partContent.indexOf('</div>\r\n<div class="q-and-a">\r\n<div class="question">');
  const firstChapterEndAlt = partContent.indexOf('</div>\n<div class="q-and-a">\n<div class="question">');
  
  const endIdx = firstChapterEnd !== -1 ? firstChapterEnd : firstChapterEndAlt;
  if (endIdx === -1) {
    console.error(`❌ Không tìm thấy điểm kết thúc Chapter 1 của Phần ${partNum}`);
    return partContent;
  }

  // Cắt phần đầu của Part (gồm Tổng quan và Câu 1 - 10)
  const partHeader = partContent.substring(0, endIdx + 6); // Lấy cả </div>
  const remainder = partContent.substring(endIdx + 6);

  // Parse các block q-and-a còn lại
  // Mỗi block bắt đầu bằng <div class="q-and-a"> và kết thúc bằng </div> (chứa question và answer)
  // Chúng ta dùng regex để tìm các block này
  const blockRegex = /<div class="q-and-a">([\s\S]*?)<\/div>\s*(?=<div class="q-and-a">|<\/section>|a href="#toc"|$)/gi;
  let blocks = [];
  let match;
  while ((match = blockRegex.exec(remainder)) !== null) {
    blocks.push(match[0]);
  }

  console.log(`Phần ${partNum}: Tìm thấy ${blocks.length} câu hỏi tiếp theo (từ Câu 11 trở đi)`);

  // Nhóm các block này thành từng nhóm 10 câu
  let groupIndex = 2;
  let groupedHtml = '';
  for (let i = 0; i < blocks.length; i += 10) {
    const chunk = blocks.slice(i, i + 10);
    const startNum = 11 + i;
    const endNum = Math.min(10 + i + chunk.length, 11 + i + chunk.length - 1);
    const chapterId = `part-${partNum}-g${groupIndex}`;
    
    groupedHtml += `\r\n<div class="chapter" id="${chapterId}">\r\n`;
    groupedHtml += `<h3 class="chapter-title">Câu ${startNum} – Câu ${endNum}</h3>\r\n`;
    groupedHtml += chunk.join('\r\n');
    groupedHtml += `\r\n</div>\r\n`;
    
    groupIndex++;
  }

  // Lấy phần đuôi (nếu có thẻ đóng </section> hoặc nút Về mục lục ở cuối remainder)
  const lastSectionCloseIdx = remainder.lastIndexOf('<a href="#toc"');
  let partFooter = '';
  if (lastSectionCloseIdx !== -1) {
    partFooter = remainder.substring(lastSectionCloseIdx);
  } else {
    partFooter = '\r\n<a href="#toc" class="back-to-top"><i class="fa-solid fa-arrow-up"></i> Về mục lục</a>\r\n</section>';
  }

  return partHeader + groupedHtml + partFooter;
}

// 1. Cắt file HTML thành các phần
const p23Start = html.indexOf('id="part-23"');
const p24Start = html.indexOf('id="part-24"');
const modalStart = html.indexOf('id="tocModal"');

if (p23Start === -1 || p24Start === -1 || modalStart === -1) {
  console.error('❌ Không định vị được các phần trong file HTML');
  process.exit(1);
}

// Tìm thẻ section mở tương ứng
const section23Open = html.lastIndexOf('<section', p23Start);
const section24Open = html.lastIndexOf('<section', p24Start);
const divModalOpen = html.lastIndexOf('<div', modalStart);

const fileHeader = html.substring(0, section23Open);
const part23Content = html.substring(section23Open, section24Open);
const part24Content = html.substring(section24Open, divModalOpen);
const fileFooter = html.substring(divModalOpen);

// 2. Xử lý nhóm câu hỏi cho Phần 23 và Phần 24
const newPart23Content = processPartContent(23, part23Content);
const newPart24Content = processPartContent(24, part24Content);

// 3. Cập nhật lại Mục lục (TOC) trong fileFooter
// Tìm phần mục lục của Phần 23 và 24
let updatedFooter = fileFooter;

const toc23Target = `<div class="toc-part-title"><a href="#part-23">Phần 23: Giải Đáp Đặc Biệt Thiên Đàng Ở Đâu (03/05/2026)</a></div>\r\n<ul class="toc-chapters">\r\n<li><a href="#part-23-ch-1">Tổng Quan</a></li>\r\n<li><a href="#part-23-ch-2">Câu 1 – Câu 10</a></li>\r\n</ul>`;
const toc23TargetAlt = `<div class="toc-part-title"><a href="#part-23">Phần 23: Giải Đáp Đặc Biệt Thiên Đàng Ở Đâu (03/05/2026)</a></div>\n<ul class="toc-chapters">\n<li><a href="#part-23-ch-1">Tổng Quan</a></li>\n<li><a href="#part-23-ch-2">Câu 1 – Câu 10</a></li>\n</ul>`;

const toc23Replacement = `<div class="toc-part-title"><a href="#part-23">Phần 23: Giải Đáp Đặc Biệt Thiên Đàng Ở Đâu (03/05/2026)</a></div>
<ul class="toc-chapters">
<li><a href="#part-23-ch-1">Tổng Quan</a></li>
<li><a href="#part-23-ch-2">Câu 1 – Câu 10</a></li>
<li><a href="#part-23-g2">Câu 11 – Câu 20</a></li>
<li><a href="#part-23-g3">Câu 21 – Câu 30</a></li>
<li><a href="#part-23-g4">Câu 31 – Câu 40</a></li>
<li><a href="#part-23-g5">Câu 41 – Câu 50</a></li>
<li><a href="#part-23-g6">Câu 51 – Câu 55</a></li>
</ul>`;

const toc24Target = `<div class="toc-part-title"><a href="#part-24">Phần 24: Giải Đáp Đặc Biệt Tánh Phật Hình Thành (10/05/2026)</a></div>\r\n<ul class="toc-chapters">\r\n<li><a href="#part-24-ch-1">Tổng Quan</a></li>\r\n<li><a href="#part-24-ch-2">Câu 1 – Câu 10</a></li>\r\n</ul>`;
const toc24TargetAlt = `<div class="toc-part-title"><a href="#part-24">Phần 24: Giải Đáp Đặc Biệt Tánh Phật Hình Thành (10/05/2026)</a></div>\n<ul class="toc-chapters">\n<li><a href="#part-24-ch-1">Tổng Quan</a></li>\n<li><a href="#part-24-ch-2">Câu 1 – Câu 10</a></li>\n</ul>`;

const toc24Replacement = `<div class="toc-part-title"><a href="#part-24">Phần 24: Giải Đáp Đặc Biệt Tánh Phật Hình Thành (10/05/2026)</a></div>
<ul class="toc-chapters">
<li><a href="#part-24-ch-1">Tổng Quan</a></li>
<li><a href="#part-24-ch-2">Câu 1 – Câu 10</a></li>
<li><a href="#part-24-g2">Câu 11 – Câu 20 (Lý Cẩm Lài hỏi về chú Lâm)</a></li>
<li><a href="#part-24-g3">Câu 21 – Câu 30</a></li>
<li><a href="#part-24-g4">Câu 31 – Câu 40</a></li>
<li><a href="#part-24-g5">Câu 41 – Câu 52</a></li>
</ul>`;

if (updatedFooter.includes(toc23Target)) {
  updatedFooter = updatedFooter.replace(toc23Target, toc23Replacement);
} else if (updatedFooter.includes(toc23TargetAlt)) {
  updatedFooter = updatedFooter.replace(toc23TargetAlt, toc23Replacement);
}

if (updatedFooter.includes(toc24Target)) {
  updatedFooter = updatedFooter.replace(toc24Target, toc24Replacement);
} else if (updatedFooter.includes(toc24TargetAlt)) {
  updatedFooter = updatedFooter.replace(toc24TargetAlt, toc24Replacement);
}

// 4. Ghép lại và ghi đè file HTML
const newHtml = fileHeader + newPart23Content + newPart24Content + updatedFooter;
fs.writeFileSync(htmlPath, newHtml, 'utf8');

console.log('💾 Đã sửa lỗi hiển thị và cập nhật thành công file HTML Ebook Thiền Tông!');
