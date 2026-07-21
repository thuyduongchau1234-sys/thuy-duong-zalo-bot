// ============================================================
// grocery-products.js — Grocery Products Search & Inventory Management
// ============================================================
// Hỗ trợ quản lý sản phẩm, tồn kho và các nghiệp vụ khấu trừ.
// ============================================================

import fs from 'fs';
import path from 'path';

const DATA_DIR = './data';
const STOCK_FILE = path.join(DATA_DIR, 'grocery_stock.json');

// Danh sách sản phẩm mẫu ban đầu với thông tin Tồn kho (Stock)
const DEFAULT_PRODUCTS = [
  { id: "bia_heineken", name: "Bia Heineken (Thùng 24 lon)", price: 435000, stock: 20, minStock: 5, category: "Đồ uống" },
  { id: "bia_tiger", name: "Bia Tiger Xanh (Thùng 24 lon)", price: 385000, stock: 15, minStock: 5, category: "Đồ uống" },
  { id: "coca_cola", name: "Nước ngọt Coca-Cola (Lốc 6 lon)", price: 60000, stock: 30, minStock: 8, category: "Đồ uống" },
  { id: "sua_vinamilk", name: "Sữa tươi Vinamilk có đường (Thùng 48 hộp)", price: 360000, stock: 10, minStock: 3, category: "Sữa & Bỉm" },
  { id: "sua_th_true", name: "Sữa tươi TH True Milk ít đường (Thùng 48 hộp)", price: 395000, stock: 8, minStock: 3, category: "Sữa & Bỉm" },
  { id: "bim_bobby", name: "Bỉm Bobby quần size L (54 miếng)", price: 285000, stock: 12, minStock: 2, category: "Sữa & Bỉm" },
  { id: "gao_st25", name: "Gạo ST25 chuẩn ngon (Túi 5kg)", price: 190000, stock: 25, minStock: 5, category: "Gạo & Nhu yếu phẩm" },
  { id: "dau_an_neptune", name: "Dầu ăn Neptune Light (Chai 1L)", price: 55000, stock: 40, minStock: 10, category: "Gạo & Nhu yếu phẩm" },
  { id: "nuoc_mam_nam_ngu", name: "Nước mắm Nam Ngư (Chai 900ml)", price: 45000, stock: 50, minStock: 15, category: "Gạo & Nhu yếu phẩm" },
  { id: "bot_giat_omo", name: "Bột giặt Omo Matic cửa trước (Túi 3.8kg)", price: 185000, stock: 15, minStock: 4, category: "Hóa mỹ phẩm" },
  { id: "rua_chen_sunlight", name: "Nước rửa chén Sunlight Chanh (Túi 2.1kg)", price: 72000, stock: 18, minStock: 5, category: "Hóa mỹ phẩm" }
];

