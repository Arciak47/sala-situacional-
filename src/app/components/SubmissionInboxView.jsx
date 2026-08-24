"use client";

import { useState, useEffect } from 'react';
import { exportSubmissionsToHDPDF } from '../lib/exportUtils';
import { AREAS, getEventHour, getEventTimestamp } from '../lib/constants';
import { fetchInboxSubmissionsPaginated } from '../lib/firestoreService';

export default function SubmissionInboxView({
  submissions = [],
  inboxFilter = 'Todos',
  setInboxFilter,
  openSubmissionForReview,
  markAsReviewed,
  markAsRepeated,
  markAsReported,
  handleMarkForCorrection,
  deleteSubmission,
  isObserver,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [sentimentFilter, setSentimentFilter] = useState('Todos');
  const [areaFilter, setAreaFilter] = useState('Todos');
  const [shiftFilter, setShiftFilter] = useState('Todos');
  const [specificDate, setSpecificDate] = useState('');

  // Client-side pagination state
  const [displayLimit, setDisplayLimit] = useState(20);

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 20);
  };

  const toLocalDateStr = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  };

  const filteredSubmissions = submissions.filter(
    (s) => {
      if (s.archived) return false;
      
      let matchStatus = false;
      if (inboxFilter === 'Todos') {
        matchStatus = true;
      } else if (inboxFilter === 'revisado') {
        matchStatus = ['revisado', 'reportar', 'repetido'].includes(s.status);
      } else {
        matchStatus = s.status === inboxFilter;
      }
      const matchSentiment = sentimentFilter === 'Todos' || s.reportData?.sentimiento === sentimentFilter;
      const matchArea = areaFilter === 'Todos' || s.reportData?.area === areaFilter;
      
      let matchShift = true;
      if (shiftFilter !== 'Todos') {
        const hour = getEventHour(s);
        if (shiftFilter === 't1') matchShift = hour >= 7 && hour <= 12;
        else if (shiftFilter === 't2') matchShift = hour >= 13 && hour <= 18;
        else if (shiftFilter === 't3') matchShift = hour >= 19 && hour <= 23;
      }

      let matchDate = true;
      if (specificDate) {
        matchDate = toLocalDateStr(getEventTimestamp(s)) === specificDate;
      }

      return matchStatus && matchSentiment && matchArea && matchShift && matchDate;
    }
  ).sort((a, b) => {
    const tsA = new Date(a.timestamp || a.fechaHora || 0).getTime();
    const tsB = new Date(b.timestamp || b.fechaHora || 0).getTime();
    return tsB - tsA; // Descending (newest arrival first)
  });

  const displayedSubmissions = filteredSubmissions.slice(0, displayLimit);
  const hasMore = displayLimit < filteredSubmissions.length;

  const allSelected =
    filteredSubmissions.length > 0 &&
    filteredSubmissions.every((s) => selectedIds.includes(s.id));

  const handleBatchReview = () => {
    if (!markAsReviewed) return;
    selectedIds.forEach((id) => markAsReviewed(id));
    setSelectedIds([]);
  };

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

            {/* AREA FILTER DROPDOWN */}
            <div className="relative flex items-center">
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className={`appearance-none outline-none pl-4 pr-8 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all shadow-sm ${
                  areaFilter === 'Todos'
                    ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                    : 'bg-purple-600 text-white border-purple-600'
                }`}
              >
                <option value="Todos">🌍 Todas las Áreas</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] ${
                areaFilter === 'Todos' ? 'text-slate-400' : 'text-white'
              }`}>
                ▼
              </div>
            </div>

            {/* SHIFT FILTER DROPDOWN */}
            <div className="relative flex items-center">
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className={`appearance-none outline-none pl-4 pr-8 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all shadow-sm ${
                  shiftFilter === 'Todos'
                    ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                    : 'bg-amber-600 text-white border-amber-600'
                }`}
              >
                <option value="Todos">🕒 Todos los Turnos</option>
                <option value="t1">Turno 1 (07:00 AM - 01:00 PM)</option>
                <option value="t2">Turno 2 (01:00 PM - 07:00 PM)</option>
                <option value="t3">Turno 3 (07:00 PM - 12:00 AM)</option>
              </select>
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] ${
                shiftFilter === 'Todos' ? 'text-slate-400' : 'text-white'
              }`}>
                ▼
              </div>
            </div>

            {/* DATE FILTER */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              {specificDate && (
                <button
                  onClick={() => setSpecificDate('')}
                  className="px-2 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-bold hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors cursor-pointer flex items-center gap-1"
                  title="Limpiar filtro de fecha"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SELECT ALL TOOLBAR */}
        {filteredSubmissions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-2 bg-slate-100/80 dark:bg-slate-900/50 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/50 flex-wrap">
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
          </div>
        )}

        {/* SUBMISSIONS LIST */}
        {filteredSubmissions.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">
            No hay formularios en esta categoría.
          </p>
        ) : (
          <div className="space-y-3">
            {displayedSubmissions.map((sub, index) => {
              const isSelected = selectedIds.includes(sub.id);

              return (
                <div
                  key={sub.id ? `${sub.id}-${index}` : `sub-${index}`}
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
                        • ⏰ Evento: {new Date(getEventTimestamp(sub)).toLocaleDateString('es-ES')}{' '}
                        {new Date(getEventTimestamp(sub)).toLocaleTimeString('es-ES', {
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
                      {isObserver ? '👀 Ver Ficha' : '🎨 Editar en Canvas'}
                    </button>
                    {!isObserver && sub.status !== 'revisado' && (
                        <button
                          onClick={() => markAsReviewed(sub.id)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border dark:border-emerald-900 cursor-pointer"
                        >
                          ✅ Revisado
                        </button>
                    )}
                    {!isObserver && sub.status !== 'repetido' && (
                        <button
                          onClick={() => markAsRepeated && markAsRepeated(sub.id)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border dark:border-orange-900 cursor-pointer"
                        >
                          ⚠️ Repetido
                        </button>
                    )}
                    {!isObserver && sub.status !== 'reportar' && (
                        <button
                          onClick={() => markAsReported && markAsReported(sub.id)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border dark:border-purple-900 cursor-pointer"
                        >
                          📢 Reportar
                        </button>
                    )}
                    {!isObserver && (
                      <button
                        onClick={() => deleteSubmission && deleteSubmission(sub.id)}
                        className="px-3 py-1.5 rounded-full text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 cursor-pointer transition-all"
                        title="Eliminar reporte permanentemente"
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 rounded-full text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all shadow-md"
            >
              Cargar más reportes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
