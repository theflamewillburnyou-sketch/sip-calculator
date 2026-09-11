import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logoPath = path.join(root, 'public', 'brand-icon.png');
const outPath = path.join(root, 'public', 'og-image.png');
const squarePath = path.join(root, 'public', 'og-square.png');
const touchPath = path.join(root, 'public', 'apple-touch-icon.png');

const logo = PNG.sync.read(fs.readFileSync(logoPath));

function makeCanvas(width, height, bg) {
  const img = new PNG({ width, height });
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = bg[0];
    img.data[i + 1] = bg[1];
    img.data[i + 2] = bg[2];
    img.data[i + 3] = 255;
  }
  return img;
}

function blitCentered(dest, src, maxRatio = 0.62) {
  const maxW = Math.floor(dest.width * maxRatio);
  const maxH = Math.floor(dest.height * maxRatio);
  const scale = Math.min(maxW / src.width, maxH / src.height);
  const tw = Math.max(1, Math.floor(src.width * scale));
  const th = Math.max(1, Math.floor(src.height * scale));
  const ox = Math.floor((dest.width - tw) / 2);
  const oy = Math.floor((dest.height - th) / 2);

  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const sx = Math.min(src.width - 1, Math.floor(x / scale));
      const sy = Math.min(src.height - 1, Math.floor(y / scale));
      const si = (sy * src.width + sx) << 2;
      const a = src.data[si + 3] / 255;
      if (a <= 0.01) continue;
      const di = ((oy + y) * dest.width + (ox + x)) << 2;
      const inv = 1 - a;
      dest.data[di] = Math.round(src.data[si] * a + dest.data[di] * inv);
      dest.data[di + 1] = Math.round(src.data[si + 1] * a + dest.data[di + 1] * inv);
      dest.data[di + 2] = Math.round(src.data[si + 2] * a + dest.data[di + 2] * inv);
      dest.data[di + 3] = 255;
    }
  }
}

// WhatsApp / social square preview — white bg + generous padding
const square = makeCanvas(1200, 1200, [255, 255, 255]);
blitCentered(square, logo, 0.48);
fs.writeFileSync(squarePath, PNG.sync.write(square));

// Large link card 1.91:1
const wide = makeCanvas(1200, 630, [255, 255, 255]);
blitCentered(wide, logo, 0.48);
fs.writeFileSync(outPath, PNG.sync.write(wide));

// Apple touch icon with padding
const touch = makeCanvas(180, 180, [255, 255, 255]);
blitCentered(touch, logo, 0.62);
fs.writeFileSync(touchPath, PNG.sync.write(touch));

console.log('Wrote og-image.png, og-square.png, apple-touch-icon.png');
