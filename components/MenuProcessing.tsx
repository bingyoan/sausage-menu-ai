import React, { useEffect, useState } from 'react';
import { SausageDogLogo, BoneIcon } from './DachshundAssets';

export const MenuProcessing: React.FC = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-sausage-50">
      <div className="relative">
         {/* Simple animation simulating sniffing */}
        <div className="animate-pulse">
            <SausageDogLogo className="w-40 h-28" />
        </div>
        <BoneIcon className="absolute top-0 right-[-30px] w-8 h-8 text-sausage-400 animate-bounce" />
      </div>
      
      <h2 className="text-2xl font-bold text-sausage-900 mt-8">Sniffing the menu{dots}</h2>
      <p className="text-sausage-700 mt-2">Detecting language & tasty treats...</p>
    </div>
  );
};
