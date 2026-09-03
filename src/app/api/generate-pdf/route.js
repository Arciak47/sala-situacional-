import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export const maxDuration = 60; // Allow more time on Vercel Pro if deployed
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate'); // YYYY-MM-DD
    const shift = searchParams.get('shift') || 'all'; // 'all', 't1', 't2', 't3'

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Faltan fechas' }, { status: 400 });
    }

    // Set ISO boundaries for Venezuela time (UTC-4)
    // 00:00:00 local is 04:00:00 UTC
    const startISO = `${startDate}T04:00:00.000Z`;
    // For end date, add 1 day and use 03:59:59.999Z
    const nextDay = new Date(new Date(endDate).getTime() + 24*60*60*1000);
    const endISO = `${nextDay.toISOString().split('T')[0]}T03:59:59.999Z`;

    // Fetch documents
    const documents = [];
    let pageToken = '';
    const projectId = 'sala-de-monitoreo';
    const collectionName = 'submissions';
    
    while (true) {
      let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?pageSize=300`;
      if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const json = await response.json();
      if (json.documents) documents.push(...json.documents);
      if (json.nextPageToken) pageToken = json.nextPageToken;
      else break;
    }

    // Helper functions
    function parseFirestoreValue(value) {
      if (!value) return null;
      if (value.stringValue !== undefined) return value.stringValue;
      if (value.integerValue !== undefined) return parseInt(value.integerValue, 10);
      if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
      if (value.booleanValue !== undefined) return value.booleanValue;
      if (value.timestampValue !== undefined) return value.timestampValue;
      if (value.mapValue !== undefined) {
        const obj = {};
        for (const [k, v] of Object.entries(value.mapValue.fields || {})) obj[k] = parseFirestoreValue(v);
        return obj;
      }
      if (value.arrayValue !== undefined) return (value.arrayValue.values || []).map(parseFirestoreValue);
      if (value.nullValue !== undefined) return null;
      return null;
    }

    function getChartUrl(config) {
      return `https://quickchart.io/chart?w=450&h=250&c=${encodeURIComponent(JSON.stringify(config))}`;
    }

    // 1. Fetch Users
    const users = [];
    let usersToken = '';
    while (true) {
      let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?pageSize=300`;
      if (usersToken) url += `&pageToken=${encodeURIComponent(usersToken)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Users fetch error! status: ${res.status}`);
      const json = await res.json();
      if (json.documents) {
        users.push(...json.documents.map(doc => {
          const data = { id: doc.name.split('/').pop() };
          for (const [k, v] of Object.entries(doc.fields || {})) data[k] = parseFirestoreValue(v);
          return data;
        }));
      }
      if (json.nextPageToken) usersToken = json.nextPageToken;
      else break;
    }

    const userMap = {};
    users.forEach(u => {
      if (u.id) userMap[u.id] = u;
    });

    const parsedDocs = documents.map(doc => {
      const data = {};
      for (const [k, v] of Object.entries(doc.fields || {})) data[k] = parseFirestoreValue(v);
      return data;
    });

    // Helper: getEventTimestamp (Matches Dashboard)
    const getEventTimestamp = (obj) => {
      if (!obj) return 0;
      try {
        const fechaRaw = obj.reportData?.fechaRaw || obj.fechaRaw;
        const horaRaw = obj.reportData?.horaRaw || obj.horaRaw;
        if (fechaRaw && horaRaw) {
          const dateStr = `${fechaRaw}T${horaRaw}`;
          const time = new Date(dateStr).getTime();
          if (!isNaN(time)) return time;
        }
      } catch (err) {}
      const ts = obj.timestamp || obj.fechaHora || obj.fecha;
      if (ts) {
        const time = new Date(ts).getTime();
        if (!isNaN(time)) return time;
      }
      return 0;
    };

    const toLocalDateStr = (tsNumber) => {
      if (!tsNumber) return '';
      const d = new Date(tsNumber);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${mo}-${day}`;
    };

    const filteredDocs = parsedDocs.filter(d => {
      const eventTs = getEventTimestamp(d) || new Date(d.timestamp || d.fechaHora).getTime();
      const localDate = toLocalDateStr(eventTs);
      
      let isDateValid = localDate && localDate >= startDate && localDate <= endDate && d.status !== 'repetido';
      if (!isDateValid) return false;

      if (shift === 'all') return true;
      const hour = new Date(eventTs).getHours();
      if (shift === 't1') return hour >= 7 && hour <= 12;
      if (shift === 't2') return hour >= 13 && hour <= 18;
      if (shift === 't3') return hour >= 19 && hour <= 23;
      return true;
    });

    // Generate dates array strictly based on selection
    const allDates = [];
    let currDate = new Date(startDate + 'T12:00:00Z');
    const lastDate = new Date(endDate + 'T12:00:00Z');

    while (currDate <= lastDate) {
      const day = String(currDate.getUTCDate()).padStart(2, '0');
      const month = String(currDate.getUTCMonth() + 1).padStart(2, '0');
      allDates.push(`${day}/${month}`);
      currDate.setUTCDate(currDate.getUTCDate() + 1);
    }

    const analysts = {};
    
    filteredDocs.forEach(d => {
      let analystName = (d.analystName || d.nombre || 'Desconocido').trim();
      let email = d.analystEmail || '';
      
      const analystId = d.analystId;
      if (analystId && userMap[analystId]) {
        const u = userMap[analystId];
        analystName = (u.name || u.nombres || analystName).trim();
        email = u.email || email;
      }
      
      let sentimiento = 'NEUTRO';
      if (d.reportData && d.reportData.sentimiento) {
        sentimiento = d.reportData.sentimiento.toUpperCase();
      }

      const eventTs = getEventTimestamp(d) || new Date(d.timestamp || d.fechaHora).getTime();
      const localDate = toLocalDateStr(eventTs); // "YYYY-MM-DD"
      const dateParts = localDate.split('-'); // [YYYY, MM, DD]
      const dateStr = `${dateParts[2]}/${dateParts[1]}`;
      const hourStr = new Date(eventTs).getHours();

      if (!analysts[analystName]) {
        analysts[analystName] = { 
          email, 
          total: 0, 
          sentimiento: { POSITIVO: 0, NEGATIVO: 0, NEUTRO: 0 }, 
          byDate: {}, 
          byHour: Array(24).fill(0) 
        };
        allDates.forEach(d => analysts[analystName].byDate[d] = 0);
      }
      
      analysts[analystName].total++;
      
      if (analysts[analystName].sentimiento[sentimiento] !== undefined) {
        analysts[analystName].sentimiento[sentimiento]++;
      } else {
        analysts[analystName].sentimiento.NEUTRO++;
      }
      
      if(analysts[analystName].byDate[dateStr] !== undefined) {
        analysts[analystName].byDate[dateStr]++;
      }
      analysts[analystName].byHour[hourStr]++;
    });

    let html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Estadístico Detallado</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: A4; margin: 0; }
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; -webkit-print-color-adjust: exact; }
        .page { width: 210mm; min-height: 297mm; padding: 20mm; margin: auto; background: white; page-break-after: always; position: relative; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .break-inside-avoid { break-inside: avoid; }
        h1, h2, h3 { color: #0f172a; }
      </style>
    </head>
    <body>
      <div class="page flex flex-col justify-center items-center text-center bg-slate-900 text-white">
        <h1 class="text-5xl font-extrabold mb-4 text-white">Reporte Analítico Detallado</h1>
        <h2 class="text-2xl text-slate-300 mb-8">Sala de Monitoreo</h2>
        <div class="p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
          <p class="text-xl"><strong>Período:</strong> ${startDate} al ${endDate}</p>
          <p class="text-xl mt-2"><strong>Total de Reportes:</strong> ${filteredDocs.length}</p>
        </div>
      </div>
    `;

    for (const [analystName, data] of Object.entries(analysts).sort((a,b) => b[1].total - a[1].total)) {
      if (data.total === 0) continue;
      
      const maxSentiment = Object.keys(data.sentimiento).reduce((a, b) => data.sentimiento[a] > data.sentimiento[b] ? a : b);
      const maxSentimentPct = Math.round((data.sentimiento[maxSentiment] / data.total) * 100);

      const activeHoursList = [];
      data.byHour.forEach((val, idx) => {
        if(val > 0) activeHoursList.push({hour: idx, count: val});
      });
      activeHoursList.sort((a,b) => b.count - a.count);
      const topHours = activeHoursList.slice(0, 3).map(h => `${h.hour}:00 (${h.count} reps)`).join(', ');

      let rowsHtml = '';
      const numRows = Math.ceil(allDates.length / 2);
      for (let i = 0; i < numRows; i++) {
        const d1 = allDates[i];
        const c1 = data.byDate[d1];
        const c1Str = c1 === 0 ? '<span class="text-red-500 font-bold">0</span>' : c1;
        
        const idx2 = i + numRows;
        const d2 = idx2 < allDates.length ? allDates[idx2] : '';
        const c2 = d2 ? data.byDate[d2] : '';
        const c2Str = c2 === 0 ? '<span class="text-red-500 font-bold">0</span>' : c2;
        
        rowsHtml += `
          <tr class="bg-white border-b break-inside-avoid">
            <td class="px-3 py-1 border-r font-medium text-slate-900">${d1}</td>
            <td class="px-3 py-1 border-r text-center text-slate-700">${c1Str}</td>
            <td class="px-3 py-1 border-r font-medium text-slate-900">${d2}</td>
            <td class="px-3 py-1 text-center text-slate-700">${c2Str}</td>
          </tr>
        `;
      }

      html += `
      <div class="page break-inside-avoid">
        <div class="flex items-center justify-between border-b-2 border-slate-200 pb-2 mb-4">
          <div>
            <h2 class="text-3xl font-bold text-slate-800">${analystName}</h2>
            <p class="text-slate-500">${data.email}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-500 uppercase font-bold">Total Entregas</p>
            <p class="text-4xl font-extrabold text-indigo-600">${data.total}</p>
          </div>
        </div>

        <div class="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
          <p class="text-base"><strong>Sentimiento Principal:</strong> El ${maxSentimentPct}% de sus reportes fue de carácter <strong>${maxSentiment}</strong>.</p>
          <p class="text-base mt-1"><strong>Horas de Mayor Actividad:</strong> ${topHours || 'N/A'}.</p>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-bold mb-2 text-slate-700">Distribución de Sentimiento</h3>
          <div class="w-full flex h-4 rounded-full overflow-hidden bg-slate-200">
            <div style="width: ${(data.sentimiento.POSITIVO/data.total)*100}%" class="bg-emerald-500"></div>
            <div style="width: ${(data.sentimiento.NEUTRO/data.total)*100}%" class="bg-amber-500"></div>
            <div style="width: ${(data.sentimiento.NEGATIVO/data.total)*100}%" class="bg-rose-500"></div>
          </div>
          <div class="flex justify-between text-xs text-slate-600 mt-2 font-medium">
            <span class="text-emerald-600">Positivo: ${data.sentimiento.POSITIVO}</span>
            <span class="text-amber-600">Neutro: ${data.sentimiento.NEUTRO}</span>
            <span class="text-rose-600">Negativo: ${data.sentimiento.NEGATIVO}</span>
          </div>
        </div>

        <div class="break-inside-avoid">
          <h3 class="text-lg font-bold mb-2 text-slate-700">Desglose Diario</h3>
          <table class="w-full text-sm text-left text-slate-600 border border-slate-300">
            <thead class="text-xs text-slate-700 uppercase bg-slate-100">
              <tr>
                <th class="px-3 py-1 border-b border-r">Día</th>
                <th class="px-3 py-1 border-b border-r text-center">Enviados</th>
                <th class="px-3 py-1 border-b border-r">Día</th>
                <th class="px-3 py-1 border-b text-center">Enviados</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
      `;
    }

    html += `</body></html>`;
    
    // Launch Puppeteer headless and generate buffer
    const isLocal = !!process.env.NEXT_PUBLIC_IS_LOCAL;
    const browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: isLocal 
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : await chromium.executablePath(
            `https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar`
          ),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Reporte_Analistas.pdf"`
      }
    });

  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
