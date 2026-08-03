"use client";

import { ROLE_BADGES } from '../lib/constants';
import BrandLogo from './BrandLogo';

export default function Navbar({
  currentUser,
  activeTab,
  setActiveTab,
  tabs,
  pendingCount,
  darkMode,
  setDarkMode,
  onLogout,
}) {
  const role = currentUser?.role || 'Analista';
  const badge = ROLE_BADGES[role] || ROLE_BADGES.Analista;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* LOGO AND BRAND */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <BrandLogo className="w-9 h-9 flex-shrink-0" />
          <div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              SALA SITUACIONAL
            </span>
            <span
              className={`text-[10px] font-bold block -mt-0.5 uppercase tracking-widest ${badge.color} px-2 py-0.5 rounded-full w-fit`}
            >
              {badge.icon} {role}
            </span>
          </div>
        </div>

        {/* TABS */}
        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200/50 dark:border-slate-700 overflow-x-auto no-scrollbar flex-shrink min-w-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all relative cursor-pointer whitespace-nowrap flex-shrink-0 ${
                activeTab === t.id
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
              {t.id === 'inbox' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* USER PROFILE & ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs cursor-pointer"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <div className="text-right text-xs hidden sm:block">
            <div className="font-bold text-slate-900 dark:text-white">
              {currentUser.name}
            </div>
            <div className={`font-bold text-[10px] ${badge.color.split(' ')[0]}`}>
              {role}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border dark:border-slate-800 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Salir 🚪
          </button>
        </div>
      </div>
    </header>
  );
}
