import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp,emit} from './app-fixture.js';
import {Viewport} from '../js/viewport.js';
import {initializeStep} from '../js/exercise-state.js';
test('both Shift+D exercises create one copy, wait for confirmation and restore via undo/redo',async()=>{
 for(const [lesson,step] of [[4,3],[5,6]]){
 const app=await createApp(()=>{const old=globalThis.window;const v=new Viewport(document.getElementById('canvas'));initializeStep(v,lesson,step);globalThis.window=old;return {lesson,step,completed:Array.from({length:lesson},(_,i)=>i),scene:v.state,history:v.history,future:v.future};});
 try{const e=app.elements,before=app.saved();e.practice.focus();app.key('Shift + D');for(const [x,y] of [[10,10],[40,25],[70,45],[70,45]])emit(e.practice,'pointermove',{target:e.canvas,clientX:x,clientY:y});assert.equal(app.saved().step,step);app.key('Enter');const after=app.saved();assert.equal(after.step,step+1);assert.equal(after.scene.objects.length,before.scene.objects.length+1);assert.deepEqual({...after.scene.objects[0],selected:true},before.scene.objects[0]);assert.equal(after.scene.objects.filter(o=>o.selected).length,1);assert.equal(after.scene.active,after.scene.objects.length-1);assert.notEqual(after.scene.objects.at(-1).z,before.scene.objects[0].z);assert.deepEqual(after.history.at(-1),before.scene);assert.equal(after.history.length,before.history.length+1);app.advance();e['previous-step'].onclick();assert.deepEqual(app.saved().scene,before.scene);}finally{app.close();}
 }
});
