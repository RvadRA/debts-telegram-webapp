import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ArrowDownUp, Download, ChevronRight } from 'lucide-react';
import { 
  Currency, 
  Debt, 
  DebtFilterTab, 
  DebtSortOption, 
  BotConfig,
  ShopOwner,
} from './types/debt';
import { 
  loadDebts, 
  saveDebts, 
  loadBotConfig, 
  saveBotConfig 
} from './utils/storage';
import { 
  getTelegramUser, 
  initTelegramApp, 
  triggerHaptic, 
} from './utils/telegram';
import { calculateRemaining, getDebtStatus } from './utils/formatters';

// Components
import { TopBar } from './components/TopBar';
import { BalanceStats } from './components/BalanceStats';
import { DebtFilterBar } from './components/DebtFilterBar';
import { DebtCard } from './components/DebtCard';
import { DebtFormModal } from './components/DebtFormModal';
import { DebtDetailModal } from './components/DebtDetailModal';
import { RepaymentModal } from './components/RepaymentModal';
import { ReminderModal } from './components/ReminderModal';
import { IOUReceiptModal } from './components/IOUReceiptModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { BotSettingsModal } from './components/BotSettingsModal';
import { ReportScheduleModal } from './components/ReportScheduleModal';
import { GeneralReportPdfModal } from './components/GeneralReportPdfModal';
import { AccessControlModal } from './components/AccessControlModal';
import { AccessRestrictedScreen } from './components/AccessRestrictedScreen';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { ContactsModal } from './components/ContactsModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { MoreMenuModal } from './components/MoreMenuModal';
import { SecurityFAQModal } from './components/SecurityFAQModal';
import { GitHubUploadModal } from './components/GitHubUploadModal';

