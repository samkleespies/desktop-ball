const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'assets', 'icon.png');
const outputPath = path.join(__dirname, '..', 'assets', 'icon-512.png');

sharp(inputPath)
  .resize(512, 512, {
    kernel: sharp.kernel.lanczos3,
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .toFile(outputPath)
  .then(() => console.log('Created 512x512 icon'))
  .catch(err => console.error('Error:', err));
