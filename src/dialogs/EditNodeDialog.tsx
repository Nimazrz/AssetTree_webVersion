import React, { useState, useMemo } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage, DEFAULT_ASSET_TYPES } from '../types';
import { formatCurrency, formatNumberWithCommas } from '../utils/numberFormat';
import { X, Check, Calculator } from 'lucide-react';

interface EditNodeDialogProps {
  node: CalculatedNode;
  settings: DisplaySettings;
  allNodes?: CalculatedNode[];
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

export const EditNodeDialog: React.FC<EditNodeDialogProps> = ({
  node,
  settings,
  allNodes = [],
  onClose,
  onSave,
}) => {
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';

  const [name, setName] = useState(node.name);
  const [symbol, setSymbol] = useState(node.symbol || '');
  const [assetType, setAssetType] = useState(node.assetType || 'طلا');
  const [unit, setUnit] = useState(node.unit || (isEn ? 'Unit' : 'عدد'));
  const [quantityStr, setQuantityStr] = useState(node.quantity.toString());

  // In stored state, unitPrice is in Rials
  const [inputUnitIsToman, setInputUnitIsToman] = useState(settings.currencyUnit === 'TOMAN');
  const initialDisplayPrice = inputUnitIsToman ? node.unitPrice / 10 : node.unitPrice;
  const [unitPriceInputStr, setUnitPriceInputStr] = useState(initialDisplayPrice.toString());

  const initialTotal = node.quantity * initialDisplayPrice;
  const [totalValueInputStr, setTotalValueInputStr] = useState(initialTotal.toString());

  // Available asset types
  const availableAssetTypes = useMemo(() => {
    const set = new Set<string>(DEFAULT_ASSET_TYPES);
    allNodes.forEach((n) => {
      if (n.assetType && n.assetType.trim()) set.add(n.assetType.trim());
    });
    if (node.assetType) set.add(node.assetType);
    return Array.from(set);
  }, [allNodes, node]);

  // Bidirectional calculations
  const handleQuantityChange = (val: string) => {
    setQuantityStr(val);
    const q = Math.max(0, parseFloat(val.replace(/,/g, '')) || 0);
    const p = Math.max(0, parseFloat(unitPriceInputStr.replace(/,/g, '')) || 0);
    const tot = q * p;
    setTotalValueInputStr(tot > 0 ? tot.toString() : '0');
  };

  const handleUnitPriceChange = (val: string) => {
    setUnitPriceInputStr(val);
    const p = Math.max(0, parseFloat(val.replace(/,/g, '')) || 0);
    const q = Math.max(0, parseFloat(quantityStr.replace(/,/g, '')) || 0);
    const tot = q * p;
    setTotalValueInputStr(tot > 0 ? tot.toString() : '0');
  };

  const handleTotalValueChange = (val: string) => {
    setTotalValueInputStr(val);
    const tot = Math.max(0, parseFloat(val.replace(/,/g, '')) || 0);
    const p = Math.max(0, parseFloat(unitPriceInputStr.replace(/,/g, '')) || 0);
    if (p > 0) {
      const computedQty = parseFloat((tot / p).toFixed(6));
      setQuantityStr(computedQty.toString());
    }
  };

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
  const rawUnitPriceInput = Math.max(0, parseFloat(unitPriceInputStr.replace(/,/g, '')) || 0);
  const unitPriceRials = inputUnitIsToman ? rawUnitPriceInput * 10 : rawUnitPriceInput;
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
              {isEn ? 'Edit Asset Properties' : 'ویرایش مشخصات دارایی'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn ? 'Node ID: ' : 'شناسه: '} {node.id}
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
          {/* Asset Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Asset or Group Name *' : 'نام دارایی یا گروه *'}
            </label>
            <input
              type="text"
              id="input-edit-asset-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Symbol & Asset Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Symbol' : 'نماد'}
              </label>
              <input
                type="text"
                id="input-edit-asset-symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder={isEn ? 'e.g. Gold18, FOOLAD' : 'مثال: طلا ۱۸، فولاد، سکه'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Asset Type (Classification) *' : 'نوع دارایی (جهت طبقه‌بندی) *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="edit-asset-types-datalist"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  placeholder={isEn ? 'Select or type type' : 'انتخاب یا تایپ نوع دارایی'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <datalist id="edit-asset-types-datalist">
                  {availableAssetTypes.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* If node is a group, explain that price is bottom-up aggregated */}
          {node.isGroup ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
              {isEn
                ? `This node is an "Asset Group" containing ${node.children.length} sub-items. Its total value is automatically computed by summing all child assets bottom-up.`
                : `این گره یک «گروه دارایی» است که شامل ${node.children.length} زیرمجموعه می‌باشد. ارزش کل آن به صورت خودکار از جمع ارزش اعضای زیرمجموعه محاسبه می‌شود.`}
            </div>
          ) : (
            <>
              {/* Quantity & Unit Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Quantity / Amount' : 'تعداد / مقدار'}
                  </label>
                  <input
                    type="text"
                    id="input-edit-asset-qty"
                    value={quantityStr}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Unit of Measurement' : 'واحد سنجش'}
                  </label>
                  <input
                    type="text"
                    id="input-edit-asset-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
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
                  id="input-edit-asset-price"
                  value={unitPriceInputStr}
                  onChange={(e) => handleUnitPriceChange(e.target.value)}
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
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
                <div className="flex justify-between items-center text-[11px] text-blue-800 dark:text-blue-300 pt-0.5">
                  <span>{isEn ? 'Equivalent in Portfolio:' : 'ارزش معادل در سبد:'}</span>
                  <span className="font-bold">
                    {formatCurrency(totalRials, settings.currencyUnit, false, settings.usePersianDigits, false, lang)}
                  </span>
                </div>
              </div>
            </>
          )}

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
              id="btn-confirm-edit-node"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEn ? 'Save Changes' : 'ذخیره تغییرات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
