import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  MessageCircle, 
  Phone, 
  Bot, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { BotConfig, Debt } from '../types/debt';
import { calculateRemaining, formatAmount, formatDateDetailed } from '../utils/formatters';
import { shareToTelegram, triggerHaptic } from '../utils/telegram';

interface ReminderModalProps {
  debt: Debt | null;
  isOpen: boolean;
  onClose: () => void;
  botConfig: BotConfig;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  debt,
  isOpen,
  onClose,
  botConfig,
}) => {
  if (!isOpen || !debt) return null;

  const remaining = calculateRemaining(debt);
  const formattedAmount = formatAmount(remaining, debt.currency);
  const formattedDate = formatDateDetailed(debt.dueDate);

  const [tone, setTone] = useState<'friendly' | 'polite' | 'urgent'>('friendly');
  const [copied, setCopied] = useState(false);
  const [chatIdInput, setChatIdInput] = useState(botConfig.chatId || '');
  const [botSending, setBotSending] = useState(false);
  const [botResult, setBotResult] = useState<{ success: boolean; message: string } | null>(null);

  // Generate templates based on whether I lent or I borrowed
  const isLent = debt.type === 'i_lent';

  const getReminderText = (): string => {
    if (isLent) {
      if (tone === 'friendly') {
        return `Привет, ${debt.name}! Напоминаю про долг ${formattedAmount}, договаривались вернуть к ${formattedDate}. Получится отправить в ближайшее время? Спасибо! 🙏`;
      }
      if (tone === 'polite') {
        return `Здравствуйте, ${debt.name}! Хочу вежливо напомнить об открытом займе на сумму ${formattedAmount}. Планируемый срок возврата: ${formattedDate}. Буду признателен за обратную связь.`;
      }
      return `Здравствуйте, ${debt.name}! Напоминаю, что срок возврата долга на сумму ${formattedAmount} уже наступил (${formattedDate}). Пожалуйста, выйдите на связь и подтвердите отправку перевода.`;
    } else {
      // I borrowed - reminder to myself or update to creditor
      if (tone === 'friendly') {
        return `Привет, ${debt.name}! Помню про свой долг ${formattedAmount} до ${formattedDate}. Планирую перевести в срок. Спасибо за терпение!`;
      }
      if (tone === 'polite') {
        return `Добрый день, ${debt.name}! Подтверждаю свои обязательства на сумму ${formattedAmount}. Планирую произвести оплату до ${formattedDate}.`;
      }
      return `Добрый день, ${debt.name}! На связи по поводу возврата долга ${formattedAmount}. Уточняю реквизиты для перевода.`;
    }
  };

  const currentMessage = getReminderText();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    triggerHaptic('success');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    triggerHaptic('selection');
    shareToTelegram(currentMessage);
  };

  const handleSendViaBot = async () => {
    if (!chatIdInput.trim()) {
      setBotResult({
        success: false,
        message: 'Укажите Telegram Chat ID (или ID пользователя)',
      });
      triggerHaptic('error');
      return;
    }

    setBotSending(true);
    setBotResult(null);

    try {
      const res = await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatIdInput.trim(),
          text: `<b>Уведомление о долге:</b>\n\n${currentMessage}\n\n<i>Отправлено через Telegram WebApp</i>`,
          token: botConfig.botToken,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setBotResult({
          success: true,
          message: 'Сообщение успешно отправлено через Telegram Bot!',
        });
        triggerHaptic('success');
      } else {
        setBotResult({
          success: false,
          message: `Ошибка бота: ${data.description || 'Не удалось отправить'}`,
        });
        triggerHaptic('error');
      }
    } catch (err) {
      setBotResult({
        success: false,
        message: 'Не удалось связаться с сервером Telegram',
      });
      triggerHaptic('error');
    } finally {
      setBotSending(false);
    }
  };

  const rawPhone = debt.phone.replace(/[^\d+]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom duration-250 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Напоминание о долге
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {debt.name} · {formattedAmount}
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
          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Стиль сообщения:
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setTone('friendly');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                  tone === 'friendly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Дружелюбный
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setTone('polite');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                  tone === 'polite'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Вежливый
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setTone('urgent');
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                  tone === 'urgent'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Срочный
              </button>
            </div>
          </div>

          {/* Generated Message Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed select-all">
              {currentMessage}
            </p>
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Скопировать</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Sharing Options */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Способы отправки:
            </label>

            <button
              type="button"
              onClick={handleShareTelegram}
              className="w-full h-11 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Поделиться в Telegram</span>
            </button>

            {rawPhone && (
              <a
                href={`tel:${rawPhone}`}
                className="w-full h-11 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>Позвонить: {debt.phone}</span>
              </a>
            )}
          </div>

          {/* Send via Telegram Bot API */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Bot className="w-4 h-4 text-sky-500" />
              <span>Отправка через подключенного Telegram Бота</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatIdInput}
                onChange={(e) => setChatIdInput(e.target.value)}
                placeholder="Telegram Chat ID (например: 123456789)"
                className="flex-1 h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                disabled={botSending}
                onClick={handleSendViaBot}
                className="h-9 px-3 rounded-xl bg-slate-900 dark:bg-sky-500 text-white text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50 shrink-0"
              >
                {botSending ? 'Отправка...' : 'Отправить'}
              </button>
            </div>

            {botResult && (
              <div
                className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                  botResult.success
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {botResult.success ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{botResult.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
