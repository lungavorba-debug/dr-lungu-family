import http from 'node:http';
import os from 'node:os';

export function getLanIPv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = new Set();

  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const details of iface) {
      const family = String(details.family);
      const isIPv4 = family === 'IPv4' || family === '4';
      if (isIPv4 && !details.internal) {
        addresses.add(details.address);
      }
    }
  }

  return [...addresses].sort((a, b) => {
    const score = (ip) => {
      if (ip.startsWith('192.168.')) return 0;
      if (ip.startsWith('10.')) return 1;
      return 2;
    };
    return score(a) - score(b);
  });
}

export function getPreferredLanIp() {
  return getLanIPv4Addresses()[0] ?? null;
}

export function checkHttpHealth(url, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const request = http.get(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        timeout: timeoutMs,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      },
    );

    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.on('error', () => resolve(false));
  });
}

export async function printCombinedDevBanner({
  webPort = 5173,
  apiPort = 3001,
  apiHealthUrl = `http://127.0.0.1:${apiPort}/api/v1/health`,
  webRunning = true,
} = {}) {
  const apiHealthy = await checkHttpHealth(apiHealthUrl);
  const lanIp = getPreferredLanIp();

  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('  MedScreen Dev — ready for mobile testing (same Wi-Fi)');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  API:         ${apiHealthy ? `✓ http://localhost:${apiPort}/api/v1/health` : '✗ not reachable'}`);
  console.log(
    `  Frontend:    ${webRunning ? `✓ http://localhost:${webPort}/ (--host)` : '⋯ starting…'}`,
  );

  if (webRunning && lanIp) {
    console.log(`  Mobile URL:  http://${lanIp}:${webPort}/  ← open on phone/tablet`);
    console.log(`  Mobile API:  http://${lanIp}:${webPort}/api/v1/health (via Vite proxy)`);
  } else if (webRunning) {
    console.log('  Mobile URL:  (no LAN IPv4 detected — check Wi-Fi)');
  }

  console.log('  PWA cache:   disabled in dev');
  console.log('══════════════════════════════════════════════════════');
  console.log('');
}
