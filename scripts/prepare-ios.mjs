import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
const folder = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';
const contents = JSON.parse(await readFile(folder+'/Contents.json','utf8'));
for (const image of contents.images) {
  if (!image.filename) continue;
  const pixels = Math.round(parseFloat(image.size || '1024') * parseFloat(image.scale || '1'));
  await sharp('apps/web/public/icon.svg').resize(pixels,pixels).flatten({background:'#6c63ff'}).png().toFile(folder+'/'+image.filename);
}
console.log('iOS app icons prepared');
