import React, { useState, useMemo } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingCart, HelpCircle, AlertTriangle, Info, Flame } from 'lucide-react';
import { MenuItem, MenuData, Cart, TargetLanguage, CartItem } from '../types';
import { explainDish } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
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
  onBack,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(menuData.items[0]?.category || 'General');
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

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

  const categories = Object.keys(groupedItems);

  const cartValues = Object.values(cart) as CartItem[];
  const totalPrice = cartValues.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity), 0);
  const totalConverted = totalPrice * menuData.exchangeRate;
  const totalItems = cartValues.reduce((sum, item) => sum + item.quantity, 0);

  const handleExplain = async (item: MenuItem) => {
    if (explanations[item.id]) return;
    setLoadingExplanation(item.id);
    const text = await explainDish(apiKey, item.originalName, menuData.detectedLanguage, targetLang);
    setExplanations(prev => ({ ...prev, [item.id]: text }));
    setLoadingExplanation(null);
  };

  const scrollToCategory = (cat: string) => {
      setActiveCategory(cat);
      const element = document.getElementById(`cat-${cat}`);
      if(element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Sticky Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 p-3 border-b border-gray-100">
            <button onClick={onBack} className="p-2 text-sausage-800 hover:bg-sausage-50 rounded-full">
                <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
                <h2 className="font-bold text-sausage-900 leading-tight">Menu</h2>
                <p className="text-xs text-gray-500">{menuData.items.length} dishes found</p>
            </div>
            <div className="bg-sausage-100 text-sausage-800 px-3 py-1 rounded-full text-xs font-bold border border-sausage-200">
                1 {menuData.originalCurrency} ≈ {menuData.exchangeRate.toFixed(2)} {menuData.targetCurrency}
            </div>
          </div>
          
          {/* Scrollable Categories Tabs */}
          <div className="flex overflow-x-auto hide-scrollbar px-2 py-2 gap-2 bg-white/95 backdrop-blur-sm">
             {categories.map(cat => (
                 <button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        activeCategory === cat 
                        ? 'bg-sausage-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                 >
                     {cat}
                 </button>
             ))}
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
        {categories.map((category) => (
          <div key={category} id={`cat-${category}`} className="scroll-mt-36">
            <h3 className="text-xl font-black text-sausage-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-sausage-500 rounded-full"></div>
                {category}
            </h3>
            
            <div className="grid gap-4">
              {groupedItems[category].map((item) => {
                const quantity = cart[item.id]?.quantity || 0;
                const convertedPrice = (item.price * menuData.exchangeRate).toFixed(0);
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    key={item.id} 
                    className={`bg-white rounded-2xl p-4 shadow-sm border-2 relative overflow-hidden ${quantity > 0 ? 'border-sausage-400 ring-2 ring-sausage-100' : 'border-gray-100'}`}
                  >
                    {/* Header: Names */}
                    <div className="mb-2">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="font-extrabold text-gray-800 text-lg leading-tight">{item.translatedName}</h4>
                            {item.allergy_warning && (
                                <span className="shrink-0 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                    <AlertTriangle size={10} /> Allergen
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 font-medium mt-0.5">{item.originalName}</p>
                    </div>

                    {/* AI Description Section - Highlighted */}
                    <div className="bg-amber-50 rounded-xl p-3 mb-3 border border-amber-100 relative">
                        {item.shortDescription && (
                             <p className="text-amber-900 text-sm font-medium mb-2 leading-relaxed">
                                {item.shortDescription}
                             </p>
                        )}
                        
                        {/* Tags */}
                        {item.dietary_tags && item.dietary_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {item.dietary_tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-white text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                         {/* Explain Button / Result */}
                        {explanations[item.id] ? (
                            <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
                                💡 {explanations[item.id]}
                            </div>
                        ) : (
                             <button 
                                onClick={() => handleExplain(item)}
                                disabled={loadingExplanation === item.id}
                                className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 mt-1 transition-colors"
                            >
                                {loadingExplanation === item.id ? 'Thinking...' : <><Info size={12}/> Detailed Explanation</>}
                            </button>
                        )}
                    </div>

                    {/* Footer: Price & Controls */}
                    <div className="flex items-center justify-between mt-2">
                        <div>
                             <span className="block font-black text-xl text-sausage-900">
                                {convertedPrice} <span className="text-xs font-bold text-sausage-600">{menuData.targetCurrency}</span>
                             </span>
                             <span className="text-xs text-gray-400 font-mono">
                                {item.price} {menuData.originalCurrency}
                             </span>
                        </div>

                        <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-inner">
                            <button 
                                onClick={() => onUpdateCart(item.id, -1)}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${quantity > 0 ? 'bg-white text-sausage-700 shadow-sm hover:bg-red-50 hover:text-red-500' : 'text-gray-300'}`}
                                disabled={quantity === 0}
                            >
                                <Minus size={18} />
                            </button>
                            <span className={`w-8 text-center font-bold ${quantity > 0 ? 'text-sausage-900' : 'text-gray-300'}`}>
                                {quantity}
                            </span>
                            <button 
                                onClick={() => onUpdateCart(item.id, 1)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-sausage-600 text-white shadow-md hover:bg-sausage-700 active:scale-95 transition-transform"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Bar */}
      <AnimatePresence>
        {totalItems > 0 && (
            <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white border-t border-sausage-100 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] p-4 z-40 pb-6 safe-area-bottom"
            >
                <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Estimated Total</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-sausage-900">{totalConverted.toFixed(0)}</span>
                            <span className="text-sm font-bold text-sausage-600">{menuData.targetCurrency}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onViewSummary}
                        className="flex-1 bg-sausage-900 text-white py-3.5 px-6 rounded-xl font-bold text-lg shadow-lg hover:bg-sausage-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        Checkout <span className="bg-sausage-700 px-2 py-0.5 rounded text-sm">{totalItems}</span>
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};