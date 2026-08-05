"use client";

import { useState } from 'react';
import { MUNICIPIOS, AREAS } from '../lib/constants';
import {
  exportSubmissionsToExcel,
  exportStatsToExcel,
  exportStatsToPDF,
  exportElementToPNG,
} from '../lib/exportUtils';

export default function AdminDashboard({
  currentUser,
  allStats,
  submissions = [],
  users = [],
  auditLogs = [],
  messages = [],
}) {
  const [timeFilter, setTimeFilter] = useState('diario'); // 'diario', 'semanal', 'mensual', 'anual', 'todos'

  const isAnalyst = currentUser?.role === 'Analista';

  // Filter submissions strictly for current user if Analista
  const targetSubmissions = isAnalyst
    ? submissions.filter(
        (s) => s.analystId === currentUser?.id || s.analystEmail === currentUser?.email
      )
    : submissions;

  // Filter messages for current user
  const userMessages = messages.filter(
    (m) => m.emisorId === currentUser?.id || m.receptorId === currentUser?.id
  );

  // Helper to filter items by date range
  const isWithinTimeRange = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (timeFilter === 'diario') {
      return dateString.startsWith(todayStr);
    }

    if (timeFilter === 'semanal') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return date >= startOfWeek;
    }

    if (timeFilter === 'mensual') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= startOfMonth;
    }

    if (timeFilter === 'anual') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return date >= startOfYear;
    }

    return true; // 'todos'
  };

  // Filtered dataset
  const filteredSubmissions = targetSubmissions.filter((s) => isWithinTimeRange(s.timestamp));
  const filteredMessages = userMessages.filter((m) => isWithinTimeRange(m.fecha));

  const totalSubmissions = filteredSubmissions.length;
  const pendingCount = filteredSubmissions.filter((s) => s.status === 'pendiente').length;
  const reviewedCount = filteredSubmissions.filter((s) => ['revisado', 'reportar', 'repetido'].includes(s.status)).length;

  const pendingPct =
    totalSubmissions > 0 ? Math.round((pendingCount / totalSubmissions) * 100) : 0;
  const reviewedPct =
    totalSubmissions > 0 ? Math.round((reviewedCount / totalSubmissions) * 100) : 0;

  // Sentiment breakdown for filtered period
  const sentimentCounts = {
    NEGATIVO: 0,
    NEUTRO: 0,
    POSITIVO: 0,
  };

  filteredSubmissions.forEach((s) => {
    const sent = s.reportData?.sentimiento || 'NEUTRO';
    if (sentimentCounts[sent] !== undefined) {
      sentimentCounts[sent]++;
    } else {
      sentimentCounts.NEUTRO++;
    }
  });

  const negPct = totalSubmissions > 0 ? Math.round((sentimentCounts.NEGATIVO / totalSubmissions) * 100) : 0;
  const neuPct = totalSubmissions > 0 ? Math.round((sentimentCounts.NEUTRO / totalSubmissions) * 100) : 0;
  const posPct = totalSubmissions > 0 ? Math.round((sentimentCounts.POSITIVO / totalSubmissions) * 100) : 0;

  // Determine predominant sentiment
  let needleAngle = 0; // 0deg = neutral center, -65deg = negative left, +65deg = positive right
  let heaviestLabel = 'Tendencia Predominante: NEUTRO';
  let heaviestBadgeStyle = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800';
  let heaviestIcon = '🟡';
  let heaviestExplanation = isAnalyst
    ? `Tus reportes se encuentran con una distribución predominantemente neutra (${neuPct}% del período).`
    : `El volumen de reportes se encuentra con una distribución predominantemente neutra (${neuPct}% del total).`;

  if (sentimentCounts.NEGATIVO > sentimentCounts.NEUTRO && sentimentCounts.NEGATIVO > sentimentCounts.POSITIVO) {
    needleAngle = -65;
    heaviestLabel = 'Tendencia Predominante: NEGATIVO';
    heaviestBadgeStyle = 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 shadow-sm shadow-red-500/10';
    heaviestIcon = '🔴';
    heaviestExplanation = isAnalyst
      ? `Tus reportes se concentran con mayor tendencia NEGATIVA (${negPct}% de tus reportes).`
      : `El flujo de reportes se concentra con mayor tendencia NEGATIVA (${negPct}% del volumen).`;
  } else if (sentimentCounts.POSITIVO > sentimentCounts.NEUTRO && sentimentCounts.POSITIVO > sentimentCounts.NEGATIVO) {
    needleAngle = 65;
    heaviestLabel = 'Tendencia Predominante: POSITIVO';
    heaviestBadgeStyle = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 shadow-sm shadow-emerald-500/10';
    heaviestIcon = '🟢';
    heaviestExplanation = isAnalyst
      ? `Tus reportes se concentran con mayor tendencia POSITIVA (${posPct}% de tus reportes).`
      : `El flujo de reportes se concentra con mayor tendencia POSITIVA (${posPct}% del volumen).`;
  }

  // Social network breakdown for filtered period
  const socialCounts = {
    INSTAGRAM: 0,
    'TWITTER / X': 0,
    FACEBOOK: 0,
    TIKTOK: 0,
  };

  filteredSubmissions.forEach((s) => {
    const net = s.reportData?.redSocial || 'INSTAGRAM';
    if (socialCounts[net] !== undefined) {
      socialCounts[net]++;
    } else {
      socialCounts.INSTAGRAM++;
    }
  });

  const socialColors = {
    INSTAGRAM: 'from-purple-600 to-pink-500',
    'TWITTER / X': 'from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800',
    FACEBOOK: 'from-blue-600 to-blue-800',
    TIKTOK: 'from-slate-900 to-red-600 dark:from-slate-800 dark:to-red-500',
  };

  // Municipios breakdown for filtered period
  const municipioCounts = {};
  MUNICIPIOS.forEach((m) => {
    municipioCounts[m] = 0;
  });
  filteredSubmissions.forEach((s) => {
    const mun = (s.reportData?.municipio || '').toUpperCase();
    if (municipioCounts[mun] !== undefined) {
      municipioCounts[mun]++;
    }
  });

  const sortedMunicipios = Object.entries(municipioCounts)
    .map(([name, count]) => ({
      name,
      count,
      pct: totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Areas breakdown for filtered period
  const areaCounts = {};
  AREAS.forEach((a) => {
    areaCounts[a] = 0;
  });
  filteredSubmissions.forEach((s) => {
    const ar = (s.reportData?.area || '').toUpperCase();
    if (areaCounts[ar] !== undefined) {
      areaCounts[ar]++;
    }
  });

  const sortedAreas = Object.entries(areaCounts)
    .map(([name, count]) => ({
      name,
      count,
      pct: totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Analysts performance data for filtered period (for Admin / Supervisor view)
  const analystsList = users.filter((u) => u.role === 'Analista');
  const perAnalystFiltered = analystsList.map((a) => {
    const analystSubs = filteredSubmissions.filter(
      (s) => s.analystId === a.id || s.analystEmail === a.email
    );
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      total: analystSubs.length,
      pending: analystSubs.filter((s) => s.status === 'pendiente').length,
      reviewed: analystSubs.filter((s) => s.status === 'revisado').length,
    };
  });

  // Filter dynamic titles
  const filterTitles = {
    diario: { label: 'Diario (Hoy)', prefix: 'Hoy' },
    semanal: { label: 'Semanal (Esta Semana)', prefix: 'Esta Semana' },
    mensual: { label: 'Mensual (Este Mes)', prefix: 'Este Mes' },
    anual: { label: 'Anual (Este Año)', prefix: 'Este Año' },
    todos: { label: 'Histórico Total', prefix: 'Total' },
  };

  const currentFilterInfo = filterTitles[timeFilter];

  const canExport = currentUser?.role === 'Administrador' || currentUser?.role === 'Supervisor';

  return (
    <div className="space-y-6" id="admin-dashboard-container">
      {/* ── HEADER BANNER ── */}
      <div className="welcome-banner no-pdf bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest bg-red-600/80 px-3 py-1 rounded-full">
            {isAnalyst ? 'Panel Personal del Analista' : 'Panel de Control General'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2">
            ¡Bienvenido, {currentUser?.name}! 👋
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {isAnalyst
              ? 'Resumen exclusivo de tus reportes creados, rendimiento personal, distribución por red social y balanza de sentimientos.'
              : 'Resumen del flujo de datos, rendimiento de analistas y métricas del sistema.'}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          {isAnalyst ? (
            <>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
                <div className="text-xs text-slate-300 font-semibold">Mis Reportes</div>
                <div className="text-xl font-black text-white">{targetSubmissions.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
                <div className="text-xs text-slate-300 font-semibold">Mis Mensajes</div>
                <div className="text-xl font-black text-amber-400">{filteredMessages.length}</div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
                <div className="text-xs text-slate-300 font-semibold">Total Usuarios</div>
                <div className="text-xl font-black text-white">{users.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
                <div className="text-xs text-slate-300 font-semibold">Mensajes Chat</div>
                <div className="text-xl font-black text-amber-400">{filteredMessages.length}</div>
              </div>
            </>
          )}
        </div>

        {/* BACKGROUND GLOW DECORATION */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-red-600/20 rounded-full blur-3xl" />
      </div>

      {/* ── EXPORT ACTION BAR (ONLY FOR ADMIN & SUPERVISOR) ── */}
      {canExport && (
        <div className="export-action-bar no-pdf bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 border border-slate-700">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>💾</span> Exportar Base de Datos & Gráficos Diarios
            </h4>
            <p className="text-[10px] text-slate-300 font-bold">
              Descarga al final del día la base de datos completa en Excel (.xls) o exporta los gráficos estadísticos en PDF.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportSubmissionsToExcel(filteredSubmissions)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Descargar base de datos filtrada en formato Excel (.xls)"
            >
              <span>📊</span> Base de Datos (Excel)
            </button>
            <button
              onClick={() => exportStatsToExcel(allStats)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Descargar resumen de métricas en Excel"
            >
              <span>📈</span> Métricas (Excel)
            </button>
            <button
              onClick={() => exportStatsToPDF('Consola Ejecutiva - Sala Situacional', 'admin-dashboard-container')}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Exportar informe del dashboard en PDF"
            >
              <span>📄</span> Exportar PDF
            </button>
          </div>
        </div>
      )}

      {/* ── TIME FILTER SELECTOR ── */}
      <div className="no-pdf bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <span>⏳ Filtrar Estadísticas por Período:</span>
          <span className="text-red-600 dark:text-red-400 font-black uppercase text-[11px] bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-md">
            {currentFilterInfo.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
          {[
            { id: 'diario', label: '📅 Diario' },
            { id: 'semanal', label: '📆 Semanal' },
            { id: 'mensual', label: '🗓️ Mensual' },
            { id: 'anual', label: '📈 Anual' },
            { id: 'todos', label: '📋 Todos' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeFilter === f.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── HIGH-END SENTIMENT GAUGE & ARROW INDICATOR SECTION ── */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        <div className="border-b dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📊 Gráficos de Sentimiento y Opinión ({currentFilterInfo.prefix})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAnalyst
                ? 'Visualización interactiva de tus reportes y distribución de análisis'
                : 'Visualización interactiva de la tendencia de opinión pública y distribución de volumen'}
            </p>
          </div>

          <div className={`px-4 py-2 rounded-2xl border text-xs font-black flex items-center gap-2 transition-all ${heaviestBadgeStyle}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping flex-shrink-0" />
            <span>{heaviestIcon} {heaviestLabel}</span>
          </div>
        </div>

        {/* GAUGE DIAL + METRICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* HIGH-END SVG DIAL WITH SHADOWS & GRADIENTS (5 COLS) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50/80 dark:bg-slate-950/50 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-inner relative overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Gráfico de Sentimiento
            </span>

            {/* SVG GAUGE DIAL */}
            <div className="relative w-64 h-32 flex items-end justify-center">
              <svg viewBox="0 0 220 110" className="w-full h-full drop-shadow-md">
                <defs>
                  {/* GRADIENT RED */}
                  <linearGradient id="redGaugeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#991b1b" />
                  </linearGradient>
                  {/* GRADIENT AMBER */}
                  <linearGradient id="amberGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  {/* GRADIENT EMERALD */}
                  <linearGradient id="emeraldGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>

                {/* BACKGROUND SCALE TRACK */}
                <path
                  d="M 20 105 A 90 90 0 0 1 200 105"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="24"
                  strokeLinecap="round"
                  className="text-slate-200/80 dark:text-slate-800"
                />

                {/* ZONE 1: NEGATIVO ARC */}
                <path
                  d="M 22 105 A 88 88 0 0 1 70 30"
                  fill="none"
                  stroke="url(#redGaugeGrad)"
                  strokeWidth="20"
                  strokeLinecap="round"
                />

                {/* ZONE 2: NEUTRO ARC */}
                <path
                  d="M 74 27 A 88 88 0 0 1 146 27"
                  fill="none"
                  stroke="url(#amberGaugeGrad)"
                  strokeWidth="20"
                />

                {/* ZONE 3: POSITIVO ARC */}
                <path
                  d="M 150 30 A 88 88 0 0 1 198 105"
                  fill="none"
                  stroke="url(#emeraldGaugeGrad)"
                  strokeWidth="20"
                  strokeLinecap="round"
                />

                {/* INNER TICK MARKS */}
                <line x1="68" y1="42" x2="74" y2="48" stroke="currentColor" strokeWidth="2" className="text-slate-400" />
                <line x1="110" y1="22" x2="110" y2="30" stroke="currentColor" strokeWidth="2.5" className="text-slate-400" />
                <line x1="152" y1="42" x2="146" y2="48" stroke="currentColor" strokeWidth="2" className="text-slate-400" />
              </svg>

              {/* ROTATING METALLIC NEEDLE & ARROW */}
              <div
                className="absolute bottom-2 left-1/2 -ml-1.5 w-3 h-28 origin-bottom transition-transform duration-1000 ease-out flex flex-col items-center z-10"
                style={{ transform: `rotate(${needleAngle}deg)` }}
              >
                {/* Arrowhead Diamond */}
                <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[18px] border-b-red-600 dark:border-b-red-500 filter drop-shadow-md -mt-1" />

                {/* Metallic Shaft */}
                <div className="w-2 h-24 bg-gradient-to-b from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 rounded-t-sm shadow-xl" />

                {/* Center Pivot Jewel Ring */}
                <div className="absolute bottom-0 w-6 h-6 rounded-full bg-gradient-to-tr from-slate-900 to-red-600 border-2 border-white dark:border-slate-800 shadow-md flex items-center justify-center -mb-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              </div>
            </div>

            {/* GAUGE LABELS */}
            <div className="w-full flex justify-between px-2 text-[11px] font-black mt-3">
              <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                🔴 Negativo ({negPct}%)
              </span>
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                🟡 Neutro ({neuPct}%)
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                🟢 Positivo ({posPct}%)
              </span>
            </div>

            <div className="mt-3 text-center px-2 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 w-full shadow-xs">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {heaviestExplanation}
              </p>
            </div>
          </div>

          {/* 3 METRIC CARDS (7 COLS) */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* NEGATIVO */}
            <div className="bg-red-50/60 dark:bg-red-950/30 p-4 rounded-2xl border border-red-100 dark:border-red-900/40 space-y-3 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider block">
                  🔴 Negativo
                </span>
                <span className="text-red-700 dark:text-red-300 font-black text-2xl mt-1 block">
                  {sentimentCounts.NEGATIVO}
                </span>
              </div>
              <div>
                <div className="flex justify-between items-center text-[11px] font-bold text-red-600 dark:text-red-400 mb-1">
                  <span>Peso:</span>
                  <span>{negPct}%</span>
                </div>
                <div className="h-2.5 w-full bg-red-200/60 dark:bg-red-900/60 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-700 rounded-full transition-all duration-700 shadow-xs"
                    style={{ width: `${Math.max(negPct, 4)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* NEUTRO */}
            <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 space-y-3 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider block">
                  🟡 Neutro
                </span>
                <span className="text-amber-700 dark:text-amber-300 font-black text-2xl mt-1 block">
                  {sentimentCounts.NEUTRO}
                </span>
              </div>
              <div>
                <div className="flex justify-between items-center text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                  <span>Peso:</span>
                  <span>{neuPct}%</span>
                </div>
                <div className="h-2.5 w-full bg-amber-200/60 dark:bg-amber-900/60 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-700 shadow-xs"
                    style={{ width: `${Math.max(neuPct, 4)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* POSITIVO */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-3 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider block">
                  🟢 Positivo
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 font-black text-2xl mt-1 block">
                  {sentimentCounts.POSITIVO}
                </span>
              </div>
              <div>
                <div className="flex justify-between items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  <span>Peso:</span>
                  <span>{posPct}%</span>
                </div>
                <div className="h-2.5 w-full bg-emerald-200/60 dark:bg-emerald-900/60 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-700 shadow-xs"
                    style={{ width: `${Math.max(posPct, 4)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHARTS SECTION GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: DOUGHNUT / RING CHART FOR STATUS DISTRIBUTION */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="border-b dark:border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🍩 Estado ({currentFilterInfo.prefix})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Porcentaje</span>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* SVG Ring Chart */}
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.8"
                  className="text-slate-100 dark:text-slate-800"
                />
                {/* Reviewed Segment (Emerald) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.8"
                  strokeDasharray={`${reviewedPct}, 100`}
                  className="transition-all duration-1000"
                />
                {/* Pending Segment (Amber) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.8"
                  strokeDasharray={`${pendingPct}, 100`}
                  strokeDashoffset={`-${reviewedPct}`}
                  className="transition-all duration-1000"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {totalSubmissions}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Total
                </span>
              </div>
            </div>

            {/* LEGEND */}
            <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Revisados
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {reviewedCount} ({reviewedPct}%)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Pendientes
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {pendingCount} ({pendingPct}%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: SOCIAL MEDIA BREAKDOWN (PROGRESS BARS) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 lg:col-span-2">
          <div className="border-b dark:border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📱 Cobertura por Red Social ({currentFilterInfo.prefix})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Distribución</span>
          </div>

          <div className="space-y-4 pt-2">
            {Object.entries(socialCounts).map(([network, count]) => {
              const pct =
                totalSubmissions > 0
                  ? Math.round((count / totalSubmissions) * 100)
                  : 0;

              return (
                <div key={network} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {network}
                    </span>
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      {count} reportes ({pct}%)
                    </span>
                  </div>

                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${socialColors[network]} transition-all duration-700`}
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MUNICIPIOS & AREAS BREAKDOWN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MUNICIPIOS CARD */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="border-b dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>📍 Municipios Más Mencionados ({currentFilterInfo.prefix})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ranking de volumen de reportes por Municipio en el Estado Guárico
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {sortedMunicipios.filter((m) => m.count > 0).length} Con Reportes
            </span>
          </div>

          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {sortedMunicipios.map((m, idx) => (
              <div key={m.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="text-[10px] w-5 h-5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-black">
                      #{idx + 1}
                    </span>
                    {m.name}
                  </span>
                  <span className="text-slate-900 dark:text-white font-black">
                    {m.count} <span className="text-[10px] text-slate-400 font-semibold">({m.pct}%)</span>
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-800 rounded-full transition-all duration-700 shadow-xs"
                    style={{ width: `${Math.max(m.pct, m.count > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AREAS AFECTADAS CARD */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="border-b dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🏢 Distribución por Áreas Afectadas ({currentFilterInfo.prefix})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Desglose por área institucional (Salud, Educación, Servicios Públicos, etc.)
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              10 Áreas
            </span>
          </div>

          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {sortedAreas.map((a, idx) => (
              <div key={a.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="text-[10px] w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                      #{idx + 1}
                    </span>
                    {a.name}
                  </span>
                  <span className="text-slate-900 dark:text-white font-black">
                    {a.count} <span className="text-[10px] text-slate-400 font-semibold">({a.pct}%)</span>
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full transition-all duration-700 shadow-xs"
                    style={{ width: `${Math.max(a.pct, a.count > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: EITHER PERSONAL HISTORY FOR ANALYST OR COMPARATIVE BARS FOR ADMIN/SUPERVISOR ── */}
      {isAnalyst ? (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
          <div className="border-b dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋 Historial de Mis Reportes Enviados ({currentFilterInfo.prefix})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Listado personal de reportes cargados y su estado de revisión por el supervisor
              </p>
            </div>

            <span className="text-xs font-bold text-slate-400">
              {filteredSubmissions.length} Reportes
            </span>
          </div>

          {filteredSubmissions.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">
              No tienes reportes registrados en este período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Municipio</th>
                    <th className="py-2.5 px-3">Red Social</th>
                    <th className="py-2.5 px-3">Sentimiento</th>
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'pendiente'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {sub.status === 'pendiente' ? '⏳ PENDIENTE' : '✅ REVISADO'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {sub.reportData?.municipio || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {sub.reportData?.redSocial || 'INSTAGRAM'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold">
                          {sub.reportData?.sentimiento === 'NEGATIVO'
                            ? '🔴 Negativo'
                            : sub.reportData?.sentimiento === 'POSITIVO'
                            ? '🟢 Positivo'
                            : '🟡 Neutro'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-medium">
                        {new Date(sub.timestamp).toLocaleDateString('es-ES')}{' '}
                        {new Date(sub.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
          <div className="border-b dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>📊 Rendimiento Comparativo por Analista ({currentFilterInfo.prefix})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Filtro activo: <span className="font-bold text-red-600">{currentFilterInfo.label}</span>
              </p>
            </div>

            <span className="text-xs font-bold text-slate-400">
              {perAnalystFiltered.length} Analistas
            </span>
          </div>

          {perAnalystFiltered.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">
              No hay analistas registrados en el sistema.
            </p>
          ) : (
            <div className="space-y-5">
              {perAnalystFiltered.map((analyst) => {
                const maxVal = Math.max(...perAnalystFiltered.map((a) => a.total), 1);
                const barWidthPct = Math.round((analyst.total / maxVal) * 100);

                return (
                  <div key={analyst.id} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {analyst.name}{' '}
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({analyst.email})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-bold">
                        <span className="text-red-600 dark:text-red-400">
                          Total: {analyst.total}
                        </span>
                        <span className="text-amber-600 dark:text-amber-400">
                          Pendientes: {analyst.pending}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Revisados: {analyst.reviewed}
                        </span>
                      </div>
                    </div>

                    {/* VISUAL BAR */}
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-700 shadow-xs"
                        style={{ width: `${Math.max(barWidthPct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
