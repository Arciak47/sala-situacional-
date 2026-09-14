const fs = require('fs');

async function main() {
  const startDate = '2026-08-15';
  const endDate = '2026-08-31';
  const startISO = `${startDate}T04:00:00.000Z`;
  const nextDay = new Date(new Date(endDate).getTime() + 24*60*60*1000);
  const endISO = `${nextDay.toISOString().split('T')[0]}T03:59:59.999Z`;

  const projectId = 'sala-de-monitoreo';

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

  const documents = [];
  let submissionsToken = '';
  while (true) {
    let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/submissions?pageSize=300`;
    if (submissionsToken) url += `&pageToken=${encodeURIComponent(submissionsToken)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
    const json = await response.json();
    if (json.documents) {
      documents.push(...json.documents.map(doc => {
        const data = {};
        for (const [k, v] of Object.entries(doc.fields || {})) data[k] = parseFirestoreValue(v);
        return data;
      }));
    }
    if (json.nextPageToken) submissionsToken = json.nextPageToken;
    else break;
  }

  const filteredDocs = documents.filter(d => {
    const ts = d.timestamp || d.fechaHora;
    return ts && ts >= startISO && ts <= endISO;
  });

  const analysts = {};
  filteredDocs.forEach(d => {
    const name = (d.analystName || d.nombre || 'Desconocido').trim();
    if (!analysts[name]) analysts[name] = 0;
    analysts[name]++;
  });

  console.log("PDF counts by Name:");
  console.log(Object.entries(analysts).sort((a,b) => b[1] - a[1]));

  // Let's also group by email/analystId like the dashboard does
  const byId = {};
  filteredDocs.forEach(d => {
    const id = d.analystId;
    if (!byId[id]) byId[id] = 0;
    byId[id]++;
  });
  console.log("PDF counts by ID:");
  console.log(Object.entries(byId).sort((a,b) => b[1] - a[1]));
}

main();
