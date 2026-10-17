import {projectPoint} from '../js/geometry.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../js/lessons.js';
import {Viewport,isValidScene} from '../js/viewport.js';
import {Progress} from '../js/progress.js';
import {initializeStep,stepKey,captureStart,sanitizeStarts} from '../js/exercise-state.js';
import {createApp,Element,emit} from './app-fixture.js';
function seedAt(lesson,step,{legacy=false}={}){
 return ()=>{const view=new Viewport(new Element('seed')),starts={};
 if(!legacy){if(step>0)starts[stepKey(lesson,step-1)]=initializeStep(view,lesson,step-1);else if(lesson>0)starts[stepKey(lesson-1,lessons[lesson-1].steps.length-1)]=initializeStep(view,lesson-1,lessons[lesson-1].steps.length-1);}
 const current=initializeStep(view,lesson,step);if(!legacy)starts[stepKey(lesson,step)]=captureStart(view);
 return {lesson,step,completed:Array.from({length:lesson},(_,i)=>i),finished:false,...current,...(legacy?{}:{starts})};
 };
}
test('Previous Step restores every exercise start and allows full-course replay without duplicate credit',async()=>{
 const app=await createApp();try{
 const {elements:e}=app;assert.equal(e['previous-step'].disabled,true);
 for(let l=0;l<lessons.length;l++)for(let i=0;i<lessons[l].steps.length;i++){
 const before=app.saved();assert.equal(before.lesson,l);assert.equal(before.step,i);const start=before.starts[stepKey(l,i)];assert.ok(start);const s=app.complete();assert.match(e.feedback.textContent,/Ready|Shortcut Deck/);const completed=app.saved(),credit=[...completed.bestSteps];
 e.hint.onclick();e['previous-step'].onclick();const restored=app.saved();assert.equal(restored.lesson,l,s.id);assert.equal(restored.step,i,s.id);assert.deepEqual(restored.scene,start.scene,s.id);assert.deepEqual(restored.history,start.history,s.id);assert.deepEqual(restored.future,start.future,s.id);assert.deepEqual(restored.completed,completed.completed);assert.deepEqual(restored.bestSteps,credit);assert.equal(restored.finished,false);assert.equal(e.mission.textContent,s.mission);assert.equal(e['hint-text'].textContent,'');assert.equal(e['search-panel'].hidden,true);assert.equal(e['delete-panel'].hidden,true);assert.equal(document.activeElement,e.practice);
 app.complete();assert.deepEqual(app.saved().bestSteps,credit);assert.equal(new Set(app.saved().completed).size,app.saved().completed.length);assert.ok(isValidScene(app.saved().scene));
 }
 assert.equal(app.saved().finished,true);assert.match(e['progress-label'].textContent,/100%/);
 }finally{app.close();}
});
test('Previous Step cancels active transforms, incomplete commands, overlays and pointer capture',async()=>{
 for(const [lesson,step] of [[1,1],[2,1],[3,6],[4,3],[5,7]]){
 const app=await createApp(seedAt(lesson,step));try{
 const {elements:e}=app,s=lessons[lesson].steps[step],target=app.saved().starts[stepKey(lesson,step-1)];e.practice.focus();app.key(s.keys[0]);emit(e.practice,'pointermove',{target:e.canvas,clientX:100,clientY:100});emit(e.practice,'pointermove',{target:e.canvas,clientX:140,clientY:90});e.hint.onclick();e['previous-step'].onclick();assert.deepEqual(app.saved().scene,target.scene);assert.equal(e['hint-text'].textContent,'');assert.equal(document.activeElement,e.practice);app.complete();assert.equal(app.saved().step,step,'restored keyboard sequence completes normally');
 }finally{app.close();}
 }
 for(const step of [4,8]){const app=await createApp(seedAt(4,step));try{const e=app.elements;e.practice.focus();app.key(step===4?'X':'F3');assert.equal(e[step===4?'delete-panel':'search-panel'].hidden,false);e['previous-step'].onclick();assert.equal(e['delete-panel'].hidden,true);assert.equal(e['search-panel'].hidden,true);app.advance();assert.equal(app.saved().step,step-1,'no stale advance after overlay cleanup');app.complete();assert.equal(app.saved().step,step);}finally{app.close();}}
 const app=await createApp(seedAt(0,1));try{const e=app.elements;e.practice.focus();emit(e.practice,'pointerdown',{target:e.canvas,button:1,clientX:100,clientY:100,pointerId:7});emit(e.practice,'pointermove',{target:e.canvas,clientX:105,clientY:105});assert.equal(e.canvas.captured,7);e['previous-step'].onclick();assert.equal(e.canvas.captured,null);assert.equal(app.saved().step,0);assert.equal(e['previous-step'].disabled,true);}finally{app.close();}
});
test('backward navigation survives reload and completed lessons remain unlocked',async()=>{
 let data;const app=await createApp(seedAt(5,7));try{app.elements['previous-step'].onclick();data=app.saved();assert.equal(data.step,6);assert.equal(data.scene.objects.length,1);assert.ok(data.scene.objects[0].mesh);assert.ok(app.elements['lesson-nav'].children.slice(0,5).every(b=>!b.disabled));}finally{app.close();}
 const reload=await createApp(data);try{assert.equal(reload.elements.mission.textContent,lessons[5].steps[6].mission);assert.deepEqual(reload.saved().scene,data.scene);reload.complete();assert.equal(reload.saved().step,7);assert.equal(reload.saved().scene.objects.length,2);assert.deepEqual(reload.saved().scene.objects[0].mesh,reload.saved().scene.objects[1].mesh);}finally{reload.close();}
});
test('legacy saves initialize valid prerequisite states for every previous exercise',async()=>{
 for(const [lesson,step,targetLesson,targetStep] of [[3,6,3,5],[4,4,4,3],[4,5,4,4],[4,6,4,5],[4,7,4,6],[5,0,4,8],[5,5,5,4]]){
 const app=await createApp(seedAt(lesson,step,{legacy:true}));try{const e=app.elements;e['previous-step'].onclick();const d=app.saved();assert.equal(d.lesson,targetLesson);assert.equal(d.step,targetStep);assert.ok(isValidScene(d.scene));assert.equal(e.mission.textContent,lessons[targetLesson].steps[targetStep].mission);if(targetStep===4&&targetLesson===4)assert.equal(d.scene.objects.length,2);if(targetStep===5&&targetLesson===3)assert.equal(d.scene.mode,'edit');app.complete();assert.match(e.feedback.textContent,/Ready/);}finally{app.close();}
 }
});
test('snapshot validation drops malformed entries while preserving progress and valid starts',async()=>{
 const app=await createApp(seedAt(3,6));try{const d=app.saved(),key=stepKey(3,5),good=d.starts[key];d.starts['999:999']=good;d.starts['0:0']={scene:{bad:true},history:[],future:[]};const clean=sanitizeStarts(d.starts);assert.ok(clean[key]);assert.equal(clean['999:999'],undefined);assert.equal(clean['0:0'],undefined);const p=new Progress({getItem:()=>JSON.stringify(d),setItem(){}});assert.equal(p.data.lesson,3);assert.equal(p.data.step,6);assert.deepEqual(p.data.starts[key],good);}finally{app.close();}
});
test('angular Rotate completes with Enter or left-click and cancels with Esc or right-click',async()=>{
 for(const close of ['Enter','left-click','Esc','right-click']){const app=await createApp(seedAt(1,1));try{const e=app.elements;e.practice.focus();const before=app.saved();app.key('R');const o=before.scene.objects[0],[x,y]=projectPoint([o.x,o.y,o.z],before.scene,720,345);emit(e.practice,'pointermove',{target:e.canvas,clientX:x+70,clientY:y});emit(e.practice,'pointermove',{target:e.canvas,clientX:x+60,clientY:y+35});
 if(close.includes('click'))emit(e.practice,'pointerdown',{target:e.canvas,button:close==='left-click'?0:2});else app.key(close);
 if(['Enter','left-click'].includes(close)){assert.equal(app.saved().step,2);assert.ok(app.saved().scene.objects[0].rotation);app.advance();assert.equal(e.mission.textContent,lessons[1].steps[2].mission);}else{assert.equal(app.saved().step,1);assert.deepEqual(app.saved().scene,before.scene);assert.match(e.feedback.textContent,/Cancelled/);app.complete();assert.equal(app.saved().step,2);}
 }finally{app.close();}}
});
