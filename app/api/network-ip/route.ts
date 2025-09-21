import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const port = process.env.PORT || '3000';

  // Check if running in Docker
  const isDocker = process.env.DOCKER_CONTAINER === 'true' ||
                   process.env.NODE_ENV === 'production' ||
                   process.env.DOCKER_ENV === 'true';

  let ip = 'localhost';

  if (isDocker) {
    // When running in Docker, use environment variables or fallback to common host IPs
    ip = process.env.HOST_IP ||
         process.env.DOCKER_HOST_IP ||
         '192.168.1.1'; // Common default gateway IP

    // If no environment variable is set, try to get the host IP from common interfaces
    if (!ip || ip === '192.168.1.1') {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        const ifaces = interfaces[name];
        if (ifaces) {
          for (const iface of ifaces) {
            if (iface.family === 'IPv4' && !iface.internal) {
              // Look for common private network ranges
              if (iface.address.startsWith('172.') ||
                  iface.address.startsWith('10.') ||
                  iface.address.startsWith('192.168.')) {
                ip = iface.address;
                break;
              }
            }
          }
        }
        if (ip && ip !== '192.168.1.1') break;
      }
    }


  } else {
    // When running locally (not in Docker), get the actual network IP
    const interfaces = os.networkInterfaces();
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
  }

  return NextResponse.json({ ip, port });
}
