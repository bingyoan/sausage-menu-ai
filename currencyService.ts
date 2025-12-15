// src/services/currencyService.ts

const API_URL = "https://open.er-api.com/v6/latest"; 

export const fetchExchangeRate = async (
  baseCurrency: string, 
  targetCurrency: string
): Promise<number | null> => {
  try {
    // 1. 強力清洗：不管 AI 回傳什麼怪符號，全部轉成標準 ISO 代碼 (如 JPY, THB)
    const normalizedBase = normalizeCurrencyCode(baseCurrency);
    const normalizedTarget = normalizeCurrencyCode(targetCurrency);

    // 如果幣別一樣，不用查
    if (normalizedBase === normalizedTarget) return 1;

    console.log(`[匯率服務] 正在查詢: ${normalizedBase} -> ${normalizedTarget}`);

    // 2. 呼叫免費 API
    const response = await fetch(`${API_URL}/${normalizedBase}`);
    
    if (!response.ok) {
        throw new Error(`API 連線錯誤: ${response.status}`);
    }

    const data = await response.json();

    // 3. 回傳精準匯率
    if (data && data.rates && data.rates[normalizedTarget]) {
      const rate = data.rates[normalizedTarget];
      console.log(`✅ 成功抓取匯率: 1 ${normalizedBase} = ${rate} ${normalizedTarget}`);
      return rate;
    } else {
      console.warn(⚠️ 查無此幣別匯率: ${normalizedTarget}`);
      return null;
    }
    
  } catch (error) {
    console.error("❌ 匯率服務暫時無法使用 (將使用 AI 預估值):", error);
    return null;
  }
};

/**
 * 萬能幣別標準化工具
 * 支援：日、韓、泰、美、歐、英、台
 * 解決：符號(¥,฿)、當地文字(円,원,บาท)、縮寫(JP,KR)
 */
const normalizeCurrencyCode = (code: string): string => {
  if (!code) return 'JPY'; // 預設值

  const c = code.toUpperCase().trim();

  // --- 🇯🇵 日本 (日文) ---
  // 包含: JPY, JP, YEN, ¥, 円, JPN
  if (['JPY', 'JP', 'YEN', '¥', '円'].some(k => c.includes(k))) {
    return 'JPY';
  }

  // --- 🇰🇷 韓國 (韓文) ---
  // 包含: KRW, KR, WON, ₩, 원 (韓元), KOREA
  if (['KRW', 'KR', 'WON', '₩', '원'].some(k => c.includes(k))) {
    return 'KRW';
  }

  // --- 🇹🇭 泰國 (泰文) ---
  // 包含: THB, TH, BAHT, ฿, บาท (泰銖), B
  if (['THB', 'TH', 'BAHT', '฿', 'บาท'].some(k => c.includes(k))) {
    return 'THB';
  }

  // --- 🇪🇺 🇫🇷 🇪🇸 歐洲 (法文/西班牙文) ---
  // 包含: EUR, EU, EURO, €, S
  if (['EUR', 'EU', 'EURO', '€'].some(k => c.includes(k))) {
    return 'EUR';
  }

  // --- 🇺🇸 🇬🇧 英語系國家 ---
  // 美金 (包含 $, USD, US, DOLLAR)
  if (['USD', 'US', 'DOLLAR', '$'].some(k => c.includes(k))) {
    // 特殊判斷：有些符號 $ 通用，優先視為美金，除非有明顯標示其他
    return 'USD';
  }
  // 英鎊 (GBP, UK, POUND, £)
  if (['GBP', 'UK', 'POUND', '£'].some(k => c.includes(k))) {
    return 'GBP';
  }

  // --- 🇹🇼 台灣 (台幣) ---
  // 包含: TWD, TW, NT, NTD, NT$, 元
  // 注意：「元」這個字中日台都用，但通常 AI 辨識繁體中文菜單時指台幣，日文菜單指日幣
  // 這裡做個簡單判斷，如果有 NT 就一定是台幣
  if (['TWD', 'TW', 'NT'].some(k => c.includes(k))) {
    return 'TWD';
  }

  // --- 🇻🇳 越南 (額外贈送，旅遊熱點) ---
  // 包含: VND, DONG, ₫, đ
  if (['VND', 'DONG', '₫', 'đ'].some(k => c.includes(k))) {
    return 'VND';
  }

  // 如果真的都對不上，就回傳原本的代碼讓 API 試試看
  return c.replace(/[^A-Z]/g, ''); // 只保留英文字母
};