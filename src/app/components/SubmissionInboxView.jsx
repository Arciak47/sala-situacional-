"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { exportSubmissionsToHDPDF } from '../lib/exportUtils';
import { AREAS, getEventHour, getEventTimestamp } from '../lib/constants';
import { collection, query, orderBy, limit, startAfter, getDocs, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PAGE_SIZE = 300;

export default function SubmissionInboxView({
  submissions = [], // Mantenido por compatibilidad si se sigue pasando la prop
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
  
  // Rango de fechas
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // ─── Modo SIN filtro de fecha: live top-300 + extra páginas ───
  const [liveSubmissions, setLiveSubmissions] = useState([]);
  const [extraSubmissions, setExtraSubmissions] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const lastDocRef = useRef(null);

  // ─── Modo CON filtro de fecha: query dedicado a Firestore ───
  const [dateFilteredSubmissions, setDateFilteredSubmissions] = useState([]);
  const [isLoadingDate, setIsLoadingDate] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const dateFilterActive = !!(fechaInicio || fechaFin);

  // Combinar live + extra (sin fechas), deduplicando
  const serverSubmissions = (() => {
    if (dateFilterActive) return dateFilteredSubmissions;
    const liveIds = new Set(liveSubmissions.map(s => s.id));
    const deduped = extraSubmissions.filter(s => !liveIds.has(s.id));
    return [...liveSubmissions, ...deduped];
  })();

  // ─── Listener tiempo real: primeros 300 (sin filtro de fecha) ───
  useEffect(() => {
    setIsLoading(true);
    const colRef = collection(db, 'submissions');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(PAGE_SIZE));

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLiveSubmissions(docs);
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setIsLoading(false);
    }, (err) => {
      console.error('Error fetching submissions:', err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // ─── Listener por rango de fechas (se activa cuando hay filtro de fecha) ───
  useEffect(() => {
    if (!dateFilterActive) {
      setDateFilteredSubmissions([]);
      return;
    }
    setIsLoadingDate(true);
    const colRef = collection(db, 'submissions');
    const constraints = [orderBy('timestamp', 'desc')];

    if (fechaInicio) {
      const start = new Date(fechaInicio + 'T00:00:00').toISOString();
      constraints.push(where('timestamp', '>=', start));
    }
    if (fechaFin) {
      const end = new Date(fechaFin + 'T23:59:59').toISOString();
      constraints.push(where('timestamp', '<=', end));
    }

    const q = query(colRef, ...constraints);
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDateFilteredSubmissions(docs);
      setIsLoadingDate(false);
    }, (err) => {
      console.error('Error en query por fecha:', err);
      setIsLoadingDate(false);
    });

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin]);

  // ─── Cargar siguiente página de 300 ───
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !lastDocRef.current) return;
    setIsLoadingMore(true);
    try {
      const colRef = collection(db, 'submissions');
      const q = query(
        colRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExtraSubmissions(prev => {
        const existing = new Set(prev.map(s => s.id));
        return [...prev, ...docs.filter(d => !existing.has(d.id))];
      });
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || lastDocRef.current;
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ─── Actualizar estado local de extraSubmissions y dateFiltered optimistamente ───
  const updateLocalStatus = useCallback((subId, newStatus) => {
    setExtraSubmissions(prev =>
      prev.map(s => s.id === subId ? { ...s, status: newStatus } : s)
    );
    setDateFilteredSubmissions(prev =>
      prev.map(s => s.id === subId ? { ...s, status: newStatus } : s)
    );
  }, []);

  const removeLocal = useCallback((subId) => {
    setExtraSubmissions(prev => prev.filter(s => s.id !== subId));
    setDateFilteredSubmissions(prev => prev.filter(s => s.id !== subId));
  }, []);

  // ─── Wrappers de acciones: actualizan local + llaman al handler de page.jsx ───
  const handleMarkReviewed = useCallback(async (subId) => {
    updateLocalStatus(subId, 'revisado');
    if (markAsReviewed) await markAsReviewed(subId);
  }, [markAsReviewed, updateLocalStatus]);

  const handleMarkRepeated = useCallback(async (subId) => {
    updateLocalStatus(subId, 'repetido');
    if (markAsRepeated) await markAsRepeated(subId);
  }, [markAsRepeated, updateLocalStatus]);

  const handleMarkReported = useCallback(async (subId) => {
    updateLocalStatus(subId, 'reportar');
    if (markAsReported) await markAsReported(subId);
  }, [markAsReported, updateLocalStatus]);

  const handleDelete = useCallback(async (subId) => {
    if (
      typeof window !== 'undefined' &&
      window.confirm('¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.')
    ) {
      removeLocal(subId);
      if (deleteSubmission) deleteSubmission(subId);
    }
  }, [deleteSubmission, removeLocal]);

  const toLocalDateStr = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  };

  // Filtrado Client-Side
  const filteredSubmissions = serverSubmissions.filter((s) => {
      if (s.archived) return false;
      
      // Hide from inbox if it is pending a correction from the analyst
      if (s.hasCorrection && s.correctionStatus === 'pending') {
        return false;
      }
      
      // Date filter
      if (fechaInicio || fechaFin) {
        const sDateStr = toLocalDateStr(s.timestamp || s.createdAt);
        if (fechaInicio && sDateStr < fechaInicio) return false;
        if (fechaFin && sDateStr > fechaFin) return false;
      }
      
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

    return matchStatus && matchSentiment && matchArea && matchShift;
  });

  const allSelected =
    filteredSubmissions.length > 0 &&
    filteredSubmissions.every((s) => selectedIds.includes(s.id));

  const handleBatchReview = () => {
    if (!markAsReviewed) return;
    selectedIds.forEach((id) => handleMarkReviewed(id));
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
    const selectedList = serverSubmissions.filter((s) => selectedIds.includes(s.id));
    if (selectedList.length === 0) {
      alert('Por favor selecciona al menos 1 formulario con la casilla de verificación.');
      return;
    }
    exportSubmissionsToHDPDF(selectedList);
  };

  const loading = isLoading || isLoadingDate;

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
              {dateFilterActive && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  📅 Filtro por fecha activo
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

            {/* DATE FILTER (Rango de Fechas) */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 pl-2">Desde:</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-2 py-1 bg-transparent text-[10px] font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
              />
              <span className="text-[10px] font-bold text-slate-400">Hasta:</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-2 py-1 bg-transparent text-[10px] font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
              />
              {(fechaInicio || fechaFin) && (
                <button
                  onClick={() => { setFechaInicio(''); setFechaFin(''); }}
                  className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-bold hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors cursor-pointer"
                  title="Limpiar filtros de fecha"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SELECT ALL TOOLBAR & CONTEO EFICIENTE */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-2 bg-slate-100/80 dark:bg-slate-900/50 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/50 flex-wrap">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                disabled={filteredSubmissions.length === 0}
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

        {/* SUBMISSIONS LIST */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <span className="inline-block w-5 h-5 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin" />
            <span className="text-sm font-bold text-slate-400">
              {isLoadingDate ? 'Buscando registros en el rango de fechas...' : 'Cargando formularios...'}
            </span>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">
            {isLoading ? 'Cargando formularios...' : 'No hay formularios en esta categoría.'}
          </p>
        ) : (
          <div className="space-y-3 mt-4">
            {filteredSubmissions.map((sub, index) => {
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
                          onClick={() => handleMarkReviewed(sub.id)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border dark:border-emerald-900 cursor-pointer"
                        >
                          ✅ Revisado
                        </button>
                    )}
                    {!isObserver && sub.status !== 'repetido' && (
                        <button
                          onClick={() => handleMarkRepeated(sub.id)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border dark:border-orange-900 cursor-pointer"
                        >
                          ⚠️ Repetido
                        </button>
                    )}
                    {!isObserver && sub.status !== 'reportar' && (
                        <button
                          onClick={() => handleMarkReported(sub.id)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border dark:border-purple-900 cursor-pointer"
                        >
                          📢 Reportar
                        </button>
                    )}
                    {!isObserver && (
                      <button
                        onClick={() => handleDelete(sub.id)}
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

        {/* LOAD MORE BUTTON (solo en modo sin filtro de fecha) */}
        {!dateFilterActive && serverSubmissions.length > 0 && (hasMore || isLoadingMore) && (
          <div className="flex flex-col items-center gap-2 pt-4 pb-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 hover:from-slate-800 hover:to-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              {isLoadingMore ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <span>📂</span>
                  Ver {PAGE_SIZE} más
                  <span className="text-[10px] font-medium opacity-70">({serverSubmissions.length} cargados)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* END OF LIST (solo sin filtro de fecha) */}
        {!dateFilterActive && serverSubmissions.length > 0 && !hasMore && !isLoadingMore && (
          <div className="flex items-center justify-center pt-4 pb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/60 px-4 py-1.5 rounded-full">
              ✅ Todos los registros cargados ({serverSubmissions.length} en total)
            </span>
          </div>
        )}

        {/* INFO DE FECHAS */}
        {dateFilterActive && !isLoadingDate && (
          <div className="flex items-center justify-center pt-4 pb-2">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-4 py-1.5 rounded-full border border-amber-200 dark:border-amber-900/50">
              📅 Mostrando {filteredSubmissions.length} registros del rango de fechas seleccionado
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
