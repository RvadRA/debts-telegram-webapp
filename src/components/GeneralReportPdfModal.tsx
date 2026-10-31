import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  FileSpreadsheet, 
  Printer, 
  Check, 
  Loader2, 
  Scale, 
  ArrowDownLeft, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { Currency, Debt } from '../types/debt';
import { calculateRemaining, formatAmount, formatDateDetailed, formatDateShort, formatPhone } from '../utils/formatters';
import { shareToTelegram, triggerHaptic } from '../utils/telegram';
import { generatePdfFromElement } from '../utils/pdfGenerator';

interface GeneralReportPdfModalProps {
  debts: Debt[];
  isOpen: boolean;
  onClose: () => void;
  selectedCurrency: Currency;
}

export const GeneralReportPdfModal: React.FC<GeneralReportPdfModalProps> = ({
  debts,
  isOpen,
  onClose,
  selectedCurrency,
}) => {
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPdfReady, setIsPdfReady] = useState(false);

  if (!isOpen) return null;

  // Filter debts for the selected currency
  const currencyDebts = debts.filter((d) => d.currency === selectedCurrency);
  const activeDebts = currencyDebts.filter((d) => !d.isSettled);

  const totalLentRemaining = activeDebts
    .filter((d) => d.type === 'i_lent')
    .reduce((sum, d) => sum + calculateRemaining(d), 0);

  const totalBorrowedRemaining = activeDebts
    .filter((d) => d.type === 'i_borrowed')
    .reduce((sum, d) => sum + calculateRemaining(d), 0);

  const netBalance = totalLentRemaining - totalBorrowedRemaining;

  const settledCount = currencyDebts.filter((d) => d.isSettled).length;

  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return;
    triggerHaptic('impact');
    setIsGeneratingPdf(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Финансовый_отчет_долгов_${dateStr}.pdf`;
      await generatePdfFromElement(reportContainerRef.current, filename, { orientation: 'p' });
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
    const summaryText = `📊 Сводный финансовый отчет по долгам (${selectedCurrency})\n\n` +
      `🟢 Мне должны: ${formatAmount(totalLentRemaining, selectedCurrency)}\n` +
      `🔴 Я должен: ${formatAmount(totalBorrowedRemaining, selectedCurrency)}\n` +
      `⚖️ Сальдо: ${netBalance >= 0 ? '+' : ''}${formatAmount(netBalance, selectedCurrency)}\n` +
      `Активных долгов: ${activeDebts.length}, Закрытых: ${settledCount}\n\n` +
      `Сформировано через Telegram WebApp «Долги и Чеки»`;
    shareToTelegram(summaryText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom duration-250 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Общий PDF-отчет и ведомость
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Полная сводная выписка по всем долгам
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

        {/* Action Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Записей: {currencyDebts.length} (в валюте {selectedCurrency})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-98 transition disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Формирование PDF...</span>
                </>
              ) : isPdfReady ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Готово!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="h-10 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Container */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div
            ref={reportContainerRef}
            className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-sm relative space-y-4 font-sans"
          >
            {/* Report Header */}
            <div className="pb-4 border-b border-slate-200 flex justify-between items-start">
              <div>
                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full mb-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Финансовая ведомость</span>
                </div>
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  СВОДНЫЙ РЕЕСТР ДОЛГОВ И ОБЯЗАТЕЛЬСТВ
                </h1>
                <div className="text-xs text-slate-500">
                  Дата формирования: {formatDateDetailed(new Date().toISOString().split('T')[0])}
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="font-bold text-slate-900">Telegram WebApp</div>
                <div className="text-slate-400 text-[11px]">«Долги и Чеки»</div>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Мне должны:</span>
                  <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                </div>
                <div className="text-base font-extrabold text-emerald-600 tabular-nums">
                  {formatAmount(totalLentRemaining, selectedCurrency)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {currencyDebts.filter((d) => d.type === 'i_lent' && !d.isSettled).length} активных
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Я должен:</span>
                  <ArrowUpRight className="w-3 h-3 text-amber-600" />
                </div>
                <div className="text-base font-extrabold text-amber-600 tabular-nums">
                  {formatAmount(totalBorrowedRemaining, selectedCurrency)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {currencyDebts.filter((d) => d.type === 'i_borrowed' && !d.isSettled).length} активных
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Чистый баланс:</span>
                  <Scale className="w-3 h-3 text-sky-600" />
                </div>
                <div className={`text-base font-extrabold tabular-nums ${netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                  {netBalance >= 0 ? `+${formatAmount(netBalance, selectedCurrency)}` : formatAmount(netBalance, selectedCurrency)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {netBalance >= 0 ? 'В вашу пользу' : 'Отрицательное сальдо'}
                </div>
              </div>
            </div>

            {/* Debts Table */}
            <div className="space-y-1.5 pt-2">
              <div className="text-xs font-bold text-slate-800">
                Список задолженностей ({currencyDebts.length}):
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                    <tr>
                      <th className="p-2">Тип</th>
                      <th className="p-2">Контакт</th>
                      <th className="p-2">Сумма</th>
                      <th className="p-2">Выплачено</th>
                      <th className="p-2">Остаток</th>
                      <th className="p-2">Срок</th>
                      <th className="p-2 text-right">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {currencyDebts.map((d) => {
                      const rem = calculateRemaining(d);
                      const repaid = d.amount - rem;
                      return (
                        <tr key={d.id} className={d.isSettled ? 'bg-slate-50/50 opacity-70' : ''}>
                          <td className="p-2 font-semibold">
                            <span className={d.type === 'i_lent' ? 'text-emerald-600' : 'text-amber-600'}>
                              {d.type === 'i_lent' ? 'Мне должны' : 'Я должен'}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="font-bold text-slate-900">{d.name}</div>
                            {d.phone && <div className="text-[10px] text-slate-400">{formatPhone(d.phone)}</div>}
                          </td>
                          <td className="p-2 tabular-nums font-semibold">
                            {formatAmount(d.amount, d.currency)}
                          </td>
                          <td className="p-2 tabular-nums text-emerald-600">
                            {formatAmount(repaid, d.currency)}
                          </td>
                          <td className="p-2 tabular-nums font-extrabold text-slate-900">
                            {d.isSettled ? '0' : formatAmount(rem, d.currency)}
                          </td>
                          <td className="p-2 text-slate-500 whitespace-nowrap">
                            {formatDateShort(d.dueDate)}
                          </td>
                          <td className="p-2 text-right whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              d.isSettled 
                                ? 'bg-slate-100 text-slate-600' 
                                : rem <= 0 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-sky-50 text-sky-700'
                            }`}>
                              {d.isSettled ? 'Закрыт' : 'Активен'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Document Signature & Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                <div>Сформировано автоматически в приложении «Долги и Чеки»</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Всего позиций в реестре: {currencyDebts.length}</div>
              </div>
              <div className="border border-slate-300 rounded px-3 py-1.5 text-[11px] text-slate-600 font-medium bg-slate-50">
                Электронная ведомость подтверждена
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
