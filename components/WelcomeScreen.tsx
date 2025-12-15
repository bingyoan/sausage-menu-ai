import React, { useState, useEffect, useRef } from 'react';
import { TargetLanguage } from '../types';
import { LANGUAGE_OPTIONS } from '../constants';
import { Camera, History, Settings, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [isAndroidApp, setIsAndroidApp] = useState(false);
  const [isLicenseVerified, setIsLicenseVerified] = useState(false);

  useEffect(() => {
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

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      <div className="flex justify-between items-center p-4 bg-white shadow-sm z-10">
        <div className="flex items-center gap-2">
           <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
             Sausage Menu AI
           </span>
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

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 overflow-y-auto">
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

        <div className="w-full max-w-xs bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <label className="text-sm font-medium text-slate-400 mb-2 block uppercase tracking-wider">翻譯目標語言</label>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedLanguage === lang.code
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{lang.flag}</span>
                {lang.label.split(' ')[1] || lang.label} 
              </button>
            ))}
          </div>
        </div>

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

        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

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