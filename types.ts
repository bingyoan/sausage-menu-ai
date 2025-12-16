// types.ts
import { TargetLanguage } from './constants';

// --- 基礎資料結構 ---
export interface MenuItem {
  id: string;
  name: string;           // 顯示名稱 (主要 UI 用)
  price: number;          // 主價格
  category: string;
  description?: string;
  aiTags?: string[];
  
  // --- 來自 AI 分析的額外欄位 ---
  originalName?: string;  // 原文菜名
  translatedName?: string;// 翻譯後菜名
  allergy_warning?: boolean;
  dietary_tags?: string[];
  
  // 雙價格與變體支援 (例如: 正常 $120 / 加大 $150)
  options?: { 
    name: string; 
    price: number; 
  }[];
}

// 扁平化結構：直接繼承 MenuItem 並加上 quantity
export interface CartItem extends MenuItem {
  quantity: number;
}

// 定義 Cart 為 CartItem 的陣列
export type Cart = CartItem[];

// OrderItem 是 CartItem 的別名 (為了相容 OrderingPage)
export type OrderItem = CartItem; 

export interface MenuData {
  items: MenuItem[];
  originalCurrency?: string;
  targetCurrency?: string;
  exchangeRate?: number;
  detectedLanguage?: string;
}

// --- 應用程式狀態 ---
export type AppState = 'welcome' | 'ordering' | 'processing' | 'summary' | 'history' | 'settings';

export interface HistoryRecord {
  id: string;
  timestamp: number;
  items: CartItem[];
  totalOriginalPrice: number;
  currency: string;
  summary?: string;
}

// --- AI 相關 ---
export type AIModelId = 'gemini-2.5-flash-lite' | 'gemini-pro' | 'gemini-1.5-pro';

export interface MenuAnalysisRequest {
  model: AIModelId;
  prompt: string;
  menuContext: MenuItem[];
}

export interface MenuAnalysisResponse {
  success: boolean;
  data?: {
    suggestion: string;
    recommendedPairings: string[];
  };
  error?: string;
}
