"use client";

import { useState } from 'react';
import { ROLE_BADGES } from '../lib/constants';
import BrandLogo from './BrandLogo';

export default function Sidebar({
  currentUser,
  activeTab,
  setActiveTab,
  tabs,
  pendingCount,
  unreadMessagesCount = 0,
  darkMode,
  setDarkMode,
  onLogout,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = currentUser?.role || 'Analista';
  const badge = ROLE_BADGES[role] || ROLE_BADGES.Analista;

  // Split tabs: bottom bar shows first 4, overflow goes to drawer
  const bottomTabs = tabs.slice(0, 4);
  const overflowTabs = tabs.slice(4);
  const hasOverflow = overflowTabs.length > 0;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* ══════════════════════════════════════════════
          MOBILE TOP HEADER (mini bar, just brand + actions)
      ══════════════════════════════════════════════ */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="w-8 h-8 flex-shrink-0" />
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white block leading-tight">
              SALA SITUACIONAL
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${badge.color} px-1.5 rounded-full inline-block`}>
              {badge.icon} {role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base cursor-pointer active:scale-90 transition-transform"
            aria-label="Alternar Modo Oscuro"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Overflow menu button — only shown if there are >4 tabs */}
          {hasOverflow && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-lg cursor-pointer active:scale-90 transition-transform"
              aria-label="Más opciones"
            >
              {mobileOpen ? '✕' : '⋯'}
            </button>
          )}

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center text-base cursor-pointer active:scale-90 transition-transform"
            aria-label="Cerrar Sesión"
          >
            🚪
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MOBILE OVERFLOW DRAWER (for extra tabs)
      ══════════════════════════════════════════════ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {hasOverflow && (
        <div className={`fixed bottom-[72px] left-0 right-0 z-50 md:hidden transition-all duration-300 ${mobileOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
          <div className="mx-3 mb-2 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 space-y-1.5">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2 pb-1">Más opciones</div>
            {overflowTabs.map((t) => {
              const isActive = activeTab === t.id;
              const icon = t.label.split(' ')[0];
              const text = t.label.split(' ').slice(1).join(' ');
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabClick(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="flex-1 text-left">{text}</span>
                  {t.id === 'inbox' && pendingCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-black rounded-full bg-red-500 text-white">{pendingCount}</span>
                  )}
                  {t.id === 'messaging' && unreadMessagesCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-black rounded-full bg-red-600 text-white animate-pulse">{unreadMessagesCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MOBILE BOTTOM TAB BAR (primary navigation)
      ══════════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe-bottom">
        <div className="flex items-stretch">
          {bottomTabs.map((t) => {
            const isActive = activeTab === t.id;
            const icon = t.label.split(' ')[0];
            const text = t.label.split(' ').slice(1).join(' ');
            const shortText = text.split(' ')[0]; // first word only for space
            const hasBadge = (t.id === 'inbox' && pendingCount > 0) || (t.id === 'messaging' && unreadMessagesCount > 0);
            const badgeCount = t.id === 'inbox' ? pendingCount : unreadMessagesCount;

            return (
              <button
                key={t.id}
                onClick={() => handleTabClick(t.id)}
                className={`flex-1 flex flex-col items-center justify-center py-3 px-1 min-h-[64px] relative transition-all active:scale-90 cursor-pointer ${
                  isActive
                    ? 'text-red-600 dark:text-red-500'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
                aria-label={text}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-red-600 rounded-full" />
                )}

                {/* Badge */}
                {hasBadge && (
                  <span className="absolute top-2 right-[20%] w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-black flex items-center justify-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}

                <span className={`text-2xl leading-none mb-1 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                  {icon}
                </span>
                <span className={`text-[10px] font-bold truncate max-w-full px-1 ${isActive ? 'font-extrabold' : ''}`}>
                  {shortText}
                </span>
              </button>
            );
          })}

          {/* "Más" button if there are overflow tabs */}
          {hasOverflow && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-1 min-h-[64px] transition-all active:scale-90 cursor-pointer ${
                mobileOpen ? 'text-red-600' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {mobileOpen && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-red-600 rounded-full" />}
              <span className="text-2xl leading-none mb-1">⋯</span>
              <span className="text-[10px] font-bold">Más</span>
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP SIDEBAR (hidden on mobile)
      ══════════════════════════════════════════════ */}
      <aside className="hidden md:flex md:sticky top-0 z-30 h-screen w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col justify-between shadow-none">
        {/* UPPER PORTION */}
        <div className="p-5 flex flex-col space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* BRAND LOGO */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <BrandLogo className="w-11 h-11 flex-shrink-0" />
            <div>
              <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white block leading-tight">
                SALA SITUACIONAL
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide block">
                Sistema de Reportes
              </span>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1.5 flex-1">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 pb-1">
              Menú Principal
            </div>

            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabClick(t.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/25 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3 truncate">
                    <span className="text-base flex-shrink-0">{t.label.split(' ')[0]}</span>
                    <span className="truncate">{t.label.split(' ').slice(1).join(' ')}</span>
                  </span>

                  {t.id === 'inbox' && pendingCount > 0 && (
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full flex-shrink-0 ${isActive ? 'bg-white text-red-600' : 'bg-red-500 text-white'}`}>
                      {pendingCount}
                    </span>
                  )}

                  {t.id === 'messaging' && unreadMessagesCount > 0 && (
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full flex-shrink-0 animate-pulse ${isActive ? 'bg-white text-red-600' : 'bg-red-600 text-white ring-2 ring-red-400/50'}`}>
                      🔴 {unreadMessagesCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM FOOTER CONTROLS */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-slate-900/70 flex-shrink-0">
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-bold">Tema:</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer text-[11px] shadow-xs"
            >
              {darkMode ? '☀️ Claro' : '🌙 Oscuro'}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-md flex-shrink-0">
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{currentUser?.name}</div>
              <div className={`text-[9px] font-bold uppercase tracking-wider ${badge.color} px-2 py-0.5 rounded-full w-fit mt-0.5`}>
                {badge.icon} {role}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-200/60 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700/60 text-xs font-bold transition-all cursor-pointer"
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