export default function App() {
  const [debts, setDebts] = useState<Debt[]>(() => loadDebts());
  const [botConfig, setBotConfig] = useState<BotConfig>(() => loadBotConfig());
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('RUB');
  const [currentTab, setCurrentTab] = useState<DebtFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<DebtSortOption>('dueDateAsc');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('debts');
  
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.Telegram?.WebApp?.colorScheme === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [detailDebt, setDetailDebt] = useState<Debt | null>(null);
  const [repayingDebt, setRepayingDebt] = useState<Debt | null>(null);
  const [reminderDebt, setReminderDebt] = useState<Debt | null>(null);
  const [iouDebt, setIouDebt] = useState<Debt | null>(null);
  const [receiptLightbox, setReceiptLightbox] = useState<{ url: string; caption?: string } | null>(null);
  const [isBotSettingsOpen, setIsBotSettingsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isGeneralPdfOpen, setIsGeneralPdfOpen] = useState(false);
  const [isAccessControlOpen, setIsAccessControlOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSecurityFAQOpen, setIsSecurityFAQOpen] = useState(false);
  const [isGitHubOpen, setIsGitHubOpen] = useState(false);

  // Shop Owner Access Verification
  const [owners, setOwners] = useState<ShopOwner[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);

  const telegramUser = useMemo(() => getTelegramUser(), []);

  const fetchOwners = async () => {
    setIsCheckingAccess(true);
    try {
      const uid = telegramUser.id ? String(telegramUser.id) : '';
      const url = uid ? `/api/owners?userId=${encodeURIComponent(uid)}` : '/api/owners';
      const res = await fetch(url, {
        headers: uid ? { 'x-telegram-user-id': uid } : {},
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.owners)) {
        setOwners(data.owners);
        // If there are registered owners and user is inside Telegram:
        if (data.owners.length > 0 && uid) {
          setIsOwner(Boolean(data.isOwner));
        } else {
          setIsOwner(true);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch owners:', e);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  // Initialize Telegram WebApp on mount and sync debts to server database
  useEffect(() => {
    initTelegramApp((darkScheme) => {
      setIsDark(darkScheme);
    });

    fetchOwners();

    // Sync current debts to server JSON database for automatic report generator
    const currentLocalDebts = loadDebts();
    const uid = telegramUser.id ? String(telegramUser.id) : '';
    fetch('/api/debts/sync', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(uid ? { 'x-telegram-user-id': uid } : {})
      },
      body: JSON.stringify({ debts: currentLocalDebts, userId: uid }),
    }).catch(() => {});
  }, []);

  // Sync dark class on html root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Save debts to local storage & server
  const handleUpdateDebts = (newDebts: Debt[]) => {
    setDebts(newDebts);
    saveDebts(newDebts);
    const uid = telegramUser.id ? String(telegramUser.id) : '';
    fetch('/api/debts/sync', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(uid ? { 'x-telegram-user-id': uid } : {})
      },
      body: JSON.stringify({ debts: newDebts, userId: uid }),
    }).catch(() => {});
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Add / Edit Debt
  const handleSaveDebt = (debtData: Omit<Debt, 'id' | 'repayments' | 'isSettled' | 'createdAt' | 'updatedAt'>) => {
    if (editingDebt) {
      const updated: Debt[] = debts.map((d) =>
        d.id === editingDebt.id
          ? {
              ...d,
              ...debtData,
              updatedAt: new Date().toISOString(),
            }
          : d
      );
      handleUpdateDebts(updated);
      if (detailDebt?.id === editingDebt.id) {
        setDetailDebt(updated.find((d) => d.id === editingDebt.id) || null);
      }
      setEditingDebt(null);
    } else {
      const newDebt: Debt = {
        ...debtData,
        id: `debt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        repayments: [],
        isSettled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      handleUpdateDebts([newDebt, ...debts]);
    }
  };

  // Delete Debt
  const handleDeleteDebt = (debtId: string) => {
    const updated = debts.filter((d) => d.id !== debtId);
    handleUpdateDebts(updated);
    if (detailDebt?.id === debtId) setDetailDebt(null);
  };

  // Toggle Settle
  const handleToggleSettle = (debt: Debt) => {
    const willSettle = !debt.isSettled;
    const updated = debts.map((d) => {
      if (d.id === debt.id) {
        return {
          ...d,
          isSettled: willSettle,
          settledDate: willSettle ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });
    handleUpdateDebts(updated);
    if (detailDebt?.id === debt.id) {
      setDetailDebt(updated.find((d) => d.id === debt.id) || null);
    }
  };

  // Add Partial Repayment
  const handleAddRepayment = (debtId: string, amount: number, note?: string, date?: string) => {
    const updated = debts.map((d) => {
      if (d.id === debtId) {
        const newRepayment = {
          id: `rep-${Date.now()}`,
          amount,
          date: date || new Date().toISOString().split('T')[0],
          note,
          createdAt: new Date().toISOString(),
        };
        const allRepayments = [...d.repayments, newRepayment];
        const totalRepaid = allRepayments.reduce((sum, r) => sum + r.amount, 0);
        const autoSettled = totalRepaid >= d.amount;

        return {
          ...d,
          repayments: allRepayments,
          isSettled: autoSettled,
          settledDate: autoSettled ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    handleUpdateDebts(updated);
    if (detailDebt?.id === debtId) {
      setDetailDebt(updated.find((d) => d.id === debtId) || null);
    }
  };

  // Open Receipt in full Lightbox
  const handleOpenReceipt = (photoUrl: string, caption?: string) => {
    setReceiptLightbox({ url: photoUrl, caption });
  };

  // Save Bot Config
  const handleSaveBotConfig = (newConfig: BotConfig) => {
    setBotConfig(newConfig);
    saveBotConfig(newConfig);
  };

  // Counts for tabs
  const counts = useMemo(() => {
    const c = {
      all: debts.length,
      i_lent: debts.filter((d) => d.type === 'i_lent' && !d.isSettled).length,
      i_borrowed: debts.filter((d) => d.type === 'i_borrowed' && !d.isSettled).length,
      recurring: debts.filter((d) => d.isRecurring && !d.isSettled).length,
      urgent: debts.filter((d) => getDebtStatus(d) === 'urgent').length,
      overdue: debts.filter((d) => getDebtStatus(d) === 'overdue').length,
      settled: debts.filter((d) => d.isSettled).length,
    };
    return c;
  }, [debts]);

  // Filtered & Sorted Debts
  const filteredDebts = useMemo(() => {
    return debts
      .filter((debt) => {
        // Tab filter
        if (currentTab === 'i_lent') {
          if (debt.type !== 'i_lent' || debt.isSettled) return false;
        } else if (currentTab === 'i_borrowed') {
          if (debt.type !== 'i_borrowed' || debt.isSettled) return false;
        } else if (currentTab === 'recurring') {
          if (!debt.isRecurring || debt.isSettled) return false;
        } else if (currentTab === 'urgent') {
          if (getDebtStatus(debt) !== 'urgent') return false;
        } else if (currentTab === 'overdue') {
          if (getDebtStatus(debt) !== 'overdue') return false;
        } else if (currentTab === 'settled') {
          if (!debt.isSettled) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = debt.name.toLowerCase().includes(q);
          const matchPhone = debt.phone.replace(/[^\d+]/g, '').includes(q);
          const matchNotes = (debt.notes || '').toLowerCase().includes(q);
          const matchReceipt = (debt.receiptCaption || '').toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchNotes && !matchReceipt) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDateAsc') {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'dueDateDesc') {
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        if (sortBy === 'amountDesc') {
          return calculateRemaining(b) - calculateRemaining(a);
        }
        if (sortBy === 'amountAsc') {
          return calculateRemaining(a) - calculateRemaining(b);
        }
        if (sortBy === 'createdAtDesc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [debts, currentTab, searchQuery, sortBy]);

  // Export JSON backup
  const handleExportBackup = () => {
    triggerHaptic('success');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(debts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `debts_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Bottom Nav Tab Clicks
  const handleBottomTabChange = (tab: NavTab) => {
    setActiveNavTab(tab);
    if (tab === 'debts') {
      // Return to main view
    } else if (tab === 'contacts') {
      setIsContactsOpen(true);
    } else if (tab === 'analytics') {
      setIsAnalyticsOpen(true);
    } else if (tab === 'more') {
      setIsMoreMenuOpen(true);
    }
  };

  // Unauthorized Stranger Screen: Strictly block access to debt database
  if (!isOwner && owners.length > 0) {
    return (
      <AccessRestrictedScreen
        telegramUser={telegramUser}
        onRetry={fetchOwners}
        isRetrying={isCheckingAccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-24">
      {/* Top Header matching screenshot */}
      <TopBar
        user={telegramUser}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onOpenNewDebt={() => {
          setEditingDebt(null);
          setIsFormOpen(true);
        }}
        onOpenBotSettings={() => setIsBotSettingsOpen(true)}
        onOpenReports={() => setIsReportsOpen(true)}
        onOpenAccessControl={() => setIsAccessControlOpen(true)}
        ownersCount={owners.length}
        totalActiveCount={counts.i_lent + counts.i_borrowed}
        hasAlerts={counts.overdue > 0 || counts.urgent > 0}
        onToggleSearch={() => setIsSearchVisible((prev) => !prev)}
        isSearchVisible={isSearchVisible || Boolean(searchQuery)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto space-y-3.5 pb-6">
        {/* KPI Balance Cards (Hero Gradient + Split Cards + Alert Pills) */}
        <BalanceStats
          debts={debts}
          selectedCurrency={selectedCurrency}
          onSelectFilterQuick={(tab) => {
            setCurrentTab(tab);
          }}
          onOpenGeneralPdf={() => setIsGeneralPdfOpen(true)}
        />

        {/* Search & Filter Bar (Shown if search button toggled or search query exists) */}
        {(isSearchVisible || searchQuery) && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <DebtFilterBar
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCurrency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
              sortBy={sortBy}
              onSortChange={setSortBy}
              counts={counts}
            />
          </div>
        )}

        {/* Debts List Section matching screenshot */}
        <div className="px-4 pt-1">
          {/* Section Header: "Последние" with "Все ›" link */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {currentTab === 'all'
                  ? 'Последние'
                  : currentTab === 'i_lent'
                  ? 'Мне должны'
                  : currentTab === 'i_borrowed'
                  ? 'Я должен'
                  : currentTab === 'overdue'
                  ? 'Просроченные'
                  : currentTab === 'urgent'
                  ? 'Скоро возврат'
                  : 'Записи'}
              </h2>
              {currentTab !== 'all' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {filteredDebts.length}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setCurrentTab('all');
                setIsSearchVisible((prev) => !prev);
              }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-0.5 transition"
            >
              <span>Все</span>
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Cards List */}
          {filteredDebts.length > 0 ? (
            <div className="space-y-3">
              {filteredDebts.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  onSelect={(d) => setDetailDebt(d)}
                  onOpenRepay={(d) => setRepayingDebt(d)}
                  onOpenReceipt={handleOpenReceipt}
                  onOpenReminder={(d) => setReminderDebt(d)}
                  onOpenIOU={(d) => setIouDebt(d)}
                  onToggleSettle={handleToggleSettle}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 text-center rounded-[26px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-500 mx-auto flex items-center justify-center">
                <ArrowDownUp className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Записей не найдено
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {searchQuery
                  ? `По запросу «${searchQuery}» ничего не найдено.`
                  : 'Добавьте первую запись долга нажатием на круглую синюю кнопку +'}
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('impact');
                    setEditingDebt(null);
                    setIsFormOpen(true);
                  }}
                  className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Добавить запись</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Curved Bottom Navigation Bar matching screenshot */}
      <BottomNavBar
        activeTab={activeNavTab}
        onTabChange={handleBottomTabChange}
        onOpenNewDebt={() => {
          setEditingDebt(null);
          setIsFormOpen(true);
        }}
        unreadCount={counts.overdue + counts.urgent}
      />

      {/* Modals & Dialogs */}
      <DebtFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDebt(null);
        }}
        onSave={handleSaveDebt}
        initialData={editingDebt}
        defaultCurrency={selectedCurrency}
      />

      <DebtDetailModal
        isOpen={Boolean(detailDebt)}
        debt={detailDebt}
        onClose={() => setDetailDebt(null)}
        onEdit={(debt) => {
          setDetailDebt(null);
          setEditingDebt(debt);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteDebt}
        onToggleSettle={handleToggleSettle}
        onOpenRepay={(debt) => setRepayingDebt(debt)}
        onOpenReceipt={handleOpenReceipt}
        onOpenReminder={(debt) => setReminderDebt(debt)}
        onOpenIOU={(debt) => setIouDebt(debt)}
      />

      <RepaymentModal
        isOpen={Boolean(repayingDebt)}
        debt={repayingDebt}
        onClose={() => setRepayingDebt(null)}
        onAddRepayment={handleAddRepayment}
      />

      <ReminderModal
        isOpen={Boolean(reminderDebt)}
        debt={reminderDebt}
        onClose={() => setReminderDebt(null)}
        botConfig={botConfig}
      />

      <IOUReceiptModal
        isOpen={Boolean(iouDebt)}
        debt={iouDebt}
        onClose={() => setIouDebt(null)}
        onOpenReceipt={handleOpenReceipt}
      />

      <ReceiptViewerModal
        isOpen={Boolean(receiptLightbox)}
        photoUrl={receiptLightbox?.url || null}
        caption={receiptLightbox?.caption}
        onClose={() => setReceiptLightbox(null)}
      />

      <BotSettingsModal
        isOpen={isBotSettingsOpen}
        config={botConfig}
        onSaveConfig={handleSaveBotConfig}
        onClose={() => setIsBotSettingsOpen(false)}
      />

      <ReportScheduleModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        defaultChatId={telegramUser.id ? String(telegramUser.id) : botConfig.chatId}
        onOpenGeneralPdf={() => setIsGeneralPdfOpen(true)}
      />

      <GeneralReportPdfModal
        isOpen={isGeneralPdfOpen}
        onClose={() => setIsGeneralPdfOpen(false)}
        debts={debts}
        selectedCurrency={selectedCurrency}
      />

      <AccessControlModal
        isOpen={isAccessControlOpen}
        onClose={() => setIsAccessControlOpen(false)}
        owners={owners}
        currentUserId={telegramUser.id ? String(telegramUser.id) : ''}
        telegramUser={telegramUser}
        onRefreshOwners={fetchOwners}
      />

      <ContactsModal
        isOpen={isContactsOpen}
        onClose={() => {
          setIsContactsOpen(false);
          setActiveNavTab('debts');
        }}
        debts={debts}
        selectedCurrency={selectedCurrency}
        onSelectDebt={(d) => setDetailDebt(d)}
        onOpenReminder={(d) => setReminderDebt(d)}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => {
          setIsAnalyticsOpen(false);
          setActiveNavTab('debts');
        }}
        debts={debts}
        selectedCurrency={selectedCurrency}
        onOpenGeneralPdf={() => setIsGeneralPdfOpen(true)}
      />

      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => {
          setIsMoreMenuOpen(false);
          setActiveNavTab('debts');
        }}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onOpenAccessControl={() => setIsAccessControlOpen(true)}
        onOpenBotSettings={() => setIsBotSettingsOpen(true)}
        onOpenReports={() => setIsReportsOpen(true)}
        onExportBackup={handleExportBackup}
        onOpenSecurityFAQ={() => setIsSecurityFAQOpen(true)}
        onOpenGitHubUpload={() => setIsGitHubOpen(true)}
        ownersCount={owners.length}
      />

      <SecurityFAQModal
        isOpen={isSecurityFAQOpen}
        onClose={() => setIsSecurityFAQOpen(false)}
      />

      <GitHubUploadModal
        isOpen={isGitHubOpen}
        onClose={() => setIsGitHubOpen(false)}
      />
    </div>
  );
}
