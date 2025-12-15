import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, History, Settings, Globe } from 'lucide-react'; // 導入所有需要的 icon
import { TargetLanguage } from '../types';
import { LANGUAGE_OPTIONS } from '../constants';
import { SausageDogLogo, PawPrint } from './DachshundAssets'; // 導入臘腸狗 logo
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// 接口定義: 這是從 App.tsx 傳入的屬性，我們需要它來控制功能
interface WelcomeScreenProps {
  selectedLanguage: TargetLanguage;
  onLanguageChange: (lang: TargetLanguage) => void;
  onImagesSelected: (files: File[]) => void; // 新版使用 onImagesSelected
  onViewHistory: () => void;
  onOpenSettings: () => void;
  // 注意：我們不需要 hasKey，因為 License 邏輯現在寫在這個元件裡面
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  selectedLanguage,
  onLanguageChange,
  onImagesSelected,
  onViewHistory,
  onOpenSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null); // 舊版有這個，所以我們也保留
  
  // ⚡️ 修正點一：保留新版的所有狀態邏輯 (License & Android Check)
  const [isAndroidApp, setIsAndroidApp] = useState(false);
  const [isLicenseVerified, setIsLicenseVerified] = useState(false);

  useEffect(() => {
    // 偵測網址參數，這是 Android App 的通關密語
    const params = new URLSearchParams(window.location.search);
    const platform = params.get('platform');
    const savedLicense = localStorage.getItem('sausage_license_key');

    if (platform === 'android') {
      setIsAndroidApp(true);
      setIsLicenseVerified(true);
      localStorage.setItem('sausage_is_android_purchased', 'true');
    } else if (savedLicense || localStorage.getItem('sausage_is_android_purchased')) {
      setIsLicenseVerified(true);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      // ⚡️ 修正點二：舊版介面使用單張圖片，但我們呼叫新版的多圖處理函式
      onImagesSelected(Array.from(event.target.files)); 
    }
  };

  const handleEnterLicense = () => {
    const key = prompt("請輸入您的 Gumroad 序號：");
    if (key === 'SAUSAGE-VIP') {
        localStorage.setItem('sausage_license_key', key);
        setIsLicenseVerified(true);
        toast.success("序號驗證成功！");
    } else if (key) {
        toast.error("序號無效");
    }
  };

  // 決定按鈕是否應該被啟用 (如果已驗證或是在 App 內)
  const isEnabled = isAndroidApp || isLicenseVerified;
  
  // ⚡️ 修正點三：使用舊介面的 HTML/JSX 結構
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 text-center space-y-8 relative overflow-hidden">
      
      {/* Background Decorations */}
      <PawPrint className="absolute top-10 left-[-20px] w-24 h-24 text-sausage-200 opacity-50 rotate-[-15deg]" />
      <PawPrint className="absolute bottom-20 right-[-20px] w-32 h-32 text-sausage-200 opacity-50 rotate-[15deg]" />

      {/* Top Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-3 z-20">
        <button 
          onClick={onViewHistory}
          className="p-3 bg-white text-sausage-700 rounded-full hover:bg-sausage-50 transition-colors shadow-sm border border-sausage-100"
          title="History"
        >
          <History size={20} />
        </button>
        {/* ⚡️ 修正點四：設定按鈕樣式現在根據是否有 Key 來決定 */}
        <button 
          onClick={onOpenSettings}
          className={`p-3 rounded-full transition-colors shadow-sm border ${isLicenseVerified ? 'bg-white text-sausage-700 border-sausage-100' : 'bg-sausage-600 text-white border-sausage-600 animate-pulse'}`}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="z-10 animate-bounce-slow mt-8">
        <SausageDogLogo className="w-48 h-32 mx-auto drop-shadow-md" />
        <h1 className="text-4xl font-extrabold text-sausage-900 mt-4 tracking-tight">
          Sausage Dog <br/><span className="text-sausage-600">Menu Pal</span>
        </h1>
        {isAndroidApp && (
          <span className="px-3 py-1 mt-2 text-sm bg-green-100 text-green-700 rounded-full flex items-center justify-center gap-1 font-medium mx-auto w-fit">
            <CheckCircle size={14} /> PRO UNLIMITED
          </span>
        )}
        <p className="text-sausage-800 mt-2 font-medium">Woof! Let me translate that menu for you.</p>
      </div>

      <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-xl z-10 border-4 border-sausage-100">
        
        {/* ⚡️ 修正點五：如果沒有 Key 且不是 App，顯示輸入序號按鈕 */}
        {!isEnabled && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
              <button 
                onClick={handleEnterLicense}
                className="w-full py-3 px-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-sm font-medium hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">🔑</span> 網頁版用戶 (輸入序號)
              </button>
              <p className="text-xs text-center text-slate-400 mt-2">
                Android 用戶請下載 App 即可免序號
              </p>
          </motion.div>
        )}
        
        <div className="mb-6 text-left">
          <label className="block text-sm font-bold text-sausage-700 mb-2 flex items-center gap-2">
            <Globe size={16} />
            Translate to:
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value as TargetLanguage)}
            className="w-full p-3 bg-sausage-50 border-2 border-sausage-200 rounded-xl text-sausage-900 focus:outline-none focus:border-sausage-500 font-semibold"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => isEnabled ? cameraInputRef.current?.click() : handleEnterLicense()}
            className={`w-full py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 font-bold text-lg transition-transform active:scale-95 ${isEnabled ? 'bg-sausage-600 hover:bg-sausage-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <Camera size={24} />
            Take Photo
          </button>
          <button
            onClick={() => isEnabled ? fileInputRef.current?.click() : handleEnterLicense()}
            className={`w-full py-4 border-2 rounded-2xl shadow-sm flex items-center justify-center gap-3 font-bold text-lg transition-transform active:scale-95 ${isEnabled ? 'bg-white border-sausage-300 text-sausage-700 hover:bg-sausage-50' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`}
          >
            <Upload size={24} />
            Upload Image
          </button>
        </div>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      
      {/* Footer / AI 說明 */}
      <p className="text-center text-xs text-slate-400 mt-4 mb-4">
        Powered by Google Gemini 2.5 Flash Lite
      </p>
    </div>
  );
};
