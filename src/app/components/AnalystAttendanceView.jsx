"use client";

import { useState, useEffect } from 'react';
import { markAttendance, subscribeTodayAttendanceForUser } from '../lib/attendanceService';

export default function AnalystAttendanceView({ currentUser, setToastMsg, addLog }) {
  const [loading, setLoading] = useState(false);
  const [todayRecords, setTodayRecords] = useState([]);



  useEffect(() => {
    if (currentUser) {
      const unsub = subscribeTodayAttendanceForUser(currentUser.id, (records) => {
        setTodayRecords(records);
      });
      return () => unsub();
    }
  }, [currentUser]);

  const handleMarkAttendance = async (type) => {
    setLoading(true);
    try {
      // 1. Obtener la IP pública (usando un servicio externo dado que la app es estática)
      let clientIp = 'IP desconocida';
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const ipData = await res.json();
        clientIp = ipData.ip;
      } catch (e) {
        console.warn('No se pudo obtener la IP pública', e);
      }
      
      const clientUserAgent = navigator.userAgent;

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 2. Prepare record data
      const record = {
        id: `ast-${currentUser.id}-${Date.now()}`,
        analystId: currentUser.id,
        analystName: currentUser.name,
        analystEmail: currentUser.email,
        sala: currentUser.sala || 'Sala Comuna',
        type, // 'Entrada' or 'Salida'
        fecha: todayStr,
        horaLocal: timeStr,
        ip: clientIp,
        userAgent: clientUserAgent,
      };

      // 3. Save to Firestore (which will securely inject serverTimestamp)
      await markAttendance(record);
      
      // Update local state temporarily (will be overwritten by loadTodayRecord)
      setTodayRecords(prev => [record, ...(Array.isArray(prev) ? prev : [])]);
      
      if (addLog) {
        addLog(currentUser.email, `Asistencia - ${type}`, `IP: ${clientIp}`, 'info');
      }

      setToastMsg(`✅ ${type} registrada correctamente.`);
      setTimeout(() => setToastMsg(''), 4000);
      
      // We don't need to manually reload, subscription handles it
    } catch (err) {
      console.error(err);
      setToastMsg(`❌ Error al registrar asistencia: ${err.message}`);
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Derivar estado de asistencia del registro más reciente (para soportar turnos que cruzan la medianoche)
  const latestRecord = todayRecords && todayRecords.length > 0 ? todayRecords[0] : null;
  
  let hasEntrada = false;
  let hasSalida = false;

  if (latestRecord) {
    const fallbackTime = parseInt(latestRecord.id?.split('-').pop()) || Date.now();
    const recordTime = latestRecord.serverTime?.toMillis ? latestRecord.serverTime.toMillis() : fallbackTime;
    const hoursSinceLast = (Date.now() - recordTime) / (1000 * 60 * 60);

    if (latestRecord.type === 'Entrada') {
      if (hoursSinceLast < 16) {
        // Turno activo (menos de 16 hrs desde la entrada)
        hasEntrada = true;
        hasSalida = false;
      }
      // Si pasaron >16 hrs, asumimos que olvidó marcar salida, se reinicia para permitir nueva Entrada.
    } else if (latestRecord.type === 'Salida') {
      if (hoursSinceLast < 1) {
        // Acaba de marcar salida (dentro de la última hora). Bloquear ambos botones temporalmente.
        hasEntrada = true;
        hasSalida = true;
      }
      // Si pasó >1 hr desde la salida, puede iniciar un nuevo turno.
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="text-3xl">⏱️</span> Control de Asistencia
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Registra tu entrada y salida del turno de manera segura.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ENTRADA CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-3xl">
            👋
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Registrar Entrada</h2>
          <p className="text-xs text-slate-500 max-w-[200px]">
            Al marcar tu entrada, el sistema capturará automáticamente tu IP y hora del servidor.
          </p>
          <button
            onClick={() => handleMarkAttendance('Entrada')}
            disabled={loading || hasEntrada}
            className={`mt-4 px-8 py-3 rounded-2xl font-bold text-white transition-all shadow-md active:scale-95 ${
              hasEntrada 
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
            }`}
          >
            {loading ? 'Procesando...' : hasEntrada ? 'Entrada Registrada' : 'Marcar Entrada'}
          </button>
        </div>

        {/* SALIDA CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center text-3xl">
            🚪
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Registrar Salida</h2>
          <p className="text-xs text-slate-500 max-w-[200px]">
            No olvides marcar tu salida al finalizar tu turno.
          </p>
          <button
            onClick={() => handleMarkAttendance('Salida')}
            disabled={loading || !hasEntrada || hasSalida}
            className={`mt-4 px-8 py-3 rounded-2xl font-bold text-white transition-all shadow-md active:scale-95 ${
              !hasEntrada || hasSalida
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
            }`}
          >
            {loading ? 'Procesando...' : hasSalida ? 'Salida Registrada' : !hasEntrada ? 'Debes marcar entrada' : 'Marcar Salida'}
          </button>
        </div>
      </div>

      {/* Security Info Panel */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mt-8">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
          🔒 Seguridad y Auditoría
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tu registro de asistencia está protegido mediante auditoría implícita. Para garantizar la veracidad de la asistencia, el sistema recolecta de forma transparente la Dirección IP, detalles del Dispositivo/Navegador (User-Agent) y utiliza el reloj atómico del servidor para evitar la manipulación de la hora local.
        </p>
      </div>
    </div>
  );
}
