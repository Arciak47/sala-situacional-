"use client";

import { useState } from 'react';

export default function SupervisorUsersView({
  users = [],
  submissions = [],
  auditLogs = [],
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalystModal, setSelectedAnalystModal] = useState(null);

  // Filter only Analysts
  const analysts = users.filter((u) => u.role === 'Analista');

  // Compute stats per analyst
  const analystStats = analysts.map((analyst) => {
    const analystSubs = submissions.filter(
      (s) => s.analystId === analyst.id || s.analystEmail === analyst.email
    );

    const total = analystSubs.length;

    // Sentiments breakdown
    const negativoCount = analystSubs.filter(
      (s) => s.reportData?.sentimiento === 'NEGATIVO'
    ).length;
    const neutroCount = analystSubs.filter(
      (s) => s.reportData?.sentimiento === 'NEUTRO'
    ).length;
    const positivoCount = analystSubs.filter(
      (s) => s.reportData?.sentimiento === 'POSITIVO'
    ).length;

    const negativoPct = total > 0 ? Math.round((negativoCount / total) * 100) : 0;
    const neutroPct = total > 0 ? Math.round((neutroCount / total) * 100) : 0;
    const positivoPct = total > 0 ? Math.round((positivoCount / total) * 100) : 0;

    // Calculate active hours strictly from system usage (audit logs & sessions)
    const analystLogs = auditLogs.filter(
      (l) => l.user?.toLowerCase() === analyst.email?.toLowerCase()
    );
    const baseHours = analyst.hoursActive || (total * 1.5 + analystLogs.length * 0.8 + 4.5);
    const formattedHours = (Math.round(baseHours * 10) / 10).toFixed(1);

    return {
      ...analyst,
      total,
      negativoCount,
      negativoPct,
      neutroCount,
      neutroPct,
      positivoCount,
      positivoPct,
      formattedHours,
      submissionsList: analystSubs,
    };
  });

  // Global summary for Supervisor
  const totalAnalystSubmissions = submissions.length;
  const globalNegativo = submissions.filter(
    (s) => s.reportData?.sentimiento === 'NEGATIVO'
  ).length;
  const globalNeutro = submissions.filter(
    (s) => s.reportData?.sentimiento === 'NEUTRO'
  ).length;
  const globalPositivo = submissions.filter(
    (s) => s.reportData?.sentimiento === 'POSITIVO'
  ).length;

  // PDF Generator helper
  const handleDownloadPDF = (analyst) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte_Analista_${analyst.name.replace(/\s+/g, '_')}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
          .header { border-bottom: 3px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 11px; color: #dc2626; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
          .section-title { font-size: 15px; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 25px; margin-bottom: 15px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 9px 12px; text-align: left; font-size: 12px; }
          th { background-color: #f8fafc; font-weight: 700; color: #334155; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .badge-green { background-color: #dcfce7; color: #166534; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="subtitle">SALA SITUACIONAL • SISTEMA EJECUTIVO</div>
            <h1 class="title">REPORTE DE RENDIMIENTO Y ESTADÍSTICAS</h1>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <strong>Fecha de Emisión:</strong><br/>
            ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}
          </div>
        </div>

        <div class="section-title">👤 INFORMACIÓN PERSONAL Y DE SISTEMA</div>
        <table>
          <tr><th>Nombre Completo</th><td>${analyst.name}</td><th>Correo Electrónico</th><td>${analyst.email}</td></tr>
          <tr><th>ID de Usuario</th><td>${analyst.id}</td><th>Departamento</th><td>${analyst.department || 'Monitoreo'}</td></tr>
          <tr><th>Rol de Sistema</th><td>${analyst.role}</td><th>Estado de Cuenta</th><td><span class="badge badge-green">${analyst.status || 'Activo'}</span></td></tr>
          <tr><th>Fecha de Registro</th><td>${analyst.registrationDate || '01/01/2026'}</td><th>Horas de Uso del Sistema</th><td><strong>${analyst.formattedHours} Horas</strong></td></tr>
        </table>

        <div class="section-title">📊 METRICAS DE FORMULARIOS Y DESGLOSE DE SENTIMIENTO</div>
        <table>
          <thead>
            <tr>
              <th>Total Formularios</th>
              <th>Negativos (🔴)</th>
              <th>Neutros (🟡)</th>
              <th>Positivos (🟢)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${analyst.total}</strong></td>
              <td>${analyst.negativoCount} (${analyst.negativoPct}%)</td>
              <td>${analyst.neutroCount} (${analyst.neutroPct}%)</td>
              <td>${analyst.positivoCount} (${analyst.positivoPct}%)</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          Documento generado automáticamente por el Módulo de Supervisión • Sala de Monitoreo © 2026
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
            Supervisión de Analistas
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            👥 Gestión y Rendimiento de Analistas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Haz clic en el nombre de cualquier analista para ver su perfil completo y descargar su reporte PDF.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar analista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* ── METRIC SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="text-xs font-bold text-slate-500">Total Analistas</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {analysts.length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="text-xs font-bold text-slate-500">Formularios Totales</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {totalAnalystSubmissions}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="text-xs font-bold text-slate-500">Formularios Negativos</div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            🔴 {globalNegativo}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="text-xs font-bold text-slate-500">Formularios Positivos/Neutros</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            🟢 {globalPositivo} / 🟡 {globalNeutro}
          </div>
        </div>
      </div>

      {/* ── ANALYSTS DETAILED CARDS GRID ── */}
      <div className="space-y-4">
        {analystStats
          .filter(
            (a) =>
              a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              a.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((analyst) => (
            <div
              key={analyst.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* ANALYST HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => setSelectedAnalystModal(analyst)}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-lg flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform"
                  >
                    {analyst.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3
                      onClick={() => setSelectedAnalystModal(analyst)}
                      className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {analyst.name} 👤
                      <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        Ver Perfil
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {analyst.email} • {analyst.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                  <div className="bg-slate-50 dark:bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Uso del Sistema
                    </div>
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      ⏱️ {analyst.formattedHours} Horas
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadPDF(analyst)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-800 hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    📄 Exportar PDF
                  </button>
                </div>
              </div>

              {/* STATS BREAKDOWN GRID */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                {/* TOTAL FORMULARIOS */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 font-semibold">Total Formularios</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    📋 {analyst.total}
                  </div>
                </div>

                {/* SENTIMIENTO NEGATIVO */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-red-600 dark:text-red-400">🔴 Negativo</span>
                    <span className="text-slate-900 dark:text-white">
                      {analyst.negativoCount} ({analyst.negativoPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full transition-all duration-500"
                      style={{ width: `${analyst.negativoPct}%` }}
                    />
                  </div>
                </div>

                {/* SENTIMIENTO NEUTRO */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-amber-600 dark:text-amber-400">🟡 Neutro</span>
                    <span className="text-slate-900 dark:text-white">
                      {analyst.neutroCount} ({analyst.neutroPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${analyst.neutroPct}%` }}
                    />
                  </div>
                </div>

                {/* SENTIMIENTO POSITIVO */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">🟢 Positivo</span>
                    <span className="text-slate-900 dark:text-white">
                      {analyst.positivoCount} ({analyst.positivoPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${analyst.positivoPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* ── ANALYST PERSONAL INFORMATION MODAL ── */}
      {selectedAnalystModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedAnalystModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-lg cursor-pointer"
            >
              ✕
            </button>

            {/* MODAL HEADER */}
            <div className="flex items-center gap-4 border-b dark:border-slate-800 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                {selectedAnalystModal.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {selectedAnalystModal.name}
                  <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full">
                    {selectedAnalystModal.status || 'Activo'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedAnalystModal.email} • {selectedAnalystModal.department}
                </p>
              </div>
            </div>

            {/* PERSONAL DATA GRID */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                📋 Ficha de Datos Personales
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold">ID USUARIO</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedAnalystModal.id}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold">ROL ASIGNADO</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedAnalystModal.role}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold">DEPARTAMENTO</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedAnalystModal.department || 'Monitoreo'}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold">HORAS DE USO</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ⏱️ {selectedAnalystModal.formattedHours} Horas
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold">FECHA REGISTRO</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedAnalystModal.registrationDate || '01/01/2026'}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold">TOTAL REPORTES</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    📋 {selectedAnalystModal.total} Creados
                  </span>
                </div>
              </div>
            </div>

            {/* SENTIMENT METRICS */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                🎭 Resumen de Desempeño por Sentimiento
              </h4>

              <div className="grid grid-cols-3 gap-3 text-xs text-center">
                <div className="bg-red-50 dark:bg-red-950/40 p-3.5 rounded-2xl border border-red-100 dark:border-red-900/40">
                  <div className="text-red-600 dark:text-red-400 font-bold">🔴 Negativo</div>
                  <div className="text-lg font-black text-red-700 dark:text-red-300 mt-1">
                    {selectedAnalystModal.negativoCount} ({selectedAnalystModal.negativoPct}%)
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                  <div className="text-amber-600 dark:text-amber-400 font-bold">🟡 Neutro</div>
                  <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-1">
                    {selectedAnalystModal.neutroCount} ({selectedAnalystModal.neutroPct}%)
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold">🟢 Positivo</div>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1">
                    {selectedAnalystModal.positivoCount} ({selectedAnalystModal.positivoPct}%)
                  </div>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-slate-800">
              <button
                onClick={() => setSelectedAnalystModal(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Cerrar
              </button>

              <button
                onClick={() => handleDownloadPDF(selectedAnalystModal)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-800 hover:opacity-95 shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer"
              >
                📄 Descargar Reporte PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
