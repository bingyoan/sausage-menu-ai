import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { MenuData } from '../types';
import { TargetLanguage, getTargetCurrency } from '../constants';
import { fetchExchangeRate } from './currencyService';

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
          description: { type: SchemaType.STRING },
          options: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                price: { type: SchemaType.NUMBER }
              }
            }
          },
          dietary_tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
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
    
    TASK 1: OCR ACCURACY (CRITICAL)
    - STRICTLY transcribe text exactly as seen in the image.
    - DO NOT autocorrect names based on common food items.
    
    TASK 2: DUAL PRICING HANDLING
    - Items often have two prices (e.g., $120 regular / $190 double meat).
    - DO NOT create two separate items. Combine them into ONE item.
    - 'price': use the lower/regular price.
    - 'options': put the higher price variant here.
    
    TASK 3: TRANSLATION
    - Translate item names to ${targetLanguage}.
    - Detect Currency and calculate Exchange Rate to ${targetCurrency}.
    
    Return pure JSON.
  `;

  const imageParts = base64Images.map(img => ({
    inlineData: { data: img, mimeType: "image/jpeg" }
  }));

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: menuSchema,
      },
    });
    
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error("No response from AI");

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
      // 確保將翻譯名稱指派給 name，讓 UI 顯示正確
      name: item.translatedName || item.originalName, 
      originalName: item.originalName,
      translatedName: item.translatedName,
      category: item.category || 'General',
      allergy_warning: item.allergy_warning || false,
      dietary_tags: item.dietary_tags || [],
      options: item.options || [],
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
    alert("菜單解析失敗。請確認 API Key 是否正確。");
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
    const result = await model.generateContent(prompt);
    return (await result.response).text();
  } catch (error) {
    return "No explanation.";
  }
};
