import http from 'node:http';

const url = new URL(process.argv[2] ?? 'http://127.0.0.1:3001/api/v1/health');
const timeoutMs = Number(process.argv[3] ?? 120000);
const intervalMs = 500;
const startedAt = Date.now();

function isHealthy() {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        timeout: 2000,
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

async function waitForApi() {
  while (Date.now() - startedAt < timeoutMs) {
    if (await isHealthy()) {
      console.log(`[wait-for-api] Ready: ${url.toString()} — starting frontend…`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timed out waiting for ${url.toString()}`);
}

try {
  await waitForApi();
} catch (error) {
  console.error(`[wait-for-api] ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
