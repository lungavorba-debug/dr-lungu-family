/**
 * Self-contained QR Code Model 2 generator (byte mode, ECC level H for print reliability).
 * Used for clinic links in participant HTML/PDF reports.
 */
const ECC_LEVEL = 2;
const MASK_PATTERN = 0;
const ECC_CODEWORDS = [
  [],
  [7, 10, 13, 17],
  [10, 16, 22, 28],
  [15, 26, 36, 44],
  [20, 36, 52, 64],
  [26, 48, 72, 88],
  [36, 64, 96, 124],
  [40, 72, 108, 144],
  [48, 88, 132, 168],
  [60, 110, 160, 208],
  [72, 130, 192, 250],
];
const ECC_BLOCKS = [
  [],
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 2, 2],
  [1, 2, 2, 4],
  [1, 2, 4, 4],
  [2, 4, 4, 6],
  [2, 4, 6, 6],
  [2, 5, 6, 8],
  [3, 5, 8, 8],
  [3, 6, 9, 10],
];

function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ (z >>> 7 ? 0x11d : 0);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number): number[] {
  const result = Array.from({ length: degree }, () => 0);
  result.push(1);
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1]!;
    }
    root = gfMul(root, 2);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0);
  for (const byte of data) {
    const factor = byte ^ result.shift()!;
    result.push(0);
    for (let i = 0; i < result.length; i += 1) {
      result[i] ^= gfMul(divisor[i] ?? 0, factor);
    }
  }
  return result;
}

function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function dataCodewords(version: number): number {
  const versionIndex = version - 1;
  return (
    Math.floor(rawDataModules(version) / 8) -
    ECC_CODEWORDS[ECC_LEVEL]![versionIndex]! * ECC_BLOCKS[ECC_LEVEL]![versionIndex]!
  );
}

function appendBits(bits: number[], value: number, length: number): void {
  for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
}

function encodeBytes(text: string): { version: number; codewords: number[] } {
  const safeText =
    typeof text === 'string' && text.trim().length > 0 ? text.trim() : resolveClinicQrUrl({});
  const bytes = [...new TextEncoder().encode(safeText)];
  let version = 1;
  while (version <= 10 && bytes.length + 3 > dataCodewords(version)) version += 1;
  if (version > 10) throw new Error('QR payload too long');

  const bits: number[] = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  for (const byte of bytes) appendBits(bits, byte, 8);
  appendBits(bits, 0, Math.min(4, 8 - (bits.length % 8)));
  while (bits.length % 8 !== 0) bits.push(0);

  const capacity = dataCodewords(version) * 8;
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) appendBits(bits, pad, 8);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let b = 0; b < 8; b += 1) value = (value << 1) | bits[i + b]!;
    data.push(value);
  }

  const versionIndex = version - 1;
  const blocks = ECC_BLOCKS[ECC_LEVEL]![versionIndex]!;
  const eccLen = Math.floor(ECC_CODEWORDS[ECC_LEVEL]![versionIndex]! / blocks);
  const shortLen = Math.floor(dataCodewords(version) / blocks);
  const shortBlocks = blocks - (dataCodewords(version) % blocks);
  const divisor = rsDivisor(eccLen);
  const blockData: number[][] = [];
  const eccData: number[][] = [];
  let offset = 0;

  for (let block = 0; block < blocks; block += 1) {
    const len = shortLen + (block >= shortBlocks ? 1 : 0);
    const chunk = data.slice(offset, offset + len);
    offset += len;
    blockData.push(chunk);
    eccData.push(rsRemainder(chunk, divisor));
  }

  const codewords: number[] = [];
  for (let i = 0; i < blockData[0]!.length; i += 1) {
    for (let block = 0; block < blocks; block += 1) {
      if (i < blockData[block]!.length) codewords.push(blockData[block]![i]!);
    }
  }
  for (let i = 0; i < eccLen; i += 1) {
    for (let block = 0; block < blocks; block += 1) codewords.push(eccData[block]![i]!);
  }

  return { version, codewords };
}

function getBit(data: number[], index: number): boolean {
  return ((data[index >>> 3]! >>> (7 - (index & 7))) & 1) === 1;
}

function getFormatBits(eccLevel: number, mask: number): number {
  let data = (eccLevel << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i += 1) {
    rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  }
  return ((data << 10) | (rem & 0x3ff)) ^ 0x5412;
}

function setFormatModule(
  modules: boolean[][],
  reserved: boolean[][],
  size: number,
  x: number,
  y: number,
  dark: boolean,
): void {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  modules[y]![x] = dark;
  reserved[y]![x] = true;
}

