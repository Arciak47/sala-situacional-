import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  writeBatch 
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
// 1. USERS COLLECTION
// ----------------------------------------------------
export function subscribeUsers(onUpdate) {
  try {
    const colRef = collection(db, 'users');
    const unsubscribe = onSnapshot(colRef, async (snapshot) => {
      if (snapshot.empty) {
        // Seed users: check local storage first to preserve any user-created accounts!
        const localUsers = getStoredUsers();
        const usersToSeed = (localUsers && localUsers.length > 0) ? localUsers : INITIAL_USERS;
        try {
          const batch = writeBatch(db);
          usersToSeed.forEach((user) => {
            const userRef = doc(db, 'users', String(user.id));
            batch.set(userRef, sanitize(user));
          });
          await batch.commit();
        } catch (e) {
          console.warn('Firestore seed users warning:', e);
        }
        saveStoredUsers(usersToSeed);
        onUpdate(usersToSeed);
      } else {
        const users = snapshot.docs.map((d) => d.data());
        saveStoredUsers(users);
        onUpdate(users);
      }
    }, (err) => {
      console.warn('Firestore users subscription error, falling back to local cache:', err);
      const localUsers = getStoredUsers();
      if (localUsers && localUsers.length > 0) onUpdate(localUsers);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore users init error, using local cache:', err);
    const localUsers = getStoredUsers();
    if (localUsers && localUsers.length > 0) onUpdate(localUsers);
    return () => {};
  }
}

export async function saveUserToFirestore(user) {
  if (!user || !user.id) return;
  try {
    let updatedUser = { ...user };
    if (updatedUser.avatar && updatedUser.avatar.startsWith('data:')) {
      const avatarUrl = await uploadImageToStorage(updatedUser.avatar, `avatars/${user.id}_${Date.now()}`);
      if (avatarUrl) updatedUser.avatar = avatarUrl;
    }
    const userRef = doc(db, 'users', String(user.id));
    await setDoc(userRef, sanitize(updatedUser), { merge: true });

    // Instantly update local cache
    const localUsers = getStoredUsers();
    const existingIdx = localUsers.findIndex((u) => u.id === user.id);
    let updatedList;
    if (existingIdx >= 0) {
      updatedList = localUsers.map((u) => (u.id === user.id ? updatedUser : u));
    } else {
      updatedList = [updatedUser, ...localUsers];
    }
    saveStoredUsers(updatedList);
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
  }
}

export async function deleteUserFromFirestore(userId) {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', String(userId));
    await deleteDoc(userRef);

    // Update local cache
    const localUsers = getStoredUsers();
    const updatedList = localUsers.filter((u) => u.id !== userId);
    saveStoredUsers(updatedList);
  } catch (err) {
    console.error('Error deleting user from Firestore:', err);
  }
}

export async function saveUsersBatchToFirestore(users) {
  if (!users || !users.length) return;
  try {
    const batch = writeBatch(db);
    users.forEach((u) => {
      const userRef = doc(db, 'users', String(u.id));
      batch.set(userRef, sanitize(u), { merge: true });
    });
    await batch.commit();
    saveStoredUsers(users);
  } catch (err) {
    console.error('Error saving users batch to Firestore:', err);
  }
}

// ----------------------------------------------------
// 2. SUBMISSIONS COLLECTION (Formularios e Imágenes)
// ----------------------------------------------------
export function subscribeSubmissions(onUpdate) {
  try {
    const colRef = collection(db, 'submissions');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const submissions = snapshot.docs.map((d) => ({
        ...d.data(),
        firestoreId: d.id,
      }));
      submissions.sort((a, b) => new Date(b.timestamp || b.fechaHora || 0) - new Date(a.timestamp || a.fechaHora || 0));
      saveStoredSubmissions(submissions);
      onUpdate(submissions);
    }, (err) => {
      console.warn('Firestore submissions subscription error, falling back to local cache:', err);
      const localSubs = getStoredSubmissions();
      onUpdate(localSubs);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore submissions init error:', err);
    const localSubs = getStoredSubmissions();
    onUpdate(localSubs);
    return () => {};
  }
}

export async function addSubmissionToFirestore(submission) {
  try {
    const subId = String(submission.id || `sub-${Date.now()}`);
    let updatedSub = JSON.parse(JSON.stringify(submission));

    if (updatedSub.reportData?.evidenceImageSrc && updatedSub.reportData.evidenceImageSrc.startsWith('data:')) {
      const imgUrl = await uploadImageToStorage(
        updatedSub.reportData.evidenceImageSrc, 
        `reports/evidence_${subId}_${Date.now()}`
      );
      if (imgUrl) {
        updatedSub.reportData.evidenceImageSrc = imgUrl;
      }
    }

    const subRef = doc(db, 'submissions', subId);
    await setDoc(subRef, sanitize(updatedSub), { merge: true });

    // Update local cache
    const localSubs = getStoredSubmissions();
    const updatedList = [updatedSub, ...localSubs.filter((s) => s.id !== updatedSub.id)];
    saveStoredSubmissions(updatedList);
  } catch (err) {
    console.error('Error adding submission to Firestore:', err);
  }
}

export async function deleteSubmissionFromFirestore(subId) {
  if (!subId) return;
  try {
    const subRef = doc(db, 'submissions', String(subId));
    await deleteDoc(subRef);

    const localSubs = getStoredSubmissions();
    const updatedList = localSubs.filter((s) => s.id !== subId);
    saveStoredSubmissions(updatedList);
  } catch (err) {
    console.error('Error deleting submission from Firestore:', err);
  }
}

// ----------------------------------------------------
// 3. MESSAGES COLLECTION (Chat e Imágenes adjuntas)
// ----------------------------------------------------
export function subscribeMessages(onUpdate) {
  try {
    const colRef = collection(db, 'messages');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const messages = snapshot.docs.map((d) => ({
        ...d.data(),
        firestoreId: d.id,
      }));
      messages.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
      saveStoredMessages(messages);
      onUpdate(messages);
    }, (err) => {
      console.warn('Firestore messages subscription error, falling back to local cache:', err);
      const localMsgs = getStoredMessages();
      onUpdate(localMsgs);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore messages init error:', err);
    const localMsgs = getStoredMessages();
    onUpdate(localMsgs);
    return () => {};
  }
}

export async function addMessageToFirestore(message) {
  try {
    const msgId = String(message.id || `msg-${Date.now()}`);
    let updatedMsg = JSON.parse(JSON.stringify(message));

    if (updatedMsg.adjunto && updatedMsg.adjunto.startsWith('data:')) {
      const imgUrl = await uploadImageToStorage(
        updatedMsg.adjunto,
        `messages/chat_${msgId}_${Date.now()}`
      );
      if (imgUrl) updatedMsg.adjunto = imgUrl;
    }

    const msgRef = doc(db, 'messages', msgId);
    await setDoc(msgRef, sanitize(updatedMsg), { merge: true });

    const localMsgs = getStoredMessages();
    const updatedList = [...localMsgs, updatedMsg];
    saveStoredMessages(updatedList);
  } catch (err) {
    console.error('Error adding message to Firestore:', err);
  }
}

export async function updateMessageInFirestore(message) {
  if (!message || !message.id) return;
  try {
    const msgRef = doc(db, 'messages', String(message.id));
    await setDoc(msgRef, sanitize(message), { merge: true });

    const localMsgs = getStoredMessages();
    const updatedList = localMsgs.map((m) => (m.id === message.id ? message : m));
    saveStoredMessages(updatedList);
  } catch (err) {
    console.error('Error updating message in Firestore:', err);
  }
}

// ----------------------------------------------------
// 4. AUDIT LOGS COLLECTION
// ----------------------------------------------------
export function subscribeAuditLogs(onUpdate) {
  try {
    const colRef = collection(db, 'audit_logs');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        onUpdate(INITIAL_LOGS);
      } else {
        const logs = snapshot.docs.map((d) => d.data());
        logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        saveStoredAuditLogs(logs);
        onUpdate(logs);
      }
    }, (err) => {
      console.warn('Firestore audit logs subscription error, using local cache:', err);
      const localLogs = getStoredAuditLogs();
      onUpdate(localLogs);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore audit logs init error:', err);
    const localLogs = getStoredAuditLogs();
    onUpdate(localLogs);
    return () => {};
  }
}

export async function addAuditLogToFirestore(logItem) {
  try {
    const logId = String(logItem.id || `log-${Date.now()}`);
    const logRef = doc(db, 'audit_logs', logId);
    await setDoc(logRef, sanitize(logItem), { merge: true });

    const localLogs = getStoredAuditLogs();
    const updatedList = [logItem, ...localLogs];
    saveStoredAuditLogs(updatedList);
  } catch (err) {
    console.error('Error adding audit log to Firestore:', err);
  }
}
