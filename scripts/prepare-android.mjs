import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
let manifest = await readFile(manifestPath, 'utf8');
if (!manifest.includes('android.software.leanback')) {
  manifest = manifest.replace('<application', `
    <uses-feature android:name="android.software.leanback" android:required="false" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <application android:banner="@drawable/tv_banner"`);
  manifest = manifest.replace('<category android:name="android.intent.category.LAUNCHER" />',
    '<category android:name="android.intent.category.LAUNCHER" />\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />');
}
await writeFile(manifestPath, manifest);
const drawable = 'android/app/src/main/res/drawable-xhdpi';
await mkdir(drawable, { recursive: true });
const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
  <rect width="320" height="180" rx="18" fill="#6c63ff"/>
  <path d="M24 40Q55 28 80 45Q105 28 136 40V126Q105 114 80 131Q55 114 24 126Z" fill="white"/>
  <path d="M80 45V131" stroke="#cbc7ff" stroke-width="4"/>
  <g fill="white" font-family="sans-serif" font-weight="bold" font-size="23">
    <text x="151" y="66">Mi Mundo</text><text x="151" y="98">de</text><text x="151" y="130">Palabras</text>
  </g></svg>`;
await sharp(Buffer.from(banner)).png().toFile(`${drawable}/tv_banner.png`);
for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
  const folder = `android/app/src/main/res/mipmap-${density}`;
  await mkdir(folder, { recursive: true });
  for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
    await sharp('apps/web/public/icon.svg').resize(size, size).png().toFile(`${folder}/${name}.png`);
  }
}
const javaDir = 'android/app/src/main/java/com/keygenrd/mimundodepalabras';
await mkdir(javaDir, { recursive: true });
await writeFile(`${javaDir}/MainActivity.java`, `package com.keygenrd.mimundodepalabras;

import android.app.UiModeManager;
import android.content.res.Configuration;
import android.os.Bundle;
import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        UiModeManager mode = (UiModeManager) getSystemService(UI_MODE_SERVICE);
        if (mode != null && mode.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION) {
            getBridge().getWebView().getSettings().setUserAgentString(
                getBridge().getWebView().getSettings().getUserAgentString() + " MMDP-TV");
        }
    }

    @Override public boolean onKeyDown(int code, KeyEvent event) {
        if (code == KeyEvent.KEYCODE_BACK && getBridge().getWebView().canGoBack()) {
            getBridge().getWebView().goBack();
            return true;
        }
        return super.onKeyDown(code, event);
    }
}
`);
console.log('Android mobile + Android/Google TV manifest, banner and launcher icons prepared.');
