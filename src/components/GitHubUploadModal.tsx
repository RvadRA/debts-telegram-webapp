import React, { useState } from 'react';
import { X, Github, Copy, Check, Download, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface GitHubUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubUploadModal: React.FC<GitHubUploadModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, index: number) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitCommands = [
    'git remote add origin https://github.com/ВАШ_ЛОГИН/debts-telegram-webapp.git',
    'git branch -M main',
    'git push -u origin main',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Загрузка проекта на GitHub
              </h2>
              <p className="text-xs text-slate-400">Репозиторий уже инициализирован (ветка main)</p>
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
        <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Option 1: 1-click Download Archive */}
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-200 text-sm">
              <Download className="w-4 h-4 text-blue-600" />
              <span>Способ 1: Скачать готовый архив проекта</span>
            </div>
            <p className="text-blue-900/80 dark:text-blue-300 leading-relaxed">
              Скачайте чистый архив проекта (без папки node_modules и лишних файлов), готовый для распаковки или загрузки в GitHub репозиторий через браузер.
            </p>
            <a
              href="/api/project/archive"
              download="telegram-debts-tracker.tar.gz"
              onClick={() => triggerHaptic('success')}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Скачать архив (telegram-debts-tracker.tar.gz)</span>
            </a>
          </div>

          {/* Option 2: Git Push via Terminal */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
              <Terminal className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <span>Способ 2: Загрузка через Git терминал</span>
            </div>

            <ol className="space-y-2 text-slate-600 dark:text-slate-400 list-decimal list-inside">
              <li>
                Создайте новый репозиторий на{' '}
                <a
                  href="https://github.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-semibold underline inline-flex items-center gap-0.5"
                >
                  GitHub.com/new <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                (не добавляйте README, так как он уже создан).
              </li>
              <li>Скопируйте URL вашего нового репозитория.</li>
              <li>Выполните команды в терминале:</li>
            </ol>

            {/* Code Block */}
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] space-y-2 relative">
              <button
                type="button"
                onClick={() => copyText(gitCommands.join('\n'), 99)}
                className="absolute right-2.5 top-2.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition"
                title="Скопировать все команды"
              >
                {copiedIndex === 99 ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="text-[10px]">Копировать</span>
                  </>
                )}
              </button>

              <div className="text-slate-400"># Связать с вашим GitHub репозиторием:</div>
              <div>git remote add origin https://github.com/ЛОГИН/РЕПОЗИТОРИЙ.git</div>
              <div className="text-slate-400 mt-1"># Отправить проект на GitHub (если репозиторий уже существовал, используйте --force):</div>
              <div>git branch -M main</div>
              <div>git push -u origin main --force</div>
            </div>
          </div>

          {/* Privacy & Security Note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Файл <code className="font-mono bg-emerald-100 dark:bg-emerald-900/50 px-1 rounded">.gitignore</code> уже настроен. Ваши реальные данные долгов и локальные переменные защищены и не попадут в публичный репозиторий.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
