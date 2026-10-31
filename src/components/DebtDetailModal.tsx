import React from 'react';
import { 
  X, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Receipt, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  RotateCcw, 
  FileText, 
  Send, 
  ArrowDownLeft, 
  ArrowUpRight,
  Plus,
  Clock,
  Share2,
  RotateCw,
  Bell,
  AtSign
} from 'lucide-react';
import { Debt } from '../types/debt';
import { 
  calculateRemaining, 
  formatAmount, 
  formatDateDetailed, 
  formatDateShort, 
  formatPhone, 
  getDueStatusLabel 
} from '../utils/formatters';
import { triggerHaptic } from '../utils/telegram';

interface DebtDetailModalProps {
  debt: Debt | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
  onToggleSettle: (debt: Debt) => void;
  onOpenRepay: (debt: Debt) => void;
  onOpenReceipt: (photoUrl: string, caption?: string) => void;
  onOpenReminder: (debt: Debt) => void;
  onOpenIOU: (debt: Debt) => void;
}

export const DebtDetailModal: React.FC<DebtDetailModalProps> = ({
  debt,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleSettle,
  onOpenRepay,
  onOpenReceipt,
  onOpenReminder,
  onOpenIOU,
}) => {
  if (!isOpen || !debt) return null;

  const remaining = calculateRemaining(debt);
  const totalRepaid = debt.amount - remaining;
  const isLent = debt.type === 'i_lent';
  const dueInfo = getDueStatusLabel(debt);

  const rawPhone = debt.phone.replace(/[^\d+]/g, '');

  const handleDelete = () => {
    triggerHaptic('warning');
    if (confirm(`Удалить запись о долге (${debt.name})?`)) {
      onDelete(debt.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom duration-250 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                isLent
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
              }`}
            >
              {isLent ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              {isLent ? 'Мне должны' : 'Я должен'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                triggerHaptic('light');
                onEdit(debt);
              }}
              title="Редактировать"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center justify-center transition"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="Удалить"
              className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 flex items-center justify-center transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Contact summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base ${
                  isLent
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}
              >
                {debt.name ? debt.name.trim()[0]?.toUpperCase() : '?'}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {debt.name}
                </h1>
                {debt.phone && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatPhone(debt.phone)}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Contact Buttons */}
            {rawPhone && (
              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${rawPhone}`}
                  className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition"
                  title="Позвонить"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Amount Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {debt.isSettled ? 'Статус: Долг погашен' : 'Остаток к возврату:'}
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                  {formatAmount(debt.isSettled ? 0 : remaining, debt.currency)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Начальная сумма:</div>
                <div className="text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                  {formatAmount(debt.amount, debt.currency)}
                </div>
              </div>
            </div>

            {/* Dates & Status line */}
            <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Срок: {formatDateDetailed(debt.dueDate)}</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                  dueInfo.tone === 'danger'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : dueInfo.tone === 'warning'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : dueInfo.tone === 'success'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {dueInfo.text}
              </span>
            </div>

            {/* Visual Repayment Progress Indicator */}
            <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  Возвращено: <b className="text-emerald-600 dark:text-emerald-400">{formatAmount(totalRepaid, debt.currency)}</b>
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {debt.isSettled ? 100 : Math.min(100, Math.round((totalRepaid / debt.amount) * 100))}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    debt.isSettled
                      ? 'bg-emerald-500'
                      : totalRepaid > 0
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-transparent'
                  }`}
                  style={{
                    width: `${debt.isSettled ? 100 : Math.min(100, Math.round((totalRepaid / debt.amount) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Attached Receipt Photo Section */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Receipt className="w-4 h-4 text-sky-500" />
                <span>Фото чека / подтверждающего документа</span>
              </div>
            </div>

            {debt.receiptPhoto ? (
              <div
                onClick={() => onOpenReceipt(debt.receiptPhoto!, debt.receiptCaption || 'Чек')}
                className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 cursor-pointer"
              >
                <img
                  src={debt.receiptPhoto}
                  alt="Чек"
                  className="w-full max-h-48 object-contain p-1"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold backdrop-blur-2xs">
                  Нажмите для полноэкранного просмотра
                </div>
                {debt.receiptCaption && (
                  <div className="p-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    {debt.receiptCaption}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Фото чека не прикреплено. Вы можете добавить его через «Редактировать».
              </div>
            )}
          </div>

          {/* Recurring Debt Badge Block if applicable */}
          {debt.isRecurring && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <RotateCw className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-emerald-900 dark:text-emerald-200">
                  Повторяющийся долг (Аренда / Подписка)
                </div>
                <div className="text-emerald-700 dark:text-emerald-300 text-[11px] mt-0.5">
                  Автоматическое начисление {debt.recurringDayOfMonth || 1}-го числа каждого месяца
                </div>
              </div>
            </div>
          )}

          {/* Timed Notification Status */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Bell className="w-3.5 h-3.5 text-sky-500" />
              <span>Автонапоминания бота (за 24ч и в день срока):</span>
            </div>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Включены
            </span>
          </div>

          {/* Notes */}
          {debt.notes && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Примечание</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {debt.notes}
              </p>
            </div>
          )}

          {/* Repayments History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                История выплат ({debt.repayments.length})
              </h2>
              {!debt.isSettled && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('impact');
                    onOpenRepay(debt);
                  }}
                  className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>Внести выплату</span>
                </button>
              )}
            </div>

            {debt.repayments.length > 0 ? (
              <div className="space-y-1.5">
                {debt.repayments.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        + {formatAmount(rep.amount, debt.currency)}
                      </div>
                      {rep.note && <div className="text-[11px] text-slate-500">{rep.note}</div>}
                    </div>
                    <div className="text-slate-400 text-[11px] tabular-nums">
                      {formatDateShort(rep.date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Платежей пока не зафиксировано</p>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('impact');
                onOpenReminder(debt);
              }}
              className="h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-sky-100 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Напоминание</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenIOU(debt);
              }}
              className="h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>PDF Расписка</span>
            </button>
          </div>

          {/* Settle / Reactivate button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('success');
                onToggleSettle(debt);
              }}
              className={`w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                debt.isSettled
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
            >
              {debt.isSettled ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Вернуть в активные</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Погасить долг полностью</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
