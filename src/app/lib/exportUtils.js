// ──────────────────────────────────────────────────────────
// EXPORT UTILITIES (EXCEL, PDF, PNG) FOR SALA SITUACIONAL
// ──────────────────────────────────────────────────────────

/**
 * Exports submissions array to a beautifully styled Excel spreadsheet (.xls)
 * with real columns, custom headers, badges, and auto-filter support.
 */
export function exportSubmissionsToExcel(submissions = [], filenamePrefix = 'Base_de_Datos_Sala_Situacional') {
  if (!submissions || submissions.length === 0) {
    alert('No hay reportes en la base de datos para exportar.');
    return;
  }

  const dateStr = new Date().toISOString().split('T')[0];

  const tableHeaders = [
    'ID Reporte',
    'Fecha Envío',
    'Estado',
    'Sala de Pertenencia',
    'Analista',
    'Municipio',
    'Fecha Evento',
    'Hora Evento',
    'Red Social',
    'Título / Publicación',
    'Usuario',
    'Área',
    'Sentimiento',
    'Viralidad',
    'Me Gusta',
    'Comentarios',
    'Compartidos',
    'Visualizaciones (TikTok)',
    'Enlace',
    'Contexto',
  ];

  const rowsHtml = submissions
    .map((s, idx) => {
      const rd = s.reportData || {};
      const isEven = idx % 2 === 0;
      const bg = isEven ? '#ffffff' : '#f8fafc';
      const statusBg = s.status === 'pendiente' ? '#fef3c7' : '#d1fae5';
      const statusColor = s.status === 'pendiente' ? '#92400e' : '#065f46';
      const statusText = s.status === 'pendiente' ? '⏳ Pendiente' : '✅ Revisado';

      const salaName = s.analystSala || s.sala || 'Sala Comuna';

      const sentBg =
        rd.sentimiento === 'NEGATIVO'
          ? '#fee2e2'
          : rd.sentimiento === 'POSITIVO'
          ? '#dcfce7'
          : '#f1f5f9';
      const sentColor =
        rd.sentimiento === 'NEGATIVO'
          ? '#991b1b'
          : rd.sentimiento === 'POSITIVO'
          ? '#166534'
          : '#334155';

      return `
      <tr style="background-color: ${bg};">
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace;">${s.id || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; white-space: nowrap;">${s.timestamp ? new Date(s.timestamp).toLocaleString('es-ES') : ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; background-color: ${statusBg}; color: ${statusColor}; font-weight: bold; text-align: center;">${statusText}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #2563eb;">${salaName}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${s.analystName || s.analystEmail || 'Analista'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #032b69;">${rd.municipio || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${rd.fecha || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${rd.hora || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${rd.redSocial || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${rd.postTitle || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${rd.usuario || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${rd.area || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; background-color: ${sentBg}; color: ${sentColor}; font-weight: bold; text-align: center;">${rd.sentimiento || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${rd.viralidad || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${rd.likes || '0'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${rd.comments || '0'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${rd.shares || '0'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold; color: #4f46e5;">${rd.views || '—'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; color: #2563eb;">${rd.enlace || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${(rd.contexto || '').replace(/\n/g, ' ')}</td>
      </tr>`;
    })
    .join('');

  const excelHtml = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8"/>
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Base de Datos</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      body { font-family: Arial, sans-serif; }
      table { border-collapse: collapse; width: 100%; }
      th { background-color: #032b69; color: #ffffff; font-weight: bold; border: 1px solid #000000; padding: 10px; text-align: center; }
      .header-title { font-size: 16px; font-weight: bold; color: #032b69; text-align: left; }
      .header-sub { font-size: 11px; color: #64748b; margin-bottom: 15px; }
    </style>
  </head>
  <body>
    <div className="header-title">SALA SITUACIONAL — BASE DE DATOS DE REPORTES</div>
    <div className="header-sub">Fecha de Exportación: ${new Date().toLocaleString('es-ES')} | Total Registros: ${submissions.length}</div>
    <table>
      <thead>
        <tr>
          ${tableHeaders.map((h) => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports statistics metrics breakdown to Excel spreadsheet (.xls).
 */
export function exportStatsToExcel(allStats, filenamePrefix = 'Estadisticas_Sala_Situacional') {
  if (!allStats) {
    alert('No hay estadísticas disponibles para exportar.');
    return;
  }

  const dateStr = new Date().toISOString().split('T')[0];

  const excelHtml = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8"/>
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Estadísticas</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      body { font-family: Arial, sans-serif; }
      table { border-collapse: collapse; margin-bottom: 20px; }
      th { background-color: #032b69; color: #ffffff; font-weight: bold; border: 1px solid #000000; padding: 8px; text-align: center; }
      td { border: 1px solid #cbd5e1; padding: 8px; }
      .title { font-size: 16px; font-weight: bold; color: #dc2626; }
      .kpi-title { background-color: #f1f5f9; font-weight: bold; }
    </style>
  </head>
  <body>
    <div className="title">SALA SITUACIONAL — INFORME ESTADÍSTICO DE RENDIMIENTO</div>
    <p>Fecha de emisión: ${new Date().toLocaleString('es-ES')}</p>
    <br/>
    <table>
      <thead>
        <tr>
          <th>Métrica Global</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody>
        <tr><td className="kpi-title">Total Reportes Globales</td><td style="font-weight:bold; text-align:center;">${allStats.totalGlobal || 0}</td></tr>
        <tr><td className="kpi-title">Reportes Ingresados Hoy</td><td style="color:#dc2626; font-weight:bold; text-align:center;">${allStats.todayGlobal || 0}</td></tr>
        <tr><td className="kpi-title">Reportes Esta Semana</td><td style="color:#2563eb; font-weight:bold; text-align:center;">${allStats.weekGlobal || 0}</td></tr>
        <tr><td className="kpi-title">Reportes Pendientes de Revisión</td><td style="color:#d97706; font-weight:bold; text-align:center;">${allStats.pendingGlobal || 0}</td></tr>
        <tr><td className="kpi-title">Reportes Revisados Aprobados</td><td style="color:#16a34a; font-weight:bold; text-align:center;">${allStats.reviewedGlobal || 0}</td></tr>
      </tbody>
    </table>
    <br/>
    <h3>DESGLOSE DE RENDIMIENTO POR ANALISTA</h3>
    <table>
      <thead>
        <tr>
          <th>Sala de Pertenencia</th>
          <th>Nombre del Analista</th>
          <th>Correo Electrónico</th>
          <th>Total Enviados</th>
          <th>Hoy</th>
          <th>Esta Semana</th>
          <th>Pendientes</th>
          <th>Revisados</th>
        </tr>
      </thead>
      <tbody>
        ${(allStats.perAnalyst || [])
          .map(
            (a) => `
          <tr>
            <td style="font-weight:bold; color:#2563eb;">${a.sala || 'Sala Comuna'}</td>
            <td style="font-weight:bold;">${a.name}</td>
            <td>${a.email}</td>
            <td style="text-align:center; font-weight:bold; color:#dc2626;">${a.total}</td>
            <td style="text-align:center;">${a.today}</td>
            <td style="text-align:center;">${a.week}</td>
            <td style="text-align:center; background-color:#fef3c7; color:#92400e; font-weight:bold;">${a.pending}</td>
            <td style="text-align:center; background-color:#dcfce7; color:#166534; font-weight:bold;">${a.reviewed}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Captures an HTML element and downloads it as PNG.
 */
export function exportElementToPNG(elementId, filename = 'Graficos_Estadisticos_Sala_Situacional.png') {
  const node = document.getElementById(elementId);
  if (!node) {
    alert('No se encontró el contenedor.');
    return;
  }

  // Clone node and strip buttons/navs before rendering
  const clone = node.cloneNode(true);
  const actionBars = clone.querySelectorAll('.no-pdf, button, select');
  actionBars.forEach((el) => el.remove());

  const rect = node.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const scale = 2;

  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  ctx.scale(scale, scale);

  const data = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${clone.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

  const img = new Image();
  const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const a = document.createElement('a');
    a.download = filename;
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  img.src = url;
}

/**
 * Exports clean statistics dashboard to PDF (stripping welcome headers & export action bars).
 */
export function exportStatsToPDF(title = 'Informe Estadístico - Sala Situacional', containerId = 'stats-export-container') {
  const node = document.getElementById(containerId);
  if (!node) {
    alert('No se pudo encontrar el contenedor de estadísticas.');
    return;
  }

  // Clone node and clean out welcome banners, action bars, and buttons
  const clone = node.cloneNode(true);

  // Select elements to omit in PDF printout
  const elementsToRemove = clone.querySelectorAll(
    '.no-pdf, .export-action-bar, button, select, input, .welcome-banner'
  );
  elementsToRemove.forEach((el) => el.remove());

  const cleanHtml = clone.innerHTML;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Por favor autoriza las ventanas emergentes para generar el PDF.');
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            @page { size: A4 portrait; margin: 12mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #ffffff !important; }
            .no-pdf, button, select { display: none !important; }
          }
          body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 20px; background: #ffffff; color: #0f172a; }
        </style>
      </head>
      <body>
        <!-- CLEAN INSTITUTIONAL HEADER -->
        <div style="display:flex; align-items:center; justify-space-between; border-bottom:3px solid #dc2626; padding-bottom:14px; margin-bottom:24px;">
          <div style="display:flex; align-items:center; gap:14px;">
            <img src="/logo.png" style="height:55px; width:auto; object-fit:contain;" alt="Logo" />
            <div>
              <h1 style="font-size:20px; font-weight:900; margin:0; text-transform:uppercase; color:#032b69; letter-spacing:1px;">SALA SITUACIONAL</h1>
              <p style="font-size:11px; margin:0; color:#dc2626; font-weight:bold; text-transform:uppercase;">Informe Estadístico Consolidado</p>
            </div>
          </div>
          <div style="text-align:right; font-size:11px; color:#475569; font-weight:bold;">
            <div>Fecha: ${new Date().toLocaleDateString('es-ES')}</div>
            <div>Hora: ${new Date().toLocaleTimeString('es-ES')}</div>
          </div>
        </div>

        <div>
          ${cleanHtml}
        </div>

        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 800);
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

/**
 * Exports selected submissions array to High Definition (HD) PDF document
 * with vector layout, high-res images, and active clickable hyperlinks.
 */
import { CW, CH } from './constants';
import { buildElements, drawWrapped } from './canvasHelpers';
import { getSubmissionImage } from './firestoreService';

/**
 * Renders a submission object onto an off-screen HTML5 Canvas matching the exact Canvas Editor ficha,
 * returning high-resolution PNG data URL.
 */
async function renderCanvasFichaImage(sub) {
  if (typeof window === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = CW; // 1200
  canvas.height = CH; // 750
  const ctx = canvas.getContext('2d');
  
  const reportData = { ...(sub.reportData || {}) };
  
  if (!reportData.evidenceImageSrc && reportData.evidenceImageId) {
    try {
      const imgSrc = await getSubmissionImage(reportData.evidenceImageId);
      if (imgSrc) reportData.evidenceImageSrc = imgSrc;
    } catch (error) {
      console.error('Failed to fetch submission image for export', error);
    }
  }

  const elements = buildElements(reportData);

  // Preload images
  const imageCache = {};
  await Promise.all(
    elements
      .filter((el) => el.type === 'image' && el.src)
      .map(
        (el) =>
          new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              imageCache[el.id] = img;
              resolve();
            };
            img.onerror = () => resolve();
            img.src = el.src;
          })
      )
  );

  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);

  // Draw elements
  for (const el of elements) {
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
      ctx.lineWidth = el.lw;
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
    } else if (el.type === 'image') {
      const img = imageCache[el.id];
      if (img) {
        ctx.drawImage(img, el.x, el.y, el.w, el.h);
      } else {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(el.x, el.y, el.w, el.h);
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.placeholder || 'IMAGEN', el.x + el.w / 2, el.y + el.h / 2);
      }
    } else if (el.type === 'text') {
      ctx.fillStyle = el.color;
      ctx.font = `${el.fw || 'normal'} ${el.fs || 16}px sans-serif`;
      ctx.textAlign = el.align || 'left';
      ctx.textBaseline = 'top';
      const tx =
        el.align === 'center'
          ? el.x + el.w / 2
          : el.align === 'right'
          ? el.x + el.w
          : el.x;
      if (el.wrap) {
        drawWrapped(ctx, el.text, tx, el.y, el.w, (el.fs || 16) * 1.3, el.align);
      } else {
        ctx.fillText(el.text, tx, el.y);
      }
    }
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

/**
 * Exports selected submissions array to High Definition (HD) PDF document
 * using the EXACT ORIGINAL CANVAS FICHA template from the Canvas Editor.
 */
export async function exportSubmissionsToHDPDF(selectedSubmissions = [], docTitle = 'Reportes_Sala_Situacional_HD') {
  if (!selectedSubmissions || selectedSubmissions.length === 0) {
    alert('Selecciona al menos un formulario de la lista para exportar a PDF HD.');
    return;
  }

  const win = window.open('', '_blank');
  if (!win) {
    alert('Por favor autoriza las ventanas emergentes para generar el PDF HD.');
    return;
  }

  // Render each submission's exact canvas ficha
  const pagesData = await Promise.all(
    selectedSubmissions.map(async (sub) => {
      const imgData = await renderCanvasFichaImage(sub);
      const linkUrl = (sub.reportData?.enlace || '').trim();
      const hasLink = linkUrl.startsWith('http://') || linkUrl.startsWith('https://');
      return { sub, imgData, linkUrl, hasLink };
    })
  );

  const cardsHtml = pagesData
    .map(
      ({ imgData, linkUrl, hasLink }, index, arr) => `
      <div class="canvas-pdf-page" style="page-break-after: ${index === arr.length - 1 ? 'auto' : 'always'}; page-break-inside: avoid; width: 100%; max-width: 1100px; margin: 0 auto 20px auto; text-align: center;">
        <div style="position: relative; display: inline-block; width: 100%;">
          <img src="${imgData}" style="width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 4px;" alt="Ficha Canvas Oficial" />
          ${
            hasLink
              ? `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="pdf-link-overlay" title="Abrir enlace" style="position: absolute; left: 2.5%; top: 83.2%; width: 29.16%; height: 10%; display: block; z-index: 100; cursor: pointer; text-decoration: none !important; border: none !important; outline: none !important; background: transparent !important;"></a>`
              : ''
          }
        </div>
      </div>`
    )
    .join('');

  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${docTitle}</title>
        <style>
          @page { size: landscape; margin: 5mm; }
          @media print {
            html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: #ffffff !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .canvas-pdf-page { page-break-inside: avoid; max-width: 100% !important; margin: 0 auto !important; }
            .pdf-link-overlay { text-decoration: none !important; border: none !important; outline: none !important; background: transparent !important; color: transparent !important; }
          }
          body { font-family: Arial, Helvetica, sans-serif; background: #ffffff; padding: 10px; margin: 0; }
          .pdf-link-overlay { position: absolute; left: 2.5%; top: 83.2%; width: 29.16%; height: 10%; display: block; z-index: 100; cursor: pointer; text-decoration: none !important; border: none !important; outline: none !important; background: transparent !important; }
        </style>
      </head>
      <body>
        ${cardsHtml}

        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 700);
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

/**
 * Exports the Shift Report Canvas along with selected Submissions to an HD PDF
 * It places the shift report as the first page, followed by each submission.
 */
export async function exportCombinedReportAndFichasHDPDF(shiftCanvas, selectedSubmissions = [], docTitle = 'Reporte_Completo_Sala_Situacional_HD') {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Por favor autoriza las ventanas emergentes para generar el PDF HD.');
    return;
  }

  // 1. Get shift report image
  const shiftImgData = shiftCanvas ? shiftCanvas.toDataURL('image/png', 1.0) : null;
  const shiftHtml = shiftImgData ? `
    <div class="canvas-pdf-page shift-page" style="page-break-after: ${!selectedSubmissions || selectedSubmissions.length === 0 ? 'auto' : 'always'};">
      <img src="${shiftImgData}" alt="Reporte Diario Oficial" />
    </div>
  ` : '';

  // 2. Get fichas images
  let fichasHtml = '';
  if (selectedSubmissions && selectedSubmissions.length > 0) {
    const pagesData = await Promise.all(
      selectedSubmissions.map(async (sub) => {
        const imgData = await renderCanvasFichaImage(sub);
        const linkUrl = (sub.reportData?.enlace || '').trim();
        const hasLink = linkUrl.startsWith('http://') || linkUrl.startsWith('https://');
        return { sub, imgData, linkUrl, hasLink };
      })
    );

    fichasHtml = pagesData
      .map(
        ({ imgData, linkUrl, hasLink }, index, arr) => `
        <div class="canvas-pdf-page" style="page-break-after: ${index === arr.length - 1 ? 'auto' : 'always'};">
          <div style="position: relative; display: inline-block; width: 100%; height: 100%;">
            <img src="${imgData}" alt="Ficha Canvas Oficial" />
            ${
              hasLink
                ? `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="pdf-link-overlay" title="Abrir enlace"></a>`
                : ''
            }
          </div>
        </div>`
      )
      .join('');
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${docTitle}</title>
        <style>
          * { box-sizing: border-box; }
          @page { size: landscape; margin: 0; }
          @media print {
            html, body { width: 100%; height: 100%; margin: 0 !important; padding: 0 !important; background: #ffffff !important; overflow: hidden; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .canvas-pdf-page { page-break-inside: avoid; width: 100vw; height: 100vh; margin: 0 !important; padding: 0 !important; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .canvas-pdf-page img { max-width: 100%; max-height: 100vh; object-fit: contain; display: block; margin: 0 auto; }
            .shift-page { max-width: 100% !important; }
            .pdf-link-overlay { text-decoration: none !important; border: none !important; outline: none !important; background: transparent !important; color: transparent !important; }
          }
          body { font-family: Arial, Helvetica, sans-serif; background: #ffffff; padding: 0; margin: 0; }
          .canvas-pdf-page { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .canvas-pdf-page img { max-width: 100%; max-height: 100vh; object-fit: contain; }
          .pdf-link-overlay { position: absolute; left: 2.5%; top: 83.2%; width: 29.16%; height: 10%; display: block; z-index: 100; cursor: pointer; text-decoration: none !important; border: none !important; outline: none !important; background: transparent !important; }
        </style>
      </head>
      <body>
        ${shiftHtml}
        ${fichasHtml}

        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 1000);
        </script>
      </body>
    </html>
  `);
  win.document.close();
}
