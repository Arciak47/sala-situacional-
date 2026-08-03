"use client";

import {
  exportSubmissionsToExcel,
  exportStatsToExcel,
  exportStatsToPDF,
  exportElementToPNG,
} from '../lib/exportUtils';

export default function StatsView({ currentUser, stats, allStats, submissions = [] }) {
  const isAnalyst = currentUser?.role === 'Analista';
  const canExport = currentUser?.role === 'Administrador' || currentUser?.role === 'Supervisor';

  const exportBar = canExport ? (
    <div className="no-pdf export-action-bar bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <span>💾</span> Exportar Datos & Reportes
        </h4>
        <p className="text-[10px] text-slate-400 font-bold">
          Descarga la base de datos de envíos en Excel (.xls) o exporta el informe estadístico en PDF.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => exportSubmissionsToExcel(submissions.length > 0 ? submissions : stats?.recent || [])}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          title="Descargar base de datos completa en formato Excel (.xls)"
        >
          <span>📊</span> Excel (Base de Datos)
        </button>
        <button
          onClick={() => exportStatsToExcel(allStats || stats)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          title="Descargar resumen de estadísticas en Excel"
        >
          <span>📈</span> Excel (Métricas)
        </button>
        <button
          onClick={() => exportStatsToPDF('Informe Estadístico - Sala Situacional', 'stats-export-container')}
          className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          title="Generar y descargar informe completo en PDF"
        >
          <span>📄</span> Exportar PDF
        </button>
      </div>
    </div>
  ) : null;

  if (isAnalyst && stats) {
    return (
      <div className="space-y-6" id="stats-export-container">
        {exportBar}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-black border-b dark:border-slate-800 pb-3 mb-5">
            📊 Mis Estadísticas de Envío
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Hoy', value: stats.today, icon: '📅' },
              { label: 'Esta Semana', value: stats.week, icon: '📆' },
              { label: 'Este Mes', value: stats.month, icon: '🗓️' },
              { label: 'Este Año', value: stats.year, icon: '📈' },
            ].map((s) => (
              <div
                key={s.label}
                className="p-5 rounded-2xl text-center border border-red-500/10 bg-slate-50 dark:bg-slate-950/40"
              >
                <div className="text-3xl font-black text-red-600 dark:text-red-400">
                  {s.value}
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
                  {s.icon} {s.label}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="text-xs text-slate-400 font-bold">
              Total histórico:{' '}
              <span className="text-red-600">{stats.total}</span> reportes enviados
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
          <h4 className="text-sm font-black border-b dark:border-slate-800 pb-3 mb-4">
            📋 Últimos Reportes Enviados
          </h4>
          {stats.recent.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">
              No has enviado reportes aún.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Municipio</th>
                    <th className="py-3 px-4">Red Social</th>
                    <th className="py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {stats.recent.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {new Date(s.timestamp).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {s.reportData.municipio}
                      </td>
                      <td className="py-3 px-4">{s.reportData.redSocial}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            s.status === 'pendiente'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {s.status === 'pendiente'
                            ? '⏳ Pendiente'
                            : '✅ Revisado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin and Supervisor View: Global stats & Per-Analyst breakdown
  if (allStats) {
    return (
      <div className="space-y-6" id="stats-export-container">
        {exportBar}

        {/* RESUMEN GLOBAL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-black border-b dark:border-slate-800 pb-3 mb-5">
            📊 Estadísticas Generales del Sistema
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Reportes', value: allStats.totalGlobal, icon: '📋', color: 'text-slate-900 dark:text-white' },
              { label: 'Reportes Hoy', value: allStats.todayGlobal, icon: '📅', color: 'text-red-600' },
              { label: 'Esta Semana', value: allStats.weekGlobal, icon: '📆', color: 'text-blue-600' },
              { label: 'Pendientes', value: allStats.pendingGlobal, icon: '⏳', color: 'text-amber-600' },
              { label: 'Revisados', value: allStats.reviewedGlobal, icon: '✅', color: 'text-emerald-600' },
            ].map((s) => (
              <div
                key={s.label}
                className="p-5 rounded-2xl text-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40"
              >
                <div className={`text-3xl font-black ${s.color}`}>
                  {s.value}
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
                  {s.icon} {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DESGLOSE POR ANALISTA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
          <h4 className="text-base font-black border-b dark:border-slate-800 pb-3 mb-4 flex items-center justify-between">
            <span>👥 Rendimiento de Reportes por Analista</span>
            <span className="text-xs font-bold text-slate-400">
              Total Analistas: {allStats.perAnalyst.length}
            </span>
          </h4>

          {allStats.perAnalyst.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">
              No hay usuarios con rol Analista registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Analista</th>
                    <th className="py-3.5 px-4 text-center">Total Enviados</th>
                    <th className="py-3.5 px-4 text-center">Hoy</th>
                    <th className="py-3.5 px-4 text-center">Esta Semana</th>
                    <th className="py-3.5 px-4 text-center">Pendientes</th>
                    <th className="py-3.5 px-4 text-center">Revisados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {allStats.perAnalyst.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                        <div className="text-[10px] text-slate-500">{a.email}</div>
                      </td>
                      <td className="py-4 px-4 text-center font-black text-sm text-red-600 dark:text-red-400">
                        {a.total}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {a.today}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {a.week}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          ⏳ {a.pending}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          ✅ {a.reviewed}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

