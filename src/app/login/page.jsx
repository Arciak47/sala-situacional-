"use client";

import { useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import InteractiveBackground from '../components/InteractiveBackground';

export default function LoginPage({
  users,
  onLogin,
  loginError,
  setLoginError,
  darkMode,
  setDarkMode,
  addLog,
}) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    const found = users.find(
      (u) =>
        u.email.toLowerCase() === loginEmail.toLowerCase().trim() &&
        u.password === loginPass
    );

    if (!found) {
      addLog(loginEmail, 'Intento Fallido', 'Credenciales no válidas', 'warning');
      setLoginError('Usuario o contraseña incorrectos.');
      return;
    }

    if (found.status === 'Inactivo') {
      addLog(loginEmail, 'Acceso Denegado', 'Cuenta deshabilitada', 'error');
      setLoginError('Esta cuenta ha sido deshabilitada.');
      return;
    }

    onLogin(found);
  };

  const handleQuickFill = (email, pass) => {
    setLoginEmail(email);
    setLoginPass(pass);
    setLoginError('');
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
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full pl-11 pr-4 py-3.5 rounded-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:border-red-600 dark:text-white"
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
                className="w-full pl-11 pr-11 py-3.5 rounded-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:border-red-600 dark:text-white"
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
              className="w-full py-4 px-6 rounded-full text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-red-800 hover:opacity-95 shadow-lg shadow-red-600/30 cursor-pointer"
            >
              INICIAR SESIÓN
            </button>
          </form>

          <div className="mt-8 pt-6 border-t dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Credenciales rápidas
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@monitoreo.com', 'admin123')}
                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-red-600 border dark:border-slate-800 cursor-pointer"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickFill('analista@monitoreo.com', 'analista123')
                }
                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-blue-600 border dark:border-slate-800 cursor-pointer"
              >
                📊 Analista
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickFill('supervisor@monitoreo.com', 'supervisor123')
                }
                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-emerald-600 border dark:border-slate-800 cursor-pointer"
              >
                🔍 Supervisor
              </button>
            </div>
          </div>
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
