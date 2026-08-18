/**
 * Verifies API health and login after dev startup.
 * Usage: node scripts/verify-dev-startup.mjs [webPort] [apiPort]
 */
const webPort = Number(process.argv[2] ?? 5173);
const apiPort = Number(process.argv[3] ?? 3001);

const webBase = `http://127.0.0.1:${webPort}`;
const apiBase = `http://127.0.0.1:${apiPort}/api/v1`;

async function checkHealth(baseUrl, label) {
  const response = await fetch(`${baseUrl}/health`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`${label} health failed with status ${response.status}`);
  }
  return response.json();
}

async function checkLogin(baseUrl, label) {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@medscreen.ro',
      password: 'Admin123!',
    }),
  });

  const body = await response.json();
  if (!response.ok || body.status === 'error' || !body.data?.token) {
    throw new Error(`${label} login failed: ${body.error?.message ?? response.status}`);
  }
}

try {
  await checkHealth(apiBase, 'API');
  await checkHealth(`${webBase}/api/v1`, 'Web proxy');
  await checkLogin(apiBase, 'API');
  await checkLogin(`${webBase}/api/v1`, 'Web proxy');
  console.log('[verify-dev-startup] OK — health and login succeed on API and web proxy.');
} catch (error) {
  console.error('[verify-dev-startup] FAILED —', error instanceof Error ? error.message : error);
  process.exit(1);
}
