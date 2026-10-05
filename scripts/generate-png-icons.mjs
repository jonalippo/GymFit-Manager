import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, isMaskable = false) {
  // Simple PNG encoder using raw RGBA and Deflate
  const buffer = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.35 : 0.42);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background
      let r = 9, g = 13, b = 22, a = 255; // #090D16

      // Circle border or accent
      if (Math.abs(dist - radius) < (width * 0.03)) {
        r = 16; g = 185; b = 129; // emerald #10B981
      } else if (dist < radius * 0.75 && dist > radius * 0.7) {
        r = 52; g = 211; b = 153; // light emerald
      }

      // Center kinetic mark simulation
      if (Math.abs(dx + dy * 0.5) < width * 0.05 && dist < radius * 0.6) {
        r = 16; g = 185; b = 129;
      }
      if (Math.abs(dx - dy * 0.5) < width * 0.04 && dist < radius * 0.5) {
        r = 241; g = 245; b = 249; // slate-100
      }

      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // Construct IDAT chunk
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const lineStart = y * (width * 4 + 1);
    scanlines[lineStart] = 0; // Filter type 0: None
    buffer.copy(scanlines, lineStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(scanlines);

  function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);

    // Compute CRC32
    let c = 0xffffffff;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let curr = n;
      for (let k = 0; k < 8; k++) {
        curr = (curr & 1) ? (0xedb88320 ^ (curr >>> 1)) : (curr >>> 1);
      }
      table[n] = curr;
    }
    const combined = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < combined.length; i++) {
      c = table[(c ^ combined[i]) & 0xff] ^ (c >>> 8);
    }
    c = c ^ 0xffffffff;
    crcBuf.writeInt32BE(c, 0);

    return Buffer.concat([length, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: 0
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/pwa-192x192.png', createPng(192, 192, false));
fs.writeFileSync('./public/pwa-512x512.png', createPng(512, 512, false));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPng(512, 512, true));
fs.writeFileSync('./public/apple-touch-icon.png', createPng(180, 180, false));

console.log('PWA PNG icons generated successfully.');
