import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ success: false, error: 'URL inválida' }, { status: 400 });
    }

    let targetUrl = url;
    // Proxies para extraer metadatos más fácilmente (usados para embeds en Discord/Telegram)
    if (targetUrl.includes('twitter.com') || targetUrl.includes('x.com')) {
      targetUrl = targetUrl.replace('twitter.com', 'vxtwitter.com').replace('x.com', 'vxtwitter.com');
    } else if (targetUrl.includes('instagram.com')) {
      targetUrl = targetUrl.replace('instagram.com', 'ddinstagram.com');
    } else if (targetUrl.includes('tiktok.com')) {
      targetUrl = targetUrl.replace('tiktok.com', 'vxtiktok.com');
    }

    // Simulamos un User-Agent de bot como Telegram para forzar el retorno de meta-tags OG
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'TelegramBot (like TwitterBot)'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Status no OK' });
    }

    const html = await response.text();
    let extractedDate = null;

    // 1. Buscar <meta property="article:published_time" content="...">
    const ogMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']article:published_time["']/i);
    
    if (ogMatch && ogMatch[1]) {
      extractedDate = ogMatch[1];
    } else {
      // 2. Buscar Schema JSON-LD "datePublished": "2024..."
      const schemaMatch = html.match(/"datePublished"\s*:\s*["']([^"']+)["']/i);
      if (schemaMatch && schemaMatch[1]) {
        extractedDate = schemaMatch[1];
      } else {
        // 3. Buscar <time datetime="..."> genérico
        const timeMatch = html.match(/<time[^>]*datetime=["']([^"']+)["']/i);
        if (timeMatch && timeMatch[1]) {
          extractedDate = timeMatch[1];
        } else {
          // 4. Específico de Twitter (a veces lo mandan como meta named="description") o en el HTML de bots
          const createdMatch = html.match(/"created_at"\s*:\s*["']([^"']+)["']/i);
          if (createdMatch && createdMatch[1]) {
             extractedDate = createdMatch[1];
          }
        }
      }
    }

    if (extractedDate) {
      const parsedDate = new Date(extractedDate);
      if (!isNaN(parsedDate.getTime())) {
        return NextResponse.json({ success: true, datetime: parsedDate.toISOString() });
      }
    }

    return NextResponse.json({ success: false, error: 'No se encontró la fecha' });

  } catch (error) {
    console.error('Error al hacer scrape de la URL:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
