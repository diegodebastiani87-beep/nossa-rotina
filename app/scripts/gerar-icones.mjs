// Gera os PNGs do app a partir de public/icon.svg (rode: npm run icones)
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const arq = n => fileURLToPath(new URL('../public/' + n, import.meta.url));

const svg = await readFile(new URL('../public/icon.svg', import.meta.url));
for (const s of [192, 512]) await sharp(svg, { density: 384 }).resize(s, s).png().toFile(arq(`icon-${s}.png`));

// versão "maskable": o Android recorta em círculo/quadrado, então a casa fica com margem de segurança
const fundo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#8b3cf0"/></linearGradient></defs><rect width="512" height="512" fill="url(#g)"/><g transform="translate(76.8 76.8) scale(.7)"><path d="M256 108 L414 236 H378 V372 Q378 400 350 400 H162 Q134 400 134 372 V236 H98 Z" fill="#fff" stroke="#fff" stroke-width="28" stroke-linejoin="round"/><path d="M190 312 L238 358 L328 262" fill="none" stroke="#4f46e5" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
await sharp(Buffer.from(fundo)).resize(512, 512).png().toFile(arq('icon-maskable-512.png'));
console.log('ícones gerados');
