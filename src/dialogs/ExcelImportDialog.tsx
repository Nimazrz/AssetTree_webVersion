import React, { useState } from 'react';
import {
  StoredNodeEntity,
  CalculatedNode,
  SymbolEntryEntity,
  ImportPlan,
  ParsedImportRow,
  DuplicateResolution,
  DisplaySettings,
} from '../types';
import { TreeEngine } from '../core/TreeEngine';
import { formatCurrency, formatNumberWithCommas } from '../utils/numberFormat';
import * as XLSX from 'xlsx';
import {
  X,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface ExcelImportDialogProps {
  currentStoredNodes: StoredNodeEntity[];
  calculatedTree: CalculatedNode;
  symbolBook: SymbolEntryEntity[];
  settings: DisplaySettings;
  onClose: () => void;
  onApplyPlan: (
    plan: ImportPlan,
    skipAllDuplicates: boolean,
    confirmDeleteAbsentStocks: boolean
  ) => void;
  onBackToSettings?: () => void;
}

export const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({
  currentStoredNodes,
  calculatedTree,
  symbolBook,
  settings,
  onClose,
  onApplyPlan,
  onBackToSettings,
}) => {
  // Wizard steps: 0=INPUT, 1=ANOMALIES, 2=DUPLICATES, 3=ABSENT_STOCKS, 4=FINAL_CONFIRM
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Input step parameters
  const [rawText, setRawText] = useState('');
  const [onlyTradeable, setOnlyTradeable] = useState(true);
  const [groupSmallAssets, setGroupSmallAssets] = useState(true);
  const [minThresholdStr, setMinThresholdStr] = useState('10000000'); // 10 Million Rials (1 Million Tomans)
  const [skipAllDuplicates, setSkipAllDuplicates] = useState(false);
  const [confirmDeleteAbsent, setConfirmDeleteAbsent] = useState(false);

  // Generated Plan
  const [plan, setPlan] = useState<ImportPlan | null>(null);

  // File drag & drop or upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: '\t' });
      setRawText(csv);
    };
    reader.readAsBinaryString(file);
  };

  const handleLoadSample = () => {
    const sampleRows = TreeEngine.getSampleBourseRows();
    const headers = "نماد\tشرکت\tتعداد\tنوع دارایی\tارزش ریالی\tتعداد قابل معامله\n";
    const body = sampleRows
      .map(
        (r) =>
          `${r.symbolRaw}\t${r.companyName || ''}\t${r.quantity}\t${r.assetType || ''}\t${r.totalRialValue}\t${r.tradeableQuantity ?? ''}`
      )
      .join('\n');
    setRawText(headers + body);
  };

  const handleParseAndGeneratePlan = () => {
    const threshold = parseFloat(minThresholdStr.replace(/,/g, '')) || 0;
    const rows = TreeEngine.parsePastedTextToRows(
      rawText,
      threshold,
      onlyTradeable,
      groupSmallAssets
    );

    if (rows.length === 0) {
      alert('ردیفی برای ورود شناسایی نشد. لطفاً ساختار متن یا ستون‌ها را بررسی فرمایید.');
      return;
    }

    const generatedPlan = TreeEngine.buildImportPlan(
      rows,
      currentStoredNodes,
      calculatedTree,
      symbolBook
    );
    setPlan(generatedPlan);
    setCurrentStep(1);
  };

  // Toggle selection for a row
  const toggleRowSelected = (rowId: string) => {
    if (!plan) return;
    const updateRow = (r: ParsedImportRow) => (r.id === rowId ? { ...r, selected: !r.selected } : r);
    setPlan({
      ...plan,
      standardRows: plan.standardRows.map(updateRow),
      needsReviewRows: plan.needsReviewRows.map(updateRow),
      duplicateRows: plan.duplicateRows.map(updateRow),
      newSymbolsRows: plan.newSymbolsRows.map(updateRow),
    });
  };

  // Change duplicate resolution
  const changeDuplicateResolution = (rowId: string, resolution: DuplicateResolution) => {
    if (!plan) return;
    const updateRow = (r: ParsedImportRow) =>
      r.id === rowId ? { ...r, duplicateResolution: resolution } : r;
    setPlan({
      ...plan,
      duplicateRows: plan.duplicateRows.map(updateRow),
    });
  };

  // Execute Final Plan
  const handleFinalSubmit = () => {
    if (!plan) return;
    onApplyPlan(plan, skipAllDuplicates, confirmDeleteAbsent);
  };

  const totalSelectedCount =
    (plan?.standardRows.filter((r) => r.selected).length || 0) +
    (plan?.needsReviewRows.filter((r) => r.selected).length || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Step Indicator */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                دستیار هوشمند ورود داده از اکسل / کارگزاری
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {currentStep === 0 && 'گام ۱ از ۴: ورود داده‌ها و تنظیم فیلترها'}
                {currentStep === 1 && 'گام ۲ از ۴: بررسی داده‌های غیرعادی (آنومالی‌ها)'}
                {currentStep === 2 && 'گام ۳ از ۴: تطبیق نمادهای تکراری'}
                {currentStep === 3 && 'گام ۴ از ۴: بازبینی نهایی و تأیید ثبت'}
              </span>
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              >
                <span>بازگشت به تنظیمات</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wizard Steps Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          {/* STEP 0: Data Entry */}
          {currentStep === 0 && (
            <div className="flex flex-col gap-4">
              {/* File upload or load sample */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer font-medium text-xs">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>بارگذاری فایل Excel یا CSV</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                <button
                  type="button"
                  id="btn-load-sample-bourse"
                  onClick={handleLoadSample}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium text-xs hover:bg-blue-100 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>بارگذاری نمونه پورتفوی کارگزاری</span>
                </button>
              </div>

              {/* Paste Text Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  یا متن کپی‌شده از صفحه سبد سهام کارگزاری (مفید، آگاه، فارابی و...) را اینجا الصاق نمایید:
                </label>
                <textarea
                  id="textarea-excel-paste"
                  rows={7}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="نماد	نام شرکت	تعداد	نوع دارایی	ارزش ریالی	تعداد قابل معامله..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Import Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyTradeable}
                    onChange={(e) => setOnlyTradeable(e.target.checked)}
                    className="rounded-md text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    فقط سهام قابل معامله
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupSmallAssets}
                    onChange={(e) => setGroupSmallAssets(e.target.checked)}
                    className="rounded-md text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    تجمیع ریز دارایی‌ها (سایر سهام)
                  </span>
                </label>

                <div>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                    حداقل ارزش فیلتر (ریال):
                  </span>
                  <input
                    type="text"
                    value={minThresholdStr}
                    onChange={(e) => setMinThresholdStr(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Anomalies Review */}
          {currentStep === 1 && plan && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-xs">
                سیستم نمادهای غیرعادی (مانند اوراق تبعی، قیمت صفر، حق‌تقدم مسدود) را در این بخش تفکیک کرده است:
              </div>

              {plan.needsReviewRows.length === 0 ? (
                <div className="p-8 text-center text-emerald-600 dark:text-emerald-400 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8" />
                  <span className="font-bold">تمام ردیف‌های بارگذاری شده نرمال و استاندارد هستند!</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {plan.needsReviewRows.map((row) => (
                    <div
                      key={row.id}
                      className="p-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggleRowSelected(row.id)}
                          className="rounded-md text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {row.canonicalName} ({row.raw.symbolRaw})
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                              {row.anomalyType}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                            {row.anomalyDescription}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold block">
                          {formatNumberWithCommas(row.raw.quantity, settings.usePersianDigits)} سهم
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatCurrency(row.raw.totalRialValue, 'TOMAN', true, settings.usePersianDigits)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Duplicate Resolution */}
          {currentStep === 2 && plan && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 text-xs">
                نمادهای زیر از قبل در درخت دارایی‌های شما وجود دارند. نحوه ادغام را مشخص فرمایید:
              </div>

              {plan.duplicateRows.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  هیچ نماد تکراری با دارایی‌های موجود یافت نشد. تمام نمادها جدید هستند.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {plan.duplicateRows.map((row) => (
                    <div
                      key={row.id}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {row.canonicalName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          موجودی فعلی در درخت: {formatNumberWithCommas(row.existingQuantity || 0, settings.usePersianDigits)} سهم | جدید: {formatNumberWithCommas(row.raw.quantity, settings.usePersianDigits)} سهم
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={row.duplicateResolution}
                          onChange={(e) =>
                            changeDuplicateResolution(row.id, e.target.value as DuplicateResolution)
                          }
                          className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                        >
                          <option value="REPLACE">جایگزینی موجودی جدید (Replace)</option>
                          <option value="SUM">جمع با موجودی قبلی (Sum)</option>
                          <option value="SKIP">صرف‌نظر و عدم تغییر (Skip)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Final Review & Confirmation */}
          {currentStep === 3 && plan && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex flex-col gap-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                  خلاصه برنامه ورود اطلاعات:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <div>
                    تعداد ردیف‌های انتخاب‌شده برای ثبت: <span className="font-bold">{totalSelectedCount}</span>
                  </div>
                  <div>
                    نمادهای جدید: <span className="font-bold">{plan.newSymbolsRows.length}</span>
                  </div>
                  <div>
                    نمادهای تکراری نیازمند تطبیق: <span className="font-bold">{plan.duplicateRows.length}</span>
                  </div>
                  <div>
                    سهام غایب در فایل وارد شده: <span className="font-bold">{plan.absentTreeNodes.length}</span>
                  </div>
                </div>
              </div>

              {/* Absent stocks management */}
              {plan.absentTreeNodes.length > 0 && (
                <div className="p-3 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-rose-800 dark:text-rose-200 block text-xs">
                      {plan.absentTreeNodes.length} سهم قبلاً در سبد شما ثبت بوده ولی در فایل اکسل جدید وجود ندارد.
                    </span>
                    <span className="text-[11px] text-slate-500">
                      آیا این سهام کاملاً فروخته شده‌اند و مایلید از درخت حذف شوند؟
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={confirmDeleteAbsent}
                      onChange={(e) => setConfirmDeleteAbsent(e.target.checked)}
                      className="rounded-md text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      حذف از درخت
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-medium text-xs"
            >
              <ChevronRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-medium text-xs"
            >
              انصراف
            </button>
          )}

          {currentStep === 0 && (
            <button
              type="button"
              id="btn-excel-parse-next"
              disabled={!rawText.trim()}
              onClick={handleParseAndGeneratePlan}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <span>پردازش داده‌ها و ادامه</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {currentStep > 0 && currentStep < 3 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <span>مرحله بعد</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              id="btn-excel-final-apply"
              onClick={handleFinalSubmit}
              className="flex items-center gap-1 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>اعمال نهایی روی درخت دارایی‌ها</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
