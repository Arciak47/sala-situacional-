"use client";

import { useState } from 'react';
import { exportSubmissionsToHDPDF, exportCombinedReportAndFichasHDPDF } from '../lib/exportUtils';
import { deleteShiftReportRecord } from '../lib/firestoreService';

export default function ShiftHistoryView({ reports, submissions = [], openSubmissionForReview }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const filteredReports = (reports || []).filter((r) => {
    // text filter
    let matchesText = true;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      matchesText =
        (r.fecha || '').toLowerCase().includes(term) ||
        (r.creadoPor || '').toLowerCase().includes(term);
    }
    // date filter
    let matchesDate = true;
    if (filterDate) {
      // filterDate is usually YYYY-MM-DD
      // r.fecha is likely DD/MM/YYYY or YYYY-MM-DD
      // Let's do a simple includes just in case formats vary, but let's try to match exactly
      const dateParts = filterDate.split('-');
      if (dateParts.length === 3) {
        const [y, m, d] = dateParts;
        const formattedDate = `${d}/${m}/${y}`; // standard representation
        matchesDate = r.fecha === filterDate || r.fecha === formattedDate;
      }
    }
    return matchesText && matchesDate;
  });

  // Para cada ficha del historial, busca el objeto completo en submissions
  const getFichaFullObject = (fichaId) => {
    return submissions.find((s) => s.id === fichaId) || null;
  };

  const handleDownloadFicha = async (fichaId) => {
    const fullSub = getFichaFullObject(fichaId);
    if (!fullSub) {
      alert('No se encontró la ficha en la base de datos actual. Puede que haya sido eliminada.');
      return;
    }
    setDownloadingId(fichaId);
    try {
      await exportSubmissionsToHDPDF([fullSub], `Ficha_${fichaId}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAllFichas = async (report) => {
    const ids = report.fichasIds || (report.fichasDetails || []).map((f) => f.id);
    const fullSubs = ids.map((id) => getFichaFullObject(id)).filter(Boolean);
    if (fullSubs.length === 0 && !report.reportImage) {
      alert('No se encontraron fichas en la base de datos actual para este turno, ni reporte consolidado guardado.');
      return;
    }
    setDownloadingId('all');
    try {
      if (report.reportImage) {
        await exportCombinedReportAndFichasHDPDF(report.reportImage, fullSubs, `Reporte_Turno_Completo_${report.fecha}`);
      } else {
        await exportSubmissionsToHDPDF(fullSubs, `Fichas_Turno_${report.fecha}`);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEditFicha = (fichaId) => {
    const fullSub = getFichaFullObject(fichaId);
    if (!fullSub) {
      alert('No se encontró la ficha en la base de datos actual. Puede que haya sido eliminada.');
      return;
    }
    if (typeof openSubmissionForReview === 'function') {
      setSelectedReport(null);
      openSubmissionForReview(fullSub);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este reporte de turno del historial?")) {
      try {
        await deleteShiftReportRecord(reportId);
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport(null);
        }
      } catch (e) {
        alert("Error al eliminar el reporte.");
      }
    }
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative text-slate-800 dark:text-slate-200">
      <div className="flex-1 flex flex-col h-full max-w-7xl mx-auto w-full p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <span className="text-3xl">📖</span> Historial de Turnos Guardados
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 mr-2">📅</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm w-32 cursor-pointer text-slate-700 dark:text-slate-300"
                title="Filtrar por fecha exacta"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="ml-2 text-slate-400 hover:text-red-500 cursor-pointer"
                  title="Limpiar fecha"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 mr-2">🔍</span>
              <input
                type="text"
                placeholder="Buscar por fecha o creador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm w-64"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Fecha y Hora</th>
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Exportado Por</th>
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700 text-center">Total Fichas</th>
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500">
                      No hay registros en el historial.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{report.fecha}</div>
                        <div className="text-xs text-slate-500">{report.hora}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {report.creadoPor}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-lg">{report.totalFichas}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownloadAllFichas(report)}
                            disabled={downloadingId === 'all'}
                            className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            title="Descargar todas las fichas de este turno en PDF"
                          >
                            {downloadingId === 'all' ? '⏳' : '📥'} PDF
                          </button>
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Ver Detalles
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/70 text-red-700 dark:text-red-300 text-sm font-bold rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Reporte de Turno"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Detalles */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Detalles del Turno</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Exportado el {selectedReport.fecha} a las {selectedReport.hora} por {selectedReport.creadoPor}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* VISTA DEL REPORTE TURNO (Si existe la imagen) */}
              {selectedReport.reportImage && (
                <div className="mb-6">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span>🖼️</span> Reporte Consolidado
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-800 flex justify-center">
                    <img 
                      src={selectedReport.reportImage} 
                      alt="Reporte de Turno" 
                      className="max-h-96 object-contain w-full"
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <a 
                      href={selectedReport.reportImage} 
                      download={`Reporte_Turno_${selectedReport.fecha}.jpg`}
                      className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>📥</span> Descargar Imagen
                    </a>
                  </div>
                </div>
              )}

              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span>📑</span> Fichas Incluidas ({selectedReport.totalFichas})
              </h4>
              
              <div className="space-y-3">
                {(selectedReport.fichasDetails || []).map((ficha, idx) => {
                  const fullSub = getFichaFullObject(ficha.id);
                  const isAvailable = !!fullSub;

                  return (
                    <div
                      key={ficha.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30"
                    >
                      {/* IMAGEN THUMBNAIL */}
                      <div className="w-full sm:w-16 h-24 sm:h-16 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                        {ficha.imageSrc ? (
                          <img src={ficha.imageSrc} alt="Evidencia" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Sin img</div>
                        )}
                      </div>

                      {/* INFO */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate" title={ficha.title}>
                          {ficha.title || 'Ficha sin título'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                            ID: {(ficha.id || '').slice(0, 8)}...
                          </span>
                          {ficha.status && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              ficha.status.toLowerCase() === 'reportar' ? 'bg-amber-100 text-amber-700' :
                              ficha.status.toLowerCase() === 'reportado' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {ficha.status.toUpperCase()}
                            </span>
                          )}
                          {!isAvailable && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                              ⚠️ No en BD
                            </span>
                          )}
                        </div>
                      </div>

                      {/* BOTONES DE ACCIÓN */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleDownloadFicha(ficha.id)}
                          disabled={!isAvailable || downloadingId === ficha.id}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                          title={isAvailable ? 'Descargar esta ficha en PDF (HD)' : 'Ficha no disponible en la BD'}
                        >
                          {downloadingId === ficha.id ? '⏳' : '📥'} PDF
                        </button>
                        <button
                          onClick={() => handleEditFicha(ficha.id)}
                          disabled={!isAvailable || typeof openSubmissionForReview !== 'function'}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                          title={isAvailable ? 'Editar esta ficha en el Canvas Editor' : 'Ficha no disponible en la BD'}
                        >
                          🎨 Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center gap-3">
              <button
                onClick={() => handleDownloadAllFichas(selectedReport)}
                disabled={downloadingId === 'all'}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                {downloadingId === 'all' ? '⏳ Descargando...' : '📥 Descargar todas en PDF'}
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
