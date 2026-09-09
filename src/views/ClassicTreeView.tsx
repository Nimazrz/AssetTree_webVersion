import React, { useState } from 'react';
import { CalculatedNode, DisplaySettings, AppLanguage } from '../types';
import {
  formatCurrency,
  formatPercentage,
  formatNumberWithCommas,
} from '../utils/numberFormat';
import { getPaletteForNode } from '../utils/assetColors';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Move,
  Info,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

interface ClassicTreeViewProps {
  rootCalculated: CalculatedNode;
  settings: DisplaySettings;
  onSelectNodeDetails: (node: CalculatedNode) => void;
  onAddChildNode: (parent: CalculatedNode) => void;
  onEditNode: (node: CalculatedNode) => void;
  onMoveNode: (node: CalculatedNode) => void;
  onDeleteNode: (node: CalculatedNode) => void;
  searchQuery?: string;
  expandAllSignal?: number;
  collapseAllSignal?: number;
}

export const ClassicTreeView: React.FC<ClassicTreeViewProps> = ({
  rootCalculated,
  settings,
  onSelectNodeDetails,
  onAddChildNode,
  onEditNode,
  onMoveNode,
  onDeleteNode,
  searchQuery,
  expandAllSignal,
  collapseAllSignal,
}) => {
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const lang: AppLanguage = settings.language || 'fa';
  const isEn = lang === 'en';
  const isRtl = lang === 'fa';
  const tClassic = TRANSLATIONS.classicTable;
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

  const renderRow = (node: CalculatedNode) => {
    const isRoot = node.id === rootCalculated.id;
    const isCollapsed = collapsedMap[node.id];
    const palette = getPaletteForNode(node.name, node.categoryTag, settings.customAssetColors);

    // Search filter for classic tree rows
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const nodeMatches =
        node.name.toLowerCase().includes(q) ||
        (node.categoryTag && node.categoryTag.toLowerCase().includes(q));
      const hasMatchingChild = (n: CalculatedNode): boolean => {
        if (n.name.toLowerCase().includes(q) || (n.categoryTag && n.categoryTag.toLowerCase().includes(q))) return true;
        return n.children.some(hasMatchingChild);
      };
      if (!nodeMatches && !node.children.some(hasMatchingChild)) {
        return null;
      }
    }

    const depthIndent =
      node.depth === 0 ? '0px' : `clamp(4px, ${node.depth * 1.5}vw, ${node.depth * 18}px)`;

    return (
      <React.Fragment key={node.id}>
        <tr
          id={`classic-node-${node.id}`}
          onClick={() => onSelectNodeDetails(node)}
          className="group hover:bg-blue-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer transition-colors text-xs sm:text-sm"
        >
          {/* Node Title & Tree Indent */}
          <td className="py-2 sm:py-2.5 px-2 sm:px-3 min-w-[170px] sm:min-w-[200px]">
            <div
              className="flex items-center gap-1 sm:gap-1.5"
              style={
                isRtl
                  ? { paddingRight: depthIndent }
                  : { paddingLeft: depthIndent }
              }
            >
              {node.isGroup ? (
                <button
                  type="button"
                  onClick={(e) => toggleCollapse(node.id, e)}
                  className="p-1 rounded-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  {isCollapsed ? (
                    isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <div className="w-4 sm:w-5 shrink-0" />
              )}

              {node.isGroup ? (
                isCollapsed ? (
                  <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                ) : (
                  <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                )
              ) : (
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" style={{ color: palette.primary }} />
              )}

              <span
                className={`truncate ${
                  node.depth === 0
                    ? 'font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm'
                    : node.isGroup
                    ? 'font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm'
                    : 'text-slate-700 dark:text-slate-300 text-xs'
                }`}
              >
                {node.name}
              </span>
            </div>
          </td>

          {/* Quantity / Count */}
          <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-center whitespace-nowrap text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs">
            {!node.isGroup && node.quantity > 0 ? (
              <span>
                {formatNumberWithCommas(node.quantity, settings.usePersianDigits, 2, lang)} {node.unit}
              </span>
            ) : (
              <span className="text-slate-400 text-[11px] sm:text-xs">
                {node.children.length} {isEn ? 'items' : 'شاخه'}
              </span>
            )}
          </td>

          {/* Unit Price */}
          <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-center whitespace-nowrap text-slate-600 dark:text-slate-400 hidden md:table-cell text-xs">
            {!node.isGroup && node.unitPrice > 0 ? (
              formatCurrency(
                node.unitPrice,
                settings.currencyUnit,
                false,
                settings.usePersianDigits,
                settings.privacyMode,
                lang
              )
            ) : (
              <span className="text-slate-300 dark:text-slate-700">—</span>
            )}
          </td>

          {/* Total Value */}
          <td className={`py-2 sm:py-2.5 px-2 sm:px-3 ${isRtl ? 'text-left' : 'text-right'} font-bold text-slate-900 dark:text-white whitespace-nowrap text-xs sm:text-sm`}>
            {formatCurrency(
              node.totalValue,
              settings.currencyUnit,
              settings.compactCurrency,
              settings.usePersianDigits,
              settings.privacyMode,
              lang
            )}
          </td>

          {/* Percent of Group */}
          <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-center text-slate-500 dark:text-slate-400 hidden sm:table-cell whitespace-nowrap text-[11px] sm:text-xs">
            {node.depth > 1
              ? formatPercentage(node.percentOfGroup, settings.decimalPlaces, settings.usePersianDigits, lang)
              : '—'}
          </td>

          {/* Percent of Total */}
          <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-center text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap text-[11px] sm:text-xs">
            {formatPercentage(node.percentOfTotal, settings.decimalPlaces, settings.usePersianDigits, lang)}
          </td>

          {/* Actions */}
          <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center gap-0.5 sm:gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onAddChildNode(node)}
                title={tCommon.addChild[lang]}
                className="p-1 sm:p-1.5 rounded-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {!isRoot && (
                <>
                  <button
                    type="button"
                    onClick={() => onEditNode(node)}
                    title={tCommon.edit[lang]}
                    className="p-1 sm:p-1.5 rounded-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveNode(node)}
                    title={tCommon.move[lang]}
                    className="p-1 sm:p-1.5 rounded-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Move className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteNode(node)}
                    title={tCommon.delete[lang]}
                    className="p-1 sm:p-1.5 rounded-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => onSelectNodeDetails(node)}
                title={tCommon.details[lang]}
                className="p-1 sm:p-1.5 rounded-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>

        {/* Children Rows */}
        {node.children.length > 0 && !isCollapsed && node.children.map(renderRow)}
      </React.Fragment>
    );
  };

  return (
    <div className="w-full pb-16">
      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs -mx-1 sm:mx-0">
        <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} border-collapse`}>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
              <th className="py-2.5 sm:py-3 px-2 sm:px-3">{tClassic.colName[lang]}</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">{tClassic.colQuantity[lang]}</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center hidden md:table-cell">{tClassic.colPrice[lang]}</th>
              <th className={`py-2.5 sm:py-3 px-2 sm:px-3 ${isRtl ? 'text-left' : 'text-right'}`}>{tClassic.colTotalValue[lang]}</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center hidden sm:table-cell">{tClassic.colPercentGroup[lang]}</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">{tClassic.colPercentTotal[lang]}</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">{tClassic.colActions[lang]}</th>
            </tr>
          </thead>
          <tbody>
            {renderRow(rootCalculated)}
          </tbody>
        </table>
      </div>
    </div>
  );
};
