import React from 'react';
import { Wallet, ArrowUpRight, ArrowDown, ArrowUp, ChevronRight, AlertTriangle, Clock } from 'lucide-react';
import { Debt, Currency } from '../types/debt';
import { calculateRemaining, formatAmount, getDebtStatus } from '../utils/formatters';
import { triggerHaptic } from '../utils/telegram';

interface BalanceStatsProps {
  debts: Debt[];
  selectedCurrency: Currency;
  onSelectFilterQuick: (tab: 'all' | 'i_lent' | 'i_borrowed' | 'urgent' | 'overdue') => void;
  onOpenGeneralPdf: () => void;
}

export const BalanceStats: React.FC<BalanceStatsProps> = ({
  debts,
  selectedCurrency,
  onSelectFilterQuick,
  onOpenGeneralPdf,
}) => {
  const currencyDebts = debts.filter((d) => d.currency === selectedCurrency);

  const totalLentRemaining = currencyDebts
    .filter((d) => d.type === 'i_lent' && !d.isSettled)
    .reduce((sum, d) => sum + calculateRemaining(d), 0);

  const totalBorrowedRemaining = currencyDebts
    .filter((d) => d.type === 'i_borrowed' && !d.isSettled)
    .reduce((sum, d) => sum + calculateRemaining(d), 0);

  const netBalance = totalLentRemaining - totalBorrowedRemaining;

  const overdueCount = debts.filter((d) => getDebtStatus(d) === 'overdue').length;
  const urgentCount = debts.filter((d) => getDebtStatus(d) === 'urgent').length;

  return (
    <section className="px-4 pt-1 pb-2">
      <div className="max-w-md mx-auto space-y-3.5">
        {/* 1. Hero Balance Card (Blue gradient with histogram silhouette) */}
        <div className="relative overflow-hidden rounded-[28px] p-6 bg-gradient-to-br from-blue-600 via-blue-600 to-sky-400 text-white shadow-xl shadow-blue-500/20">
          {/* Background Bar Chart Silhouette (Replicating the screenshot) */}
          <div className="absolute right-6 bottom-0 flex items-end gap-2.5 pointer-events-none opacity-30 select-none">
            <div className="w-5 bg-white rounded-t-xl h-10" />
            <div className="w-5 bg-white rounded-t-xl h-16" />
            <div className="w-5 bg-white rounded-t-xl h-24" />
            <div className="w-5 bg-white rounded-t-xl h-18" />
          </div>

          {/* Top Row: Wallet Icon & Action Arrow */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-5 h-5 stroke-[2.2]" />
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenGeneralPdf();
              }}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 active:scale-95 transition flex items-center justify-center text-white"
              title="Открыть сводный отчет"
            >
              <ArrowUpRight className="w-5 h-5 stroke-[2.4]" />
            </button>
          </div>

          {/* Content: Title & Net Balance Amount */}
          <div className="relative z-10 mt-5">
            <div className="text-sm font-medium text-blue-100">Чистый баланс</div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1 tabular-nums">
              {netBalance > 0
                ? `+${formatAmount(netBalance, selectedCurrency)}`
                : formatAmount(netBalance, selectedCurrency)}
            </div>
          </div>
        </div>

        {/* 2. Split Metric Cards (Мне должны / Я должен) */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Мне должны */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onSelectFilterQuick('i_lent');
            }}
            className="text-left p-4 rounded-[26px] bg-[#EBFBF5] dark:bg-emerald-950/25 border border-emerald-100/80 dark:border-emerald-900/40 shadow-xs hover:border-emerald-300 transition active:scale-[0.98] group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                <ArrowDown className="w-4 h-4 stroke-[2.8]" />
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition" />
            </div>

            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Мне должны
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5 tabular-nums">
                {formatAmount(totalLentRemaining, selectedCurrency)}
              </div>
            </div>
          </button>

          {/* Я должен */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onSelectFilterQuick('i_borrowed');
            }}
            className="text-left p-4 rounded-[26px] bg-[#FFF8F0] dark:bg-amber-950/25 border border-amber-100/80 dark:border-amber-900/40 shadow-xs hover:border-amber-300 transition active:scale-[0.98] group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                <ArrowUp className="w-4 h-4 stroke-[2.8]" />
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition" />
            </div>

            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Я должен
              </div>
              <div className="text-2xl font-black text-[#F36B26] dark:text-amber-400 tracking-tight mt-0.5 tabular-nums">
                {formatAmount(totalBorrowedRemaining, selectedCurrency)}
              </div>
            </div>
          </button>
        </div>

        {/* 3. Alert Badges Row (Просрочено / Скоро возврат) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Просрочено */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('warning');
              onSelectFilterQuick('overdue');
            }}
            className={`p-3 rounded-2xl border transition active:scale-98 flex items-center justify-between ${
              overdueCount > 0
                ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-300'
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-xs font-semibold">Просрочено</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                {overdueCount}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
            </div>
          </button>

          {/* Скоро возврат */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onSelectFilterQuick('urgent');
            }}
            className={`p-3 rounded-2xl border transition active:scale-98 flex items-center justify-between ${
              urgentCount > 0
                ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-semibold">Скоро возврат</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                {urgentCount}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
