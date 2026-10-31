import React, { useRef, useState } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Printer, 
  Receipt, 
  FileText, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Calendar,
  User,
  Phone,
  QrCode,
  Loader2
} from 'lucide-react';
import { Debt } from '../types/debt';
import { calculateRemaining, formatAmount, formatDateDetailed, formatPhone } from '../utils/formatters';
import { shareToTelegram, triggerHaptic } from '../utils/telegram';
import { generatePdfFromElement } from '../utils/pdfGenerator';

interface IOUReceiptModalProps {
  debt: Debt | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReceipt: (photoUrl: string, caption?: string) => void;
}

export const IOUReceiptModal: React.FC<IOUReceiptModalProps> = ({
  debt,
  isOpen,
  onClose,
  onOpenReceipt,
}) => {
  const receiptContainerRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPdfReady, setIsPdfReady] = useState(false);

  if (!isOpen || !debt) return null;

  const remaining = calculateRemaining(debt);
  const totalRepaid = debt.amount - remaining;
  const isLent = debt.type === 'i_lent';
  const docNumber = `IOU-${debt.id.replace(/\D/g, '').slice(0, 6) || Math.floor(100000 + Math.random() * 900000)}`;

  const handleDownloadPdf = async () => {
    if (!receiptContainerRef.current) return;
    triggerHaptic('impact');
    setIsGeneratingPdf(true);
    try {
      const sanitizedName = debt.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
      const filename = `Расписка_${sanitizedName}_${docNumber}.pdf`;
      await generatePdfFromElement(receiptContainerRef.current, filename, { orientation: 'p' });
      setIsPdfReady(true);
      triggerHaptic('success');
      setTimeout(() => setIsPdfReady(false), 2500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      triggerHaptic('error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShare = () => {
    triggerHaptic('selection');
    const text = `📄 Официальная расписка №${docNumber}\nСумма: ${formatAmount(debt.amount, debt.currency)}\n${isLent ? `Заемщик (Должник): ${debt.name}` : `Кредитор: ${debt.name}`}\nСрок возврата: ${formatDateDetailed(debt.dueDate)}\n${debt.isSettled ? '✅ Долг полностью закрыт' : `Остаток к возврату: ${formatAmount(remaining, debt.currency)}`}\n\nСформировано через Telegram WebApp «Долги и Чеки»`;
    shareToTelegram(text);
  };

  const handlePrint = () => {
    triggerHaptic('light');
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom duration-250 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                PDF Расписка и Акт долга
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Готовый документ для отправки должнику
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

        {/* Scrollable Printable Document Container */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Action buttons (Top Bar) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Создание PDF...</span>
                </>
              ) : isPdfReady ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>PDF сохранен!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Скачать PDF файл</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="h-11 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-98 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Поделиться в Telegram</span>
            </button>
          </div>

          {/* Printable Document Paper Card (This gets rendered into the PDF) */}
          <div
            ref={receiptContainerRef}
            className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-sm relative space-y-4 font-sans"
            style={{ minHeight: '620px' }}
          >
            {/* Stamp if settled */}
            {debt.isSettled ? (
              <div className="absolute top-6 right-6 border-2 border-emerald-600 text-emerald-600 font-black text-xs px-3 py-1 rounded-md rotate-[-6deg] uppercase tracking-wider bg-emerald-50">
                ✓ ДОЛГ ПОГАШЕН
              </div>
            ) : (
              <div className="absolute top-6 right-6 border border-sky-300 text-sky-700 font-bold text-[10px] px-2.5 py-1 rounded-md bg-sky-50">
                АКТИВНОЕ ОБЯЗАТЕЛЬСТВО
              </div>
            )}

            {/* Document Header */}
            <div className="text-center pb-4 border-b border-slate-200 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Официальный финансовый акт</span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                ДОЛГОВАЯ РАСПИСКА / АКТ ВЗАИМОРАСЧЕТОВ
              </h1>
              <div className="text-xs text-slate-500">
                № {docNumber} от {formatDateDetailed(debt.startDate || debt.createdAt)}
              </div>
            </div>

            {/* Parties Table */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-1">
                  <User className="w-3 h-3" />
                  <span>{isLent ? 'Займодавец (Кредитор):' : 'Заемщик (Должник):'}</span>
                </div>
                <div className="font-bold text-slate-900">Вы (Пользователь приложения)</div>
                <div className="text-[11px] text-slate-500">Telegram WebApp ID Verified</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-1">
                  <User className="w-3 h-3" />
                  <span>{isLent ? 'Заемщик (Должник):' : 'Займодавец (Кредитор):'}</span>
                </div>
                <div className="font-bold text-slate-900 truncate">{debt.name}</div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {formatPhone(debt.phone) || 'Телефон не указан'}
                </div>
              </div>
            </div>

            {/* Main Financial Calculation Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-600">Сумма займа:</span>
                <span className="text-sm font-bold text-slate-900 tabular-nums">
                  {formatAmount(debt.amount, debt.currency)}
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-600">Возвращенная часть:</span>
                <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                  - {formatAmount(totalRepaid, debt.currency)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-900">
                  {debt.isSettled ? 'Итого к возврату:' : 'Текущий остаток задолженности:'}
                </span>
                <span className="text-lg font-black text-slate-900 tabular-nums">
                  {debt.isSettled ? `0.00 ${debt.currency}` : formatAmount(remaining, debt.currency)}
                </span>
              </div>
            </div>

            {/* Terms and Due date */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Согласованный срок возврата:</span>
                <span className="font-bold text-slate-900">{formatDateDetailed(debt.dueDate)}</span>
              </div>

              {debt.notes && (
                <div className="py-1">
                  <span className="text-slate-500">Назначение / основание займа:</span>
                  <p className="italic text-slate-700 mt-0.5">{debt.notes}</p>
                </div>
              )}
            </div>

            {/* Repayments History Log */}
            {debt.repayments.length > 0 && (
              <div className="space-y-1.5 text-xs pt-1">
                <div className="font-bold text-slate-800">
                  История совершенных платежей ({debt.repayments.length}):
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-[10px] text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="p-1.5">Дата</th>
                        <th className="p-1.5">Сумма</th>
                        <th className="p-1.5">Комментарий</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {debt.repayments.map((r, i) => (
                        <tr key={r.id || i}>
                          <td className="p-1.5 text-slate-500">{r.date}</td>
                          <td className="p-1.5 font-bold text-emerald-600 tabular-nums">
                            +{formatAmount(r.amount, debt.currency)}
                          </td>
                          <td className="p-1.5 text-slate-600">{r.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Attached receipt thumbnail in document */}
            {debt.receiptPhoto && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Прикрепленный кассовый чек / расписка:</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <img
                    src={debt.receiptPhoto}
                    alt="Чек"
                    className="w-16 h-16 object-contain rounded bg-white border border-slate-200 shrink-0"
                  />
                  <div className="text-xs">
                    <div className="font-medium text-slate-800">
                      {debt.receiptCaption || 'Электронный платежный документ'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Подтверждение выдачи денежных средств зафиксировано
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Signatures & Verification Seal */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs text-slate-600">
              <div className="space-y-4">
                <div className="font-semibold text-[11px] uppercase text-slate-400">
                  Займодавец:
                </div>
                <div className="border-b border-slate-300 pb-1 text-slate-400 italic text-[11px]">
                  Подпись: __________________
                </div>
              </div>

              <div className="space-y-4">
                <div className="font-semibold text-[11px] uppercase text-slate-400">
                  Заемщик (Должник):
                </div>
                <div className="border-b border-slate-300 pb-1 text-slate-400 italic text-[11px]">
                  Подпись: __________________
                </div>
              </div>
            </div>

            {/* Document Digital Footer */}
            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
              <div>Документ сформирован в Telegram WebApp «Долги и Чеки»</div>
              <div className="font-mono">ID: {debt.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
