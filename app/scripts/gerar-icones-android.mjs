// Gera os ícones do APK (pasta android/) a partir dos ícones do app (rode: node scripts/gerar-icones-android.mjs)
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const pub = n => fileURLToPath(new URL('../public/' + n, import.meta.url));
const res = n => fileURLToPath(new URL('../../android/app/src/main/res/' + n, import.meta.url));
const DENS = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, f] of Object.entries(DENS)) {
  await mkdir(res(`mipmap-${d}`), { recursive: true });
  // ícone antigo (Android 7 ou menor): 48dp
  await sharp(pub('icon-512.png')).resize(Math.round(48 * f), Math.round(48 * f)).png().toFile(res(`mipmap-${d}/ic_launcher.png`));
  // ícone adaptável (Android 8+): camada da frente com 108dp, já com margem de segurança
  await sharp(pub('icon-maskable-512.png')).resize(Math.round(108 * f), Math.round(108 * f)).png().toFile(res(`mipmap-${d}/ic_launcher_foreground.png`));
}
console.log('ícones do Android gerados');