function drawFormatBits(
  modules: boolean[][],
  reserved: boolean[][],
  size: number,
  formatBits: number,
): void {
  for (let i = 0; i <= 5; i += 1) {
    setFormatModule(modules, reserved, size, 8, i, ((formatBits >>> i) & 1) !== 0);
  }
  setFormatModule(modules, reserved, size, 8, 7, ((formatBits >>> 6) & 1) !== 0);
  setFormatModule(modules, reserved, size, 8, 8, ((formatBits >>> 7) & 1) !== 0);
  setFormatModule(modules, reserved, size, 7, 8, ((formatBits >>> 8) & 1) !== 0);
  for (let i = 9; i < 15; i += 1) {
    setFormatModule(modules, reserved, size, 14 - i, 8, ((formatBits >>> i) & 1) !== 0);
  }
  for (let i = 0; i < 8; i += 1) {
    setFormatModule(modules, reserved, size, size - 1 - i, 8, ((formatBits >>> i) & 1) !== 0);
  }
  for (let i = 8; i < 15; i += 1) {
    setFormatModule(modules, reserved, size, 8, size - 15 + i, ((formatBits >>> i) & 1) !== 0);
  }
}

function buildMatrix(version: number, codewords: number[]): boolean[][] {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const reserved = Array.from({ length: size }, () => Array.from({ length: size }, () => false));

  const setFunction = (x: number, y: number, dark: boolean) => {
    modules[y]![x] = dark;
    reserved[y]![x] = true;
  };

  const drawFinder = (x: number, y: number) => {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        setFunction(
          xx,
          yy,
          dist !== 2 && dist !== 4 && dx >= 0 && dy >= 0 && dx <= 6 && dy <= 6,
        );
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  for (let i = 8; i < size - 8; i += 1) {
    setFunction(i, 6, i % 2 === 0);
    setFunction(6, i, i % 2 === 0);
  }

  if (version >= 2) {
    const align = [6];
    const num = Math.floor(version / 7) + 2;
    const step = Math.floor((version * 8 + num * 3 + 5) / (num * 4 - 4)) * 2;
    for (let pos = size - 7; align.length < num; pos -= step) align.splice(1, 0, pos);
    for (const cy of align) {
      for (const cx of align) {
        if (reserved[cy]![cx]) continue;
        for (let dy = -2; dy <= 2; dy += 1) {
          for (let dx = -2; dx <= 2; dx += 1) {
            setFunction(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
          }
        }
      }
    }
  }

  setFunction(8, size - 8, true);
  for (let i = 0; i < 8; i += 1) {
    setFunction(i, 8, i % 2 === 0);
    setFunction(8, i, i % 2 === 0);
    setFunction(size - 1 - i, 8, i % 2 === 0);
    setFunction(8, size - 1 - i, i % 2 === 0);
  }

  let bit = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    const upward = ((right + 1) & 2) === 0;
    for (let vert = 0; vert < size; vert += 1) {
      const y = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        if (reserved[y]![x]) continue;
        modules[y]![x] = getBit(codewords, bit);
        bit += 1;
      }
    }
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (reserved[y]![x]) continue;
      if ((x + y) % 2 === MASK_PATTERN) modules[y]![x] = !modules[y]![x];
    }
  }

  drawFormatBits(modules, reserved, size, getFormatBits(ECC_LEVEL, MASK_PATTERN));
  return modules;
}

const QUIET_ZONE = 6;

export function resolveClinicQrUrl(clinic: {
  website?: string | null;
  googleBusinessUrl?: string | null;
  contactPageUrl?: string | null;
}): string {
  if (clinic.website?.trim()) {
    const website = clinic.website.trim();
    return website.startsWith('http') ? website : `https://${website}`;
  }
  if (clinic.googleBusinessUrl?.trim()) return clinic.googleBusinessUrl.trim();
  if (clinic.contactPageUrl?.trim()) {
    const contact = clinic.contactPageUrl.trim();
    return contact.startsWith('http') ? contact : `https://${contact}`;
  }
  return 'https://www.drlungufamily.ro';
}

export function generateQrMatrix(text: string | null | undefined): boolean[][] {
  const payload =
    typeof text === 'string' && text.trim().length > 0
      ? text.trim()
      : resolveClinicQrUrl({});

  try {
    const { version, codewords } = encodeBytes(payload);
    const core = buildMatrix(version, codewords);
    const size = core.length + QUIET_ZONE * 2;
    const matrix = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
    for (let y = 0; y < core.length; y += 1) {
      for (let x = 0; x < core.length; x += 1) {
        matrix[y + QUIET_ZONE]![x + QUIET_ZONE] = core[y]![x]!;
      }
    }
    return matrix;
  } catch {
    const fallback = resolveClinicQrUrl({});
    if (payload === fallback) {
      throw new Error('QR generation failed for clinic fallback URL.');
    }
    return generateQrMatrix(fallback);
  }
}
