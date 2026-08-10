import { CW, CH, HR, EMPTY_REPORT } from './constants';

// ──────────────────────────────────────────────────────────
// DATE & TIME FORMATTERS
// ──────────────────────────────────────────────────────────
export function formatDate(val) {
  if (!val) return '';
  // Convert YYYY-MM-DD to DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  }
  return val;
}

export function formatTime(val) {
  if (!val) return '';
  // Convert HH:MM (24h) to 12-hour format with AM/PM
  if (/^\d{1,2}:\d{2}$/.test(val)) {
    let [h, m] = val.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const hStr = h < 10 ? '0' + h : h;
    const mStr = m < 10 ? '0' + m : m;
    return `${hStr}:${mStr} ${ampm}`;
  }
  return val;
}

// ──────────────────────────────────────────────────────────
// ELEMENT BUILDER — creates all canvas objects from reportData
// ──────────────────────────────────────────────────────────
export function buildElements(rd = {}) {
  const r = { ...EMPTY_REPORT, ...rd };
  const up = (v) => (v || '').toUpperCase();
  const formattedFecha = formatDate(r.fecha) || '--/--/----';
  const formattedHora = formatTime(r.hora) || '--:--';

  return [
    // ── BACKGROUND ──
    { id: 'bg', type: 'image', x: 0, y: 0, w: CW, h: CH, src: '/canvas-bg.png', locked: true },

    // ── HEADER LINES ──
    { id: 'hl1', type: 'line', x: 40, y: 92, x2: 450, y2: 92, stroke: '#032b69', lw: 4 },
    { id: 'hl2', type: 'line', x: 460, y: 92, x2: 740, y2: 92, stroke: '#dc2626', lw: 4 },
    { id: 'hl3', type: 'line', x: 750, y: 92, x2: 1160, y2: 92, stroke: '#032b69', lw: 4 },

    // ── STRUCTURAL LINES ──
    { id: 'vsep', type: 'line', x: 410, y: 110, x2: 410, y2: 680, stroke: '#032b69', lw: 4 },
    { id: 'vg', type: 'line', x: 720, y: 110, x2: 720, y2: 340, stroke: '#032b69', lw: 3 },
    { id: 'hg', type: 'line', x: 430, y: 350, x2: 1160, y2: 350, stroke: '#032b69', lw: 4 },
    { id: 'hctx', type: 'line', x: 430, y: 580, x2: 1160, y2: 580, stroke: '#032b69', lw: 4 },

    // ── LOGO & BRAND ──
    { id: 'logo-img', type: 'image', x: 45, y: 10, w: 75, h: 75, src: '/logo.png', placeholder: 'LOGO', replaceable: true },

    // ── MAIN TITLE (PERFECTLY CENTERED ON CANVAS) ──
    { id: 'title', type: 'text', x: 200, y: 20, w: 800, h: 60, text: 'REPORTE ÚNICO', fs: 38, fw: '900', color: '#032b69', align: 'center' },

    // ── LEFT COLUMN: MUNICIPIO ──
    { id: 'mun-l', type: 'text', x: 30, y: 114, w: 350, h: 26, text: 'MUNICIPIO', fs: 20, fw: '800', color: '#dc2626', align: 'center' },
    { id: 'mun-v', type: 'text', x: 30, y: 142, w: 350, h: 32, text: up(r.municipio) || 'MUNICIPIO', fs: 22, fw: '900', color: '#032b69', align: 'center', wrap: true, sync: 'municipio' },

    // ── LEFT COLUMN: EVIDENCIA ──
    { id: 'evid-l', type: 'text', x: 30, y: 184, w: 350, h: 26, text: 'EVIDENCIA', fs: 20, fw: '800', color: '#dc2626', align: 'center' },
    { id: 'fecha-v', type: 'text', x: 30, y: 214, w: 350, h: 22, text: 'FECHA: ' + formattedFecha, fs: 16, fw: '700', color: '#000000', align: 'center', sync: 'fecha', tpl: 'FECHA: ' },
    { id: 'hora-v', type: 'text', x: 30, y: 238, w: 350, h: 22, text: 'HORA: ' + formattedHora, fs: 16, fw: '700', color: '#000000', align: 'center', sync: 'hora', tpl: 'HORA: ' },

    // ── EVIDENCE PHOTO (CENTERED IN LEFT COLUMN) ──
    { id: 'evid-img', type: 'image', x: 75, y: 268, w: 260, h: 325, src: r.evidenceImageSrc || null, placeholder: 'FOTO\nEVIDENCIA', replaceable: true, sync: 'evidenceImageSrc' },

    // ── LEFT COLUMN: ENLACE (STRICT BOUNDS & CHARACTER WRAPPING) ──
    { id: 'enl-l', type: 'text', x: 30, y: 602, w: 350, h: 22, text: 'ENLACE:', fs: 15, fw: '800', color: '#dc2626', align: 'center' },
    { id: 'enl-v', type: 'text', x: 30, y: 624, w: 350, h: 75, text: up(r.enlace) || 'HTTP://...', fs: 11, fw: '700', color: '#032b69', align: 'center', wrap: true, sync: 'enlace' },

    // ── RIGHT COLUMN: RED SOCIAL ──
    { id: 'rs-l', type: 'text', x: 430, y: 114, w: 275, h: 26, text: 'RED SOCIAL', fs: 20, fw: '800', color: '#dc2626', align: 'center' },
    { id: 'rs-v', type: 'text', x: 430, y: 144, w: 275, h: 30, text: up(r.redSocial) || 'INSTAGRAM', fs: 22, fw: '900', color: '#032b69', align: 'center', wrap: true, sync: 'redSocial' },

    // ── RIGHT COLUMN: POST ──
    { id: 'post-l', type: 'text', x: 740, y: 114, w: 420, h: 26, text: 'PUBLICACIÓN / POST', fs: 20, fw: '800', color: '#dc2626', align: 'center' },
    {
      id: 'post-v',
      type: 'text',
      x: 740,
      y: 144,
      w: 420,
      h: 65,
      text: up(r.postTitle) || 'PUBLICACIÓN',
      fs: (r.postTitle || '').length > 65 ? 13 : (r.postTitle || '').length > 35 ? 17 : 22,
      fw: '900',
      color: '#032b69',
      align: 'center',
      wrap: true,
      sync: 'postTitle',
    },

    // ── RIGHT COLUMN: USUARIO ──
    { id: 'usr-l', type: 'text', x: 430, y: 225, w: 275, h: 26, text: 'USUARIO', fs: 20, fw: '800', color: '#dc2626', align: 'center' },
    { id: 'usr-v', type: 'text', x: 430, y: 255, w: 275, h: 30, text: up(r.usuario) || '@USUARIO', fs: 22, fw: '900', color: '#032b69', align: 'center', wrap: true, sync: 'usuario' },

    // ── RIGHT COLUMN: ÁREA ──
    { id: 'area-l', type: 'text', x: 740, y: 225, w: 420, h: 26, text: 'ÁREA', fs: 20, fw: '800', color: '#dc2626', align: 'center' },
    { id: 'area-v', type: 'text', x: 740, y: 255, w: 420, h: 30, text: up(r.area) || 'INFRAESTRUCTURA', fs: 22, fw: '900', color: '#032b69', align: 'center', wrap: true, sync: 'area' },

    // ── CONTEXTO ──
    { id: 'ctx-l', type: 'text', x: 430, y: 365, w: 730, h: 26, text: 'CONTEXTO DE LA PUBLICACIÓN:', fs: 20, fw: '800', color: '#dc2626', align: 'left' },
    { id: 'ctx-v', type: 'text', x: 430, y: 395, w: 730, h: 170, text: up(r.contexto) || 'DESCRIPCIÓN DEL REPORTE', fs: 17, fw: '700', color: '#000000', align: 'left', wrap: true, sync: 'contexto' },

    // ── SENTIMIENTO ──
    { id: 'sent-l', type: 'text', x: 430, y: 595, w: 340, h: 26, text: 'SENTIMIENTO', fs: 18, fw: '800', color: '#dc2626', align: 'center' },
    { id: 'sent-v', type: 'text', x: 430, y: 622, w: 340, h: 30, text: up(r.sentimiento) || 'NEGATIVO', fs: 22, fw: '900', color: '#032b69', align: 'center', wrap: true, sync: 'sentimiento' },

    // ── VIRALIDAD ──
    { id: 'vir-l', type: 'text', x: 800, y: 595, w: 360, h: 26, text: 'NIVEL DE VIRALIDAD', fs: 18, fw: '800', color: '#dc2626', align: 'center' },
    { id: 'vir-v', type: 'text', x: 800, y: 622, w: 360, h: 30, text: up(r.viralidad) || 'MEDIO', fs: 22, fw: '900', color: '#032b69', align: 'center', wrap: true, sync: 'viralidad' },

    // ── METRICS ROW (CENTERED) ──
    ...(up(r.redSocial) === 'TIKTOK'
      ? [
          { id: 'like-i', type: 'text', x: 440, y: 665, w: 24, h: 24, text: '❤️', fs: 17, align: 'left' },
          { id: 'like-v', type: 'text', x: 468, y: 665, w: 55, h: 24, text: r.likes || '0', fs: 17, fw: '700', color: '#000000', align: 'left', sync: 'likes' },
          { id: 'cm-i', type: 'text', x: 545, y: 665, w: 24, h: 24, text: '💬', fs: 17, align: 'left' },
          { id: 'cm-v', type: 'text', x: 573, y: 665, w: 55, h: 24, text: r.comments || '0', fs: 17, fw: '700', color: '#000000', align: 'left', sync: 'comments' },
          { id: 'sh-i', type: 'text', x: 650, y: 665, w: 24, h: 24, text: '🔁', fs: 17, align: 'left' },
          { id: 'sh-v', type: 'text', x: 678, y: 665, w: 55, h: 24, text: r.shares || '0', fs: 17, fw: '700', color: '#000000', align: 'left', sync: 'shares' },
          { id: 'vw-i', type: 'text', x: 755, y: 665, w: 24, h: 24, text: '👁️', fs: 17, align: 'left' },
          { id: 'vw-v', type: 'text', x: 783, y: 665, w: 55, h: 24, text: r.views || '0', fs: 17, fw: '700', color: '#000000', align: 'left', sync: 'views' },
        ]
      : [
          { id: 'like-i', type: 'text', x: 520, y: 665, w: 28, h: 24, text: '❤️', fs: 18, align: 'left' },
          { id: 'like-v', type: 'text', x: 550, y: 665, w: 60, h: 24, text: r.likes || '0', fs: 18, fw: '700', color: '#000000', align: 'left', sync: 'likes' },
          { id: 'cm-i', type: 'text', x: 640, y: 665, w: 28, h: 24, text: '💬', fs: 18, align: 'left' },
          { id: 'cm-v', type: 'text', x: 670, y: 665, w: 60, h: 24, text: r.comments || '0', fs: 18, fw: '700', color: '#000000', align: 'left', sync: 'comments' },
          { id: 'sh-i', type: 'text', x: 760, y: 665, w: 28, h: 24, text: '🔁', fs: 18, align: 'left' },
          { id: 'sh-v', type: 'text', x: 790, y: 665, w: 60, h: 24, text: r.shares || '0', fs: 18, fw: '700', color: '#000000', align: 'left', sync: 'shares' },
        ]),
  ];
}

