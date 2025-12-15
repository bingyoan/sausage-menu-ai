// src/constants.ts
import { TargetLanguage } from './types';

export const getTargetCurrency = (language: TargetLanguage): string => {
  switch (language) {
    case TargetLanguage.ChineseTW:
      return 'TWD';
    case TargetLanguage.English:
      return 'USD';
    case TargetLanguage.Japanese:
      return 'JPY';
    case TargetLanguage.Korean:
      return 'KRW';
    case TargetLanguage.Thai:
      return 'THB';
    case TargetLanguage.French:
    case TargetLanguage.Spanish:
    case TargetLanguage.German:
      return 'EUR';
    case TargetLanguage.Vietnamese:
      return 'VND';
    case TargetLanguage.Filipino:
      return 'PHP';
    default:
      return 'USD';
  }
};