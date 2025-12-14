import React, { useState, useMemo } from 'react';
import { ArrowLeft, ShoppingBag, Receipt, Coins, HelpCircle, Minus, Plus, Loader2 } from 'lucide-react';
import { MenuItem, MenuData, Cart, TargetLanguage, CartItem } from '../types';
import { explainDish } from '../services/geminiService';
import { BoneIcon } from './DachshundAssets';

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
  onBack,
}) => {
  const [showConvertedPrice, setShowConvertedPrice] = useState(true);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

  const handleExplain = async (item: MenuItem) => {
    if (explanations[item.id]) return;

    setLoadingExplanation(item.id);
    const text = await explainDish(apiKey, item.originalName, menuData.detectedLanguage, targetLang);
    setExplanations(prev => ({ ...prev, [item.id]: text }));
    setLoadingExplanation(null);
  };

  const cartValues = Object.values(cart) as CartItem[];

  const totalPrice = cartValues.reduce((sum, cartItem) => {
    return sum + (cartItem.item.price * cartItem.quantity);
  }, 0);

  const totalConverted = totalPrice * menuData.exchangeRate;
  const totalItems = cartValues.reduce((sum, item) => sum + item.quantity, 0);

  // Group items by category
  const groupedItems = useMemo<Record<string, MenuItem[]>>(() => {
    const groups: Record<string, MenuItem[]> = {};
    menuData.items.forEach(item => {
      const cat = item.category || 'Others';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [menuData.items]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="p-2 text-sausage-800 hover:bg-sausage-50 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
            <h2 className="font-bold text-sausage-900 text-lg">Menu</h2>
            <span className="text-xs text-sausage-600 bg-sausage-100 px-2 py-0.5 rounded-full">
                {menuData.items.length} items found
            </span>
        </div>
        
        <button 
            onClick={() => setShowConvertedPrice(!showConvertedPrice)}
            className="flex items-center gap-1 text-xs font-bold bg-sausage-100 text-sausage-800 px-3 py-1.5 rounded-full border border-sausage-200"
        >
            <Coins size={14} />
            {showConvertedPrice ? menuData.targetCurrency : menuData.originalCurrency}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {Object.entries(groupedItems).map(([category, items]: [string, MenuItem[]]) => (
          <div key={category}>
            <h3 className="text-xl font-black text-sausage-800 mb-3 px-1 sticky top-0">{category}</h3>
            <div className="space-y-4">
              {items.map((item) => {
                const cartItem = cart[item.id] as CartItem | undefined;
                const quantity = cartItem?.quantity || 0;
                const priceDisplay = showConvertedPrice 
                  ? `≈ ${(item.price * menuData.exchangeRate).toFixed(0)} ${menuData.targetCurrency}`
                  : `${item.price} ${menuData.originalCurrency}`;

                return (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4 border border-sausage-100 relative overflow-hidden">
                    {/* Decorative Bone Background */}
                    <BoneIcon className="absolute -right-4 -bottom-4 w-20 h-20 text-sausage-50 opacity-50 rotate-12 pointer-events-none"/>

                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div className="flex-1 pr-2">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.originalName}</h3>
                        <p className="text-sausage-700 font-medium text-sm mt-1">{item.translatedName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block font-bold text-sausage-800 bg-sausage-100 px-2 py-1 rounded-lg text-sm whitespace-nowrap">
                          {priceDisplay}
                        </span>
                      </div>
                    </div>

                    {/* AI Explanation Section */}
                    <div className="mb-3 relative z-10">
                      {explanations[item.id] ? (
                        <div className="bg-blue-50 text-blue-800 text-xs p-2 rounded-lg mt-2 border border-blue-100 animate-fadeIn">
                          <span className="font-bold">🐶 AI says:</span> {explanations[item.id]}
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleExplain(item)}
                          disabled={loadingExplanation === item.id}
                          className="text-xs text-sausage-500 flex items-center gap-1 mt-1 hover:text-sausage-700 transition-colors"
                        >
                          {loadingExplanation === item.id ? <Loader2 size={12} className="animate-spin"/> : <HelpCircle size={12} />}
                          What is this?
                        </button>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-end gap-3 mt-3 relative z-10">
                      {quantity > 0 && (
                          <>
                              <button 
                                  onClick={() => onUpdateCart(item.id, -1)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-sausage-100 text-sausage-700 hover:bg-sausage-200 active:bg-sausage-300 transition-colors"
                              >
                                  <Minus size={16} />
                              </button>
                              <span className="font-bold text-lg w-6 text-center">{quantity}</span>
                          </>
                      )}
                      <button 
                          onClick={() => onUpdateCart(item.id, 1)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${quantity > 0 ? 'bg-sausage-100 text-sausage-700' : 'bg-sausage-500 text-white shadow-md'}`}
                      >
                          <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Bar */}
      {totalItems > 0 && (
        <div className="absolute bottom-6 left-4 right-4 z-30">
          <button 
            onClick={onViewSummary}
            className="w-full bg-sausage-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between hover:bg-sausage-800 transition-transform active:scale-95 border-2 border-sausage-700"
          >
            <div className="flex items-center gap-3">
              <div className="bg-sausage-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs text-sausage-200 uppercase font-bold tracking-wider">Total Est.</span>
                <span className="font-bold text-lg">
                    {showConvertedPrice 
                        ? `≈ ${totalConverted.toFixed(0)} ${menuData.targetCurrency}`
                        : `${totalPrice.toFixed(0)} ${menuData.originalCurrency}`
                    }
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-bold text-lg">
              View List <Receipt size={20} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
