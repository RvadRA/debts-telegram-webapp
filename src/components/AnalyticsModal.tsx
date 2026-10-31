import React from 'react';
import { X, FileText, TrendingUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Debt, Currency } from '../types/debt';
import { calculateRemaining, formatAmount, getDebtStatus } from '../utils/formatters';
import { triggerHaptic } from '../utils/telegram';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  debts: Debt[];
  selectedCurrency: Currency;
  onOpenGeneralPdf: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  debts,
  selectedCurrency,
  onOpenGeneralPdf,
}) => {
  if (!isOpen) return null;

  const currencyDebts = debts.filter((d) => d.currency === selectedCurrency);
  const totalLent = currencyDebts
    .filter((d) => d.type === 'i_lent')
    .reduce((sum, d) => sum + d.amount, 0);

  const lentRemaining = currencyDebts
    .filter((d) => d.type === 'i_lent' && !d.isSettled)
    .reduce((sum, d) => sum + calculateRemaining(d), 0);

  const totalBorrowed = currencyDebts
    .filter((d) => d.type === 'i_borrowed')
    .reduce((sum, d) => sum + d.amount, 0);

  const borrowedRemaining = currencyDebts
    .filter((d) => d.type === 'i_borrowed' && !d.isSettled)
    .reduce((sum, d) => sum + calculateRemaining(d), 0);

  const settledCount = debts.filter((d) => d.isSettled).length;
  const overdueCount = debts.filter((d) => getDebtStatus(d) === 'overdue').length;
  const activeCount = debts.filter((d) => !d.isSettled).length;

  const totalReturned = totalLent - lentRemaining;
  const returnRate = totalLent > 0 ? Math.round((totalReturned / totalLent) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Аналитика и Статистика</h2>
            <p className="text-xs text-slate-400">Сводные показатели в {selectedCurrency}</p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics Body */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1">
          {/* Recovery Rate Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                Коэффициент возврата средств
              </span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                {returnRate}%
              </span>
            </div>
            <div className="w-full bg-blue-200/60 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${returnRate}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Возвращено {formatAmount(totalReturned, selectedCurrency)} из выданных {formatAmount(totalLent, selectedCurrency)}
            </p>
          </div>

          {/* Counts Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-400">В процессе</div>
              <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">{activeCount}</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-center border border-emerald-100 dark:border-emerald-900/30">
              <div className="text-xs text-emerald-700 dark:text-emerald-400">Погашено</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-300 mt-0.5">{settledCount}</div>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-center border border-rose-100 dark:border-rose-900/30">
              <div className="text-xs text-rose-700 dark:text-rose-400">Просрочено</div>
              <div className="text-lg font-black text-rose-600 dark:text-rose-300 mt-0.5">{overdueCount}</div>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Всего выданных долгов:</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatAmount(totalLent, selectedCurrency)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Остаток к получению:</span>
              <span className="font-bold tabular-nums text-emerald-600">{formatAmount(lentRemaining, selectedCurrency)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Мои обязательства (Я должен):</span>
              <span className="font-bold tabular-nums text-amber-600">{formatAmount(borrowedRemaining, selectedCurrency)}</span>
            </div>
          </div>

          {/* PDF Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
              onOpenGeneralPdf();
            }}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Сформировать сводный PDF-отчет</span>
          </button>
        </div>
      </div>
    </div>
  );
};
