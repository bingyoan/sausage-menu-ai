import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';

// 定義回傳格式 (Schema) - 包含 AI 新增的過敏原欄位
const menuSchema = {
  type: SchemaType.OBJECT,
  properties: {
    originalCurrency: { type: SchemaType.STRING, description: "The currency code found on the menu (e.g., JPY, EUR, USD)." },
    exchangeRate: { type: SchemaType.NUMBER, description: "Estimated exchange rate: 1 unit of Menu Currency = X units of User's Target Currency." },
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
  
  // 1. 清洗 Key
  const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();

  // 2. 初始化 SDK
  const genAI = new GoogleGenerativeAI(cleanApiKey);
  
  // 3. 指定模型：改用 "gemini-2.5-flash-lite"
  // 1.5 Flash 已於 2025/9 退役，2.5 Flash 額度太少(20次)。
  // 2.5 Flash-Lite 是 Google 官方推薦的高流量替代品。
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
      originalCurrency: parsed.originalCurrency || '???',
      targetCurrency: targetCurrency,
      exchangeRate: parsed.exchangeRate || 1,
      detectedLanguage: parsed.detectedLanguage || 'Unknown'
    };

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    // 錯誤處理：如果連 Lite 都 404，提示用戶檢查 Key 權限
    const errStr = String(error);
    if (errStr.includes("404")) {
       throw new Error("找不到模型，請確認您的 API Key 是否支援 Gemini 2.5 Flash-Lite");
    }
    if (errStr.includes("429")) {
       throw new Error("使用額度已滿，請稍後再試。");
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
  // 解說部分也改用 Lite
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