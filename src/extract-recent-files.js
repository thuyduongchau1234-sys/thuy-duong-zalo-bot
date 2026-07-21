import { exec } from 'child_process';
import fs from 'fs';

console.log('🔄 Đang đọc Registry của Kingsoft Office...');

const registryPaths = [
  'HKCU\\Software\\Kingsoft\\Office\\6.0\\common\\recentfile',
  'HKCU\\Software\\Kingsoft\\Office\\6.0\\Writer\\recentfile',
  'HKCU\\Software\\Kingsoft\\Office\\6.0\\common',
  'HKCU\\Software\\Kingsoft\\Office\\recentfile',
];

let cmdCount = 0;
registryPaths.forEach(regPath => {
  exec(`reg query "${regPath}" /s`, (error, stdout, stderr) => {
    cmdCount++;
    console.log(`\n--- Kết quả từ ${regPath} ---`);
    if (error) {
      console.log(`❌ Lỗi hoặc không tồn tại: ${error.message.trim()}`);
    } else {
      console.log(stdout);
      // Ghi lại kết quả để kiểm tra
      fs.appendFileSync('data/wps_recent_registry.txt', `\n=== ${regPath} ===\n` + stdout, 'utf8');
    }
    
    if (cmdCount === registryPaths.length) {
      console.log('\n✅ Hoàn thành quét registry gần đây!');
    }
  });
});
