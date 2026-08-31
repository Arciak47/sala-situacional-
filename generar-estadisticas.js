const fs = require('fs');

async function fetchAllDocuments(projectId, collectionName) {
  const documents = [];
  let pageToken = '';

  while (true) {
    let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?pageSize=300`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    
    if (json.documents) {
      documents.push(...json.documents);
    }
    if (json.nextPageToken) {
      pageToken = json.nextPageToken;
    } else {
      break;
    }
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
    for (const [k, v] of Object.entries(value.mapValue.fields || {})) {
      obj[k] = parseFirestoreValue(v);
    }
    return obj;
  }
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values || []).map(parseFirestoreValue);
  }
  if (value.nullValue !== undefined) return null;
  return null;
}

async function run() {
  try {
    console.log("Fetching from Firestore REST API...");
    const rawDocs = await fetchAllDocuments('sala-de-monitoreo', 'submissions');
    console.log(`Fetched ${rawDocs.length} total documents.`);

    const startDate = '2026-08-15T00:00:00.000Z';
    const endDate = '2026-08-31T23:59:59.999Z';

    const parsedDocs = rawDocs.map(doc => {
      const data = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        data[k] = parseFirestoreValue(v);
      }
      return data;
    });

    const filteredDocs = parsedDocs.filter(d => {
      const ts = d.timestamp || d.fechaHora;
      return ts && ts >= startDate && ts <= endDate;
    });

    console.log(`Documents in range: ${filteredDocs.length}`);

    let csv = '\uFEFF';
    csv += 'Analista,Email,Fecha,Estado,Comentario\n';

    filteredDocs.forEach(d => {
      const name = String(d.analystName || d.nombre || '').replace(/,/g, '');
      const email = String(d.analystEmail || d.email || '').replace(/,/g, '');
      const date = String(d.timestamp || d.fechaHora || '').replace(/,/g, '');
      const status = String(d.status || '').replace(/,/g, '');
      const comment = String(d.reportData?.comment || d.comment || d.comentario || '').replace(/,/g, ' ').replace(/\n/g, ' ');
      
      csv += `${name},${email},${date},${status},${comment}\n`;
    });

    fs.writeFileSync('estadisticas_analistas_agosto.csv', csv, 'utf8');
    console.log("CSV generated successfully: estadisticas_analistas_agosto.csv");
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
