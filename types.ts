// src/types.ts

// ==========================================
// 1. 舊有的定義 (為了修復其他頁面的報錯)
// ==========================================

// 根據你的錯誤訊息推斷的舊有型別
export type TargetLanguage = 'en' | 'zh' | 'jp' | 'ko'; // 範例語言，可自行增減

// 為了相容舊程式碼，我們讓 MenuData 等同於新的 MenuItem 陣列，或是原本的結構
export interface MenuData {
  items: MenuItem[];
  categories: string[];
}

// 購物車項目 (相容舊版)
export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

// 購物車型別
export type Cart = CartItem[];

// 歷史紀錄
export interface HistoryRecord {
  id: string;
  date: string;
  summary: string;
  total: number;
}

// App 全域狀態
export interface AppState {
  cart: Cart;
  history: HistoryRecord[];
  language: TargetLanguage;
}

// ==========================================
// 2. 新增的 AI 與點餐定義 (我們剛寫的)
// ==========================================

// AI 模型相關設定
export type AIModelId = 'gemini-2.5-flash-lite' | 'gemini-1.5-flash' | 'gemini-1.5-pro';

export interface AIConfig {
  model: AIModelId;
  temperature?: number;
  maxOutputTokens?: number;
}

// 菜單單項
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  imageUrl?: string; 
  aiTags?: string[]; 
}

// 訂單項目 (這跟上面的 CartItem 很像，可以考慮之後合併，現在先保留以防萬一)
export interface OrderItem extends MenuItem {
  quantity: number;
  notes?: string;
}

// API 請求結構
export interface MenuAnalysisRequest {
  model: AIModelId;
  prompt: string;
  menuContext?: MenuItem[]; 
}

// API 回應結構
export interface MenuAnalysisResponse {
  success: boolean;
  data?: {
    suggestion: string;
    recommendedPairings?: string[];
    estimatedWaitTime?: string;
  };
  error?: string;
}
