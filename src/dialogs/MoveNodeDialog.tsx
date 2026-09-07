import React, { useState, useMemo } from 'react';
import { CalculatedNode, StoredNodeEntity, AppLanguage } from '../types';
import { TreeEngine } from '../core/TreeEngine';
import { X, Move, Folder, Search, Check, AlertTriangle } from 'lucide-react';

interface MoveNodeDialogProps {
  movingNode: CalculatedNode;
  allStoredNodes: StoredNodeEntity[];
  rootCalculated: CalculatedNode;
  lang?: AppLanguage;
  onClose: () => void;
  onMove: (movingNodeId: string, targetParentId: string) => void;
}

export const MoveNodeDialog: React.FC<MoveNodeDialogProps> = ({
  movingNode,
  allStoredNodes,
  rootCalculated,
  lang = 'fa',
  onClose,
  onMove,
}) => {
  const isEn = lang === 'en';
  const isRtl = lang === 'fa';
  const [selectedParentId, setSelectedParentId] = useState<string | null>(movingNode.parentId);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Eligible parents: any node that is NOT movingNode and NOT within movingNode's subtree
  const eligibleParents = useMemo(() => {
    const list: CalculatedNode[] = [];
    const traverse = (n: CalculatedNode) => {
      // Check cycle: is movingNode an ancestor of n or same?
      const isCycle = TreeEngine.checkCycle(allStoredNodes, movingNode.id, n.id);
      if (!isCycle) {
        list.push(n);
      }
      n.children.forEach(traverse);
    };
    traverse(rootCalculated);
    return list;
  }, [allStoredNodes, movingNode, rootCalculated]);

  const filteredParents = useMemo(() => {
    if (!search.trim()) return eligibleParents;
    const q = search.trim().toLowerCase();
    return eligibleParents.filter((p) => p.name.toLowerCase().includes(q));
  }, [eligibleParents, search]);

  const handleConfirm = () => {
    if (!selectedParentId) return;
    if (selectedParentId === movingNode.parentId) {
      onClose();
      return;
    }

    if (TreeEngine.checkCycle(allStoredNodes, movingNode.id, selectedParentId)) {
      setErrorMessage(
        isEn
          ? 'Error: Cannot move a branch into its own descendants.'
          : 'خطا: امکان انتقال شاخه به زیرمجموعه‌های خودش وجود ندارد.'
      );
      return;
    }

    onMove(movingNode.id, selectedParentId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {isEn ? `Move "${movingNode.name}"` : `انتقال «${movingNode.name}»`}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isEn ? 'Select new destination category' : 'دسته‌بندی مقصد جدید را انتخاب فرمایید'}
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs sm:text-sm">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              id="input-search-target-parent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isEn ? 'Search destination category...' : 'جستجوی گروه مقصد...'}
              className={`w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white ${
                isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>

          {/* List of Eligible Parent Nodes */}
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
            {filteredParents.map((parent) => {
              const isSelected = selectedParentId === parent.id;
              const isCurrent = movingNode.parentId === parent.id;

              return (
                <div
                  key={parent.id}
                  onClick={() => setSelectedParentId(parent.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200'
                      : 'border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder
                      className={`w-4 h-4 shrink-0 ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-amber-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="font-semibold block truncate">
                        {parent.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {parent.id === rootCalculated.id
                          ? (isEn ? 'Root Portfolio' : 'ریشه اصلی پورتفو')
                          : (isEn ? `Depth Level ${parent.depth}` : `عمق ${parent.depth}`)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {isEn ? 'Current Parent' : 'مقصد فعلی'}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-xs sm:text-sm cursor-pointer"
          >
            {isEn ? 'Cancel' : 'انصراف'}
          </button>

          <button
            type="button"
            id="btn-confirm-move-node"
            onClick={handleConfirm}
            disabled={!selectedParentId || selectedParentId === movingNode.parentId}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isEn ? 'Confirm Move' : 'تأیید انتقال'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
