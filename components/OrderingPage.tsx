import React, { useState } from 'react';
import { ArrowLeft, ShoppingCart, Sparkles } from 'lucide-react';
import { 
  MenuItem, 
  MenuData, 
  Cart, 
  AIModelId, 
  MenuAnalysisRequest, 
  MenuAnalysisResponse,
  TargetLanguage
} from '../types'; 

// 1. 定義 Props 介面 (解決 App.tsx 的錯誤)
interface OrderingPageProps {
  menuData: MenuData;
  cart: Cart;
  onUpdateCart: (itemId: string, delta: number) => void;
  onViewSummary: () => void;
  onBack: () => void;
  targetLang: TargetLanguage;
}

const OrderingPage: React.FC<OrderingPageProps> = ({
  menuData,
  cart,
  onUpdateCart,
  onViewSummary,
  onBack,
  targetLang
}) => {
  // 2. 移除內部 cart state，改用 props.cart
  
  const [selectedModel] = useState<AIModelId>('gemini-2.5-flash-lite');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 計算購物車總數量
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 取得該項目的數量
  const getItemQuantity = (id: string) => {
    return cart.find(i => i.id === id)?.quantity || 0;
  };

  const handleAskAI = async () => {
    setIsAiLoading(true);
    setAiSuggestion(null);

    try {
      const requestPayload: MenuAnalysisRequest = {
        model: selectedModel,
        prompt: `我是用${targetLang}的顧客。根據我目前的購物車內容，推薦一杯適合的飲料或是配菜，並用一句話說明原因。`,
        menuContext: menuData.items,
      };

      console.log('正在呼叫模型:', requestPayload.model);
      
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      // 這裡簡單模擬回應，實際應呼叫 geminiService
      const mockResponse: MenuAnalysisResponse = {
        success: true,
        data: {
          suggestion: `(AI 模型 ${selectedModel}) 推薦：試試看這家店的招牌飲料，可以平衡口感！`,
          recommendedPairings: []
        }
      };

      if (mockResponse.success && mockResponse.data) {
        setAiSuggestion(mockResponse.data.suggestion);
      }
    } catch (error) {
      console.error("AI Analysis failed", error);
      setAiSuggestion("抱歉，AI 目前忙線中。");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="font-bold text-gray-900 leading-tight">Menu</h1>
                <p className="text-xs text-gray-500">
                    {menuData.items.length} items • {menuData.originalCurrency}
                </p>
            </div>
        </div>
        <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">
            {selectedModel}
        </div>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {menuData.items.map(item => {
            const qty = getItemQuantity(item.id);
            return (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                        {/* 顯示原文名稱 */}
                        {item.originalName && item.originalName !== item.name && (
                            <p className="text-sm text-gray-400">{item.originalName}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    <span className="font-bold text-lg text-sausage-700 whitespace-nowrap">
                        {item.price} <span className="text-xs">{menuData.originalCurrency}</span>
                    </span>
                </div>

                {/* Tags */}
                {item.aiTags && item.aiTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {item.aiTags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Controls */}
                <div className="flex justify-between items-center mt-2">
                    <button 
                        onClick={handleAskAI}
                        className="text-xs flex items-center gap-1 text-purple-600 font-bold px-2 py-1 bg-purple-50 rounded-lg hover:bg-purple-100"
                    >
                        <Sparkles size={12} /> AI Insight
                    </button>

                    {qty === 0 ? (
                        <button 
                            onClick={() => onUpdateCart(item.id, 1)}
                            className="bg-sausage-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-sausage-700 shadow-sm"
                        >
                            Add
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                            <button 
                                onClick={() => onUpdateCart(item.id, -1)}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm font-bold text-gray-600 active:scale-95"
                            >
                                -
                            </button>
                            <span className="font-bold text-gray-900 w-4 text-center">{qty}</span>
                            <button 
                                onClick={() => onUpdateCart(item.id, 1)}
                                className="w-8 h-8 flex items-center justify-center bg-sausage-600 text-white rounded shadow-sm font-bold active:scale-95"
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>
              </div>
            );
        })}
      </div>

      {/* AI Suggestion Popup */}
      {aiSuggestion && (
        <div className="fixed bottom-20 left-4 right-4 bg-purple-900 text-white p-4 rounded-xl shadow-xl z-20 animate-fade-in-up">
            <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold flex items-center gap-2"><Sparkles size={16} /> AI Suggestion</h4>
                <button onClick={() => setAiSuggestion(null)} className="text-purple-300 hover:text-white">✕</button>
            </div>
            <p className="text-sm text-purple-100">{aiSuggestion}</p>
        </div>
      )}

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-30">
            <button 
                onClick={onViewSummary}
                className="w-full bg-sausage-800 text-white p-4 rounded-2xl flex justify-between items-center shadow-lg hover:bg-sausage-900 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-sausage-600 px-3 py-1 rounded-lg font-bold">
                        {totalItems}
                    </div>
                    <span className="font-bold text-lg">View Order</span>
                </div>
                <span className="font-bold text-xl">
                    {totalPrice} {menuData.originalCurrency}
                </span>
            </button>
        </div>
      )}
    </div>
  );
};

export default OrderingPage;
