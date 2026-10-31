import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { Currency, DebtFilterTab, DebtSortOption } from '../types/debt';
import { CURRENCIES } from '../utils/formatters';
import { triggerHaptic } from '../utils/telegram';

interface DebtFilterBarProps {
  currentTab: DebtFilterTab;
  onTabChange: (tab: DebtFilterTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCurrency: Currency;
  onCurrencyChange: (curr: Currency) => void;
  sortBy: DebtSortOption;
  onSortChange: (sort: DebtSortOption) => void;
  counts: Record<DebtFilterTab, number>;
}

export const DebtFilterBar: React.FC<DebtFilterBarProps> = ({
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedCurrency,
  onCurrencyChange,
  sortBy,
  onSortChange,
  counts,
}) => {
  const handleTabClick = (tab: DebtFilterTab) => {
    triggerHaptic('selection');
    onTabChange(tab);
  };

  const tabs: { key: DebtFilterTab; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'i_lent', label: 'Мне должны' },
    { key: 'i_borrowed', label: 'Я должен' },
    { key: 'recurring', label: 'Регулярные' },
    { key: 'urgent', label: 'Срочные' },
    { key: 'overdue', label: 'Просрочено' },
    { key: 'settled', label: 'Погашено' },
  ];

  return (
    <div className="px-4 py-2 space-y-2.5 max-w-4xl mx-auto">
      {/* Search Bar & Currency Selector */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по имени, номеру телефона, заметке..."
            className="w-full h-10 pl-9 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Currency Selector */}
        <select
          value={selectedCurrency}
          onChange={(e) => {
            triggerHaptic('selection');
            onCurrencyChange(e.target.value as Currency);
          }}
          className="h-10 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition shrink-0"
        >
          {Object.values(CURRENCIES).map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.symbol} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {/* Filter Tabs (Horizontal Scrollable on mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {tabs.map((tab) => {
          const count = counts[tab.key] || 0;
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Sort selector */}
        <div className="ml-auto pl-2 shrink-0 flex items-center">
          <label className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              triggerHaptic('selection');
              onSortChange(e.target.value as DebtSortOption);
            }}
            className="h-7 px-2 bg-transparent text-[11px] text-slate-600 dark:text-slate-400 focus:outline-none font-medium cursor-pointer"
          >
            <option value="dueDateAsc">Сначала ближайшие</option>
            <option value="dueDateDesc">Сначала дальние</option>
            <option value="amountDesc">По сумме ↓</option>
            <option value="amountAsc">По сумме ↑</option>
            <option value="createdAtDesc">Сначала новые</option>
          </select>
        </div>
      </div>
    </div>
  );
};
