import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';

// 定義回傳格式 (Schema)
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
        },
        required: ["originalName", "translatedName", "price"],
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
  
  // 🛡️【關鍵修正】清洗 API Key：只保留英文、數字和標準符號
  // 這會自動移除中文、全形空格、換行符號，解決 "non ISO-8859-1" 錯誤
  const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();

  // 檢查清洗後是否為空
  if (!cleanApiKey) {
    throw new Error("Invalid API Key: Contains non-standard characters.");
  }

  // 1. 初始化 SDK (使用清洗後的 Key)
  const genAI = new GoogleGenerativeAI(cleanApiKey);
  
  // 2. 指定使用 "gemini-1.5-flash" (最穩定版本)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", 
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: menuSchema,
    },
    systemInstruction: "You are a fast OCR and translation engine. Extract menu items from the images. Merge duplicates. Group by category. Translate names. Return JSON immediately."
  });

  const targetCurrency = getTargetCurrency(targetLanguage);
  
  const prompt = `
    TASK: Analyze ${base64Images.length} menu image(s).
    1. Extract items (Food/Drink).
    2. Translate to ${targetLanguage}.
    3. Detect Currency & Exchange Rate to ${targetCurrency}.
    4. Price: use TAX-INCLUSIVE if available.
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
    throw error;
  }
};

export const explainDish = async (
  apiKey: string,
  dishName: string,
  originalLang: string,
  targetLang: TargetLanguage
): Promise<string> => {
  
  // 同樣進行清洗
  const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();
  const genAI = new GoogleGenerativeAI(cleanApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Explain dish "${dishName}" (${originalLang}) in ${targetLang}. 
    1 short sentence. Fun & appetizing.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "No explanation available.";
  } catch (error) {
    console.error("Gemini Explain Error:", error);
    return "Could not load explanation.";
  }
};