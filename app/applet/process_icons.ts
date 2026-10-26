import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const inputPath = path.join(process.cwd(), 'public/assets/aistudio/image_da08b7cf.png');
  if (!fs.existsSync(inputPath)) {
    console.error('Input image not found:', inputPath);
    return;
  }

  const img = await loadImage(inputPath);
  
  const sizes = [180, 192, 512];

  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Fill solid warm peach background #FFB86A to eliminate transparent checkerboard/white box
    ctx.fillStyle = '#FFB86A';
    ctx.fillRect(0, 0, size, size);

    ctx.drawImage(img, 0, 0, size, size);

    const buffer = canvas.toBuffer('image/png');
    
    let filename = `icon-${size}.png`;
    if (size === 180) filename = 'apple-touch-icon.png';
    if (size === 192) filename = 'icon-192.png';
    if (size === 512) filename = 'icon-512.png';

    const outPath = path.join(process.cwd(), 'public', filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved solid background icon: ${outPath}`);
  }

  // Favicon
  const favCanvas = createCanvas(64, 64);
  const favCtx = favCanvas.getContext('2d');
  favCtx.fillStyle = '#FFB86A';
  favCtx.fillRect(0, 0, 64, 64);
  favCtx.drawImage(img, 0, 0, 64, 64);
  fs.writeFileSync(path.join(process.cwd(), 'public/favicon.png'), favCanvas.toBuffer('image/png'));
  console.log('Saved favicon.png');
}

run().catch(console.error);
