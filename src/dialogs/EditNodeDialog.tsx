import React, { useState } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { formatCurrency } from '../utils/numberFormat';
import { X, Check } from 'lucide-react';

interface EditNodeDialogProps {
  node: CalculatedNode;
  settings: DisplaySettings;
  onClose: () => void;
  onSave: (name: string, unitPriceRials: number, quantity: number, unit: string) => void;
}

export const EditNodeDialog: React.FC<EditNodeDialogProps> = ({
  node,
  settings,
  onClose,
  onSave,
}) => {
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';

  const [name, setName] = useState(node.name);
  const [unit, setUnit] = useState(node.unit || (isEn ? 'Unit' : 'عدد'));
  const [quantityStr, setQuantityStr] = useState(node.quantity.toString());

  // In stored state, unitPrice is in Rials
  const [inputUnitIsToman, setInputUnitIsToman] = useState(settings.currencyUnit === 'TOMAN');
  const initialDisplayPrice = inputUnitIsToman ? node.unitPrice / 10 : node.unitPrice;
  const [unitPriceInputStr, setUnitPriceInputStr] = useState(initialDisplayPrice.toString());

  const quantity = Math.max(0, parseFloat(quantityStr.replace(/,/g, '')) || 0);
  const rawUnitPriceInput = Math.max(0, parseFloat(unitPriceInputStr.replace(/,/g, '')) || 0);
  const unitPriceRials = inputUnitIsToman ? rawUnitPriceInput * 10 : rawUnitPriceInput;
  const totalRials = quantity * unitPriceRials;

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
                    onChange={(e) => setQuantityStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
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

              {/* Unit Price */}
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
                  id="input-edit-asset-price"
                  value={unitPriceInputStr}
                  onChange={(e) => setUnitPriceInputStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Live Total Value Card */}
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {isEn ? 'New Total Value:' : 'ارزش کل جدید:'}
                </span>
                <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                  {formatCurrency(totalRials, settings.currencyUnit, false, settings.usePersianDigits, false, lang)}
                </span>
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
