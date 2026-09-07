import React from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import { getPaletteForNode } from '../utils/assetColors';
import {
  formatCurrency,
  formatPercentage,
  formatNumberWithCommas,
} from '../utils/numberFormat';
import {
  X,
  Plus,
  Edit2,
  Move,
  Trash2,
  Calendar,
  Layers,
  Coins,
  ArrowUpRight,
} from 'lucide-react';

interface NodeDetailsProps {
  node: CalculatedNode;
  settings: DisplaySettings;
  isRoot: boolean;
  onClose: () => void;
  onAddChild: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
  onSelectChildNode: (child: CalculatedNode) => void;
}

export const NodeDetailsDialog: React.FC<NodeDetailsProps> = ({
  node,
  settings,
  isRoot,
  onClose,
  onAddChild,
  onEdit,
  onMove,
  onDelete,
  onSelectChildNode,
}) => {
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';
  const palette = getPaletteForNode(node.name, node.categoryTag, settings.customAssetColors);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Palette Color Stripe */}
        <div
          className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800"
          style={{ borderTop: `4px solid ${palette.primary}` }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: palette.primary }}
            >
              {node.isGroup ? <Layers className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {node.name}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isRoot
                  ? (isEn ? 'Portfolio Root' : 'شاخه اصلی پورتفو')
                  : node.isGroup
                  ? (isEn ? `Category Group (Depth ${node.depth})` : `گروه دارایی (عمق ${node.depth})`)
                  : (isEn ? `Direct Asset (Depth ${node.depth})` : `دارایی تکین (عمق ${node.depth})`)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Main Financial Values Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isEn ? 'Bottom-up Calculated Total Value' : 'ارزش کل محاسبه‌شده (پایین‌به‌بالا)'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(
                node.totalValue,
                settings.currencyUnit,
                false,
                settings.usePersianDigits,
                settings.privacyMode,
                lang
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>{isEn ? 'Value in Toman:' : 'ارزش به تومان:'}</span>
              <span className="font-bold">
                {formatCurrency(node.totalValue, 'TOMAN', false, settings.usePersianDigits, settings.privacyMode, lang)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>{isEn ? 'Value in Rial:' : 'ارزش به ریال:'}</span>
              <span className="font-bold">
                {formatCurrency(node.totalValue, 'RIAL', false, settings.usePersianDigits, settings.privacyMode, lang)}
              </span>
            </div>
          </div>

          {/* Metrics Grid: % of Total & % of Group */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col">
              <span className="text-slate-500 dark:text-slate-400 text-xs mb-1">
                {isEn ? 'Share of Total Portfolio' : 'سهم از کل پورتفو'}
              </span>
              <span className="text-lg font-black text-blue-700 dark:text-blue-300">
                {formatPercentage(node.percentOfTotal, settings.decimalPlaces, settings.usePersianDigits, lang)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex flex-col">
              <span className="text-slate-500 dark:text-slate-400 text-xs mb-1">
                {isEn ? 'Share of Parent Group' : 'سهم از گروه بالادست'}
              </span>
              <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                {isRoot || node.depth <= 1
                  ? (isEn ? '100%' : '۱۰۰٪')
                  : formatPercentage(node.percentOfGroup, settings.decimalPlaces, settings.usePersianDigits, lang)}
              </span>
            </div>
          </div>

          {/* Leaf parameters: Quantity, Unit, Unit Price */}
          {!node.isGroup && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Quantity / Amount:' : 'تعداد / مقدار دارایی:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {formatNumberWithCommas(node.quantity, settings.usePersianDigits, 2, lang)} {node.unit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {isEn ? `Unit Price (per ${node.unit}):` : `قیمت واحد (هر ${node.unit}):`}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(node.unitPrice, settings.currencyUnit, false, settings.usePersianDigits, settings.privacyMode, lang)}
                </span>
              </div>
            </div>
          )}

          {/* Children List (if group) */}
          {node.isGroup && node.children.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {isEn
                    ? `Direct Sub-items (${node.children.length} items)`
                    : `زیرمجموعه‌های مستقیم (${node.children.length} عضو)`}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isEn ? `Total subtree: ${node.childCount}` : `کل زیرشاخه‌ها: ${node.childCount}`}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {node.children.map((child) => (
                  <div
                    key={child.id}
                    onClick={() => onSelectChildNode(child)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {child.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(child.totalValue, settings.currencyUnit, true, settings.usePersianDigits, settings.privacyMode, lang)}
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                        {formatPercentage(child.percentOfGroup, settings.decimalPlaces, settings.usePersianDigits, lang)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Creation date */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {isEn ? 'Created At: ' : 'تاریخ ایجاد: '}
              {new Date(node.createdAt).toLocaleDateString(isEn ? 'en-US' : 'fa-IR')}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onAddChild}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'Add Sub-item' : 'افزودن زیرمجموعه'}</span>
          </button>

          {!isRoot && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEn ? 'Edit' : 'ویرایش'}</span>
              </button>

              <button
                type="button"
                onClick={onMove}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer"
              >
                <Move className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEn ? 'Move' : 'انتقال'}</span>
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors text-xs font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEn ? 'Delete' : 'حذف'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
