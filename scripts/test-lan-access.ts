import os from 'node:os';

function getLanIPv4Addresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses = new Set<string>();

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

  return [...addresses];
}

/** Prefer typical Wi-Fi LAN addresses over virtual adapters (Hyper-V, WSL, etc.). */
function getPreferredLanIPv4Address(): string | undefined {
  const addresses = getLanIPv4Addresses();
  const wifiLike = addresses.find((ip) => ip.startsWith('192.168.'));
  if (wifiLike) return wifiLike;

  const homeLan = addresses.find((ip) => ip.startsWith('10.'));
  if (homeLan) return homeLan;

  return addresses[0];
}

async function fetchJson(url: string, init?: RequestInit): Promise<{ status: number; body: unknown }> {
  const response = await fetch(url, init);
  const text = await response.text();
  let body: unknown = text;

  try {
    body = JSON.parse(text);
  } catch {
    // keep raw text
  }

  return { status: response.status, body };
}

function assertOk(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function main(): Promise<void> {
  const lanIp = getPreferredLanIPv4Address();
  assertOk(Boolean(lanIp), 'No LAN IPv4 address detected on this machine.');

  const frontendBase = `http://${lanIp}:5173`;
  const backendBase = `http://${lanIp}:3001`;
  const loginPayload = {
    email: 'admin@medscreen.ro',
    password: 'Admin123!',
  };

  console.log('LAN access validation');
  console.log(`  Local IP:      ${lanIp}`);
  console.log(`  Frontend URL:  ${frontendBase}/`);
  console.log(`  Backend URL:   ${backendBase}/api/v1/health`);

  const directHealth = await fetchJson(`${backendBase}/api/v1/health`);
  assertOk(directHealth.status === 200, `Direct API health failed (${directHealth.status})`);
  console.log('  ✓ Direct API health reachable via LAN IP');

  const corsProbe = await fetch(`${backendBase}/api/v1/health`, {
    headers: { Origin: frontendBase },
  });
  assertOk(corsProbe.ok, 'CORS preflight probe failed for LAN frontend origin');

  const corsAllowOrigin = corsProbe.headers.get('access-control-allow-origin');
  assertOk(
    corsAllowOrigin === frontendBase || corsAllowOrigin === '*',
    `CORS header missing for LAN origin (got: ${corsAllowOrigin ?? 'none'})`,
  );
  console.log('  ✓ CORS allows LAN frontend origin');

  const proxiedHealth = await fetchJson(`${frontendBase}/api/v1/health`);
  assertOk(proxiedHealth.status === 200, `Vite proxy health failed (${proxiedHealth.status})`);
  console.log('  ✓ Frontend proxy /api/v1 reachable via LAN IP');

  const loginResponse = await fetchJson(`${frontendBase}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: frontendBase,
    },
    body: JSON.stringify(loginPayload),
  });

  assertOk(loginResponse.status === 200, `LAN login failed (${loginResponse.status})`);

  const loginBody = loginResponse.body as {
    status?: string;
    data?: { token?: string };
  };
  assertOk(loginBody.status === 'success', 'Login response was not successful');
  assertOk(typeof loginBody.data?.token === 'string', 'Login token missing');
  console.log('  ✓ Login works via LAN frontend proxy');

  const token = loginBody.data!.token!;
  const meResponse = await fetchJson(`${frontendBase}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: frontendBase,
    },
  });

  assertOk(meResponse.status === 200, `Session probe failed (${meResponse.status})`);
  console.log('  ✓ Authenticated session works via LAN IP');

  console.log('');
  console.log('LAN validation passed.');
}

main().catch((error) => {
  console.error('');
  console.error('LAN validation failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
