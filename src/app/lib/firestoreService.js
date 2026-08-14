import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  where
} from 'firebase/firestore';
import { ref, uploadString, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { INITIAL_USERS, INITIAL_LOGS, INITIAL_MESSAGES } from './constants';
import {
  getStoredUsers,
  saveStoredUsers,
  getStoredSubmissions,
  saveStoredSubmissions,
  getStoredMessages,
  saveStoredMessages,
  getStoredAuditLogs,
  saveStoredAuditLogs,
} from './storage';

/**
 * Helper to safely sanitize objects for Firestore
 * Removes undefined values, custom classes, functions, and prevents invalid nested arrays.
 */
function sanitize(obj) {
  // Pass 1: completely strip out any undefined, functions, or custom classes (like Date)
  // by round-tripping through JSON. This guarantees a 100% plain object tree.
  const plainObj = JSON.parse(JSON.stringify(obj));

  // Pass 2: recursively convert any array-within-array to an object, 
  // because Firestore natively rejects nested arrays.
  function fixNested(val) {
    if (Array.isArray(val)) {
      return val.map((v) => {
        if (Array.isArray(v)) {
          // Convert directly nested array to object map
          const converted = {};
          v.forEach((item, index) => {
            converted[index] = fixNested(item);
          });
          return converted;
        }
        return v !== null && typeof v === 'object' ? fixNested(v) : v;
      });
    } else if (val !== null && typeof val === 'object') {
      const newObj = {};
      for (const key of Object.keys(val)) {
        newObj[key] = fixNested(val[key]);
      }
      return newObj;
    }
    return val;
  }

  return fixNested(plainObj);
}

export async function uploadImageToStorage(fileOrDataUrl, path) {
  if (!fileOrDataUrl) return null;
  // If already hosted URL, return as-is
  if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
    return fileOrDataUrl;
  }
  
  try {
    const storageRef = ref(storage, path);
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      const snapshot = await uploadString(storageRef, fileOrDataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log(`✅ Imagen subida exitosamente a Storage: ${path}`);
      return downloadUrl;
    } else {
      const snapshot = await uploadBytes(storageRef, fileOrDataUrl);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log(`✅ Imagen subida exitosamente a Storage: ${path}`);
      return downloadUrl;
    }
  } catch (error) {
    console.error("❌ Firebase Storage Upload Error:", error);
    throw error;
  }
}

// ----------------------------------------------------
// DIRECT FIRESTORE READ (for login verification)
// This bypasses localStorage and reads directly from Firestore
// to ensure we always have the latest users across browsers
// ----------------------------------------------------
export async function fetchAllUsersFromFirestore() {
  try {
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => d.data());
  } catch (err) {
    console.warn('fetchAllUsersFromFirestore failed:', err);
    return [];
  }
}

