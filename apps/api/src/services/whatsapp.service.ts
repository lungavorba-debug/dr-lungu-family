import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';

const SESSION_DATA_PATH = './storage/whatsapp-web';
const STUCK_INITIALIZING_MS = 90_000;

export interface WhatsAppSessionSnapshot {
  connected: boolean;
  initializing: boolean;
  qr_available: boolean;
}

/** Puppeteer flags tuned for headless Chromium on Windows. */
const PUPPETEER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
];

function fileExists(candidate: string): boolean {
  try {
    return fs.existsSync(candidate);
  } catch {
    return false;
  }
}

/** Prefer system Chrome on Windows, then Puppeteer-bundled Chromium. */
function resolveChromeExecutable(): string | undefined {
  const fromEnv = process.env.CHROME_PATH ?? process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && fileExists(fromEnv)) {
    return fromEnv;
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    const programFiles = process.env.ProgramFiles ?? process.env.PROGRAMFILES;
    const programFilesX86 = process.env['ProgramFiles(x86)'] ?? process.env['PROGRAMFILES(X86)'];

    const windowsCandidates = [
      localAppData
        ? path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe')
        : null,
      programFiles
        ? path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe')
        : null,
      programFilesX86
        ? path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe')
        : null,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ].filter((value): value is string => Boolean(value));

    for (const candidate of windowsCandidates) {
      if (fileExists(candidate)) {
        return candidate;
      }
    }
  }

  if (process.platform === 'darwin') {
    const macCandidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    ];
    for (const candidate of macCandidates) {
      if (fileExists(candidate)) {
        return candidate;
      }
    }
  }

  if (process.platform === 'linux') {
    const linuxCandidates = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
    ];
    for (const candidate of linuxCandidates) {
      if (fileExists(candidate)) {
        return candidate;
      }
    }
  }

  try {
    return puppeteer.executablePath();
  } catch (error) {
    console.warn('[whatsapp-web] Nu s-a găsit Chrome Puppeteer instalat.', error);
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class WhatsAppService {
  private client: Client;
  private isReady = false;
  private isInitializing = false;
  private isReconnecting = false;
  private initializingStartedAt: number | null = null;
  private handlersAttachedFor: Client | null = null;
  public currentQr: string | null = null;
  public lastError: string | null = null;

  constructor() {
    this.client = this.createClient();
  }

  get ready(): boolean {
    return this.isReady;
  }

  get initializing(): boolean {
    return this.isInitializing;
  }

  getStatus(): WhatsAppSessionSnapshot {
    return {
      connected: this.isReady,
      initializing: this.isInitializing || this.isReconnecting,
      qr_available: Boolean(this.currentQr),
    };
  }

  async getQrDataUrl(): Promise<string | null> {
    if (!this.currentQr) {
      return null;
    }

    return QRCode.toDataURL(this.currentQr, { width: 280, margin: 2 });
  }

  async waitForSessionUpdate(timeoutMs = 20_000, intervalMs = 500): Promise<WhatsAppSessionSnapshot> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const status = this.getStatus();
      if (status.connected || status.qr_available) {
        return status;
      }
      if (!status.initializing && this.lastError) {
        return status;
      }
      await sleep(intervalMs);
    }

    return this.getStatus();
  }

  private sessionDirectory(): string {
    return path.resolve(process.cwd(), SESSION_DATA_PATH);
  }

  private clearSessionStorage(reason: string): void {
    const sessionDir = this.sessionDirectory();
    if (!fs.existsSync(sessionDir)) {
      return;
    }

    console.warn(`[whatsapp-web] Se curăță sesiunea stocată (${reason}): ${sessionDir}`);
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }

  private markInitializing(): void {
    this.isInitializing = true;
    this.initializingStartedAt = Date.now();
    this.lastError = null;
  }

  private clearInitializing(): void {
    this.isInitializing = false;
    this.isReconnecting = false;
    this.initializingStartedAt = null;
  }

  private isInitializationStuck(): boolean {
    if (!this.isInitializing && !this.isReconnecting) {
      return false;
    }

    const startedAt = this.initializingStartedAt ?? Date.now();
    return Date.now() - startedAt > STUCK_INITIALIZING_MS;
  }

  private recordFailure(message: string): void {
    this.lastError = message;
    console.error(`[whatsapp-web] ${message}`);
  }

  /** Return to idle so the admin can press Connect again without a stuck loading state. */
  private async resetToIdle(reason: string, options: { clearStoredSession?: boolean } = {}): Promise<void> {
    this.isReady = false;
    this.clearInitializing();
    this.currentQr = null;

    try {
      await this.destroyClient();
    } catch (error) {
      console.warn('[whatsapp-web] Eroare la oprirea clientului în resetToIdle:', error);
    }

    if (options.clearStoredSession) {
      this.clearSessionStorage(reason);
    }

    this.client = this.createClient();
    this.handlersAttachedFor = null;
    console.log(`[whatsapp-web] Stare resetată (${reason}). Puteți apăsa din nou „Conectează WhatsApp”.`);
  }

  private createClient(): Client {
    const executablePath = resolveChromeExecutable();
    if (executablePath) {
      console.log('[whatsapp-web] Chrome executable:', executablePath);
    } else {
      console.warn(
        '[whatsapp-web] Chrome negăsit. Instalați Google Chrome sau rulați: npx puppeteer browsers install chrome',
      );
    }

    return new Client({
      authStrategy: new LocalAuth({ dataPath: SESSION_DATA_PATH }),
      puppeteer: {
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: PUPPETEER_ARGS,
      },
    });
  }

  private attachEventHandlers(client: Client): void {
    if (this.handlersAttachedFor === client) {
      return;
    }

    this.handlersAttachedFor = client;

    client.on('qr', (qr) => {
      this.currentQr = qr;
      this.lastError = null;
      this.markInitializing();
      console.log('[WhatsApp] QR Code generated successfully');
      console.log('[whatsapp-web] Scanează din Setări → WhatsApp sau http://localhost:3001/qr');
    });

    client.on('authenticated', () => {
      this.lastError = null;
      console.log('[whatsapp-web] 🔐 Sesiune autentificată.');
    });

    client.on('ready', () => {
      this.isReady = true;
      this.clearInitializing();
      this.currentQr = null;
      this.lastError = null;
      console.log('[whatsapp-web] ✅ Sesiune WhatsApp conectată și gata de trimitere!');
    });

    client.on('auth_failure', (message) => {
      const detail = typeof message === 'string' ? message : 'auth_failure';
      this.recordFailure(`Autentificare eșuată: ${detail}`);
      void this.resetToIdle('auth_failure', { clearStoredSession: true });
    });

    client.on('disconnected', (reason) => {
      this.recordFailure(`Deconectat: ${reason}`);
      void this.resetToIdle(`disconnected:${reason}`);
    });
  }

  private async destroyClient(): Promise<void> {
    try {
      await this.client.destroy();
    } catch (error) {
      console.warn('[whatsapp-web] Nu s-a putut opri clientul curent:', error);
    }
  }

  private async startClient(reason: string): Promise<void> {
    this.lastError = null;
    this.markInitializing();
    this.attachEventHandlers(this.client);

    try {
      console.log(`[whatsapp-web] ⏳ Lansare Chromium (${reason})...`);
      await this.client.initialize();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Eroare necunoscută la lansarea Puppeteer/Chromium.';
      this.recordFailure(`Puppeteer crash: ${message}`);
      await this.resetToIdle('initialize_failed');
    }
  }

  private async forceRestart(reason: string): Promise<void> {
    console.warn(`[whatsapp-web] Repornire forțată (${reason})`);
    await this.resetToIdle(reason);
    await this.startClient(reason);
  }

  public connect(): void {
    if (this.isReady) {
      console.log('[whatsapp-web] Sesiunea este deja conectată.');
      return;
    }

    if ((this.isInitializing || this.isReconnecting) && !this.isInitializationStuck()) {
      console.log('[whatsapp-web] Conectare deja în curs.');
      return;
    }

    if (this.isInitializationStuck()) {
      void this.forceRestart('connect_while_stuck');
      return;
    }

    void this.startClient('connect');
  }

  public initialize(): void {
    if (this.isReady) {
      return;
    }

    if ((this.isInitializing || this.isReconnecting) && !this.isInitializationStuck()) {
      console.log('[whatsapp-web] Client deja inițializat sau în curs de inițializare.');
      return;
    }

    if (this.isInitializationStuck()) {
      void this.forceRestart('initialize_while_stuck');
      return;
    }

    void this.startClient('initialize');
  }

  async sendReportPdf(
    phone: string,
    pdfBuffer: Buffer,
    fileName: string,
    patientName: string,
    caption?: string,
  ) {
    if (!this.isReady) {
      throw new Error(
        'Sesiunea WhatsApp nu este conectată. Deschide Setări → WhatsApp și scanează codul QR.',
      );
    }

    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `40${formattedPhone.slice(1)}`;
    } else if (!formattedPhone.startsWith('40')) {
      formattedPhone = `40${formattedPhone}`;
    }

    const chatId = `${formattedPhone}@c.us`;

    const media = new MessageMedia(
      'application/pdf',
      pdfBuffer.toString('base64'),
      fileName,
    );

    const messageCaption =
      caption ??
      `Bună ziua, ${patientName}!\n\nAșa cum am stabilit în cadrul evenimentului de screening cardiovascular, vă transmitem atașat raportul dumneavoastră medical MedScreen.\n\nVă dorim multă sănătate,\nEchipa Dr. Lungu Family`;

    console.log(`[whatsapp-web] Trimitere PDF către ${chatId} (${fileName})`);
    return await this.client.sendMessage(chatId, media, { caption: messageCaption });
  }
}

export const whatsAppService = new WhatsAppService();
