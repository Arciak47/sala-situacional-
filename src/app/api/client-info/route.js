import { NextResponse } from 'next/server';

export async function GET(request) {
  // Try to get the real IP if behind a proxy like Vercel or Cloudflare
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'IP desconocida';
  const userAgent = request.headers.get('user-agent') || 'User-Agent desconocido';

  // Format IP to avoid taking proxy chains, usually the first one is the client
  const clientIp = ip.split(',')[0].trim();

  return NextResponse.json({
    ip: clientIp,
    userAgent: userAgent,
    // Provide a server timestamp as fallback, though Firestore's serverTimestamp() is better for DB writes
    serverTime: new Date().toISOString()
  });
}
