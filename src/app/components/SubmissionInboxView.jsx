"use client";

import { useState } from 'react';
import { exportSubmissionsToHDPDF } from '../lib/exportUtils';

export default function SubmissionInboxView({
  submissions = [],
  inboxFilter = 'Todos',
  setInboxFilter,
  openSubmissionForReview,
  markAsReviewed,
  markAsRepeated,
  markAsReported,
  deleteSubmission,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [sentimentFilter, setSentimentFilter] = useState('Todos');

  const filteredSubmissions = submissions.filter(
    (s) => {
      const matchStatus = inboxFilter === 'Todos' || s.status === inboxFilter;
      const matchSentiment = sentimentFilter === 'Todos' || s.reportData?.sentimiento === sentimentFilter;
      return matchStatus && matchSentiment;
    }
  );

  const allSelected =
    filteredSubmissions.length > 0 &&
    filteredSubmissions.every((s) => selectedIds.includes(s.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredSubmissions.some((s) => s.id === id))
      );
    } else {
      const filteredIds = filteredSubmissions.map((s) => s.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportSelectedHD = () => {
    const selectedList = submissions.filter((s) => selectedIds.includes(s.id));
    if (selectedList.length === 0) {
      alert('Por favor selecciona al menos 1 formulario con la casilla de verificación.');
      return;
    }
    exportSubmissionsToHDPDF(selectedList);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b dark:border-slate-800 pb-4 mb-4 gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📥 Bandeja de Formularios</span>
              {selectedIds.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {selectedIds.length} Seleccionado{selectedIds.length > 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Formularios enviados por los Analistas • Selección múltiple activa
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* EXPORT HD PDF BUTTON */}
            {selectedIds.length > 0 && (
              <button
                onClick={handleExportSelectedHD}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer shadow-lg animate-pulse flex items-center gap-2"
              >
                <span>📄</span> Descargar Seleccionados en PDF (HD) [{selectedIds.length}]
              </button>
            )}

            {/* FILTER BUTTONS */}
            <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex-wrap">
              {['Todos', 'pendiente', 'revisado', 'repetido', 'reportar'].map((f) => (
                <button
                  key={f}
                  onClick={() => setInboxFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    inboxFilter === f
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f === 'Todos'
                    ? '📋 Todos'
                    : f === 'pendiente'
                    ? '⏳ Pendientes'
                    : f === 'revisado'
                    ? '✅ Revisados'
                    : f === 'reportar'
                    ? '📢 Reportar'
                    : '⚠️ Repetidos'}
                </button>
              ))}
            </div>
            
            {/* SENTIMENT FILTER BUTTONS */}
            <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex-wrap">
              {['Todos', 'POSITIVO', 'NEUTRO', 'NEGATIVO'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSentimentFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    sentimentFilter === f
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f === 'Todos'
                    ? '🎭 Todos los Sentimientos'
                    : f === 'POSITIVO'
                    ? '🟢 Positivo'
                    : f === 'NEUTRO'
                    ? '⚪ Neutro'
                    : '🔴 Negativo'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SELECT ALL TOOLBAR */}
        {filteredSubmissions.length > 0 && (
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Seleccionar todos ({filteredSubmissions.length})
              </span>
            </label>

            {selectedIds.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
                className="text-[11px] font-bold text-slate-500 hover:text-red-600 cursor-pointer"
              >
                Desmarcar todos
              </button>
            )}
          </div>
        )}

        {/* SUBMISSIONS LIST */}
        {filteredSubmissions.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">
            No hay formularios en esta categoría.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((sub) => {
              const isSelected = selectedIds.includes(sub.id);

              return (
                <div
                  key={sub.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border transition-all gap-3 ${
                    isSelected
                      ? 'border-blue-500 dark:border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-red-300 dark:hover:border-red-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* CHECKBOX */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(sub.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                    />

                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        sub.status === 'pendiente'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    ></span>

                    <div>
                      <div className="text-xs font-bold flex items-center gap-2 flex-wrap">
                        <span>{sub.reportData.municipio} — {sub.reportData.redSocial}</span>
                        {sub.analystSala && (
                          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50">
                            🏢 {sub.analystSala}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Por:{' '}
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {sub.analystName}
                        </span>{' '}
                        • {new Date(sub.timestamp).toLocaleDateString('es-ES')}{' '}
                        {new Date(sub.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {sub.editedBy && (
                        <div className="text-[9px] text-blue-500 font-medium">
                          ✏️ Editado por {sub.editedBy}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* SENTIMENT BADGE */}
                    {sub.reportData?.sentimiento && (
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                        sub.reportData.sentimiento === 'POSITIVO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400' :
                        sub.reportData.sentimiento === 'NEGATIVO' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {sub.reportData.sentimiento === 'POSITIVO' ? '🟢 ' : sub.reportData.sentimiento === 'NEGATIVO' ? '🔴 ' : '⚪ '}
                        {sub.reportData.sentimiento}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                        sub.status === 'pendiente'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : sub.status === 'repetido'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                          : sub.status === 'reportar'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {sub.status === 'pendiente' ? '⏳ PENDIENTE' : sub.status === 'repetido' ? '⚠️ REPETIDO' : sub.status === 'reportar' ? '📢 REPORTAR' : '✅ REVISADO'}
                    </span>
                    <button
                      onClick={() => openSubmissionForReview(sub)}
                      className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 cursor-pointer shadow-sm"
                    >
                      🎨 Editar en Canvas
                    </button>
                    {sub.status === 'pendiente' && (
                      <>
                        <button
                          onClick={() => markAsReviewed(sub.id)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border dark:border-emerald-900 cursor-pointer"
                        >
                          ✅ Revisado
                        </button>
                        <button
                          onClick={() => markAsRepeated && markAsRepeated(sub.id)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border dark:border-orange-900 cursor-pointer"
                        >
                          ⚠️ Repetido
                        </button>
                      </>
                    )}
                    {['pendiente', 'revisado'].includes(sub.status) && (
                        <button
                          onClick={() => markAsReported && markAsReported(sub.id)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border dark:border-purple-900 cursor-pointer"
                        >
                          📢 Reportar
                        </button>
                    )}
                    <button
                      onClick={() => deleteSubmission && deleteSubmission(sub.id)}
                      className="px-3 py-1.5 rounded-full text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 cursor-pointer transition-all"
                      title="Eliminar reporte permanentemente"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
