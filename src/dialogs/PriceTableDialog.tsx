import React, { useState, useMemo } from 'react';
import { AssetPriceItem, DisplaySettings, AppLanguage, DEFAULT_ASSET_TYPES } from '../types';
import { formatCurrency, formatNumberWithCommas } from '../utils/numberFormat';
import { formatPersianDate } from '../utils/persianDate';
import {
  X,
  Search,
  Plus,
  Edit2,
  Check,
  RefreshCw,
  Coins,
  TrendingUp,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';

interface PriceTableDialogProps {
  priceTable: AssetPriceItem[];
  settings: DisplaySettings;
  onClose: () => void;
  onSavePriceTable: (items: AssetPriceItem[]) => void;
  onApplyToTree: () => { updatedCount: number };
  onBackToSettings?: () => void;
}

export const PriceTableDialog: React.FC<PriceTableDialogProps> = ({
  priceTable,
  settings,
  onClose,
  onSavePriceTable,
  onApplyToTree,
  onBackToSettings,
}) => {
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';

  const [items, setItems] = useState<AssetPriceItem[]>(() => [...priceTable]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [currencyUnit, setCurrencyUnit] = useState<'TOMAN' | 'RIAL'>(settings.currencyUnit || 'TOMAN');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // New item draft
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newAssetType, setNewAssetType] = useState('طلا');
  const [newUnit, setNewUnit] = useState('واحد');
  const [newPriceInput, setNewPriceInput] = useState('');

  const isToman = currencyUnit === 'TOMAN';

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    DEFAULT_ASSET_TYPES.forEach((t) => set.add(t));
    items.forEach((it) => {
      if (it.assetType) set.add(it.assetType);
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchSearch =
        !searchQuery ||
        it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.symbol && it.symbol.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (it.assetType && it.assetType.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType =
        selectedTypeFilter === 'ALL' || it.assetType === selectedTypeFilter;

      return matchSearch && matchType;
    });
  }, [items, searchQuery, selectedTypeFilter]);

  const startEdit = (item: AssetPriceItem) => {
    setEditingId(item.id);
    const displayVal = isToman ? item.unitPrice / 10 : item.unitPrice;
    setEditPriceInput(displayVal ? displayVal.toString() : '0');
  };

  const saveEdit = (id: string) => {
    const rawVal = Math.max(0, parseFloat(editPriceInput.replace(/,/g, '')) || 0);
    const rialVal = isToman ? rawVal * 10 : rawVal;

    const next = items.map((it) => {
      if (it.id === id) {
        return {
          ...it,
          unitPrice: rialVal,
          updatedAt: Date.now(),
        };
      }
      return it;
    });
    setItems(next);
    onSavePriceTable(next);
    setEditingId(null);
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const rawVal = Math.max(0, parseFloat(newPriceInput.replace(/,/g, '')) || 0);
    const rialVal = isToman ? rawVal * 10 : rawVal;

    const newItem: AssetPriceItem = {
      id: `price_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newName.trim(),
      symbol: newSymbol.trim() || null,
      assetType: newAssetType.trim() || null,
      unit: newUnit.trim() || 'واحد',
      unitPrice: rialVal,
      updatedAt: Date.now(),
    };

    const next = [newItem, ...items];
    setItems(next);
    onSavePriceTable(next);

    setNewName('');
    setNewSymbol('');
    setNewPriceInput('');
    setShowAddForm(false);
    setNotification(isEn ? 'Asset price item added' : 'نرخ دارایی به جدول اضافه شد');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApplyToTree = () => {
    const res = onApplyToTree();
    setNotification(
      isEn
        ? `Applied prices to tree: ${res.updatedCount} assets updated`
        : `قیمت‌های جدول اعمال شد: ${res.updatedCount} گره در درخت به‌روز شدند`
    );
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isEn ? 'Asset Unit Price Table' : 'جدول قیمت واحد دارایی‌ها'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-normal">
                  {items.length} {isEn ? 'items' : 'قلم نرخ'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEn
                  ? 'Central price ledger for all asset nodes and bottom-up calculations'
                  : 'دفتر کل نرخ واحد دارایی‌ها؛ مبنای محاسبات ارزش درخت و به‌روزرسانی هماهنگ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBackToSettings();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
              >
                <span>{isEn ? 'Back to Settings' : 'بازگشت به تنظیمات'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-emerald-500 hover:underline">
              {isEn ? 'Dismiss' : 'بستن'}
            </button>
          </div>
        )}

        {/* Action Controls & Filters */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={isEn ? 'Search asset, symbol, or type...' : 'جستجوی نام دارایی، نماد یا نوع...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs"
              />
            </div>

            {/* Asset Type filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs focus:outline-hidden"
            >
              <option value="ALL">{isEn ? 'All Types' : 'همه انواع دارایی'}</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setCurrencyUnit('TOMAN')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  isToman
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {isEn ? 'Toman' : 'تومان'}
              </button>
              <button
                type="button"
                onClick={() => setCurrencyUnit('RIAL')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  !isToman
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {isEn ? 'Rial' : 'ریال'}
              </button>
            </div>

            {/* Apply to tree button */}
            <button
              type="button"
              onClick={handleApplyToTree}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title={isEn ? 'Update all leaf assets in tree with these unit prices' : 'به‌روزرسانی قیمت‌های برگ‌های درخت با این جدول'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Apply to Tree' : 'اعمال به کل درخت'}</span>
            </button>

            {/* Add new button */}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isEn ? 'New Price' : 'افزودن نرخ'}</span>
            </button>
          </div>
        </div>

        {/* Add Form Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleAddNewItem}
            className="p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 text-xs grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end animate-in fade-in"
          >
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Asset Name *' : 'نام دارایی *'}
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: طلای آب‌شده ۱۸ عیار"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Symbol' : 'نماد'}
              </label>
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="مثال: طلا ۱۸"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Asset Type' : 'نوع دارایی'}
              </label>
              <select
                value={newAssetType}
                onChange={(e) => setNewAssetType(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {DEFAULT_ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? `Unit Price (${isToman ? 'Toman' : 'Rial'}) *` : `قیمت واحد (${isToman ? 'تومان' : 'ریال'}) *`}
              </label>
              <input
                type="text"
                required
                value={newPriceInput}
                onChange={(e) => setNewPriceInput(e.target.value)}
                placeholder="۰"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                {isEn ? 'Save' : 'ثبت'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
              >
                {isEn ? 'Cancel' : 'انصراف'}
              </button>
            </div>
          </form>
        )}

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Coins className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p>{isEn ? 'No price entries found.' : 'هیچ رکوردی در جدول قیمت یافت نشد.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold">
                    <th className="py-2.5 px-3">{isEn ? 'Asset Name' : 'نام دارایی'}</th>
                    <th className="py-2.5 px-3">{isEn ? 'Symbol' : 'نماد'}</th>
                    <th className="py-2.5 px-3">{isEn ? 'Asset Type' : 'نوع دارایی'}</th>
                    <th className="py-2.5 px-3">{isEn ? 'Unit' : 'واحد'}</th>
                    <th className="py-2.5 px-3 text-left">
                      {isEn ? `Unit Rate (${isToman ? 'Toman' : 'Rial'})` : `نرخ واحد (${isToman ? 'تومان' : 'ریال'})`}
                    </th>
                    <th className="py-2.5 px-3">{isEn ? 'Last Updated' : 'آخرین ویرایش'}</th>
                    <th className="py-2.5 px-3 text-center">{isEn ? 'Actions' : 'عملیات'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map((item) => {
                    const isEditing = editingId === item.id;
                    const displayPrice = isToman ? item.unitPrice / 10 : item.unitPrice;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.symbol ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                              {item.symbol}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.assetType ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium text-[11px] border border-blue-200/50 dark:border-blue-800/40">
                              {item.assetType}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                          {item.unit || 'واحد'}
                        </td>
                        <td className="py-2.5 px-3 text-left">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <input
                                type="text"
                                autoFocus
                                value={editPriceInput}
                                onChange={(e) => setEditPriceInput(e.target.value)}
                                className="w-28 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-500 text-slate-900 dark:text-white text-left font-mono font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => saveEdit(item.id)}
                                className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                title={isEn ? 'Save' : 'ذخیره'}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {formatNumberWithCommas(displayPrice, settings.usePersianDigits)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {formatPersianDate(item.updatedAt, settings.usePersianDigits)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {!isEditing ? (
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                              title={isEn ? 'Edit Price' : 'ویرایش قیمت'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            {isEn
              ? 'Every add/edit automatically registers in this price ledger.'
              : 'افزودن یا ویرایش هر دارایی به صورت خودکار در این جدول ثبت و همگام‌سازی می‌شود.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {isEn ? 'Close' : 'بستن'}
          </button>
        </div>
      </div>
    </div>
  );
};
