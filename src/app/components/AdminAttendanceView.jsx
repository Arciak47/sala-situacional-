"use client";

import { useState, useEffect, useRef } from 'react';
import { subscribeWeeklySchedules, saveWeeklySchedule, subscribeAttendance, deleteAttendance } from '../lib/attendanceService';
import html2canvas from 'html2canvas';

const SHIFTS = [
  { id: 'shift-1', label: '7:00 AM - 1:00 PM', shortLabel: '7:00 AM a 1:00 PM' },
  { id: 'shift-2', label: '1:00 PM - 7:00 PM', shortLabel: '1:00 PM a 7:00 PM' },
  { id: 'shift-3', label: '7:00 PM - 12:00 AM', shortLabel: '7:00 PM a 12:00 AM' }
];
const DAYS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

export default function AdminAttendanceView({ users, setToastMsg }) {
  const [activeSubTab, setActiveSubTab] = useState('schedules');
  
  // Firestore Data
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [attendance, setAttendance] = useState([]);
  
  // Local Builder State
  const [currentWeekId, setCurrentWeekId] = useState('');
  const [startDateStr, setStartDateStr] = useState(''); // YYYY-MM-DD
  const [assignments, setAssignments] = useState({}); // { [day]: { [shiftId]: [userIds] } }
  
  // Selection State
  const [selectedCell, setSelectedCell] = useState(null); // { day, shiftId }
  const scheduleRef = useRef(null);

  // Filters for history
  const [filterDate, setFilterDate] = useState('');
  const [filterAnalyst, setFilterAnalyst] = useState('Todos');

  useEffect(() => {
    const unsubSchedules = subscribeWeeklySchedules(setWeeklySchedules);
    const unsubAttendance = subscribeAttendance(setAttendance);
    return () => {
      unsubSchedules();
      unsubAttendance();
    };
  }, []);

  // When weeklySchedules change or weekId changes, load the corresponding assignments
  useEffect(() => {
    if (!currentWeekId) {
      setTimeout(() => { setAssignments({}); }, 0);
      return;
    }
    const found = weeklySchedules.find(s => s.id === currentWeekId);
    if (found) {
      setAssignments(found.assignments || {});
    } else {
      setTimeout(() => { setAssignments({}); }, 0);
    }
  }, [currentWeekId, weeklySchedules]);

  // Handle changing start date and generating weekId
  const handleStartDateChange = (e) => {
    const d = e.target.value;
    setStartDateStr(d);
    setCurrentWeekId(`week-${d}`);
  };

  // Helper to get dates for the header
  const getWeekDates = () => {
    if (!startDateStr) return Array(7).fill('');
    const d = new Date(startDateStr + 'T12:00:00'); // Use noon to avoid timezone shift
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + i);
      dates.push(`${nextD.getDate()}/${nextD.getMonth() + 1}/${String(nextD.getFullYear()).slice(2)}`);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const handleAddAnalystToCell = (userId) => {
    if (!selectedCell) return;
    const { day, shiftId } = selectedCell;
    const cellUsers = assignments[day]?.[shiftId] || [];
    
    if (!cellUsers.includes(userId)) {
      setAssignments(prev => ({
        ...prev,
        [day]: {
          ...(prev[day] || {}),
          [shiftId]: [...cellUsers, userId]
        }
      }));
    }
    setSelectedCell(null); // close selection
  };

  const handleRemoveAnalystFromCell = (day, shiftId, userId) => {
    const cellUsers = assignments[day]?.[shiftId] || [];
    setAssignments(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [shiftId]: cellUsers.filter(id => id !== userId)
      }
    }));
  };

  const handleSaveWeeklySchedule = async () => {
    if (!startDateStr) {
      setToastMsg('⚠️ Selecciona un Lunes como fecha de inicio');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }

    // Build days array mapping day name to date string (YYYY-MM-DD)
    const daysArr = [];
    const d = new Date(startDateStr + 'T12:00:00');
    for (let i = 0; i < 7; i++) {
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + i);
      const isoDate = `${nextD.getFullYear()}-${String(nextD.getMonth() + 1).padStart(2, '0')}-${String(nextD.getDate()).padStart(2, '0')}`;
      daysArr.push({ name: DAYS[i], date: isoDate, displayDate: weekDates[i] });
    }

    try {
      await saveWeeklySchedule({
        id: currentWeekId,
        startDate: startDateStr,
        days: daysArr,
        assignments,
        updatedAt: new Date().toISOString()
      });
      setToastMsg('✅ Planilla Semanal Guardada');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (error) {
      setToastMsg('❌ Error guardando planilla');
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const handleExportPNG = async () => {
    if (!scheduleRef.current) return;
    try {
      const canvas = await html2canvas(scheduleRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Horario_${startDateStr || 'Semanal'}.png`;
      link.click();
    } catch (err) {
      console.error(err);
      setToastMsg('❌ Error al exportar a PNG');
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const getUserName = (userId) => {
    const u = users.find(u => u.id === userId);
    return u ? u.name.split(' ')[0].toUpperCase() : 'DESCONOCIDO';
  };

  const handleDeleteRecord = async (recordId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro de asistencia?')) return;
    try {
      await deleteAttendance(recordId);
      setToastMsg('✅ Registro eliminado');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      setToastMsg('❌ Error al eliminar el registro');
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  // Helper for Punctuality
  const getPunctualityStatus = (record) => {
    if (record.type !== 'Entrada') return null;
    
    // Find the schedule for this record's date
    const weeklySch = weeklySchedules.find(sch => sch.days?.some(d => d.date === record.fecha));
    if (!weeklySch) return { label: 'Sin Horario', color: 'bg-slate-100 text-slate-600' };

    // Determine day name
    const dayObj = weeklySch.days.find(d => d.date === record.fecha);
    if (!dayObj) return { label: 'Sin Horario', color: 'bg-slate-100 text-slate-600' };
    
    // Check which shift the user is in on this day
    const dayAssignments = weeklySch.assignments[dayObj.name] || {};
    let assignedShiftId = null;
    for (const shiftId of Object.keys(dayAssignments)) {
      if (dayAssignments[shiftId].includes(record.analystId)) {
        assignedShiftId = shiftId;
        break;
      }
    }

    if (!assignedShiftId) return { label: 'Sin Horario', color: 'bg-slate-100 text-slate-600' };

    // Check entry time
    // Shift-1 (7:00 AM), Shift-2 (1:00 PM / 13:00), Shift-3 (7:00 PM / 19:00)
    let expectedTime = '';
    if (assignedShiftId === 'shift-1') expectedTime = '07:00';
    if (assignedShiftId === 'shift-2') expectedTime = '13:00';
    if (assignedShiftId === 'shift-3') expectedTime = '19:00';

    if (record.horaLocal <= expectedTime) {
      return { label: 'A Tiempo', color: 'bg-emerald-100 text-emerald-700' };
    } else {
      return { label: 'Tarde', color: 'bg-red-100 text-red-700' };
    }
  };

  let filteredAttendance = attendance;
  if (filterDate) {
    filteredAttendance = filteredAttendance.filter(a => a.fecha === filterDate);
  }
  if (filterAnalyst !== 'Todos') {
    filteredAttendance = filteredAttendance.filter(a => a.analystId === filterAnalyst);
  }

  const analysts = users.filter(u => u.role === 'Analista' || u.role === 'Supervisor');

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => setActiveSubTab('schedules')}
          className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${
            activeSubTab === 'schedules' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          ⏰ Gestión Horarios
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${
            activeSubTab === 'history' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          📜 Historial Asistencias
        </button>
      </div>

      {activeSubTab === 'schedules' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <label className="font-bold text-slate-800 dark:text-slate-100">Fecha del Lunes:</label>
              <input 
                type="date" 
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-slate-700 dark:text-slate-200 w-full md:w-auto"
                value={startDateStr}
                onChange={handleStartDateChange}
              />
              <select 
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-slate-700 dark:text-slate-200 w-full md:w-auto"
                value={currentWeekId}
                onChange={(e) => {
                  setCurrentWeekId(e.target.value);
                  const s = weeklySchedules.find(x => x.id === e.target.value);
                  if (s) setStartDateStr(s.startDate);
                }}
              >
                <option value="">-- Semanas Guardadas --</option>
                {weeklySchedules.map(s => (
                  <option key={s.id} value={s.id}>Semana: {s.startDate}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveWeeklySchedule}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-6 py-2.5 rounded-xl transition-transform active:scale-95 shadow-md"
              >
                💾 Guardar Planilla
              </button>
              <button
                onClick={handleExportPNG}
                className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl transition-transform active:scale-95 shadow-md flex items-center gap-2"
              >
                📸 Exportar a PNG
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            Para <strong>asignar</strong> haz clic en una celda de la tabla. Para <strong>eliminar</strong> a alguien que ya fue asignado, simplemente haz clic sobre su nombre en la celda.
          </p>

          {/* Matrix Builder (Exportable area) */}
          <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-xl overflow-x-auto" ref={scheduleRef}>
            <div className="min-w-[1000px]">
              <h2 className="text-center font-bold text-xl text-black mb-6">HORARIO DE MONITORES Y SUPERVISORES</h2>
              
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr>
                    <th className="bg-[#1e6080] text-white border border-slate-400 p-2 text-sm">HORA</th>
                    {DAYS.map((day, idx) => (
                      <th key={day} className="bg-[#1e6080] text-white border border-slate-400 p-2 text-sm leading-tight">
                        {day} <br/>
                        <span className="text-xs font-normal">{weekDates[idx]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-[#e4e9ee]">
                  {SHIFTS.map((shift, shiftIndex) => (
                    <tr key={shift.id}>
                      <td className="border border-slate-400 p-2 text-sm font-bold text-slate-800 bg-white/50">
                        {shift.label.split(' - ').map((part, i) => (
                          <div key={i}>{part}</div>
                        ))}
                      </td>
                      {DAYS.map(day => {
                        const cellUsers = assignments[day]?.[shift.id] || [];
                        const isSelected = selectedCell?.day === day && selectedCell?.shiftId === shift.id;
                        
                        return (
                          <td 
                            key={`${day}-${shift.id}`} 
                            className={`border border-slate-400 p-2 relative text-xs min-h-[80px] align-top transition-colors cursor-pointer hover:bg-[#d0d7df] ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
                            onClick={() => setSelectedCell({ day, shiftId: shift.id })}
                          >
                            <div className="flex flex-col gap-1 min-h-[60px]">
                              {cellUsers.length === 0 && <span className="text-transparent">.</span>}
                              {cellUsers.map(uId => (
                                <div 
                                  key={uId} 
                                  className="uppercase font-bold text-slate-800 hover:text-red-600 hover:line-through transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveAnalystFromCell(day, shift.id, uId);
                                  }}
                                  title="Clic para eliminar"
                                >
                                  {getUserName(uId)}
                                </div>
                              ))}
                            </div>
                            
                            {/* Dropdown for selecting an analyst */}
                            {isSelected && (
                              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 w-48 text-left" onClick={e => e.stopPropagation()}>
                                <div className="text-xs font-bold text-slate-400 mb-2 uppercase">Asignar Personal</div>
                                <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                                  {analysts.map(u => (
                                    <button 
                                      key={u.id}
                                      onClick={() => handleAddAnalystToCell(u.id)}
                                      className="text-left px-2 py-1.5 hover:bg-blue-50 rounded-md text-sm font-bold text-slate-700"
                                    >
                                      {u.name}
                                    </button>
                                  ))}
                                </div>
                                <button 
                                  onClick={() => setSelectedCell(null)}
                                  className="w-full mt-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-bold text-xs"
                                >
                                  Cerrar
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
            <h3 className="font-black text-slate-800 dark:text-slate-100 w-full md:w-auto">Filtros:</h3>
            <input 
              type="date" 
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
            />
            <select 
              value={filterAnalyst} 
              onChange={e => setFilterAnalyst(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
            >
              <option value="Todos">Todo el Personal</option>
              {analysts.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <button 
              onClick={() => { setFilterDate(''); setFilterAnalyst('Todos'); }}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
            >
              Limpiar
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Analista</th>
                    <th className="px-4 py-3">Fecha y Hora</th>
                    <th className="px-4 py-3">Acción</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">IP / Dispositivo</th>
                    <th className="px-4 py-3 text-right">Opciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500 italic">No hay registros para mostrar.</td>
                    </tr>
                  ) : (
                    filteredAttendance.map(rec => {
                      const status = getPunctualityStatus(rec);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-bold">{rec.analystName} <br/><span className="text-[10px] font-normal text-slate-400">{rec.sala}</span></td>
                          <td className="px-4 py-3">
                            {rec.fecha} <span className="font-bold text-blue-600 dark:text-blue-400">{rec.horaLocal}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${rec.type === 'Entrada' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                              {rec.type === 'Entrada' ? '👋 Entrada' : '🚪 Salida'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {status ? (
                              <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${status.color}`}>
                                {status.label}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[10px] font-mono text-slate-500 max-w-xs truncate" title={rec.userAgent}>
                            <div className="font-bold text-slate-700 dark:text-slate-300">{rec.ip}</div>
                            <div className="truncate">{rec.userAgent}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                              title="Eliminar Registro"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
