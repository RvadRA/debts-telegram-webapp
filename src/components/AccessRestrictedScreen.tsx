import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, RefreshCw, KeyRound, Lock } from 'lucide-react';
import { TelegramWebAppUser } from '../types/debt';
import { triggerHaptic } from '../utils/telegram';

interface AccessRestrictedScreenProps {
  telegramUser: TelegramWebAppUser;
  onRetry: () => void;
  isRetrying: boolean;
}

export const AccessRestrictedScreen: React.FC<AccessRestrictedScreenProps> = ({
  telegramUser,
  onRetry,
  isRetrying,
}) => {
  const [copied, setCopied] = useState(false);
  const userIdStr = telegramUser.id ? String(telegramUser.id) : '';

  const handleCopy = () => {
    if (!userIdStr) return;
    navigator.clipboard.writeText(userIdStr);
    setCopied(true);
    triggerHaptic('success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 text-slate-800 dark:text-slate-100 font-sans">
      <div className="max-w-md w-full mx-auto my-auto space-y-6 text-center">
        {/* Shield & Lock Visual */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <ShieldAlert className="w-10 h-10 stroke-[1.8]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Title & Explanation */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Приватная система магазина</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Доступ ограничен
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Приложение «Долги и Чеки» настроено исключительно для <b>2 владельцев магазина «1000 мелочей»</b>. Финансовые данные и операции закрыты от посторонних лиц.
          </p>
        </div>

        {/* Telegram ID Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ваш аккаунт Telegram
            </span>
            <span className="text-xs text-rose-500 font-medium">Не авторизован</span>
          </div>

          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {telegramUser.first_name || 'Пользователь'} {telegramUser.username ? `(@${telegramUser.username})` : ''}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Telegram ID: <span className="font-bold text-slate-700 dark:text-slate-300">{userIdStr || 'не определен'}</span>
              </div>
            </div>

            {userIdStr && (
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 active:scale-95 transition shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Скопировано!' : 'Скопировать ID'}</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 leading-relaxed bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <span className="font-semibold text-amber-800 dark:text-amber-300">Как получить доступ:</span>
            <p className="mt-1">
              Если вы совладелец магазина, передайте ваш Telegram ID главному владельцу. Он может активировать ваш доступ командой боту:
            </p>
            <div className="mt-1.5 font-mono text-[11px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 select-all">
              /addowner {userIdStr || 'ВАШ_ID'}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('impact');
              onRetry();
            }}
            disabled={isRetrying}
            className="w-full h-11 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-sky-500/20 active:scale-98 transition disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Проверка прав доступа...' : 'Проверить доступ снова'}</span>
          </button>
        </div>
      </div>

      {/* Footer copyright */}
      <footer className="text-center text-xs text-slate-400 py-2">
        «Долги и Чеки» · Магазин «1000 мелочей» · Безопасный режим
      </footer>
    </div>
  );
};
