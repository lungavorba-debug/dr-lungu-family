import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const envFiles = [
  { example: join(root, '.env.example'), target: join(root, '.env') },
  { example: join(root, 'apps/api/.env.example'), target: join(root, 'apps/api/.env') },
  { example: join(root, 'apps/web/.env.example'), target: join(root, 'apps/web/.env') },
];

let created = 0;

for (const { example, target } of envFiles) {
  if (existsSync(target)) {
    continue;
  }

  if (!existsSync(example)) {
    console.warn(`[setup-dev-env] Missing example file: ${example}`);
    continue;
  }

  copyFileSync(example, target);
  created += 1;
  console.log(`[setup-dev-env] Created ${target.replace(root + '\\', '').replace(root + '/', '')}`);
}

if (created === 0) {
  console.log('[setup-dev-env] Environment files already present.');
} else {
  console.log(`[setup-dev-env] Created ${created} environment file(s) from examples.`);
}
