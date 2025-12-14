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
  
  // 1. 初始化 SDK
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 2. 指定使用最新的 gemini-2.5-flash 模型
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // <--- 這裡改回了 2.5
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: menuSchema,
    },
    systemInstruction: "You are a precise OCR and translation engine. You may receive 1 to 3 images of a single menu. Merge the information into a structured list. Ignore decorative text. Always group items by category. Always prefer tax-inclusive final prices."
  });

  const targetCurrency = getTargetCurrency(targetLanguage);
  
  const prompt = `
    You are a smart menu assistant using the advanced capabilities of Gemini 2.5.
    1. Analyze the provided ${base64Images.length} menu image(s).
    2. Extract all food and drink items from ALL images.
    3. Merge duplicates if the images overlap, but ensure unique items are preserved.
    4. Group them into categories exactly as they appear on the menu (e.g. Appetizers, Mains, Drinks). Use "Main" or "Others" if unclear.
    5. Translate the item names into ${targetLanguage}.
    6. Detect the currency.
    7. **CRITICAL PRICE RULE**: If the menu mentions tax (e.g., "+tax", "tax excluded"), please CALCULATE and provide the final TAX-INCLUSIVE price if possible. If the menu shows both pre-tax and post-tax prices, USE THE POST-TAX (higher) PRICE.
    8. Provide an estimated exchange rate from Menu Currency to ${targetCurrency}.
    9. Return a SINGLE JSON object containing combined data.
  `;

  // 3. 準備圖片資料
  const imageParts = base64Images.map(img => ({
    inlineData: {
      data: img,
      mimeType: "image/jpeg"
    }
  }));

  try {
    // 4. 發送請求
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);

    // 加上唯一 ID
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
  
  const genAI = new GoogleGenerativeAI(apiKey);
  // 解說部分也同步改成 2.5
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Explain the dish "${dishName}" (which is in ${originalLang}).
    Translate the concept and ingredients briefly into ${targetLang}.
    Keep it short (1 sentence), fun, and appetizing.
    Don't just repeat the translation, explain WHAT it is.
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