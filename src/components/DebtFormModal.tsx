import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  Calendar, 
  User, 
  Phone, 
  DollarSign, 
  Receipt, 
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  RotateCw,
  Bell,
  AtSign
} from 'lucide-react';
import { Currency, Debt, DebtType } from '../types/debt';
import { CURRENCIES, formatAmount } from '../utils/formatters';
import { configureBackButton, configureMainButton, hideBackButton, hideMainButton, triggerHaptic } from '../utils/telegram';

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Omit<Debt, 'id' | 'repayments' | 'isSettled' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Debt | null;
  defaultCurrency: Currency;
}

export const DebtFormModal: React.FC<DebtFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultCurrency,
}) => {
  const [type, setType] = useState<DebtType>('i_lent');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [debtorTelegramId, setDebtorTelegramId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState<string | undefined>(undefined);
  const [receiptCaption, setReceiptCaption] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Helper to get formatted date string for presets
  const getDatePlusDays = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Populate initial data when editing or opening
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setName(initialData.name);
      setPhone(initialData.phone || '');
      setDebtorTelegramId(initialData.debtorTelegramId || '');
      setAmount(initialData.amount.toString());
      setCurrency(initialData.currency);
      setDueDate(initialData.dueDate);
      setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
      setIsRecurring(Boolean(initialData.isRecurring));
      setRecurringDayOfMonth(initialData.recurringDayOfMonth || 1);
      setNotes(initialData.notes || '');
      setReceiptPhoto(initialData.receiptPhoto);
      setReceiptCaption(initialData.receiptCaption || '');
    } else {
      // Default new form state
      setType('i_lent');
      setName('');
      setPhone('');
      setDebtorTelegramId('');
      setAmount('');
      setCurrency(defaultCurrency);
      setDueDate(getDatePlusDays(7)); // default 1 week
      setStartDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
      setRecurringDayOfMonth(1);
      setNotes('');
      setReceiptPhoto(undefined);
      setReceiptCaption('');
    }
    setError(null);
  }, [initialData, isOpen, defaultCurrency]);

  // Wire Telegram WebApp MainButton and BackButton
  useEffect(() => {
    if (!isOpen) {
      hideMainButton();
      hideBackButton();
      return;
    }

    configureBackButton(() => {
      triggerHaptic('light');
      onClose();
    });

    configureMainButton({
      text: initialData ? 'Сохранить изменения' : 'Создать запись о долге',
      color: type === 'i_lent' ? '#10b981' : '#f59e0b',
      onClick: () => {
        handleSubmit();
      },
    });

    return () => {
      hideMainButton();
      hideBackButton();
    };
  }, [isOpen, initialData, type, name, amount, dueDate, currency, phone, receiptPhoto, notes, receiptCaption]);

  if (!isOpen) return null;

  // Compress and read image to base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите файл изображения (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setReceiptPhoto(compressedDataUrl);
          triggerHaptic('success');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      setError('Укажите имя человека или организацию');
      triggerHaptic('error');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/\s+/g, '').replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Укажите корректную сумму долга больше нуля');
      triggerHaptic('error');
      return;
    }

    if (!dueDate) {
      setError('Выберите дату планируемого возврата');
      triggerHaptic('error');
      return;
    }

    setError(null);
    triggerHaptic('success');

    onSave({
      type,
      name: name.trim(),
      phone: phone.trim(),
      debtorTelegramId: debtorTelegramId.trim(),
      amount: numericAmount,
      currency,
      dueDate,
      startDate: startDate || new Date().toISOString().split('T')[0],
      isRecurring,
      recurringInterval: 'monthly',
      recurringDayOfMonth,
      notes: notes.trim(),
      receiptPhoto,
      receiptCaption: receiptCaption.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {initialData ? 'Редактировать долг' : 'Новая запись о долге'}
            </h2>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 pb-28 sm:pb-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Debt Type Switch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Тип операции:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setType('i_lent');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  type === 'i_lent'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Мне должны</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setType('i_borrowed');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  type === 'i_borrowed'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>Я должен</span>
              </button>
            </div>
          </div>

          {/* 2. Contact Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Имя человека / Кому или От кого <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Иван Иванов, Саша Коллега"
                className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
              />
            </div>
          </div>

          {/* 3. Phone Number & Telegram ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Номер телефона
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Telegram ID / Username (для авто-напоминаний)
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={debtorTelegramId}
                  onChange={(e) => setDebtorTelegramId(e.target.value)}
                  placeholder="Chat ID или @username"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* 4. Amount & Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Сумма долга <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                />
              </div>

              {/* Currency Picker */}
              <select
                value={currency}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setCurrency(e.target.value as Currency);
                }}
                className="h-11 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 shrink-0"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.symbol} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Amount Helper Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
              {[500, 1000, 3000, 5000, 10000, 20000].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    const curr = parseFloat(amount.replace(/\s+/g, '')) || 0;
                    setAmount((curr + quick).toString());
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0"
                >
                  +{quick.toLocaleString('ru-RU')}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Due Date (Дата возврата) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Дата возврата <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Когда нужно вернуть</span>
            </div>

            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
              />
            </div>

            {/* Quick date preset buttons */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
              {[
                { label: 'Через 3 дня', days: 3 },
                { label: 'Через 7 дней', days: 7 },
                { label: 'Через 14 дней', days: 14 },
                { label: 'Через месяц', days: 30 },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setDueDate(getDatePlusDays(preset.days));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Recurring Debt (Повторяющийся долг: Аренда, Подписки) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <RotateCw className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Регулярный долг (Аренда, подписки)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Автоматическое начисление долга каждый месяц
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setIsRecurring(!isRecurring);
                }}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  isRecurring ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    isRecurring ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  Начислять новый долг:
                </span>
                <select
                  value={recurringDayOfMonth}
                  onChange={(e) => {
                    triggerHaptic('selection');
                    setRecurringDayOfMonth(parseInt(e.target.value, 10));
                  }}
                  className="h-8 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-slate-100 font-bold text-xs shadow-2xs focus:outline-none"
                >
                  <option value={1}>1-го числа каждого месяца</option>
                  <option value={5}>5-го числа каждого месяца</option>
                  <option value={10}>10-го числа каждого месяца</option>
                  <option value={15}>15-го числа каждого месяца</option>
                  <option value={20}>20-го числа каждого месяца</option>
                  <option value={25}>25-го числа каждого месяца</option>
                </select>
              </div>
            )}
          </div>

          {/* 6. Receipt Photo Attachment (Фотография чека / расписки) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Фотография чека / расписки
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Опционально</span>
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {receiptPhoto ? (
              <div className="space-y-2">
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <img
                    src={receiptPhoto}
                    alt="Прикрепленный чек"
                    className="w-full max-h-48 object-contain bg-slate-100 dark:bg-slate-950 p-2"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('impact');
                        fileInputRef.current?.click();
                      }}
                      className="px-2 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[10px] font-medium backdrop-blur-xs transition"
                    >
                      Заменить
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('error');
                        setReceiptPhoto(undefined);
                      }}
                      className="w-7 h-7 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={receiptCaption}
                  onChange={(e) => setReceiptCaption(e.target.value)}
                  placeholder="Примечание к чеку (например: Чек из кафе, перевод Т-Банк)"
                  className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    cameraInputRef.current?.click();
                  }}
                  className="py-3 px-3 rounded-xl border border-dashed border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-50 text-sky-700 dark:text-sky-300 flex flex-col items-center justify-center gap-1 transition active:scale-98"
                >
                  <Camera className="w-5 h-5 text-sky-500" />
                  <span className="text-xs font-semibold">Сделать снимок</span>
                  <span className="text-[10px] text-slate-400">Камера смартфона</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    fileInputRef.current?.click();
                  }}
                  className="py-3 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center gap-1 transition active:scale-98"
                >
                  <Upload className="w-5 h-5 text-slate-500" />
                  <span className="text-xs font-semibold">Загрузить файл</span>
                  <span className="text-[10px] text-slate-400">Галерея или фото</span>
                </button>
              </div>
            )}
          </div>

          {/* 7. Notes / Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Примечание или комментарий
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Например: на покупку техники, вернуть на карту Сбера..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition resize-none"
              />
            </div>
          </div>

          {/* Submit button for desktop or fallback when Telegram MainButton is not visible */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full h-12 rounded-2xl text-white font-bold text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 ${
                type === 'i_lent'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
              }`}
            >
              <span>{initialData ? 'Сохранить изменения' : 'Создать запись о долге'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
