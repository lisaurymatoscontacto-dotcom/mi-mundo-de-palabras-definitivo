import { cp, mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import './native-icons.mjs';
import { packager } from '@electron/packager';

const platform = process.argv[2] || process.platform;
const arch = process.argv[3] || process.arch;
if (!['win32', 'darwin', 'linux'].includes(platform) || !['x64', 'arm64'].includes(arch)) {
  throw new Error('Supported targets: win32/darwin/linux and x64/arm64');
}
const stage = resolve('build/desktop-stage');
await mkdir(stage, { recursive: true });
await cp('desktop', stage, { recursive: true });
await cp('apps/web/dist', resolve(stage, 'web'), { recursive: true });
await cp('INSTALLATION.md', resolve(stage, 'INSTALLATION.md'));
await cp('THIRD_PARTY_ASSETS.md', resolve(stage, 'THIRD_PARTY_ASSETS.md'));
const electron = JSON.parse(await readFile('node_modules/electron/package.json', 'utf8'));
const result = await packager({
  dir: stage, out: resolve('build/packages'), name: 'Mi Mundo de Palabras',
  executableName: 'mi-mundo-de-palabras', platform, arch,
  icon: platform === 'win32' ? resolve('build/icons/app.ico') : platform === 'darwin' ? resolve('build/icons/app.icns') : resolve('apps/web/public/icon-512.png'),
  electronVersion: electron.version, overwrite: true, asar: true,
  appBundleId: 'com.keygenrd.mimundodepalabras.desktop',
});
console.log(result.join('\n'));
