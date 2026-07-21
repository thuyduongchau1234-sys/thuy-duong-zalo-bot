import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const pdfPath = 'c:\\Users\\ABC\\Documents\\Zalo Received Files\\Khoa học.pdf';

console.log('🔄 Bắt đầu đọc file PDF:', pdfPath);

if (!fs.existsSync(pdfPath)) {
  console.error('❌ Không tìm thấy file PDF!');
  process.exit(1);
}

const dataBuffer = fs.readFileSync(pdfPath);

console.log('pdf export type:', typeof pdf, Object.keys(pdf));
console.log('pdf class keys:', Object.keys(pdf));
const { PDFParse } = pdf;
const parser = new PDFParse({ data: dataBuffer });
const textResult = await parser.getText();
const text = textResult.text;
console.log(`✅ Đã đọc xong! Độ dài văn bản: ${text.length} ký tự`);

// Lưu 20000 ký tự đầu và 100000 ký tự cuối vào file text để phân tích
const firstChars = text.substring(0, 20000);
const lastChars = text.substring(Math.max(0, text.length - 100000));

fs.writeFileSync('data/pdf_first.txt', firstChars, 'utf8');
fs.writeFileSync('data/pdf_last.txt', lastChars, 'utf8');
console.log('💾 Đã lưu file text phân tích!');

// Tìm kiếm chữ "Ngọc Lâm" hoặc "56" trong văn bản
const searchKeywords = ['Ngọc Lâm', 'Ngoc Lam', '56 câu', '56 cau', 'Phần 25', 'Phần 26'];
console.log('\n--- KẾT QUẢ TÌM KIẾM TỪ KHÓA TRONG PDF ---');
searchKeywords.forEach(kw => {
  const regex = new RegExp(kw, 'gi');
  const matches = text.match(regex);
  console.log(`Từ khóa "${kw}": xuất hiện ${matches ? matches.length : 0} lần`);
});

process.exit(0);
