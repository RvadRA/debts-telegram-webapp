import React from 'react';
import { X, ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface SecurityFAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityFAQModal: React.FC<SecurityFAQModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Безопасность Telegram ID
              </h2>
              <p className="text-xs text-slate-400">Защита от подделки и посторонних лиц</p>
            </div>
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

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 text-sm text-slate-700 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                  ОТВЕТ: НЕТ, посторонний НЕ МОЖЕТ зайти под вашим ID!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                  Даже если посторонний человек знает ваш цифровой Telegram ID, он не сможет выполнить команды бота или открыть WebApp от вашего имени.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-500" />
                <span>1. Как работает Telegram Bot:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Сообщения в Telegram доставляются официальными серверами Telegram. Поле <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">msg.from.id</code> формируется на серверах Telegram на основе реального аккаунта и SIM-карты отправителя. Посторонний человек не может подделать этот ID — Telegram всегда передаст боту его собственный ID, и бот заблокирует доступ.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>2. Как защищен Telegram WebApp:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                При открытии WebApp клиент Telegram передает данные с криптографической цифровой подписью (HMAC-SHA256 hash), заверенной секретным токеном бота. Подделать такую подпись без доступа к вашему физическому телефону невозможно.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>3. Двухуровневый доступ магазина:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                В приложении строго зафиксированы ровно 2 владельца. Любые чужие запросы отбрасываются сервером с ошибкой <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">403 Forbidden</code>, а на экране показывается запрет доступа.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
          >
            Понятно, спасибо
          </button>
        </div>
      </div>
    </div>
  );
};
