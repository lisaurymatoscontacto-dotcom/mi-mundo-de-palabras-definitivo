const path = require('node:path');

function localAsset(root, address) {
  const url = new URL(address);
  if (url.protocol !== 'mmdp:' || url.hostname !== 'app') throw new Error('Invalid origin');
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.includes('\\') || pathname.includes('\0')) throw new Error('Invalid path');
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(path.resolve(root) + path.sep)) throw new Error('Outside app');
  return file;
}
module.exports = { localAsset };
