export interface AssetColorTheme {
  primary: string;
  lightTint: string;
  darkShade: string;
  containerBgDark: string;
  containerBgLight: string;
  textOrIconColor: string;
}

export const GOLD_PALETTE: AssetColorTheme = {
  primary: '#F59E0B',
  lightTint: '#FDE68A',
  darkShade: '#B45309',
  containerBgDark: 'rgba(245, 158, 11, 0.2)',
  containerBgLight: 'rgba(245, 158, 11, 0.12)',
  textOrIconColor: '#FBBF24',
};

export const COPPER_PALETTE: AssetColorTheme = {
  primary: '#EF4444',
  lightTint: '#FCA5A5',
  darkShade: '#991B1B',
  containerBgDark: 'rgba(239, 68, 68, 0.2)',
  containerBgLight: 'rgba(239, 68, 68, 0.12)',
  textOrIconColor: '#F87171',
};

export const SILVER_PALETTE: AssetColorTheme = {
  primary: '#94A3B8',
  lightTint: '#E2E8F0',
  darkShade: '#475569',
  containerBgDark: 'rgba(148, 163, 184, 0.2)',
  containerBgLight: 'rgba(148, 163, 184, 0.12)',
  textOrIconColor: '#CBD5E1',
};

export const CASH_PALETTE: AssetColorTheme = {
  primary: '#10B981',
  lightTint: '#A7F3D0',
  darkShade: '#047857',
  containerBgDark: 'rgba(16, 185, 129, 0.2)',
  containerBgLight: 'rgba(16, 185, 129, 0.12)',
  textOrIconColor: '#34D399',
};

export const REAL_ESTATE_PALETTE: AssetColorTheme = {
  primary: '#8D6E63',
  lightTint: '#D7CCC8',
  darkShade: '#4E342E',
  containerBgDark: 'rgba(141, 110, 99, 0.2)',
  containerBgLight: 'rgba(141, 110, 99, 0.12)',
  textOrIconColor: '#BCAAA4',
};

export const VEHICLE_PALETTE: AssetColorTheme = {
  primary: '#8B5CF6',
  lightTint: '#DDD6FE',
  darkShade: '#5B21B6',
  containerBgDark: 'rgba(139, 92, 246, 0.2)',
  containerBgLight: 'rgba(139, 92, 246, 0.12)',
  textOrIconColor: '#A78BFA',
};

export const STOCKS_PALETTE: AssetColorTheme = {
  primary: '#3B82F6',
  lightTint: '#BFDBFE',
  darkShade: '#1D4ED8',
  containerBgDark: 'rgba(59, 130, 246, 0.2)',
  containerBgLight: 'rgba(59, 130, 246, 0.12)',
  textOrIconColor: '#60A5FA',
};

export const TEAL_PALETTE: AssetColorTheme = {
  primary: '#0D9488',
  lightTint: '#99F6E4',
  darkShade: '#115E59',
  containerBgDark: 'rgba(13, 148, 136, 0.2)',
  containerBgLight: 'rgba(13, 148, 136, 0.12)',
  textOrIconColor: '#2DD4BF',
};

export const ORANGE_PALETTE: AssetColorTheme = {
  primary: '#EA580C',
  lightTint: '#FED7AA',
  darkShade: '#9A3412',
  containerBgDark: 'rgba(234, 88, 12, 0.2)',
  containerBgLight: 'rgba(234, 88, 12, 0.12)',
  textOrIconColor: '#FB923C',
};

export const PINK_PALETTE: AssetColorTheme = {
  primary: '#DB2777',
  lightTint: '#FBCFE8',
  darkShade: '#9D174D',
  containerBgDark: 'rgba(219, 39, 119, 0.2)',
  containerBgLight: 'rgba(219, 39, 119, 0.12)',
  textOrIconColor: '#F472B6',
};

export const INDIGO_PALETTE: AssetColorTheme = {
  primary: '#4F46E5',
  lightTint: '#C7D2FE',
  darkShade: '#312E81',
  containerBgDark: 'rgba(79, 70, 229, 0.2)',
  containerBgLight: 'rgba(79, 70, 229, 0.12)',
  textOrIconColor: '#818CF8',
};

export const DEFAULT_PALETTE: AssetColorTheme = {
  primary: '#0891B2',
  lightTint: '#A5F3FC',
  darkShade: '#164E63',
  containerBgDark: 'rgba(8, 145, 178, 0.2)',
  containerBgLight: 'rgba(8, 145, 178, 0.12)',
  textOrIconColor: '#22D3EE',
};

