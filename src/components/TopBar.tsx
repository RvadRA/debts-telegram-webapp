import React from 'react';
import { Search, Bell, Plus, ShieldCheck, Sun, Moon } from 'lucide-react';
import { TelegramWebAppUser } from '../types/debt';
import { triggerHaptic } from '../utils/telegram';

interface TopBarProps {
  user: TelegramWebAppUser;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenNewDebt: () => void;
  onOpenBotSettings: () => void;
  onOpenReports: () => void;
  onOpenAccessControl: () => void;
  ownersCount: number;
  totalActiveCount: number;
  hasAlerts: boolean;
  onToggleSearch: () => void;
  isSearchVisible: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  isDark,
  onToggleTheme,
  onOpenNewDebt,
  onOpenBotSettings,
  onOpenReports,
  onOpenAccessControl,
  ownersCount,
  totalActiveCount,
  hasAlerts,
  onToggleSearch,
  isSearchVisible,
}) => {
  const handleNewDebt = () => {
    triggerHaptic('impact');
    onOpenNewDebt();
  };

  const handleSearchClick = () => {
    triggerHaptic('selection');
    onToggleSearch();
  };

  const handleAlertsClick = () => {
    triggerHaptic('selection');
    onOpenReports();
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors pt-3 pb-2 px-4">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Large Title "Долги" as seen in screenshot */}
        <div className="flex items-baseline gap-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Долги
          </h1>
          {ownersCount > 0 && (
            <button
              onClick={() => {
                triggerHaptic('selection');
                onOpenAccessControl();
              }}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition"
              title="Режим 2 владельцев магазина"
            >
              2 владельца ({ownersCount}/2)
            </button>
          )}
        </div>

        {/* Right Icon Actions: Search, Notification Bell with red dot, Plus CTA */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            type="button"
            onClick={handleSearchClick}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 ${
              isSearchVisible
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50'
            }`}
            aria-label="Поиск"
          >
            <Search className="w-4 h-4 stroke-[2.3]" />
          </button>

          {/* Notification Bell Button with Red Dot */}
          <button
            type="button"
            onClick={handleAlertsClick}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 transition active:scale-95 flex items-center justify-center relative"
            aria-label="Уведомления и автоотчеты"
            title="Автоматические отчеты и напоминания"
          >
            <Bell className="w-4 h-4 stroke-[2.2]" />
            {hasAlerts && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Blue Circular Plus Button */}
          <button
            type="button"
            onClick={handleNewDebt}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-blue-500/30 transition"
            aria-label="Добавить долг"
          >
            <Plus className="w-5 h-5 stroke-[2.8]" />
          </button>
        </div>
      </div>
    </header>
  );
};
