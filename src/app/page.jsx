"use client";

import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import UserModal from './components/UserModal';
import EditUserModal from './components/EditUserModal';
import TextOverlay from './components/TextOverlay';
import LoginPage from './components/LoginPage.jsx';
import AdministradorView from './components/AdministradorView.jsx';
import SupervisorView from './components/SupervisorView.jsx';
import AnalistaView from './components/AnalistaView.jsx';
import InteractiveBackground from './components/InteractiveBackground';
import HeaderBar from './components/HeaderBar';
import ShiftHistoryView from './components/ShiftHistoryView';

import { EMPTY_REPORT } from './lib/constants';
import { buildElements } from './lib/canvasHelpers';
import {
  initializeStorage,
  getStoredUsers,
  saveStoredUsers,
  getStoredSession,
  saveStoredSession,
  getStoredAuditLogs,
  saveStoredAuditLogs,
  getStoredSubmissions,
  saveStoredSubmissions,
  getStoredMessages,
  saveStoredMessages,
} from './lib/storage';
import {
  subscribeUsers,
  subscribeSubmissions,
  subscribeMessages,
  subscribeAuditLogs,
  saveUserToFirestore,
  saveUsersBatchToFirestore,
  deleteUserFromFirestore,
  addSubmissionToFirestore,
  deleteSubmissionFromFirestore,
  archiveSubmissionInFirestore,
  onSnapshotSubmissions,
  addMessageToFirestore,
  updateMessageInFirestore,
  addAuditLogToFirestore,
  getSubmissionImage,
  updateSubmissionStatus,
  subscribeShiftReports,
} from './lib/firestoreService';

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [shiftReports, setShiftReports] = useState([]);
  const [activeTab, setActiveTab] = useState(''); // starts empty to prevent premature localStorage overwrite
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const [loginError, setLoginError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    nombres: '',
    apellidos: '',
    sala: 'Sala Comuna',
    edad: '',
    fechaNacimiento: '',
    createdAt: new Date().toISOString().split('T')[0],
    email: '',
    password: '',
    role: 'Analista',
    department: 'Análisis de Redes Sociales',
  });

  const [modalError, setModalError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [inboxFilter, setInboxFilter] = useState('Todos');
  const [reportData, setReportData] = useState({ ...EMPTY_REPORT });
  const [isSaving, setIsSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { matches: [], pendingSub: obj }

  // Ref to track unread messages count for notifications
  const prevUnreadRef = useRef(0);

  // ── Canvas editor state ──
  const [elements, setElements] = useState([]);
  const [selId, setSelId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [imageCache, setImageCache] = useState({});
  const [overlayRect, setOverlayRect] = useState(null);

  // ── Firestore real-time subscriptions & localStorage initialization ──
  useEffect(() => {
    initializeStorage();
    const session = getStoredSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentUser(session);
    setUsers(getStoredUsers());
    const storedSubs = getStoredSubmissions();
    setSubmissions(storedSubs);
    setMessages(getStoredMessages());
    setAuditLogs(getStoredAuditLogs());

    // Restore active tab or default to 'dashboard' if logged in, otherwise 'forms'
    if (session) {
      const savedTab = localStorage.getItem('sdm_activeTab');
      setActiveTab(savedTab || 'dashboard');
      
      const savedSubId = localStorage.getItem('sdm_selectedSubmissionId');
      if (savedSubId && savedTab === 'editor') {
        const found = storedSubs.find((s) => String(s.id) === String(savedSubId));
        if (found) {
          setSelectedSubmission(found);
          setReportData({ ...found.reportData });
          setElements(found.canvasElements && found.canvasElements.length > 0 ? found.canvasElements : buildElements(found.reportData));
        }
      }
    } else {
      setActiveTab('forms');
    }
  }, []);

  // ── Database Subscriptions ──
  useEffect(() => {
    // Only subscribe to heavy data if the user is actually logged in
    if (!currentUser) return;
    
    const unsubUsers = subscribeUsers((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data);
      }
    });
    const unsubSubs = subscribeSubmissions((data) => {
      if (data) {
        setSubmissions(data);
        if (typeof window !== 'undefined') {
          const savedSubId = localStorage.getItem('sdm_selectedSubmissionId');
          if (savedSubId) {
            const found = data.find((s) => String(s.id) === String(savedSubId));
            if (found) {
              // Update selectedSubmission so the badge/status badge stays current
              setSelectedSubmission(found);
              // NOTE: do NOT overwrite reportData or elements here.
              // saveSubmissionEdits already applied them optimistically and
              // re-applies them after the await. Overwriting here would race
              // against the user's current edit session.
            }
          }
        }
      }
    });
    const unsubMsgs = subscribeMessages((data) => {
      if (data) setMessages(data);
    });
    const unsubLogs = subscribeAuditLogs((data) => {
      if (data) setAuditLogs(data);
    });
    const unsubReports = subscribeShiftReports((data) => {
      if (data) setShiftReports(data);
    });

    return () => {
      unsubUsers();
      unsubSubs();
      unsubMsgs();
      unsubLogs();
      unsubReports();
    };
  }, [currentUser]);

  useEffect(() => {
    saveStoredSession(currentUser);
  }, [currentUser]);

  const handleLogout = () => {
    if (currentUser) addLog(currentUser.email, 'Cierre de Sesión', 'Sesión terminada');
    setCurrentUser(null);
    setSelectedSubmission(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sdm_activeTab');
      localStorage.removeItem('sdm_selectedSubmissionId');
    }
  };

  // ── Auto-logout after 5 minutes of inactivity ──
  useEffect(() => {
    if (!currentUser) return;

    let timeoutId;
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
        setToastMsg('⚠️ Tu sesión se ha cerrado por inactividad.');
        setTimeout(() => setToastMsg(''), 5000);
      }, INACTIVITY_LIMIT);
    };

    // Activity event listeners
    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    // Initialize timer
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [currentUser]);


  // ── Persist activeTab so F5 restores the same section and handle Back Button ──
  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab) {
      localStorage.setItem('sdm_activeTab', activeTab);
      if (activeTab !== 'editor') {
        localStorage.removeItem('sdm_selectedSubmissionId');
        setSelectedSubmission(null);
      }
      
      // Update the URL hash without triggering a full reload, to support back button
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== activeTab) {
        window.history.pushState({ tab: activeTab }, '', `#${activeTab}`);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else {
        const hashTab = window.location.hash.replace('#', '');
        if (hashTab) {
          setActiveTab(hashTab);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Also read the hash on initial load if present
    const hashTab = window.location.hash.replace('#', '');
    if (hashTab && currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(hashTab);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  useEffect(() => {
    if (users && users.length > 0) saveStoredUsers(users);
  }, [users]);

  useEffect(() => {
    if (submissions && submissions.length >= 0) saveStoredSubmissions(submissions);
  }, [submissions]);

  useEffect(() => {
    if (messages && messages.length >= 0) saveStoredMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (auditLogs && auditLogs.length > 0) saveStoredAuditLogs(auditLogs);
  }, [auditLogs]);

  // Unread messages count for current user
  const unreadMessagesCount = messages.filter(
    (m) => m.receptorId === currentUser?.id && !m.leido
  ).length;

  // Sound & Toast Notification when a new message arrives
  useEffect(() => {
    if (currentUser && unreadMessagesCount > prevUnreadRef.current) {
      setToastMsg(`💬 ¡Nuevo mensaje recibido! (${unreadMessagesCount} sin leer)`);
      setTimeout(() => setToastMsg(''), 5000);

      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (err) {
        // Silent fallback if audio context requires user gesture
      }
    }
    prevUnreadRef.current = unreadMessagesCount;
  }, [unreadMessagesCount, currentUser]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sdm_darkMode');
      if (saved !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDarkMode(JSON.parse(saved));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sdm_darkMode', JSON.stringify(darkMode));
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode]);

  // Removed the activeTab useEffect that built elements to avoid race conditions.
  // Elements are now built synchronously when navigating to the editor.

  // ── Audit log helper ──
  const addLog = (user, action, details, type = 'info') => {
    const logItem = {
      id: `log-${Date.now()}`,
      timestamp:
        new Date().toLocaleDateString('es-ES') +
        ' ' +
        new Date().toLocaleTimeString(),
      user,
      action,
      details,
      type,
    };
    setAuditLogs((prev) => [logItem, ...prev]);
    addAuditLogToFirestore(logItem);
  };

  // ── Auth Handlers ──
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveTab('dashboard'); // fresh logins always start on dashboard
    addLog(user.email, 'Inicio de Sesión', `Ingreso como ${user.role}`, 'success');
  };



  // ── User Management ──
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalError('');
    const usernameClean = (formData.username || '').trim().toLowerCase();
    const nombresClean = (formData.nombres || '').trim();
    const apellidosClean = (formData.apellidos || '').trim();
    const emailClean = (formData.email || '').trim().toLowerCase() || `${usernameClean}@monitoreo.com`;
    const selectedSala = formData.sala || 'Sala Comuna';
    const selectedRole = formData.role || 'Analista';

    if (!usernameClean || !nombresClean || !apellidosClean || !formData.password) {
      setModalError('Por favor completa el usuario, nombres, apellidos y contraseña.');
      return;
    }
    if (selectedRole === 'Administrador' && users.some((u) => u.role === 'Administrador')) {
      setModalError('⚠️ El sistema solo permite tener 1 Administrador Principal activo.');
      return;
    }
    if (
      users.some(
        (u) =>
          (u.username && u.username.toLowerCase() === usernameClean) ||
          (u.email && u.email.toLowerCase() === emailClean && emailClean !== '')
      )
    ) {
      setModalError('Ya existe un usuario registrado con este nombre de usuario o correo.');
      return;
    }

    // Calculate room + role sequential number (01, 02, 03...)
    const existingInSalaRoleCount = users.filter(
      (u) => u.sala === selectedSala && u.role === selectedRole
    ).length;

    const numStr = String(existingInSalaRoleCount + 1).padStart(2, '0');
    const salaCodigo = `${selectedSala} ${selectedRole} ${numStr}`;
    const fullName = `${nombresClean} ${apellidosClean}`;
    const salaEtiqueta = `${salaCodigo} - ${fullName}`;

    const newUser = {
      id: `usr-${Date.now()}`,
      username: usernameClean,
      nombres: nombresClean,
      apellidos: apellidosClean,
      name: fullName,
      sala: selectedSala,
      salaCodigo,
      salaEtiqueta,
      edad: formData.edad || '',
      fechaNacimiento: formData.fechaNacimiento || '',
      createdAt: formData.createdAt || new Date().toISOString().split('T')[0],
      email: emailClean,
      password: formData.password.trim(),
      role: selectedRole,
      department: formData.department?.trim() || 'Análisis de Redes Sociales',
      status: 'Activo',
    };
    setUsers((prev) => [newUser, ...prev]);
    await saveUserToFirestore(newUser);
    addLog(
      currentUser?.email || 'Admin',
      'Usuario Creado',
      `${newUser.salaEtiqueta} (${newUser.role})`,
      'success'
    );
    setShowCreateModal(false);
    setFormData({
      username: '',
      nombres: '',
      apellidos: '',
      sala: 'Sala Comuna',
      edad: '',
      fechaNacimiento: '',
      createdAt: new Date().toISOString().split('T')[0],
      email: '',
      password: '',
      role: 'Analista',
      department: 'Análisis de Redes Sociales',
    });
    setToastMsg(`✅ Usuario ${newUser.salaEtiqueta} creado.`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSaveEditedUser = async (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    await saveUserToFirestore(updatedUser);

    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      saveStoredSession(updatedUser);
    }

    addLog(
      currentUser?.email || 'Admin',
      'Usuario Editado',
      `Se actualizaron los datos de @${updatedUser.username} (${updatedUser.name})`,
      'info'
    );
    setToastMsg(`✅ Usuario ${updatedUser.salaEtiqueta || updatedUser.name} actualizado.`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const toggleStatus = async (id) => {
    if (currentUser?.role !== 'Administrador') return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const ns = u.status === 'Activo' ? 'Inactivo' : 'Activo';
          const updated = { ...u, status: ns };
          saveUserToFirestore(updated); // fire-and-forget is OK for status toggle
          addLog(currentUser.email, 'Cambio Estado', `${u.email} → ${ns}`, 'warning');
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (id, name) => {
    if (currentUser?.role !== 'Administrador') return;
    if (confirm(`¿Eliminar al usuario ${name}?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      deleteUserFromFirestore(id);
      addLog(currentUser.email, 'Usuario Eliminado', name, 'error');
    }
  };

  // ── Submissions ──
  const addSubmissionWithTimeout = async (sub, timeoutMs = 2500) => {
    try {
      const findDOM = (obj, path = '') => {
        if (!obj) return null;
        if (obj instanceof HTMLElement) return path;
        if (typeof obj === 'object') {
          for (let k in obj) {
            const res = findDOM(obj[k], path ? `${path}.${k}` : k);
            if (res) return res;
          }
        }
        return null;
      };
      const badPath = findDOM(sub);
      if (badPath) {
        console.error("FOUND DOM ELEMENT AT PATH:", badPath);
        alert("Found DOM element at: " + badPath);
      }
      
      const res = await Promise.race([
        addSubmissionToFirestore(sub),
        new Promise((resolve) => setTimeout(() => resolve('timeout'), timeoutMs))
      ]);
      if (res === 'timeout') {
        console.warn('Firestore write timed out (queued offline):', sub.id);
      }
      return res;
    } catch (err) {
      console.error('addSubmissionWithTimeout error:', err);
      throw err;
    }
  };
  // ── Duplicate detection helpers ──
  const normalizeUrl = (url) => {
    if (!url) return '';
    return url
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^(www\.|m\.|mobile\.)/, '')
      .split('?')[0]  // strip query params first
      .split('#')[0] // strip hash fragments
      .replace(/\/$/, ''); // strip trailing slash AFTER params are removed
  };

  const simpleImageHash = (base64Src) => {
    if (!base64Src) return null;
    // Use first 200 + last 200 chars of the base64 body as a fast fingerprint
    const body = base64Src.split(',')[1] || base64Src;
    if (body.length < 400) return body;
    return body.slice(0, 200) + '|' + body.slice(-200) + '|' + body.length;
  };

  const checkForDuplicates = (data) => {
    const activeNonArchived = submissions.filter((s) => !s.archived);
    const matches = [];
    const newUrl = normalizeUrl(data.enlace);
    const newImgHash = data.imageHash || simpleImageHash(data.evidenceImageSrc);

    for (const s of activeNonArchived) {
      const reasons = [];
      if (newUrl && newUrl.length > 5) {
        const existingUrl = normalizeUrl(s.reportData?.enlace);
        if (existingUrl && existingUrl === newUrl) reasons.push('enlace');
      }
      if (newImgHash) {
        // If it's a new report, it has imageHash. If old, we fallback to hashing whatever is in evidenceImageSrc (though it won't match ImgBB URLs)
        const existingHash = s.reportData?.imageHash || simpleImageHash(s.reportData?.evidenceImageSrc);
        if (existingHash && existingHash === newImgHash) reasons.push('imagen');
      }
      if (reasons.length > 0) {
        matches.push({
          sub: s,
          reasons,
          analystName: s.analystName,
          analystSala: s.analystSala || 'Desconocida',
          fecha: new Date(s.timestamp).toLocaleDateString('es-ES'),
          hora: new Date(s.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          municipio: s.reportData?.municipio,
          status: s.status,
        });
      }
    }
    return matches;
  };

  const handleSubmitForm = async (forceStatus = null) => {
    // Si forceStatus es un evento (ej. viene del onClick), lo ignoramos
    if (forceStatus && typeof forceStatus !== 'string') {
      forceStatus = null;
    }

    const required = [
      'municipio',
      'fecha',
      'hora',
      'postTitle',
      'usuario',
      'contexto',
      'enlace',
    ];
    const missing = required.filter((k) => !reportData[k]?.trim());
    if (missing.length > 0) {
      console.error('Fallo de validación - Faltan campos obligatorios:', missing);
      setToastMsg('⚠️ Completa todos los campos obligatorios.');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }

    // ── Duplicate detection (only on first attempt, not on forced re-submit) ──
    if (!forceStatus) {
      const duplicates = checkForDuplicates(reportData);
      if (duplicates.length > 0) {
        const sub = {
          id: `sub-${Date.now()}`,
          analystId: currentUser.id,
          analystName: currentUser.name,
          analystEmail: currentUser.email,
          analystSala: currentUser.sala || 'Sala Comuna',
          analystSalaCodigo: currentUser.salaCodigo || '',
          analystSalaEtiqueta: currentUser.salaEtiqueta || `${currentUser.sala || 'Sala Comuna'} - ${currentUser.name}`,
          timestamp: new Date().toISOString(),
          reportData: { ...reportData },
          status: 'pendiente',
        };
        setDuplicateWarning({ matches: duplicates, pendingSub: sub });
        return; // Stop here — wait for user decision
      }
    }

    setIsSaving(true);
    const sub = forceStatus
      ? duplicateWarning?.pendingSub
        ? { ...duplicateWarning.pendingSub, status: forceStatus }
        : {
            id: `sub-${Date.now()}`,
            analystId: currentUser.id,
            analystName: currentUser.name,
            analystEmail: currentUser.email,
            analystSala: currentUser.sala || 'Sala Comuna',
            analystSalaCodigo: currentUser.salaCodigo || '',
            analystSalaEtiqueta: currentUser.salaEtiqueta || `${currentUser.sala || 'Sala Comuna'} - ${currentUser.name}`,
            timestamp: new Date().toISOString(),
            reportData: { ...reportData },
            status: forceStatus,
          }
      : {
          id: `sub-${Date.now()}`,
          analystId: currentUser.id,
          analystName: currentUser.name,
          analystEmail: currentUser.email,
          analystSala: currentUser.sala || 'Sala Comuna',
          analystSalaCodigo: currentUser.salaCodigo || '',
          analystSalaEtiqueta: currentUser.salaEtiqueta || `${currentUser.sala || 'Sala Comuna'} - ${currentUser.name}`,
          timestamp: new Date().toISOString(),
          reportData: { ...reportData },
          status: 'pendiente',
        };
    setDuplicateWarning(null);
    try {
      await addSubmissionWithTimeout(sub, 7000); // Allow longer timeout for uploads
      setSubmissions((prev) => [sub, ...prev]);
      addLog(
        currentUser.email,
        'Reporte Enviado',
        `Municipio: ${reportData.municipio}`,
        'success'
      );
      setReportData({ ...EMPTY_REPORT });
      // Reset file input visually
      if (typeof document !== 'undefined') {
        const fileInput = document.getElementById('foto-evidencia');
        if (fileInput) fileInput.value = '';
      }
      setToastMsg(forceStatus === 'repetido' ? '🔁 Reporte enviado y marcado como repetido.' : '✅ Reporte enviado al Supervisor.');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (error) {
      console.error('Error estricto al enviar reporte:', error);
      alert(`❌ Error al enviar reporte: ${error.message || 'Intente nuevamente'}`);
      setToastMsg(`❌ Error al enviar reporte: ${error.message || 'Intente nuevamente'}`);
      setTimeout(() => setToastMsg(''), 6000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDuplicate = (action) => {
    // action: 'repetido' | 'pendiente' | 'cancel'
    if (action === 'cancel') {
      setDuplicateWarning(null);
      return;
    }
    handleSubmitForm(action);
  };

  const openSubmissionForReview = async (sub) => {
    setSelectedSubmission(sub);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sdm_selectedSubmissionId', String(sub.id));
    }
    const newReportData = { ...sub.reportData };
    
    // Fetch image from secondary collection if it was separated to save bandwidth
    if (newReportData.evidenceImageId && !newReportData.evidenceImageSrc) {
      const src = await getSubmissionImage(newReportData.evidenceImageId);
      if (src) {
        newReportData.evidenceImageSrc = src;
      }
    }
    
    setReportData(newReportData);
    setElements(sub.canvasElements && sub.canvasElements.length > 0 ? sub.canvasElements : buildElements(newReportData));
    setSelId(null);
    setEditingId(null);
    setActiveTab('editor');
  };

  const goToEditor = () => {
    setElements(buildElements(reportData));
    setSelId(null);
    setEditingId(null);
    setActiveTab('editor');
  };

  const saveSubmissionEdits = async (newStatus = null, currentElements = null, currentReport = null) => {
    if (!selectedSubmission) return;
    setIsSaving(true);
    
    let updatedReport = currentReport || { ...reportData };
    let elementsToUse = currentElements || elements;

    // If saving from outside the canvas while a text box is active, capture that text!
    if (!currentElements && editingId) {
      const targetEl = elements.find((e) => e.id === editingId);
      if (targetEl) {
        if (targetEl.sync) {
          let val = targetEl.tpl ? editText.replace(targetEl.tpl, '') : editText;
          if (targetEl.sync === 'fecha') {
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
              const [d, m, y] = val.split('/');
              const rawDate = `${y}-${m}-${d}`;
              updatedReport.fechaRaw = rawDate;
              updatedReport.fecha = val; // DD/MM/YYYY
            } else {
              updatedReport.fecha = val;
            }
          } else if (targetEl.sync === 'hora') {
            const match = val.match(/^(\d{2}):(\d{2})\s(AM|PM)$/i);
            if (match) {
              let [ , h, m, ampm ] = match;
              h = parseInt(h, 10);
              if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
              if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
              const rawTime = `${h.toString().padStart(2, '0')}:${m}`;
              updatedReport.horaRaw = rawTime;
              updatedReport.hora = val; // HH:MM AM/PM
            } else {
              updatedReport.hora = val;
            }
          } else {
            updatedReport[targetEl.sync] = val;
          }
        }
        elementsToUse = elements.map((el) => (el.id === editingId ? { ...el, text: editText } : el));
        // We call commitTextEdit asynchronously to update the UI state
        setTimeout(commitTextEdit, 0); 
      }
    }
    
    // ── Build final canvas elements with a sync pass over updatedReport ──
    // This guarantees that synced fields (postTitle, usuario, etc.) always
    // reflect the latest values from FormFields or TextOverlay edits,
    // regardless of whether React's useEffect([reportData]) has run yet.
    // We only update 'text' and 'src' to preserve user's manual visual edits (fs, color, etc).
    const finalElements = elementsToUse.map((el) => {
      if (!el.sync) return el;
      if (el.type === 'image') return { ...el, src: updatedReport[el.sync] || null };
      const val = (updatedReport[el.sync] || '').toUpperCase();
      return { ...el, text: el.tpl ? el.tpl + val : val };
    });

    const updatedSub = {
      ...selectedSubmission,
      reportData: updatedReport,
      canvasElements: finalElements,   // ← always uses the synced version
      editedBy: currentUser.name,
      editedAt: new Date().toISOString(),
      ...(newStatus && typeof newStatus === 'string' ? { 
        status: newStatus,
        ...(newStatus === 'reportar' ? { reportedAt: new Date().toISOString() } : {})
      } : {}),
    };
    
    // ── Optimistic local update (instant visual feedback) ──
    setReportData(updatedReport);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === selectedSubmission.id ? updatedSub : s))
    );
    setSelectedSubmission(updatedSub);
    // Apply the same synced elements to the live canvas state so the
    // visual update is immediate — no waiting for useEffect([reportData]).
    setElements(finalElements);
    
    try {
      await addSubmissionToFirestore(updatedSub);
      
      // Re-apply after successful persist to ensure consistency
      setReportData(updatedReport);
      setSelectedSubmission(updatedSub);
      
      if (!newStatus || typeof newStatus !== 'string') {
        addLog(
          currentUser.email,
          'Reporte Editado',
          `ID: ${selectedSubmission.id} - DATA: ${JSON.stringify(updatedReport).substring(0, 100)}`,
          'success'
        );
        setToastMsg('✅ Guardado correctamente');
      } else {
        setToastMsg(`✅ Reporte movido a estado: ${newStatus.toUpperCase()}`);
      }
      
      setTimeout(() => setToastMsg(''), 4000);
      // Do not auto-navigate – let the user stay on the current tab
      
    } catch (error) {
      console.error("Backend Error saving submission:", error);
      setToastMsg(`❌ Error del backend al guardar: ${error.message || 'Intente nuevamente'}`);
      setTimeout(() => setToastMsg(''), 6000);
    } finally {
      setIsSaving(false);
    }
  };

  const markAsReviewed = async (subId, currentElements = null, currentReport = null) => {
    setIsSaving(true);
    try {
      if (selectedSubmission && selectedSubmission.id === subId) {
        await saveSubmissionEdits('revisado', currentElements, currentReport);
      } else {
        const existing = submissions.find(s => s.id === subId);
        if (existing) {
          const updatedSub = { ...existing, status: 'revisado' };
          setSubmissions((prev) => prev.map((s) => (s.id === subId ? updatedSub : s)));
          await updateSubmissionStatus(subId, 'revisado');
        }
      }
      addLog(currentUser.email, 'Reporte Revisado', `ID: ${subId}`, 'success');
      setToastMsg('✅ Marcado como revisado.');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setToastMsg(`❌ Error al marcar como revisado: ${err.message}`);
      setTimeout(() => setToastMsg(''), 6000);
    } finally {
      setIsSaving(false);
    }
  };

  const markAsRepeated = async (subId, currentElements = null, currentReport = null) => {
    setIsSaving(true);
    try {
      if (selectedSubmission && selectedSubmission.id === subId) {
        await saveSubmissionEdits('repetido', currentElements, currentReport);
      } else {
        const existing = submissions.find(s => s.id === subId);
        if (existing) {
          const updatedSub = { ...existing, status: 'repetido' };
          setSubmissions((prev) => prev.map((s) => (s.id === subId ? updatedSub : s)));
          await updateSubmissionStatus(subId, 'repetido');
        }
      }
      addLog(currentUser.email, 'Reporte Repetido', `ID: ${subId}`, 'warning');
      setToastMsg('⚠️ Marcado como repetido.');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setToastMsg(`❌ Error al marcar como repetido: ${err.message}`);
      setTimeout(() => setToastMsg(''), 6000);
    } finally {
      setIsSaving(false);
    }
  };

  const markAsReported = async (subId, currentElements = null, currentReport = null) => {
    setIsSaving(true);
    try {
      if (selectedSubmission && selectedSubmission.id === subId) {
        // Save canvas edits WITH status 'reportar' so /shift can find it
        await saveSubmissionEdits('reportar', currentElements, currentReport);
        // saveSubmissionEdits already navigates to 'shift' when status is 'reportar'
      } else {
        const existing = submissions.find(s => s.id === subId);
        if (existing) {
          const updatedSub = { ...existing, status: 'reportar' };
          setSubmissions((prev) => prev.map((s) => (s.id === subId ? updatedSub : s)));
          await updateSubmissionStatus(subId, 'reportar');
        }
      }
      addLog(currentUser.email, 'Reporte para Reportar', `ID: ${subId}`, 'info');
      setToastMsg('📢 Marcado para reportar correctamente.');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setToastMsg(`❌ Error al marcar para reportar: ${err.message}`);
      setTimeout(() => setToastMsg(''), 6000);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSubmission = (subId) => {
    if (
      typeof window !== 'undefined' &&
      window.confirm('¿Estás seguro de que deseas eliminar este reporte de la bandeja? Esta acción no se puede deshacer.')
    ) {
      setSubmissions((prev) => prev.filter((s) => s.id !== subId));
      deleteSubmissionFromFirestore(subId);
      addLog(currentUser?.email, 'Reporte Eliminado', `ID: ${subId}`, 'warning');
      setToastMsg('🗑️ Reporte eliminado de la bandeja.');
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const handleBackupAndClear = async () => {
    if (
      typeof window !== 'undefined' &&
      window.confirm('⚠️ ATENCIÓN: ¿Estás seguro de que deseas hacer el Cierre del Día?\nEsta acción generará un respaldo, purgará las imágenes pesadas para liberar espacio, pero mantendrá intactas las estadísticas.')
    ) {
      setToastMsg('📦 Generando respaldo, por favor espera...');
      try {
        const JSZip = (await import('jszip')).default;
        const { saveAs } = (await import('file-saver')).default;
        const { getExcelBlob, renderCanvasFichaImage } = await import('./lib/exportUtils');
        
        const zip = new JSZip();
        
        const activeToArchive = submissions.filter(s => !s.archived);
        
        // Agregar Excel en vez de JSON (mantiene toda la data cargada)
        const excelBlob = getExcelBlob(submissions);
        if (excelBlob) {
          zip.file("Base_de_Datos.xls", excelBlob);
        }
        
        const imgFolder = zip.folder("fichas");
        
        for (const sub of activeToArchive) {
          try {
            // Obtener fecha del reporte (YYYY-MM-DD)
            const subDate = sub.timestamp ? new Date(sub.timestamp).toISOString().split('T')[0] : 'Sin_Fecha';
            // Obtener sentimiento
            const sentiment = sub.reportData?.sentimiento || 'Sin_Sentimiento';
            
            // Genera la ficha completa oficial usando la utilidad
            const dataUrl = await renderCanvasFichaImage(sub);
            if (dataUrl) {
              // Limpiar encabezado base64 (e.g. data:image/png;base64,...)
              const base64Data = dataUrl.split(',')[1];
              // Organizar en carpetas: fichas / Fecha / Sentimiento / ficha_id.png
              imgFolder.folder(subDate).folder(sentiment).file(`ficha_${sub.id}.png`, base64Data, { base64: true });
            }
          } catch (e) {
            console.warn(`No se pudo generar la ficha para el reporte ${sub.id}:`, e);
          }
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        const dateStr = new Date().toISOString().split('T')[0];
        saveAs(content, `Respaldo_Sala_${dateStr}.zip`);
        
        setToastMsg('✅ Respaldo generado. Limpiando base de datos...');
        
        // ARCHIVAR TODOS LOS REPORTES (LIBERA LA BASE DE DATOS Y FIREBASE STORAGE PERO MANTIENE ESTADÍSTICAS)
        for (const sub of submissions) {
          if (!sub.archived) {
            archiveSubmissionInFirestore(sub.id);
          }
        }
        setSubmissions(prev => prev.map(s => ({ ...s, archived: true })));
        
        addLog(currentUser?.email, 'Cierre del Sistema', 'Se generó respaldo y se limpió la base de datos', 'warning');
        setToastMsg('🚀 Archivo ZIP generado y base de datos limpia.');
        setTimeout(() => setToastMsg(''), 4000);
      } catch (err) {
        console.error('Error in backup:', err);
        setToastMsg('❌ Hubo un error al generar el respaldo.');
      }
    }
  };

  const handleImageUpload = (e) => {
    const target = e.target;
    const file = target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 800; // Optimized for fast loading
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG at optimal quality to preserve legibility while drastically reducing loading times
        const hdSrc = canvas.toDataURL('image/jpeg', 0.7);
        const imgHash = simpleImageHash(hdSrc);
        setReportData((prev) => ({ ...prev, evidenceImageSrc: hdSrc, imageHash: imgHash }));
        target.value = ''; // Allow uploading the same file again
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const commitTextEdit = () => {
    if (!editingId) return;
    
    // Reverse sync canvas edits back to reportData
    const targetEl = elements.find((e) => e.id === editingId);
    if (targetEl && targetEl.sync) {
      let val = targetEl.tpl ? editText.replace(targetEl.tpl, '') : editText;
      if (targetEl.sync === 'fecha') {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
          const [d, m, y] = val.split('/');
          val = `${y}-${m}-${d}`;
        }
      }
      if (targetEl.sync === 'hora') {
        const match = val.match(/^(\d{2}):(\d{2})\s(AM|PM)$/i);
        if (match) {
          let [ , h, m, ampm ] = match;
          h = parseInt(h, 10);
          if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
          if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
          val = `${h.toString().padStart(2, '0')}:${m}`;
        }
      }
      setReportData((prev) => ({ ...prev, [targetEl.sync]: val }));
    }

    setElements((prev) =>
      prev.map((el) => (el.id === editingId ? { ...el, text: editText } : el))
    );
    setEditingId(null);
    setOverlayRect(null);
  };

  // ── Analyst Personal Stats ──
  const getStats = () => {
    const mine = submissions.filter((s) => s.analystId === currentUser?.id);
    const now = new Date();
    // Use LOCAL date parts to avoid UTC offset issues (Venezuela = UTC-4)
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const today = `${y}-${mo}-${d}`;
    const toLocalDate = (iso) => {
      const dt = new Date(iso);
      return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    };
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return {
      total: mine.length,
      today: mine.filter((s) => toLocalDate(s.timestamp) === today).length,
      week: mine.filter((s) => new Date(s.timestamp) >= weekStart).length,
      month: mine.filter(
        (s) =>
          new Date(s.timestamp) >= new Date(now.getFullYear(), now.getMonth(), 1)
      ).length,
      year: mine.filter(
        (s) => new Date(s.timestamp) >= new Date(now.getFullYear(), 0, 1)
      ).length,
      repeated: mine.filter((s) => s.status === 'repetido').length,
      reviewed: mine.filter((s) => ['revisado', 'reportar'].includes(s.status)).length,
      recent: mine.slice(0, 15),
    };
  };

  // ── Global Stats & Per-Analyst Breakdown (for Admin & Supervisor) ──
  const getAllStats = () => {
    const analysts = users.filter((u) => u.role === 'Analista');
    const now = new Date();
    // Use LOCAL date parts to avoid UTC offset issues (Venezuela = UTC-4)
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const today = `${y}-${mo}-${d}`;
    const toLocalDate = (iso) => {
      const dt = new Date(iso);
      return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    };
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    const totalGlobal = submissions.length;
    const todayGlobal = submissions.filter(
      (s) => toLocalDate(s.timestamp) === today
    ).length;
    const weekGlobal = submissions.filter(
      (s) => new Date(s.timestamp) >= weekStart
    ).length;
    const monthGlobal = submissions.filter(
      (s) =>
        new Date(s.timestamp) >= new Date(now.getFullYear(), now.getMonth(), 1)
    ).length;
    const pendingGlobal = submissions.filter(
      (s) => s.status === 'pendiente'
    ).length;
    const reviewedGlobal = submissions.filter(
      (s) => ['revisado', 'reportar'].includes(s.status)
    ).length;
    const repeatedGlobal = submissions.filter(
      (s) => s.status === 'repetido'
    ).length;

    const perAnalyst = analysts.map((a) => {
      const mine = submissions.filter(
        (s) => s.analystId === a.id || s.analystEmail === a.email
      );
      const defaultEtiqueta = a.salaEtiqueta || (a.salaCodigo ? `${a.salaCodigo} - ${a.name}` : `${a.sala || 'Sala Comuna'} - ${a.name}`);
      return {
        id: a.id,
        username: a.username || '',
        name: a.name,
        email: a.email,
        sala: a.sala || 'Sala Comuna',
        salaCodigo: a.salaCodigo || '',
        salaEtiqueta: defaultEtiqueta,
        total: mine.length,
        today: mine.filter((s) => s.timestamp.split('T')[0] === today).length,
        week: mine.filter((s) => new Date(s.timestamp) >= weekStart).length,
        pending: mine.filter((s) => s.status === 'pendiente').length,
        repeated: mine.filter((s) => s.status === 'repetido').length,
        reviewed: mine.filter((s) => ['revisado', 'reportar'].includes(s.status)).length,
      };
    });

    return {
      totalGlobal,
      todayGlobal,
      weekGlobal,
      monthGlobal,
      pendingGlobal,
      reviewedGlobal,
      repeatedGlobal,
      perAnalyst,
    };
  };

  const handleUpdateProfile = (updatedUser) => {
    setCurrentUser(updatedUser);
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    saveUserToFirestore(updatedUser);
    addLog(
      updatedUser.email,
      'Perfil Actualizado',
      'Modificación de datos personales',
      'info'
    );
    setToastMsg('✅ Datos de perfil actualizados.');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSendMessage = ({ receptorId, receptorNombre, mensaje, imagen }) => {
    if (!currentUser) return;

    // Check that receptor exists
    const receptor = users.find((u) => u.id === receptorId);
    if (!receptor) return;

    const chatId = [currentUser.id, receptorId].sort().join('_');
    const newMsg = {
      id: `msg-${Date.now()}`,
      chatId,
      emisorId: currentUser.id,
      emisorNombre: currentUser.name,
      receptorId,
      mensaje,
      imagen: imagen || null,
      fecha: new Date().toISOString(),
      leido: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    addMessageToFirestore(newMsg);
    addLog(
      currentUser.email,
      'Mensajería - Envío',
      `Mensaje enviado a ${receptorNombre}`,
      'info'
    );
  };

  const handleMarkAsRead = (contactId) => {
    if (!currentUser) return;
    setMessages((prev) => {
      const hasUnread = prev.some(
        (m) => m.emisorId === contactId && m.receptorId === currentUser.id && !m.leido
      );
      if (!hasUnread) return prev;
      return prev.map((m) => {
        if (m.emisorId === contactId && m.receptorId === currentUser.id && !m.leido) {
          updateMessageInFirestore(m.id, { leido: true });
          return { ...m, leido: true };
        }
        return m;
      });
    });
  };

  const role = currentUser?.role;
  const isAdmin = role === 'Administrador';
  const isAnalyst = role === 'Analista';
  const isSupervisor = role === 'Supervisor';
  const isObserver = role === 'Observador';
  const stats = isAnalyst ? getStats() : null;
  const allStats = isAdmin || isSupervisor || isObserver ? getAllStats() : null;
  const pendingCount = submissions.filter((s) => s.status === 'pendiente' && !s.archived).length;
  
  const activeSubmissions = submissions.filter(s => !s.archived);

  const tabs = [];
  if (isAdmin || isObserver) {
    tabs.push(
      { id: 'dashboard', label: '🏠 Dashboard' },
      { id: 'inbox', label: '📥 Bandeja' }
    );
    if (!isObserver) {
      tabs.push({ id: 'shift', label: '📄 Reporte Turno' });
    }
    tabs.push(
      { id: 'history', label: '📖 Historial Turnos' },
      { id: 'users', label: '👥 Usuarios' },
      { id: 'stats', label: '📊 Estadísticas' },
      { id: 'logs', label: '📜 Auditoría' },
      { id: 'messaging', label: '💬 Mensajería' },
      { id: 'profile', label: '👤 Mi Perfil' }
    );
  } else if (isAnalyst) {
    tabs.push(
      { id: 'dashboard', label: '🏠 Dashboard' },
      { id: 'forms', label: '📋 Formulario' },
      { id: 'messaging', label: '💬 Mensajería' },
      { id: 'profile', label: '👤 Mi Perfil' }
    );
  } else if (isSupervisor) {
    tabs.push(
      { id: 'dashboard', label: '🏠 Dashboard' },
      { id: 'inbox', label: '📥 Bandeja' },
      { id: 'shift', label: '📄 Reporte Turno' },
      { id: 'history', label: '📖 Historial Turnos' },
      { id: 'users', label: '👥 Usuarios' },
      { id: 'messaging', label: '💬 Mensajería' },
      { id: 'profile', label: '👤 Mi Perfil' }
    );
  }

  // ── RENDER LOGIN IF NO SESSION ──
  if (!currentUser) {
    return (
      <LoginPage
        users={users}
        onLogin={handleLoginSuccess}
        loginError={loginError}
        setLoginError={setLoginError}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        addLog={addLog}
      />
    );
  }

  // ── MAIN DASHBOARD VIEW ──
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors duration-300 relative bg-radar-grid overflow-x-hidden">
      {/* ANIMATED RADAR & LASER NETWORK BACKGROUND */}
      <InteractiveBackground darkMode={darkMode} />

      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        pendingCount={pendingCount}
        unreadMessagesCount={unreadMessagesCount}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-w-0">
        <HeaderBar
          currentUser={currentUser}
          activeTab={activeTab}
          unreadMessagesCount={unreadMessagesCount}
          pendingCount={pendingCount}
        />

        {(isAdmin || isObserver) && (
          <AdministradorView
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            users={users}
            currentUser={currentUser}
            toggleStatus={toggleStatus}
            deleteUser={deleteUser}
            setEditingUser={setEditingUser}
            setShowCreateModal={setShowCreateModal}
            auditLogs={auditLogs}
            reportData={reportData}
            setReportData={setReportData}
            handleSubmitForm={handleSubmitForm}
            submissions={activeSubmissions}
            inboxFilter={inboxFilter}
            setInboxFilter={setInboxFilter}
            openSubmissionForReview={openSubmissionForReview}
            markAsReviewed={markAsReviewed}
            markAsRepeated={markAsRepeated}
            markAsReported={markAsReported}
            shiftReports={shiftReports}
            deleteSubmission={deleteSubmission}
            elements={elements}
            setElements={setElements}
            selId={selId}
            setSelId={setSelId}
            editingId={editingId}
            setEditingId={setEditingId}
            editText={editText}
            setEditText={setEditText}
            commitTextEdit={commitTextEdit}
            imageCache={imageCache}
            setImageCache={setImageCache}
            setOverlayRect={setOverlayRect}
            selectedSubmission={selectedSubmission}
            saveSubmissionEdits={saveSubmissionEdits}
            handleImageUpload={handleImageUpload}
            allStats={allStats}
            onUpdateProfile={handleUpdateProfile}
            messages={messages}
            onSendMessage={handleSendMessage}
            onMarkAsRead={handleMarkAsRead}
            isObserver={isObserver}
          />
        )}

        {isSupervisor && (
          <SupervisorView
            currentUser={currentUser}
            users={users}
            activeTab={activeTab}
            submissions={activeSubmissions}
            inboxFilter={inboxFilter}
            setInboxFilter={setInboxFilter}
            openSubmissionForReview={openSubmissionForReview}
            markAsReviewed={markAsReviewed}
            markAsRepeated={markAsRepeated}
            markAsReported={markAsReported}
            deleteSubmission={deleteSubmission}
            reportData={reportData}
            setReportData={setReportData}
            elements={elements}
            setElements={setElements}
            selId={selId}
            setSelId={setSelId}
            editingId={editingId}
            setEditingId={setEditingId}
            editText={editText}
            setEditText={setEditText}
            commitTextEdit={commitTextEdit}
            imageCache={imageCache}
            setImageCache={setImageCache}
            setOverlayRect={setOverlayRect}
            selectedSubmission={selectedSubmission}
            saveSubmissionEdits={saveSubmissionEdits}
            handleImageUpload={handleImageUpload}
            allStats={allStats}
            onUpdateProfile={handleUpdateProfile}
            messages={messages}
            onSendMessage={handleSendMessage}
            onMarkAsRead={handleMarkAsRead}
            auditLogs={auditLogs}
            handleBackupAndClear={handleBackupAndClear}
            shiftReports={shiftReports}
          />
        )}

        {isAnalyst && (
          <AnalistaView
            currentUser={currentUser}
            users={users}
            activeTab={activeTab}
            reportData={reportData}
            setReportData={setReportData}
            handleImageUpload={handleImageUpload}
            handleSubmitForm={handleSubmitForm}
            stats={stats}
            allStats={allStats}
            submissions={activeSubmissions}
            auditLogs={auditLogs}
            onUpdateProfile={handleUpdateProfile}
            messages={messages}
            onSendMessage={handleSendMessage}
            onMarkAsRead={handleMarkAsRead}
          />
        )}
      </main>

      <TextOverlay
        editingId={editingId}
        overlayRect={overlayRect}
        editText={editText}
        setEditText={setEditText}
        commitTextEdit={commitTextEdit}
        setEditingId={setEditingId}
        setOverlayRect={setOverlayRect}
      />

      <UserModal
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        formData={formData}
        setFormData={setFormData}
        modalError={modalError}
        handleCreateUser={handleCreateUser}
        users={users}
      />

      <EditUserModal
        editingUser={editingUser}
        setEditingUser={setEditingUser}
        onSaveUser={handleSaveEditedUser}
        users={users}
      />

      <Toast toastMsg={toastMsg} setToastMsg={setToastMsg} />

      {/* ── DUPLICATE WARNING MODAL ── */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-orange-400 dark:border-orange-600 w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-2xl flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  ¡Posible Reporte Duplicado!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  El sistema detectó que este reporte podría ser una repetición de uno ya existente.
                </p>
              </div>
            </div>

            {/* Matches */}
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {duplicateWarning.matches.map((m, i) => (
                <div
                  key={i}
                  className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-4 text-xs space-y-1.5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.reasons.includes('enlace') && (
                      <span className="bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2.5 py-0.5 rounded-full font-bold">
                        🔗 Mismo Enlace
                      </span>
                    )}
                    {m.reasons.includes('imagen') && (
                      <span className="bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2.5 py-0.5 rounded-full font-bold">
                        🖼️ Misma Imagen
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 space-y-0.5">
                    <div><span className="font-bold text-slate-800 dark:text-white">Sala:</span> {m.analystSala}</div>
                    <div><span className="font-bold text-slate-800 dark:text-white">Municipio:</span> {m.municipio}</div>
                    <div><span className="font-bold text-slate-800 dark:text-white">Enviado:</span> {m.fecha} a las {m.hora}</div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white">Estado actual:</span>{' '}
                      <span className={`font-bold ${
                        m.status === 'repetido' ? 'text-orange-600' :
                        m.status === 'pendiente' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {m.status === 'repetido' ? '🔁 Repetido' : m.status === 'pendiente' ? '⏳ Pendiente' : '✅ Revisado'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                onClick={() => handleConfirmDuplicate('repetido')}
                className="px-4 py-3 rounded-xl font-black text-xs bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                🔁 Enviar como Repetida
              </button>
              <button
                onClick={() => handleConfirmDuplicate('pendiente')}
                className="px-4 py-3 rounded-xl font-black text-xs bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                ✅ Enviar de Todos Modos
              </button>
              <button
                onClick={() => handleConfirmDuplicate('cancel')}
                className="px-4 py-3 rounded-xl font-black text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                ✕ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isSaving && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest animate-pulse">
              Guardando Cambios...
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Por favor, espere un momento.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
