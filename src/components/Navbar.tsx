import React, { useRef } from 'react';
import { NavTab } from '../types';
import { rE } from '../i18n';
import { Home, BookOpen, BarChart2, Sprout, Syringe, Utensils, Plus } from 'lucide-react';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: string;
  isDark: boolean;
  useClay: boolean;
  onOpenQuickLog?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  lang,
  isDark,
  useClay,
  onOpenQuickLog
}) => {
  const t = rE[lang as keyof typeof rE] || rE.es;
  const navRef = useRef<HTMLDivElement>(null);

  const tabs: { id: NavTab; label: string; icon: React.ReactNode; emoji: string }[] = [
    { id: 'inicio', label: t.inicio, icon: <Home className="w-6 h-6" />, emoji: '🏠' },
    { id: 'diario', label: t.diario, icon: <BookOpen className="w-6 h-6" />, emoji: '📖' },
    { id: 'stats', label: t.stats, icon: <BarChart2 className="w-6 h-6" />, emoji: '📊' },
    { id: 'crecimiento', label: t.crecimiento, icon: <Sprout className="w-6 h-6" />, emoji: '🌱' },
    { id: 'vacunas', label: t.vacunas, icon: <Syringe className="w-6 h-6" />, emoji: '💉' },
    { id: 'nutricion', label: t.nutricion, icon: <Utensils className="w-6 h-6" />, emoji: '🍽️' },
  ];

  const ef = (tabId: NavTab, e: React.MouseEvent<HTMLButtonElement>) => {
    onSelectTab(tabId);
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const navClass = isDark ? 'glass-nav-v7-dark text-slate-200' : 'glass-nav-v7 text-slate-700';

  return (
    <>
      {/* Bottom Glass Navigation Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-[520px]">
        <div 
          ref={navRef}
          className={`bottom-nav ${isDark ? 'dark' : 'light'} ${navClass} p-2 flex items-center justify-between gap-1 shadow-2xl overflow-x-auto bottom-nav-scroll no-scrollbar border`}
        >
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const activeClass = isActive
              ? 'bg-emerald-500/25 dark:bg-emerald-500/35 backdrop-blur-md border border-emerald-400/50 text-emerald-900 dark:text-emerald-100 font-bold shadow-lg scale-105 ring-2 ring-emerald-400/40'
              : isDark 
                ? 'hover:bg-slate-800/60 text-slate-300 opacity-80 hover:opacity-100' 
                : 'hover:bg-amber-100/60 text-slate-600 opacity-80 hover:opacity-100';

            return (
              <button
                id={`nav-tab-${tab.id}`}
                key={tab.id}
                onClick={(e) => ef(tab.id, e)}
                className={`flex flex-col items-center justify-center min-w-[62px] py-2 px-2.5 rounded-2xl transition-all duration-200 clay-press cursor-pointer shrink-0 ${activeClass}`}
              >
                <div className="flex items-center justify-center mb-1 text-lg">
                  {useClay ? <span className="text-xl">{tab.emoji}</span> : tab.icon}
                </div>
                <span className="text-[10px] tracking-tight leading-none whitespace-nowrap font-bold">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
