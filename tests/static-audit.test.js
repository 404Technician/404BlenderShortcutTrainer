import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {lessons} from '../js/lessons.js';
const root=new URL('../',import.meta.url),html=readFileSync(new URL('index.html',root),'utf8'),css=readFileSync(new URL('css/styles.css',root),'utf8');
test('extrude wording and search example instructions are explicit',()=>{
 assert.equal(lessons.flatMap(l=>l.steps).find(s=>s.id==='extrude').mission,'Extrude the top face upward.');
 assert.doesNotMatch(JSON.stringify(lessons),/Pull the top face upward\./);
 assert.match(html,/This is Blender's Search Menu!/);assert.match(html,/Simulated example/);assert.match(html,/You can search for Blender commands here\./);assert.match(html,/Press Esc or close this example to continue\./);
 assert.ok(html.indexOf('id="search-close-help"')<html.indexOf('id="command-search"'),'closing guidance precedes the search field');
});
test('trainer name is consistent without renaming paths or the persistence key',()=>{assert.match(html,/<title>Tavi's Blender Shortcut Trainer<\/title>/);assert.match(html,/<h1>Tavi's Blender/);assert.match(html,/Shortcut Trainer<\/em>/);assert.doesNotMatch(html,/Academy|ACADEMY/);assert.doesNotMatch(readFileSync(new URL('README.md',root),'utf8'),/Shortcut Academy/);});
test('HTML assets and module imports resolve under a repository subpath',()=>{
 for(const [,path]of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))assert.ok(existsSync(new URL(path,root)),path);
 for(const file of readdirSync(new URL('js/',root)).filter(f=>f.endsWith('.js'))){const url=new URL(`js/${file}`,root),src=readFileSync(url,'utf8');for(const [,path]of src.matchAll(/from ['"]([^'"]+)['"]/g))assert.ok(existsSync(new URL(path,url)),`${file}: ${path}`);}
 for(const pose of ['welcome','teaching','thinking','sitting','celebrating'])assert.ok(existsSync(new URL(`assets/tavi/tavi-${pose}.webp`,root)));
});
test('accessibility and responsive safeguards remain present',()=>{assert.match(html,/<html lang="en"/);assert.match(html,/aria-live="polite"/);assert.match(html,/rel="noopener noreferrer"/);assert.match(css,/focus-visible/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/@media\(max-width:950px\)/);assert.match(css,/@media\(max-width:700px\)/);assert.match(css,/\.mobile-note\{display:block/);assert.match(css,/max-height:calc\(100% - 90px\)/);});
test('Previous Step uses an accessible disabled native button and existing wrapping controls',()=>{assert.match(html,/<button id="previous-step" class="secondary" aria-label="Previous Step" disabled>/);assert.match(html,/aria-hidden="true">←<\/span> Previous Step/);assert.match(css,/\.instructor-actions\{display:flex;flex-wrap:wrap/);});
test('primary text and button colors meet a 4.5:1 contrast ratio',()=>{
 const luminance=hex=>{const a=hex.match(/\w\w/g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
 const colors=Object.fromEntries([...css.matchAll(/--(ink|purple|muted):#([0-9a-f]{6})/g)].map(([,key,value])=>[key,value]));
 for(const [fg,bg]of [[colors.ink,'faf8fd'],[colors.muted,'f7f3fc'],['ffffff',colors.purple],[colors.purple,'ffffff']]){const a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(ratio>=4.5,`${fg} on ${bg}: ${ratio}`);}
});
