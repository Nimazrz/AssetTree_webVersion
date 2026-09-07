import React from 'react';
import { UndoSnapshot, AppLanguage } from '../types';
import { formatNumberWithCommas } from '../utils/numberFormat';
import { X, RotateCcw, History, Clock } from 'lucide-react';

interface UndoHistoryDialogProps {
  history: UndoSnapshot[];
  lang?: AppLanguage;
  onClose: () => void;
  onUndoStep: () => void;
  onRollbackSteps: (stepsCount: number) => void;
}

export const UndoHistoryDialog: React.FC<UndoHistoryDialogProps> = ({
  history,
  lang = 'fa',
  onClose,
  onUndoStep,
  onRollbackSteps,
}) => {
  const isEn = lang === 'en';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {isEn ? 'Undo History' : 'تاریخچه بازگشت (Undo History)'}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isEn
                  ? `${history.length} snapshots in memory`
                  : `${history.length} گام قابل بازگشت در حافظه موقت`}
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

        {/* List of Undo Snapshots */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 max-h-80 text-xs sm:text-sm">
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              {isEn ? 'No undo snapshots available right now.' : 'تاریخچه بازگشتی در حال حاضر وجود ندارد.'}
            </div>
          ) : (
            history.map((snapshot, index) => {
              const stepCount = index + 1;

              return (
                <div
                  key={snapshot.id}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-100 block truncate">
                      {snapshot.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(snapshot.timestamp).toLocaleTimeString(isEn ? 'en-US' : 'fa-IR')}</span>
                      <span>•</span>
                      <span>
                        {formatNumberWithCommas(snapshot.nodeCount, !isEn, 0, lang)}{' '}
                        {isEn ? 'nodes' : 'گره'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onRollbackSteps(stepCount);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Revert to here' : 'بازگشت به اینجا'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-medium cursor-pointer"
          >
            {isEn ? 'Close' : 'بستن'}
          </button>

          {history.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onUndoStep();
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isEn ? 'Undo Last Step' : 'بازگشت آخرین مرحله'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
