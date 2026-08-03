"use client";

import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import UserModal from './components/UserModal';
import EditUserModal from './components/EditUserModal';
import TextOverlay from './components/TextOverlay';
import LoginPage from './login/page.jsx';
import AdministradorView from './administrador/page.jsx';
import SupervisorView from './supervisor/page.jsx';
import AnalistaView from './analista/page.jsx';
import InteractiveBackground from './components/InteractiveBackground';
import HeaderBar from './components/HeaderBar';

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
  addMessageToFirestore,
  updateMessageInFirestore,
  addAuditLogToFirestore,
} from './lib/firestoreService';

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('forms'); // will be overridden by localStorage on mount
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
    setCurrentUser(getStoredSession());
    setUsers(getStoredUsers());
    setSubmissions(getStoredSubmissions());
    setMessages(getStoredMessages());
    setAuditLogs(getStoredAuditLogs());

    // Subscribe to Firestore collections in real-time
    const unsubUsers = subscribeUsers((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data);
      }
    });
    const unsubSubs = subscribeSubmissions((data) => {
      if (data) setSubmissions(data);
    });
    const unsubMsgs = subscribeMessages((data) => {
      if (data) setMessages(data);
    });
    const unsubLogs = subscribeAuditLogs((data) => {
      if (data) setAuditLogs(data);
    });

    return () => {
      unsubUsers();
      unsubSubs();
      unsubMsgs();
      unsubLogs();
    };
  }, []);

  // ── State persistence & sync ──
  useEffect(() => {
    saveStoredSession(currentUser);
    // Only redirect to dashboard on a fresh login (not on F5 restore)
    // We use a flag: if currentUser just became non-null AND there's no saved tab, go to dashboard
    if (currentUser) {
      const savedTab = localStorage.getItem('sdm_activeTab');
      if (!savedTab) {
        setActiveTab('dashboard');
      } else {
        setActiveTab(savedTab);
      }
    }
  }, [currentUser]);

  // ── Persist activeTab so F5 restores the same section ──
  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab) {
      localStorage.setItem('sdm_activeTab', activeTab);
    }
  }, [activeTab]);

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

  // ── Init elements when entering editor tab ──
  useEffect(() => {
    if (activeTab === 'editor') {
      setElements(buildElements(reportData));
      setSelId(null);
      setEditingId(null);
    }
  }, [activeTab]); // eslint-disable-line

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
    addLog(user.email, 'Inicio de Sesión', `Ingreso como ${user.role}`, 'success');
  };

  const handleLogout = () => {
    if (currentUser) addLog(currentUser.email, 'Cierre de Sesión', 'Sesión terminada');
    setCurrentUser(null);
    setSelectedSubmission(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sdm_activeTab');
    }
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
  const handleSubmitForm = () => {
    const required = [
      'municipio',
      'fecha',
      'hora',
      'postTitle',
      'usuario',
      'contexto',
    ];
    const missing = required.filter((k) => !reportData[k]?.trim());
    if (missing.length > 0) {
      setToastMsg('⚠️ Completa todos los campos obligatorios.');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }
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
    setSubmissions((prev) => [sub, ...prev]);
    addSubmissionToFirestore(sub);
    addLog(
      currentUser.email,
      'Reporte Enviado',
      `Municipio: ${reportData.municipio}`,
      'success'
    );
    setReportData({ ...EMPTY_REPORT });
    setToastMsg('✅ Reporte enviado al Supervisor.');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const openSubmissionForReview = (sub) => {
    setSelectedSubmission(sub);
    setReportData({ ...sub.reportData });
    setActiveTab('editor');
  };

  const saveSubmissionEdits = () => {
    if (!selectedSubmission) return;
    const updatedReport = { ...reportData };
    elements.forEach((el) => {
      if (!el.sync) return;
      if (el.type === 'image' && el.src) {
        updatedReport[el.sync] = el.src;
        return;
      }
      if (el.type === 'text') {
        const val = el.tpl ? el.text.replace(el.tpl, '') : el.text;
        updatedReport[el.sync] = val;
      }
    });
    const updatedSub = {
      ...selectedSubmission,
      reportData: updatedReport,
      editedBy: currentUser.name,
      editedAt: new Date().toISOString(),
    };
    setSubmissions((prev) =>
      prev.map((s) => (s.id === selectedSubmission.id ? updatedSub : s))
    );
    addSubmissionToFirestore(updatedSub);
    addLog(
      currentUser.email,
      'Reporte Editado',
      `ID: ${selectedSubmission.id}`,
      'success'
    );
    setToastMsg('💾 Cambios guardados en la bandeja.');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const markAsReviewed = (subId) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === subId) {
          const updated = { ...s, status: 'revisado' };
          addSubmissionToFirestore(updated);
          return updated;
        }
        return s;
      })
    );
    addLog(currentUser.email, 'Reporte Revisado', `ID: ${subId}`, 'success');
    setToastMsg('✅ Marcado como revisado.');
    setTimeout(() => setToastMsg(''), 4000);
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      setReportData((prev) => ({ ...prev, evidenceImageSrc: src }));
    };
    reader.readAsDataURL(file);
  };

  const commitTextEdit = () => {
    if (!editingId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === editingId ? { ...el, text: editText } : el))
    );
    setEditingId(null);
    setOverlayRect(null);
  };

  // ── Analyst Personal Stats ──
  const getStats = () => {
    const mine = submissions.filter((s) => s.analystId === currentUser?.id);
    const now = new Date(),
      today = now.toISOString().split('T')[0];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    return {
      total: mine.length,
      today: mine.filter((s) => s.timestamp.split('T')[0] === today).length,
      week: mine.filter((s) => new Date(s.timestamp) >= weekStart).length,
      month: mine.filter(
        (s) =>
          new Date(s.timestamp) >= new Date(now.getFullYear(), now.getMonth(), 1)
      ).length,
      year: mine.filter(
        (s) => new Date(s.timestamp) >= new Date(now.getFullYear(), 0, 1)
      ).length,
      recent: mine.slice(0, 15),
    };
  };

  // ── Global Stats & Per-Analyst Breakdown (for Admin & Supervisor) ──
  const getAllStats = () => {
    const analysts = users.filter((u) => u.role === 'Analista');
    const now = new Date(),
      today = now.toISOString().split('T')[0];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    const totalGlobal = submissions.length;
    const todayGlobal = submissions.filter(
      (s) => s.timestamp.split('T')[0] === today
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
      (s) => s.status === 'revisado'
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
        reviewed: mine.filter((s) => s.status === 'revisado').length,
      };
    });

    return {
      totalGlobal,
      todayGlobal,
      weekGlobal,
      monthGlobal,
      pendingGlobal,
      reviewedGlobal,
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
  const stats = isAnalyst ? getStats() : null;
  const allStats = isAdmin || isSupervisor ? getAllStats() : null;
  const pendingCount = submissions.filter((s) => s.status === 'pendiente').length;

  const tabs = [];
  if (isAdmin) {
    tabs.push(
      { id: 'dashboard', label: '🏠 Dashboard' },
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

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-w-0 mt-[60px] md:mt-0">
        <HeaderBar
          currentUser={currentUser}
          activeTab={activeTab}
          unreadMessagesCount={unreadMessagesCount}
          pendingCount={pendingCount}
        />

        {isAdmin && (
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
            submissions={submissions}
            inboxFilter={inboxFilter}
            setInboxFilter={setInboxFilter}
            openSubmissionForReview={openSubmissionForReview}
            markAsReviewed={markAsReviewed}
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
          />
        )}

        {isSupervisor && (
          <SupervisorView
            currentUser={currentUser}
            users={users}
            activeTab={activeTab}
            submissions={submissions}
            inboxFilter={inboxFilter}
            setInboxFilter={setInboxFilter}
            openSubmissionForReview={openSubmissionForReview}
            markAsReviewed={markAsReviewed}
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
            submissions={submissions}
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
    </div>
  );
}
