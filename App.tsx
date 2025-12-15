import React, { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { OrderingPage } from './components/OrderingPage';
import { parseMenuImage } from './services/geminiService';
import { AppState, TargetLanguage, MenuData, Cart } from './types';
import { GUMROAD_PRODUCT_PERMALINK } from './constants';
import { Toaster, toast } from 'react-hot-toast';
import { Smartphone } from 'lucide-react';

function App() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [targetLang, setTargetLang] = useState<TargetLanguage>(TargetLanguage.ChineseTW);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImagesSelected = async (files: File[]) => {
    if (!apiKey) {
      // 簡單檢查有沒有 API Key，如果沒有就提示
      const key = prompt("請先輸入您的 Google Gemini API Key:");
      if (!key) return;
      localStorage.setItem('gemini_api_key', key);
      setApiKey(key);
    }

    setIsProcessing(true);
    const toastId = toast.loading('正在分析菜單... (Gemini 2.5 Flash Lite)');

    try {
      const base64Images = await Promise.all(files.map(file => 
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        })
      ));

      // 去掉 data:image/jpeg;base64, 的前綴
      const cleanImages = base64Images.map(img => img.split(',')[1]);
      
      const data = await parseMenuImage(apiKey || localStorage.getItem('gemini_api_key') || '', cleanImages, targetLang);
      setMenuData(data);
      setAppState('ordering');
      toast.success('菜單分析完成！', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('分析失敗，請重試', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateCart = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId]?.quantity || 0;
      const newQuantity = Math.max(0, current + delta);
      if (!menuData) return prev;
      
      const item = menuData.items.find(i => i.id === itemId);
      if (!item) return prev;

      if (newQuantity === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { item, quantity: newQuantity } };
    });
  };

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative">
      <Toaster position="top-center" />
      
      {appState === 'welcome' && (
        <WelcomeScreen
          selectedLanguage={targetLang}
          onLanguageChange={setTargetLang}
          onImagesSelected={handleImagesSelected}
          onViewHistory={() => {}}
          onOpenSettings={() => {
            const key = prompt("重設 API Key:", apiKey);
            if (key) {
              setApiKey(key);
              localStorage.setItem('gemini_api_key', key);
            }
          }}
        />
      )}

      {appState === 'ordering' && menuData && (
        <OrderingPage
          apiKey={apiKey}
          menuData={menuData}
          cart={cart}
          targetLang={targetLang}
          onUpdateCart={updateCart}
          onViewSummary={() => toast("結帳功能開發中！")}
          onBack={() => setAppState('welcome')}
        />
      )}

      {/* 處理中的遮罩 */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-4 animate-pulse">
            <Smartphone className="w-10 h-10 text-orange-500 animate-bounce" />
            <p className="font-bold text-slate-700">AI 正在閱讀菜單...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;