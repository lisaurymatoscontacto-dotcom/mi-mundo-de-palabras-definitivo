import { _electron as electron } from '@playwright/test';
import { strict as assert } from 'node:assert';
import { resolve } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
const app = await electron.launch({
  executablePath: resolve(process.argv[2] || 'build/packages/Mi Mundo de Palabras-linux-x64/mi-mundo-de-palabras'), args: ['--user-data-dir=' + await mkdtemp(resolve('build/smoke-profile-'))], env: {...process.env, MMDP_SMOKE: '1'}
});
try {
  const page = await app.firstWindow();
  await page.getByRole('button',{name:/Nuevo perfil/}).waitFor();
  assert.equal(await page.evaluate(() => typeof window.require),'undefined');
  assert.equal(await page.evaluate(async () => (await fetch('/content/photos/casa/plato.webp')).ok),true);
  await page.getByRole('button',{name:/Nuevo perfil/}).click();
  await page.getByPlaceholder('Nombre').fill('Escritorio');
  await page.getByRole('button',{name:'Comenzar aventura'}).click();
  await page.reload();
  await page.getByRole('heading',{name:/Hola, Escritorio/}).waitFor();
  console.log('Packaged app, local media, renderer isolation and persistence passed.');
} finally {await app.close();}
