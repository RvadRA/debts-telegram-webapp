import React from 'react';
import { X, ShieldCheck, Bot, FileSpreadsheet, Download, Moon, Sun, HelpCircle, ChevronRight, Github } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAccessControl: () => void;
  onOpenBotSettings: () => void;
  onOpenReports: () => void;
  onExportBackup: () => void;
  onOpenSecurityFAQ: () => void;
  onOpenGitHubUpload: () => void;
  ownersCount: number;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  isOpen,
  onClose,
  isDark,
  onToggleTheme,
  onOpenAccessControl,
  onOpenBotSettings,
  onOpenReports,
  onExportBackup,
  onOpenSecurityFAQ,
  onOpenGitHubUpload,
  ownersCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Меню и Настройки</h2>
            <p className="text-xs text-slate-400">Управление магазином, экспортом и GitHub</p>
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

        {/* Menu Items */}
        <div className="py-3 space-y-2 overflow-y-auto flex-1">
          {/* GitHub Upload Item (Featured) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onClose();
              onOpenGitHubUpload();
            }}
            className="w-full p-4 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 flex items-center justify-between hover:bg-slate-800 dark:hover:bg-slate-700 transition group text-left shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shadow-xs">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Загрузить на GitHub
                </div>
                <div className="text-xs text-slate-300">
                  Скачать чистый архив проекта или отправить через Git
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition" />
          </button>

          {/* 1. Access Control (2 Owners) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onClose();
              onOpenAccessControl();
            }}
            className="w-full p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between hover:bg-amber-100/60 transition group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  2 Владельца магазина
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  Зарегистрировано {ownersCount} из 2 владельцев
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-0.5 transition" />
          </button>

          {/* 2. Telegram Bot Integration */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onClose();
              onOpenBotSettings();
            }}
            className="w-full p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 flex items-center justify-between hover:bg-sky-100/60 transition group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Telegram Bot API
                </div>
                <div className="text-xs text-sky-700 dark:text-sky-300">
                  Команды /report, /stats, автоотчеты
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-sky-500 group-hover:translate-x-0.5 transition" />
          </button>

          {/* 3. Automatic Reports & Excel */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onClose();
              onOpenReports();
            }}
            className="w-full p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between hover:bg-emerald-100/60 transition group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Автоотчеты и Экспорт Excel
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300">
                  Ежедневные и еженедельные выгрузки в CSV/Excel
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-0.5 transition" />
          </button>

          {/* 4. Security & Access FAQ */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onClose();
              onOpenSecurityFAQ();
            }}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:bg-slate-100 transition group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Безопасность Telegram ID
                </div>
                <div className="text-xs text-slate-400">
                  Может ли чужой зайти с моим ID?
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition" />
          </button>

          {/* 5. Theme Toggle */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onToggleTheme();
            }}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:bg-slate-100 transition group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-xs">
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isDark ? 'Светлая тема' : 'Темная тема'}
                </div>
                <div className="text-xs text-slate-400">
                  Переключить оформление интерфейса
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {isDark ? 'Темная' : 'Светлая'}
            </span>
          </button>

          {/* 6. Export JSON backup */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('success');
              onClose();
              onExportBackup();
            }}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:bg-slate-100 transition group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-600 text-white flex items-center justify-center shadow-xs">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Скачать резервную копию JSON
                </div>
                <div className="text-xs text-slate-400">
                  Сохранить все долги на устройство
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
