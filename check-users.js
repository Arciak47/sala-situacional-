const fs = require('fs');

async function main() {
  const projectId = 'sala-de-monitoreo';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`;
  const response = await fetch(url);
  const json = await response.json();
  
  function parseFirestoreValue(value) {
    if (!value) return null;
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return parseInt(value.integerValue, 10);
    // ... basic parser
    return value.stringValue;
  }
  
  if (json.documents) {
    json.documents.forEach(doc => {
      const data = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        data[k] = v.stringValue !== undefined ? v.stringValue : v;
      }
      console.log(`User: ${data.name || data.nombres}, Sala: ${data.sala}`);
    });
  }
}
main();
