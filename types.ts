// src/types.ts

export type AppState = 'welcome' | 'processing' | 'ordering' | 'summary' | 'history';

export enum TargetLanguage {
  ChineseTW = 'Traditional Chinese',
  English = 'English',
  Japanese = 'Japanese',
  Korean = 'Korean',
  Thai = 'Thai',
  French = 'French',
  Spanish = 'Spanish',
  German = 'German',
  Vietnamese = 'Vietnamese'
}

export interface MenuItem {
  id: string;
  originalName: string;
  translatedName: string;
  price: number;
  category: string;
  allergy_warning: boolean;
  dietary_tags: string[];
  description: string;
}

export interface MenuData {
  items: MenuItem[];
  originalCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  detectedLanguage: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface Cart {
  [itemId: string]: CartItem;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  items: CartItem[];
  totalOriginalPrice: number;
  currency: string;
}