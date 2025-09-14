import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const interfaces = os.networkInterfaces();
  let ip = 'localhost';

  for (const name of Object.keys(interfaces)) {
    const ifaces = interfaces[name];
    if (ifaces) {
      for (const iface of ifaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ip = iface.address;
          break;
        }
      }
    }
    if (ip !== 'localhost') break;
  }

  const port = process.env.PORT || '3000';

  return NextResponse.json({ ip, port });
}
