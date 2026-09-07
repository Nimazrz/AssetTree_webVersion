import React, { useState } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { DEFAULT_ASSET_TEMPLATES } from '../data/assetTemplates';
import { TreeEngine } from '../core/TreeEngine';
import { formatCurrency, formatNumberWithCommas } from '../utils/numberFormat';
import { X, Sparkles, Check } from 'lucide-react';

interface AddChildDialogProps {
  parentNode: CalculatedNode;
  settings: DisplaySettings;
  onClose: () => void;
  onSave: (name: string, unitPriceRials: number, quantity: number, unit: string) => void;
}

export const AddChildDialog: React.FC<AddChildDialogProps> = ({
  parentNode,
  settings,
  onClose,
  onSave,
}) => {
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';

  const [name, setName] = useState('');
  const [unit, setUnit] = useState(isEn ? 'Unit' : 'عدد');
  const [quantityStr, setQuantityStr] = useState('1');
  const [unitPriceInputStr, setUnitPriceInputStr] = useState('0');
  const [inputUnitIsToman, setInputUnitIsToman] = useState(settings.currencyUnit === 'TOMAN');

  // Calculate live numbers
  const quantity = Math.max(0, parseFloat(quantityStr.replace(/,/g, '')) || 0);
  const rawUnitPriceInput = Math.max(0, parseFloat(unitPriceInputStr.replace(/,/g, '')) || 0);
  const unitPriceRials = inputUnitIsToman ? rawUnitPriceInput * 10 : rawUnitPriceInput;
  const totalRials = quantity * unitPriceRials;

  // Template select handler
  const handleSelectTemplate = (templateName: string, templateUnit: string) => {
    setName(templateName);
    setUnit(templateUnit);
  };

  // Smart quantity helper
  const handleSmartQuantity = () => {
    if (unitPriceRials > 0) {
      const smartQty = TreeEngine.calculateSmartDefaultQuantity(parentNode, unitPriceRials);
      setQuantityStr(smartQty.toString());
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), unitPriceRials, quantity, unit.trim() || (isEn ? 'Unit' : 'عدد'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {isEn ? 'Add New Asset or Sub-group' : 'افزودن دارایی یا گروه جدید'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn ? 'Inside category: ' : 'درون شاخه: '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{parentNode.name}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Quick Template Chips */}
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isEn ? 'Pre-built Templates (Quick Select):' : 'الگوهای آماده (انتخاب سریع):'}</span>
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {DEFAULT_ASSET_TEMPLATES.slice(0, 14).map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleSelectTemplate(t.name, t.unit)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Asset or Category Name *' : 'نام دارایی یا زیرگروه *'}
            </label>
            <input
              type="text"
              id="input-new-asset-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEn ? 'e.g., Gold Coin, Tech Stocks, Cash USD...' : 'مثال: سکه تمام طرح جدید، سهام فولاد، دلار نقدی...'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Quantity & Unit Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isEn ? 'Quantity / Amount' : 'تعداد / مقدار'}
                </label>
                {unitPriceRials > 0 && (
                  <button
                    type="button"
                    onClick={handleSmartQuantity}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isEn ? 'Smart Calc' : 'محاسبه هوشمند'}
                  </button>
                )}
              </div>
              <input
                type="text"
                id="input-new-asset-qty"
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                placeholder="1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Unit of Measurement' : 'واحد سنجش'}
              </label>
              <input
                type="text"
                id="input-new-asset-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={isEn ? 'unit, shares, grams...' : 'عدد، گرم، سهم...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Unit Price & Currency selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isEn ? `Unit Price (per ${unit || 'unit'})` : `قیمت واحد (هر ${unit || 'واحد'})`}
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setInputUnitIsToman(true)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    inputUnitIsToman
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {isEn ? 'Toman' : 'تومان'}
                </button>
                <button
                  type="button"
                  onClick={() => setInputUnitIsToman(false)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    !inputUnitIsToman
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {isEn ? 'Rial' : 'ریال'}
                </button>
              </div>
            </div>

            <input
              type="text"
              id="input-new-asset-price"
              value={unitPriceInputStr}
              onChange={(e) => setUnitPriceInputStr(e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
            {rawUnitPriceInput > 0 && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                {isEn ? 'Equivalent: ' : 'معادل: '}
                {formatNumberWithCommas(rawUnitPriceInput, settings.usePersianDigits, 0, lang)}{' '}
                {inputUnitIsToman ? (isEn ? 'Toman' : 'تومان') : (isEn ? 'Rial' : 'ریال')}
              </span>
            )}
          </div>

          {/* Live Total Value Card */}
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {isEn ? 'Total Asset Value:' : 'ارزش کل این دارایی:'}
            </span>
            <span className="text-sm font-black text-blue-700 dark:text-blue-300">
              {formatCurrency(totalRials, settings.currencyUnit, false, settings.usePersianDigits, false, lang)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-xs sm:text-sm cursor-pointer"
            >
              {isEn ? 'Cancel' : 'انصراف'}
            </button>

            <button
              type="submit"
              id="btn-confirm-add-child"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEn ? 'Save & Add' : 'ثبت و ذخیره'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
