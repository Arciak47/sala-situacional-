import { INITIAL_USERS, INITIAL_LOGS, INITIAL_MESSAGES } from './constants';

export function initializeStorage() {
  if (typeof window === 'undefined') return;
  
  const currentVersion = 'sdm-v12-fast-mobile';
  const savedVersion = localStorage.getItem('sdm_version');
  
  if (savedVersion !== currentVersion) {
    // Clear out legacy local storage caches and active session
    localStorage.removeItem('sdm_users');
    localStorage.removeItem('sdm_session');
    localStorage.removeItem('sdm_submissions');
    localStorage.removeItem('sdm_messages');
    localStorage.removeItem('sdm_audit');
    localStorage.setItem('sdm_version', currentVersion);
    
    // Force reload to clear memory state and apply changes cleanly
    window.location.reload();
  }
}

export function getStoredUsers() {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const u = localStorage.getItem('sdm_users');
    return u ? JSON.parse(u) : INITIAL_USERS;
  } catch (e) {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users) {
  if (typeof window === 'undefined') return;
  if (Array.isArray(users)) {
    localStorage.setItem('sdm_users', JSON.stringify(users));
  }
}

export function getStoredSession() {
  if (typeof window === 'undefined') return null;
  try {
    const sess = localStorage.getItem('sdm_session');
    return sess ? JSON.parse(sess) : null;
  } catch (e) {
    return null;
  }
}

export function saveStoredSession(user) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('sdm_session', JSON.stringify(user));
  } else {
    localStorage.removeItem('sdm_session');
  }
}

export function getStoredAuditLogs() {
  if (typeof window === 'undefined') return INITIAL_LOGS;
  try {
    const logs = localStorage.getItem('sdm_audit');
    return logs ? JSON.parse(logs) : INITIAL_LOGS;
  } catch (e) {
    return INITIAL_LOGS;
  }
}

export function saveStoredAuditLogs(logs) {
  if (typeof window === 'undefined') return;
  if (Array.isArray(logs)) {
    localStorage.setItem('sdm_audit', JSON.stringify(logs));
  }
}

export function getStoredSubmissions() {
  if (typeof window === 'undefined') return [];
  try {
    const subs = localStorage.getItem('sdm_submissions');
    return subs ? JSON.parse(subs) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredSubmissions(submissions) {
  if (typeof window === 'undefined') return;
  if (Array.isArray(submissions)) {
    try {
      // Strip large base64 strings to prevent QuotaExceededError in localStorage
      const lightweightSubs = submissions.map(sub => {
        if (!sub.reportData) return sub;
        const lightweightReportData = { ...sub.reportData };
        ['evidenceImageSrc', 'canvasBg', 'finalRender'].forEach(field => {
          if (lightweightReportData[field] && lightweightReportData[field].startsWith('data:')) {
            lightweightReportData[field] = '__pending_upload__'; // Placeholder instead of huge base64
          }
        });
        return { ...sub, reportData: lightweightReportData };
      });
      localStorage.setItem('sdm_submissions', JSON.stringify(lightweightSubs));
    } catch (e) {
      console.warn('localStorage quota exceeded for submissions, trimming old entries:', e);
      try {
        // Fallback: keep only the last 50 submissions using lightweight data
        const trimmed = lightweightSubs.slice(0, 50);
        localStorage.setItem('sdm_submissions', JSON.stringify(trimmed));
      } catch (e2) {
        console.error('Failed to save even trimmed submissions:', e2);
      }
    }
  }
}

export function getStoredMessages() {
  if (typeof window === 'undefined') return INITIAL_MESSAGES;
  try {
    const msgs = localStorage.getItem('sdm_messages');
    return msgs ? JSON.parse(msgs) : INITIAL_MESSAGES;
  } catch (e) {
    return INITIAL_MESSAGES;
  }
}

export function saveStoredMessages(messages) {
  if (typeof window === 'undefined') return;
  if (Array.isArray(messages)) {
    localStorage.setItem('sdm_messages', JSON.stringify(messages));
  }
}
