import { test, expect } from '@playwright/test';
for (const [name, width, height] of [['mobile',390,844],['desktop',1280,900],['tv',1920,1080]] as const) {
  test(name + ': session, persistence and offline photos', async ({page, context}) => {
    await page.setViewportSize({width,height});
    await page.goto(name === 'tv' ? '/?tv=1' : '/');
    await page.getByRole('button',{name:/Nuevo perfil/}).click();
    await page.getByPlaceholder('Nombre').fill('Prueba');
    await page.getByRole('button',{name:'Comenzar aventura'}).click();
    await page.getByRole('button',{name:/Leer Lee y descubre/}).click();
    await page.getByRole('button',{name:/Todos mezclados/}).click();
    await page.getByRole('button',{name:/La leyó/}).click();
    await expect(page.getByText('¡Descubierta!',{exact:true})).toBeVisible();
    await page.evaluate(async () => {await navigator.serviceWorker.ready;});
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('button',{name:/Continuar sesión/})).toBeVisible();
    const photos = await page.evaluate(async () => Promise.all([
      '/content/photos/naturaleza/mar.webp','/content/photos/casa/plato.webp','/content/photos/casa/vaso.webp'
    ].map(async url => {const r = await fetch(url);return r.ok && (await r.blob()).size > 100;})));
    expect(photos).toEqual([true,true,true]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test('remote arrows, Enter, Back and input caret', async ({page}) => {
  await page.goto('/?tv=1');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('button',{name:/Nuevo perfil/})).toBeFocused();
  await page.keyboard.press('Enter');
  const input = page.getByPlaceholder('Nombre');
  await expect(input).toBeFocused();
  await input.fill('Luna');
  await page.keyboard.press('ArrowLeft');
  await expect(input).toBeFocused();
  expect(await input.evaluate((el:HTMLInputElement) => el.selectionStart)).toBe(3);
  await page.keyboard.press('ArrowDown');
  await expect(input).not.toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:/Nuevo perfil/})).toBeVisible();
});
