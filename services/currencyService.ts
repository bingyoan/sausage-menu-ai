// src/services/currencyService.ts

// 這是免費的公開匯率 API
const API_URL = "https://open.er-api.com/v6/latest"; 

export const fetchExchangeRate = async (
  baseCurrency: string, 
  targetCurrency: string
): Promise<number | null> => {
  try {
    // 如果幣別一樣，匯率就是 1
    if (baseCurrency === targetCurrency) return 1;

    // 處理常見縮寫錯誤 (AI 有時候會回傳 JP 或 JPN)
    const normalizedBase = normalizeCurrencyCode(baseCurrency);
    const normalizedTarget = normalizeCurrencyCode(targetCurrency);

    // 抓取匯率
    const response = await fetch(`${API_URL}/${normalizedBase}`);
    const data = await response.json();

    if (data && data.rates && data.rates[normalizedTarget]) {
      console.log(`匯率更新成功: 1 ${normalizedBase} = ${data.rates[normalizedTarget]} ${normalizedTarget}`);
      return data.rates[normalizedTarget];
    }
    
    return null;
  } catch (error) {
    console.error("匯率抓取失敗，將使用 AI 預估值:", error);
    return null;
  }
};

// 簡單的幣別標準化工具
const normalizeCurrencyCode = (code: string): string => {
  const c = code.toUpperCase().trim();
  if (c === 'JP' || c === 'JPN' || c === 'YEN' || c.includes('YEN')) return 'JPY';
  if (c === 'TW' || c === 'TWN' || c === 'NT' || c === 'NTD') return 'TWD';
  if (c === 'US' || c === 'USA') return 'USD';
  if (c === 'EU' || c === 'EURO') return 'EUR';
  if (c === 'KR' || c === 'KOR' || c === 'WON') return 'KRW';
  return c; // 預設直接回傳
};