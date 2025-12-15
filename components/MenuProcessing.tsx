import React, { useEffect, useState } from 'react';
import { SausageDogLogo, BoneIcon } from './DachshundAssets';
import { motion } from 'framer-motion';

const STEPS = [
  "Compressing images...",
  "Uploading to AI...",
  "Analyzing menu structure...",
  "Translating tasty treats...",
  "Identifying allergens...",
  "Finalizing details..."
];

export const MenuProcessing: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Simulate progress through steps
    const intervals = [1000, 1500, 3000, 2000, 1500, 2000];
    
    let stepIndex = 0;
    
    const advanceStep = () => {
      if (stepIndex < STEPS.length - 1) {
        stepIndex++;
        setCurrentStep(stepIndex);
        setTimeout(advanceStep, intervals[stepIndex] || 2000);
      }
    };

    const initialTimeout = setTimeout(advanceStep, intervals[0]);

    return () => clearTimeout(initialTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-sausage-50 p-8">
      <div className="relative mb-12">
         {/* Simple animation simulating sniffing */}
        <motion.div 
            animate={{ scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
        >
            <SausageDogLogo className="w-48 h-32" />
        </motion.div>
        <motion.div 
            className="absolute top-0 right-[-30px] text-sausage-400"
            animate={{ y: [0, -20, 0], rotate: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
        >
            <BoneIcon className="w-10 h-10" />
        </motion.div>
      </div>
      
      <div className="w-full max-w-xs space-y-4">
        {/* Progress Bar */}
        <div className="h-2 bg-sausage-200 rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-sausage-600"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5 }}
            />
        </div>

        {/* Text Steps */}
        <div className="h-8 relative overflow-hidden text-center">
            {STEPS.map((step, index) => (
                index === currentStep && (
                    <motion.p
                        key={step}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="absolute inset-0 w-full text-sausage-800 font-bold text-lg"
                    >
                        {step}
                    </motion.p>
                )
            ))}
        </div>
      </div>
    </div>
  );
};