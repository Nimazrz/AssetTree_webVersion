import React from 'react';
import { CalculatedNode, AppLanguage } from '../types';
import { formatNumberWithCommas } from '../utils/numberFormat';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteNodeDialogProps {
  node: CalculatedNode;
  lang?: AppLanguage;
  onClose: () => void;
  onConfirmDelete: (nodeId: string) => void;
}

export const DeleteNodeDialog: React.FC<DeleteNodeDialogProps> = ({
  node,
  lang = 'fa',
  onClose,
  onConfirmDelete,
}) => {
  const isEn = lang === 'en';
  const totalSubtreeNodes = node.childCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
            {isEn ? `Are you sure you want to delete "${node.name}"?` : `آیا از حذف «${node.name}» اطمینان دارید؟`}
          </h2>

          {totalSubtreeNodes > 0 ? (
            <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 mt-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/40">
              {isEn
                ? `Warning: This node is a category containing ${formatNumberWithCommas(totalSubtreeNodes, false, 0, 'en')} sub-items. Deleting this node will remove all nested items underneath it!`
                : `توجه: این گره یک گروه با ${formatNumberWithCommas(totalSubtreeNodes, true, 0, 'fa')} زیرمجموعه است. با حذف این گروه، تمامی اعضا و شاخه‌های زیرین آن نیز حذف خواهند شد!`}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              {isEn ? 'This action can be undone using the Undo history.' : 'این عملیات قابل بازگشت با کلید Undo است.'}
            </p>
          )}

          <div className="flex items-center gap-3 w-full mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-xs sm:text-sm cursor-pointer"
            >
              {isEn ? 'Cancel' : 'انصراف'}
            </button>

            <button
              type="button"
              id="btn-confirm-delete-node"
              onClick={() => onConfirmDelete(node.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isEn ? 'Confirm Delete' : 'تأیید حذف'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
