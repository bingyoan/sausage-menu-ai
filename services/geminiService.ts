import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"; // ⚡️ 修正點一：改回舊版套件的 SchemaType
import { MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';
import { fetchExchangeRate } from './currencyService';

const menuSchema = {
  type: SchemaType.OBJECT, // ⚡️ 修正點二：使用 SchemaType.OBJECT
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
          translatedName: { type: Type.STRING },
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
  const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();
  const genAI = new GoogleGenerativeAI(cleanApiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite", 
    // ⚡️ 修正點三：舊版套件使用 generationConfig 而非 config
    generationConfig: { 
      responseMimeType: "application/json", 
      responseSchema: menuSchema,
    },
  });

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
    // ⚡️ 修正點四：舊版套件的 generateContent 函式，參數是直接傳遞陣列
    const result = await model.generateContent([prompt, ...imageParts]); 
    const response = await result.response;
    const text = response.text();
    if (!text) throw new Error("No response");

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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const prompt = `Explain "${dishName}" (${originalLang}) in ${targetLang}. 1 short sentence.`;
  try {
    // ⚡️ 修正點五：舊版套件的 generateContent 函式，參數是直接傳遞字串
    const result = await model.generateContent(prompt); 
    return (await result.response).text();
  } catch (error) {
    return "No explanation.";
  }
};
