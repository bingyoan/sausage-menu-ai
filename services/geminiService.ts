import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
// 注意：TargetLanguage 改從 constants 引入，MenuData 從 types 引入
import { MenuData } from '../types';
import { TargetLanguage, getTargetCurrency } from '../constants';
import { fetchExchangeRate } from './currencyService';

// 1. 修改資料結構 (Schema) - 支援雙價格與變體
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
          price: { type: SchemaType.NUMBER }, // 主價格
          category: { type: SchemaType.STRING },
          allergy_warning: { type: SchemaType.BOOLEAN },
          description: { type: SchemaType.STRING },
          // 新增 options 欄位 (如：雙倍肉、大杯)
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
  // 簡單清理 API Key
  const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();
  const genAI = new GoogleGenerativeAI(cleanApiKey);
  
  const targetCurrency = getTargetCurrency(targetLanguage);
  
  // 2. 優化 Prompt - 針對 Gemini 2.5 Flash Lite 的指令
  const prompt = `
    Analyze ${base64Images.length} menu image(s).
    
    TASK 1: OCR ACCURACY (CRITICAL)
    - STRICTLY transcribe text exactly as seen in the image.
    - DO NOT autocorrect names based on common food items.
    - Example: If image says "金菊", output "金菊", NOT "金菇".
    
    TASK 2: DUAL PRICING HANDLING
    - Items often have two prices (e.g., $120 regular / $190 double meat).
    - DO NOT create two separate items. Combine them into ONE item.
    - 'price': use the lower/regular price (e.g., 120).
    - 'options': put the higher price variant here (name: "雙倍肉", price: 190).
    
    TASK 3: TRANSLATION
    - Translate item names to ${targetLanguage}.
    - Detect Currency and calculate Exchange Rate to ${targetCurrency}.
    
    Return pure JSON.
  `;

  const imageParts = base64Images.map(img => ({
    inlineData: { data: img, mimeType: "image/jpeg" }
  }));

  try {
    // 3. 呼叫模型 - 指定 gemini-2.5-flash-lite
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", // ⚡️ 指定 Lite 模型
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
      category: item.category || 'General',
      allergy_warning: item.allergy_warning || false,
      dietary_tags: item.dietary_tags || [],
      options: item.options || [], // 確保 options 存在
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
  // ⚡️ 指定 Lite 模型
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  
  const prompt = `Explain "${dishName}" (${originalLang}) in ${targetLang}. 1 short sentence.`;
  
  try {
    const result = await model.generateContent(prompt);
    return (await result.response).text();
  } catch (error) {
    return "No explanation.";
  }
};
