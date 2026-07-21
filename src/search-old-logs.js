import fs from 'fs';

const logFiles = ['logs/combined.log', 'logs/combined1.log'];
console.log('🔄 Bắt đầu quét logs cũ tìm kiếm nội dung giải đáp...');

logFiles.forEach(logPath => {
  if (!fs.existsSync(logPath)) {
    console.log(`❌ Không tìm thấy ${logPath}`);
    return;
  }
  
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim() !== '');
  console.log(`\n--- Quét ${logPath} (${lines.length} dòng) ---`);
  
  let matchCount = 0;
  lines.forEach((line, idx) => {
    let messageText = '';
    try {
      const logObj = JSON.parse(line);
      messageText = logObj.message || '';
      if (logObj.meta) {
        messageText += ' ' + JSON.stringify(logObj.meta);
      }
    } catch (e) {
      messageText = line;
    }
    
    // Tìm kiếm các từ khóa
    const hasNgocLam = messageText.toLowerCase().includes('ngọc lâm') || 
                      messageText.toLowerCase().includes('ngoc lam') ||
                      messageText.includes('Ng\u1ecdc L\u00e2m') ||
                      messageText.includes('ng\u1ecdc l\u00e2m');
                      
    const has56 = messageText.includes('56');
    
    if (hasNgocLam || has56) {
      matchCount++;
      if (matchCount <= 20) {
        console.log(`Dòng ${idx + 1}: ${messageText.substring(0, 300)}`);
      }
    }
  });
  console.log(`=> Tìm thấy ${matchCount} dòng khớp trong ${logPath}`);
});
