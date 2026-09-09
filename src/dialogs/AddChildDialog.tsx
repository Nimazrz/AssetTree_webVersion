import React, { useState, useMemo, useEffect } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage, DEFAULT_ASSET_TYPES, AssetPriceItem } from '../types';
import { DEFAULT_ASSET_TEMPLATES } from '../data/assetTemplates';
import { TreeEngine } from '../core/TreeEngine';
import { formatCurrency, formatNumberWithCommas } from '../utils/numberFormat';
import { X, Sparkles, Check, ChevronDown, Calculator, Tag, Coins } from 'lucide-react';

interface AddChildDialogProps {
  parentNode: CalculatedNode;
  settings: DisplaySettings;
  allNodes?: CalculatedNode[];
  priceTable?: AssetPriceItem[];
  onClose: () => void;
  onSave: (
    name: string,
    unitPriceRials: number,
    quantity: number,
    unit: string,
    symbol?: string | null,
    assetType?: string | null
  ) => void;
}

export const AddChildDialog: React.FC<AddChildDialogProps> = ({
  parentNode,
  settings,
  allNodes = [],
  priceTable = [],
  onClose,
  onSave,
}) => {
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState('طلا');
  const [unit, setUnit] = useState(isEn ? 'Unit' : 'عدد');
  const [quantityStr, setQuantityStr] = useState('1');
  const [unitPriceInputStr, setUnitPriceInputStr] = useState('0');
  const [totalValueInputStr, setTotalValueInputStr] = useState('0');
  const [inputUnitIsToman, setInputUnitIsToman] = useState(settings.currencyUnit === 'TOMAN');

  // Collect existing asset names from tree and price table for combobox
  const existingAssetNames = useMemo(() => {
    const namesSet = new Set<string>();
    allNodes.forEach((n) => {
      if (n.depth > 0 && n.name.trim()) namesSet.add(n.name.trim());
    });
    priceTable.forEach((p) => {
      if (p.name.trim()) namesSet.add(p.name.trim());
    });
    DEFAULT_ASSET_TEMPLATES.forEach((t) => namesSet.add(t.name));
    return Array.from(namesSet).sort();
  }, [allNodes, priceTable]);

  // Collect existing asset types for combobox
  const availableAssetTypes = useMemo(() => {
    const typesSet = new Set<string>(DEFAULT_ASSET_TYPES);
    allNodes.forEach((n) => {
      if (n.assetType && n.assetType.trim()) typesSet.add(n.assetType.trim());
    });
    priceTable.forEach((p) => {
      if (p.assetType && p.assetType.trim()) typesSet.add(p.assetType.trim());
    });
    return Array.from(typesSet);
  }, [allNodes, priceTable]);

  // When selecting an existing name, auto-fill unit, symbol, assetType, and price if available
  const handleSelectName = (selectedName: string) => {
    setName(selectedName);

    // Look in price table first
    const priceEntry = priceTable.find((p) => p.name.trim().toLowerCase() === selectedName.trim().toLowerCase());
    if (priceEntry) {
      if (priceEntry.unit) setUnit(priceEntry.unit);
      if (priceEntry.symbol) setSymbol(priceEntry.symbol);
      if (priceEntry.assetType) setAssetType(priceEntry.assetType);
      if (priceEntry.unitPrice > 0) {
        const displayPrice = inputUnitIsToman ? priceEntry.unitPrice / 10 : priceEntry.unitPrice;
        setUnitPriceInputStr(displayPrice.toString());
        const q = Math.max(0, parseFloat(quantityStr.replace(/,/g, '')) || 0);
        const total = q * displayPrice;
        setTotalValueInputStr(total > 0 ? total.toString() : '0');
      }
      return;
    }

    // Look in existing nodes
    const nodeEntry = allNodes.find((n) => n.name.trim().toLowerCase() === selectedName.trim().toLowerCase());
    if (nodeEntry) {
      if (nodeEntry.unit) setUnit(nodeEntry.unit);
      if (nodeEntry.symbol) setSymbol(nodeEntry.symbol);
      if (nodeEntry.assetType) setAssetType(nodeEntry.assetType);
      if (nodeEntry.unitPrice > 0) {
        const displayPrice = inputUnitIsToman ? nodeEntry.unitPrice / 10 : nodeEntry.unitPrice;
        setUnitPriceInputStr(displayPrice.toString());
        const q = Math.max(0, parseFloat(quantityStr.replace(/,/g, '')) || 0);
        const total = q * displayPrice;
        setTotalValueInputStr(total > 0 ? total.toString() : '0');
      }
      return;
    }

    // Look in templates
    const tmpl = DEFAULT_ASSET_TEMPLATES.find((t) => t.name === selectedName);
    if (tmpl) {
      setUnit(tmpl.unit);
    }
  };

  // Bidirectional calculations:
  // 1. When Quantity changes -> update Total Value
  const handleQuantityChange = (val: string) => {
    setQuantityStr(val);
    const q = Math.max(0, parseFloat(val.replace(/,/g, '')) || 0);
    const p = Math.max(0, parseFloat(unitPriceInputStr.replace(/,/g, '')) || 0);
    const tot = q * p;
    setTotalValueInputStr(tot > 0 ? tot.toString() : '0');
  };

  // 2. When Unit Price changes -> update Total Value
  const handleUnitPriceChange = (val: string) => {
    setUnitPriceInputStr(val);
    const p = Math.max(0, parseFloat(val.replace(/,/g, '')) || 0);
    const q = Math.max(0, parseFloat(quantityStr.replace(/,/g, '')) || 0);
    const tot = q * p;
    setTotalValueInputStr(tot > 0 ? tot.toString() : '0');
  };

  // 3. When Total Value changes -> recalculate Quantity: quantity = totalValue / unitPrice
  const handleTotalValueChange = (val: string) => {
    setTotalValueInputStr(val);
    const tot = Math.max(0, parseFloat(val.replace(/,/g, '')) || 0);
    const p = Math.max(0, parseFloat(unitPriceInputStr.replace(/,/g, '')) || 0);
    if (p > 0) {
      const computedQty = parseFloat((tot / p).toFixed(6));
      setQuantityStr(computedQty.toString());
    }
  };

  // Currency toggle (Toman vs Rial)
  const handleCurrencyToggle = (toToman: boolean) => {
    if (toToman === inputUnitIsToman) return;
    const factor = toToman ? 0.1 : 10;
    setInputUnitIsToman(toToman);

    const currentP = parseFloat(unitPriceInputStr.replace(/,/g, '')) || 0;
    if (currentP > 0) {
      setUnitPriceInputStr((currentP * factor).toString());
    }
    const currentTot = parseFloat(totalValueInputStr.replace(/,/g, '')) || 0;
    if (currentTot > 0) {
      setTotalValueInputStr((currentTot * factor).toString());
    }
  };

  const parsedQty = Math.max(0, parseFloat(quantityStr.replace(/,/g, '')) || 0);
  const parsedUnitPrice = Math.max(0, parseFloat(unitPriceInputStr.replace(/,/g, '')) || 0);
  const unitPriceRials = inputUnitIsToman ? parsedUnitPrice * 10 : parsedUnitPrice;
  const totalRials = parsedQty * unitPriceRials;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(
      name.trim(),
      unitPriceRials,
      parsedQty,
      unit.trim() || (isEn ? 'Unit' : 'عدد'),
      symbol.trim() || null,
      assetType.trim() || null
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {isEn ? 'Add New Asset' : 'افزودن دارایی جدید'}
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
              <span>{isEn ? 'Pre-built Templates (Quick Select):' : 'الگوهای سریع طلا و دارایی‌ها:'}</span>
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
              {DEFAULT_ASSET_TEMPLATES.slice(0, 15).map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleSelectName(t.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors border cursor-pointer ${
                    name === t.name
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Name Combobox */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Asset Name * (ComboBox: Existing or New)' : 'نام دارایی * (کومبوباکس: انتخاب از لیست یا نام جدید)'}
            </label>
            <div className="relative">
              <input
                type="text"
                id="input-new-asset-name"
                list="asset-names-datalist"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  handleSelectName(e.target.value);
                }}
                placeholder={isEn ? 'Type or select an asset name...' : 'نام دارایی را بنویسید یا از لیست انتخاب کنید...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
              <datalist id="asset-names-datalist">
                {existingAssetNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Symbol & Asset Type Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Symbol */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Symbol' : 'نماد'}
              </label>
              <input
                type="text"
                id="input-new-asset-symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder={isEn ? 'e.g. Gold18, FOOLAD' : 'مثال: طلا ۱۸، فولاد، سکه'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Asset Type Combobox */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Asset Type (Classification) *' : 'نوع دارایی (جهت طبقه‌بندی) *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="asset-types-datalist"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  placeholder={isEn ? 'Select or type type' : 'انتخاب یا تایپ نوع دارایی'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <datalist id="asset-types-datalist">
                  {availableAssetTypes.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Quantity & Unit Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Quantity / Amount' : 'تعداد / مقدار'}
              </label>
              <input
                type="text"
                id="input-new-asset-qty"
                value={quantityStr}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
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
                placeholder={isEn ? 'unit, shares, grams...' : 'عدد، گرم، سهم، متر...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Unit Price & Currency Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isEn ? `Unit Price (per ${unit || 'unit'})` : `قیمت واحد (هر ${unit || 'واحد'})`}
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleCurrencyToggle(true)}
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
                  onClick={() => handleCurrencyToggle(false)}
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
              onChange={(e) => handleUnitPriceChange(e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* Bidirectional Total Value Field */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/60 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>
                  {isEn
                    ? `Total Asset Value (${inputUnitIsToman ? 'Toman' : 'Rial'}):`
                    : `ارزش کل دارایی (${inputUnitIsToman ? 'تومان' : 'ریال'}):`}
                </span>
              </label>
              <span className="text-[10px] text-slate-400">
                {isEn ? 'Auto-calculates quantity if changed' : 'محاسبه دوطرفه: با تغییر این فیلد، تعداد خودکار تنظیم می‌شود'}
              </span>
            </div>
            <input
              type="text"
              value={totalValueInputStr}
              onChange={(e) => handleTotalValueChange(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-slate-900 dark:text-white font-mono font-bold text-sm"
            />
            <div className="flex justify-between items-center text-[11px] text-blue-800 dark:text-blue-300 pt-0.5">
              <span>{isEn ? 'Final Portfolio Value:' : 'ارزش معادل در سبد:'}</span>
              <span className="font-bold">
                {formatCurrency(totalRials, settings.currencyUnit, false, settings.usePersianDigits, false, lang)}
              </span>
            </div>
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
