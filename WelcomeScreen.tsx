import React, { useState, useEffect, useRef } from 'react';
import { TargetLanguage } from '../types';
import { Camera, Upload, History, Settings, CheckCircle, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface WelcomeScreenProps {
  selectedLanguage: TargetLanguage;
  onLanguageChange: (lang: TargetLanguage) => void;
  onImagesSelected: (files: File[]) => void;
  onViewHistory: () => void;
  onOpenSettings: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  selectedLanguage,
  onLanguageChange,
  onImagesSelected,
  onViewHistory,
  onOpenSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 1. 新增：判斷是否為 Android App 的狀態
  const [isAndroidApp, setIsAndroidApp] = useState(false);
  const [isLicenseVerified, setIsLicenseVerified] = useState(false);

  // 2. 新增：一載入就檢查網址 (通關密語檢查)
  useEffect(() => {
    // 檢查網址有沒有 ?platform=android
    const params = new URLSearchParams(window.location.search);
    const platform = params.get('platform');
    
    // 檢查 LocalStorage 有沒有存過序號
    const savedLicense = localStorage.getItem('sausage_license_key');

    if (platform === 'android') {
      // ✅ 情況 A：是 Android App，直接放行！
      setIsAndroidApp(true);
      setIsLicenseVerified(true);
      // 偷偷存一個標記，以後就算沒網址參數也認得
      localStorage.setItem('sausage_is_android_purchased', 'true');
    } else if (savedLicense || localStorage.getItem('sausage_is_android_purchased')) {
      // ✅ 情況 B：之前輸入過序號，或是之前是 Android 版
      setIsLicenseVerified(true);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onImagesSelected(Array.from(event.target.files));
    }
  };

  // 模擬輸入序號的功能 (給網頁版用戶用的)
  const handleEnterLicense = () => {
    const key = prompt("請輸入您的 Gumroad 序號：");
    if (key === 'SAUSAGE-VIP') { // 這裡暫時用假序號，你可以之後改成真驗證
        localStorage.setItem('sausage_license_key', key);
        setIsLicenseVerified(true);
        toast.success("序號驗證成功！");
    } else if (key) {
        toast.error("序號無效");
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      {/* 頂部導航列 */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm z-10">
        <div className="flex items-center gap-2">
           <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
             Sausage Menu AI
           </span>
           {/* ✨ 如果是 Android App，顯示專屬徽章 */}
           {isAndroidApp && (
             <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1 font-medium">
               <CheckCircle size={12} /> Pro
             </span>
           )}
        </div>
        <div className="flex gap-2">
          <button onClick={onViewHistory} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <History size={24} />
          </button>
          <button onClick={onOpenSettings} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* 主要內容區 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 overflow-y-auto">
        
        {/* Logo 動畫區 */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl shadow-xl flex items-center justify-center transform rotate-3">
            <span className="text-6xl">🌭</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">今天想吃什麼？</h1>
            <p className="text-slate-500">拍下菜單，讓我幫你避開地雷</p>
          </div>
        </motion.div>

        {/* 語言選擇 */}
        <div className="w-full max-w-xs bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <label className="text-sm font-medium text-slate-400 mb-2 block uppercase tracking-wider">翻譯目標語言</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { code: TargetLanguage.ChineseTW, label: '🇹🇼 繁體中文' },
              { code: TargetLanguage.English, label: '🇺🇸 English' },
              { code: TargetLanguage.Japanese, label: '🇯🇵 日本語' },
              { code: TargetLanguage.Korean, label: '🇰🇷 한국어' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                  selectedLanguage === lang.code
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* 序號驗證狀態 (僅網頁版顯示) */}
        {!isAndroidApp && !isLicenseVerified && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="w-full max-w-xs"
             >
                <button 
                  onClick={handleEnterLicense}
                  className="w-full py-3 px-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-sm font-medium hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🔑</span> 
                  我是網頁版用戶 (輸入序號)
                </button>
                <p className="text-xs text-center text-slate-400 mt-2">
                  Android 用戶請下載 App 即可免序號
                </p>
             </motion.div>
        )}

        {/* 隱藏的檔案輸入 */}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {/* 底部按鈕區 */}
      <div className="p-6 bg-white border-t border-slate-100 pb-8">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Camera size={24} />
          {isLicenseVerified ? '開始掃描菜單' : '試用掃描 (免序號)'}
        </button>
        <p className="text-center text-xs text-slate-400 mt-4">
          Powered by Google Gemini 2.0 Flash
        </p>
      </div>
    </div>
  );
};