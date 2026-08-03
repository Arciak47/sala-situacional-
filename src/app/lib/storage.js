import { INITIAL_USERS, INITIAL_LOGS, INITIAL_MESSAGES } from './constants';

const VERSION = 'v8-username-login';

export function initializeStorage() {
  if (typeof window === 'undefined') return;
  
  if (localStorage.getItem('sdm_version') !== VERSION) {
    ['sdm_users', 'sdm_session', 'sdm_audit', 'sdm_submissions', 'sdm_messages'].forEach((k) =>
      localStorage.removeItem(k)
    );
    localStorage.setItem('sdm_version', VERSION);
  }
}

export function getStoredUsers() {
  if (typeof window === 'undefined') return INITIAL_USERS;
  const u = localStorage.getItem('sdm_users');
  return u ? JSON.parse(u) : INITIAL_USERS;
}

export function saveStoredUsers(users) {
  if (typeof window === 'undefined') return;
  if (users && users.length > 0) {
    localStorage.setItem('sdm_users', JSON.stringify(users));
  }
}

export function getStoredSession() {
  if (typeof window === 'undefined') return null;
  const sess = localStorage.getItem('sdm_session');
  return sess ? JSON.parse(sess) : null;
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
  const logs = localStorage.getItem('sdm_audit');
  return logs ? JSON.parse(logs) : INITIAL_LOGS;
}

export function saveStoredAuditLogs(logs) {
  if (typeof window === 'undefined') return;
  if (logs && logs.length > 0) {
    localStorage.setItem('sdm_audit', JSON.stringify(logs));
  }
}

export function getStoredSubmissions() {
  if (typeof window === 'undefined') return [];
  const subs = localStorage.getItem('sdm_submissions');
  return subs ? JSON.parse(subs) : [];
}

export function saveStoredSubmissions(submissions) {
  if (typeof window === 'undefined') return;
  if (submissions && submissions.length > 0) {
    localStorage.setItem('sdm_submissions', JSON.stringify(submissions));
  }
}

export function getStoredMessages() {
  if (typeof window === 'undefined') return INITIAL_MESSAGES;
  const msgs = localStorage.getItem('sdm_messages');
  return msgs ? JSON.parse(msgs) : INITIAL_MESSAGES;
}

export function saveStoredMessages(messages) {
  if (typeof window === 'undefined') return;
  if (messages && messages.length > 0) {
    localStorage.setItem('sdm_messages', JSON.stringify(messages));
  }
}
