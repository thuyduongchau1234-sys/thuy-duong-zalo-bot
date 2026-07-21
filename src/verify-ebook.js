import fs from 'fs';

console.log('🔍 KIỂM TRA TỔNG THỂ EBOOK SAU KHI CẬP NHẬT\n');

const html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');

// 1. Kiểm tra tất cả H2
const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
let match;
let h2Count = 0;
console.log('=== DANH SÁCH CÁC PHẦN (H2) ===');
while ((match = h2Regex.exec(html)) !== null) {
  h2Count++;
  const text = match[1].replace(/<[^>]*>/g, '').trim();
  console.log(`  ${h2Count}. ${text}`);
}

// 2. Kiểm tra số câu hỏi trong Phần 25
const part25Start = html.indexOf('id="part-25"');
const part25End = html.indexOf('id="part-26"');
const part25Content = html.substring(part25Start, part25End);
const part25Qs = part25Content.match(/id="part-25-q\d+"/g);
console.log(`\n=== PHẦN 25 ===`);
console.log(`  Số câu hỏi: ${part25Qs ? part25Qs.length : 0}`);

// 3. Kiểm tra số câu hỏi trong Phần 26
const part26Start = html.indexOf('id="part-26"');
const part26End = html.indexOf('<button class="fab"');
const part26Content = html.substring(part26Start, part26End);
const part26Qs = part26Content.match(/id="part-26-q\d+"/g);
console.log(`\n=== PHẦN 26 ===`);
console.log(`  Số câu hỏi: ${part26Qs ? part26Qs.length : 0}`);

// List all question numbers
if (part26Qs) {
  const qNums = part26Qs.map(q => q.match(/q(\d+)/)[1]).map(Number);
  console.log(`  Câu hỏi: ${qNums.join(', ')}`);
  
  // Check P1 (should have q1-q16 + q1-q2 from Nghệ An section)
  // Check P2 (should have q1-q40)
}

// 4. Kiểm tra section headers trong Phần 26
const part26Headers = part26Content.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi);
if (part26Headers) {
  console.log(`  Số section headers: ${part26Headers.length}`);
  part26Headers.forEach((h, i) => {
    const text = h.replace(/<[^>]*>/g, '').trim();
    console.log(`    ${i+1}. ${text}`);
  });
}

// 5. Đối chiếu nội dung - kiểm tra một số đoạn text quan trọng có tồn tại
console.log('\n=== ĐỐI CHIẾU NỘI DUNG NGUYÊN VĂN ===');

const checkTexts = [
  // Phần 25 - Câu 1
  'Đây là nghi thức chuẩn để mà tiễn một vị Thiền tông sư trở về Phật giới',
  // Phần 25 - Câu 20
  'Khi mà mình chế được kính Hồng Ngoại',
  // Phần 26 P1 - Câu 1
  'Khi 1 Người Học và Hành theo Pháp môn Thiền tông, sau khi mất Thân được trở về Phật giới',
  // Phần 26 P1 - Câu 16
  'Trung Ấm Thân của Vị này muốn ở Núi Hy Mã Lạp Sơn thì ở hay muốn đi đâu thì tùy ý',
  // Phần 26 P1 Nghệ An - Câu 1
  'Thiền Tông Sư Ngọc Lâm có Sứ mạng làm mẫu',
  // Phần 26 P2 - Câu 1
  'Người có Công Đức Ít hoặc Vừa hoặc Đại Công Đức',
  // Phần 26 P2 - Câu 18
  'Đặc biệt Vị nào có Hạt Công Đức như Núi thì sẽ tạo 1 cái Núi Công Đức',
  // Phần 26 P2 - Câu 19 (trả lời)
  'Những Người mà Tu theo Thiền Tông mà chết đi sống lại thì đây là những trường hợp đặc biệt',
  // Phần 26 P2 - Câu 20
  'Nếu 1 Người tu theo Thiền tông khi Cận Tử Nghiệp mà lại sợ hãi',
  // Phần 26 P2 - Câu 30
  'Làm cách nào để nhận biết theo Thiền Tông chỉ vì Danh và Lợi',
  // Phần 26 P2 - Câu 40
  'Hiện tượng Bóng Đè là do các Vị Cô Hồn đè đó',
  // Địa chỉ cuối
  'Chùa Thiền Tông Tân Diệu Số 273 Ấp Chánh Hội',
];

let allFound = true;
checkTexts.forEach((text, i) => {
  const found = html.includes(text);
  const status = found ? '✅' : '❌';
  if (!found) allFound = false;
  console.log(`  ${status} "${text.substring(0, 60)}..."`);
});

// 6. Kiểm tra HTML hợp lệ
console.log('\n=== KIỂM TRA CẤU TRÚC HTML ===');
const hasHtml = html.includes('</html>');
const hasBody = html.includes('</body>');
const hasScript = html.includes('<script>');
console.log(`  ${hasHtml ? '✅' : '❌'} Có thẻ </html>`);
console.log(`  ${hasBody ? '✅' : '❌'} Có thẻ </body>`);
console.log(`  ${hasScript ? '✅' : '❌'} Có thẻ <script>`);

// 7. Tổng kết
console.log('\n=== TỔNG KẾT ===');
console.log(`  Tổng số phần (H2): ${h2Count}`);
console.log(`  Phần 25: ${part25Qs ? part25Qs.length : 0} câu hỏi`);
console.log(`  Phần 26: ${part26Qs ? part26Qs.length : 0} câu hỏi`);
console.log(`  Nội dung nguyên văn: ${allFound ? '✅ ĐẦY ĐỦ' : '❌ CÓ THIẾU'}`);
console.log(`  Kích thước file: ${(html.length / 1024).toFixed(0)} KB`);
