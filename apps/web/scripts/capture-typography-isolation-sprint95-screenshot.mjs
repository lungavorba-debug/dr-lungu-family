import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const outDir = join(process.cwd(), 'apps/web/scripts/ui-screenshots');
const port = 8769;
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.pdf': 'application/pdf',
};

writeFileSync(
  join(outDir, 'typography-isolation-sprint95-viewer.html'),
  `<!DOCTYPE html><html><head><meta charset="utf-8" /><script src="./pdf.min.js"></script>
<style>body{margin:0;background:#525659}#wrap{padding:16px}canvas{background:#fff;display:block;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.3)}#status{color:#fff;font:14px sans-serif;text-align:center;padding:8px}</style></head>
<body><div id="status">loading...</div><div id="wrap"><canvas id="c"></canvas></div>
<script>pdfjsLib.GlobalWorkerOptions.workerSrc='./pdf.worker.min.js';
pdfjsLib.getDocument('./typography-isolation-sprint95.pdf').promise.then(p=>p.getPage(1)).then(page=>{const vp=page.getViewport({scale:1.5});const c=document.getElementById('c');c.width=vp.width;c.height=vp.height;return page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise}).then(()=>document.getElementById('status').textContent='ready').catch(e=>document.getElementById('status').textContent='error:'+e.message);</script></body></html>`,
  'utf8',
);

const server = createServer((req, res) => {
  const urlPath = req.url === '/' ? '/typography-isolation-sprint95-viewer.html' : req.url.split('?')[0];
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
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForFunction(() => document.getElementById('status')?.textContent === 'ready', { timeout: 120000 });
const screenshotPath = join(outDir, 'typography-isolation-sprint95.png');
await page.locator('#c').screenshot({ path: screenshotPath });
await browser.close();
server.close();
console.log('SCREENSHOT=' + screenshotPath);
