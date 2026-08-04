"use client";

import { ROLE_BADGES } from '../lib/constants';

const TAB_TITLES = {
  dashboard: { title: 'Dashboard Principal', icon: '🏠', path: 'Inicio / Vista General' },
  forms: { title: 'Formulario de Reporte', icon: '📋', path: 'Operaciones / Registro' },
  inbox: { title: 'Bandeja de Formularios', icon: '📥', path: 'Supervisión / Envíos Pendientes' },
  shift: { title: 'Reporte Consolidado de Turno', icon: '📄', path: 'Supervisión / Turno Activo' },
  users: { title: 'Gestión de Usuarios y Roles', icon: '👥', path: 'Administración / Usuarios' },
  stats: { title: 'Estadísticas e Indicadores', icon: '📊', path: 'Análisis / Métricas Globales' },
  logs: { title: 'Historial de Auditoría', icon: '📜', path: 'Seguridad / Registros del Sistema' },
  messaging: { title: 'Chat Institucional', icon: '💬', path: 'Comunicación / Mensajería Directa' },
  profile: { title: 'Mi Perfil de Usuario', icon: '👤', path: 'Cuenta / Configuración Personal' },
  editor: { title: 'Editor de Plantilla Visual', icon: '🎨', path: 'Edición / Canvas de Infografía' },
};

export default function HeaderBar({
  currentUser,
  activeTab,
  unreadMessagesCount = 0,
  pendingCount = 0,
}) {
  const role = currentUser?.role || 'Analista';
  const badge = ROLE_BADGES[role] || ROLE_BADGES.Analista;
  const tabInfo = TAB_TITLES[activeTab] || {
    title: 'Sala Situacional',
    icon: '📊',
    path: 'Panel de Control',
  };

  const formattedDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg transition-all duration-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 sticky top-0 z-30 mb-4 sm:mb-6">
      {/* LEFT: TITLE & BREADCRUMB */}
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-md shadow-red-600/20 flex-shrink-0">
          {tabInfo.icon}
        </div>
        <div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {tabInfo.path}
            </span>
          </div>
          <h1 className="text-sm sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            {tabInfo.title}
          </h1>
        </div>
      </div>

      {/* RIGHT: SYSTEM & ROLE STATUS BADGES */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 self-start sm:self-center">
        {/* LIVE SYSTEM STATUS & SYNC BUTTON */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 text-[11px] font-bold text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="capitalize">{formattedDate}</span>
          <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 mx-1"></div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            title="Forzar sincronización con la base de datos"
          >
            <span>🔄</span> Sincronizar
          </button>
        </div>

        {/* PENDING NOTIFICATION BADGE */}
        {(role === 'Administrador' || role === 'Supervisor') && pendingCount > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold shadow-xs"
            title={`${pendingCount} formularios pendientes por revisar`}
          >
            <span>⏳</span>
            <span>{pendingCount} Pendientes</span>
          </div>
        )}

        {/* UNREAD MESSAGES NOTIFICATION */}
        {unreadMessagesCount > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-[11px] font-extrabold shadow-xs animate-bounce"
            title={`${unreadMessagesCount} mensajes no leídos`}
          >
            <span>💬</span>
            <span>{unreadMessagesCount} Nuevos</span>
          </div>
        )}

        {/* ROLE BADGE */}
        <div
          className={`flex items-center gap-1.5 ${badge.color} px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs border border-black/5 dark:border-white/10`}
        >
          <span>{badge.icon}</span>
          <span>{role}</span>
        </div>
      </div>
    </header>
  );
}
