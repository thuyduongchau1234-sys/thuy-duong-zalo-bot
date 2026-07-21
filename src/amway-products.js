// ============================================================
// amway-products.js — Amway Products & Pricing Database
// ============================================================

export const AMWAY_PRODUCTS = [
  {
    name: "Nutrilite All Plant Protein Powder (Vị truyền thống 450g)",
    retailPrice: "905.000 VNĐ",
    nppPrice: "823.000 VNĐ",
    category: "Nutrilite Dinh Dưỡng"
  },
  {
    name: "Nutrilite Salmon Omega-3 (120 viên)",
    retailPrice: "858.000 VNĐ",
    nppPrice: "780.000 VNĐ",
    category: "Nutrilite Dinh Dưỡng"
  },
  {
    name: "Nutrilite Double X (Có khay)",
    retailPrice: "1.592.000 VNĐ",
    nppPrice: "1.447.000 VNĐ",
    category: "Nutrilite Dinh Dưỡng"
  },
  {
    name: "Nutrilite Double X (Không khay / Hộp giấy Refill)",
    retailPrice: "1.506.000 VNĐ",
    nppPrice: "1.369.000 VNĐ",
    category: "Nutrilite Dinh Dưỡng"
  },
  {
    name: "Nutrilite Vitamin C Bio C Plus (100 viên)",
    retailPrice: "460.000 VNĐ",
    nppPrice: "418.000 VNĐ",
    category: "Nutrilite Dinh Dưỡng"
  },
  {
    name: "Nutrilite Calcium Magnesium (90 viên)",
    retailPrice: "422.000 VNĐ",
    nppPrice: "384.000 VNĐ",
    category: "Nutrilite Dinh Dưỡng"
  },
  {
    name: "Nutrilite Milk Thistle & Dandelion (Hỗ trợ Gan - 60 viên)",
    retailPrice: "968.000 VNĐ",
    nppPrice: "880.000 VNĐ",
    category: "Nutrilite Dinh Dưỡng"
  },
  {
    name: "Kem đánh răng Glister Multi-Action (200g)",
    retailPrice: "153.000 VNĐ",
    nppPrice: "139.000 VNĐ",
    category: "Glister Chăm Sóc Răng Miệng"
  },
  {
    name: "Xịt thơm miệng Glister (14ml)",
    retailPrice: "154.000 VNĐ",
    nppPrice: "140.000 VNĐ",
    category: "Glister Chăm Sóc Răng Miệng"
  },
  {
    name: "Nước rửa chén Amway Home Dish Drops (1L)",
    retailPrice: "218.000 VNĐ",
    nppPrice: "198.000 VNĐ",
    category: "Amway Home Chăm Sóc Gia Đình"
  },
  {
    name: "Nước giặt đậm đặc Amway Home SA8 (1L)",
    retailPrice: "297.000 VNĐ",
    nppPrice: "270.000 VNĐ",
    category: "Amway Home Chăm Sóc Gia Đình"
  },
  {
    name: "Nước lau đa năng Amway Home L.O.C (1L)",
    retailPrice: "185.000 VNĐ",
    nppPrice: "168.000 VNĐ",
    category: "Amway Home Chăm Sóc Gia Đình"
  },
  {
    name: "Sữa rửa mặt Artistry Skin Nutrition Foaming Cleanser (125g)",
    retailPrice: "780.000 VNĐ",
    nppPrice: "709.000 VNĐ",
    category: "Artistry Chăm Sóc Da"
  },
  {
    name: "Nước cân bằng Artistry Skin Nutrition Toner (200ml)",
    retailPrice: "850.000 VNĐ",
    nppPrice: "773.000 VNĐ",
    category: "Artistry Chăm Sóc Da"
  },
  {
    name: "Kem dưỡng ẩm Artistry Skin Nutrition Cream (50g)",
    retailPrice: "1.150.000 VNĐ",
    nppPrice: "1.045.000 VNĐ",
    category: "Artistry Chăm Sóc Da"
  }
];

export const getAmwayProductsPromptSection = () => {
  let section = `\n\n## BẢNG GIÁ SẢN PHẨM AMWAY (BẮT BUỘC CUNG CẤP CẢ HAI GIÁ KHI ĐƯỢC HỎI)\n`;
  section += `Khi khách hàng hỏi giá của bất kỳ sản phẩm Amway nào, bạn BẮT BUỘC phải báo cả hai loại giá:\n`;
  section += `1. **Giá bán lẻ khuyến nghị (GBL)**\n`;
  section += `2. **Giá Nhà phân phối / Thành viên (NPP)**\n\n`;
  section += `Dưới đây là danh sách sản phẩm và giá chính xác từ hệ thống:\n`;
  
  AMWAY_PRODUCTS.forEach(p => {
    section += `- **${p.name}**: Giá Bán Lẻ (GBL): **${p.retailPrice}** | Giá Nhà Phân Phối (NPP): **${p.nppPrice}**\n`;
  });
  
  section += `\n*(Lưu ý: Nếu khách hỏi sản phẩm Amway nào khác ngoài danh sách trên, hãy báo giá xấp xỉ dựa trên hiểu biết của bạn hoặc khuyên họ nhắn trực tiếp chị Thùy Dương để được báo giá chính xác và hướng dẫn đăng ký mã thành viên để mua giá NPP).*`;
  return section;
};
