const fs = require('fs');
const puppeteer = require('puppeteer');

async function fetchAllDocuments(projectId, collectionName) {
  const documents = [];
  let pageToken = '';
  console.log("Fetching from Firestore...");
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
  return documents;
}

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

async function run() {
  try {
    const rawDocs = await fetchAllDocuments('sala-de-monitoreo', 'submissions');
    
    const startDate = '2026-08-15T00:00:00.000Z';
    const endDate = '2026-08-31T23:59:59.999Z';

    const parsedDocs = rawDocs.map(doc => {
      const data = {};
      for (const [k, v] of Object.entries(doc.fields || {})) data[k] = parseFirestoreValue(v);
      return data;
    });

    const filteredDocs = parsedDocs.filter(d => {
      const ts = d.timestamp || d.fechaHora;
      return ts && ts >= startDate && ts <= endDate;
    });

    const allDates = [];
    for(let i = 15; i <= 31; i++) {
      allDates.push(`${i.toString().padStart(2, '0')}/08`);
    }

    const analysts = {};
    
    filteredDocs.forEach(d => {
      const name = (d.analystName || d.nombre || 'Desconocido').trim();
      const email = (d.analystEmail || d.email || 'N/A').trim();
      
      let sentimiento = 'NEUTRO';
      if (d.reportData && d.reportData.sentimiento) {
        sentimiento = d.reportData.sentimiento.toUpperCase();
      }

      const dt = new Date(d.timestamp || d.fechaHora);
      const day = String(dt.getDate()).padStart(2, '0');
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const dateStr = `${day}/${month}`;
      const hourStr = dt.getHours();

      if (!analysts[name]) {
        analysts[name] = { 
          email, 
          total: 0, 
          sentimiento: { POSITIVO: 0, NEGATIVO: 0, NEUTRO: 0 }, 
          byDate: {}, 
          byHour: Array(24).fill(0) 
        };
        allDates.forEach(d => analysts[name].byDate[d] = 0);
      }
      
      analysts[name].total++;
      
      if (analysts[name].sentimiento[sentimiento] !== undefined) {
        analysts[name].sentimiento[sentimiento]++;
      } else {
        analysts[name].sentimiento.NEUTRO++;
      }
      
      if(analysts[name].byDate[dateStr] !== undefined) {
        analysts[name].byDate[dateStr]++;
      }
      analysts[name].byHour[hourStr]++;
    });

    console.log("Building HTML...");

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
          <p class="text-xl"><strong>Período:</strong> 15 de Agosto al 31 de Agosto, 2026</p>
          <p class="text-xl mt-2"><strong>Total de Reportes:</strong> ${filteredDocs.length}</p>
        </div>
      </div>
    `;

    for (const [name, data] of Object.entries(analysts).sort((a,b) => b[1].total - a[1].total)) {
      if (data.total === 0) continue;
      
      // Calculate Sentiments
      const maxSentiment = Object.keys(data.sentimiento).reduce((a, b) => data.sentimiento[a] > data.sentimiento[b] ? a : b);
      const maxSentimentPct = Math.round((data.sentimiento[maxSentiment] / data.total) * 100);

      // Active Hours
      const activeHoursList = [];
      data.byHour.forEach((val, idx) => {
        if(val > 0) activeHoursList.push({hour: idx, count: val});
      });
      activeHoursList.sort((a,b) => b.count - a.count);
      const topHours = activeHoursList.slice(0, 3).map(h => `${h.hour}:00 (${h.count} reps)`).join(', ');

      const dailyData = allDates.map(d => data.byDate[d]);
      const dailyChartUrl = getChartUrl({
        type: 'line',
        data: {
          labels: allDates,
          datasets: [{
            label: 'Reportes por Día',
            data: dailyData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true
          }]
        },
        options: { title: {display: true, text: 'Actividad Diaria'}, legend: {display: false} }
      });

      const sentimentChartUrl = getChartUrl({
        type: 'doughnut',
        data: {
          labels: ['Positivo', 'Negativo', 'Neutro'],
          datasets: [{
            data: [data.sentimiento.POSITIVO, data.sentimiento.NEGATIVO, data.sentimiento.NEUTRO],
            backgroundColor: ['#10b981', '#ef4444', '#f59e0b']
          }]
        },
        options: { title: {display: true, text: 'Sentimiento'} }
      });

      let rowsHtml = '';
      const numRows = Math.ceil(allDates.length / 2);
      for (let i = 0; i < numRows; i++) {
        const d1 = allDates[i];
        const c1 = data.byDate[d1];
        const c1Str = c1 === 0 ? '<span class="text-red-500 font-bold">0</span>' : c1;
        const d2 = allDates[i + 9] || '';
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
            <h2 class="text-3xl font-bold text-slate-800">${name}</h2>
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

        <div class="flex flex-row justify-center gap-4 mb-4" style="height: 250px;">
          <div class="w-1/2 flex items-center justify-center">
            <img src="${dailyChartUrl}" alt="Tendencia" class="max-w-full max-h-full object-contain border rounded-lg shadow-sm bg-white">
          </div>
          <div class="w-1/2 flex items-center justify-center">
            <img src="${sentimentChartUrl}" alt="Sentimiento" class="max-w-full max-h-full object-contain border rounded-lg shadow-sm bg-white">
          </div>
        </div>

        <div class="break-inside-avoid">
          <h3 class="text-lg font-bold mb-2 text-slate-700">Desglose Diario (15/08 al 31/08)</h3>
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
    
    fs.writeFileSync('temp_reporte.html', html);
    console.log("HTML ready. Launching Puppeteer to capture as PDF...");

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    
    const pdfName = 'Reporte_Analistas_Detallado_Agosto.pdf';
    await page.pdf({
      path: pdfName,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();
    fs.unlinkSync('temp_reporte.html');

    console.log(`PDF generated successfully: ${pdfName}`);

  } catch(e) {
    console.error("Error:", e);
  }
}
run();
