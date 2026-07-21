import fs from 'fs';

const html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');
const lines = html.split(/\r?\n/);

console.log('🔍 Kiểm tra cấu trúc HTML của Phần 24...');

let print = false;
lines.forEach((line, idx) => {
  if (line.includes('id="part-24"')) {
    print = true;
  }
  if (print && idx < 11980) {
    // Chỉ in ra các dòng chứa thẻ div mở/đóng quan trọng hoặc tiêu đề
    if (line.includes('<div') || line.includes('</div') || line.includes('<section') || line.includes('</section') || line.includes('<h3')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
