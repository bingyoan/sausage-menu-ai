// components/OrderingPage.tsx

import React, { useState } from 'react';

// 修改這裡：從 './types' 改為 '../types'
// 注意：我也補上了 CartItem 或是其他你可能需要的舊型別
import { 
  MenuItem, 
  OrderItem, 
  AIModelId, 
  MenuAnalysisRequest,
  MenuAnalysisResponse 
} from '../types'; 

// ... (後面的程式碼保持不變)

// 模擬一些菜單資料 (實際專案可能是從 API 撈取)
const MOCK_MENU: MenuItem[] = [
  { id: '1', name: '經典牛肉堡', price: 150, category: 'Main', aiTags: ['高蛋白'] },
  { id: '2', name: '松露薯條', price: 80, category: 'Side', aiTags: ['熱銷', '素食可'] },
  { id: '3', name: '冰檸檬茶', price: 50, category: 'Drink' },
];

const OrderingPage: React.FC = () => {
  // --- State 管理 ---
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  // 2. 設定預設模型為 gemini-2.5-flash-lite
  const [selectedModel] = useState<AIModelId>('gemini-2.5-flash-lite');
  
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- 處理加入購物車邏輯 (簡化版) ---
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // --- 3. 核心功能：呼叫 Gemini 2.5 Flash Lite ---
  const handleAskAI = async () => {
    setIsAiLoading(true);
    setAiSuggestion(null);

    try {
      // 準備發送給後端的資料結構
      const requestPayload: MenuAnalysisRequest = {
        model: selectedModel, // 這裡確保是用 gemini-2.5-flash-lite
        prompt: "根據我目前的購物車內容，推薦一杯適合的飲料，並說明原因。",
        menuContext: MOCK_MENU, // 讓 AI 知道有哪些菜可以選
      };

      console.log('正在呼叫模型:', requestPayload.model);

      // --- 模擬 API 呼叫 (這裡之後會替換成真實的 fetch/axios) ---
      // const response = await fetch('/api/analyze-order', { ... });
      
      // 這裡先模擬 AI 的回應
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      const mockResponse: MenuAnalysisResponse = {
        success: true,
        data: {
          suggestion: `使用模型 (${selectedModel}) 分析：既然您點了經典牛肉堡，推薦搭配「冰檸檬茶」來解膩，清爽的口感能平衡漢堡的油脂。`,
          recommendedPairings: ['冰檸檬茶']
        }
      };
      // -----------------------------------------------------------

      if (mockResponse.success && mockResponse.data) {
        setAiSuggestion(mockResponse.data.suggestion);
      }

    } catch (error) {
      console.error("AI Analysis failed", error);
      setAiSuggestion("抱歉，AI 目前忙線中，請稍後再試。");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">智慧點餐系統</h1>
        <p className="text-sm text-gray-500">
          目前 AI 模型: <span className="font-mono bg-gray-100 px-1 rounded">{selectedModel}</span>
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左側：菜單列表 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">菜單</h2>
          <ul className="space-y-4">
            {MOCK_MENU.map(item => (
              <li key={item.id} className="flex justify-between items-center border p-3 rounded hover:bg-gray-50">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">${item.price}</div>
                </div>
                <button 
                  onClick={() => addToCart(item)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  加入
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 右側：購物車與 AI 建議 */}
        <div className="bg-gray-50 p-4 rounded-lg h-fit">
          <h2 className="text-xl font-semibold mb-4">您的訂單</h2>
          {cart.length === 0 ? (
            <p className="text-gray-400">購物車是空的</p>
          ) : (
            <ul className="space-y-2 mb-6">
              {cart.map(item => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>${item.price * item.quantity}</span>
                </li>
              ))}
            </ul>
          )}

          <hr className="my-4"/>

          {/* AI 功能區塊 */}
          <div className="mt-4">
            <button
              onClick={handleAskAI}
              disabled={isAiLoading || cart.length === 0}
              className={`w-full py-2 rounded font-medium transition-colors ${
                isAiLoading || cart.length === 0
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isAiLoading ? 'AI 正在思考中...' : '🔮 請 AI 推薦搭配飲料'}
            </button>

            {aiSuggestion && (
              <div className="mt-4 p-3 bg-purple-100 text-purple-900 rounded border border-purple-200 text-sm animate-fade-in">
                <strong>💡 建議：</strong>
                <p className="mt-1">{aiSuggestion}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderingPage;
