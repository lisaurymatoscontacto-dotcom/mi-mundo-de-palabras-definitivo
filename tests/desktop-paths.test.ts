import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const {localAsset} = createRequire(import.meta.url)('../desktop/paths.cjs');
describe('desktop file boundary', () => {
  it('serves local assets', () => {
    expect(localAsset('/app/web','mmdp://app/')).toBe(resolve('/app/web/index.html'));
    expect(localAsset('/app/web','mmdp://app/content/mar.webp')).toBe(resolve('/app/web/content/mar.webp'));
  });
  it.each(['https://app/','mmdp://other/','mmdp://app/..%2f..%2fprivate','mmdp://app/%5cprivate','mmdp://app/%00'])('rejects outside access: %s', url => {
    expect(() => localAsset('/app/web',url)).toThrow();
  });
});
