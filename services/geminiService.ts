import { GoogleGenerativeAI, Type } from "@google/generative-ai"; // ⚡️ 修正點一：在新版中，定義 JSON 結構使用 Type
import { MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';
import { fetchExchangeRate } from './currencyService';

const MODEL_NAME = "gemini-2.5-flash"; // ⚡️ 修正點二：使用您指定的高效能模型

const menuSchema = {
  type: Type.OBJECT, // ⚡️ 修正點三：使用 Type.OBJECT (新寫法)
  properties: {
    originalCurrency: { type: Type.STRING },
    exchangeRate: { type: Type.NUMBER },
    detectedLanguage: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalName: { type: Type.STRING },
          translatedName: { type: Type.STRING },
          price: { type: Type.NUMBER },
          category: { type: Type.STRING },
          allergy_warning: { type: Type.BOOLEAN },
          dietary_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          description: { type: Type.STRING }
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
  
  const targetCurrency = getTargetCurrency(targetLanguage);
  
  const prompt = `
    Analyze ${base64Images.length} menu image(s).
    Extract items, translate to ${targetLanguage}.
    Detect Currency & Exchange Rate to ${targetCurrency}.
    Price: use TAX-INCLUSIVE.
    Return SINGLE JSON.
  `;

  const imageParts = base64Images.map(img => ({
    inlineData: { data: img, mimeType: "image/jpeg" }
  }));

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME, 
      // ⚡️ 修正點四：在新版中，使用 generationConfig 物件包裹 responseSchema
      config: { 
        responseSchema: menuSchema,
        responseMimeType: "application/json", // 新版中這樣指定更嚴格的 JSON 輸出
      },
    });
    
    const result = await model.generateContent({
      contents: [prompt, ...imageParts] // 新版中，generateContent 參數必須是 { contents: [...] }
    });
    
    const response = result.response;
    const text = response.text();
    if (!text) throw new Error("No response");

    // 由於我們使用了 responseMimeType，AI 輸出應該是純 JSON
    const parsed = JSON.parse(text); 
    
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
    alert("菜單解析失敗。請確認您的 API Key，並確保菜單圖片清晰。");
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
    const result = await model.generateContent({ contents: [prompt] }); // 新版寫法
    return result.response.text();
  } catch (error) {
    return "No explanation.";
  }
};
