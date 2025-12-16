import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"; // <--- 關鍵在這裡！改成這個才對
import { MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';
import { fetchExchangeRate } from './currencyService';

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
  
  // 1. 強力清洗 Key (移除所有看不到的怪異符號)
  const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();

  // 🕵️‍♂️ Debug: 印出 Key 的前幾碼
  console.log("正在使用 API Key:", cleanApiKey.substring(0, 8) + "******");

  // 2. 初始化 SDK (使用 @google/generative-ai)
  const genAI = new GoogleGenerativeAI(cleanApiKey);

  // 3. 指定使用 "gemini-2.5-flash" (最穩定版本)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", 
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: menuSchema,
    },
    systemInstruction: "You are a fast OCR and translation engine. Extract menu items from the images. Merge duplicates. Group by category. Translate names. Return JSON immediately."
  });

  const targetCurrency = getTargetCurrency(targetLanguage);

  const prompt = `
    You are a menu parser. Analyze ${base64Images.length} menu image(s) and extract ALL menu items.
    
    For each item, provide:
    - originalName: exact name from menu
    - translatedName: translation to ${targetLanguage}
    - price: numeric value (tax-inclusive)
    - category: food category
    - allergy_warning: true if contains common allergens
    - dietary_tags: array of tags like ["vegetarian", "spicy", etc]
    - description: brief description
    
    Also detect:
    - originalCurrency: currency code (e.g., JPY, USD, EUR)
    - exchangeRate: estimated rate to ${targetCurrency}
    - detectedLanguage: language of the menu
    
    Return ONLY valid JSON in this exact format:
    {
      "originalCurrency": "JPY",
      "exchangeRate": 0.22,
      "detectedLanguage": "Japanese",
      "items": [
        {
          "originalName": "寿司",
          "translatedName": "Sushi",
          "price": 1200,
          "category": "Seafood",
          "allergy_warning": true,
          "dietary_tags": ["seafood"],
          "description": "Fresh raw fish"
        }
      ]
    }
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
    inlineData: {
      data: img,
      mimeType: "image/jpeg"
    }
  }));

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });
    
    // 正確的參數格式:陣列形式
    const result = await model.generateContent([prompt, ...imageParts]); 
    const response = result.response;
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error("No response from Gemini API");
    
    // 清理可能的 markdown 標記
    let textToParse = text.trim();
    if (textToParse.startsWith('```json')) {
      textToParse = textToParse.substring(7);
    }
    if (textToParse.startsWith('```')) {
      textToParse = textToParse.substring(3);
    }
    if (textToParse.endsWith('```')) {
      textToParse = textToParse.substring(0, textToParse.length - 3);
    }
    textToParse = textToParse.trim();
    
    const parsed = JSON.parse(textToParse);
    
    // 驗證必要欄位
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error("Invalid response format: missing items array");
    }
    
    const detectedCurrency = parsed.originalCurrency || 'JPY';
    const realExchangeRate = await fetchExchangeRate(detectedCurrency, targetCurrency);
    const finalExchangeRate = realExchangeRate || parsed.exchangeRate || 0.22;
    

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
      originalCurrency: detectedCurrency,
      originalCurrency: parsed.originalCurrency || '???',
      targetCurrency: targetCurrency,
      exchangeRate: finalExchangeRate,
      exchangeRate: parsed.exchangeRate || 1,
      detectedLanguage: parsed.detectedLanguage || 'Unknown'
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
    console.error("Gemini Parse Error:", error);
    throw new Error(`AI 連線失敗: ${error}`);
  }
};

@@ -120,19 +104,22 @@ export const explainDish = async (
  originalLang: string,
  targetLang: TargetLanguage
): Promise<string> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash"
  });
  
  const prompt = `Explain the dish "${dishName}" (originally in ${originalLang}) in ${targetLang}. Provide a brief, one-sentence explanation focusing on the main ingredients and cooking method.`;

  const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();
  const genAI = new GoogleGenerativeAI(cleanApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Explain dish "${dishName}" (${originalLang}) in ${targetLang}. 
    1 short sentence. Fun & appetizing.
  `;

  try {
    const result = await model.generateContent(prompt); 
    const response = result.response;
    return response.text();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "No explanation available.";
  } catch (error) {
    console.error("Explain dish error:", error);
    return "No explanation available.";
    console.error("Gemini Explain Error:", error);
    return "Could not load explanation.";
  }
};
};
