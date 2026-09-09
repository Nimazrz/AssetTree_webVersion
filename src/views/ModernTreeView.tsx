import React, { useState } from 'react';
import {
  CalculatedNode,
  DisplaySettings,
  SortConfig,
  SortField,
  AppLanguage,
} from '../types';
import { getPaletteForNode } from '../utils/assetColors';
import {
  formatCurrency,
  formatPercentage,
  formatNumberWithCommas,
} from '../utils/numberFormat';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Move,
  Trash2,
  Info,
  Search,
  ArrowUpDown,
  Coins,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

interface ModernTreeViewProps {
  rootCalculated: CalculatedNode;
  settings: DisplaySettings;
  sortConfig: SortConfig;
  onUpdateSort: (sort: SortConfig) => void;
  onSelectNodeDetails: (node: CalculatedNode) => void;
  onAddChildNode: (parent: CalculatedNode) => void;
  onEditNode: (node: CalculatedNode) => void;
  onMoveNode: (node: CalculatedNode) => void;
  onDeleteNode: (node: CalculatedNode) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  expandAllSignal?: number;
  collapseAllSignal?: number;
}

export const ModernTreeView: React.FC<ModernTreeViewProps> = ({
  rootCalculated,
  settings,
  sortConfig,
  onUpdateSort,
  onSelectNodeDetails,
  onAddChildNode,
  onEditNode,
  onMoveNode,
  onDeleteNode,
  searchQuery: externalSearchQuery,
  onSearchChange,
  expandAllSignal,
  collapseAllSignal,
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;
  const hasExternalSearch = externalSearchQuery !== undefined;

  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';
  const isRtl = lang === 'fa';
  const tCommon = TRANSLATIONS.common;

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    const traverse = (node: CalculatedNode) => {
      if (node.isGroup && node.depth > 0) {
        next[node.id] = true;
      }
      node.children.forEach(traverse);
    };
    traverse(rootCalculated);
    setCollapsedMap(next);
  };

  const expandAll = () => {
    setCollapsedMap({});
  };

  React.useEffect(() => {
    if (expandAllSignal && expandAllSignal > 0) {
      expandAll();
    }
  }, [expandAllSignal]);

  React.useEffect(() => {
    if (collapseAllSignal && collapseAllSignal > 0) {
      collapseAll();
    }
  }, [collapseAllSignal]);

  // Node renderer
  const renderNode = (node: CalculatedNode) => {
    const isRoot = node.id === rootCalculated.id;
    const isCollapsed = collapsedMap[node.id];
    const palette = getPaletteForNode(node.name, node.categoryTag, settings.customAssetColors);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const nodeMatches =
        node.name.toLowerCase().includes(q) ||
        (node.categoryTag && node.categoryTag.toLowerCase().includes(q));
      const hasMatchingChild = (n: CalculatedNode): boolean => {
        if (n.name.toLowerCase().includes(q)) return true;
        return n.children.some(hasMatchingChild);
      };
      if (!nodeMatches && !node.children.some(hasMatchingChild)) {
        return null;
      }
    }

    const paddingIndent =
      node.depth === 0
        ? '0px'
        : node.depth === 1
        ? 'clamp(6px, 1.5vw, 12px)'
        : node.depth === 2
        ? 'clamp(12px, 3vw, 24px)'
        : 'clamp(18px, 4.5vw, 36px)';

    return (
      <div
        key={node.id}
        className="w-full flex flex-col my-1 sm:my-1.5"
        style={
          isRtl
            ? { paddingRight: paddingIndent }
            : { paddingLeft: paddingIndent }
        }
      >
        {/* Node Card */}
        <div
          id={`modern-node-${node.id}`}
          onClick={() => onSelectNodeDetails(node)}
          className={`group relative rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer ${
            node.isGroup
              ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
              : 'bg-white/80 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xs'
          }`}
          style={
            isRtl
              ? {
                  borderRightWidth: node.depth > 0 ? '4px' : undefined,
                  borderRightColor: node.depth > 0 ? palette.primary : undefined,
                }
              : {
                  borderLeftWidth: node.depth > 0 ? '4px' : undefined,
                  borderLeftColor: node.depth > 0 ? palette.primary : undefined,
                }
          }
        >
          <div className="p-2.5 sm:p-3.5 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3">
            {/* Start: Icon, Expand toggle, Name, Badges */}
            <div className="flex items-start sm:items-center gap-2 sm:gap-2.5 min-w-0 flex-1 w-full sm:w-auto">
              {node.isGroup ? (
                <button
                  type="button"
                  id={`btn-collapse-${node.id}`}
                  onClick={(e) => toggleCollapse(node.id, e)}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors shrink-0 cursor-pointer"
                >
                  {isCollapsed ? (
                    isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 mt-0.5 sm:mt-0">
                  <Coins className="w-3.5 h-3.5" style={{ color: palette.primary }} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span
                    className={`font-bold truncate leading-tight ${
                      node.depth === 0
                        ? 'text-sm xs:text-base sm:text-lg text-slate-900 dark:text-white'
                        : node.isGroup
                        ? 'text-xs xs:text-sm sm:text-base text-slate-800 dark:text-slate-100'
                        : 'text-xs sm:text-sm text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {node.name}
                  </span>

                  {node.isGroup && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {node.children.length} {isEn ? 'items' : 'شاخه'}
                    </span>
                  )}

                  {!node.isGroup && node.quantity > 0 && (
                    <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      ({formatNumberWithCommas(node.quantity, settings.usePersianDigits, 2, lang)} {node.unit} @{' '}
                      {formatCurrency(node.unitPrice, settings.currencyUnit, false, settings.usePersianDigits, settings.privacyMode, lang)})
                    </span>
                  )}
                </div>

                {/* Percentage metrics line */}
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                  {settings.showPercentOfTotal && (
                    <span className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                      {formatPercentage(node.percentOfTotal, settings.decimalPlaces, settings.usePersianDigits, lang)}{' '}
                      {isEn ? 'of total' : 'از کل'}
                    </span>
                  )}

                  {settings.showPercentOfGroup && node.depth > 1 && (
                    <>
                      <span>•</span>
                      <span>
                        {formatPercentage(node.percentOfGroup, settings.decimalPlaces, settings.usePersianDigits, lang)}{' '}
                        {isEn ? 'of parent' : 'از گروه'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* End: Value & Action Buttons */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800/80">
              {/* Total Value */}
              <div className={isRtl ? 'text-right sm:text-left' : 'text-left sm:text-right'}>
                <span className="text-xs xs:text-sm sm:text-base font-extrabold text-slate-900 dark:text-white block truncate">
                  {formatCurrency(
                    node.totalValue,
                    settings.currencyUnit,
                    settings.compactCurrency,
                    settings.usePersianDigits,
                    settings.privacyMode,
                    lang
                  )}
                </span>
              </div>

              {/* Action Buttons Toolbar */}
              <div
                className="flex items-center gap-0.5 sm:gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Add Child */}
                <button
                  type="button"
                  id={`btn-add-child-${node.id}`}
                  onClick={() => onAddChildNode(node)}
                  title={tCommon.addChild[lang]}
                  className="p-1 sm:p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Edit (if not root) */}
                {!isRoot && (
                  <button
                    type="button"
                    id={`btn-edit-${node.id}`}
                    onClick={() => onEditNode(node)}
                    title={tCommon.edit[lang]}
                    className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}

                {/* Move (if not root) */}
                {!isRoot && (
                  <button
                    type="button"
                    id={`btn-move-${node.id}`}
                    onClick={() => onMoveNode(node)}
                    title={tCommon.move[lang]}
                    className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Move className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}

                {/* Delete (if not root) */}
                {!isRoot && (
                  <button
                    type="button"
                    id={`btn-delete-${node.id}`}
                    onClick={() => onDeleteNode(node)}
                    title={tCommon.delete[lang]}
                    className="p-1 sm:p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}

                {/* Details Dialog */}
                <button
                  type="button"
                  id={`btn-details-${node.id}`}
                  onClick={() => onSelectNodeDetails(node)}
                  title={tCommon.details[lang]}
                  className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Children Recursion */}
        {node.children.length > 0 && !isCollapsed && (
          <div className="flex flex-col w-full relative">
            {/* Guide line for tree hierarchy */}
            <div
              className={`absolute top-0 bottom-2 w-px bg-slate-200 dark:bg-slate-800 pointer-events-none ${
                isRtl ? 'right-4' : 'left-4'
              }`}
            />
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  const sortFields: { field: SortField; label: string }[] = [
    { field: 'TOTAL_VALUE', label: isEn ? 'Total Value' : 'ارزش کل' },
    { field: 'NAME', label: isEn ? 'Asset Name' : 'نام دارایی' },
    { field: 'QUANTITY', label: isEn ? 'Quantity' : 'تعداد/مقدار' },
    { field: 'UNIT_PRICE', label: isEn ? 'Unit Price' : 'قیمت واحد' },
    { field: 'PERCENT_OF_TOTAL', label: isEn ? '% of Total' : 'درصد از کل' },
    { field: 'PERCENT_OF_GROUP', label: isEn ? '% of Peer Group' : 'درصد از هم‌گروه' },
  ];

  return (
    <div className="w-full pb-16">
      {/* Control Bar: Search (if no external search), Expand/Collapse, Sorting */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search Input or Filter Status */}
        {!hasExternalSearch ? (
          <div className="relative flex-1 min-w-0">
            <Search
              className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
                isRtl ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              id="input-search-tree"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? 'Quick search assets, symbols or categories...' : 'جستجوی سریع دارایی، نماد یا گروه...'}
              className={`w-full py-1.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 ${
                isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            {searchQuery.trim() ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                <Search className="w-3.5 h-3.5" />
                <span>
                  {isEn
                    ? `Active filter: "${searchQuery}"`
                    : `فیلتر فعال درخت: «${searchQuery}»`}
                </span>
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                {isEn ? 'Modern Tree Hierarchy' : 'ساختار درختی و سلسله‌مراتبی'}
              </span>
            )}
          </div>
        )}

        {/* Expand / Collapse buttons & Sort */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="btn-expand-all"
              onClick={expandAll}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isEn ? 'Expand All' : 'گسترش همه'}
            </button>
            <button
              type="button"
              id="btn-collapse-all"
              onClick={collapseAll}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isEn ? 'Collapse All' : 'جمع‌کردن همه'}
            </button>
          </div>

          {/* Sort Selector */}
          <div
            className={`flex items-center gap-1 ${
              isRtl ? 'border-r pr-2' : 'border-l pl-2'
            } border-slate-200 dark:border-slate-800`}
          >
            <select
              id="select-tree-sort-field"
              value={sortConfig.field}
              onChange={(e) =>
                onUpdateSort({
                  ...sortConfig,
                  field: e.target.value as SortField,
                })
              }
              className="text-[11px] sm:text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 sm:px-2.5 sm:py-1.5 text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              {sortFields.map((f) => (
                <option key={f.field} value={f.field}>
                  {f.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              id="btn-toggle-sort-dir"
              onClick={() =>
                onUpdateSort({
                  ...sortConfig,
                  direction: sortConfig.direction === 'ASC' ? 'DESC' : 'ASC',
                })
              }
              title={
                sortConfig.direction === 'ASC'
                  ? (isEn ? 'Ascending' : 'صعودی')
                  : (isEn ? 'Descending' : 'نزولی')
              }
              className="p-1 sm:p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex flex-col w-full">
        {renderNode(rootCalculated)}
      </div>
    </div>
  );
};
