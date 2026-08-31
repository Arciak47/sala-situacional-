const http = require('http');
const fs = require('fs');

async function main() {
  console.log("Calling local Next.js API to generate PDF por Salas...");
  
  const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/generate-pdf-salas?startDate=2026-08-15&endDate=2026-08-31',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    if (res.statusCode !== 200) {
      console.error(`API error: ${res.statusCode}`);
      return;
    }

    const fileStream = fs.createWriteStream('Reporte_Salas_Agosto.pdf');
    res.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close();
      console.log("PDF generated successfully and saved to Desktop (project root) as Reporte_Salas_Agosto.pdf");
    });
  });

  req.on('error', (e) => {
    console.error("Failed to generate PDF via local API:", e.message);
    console.log("Make sure Next.js is running (npm run dev) on port 3000.");
  });

  req.end();
}

main();
