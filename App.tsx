import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppState, TargetLanguage, MenuData, Cart, CartItem, HistoryRecord } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MenuProcessing } from './components/MenuProcessing';
import { OrderingPage } from './components/OrderingPage';
import { OrderSummary } from './components/OrderSummary';
import { HistoryPage } from './components/HistoryPage';
import { SettingsModal } from './components/SettingsModal';
import { LicenseGate } from './components/LicenseGate';
import { parseMenuImage } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>(TargetLanguage.ChineseTW);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  
  // API Key Management
  const [apiKey, setApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Load history and key from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('sausage_menu_history');
    if (savedHistory) {
        try {
            setHistory(JSON.parse(savedHistory));
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }

    const savedKey = localStorage.getItem('sausage_api_key');
    if (savedKey) {
        setApiKey(savedKey);
    }
  }, []);

  const handleSaveKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('sausage_api_key', key);
  };

  const saveToHistory = () => {
    if (!menuData || Object.keys(cart).length === 0) return;

    const cartItems = Object.values(cart) as CartItem[];
    const totalOriginal = cartItems.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);

    const newRecord: HistoryRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        items: cartItems,
        totalOriginalPrice: totalOriginal,
        currency: menuData.originalCurrency
    };

    const newHistory = [newRecord, ...history];
    setHistory(newHistory);
    localStorage.setItem('sausage_menu_history', JSON.stringify(newHistory));
    
    // Reset and go home
    setCart({});
    setMenuData(null);
    setAppState('welcome');
  };

  const deleteHistoryItem = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('sausage_menu_history', JSON.stringify(newHistory));
  };

  const handleImageSelected = async (file: File) => {
    if (!apiKey) {
        setShowSettings(true);
        return;
    }

    setAppState('processing');
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const data = await parseMenuImage(apiKey, base64String, targetLanguage);
          setMenuData(data);
          setAppState('ordering');
        } catch (error) {
          console.error(error);
          alert("Failed to parse menu. Please check your API Key and try again.");
          setAppState('welcome');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setAppState('welcome');
    }
  };

  const updateCart = (itemId: string, delta: number) => {
    if (!menuData) return;
    
    setCart(prev => {
      const currentQty = prev[itemId]?.quantity || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      const newCart = { ...prev };
      
      if (newQty === 0) {
        delete newCart[itemId];
      } else {
        const item = menuData.items.find(i => i.id === itemId);
        if (item) {
            newCart[itemId] = { item, quantity: newQty };
        }
      }
      return newCart;
    });
  };

  // The LicenseGate wraps the main application
  return (
    <LicenseGate>
      <div className="h-full w-full max-w-md mx-auto bg-white shadow-2xl relative">
        <SettingsModal 
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveKey}
          currentKey={apiKey}
        />

        {appState === 'welcome' && (
          <WelcomeScreen 
            selectedLanguage={targetLanguage} 
            onLanguageChange={setTargetLanguage}
            onImageSelected={handleImageSelected}
            onViewHistory={() => setAppState('history')}
            onOpenSettings={() => setShowSettings(true)}
            hasKey={!!apiKey}
          />
        )}

        {appState === 'history' && (
          <HistoryPage 
              history={history}
              onBack={() => setAppState('welcome')}
              onDelete={deleteHistoryItem}
          />
        )}

        {appState === 'processing' && (
          <MenuProcessing />
        )}

        {appState === 'ordering' && menuData && (
          <OrderingPage 
            apiKey={apiKey}
            menuData={menuData}
            cart={cart}
            targetLang={targetLanguage}
            onUpdateCart={updateCart}
            onViewSummary={() => setAppState('summary')}
            onBack={() => {
              if(confirm("Start over? Cart will be lost.")) {
                  setCart({});
                  setAppState('welcome');
              }
            }}
          />
        )}

        {appState === 'summary' && menuData && (
          <OrderSummary 
            cart={cart} 
            menuData={menuData} 
            onClose={() => setAppState('ordering')}
            onFinish={saveToHistory}
          />
        )}
      </div>
    </LicenseGate>
  );
};

export default App;