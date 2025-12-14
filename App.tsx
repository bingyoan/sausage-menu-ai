import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppState, TargetLanguage, MenuData, Cart, CartItem, HistoryRecord } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MenuProcessing } from './components/MenuProcessing';
import { OrderingPage } from './components/OrderingPage';
import { OrderSummary } from './components/OrderSummary';
import { HistoryPage } from './components/HistoryPage';
import { SettingsModal } from './components/SettingsModal';
import { LicenseModal } from './components/LicenseModal';
import { parseMenuImage } from './services/geminiService';
import { GUMROAD_PRODUCT_PERMALINK } from './constants';

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

  // Settings Modal (Optional)
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // 1. Initialization: Load Storage
  useEffect(() => {
    // Load History
    const savedHistory = localStorage.getItem('sausage_menu_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    // Load Google API Key
    const savedApiKey = localStorage.getItem('sausage_google_api_key');
    if (savedApiKey) setApiKey(savedApiKey);

    // Load License Key
    const savedLicenseKey = localStorage.getItem('sausage_license_key');
    if (savedLicenseKey) {
        setLicenseKey(savedLicenseKey);
        verifyLicense(savedLicenseKey, true); // Auto verify on load
    }
  }, []);

  // 2. Persistence: Auto-save Google API Key whenever it changes
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
        // Save to storage on success
        localStorage.setItem('sausage_license_key', key.trim());
        return true;
      } else {
        setIsVerified(false);
        if (!isAutoCheck) {
            localStorage.removeItem('sausage_license_key'); 
        }
        return false;
      }
    } catch (err) {
      console.error("Verification Error", err);
      return false;
    }
  };

  // Wrapper to update state
  const handleApiKeyChange = (key: string) => {
      setApiKey(key);
  };

  // Helper: Compress Image using Canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024; // Resize to max 1024px width for speed
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
            // Compress to JPEG with 0.6 quality
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            resolve(dataUrl.split(',')[1]); // Return base64 body
          } else {
             reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // 4. Image Handling (Strict License Check)
  const handleImagesSelected = async (files: File[]) => {
    if (!apiKey) {
        alert("Please enter a Google API Key first.");
        return;
    }

    if (files.length === 0) return;

    // Strict Permission Check: Must be verified
    if (!isVerified) {
        setShowLicenseModal(true);
        return;
    }

    // Limit to 3 images
    const filesToProcess = files.slice(0, 3);
    if (files.length > 3) {
        alert("Maximum 3 images allowed. Processing the first 3.");
    }

    setAppState('processing');
    
    try {
      // Compress and convert all files to base64
      const base64Promises = filesToProcess.map(file => compressImage(file));
      const base64Images = await Promise.all(base64Promises);

      try {
        const data = await parseMenuImage(apiKey, base64Images, targetLanguage);
        setMenuData(data);
        setAppState('ordering');
      } catch (error) {
        console.error(error);
        alert("Failed to parse menu. Please check your API Key and try again.");
        setAppState('welcome');
      }
    } catch (error) {
      console.error("Image processing error:", error);
      alert("Error processing images.");
      setAppState('welcome');
    }
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
    
    setCart({});
    setMenuData(null);
    setAppState('welcome');
  };

  const deleteHistoryItem = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('sausage_menu_history', JSON.stringify(newHistory));
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

  return (
    <div className="h-full w-full max-w-md mx-auto bg-white shadow-2xl relative">
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

        {appState === 'welcome' && (
          <WelcomeScreen 
            selectedLanguage={targetLanguage} 
            onLanguageChange={setTargetLanguage}
            onImagesSelected={handleImagesSelected}
            onViewHistory={() => setAppState('history')}
            
            apiKey={apiKey}
            onApiKeyChange={handleApiKeyChange}
            licenseKey={licenseKey}
            isVerified={isVerified}
            onVerifyLicense={verifyLicense}
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
  );
};

export default App;