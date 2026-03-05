const fs = require('fs');

function createIcoImage(size) {
  const pixelCount = size * size;
  const pixelDataSize = pixelCount * 4;
  const andMaskRowBytes = Math.ceil(size / 8);
  const andMaskPaddedRow = Math.ceil(andMaskRowBytes / 4) * 4;
  const andMaskSize = andMaskPaddedRow * size;
  const imageDataSize = 40 + pixelDataSize + andMaskSize;

  // BMP Info Header (40 bytes)
  const bmpHeader = Buffer.alloc(40);
  bmpHeader.writeUInt32LE(40, 0);          // Header size
  bmpHeader.writeInt32LE(size, 4);         // Width
  bmpHeader.writeInt32LE(size * 2, 8);     // Height (double for AND mask)
  bmpHeader.writeUInt16LE(1, 12);          // Planes
  bmpHeader.writeUInt16LE(32, 14);         // Bits per pixel
  bmpHeader.writeUInt32LE(0, 20);          // Image data size

  // Pixel data (BGRA) - orange/gold color
  const pixelData = Buffer.alloc(pixelDataSize);
  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    pixelData[offset]     = 0x33; // Blue
    pixelData[offset + 1] = 0x99; // Green
    pixelData[offset + 2] = 0xFF; // Red
    pixelData[offset + 3] = 0xFF; // Alpha
  }

  // AND mask (all opaque)
  const andMask = Buffer.alloc(andMaskSize, 0x00);

  return {
    size,
    imageDataSize,
    data: Buffer.concat([bmpHeader, pixelData, andMask])
  };
}

// Create multiple sizes for a proper ICO
const sizes = [16, 32, 48, 256];
const images = sizes.map(s => createIcoImage(s));

// ICO Header (6 bytes)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);              // Reserved
header.writeUInt16LE(1, 2);              // Type (ICO)
header.writeUInt16LE(images.length, 4);  // Number of images

// Calculate offsets
let dataOffset = 6 + (images.length * 16); // header + directory entries

// Directory entries (16 bytes each)
const dirEntries = [];
for (const img of images) {
  const entry = Buffer.alloc(16);
  entry[0] = img.size === 256 ? 0 : img.size; // Width (0 = 256)
  entry[1] = img.size === 256 ? 0 : img.size; // Height (0 = 256)
  entry[2] = 0;                                 // Color palette
  entry[3] = 0;                                 // Reserved
  entry.writeUInt16LE(1, 4);                    // Color planes
  entry.writeUInt16LE(32, 6);                   // Bits per pixel
  entry.writeUInt32LE(img.data.length, 8);      // Image data size
  entry.writeUInt32LE(dataOffset, 12);          // Offset to data
  dirEntries.push(entry);
  dataOffset += img.data.length;
}

// Combine everything
const ico = Buffer.concat([
  header,
  ...dirEntries,
  ...images.map(img => img.data)
]);

fs.writeFileSync('src-tauri/icons/icon.ico', ico);
console.log(`Created valid icon.ico (${sizes.join(', ')}px) - ${ico.length} bytes`);
