// create-icons.js - Genereer simpele PNG icons zonder externe dependencies
// Run met: node create-icons.js

const fs = require('fs');
const zlib = require('zlib');

// PNG helper functies
function crc32(data) {
  let crc = 0xffffffff;
  const table = [];

  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crcValue = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crcValue);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);   // bit depth
  ihdr.writeUInt8(2, 9);   // color type (RGB)
  ihdr.writeUInt8(0, 10);  // compression
  ihdr.writeUInt8(0, 11);  // filter
  ihdr.writeUInt8(0, 12);  // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk (image data)
  // Create raw image data: filter byte + RGB for each pixel per row
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte (none)
    for (let x = 0; x < width; x++) {
      // Create a simple icon with a circle
      const cx = width / 2;
      const cy = height / 2;
      const radius = width * 0.45;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Inside circle - blue gradient
        const factor = 1 - (dist / radius) * 0.3;
        rawData.push(Math.round(26 * factor));   // R
        rawData.push(Math.round(115 * factor));  // G
        rawData.push(Math.round(232 * factor));  // B
      } else {
        // Outside circle - transparent (white for RGB)
        rawData.push(255);
        rawData.push(255);
        rawData.push(255);
      }
    }
  }

  // Add red recording dot in top-right
  const dotCx = width * 0.78;
  const dotCy = height * 0.22;
  const dotRadius = width * 0.1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * (1 + width * 3) + 1 + x * 3;
      const dx = x - dotCx;
      const dy = y - dotCy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= dotRadius) {
        rawData[idx] = 239;     // R
        rawData[idx + 1] = 68;  // G
        rawData[idx + 2] = 68;  // B
      }
    }
  }

  const rawBuffer = Buffer.from(rawData);
  const compressed = zlib.deflateSync(rawBuffer);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Genereer icons
const sizes = [16, 48, 128];

for (const size of sizes) {
  const png = createPNG(size, size, 26, 115, 232);
  const filename = `icon${size}.png`;
  fs.writeFileSync(filename, png);
  console.log(`Created ${filename} (${png.length} bytes)`);
}

console.log('Done! Icons created successfully.');