class InventoryManager {
  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    this.products = this.loadStock();
  }

  // Load tồn kho từ file JSON
  loadStock() {
    try {
      if (fs.existsSync(STOCK_FILE)) {
        const raw = fs.readFileSync(STOCK_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (error) {
      console.error('Lỗi load file tồn kho:', error.message);
    }
    // Nếu chưa có file, tạo file với dữ liệu mặc định
    this.saveStock(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  }

  // Lưu tồn kho xuống file
  saveStock(data) {
    try {
      fs.writeFileSync(STOCK_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Lỗi ghi file tồn kho:', error.message);
    }
  }

  // 1. TÌM KIẾM SẢN PHẨM
  searchProducts(query) {
    if (!query) return [];
    const normalizedQuery = query.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    return this.products.filter(p => {
      const normalizedName = p.name.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return normalizedName.includes(normalizedQuery);
    });
  }

  // 2. KHẤU TRỪ TỒN KHO KHI BÁN HÀNG (Deduction by Sale)
  deductStockBySale(productNameOrId, quantity) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return { success: false, message: "Số lượng khấu trừ không hợp lệ" };

    const product = this.products.find(p => p.id === productNameOrId || p.name.toLowerCase().includes(productNameOrId.toLowerCase()));
    if (!product) {
      return { success: false, message: `Không tìm thấy sản phẩm: ${productNameOrId}` };
    }

    if (product.stock < qty) {
      return { 
        success: false, 
        message: `Không đủ hàng trong kho. Cần khấu trừ: ${qty}, Hiện còn: ${product.stock}`,
        currentStock: product.stock 
      };
    }

    product.stock -= qty;
    this.saveStock(this.products);
    
    // Cảnh báo nếu dưới mức tồn kho tối thiểu (minStock)
    const alertMsg = product.stock <= product.minStock ? `⚠️ CẢNH BÁO: ${product.name} sắp hết hàng (Chỉ còn lại: ${product.stock})` : null;

    return { 
      success: true, 
      message: `Đã khấu trừ thành công ${qty} sản phẩm [${product.name}]. Tồn kho mới: ${product.stock}`,
      currentStock: product.stock,
      alert: alertMsg
    };
  }

  // 3. KHẤU TRỪ HAO HỤT / HỎNG / HẾT HẠN (Deduction by Damage/Expiry)
  deductStockByLoss(productNameOrId, quantity, reason = "Hao hụt") {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return { success: false, message: "Số lượng không hợp lệ" };

    const product = this.products.find(p => p.id === productNameOrId || p.name.toLowerCase().includes(productNameOrId.toLowerCase()));
    if (!product) {
      return { success: false, message: `Không tìm thấy sản phẩm: ${productNameOrId}` };
    }

    // Cho phép trừ âm hoặc chỉ trừ tối đa về 0 tùy lựa chọn (ở đây trừ tối đa về 0)
    const actualDeducted = Math.min(product.stock, qty);
    product.stock -= actualDeducted;
    this.saveStock(this.products);

    // Ghi nhận lịch sử hao hụt vào log riêng biệt
    const logFile = path.join(DATA_DIR, 'loss_logs.json');
    let lossLogs = [];
    if (fs.existsSync(logFile)) {
      try {
        lossLogs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
      } catch (e) {}
    }
    lossLogs.push({
      date: new Date().toISOString(),
      productId: product.id,
      name: product.name,
      quantityDeducted: actualDeducted,
      requestedQuantity: qty,
      reason: reason,
      remainingStock: product.stock
    });
    fs.writeFileSync(logFile, JSON.stringify(lossLogs, null, 2), 'utf-8');

    return { 
      success: true, 
      message: `Đã khấu trừ hao hụt (${reason}) số lượng ${actualDeducted} [${product.name}]. Tồn kho hiện tại: ${product.stock}` 
    };
  }

  // 4. KIỂM KÊ CẬP NHẬT TỒN KHO THỦ CÔNG (Manual Inventory Update)
  updateStockLevel(productNameOrId, newStockLevel) {
    const level = parseInt(newStockLevel, 10);
    if (isNaN(level) || level < 0) return { success: false, message: "Số lượng tồn kho mới phải là số không âm" };

    const product = this.products.find(p => p.id === productNameOrId || p.name.toLowerCase().includes(productNameOrId.toLowerCase()));
    if (!product) {
      return { success: false, message: `Không tìm thấy sản phẩm: ${productNameOrId}` };
    }

    const oldStock = product.stock;
    product.stock = level;
    this.saveStock(this.products);

    return { 
      success: true, 
      message: `Đã cập nhật tồn kho sản phẩm [${product.name}]: Từ ${oldStock} ➔ ${level}` 
    };
  }

  // 5. BÁO CÁO CÁC MẶT HÀNG SẮP HẾT (Low Stock Report)
  getLowStockReport() {
    const lowStockItems = this.products.filter(p => p.stock <= p.minStock);
    if (lowStockItems.length === 0) return "✅ Tất cả các mặt hàng đều đủ số lượng tồn kho an toàn.";
    
    let report = `⚠️ DANH SÁCH MẶT HÀNG SẮP HẾT HÀNG (CẦN NHẬP THÊM):\n`;
    lowStockItems.forEach(p => {
      report += `- **${p.name}**: Tồn kho hiện tại: **${p.stock}** (Mức an toàn tối thiểu: ${p.minStock})\n`;
    });
    return report;
  }
}

export default new InventoryManager();
