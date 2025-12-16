// constants.ts

// 使用 const object 來模擬 Enum，同時支援數值與型別
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

// 導出型別
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
