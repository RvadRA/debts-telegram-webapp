import React, { useState } from 'react';
import { X, Check, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Debt } from '../types/debt';
import { calculateRemaining, formatAmount } from '../utils/formatters';
import { triggerHaptic } from '../utils/telegram';

interface RepaymentModalProps {
  debt: Debt | null;
  isOpen: boolean;
  onClose: () => void;
  onAddRepayment: (debtId: string, amount: number, note?: string, date?: string) => void;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({
  debt,
  isOpen,
  onClose,
  onAddRepayment,
}) => {
  if (!isOpen || !debt) return null;

  const remaining = calculateRemaining(debt);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/\s+/g, '').replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      setError('Укажите корректную сумму выплаты');
      triggerHaptic('error');
      return;
    }

    if (num > remaining) {
      setError(`Сумма выплаты не может превышать остаток (${formatAmount(remaining, debt.currency)})`);
      triggerHaptic('error');
      return;
    }

    triggerHaptic('success');
    onAddRepayment(debt.id, num, note.trim(), date);
    onClose();
  };

  const handlePayFull = () => {
    triggerHaptic('light');
    setAmount(remaining.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom duration-250">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Внести выплату
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {debt.name} · Остаток: {formatAmount(remaining, debt.currency)}
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Сумма возвращенной части:
              </label>
              <button
                type="button"
                onClick={handlePayFull}
                className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                Погасить всё ({formatAmount(remaining, debt.currency)})
              </button>
            </div>

            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Дата платежа:
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Комментарий к переводу (опционально):
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Перевод через СБП, наличными при встрече..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-11 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Зафиксировать выплату</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
