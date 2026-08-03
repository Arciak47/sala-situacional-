import { INITIAL_USERS, INITIAL_LOGS, INITIAL_MESSAGES } from './constants';

export function initializeStorage() {
  if (typeof window === 'undefined') return;
  // Ensure basic keys are set without wiping user-created content
  if (!localStorage.getItem('sdm_version')) {
    localStorage.setItem('sdm_version', 'sdm-v10-production-stable');
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
    localStorage.setItem('sdm_submissions', JSON.stringify(submissions));
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
