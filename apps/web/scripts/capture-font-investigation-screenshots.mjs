import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';

const outDir = join(process.cwd(), 'apps/web/scripts/ui-screenshots');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.pdf': 'application/pdf' };

async function capture(viewer, output) {
  const port = 8770 + Math.floor(Math.random() * 100);
  const server = createServer((req, res) => {
    const urlPath = req.url.split('?')[0];
    const filePath = join(outDir, urlPath.replace(/^\//, ''));
    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] ?? 'application/octet-stream' });
    res.end(readFileSync(filePath));
  });
  await new Promise((resolve) => server.listen(port, resolve));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  await page.goto(`http://127.0.0.1:${port}/${viewer}`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => document.getElementById('status')?.textContent === 'ready', { timeout: 120000 });
  await page.locator('#c').screenshot({ path: join(outDir, output) });
  await browser.close();
  server.close();
  console.log(output);
}

await capture('font-investigation-current-viewer.html', 'font-investigation-current.png');
await capture('font-investigation-official-viewer.html', 'font-investigation-official.png');
