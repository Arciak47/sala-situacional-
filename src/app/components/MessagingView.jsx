"use client";

import { useState, useEffect, useRef } from 'react';
import { ROLE_BADGES } from '../lib/constants';

export default function MessagingView({
  currentUser,
  users,
  messages,
  onSendMessage,
  onMarkAsRead,
}) {
  const [activeContact, setActiveContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [textInput, setTextInput] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const chatEndRef = useRef(null);

  // Available contacts filtered by role hierarchy:
  // Administrador ↔ Supervisor ↔ Analista
  const contacts = users.filter((u) => {
    if (u.id === currentUser?.id) return false;
    if (currentUser?.role === 'Administrador') {
      return u.role === 'Supervisor';
    }
    if (currentUser?.role === 'Supervisor') {
      return u.role === 'Administrador' || u.role === 'Analista';
    }
    if (currentUser?.role === 'Analista') {
      return u.role === 'Supervisor';
    }
    return false;
  });

  // Set default active contact if none selected
  useEffect(() => {
    if (!activeContact && contacts.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveContact(contacts[0]);
    }
  }, [contacts, activeContact]);

  // Mark unread messages from active contact as read when opening or receiving messages
  useEffect(() => {
    if (activeContact && currentUser && onMarkAsRead) {
      const hasUnread = messages.some(
        (m) =>
          m.emisorId === activeContact.id &&
          m.receptorId === currentUser.id &&
          !m.leido
      );
      if (hasUnread) {
        onMarkAsRead(activeContact.id);
      }
    }
  }, [activeContact?.id, currentUser?.id, messages, onMarkAsRead]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeContact]);

  // Filter messages for the selected chat conversation
  const currentChatId = activeContact
    ? [currentUser.id, activeContact.id].sort().join('_')
    : null;

  const chatMessages = messages.filter((m) => m.chatId === currentChatId);

  // Unread message count helper per contact
  const getUnreadCount = (contactId) => {
    return messages.filter(
      (m) =>
        m.emisorId === contactId &&
        m.receptorId === currentUser?.id &&
        !m.leido
    ).length;
  };

  // Get last message preview for contact
  const getLastMessage = (contactId) => {
    const cId = [currentUser.id, contactId].sort().join('_');
    const conversation = messages.filter((m) => m.chatId === cId);
    if (conversation.length === 0) return null;
    return conversation[conversation.length - 1];
  };

  // Handle sending a message
  const handleSend = (e) => {
    e.preventDefault();
    if ((!textInput.trim() && !attachedImage) || !activeContact) return;

    onSendMessage({
      receptorId: activeContact.id,
      receptorNombre: activeContact.name,
      mensaje: textInput.trim(),
      imagen: attachedImage,
    });

    setTextInput('');
    setAttachedImage(null);
  };

  // Handle file attachment upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 800;
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
        // Compress as JPEG
        setAttachedImage(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row h-[calc(100vh-200px)] sm:h-[680px] max-h-[78vh] min-h-[400px] sm:min-h-[480px]">
      {/* ── LEFT PANEL: CONTACTS LIST ── */}
      <div className={`w-full md:w-80 lg:w-96 border-r-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/40 ${activeContact ? 'hidden md:flex' : 'flex'}`}>
        {/* HEADER & SEARCH BAR */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>💬 Mensajería Interna</span>
            </h2>
            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
              Chat Institucional
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar contacto o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <span className="absolute left-3 top-2.5 text-xs text-slate-400">
              🔍
            </span>
          </div>
        </div>

        {/* CONTACTS SCROLL LIST */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
          {contacts
            .filter(
              (c) =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.department.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((c) => {
              const isActive = activeContact?.id === c.id;
              const unread = getUnreadCount(c.id);
              const lastMsg = getLastMessage(c.id);
              const badge = ROLE_BADGES[c.role] || ROLE_BADGES.Analista;

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveContact(c)}
                  className={`w-full p-3 rounded-2xl transition-all flex items-start gap-3 text-left cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 shadow-md border border-slate-200/80 dark:border-slate-700'
                      : 'hover:bg-white/60 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                        c.status === 'Activo' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {c.name}
                      </h4>
                      {lastMsg && (
                        <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                          {new Date(lastMsg.fecha).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span
                        className={`text-[9px] font-bold ${badge.color} px-1.5 py-0.2 rounded-md truncate max-w-[120px]`}
                      >
                        {badge.icon} {c.role}
                      </span>

                      {unread > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black animate-pulse">
                          {unread}
                        </span>
                      )}
                    </div>

                    {lastMsg && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">
                        {lastMsg.emisorId === currentUser.id ? 'Tú: ' : ''}
                        {lastMsg.imagen ? '📷 Imagen' : lastMsg.mensaje}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* ── RIGHT PANEL: ACTIVE CHAT STREAM ── */}
      {activeContact ? (
        <div className={`flex-1 flex flex-col h-full bg-slate-100/40 dark:bg-slate-950/40 ${activeContact ? 'flex' : 'hidden md:flex'}`}>
          {/* ACTIVE CHAT HEADER */}
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setActiveContact(null)}
                className="md:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex-shrink-0 cursor-pointer"
                aria-label="Volver a contactos"
              >
                ←
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                {activeContact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 truncate">
                  <span className="truncate">{activeContact.name}</span>
                  <span
                    className={`text-[9px] font-bold hidden sm:inline ${
                      (ROLE_BADGES[activeContact.role] || ROLE_BADGES.Analista)
                        .color
                    } px-2 py-0.2 rounded-full`}
                  >
                    {activeContact.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate">
                  <span className="hidden sm:inline">{activeContact.email} • </span>{activeContact.department}
                </div>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-400 hidden sm:block">
              <span className="font-bold text-emerald-600">
                ● {activeContact.status}
              </span>
            </div>
          </div>

          {/* MESSAGES LIST */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                <span className="text-4xl">👋</span>
                <p className="text-xs font-bold text-slate-500">
                  Inicia la conversación con {activeContact.name}.
                </p>
                <p className="text-[10px] text-slate-400">
                  Los mensajes enviados quedarán registrados de forma segura.
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.emisorId === currentUser.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isMe ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[70%] p-2.5 sm:p-3.5 rounded-2xl shadow-sm space-y-1.5 ${
                        isMe
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                      }`}
                    >
                      {!isMe && (
                        <div className="text-[10px] font-bold text-red-600 dark:text-red-400">
                          {msg.emisorNombre}
                        </div>
                      )}

                      {msg.imagen && (
                        <div className="rounded-xl overflow-hidden border border-white/20 my-1">
                          <img
                            src={msg.imagen}
                            alt="Adjunto"
                            className="max-h-60 w-full object-cover"
                          />
                        </div>
                      )}

                      {msg.mensaje && (
                        <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                          {msg.mensaje}
                        </p>
                      )}

                      <div
                        className={`flex items-center justify-end gap-1 text-[9px] font-semibold mt-1 ${
                          isMe
                            ? 'text-red-100'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <span>
                          {new Date(msg.fecha).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMe && <span>{msg.leido ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ATTACHMENT PREVIEW IF ANY */}
          {attachedImage && (
            <div className="px-4 py-2 bg-slate-200 dark:bg-slate-800 flex items-center justify-between border-t border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <img
                  src={attachedImage}
                  alt="Vista previa"
                  className="w-10 h-10 rounded-lg object-cover border"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  📷 Imagen adjunta lista para enviar
                </span>
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                ✕ Quitar
              </button>
            </div>
          )}

          {/* INPUT BAR */}
          <form
            onSubmit={handleSend}
            className="p-2 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2"
          >
            <label
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-sm transition-all"
              title="Adjuntar archivo o imagen"
            >
              📎
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <input
              type="text"
              placeholder={`Escribir mensaje a ${activeContact.name}...`}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <button
              type="submit"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex-shrink-0"
            >
              <span className="hidden sm:inline">Enviar</span>
              <span>📤</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <span className="text-5xl mb-2">💬</span>
          <p className="text-sm font-bold">Selecciona un contacto para chatear.</p>
        </div>
      )}
    </div>
  );
}
