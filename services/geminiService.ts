import { GoogleGenerativeAI } from "@google/generative-ai";
import { MenuData, TargetLanguage } from '../types';
import { getTargetCurrency } from '../constants';
import { fetchExchangeRate } from './currencyService';

export const parseMenuImage = async (
  apiKey: string,
  base64Images: string[], 
  targetLanguage: TargetLanguage
): Promise<MenuData> => {
  const cleanApiKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();
  const genAI = new GoogleGenerativeAI(cleanApiKey);
  
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
  `;

  const imageParts = base64Images.map(img => ({
    inlineData: { data: img, mimeType: "image/jpeg" }
  }));

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });
    
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
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash"
  });
  
  const prompt = `Explain the dish "${dishName}" (originally in ${originalLang}) in ${targetLang}. Provide a brief, one-sentence explanation focusing on the main ingredients and cooking method.`;
  
  try {
    const result = await model.generateContent(prompt); 
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Explain dish error:", error);
    return "No explanation available.";
  }
};
