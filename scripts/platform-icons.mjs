import sharp from 'sharp';
for (const size of [192, 512]) {
  await sharp('apps/web/public/icon.svg').resize(size, size).png().toFile(`apps/web/public/icon-${size}.png`);
}
await sharp('apps/web/public/icon.svg').resize(180, 180).png().toFile('apps/web/public/apple-touch-icon.png');
