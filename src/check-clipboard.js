import fs from 'fs';

const path = 'data/clipboard_content.txt';

if (!fs.existsSync(path)) {
  console.error('❌ File không tồn tại!');
  process.exit(1);
}

const content = fs.readFileSync(path, 'utf8');
console.log(`✅ Đọc file thành công! Kích thước: ${content.length} ký tự.`);

console.log('\n--- 500 KÝ TỰ ĐẦU CỦA FILE ---');
console.log(content.substring(0, 500));

console.log('\n--- 500 KÝ TỰ CUỐI CỦA FILE ---');
console.log(content.substring(content.length - 500));
