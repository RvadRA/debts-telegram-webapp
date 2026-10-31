import React, { useState, useEffect } from 'react';
import { X, Bot, Check, AlertCircle, RefreshCw, Send, ShieldCheck, ExternalLink } from 'lucide-react';
import { BotConfig } from '../types/debt';
import { triggerHaptic } from '../utils/telegram';

interface BotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
  onSaveConfig: (config: BotConfig) => void;
}

export const BotSettingsModal: React.FC<BotSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [token, setToken] = useState(config.botToken);
  const [chatId, setChatId] = useState(config.chatId);
  const [isLoading, setIsLoading] = useState(false);
  const [botInfo, setBotInfo] = useState<{ ok: boolean; result?: { username: string; first_name: string; id: number } } | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setToken(config.botToken);
      setChatId(config.chatId);
      checkBot(config.botToken);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const checkBot = async (tokenToCheck: string) => {
    setIsLoading(true);
    setTestStatus(null);
    try {
      const res = await fetch(`/api/telegram/bot-info?token=${encodeURIComponent(tokenToCheck)}`);
      const data = await res.json();
      setBotInfo(data);
    } catch (err) {
      setBotInfo({ ok: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!chatId.trim()) {
      setTestStatus('Пожалуйста, введите ваш Telegram Chat ID');
      triggerHaptic('error');
      return;
    }

    setIsLoading(true);
    setTestStatus('Отправка тестового сообщения...');
    try {
      const res = await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatId.trim(),
          text: '🤖 <b>Долги и Чеки: Тест связи успешен!</b>\n\nБот подключен и готов отправлять напоминания о возврате долгов и электронные расписки.',
          token: token.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestStatus('✅ Сообщение успешно доставлено в Telegram!');
        triggerHaptic('success');
      } else {
        setTestStatus(`❌ Ошибка Telegram: ${data.description || 'Не удалось отправить'}`);
        triggerHaptic('error');
      }
    } catch (err) {
      setTestStatus('❌ Ошибка отправки запроса');
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    triggerHaptic('success');
    onSaveConfig({
      ...config,
      botToken: token.trim(),
      chatId: chatId.trim(),
      botUsername: botInfo?.result?.username,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom duration-250 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Интеграция с Telegram Bot API
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Автоматические уведомления и расписки
              </p>
            </div>
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Bot Connection Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Статус подключения бота:
              </span>
              <button
                type="button"
                onClick={() => checkBot(token)}
                disabled={isLoading}
                className="text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Проверить</span>
              </button>
            </div>

            {botInfo?.ok && botInfo.result ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">{botInfo.result.first_name}</div>
                  <div className="text-[11px] opacity-80">@{botInfo.result.username} (ID: {botInfo.result.id})</div>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Бот проверяется или токен не валиден</span>
              </div>
            )}
          </div>

          {/* Bot Token Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Telegram Bot Token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="8200264736:AAFJ8tHwzNK5CJ0Xle55TmmJtRGoQEwt4I0"
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          {/* Chat ID Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ваш Telegram Chat ID (или ID получателя)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Например: 582910482"
                className="flex-1 h-10 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <button
                type="button"
                onClick={handleSendTestMessage}
                disabled={isLoading}
                className="h-10 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Тест</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Узнать свой Chat ID можно у бота @userinfobot или написав /start вашему боту.
            </p>
          </div>

          {testStatus && (
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium">
              {testStatus}
            </div>
          )}

          {/* Quick Bot Link */}
          {botInfo?.result?.username && (
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-200 flex items-center justify-between">
              <span>Открыть бота в Telegram:</span>
              <a
                href={`https://t.me/${botInfo.result.username}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold flex items-center gap-1 underline"
              >
                @{botInfo.result.username}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="w-full h-11 bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              Сохранить настройки
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
