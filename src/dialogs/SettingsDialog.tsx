import React, { useRef } from 'react';
import { DisplaySettings, CurrencyUnit, AppLanguage } from '../types';
import {
  X,
  Settings as SettingsIcon,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Sliders,
  Globe,
  Palette,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

interface SettingsDialogProps {
  settings: DisplaySettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: DisplaySettings) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonString: string) => void;
  onResetToDefaults: () => void;
  onWipeToZero: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  settings,
  onClose,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetToDefaults,
  onWipeToZero,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';
  const t = TRANSLATIONS.settingsDialog;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        onImportBackup(content);
      }
    };
    reader.readAsText(file);
  };

  const handleLanguageChange = (newLang: AppLanguage) => {
    onUpdateSettings({
      ...settings,
      language: newLang,
      // When switching to English, default to English digits for consistency
      usePersianDigits: newLang === 'fa' ? true : false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {t.title[lang]}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t.subtitle[lang]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Section 0: Application Language Switcher (Primary Requested Feature) */}
          <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-blue-950 dark:text-blue-200 text-xs sm:text-sm flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t.languageSection[lang]}</span>
              </h3>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                {isEn ? 'English UI' : 'فونت وزیری'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {isEn
                ? 'Switch application menus and layout direction between Persian and English.'
                : 'انتخاب زبان منوها و جهت چیدمان سامانه (راست‌به‌چپ یا چپ‌به‌راست).'}
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Persian Option */}
              <button
                type="button"
                id="btn-lang-persian"
                onClick={() => handleLanguageChange('fa')}
                className={`flex items-center justify-between p-3 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  !isEn
                    ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500'
                    : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🇮🇷</span>
                  <div className="text-start">
                    <span className="block font-bold">فارسی</span>
                    <span className="text-[10px] text-slate-500 font-normal">قلم وزیری (Vazirmatn)</span>
                  </div>
                </div>
                {!isEn && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </button>

              {/* English Option */}
              <button
                type="button"
                id="btn-lang-english"
                onClick={() => handleLanguageChange('en')}
                className={`flex items-center justify-between p-3 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  isEn
                    ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500'
                    : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🇬🇧</span>
                  <div className="text-start">
                    <span className="block font-bold">English</span>
                    <span className="text-[10px] text-slate-500 font-normal">English Menus & LTR</span>
                  </div>
                </div>
                {isEn && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </button>
            </div>
          </div>

          {/* Section 1: Financial Units & Format */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>{t.financialUnits[lang]}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Currency Selector */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {t.defaultCurrency[lang]}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, currencyUnit: 'TOMAN' })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settings.currencyUnit === 'TOMAN'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t.toman[lang]}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, currencyUnit: 'RIAL' })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      settings.currencyUnit === 'RIAL'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t.rial[lang]}
                  </button>
                </div>
              </div>

              {/* Digits Toggle */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium block">
                    {t.digitsFormat[lang]}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {settings.usePersianDigits ? t.persianDigits[lang] : t.englishDigits[lang]}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.usePersianDigits}
                    onChange={(e) => onUpdateSettings({ ...settings, usePersianDigits: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Compact Currency Notation */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium block">
                    {t.compactCurrency[lang]}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isEn ? 'K, M, B, T abbreviations' : 'همت، م.م.ت، م.ت، ه.ت'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.compactCurrency}
                    onChange={(e) => onUpdateSettings({ ...settings, compactCurrency: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Decimal places */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {isEn ? 'Percent Decimals:' : 'تعداد ارقام اعشار درصد:'}
                </span>
                <select
                  value={settings.decimalPlaces}
                  onChange={(e) => onUpdateSettings({ ...settings, decimalPlaces: parseInt(e.target.value) })}
                  className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value={0}>{isEn ? '0 (0%)' : 'بدون اعشار (۰٪)'}</option>
                  <option value={1}>{isEn ? '1 (0.0%)' : '۱ رقم اعشار (۰/۰٪)'}</option>
                  <option value={2}>{isEn ? '2 (0.00%)' : '۲ رقم اعشار (۰/۰۰٪)'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Appearance & Theme */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-purple-500" />
              <span>{t.appearance[lang]}</span>
            </h3>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {t.themeMode[lang]}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, themeMode: 'LIGHT' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.themeMode === 'LIGHT'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.light[lang]}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, themeMode: 'DARK' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.themeMode === 'DARK'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.dark[lang]}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, themeMode: 'SYSTEM' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.themeMode === 'SYSTEM'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.system[lang]}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Backup & Restore */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-500" />
              <span>{t.dataManagement[lang]}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-export-backup-json"
                onClick={onExportBackup}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold transition-colors text-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t.exportJson[lang]}</span>
              </button>

              <button
                type="button"
                id="btn-import-backup-json"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-semibold transition-colors text-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{t.importJson[lang]}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* Section 4: Dangerous Zones */}
          <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
              {isEn ? 'Dangerous Actions & Resets' : 'عملیات حساس و بازنشانی'}
            </h3>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                id="btn-reset-sample-portfolio"
                onClick={() => {
                  if (window.confirm(t.resetConfirm[lang])) {
                    onResetToDefaults();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.resetSample[lang]}</span>
              </button>

              <button
                type="button"
                id="btn-wipe-database-zero"
                onClick={() => {
                  if (window.confirm(t.wipeConfirm[lang])) {
                    onWipeToZero();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors text-xs font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.wipeAll[lang]}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            {isEn ? 'Done' : 'بستن'}
          </button>
        </div>
      </div>
    </div>
  );
};
