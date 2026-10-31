import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Clock, 
  Send, 
  Check, 
  Download, 
  Calendar, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  Bot
} from 'lucide-react';
import { ReportFrequency, ReportScheduleConfig } from '../types/debt';
import { triggerHaptic } from '../utils/telegram';

interface ReportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChatId?: string;
  onOpenGeneralPdf?: () => void;
}

export const ReportScheduleModal: React.FC<ReportScheduleModalProps> = ({
  isOpen,
  onClose,
  defaultChatId = '',
  onOpenGeneralPdf,
}) => {
  const [frequency, setFrequency] = useState<ReportFrequency>('daily');
  const [time, setTime] = useState('09:00');
  const [chatId, setChatId] = useState(defaultChatId);
  const [includeSettled, setIncludeSettled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingNow, setIsSendingNow] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load schedule from server
  useEffect(() => {
    if (isOpen) {
      loadSchedule();
    }
  }, [isOpen]);

  const loadSchedule = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reports/schedule');
      const data = await res.json();
      if (data.ok && data.schedule) {
        setFrequency(data.schedule.frequency || 'daily');
        setTime(data.schedule.time || '09:00');
        if (data.schedule.chatId) {
          setChatId(data.schedule.chatId);
        } else if (defaultChatId) {
          setChatId(defaultChatId);
        }
        setIncludeSettled(Boolean(data.schedule.includeSettled));
      }
    } catch (e) {
      // Fallback
      if (defaultChatId) setChatId(defaultChatId);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    triggerHaptic('success');
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/reports/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequency,
          time,
          chatId: chatId.trim(),
          includeSettled,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatusMessage({
          type: 'success',
          text: 'Настройки автоотчетов успешно сохранены!',
        });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.description || 'Не удалось сохранить расписание',
        });
      }
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: 'Ошибка при сохранении расписания на сервере',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReportNow = async () => {
    if (!chatId.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Укажите Telegram Chat ID для отправки файла отчета',
      });
      triggerHaptic('error');
      return;
    }

    triggerHaptic('impact');
    setIsSendingNow(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/reports/send-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatId.trim(),
          includeSettled,
          title: 'Внеочередной отчет по долгам (Excel/CSV)',
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setStatusMessage({
          type: 'success',
          text: '✅ Файл отчета (CSV/Excel) успешно отправлен в ваш Telegram!',
        });
        triggerHaptic('success');
      } else {
        setStatusMessage({
          type: 'error',
          text: `Ошибка: ${data.description || 'Не удалось отправить файл'}`,
        });
        triggerHaptic('error');
      }
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: 'Ошибка связи с сервером Telegram',
      });
      triggerHaptic('error');
    } finally {
      setIsSendingNow(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom duration-250 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Автоотчеты в Telegram
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Файл Excel / CSV ежедневно или еженедельно
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* 1. Frequency Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Периодичность автоотчетов:
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setFrequency('daily');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                  frequency === 'daily'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Ежедневно</span>
                <span className="text-[10px] font-normal text-slate-400">каждое утро</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setFrequency('weekly');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                  frequency === 'weekly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Еженедельно</span>
                <span className="text-[10px] font-normal text-slate-400">по понедельникам</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setFrequency('off');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                  frequency === 'off'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Отключено</span>
                <span className="text-[10px] font-normal text-slate-400">по запросу</span>
              </button>
            </div>
          </div>

          {/* 2. Dispatch Time */}
          {frequency !== 'off' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Время отправки:
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />
              </div>
            </div>
          )}

          {/* 3. Telegram Chat ID */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ваш Telegram Chat ID (куда присылать файл):
              </label>
              {defaultChatId && chatId !== defaultChatId && (
                <button
                  type="button"
                  onClick={() => setChatId(defaultChatId)}
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Мой ID: {defaultChatId}
                </button>
              )}
            </div>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Например: 582910482"
              className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Напишите любое сообщение вашему боту <span className="font-semibold text-slate-600 dark:text-slate-300">@melochey_control_bot</span> или команду <code>/start</code>, и он автоматически пришлет ваш ID.
            </p>
          </div>

          {/* 4. Options */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <input
              type="checkbox"
              id="includeSettledCheck"
              checked={includeSettled}
              onChange={(e) => setIncludeSettled(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="includeSettledCheck" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              Включать закрытые (погашенные) долги в файл отчета
            </label>
          </div>

          {/* 5. Instant Test Dispatch Button */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 space-y-2">
            <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Проверить отправку файла прямо сейчас:</span>
            </div>
            <button
              type="button"
              disabled={isSendingNow}
              onClick={handleSendReportNow}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingNow ? 'Генерация и отправка...' : 'Отправить файл отчета в Telegram'}</span>
            </button>
          </div>

          {/* 6. Direct Downloads */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="/api/reports/download.csv"
              download
              className="h-10 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Excel (CSV)</span>
            </a>

            {onOpenGeneralPdf && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                  onOpenGeneralPdf();
                }}
                className="h-10 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Сводный PDF</span>
              </button>
            )}
          </div>

          {/* Bot Command Tips */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-bold text-slate-700 dark:text-slate-300">
              Команды в боте @melochey_control_bot:
            </div>
            <div>• <code>/report</code> — мгновенно получить свежий CSV файл</div>
            <div>• <code>/stats</code> — краткая сводка сумм в чат</div>
            <div>• <code>/daily</code> — переключить на ежедневные утренние отчеты</div>
            <div>• <code>/weekly</code> — переключить на еженедельные отчеты</div>
          </div>

          {/* Save Schedule CTA */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSave}
              className="w-full h-12 bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Сохранить расписание автоотчетов</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
