import fs from 'fs';

const html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');

console.log('Chứa Nguyễn La Thùy Linh:', html.includes('Nguyễn La Thùy Linh') || html.includes('Nguyá»…n La ThÃ¹y Linh'));
console.log('Chứa Đoàn Thị Liên:', html.includes('Đoàn Thị Liên') || html.includes('Ä oÃ n Thá»‹ LiÃªn'));