// ----------------------------------------------------
// 1. USERS COLLECTION
// ----------------------------------------------------
export function subscribeUsers(onUpdate) {
  try {
    const colRef = collection(db, 'users');
    const unsubscribe = onSnapshot(colRef, async (snapshot) => {
      let remoteUsers = snapshot.empty ? [] : snapshot.docs.map((d) => d.data());

      // Seeding INITIAL_USERS to Firestore if the collection is completely empty
      if (remoteUsers.length === 0) {
        try {
          const batch = writeBatch(db);
          INITIAL_USERS.forEach((user) => {
            const userRef = doc(db, 'users', String(user.id));
            batch.set(userRef, sanitize(user));
          });
          await batch.commit();
          return; // Snapshot listener will refire with seeded data
        } catch (e) {
          console.warn('Failed to seed initial users to Firestore:', e);
        }
      }

      saveStoredUsers(remoteUsers);
      onUpdate(remoteUsers);
    }, (err) => {
      console.warn('Firestore users subscription warning, using local cache:', err);
      const localUsers = getStoredUsers();
      onUpdate(localUsers && localUsers.length > 0 ? localUsers : INITIAL_USERS);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore users init warning, using local cache:', err);
    const localUsers = getStoredUsers();
    onUpdate(localUsers && localUsers.length > 0 ? localUsers : INITIAL_USERS);
    return () => {};
  }
}

export async function saveUserToFirestore(user) {
  if (!user || !user.id) return;
  // 1. IMMEDIATELY update local storage
  const localUsers = getStoredUsers();
  const updatedList = [user, ...localUsers.filter((u) => String(u.id) !== String(user.id))];
  saveStoredUsers(updatedList);

  // 2. Save to Firestore — AWAIT to ensure it's persisted before returning
  try {
    let updatedUser = { ...user };
    if (updatedUser.avatar && typeof updatedUser.avatar === 'string' && updatedUser.avatar.startsWith('data:')) {
      const avatarUrl = await uploadImage(updatedUser.avatar);
      if (avatarUrl) updatedUser.avatar = avatarUrl;
    }
    const userRef = doc(db, 'users', String(user.id));
    await setDoc(userRef, sanitize(updatedUser), { merge: true });
    console.log(`✅ User ${user.username || user.id} saved to Firestore successfully`);
  } catch (err) {
    console.error('❌ Firestore saveUserToFirestore ERROR (saved locally only):', err);
  }
}

export async function deleteUserFromFirestore(userId) {
  if (!userId) return;
  // 1. IMMEDIATELY update local cache
  const localUsers = getStoredUsers();
  const updatedList = localUsers.filter((u) => String(u.id) !== String(userId));
  saveStoredUsers(updatedList);

  try {
    const userRef = doc(db, 'users', String(userId));
    await deleteDoc(userRef);
  } catch (err) {
    console.warn('Error deleting user from Firestore:', err);
  }
}

export async function saveUsersBatchToFirestore(users) {
  if (!users || !users.length) return;
  saveStoredUsers(users);
  try {
    const batch = writeBatch(db);
    users.forEach((u) => {
      const userRef = doc(db, 'users', String(u.id));
      batch.set(userRef, sanitize(u), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Error saving users batch to Firestore:', err);
  }
}

// ----------------------------------------------------
// 2. SUBMISSIONS COLLECTION (Formularios e Imágenes)
// ----------------------------------------------------
export function subscribeSubmissions(onUpdate) {
  try {
    const colRef = collection(db, 'submissions');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(800));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteSubs = snapshot.empty
        ? []
        : snapshot.docs.map((d) => ({
            ...d.data(),
            firestoreId: d.id,
          }));

      // Sort by timestamp or fechaHora descending
      remoteSubs.sort((a, b) => new Date(b.timestamp || b.fechaHora || 0) - new Date(a.timestamp || a.fechaHora || 0));

      saveStoredSubmissions(remoteSubs);
      onUpdate(remoteSubs);
    }, (err) => {
      console.warn('Firestore submissions subscription warning, using local cache:', err);
      const localSubs = getStoredSubmissions();
      onUpdate(localSubs);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore submissions init warning:', err);
    const localSubs = getStoredSubmissions();
    onUpdate(localSubs);
    return () => {};
  }
}

export async function fetchInboxSubmissionsPaginated(lastDoc = null, pageSize = 20) {
  try {
    const colRef = collection(db, 'submissions');
    let q;
    if (lastDoc) {
      q = query(colRef, orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(pageSize));
    } else {
      q = query(colRef, orderBy('timestamp', 'desc'), limit(pageSize));
    }
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { data: [], lastDoc: null };
    }
    
    const remoteSubs = snapshot.docs.map((d) => ({
      ...d.data(),
      firestoreId: d.id,
    }));
    remoteSubs.sort((a, b) => new Date(b.timestamp || b.fechaHora || 0) - new Date(a.timestamp || a.fechaHora || 0));

    return {
      data: remoteSubs,
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (err) {
    console.error('Error fetching paginated submissions:', err);
    return { data: [], lastDoc: null };
  }
}

export async function fetchGlobalStats() {
  try {
    const colRef = collection(db, 'submissions');
    const now = new Date();
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${mo}-${d}`;
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    // Paralelizamos las consultas
    const [
      totalSnap,
      todaySnap,
      weekSnap,
      pendingSnap,
      reviewedSnap,
      repeatedSnap
    ] = await Promise.all([
      getCountFromServer(colRef),
      // Firebase equality over strings is faster for 'today' if we stored a date string. But we store ISO.
      // We will do a >= query for today
      getCountFromServer(query(colRef, where('timestamp', '>=', `${todayStr}T00:00:00.000Z`))),
      getCountFromServer(query(colRef, where('timestamp', '>=', weekStart.toISOString()))),
      getCountFromServer(query(colRef, where('status', '==', 'pendiente'))),
      // We can't do 'IN' operator with getCountFromServer if we have multiple statuses, but we can do it if 'in' is supported.
      getCountFromServer(query(colRef, where('status', 'in', ['revisado', 'reportar']))),
      getCountFromServer(query(colRef, where('status', '==', 'repetido')))
    ]);

    return {
      totalGlobal: totalSnap.data().count,
      todayGlobal: todaySnap.data().count,
      weekGlobal: weekSnap.data().count,
      pendingGlobal: pendingSnap.data().count,
      reviewedGlobal: reviewedSnap.data().count,
      repeatedGlobal: repeatedSnap.data().count,
    };
  } catch (err) {
    console.error('Error fetching global stats:', err);
    return null;
  }
}

export async function fetchAnalystStats(analysts) {
  try {
    const colRef = collection(db, 'submissions');
    const now = new Date();
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${mo}-${d}T00:00:00.000Z`;

    const statsPromises = analysts.map(async (a) => {
      // Due to index limitations we might not be able to combine analystId + status + timestamp easily without composite indexes.
      // If we don't have composite indexes, we can just fetch total and pending by analyst.
      const [total, pending, reviewed, repeated, today] = await Promise.all([
        getCountFromServer(query(colRef, where('analystEmail', '==', a.email))),
        getCountFromServer(query(colRef, where('analystEmail', '==', a.email), where('status', '==', 'pendiente'))),
        getCountFromServer(query(colRef, where('analystEmail', '==', a.email), where('status', 'in', ['revisado', 'reportar']))),
        getCountFromServer(query(colRef, where('analystEmail', '==', a.email), where('status', '==', 'repetido'))),
        getCountFromServer(query(colRef, where('analystEmail', '==', a.email), where('timestamp', '>=', todayStr)))
      ]);

      const defaultEtiqueta = a.salaEtiqueta || (a.salaCodigo ? `${a.salaCodigo} - ${a.name}` : `${a.sala || 'Sala Comuna'} - ${a.name}`);
      return {
        id: a.id,
        username: a.username || '',
        name: a.name,
        email: a.email,
        sala: a.sala || 'Sala Comuna',
        salaCodigo: a.salaCodigo || '',
        salaEtiqueta: defaultEtiqueta,
        total: total.data().count,
        today: today.data().count,
        pending: pending.data().count,
        reviewed: reviewed.data().count,
        repeated: repeated.data().count,
      };
    });

    return await Promise.all(statsPromises);
  } catch (err) {
    console.error('Error fetching analyst stats:', err);
    // Return empty array to prevent crashes if index is missing
    return [];
  }
}

export async function uploadImage(base64Image) {
  if (!base64Image || !base64Image.startsWith('data:')) return base64Image;
  
  try {
    const filename = `uploads/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
    const imageRef = ref(storage, filename);
    await uploadString(imageRef, base64Image, 'data_url');
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error('Error subiendo imagen a Firebase Storage:', error);
    throw new Error('Fallo al subir la imagen a Firebase Storage. ' + error.message);
  }
}

export async function addSubmissionToFirestore(submission) {
  if (!submission || !submission.id) return;
  // 1. IMMEDIATELY update local storage
  const localSubs = getStoredSubmissions();
  const updatedList = [submission, ...localSubs.filter((s) => String(s.id) !== String(submission.id))];
  saveStoredSubmissions(updatedList);

  // 2. Save to Firestore
  try {
    const subId = String(submission.id || `sub-${Date.now()}`);
    let updatedSub = JSON.parse(JSON.stringify(submission));
    // 3. Subir cualquier imagen Base64 a ImgBB
    const imageFields = ['evidenceImageSrc', 'canvasBg', 'finalRender'];
    if (updatedSub.reportData) {
      for (const field of imageFields) {
        if (updatedSub.reportData[field]?.startsWith('data:')) {
          try {
            const imgUrl = await uploadImage(updatedSub.reportData[field]);
            if (imgUrl) {
              updatedSub.reportData[field] = imgUrl; // Reemplazar Base64 con URL
            }
          } catch (err) {
            throw new Error(`Fallo al subir la imagen ${field} a Firebase Storage. ` + (err.message || ''));
          }
        }
      }
    }

    const subRef = doc(db, 'submissions', subId);
    await setDoc(subRef, sanitize(updatedSub), { merge: true });
    
    // Update local with the final sanitized version
    const latestLocal = getStoredSubmissions();
    saveStoredSubmissions([updatedSub, ...latestLocal.filter((s) => String(s.id) !== String(updatedSub.id))]);
    return true;
  } catch (err) {
    console.warn('Firestore addSubmissionToFirestore error:', err);
    throw err;
  }
}

/**
 * Lightweight status-only update — does NOT re-upload images.
 * Use this for markAsReviewed / markAsRepeated / markAsReported
 * to avoid ImgBB timeout issues on heavy HD PNG documents.
 */
export async function updateSubmissionStatus(subId, newStatus) {
  if (!subId || !newStatus) return;
  const now = new Date().toISOString();
  
  // 1. Update local cache immediately
  const localSubs = getStoredSubmissions();
  const updatedLocal = localSubs.map(s =>
    String(s.id) === String(subId) ? { 
      ...s, 
      status: newStatus,
      ...(newStatus === 'reportar' ? { reportedAt: now } : {})
    } : s
  );
  saveStoredSubmissions(updatedLocal);

  // 2. Use updateDoc (partial update) — only touches the status field, no image upload
  try {
    const subRef = doc(db, 'submissions', String(subId));
    const updatePayload = { status: newStatus };
    if (newStatus === 'reportar') {
      updatePayload.reportedAt = now;
    }
    await updateDoc(subRef, updatePayload);
    console.log(`✅ Status de ${subId} actualizado a "${newStatus}" en Firestore`);
  } catch (err) {
    console.error('updateSubmissionStatus error:', err);
    throw err;
  }
}

export async function deleteSubmissionFromFirestore(subId) {
  if (!subId) return;
  const localSubs = getStoredSubmissions();
  const sub = localSubs.find((s) => String(s.id) === String(subId));
  const updatedList = localSubs.filter((s) => String(s.id) !== String(subId));
  saveStoredSubmissions(updatedList);

  try {
    const subRef = doc(db, 'submissions', String(subId));
    await deleteDoc(subRef);
    
    // Also try to delete image if exists from legacy Firestore images
    const imgRef = doc(db, 'submission_images', `img_${subId}`);
    await deleteDoc(imgRef).catch(() => {});
    
    // Delete image from Firebase Storage if evidenceImageId exists
    if (sub?.reportData?.evidenceImageId) {
      try {
        const storageRef = ref(storage, `submissions/${sub.reportData.evidenceImageId}`);
        await deleteObject(storageRef);
      } catch (err) {
        console.warn('Failed to delete image from Firebase Storage:', err);
      }
    }
  } catch (err) {
    console.warn('Firestore deleteSubmissionFromFirestore warning:', err);
  }
}

export async function archiveSubmissionInFirestore(subId) {
  if (!subId) return;
  const localSubs = getStoredSubmissions();
  const sub = localSubs.find((s) => String(s.id) === String(subId));
  if (sub) {
    sub.archived = true;
    saveStoredSubmissions(localSubs);
  }

  try {
    const subRef = doc(db, 'submissions', String(subId));
    await updateDoc(subRef, { 
      archived: true,
      'reportData.evidenceImageSrc': null,
      'reportData.evidenceImageId': null
    });
    
    // Eliminar imagen legacy
    const imgRef = doc(db, 'submission_images', `img_${subId}`);
    await deleteDoc(imgRef).catch(() => {});
    
    // Eliminar imagen de Storage
    if (sub?.reportData?.evidenceImageId) {
      try {
        const storageRef = ref(storage, `submissions/${sub.reportData.evidenceImageId}`);
        await deleteObject(storageRef);
      } catch (err) {
        console.warn('Failed to delete image from Firebase Storage:', err);
      }
    }
  } catch (err) {
    console.warn('Firestore archiveSubmissionInFirestore warning:', err);
  }
}

export async function getSubmissionImage(imageId) {
  try {
    const imgRef = doc(db, 'submission_images', imageId);
    const snap = await getDoc(imgRef);
    if (snap.exists()) {
      return snap.data().evidenceImageSrc;
    }
  } catch (e) {
    console.error('Error fetching image:', e);
  }
  return null;
}

// ----------------------------------------------------
// 3. MESSAGES COLLECTION (Chat e Imágenes adjuntas)
// ----------------------------------------------------
export function subscribeMessages(onUpdate) {
  try {
    const colRef = collection(db, 'messages');
    // Messages use 'fecha' as their timestamp field
    const q = query(colRef, orderBy('fecha', 'asc'), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteMsgs = snapshot.empty ? [] : snapshot.docs.map((d) => ({
        ...d.data(),
        firestoreId: d.id,
      }));

      saveStoredMessages(remoteMsgs);
      onUpdate(remoteMsgs);
    }, (err) => {
      console.warn('Firestore messages subscription warning, falling back to local cache:', err);
      const localMsgs = getStoredMessages();
      onUpdate(localMsgs);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore messages init warning:', err);
    const localMsgs = getStoredMessages();
    onUpdate(localMsgs);
    return () => {};
  }
}

export async function addMessageToFirestore(message) {
  if (!message || !message.id) return;

  // Save to local cache immediately (optimistic)
  const localMsgs = getStoredMessages();
  const exists = localMsgs.some((m) => String(m.id) === String(message.id));
  if (!exists) saveStoredMessages([...localMsgs, message]);

  try {
    const msgId = String(message.id);
    let updatedMsg = JSON.parse(JSON.stringify(message));
    // Ensure 'fecha' is always set (it is our ordering field)
    if (!updatedMsg.fecha) updatedMsg.fecha = new Date().toISOString();

    // If image is base64, save a placeholder first then upload async
    let initialMsg = { ...updatedMsg };
    if (initialMsg.imagen && typeof initialMsg.imagen === 'string' && initialMsg.imagen.startsWith('data:')) {
      initialMsg = { ...initialMsg, imagen: '__pending_upload__' };
    }

    const msgRef = doc(db, 'messages', msgId);
    await setDoc(msgRef, sanitize(initialMsg), { merge: true });
    console.log(`✅ Mensaje ${msgId} guardado en Firestore`);

    // Upload image asynchronously if present
    if (updatedMsg.imagen && typeof updatedMsg.imagen === 'string' && updatedMsg.imagen.startsWith('data:')) {
      uploadImage(updatedMsg.imagen)
        .then(async (imgUrl) => {
          if (imgUrl) {
            updatedMsg.imagen = imgUrl;
            await setDoc(msgRef, sanitize(updatedMsg), { merge: true });
          }
        })
        .catch((err) => console.warn('Message image upload failed:', err));
    }
  } catch (err) {
    console.error('❌ Error adding message to Firestore:', err);
    throw err;
  }
}

/**
 * Update specific fields of a message in Firestore
 * Called as: updateMessageInFirestore(messageId, { leido: true })
 */
export async function updateMessageInFirestore(messageId, fieldsToUpdate) {
  if (!messageId) return;
  
  // Update local cache
  const localMsgs = getStoredMessages();
  const updatedMsgs = localMsgs.map((m) => {
    if (String(m.id) === String(messageId)) {
      return { ...m, ...fieldsToUpdate };
    }
    return m;
  });
  saveStoredMessages(updatedMsgs);

  // Update Firestore — merge fields into existing document
  try {
    const msgRef = doc(db, 'messages', String(messageId));
    await setDoc(msgRef, sanitize(fieldsToUpdate), { merge: true });
  } catch (err) {
    console.warn('Error updating message in Firestore:', err);
  }
}

// ----------------------------------------------------
// 4. AUDIT LOGS COLLECTION
// ----------------------------------------------------
export function subscribeAuditLogs(onUpdate) {
  try {
    const colRef = collection(db, 'audit_logs');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteLogs = snapshot.empty ? [] : snapshot.docs.map((d) => d.data());

      remoteLogs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      saveStoredAuditLogs(remoteLogs);
      onUpdate(remoteLogs);
    }, (err) => {
      console.warn('Firestore audit logs subscription warning, using local cache:', err);
      const localLogs = getStoredAuditLogs();
      onUpdate(localLogs);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore audit logs init warning:', err);
    const localLogs = getStoredAuditLogs();
    onUpdate(localLogs);
    return () => {};
  }
}

export async function addAuditLogToFirestore(logItem) {
  if (!logItem || !logItem.id) return;
  const localLogs = getStoredAuditLogs();
  saveStoredAuditLogs([logItem, ...localLogs]);

  try {
    const logId = String(logItem.id || `log-${Date.now()}`);
    const logRef = doc(db, 'audit_logs', logId);
    await setDoc(logRef, sanitize(logItem), { merge: true });
  } catch (err) {
    console.warn('Error adding audit log to Firestore:', err);
  }
}

// ----------------------------------------------------
// 5. SHIFT REPORTS (Historial de Turnos)
// ----------------------------------------------------

export function subscribeShiftReports(onUpdate) {
  try {
    const colRef = collection(db, 'reportes_turnos');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports = snapshot.empty ? [] : snapshot.docs.map((d) => d.data());
      // Local fallback sorting just in case
      reports.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      onUpdate(reports);
    }, (err) => {
      console.warn('Firestore shift reports subscription error:', err);
      onUpdate([]);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore shift reports init error:', err);
    onUpdate([]);
    return () => {};
  }
}

export async function addShiftReportRecord(record) {
  if (!record || !record.id) return;
  try {
    const recordId = String(record.id);
    const docRef = doc(db, 'reportes_turnos', recordId);
    await setDoc(docRef, sanitize(record), { merge: true });
  } catch (err) {
    console.warn('Error adding shift report record to Firestore:', err);
  }
}

export async function deleteShiftReportRecord(recordId) {
  if (!recordId) return;
  try {
    const docRef = doc(db, 'reportes_turnos', String(recordId));
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Error deleting shift report record from Firestore:', err);
    throw err;
  }
}

// ----------------------------------------------------
// 6. BORRADORES DE REPORTE DE TURNO
// Permite guardar y recuperar el estado del formulario
// de reporte de turno por (fecha + turno).
// Colección: borradores_turnos
// ID del doc: reporte_{fecha}_{turno}  (ej: reporte_2026-08-07_t1)
// ----------------------------------------------------

export async function saveShiftReportDraft(draft) {
  if (!draft || !draft.fecha || !draft.turno) return;
  try {
    const docId = `reporte_${draft.fecha}_${draft.turno}`;
    const docRef = doc(db, 'borradores_turnos', docId);
    await setDoc(docRef, sanitize({ ...draft, id: docId }), { merge: true });
  } catch (err) {
    console.warn('Error guardando borrador de reporte de turno:', err);
    throw err;
  }
}

export async function getShiftReportDraft(fecha, turno) {
  if (!fecha || !turno) return null;
  try {
    const docId = `reporte_${fecha}_${turno}`;
    const docRef = doc(db, 'borradores_turnos', docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error("Error al obtener borrador:", error);
    return null;
  }
}

export function subscribeShiftReportDraft(fecha, turno, onUpdate) {
  if (!fecha || !turno) {
    onUpdate(null);
    return () => {};
  }
  try {
    const docId = `reporte_${fecha}_${turno}`;
    const docRef = doc(db, 'borradores_turnos', docId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      } else {
        onUpdate(null);
      }
    }, (err) => {
      console.warn('Error escuchando borrador de turno:', err);
      onUpdate(null);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Error iniciando suscripción de borrador de turno:', err);
    onUpdate(null);
    return () => {};
  }
}
