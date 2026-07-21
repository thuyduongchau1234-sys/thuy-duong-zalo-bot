import fs from 'fs';
import path from 'path';

const ebookPath = 'c:\\Users\\ABC\\Desktop\\Zalo_AI_Assistant_Setup\\Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html';
const outputJsonPath = 'c:\\Users\\ABC\\Desktop\\Zalo_AI_Assistant_Setup\\data\\thien_tong_qa.json';
const outputMdPath = 'c:\\Users\\ABC\\Desktop\\Zalo_AI_Assistant_Setup\\data\\thien_tong_qa.md';

function cleanHtmlText(htmlStr) {
  if (!htmlStr) return '';
  // Loại bỏ các thẻ icon tự sinh, ví dụ <i class="..."></i>
  let clean = htmlStr.replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, '');
  // Loại bỏ các thẻ HTML khác
  clean = clean.replace(/<[^>]+>/g, ' ');
  // Giải mã một số thực thể HTML thông dụng
  clean = clean.replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”');
  clean = clean.replace(/&bdquo;/g, '„').replace(/&ldquo;/g, '“');
  clean = clean.replace(/&nbsp;/g, ' ');
  clean = clean.replace(/&amp;/g, '&');
  // Thu gọn khoảng trắng thừa
  return clean.replace(/\s+/g, ' ').trim();
}

function extractQAFromBlock(blockContent) {
  let depth = 1;
  let pos = 0;
  
  while (depth > 0 && pos < blockContent.length) {
    const nextOpen = blockContent.indexOf('<div', pos);
    const nextClose = blockContent.indexOf('</div>', pos);
    
    if (nextClose === -1) {
      break;
    }
    
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      pos = nextClose + 6;
    }
  }
  
  return blockContent.substring(0, pos - 6);
}

async function run() {
  console.log('📖 ĐANG ĐỌC FILE EBOOK HỒ SƠ...');
  if (!fs.existsSync(ebookPath)) {
    console.error('❌ Không tìm thấy file ebook:', ebookPath);
    process.exit(1);
  }

  const html = fs.readFileSync(ebookPath, 'utf-8');
  console.log(`📊 Đã đọc file ebook (${(html.length / 1024 / 1024).toFixed(2)} MB). Bắt đầu trích xuất...`);

  // Xác định các Phần (Parts) từ mục lục hoặc các anchor
  // Ebook có các thẻ dạng <section class="part-section" id="part-X">
  // Chúng ta có thể split theo `<section class="part-section"` để biết tin nhắn thuộc phần nào
  const partSections = html.split('<section class="part-section"');
  
  const extractedQAs = [];
  let partCount = 0;

  for (let s = 1; s < partSections.length; s++) {
    const sectionContent = partSections[s];
    
    // Tìm tiêu đề của phần
    const titleMatch = sectionContent.match(/<h2 class="part-section-title">([\s\S]*?)<\/h2>/);
    const partTitle = titleMatch ? cleanHtmlText(titleMatch[1]) : `Phần ${s}`;
    partCount++;

    // Split section content by q-and-a class
    const qaBlocks = sectionContent.split('<div class="q-and-a">');
    console.log(`- Trích xuất: "${partTitle}" - Tìm thấy ${qaBlocks.length - 1} câu hỏi-đáp.`);

    for (let i = 1; i < qaBlocks.length; i++) {
      const blockRaw = qaBlocks[i];
      const qaHtml = extractQAFromBlock(blockRaw);
      
      // Phân tích câu hỏi
      const questionMatch = qaHtml.match(/<div class="question">([\s\S]*?)<\/div>/);
      let questionMain = questionMatch ? cleanHtmlText(questionMatch[1]) : '';
      
      // Phân tích câu trả lời chính
      const answerHeaderMatch = qaHtml.match(/<div class="answer-header">([\s\S]*?)<\/div>/);
      let answerMain = answerHeaderMatch ? cleanHtmlText(answerHeaderMatch[1]) : '';

      // Tìm câu hỏi phụ ở giữa question và answer-header nếu có
      let questionSub = '';
      if (questionMatch && answerHeaderMatch) {
        const betweenText = qaHtml.substring(
          qaHtml.indexOf(questionMatch[0]) + questionMatch[0].length,
          qaHtml.indexOf(answerHeaderMatch[0])
        );
        const subMatches = [...betweenText.matchAll(/<p class="answer">([\s\S]*?)<\/p>/g)];
        if (subMatches.length > 0) {
          questionSub = subMatches.map(m => cleanHtmlText(m[1])).join(' ');
        }
      }

      // Tìm câu trả lời chi tiết sau answer-header
      let answerDetail = '';
      if (answerHeaderMatch) {
        const afterText = qaHtml.substring(qaHtml.indexOf(answerHeaderMatch[0]) + answerHeaderMatch[0].length);
        const detailMatches = [...afterText.matchAll(/<p class="answer">([\s\S]*?)<\/p>/g)];
        if (detailMatches.length > 0) {
          answerDetail = detailMatches.map(m => cleanHtmlText(m[1])).join('\n');
        }
      }

      // Gộp câu hỏi và câu trả lời hoàn chỉnh
      const fullQuestion = questionSub ? `${questionMain} ${questionSub}` : questionMain;
      const fullAnswer = answerDetail ? `${answerMain}\n\nChi tiết:\n${answerDetail}` : answerMain;

      // Lấy số thứ tự câu hỏi từ tiêu đề câu hỏi nếu có (ví dụ: "CÂU HỎI 5:" -> 5)
      const idMatch = questionMain.match(/CÂU HỎI (\d+)/i);
      const qaId = idMatch ? parseInt(idMatch[1], 10) : extractedQAs.length + 1;

      extractedQAs.push({
        id: qaId,
        part: partTitle,
        question: fullQuestion,
        answer: fullAnswer
      });
    }
  }

  console.log(`\n🎉 Trích xuất hoàn tất! Tổng cộng thu được ${extractedQAs.length} câu hỏi-đáp từ ${partCount} phần.`);

  // Lưu file JSON
  fs.writeFileSync(outputJsonPath, JSON.stringify(extractedQAs, null, 2));
  console.log(`💾 Đã lưu dữ liệu JSON sạch tại: ${outputJsonPath}`);

  // Tạo nội dung Markdown
  let mdContent = `# TỔNG HỢP KIẾN THỨC ĐẠO PHẬT KHOA HỌC VẬT LÝ THIỀN TÔNG\n\n`;
  mdContent += `*Tài liệu trích xuất tự động từ ebook giải đáp của Chùa Thiền Tông Tân Diệu*\n`;
  mdContent += `*Tổng số câu hỏi-đáp: ${extractedQAs.length} câu.*\n\n---\n\n`;

  let currentPart = '';
  extractedQAs.forEach(qa => {
    if (qa.part !== currentPart) {
      currentPart = qa.part;
      mdContent += `\n## 📚 ${currentPart}\n\n`;
    }
    mdContent += `### ❓ ${qa.question}\n\n`;
    mdContent += `> **Trả lời:**\n`;
    // Thụt dòng cho trích dẫn
    const lines = qa.answer.split('\n');
    lines.forEach(l => {
      mdContent += `> ${l}\n`;
    });
    mdContent += `\n---\n\n`;
  });

  fs.writeFileSync(outputMdPath, mdContent);
  console.log(`💾 Đã lưu file Markdown sạch tại: ${outputMdPath}`);
}

run().catch(err => console.error('❌ Lỗi chạy script:', err));
