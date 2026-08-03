"use client";

import { useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import InteractiveBackground from '../components/InteractiveBackground';
import { INITIAL_USERS } from '../lib/constants';
import { getStoredUsers } from '../lib/storage';
import { fetchAllUsersFromFirestore } from '../lib/firestoreService';

export default function LoginPage({
  users,
  onLogin,
  loginError,
  setLoginError,
  darkMode,
  setDarkMode,
  addLog,
}) {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const targetUser = loginUsername.trim().toLowerCase();
    const passClean = loginPass.trim();

    if (!targetUser || !passClean) {
      setLoginError('Por favor ingresa usuario y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      // Gather users from ALL sources: props, localStorage, Firestore direct query, and defaults
      const storedUsers = typeof window !== 'undefined' ? getStoredUsers() : [];
      
      // CRITICAL: Query Firestore directly to get the latest users
      // This ensures users created in other browsers are found immediately
      let firestoreUsers = [];
      try {
        firestoreUsers = await fetchAllUsersFromFirestore();
      } catch (err) {
        console.warn('Could not fetch users from Firestore for login, using cached data:', err);
      }
      
      // Merge all sources — Firestore data wins on conflicts (most up-to-date)
      const userMap = new Map();
      (INITIAL_USERS || []).forEach((u) => { if (u && u.id) userMap.set(String(u.id), u); });
      (storedUsers || []).forEach((u) => { if (u && u.id) userMap.set(String(u.id), u); });
      (users || []).forEach((u) => { if (u && u.id) userMap.set(String(u.id), u); });
      (firestoreUsers || []).forEach((u) => { if (u && u.id) userMap.set(String(u.id), u); });

      const availableUsers = Array.from(userMap.values());

      let found = availableUsers.find((u) => {
        const uUser = (u.username || '').trim().toLowerCase();
        const uEmail = (u.email || '').trim().toLowerCase();
        const uName = (u.name || '').trim().toLowerCase();
        const uSalaCod = (u.salaCodigo || '').trim().toLowerCase();
        const uPass = String(u.password || '').trim();

        const matchesIdentifier =
          (uUser && uUser === targetUser) ||
          (uEmail && uEmail === targetUser) ||
          (uName && uName === targetUser) ||
          (uSalaCod && uSalaCod === targetUser);

        const matchesPass = uPass === passClean;

        return matchesIdentifier && matchesPass;
      });

      // Guaranteed fallback for admin / admin123
      if (!found && (targetUser === 'admin' || targetUser === 'administrador') && passClean === 'admin123') {
        found = availableUsers.find((u) => u.role === 'Administrador') || INITIAL_USERS[0];
      }

      if (!found) {
        addLog(loginUsername, 'Intento Fallido', 'Credenciales no válidas', 'warning');
        setLoginError('Usuario o contraseña incorrectos.');
        return;
      }

      if (found.status === 'Inactivo') {
        addLog(loginUsername, 'Acceso Denegado', 'Cuenta deshabilitada', 'error');
        setLoginError('Esta cuenta ha sido deshabilitada por el Administrador.');
        return;
      }

      onLogin(found);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 relative font-sans bg-radar-grid overflow-hidden">
      {/* ANIMATED INTERACTIVE RADAR BACKGROUND */}
      <InteractiveBackground darkMode={darkMode} />

      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center cursor-pointer"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <div className="text-center mb-8 space-y-3">
          <BrandLogo className="w-24 h-24 mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-widest uppercase">
            SALA SITUACIONAL
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600 dark:text-red-400">
            Consola Ejecutiva
          </p>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-8 sm:p-10 rounded-[2rem]">
          <div className="text-center mb-8 border-b pb-6 dark:border-slate-800">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              SALA <span className="text-red-600">SITUACIONAL</span>
            </h2>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
              Consola de Control — Inicio de Sesión
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-semibold text-center">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                👤
              </span>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Nombre de usuario"
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3.5 rounded-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:border-red-600 dark:text-white font-medium disabled:opacity-60"
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                🔒
              </span>
              <input
                type={showLoginPass ? 'text' : 'password'}
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="Contraseña"
                disabled={isLoading}
                className="w-full pl-11 pr-11 py-3.5 rounded-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:border-red-600 dark:text-white font-medium disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowLoginPass(!showLoginPass)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 cursor-pointer"
              >
                {showLoginPass ? '🙈' : '👁️'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-full text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-red-800 hover:opacity-95 shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  VERIFICANDO...
                </>
              ) : (
                'INICIAR SESIÓN'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          © 2026 SALA SITUACIONAL • SISTEMA EJECUTIVO
        </p>
      </div>
    </div>
  );
}
