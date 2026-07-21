import fs from 'fs';
import path from 'path';

const pinsFile = path.join(process.cwd(), 'Thuvien_5000_Pinterest_Pins.json');
const outputFile = path.join(process.cwd(), 'Tam_Thong_Duong_Nhan_Ebook.html');

// Bản đồ tên danh mục tiếng Việt sang trọng
const catNames = {
  "TAM_THONG": { title: "Nguyên Lý Tam Thông Dưỡng Nhan", desc: "Bản đồ khơi thông dòng chảy cơ - huyết - kinh lạc, nuôi dưỡng nhan sắc từ gốc rễ." },
  "GIAC_CO": { title: "Giải Tắc Và Điêu Khắc Cơ Mặt", desc: "Kỹ thuật đả thông cơ co rút, nâng đỡ gò má chảy xệ và xóa mờ nếp nhăn tự nhiên." },
  "DIEN_CHAN": { title: "Diện Chẩn Thẩm Mỹ Hoạt Huyết", desc: "Ứng dụng đồ hình phản chiếu tạng phủ và bộ huyệt dưỡng nhan làm đẹp không xâm lấn." },
  "DINH_DUONG": { title: "Dinh Dưỡng Dưỡng Nhan Nutrilite", desc: "Giải pháp nuôi dưỡng tế bào da, nâng cấu trúc sợi cơ từ bên trong bằng đạm thực vật và dưỡng chất hữu cơ." },
  "MY_PHAM": { title: "Mỹ Phẩm Thuần Chay Artistry", desc: "Nuôi dưỡng 5 hàng rào sinh học da, phục hồi và cấp ẩm sâu bằng dưỡng chất nông trại hữu cơ." },
  "VAI_GAY": { title: "Đả Thông Cổ Vai Gáy & Hệ Bạch Huyết", desc: "Giải phóng điểm nghẽn mạch máu cổ, kích hoạt hệ bạch huyết để thon gọn nọng cằm và sáng da." },
  "DO_TUOI": { title: "Lộ Trình Trẻ Hóa Theo Độ Tuổi", desc: "Phương pháp chăm sóc da cá nhân hóa cho phụ nữ tuổi 25+, 35+, 45+ và cân bằng nội tiết tố." },
  "SAI_LAM": { title: "Giải Mã Sai Lầm Khi Chăm Sóc Da", desc: "Nhận diện những thói quen vô thức tàn phá collagen như ăn đường, nằm nghiêng và siết hàm căng thẳng." },
  "NOI_TAM": { title: "Nội Tâm An Vui - Mỹ Phẩm Nội Sinh", desc: "Phương pháp thả lỏng khớp cắn cơ nhai đón nhận khí lành và kiến tạo vẻ đẹp từ tâm thức." },
  "SPA_WELLNESS": { title: "Đào Tạo & Quy Chuẩn Spa Trị Liệu", desc: "Tiêu chuẩn setup phòng trị liệu spa wellness 5 sao và giáo trình đào tạo kỹ thuật viên chuyên nghiệp." }
};

