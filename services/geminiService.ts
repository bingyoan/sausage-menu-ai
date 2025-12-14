import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MenuItem, MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';

// Schema for the menu parsing response
const menuSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    originalCurrency: { type: Type.STRING, description: "The currency code found on the menu (e.g., JPY, EUR, USD)." },
    exchangeRate: { type: Type.NUMBER, description: "Estimated exchange rate: 1 unit of Menu Currency = X units of User's Target Currency." },
    detectedLanguage: { type: Type.STRING, description: "The primary language detected on the menu." },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalName: { type: Type.STRING },
          translatedName: { type: Type.STRING },
          price: { type: Type.NUMBER, description: "Numeric price value only. If the menu lists tax-inclusive prices, use that." },
          category: { type: Type.STRING, description: "Category found on menu like 'Appetizer', 'Main', 'Drink', or 'Others'" },
        },
        required: ["originalName", "translatedName", "price"],
      },
    },
  },
  required: ["items", "originalCurrency", "exchangeRate", "detectedLanguage"],
};

export const parseMenuImage = async (
  apiKey: string,
  base64Images: string[], // Changed to accept array
  targetLanguage: TargetLanguage
): Promise<MenuData> => {
  
  // Initialize AI with the user's key
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const targetCurrency = getTargetCurrency(targetLanguage);
  
  const prompt = `
    Analyze ${base64Images.length} menu image(s).
    Extract all items, merge duplicates, group by category.
    Translate to ${targetLanguage}.
    Detect currency and provide rate to ${targetCurrency}.
    Use tax-inclusive prices.
    Return JSON.
  `;

  // Prepare parts: text prompt + all images
  const parts: any[] = [{ text: prompt }];
  base64Images.forEach(img => {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
  });

  try {
    // Reverting to gemini-2.5-flash for stability
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: menuSchema,
        systemInstruction: "You are a professional menu translator. Extract items accurately from the provided images."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);

    // Add unique IDs to items
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
  
  // Initialize AI with the user's key
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
    Explain the dish "${dishName}" (which is in ${originalLang}).
    Translate the concept and ingredients briefly into ${targetLang}.
    Keep it short (1 sentence), fun, and appetizing.
    Don't just repeat the translation, explain WHAT it is.
  `;

  try {
    // Keep using 2.5 Flash for explanations as it requires more creativity/nuance
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'text/plain',
      }
    });

    return response.text || "No explanation available.";
  } catch (error) {
    console.error("Gemini Explain Error:", error);
    return "Could not load explanation.";
  }
};