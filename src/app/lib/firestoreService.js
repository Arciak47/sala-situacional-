import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
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
 * Helper to safely sanitize objects for Firestore (remove undefined values)
 */
function sanitize(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Upload an image (data URL or File object) to Firebase Storage
 * Returns the public HTTP download URL
 */
export async function uploadImageToStorage(fileOrDataUrl, path) {
  if (!fileOrDataUrl) return null;
  // If already hosted URL, return as-is
  if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
    return fileOrDataUrl;
  }
  try {
    const storageRef = ref(storage, path);
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      await uploadString(storageRef, fileOrDataUrl, 'data_url');
    } else if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
      await uploadBytes(storageRef, fileOrDataUrl);
    } else {
      return fileOrDataUrl;
    }
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (err) {
    console.warn('Firebase Storage upload warning (falling back to data string):', err);
    return fileOrDataUrl;
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
      const localUsers = getStoredUsers() || [];
      const remoteUsers = snapshot.empty ? [] : snapshot.docs.map((d) => d.data());

      // MERGE: local-first, then overlay remote data (remote wins on conflict)
      const userMap = new Map();
      
      // 1. Start with INITIAL_USERS as baseline
      INITIAL_USERS.forEach((u) => {
        if (u && u.id) userMap.set(String(u.id), u);
      });
      
      // 2. Layer local users on top
      localUsers.forEach((u) => {
        if (u && u.id) userMap.set(String(u.id), u);
      });
      
      // 3. Layer remote users on top (remote is latest truth for cross-browser)
      remoteUsers.forEach((u) => {
        if (u && u.id) userMap.set(String(u.id), u);
      });

      const merged = Array.from(userMap.values());

      saveStoredUsers(merged);
      onUpdate(merged);

      // Auto-sync local-only users to Firestore
      if (remoteUsers.length < merged.length) {
        const remoteIds = new Set(remoteUsers.map((u) => String(u.id)));
        const localOnly = merged.filter((u) => !remoteIds.has(String(u.id)));
        if (localOnly.length > 0) {
          try {
            const batch = writeBatch(db);
            localOnly.forEach((user) => {
              const userRef = doc(db, 'users', String(user.id));
              batch.set(userRef, sanitize(user), { merge: true });
            });
            await batch.commit();
          } catch (e) {
            console.warn('Firestore sync users warning:', e);
          }
        }
      }
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
      const avatarUrl = await uploadImageToStorage(updatedUser.avatar, `avatars/${user.id}_${Date.now()}`);
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
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const localSubs = getStoredSubmissions() || [];
      const remoteSubs = snapshot.empty
        ? []
        : snapshot.docs.map((d) => ({
            ...d.data(),
            firestoreId: d.id,
          }));

      // MERGE: Local-first strategy. Local submissions that don't exist
      // remotely yet (race condition during upload) are preserved.
      const subMap = new Map();
      // 1. Start with local submissions (preserves pending ones)
      localSubs.forEach((s) => {
        if (s && s.id) subMap.set(String(s.id), s);
      });
      // 2. Remote wins for docs that exist in both (they have the latest Firestore state)
      remoteSubs.forEach((s) => {
        if (s && s.id) subMap.set(String(s.id), s);
      });

      const merged = Array.from(subMap.values());
      merged.sort((a, b) => new Date(b.timestamp || b.fechaHora || 0) - new Date(a.timestamp || a.fechaHora || 0));

      saveStoredSubmissions(merged);
      onUpdate(merged);
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

export async function addSubmissionToFirestore(submission) {
  if (!submission || !submission.id) return;
  // 1. IMMEDIATELY update local storage
  const localSubs = getStoredSubmissions();
  const updatedList = [submission, ...localSubs.filter((s) => String(s.id) !== String(submission.id))];
  saveStoredSubmissions(updatedList);

  // 2. Then save to Firestore in background
  try {
    const subId = String(submission.id || `sub-${Date.now()}`);
    let updatedSub = JSON.parse(JSON.stringify(submission));

    // Upload base64 evidence image to Firebase Storage
    if (updatedSub.reportData?.evidenceImageSrc && updatedSub.reportData.evidenceImageSrc.startsWith('data:')) {
      const imgUrl = await uploadImageToStorage(
        updatedSub.reportData.evidenceImageSrc, 
        `reports/evidence_${subId}_${Date.now()}`
      );
      if (imgUrl) {
        updatedSub.reportData.evidenceImageSrc = imgUrl;
      }
    }

    // Don't send the localStorage placeholder to Firestore
    if (updatedSub.reportData?.evidenceImageSrc === '__pending_upload__') {
      delete updatedSub.reportData.evidenceImageSrc;
    }

    const subRef = doc(db, 'submissions', subId);
    await setDoc(subRef, sanitize(updatedSub), { merge: true });

    const latestLocal = getStoredSubmissions();
    saveStoredSubmissions([updatedSub, ...latestLocal.filter((s) => String(s.id) !== String(updatedSub.id))]);
  } catch (err) {
    console.warn('Firestore addSubmissionToFirestore warning (saved locally):', err);
  }
}

export async function deleteSubmissionFromFirestore(subId) {
  if (!subId) return;
  const localSubs = getStoredSubmissions();
  const updatedList = localSubs.filter((s) => String(s.id) !== String(subId));
  saveStoredSubmissions(updatedList);

  try {
    const subRef = doc(db, 'submissions', String(subId));
    await deleteDoc(subRef);
  } catch (err) {
    console.warn('Error deleting submission from Firestore:', err);
  }
}

// ----------------------------------------------------
// 3. MESSAGES COLLECTION (Chat e Imágenes adjuntas)
// ----------------------------------------------------
export function subscribeMessages(onUpdate) {
  try {
    const colRef = collection(db, 'messages');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const localMsgs = getStoredMessages() || [];
      const remoteMsgs = snapshot.empty ? [] : snapshot.docs.map((d) => ({
        ...d.data(),
        firestoreId: d.id,
      }));

      const msgMap = new Map();
      localMsgs.forEach((m) => { if (m && m.id) msgMap.set(String(m.id), m); });
      remoteMsgs.forEach((m) => { if (m && m.id) msgMap.set(String(m.id), m); });

      const merged = Array.from(msgMap.values());
      merged.sort((a, b) => new Date(a.fecha || a.timestamp || 0) - new Date(b.fecha || b.timestamp || 0));

      saveStoredMessages(merged);
      onUpdate(merged);
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
  const localMsgs = getStoredMessages();
  saveStoredMessages([...localMsgs, message]);

  try {
    const msgId = String(message.id || `msg-${Date.now()}`);
    let updatedMsg = JSON.parse(JSON.stringify(message));

    if (updatedMsg.imagen && typeof updatedMsg.imagen === 'string' && updatedMsg.imagen.startsWith('data:')) {
      const imgUrl = await uploadImageToStorage(
        updatedMsg.imagen,
        `messages/chat_${msgId}_${Date.now()}`
      );
      if (imgUrl) updatedMsg.imagen = imgUrl;
    }

    const msgRef = doc(db, 'messages', msgId);
    await setDoc(msgRef, sanitize(updatedMsg), { merge: true });
  } catch (err) {
    console.warn('Error adding message to Firestore:', err);
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
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const localLogs = getStoredAuditLogs() || [];
      const remoteLogs = snapshot.empty ? [] : snapshot.docs.map((d) => d.data());

      const logMap = new Map();
      localLogs.forEach((l) => { if (l && l.id) logMap.set(String(l.id), l); });
      remoteLogs.forEach((l) => { if (l && l.id) logMap.set(String(l.id), l); });

      const merged = Array.from(logMap.values());
      merged.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      saveStoredAuditLogs(merged);
      onUpdate(merged);
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
