declare module 'whatsapp-web.js' {
  export class LocalAuth {
    constructor(options?: { clientId?: string; dataPath?: string });
  }

  export class MessageMedia {
    constructor(mimetype: string, data: string, filename?: string);
  }

  export class Client {
    constructor(options?: {
      authStrategy?: LocalAuth;
      puppeteer?: { headless?: boolean; executablePath?: string; args?: string[] };
    });

    on(event: 'qr', listener: (qr: string) => void): this;
    on(event: 'ready', listener: () => void): this;
    on(event: 'authenticated', listener: () => void): this;
    on(event: 'auth_failure', listener: (message: string) => void): this;
    on(event: 'disconnected', listener: (reason: string) => void): this;

    initialize(): Promise<void>;
    destroy(): Promise<void>;
    sendMessage(
      chatId: string,
      content: MessageMedia,
      options?: { caption?: string },
    ): Promise<unknown>;
  }
}

declare module 'qrcode-terminal' {
  const qrcode: {
    generate(input: string, options?: { small?: boolean }): void;
  };

  export default qrcode;
}
