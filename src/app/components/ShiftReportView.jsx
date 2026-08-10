"use client";

import { useState, useRef, useEffect } from 'react';
import { exportCombinedReportAndFichasHDPDF } from '../lib/exportUtils';
import { addShiftReportRecord, saveShiftReportDraft, subscribeShiftReportDraft } from '../lib/firestoreService';

// Official Social Networks High-Resolution Logo SVG Data URLs
const SOCIAL_LOGOS = {
  FACEBOOK: "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 40 40\"><circle cx=\"20\" cy=\"20\" r=\"20\" fill=\"%231877F2\"/><path fill=\"%23FFFFFF\" d=\"M25 20h-3v11h-4V20h-2v-4h2v-2.2C18 11.5 19.5 10 22.8 10H26v4h-2c-1.2 0-1.5.6-1.5 1.5V16h3.5L25 20z\"/></svg>",
  INSTAGRAM: "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 40 40\"><radialGradient id=\"rg\" cx=\"20%\" cy=\"100%\" r=\"120%\"><stop offset=\"0%\" stop-color=\"%23ffc837\"/><stop offset=\"25%\" stop-color=\"%23ff8008\"/><stop offset=\"50%\" stop-color=\"%23e100ff\"/><stop offset=\"100%\" stop-color=\"%237000ff\"/></radialGradient><rect width=\"40\" height=\"40\" rx=\"10\" fill=\"url(%23rg)\"/><rect x=\"8\" y=\"8\" width=\"24\" height=\"24\" rx=\"7\" fill=\"none\" stroke=\"%23ffffff\" stroke-width=\"2.5\"/><circle cx=\"20\" cy=\"20\" r=\"6\" fill=\"none\" stroke=\"%23ffffff\" stroke-width=\"2.5\"/><circle cx=\"26.5\" cy=\"13.5\" r=\"1.5\" fill=\"%23ffffff\"/></svg>",
  TIKTOK: "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 40 40\"><rect width=\"40\" height=\"40\" rx=\"10\" fill=\"%23000000\"/><path fill=\"%2300F2FE\" d=\"M22.5 10a7 7 0 0 0 4.5 4.5V18a10.5 10.5 0 0 1-4.5-1.2V24a6.5 6.5 0 1 1-6.5-6.5c.5 0 1 .05 1.5.15V21a3.5 3.5 0 1 0 2 3.2V10h3z\"/><path fill=\"%23FE2C55\" d=\"M23.5 10a7 7 0 0 0 4.5 4.5V17a10.5 10.5 0 0 1-4.5-1.2V23a6.5 6.5 0 1 1-6.5-6.5c.5 0 1 .05 1.5.15V19.5a3.5 3.5 0 1 0 2 3.2V10h3.5z\"/></svg>",
  X: "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 40 40\"><rect width=\"40\" height=\"40\" rx=\"10\" fill=\"%23000000\"/><path fill=\"%23ffffff\" d=\"M25.7 10h3.8l-8.3 9.5 9.8 13.5h-7.7l-6-7.9-6.9 7.9H6.6l8.9-10.2L6 10h7.9l5.4 7.2L25.7 10zm-1.3 20.7h2.1L13.5 12.2h-2.3l13.2 18.5z\"/></svg>",
  TELEGRAM: "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 40 40\"><circle cx=\"20\" cy=\"20\" r=\"20\" fill=\"%23229ED9\"/><path fill=\"%23ffffff\" d=\"M10 19.5l18.5-7.5c.8-.3 1.5.2 1.2 1.3l-3.2 15c-.2 1.1-.9 1.4-1.8.8l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.3-5.1 9.3-8.4c.4-.4-.1-.6-.6-.3l-11.5 7.2-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6z\"/></svg>",
};

function drawCard(ctx, x, y, w, h, title) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#032b69';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#032b69';
  ctx.beginPath();
  ctx.roundRect(x, y, Math.min(w, 360), 38, [18, 0, 18, 0]);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 14px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, x + 16, y + 24);
  ctx.restore();
}

function drawWrappedText(ctx, text, x, y, maxW, lineH) {
  const lines = (text || '').split('\n');
  let cy = y;
  for (const line of lines) {
    const words = line.split(' ');
    let cur = '';
    for (const w of words) {
      if (ctx.measureText(cur + w + ' ').width > maxW && cur) {
        ctx.fillText(cur.trimEnd(), x, cy);
        cur = w + ' ';
        cy += lineH;
      } else {
        cur += w + ' ';
      }
    }
    if (cur.trim()) {
      ctx.fillText(cur.trimEnd(), x, cy);
      cy += lineH;
    }
  }
}

function drawSentimentGauge(ctx, cx, cy, pos, neu, neg) {
  ctx.save();
  const radius = 55;
  const lineWidth = 16;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, Math.PI * 1.33, false);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 1.33, Math.PI * 1.67, false);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 1.67, Math.PI * 2, false);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  const total = pos + neu + neg;
  let angle = Math.PI * 1.5;
  if (total > 0) {
    if (neg > pos && neg > neu) angle = Math.PI * 1.15;
    else if (pos > neg && pos > neu) angle = Math.PI * 1.85;
  }

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * (radius - 5), cy + Math.sin(angle) * (radius - 5));
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

