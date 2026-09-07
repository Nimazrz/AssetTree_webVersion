import React, { useState } from 'react';
import { SymbolEntryEntity } from '../types';
import { X, Search, Plus, Trash2, RotateCcw, BookOpen, Check } from 'lucide-react';

interface SymbolBookDialogProps {
  symbols: SymbolEntryEntity[];
  onClose: () => void;
  onAddSymbol: (symbol: SymbolEntryEntity) => void;
  onDeleteSymbol: (rawSymbol: string) => void;
  onResetToDefaults: () => void;
}

export const SymbolBookDialog: React.FC<SymbolBookDialogProps> = ({
  symbols,
  onClose,
  onAddSymbol,
  onDeleteSymbol,
  onResetToDefaults,
}) => {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRaw, setNewRaw] = useState('');
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('سایر صنایع');

  const filtered = symbols.filter(
    (s) =>
      s.rawSymbol.toLowerCase().includes(search.toLowerCase()) ||
      s.canonicalName.toLowerCase().includes(search.toLowerCase()) ||
      s.industry.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRaw.trim() || !newName.trim()) return;

    onAddSymbol({
      rawSymbol: newRaw.trim(),
      canonicalName: newName.trim(),
      industry: newIndustry.trim() || 'سایر صنایع',
      source: 'MANUAL',
      lastUpdated: Date.now(),
      assetType: '',
    });

    setNewRaw('');
    setNewName('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                کتابچه نمادها و صنایع (Symbol Book)
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                نگاشت نمادهای بورس و بازار به نام‌های رسمی و گروه‌بندی صنایع
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search, Add new button, Reset button */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-symbol-book"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نماد، نام شرکت یا صنعت..."
              className="w-full pr-9 pl-3 py-1.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-toggle-add-symbol"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن نماد</span>
            </button>

            <button
              type="button"
              onClick={onResetToDefaults}
              title="بازنشانی به نمادهای پیش‌فرض TSETMC"
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add New Symbol Form Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end text-xs"
          >
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                نماد تابلوی بورس:
              </label>
              <input
                type="text"
                required
                value={newRaw}
                onChange={(e) => setNewRaw(e.target.value)}
                placeholder="مثال: فولاد"
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                نام رسمی / شرکت:
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: فولاد مبارکه اصفهان"
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                صنعت / طبقه‌بندی:
              </label>
              <input
                type="text"
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                placeholder="فلزات اساسی، خودرو..."
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>ثبت نماد</span>
            </button>
          </form>
        )}

        {/* Symbol List Table */}
        <div className="p-4 overflow-y-auto flex-1 max-h-96">
          <table className="w-full text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-2.5 px-3">نماد</th>
                <th className="py-2.5 px-3">نام کامل شرکت</th>
                <th className="py-2.5 px-3">صنعت</th>
                <th className="py-2.5 px-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.rawSymbol}
                  className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                    {item.rawSymbol}
                  </td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-200">
                    {item.canonicalName}
                  </td>
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs">
                      {item.industry}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteSymbol(item.rawSymbol)}
                      title="حذف نماد"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
