import { TargetLanguage } from './types';

// 這是 Gumroad 的產品連結
export const GUMROAD_PRODUCT_PERMALINK = 'sausage-menu-ai'; 

export const LANGUAGE_OPTIONS = [
  { code: TargetLanguage.ChineseTW, label: '🇹🇼 繁體中文', flag: '🇹🇼' },
  { code: TargetLanguage.English, label: '🇺🇸 English', flag: '🇺🇸' },
  { code: TargetLanguage.Japanese, label: '🇯🇵 日本語', flag: '🇯🇵' },
  { code: TargetLanguage.Korean, label: '🇰🇷 한국어', flag: '🇰🇷' },
  { code: TargetLanguage.Thai, label: '🇹🇭 Thai', flag: '🇹🇭' },
  { code: TargetLanguage.French, label: '🇫🇷 French', flag: '🇫🇷' },
  { code: TargetLanguage.Spanish, label: '🇪🇸 Spanish', flag: '🇪🇸' },
  { code: TargetLanguage.German, label: '🇩🇪 German', flag: '🇩🇪' },
  { code: TargetLanguage.Vietnamese, label: '🇻🇳 Vietnamese', flag: '🇻🇳' },
  { code: TargetLanguage.Filipino, label: '🇵🇭 Filipino', flag: '🇵🇭' },
];

export const getTargetCurrency = (language: TargetLanguage): string => {
  switch (language) {
    case TargetLanguage.ChineseTW: return 'TWD';
    case TargetLanguage.English: return 'USD';
    case TargetLanguage.Japanese: return 'JPY';
    case TargetLanguage.Korean: return 'KRW';
    case TargetLanguage.Thai: return 'THB';
    case TargetLanguage.French:
    case TargetLanguage.Spanish:
    case TargetLanguage.German: return 'EUR';
    case TargetLanguage.Vietnamese: return 'VND';
    case TargetLanguage.Filipino: return 'PHP';
    default: return 'USD';
  }
};