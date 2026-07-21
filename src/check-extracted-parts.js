import fs from 'fs';

const mdPath = 'data/thien_tong_qa.md';
const jsonPath = 'data/thien_tong_qa.json';

console.log('🔄 Kiểm tra các phần đã trích xuất trong thien_tong_qa...');

if (fs.existsSync(mdPath)) {
  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split('\n');
  console.log('--- CÁC TIÊU ĐỀ PHẦN TRONG THIEN_TONG_QA.MD ---');
  lines.forEach(line => {
    if (line.startsWith('# ') || line.startsWith('## ')) {
      console.log(line.trim());
    }
  });
} else {
  console.log('❌ Không tìm thấy thien_tong_qa.md');
}

if (fs.existsSync(jsonPath)) {
  const content = fs.readFileSync(jsonPath, 'utf8');
  try {
    const data = JSON.parse(content);
    console.log(`\n--- JSON CÓ ${Object.keys(data).length} PHẦN ---`);
    console.log('Các key trong JSON:', Object.keys(data).join(', '));
  } catch (e) {
    console.error('Lỗi parse JSON:', e.message);
  }
} else {
  console.log('❌ Không tìm thấy thien_tong_qa.json');
}
