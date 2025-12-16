import React, { useRef } from 'react';
import { Camera, Upload, Globe, History, Settings, CheckCircle, Lock } from 'lucide-react';
// 修正：指向 ../constants
import { TargetLanguage, LANGUAGE_OPTIONS } from '../constants';
import { SausageDogLogo, PawPrint } from './DachshundAssets';

interface WelcomeScreenProps {
  onLanguageChange: (lang: TargetLanguage) => void;
  selectedLanguage: TargetLanguage;
  onImagesSelected: (files: File[]) => void;
  onViewHistory: () => void;
  onOpenSettings: () => void;
  isVerified: boolean;
  hasApiKey: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onLanguageChange,
  selectedLanguage,
  onImagesSelected,
  onViewHistory,
  onOpenSettings,
  isVerified,
  hasApiKey
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImagesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="flex flex-col h-full bg-sausage-50 relative overflow-hidden">
      {/* Background Decorations */}
      <PawPrint className="absolute top-10 left-[-20px] w-24 h-24 text-sausage-200 opacity-50 rotate-[-15deg] pointer-events-none" />
      <PawPrint className="absolute bottom-10 right-[-20px] w-40 h-40 text-sausage-200 opacity-50 rotate-[15deg] pointer-events-none" />

      {/* Top Bar */}
      <div className="flex justify-between p-4 z-20">
         <button 
            onClick={onOpenSettings}
            className={`p-3 rounded-full transition-colors shadow-sm border border-sausage-100 flex items-center justify-center ${!hasApiKey ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-sausage-700 hover:bg-sausage-50'}`}
            title="Settings"
        >
            <Settings size={20} />
        </button>

        <button 
            onClick={onViewHistory}
            className="p-3 bg-white text-sausage-700 rounded-full hover:bg-sausage-50 transition-colors shadow-sm border border-sausage-100"
            title="History"
        >
            <History size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 space-y-8">
        {/* Branding */}
        <div className="z-10 text-center">
            <div className="animate-bounce-slow inline-block">
                 <SausageDogLogo className="w-48 h-32 mx-auto drop-shadow-lg" />
            </div>
            <h1 className="text-4xl font-extrabold text-sausage-900 mt-4 tracking-tight leading-tight">
            Sausage Dog <br/><span className="text-sausage-600">Menu Pal</span>
            </h1>
            
            <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${isVerified ? 'bg-white border-green-200 text-green-600' : 'bg-white border-sausage-200 text-sausage-600'}`}>
                {isVerified ? (
                    <><CheckCircle size={12}/> PRO UNLIMITED</>
                ) : (
                    <><Lock size={12}/> FREE MODE</>
                )}
            </div>
        </div>

        {/* Action Card */}
        <div className="w-full max-w-sm bg-white p-6 rounded-[2rem] shadow-xl z-10 border-4 border-sausage-100 space-y-6">
            
            {/* Language Selector */}
            <div className="bg-sausage-50 p-1 rounded-xl border border-sausage-200">
                 <div className="flex items-center gap-2 px-3 py-2 text-sausage-800 font-bold text-xs uppercase tracking-wider mb-1">
                    <Globe size={14} /> Translate to
                </div>
                <select
                    value={selectedLanguage}
                    onChange={(e) => onLanguageChange(e.target.value as TargetLanguage)}
                    className="w-full p-3 bg-white rounded-lg shadow-sm text-sausage-900 focus:outline-none font-bold text-lg text-center"
                >
                    {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                    ))}
                </select>
            </div>

            {/* Big Action Buttons */}
            <div className="space-y-3">
                <button
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={!hasApiKey}
                    className={`w-full py-5 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 font-bold transition-all active:scale-95 border-b-4 ${hasApiKey ? 'bg-sausage-600 border-sausage-800 hover:bg-sausage-700 text-white' : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'}`}
                >
                    <Camera size={32} />
                    <span className="text-lg">Take Photo</span>
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!hasApiKey}
                    className={`w-full py-4 border-2 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 ${hasApiKey ? 'bg-white border-sausage-300 text-sausage-700 hover:bg-sausage-50' : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'}`}
                >
                    <Upload size={20} />
                    Upload from Gallery
                </button>
            </div>

            {!hasApiKey && (
                 <p className="text-xs text-red-500 text-center font-bold">
                    ⚠️ Tap the Settings icon above to set your API Key.
                 </p>
            )}
        </div>
      </div>

      {/* Hidden Inputs */}
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
