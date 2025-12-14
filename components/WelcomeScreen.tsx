import React, { useRef } from 'react';
import { Camera, Upload, Globe, History, Settings } from 'lucide-react';
import { TargetLanguage } from '../types';
import { LANGUAGE_OPTIONS } from '../constants';
import { SausageDogLogo, PawPrint } from './DachshundAssets';

interface WelcomeScreenProps {
  onLanguageChange: (lang: TargetLanguage) => void;
  selectedLanguage: TargetLanguage;
  onImageSelected: (file: File) => void;
  onViewHistory: () => void;
  onOpenSettings: () => void;
  hasKey: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onLanguageChange,
  selectedLanguage,
  onImageSelected,
  onViewHistory,
  onOpenSettings,
  hasKey
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

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
        <button 
            onClick={onOpenSettings}
            className={`p-3 rounded-full transition-colors shadow-sm border ${hasKey ? 'bg-white text-sausage-700 border-sausage-100' : 'bg-sausage-600 text-white border-sausage-600 animate-pulse'}`}
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
        <p className="text-sausage-800 mt-2 font-medium">Woof! Let me translate that menu for you.</p>
      </div>

      <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-xl z-10 border-4 border-sausage-100">
        {!hasKey && (
             <div className="mb-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm font-bold flex flex-col gap-2">
                <p>⚠️ API Key Missing</p>
                <button 
                    onClick={onOpenSettings} 
                    className="text-xs bg-red-600 text-white py-2 rounded-lg"
                >
                    Setup Key
                </button>
             </div>
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
            onClick={() => hasKey ? cameraInputRef.current?.click() : onOpenSettings()}
            className={`w-full py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 font-bold text-lg transition-transform active:scale-95 ${hasKey ? 'bg-sausage-600 hover:bg-sausage-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <Camera size={24} />
            Take Photo
          </button>
          <button
            onClick={() => hasKey ? fileInputRef.current?.click() : onOpenSettings()}
            className={`w-full py-4 border-2 rounded-2xl shadow-sm flex items-center justify-center gap-3 font-bold text-lg transition-transform active:scale-95 ${hasKey ? 'bg-white border-sausage-300 text-sausage-700 hover:bg-sausage-50' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`}
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
    </div>
  );
};
