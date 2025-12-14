import { TargetLanguage } from './types';

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