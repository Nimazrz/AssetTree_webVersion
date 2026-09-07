import React, { useRef, useState } from 'react';
import { DisplaySettings, AppLanguage } from '../types';
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
  EyeOff,
  CheckCircle2,
  FileSpreadsheet,
  BookOpen,
  Database,
  Sun,
  Moon,
  Laptop,
  ArrowRight,
  ShieldAlert,
  Sparkles,
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
  onOpenExcelImport: () => void;
  onOpenSymbolBook: () => void;
}

type SettingsTab = 'appearance' | 'data' | 'backup';

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  settings,
  onClose,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetToDefaults,
  onWipeToZero,
  onOpenExcelImport,
  onOpenSymbolBook,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
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
      usePersianDigits: newLang === 'fa',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
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

        {/* Categorized Menu Tabs Bar */}
        <div className="flex items-center px-4 pt-2.5 pb-2 gap-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          {/* Tab 1: Appearance */}
          <button
            type="button"
            id="tab-settings-appearance"
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>{t.tabAppearance[lang]}</span>
          </button>

          {/* Tab 2: Data & Excel */}
          <button
            type="button"
            id="tab-settings-data"
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'data'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t.tabDataTools[lang]}</span>
          </button>

          {/* Tab 3: Backup & Storage */}
          <button
            type="button"
            id="tab-settings-backup"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>{t.tabBackupStorage[lang]}</span>
          </button>
        </div>

        {/* Content Body based on Active Tab */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm flex-1">
          {/* TAB 1: APPEARANCE & DISPLAY */}
          {activeTab === 'appearance' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Color Theme Selector */}
              <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-purple-500" />
                    <span>{t.themeMode[lang]}</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {settings.themeMode === 'LIGHT' ? t.light[lang] : settings.themeMode === 'DARK' ? t.dark[lang] : t.system[lang]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    id="btn-theme-light"
                    onClick={() => onUpdateSettings({ ...settings, themeMode: 'LIGHT' })}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      settings.themeMode === 'LIGHT'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                        : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.light[lang]}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-theme-dark"
                    onClick={() => onUpdateSettings({ ...settings, themeMode: 'DARK' })}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      settings.themeMode === 'DARK'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                        : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t.dark[lang]}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-theme-system"
                    onClick={() => onUpdateSettings({ ...settings, themeMode: 'SYSTEM' })}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      settings.themeMode === 'SYSTEM'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                        : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.system[lang]}</span>
                  </button>
                </div>
              </div>

              {/* Language Selection */}
              <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-150 dark:border-blue-900/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{t.languageSection[lang]}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                    {isEn ? 'English UI' : 'فارسی'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    id="btn-lang-persian"
                    onClick={() => handleLanguageChange('fa')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      !isEn
                        ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🇮🇷</span>
                      <div className="text-start">
                        <span className="block font-bold">فارسی</span>
                        <span className="text-[10px] text-slate-500 font-normal">قلم وزیری</span>
                      </div>
                    </div>
                    {!isEn && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </button>

                  <button
                    type="button"
                    id="btn-lang-english"
                    onClick={() => handleLanguageChange('en')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      isEn
                        ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🇬🇧</span>
                      <div className="text-start">
                        <span className="block font-bold">English</span>
                        <span className="text-[10px] text-slate-500 font-normal">English LTR</span>
                      </div>
                    </div>
                    {isEn && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </button>
                </div>
              </div>

              {/* Currency & Financial Units */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Default Currency */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {t.defaultCurrency[lang]}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      id="btn-currency-toman"
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
                      id="btn-currency-rial"
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

                {/* Digits Format */}
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
                      id="toggle-persian-digits"
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
                      {isEn ? 'K, M, B, T abbreviations' : 'همت، م.م.ت، م.ت'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="toggle-compact-currency"
                      checked={settings.compactCurrency}
                      onChange={(e) => onUpdateSettings({ ...settings, compactCurrency: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Percentage Decimals */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {isEn ? 'Percent Decimals:' : 'اعشار درصد:'}
                  </span>
                  <select
                    id="select-decimal-places"
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

              {/* Privacy Mode Option */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    {settings.privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-slate-800 dark:text-slate-200 font-bold block text-xs sm:text-sm">
                      {t.privacyOption[lang]}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.privacyOptionDesc[lang]}
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    id="toggle-privacy-mode"
                    checked={settings.privacyMode}
                    onChange={(e) => onUpdateSettings({ ...settings, privacyMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: DATA & EXCEL TOOLS */}
          {activeTab === 'data' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Excel Import Card */}
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {t.excelImportTitle[lang]}
                      </h4>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        {isEn ? 'Brokerage & Bourse Spreadsheets' : 'سازگار با خروجی کارگزاری‌ها'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t.excelImportDesc[lang]}
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    id="btn-settings-open-excel"
                    onClick={onOpenExcelImport}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{t.openExcelImportBtn[lang]}</span>
                  </button>
                </div>
              </div>

              {/* Symbol Book Card */}
              <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/30 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-2xs">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {t.symbolBookTitle[lang]}
                      </h4>
                      <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">
                        {isEn ? 'Nominal Values & Default Groups' : 'ضرایب اسمی و قوانین دسته‌بندی'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t.symbolBookDesc[lang]}
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    id="btn-settings-open-symbol-book"
                    onClick={onOpenSymbolBook}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{t.openSymbolBookBtn[lang]}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP & DATABASE */}
          {activeTab === 'backup' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Backup JSON Export & Import */}
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span>{t.dataManagement[lang]}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="btn-export-backup-json"
                    onClick={onExportBackup}
                    className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold transition-colors text-xs cursor-pointer shadow-2xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.exportJson[lang]}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-import-backup-json"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-semibold transition-colors text-xs cursor-pointer shadow-2xs"
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

              {/* Sensitive Actions & Resets */}
              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <h4 className="font-bold text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
                    {isEn ? 'Dangerous Actions & Resets' : 'عملیات حساس و بازنشانی'}
                  </h4>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {isEn
                    ? 'Use these actions to reset your portfolio data or wipe the entire local database.'
                    : 'از این گزینه‌ها برای بازگردانی اطلاعات نمونه اولیه یا پاکسازی کامل پایگاه‌داده محلی استفاده نمایید.'}
                </p>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    id="btn-reset-sample-portfolio"
                    onClick={() => {
                      if (window.confirm(t.resetConfirm[lang])) {
                        onResetToDefaults();
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
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
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.wipeAll[lang]}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-slate-400">
            {isEn ? 'Changes take effect immediately' : 'تغییرات به صورت آنی اعمال می‌شوند'}
          </span>
          <button
            type="button"
            id="btn-close-settings-modal"
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
