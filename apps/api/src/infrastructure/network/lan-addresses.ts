import os from 'node:os';

export function getLanIPv4Addresses(): string[] {
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

  return [...addresses].sort((a, b) => lanAddressPriority(a) - lanAddressPriority(b));
}

function lanAddressPriority(ip: string): number {
  if (ip.startsWith('192.168.')) return 0;
  if (ip.startsWith('10.')) return 1;
  return 2;
}

export function getPreferredLanIPv4Address(): string | undefined {
  return getLanIPv4Addresses()[0];
}
