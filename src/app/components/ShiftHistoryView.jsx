"use client";

import { useState } from 'react';

export default function ShiftHistoryView({ reports }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredReports = (reports || []).filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.fecha || '').toLowerCase().includes(term) ||
      (r.creadoPor || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative text-slate-800 dark:text-slate-200">
      <div className="flex-1 flex flex-col h-full max-w-7xl mx-auto w-full p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <span className="text-3xl">📖</span> Historial de Turnos Guardados
          </h2>
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
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg transition-colors"
                        >
                          Ver Detalles
                        </button>
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
                <p className="text-sm text-slate-500 mt-1">Exportado el {selectedReport.fecha} a las {selectedReport.hora} por {selectedReport.creadoPor}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span>📑</span> Fichas Incluidas ({selectedReport.totalFichas})
              </h4>
              
              <div className="space-y-3">
                {(selectedReport.fichasDetails || []).map((ficha, idx) => (
                  <div key={ficha.id || idx} className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                      {ficha.imageSrc ? (
                        <img src={ficha.imageSrc} alt="Evidencia" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Sin img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate" title={ficha.title}>
                        {ficha.title || 'Ficha sin título'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                          ID: {ficha.id.slice(0, 6)}...
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
