// src/components/OrderingPage.tsx
import React, { useState } from 'react';
import { MenuData, Cart, TargetLanguage } from '../types';
import { ShoppingCart, ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import { explainDish } from '../services/geminiService';
import toast from 'react-hot-toast';

interface OrderingPageProps {
  apiKey: string;
  menuData: MenuData;
  cart: Cart;
  targetLang: TargetLanguage;
  onUpdateCart: (itemId: string, delta: number) => void;
  onViewSummary: () => void;
  onBack: () => void;
}

export const OrderingPage: React.FC<OrderingPageProps> = ({
  apiKey,
  menuData,
  cart,
  targetLang,
  onUpdateCart,
  onViewSummary,
  onBack
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [explainingId, setExplainingId] = useState<string | null>(null);

  // 取得所有分類
  const categories = ['All', ...Array.from(new Set(menuData.items.map(i => i.category)))];
  
  // 過濾顯示的菜色
  const displayedItems = selectedCategory === 'All' 
    ? menuData.items 
    : menuData.items.filter(i => i.category === selectedCategory);

  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((sum, item) => sum + (item.item.price * item.quantity), 0);

  const handleExplain = async (item: any) => {
    setExplainingId(item.id);
    try {
      const explanation = await explainDish(apiKey, item.originalName, menuData.detectedLanguage, targetLang);
      toast(explanation, { icon: '🧑‍🍳', duration: 4000 });
    } catch (e) {
      toast.error("無法取得解說");
    } finally {
      setExplainingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* 頂部導航 */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between z-10 sticky top-0">
        <button onClick={onBack} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-lg text-slate-800">點餐中</h2>
        <div className="w-10"></div>
      </div>

      {/* 分類選擇 */}
      <div className="overflow-x-auto p-4 flex gap-2 no-scrollbar bg-white border-b border-slate-100">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 菜單列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {displayedItems.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800">{item.translatedName}</h3>
                <span className="font-medium text-orange-600">
                  {/* 顯示預估台幣價格 */}
                  NT$ {Math.round(item.price * menuData.exchangeRate)}
                </span>
              </div>
              <p className="text-xs text-slate-400">{item.originalName}</p>
              
              {/* ✅ 這裡修正了：使用 description 而不是 shortDescription */}
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {item.allergy_warning && (
                  <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> 過敏注意
                  </span>
                )}
                <button 
                  onClick={() => handleExplain(item)}
                  disabled={explainingId === item.id}
                  className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg flex items-center gap-1 font-medium hover:bg-blue-100"
                >
                  <Info size={12} /> {explainingId === item.id ? '解說中...' : 'AI 食評'}
                </button>
              </div>
            </div>

            {/* 加減按鈕 */}
            <div className="flex flex-col items-center justify-center gap-3 border-l pl-4 border-slate-100">
              <button 
                onClick={() => onUpdateCart(item.id, 1)}
                className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                +
              </button>
              <span className="font-bold text-slate-800 w-6 text-center">
                {cart[item.id]?.quantity || 0}
              </span>
              <button 
                onClick={() => onUpdateCart(item.id, -1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  (cart[item.id]?.quantity || 0) > 0 
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                    : 'bg-slate-50 text-slate-300'
                }`}
              >
                -
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 底部購物車條 */}
      {totalItems > 0 && (
        <div className="absolute bottom-6 left-6 right-6">
          <button 
            onClick={onViewSummary}
            className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                {totalItems}
              </div>
              <span className="font-medium text-slate-200">
                預估 NT$ {Math.round(totalPrice * menuData.exchangeRate)}
              </span>
            </div>
            <div className="flex items-center gap-2 font-bold">
              去結帳 <ShoppingCart size={20} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};