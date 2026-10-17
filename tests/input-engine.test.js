import test from 'node:test';
import assert from 'node:assert/strict';
import {InputEngine,normalizeKey} from '../js/input-engine.js';
import {Progress} from '../js/progress.js';
import {lessons} from '../js/lessons.js';
import {initialScene} from '../js/viewport.js';
test('modifier combinations are simultaneous and exact',()=>{
 const e=new InputEngine();e.reset(['Shift + D']);assert.equal(e.feed('d').status,'wrong');assert.equal(e.feed(normalizeKey({key:'D',shiftKey:true})).status,'matched');
 assert.equal(normalizeKey({key:'z',ctrlKey:true,shiftKey:true}),'ctrl + shift + z');assert.equal(normalizeKey({key:'Control'}),null);assert.equal(normalizeKey({key:'s',metaKey:true}),'ctrl + s');
});
test('axis sequences cannot be replaced by combinations',()=>{const e=new InputEngine();e.reset(['G','Z']);assert.equal(e.feed('g + z').status,'wrong');assert.equal(e.feed('g',100).status,'partial');assert.equal(e.feed('x',200).status,'wrong');assert.equal(e.feed('z',300).status,'matched');});
test('numeric command requires every step including confirmation',()=>{const e=new InputEngine();e.reset(['G','Z','2','Enter']);assert.equal(e.feed('enter').status,'wrong');for(const k of ['g','z','2'])assert.equal(e.feed(k).status,'partial');assert.equal(e.feed('enter').status,'matched');});
test('incomplete sequences time out and reset',()=>{const e=new InputEngine();e.reset(['g','x']);e.feed('g',1);assert.equal(e.feed('x',16002).status,'timeout');assert.equal(e.index,0);assert.equal(e.feed('g',16003).status,'partial');e.reset(['r']);assert.equal(e.feed('r').status,'matched');});
test('progress persists, reloads and restarts',()=>{const store=new Map();const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};const p=new Progress(storage);p.data.lesson=3;p.data.step=2;p.data.completed=[0,1,2];p.save();const restored=new Progress(storage);assert.equal(restored.data.lesson,3);assert.deepEqual(restored.data.completed,[0,1,2]);restored.reset();assert.equal(new Progress(storage).data.lesson,0);assert.deepEqual(new Progress(storage).data.completed,[]);});
test('blocked and corrupt storage fail gracefully',()=>{assert.equal(new Progress({getItem(){throw Error();}}).available,false);assert.equal(new Progress({getItem:()=>'{oops'}).data.lesson,0);});
test('every lesson command accepts only its ordered tokens',()=>{for(const lesson of lessons)for(const step of lesson.steps){const e=new InputEngine();e.reset(step.keys);for(let i=0;i<step.keys.length;i++)assert.equal(e.feed(step.keys[i]).status,i===step.keys.length-1?'matched':'partial',step.id);}});
test('final challenge contains face selection before extrude',()=>{const actions=lessons[5].steps.map(s=>s.action);assert.ok(actions.indexOf('top')<actions.indexOf('extrude'));assert.ok(lessons[1].steps.filter(s=>['move','rotate','scale'].includes(s.action)).every(s=>s.modal));});
test('corrupt JSON does not falsely report unavailable storage',()=>{const p=new Progress({getItem:()=>'{bad',setItem(){}});assert.equal(p.available,true);assert.equal(p.recovered,true);p.save();assert.equal(p.available,true);});
test('malformed scenes, histories and progress are recovered safely',()=>{
 const data={lesson:3,step:4,completed:[0,1,2],scene:initialScene(),history:[initialScene()],future:[],finished:false};
 let p=new Progress({getItem:()=>JSON.stringify(data)});assert.equal(p.data.step,4);assert.deepEqual(p.data.scene,data.scene);
 data.scene.objects=[null];p=new Progress({getItem:()=>JSON.stringify(data)});assert.equal(p.data.step,0);assert.equal(p.recovered,true);assert.deepEqual(p.data.completed,[0,1,2]);
 data.scene=initialScene();data.history=[null];p=new Progress({getItem:()=>JSON.stringify(data)});assert.deepEqual(p.data.history,[]);
 data.completed=[0,2];data.finished='yes';p=new Progress({getItem:()=>JSON.stringify(data)});assert.equal(p.data.lesson,1);assert.deepEqual(p.data.completed,[0]);assert.equal(p.data.finished,false);
 data.lesson=1;data.completed=[0];data.step=999;p=new Progress({getItem:()=>JSON.stringify(data)});assert.equal(p.data.step,0);
});
test('completed commands do not time out while adjusting a modal operation',()=>{const e=new InputEngine();e.reset(['g']);e.feed('g',1);assert.equal(e.feed('r',20000).status,'wrong');assert.equal(e.index,1);});
