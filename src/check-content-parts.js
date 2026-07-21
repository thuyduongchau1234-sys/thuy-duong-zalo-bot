import fs from 'fs';

const content = fs.readFileSync('src/content.md', 'utf8');
const lines = content.split(/\r?\n/);
console.log("--- DANH SÁCH TIÊU ĐỀ TRONG CONTENT.MD ---");
lines.forEach((line, idx) => {
  const clean = line.trim();
  if (/^(phần|bài|chương|câu chuyện|câu hỏi)\s+/i.test(clean)) {
    console.log(`Dòng ${idx + 1}: ${clean}`);
  }
});
