import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, UserPlus, Trash2, Copy, Check, Crown, KeyRound, AlertCircle } from 'lucide-react';
import { ShopOwner, TelegramWebAppUser } from '../types/debt';
import { triggerHaptic } from '../utils/telegram';

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  owners: ShopOwner[];
  currentUserId: string;
  telegramUser: TelegramWebAppUser;
  onRefreshOwners: () => void;
}

export const AccessControlModal: React.FC<AccessControlModalProps> = ({
  isOpen,
  onClose,
  owners,
  currentUserId,
  telegramUser,
  onRefreshOwners,
}) => {
  const [newOwnerId, setNewOwnerId] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerHaptic('success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanId = newOwnerId.trim();
    if (!cleanId) {
      setErrorMsg('Пожалуйста, введите числовой Telegram ID второго владельца');
      triggerHaptic('error');
      return;
    }

    if (owners.length >= 2 && !owners.some((o) => o.id === cleanId)) {
      setErrorMsg('Уже зарегистрированы 2 владельца. Сначала удалите второго владельца для замены.');
      triggerHaptic('error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/owners/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cleanId,
          name: newOwnerName.trim() || 'Второй владелец',
          requesterId: currentUserId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccessMsg('Второй владелец магазина успешно добавлен! Доступ активирован.');
        setNewOwnerId('');
        setNewOwnerName('');
        triggerHaptic('success');
        onRefreshOwners();
      } else {
        setErrorMsg(data.error || 'Ошибка при добавлении владельца');
        triggerHaptic('error');
      }
    } catch (err) {
      setErrorMsg('Ошибка соединения с сервером');
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveOwner = async (ownerIdToRemove: string) => {
    if (owners.length <= 1) {
      setErrorMsg('Нельзя удалить единственного главного владельца.');
      triggerHaptic('error');
      return;
    }

    if (!confirm('Вы уверены, что хотите отозвать доступ у этого владельца?')) {
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/owners/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ownerIdToRemove,
          requesterId: currentUserId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccessMsg('Доступ владельца отозван. Теперь вы можете добавить нового совладельца.');
        triggerHaptic('success');
        onRefreshOwners();
      } else {
        setErrorMsg(data.error || 'Ошибка при удалении владельца');
        triggerHaptic('error');
      }
    } catch (err) {
      setErrorMsg('Ошибка соединения с сервером');
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const primaryOwner = owners[0];
  const secondaryOwner = owners[1];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom duration-250 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Доступ магазина (2 владельца)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Защита от посторонних лиц и управление доступом
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3">
            <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Приватный режим магазина включен.</span>{' '}
              Только <b>2 авторизованных человека</b> могут видеть финансовые долги, чеки, скачивать отчеты и вызывать команды бота. Все остальные пользователи блокируются.
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* List of current owners */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Авторизованные владельцы ({owners.length}/2)
            </label>

            {/* Owner #1 Card */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {primaryOwner?.name || 'Главный владелец'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-semibold shrink-0">
                      Владелец №1
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                    <span>ID: {primaryOwner?.id || '—'}</span>
                    {primaryOwner?.username && <span className="text-slate-400">(@{primaryOwner.username})</span>}
                  </div>
                </div>
              </div>

              {primaryOwner?.id && (
                <button
                  type="button"
                  onClick={() => handleCopy(primaryOwner.id, 'owner1')}
                  title="Скопировать ID"
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition shrink-0"
                >
                  {copiedId === 'owner1' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Owner #2 Card */}
            {secondaryOwner ? (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {secondaryOwner.name || 'Второй владелец'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200 font-semibold shrink-0">
                        Владелец №2
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>ID: {secondaryOwner.id}</span>
                      {secondaryOwner.username && <span className="text-slate-400">(@{secondaryOwner.username})</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(secondaryOwner.id, 'owner2')}
                    title="Скопировать ID"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                  >
                    {copiedId === 'owner2' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveOwner(secondaryOwner.id)}
                    title="Отозвать доступ"
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                      Второй владелец не назначен
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Добавьте Telegram ID совладельца формы ниже
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add 2nd Owner Form (if spot open) */}
          {owners.length < 2 && (
            <form onSubmit={handleAddOwner} className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Добавить совладельца магазина
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                  Telegram ID совладельца <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  placeholder="Например: 987654321"
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                  Имя совладельца (для отображения)
                </label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="Например: Алишер (Совладелец)"
                  className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-sky-500/20 active:scale-98 transition disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Сохранение...' : 'Предоставить доступ 2-му владельцу'}</span>
              </button>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                💡 <i>Подсказка:</i> Второй человек может отправить любое слово боту в Telegram. Бот ответит ему его точным числовым Telegram ID.
              </p>
            </form>
          )}

          {/* Current User Telegram ID info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-slate-500 block">Ваш текущий Telegram ID:</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {telegramUser.id ? String(telegramUser.id) : currentUserId || 'Режим браузера'}
              </span>
            </div>
            {telegramUser.id && (
              <button
                type="button"
                onClick={() => handleCopy(String(telegramUser.id), 'myid')}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 transition"
              >
                {copiedId === 'myid' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Копировать</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Лимит: ровно 2 владельца
          </span>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-semibold rounded-xl transition"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
