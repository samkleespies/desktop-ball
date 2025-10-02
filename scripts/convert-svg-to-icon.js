const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'assets', 'red-ball.svg');
const outputPath = path.join(__dirname, '..', 'assets', 'icon-512.png');

sharp(inputPath)
  .resize(512, 512)
  .png()
  .toFile(outputPath)
  .then(() => console.log('Created 512x512 icon from SVG'))
  .catch(err => console.error('Error:', err));
