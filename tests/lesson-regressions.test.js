import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp,emit} from './app-fixture.js';
import {Viewport} from '../js/viewport.js';
import {initializeStep} from '../js/exercise-state.js';
import {camera,dot,axisQuaternion,objectQuaternion,multiplyQuaternion} from '../js/geometry.js';
function view(){globalThis.ResizeObserver=class{observe(){}};globalThis.window={devicePixelRatio:1};return new Viewport({clientWidth:720,clientHeight:345,getContext:()=>new Proxy({},{get:()=>()=>{},set:()=>true})});}
function seed(lesson,step){const savedWindow=globalThis.window,v=view();initializeStep(v,lesson,step);globalThis.window=savedWindow;return {lesson,step,completed:Array.from({length:lesson},(_,i)=>i),scene:v.state,history:v.history,future:v.future};}
test('free G and both duplicate lessons track diagonal view-plane movement, cancel and undo exactly',()=>{
 for(const [lesson,step] of [[1,0],[1,3],[4,3],[5,6]])for(const yaw of [0,.55,2]){
 const v=view();initializeStep(v,lesson,step);v.state.yaw=yaw;const before=structuredClone(v.state),history=structuredClone(v.history),future=structuredClone(v.future),source=structuredClone(v.active());
 v.begin(step===3&&lesson===4||lesson===5?'duplicate':'move');assert.equal(v.modal.axis,null);const a=v.project([source.x,source.y,source.z]);v.adjustPointer(10,10);v.adjustPointer(55,35);const o=v.active(),b=v.project([o.x,o.y,o.z]);assert.ok(Math.abs(b[0]-a[0]-45)<1e-8);assert.ok(Math.abs(b[1]-a[1]-25)<1e-8);assert.ok(Math.abs(dot(['x','y','z'].map(k=>o[k]-source[k]),camera(before,720,345).toward))<1e-9);
 const preview=structuredClone(v.state);v.adjustPointer(55,35);assert.deepEqual(v.state,preview);v.cancel();assert.deepEqual(v.state,before);assert.deepEqual(v.history,history);assert.deepEqual(v.future,future);
 v.begin('duplicate');v.adjustPointer(10,10);v.adjustPointer(55,35);v.confirm();const after=structuredClone(v.state);assert.equal(after.objects.length,before.objects.length+1);assert.equal(after.objects.filter(o=>o.selected).length,1);v.apply('undo');assert.deepEqual(v.state,before);v.apply('redo');assert.deepEqual(v.state,after);
 }
});
test('R is view aligned before Z, then uses only world Z from the original snapshot',()=>{
 const v=view();initializeStep(v,2,5);const source=structuredClone(v.active());v.begin('rotate');v.adjust(.4);assert.equal(v.modal.axis,null);assert.deepEqual(v.active().rotation,multiplyQuaternion(axisQuaternion(v.modal.rotationAxis,.4),objectQuaternion(source)));v.constrain('z');v.adjust(.7);assert.deepEqual(v.active().rotation,multiplyQuaternion(axisQuaternion([0,0,1],.42),objectQuaternion(source)));
});
test('lesson starts, reload, previous step and restart enforce selection prerequisites',async()=>{
 for(const [lesson,step] of [[3,3],[5,2],[4,0]]){
 const app=await createApp(()=>{const d=seed(lesson,step);d.scene.selection='faces';d.scene.objects[0].selected=true;return d;});try{
 const before=app.saved();if(lesson===4)assert.equal(before.scene.objects[0].selected,false);else assert.notEqual(before.scene.selection,'faces');app.elements.practice.focus();app.key(lesson===4?'A':'3');assert.equal(app.saved().step,step+1);if(lesson===4)assert.equal(app.saved().scene.objects[0].selected,true);else assert.equal(app.saved().scene.selection,'faces');app.advance();app.elements['previous-step'].onclick();if(lesson===4)assert.equal(app.saved().scene.objects[0].selected,false);else assert.notEqual(app.saved().scene.selection,'faces');app.elements['restart-lesson'].onclick();if(lesson===4)assert.equal(app.saved().scene.objects[0].selected,false);
 }finally{app.close();}}
});
test('cancel mission waits for Esc and restores exact scene and history',async()=>{
 const app=await createApp(()=>seed(1,3));try{const before=app.saved();app.elements.practice.focus();app.key('G');emit(app.elements.practice,'pointermove',{target:app.elements.canvas,clientX:10,clientY:10});emit(app.elements.practice,'pointermove',{target:app.elements.canvas,clientX:55,clientY:35});app.key('Enter');assert.equal(app.saved().lesson,1);assert.equal(app.saved().step,3);app.key('Esc');assert.equal(app.saved().lesson,2);app.advance();app.elements['previous-step'].onclick();assert.deepEqual(app.saved().scene,before.scene);assert.deepEqual(app.saved().history,before.history);assert.deepEqual(app.saved().future,before.future);}finally{app.close();}
});