const OTHER_PALETTES = [
  TEAL_PALETTE,
  ORANGE_PALETTE,
  PINK_PALETTE,
  INDIGO_PALETTE,
  DEFAULT_PALETTE,
];

export function getPaletteForNode(
  name: string,
  categoryTag?: string | null,
  customColors: Record<string, string> = {}
): AssetColorTheme {
  const combined = `${name.toLowerCase()} ${categoryTag?.toLowerCase() || ''}`;

  for (const [key, colorHex] of Object.entries(customColors)) {
    if (combined.includes(key.toLowerCase())) {
      return {
        primary: colorHex,
        lightTint: colorHex,
        darkShade: colorHex,
        containerBgDark: 'rgba(255,255,255,0.1)',
        containerBgLight: 'rgba(0,0,0,0.05)',
        textOrIconColor: colorHex,
      };
    }
  }

  // Gold & Gold Funds
  if (['طلا', 'سکه', 'مسکوک', 'شمش طلا', 'آبشده', 'عیار', 'کهربا', 'زرفام', 'گوهر', 'لوتوس', 'ناب', 'زر', 'طلای', 'gold'].some(k => combined.includes(k))) {
    return GOLD_PALETTE;
  }
  // Copper
  if (['مس', 'کاتد', 'فملی', 'فباهنر', 'باهنر', 'مفتول مس', 'copper'].some(k => combined.includes(k))) {
    return COPPER_PALETTE;
  }
  // Silver
  if (['نقره', 'شمش نقره', 'ساینا', 'سیمین', 'صندوق نقره', 'silver'].some(k => combined.includes(k))) {
    return SILVER_PALETTE;
  }
  // Cash & Fixed Income
  if (['نقد', 'ریال', 'دلار', 'اسکناس', 'ارز', 'یورو', 'تتر', 'درهم', 'سپرده', 'درآمد ثابت', 'صندوق درآمد ثابت', 'کارا', 'اعتماد', 'افرا', 'حامی', 'صایند', 'ثبات', 'بانک', 'بانکی', 'سود', 'اوراق', 'cash'].some(k => combined.includes(k))) {
    return CASH_PALETTE;
  }
  // Real Estate
  if (['املاک', 'مستغلات', 'زمین', 'ساختمان', 'آپارتمان', 'ملک', 'ویلا', 'مغازه', 'دفتر', 'تجاری', 'مسکونی', 'سوله', 'real estate'].some(k => combined.includes(k))) {
    return REAL_ESTATE_PALETTE;
  }
  // Vehicles
  if (['خودرو', 'ماشین', 'اتومبیل', 'وانت', 'کامیون', 'وسایل نقلیه', 'vehicle', 'car'].some(k => combined.includes(k))) {
    return VEHICLE_PALETTE;
  }
  // Stocks
  if (['سهام', 'بورس', 'فرابورس', 'فولاد', 'پتروشیمی', 'پالایش', 'شپنا', 'شتران', 'فخوز', 'کگل', 'کچاد', 'stock'].some(k => combined.includes(k))) {
    return STOCKS_PALETTE;
  }

  // Hash-based selection for others
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % OTHER_PALETTES.length;
  return OTHER_PALETTES[index];
}

export const MAIN_LEGEND_ITEMS = [
  { title: 'طلا و مسکوکات', color: GOLD_PALETTE.primary, description: 'طلا، سکه و صندوق‌های طلا' },
  { title: 'مس و کاتد', color: COPPER_PALETTE.primary, description: 'مس و کاتد مس' },
  { title: 'نقره و مشتقات', color: SILVER_PALETTE.primary, description: 'نقره و شمش نقره' },
  { title: 'نقد و درآمد ثابت', color: CASH_PALETTE.primary, description: 'ریال، دلار، سپرده و درآمد ثابت' },
  { title: 'املاک و مستغلات', color: REAL_ESTATE_PALETTE.primary, description: 'ساختمان، زمین و املاک' },
  { title: 'خودرو و نقلیه', color: VEHICLE_PALETTE.primary, description: 'خودرو و وسایل نقلیه' },
  { title: 'سهام و بورس', color: STOCKS_PALETTE.primary, description: 'سهام بازار سرمایه' },
  { title: 'سایر دارایی‌ها', color: TEAL_PALETTE.primary, description: 'سایر دارایی‌ها و کالاها' },
];
