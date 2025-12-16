// src/types.ts
import { TargetLanguage } from './constants';

// --- 基礎資料結構 ---
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  aiTags?: string[];
}

// 扁平化結構：直接繼承 MenuItem 並加上 quantity
export interface CartItem extends MenuItem {
  quantity: number;
}

// 定義 Cart 為 CartItem 的陣列
export type Cart = CartItem[];

// OrderItem 是 CartItem 的別名 (為了相容你的 OrderingPage)
export type OrderItem = CartItem; 

export interface MenuData {
  items: MenuItem[];
  originalCurrency?: string;
  targetCurrency?: string;
  exchangeRate?: number;
  detectedLanguage?: string; // 加入這個欄位解決 geminiService 錯誤
}

// --- 應用程式狀態 ---
// 這裡定義所有可能的頁面狀態
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
