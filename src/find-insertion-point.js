import fs from 'fs';

const html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');

// Tìm các chuỗi chính trong file
const searchTerms = [
  'Tánh Phật Hình Thành',
  'part24',
  'Phần 24',
  'phan-24',
  'section24',
  'Danh Mục Tra Cứu',
  'openFab',
  'tocModal',
  '</article>',
];

searchTerms.forEach(term => {
  const idx = html.indexOf(term);
  if (idx !== -1) {
    // Count line number
    const before = html.substring(0, idx);
    const lineNum = before.split('\n').length;
    console.log(`✅ Tìm thấy "${term}" tại vị trí ${idx}, dòng ~${lineNum}`);
    console.log(`   Context: ...${html.substring(Math.max(0, idx-30), idx+60)}...`);
  } else {
    console.log(`❌ Không tìm thấy: "${term}"`);
  }
});

// Tìm phần cuối cùng của nội dung chính (trước script)
const scriptIdx = html.lastIndexOf('<script>');
const beforeScript = html.substring(Math.max(0, scriptIdx - 200), scriptIdx);
console.log('\n--- 200 ký tự TRƯỚC <script> cuối ---');
console.log(beforeScript);

// Tìm nội dung HTML xung quanh "Phần 24" trong TOC
const phan24Toc = html.indexOf('Phần 24');
if (phan24Toc !== -1) {
  console.log('\n--- Context xung quanh "Phần 24" ---');
  console.log(html.substring(Math.max(0, phan24Toc - 100), phan24Toc + 200));
}

// Tìm phần nội dung cuối (h2 cuối cùng)
const lastH2 = html.lastIndexOf('<h2');
if (lastH2 !== -1) {
  const lineNum = html.substring(0, lastH2).split('\n').length;
  console.log(`\n--- H2 cuối cùng tại dòng ~${lineNum} ---`);
  console.log(html.substring(lastH2, lastH2 + 200));
}
