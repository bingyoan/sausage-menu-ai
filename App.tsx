import React, { useState, useEffect } from 'react';
import { AppState, TargetLanguage, MenuData, Cart, CartItem, HistoryRecord } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MenuProcessing } from './components/MenuProcessing';
import OrderingPage from './components/OrderingPage';
import { OrderSummary } from './components/OrderSummary';
import { HistoryPage } from './components/HistoryPage';
import { SettingsModal } from './components/SettingsModal';
import { LicenseModal } from './components/LicenseModal';
import { parseMenuImage } from './services/geminiService';
import { GUMROAD_PRODUCT_PERMALINK } from './constants';
import { Toaster, toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>(TargetLanguage.ChineseTW);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  
  // Auth & Permissions
  const [apiKey, setApiKey] = useState<string>('');
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  
  // Modal State
  const [showLicenseModal, setShowLicenseModal] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // 1. Initialization: Load Storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('sausage_menu_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedApiKey = localStorage.getItem('sausage_google_api_key');
    if (savedApiKey) {
        setApiKey(savedApiKey);
    } else {
        // UX: Auto open settings if no key found on first load
        setTimeout(() => setShowSettings(true), 1000);
    }

    const savedLicenseKey = localStorage.getItem('sausage_license_key');
    if (savedLicenseKey) {
        setLicenseKey(savedLicenseKey);
        verifyLicense(savedLicenseKey, true);
    }
  }, []);

  // 2. Persistence
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('sausage_google_api_key', apiKey);
    } else {
      localStorage.removeItem('sausage_google_api_key');
    }
  }, [apiKey]);

  // 3. License Verification Logic
  const verifyLicense = async (key: string, isAutoCheck = false): Promise<boolean> => {
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_permalink: GUMROAD_PRODUCT_PERMALINK,
          license_key: key.trim(),
        }),
      });
      const data = await response.json();

      if (data.success && !data.purchase.refunded && !data.purchase.chargebacked) {
        setIsVerified(true);
        setLicenseKey(key.trim());
        localStorage.setItem('sausage_license_key', key.trim());
        if(!isAutoCheck) toast.success("License Verified! Pro Mode Unlocked.");
        return true;
      } else {
        setIsVerified(false);
        if (!isAutoCheck) {
            localStorage.removeItem('sausage_license_key');
            toast.error("Invalid License Key");
        }
        return false;
      }
    } catch (err) {
      console.error("Verification Error", err);
      if(!isAutoCheck) toast.error("Verification Failed");
      return false;
    }
  };

  const handleApiKeyChange = (key: string) => {
      setApiKey(key);
      if(key) toast.success("API Key Saved");
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            resolve(dataUrl.split(',')[1]);
          } else {
             reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImagesSelected = async (files: File[]) => {
    if (!apiKey) {
        toast.error("Please set your Google API Key in Settings first.");
        setShowSettings(true);
        return;
    }

    if (files.length === 0) return;

    if (!isVerified) {
        setShowLicenseModal(true);
        return;
    }

    const filesToProcess = files.slice(0, 3);
    if (files.length > 3) {
        toast("Max 3 images. Processing first 3.", { icon: '⚠️' });
    }

    setAppState('processing');
    
    try {
      const base64Promises = filesToProcess.map(file => compressImage(file));
      const base64Images = await Promise.all(base64Promises);

      try {
        const data = await parseMenuImage(apiKey, base64Images, targetLanguage);
        setMenuData(data);
        setAppState('ordering');
      } catch (error) {
        console.error(error);
        toast.error("Failed to parse menu. Check your API Key.");
        setAppState('welcome');
      }
    } catch (error) {
      console.error("Image processing error:", error);
      toast.error("Error processing images.");
      setAppState('welcome');
    }
  };

  const saveToHistory = () => {
    if (!menuData || Object.keys(cart).length === 0) return;

    const cartItems = Object.values(cart) as CartItem[];
    const total = cart.reduce((sum, cartItem) => sum + cartItem.price * cartItem.quantity, 0);
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
    
    setCart({});
    setMenuData(null);
    setAppState('welcome');
    toast.success("Order finished & saved to history!");
  };

  const deleteHistoryItem = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('sausage_menu_history', JSON.stringify(newHistory));
    toast.success("History deleted");
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
        if (item) newCart[itemId] = { item, quantity: newQty };
      }
      return newCart;
    });
  };

  // Animation Variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="h-full w-full max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden font-sans">
        <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />

        <SettingsModal 
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleApiKeyChange}
          currentKey={apiKey}
        />

        <LicenseModal 
            isOpen={showLicenseModal}
            onClose={() => setShowLicenseModal(false)}
            onVerify={verifyLicense}
        />

        <AnimatePresence mode="wait">
            {appState === 'welcome' && (
              <motion.div key="welcome" {...pageVariants} className="h-full">
                  <WelcomeScreen 
                    selectedLanguage={targetLanguage} 
                    onLanguageChange={setTargetLanguage}
                    onImagesSelected={handleImagesSelected}
                    onViewHistory={() => setAppState('history')}
                    onOpenSettings={() => setShowSettings(true)}
                    isVerified={isVerified}
                    hasApiKey={!!apiKey}
                  />
              </motion.div>
            )}

            {appState === 'history' && (
              <motion.div key="history" {...pageVariants} className="h-full">
                  <HistoryPage 
                      history={history}
                      onBack={() => setAppState('welcome')}
                      onDelete={deleteHistoryItem}
                  />
              </motion.div>
            )}

            {appState === 'processing' && (
              <motion.div key="processing" {...pageVariants} className="h-full">
                  <MenuProcessing />
              </motion.div>
            )}

            {appState === 'ordering' && menuData && (
              <motion.div key="ordering" {...pageVariants} className="h-full">
                  <OrderingPage 
                    menuData={menuData}
                    cart={cart}
                    targetLang={targetLanguage}
                    onUpdateCart={updateCart}
                    onViewSummary={() => setAppState('summary')}
                    onBack={() => {
                      if(Object.keys(cart).length > 0) {
                          toast.custom((t) => (
                             <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-sausage-200">
                                <p className="font-bold mb-2">Discard current order?</p>
                                <div className="flex gap-2">
                                    <button onClick={() => toast.dismiss(t.id)} className="flex-1 py-2 bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={() => { 
                                        toast.dismiss(t.id);
                                        setCart({}); 
                                        setAppState('welcome'); 
                                    }} className="flex-1 py-2 bg-red-500 text-white rounded-lg">Discard</button>
                                </div>
                             </div>
                          ));
                      } else {
                          setAppState('welcome');
                      }
                    }}
                  />
              </motion.div>
            )}

            {appState === 'summary' && menuData && (
              <motion.div key="summary" initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} className="h-full absolute inset-0 z-50">
                  <OrderSummary 
                    cart={cart} 
                    menuData={menuData} 
                    onClose={() => setAppState('ordering')}
                    onFinish={saveToHistory}
                  />
              </motion.div>
            )}
        </AnimatePresence>
      </div>
  );
};

export default App;
