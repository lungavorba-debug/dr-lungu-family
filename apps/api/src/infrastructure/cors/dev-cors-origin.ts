import type { CorsOptions } from 'cors';

/** Private LAN + localhost origins used during local network development. */
export function isLocalNetworkDevOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    const port = url.port;

    if (port && port !== '5173' && port !== '4173') {
      return false;
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function createDevCorsOrigin(configuredOrigin: string): CorsOptions['origin'] {
  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (origin === configuredOrigin || isLocalNetworkDevOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  };
}