// ──────────────────────────────────────────────────────────
// ELEMENT GEOMETRY HELPERS
// ──────────────────────────────────────────────────────────
export function getBBox(el) {
  if (el.type === 'line') {
    const mx = Math.min(el.x, el.x2), my = Math.min(el.y, el.y2);
    return { x: mx - 4, y: my - 4, w: Math.abs(el.x2 - el.x) + 8, h: Math.abs(el.y2 - el.y) + 8 };
  }
  if (el.type === 'poly') {
    const xs = el.pts.map(p => p.x ?? p[0]), ys = el.pts.map(p => p.y ?? p[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  return { x: el.x || 0, y: el.y || 0, w: el.w || 100, h: el.h || 28 };
}

export function getHandles(bbox) {
  const { x, y, w, h } = bbox;
  return [
    { id: 'nw', cx: x,     cy: y     }, { id: 'n',  cx: x+w/2, cy: y     }, { id: 'ne', cx: x+w,   cy: y     },
    { id: 'w',  cx: x,     cy: y+h/2 },                                       { id: 'e',  cx: x+w,   cy: y+h/2 },
    { id: 'sw', cx: x,     cy: y+h   }, { id: 's',  cx: x+w/2, cy: y+h   }, { id: 'se', cx: x+w,   cy: y+h   },
  ];
}

export function hitHandle(bbox, px, py) {
  for (const h of getHandles(bbox)) {
    if (Math.abs(px - h.cx) <= HR + 2 && Math.abs(py - h.cy) <= HR + 2) return h.id;
  }
  return null;
}

export function hitTest(el, px, py) {
  const { x, y, w, h } = getBBox(el);
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

export function applyResize(el, handle, dx, dy) {
  if (el.type === 'line') {
    const isStart = ['nw','n','ne','w','sw'].includes(handle);
    return isStart
      ? { ...el, x: el.x + dx, y: el.y + dy }
      : { ...el, x2: el.x2 + dx, y2: el.y2 + dy };
  }
  if (el.type === 'poly' || el.locked) return el;
  let { x, y, w, h } = el;
  if (handle.includes('n')) { y += dy; h -= dy; }
  if (handle.includes('s')) { h += dy; }
  if (handle.includes('w')) { x += dx; w -= dx; }
  if (handle.includes('e')) { w += dx; }
  return { ...el, x: Math.round(x), y: Math.round(y), w: Math.max(10, Math.round(w)), h: Math.max(6, Math.round(h)) };
}

export function drawWrapped(ctx, text, x, y, maxW, lineH, align = 'left') {
  if (!text) return;
  const paragraphs = String(text).split('\n');
  let cy = y;
  ctx.textAlign = align;
  for (const para of paragraphs) {
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      if (ctx.measureText(word).width > maxW) {
        if (line.trim()) {
          ctx.fillText(line.trimEnd(), x, cy);
          cy += lineH;
          line = '';
        }
        for (const char of word) {
          if (ctx.measureText(line + char).width > maxW && line) {
            ctx.fillText(line.trimEnd(), x, cy);
            cy += lineH;
            line = char;
          } else {
            line += char;
          }
        }
        line += ' ';
      } else {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line.trimEnd(), x, cy);
          line = word + ' ';
          cy += lineH;
        } else {
          line = test;
        }
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trimEnd(), x, cy);
      cy += lineH;
    } else if (para === '') {
      cy += lineH;
    }
  }
}
