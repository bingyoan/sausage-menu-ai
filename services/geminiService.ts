import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';
import { fetchExchangeRate } from './currencyService'; // 👈 記得匯入剛剛寫的新服務

// 定義回傳格式 (Schema)
const menuSchema = {
  type: SchemaType.OBJECT,
  properties: {
    originalCurrency: { type: SchemaType.STRING, description: "The currency code found on the menu (e.g., JPY, EUR, USD)." },
    exchangeRate: { type: SchemaType.NUMBER, description: "Just a rough estimate. We will correct this with real API later." }, // 👈 改了描述，告訴 AI 隨便猜就好
    detectedLanguage: { type: SchemaType.STRING, description: "The primary language detected on the menu." },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          originalName: { type: SchemaType.STRING },
          translatedName: { type: SchemaType.STRING },
          price: { type: SchemaType.NUMBER, description: "Numeric price value only. Use tax-inclusive price if available." },
          category: { type: SchemaType.STRING, description: "Category found on menu like 'Appetizer', 'Main', 'Drink', or 'Others'" },
          allergy_warning: { type: SchemaType.BOOLEAN, description: "True if the dish contains common allergens (nuts, dairy, seafood, beef, pork)." },
          dietary_tags: { 
            type: SchemaType.ARRAY, 
            items: { type: SchemaType.STRING },
            description: "Tags like 'Spicy', 'Vegetarian', 'Contains Nuts', 'Contains Beef', 'Contains Pork', 'Seafood'." 
          },
          description: { type: SchemaType.STRING, description: "A short, appetizing description of the dish (texture, taste)." }
        },
        required: ["originalName", "translatedName", "price", "allergy_warning"],
      },
    },
  },
  required: ["items", "originalCurrency", "exchangeRate", "detectedLanguage"],
};

export const parseMenuImage = async (
  apiKey: string,
  base64Images: string[], 
  targetLanguage: TargetLanguage
): Promise<MenuData> => {
  
  const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();
  const genAI = new GoogleGenerativeAI(cleanApiKey);
  
  // 使用 gemini-2.5-flash-lite (目前最穩定的免費大量模型)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite", 
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: menuSchema,
    },
    systemInstruction: `You are a professional menu translator. 
    1. OCR the menu images.
    2. Translate to ${targetLanguage}.
    3. Categorize items.
    4. Identify allergens (Nuts, Dairy, Seafood) and set 'allergy_warning' to true if found.
    5. Generate a short description.`
  });

  const targetCurrency = getTargetCurrency(targetLanguage);
  
  const prompt = `
    TASK: Analyze ${base64Images.length} menu image(s).
    1. Extract items.
    2. Translate to ${targetLanguage}.
    3. Detect Currency & Exchange Rate to ${targetCurrency}.
    4. Price: use TAX-INCLUSIVE.
    5. Return SINGLE JSON.
  `;

  const imageParts = base64Images.map(img => ({
    inlineData: {
      data: img,
      mimeType: "image/jpeg"
    }
  }));

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);

    // 🚀【新增功能】自動修正匯率
    // 1. 拿到 AI 辨識出的幣別 (例如 "JPY")
    const detectedCurrency = parsed.originalCurrency || 'JPY';
    
    // 2. 去問外部 API 真正的匯率
    console.log(`正在抓取即時匯率: ${detectedCurrency} -> ${targetCurrency}`);
    const realExchangeRate = await fetchExchangeRate(detectedCurrency, targetCurrency);

    // 3. 如果抓到了，就覆蓋掉 AI 猜的數字；沒抓到就用 AI 猜的當備案
    const finalExchangeRate = realExchangeRate || parsed.exchangeRate || 0.22;

    const itemsWithIds = parsed.items.map((item: any, index: number) => ({
      ...item,
      id: `item-${index}-${Date.now()}`,
      category: item.category || 'General',
      allergy_warning: item.allergy_warning || false,
      dietary_tags: item.dietary_tags || [],
      description: item.description || ''
    }));

    return {
      items: itemsWithIds,
      originalCurrency: detectedCurrency, // 確保回傳正確的幣別代碼
      targetCurrency: targetCurrency,
      exchangeRate: finalExchangeRate,    // 這裡回傳的一定是精準匯率
      detectedLanguage: parsed.detectedLanguage || 'Unknown'
    };

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    const errStr = String(error);
    if (errStr.includes("429")) {
       throw new Error("今日 AI 使用額度已滿，請稍後再試。");
    }
    throw new Error(`AI 連線失敗: ${error}`);
  }
};

export const explainDish = async (
  apiKey: string,
  dishName: string,
  originalLang: string,
  targetLang: TargetLanguage
): Promise<string> => {
  const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();
  const genAI = new GoogleGenerativeAI(cleanApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `Explain dish "${dishName}" (${originalLang}) in ${targetLang}. 1 short sentence.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "No explanation.";
  } catch (error) {
    return "Could not load explanation.";
  }
};