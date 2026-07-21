import fs from 'fs';

const html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');

// Tìm Phần 23 và Phần 24
const p23Idx = html.indexOf('id="part-23"');
const p24Idx = html.indexOf('id="part-24"');
const endIdx = html.indexOf('id="tocModal"');

const p23Content = html.substring(p23Idx, p24Idx);
const p24Content = html.substring(p24Idx, endIdx);

const countQuestions = (text) => {
  const matches = text.match(/class="question">/g);
  return matches ? matches.length : 0;
};

console.log(`Số câu hỏi trong Phần 23: ${countQuestions(p23Content)}`);
console.log(`Số câu hỏi trong Phần 24: ${countQuestions(p24Content)}`);

// Tìm xem trong Phần 23 có các câu hỏi nào nằm ngoài chapter div
console.log('\n--- CÁC TIÊU ĐỀ CHAPTER TRONG PHẦN 23 ---');
const regex = /<h3 class="chapter-title">([\s\S]*?)<\/h3>/gi;
let match;
while ((match = regex.exec(p23Content)) !== null) {
  console.log(match[1].trim());
}

console.log('\n--- CÁC TIÊU ĐỀ CHAPTER TRONG PHẦN 24 ---');
regex.lastIndex = 0;
while ((match = regex.exec(p24Content)) !== null) {
  console.log(match[1].trim());
}
