import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Extracción de los datos
    const {
      origenOperacion = {},
      focosTerritoriales = [],
      alertasTempranas = [],
      publicacionesRegistradas = [],
      fechaStr = new Date().toLocaleDateString('es-VE')
    } = data;

    // --- CONSTRUCCIÓN DEL HTML PARA EL PDF ---
    // Emularemos el diseño gráfico de las imágenes de referencia

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const logoUrl = `${baseUrl}/logo.png`; 

    let html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: landscape; margin: 0; }
        body { font-family: 'Arial', sans-serif; -webkit-print-color-adjust: exact; background: white; margin: 0; padding: 0; }
        .pdf-page { 
          width: 297mm; 
          height: 210mm; 
          overflow: hidden; 
          position: relative; 
          page-break-after: always;
          display: flex;
          flex-direction: column;
        }
        
        /* HEADER RED BAR */
        .top-red-bar {
          background-color: #dc2626; /* red-600 */
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          border-bottom: 8px solid #991b1b;
        }
        .header-title {
          color: white;
          font-size: 32px;
          font-weight: 900;
          text-align: center;
          text-transform: uppercase;
          line-height: 1.1;
          flex: 1;
        }
        .date-badge {
          background: white;
          color: #dc2626;
          border-radius: 12px;
          padding: 8px 16px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        
        /* COLUMNS CONTAINER */
        .cols-container {
          display: flex;
          gap: 20px;
          padding: 20px 40px;
          flex: 1;
        }
        .col {
          flex: 1;
          border: 3px solid #dc2626;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .col-header {
          background-color: #dc2626;
          color: white;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .col-header h2 {
          font-size: 18px;
          font-weight: 900;
          margin: 0;
          text-transform: uppercase;
          line-height: 1.2;
        }
        .col-content {
          padding: 15px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .item-block {
          display: flex;
          gap: 12px;
        }
        .item-icon {
          width: 40px;
          height: 40px;
          background-color: #dc2626;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
          font-size: 20px;
        }
        .item-text {
          flex: 1;
          font-size: 12px;
        }
        .item-title {
          color: #dc2626;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 2px;
          font-size: 13px;
        }
        .item-desc {
          color: #1e3a8a; /* blue-900 */
          font-weight: 700;
          text-transform: uppercase;
        }

        /* CAPTURAS */
        .capturas-header {
          background-color: #dc2626;
          color: white;
          margin: 20px 40px;
          border-radius: 20px;
          padding: 15px 30px;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .capturas-grid {
          display: flex;
          gap: 20px;
          padding: 0 40px;
          height: 60%;
        }
        .captura-card {
          flex: 1;
          border: 3px solid #dc2626;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .captura-title {
          background-color: #dc2626;
          color: white;
          padding: 8px 15px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .captura-img {
          flex: 1;
          background-size: cover;
          background-position: top center;
          background-repeat: no-repeat;
        }
        .captura-img-tag {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .bg-bottom-wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 30px;
          background-color: #dc2626;
        }
      </style>
    </head>
    <body>
    `;

    // ---------------- PAGINA 1 ----------------
    html += `
      <div class="pdf-page">
        <div class="top-red-bar">
          <div style="width:120px; height: 120px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); margin-top: 40px; border: 4px solid #dc2626; z-index:10; padding:10px;">
             <!-- Reemplazar con el logo real si es necesario -->
             <img src="${logoUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.style.display='none'" />
             <div style="font-weight:900; color:#dc2626; font-size:14px; text-align:center; line-height:1; ${`display:none` /* Oculto si el logo carga */}">SALA<br>SITUACIONAL</div>
          </div>
          <div class="header-title">ANÁLISIS TÉCNICO DE CAMPAÑA<br>Y ALERTA DIGITAL</div>
          <div class="date-badge">
             <span style="font-size:24px;">📅</span>
             <div style="display:flex; flex-direction:column; line-height:1;">
               <span style="font-size:10px;">FECHA:</span>
               <span style="font-size:16px;">${fechaStr}</span>
             </div>
          </div>
        </div>

        <div class="cols-container">
          <!-- Col 1 -->
          <div class="col">
            <div class="col-header">
               <div style="background:white; color:#dc2626; border-radius:50%; width:35px; height:35px; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:900;">1</div>
               <h2>SEGMENTO 1:<br><span style="font-size:12px; font-weight:700;">ORIGEN Y OPERACIÓN DIGITAL</span></h2>
            </div>
            <div class="col-content">
               <div class="item-block">
                 <div class="item-icon">👤</div>
                 <div class="item-text">
                   <div class="item-title">CUENTAS MATRIZ IDENTIFICADAS:</div>
                   <div class="item-desc">${origenOperacion.cuentasMatriz || 'N/A'}</div>
                 </div>
               </div>
               <hr style="border-top:1px solid #fca5a5;">
               <div class="item-block">
                 <div class="item-icon">📄</div>
                 <div class="item-text">
                   <div class="item-title">ESTRATEGIA Y NARRATIVA:</div>
                   <div class="item-desc">${origenOperacion.estrategiaNarrativa || 'N/A'}</div>
                 </div>
               </div>
               <hr style="border-top:1px solid #fca5a5;">
               <div class="item-block">
                 <div class="item-icon">📢</div>
                 <div class="item-text">
                   <div class="item-title">LÍNEA DE AMPLIFICACIÓN:</div>
                   <div class="item-desc">${origenOperacion.lineaAmplificacion || 'N/A'}</div>
                 </div>
               </div>
            </div>
          </div>

          <!-- Col 2 -->
          <div class="col">
            <div class="col-header">
               <div style="background:white; color:#dc2626; border-radius:50%; width:35px; height:35px; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:900;">2</div>
               <h2>SEGMENTO 2:<br><span style="font-size:12px; font-weight:700;">DESCONTENTO COMUNITARIO Y FOCOS TERRITORIALES</span></h2>
            </div>
            <div class="col-content">
               ${focosTerritoriales.map(mun => `
                 <div class="item-block">
                   <div class="item-icon">📍</div>
                   <div class="item-text">
                     <div class="item-title">MUNICIPIO ${mun.nombre}:</div>
                     <div class="item-desc">${mun.descripcion}</div>
                   </div>
                 </div>
               `).join('<hr style="border-top:1px solid #fca5a5;">')}
               ${focosTerritoriales.length === 0 ? '<div class="item-desc">NO SE REGISTRARON FOCOS.</div>' : ''}
            </div>
          </div>

          <!-- Col 3 -->
          <div class="col">
            <div class="col-header">
               <div style="background:white; color:#dc2626; border-radius:50%; width:35px; height:35px; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:900;">3</div>
               <h2>SEGMENTO 3:<br><span style="font-size:12px; font-weight:700;">ALERTA TEMPRANA Y REGISTRO EN COMENTARIOS</span></h2>
            </div>
            <div class="col-content">
               ${alertasTempranas.map(alerta => `
                 <div class="item-block">
                   <div class="item-icon">⚠️</div>
                   <div class="item-text">
                     <div class="item-title">${alerta.nivel.toUpperCase()}:</div>
                     <div class="item-desc" style="color:#dc2626; font-size:11px; margin-bottom:4px;">USUARIO: ${alerta.usuario.toUpperCase()}</div>
                     <div class="item-desc">REGISTRO: ${alerta.registro}</div>
                   </div>
                 </div>
               `).join('<hr style="border-top:1px solid #fca5a5;">')}
               ${alertasTempranas.length === 0 ? '<div class="item-desc">NO HAY ALERTAS REGISTRADAS.</div>' : ''}
            </div>
          </div>
        </div>
        <div class="bg-bottom-wave"></div>
      </div>
    `;

    // ---------------- PAGINA 2 (SI HAY IMAGENES) ----------------
    if (publicacionesRegistradas && publicacionesRegistradas.length > 0) {
      
      // Partir en grupos de a 4 imagenes max por página
      const chunkedImages = [];
      for (let i = 0; i < publicacionesRegistradas.length; i += 4) {
        chunkedImages.push(publicacionesRegistradas.slice(i, i + 4));
      }

      chunkedImages.forEach((imgChunk, chunkIndex) => {
        html += `
        <div class="pdf-page">
          <div class="top-red-bar">
            <div style="width:120px; height: 120px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); margin-top: 40px; border: 4px solid #dc2626; z-index:10; padding:10px;">
               <img src="${logoUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.style.display='none'" />
            </div>
            <div class="header-title">ANÁLISIS TÉCNICO DE CAMPAÑA<br>Y ALERTA DIGITAL</div>
            <div class="date-badge">
               <span style="font-size:24px;">📅</span>
               <div style="display:flex; flex-direction:column; line-height:1;">
                 <span style="font-size:10px;">FECHA:</span>
                 <span style="font-size:16px;">${fechaStr}</span>
               </div>
            </div>
          </div>

          <div class="capturas-header">
             <span style="font-size:40px;">📸</span>
             <div>
               <div style="font-size:28px; font-weight:900; line-height:1;">REGISTRO DE PUBLICACIONES</div>
               <div style="font-size:14px; font-weight:600;">(CAPTURAS DE PANTALLA REDES SOCIALES)</div>
             </div>
          </div>

          <div class="capturas-grid">
            ${imgChunk.map((url, idx) => {
              const capNum = chunkIndex * 4 + idx + 1;
              return `
                <div class="captura-card">
                  <div class="captura-title">
                     <div style="background:white; color:#dc2626; border-radius:50%; width:25px; height:25px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:900;">${capNum}</div>
                     <span>Captura de Registro</span>
                  </div>
                  <div class="captura-img">
                     <img src="${url}" class="captura-img-tag" />
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="bg-bottom-wave"></div>
        </div>
        `;
      });
    }

    html += `</body></html>`;

    // ---------------- GENERACIÓN DEL PDF CON PUPPETEER ----------------
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
    // Wait until networkidle0 para que carguen las imagenes
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true, // IMPORTANT: Las imágenes referenciales son horizontales (landscape)
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Analisis_Campana_${fechaStr}.pdf"`
      }
    });

  } catch (error) {
    console.error("Analisis PDF generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
