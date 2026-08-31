const fs = require('fs');
const ExcelJS = require('exceljs');

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

    // Group by Analyst
    const analystGroups = {};
    filteredDocs.forEach(d => {
      const name = (d.analystName || d.nombre || 'Desconocido').trim();
      const email = (d.analystEmail || d.email || 'N/A').trim();
      const key = `${name} (${email})`;
      
      if (!analystGroups[key]) {
        analystGroups[key] = {
          name,
          email,
          records: []
        };
      }
      analystGroups[key].records.push(d);
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Monitoreo';
    workbook.created = new Date();

    // Generate a sheet for each analyst
    for (const [groupKey, group] of Object.entries(analystGroups)) {
      let sheetName = group.name.replace(/[\\\/\?\*\[\]\:]/g, '').trim().substring(0, 31);
      if (!sheetName) sheetName = "Desconocido";

      // Handle duplicate sheet names
      let counter = 1;
      let finalSheetName = sheetName;
      while (workbook.getWorksheet(finalSheetName)) {
        const suffix = `_${counter}`;
        finalSheetName = sheetName.substring(0, 31 - suffix.length) + suffix;
        counter++;
      }

      const sheet = workbook.addWorksheet(finalSheetName, {
        views: [{ state: 'frozen', ySplit: 5 }] // Freeze headers
      });

      // Sort records chronologically
      group.records.sort((a, b) => {
        const tsA = new Date(a.timestamp || a.fechaHora || 0);
        const tsB = new Date(b.timestamp || b.fechaHora || 0);
        return tsA - tsB; // Ascending (oldest to newest)
      });

      // Calculate totals
      const totalReports = group.records.length;
      
      // TITLE ROWS
      sheet.mergeCells('A1:F1');
      sheet.getCell('A1').value = `Analista: ${group.name}`;
      sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1F4E78' } };
      sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };

      sheet.mergeCells('A2:F2');
      sheet.getCell('A2').value = `Email: ${group.email}  |  Total de Reportes: ${totalReports}`;
      sheet.getCell('A2').font = { size: 12, italic: true };
      sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'left' };

      sheet.mergeCells('A3:F3'); // Empty row for spacing

      // TABLE HEADERS (Row 4)
      const headerRow = sheet.getRow(5);
      headerRow.values = ['Día', 'Hora', 'Fecha Completa', 'Estado', 'Tipo de Reporte', 'Comentario'];
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;
      
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1F4E78' } 
        };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      sheet.columns = [
        { key: 'day', width: 15 },
        { key: 'time', width: 12 },
        { key: 'fullDate', width: 22 },
        { key: 'status', width: 15 },
        { key: 'type', width: 25 },
        { key: 'comment', width: 60 }
      ];

      let rowIdx = 6;
      group.records.forEach((d, index) => {
        const dateVal = d.timestamp || d.fechaHora || '';
        let day = '';
        let time = '';
        let fullDate = '';

        try {
          if (dateVal) {
            const dt = new Date(dateVal);
            day = dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
            time = dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            fullDate = `${day} ${time}`;
          }
        } catch(e) {}

        const status = d.status || 'N/A';
        const type = d.type || 'N/A';
        const comment = d.reportData?.comment || d.comment || d.comentario || '';
        
        const row = sheet.getRow(rowIdx);
        row.values = { day, time, fullDate, status, type, comment };

        // Alternating row colors
        if (index % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
          });
        }

        // Borders and alignment
        row.eachCell((cell) => {
          cell.border = { top: { style: 'hair' }, left: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'hair' } };
          
          if (cell._column.key === 'status') {
            cell.alignment = { horizontal: 'center' };
            if (status.toLowerCase() === 'pendiente') cell.font = { color: { argb: 'FFB8860B' }, bold: true }; 
            else if (status.toLowerCase() === 'revisado') cell.font = { color: { argb: 'FF008000' }, bold: true }; 
            else if (status.toLowerCase() === 'rechazado') cell.font = { color: { argb: 'FFB22222' }, bold: true }; 
          }
          if (['day', 'time', 'fullDate'].includes(cell._column.key)) {
              cell.alignment = { horizontal: 'center' };
          }
        });
        rowIdx++;
      });

      // Auto filter
      sheet.autoFilter = {
        from: { row: 5, column: 1 },
        to: { row: rowIdx - 1, column: 6 }
      };
    }

    const fileName = 'Reporte_Detallado_Por_Analista_Agosto.xlsx';
    await workbook.xlsx.writeFile(fileName);
    console.log(`Excel file generated successfully: ${fileName}`);

  } catch(e) {
    console.error("Error:", e);
  }
}
run();
