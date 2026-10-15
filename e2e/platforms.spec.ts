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

for (const [name,width,height] of [['mobile',390,844],['tv',1920,1080]] as const) {
  test(name+': original stories, comprehension, back and offline access',async ({page,context},testInfo)=>{
    await page.setViewportSize({width,height});
    await page.goto(name==='tv'?'/?tv=1':'/');
    await page.getByRole('button',{name:/Nuevo perfil/}).click();
    await page.getByPlaceholder('Nombre').fill('Lector');
    await page.getByRole('button',{name:'Comenzar aventura'}).click();
    await page.getByRole('button',{name:/Historias Lee/}).click();
    await expect(page.getByRole('heading',{name:'Historias para crecer'})).toBeVisible();
    await expect(page.getByRole('button',{name:/La semilla de Lina/})).toBeDisabled();
    await page.getByRole('button',{name:/Lola y la sopa/}).click();
    await expect(page.getByRole('article',{name:'Texto de la historia'})).toContainText('Lola toma sopa.');
    await page.getByRole('button',{name:'Letra más grande'}).click();
    await page.screenshot({path:testInfo.outputPath('historias-'+name+'.png'),fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole('button',{name:'Página siguiente'}).click();
    await page.getByRole('button',{name:'Página siguiente'}).click();
    await page.getByRole('button',{name:'Pensar sobre la historia'}).click();
    await page.getByRole('button',{name:'Una mesa',exact:true}).click();
    await expect(page.getByText('Puedes volver al texto y probar otra respuesta.',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Sopa',exact:true}).click();
    await expect(page.getByText(/¡Lo encontraste! Lola le da sopa/)).toBeVisible();
    await page.getByRole('button',{name:'Comparte la sopa',exact:true}).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading',{name:'Historias para crecer'})).toBeVisible();
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
    await context.setOffline(true);
    await page.reload();
    await page.getByRole('button',{name:/Historias Lee/}).click();
    await page.getByRole('button',{name:/Pepa y la mesa/}).click();
    await expect(page.getByRole('article',{name:'Texto de la historia'})).toContainText('Pepa ve la mesa.');
  });
}

for(const width of [390,1280]){
  test('photo has a centered circular frame without cropping at width '+width,async({page},testInfo)=>{
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await page.getByRole('button',{name:/Nuevo perfil/}).click();
    await page.getByPlaceholder('Nombre').fill('Fotos');
    await page.getByRole('button',{name:'Comenzar aventura'}).click();
    await page.getByRole('button',{name:/Leer Lee y descubre/}).click();
    await page.getByRole('button',{name:/Todos mezclados/}).click();
    let found=false;
    for(let card=0;card<10;card++){
      await page.getByRole('button',{name:/La leyó/}).click();
      const frame=page.locator('.card-visual-circular');
      if(await frame.count()){
        const img=frame.locator('img');
        await img.evaluate((el:HTMLImageElement)=>el.decode());
        await frame.evaluate(async el=>{await Promise.all(el.parentElement!.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>undefined)));});
        const geometry=await frame.evaluate(el=>{
          const image=el.querySelector('img')!;
          const f=el.getBoundingClientRect(),i=image.getBoundingClientRect();
          return {width:f.width,height:f.height,dx:Math.abs((i.x+i.width/2)-(f.x+f.width/2)),dy:Math.abs((i.y+i.height/2)-(f.y+f.height/2)),corner:Math.hypot(i.width/2,i.height/2),radius:f.width/2,fit:getComputedStyle(image).objectFit,ratio:i.width/i.height,natural:image.naturalWidth/image.naturalHeight};
        });
        expect(geometry.width).toBeGreaterThan(100);
        expect(geometry.width).toBeCloseTo(geometry.height,0);
        expect(geometry.dx).toBeLessThan(1);
        expect(geometry.dy).toBeLessThan(1);
        expect(geometry.corner).toBeLessThan(geometry.radius);
        expect(geometry.fit).toBe('contain');
        expect(geometry.ratio).toBeCloseTo(geometry.natural,2);
        await page.screenshot({path:testInfo.outputPath('foto-circular-'+width+'.png'),fullPage:true,animations:'disabled'});
        found=true;break;
      }
      await expect(page.locator('.card-visual-emoji')).not.toHaveClass(/card-visual-circular/);
      await page.getByRole('button',{name:'Siguiente',exact:true}).click();
    }
    expect(found).toBe(true);
  });
}
