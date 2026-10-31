import React from 'react';
import { ChevronRight, Receipt, RotateCw } from 'lucide-react';
import { Debt } from '../types/debt';
import { calculateRemaining, formatAmount, getDebtStatus } from '../utils/formatters';
import { triggerHaptic } from '../utils/telegram';

interface DebtCardProps {
  debt: Debt;
  onSelect: (debt: Debt) => void;
  onOpenRepay: (debt: Debt) => void;
  onOpenReceipt: (photoUrl: string, caption?: string) => void;
  onOpenReminder: (debt: Debt) => void;
  onOpenIOU: (debt: Debt) => void;
  onToggleSettle: (debt: Debt) => void;
}

// Consistent pastel avatar colors matching the screenshot
function getAvatarStyle(name: string) {
  const char = (name.trim()[0] || 'A').toUpperCase();
  const code = char.charCodeAt(0);

  const palettes = [
    { bg: 'bg-[#EBFBF5] dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300' }, // Mint (Дмитрий)
    { bg: 'bg-[#EBF4FE] dark:bg-sky-950/50', text: 'text-blue-600 dark:text-sky-300' },          // Sky Blue (Алексей)
    { bg: 'bg-[#F3EEFE] dark:bg-purple-950/50', text: 'text-purple-600 dark:text-purple-300' },   // Lilac (Сергей)
    { bg: 'bg-[#FFF8F0] dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-300' },     // Peach/Amber
    { bg: 'bg-[#FDF2F8] dark:bg-pink-950/50', text: 'text-pink-600 dark:text-pink-300' },       // Rose/Pink
  ];

  return palettes[code % palettes.length];
}

export const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  onSelect,
  onOpenReceipt,
}) => {
  const remaining = calculateRemaining(debt);
  const totalRepaid = debt.amount - remaining;
  const progressPercent = debt.isSettled
    ? 100
    : Math.min(100, Math.max(0, Math.round((totalRepaid / debt.amount) * 100)));

  const status = getDebtStatus(debt);
  const avatarStyle = getAvatarStyle(debt.name);
  const initial = debt.name ? debt.name.trim()[0]?.toUpperCase() : '?';

  const handleCardClick = () => {
    triggerHaptic('selection');
    onSelect(debt);
  };

  const handleReceiptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (debt.receiptPhoto) {
      triggerHaptic('light');
      onOpenReceipt(debt.receiptPhoto, debt.receiptCaption || `Чек: ${debt.name}`);
    }
  };

  // Status badge config matching screenshot
  const statusConfig = (() => {
    if (debt.isSettled) {
      return {
        label: '✓ Погашено',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
        amountClass: 'text-slate-400 dark:text-slate-500 line-through',
      };
    }
    if (status === 'overdue') {
      return {
        label: '⚠️ Просрочено',
        badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300',
        amountClass: 'text-rose-600 dark:text-rose-400',
      };
    }
    if (status === 'urgent') {
      return {
        label: '🕒 Скоро возврат',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300',
        amountClass: 'text-amber-600 dark:text-amber-400',
      };
    }
    return {
      label: '✓ В процессе',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300',
      amountClass: debt.type === 'i_lent' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100',
    };
  })();

  return (
    <article
      onClick={handleCardClick}
      className="p-4 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-[0_4px_18px_rgba(0,0,0,0.03)] hover:shadow-md transition active:scale-[0.99] cursor-pointer flex flex-col gap-2.5 group"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Avatar Circle + Name */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${avatarStyle.bg} ${avatarStyle.text}`}
          >
            {initial}
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition flex items-center gap-1.5">
              <span>{debt.name}</span>
              {debt.receiptPhoto && (
                <button
                  type="button"
                  onClick={handleReceiptClick}
                  className="text-emerald-600 hover:text-emerald-700"
                  title="Посмотреть чек"
                >
                  <Receipt className="w-3.5 h-3.5" />
                </button>
              )}
            </h3>
            {debt.isRecurring && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                <RotateCw className="w-2.5 h-2.5" />
                <span>Ежемесячно ({debt.recurringDayOfMonth || 1}-е число)</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Amount + Status Pill + Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end">
            <span className={`text-base font-black tracking-tight tabular-nums ${statusConfig.amountClass}`}>
              {formatAmount(remaining, debt.currency)}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${statusConfig.badgeClass}`}
            >
              {statusConfig.label}
            </span>
          </div>

          <div className="w-5 h-5 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition">
            <ChevronRight className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Progress Bar (Соотношение возвращенной суммы к общей сумме долга) */}
      {debt.repayments.length > 0 && !debt.isSettled && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
            {progressPercent}% погашено
          </span>
        </div>
      )}
    </article>
  );
};
