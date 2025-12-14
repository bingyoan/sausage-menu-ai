import React, { useRef, useState } from 'react';
import { Camera, Upload, Globe, History, CheckCircle, Key, ExternalLink, Loader2, AlertCircle, Lock } from 'lucide-react';
import { TargetLanguage } from '../types';
import { LANGUAGE_OPTIONS, GUMROAD_PRODUCT_PERMALINK } from '../constants';
import { SausageDogLogo, PawPrint } from './DachshundAssets';

interface WelcomeScreenProps {
  onLanguageChange: (lang: TargetLanguage) => void;
  selectedLanguage: TargetLanguage;
  onImagesSelected: (files: File[]) => void;
  onViewHistory: () => void;
  
  // Key Props
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  licenseKey: string;
  isVerified: boolean;
  onVerifyLicense: (key: string) => Promise<boolean>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onLanguageChange,
  selectedLanguage,
  onImagesSelected,
  onViewHistory,
  apiKey,
  onApiKeyChange,
  licenseKey,
  isVerified,
  onVerifyLicense
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [verifying, setVerifying] = useState(false);
  const [licenseInput, setLicenseInput] = useState(licenseKey);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImagesSelected(Array.from(e.target.files));
    }
  };

  const handleLicenseSubmit = async () => {
    if (!licenseInput.trim()) return;
    setVerifying(true);
    await onVerifyLicense(licenseInput);
    setVerifying(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-sausage-50 relative">
      {/* Background Decorations */}
      <PawPrint className="absolute top-10 left-[-20px] w-24 h-24 text-sausage-200 opacity-50 rotate-[-15deg] pointer-events-none" />
      <PawPrint className="absolute top-40 right-[-20px] w-32 h-32 text-sausage-200 opacity-50 rotate-[15deg] pointer-events-none" />

      {/* Top Bar */}
      <div className="flex justify-end p-4 z-20">
        <button 
            onClick={onViewHistory}
            className="p-3 bg-white text-sausage-700 rounded-full hover:bg-sausage-50 transition-colors shadow-sm border border-sausage-100"
            title="History"
        >
            <History size={20} />
        </button>
      </div>

      <div className="px-6 pb-8 flex flex-col items-center space-y-6">
        
        {/* Branding */}
        <div className="z-10 animate-bounce-slow text-center mt-2">
            <SausageDogLogo className="w-40 h-28 mx-auto drop-shadow-md" />
            <h1 className="text-3xl font-extrabold text-sausage-900 mt-2 tracking-tight">
            Sausage Dog <span className="text-sausage-600">Menu Pal</span>
            </h1>
            <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${isVerified ? 'bg-white border-green-200 text-green-600' : 'bg-white border-sausage-200 text-sausage-600'}`}>
                {isVerified ? (
                    <><CheckCircle size={12}/> PRO UNLIMITED</>
                ) : (
                    <><Lock size={12}/> LICENSE REQUIRED</>
                )}
            </div>
        </div>

        {/* Configuration Card */}
        <div className="w-full max-w-sm bg-white p-5 rounded-3xl shadow-xl z-10 border-4 border-sausage-100 space-y-5">
            
            {/* 1. Language Selector */}
            <div>
                <label className="block text-xs font-bold text-sausage-800 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                    <Globe size={14} /> Translate to
                </label>
                <select
                    value={selectedLanguage}
                    onChange={(e) => onLanguageChange(e.target.value as TargetLanguage)}
                    className="w-full p-3 bg-sausage-50 border-2 border-sausage-200 rounded-xl text-sausage-900 focus:outline-none focus:border-sausage-500 font-bold"
                >
                    {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                    ))}
                </select>
            </div>

            {/* 2. Google API Key */}
            <div>
                <label className="block text-xs font-bold text-sausage-800 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                    <Key size={14} /> Google API Key {apiKey && <CheckCircle size={14} className="text-green-500" />}
                </label>
                <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    placeholder="Enter AIzaSy..."
                    className={`w-full p-3 bg-gray-50 border-2 rounded-xl focus:outline-none text-sm font-mono ${apiKey ? 'border-green-200 bg-green-50' : 'border-gray-200 focus:border-sausage-500'}`}
                />
                <a href="https://aistudio.google.com/app/apikey" target="_blank" className="mt-1 inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-sausage-600 font-bold uppercase tracking-wide">
                    Get Free Key <ExternalLink size={10} />
                </a>
            </div>

            {/* 3. License Key */}
            <div>
                 <label className="block text-xs font-bold text-sausage-800 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                    <CheckCircle size={14} /> License Key {isVerified && <span className="text-green-600 bg-green-100 px-1.5 rounded text-[10px]">ACTIVE</span>}
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text"
                        value={licenseInput}
                        onChange={(e) => setLicenseInput(e.target.value)}
                        placeholder="XXXX-XXXX-XXXX"
                        disabled={isVerified}
                        className={`flex-1 p-3 bg-gray-50 border-2 rounded-xl focus:outline-none text-sm font-mono ${isVerified ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-200 focus:border-sausage-500'}`}
                    />
                    {!isVerified && (
                        <button 
                            onClick={handleLicenseSubmit}
                            disabled={verifying || !licenseInput}
                            className="bg-sausage-600 text-white px-3 rounded-xl hover:bg-sausage-700 disabled:opacity-50"
                        >
                            {verifying ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        </button>
                    )}
                </div>
                 {!isVerified && (
                    <a href={`https://bingyoan.gumroad.com/l/${GUMROAD_PRODUCT_PERMALINK}`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-[10px] text-sausage-600 hover:text-sausage-800 font-bold uppercase tracking-wide">
                        Buy License Key <ExternalLink size={10} />
                    </a>
                )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
                <button
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={!apiKey}
                    className={`w-full py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 font-bold transition-all active:scale-95 ${apiKey ? 'bg-sausage-600 hover:bg-sausage-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                    <Camera size={20} />
                    Take Photos (Max 3)
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!apiKey}
                    className={`w-full py-3.5 border-2 rounded-2xl shadow-sm flex items-center justify-center gap-2 font-bold transition-all active:scale-95 ${apiKey ? 'bg-white border-sausage-300 text-sausage-700 hover:bg-sausage-50' : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'}`}
                >
                    <Upload size={20} />
                    Upload Photos (Max 3)
                </button>
            </div>
            
             {/* API Key Warning */}
             {!apiKey && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>Please enter a Google API Key above to start translating menus.</p>
                </div>
            )}
        </div>
      </div>

      {/* Hidden Inputs for Multiple Files */}
      <input
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        ref={cameraInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};