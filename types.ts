// types.ts

// 1. 修正 MenuData，加入匯率相關欄位
export interface MenuData {
  items: MenuItem[];
  // 新增以下欄位解決 OrderSummary 和 geminiService 的錯誤
  originalCurrency?: string;
  targetCurrency?: string;
  exchangeRate?: number;
}

// 2. 修正 HistoryRecord，補上缺少的欄位
export interface HistoryRecord {
  id: string;
  // 新增以下欄位解決 HistoryPage 的錯誤
  timestamp: number;        // 用於顯示時間
  items: CartItem[];        // 歷史訂單內容
  totalOriginalPrice: number;
  currency: string;
  summary?: string;         // AI 生成的摘要 (如果有)
}

// 3. 確保 CartItem 結構正確
// 根據之前的 OrderingPage，CartItem 應該是 MenuItem + quantity (扁平結構)
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  aiTags?: string[];
}

export interface CartItem extends MenuItem {
  quantity: number;
}

// 4. 定義 AppState (解決 App.tsx 錯誤)
// 如果你只是用字串切換頁面，可以直接定義為字串聯集
export type AppState = 'ordering' | 'history' | 'settings'; 
// 或者如果你原本是 enum，請確保用 enum
