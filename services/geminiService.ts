import { GoogleGenerativeAI } from "@google/generative-ai";
import { MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';
import { fetchExchangeRate } from './currencyService';

// 使用字串定義 schema,兼容所有版本
const menuSchema = {
  type: "object",
  properties: {
    originalCurrency: { type: "string" },
    exchangeRate: { type: "number" },
    detectedLanguage: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          originalName: { type: "string" },
          translatedName: { type: "string" },
          price: { type: "number" },
          category: { type: "string" },
          allergy_warning: { type: "boolean" },
          dietary_tags: { type: "array", items: { type: "string" } },
          description: { type: "string" }
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
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: menuSchema,
      },
    });
    
    const result = await model.generateContent([prompt, ...imageParts]); 
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error("No response");
    
    const textToParse = text.startsWith('```json') 
      ? text.substring(7, text.length - 3).trim() 
      : text.trim();
    
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
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const prompt = `Explain "${dishName}" (${originalLang}) in ${targetLang}. 1 short sentence.`;
  
  try {
    const result = await model.generateContent(prompt); 
    return (await result.response).text();
  } catch (error) {
    return "No explanation.";
  }
};
