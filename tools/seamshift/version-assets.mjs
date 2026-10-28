import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const directory=resolve(root,'assets/seamshift'),html=resolve(root,'seamshift/index.html');
const files=()=>[...readdirSync(directory).filter(name=>/\.(js|css|svg)$/.test(name)).sort().map(name=>resolve(directory,name)),html];
const normalize=source=>source.replace(/\?v=[a-f0-9]{12}/g,'');
export function assetVersion() {
 const hash=createHash('sha256');
 for(const file of files())hash.update(file.slice(root.length)).update('\0').update(normalize(readFileSync(file,'utf8'))).update('\0');
 return hash.digest('hex').slice(0,12);
}
export function stampAssets() {
 const version=assetVersion();
 for(const file of files()) {
  const before=readFileSync(file,'utf8');let after=before;
  if(file.endsWith('.js'))after=after.replace(/(['"])(\.\/[^'"?]+\.js)(?:\?v=[a-f0-9]{12})?\1/g,(_,quote,path)=>`${quote}${path}?v=${version}${quote}`);
  if(file===html)after=after.replace(/((?:src|href)="\.\.\/assets\/seamshift\/[^"?]+)(?:\?v=[a-f0-9]{12})?"/g,(_,path)=>`${path}?v=${version}"`);
  if(after!==before)writeFileSync(file,after);
 }
 return version;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log('Asset release:',stampAssets());
