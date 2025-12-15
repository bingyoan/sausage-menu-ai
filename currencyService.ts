import { GoogleGenerativeAI } from "@google/generative-ai";

const API_URL = "https://open.er-api.com/v6/latest"; 

export const fetchExchangeRate = async (
  baseCurrency: string, 
  targetCurrency: string
): Promise<number | null> => {
  try {
    const normalizedBase = normalizeCurrencyCode(baseCurrency);
    const normalizedTarget = normalizeCurrencyCode(targetCurrency);

    if (normalizedBase === normalizedTarget) return 1;

    // 使用簡單的 console.log 避免特殊字元問題
    console.log("Checking Rate:", normalizedBase, "->", normalizedTarget);

    const response = await fetch(`${API_URL}/${normalizedBase}`);
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.rates && data.rates[normalizedTarget]) {
      const rate = data.rates[normalizedTarget];
      console.log("Rate found:", rate);
      return rate;
    } else {
      console.warn("Rate not found for:", normalizedTarget);
      return null;
    }
    
  } catch (error) {
    console.error("Currency service error:", error);
    return null;
  }
};

const normalizeCurrencyCode = (code: string): string => {
  if (!code) return 'JPY';

  const c = code.toUpperCase().trim();

  // Japan
  if (c.includes('JPY') || c.includes('JP') || c.includes('YEN') || c.includes('¥') || c.includes('円')) {
    return 'JPY';
  }

  // Korea
  if (c.includes('KRW') || c.includes('KR') || c.includes('WON') || c.includes('₩') || c.includes('원')) {
    return 'KRW';
  }

  // Thailand
  if (c.includes('THB') || c.includes('TH') || c.includes('BAHT') || c.includes('฿') || c.includes('บาท')) {
    return 'THB';
  }

  // Europe
  if (c.includes('EUR') || c.includes('EU') || c.includes('EURO') || c.includes('€')) {
    return 'EUR';
  }

  // USA
  if (c.includes('USD') || c.includes('US') || c.includes('DOLLAR') || c === '$') {
    return 'USD';
  }
  
  // UK
  if (c.includes('GBP') || c.includes('UK') || c.includes('POUND') || c.includes('£')) {
    return 'GBP';
  }

  // Taiwan
  if (c.includes('TWD') || c.includes('TW') || c.includes('NT') || c === '元') {
    return 'TWD';
  }

  // Vietnam
  if (c.includes('VND') || c.includes('DONG') || c.includes('₫') || c.includes('đ')) {
    return 'VND';
  }

  // Fallback: Remove non-alphabet characters
  return c.replace(/[^A-Z]/g, '');
};