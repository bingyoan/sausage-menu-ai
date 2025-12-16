import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { WelcomeScreen } from './components/WelcomeScreen';
import OrderingPage from './components/OrderingPage'; // 注意這裡不要加 {}
import { OrderSummary } from './components/OrderSummary';
import { HistoryPage } from './components/HistoryPage';
import { SettingsModal } from './components/SettingsModal';
import { parseMenuImage } from './services/geminiService';
import { MenuData, Cart, AppState, HistoryRecord } from './types';
// 1. 修正：從 constants 引入 TargetLanguage
import { TargetLanguage } from './constants';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppState>('welcome');
  
  // 2. 修正：Cart 初始化為空陣列 []，而不是物件 {}
  const [cart, setCart] = useState<Cart>([]);
  
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [targetLang, setTargetLang] = useState<TargetLanguage>(TargetLanguage.ChineseTW);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    const saved = localStorage.getItem('order_history');
    return saved ? JSON.parse(saved) : [];
  });

  const handleImagesSelected = async (files: File[]) => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsProcessing(true);
    setCurrentView('processing');

    try {
      const base64Images = await Promise.all(
        files.map(file => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        }))
      );

      // 去掉 data:image/jpeg;base64, 前綴
      const cleanedImages = base64Images.map(img => img.split(',')[1]);
      
      const data = await parseMenuImage(apiKey, cleanedImages, targetLang);
      setMenuData(data);
      // 確保每次新掃描都重置購物車為空陣列
      setCart([]); 
      setCurrentView('ordering');
    } catch (error) {
      console.error(error);
      setCurrentView('welcome');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. 修正：更新購物車邏輯 (陣列版)
  const handleUpdateCart = (itemId: string, delta: number) => {
    if (!menuData) return;

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(i => i.id === itemId);
      
      // 如果是要增加數量
      if (delta > 0) {
        if (existingItemIndex >= 0) {
          // 項目已存在，更新數量
          const newCart = [...prevCart];
          newCart[existingItemIndex] = {
            ...newCart[existingItemIndex],
            quantity: newCart[existingItemIndex].quantity + delta
          };
          return newCart;
        } else {
          // 項目不存在，從 menuData 找到並加入
          const menuItem = menuData.items.find(i => i.id === itemId);
          if (menuItem) {
            return [...prevCart, { ...menuItem, quantity: delta }];
          }
          return prevCart;
        }
      } 
      // 如果是要減少數量
      else {
        if (existingItemIndex >= 0) {
          const currentQuantity = prevCart[existingItemIndex].quantity;
          if (currentQuantity + delta <= 0) {
            // 數量變 0 或更少，移除該項目
            return prevCart.filter(i => i.id !== itemId);
          } else {
            // 減少數量
            const newCart = [...prevCart];
            newCart[existingItemIndex] = {
              ...newCart[existingItemIndex],
              quantity: currentQuantity + delta
            };
            return newCart;
          }
        }
        return prevCart;
      }
    });
  };

  const handleFinishOrder = () => {
    if (!menuData) return;
    
    // 4. 修正：計算總金額 (陣列 reduce)
    const totalOriginal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      items: cart, // 直接存陣列
      totalOriginalPrice: totalOriginal,
      currency: menuData.originalCurrency || 'JPY',
    };

    const newHistory = [newRecord, ...history];
    setHistory(newHistory);
    localStorage.setItem('order_history', JSON.stringify(newHistory));
    
    // 重置購物車為空陣列
    setCart([]);
    setCurrentView('welcome');
  };

  const handleDeleteHistory = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('order_history', JSON.stringify(newHistory));
  };

  return (
    <div className="h-screen w-full bg-gray-50 font-sans text-gray-900">
      <Toaster position="top-center" />
      
      {currentView === 'welcome' && (
        <WelcomeScreen
          onLanguageChange={setTargetLang}
          selectedLanguage={targetLang}
          onImagesSelected={handleImagesSelected}
          onViewHistory={() => setCurrentView('history')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isVerified={!!apiKey}
          hasApiKey={!!apiKey}
        />
      )}

      {currentView === 'processing' && (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sausage-600"></div>
          <p className="text-sausage-800 font-bold animate-pulse">Reading Menu...</p>
        </div>
      )}

      {/* 5. 修正：傳遞正確的 Props 給 OrderingPage */}
      {currentView === 'ordering' && menuData && (
        <OrderingPage
          menuData={menuData}
          cart={cart}
          onUpdateCart={handleUpdateCart}
          onViewSummary={() => setCurrentView('summary')}
          onBack={() => setCurrentView('welcome')}
          targetLang={targetLang}
        />
      )}

      {currentView === 'summary' && menuData && (
        <OrderSummary
          cart={cart}
          menuData={menuData}
          onClose={() => setCurrentView('ordering')}
          onFinish={handleFinishOrder}
        />
      )}

      {currentView === 'history' && (
        <HistoryPage
          history={history}
          onBack={() => setCurrentView('welcome')}
          onDelete={handleDeleteHistory}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          apiKey={apiKey}
          onSave={(key) => {
            setApiKey(key);
            localStorage.setItem('gemini_api_key', key);
            setIsSettingsOpen(false);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
