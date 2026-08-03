import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { INITIAL_USERS, INITIAL_LOGS, INITIAL_MESSAGES } from './constants';

/**
 * Helper to safely sanitize objects for Firestore (remove undefined values)
 */
function sanitize(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ----------------------------------------------------
// 1. USERS COLLECTION
// ----------------------------------------------------
export function subscribeUsers(onUpdate) {
  try {
    const colRef = collection(db, 'users');
    const unsubscribe = onSnapshot(colRef, async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial users if collection is empty
        try {
          const batch = writeBatch(db);
          INITIAL_USERS.forEach((user) => {
            const userRef = doc(db, 'users', String(user.id));
            batch.set(userRef, sanitize(user));
          });
          await batch.commit();
        } catch (e) {
          console.warn('Firestore seed users warning:', e);
        }
        onUpdate(INITIAL_USERS);
      } else {
        const users = snapshot.docs.map((d) => d.data());
        onUpdate(users);
      }
    }, (err) => {
      console.warn('Firestore users subscription error:', err);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore users init error:', err);
    return () => {};
  }
}

export async function saveUserToFirestore(user) {
  if (!user || !user.id) return;
  try {
    const userRef = doc(db, 'users', String(user.id));
    await setDoc(userRef, sanitize(user), { merge: true });
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
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
  } catch (err) {
    console.error('Error saving users batch to Firestore:', err);
  }
}

// ----------------------------------------------------
// 2. SUBMISSIONS COLLECTION
// ----------------------------------------------------
export function subscribeSubmissions(onUpdate) {
  try {
    const colRef = collection(db, 'submissions');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const submissions = snapshot.docs.map((d) => ({
        ...d.data(),
        firestoreId: d.id,
      }));
      // Sort by id / date descending
      submissions.sort((a, b) => new Date(b.fechaHora || b.fecha || 0) - new Date(a.fechaHora || a.fecha || 0));
      onUpdate(submissions);
    }, (err) => {
      console.warn('Firestore submissions subscription error:', err);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore submissions init error:', err);
    return () => {};
  }
}

export async function addSubmissionToFirestore(submission) {
  try {
    const subRef = doc(db, 'submissions', String(submission.id || `sub-${Date.now()}`));
    await setDoc(subRef, sanitize(submission), { merge: true });
  } catch (err) {
    console.error('Error adding submission to Firestore:', err);
  }
}

// ----------------------------------------------------
// 3. MESSAGES COLLECTION
// ----------------------------------------------------
export function subscribeMessages(onUpdate) {
  try {
    const colRef = collection(db, 'messages');
    const unsubscribe = onSnapshot(colRef, async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial messages if empty
        try {
          const batch = writeBatch(db);
          INITIAL_MESSAGES.forEach((msg) => {
            const msgRef = doc(db, 'messages', String(msg.id));
            batch.set(msgRef, sanitize(msg));
          });
          await batch.commit();
        } catch (e) {
          console.warn('Firestore seed messages warning:', e);
        }
        onUpdate(INITIAL_MESSAGES);
      } else {
        const msgs = snapshot.docs.map((d) => d.data());
        // Sort chronologically by timestamp
        msgs.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
        onUpdate(msgs);
      }
    }, (err) => {
      console.warn('Firestore messages subscription error:', err);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore messages init error:', err);
    return () => {};
  }
}

export async function addMessageToFirestore(message) {
  try {
    const msgRef = doc(db, 'messages', String(message.id || `msg-${Date.now()}`));
    await setDoc(msgRef, sanitize(message), { merge: true });
  } catch (err) {
    console.error('Error adding message to Firestore:', err);
  }
}

export async function updateMessageInFirestore(msgId, updates) {
  try {
    const msgRef = doc(db, 'messages', String(msgId));
    await setDoc(msgRef, sanitize(updates), { merge: true });
  } catch (err) {
    console.error('Error updating message in Firestore:', err);
  }
}

// ----------------------------------------------------
// 4. AUDIT LOGS COLLECTION
// ----------------------------------------------------
export function subscribeAuditLogs(onUpdate) {
  try {
    const colRef = collection(db, 'auditLogs');
    const unsubscribe = onSnapshot(colRef, async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial logs if empty
        try {
          const batch = writeBatch(db);
          INITIAL_LOGS.forEach((log) => {
            const logRef = doc(db, 'auditLogs', String(log.id));
            batch.set(logRef, sanitize(log));
          });
          await batch.commit();
        } catch (e) {
          console.warn('Firestore seed logs warning:', e);
        }
        onUpdate(INITIAL_LOGS);
      } else {
        const logs = snapshot.docs.map((d) => d.data());
        // Sort by id descending
        logs.sort((a, b) => (b.id > a.id ? 1 : -1));
        onUpdate(logs);
      }
    }, (err) => {
      console.warn('Firestore audit logs subscription error:', err);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore audit logs init error:', err);
    return () => {};
  }
}

export async function addAuditLogToFirestore(logItem) {
  try {
    const logRef = doc(db, 'auditLogs', String(logItem.id || `log-${Date.now()}`));
    await setDoc(logRef, sanitize(logItem), { merge: true });
  } catch (err) {
    console.error('Error adding audit log to Firestore:', err);
  }
}
