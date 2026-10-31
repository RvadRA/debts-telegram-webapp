import React from 'react';
import { Home, Users, PieChart, Settings, Plus } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export type NavTab = 'debts' | 'contacts' | 'analytics' | 'more';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenNewDebt: () => void;
  unreadCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onOpenNewDebt,
  unreadCount = 0,
}) => {
  const handleNav = (tab: NavTab) => {
    triggerHaptic('selection');
    onTabChange(tab);
  };

  const handleCenterAdd = () => {
    triggerHaptic('impact');
    onOpenNewDebt();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-1.5 shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto px-6 flex items-center justify-between relative">
        {/* Tab 1: Долги */}
        <button
          type="button"
          onClick={() => handleNav('debts')}
          className={`flex flex-col items-center justify-center gap-1 transition ${
            activeTab === 'debts'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div
            className={`w-10 h-7 flex items-center justify-center rounded-full transition-all ${
              activeTab === 'debts' ? 'bg-blue-50 dark:bg-blue-950/60' : ''
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-semibold leading-none">Долги</span>
        </button>

        {/* Tab 2: Контакты */}
        <button
          type="button"
          onClick={() => handleNav('contacts')}
          className={`flex flex-col items-center justify-center gap-1 transition ${
            activeTab === 'contacts'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div
            className={`w-10 h-7 flex items-center justify-center rounded-full transition-all ${
              activeTab === 'contacts' ? 'bg-blue-50 dark:bg-blue-950/60' : ''
            }`}
          >
            <Users className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[11px] font-semibold leading-none">Контакты</span>
        </button>

        {/* Center Elevated Floating Plus Button */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            type="button"
            onClick={handleCenterAdd}
            className="w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 ring-4 ring-white dark:ring-slate-900 transition"
            aria-label="Добавить новый долг"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 3: Аналитика */}
        <button
          type="button"
          onClick={() => handleNav('analytics')}
          className={`flex flex-col items-center justify-center gap-1 transition ${
            activeTab === 'analytics'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div
            className={`w-10 h-7 flex items-center justify-center rounded-full transition-all ${
              activeTab === 'analytics' ? 'bg-blue-50 dark:bg-blue-950/60' : ''
            }`}
          >
            <PieChart className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[11px] font-semibold leading-none">Аналитика</span>
        </button>

        {/* Tab 4: Еще */}
        <button
          type="button"
          onClick={() => handleNav('more')}
          className={`relative flex flex-col items-center justify-center gap-1 transition ${
            activeTab === 'more'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div
            className={`w-10 h-7 flex items-center justify-center rounded-full transition-all ${
              activeTab === 'more' ? 'bg-blue-50 dark:bg-blue-950/60' : ''
            }`}
          >
            <Settings className="w-5 h-5 stroke-[2]" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </div>
          <span className="text-[11px] font-semibold leading-none">Еще</span>
        </button>
      </div>
    </nav>
  );
};
