// types.ts

// --- AI 模型相關設定 ---

// 定義支援的 AI 模型 ID，這裡強制包含你指定的 2.5 flash lite
export type AIModelId = 'gemini-2.5-flash-lite' | 'gemini-1.5-flash' | 'gemini-1.5-pro';

export interface AIConfig {
  model: AIModelId; // 預設將會使用 'gemini-2.5-flash-lite'
  temperature?: number;
  maxOutputTokens?: number;
}

// --- 菜單與訂單相關 ---

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  // 如果有圖片生成的欄位
  imageUrl?: string; 
  // 如果有 AI 分析後的標籤（例如：推薦指數、口味分析）
  aiTags?: string[]; 
}

export interface OrderItem extends MenuItem {
  quantity: number;
  notes?: string; // 客製化備註
}

export interface Order {
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string; // ISO string
}

// --- API 請求與回應 (針對 AI 功能) ---

// 這是發送給後端/API 的請求結構
export interface MenuAnalysisRequest {
  model: AIModelId;
  prompt: string;
  // 可以加入當前的菜單內容供 AI 參考
  menuContext?: MenuItem[]; 
}

// 這是 AI 回傳的結構 (假設我們讓它回傳 JSON 或特定格式)
export interface MenuAnalysisResponse {
  success: boolean;
  data?: {
    suggestion: string;
    recommendedPairings?: string[]; // 推薦搭配
    estimatedWaitTime?: string;
  };
  error?: string;
}
