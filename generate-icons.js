const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 transparent PNG (8 bytes of image data)
// This is the smallest valid PNG file possible
const minimalPNG = Buffer.from([
  // PNG signature
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  
  // IHDR chunk (width=1, height=1, 8-bit RGBA)
  0x00, 0x00, 0x00, 0x0D, // chunk length
  0x49, 0x48, 0x44, 0x52, // "IHDR"
  0x00, 0x00, 0x00, 0x01, // width = 1
  0x00, 0x00, 0x00, 0x01, // height = 1
  0x08, // bit depth
  0x06, // color type (RGBA)
  0x00, // compression
  0x00, // filter
  0x00, // interlace
  0x1F, 0x15, 0xC4, 0x89, // CRC
  
  // IDAT chunk (minimal data)
  0x00, 0x00, 0x00, 0x0C, // chunk length
  0x49, 0x44, 0x41, 0x54, // "IDAT"
  0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x1B, 0xB6, 0xEE, 0x56,
  
  // IEND chunk
  0x00, 0x00, 0x00, 0x00, // chunk length
  0x49, 0x45, 0x4E, 0x44, // "IEND"
  0xAE, 0x42, 0x60, 0x82  // CRC
]);

const iconsDir = 'c:/Vukixxx/src-tauri/icons';

const iconFiles = [
  'icon.png',
  '32x32.png',
  '128x128.png',
  '128x128@2x.png',
  'icon.ico'  // Use PNG for .ico as well (modern Windows supports this)
];

try {
  iconFiles.forEach(filename => {
    const filePath = path.join(iconsDir, filename);
    fs.writeFileSync(filePath, minimalPNG);
    console.log(`Created: ${filePath}`);
  });
  console.log('\nAll icon files created successfully!');
} catch (error) {
  console.error('Error creating icon files:', error.message);
  process.exit(1);
}
