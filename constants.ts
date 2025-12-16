// constants.ts

// 1. 我們在這裡直接定義 TargetLanguage 為常數物件 (解決 "only refers to a type" 錯誤)
export const TargetLanguage = {
  ChineseTW: 'ChineseTW',
  English: 'English',
  Korean: 'Korean',
  French: 'French',
  Spanish: 'Spanish',
  Thai: 'Thai',
  Filipino: 'Filipino',
  Vietnamese: 'Vietnamese',
} as const;

// 2. 同時導出型別，讓其他檔案也能用 (例如: lang: TargetLanguage)
export type TargetLanguage = typeof TargetLanguage[keyof typeof TargetLanguage];

export const GUMROAD_PRODUCT_PERMALINK = 'ihrnvp';

export const LANGUAGE_OPTIONS = [
  { value: TargetLanguage.ChineseTW, label: '繁體中文 (Chinese TW)', currency: 'TWD' },
  { value: TargetLanguage.English, label: 'English', currency: 'USD' },
  { value: TargetLanguage.Korean, label: '한국어 (Korean)', currency: 'KRW' },
  { value: TargetLanguage.French, label: 'Français (French)', currency: 'EUR' },
  { value: TargetLanguage.Spanish, label: 'Español (Spanish)', currency: 'EUR' },
  { value: TargetLanguage.Thai, label: 'ไทย (Thai)', currency: 'THB' },
  { value: TargetLanguage.Filipino, label: 'Tagalog (Filipino)', currency: 'PHP' },
  { value: TargetLanguage.Vietnamese, label: 'Tiếng Việt (Vietnamese)', currency: 'VND' },
];

export const getTargetCurrency = (lang: TargetLanguage): string => {
  const option = LANGUAGE_OPTIONS.find(opt => opt.value === lang);
  return option ? option.currency : 'USD';
};
