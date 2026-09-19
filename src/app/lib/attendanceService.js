import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocs,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function getVenezuelaDateString() {
  const options = { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit' };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(new Date());
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${year}-${month}-${day}`;
}

export function getVenezuelaTimeString() {
  const options = { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: false };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(new Date());
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  return `${hour}:${minute}`;
}

// ==========================================
// PLANILLAS SEMANALES (Weekly Schedules)
// ==========================================

export function subscribeWeeklySchedules(onUpdate) {
  try {
    const colRef = collection(db, 'planillas_semanales');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const remoteSchedules = snapshot.empty ? [] : snapshot.docs.map((d) => d.data());
      onUpdate(remoteSchedules);
    }, (err) => {
      console.warn('Firestore weekly schedules subscription error:', err);
      onUpdate([]);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore weekly schedules init error:', err);
    onUpdate([]);
    return () => {};
  }
}

export async function saveWeeklySchedule(schedule) {
  if (!schedule || !schedule.id) return;
  try {
    const docRef = doc(db, 'planillas_semanales', String(schedule.id));
    await setDoc(docRef, schedule, { merge: true });
    console.log(`✅ Planilla semanal ${schedule.id} guardada exitosamente`);
  } catch (err) {
    console.error('❌ Error guardando planilla semanal:', err);
    throw err;
  }
}

export async function getWeeklyScheduleForDate(dateStr) {
  // Finds the weekly schedule that contains a specific date
  // Since we don't have complex querying, we can fetch all and filter in memory
  // Not heavily optimized but sufficient for standard scale
  try {
    const colRef = collection(db, 'planillas_semanales');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return null;
    
    const schedules = snapshot.docs.map(d => d.data());
    // Assume schedule has a 'days' array with 'date' strings
    for (const sch of schedules) {
      if (sch.days && sch.days.some(d => d.date === dateStr)) {
        return sch;
      }
    }
    return null;
  } catch (err) {
    console.error('Error fetching weekly schedule for date:', err);
    return null;
  }
}

// ==========================================
// ASISTENCIAS (Attendance)
// ==========================================

export function subscribeAttendance(dateStr, onUpdate) {
  try {
    const colRef = collection(db, 'asistencias');
    let q;
    if (dateStr) {
      q = query(colRef, where('fecha', '==', dateStr));
    } else {
      q = query(colRef, limit(300));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let remoteAttendance = snapshot.empty ? [] : snapshot.docs.map((d) => ({
        ...d.data(),
        serverTimeObj: d.data().serverTime?.toDate ? d.data().serverTime.toDate() : null
      }));
      
      // Ordenar en memoria por fecha y hora local como alternativa segura
      remoteAttendance.sort((a, b) => {
        const timeA = a.serverTimeObj ? a.serverTimeObj.getTime() : 0;
        const timeB = b.serverTimeObj ? b.serverTimeObj.getTime() : 0;
        return timeB - timeA;
      });

      onUpdate(remoteAttendance);
    }, (err) => {
      console.warn('Firestore attendance subscription error:', err);
      onUpdate([]);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore attendance init error:', err);
    onUpdate([]);
    return () => {};
  }
}

export async function markAttendance(record) {
  if (!record || !record.id) return;
  try {
    const docRef = doc(db, 'asistencias', String(record.id));
    
    // Inject server timestamp unconditionally for security
    const secureRecord = {
      ...record,
      serverTime: serverTimestamp()
    };
    
    await setDoc(docRef, secureRecord, { merge: true });
    console.log(`✅ Asistencia ${record.id} marcada exitosamente`);
  } catch (err) {
    console.error('❌ Error marcando asistencia:', err);
    throw err;
  }
}

export async function deleteAttendance(recordId) {
  if (!recordId) return;
  try {
    const docRef = doc(db, 'asistencias', String(recordId));
    await deleteDoc(docRef);
    console.log(`✅ Asistencia ${recordId} eliminada`);
  } catch (err) {
    console.error('❌ Error eliminando asistencia:', err);
    throw err;
  }
}

// Fetch a user's latest attendance record for today to see if they are clocked in
export async function getTodayAttendanceForUser(userId) {
  try {
    const colRef = collection(db, 'asistencias');
    const todayStr = getVenezuelaDateString();
    
    const q = query(
      colRef, 
      where('analystId', '==', userId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return [];

    // Filtrar y ordenar en memoria para evitar errores de índice compuesto en Firebase
    const todayRecords = snapshot.docs
      .map(d => d.data())
      .filter(d => d.fecha === todayStr)
      .sort((a, b) => {
        const timeA = a.serverTime?.toMillis ? a.serverTime.toMillis() : Date.now();
        const timeB = b.serverTime?.toMillis ? b.serverTime.toMillis() : Date.now();
        return timeB - timeA; // Descending
      });
      
    return todayRecords; // Return all records for today
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    return [];
  }
}

// Subscribe to a user's today attendance records to react to deletions
export function subscribeTodayAttendanceForUser(userId, onUpdate) {
  try {
    const colRef = collection(db, 'asistencias');
    const todayStr = getVenezuelaDateString();
    
    const q = query(
      colRef, 
      where('analystId', '==', userId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }
      const todayRecords = snapshot.docs
        .map(d => d.data())
        .sort((a, b) => {
          // Fallback to timestamp in ID if serverTime is null (e.g. pending local write)
          const fallbackTimeA = parseInt(a.id?.split('-').pop()) || Date.now();
          const fallbackTimeB = parseInt(b.id?.split('-').pop()) || Date.now();
          const timeA = a.serverTime?.toMillis ? a.serverTime.toMillis() : fallbackTimeA;
          const timeB = b.serverTime?.toMillis ? b.serverTime.toMillis() : fallbackTimeB;
          return timeB - timeA;
        })
        .slice(0, 10); // Return the 10 most recent records
      onUpdate(todayRecords);
    }, (err) => {
      console.error('Error subscribing today attendance:', err);
      onUpdate([]);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error init today attendance sub:', error);
    onUpdate([]);
    return () => {};
  }
}