export default function ShiftReportView({ submissions = [], users = [], currentUser }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedShift, setSelectedShift] = useState('t1');
  const [selectedFichasIds, setSelectedFichasIds] = useState([]);
  const [fichasShiftFilter, setFichasShiftFilter] = useState('Todos');

  const [analystsCount, setAnalystsCount] = useState(0);
  const [activitiesText, setActivitiesText] = useState('• ');

  const [receivedReportsTotal, setReceivedReportsTotal] = useState(0);
  const [activatedRooms, setActivatedRooms] = useState(0);
  const [reportingRooms, setReportingRooms] = useState(0);
  const [pendingRooms, setPendingRooms] = useState(0);

  const [customRooms, setCustomRooms] = useState([]);

  const [facebookCount, setFacebookCount] = useState(0);
  const [instagramCount, setInstagramCount] = useState(0);
  const [tiktokCount, setTiktokCount] = useState(0);
  const [xCount, setXCount] = useState(0);
  const [telegramCount, setTelegramCount] = useState(0);

  const [posCount, setPosCount] = useState(0);
  const [neuCount, setNeuCount] = useState(0);
  const [negCount, setNegCount] = useState(0);

  const [recommendationsText, setRecommendationsText] = useState('• ');

  // Estado del guardado automático del borrador
  // 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');
  const [draftLoadedAt, setDraftLoadedAt] = useState(null);
  const saveTimerRef = useRef(null);
  const isLoadingDraftRef = useRef(false);

  const canvasRef = useRef(null);
  const [loadedLogos, setLoadedLogos] = useState({});

  // ── Refs para auto-llenado seguro sin closures obsoletos ──
  // handleAutoFillRef siempre apunta a la versión más reciente de handleAutoFillFromDB
  // para poder llamarla desde dentro de callbacks de Firestore sin stale closure.
  const handleAutoFillRef = useRef(null);
  // autoFillPendingRef se activa cuando el borrador no existe y hay que auto-llenar.
  const autoFillPendingRef = useRef(false);

  useEffect(() => {
    const cache = {};
    let loadedCounter = 0;
    const keys = Object.keys(SOCIAL_LOGOS);

    keys.forEach((key) => {
      const img = new Image();
      img.src = SOCIAL_LOGOS[key];
      img.onload = () => {
        cache[key] = img;
        loadedCounter++;
        if (loadedCounter === keys.length) {
          setLoadedLogos(cache);
        }
      };
    });
  }, []);

  // DEBUG: log all submissions with their parsed date/status to diagnose filter issues
  useEffect(() => {
    console.group('[ShiftReportView] Submissions recibidas:', submissions.length);
    submissions.forEach(s => {
      let subDate = s.reportData?.fechaRaw || s.reportData?.fecha || (s.timestamp ? s.timestamp.split('T')[0] : 'SIN-FECHA');
      if (subDate.includes('/')) {
        const parts = subDate.split('/');
        if (parts.length === 3) subDate = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
      } else if (subDate.includes('T')) {
        subDate = subDate.split('T')[0];
      }
      console.log(`  ID: ${s.id} | status: "${s.status}" | fecha parseada: "${subDate}" | selectedDate: "${selectedDate}" | match: ${subDate === selectedDate}`);
    });
    console.groupEnd();
  }, [submissions, selectedDate]);

  // ── AUTO-GUARDADO CON DEBOUNCE (1.5s) ──────────────────────────────────
  // Observa todos los campos del formulario y guarda el borrador en Firestore
  // 1.5 segundos después del último cambio. No guarda mientras se está
  // cargando un borrador (isLoadingDraftRef.current === true).
  useEffect(() => {
    if (isLoadingDraftRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveShiftReportDraft({
          fecha: selectedDate,
          turno: selectedShift,
          analystsCount,
          activitiesText,
          receivedReportsTotal,
          activatedRooms,
          reportingRooms,
          pendingRooms,
          customRooms,
          facebookCount,
          instagramCount,
          tiktokCount,
          xCount,
          telegramCount,
          posCount,
          neuCount,
          negCount,
          recommendationsText,
          savedAt: new Date().toISOString(),
          savedBy: currentUser ? currentUser.name || currentUser.email : 'Sistema',
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 1500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    selectedDate, selectedShift,
    analystsCount, activitiesText,
    receivedReportsTotal, activatedRooms, reportingRooms, pendingRooms,
    customRooms,
    facebookCount, instagramCount, tiktokCount, xCount, telegramCount,
    posCount, neuCount, negCount,
    recommendationsText,
  ]);

  // ── CARGA AUTOMÁTICA DEL BORRADOR ──────────────────────────────────────
  // Cuando el usuario cambia fecha o turno, busca en Firestore si existe
  // un borrador guardado y pre-carga todos los campos. Si no existe,
  // resetea el formulario a los valores por defecto.
  useEffect(() => {
    isLoadingDraftRef.current = true;
    autoFillPendingRef.current = false; // reset
    setSaveStatus('idle');
    setDraftLoadedAt(null);

    const unsubscribe = subscribeShiftReportDraft(selectedDate, selectedShift, (draft) => {
      if (draft) {
        // Pre-cargar campos con el borrador guardado
        setAnalystsCount(draft.analystsCount ?? 0);
        setActivitiesText(draft.activitiesText ?? '\u2022 ');
        setReceivedReportsTotal(draft.receivedReportsTotal ?? 0);
        setActivatedRooms(draft.activatedRooms ?? 0);
        setReportingRooms(draft.reportingRooms ?? 0);
        setPendingRooms(draft.pendingRooms ?? 0);
        setCustomRooms(draft.customRooms ?? []);
        setFacebookCount(draft.facebookCount ?? 0);
        setInstagramCount(draft.instagramCount ?? 0);
        setTiktokCount(draft.tiktokCount ?? 0);
        setXCount(draft.xCount ?? 0);
        setTelegramCount(draft.telegramCount ?? 0);
        setPosCount(draft.posCount ?? 0);
        setNeuCount(draft.neuCount ?? 0);
        setNegCount(draft.negCount ?? 0);
        setRecommendationsText(draft.recommendationsText ?? '\u2022 ');
        setDraftLoadedAt(draft.savedAt || null);
        autoFillPendingRef.current = false; // borrador encontrado, no auto-llenar
      } else {
        // Sin borrador: resetear a valores por defecto
        setAnalystsCount(0);
        setActivitiesText('\u2022 ');
        setReceivedReportsTotal(0);
        setActivatedRooms(0);
        setReportingRooms(0);
        setPendingRooms(0);
        setCustomRooms([]);
        setFacebookCount(0);
        setInstagramCount(0);
        setTiktokCount(0);
        setXCount(0);
        setTelegramCount(0);
        setPosCount(0);
        setNeuCount(0);
        setNegCount(0);
        setRecommendationsText('\u2022 ');
        setDraftLoadedAt(null);
        autoFillPendingRef.current = true; // sin borrador → auto-llenar desde la BD
      }
      // Esperar un tick para que React procese los setState antes de
      // reactivar el auto-guardado, evitando un guardado espurio al cargar.
      // Si no había borrador, ahora también disparamos el auto-llenado.
      setTimeout(() => {
        isLoadingDraftRef.current = false;
        if (autoFillPendingRef.current) {
          autoFillPendingRef.current = false;
          handleAutoFillRef.current?.();
        }
      }, 150);
    });

    return () => {
      unsubscribe();
      isLoadingDraftRef.current = false;
    };
  }, [selectedDate, selectedShift]);

  const handleAddRoom = () => {
    if (customRooms.length >= 14) {
      alert('Máximo 14 salas soportadas simultáneamente en el lienzo del reporte (2 columnas de 7 salas).');
      return;
    }
    setCustomRooms((prev) => [
      ...prev,
      { id: 'rm-' + Date.now(), name: `SALA ${prev.length + 1}`, count: 0, unit: '' },
    ]);
  };

  const handleRemoveRoom = (id) => {
    setCustomRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRoom = (id, field, value) => {
    setCustomRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleAutoFillFromDB = () => {
    const filteredSubs = submissions.filter((s) => {
      let subDate = '';
      if (s.reportData?.fechaRaw) {
        subDate = s.reportData.fechaRaw;
      } else if (s.reportData?.fecha) {
        subDate = s.reportData.fecha;
      } else if (s.timestamp) {
        const d = new Date(s.timestamp);
        if (!isNaN(d)) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          subDate = `${yyyy}-${mm}-${dd}`;
        } else {
          subDate = s.timestamp.split('T')[0];
        }
      }

      if (subDate.includes('/')) {
        const parts = subDate.split('/');
        if (parts.length === 3) {
          subDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else if (subDate.includes('T')) {
        subDate = subDate.split('T')[0];
      }

      if (selectedDate && subDate && subDate !== selectedDate) return false;
      if (selectedShift === 'all') return true;

      let hour = 12;
      if (s.reportData?.hora) {
        const hMatch = s.reportData.hora.match(/^(\d{1,2})/);
        if (hMatch) {
          hour = parseInt(hMatch[1], 10);
          const horaStr = s.reportData.hora.toLowerCase();
          if (horaStr.includes('p.m') || horaStr.includes('pm')) {
            if (hour < 12) hour += 12;
          } else if (horaStr.includes('a.m') || horaStr.includes('am')) {
            if (hour === 12) hour = 0;
          }
        }
      } else if (s.timestamp) {
        hour = new Date(s.timestamp).getHours();
      }

      if (selectedShift === 't1') return hour >= 0 && hour < 13;
      if (selectedShift === 't2') return hour >= 13 && hour < 19;
      if (selectedShift === 't3') return hour >= 19 || hour === 0;
      return true;
    });

    const activeAnalysts = new Set(
      filteredSubs.map((s) => s.analystId || s.analystEmail || s.analystName).filter(Boolean)
    ).size;
    setAnalystsCount(activeAnalysts);

    let fb = 0, ig = 0, tk = 0, x = 0, tg = 0;
    let pos = 0, neu = 0, neg = 0;

    filteredSubs.forEach((s) => {
      const net = (s.reportData?.redSocial || '').toUpperCase();
      if (net.includes('FACEBOOK')) fb++;
      else if (net.includes('INSTAGRAM')) ig++;
      else if (net.includes('TIKTOK')) tk++;
      else if (net.includes('TWITTER') || net === 'X') x++;
      else if (net.includes('TELEGRAM')) tg++;

      const sent = (s.reportData?.sentimiento || '').toUpperCase();
      if (sent === 'POSITIVO') pos++;
      else if (sent === 'NEUTRO') neu++;
      else if (sent === 'NEGATIVO') neg++;
    });

    setFacebookCount(fb);
    setInstagramCount(ig);
    setTiktokCount(tk);
    setXCount(x);
    setTelegramCount(tg);

    setPosCount(pos);
    setNeuCount(neu);
    setNegCount(neg);

    setReceivedReportsTotal(filteredSubs.length);

    if (customRooms.length === 0) {
      // Agrupar submissions por sala (usando analystSala o analystSalaCodigo)
      const salaCountMap = {};
      filteredSubs.forEach((s) => {
        const salaKey = s.analystSala || s.analystSalaCodigo || 'SALA PRINCIPAL';
        const salaUpper = salaKey.toUpperCase();
        salaCountMap[salaUpper] = (salaCountMap[salaUpper] || 0) + 1;
      });

      const salaKeys = Object.keys(salaCountMap);

      if (salaKeys.length > 0) {
        // Generar salas dinámicamente con los conteos reales
        const newRooms = salaKeys.map((salaName, idx) => ({
          id: `r-auto-${idx}`,
          name: salaName,
          count: salaCountMap[salaName],
          unit: '',
        }));
        setCustomRooms(newRooms);
      } else {
        // Sin submissions: usar el template por defecto
        setCustomRooms([
          { id: 'r1', name: 'SALA PRINCIPAL', count: 0, unit: '' },
          { id: 'r2', name: 'SALA CLEBG', count: 0, unit: 'REPORTES' },
          { id: 'r3', name: 'SALA POSICIONAMIENTO DE GESTIÓN', count: 0, unit: '' },
        ]);
      }
    } else {
      // Ya hay salas cargadas: actualizar solo los conteos de las que coincidan
      const salaCountMap = {};
      filteredSubs.forEach((s) => {
        const salaKey = s.analystSala || s.analystSalaCodigo || 'SALA PRINCIPAL';
        const salaUpper = salaKey.toUpperCase();
        salaCountMap[salaUpper] = (salaCountMap[salaUpper] || 0) + 1;
      });

      setCustomRooms((prev) =>
        prev.map((rm) => {
          const nameUpper = (rm.name || '').toUpperCase();
          if (salaCountMap[nameUpper] !== undefined) {
            return { ...rm, count: salaCountMap[nameUpper] };
          }
          return rm;
        })
      );
    }
  };

  // ── Mantener handleAutoFillRef siempre actualizado ──
  // useEffect sin deps (corre cada render) asegura que el ref apunte
  // a la función con el closure más reciente de submissions, selectedDate, etc.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    handleAutoFillRef.current = handleAutoFillFromDB;
  });

  const [year, month, day] = selectedDate ? selectedDate.split('-') : ['2026', '08', '01'];
  const formattedDateHeader = `${day} / ${month} / ${year}`;

  const shiftTimeLabel =
    selectedShift === 't1'
      ? '01:00PM'
      : selectedShift === 't2'
      ? '07:00PM'
      : selectedShift === 't3'
      ? '12:00AM'
      : 'COMPLETO';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const CW = 1200;
    const CH = 750;

    canvas.width = CW;
    canvas.height = CH;

    const bgImg = new Image();
    bgImg.src = '/canvas-bg.png';
    bgImg.onload = () => drawFullReport();
    bgImg.onerror = () => drawFullReport();

    const logoImg = new Image();
    logoImg.src = '/logo.png';
    logoImg.onload = () => drawFullReport();

    function drawFullReport() {
      if (bgImg.complete && bgImg.naturalWidth) {
        ctx.drawImage(bgImg, 0, 0, CW, CH);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CW, CH);
      }

      if (logoImg.complete && logoImg.naturalWidth) {
        ctx.drawImage(logoImg, 45, 12, 70, 70);
      }

      ctx.fillStyle = '#032b69';
      ctx.font = '900 36px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('REPORTE INFORMATIVO', CW / 2, 48);

      ctx.fillStyle = '#032b69';
      ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`FECHA: ${formattedDateHeader}`, 1150, 32);
      ctx.fillText(`HORA: ${shiftTimeLabel}`, 1150, 54);

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#032b69';
      ctx.beginPath();
      ctx.moveTo(40, 90);
      ctx.lineTo(580, 90);
      ctx.stroke();

      ctx.strokeStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(590, 90);
      ctx.lineTo(1160, 90);
      ctx.stroke();

      drawCard(ctx, 40, 110, 540, 260, '1️⃣  ORGANIZACIÓN');

      ctx.fillStyle = '#032b69';
      ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('👥  ANALISTAS ACTIVOS:', 70, 175);

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(280, 155, 90, 32, 8);
      ctx.fill();
      ctx.fillStyle = '#032b69';
      ctx.font = '900 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(analystsCount).padStart(2, '0'), 325, 178);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(70, 198);
      ctx.lineTo(550, 198);
      ctx.stroke();

      ctx.fillStyle = '#032b69';
      ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('📋  ACTIVIDADES REALIZADAS:', 70, 218);

      ctx.fillStyle = '#0f172a';
      ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
      drawWrappedText(ctx, activitiesText, 70, 238, 480, 18);

      drawCard(ctx, 600, 110, 560, 260, '2️⃣  REPORTES DE SALAS EXTERNAS');

      ctx.fillStyle = '#032b69';
      ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🖥️ REPORTES RECIBIDOS: ${receivedReportsTotal}`, 625, 172);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(625, 185);
      ctx.lineTo(1135, 185);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 11.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `• ACTIVADAS: ${String(activatedRooms).padStart(2, '0')}   |   • REPORTANDO: ${String(reportingRooms).padStart(2, '0')}   |   • PENDIENTES: ${String(pendingRooms).padStart(2, '0')}`,
        625,
        205
      );

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(625, 218);
      ctx.lineTo(1135, 218);
      ctx.stroke();

      customRooms.forEach((r, idx) => {
        const isRightCol = idx >= 7;
        const colX = isRightCol ? 885 : 625;
        const rowInCol = idx % 7;
        const lineY = 236 + rowInCol * 18;

        if (lineY <= 358) {
          ctx.font = '800 10.5px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#032b69';
          ctx.textAlign = 'left';
          const nameUpper = (r.name || 'SALA').toUpperCase();
          const unitStr = r.unit ? ` ${r.unit.toUpperCase()}` : '';
          const countStr = String(r.count).padStart(2, '0');
          ctx.fillText(`${nameUpper}: ${countStr}${unitStr}`, colX, lineY);
        }
      });

      drawCard(ctx, 40, 390, 540, 290, '3️⃣  ANÁLISIS RÁPIDO');

      ctx.fillStyle = '#032b69';
      ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('REDES MONITOREADAS', 180, 442);
      ctx.fillText('SENTIMIENTO GENERAL', 420, 442);

      const nets = [
        { key: 'FACEBOOK', name: 'Facebook:', val: facebookCount },
        { key: 'INSTAGRAM', name: 'Instagram:', val: instagramCount },
        { key: 'TIKTOK', name: 'TikTok:', val: tiktokCount },
        { key: 'X', name: 'X (Twitter):', val: xCount },
        { key: 'TELEGRAM', name: 'Telegram:', val: telegramCount },
      ];

      nets.forEach((n, idx) => {
        const lineY = 475 + idx * 36;

        const logoImg = loadedLogos[n.key];
        if (logoImg && logoImg.complete) {
          ctx.drawImage(logoImg, 75, lineY - 15, 22, 22);
        }

        ctx.fillStyle = '#0f172a';
        ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(n.name, 105, lineY);

        ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(String(n.val).padStart(2, '0'), 270, lineY);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(230, lineY + 4);
        ctx.lineTo(275, lineY + 4);
        ctx.stroke();
      });

      drawSentimentGauge(ctx, 420, 510, posCount, neuCount, negCount);

      ctx.textAlign = 'left';
      ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';

      ctx.fillStyle = '#166534';
      ctx.fillText('🟢 POSITIVAS:', 340, 575);
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(String(posCount).padStart(2, '0'), 460, 575);

      ctx.fillStyle = '#b45309';
      ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('🟡 NEUTRAS:', 340, 605);
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(String(neuCount).padStart(2, '0'), 460, 605);

      ctx.fillStyle = '#991b1b';
      ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('🔴 NEGATIVAS:', 340, 635);
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(String(negCount).padStart(2, '0'), 460, 635);

      drawCard(ctx, 600, 390, 560, 290, '4️⃣  SUGERENCIAS Y RECOMENDACIONES');

      ctx.fillStyle = '#032b69';
      ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('💡  RECOMENDACIONES DE LA SALA:', 630, 445);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(630, 465);
      ctx.lineTo(1130, 465);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
      drawWrappedText(ctx, recommendationsText, 630, 495, 500, 22);
    }

    drawFullReport();
  }, [
    selectedDate,
    selectedShift,
    analystsCount,
    activitiesText,
    receivedReportsTotal,
    activatedRooms,
    reportingRooms,
    pendingRooms,
    customRooms,
    facebookCount,
    instagramCount,
    tiktokCount,
    xCount,
    telegramCount,
    posCount,
    neuCount,
    negCount,
    recommendationsText,
    loadedLogos,
    formattedDateHeader,
    shiftTimeLabel,
  ]);

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Reporte_Informativo_Turno_${selectedDate}_${selectedShift}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const handleDownloadPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png', 1.0);
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte_Informativo_Turno_${selectedDate}</title>
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; height: 100vh; }
          img { width: 100%; max-height: 100vh; object-fit: contain; }
          @page { size: landscape; margin: 0; }
        </style>
      </head>
      <body>
        <img src="${imgData}" />
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleExportCombinedPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Filter the selected submissions from the full list
    const selectedFichas = submissions.filter(s => selectedFichasIds.includes(s.id));
    
    await exportCombinedReportAndFichasHDPDF(canvas, selectedFichas, `Reporte_Completo_${selectedDate}`);
    
    // Guardar el registro en el historial de turnos
    try {
      const fichasDetails = selectedFichas.map(f => ({
        id: f.id,
        title: f.reportData?.postTitle || 'Ficha sin título',
        status: f.status || '',
        imageSrc: f.reportData?.evidenceImageSrc || ''
      }));

      // Extraer imagen miniatura del reporte completo
      const reportImage = canvas.toDataURL('image/jpeg', 0.5);

      const record = {
        id: Date.now().toString(),
        fecha: selectedDate,
        hora: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
        creadoPor: currentUser ? `${currentUser.name} (${currentUser.email})` : 'Desconocido',
        totalFichas: selectedFichas.length,
        fichasIds: selectedFichasIds,
        fichasDetails: fichasDetails,
        reportImage: reportImage,
        timestamp: new Date().toISOString()
      };
      
      await addShiftReportRecord(record);
    } catch (error) {
      console.warn("Error al guardar el historial del turno:", error);
    }
  };

  const reportablesDelTurno = submissions.filter(s => {
    const st = (s.status || '').toLowerCase().trim();
    const isReportable = (st === 'reportar' || st === 'reportado');
    if (!isReportable) return false;

    // Helper: convert any ISO/DD-MM-YYYY/timestamp to YYYY-MM-DD in LOCAL time
    const toLocalDate = (raw) => {
      if (!raw) return '';
      if (raw.includes('T') || (raw.length > 10 && raw.includes('-'))) {
        // ISO string → parse as Date and use local date parts
        const d = new Date(raw);
        if (!isNaN(d)) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        }
      }
      if (raw.includes('/')) {
        const parts = raw.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
      }
      return raw.split('T')[0];
    };

    let matchDate = false;

    // 1. Primary: use reportedAt (the exact moment it was marked 'Para Reportar')
    if (s.reportedAt) {
      if (toLocalDate(s.reportedAt) === selectedDate) matchDate = true;
    }

    // 2. Fallback: use the form date (reportData.fecha) or submission timestamp
    if (!matchDate) {
      const formDate = toLocalDate(s.reportData?.fechaRaw || s.reportData?.fecha || '');
      if (formDate && formDate === selectedDate) matchDate = true;
    }

    // 3. Last resort: submission creation timestamp
    if (!matchDate && s.timestamp) {
      if (toLocalDate(s.timestamp) === selectedDate) matchDate = true;
    }

    return matchDate;
  });

  const filteredReportables = reportablesDelTurno.filter(s => {
    if (fichasShiftFilter === 'Todos') return true;
    
    let hour = 12;
    if (s.reportData?.hora) {
      const hMatch = s.reportData.hora.match(/^(\d{1,2})/);
      if (hMatch) {
        hour = parseInt(hMatch[1], 10);
        const horaStr = s.reportData.hora.toLowerCase();
        if ((horaStr.includes('p.m') || horaStr.includes('pm')) && hour < 12) hour += 12;
        if ((horaStr.includes('a.m') || horaStr.includes('am')) && hour === 12) hour = 0;
      }
    } else if (s.timestamp) {
      hour = new Date(s.timestamp).getHours();
    }
    
    if (fichasShiftFilter === 'Turno 1') return hour >= 0 && hour < 13;
    if (fichasShiftFilter === 'Turno 2') return hour >= 13 && hour < 19;
    if (fichasShiftFilter === 'Turno 3') return hour >= 19 || hour === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── HEADER & QUICK EXPORT ACTIONS ── */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋 Editor Interactivo de Reporte Informativo de Turno (Supervisor)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Soporte ampliado para hasta 14 Salas Externas en 2 columnas, valores en 0 y logos oficiales
            </p>
            {/* Badge de submissions disponibles para la fecha/turno activo */}
            {(() => {
              const countForBadge = submissions.filter((s) => {
                let subDate = '';
                if (s.reportData?.fechaRaw) {
                  subDate = s.reportData.fechaRaw;
                } else if (s.reportData?.fecha) {
                  subDate = s.reportData.fecha;
                } else if (s.timestamp) {
                  const d = new Date(s.timestamp);
                  if (!isNaN(d)) {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    subDate = `${yyyy}-${mm}-${dd}`;
                  } else {
                    subDate = s.timestamp.split('T')[0];
                  }
                }

                if (subDate.includes('/')) {
                  const parts = subDate.split('/');
                  if (parts.length === 3) subDate = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                } else if (subDate.includes('T')) { subDate = subDate.split('T')[0]; }
                
                if (selectedDate && subDate !== selectedDate) return false;
                if (selectedShift === 'all') return true;
                
                let hour = 12;
                if (s.reportData?.hora) {
                  const hMatch = s.reportData.hora.match(/^(\d{1,2})/);
                  if (hMatch) {
                    hour = parseInt(hMatch[1], 10);
                    const horaStr = s.reportData.hora.toLowerCase();
                    if (horaStr.includes('p.m') || horaStr.includes('pm')) {
                      if (hour < 12) hour += 12;
                    } else if (horaStr.includes('a.m') || horaStr.includes('am')) {
                      if (hour === 12) hour = 0;
                    }
                  }
                } else if (s.timestamp) {
                  hour = new Date(s.timestamp).getHours();
                }
                
                if (selectedShift === 't1') return hour >= 0 && hour < 13;
                if (selectedShift === 't2') return hour >= 13 && hour < 19;
                if (selectedShift === 't3') return hour >= 19 || hour === 0;
                return true;
              }).length;
              return (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    📊 {countForBadge} reportes en la BD para este turno
                  </span>
                  {countForBadge > 0 && !draftLoadedAt && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40">
                      ✅ Auto-llenado activo
                    </span>
                  )}
                  {draftLoadedAt && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900/40">
                      📂 Borrador cargado
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoFillFromDB}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Calcular automáticamente según reportes registrados en la BD"
            >
              <span>🔄</span> Auto-Cargar Estadísticas BD
            </button>

            <button
              onClick={handleDownloadPNG}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>🖼️</span> PNG (HD)
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>📄</span> Exportar PDF
            </button>
          </div>
        </div>

        {/* TIME & SHIFT FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-4 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <span>📅 Fecha de Corte:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            />
          </div>

          <div className="sm:col-span-8 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">⏰ Turno:</span>
            {[
              { id: 't1', label: '🌅 Turno 1 (1:00 PM)' },
              { id: 't2', label: '🌆 Turno 2 (7:00 PM)' },
              { id: 't3', label: '🌙 Turno 3 (12:00 AM)' },
              { id: 'all', label: '☀️ Jornada Completa' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedShift(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedShift === s.id
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FULL EDITABLE FORM PANEL ── */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-slate-800 pb-2 gap-2">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            📝 Formulario de Edición Directa del Reporte
          </h3>

          {/* INDICADOR DE GUARDADO AUTOMÁTICO */}
          <div className="flex items-center gap-2">
            {draftLoadedAt && (
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900/50 flex items-center gap-1">
                📂 Borrador del {new Date(draftLoadedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/50 flex items-center gap-1 animate-pulse">
                ⏳ Guardando...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1">
                ✅ Guardado automáticamente
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/50 flex items-center gap-1">
                ⚠️ Error al guardar
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* 1. ORGANIZACIÓN */}
          <div className="md:col-span-6 bg-slate-50/80 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-red-600 uppercase flex items-center gap-1.5">
              <span>1️⃣ Organización</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  👥 Analistas Activos
                </label>
                <input
                  type="number"
                  value={analystsCount}
                  onChange={(e) => setAnalystsCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                📋 Actividades Realizadas
              </label>
              <textarea
                rows="3"
                value={activitiesText}
                onChange={(e) => setActivitiesText(e.target.value)}
                className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
              />
            </div>
          </div>

          {/* 2. REPORTES DE SALAS EXTERNAS (SOPORTA HASTA 14 SALAS) */}
          <div className="md:col-span-6 bg-slate-50/80 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-red-600 uppercase flex items-center gap-1.5">
                <span>2️⃣ Reportes de Salas Externas (Hasta 14 Salas)</span>
              </h4>
              <button
                onClick={handleAddRoom}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>➕</span> Añadir Sala
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500">Recibidos</label>
                <input
                  type="number"
                  value={receivedReportsTotal}
                  onChange={(e) => setReceivedReportsTotal(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">Activadas</label>
                <input
                  type="number"
                  value={activatedRooms}
                  onChange={(e) => setActivatedRooms(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">Reportando</label>
                <input
                  type="number"
                  value={reportingRooms}
                  onChange={(e) => setReportingRooms(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">Pendientes</label>
                <input
                  type="number"
                  value={pendingRooms}
                  onChange={(e) => setPendingRooms(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                />
              </div>
            </div>

            {/* DYNAMIC ROOMS EDITOR */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="block text-[11px] font-black text-slate-700 dark:text-slate-300">
                  🏢 Desglose Dinámico ({customRooms.length} de 14 salas agregadas):
                </span>
                {customRooms.length < 13 && (
                  <button
                    onClick={() => {
                      const sampleRooms = [
                        'SALA PRINCIPAL', 'SALA CLEBG', 'SALA POSICIONAMIENTO', 'SALA ZONA EDUCATIVA',
                        'SALA SALUD GUARICO', 'SALA SEGURIDAD SECTORIAL', 'SALA INFRAESTRUCTURA',
                        'SALA TRANSPORTE VIAL', 'SALA ALIMENTACIÓN', 'SALA VIVIENDA Y HÁBITAT',
                        'SALA DESARROLLO SOCIAL', 'SALA SERVICIOS PÚBLICOS', 'SALA MUNICIPAL ROSTROS'
                      ];
                      const newRooms = sampleRooms.slice(0, 13).map((name, i) => ({
                        id: 'rm-bulk-' + i,
                        name,
                        count: 0,
                        unit: i === 1 ? 'REPORTES' : ''
                      }));
                      setCustomRooms(newRooms);
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    ⚡ Pre-cargar las 13 Salas
                  </button>
                )}
              </div>

              {customRooms.length === 0 && (
                <p className="text-[11px] text-slate-400 italic">No hay salas añadidas. Haz clic en &quot;➕ Añadir Sala&quot; o en &quot;⚡ Pre-cargar las 13 Salas&quot;.</p>
              )}

              {customRooms.map((rm) => (
                <div key={rm.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="text"
                    value={rm.name}
                    placeholder="Nombre de Sala"
                    onChange={(e) => handleUpdateRoom(rm.id, 'name', e.target.value)}
                    className="flex-1 p-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="number"
                    value={rm.count}
                    onChange={(e) => handleUpdateRoom(rm.id, 'count', parseInt(e.target.value, 10) || 0)}
                    className="w-16 p-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                  />
                  <input
                    type="text"
                    value={rm.unit}
                    placeholder="ej. REPORTES"
                    onChange={(e) => handleUpdateRoom(rm.id, 'unit', e.target.value)}
                    className="w-24 p-1.5 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase"
                  />
                  <button
                    onClick={() => handleRemoveRoom(rm.id)}
                    className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-200 text-xs cursor-pointer"
                    title="Eliminar esta sala"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. ANÁLISIS RÁPIDO */}
          <div className="md:col-span-6 bg-slate-50/80 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-red-600 uppercase flex items-center gap-1.5">
              <span>3️⃣ Análisis Rápido (Redes con Logos Oficiales)</span>
            </h4>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500">Facebook</label>
                <input
                  type="number"
                  value={facebookCount}
                  onChange={(e) => setFacebookCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">Instagram</label>
                <input
                  type="number"
                  value={instagramCount}
                  onChange={(e) => setInstagramCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">TikTok</label>
                <input
                  type="number"
                  value={tiktokCount}
                  onChange={(e) => setTiktokCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">X</label>
                <input
                  type="number"
                  value={xCount}
                  onChange={(e) => setXCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">Telegram</label>
                <input
                  type="number"
                  value={telegramCount}
                  onChange={(e) => setTelegramCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-emerald-600">🟢 Positivas</label>
                <input
                  type="number"
                  value={posCount}
                  onChange={(e) => setPosCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-amber-600">🟡 Neutras</label>
                <input
                  type="number"
                  value={neuCount}
                  onChange={(e) => setNeuCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-red-600">🔴 Negativas</label>
                <input
                  type="number"
                  value={negCount}
                  onChange={(e) => setNegCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-1.5 text-xs font-bold rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 text-center"
                />
              </div>
            </div>
          </div>

          {/* 4. SUGERENCIAS Y RECOMENDACIONES */}
          <div className="md:col-span-6 bg-slate-50/80 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-red-600 uppercase flex items-center gap-1.5">
              <span>4️⃣ Sugerencias y Recomendaciones</span>
            </h4>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                💡 Recomendaciones de la Sala Situacional
              </label>
              <textarea
                rows="4"
                value={recommendationsText}
                onChange={(e) => setRecommendationsText(e.target.value)}
                className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── CANVAS INTERACTIVE PREVIEW CARD ── */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center justify-center overflow-x-auto">
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
          Vista Previa Oficial del Lienzo Canvas (1200 x 750 px)
        </span>

        <div className="border border-slate-300 dark:border-slate-700 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden bg-white max-w-full">
          <canvas ref={canvasRef} className="max-w-full h-auto block" />
        </div>
      </div>

      {/* ── SELECCIÓN DE FICHAS PARA EXPORTACIÓN CONJUNTA ── */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📑 Seleccionar Fichas para Anexar</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Escoge los formularios del turno que deseas incluir en el documento PDF interactivo.
            </p>
          </div>
          
          <div className="flex gap-2">
            <select
              value={fichasShiftFilter}
              onChange={(e) => setFichasShiftFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Todos">Turno: Todos</option>
              <option value="Turno 1">Turno 1 (12am - 12pm)</option>
              <option value="Turno 2">Turno 2 (1pm - 6pm)</option>
              <option value="Turno 3">Turno 3 (7pm - 12am)</option>
            </select>
            <button
              onClick={() => {
                if (selectedFichasIds.length === filteredReportables.length && filteredReportables.length > 0) {
                  setSelectedFichasIds([]);
                } else {
                  setSelectedFichasIds(filteredReportables.map(s => s.id));
                }
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Seleccionar Todos (Turno actual)
            </button>
            <button
              onClick={handleExportCombinedPDF}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>📄</span> Exportar Reporte + Fichas (PDF HD)
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
              <tr>
                <th className="py-3 px-4 w-12 text-center">✓</th>
                <th className="py-3 px-4">Post / Asunto</th>
                <th className="py-3 px-4">Red Social</th>
                <th className="py-3 px-4">Hora</th>
                <th className="py-3 px-4">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReportables.map((sub) => (
                <tr 
                  key={sub.id} 
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${selectedFichasIds.includes(sub.id) ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                  onClick={() => {
                    setSelectedFichasIds(prev => 
                      prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id]
                    );
                  }}
                >
                  <td className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedFichasIds.includes(sub.id)}
                      onChange={() => {}} 
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-bold max-w-[200px] truncate" title={sub.reportData?.postTitle}>
                    {sub.reportData?.postTitle || 'Sin Asunto'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-[10px] font-bold">
                      {sub.reportData?.redSocial || 'OTRA'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{sub.reportData?.hora || '--:--'}</td>
                  <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">@{sub.reportData?.usuario || 'anon'}</td>
                </tr>
              ))}
              {filteredReportables.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                    No hay formularios con estado &quot;Reportar&quot; para esta fecha y turno seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
