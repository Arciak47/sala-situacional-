"use client";

import { useEffect, useRef } from 'react';
import FormFields from './FormFields';
import { CW, CH, HR } from '../lib/constants';
import {
  buildElements,
  getBBox,
  getHandles,
  hitHandle,
  hitTest,
  applyResize,
  drawWrapped,
} from '../lib/canvasHelpers';

export default function CanvasEditor({
  reportData,
  setReportData,
  elements,
  setElements,
  selId,
  setSelId,
  editingId,
  setEditingId,
  editText,
  setEditText,
  commitTextEdit,
  imageCache,
  setImageCache,
  setOverlayRect,
  selectedSubmission,
  saveSubmissionEdits,
  markAsReviewed,
  markAsRepeated,
  markAsReported,
  handleImageUpload,
}) {
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const activeHandle = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const elStart = useRef(null);
  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);

  // ── Sync form → elements (only for synced fields) ──
  useEffect(() => {
    if (elements.length === 0) return;
    const up = (v) => (v || '').toUpperCase();
    setElements((prev) =>
      prev.map((el) => {
        if (!el.sync) return el;
        if (el.type === 'image') return { ...el, src: reportData[el.sync] || null };
        const val = up(reportData[el.sync]);
        return { ...el, text: el.tpl ? el.tpl + val : val || el.text };
      })
    );
  }, [reportData]); // eslint-disable-line

  // ── Image cache: load/unload HTMLImageElement ──
  useEffect(() => {
    elements.forEach((el) => {
      if (el.type !== 'image') return;
      if (el.src && !imageCache[el.id + '_' + el.src.slice(-10)]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const cacheKey = el.id + '_' + el.src.slice(-10);
        img.onload = () =>
          setImageCache((prev) => ({ ...prev, [el.id]: img, [cacheKey]: true }));
        img.src = el.src;
      }
      if (!el.src && imageCache[el.id]) {
        setImageCache((prev) => {
          const n = { ...prev };
          delete n[el.id];
          return n;
        });
      }
    });
  }, [elements]); // eslint-disable-line

  // ── Draw canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = CW;
    canvas.height = CH;
    ctx.clearRect(0, 0, CW, CH);

    for (const el of elements) {
      if (el.id === editingId) continue; // skip element being edited inline
      ctx.save();
      if (el.type === 'rect') {
        ctx.fillStyle = el.fill || '#fff';
        ctx.fillRect(el.x, el.y, el.w, el.h);
      } else if (el.type === 'poly') {
        ctx.fillStyle = el.fill;
        ctx.beginPath();
        ctx.moveTo(el.pts[0][0], el.pts[0][1]);
        el.pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]));
        ctx.closePath();
        ctx.fill();
      } else if (el.type === 'line') {
        ctx.strokeStyle = el.stroke;
        ctx.lineWidth = el.lw || 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
      } else if (el.type === 'text') {
        ctx.save();
        ctx.fillStyle = el.color || '#000';
        ctx.font = `${el.fw || 'normal'} ${el.fs || 16}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = el.align || 'left';
        ctx.textBaseline = 'top';

        let tx = el.x;
        if (el.align === 'center' && el.w) {
          tx = el.x + el.w / 2;
        } else if (el.align === 'right' && el.w) {
          tx = el.x + el.w;
        }

        // Strict clipping box to prevent any text from leaking outside assigned bounds
        if (el.w && el.h) {
          ctx.beginPath();
          ctx.rect(el.x - 2, el.y - 2, el.w + 4, el.h + 4);
          ctx.clip();
        }

        if (el.wrap && el.w) {
          drawWrapped(ctx, el.text || '', tx, el.y, el.w, (el.fs || 16) * 1.35, el.align);
        } else {
          ctx.fillText(el.text || '', tx, el.y);
        }
        ctx.restore();
      } else if (el.type === 'image') {
        const img = imageCache[el.id];
        if (img && img.complete) {
          if (el.id === 'bg') {
            ctx.drawImage(img, el.x, el.y, el.w, el.h);
          } else {
            const iAr = img.naturalWidth / img.naturalHeight;
            const eAr = el.w / el.h;
            let sx = 0,
              sy = 0,
              sw = img.naturalWidth,
              sh = img.naturalHeight;
            if (iAr > eAr) {
              sw = img.naturalHeight * eAr;
              sx = (img.naturalWidth - sw) / 2;
            } else {
              sh = img.naturalWidth / eAr;
              sy = (img.naturalHeight - sh) / 2;
            }
            ctx.drawImage(img, sx, sy, sw, sh, el.x, el.y, el.w, el.h);
          }
        } else {
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(el.x, el.y, el.w, el.h);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(el.x, el.y, el.w, el.h);
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const lines = (el.placeholder || '').split('\n');
          lines.forEach((ln, i) =>
            ctx.fillText(
              ln,
              el.x + el.w / 2,
              el.y + el.h / 2 + (i - (lines.length - 1) / 2) * 18
            )
          );
        }
      }
      ctx.restore();
    }

    // Draw selection handles on top
    if (selId && selId !== editingId) {
      const sel = elements.find((e) => e.id === selId);
      if (sel && !sel.locked) {
        ctx.save();
        const bbox = getBBox(sel);
        const pad = 3;
        const bx = {
          x: bbox.x - pad,
          y: bbox.y - pad,
          w: bbox.w + pad * 2,
          h: bbox.h + pad * 2,
        };
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(bx.x, bx.y, bx.w, bx.h);
        ctx.setLineDash([]);
        getHandles(bx).forEach((h) => {
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(h.cx, h.cy, HR, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
        ctx.restore();
      }
    }
  }, [elements, selId, imageCache, editingId]);

  // ── Canvas coordinate helper ──
  const getCanvasPos = (e) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const sx = CW / rect.width,
      sy = CH / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy };
  };

  // ── Mouse / touch events ──
  const handleMouseDown = (e) => {
    if (editingId && commitTextEdit) commitTextEdit();
    const pos = getCanvasPos(e);

    // ── Click on ENLACE area → open link in new tab ──
    const isEnlaceArea = pos.x >= 30 && pos.x <= 380 && pos.y >= 598 && pos.y <= 700;
    if (isEnlaceArea) {
      const linkUrl = (reportData.enlace || '').trim();
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        window.open(linkUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    // Check handle hit on current selection
    if (selId) {
      const sel = elements.find((el) => el.id === selId);
      if (sel && !sel.locked) {
        const bbox = getBBox(sel);
        const pad = 3;
        const bx = {
          x: bbox.x - pad,
          y: bbox.y - pad,
          w: bbox.w + pad * 2,
          h: bbox.h + pad * 2,
        };
        const h = hitHandle(bx, pos.x, pos.y);
        if (h) {
          isResizing.current = true;
          activeHandle.current = h;
          dragStart.current = pos;
          elStart.current = { ...sel };
          return;
        }
      }
    }

    // Find topmost hit element
    const hit = [...elements]
      .reverse()
      .find((el) => !el.locked && hitTest(el, pos.x, pos.y));
    if (hit) {
      setSelId(hit.id);
      isDragging.current = true;
      dragStart.current = pos;
      elStart.current = { ...hit };
    } else {
      setSelId(null);
    }
  };

  const handleMouseMove = (e) => {
    // Update cursor to pointer when hovering the ENLACE area
    const pos = getCanvasPos(e);
    const isEnlaceArea = pos.x >= 30 && pos.x <= 380 && pos.y >= 598 && pos.y <= 700;
    const linkUrl = (reportData.enlace || '').trim();
    const hasValidLink = linkUrl.startsWith('http://') || linkUrl.startsWith('https://');
    if (isEnlaceArea && hasValidLink) {
      if (canvasRef.current) canvasRef.current.style.cursor = 'pointer';
    } else if (!isDragging.current && !isResizing.current) {
      if (canvasRef.current) canvasRef.current.style.cursor = selEl && !selEl.locked ? 'move' : 'crosshair';
    }

    if (!isDragging.current && !isResizing.current) return;
    const dx = pos.x - dragStart.current.x;
    const dy = pos.y - dragStart.current.y;

    if (isResizing.current && selId && elStart.current) {
      const resized = applyResize(elStart.current, activeHandle.current, dx, dy);
      setElements((prev) => prev.map((el) => (el.id === selId ? resized : el)));
    } else if (isDragging.current && selId && elStart.current) {
      const orig = elStart.current;
      const moved =
        orig.type === 'line'
          ? {
              ...orig,
              x: Math.round(orig.x + dx),
              y: Math.round(orig.y + dy),
              x2: Math.round(orig.x2 + dx),
              y2: Math.round(orig.y2 + dy),
            }
          : orig.type === 'poly'
          ? { ...orig, pts: orig.pts.map((p) => [p[0] + dx, p[1] + dy]) }
          : { ...orig, x: Math.round(orig.x + dx), y: Math.round(orig.y + dy) };
      setElements((prev) => prev.map((el) => (el.id === selId ? moved : el)));
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    isResizing.current = false;
    activeHandle.current = null;
  };

  const handleDblClick = (e) => {
    const pos = getCanvasPos(e);
    const hit = [...elements]
      .reverse()
      .find((el) => el.type === 'text' && !el.locked && hitTest(el, pos.x, pos.y));
    if (!hit) return;

    if (editingId && editingId !== hit.id && commitTextEdit) {
      commitTextEdit();
    }
    if (setEditText) setEditText(hit.text || '');

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width / CW,
      sy = rect.height / CH;
    const bbox = getBBox(hit);
    setOverlayRect({
      left: rect.left + window.scrollX + bbox.x * sx,
      top: rect.top + window.scrollY + bbox.y * sy,
      width: Math.max(bbox.w * sx, 80),
      height: Math.max(bbox.h * sy, 26),
      fontSize: (hit.fs || 16) * sy,
      fontWeight: hit.fw || 'normal',
      color: hit.color || '#000',
      textAlign: hit.align || 'left',
    });
    setEditingId(hit.id);
    setSelId(hit.id);
  };

  // ── Update single element ──
  const updateEl = (id, changes) =>
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...changes } : el))
    );

  // ── Replace image for any image element ──
  const handleReplaceImage = (e, elId) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      const originalImg = new Image();
      originalImg.onload = () => {
        const canvas = document.createElement('canvas');
        let width = originalImg.width;
        let height = originalImg.height;
        const max_size = 1920; // HD resolution cap — ImgBB supports up to 32MB
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
        ctx.drawImage(originalImg, 0, 0, width, height);
        // Use PNG at maximum quality to preserve text and detail legibility
        const hdSrc = canvas.toDataURL('image/png');

        setElements((prev) =>
          prev.map((el) => (el.id === elId ? { ...el, src: hdSrc } : el))
        );
        const img = new Image();
        img.onload = () => setImageCache((prev) => ({ ...prev, [elId]: img }));
        img.src = hdSrc;
        const target = elements.find((el) => el.id === elId);
        if (target?.sync === 'evidenceImageSrc') {
          setReportData((prev) => ({ ...prev, evidenceImageSrc: hdSrc }));
        }
      };
      originalImg.src = src;
    };
    reader.readAsDataURL(file);
  };

  // ── Add new elements ──
  const addEl = (el) => {
    // eslint-disable-next-line react-hooks/purity
    const id = `${el.type}-${Date.now()}`;
    setElements((prev) => [...prev, { ...el, id }]);
    setSelId(id);
  };

  const getLatestElementsAndReport = () => {
    let latestElems = elements;
    let latestReport = { ...reportData };
    if (editingId) {
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
        latestReport[targetEl.sync] = val;
      }
      latestElems = elements.map((el) => (el.id === editingId ? { ...el, text: editText } : el));
      commitTextEdit();
    }
    return { latestElems, latestReport };
  };

  // ── Download PNG (HD 2x) ──
  const downloadImage = () => {
    const prevSel = selId;
    setSelId(null);
    setEditingId(null);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Render at 2x resolution for HD quality
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width * 2;
      offscreen.height = canvas.height * 2;
      const octx = offscreen.getContext('2d');
      octx.scale(2, 2);
      octx.drawImage(canvas, 0, 0);
      const link = document.createElement('a');
      link.download = `Reporte_${(reportData.municipio || 'Unico').replace(
        /\s+/g,
        '_'
      )}.png`;
      link.href = offscreen.toDataURL('image/png');
      link.click();
      setSelId(prevSel);
    }, 120);
  };

  // ── Download PDF ──
  const downloadPDF = () => {
    const prevSel = selId;
    setSelId(null);
    setEditingId(null);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Render at 2x resolution for HD quality
      const offscreen = document.createElement('canvas');
      offscreen.width = CW * 2;
      offscreen.height = CH * 2;
      const octx = offscreen.getContext('2d');
      octx.scale(2, 2);
      octx.drawImage(canvas, 0, 0);
      const imgData = offscreen.toDataURL('image/png', 1.0);

      const win = window.open('', '_blank');
      if (!win) {
        alert('Por favor autoriza ventanas emergentes para generar el PDF.');
        return;
      }
      const title = `Reporte_${(reportData.municipio || 'Unico').replace(/\s+/g, '_')}`;
      const linkUrl = (reportData.enlace || '').trim();
      const hasLink = linkUrl.startsWith('http://') || linkUrl.startsWith('https://');

      // ENLACE element bounds in canvas coords (1200x750):
      //   enl-l: x=30, y=602, w=350, h=22
      //   enl-v: x=30, y=624, w=350, h=75  → bottom = 699
      // So clickable zone: x=30, y=600, w=350, h=100

      win.document.write(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
              @page { size: ${CW}px ${CH}px; margin: 0; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                width: ${CW}px;
                height: ${CH}px;
                overflow: hidden;
                background: #ffffff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .pdf-wrap {
                position: relative;
                width: ${CW}px;
                height: ${CH}px;
              }
              .pdf-wrap img {
                width: ${CW}px;
                height: ${CH}px;
                display: block;
              }
              .pdf-link {
                position: absolute;
                left: 30px;
                top: 600px;
                width: 350px;
                height: 100px;
                display: block;
                z-index: 100;
                cursor: pointer;
                text-decoration: none !important;
                border: none !important;
                outline: none !important;
                background: transparent !important;
              }
            </style>
          </head>
          <body>
            <div class="pdf-wrap">
              <img
                src="${imgData}"
                onload="setTimeout(() => { window.print(); window.close(); }, 600);"
              />
              ${
                hasLink
                  ? `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="pdf-link" title="Abrir enlace"></a>`
                  : ''
              }
            </div>
          </body>
        </html>
      `);
      win.document.close();
      setSelId(prevSel);
    }, 150);
  };

  const selEl = elements.find((e) => e.id === selId);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      {/* LEFT: Tools + Properties */}
      <div className="xl:col-span-3 space-y-3">
        {/* Submission badge */}
        {selectedSubmission && (
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 rounded-xl">
            <div className="text-xs font-black text-blue-700 dark:text-blue-300">
              📌 Editando formulario de:{' '}
              <span className="text-slate-900 dark:text-white">
                {selectedSubmission.analystName}
              </span>
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
              {selectedSubmission.reportData.municipio} —{' '}
              {new Date(selectedSubmission.timestamp).toLocaleDateString('es-ES')}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const { latestElems, latestReport } = getLatestElementsAndReport();
                  saveSubmissionEdits(null, latestElems, latestReport);
                }}
                className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                💾 Guardar Cambios
              </button>
              {selectedSubmission.status === 'pendiente' && (
                <>
                  <button
                    onClick={() => {
                      if (markAsReviewed) {
                        const { latestElems, latestReport } = getLatestElementsAndReport();
                        markAsReviewed(selectedSubmission.id, latestElems, latestReport);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                  >
                    ✅ Marcar Revisado
                  </button>
                  <button
                    onClick={() => {
                      if (markAsRepeated) {
                        const { latestElems, latestReport } = getLatestElementsAndReport();
                        markAsRepeated(selectedSubmission.id, latestElems, latestReport);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm bg-orange-400 hover:bg-orange-500 text-white cursor-pointer"
                  >
                    ⚠️ Marcar Repetido
                  </button>
                </>
              )}
              {['pendiente', 'revisado'].includes(selectedSubmission.status) && (
                  <button
                    onClick={() => {
                      if (markAsReported) {
                         const { latestElems, latestReport } = getLatestElementsAndReport();
                         markAsReported(selectedSubmission.id, latestElems, latestReport);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm bg-purple-500 hover:bg-purple-600 text-white cursor-pointer"
                  >
                    📢 Para Reportar
                  </button>
              )}
            </div>
          </div>
        )}

        {/* Add elements toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-md">
          <h4 className="text-xs font-black text-red-600 uppercase tracking-wider mb-3">
            ➕ Añadir Elementos
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: 'T Texto',
                el: {
                  type: 'text',
                  x: 200,
                  y: 200,
                  w: 300,
                  h: 40,
                  text: 'Nuevo Texto',
                  fs: 24,
                  fw: 'bold',
                  color: '#032b69',
                  align: 'left',
                },
              },
              {
                label: '■ Forma',
                el: { type: 'rect', x: 200, y: 200, w: 200, h: 100, fill: '#032b69' },
              },
              {
                label: '— Línea',
                el: {
                  type: 'line',
                  x: 200,
                  y: 300,
                  x2: 500,
                  y2: 300,
                  stroke: '#dc2626',
                  lw: 4,
                },
              },
              {
                label: '🖼 Imagen',
                el: {
                  type: 'image',
                  x: 200,
                  y: 200,
                  w: 180,
                  h: 180,
                  src: null,
                  placeholder: 'IMAGEN',
                  replaceable: true,
                },
              },
              {
                label: '◆ Triáng.',
                el: {
                  type: 'poly',
                  pts: [
                    [200, 350],
                    [350, 150],
                    [500, 350],
                  ],
                  fill: '#dc2626',
                },
              },
            ].map(({ label, el }) => (
              <button
                key={label}
                onClick={() => addEl(el)}
                className="py-2 px-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[9px] text-slate-400 font-bold text-center">
            Doble clic en texto para editar directamente
          </div>
        </div>

        {/* Properties panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-md">
          <h4 className="text-xs font-black text-red-600 uppercase tracking-wider mb-3">
            ⚙️ Propiedades
          </h4>
          {!selEl || selEl.locked ? (
            <div className="text-center py-6 text-slate-400">
              <div className="text-3xl mb-2">👆</div>
              <p className="text-xs font-bold">
                Clic en cualquier elemento
                <br />
                del canvas para seleccionar
              </p>
              <p className="text-[10px] mt-1">Doble clic → editar texto</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <code className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded">
                  {selEl.id}
                </code>
                <button
                  onClick={() => {
                    setElements((prev) => prev.filter((e) => e.id !== selId));
                    setSelId(null);
                  }}
                  className="text-[10px] px-2 py-1 rounded-lg bg-red-50 text-red-600 font-bold cursor-pointer hover:bg-red-100"
                >
                  🗑️ Eliminar
                </button>
              </div>

              {/* Position / Size */}
              {!['line', 'poly'].includes(selEl.type) && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Posición &amp; Tamaño
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      ['X', 'x'],
                      ['Y', 'y'],
                      ['W', 'w'],
                      ['H', 'h'],
                    ].map(([lbl, k]) => (
                      <div key={k}>
                        <label className="block text-[9px] text-slate-400 mb-0.5">
                          {lbl}
                        </label>
                        <input
                          type="number"
                          value={Math.round(selEl[k] || 0)}
                          onChange={(e) => updateEl(selId, { [k]: +e.target.value })}
                          className="w-full px-1.5 py-1 rounded-lg text-[10px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text props */}
              {selEl.type === 'text' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Texto
                    </label>
                    <textarea
                      rows="2"
                      value={selEl.text || ''}
                      onChange={(e) => updateEl(selId, { text: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Tamaño
                      </label>
                      <input
                        type="number"
                        min="6"
                        max="200"
                        value={selEl.fs || 16}
                        onChange={(e) => updateEl(selId, { fs: +e.target.value })}
                        className="w-full px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Color
                      </label>
                      <input
                        type="color"
                        value={selEl.color || '#000000'}
                        onChange={(e) => updateEl(selId, { color: e.target.value })}
                        className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Peso
                      </label>
                      <select
                        value={selEl.fw || 'normal'}
                        onChange={(e) => updateEl(selId, { fw: e.target.value })}
                        className="w-full px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="700">700</option>
                        <option value="800">800</option>
                        <option value="900">900 Black</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Alineación
                      </label>
                      <select
                        value={selEl.align || 'left'}
                        onChange={(e) => updateEl(selId, { align: e.target.value })}
                        className="w-full px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                      >
                        <option value="left">Izquierda</option>
                        <option value="center">Centro</option>
                        <option value="right">Derecha</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <input
                      type="checkbox"
                      id="wrapChk"
                      checked={!!selEl.wrap}
                      onChange={(e) => updateEl(selId, { wrap: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <label htmlFor="wrapChk" className="text-xs font-bold cursor-pointer">
                      Ajuste de texto automático
                    </label>
                  </div>
                </>
              )}

              {/* Image props */}
              {selEl.type === 'image' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500">
                    Reemplazar Imagen
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleReplaceImage(e, selId)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 cursor-pointer"
                  />
                  {selEl.src && (
                    <button
                      onClick={() => {
                        updateEl(selId, { src: null });
                        setImageCache((p) => {
                          const n = { ...p };
                          delete n[selId];
                          return n;
                        });
                      }}
                      className="w-full py-1.5 rounded-lg text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer"
                    >
                      ✕ Quitar imagen actual
                    </button>
                  )}
                </div>
              )}

              {/* Line props */}
              {selEl.type === 'line' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Color
                    </label>
                    <input
                      type="color"
                      value={selEl.stroke || '#000000'}
                      onChange={(e) => updateEl(selId, { stroke: e.target.value })}
                      className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Grosor
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={selEl.lw || 2}
                      onChange={(e) => updateEl(selId, { lw: +e.target.value })}
                      className="w-full px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                    />
                  </div>
                </div>
              )}

              {/* Rect / Poly fill */}
              {(selEl.type === 'rect' || selEl.type === 'poly') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    Color de relleno
                  </label>
                  <input
                    type="color"
                    value={selEl.fill || '#ffffff'}
                    onChange={(e) => updateEl(selId, { fill: e.target.value })}
                    className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer"
                  />
                </div>
              )}

              {/* Layer order */}
              <div className="pt-2 border-t dark:border-slate-800">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">
                  Orden de capas
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setElements((prev) => {
                        const i = prev.findIndex((e) => e.id === selId);
                        if (i <= 0) return prev;
                        const a = [...prev];
                        [a[i - 1], a[i]] = [a[i], a[i - 1]];
                        return a;
                      })
                    }
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200"
                  >
                    ↑ Adelante
                  </button>
                  <button
                    onClick={() =>
                      setElements((prev) => {
                        const i = prev.findIndex((e) => e.id === selId);
                        if (i >= prev.length - 1) return prev;
                        const a = [...prev];
                        [a[i + 1], a[i]] = [a[i], a[i + 1]];
                        return a;
                      })
                    }
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200"
                  >
                    ↓ Atrás
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Canvas */}
      <div className="xl:col-span-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                🎨 Editor de Imagen
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">
                {selEl && !selEl.locked
                  ? `✅ Seleccionado: ${selEl.id} — Arrastra / Redimensiona`
                  : 'Clic para seleccionar • Doble clic para editar texto'}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSelId(null);
                  setEditingId(null);
                  setElements(buildElements(reportData));
                }}
                className="px-4 py-2 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                🔄 Reset
              </button>
              <button
                onClick={downloadImage}
                className="px-4 py-2 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
              >
                <span>🖼️</span> PNG
              </button>
              <button
                onClick={downloadPDF}
                className="px-4 py-2 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                <span>📄</span> PDF
              </button>
            </div>
          </div>
          <div
            ref={canvasWrapRef}
            className="relative bg-slate-200 dark:bg-slate-950 rounded-2xl overflow-x-auto custom-scrollbar border border-slate-300 dark:border-slate-800 p-2 flex justify-center items-center"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDblClick}
              className="max-w-full h-auto block select-none rounded-lg shadow-xl"
              style={{
                cursor: selEl && !selEl.locked ? 'move' : 'crosshair',
                maxHeight: '65vh',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Form fields */}
      <div className="xl:col-span-3 space-y-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-md">
          <h4 className="text-xs font-black text-red-600 uppercase tracking-wider border-b dark:border-slate-800 pb-2 mb-3">
            📋 Datos del Formulario
          </h4>
          <p className="text-[10px] text-slate-400 font-bold mb-3">
            Los cambios aquí actualizan el canvas automáticamente.
          </p>
          <FormFields
            data={reportData}
            setData={setReportData}
            onImageUpload={handleImageUpload}
          />
        </div>
      </div>
    </div>
  );
}