// Hàm phân tích Pin thành cấu trúc Vấn Đề - Giải Pháp - Hành Động
function parsePinContent(pin) {
  const desc = pin.description || pin.desc || '';
  const title = pin.title || '';
  const text = (title + " " + desc).toLowerCase();
  
  let problem = "Gương mặt xuất hiện các dấu hiệu lão hóa, nếp nhăn xuất hiện do căng thẳng tích tụ làm cơ mặt co cứng, cản trở máu huyết lưu thông nuôi dưỡng làn da.";
  let solution = "Thực hiện massage trị liệu đả thông bằng các đầu ngón tay hoặc dụng cụ sừng, kết hợp bấm huyệt hoạt huyết Diện Chẩn để giải phóng điểm tắc nghẽn.";
  let action = "Duy trì thói quen massage 2-3 phút mỗi ngày, luôn ý thức thả lỏng hàm răng (hai hàm răng không chạm nhau) và cười nhẹ để giữ cơ mặt được nâng lên tự nhiên.";
  let imageName = "00_vo_mat.png";

  if (text.includes('nhai') || text.includes('cắn') || text.includes('hàm') || text.includes('jaw') || text.includes('giáp xa')) {
    problem = "Áp lực vô thức khiến bạn thường xuyên nghiến chặt răng, siết chặt cơ nhai (khớp cắn). Lâu ngày, cơ hàm bị phì đại, co cứng, gây lệch mặt, đau mỏi khớp thái dương hàm và làm gương mặt thô bạnh.";
    solution = "Nhai chặt răng để tìm điểm gồ cứng (Huyệt Giáp Xa), dùng hai đầu ngón tay day tròn nhẹ nhàng trong 30 giây để làm mềm bó cơ và giải tỏa lực siết khớp hàm.";
    action = "Xây dựng thói quen thả lỏng hàm suốt cả ngày: răng không chạm răng, lưỡi đặt nhẹ trên vòm họng trên, thả lỏng hàm dưới và nở một nụ cười mỉm nhẹ nhàng.";
    imageName = "03_co_nhai.png";
  } else if (text.includes('trán') || text.includes('forehead')) {
    problem = "Thói quen nhướng mày, nhăn trán khi suy nghĩ làm cơ trán bị co rút liên tục, tạo thành các nếp nhăn trán sâu và cản trở dòng chảy máu nuôi da vùng trán, gây mệt mỏi thần kinh.";
    solution = "Dùng các đầu ngón tay miết và cạo vuốt ngang cơ vùng trán từ giữa trán kéo giãn ra hai bên thái dương để giải phóng sự co cứng, hỗ trợ xóa nhăn hiệu quả.";
    action = "Mỗi khi thấy suy nghĩ căng thẳng, hãy day nhẹ vùng Ấn Đường (giữa hai chân mày) và ý thức thả lỏng cơ trán giãn mềm ra tự nhiên.";
    imageName = "01_co_tran.png";
  } else if (text.includes('má') || text.includes('rãnh cười') || text.includes('cheek') || text.includes('địa thương')) {
    problem = "Khí huyết lưu thông kém vùng má làm cơ má bị chảy xệ và tích tụ mỡ thừa, tạo thành nếp nhăn rãnh cười sâu (khóe cười rãnh rồng), khiến gương mặt trông mệt mỏi và già nua.";
    solution = "Dùng ngón tay miết nâng chéo cơ má từ khóe miệng (Huyệt Địa Thương) đi chéo dọc xương gò má lên thái dương để nâng đỡ vùng cơ má và xóa mờ rãnh cười.";
    action = "Hạn chế thói quen chống cằm, nằm nghiêng tì đè lên má. Bổ sung dưỡng chất Protein Nutrilite để tái tạo sợi cơ nâng đỡ vùng má luôn săn chắc.";
    imageName = "02_co_ma.png";
  } else if (text.includes('mắt') || text.includes('bọng') || text.includes('eye')) {
    problem = "Tắc nghẽn hệ bạch huyết quanh mắt do thức khuya, stress hoặc tiếp xúc thiết bị điện tử liên tục, dẫn đến hiện tượng tích nước gây bọng mắt, quầng thâm và vết chân chim.";
    solution = "Dùng đầu ngón tay áp út miết nhẹ dọc theo xương hốc mắt dưới từ trong khóe mắt ra đuôi mắt để lưu thông dịch bạch huyết, giải tỏa mệt mỏi và quầng thâm.";
    action = "Tập thói quen ngủ sớm trước 11 giờ đêm, massage mắt 2 phút mỗi tối sau khi bôi kem mắt Artistry để tái tạo hàng rào da quanh mắt.";
    imageName = "04_co_mat.png";
  } else if (text.includes('cằm') || text.includes('nọng') || text.includes('chin')) {
    problem = "Mỡ thừa và dịch bạch huyết bị ứ đọng dưới cằm do tư thế cúi đầu thấp thường xuyên, làm mất đi đường viền hàm sắc nét và cản trở máu huyết lưu thông lên vùng cổ.";
    solution = "Dùng lưng các ngón tay miết vuốt từ cằm ngược ra sau tai dọc theo đường viền hàm dưới để kích thích bạch huyết đào thải độc tố, tiêu mỡ nọng cằm.";
    action = "Giữ tư thế thẳng lưng, đầu hướng thẳng, hạn chế cúi đầu nhìn điện thoại lâu. Massage viền hàm 2 lần mỗi ngày sau khi bôi dầu dưỡng da.";
    imageName = "05_nong_cam.png";
  } else if (text.includes('vai gáy') || text.includes('cổ') || text.includes('neck') || text.includes('shoulder')) {
    problem = "Căng thẳng tâm lý hoặc tư thế làm việc sai khiến cơ cổ vai gáy bị bó cứng, co kéo bả vai, cản trở các mạch máu truyền dẫn oxy và chất dinh dưỡng lên nuôi dưỡng làn da mặt.";
    solution = "Thực hiện bóp day miết dọc cơ ức đòn chũm hai bên cổ và xoa bóp vùng cơ vai gáy để giải phóng căng thẳng bó cơ, khai thông dòng chảy máu lên mặt.";
    action = "Cứ sau 45 phút làm việc, hãy đứng dậy thực hiện bài xoay cổ vai gáy và tập thở sâu bằng bụng để hạ hai bả vai thả lỏng tự nhiên.";
    imageName = "06_vai_gay.png";
  } else if (text.includes('dinh dưỡng') || text.includes('nutrilite') || text.includes('protein')) {
    problem = "Chế độ ăn thiếu hụt vitamin và đạm thực vật làm suy giảm cấu trúc collagen nâng đỡ dưới da, khiến da nhanh bị chùng nhão, chảy xệ và thiếu sức sống từ bên trong.";
    solution = "Bổ sung đạm thực vật Protein Nutrilite chất lượng cao và Vitamin C từ thực vật hữu cơ để làm nguyên liệu tổng hợp sợi collagen khỏe mạnh cho làn da.";
    action = "Cắt giảm lượng đường ngọt trong khẩu phần ăn (để tránh hiện tượng glycation tàn phá collagen) và uống đủ nước ấm lọc sạch mỗi ngày.";
    imageName = "00_vo_mat.png";
  } else if (text.includes('mỹ phẩm') || text.includes('artistry') || text.includes('chăm sóc da') || text.includes('skincare')) {
    problem = "Lớp màng bảo vệ da bị tàn phá do sử dụng mỹ phẩm chứa hóa chất lột tẩy hoặc chăm sóc da sai cách, khiến da nhạy cảm, dễ kích ứng, sạm nám và mất nước.";
    solution = "Sử dụng dòng mỹ phẩm thuần chay Artistry lành tính từ nông trại hữu cơ giúp nuôi dưỡng đầy đủ 5 hàng rào sinh học bảo vệ tự nhiên của làn da.";
    action = "Tuân thủ đúng 3 bước Skincare tối giản hàng ngày: Làm sạch sâu dịu nhẹ -> Cân bằng & Cấp ẩm sâu -> Thoa kem chống nắng bảo vệ da.";
    imageName = "00_vo_mat.png";
  }

  return { problem, solution, action, imageName };
}

