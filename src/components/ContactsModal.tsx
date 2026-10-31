import React, { useMemo } from 'react';
import { X, Phone, User, Send, ChevronRight } from 'lucide-react';
import { Debt, Currency } from '../types/debt';
import { calculateRemaining, formatAmount, formatPhone } from '../utils/formatters';
import { triggerHaptic } from '../utils/telegram';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  debts: Debt[];
  selectedCurrency: Currency;
  onSelectDebt: (debt: Debt) => void;
  onOpenReminder: (debt: Debt) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  debts,
  selectedCurrency,
  onSelectDebt,
  onOpenReminder,
}) => {
  if (!isOpen) return null;

  // Group debts by contact name or phone
  const contacts = useMemo(() => {
    const map = new Map<string, { name: string; phone?: string; totalRemaining: number; debts: Debt[] }>();

    for (const d of debts) {
      const key = (d.name || 'Без имени').trim().toLowerCase();
      const existing = map.get(key);
      const rem = d.currency === selectedCurrency ? calculateRemaining(d) : 0;

      if (!existing) {
        map.set(key, {
          name: d.name,
          phone: d.phone,
          totalRemaining: rem,
          debts: [d],
        });
      } else {
        existing.totalRemaining += rem;
        existing.debts.push(d);
        if (!existing.phone && d.phone) existing.phone = d.phone;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalRemaining - a.totalRemaining);
  }, [debts, selectedCurrency]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Контакты должников</h2>
            <p className="text-xs text-slate-400">Всего {contacts.length} контактов</p>
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

        {/* Contacts List */}
        <div className="overflow-y-auto py-3 space-y-2 flex-1">
          {contacts.map((c) => {
            const rawPhone = c.phone ? c.phone.replace(/[^\d+]/g, '') : '';
            return (
              <div
                key={c.name}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold flex items-center justify-center shrink-0">
                    {c.name ? c.name[0]?.toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {c.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {c.phone ? formatPhone(c.phone) : `${c.debts.length} долг(а)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatAmount(c.totalRemaining, selectedCurrency)}
                  </span>

                  {rawPhone && (
                    <a
                      href={`tel:${rawPhone}`}
                      className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center"
                      title="Позвонить"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}

                  {c.debts[0] && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        onClose();
                        onSelectDebt(c.debts[0]);
                      }}
                      className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center"
                      title="Открыть долги"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
