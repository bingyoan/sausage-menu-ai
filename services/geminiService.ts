import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';
import { fetchExchangeRate } from './currencyService';

// ⚡️ 鎖定使用您指定的 Flash Lite 模型
const MODEL_NAME = "gemini-2.5-flash-lite";

// 定義 JSON 輸出的結構
const menuSchema = {
  type: SchemaType.OBJECT,
  properties: {
    originalCurrency: { type: SchemaType.STRING },
    exchangeRate: { type: SchemaType.NUMBER },
    detectedLanguage: { type: SchemaType.STRING },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          originalName: { type: SchemaType.STRING },
          translatedName: { type: SchemaType.STRING },
          price: { type: SchemaType.NUMBER },
          category: { type: SchemaType.STRING },
          allergy_warning: { type: SchemaType.BOOLEAN },
          dietary_tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          description: { type: SchemaType.STRING }
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
  // 1. 清理 API Key
  const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();
  const genAI = new GoogleGenerativeAI(cleanApiKey);
  
  const targetCurrency = getTargetCurrency(targetLanguage);
  
  // 2. 準備 Prompt
  const prompt = `
    Analyze ${base64Images.length} menu image(s).
    Extract items, translate to ${targetLanguage}.
    Detect Currency & Exchange Rate to ${targetCurrency}.
    Price: use TAX-INCLUSIVE.
    Return SINGLE JSON.
  `;

  // 3. 準備圖片資料
  const imageParts = base64Images.map(img => ({
    inlineData: { data: img, mimeType: "image/jpeg" }
  }));

  try {
    // 4. 建立模型實例 (使用 generationConfig)
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: menuSchema,
      },
    });
    
    // 5. 發送請求
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error("No response from AI");

    // 6. 解析 JSON (移除可能的 Markdown 標記)
    const textToParse = text.startsWith('```json') 
      ? text.replace(/^```json\s*/, '').replace(/\s*```$/, '') 
      : text;

    const parsed = JSON.parse(textToParse);
    
    const detectedCurrency = parsed.originalCurrency || 'JPY';
    const realExchangeRate = await fetchExchangeRate(detectedCurrency, targetCurrency);
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
      originalCurrency: detectedCurrency,
      targetCurrency: targetCurrency,
      exchangeRate: finalExchangeRate,
      detectedLanguage: parsed.detectedLanguage || 'Unknown'
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    alert("菜單解析失敗。請確認 API Key 是否正確，或圖片是否清晰。");
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
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  const prompt = `Explain "${dishName}" (${originalLang}) in ${targetLang}. 1 short sentence.`;
  
  try {
    const result = await model.generateContent(prompt);
    return (await result.response).text();
  } catch (error) {
    return "No explanation.";
  }
};