async function generateEbookFromPins() {
  console.log('📖 Bắt đầu tổng hợp Ebook từ kho dữ liệu Pins...');
  
  if (!fs.existsSync(pinsFile)) {
    console.error('❌ Không tìm thấy file dữ liệu Pins!');
    process.exit(1);
  }

  const pins = JSON.parse(fs.readFileSync(pinsFile, 'utf-8'));
  console.log(`📊 Đã nạp thành công ${pins.length} Pins.`);

  // Nhóm Pins theo danh mục
  const groupedPins = {};
  pins.forEach(pin => {
    const cat = pin.category || pin.cat || "TAM_THONG";
    if (!groupedPins[cat]) {
      groupedPins[cat] = [];
    }
    groupedPins[cat].push(pin);
  });

  let tocHtml = '';
  let bookContentHtml = '';
  let chapterIndex = 1;

  // Duyệt qua từng danh mục theo thứ tự bản đồ
  for (const [cat, meta] of Object.entries(catNames)) {
    const catPins = groupedPins[cat] || [];
    if (catPins.length === 0) continue;

    const chapterId = `chapter-${chapterIndex}`;
    
    // Thêm vào mục lục sidebar
    tocHtml += `<li><a href="#${chapterId}"><span class="ch-num">Chương ${chapterIndex}</span><span class="ch-title">${meta.title}</span></a></li>\n`;

    // Khởi tạo nội dung chương
    let chapterPinsHtml = '';
    catPins.forEach((pin, pinIdx) => {
      const pinId = `pin-${pin.id}`;
      const { problem, solution, action, imageName } = parsePinContent(pin);

      chapterPinsHtml += `
        <div class="pin-section" id="${pinId}">
          <h3 class="pin-title"><span class="pin-num">${chapterIndex}.${pinIdx + 1}</span> ${pin.title}</h3>
          
          <div class="pin-layout-grid">
            <!-- Cột 1: Thông tin trị liệu khoa học -->
            <div class="pin-info-col">
              <div class="section-box problem-box">
                <span class="box-label"><i class="fa-solid fa-triangle-exclamation"></i> 🛑 Vấn Đề (Vết Nghẽn)</span>
                <p>${problem}</p>
              </div>

              <div class="section-box solution-box">
                <span class="box-label"><i class="fa-solid fa-hand-holding-heart"></i> 🔑 Giải Pháp (Trị Liệu)</span>
                <p>${solution}</p>
              </div>

              <div class="section-box action-box">
                <span class="box-label"><i class="fa-solid fa-leaf"></i> 🌱 Hành Động Duy Trì (Để không lặp lại)</span>
                <p>${action}</p>
              </div>
            </div>

            <!-- Cột 2: Hình ảnh minh họa sinh động của chị Dương -->
            <div class="pin-image-col">
              <div class="illustration-card">
                <img src="./data/daily_posts/${imageName}" alt="${pin.title}" class="illust-img">
                <div class="illust-caption">Hình minh họa kỹ thuật thực hành</div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    // Thêm nội dung chương vào sách
    bookContentHtml += `
      <section class="chapter" id="${chapterId}">
        <div class="chapter-header">
          <span class="chapter-badge">Chương ${chapterIndex}</span>
          <h2>${meta.title}</h2>
          <p class="chapter-intro-desc">${meta.desc}</p>
        </div>
        <div class="chapter-body">
          ${chapterPinsHtml}
        </div>
      </section>
    `;

    chapterIndex++;
  }

  // HTML Template sang trọng giống tạp chí
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cẩm Nang Tam Thông Dưỡng Nhan — Thùy Dương Spa</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --color-primary: #113628;      /* Deep Emerald Green */
      --color-primary-light: #f1f6f3;
      --color-secondary: #c5a059;    /* Gold */
      --color-text-dark: #2c3531;
      --color-bg-light: #faf8f5;
      --color-border: #e8e2d9;
      --font-header: 'Playfair Display', serif;
      --font-body: 'Montserrat', sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: #f6f1ea;
      font-family: var(--font-body);
      color: var(--color-text-dark);
      line-height: 1.8;
      font-size: 16px;
      display: flex;
    }

    /* Sidebar Navigation */
    .sidebar {
      width: 320px;
      height: 100vh;
      background-color: var(--color-primary);
      color: #fff;
      position: fixed;
      left: 0;
      top: 0;
      overflow-y: auto;
      padding: 2.5rem 1.5rem;
      border-right: 3px solid var(--color-secondary);
      z-index: 100;
    }

    .sidebar-brand {
      text-align: center;
      margin-bottom: 2.5rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .sidebar-brand h1 {
      font-family: var(--font-header);
      font-size: 1.6rem;
      color: var(--color-secondary);
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
    }

    .sidebar-brand p {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 3px;
    }

    .toc-title {
      font-size: 0.8rem;
      color: var(--color-secondary);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 1.2rem;
      font-weight: 700;
    }

    .toc-list {
      list-style: none;
    }

    .toc-list li {
      margin-bottom: 0.9rem;
    }

    .toc-list a {
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      font-size: 0.88rem;
      display: block;
      padding: 0.6rem 0.8rem;
      border-radius: 8px;
      transition: all 0.25s;
      border-left: 2px solid transparent;
    }

    .toc-list a:hover {
      color: #fff;
      background-color: rgba(255,255,255,0.05);
      border-left-color: var(--color-secondary);
      padding-left: 1.2rem;
    }

    .toc-list .ch-num {
      display: block;
      font-size: 0.7rem;
      color: var(--color-secondary);
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 0.15rem;
    }

    .toc-list .ch-title {
      font-weight: 500;
    }

    /* Main Content Area */
    .content-area {
      margin-left: 320px;
      flex: 1;
      padding: 4rem 5rem;
      max-width: 1300px;
    }

    /* Cover Page Section */
    .cover-page {
      background: linear-gradient(135deg, var(--color-primary), #0a241b);
      color: #fff;
      padding: 8rem 4rem;
      border-radius: 24px;
      border: 3px solid var(--color-secondary);
      text-align: center;
      position: relative;
      overflow: hidden;
      margin-bottom: 5rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.18);
    }

    .cover-page::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border: 2px dashed rgba(197, 160, 89, 0.25);
      margin: 1.8rem;
      border-radius: 16px;
      pointer-events: none;
    }

    .cover-title {
      font-family: var(--font-header);
      font-size: 3.2rem;
      color: var(--color-secondary);
      margin-bottom: 1.8rem;
      line-height: 1.3;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-subtitle {
      font-size: 1.3rem;
      color: #e2e8f0;
      font-weight: 300;
      max-width: 800px;
      margin: 0 auto 4rem;
      line-height: 1.6;
      letter-spacing: 0.5px;
    }

    .cover-author {
      font-size: 1.1rem;
      letter-spacing: 4px;
      text-transform: uppercase;
      font-weight: 600;
      color: #fff;
      display: inline-block;
      border-bottom: 2px solid var(--color-secondary);
      padding-bottom: 0.6rem;
    }

    /* Chapter Layout */
    .chapter {
      background-color: var(--color-bg-light);
      border-radius: 20px;
      border: 1px solid var(--color-border);
      padding: 3.5rem;
      margin-bottom: 5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.02);
    }

    .chapter-header {
      border-bottom: 2px solid var(--color-secondary);
      padding-bottom: 1.8rem;
      margin-bottom: 3rem;
    }

    .chapter-badge {
      display: inline-block;
      background-color: var(--color-secondary);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.3rem 0.9rem;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 0.8rem;
    }

    .chapter-header h2 {
      font-family: var(--font-header);
      font-size: 2.2rem;
      color: var(--color-primary);
      margin-bottom: 0.6rem;
    }

    .chapter-intro-desc {
      color: #64748b;
      font-size: 1rem;
      font-style: italic;
    }

    /* Pin Sections Layout */
    .pin-section {
      padding: 3rem 0;
      border-bottom: 1px solid var(--color-border);
    }

    .pin-section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .pin-title {
      font-family: var(--font-header);
      font-size: 1.5rem;
      color: var(--color-primary);
      font-weight: 700;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .pin-num {
      background-color: var(--color-secondary);
      color: #fff;
      font-size: 0.9rem;
      width: 54px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      font-weight: 700;
    }

    /* 2-Column Grid Layout for Content and Image */
    .pin-layout-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
    }

    @media (min-width: 992px) {
      .pin-layout-grid {
        grid-template-columns: 1.3fr 1fr; /* Text on left, Image on right */
      }
    }

    /* Section Boxes */
    .section-box {
      background-color: #fff;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.01);
      transition: all 0.3s;
    }

    .section-box:hover {
      box-shadow: 0 6px 18px rgba(0,0,0,0.03);
      transform: translateY(-2px);
    }

    .box-label {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 0.6rem;
    }

    .problem-box {
      border-left: 5px solid #e53e3e; /* Red border for problem */
    }
    .problem-box .box-label {
      color: #e53e3e;
    }

    .solution-box {
      border-left: 5px solid var(--color-secondary); /* Gold border for solution */
    }
    .solution-box .box-label {
      color: var(--color-secondary);
    }

    .action-box {
      border-left: 5px solid var(--color-primary); /* Green border for action */
      margin-bottom: 0;
    }
    .action-box .box-label {
      color: var(--color-primary);
    }

    .section-box p {
      font-size: 0.95rem;
      color: #4a5568;
      text-align: justify;
    }

    /* Image Column Illustration Card */
    .pin-image-col {
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }

    .illustration-card {
      background-color: #fff;
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 1.2rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.04);
      text-align: center;
    }

    .illust-img {
      width: 100%;
      height: auto;
      aspect-ratio: 2/3;
      object-fit: cover;
      border-radius: 10px;
      border: 1px solid var(--color-border);
      margin-bottom: 1rem;
    }

    .illust-caption {
      font-size: 0.82rem;
      color: #718096;
      font-style: italic;
      font-weight: 500;
    }

    /* Print styling */
    @media print {
      .sidebar { display: none; }
      .content-area { margin-left: 0; padding: 0; }
      .chapter { page-break-after: always; box-shadow: none; border: none; }
    }
  </style>
</head>
<body>

  <aside class="sidebar">
    <div class="sidebar-brand">
      <h1>TAM THÔNG DƯỠNG NHAN</h1>
      <p>Cẩm Nang Toàn Diện</p>
    </div>
    <div class="toc-title">Mục lục sách</div>
    <ul class="toc-list">
      ${tocHtml}
    </ul>
  </aside>

  <main class="content-area">
    <div class="cover-page">
      <h1 class="cover-title">Cẩm Nang Tam Thông Dưỡng Nhan</h1>
      <p class="cover-subtitle">Bản Đồ Trẻ Hóa Tự Nhiên Không Xâm Lấn Từ Gốc Rễ - Tích Hợp Thư Viện Tri Thức 5.000 Pins</p>
      <div class="cover-author">Châu Thị Thùy Dương</div>
    </div>

    ${bookContentHtml}
  </main>

</body>
</html>
`;

  fs.writeFileSync(outputFile, html, 'utf-8');
  console.log(`✅ Ebook generated successfully from Pins at: ${outputFile}`);
}

generateEbookFromPins().catch(err => console.error('Error generating ebook:', err));
