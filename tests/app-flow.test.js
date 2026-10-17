import {projectPoint,objectMesh,center,transform} from '../js/geometry.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../js/lessons.js';
// A small event/Canvas double checks application wiring without claiming browser rendering QA.
class Element extends EventTarget{
 constructor(id=''){super();this.id=id;this.children=[];this.dataset={};this.hidden=false;this.value='';this.textContent='';this.clientWidth=720;this.clientHeight=345;this.classList={add(){},remove(){}};}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=items;}
 setAttribute(name,value){this[name]=value;}
 contains(el){return el===this||this.children.some(c=>c.contains(el));}
 focus(){const old=document.activeElement;document.activeElement=this;if(old&&old!==this)emit(old,'blur',{relatedTarget:this});emit(this,'focus');}
 scrollIntoView(){}
 getBoundingClientRect(){return {left:0,top:0};}
 setPointerCapture(id){this.captured=id;}
 hasPointerCapture(id){return this.captured===id;}
 releasePointerCapture(id){if(this.captured===id)this.captured=null;}
 getContext(){return new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});}
}
function emit(el,type,props={}){const e=new Event(type,{cancelable:true});for(const [k,v]of Object.entries(props))Object.defineProperty(e,k,{value:v});el.dispatchEvent(e);return e;}
const ids=['canvas','practice','mode','selection-mode','tavi','key-guide','instruction-panel','instruction-shortcut','instructor-intro','lesson-label','lesson-title','dialogue','mission','explanation','hint-text','feedback','exercise-count','operation','navigation-alternative','completion','progress-label','lesson-nav','search-panel','delete-panel','command-search','search-results','close-search','start','exit','confirm-delete','cancel-delete','hint','restart-lesson','previous-step','restart-course','practice-again','nav-demo','deck-filter','deck-list','deck-status'];
test('full course, modal guards, focus, hints, replay and restart',async()=>{
 const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));elements['search-panel'].hidden=true;elements['delete-panel'].hidden=true;elements.practice.append(elements.canvas,elements['search-panel'],elements['delete-panel']);
 const store=new Map();globalThis.document={getElementById:id=>elements[id],createElement:()=>new Element(),querySelectorAll:()=>elements['key-guide'].children.filter(c=>c.dataset.key),activeElement:null};globalThis.window={devicePixelRatio:1,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};globalThis.ResizeObserver=class{observe(){}};globalThis.matchMedia=()=>({matches:true});
 const realTimeout=globalThis.setTimeout,realClear=globalThis.clearTimeout;let timerId=0;const timers=new Map();globalThis.setTimeout=(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;};globalThis.clearTimeout=id=>timers.delete(id);const advance=()=>{for(const[id,t]of [...timers])if(t.ms===750){timers.delete(id);t.fn();}};
 const key=token=>{const parts=token.toLowerCase().split(' + '),k=parts.at(-1);return emit(elements.practice,'keydown',{key:k==='esc'?'Escape':k==='tab'?'Tab':k==='enter'?'Enter':k,shiftKey:parts.includes('shift'),ctrlKey:parts.includes('ctrl'),altKey:parts.includes('alt'),repeat:false});};
 try{
 await import('../js/app.js');assert.equal(elements['lesson-nav'].children[1].disabled,true);elements.start.onclick();assert.equal(document.activeElement,elements.practice);
 // Navigation uses real event deltas, not just an MMB click.
 for(const action of ['orbit','pan']){emit(elements.practice,'pointerdown',{target:elements.canvas,button:1,shiftKey:action==='pan',clientX:100,clientY:100,pointerId:1});emit(elements.practice,'pointermove',{target:elements.canvas,clientX:150,clientY:120});emit(elements.practice,'pointerup',{pointerId:1});assert.equal(elements.canvas.captured,null);assert.match(elements.feedback.textContent,/Nice/);advance();}
 emit(elements.practice,'wheel',{target:elements.canvas,deltaY:-80});advance();assert.equal(elements['lesson-title'].textContent,'Move, Rotate & Scale');
 for(let l=1;l<lessons.length;l++)for(const s of lessons[l].steps){
 assert.equal(elements.mission.textContent,s.mission);
 if(s.id==='final-scale'){elements.hint.onclick();assert.match(elements['hint-text'].textContent,/Think/);elements.hint.onclick();assert.match(elements['hint-text'].textContent,/Press S/);assert.ok(elements['key-guide'].children.some(c=>c.dataset.key==='s'));}
 if(s.action==='top'||s.action==='select'){
 // Pick the projected cube center or top, using the same camera geometry as the scene.
 const data=JSON.parse(store.get('tavi-academy-v1')),o=data.scene.objects[data.scene.active],mesh=objectMesh(o),point=transform(center(mesh.faces[mesh.selectedFace].map(i=>mesh.vertices[i])),o),[px,py]=projectPoint(point,data.scene,720,345);
 emit(elements.practice,'pointerdown',{target:elements.canvas,button:0,clientX:px,clientY:py,pointerId:1});
 }else{
 if(s.id==='move'){key('R');assert.equal(elements.mission.textContent,s.mission);}
 for(const token of s.keys){key(token);if(s.id==='gx'&&token==='G'){key('Enter');assert.match(elements.feedback.textContent,/Finish the axis/);}if(s.id==='delete'&&token==='X'){emit(elements.practice,'pointerdown',{target:elements.canvas,button:2});assert.equal(elements['delete-panel'].hidden,true);key('X');assert.equal(elements['delete-panel'].hidden,false);}}
 if(s.modal&&!s.numeric){if(s.cancel){emit(elements.practice,'pointermove',{target:elements.canvas,clientX:100,clientY:100});emit(elements.practice,'pointermove',{target:elements.canvas,clientX:130,clientY:100});key('Esc');}else{
 key('Enter');assert.match(elements.feedback.textContent,/adjust/);
 if(s.id==='move'){
 for(const close of ['esc','right-click']){emit(elements.practice,'pointermove',{target:elements.canvas,clientX:100,clientY:100});emit(elements.practice,'pointermove',{target:elements.canvas,clientX:140,clientY:90});if(close==='esc')key('Esc');else emit(elements.practice,'pointerdown',{target:elements.canvas,button:2});assert.match(elements.feedback.textContent,/Cancelled/);assert.equal(elements.mission.textContent,s.mission);key('G');}
 }
 if(s.action==='duplicate'){
 emit(elements.practice,'pointermove',{target:elements.canvas,clientX:100,clientY:100});emit(elements.practice,'pointermove',{target:elements.canvas,clientX:140,clientY:95});if(s.id==='final-copy')emit(elements.practice,'pointerdown',{target:elements.canvas,button:2});else key('Esc');assert.match(elements.feedback.textContent,/preview reset/);key('Shift + D');key('Enter');assert.match(elements.feedback.textContent,/adjust/);
 }
 emit(elements.practice,'pointermove',{target:elements.canvas,clientX:100,clientY:100});emit(elements.practice,'pointermove',{target:elements.operation,clientX:900,clientY:900});key('Enter');assert.match(elements.feedback.textContent,/adjust/);
 emit(elements.practice,'pointermove',{target:elements.canvas,clientX:140,clientY:90});emit(elements.practice,'pointermove',{target:elements.canvas,clientX:140,clientY:90});
 if(s.id==='move'){emit(elements.practice,'wheel',{target:elements.canvas,deltaY:-100});assert.match(elements.feedback.textContent,/before zooming/);}
 if(['scale','final-copy'].includes(s.id))emit(elements.practice,'pointerdown',{target:elements.canvas,button:0,clientX:140,clientY:90});else key('Enter');
 }}
 if(s.action==='search'){
 assert.equal(elements['search-panel'].hidden,false);assert.equal(document.activeElement,elements['command-search']);assert.match(elements.feedback.textContent,/example.*Esc.*continue/);
 const checkpoint=store.get('tavi-academy-v1');advance();assert.equal(store.get('tavi-academy-v1'),checkpoint,'open search must not save completion');assert.equal(elements.mission.textContent,s.mission,'open search must not advance');
 elements['command-search'].value='extrude';emit(elements['command-search'],'input');assert.match(elements['search-results'].textContent,/Extrude/);
 // Browser keydown bubbles from either the input or close button to the panel.
 const esc=emit(elements['search-panel'],'keydown',{target:elements['command-search'],key:'Escape'});assert.equal(esc.defaultPrevented,true);assert.equal(elements['search-panel'].hidden,true);assert.equal(document.activeElement,elements.practice);assert.equal(JSON.parse(store.get('tavi-academy-v1')).lesson,5);
 // Reload the unfinished checkpoint, reopen F3, and verify Esc from the button too.
 for(const target of ['close-search','click']){
 timers.clear();store.set('tavi-academy-v1',checkpoint);for(const id of ids)elements[id]=new Element(id);elements['search-panel'].hidden=true;elements['delete-panel'].hidden=true;elements.practice.append(elements.canvas,elements['search-panel'],elements['delete-panel']);document.activeElement=null;
 await import(`../js/app.js?search-reopen-${target}`);elements.start.onclick();key('F3');assert.equal(elements['search-panel'].hidden,false);advance();assert.equal(elements.mission.textContent,s.mission);
 if(target==='click'){elements['close-search'].onclick();const saved=store.get('tavi-academy-v1');elements['close-search'].onclick();assert.equal(store.get('tavi-academy-v1'),saved,'closing twice must not advance twice');}else emit(elements['search-panel'],'keydown',{target:elements[target],key:'Escape'});
 assert.equal(elements['search-panel'].hidden,true);assert.equal(document.activeElement,elements.practice);assert.equal(JSON.parse(store.get('tavi-academy-v1')).lesson,5);
 }
 }
 }
 assert.match(elements.feedback.textContent,/Nice|Good catch/,s.id);
 if(s.id==='move'){
 const moved=JSON.parse(store.get('tavi-academy-v1')).scene.objects[0];assert.notEqual(moved.x,0);assert.notEqual(moved.y,0);assert.ok(Number.isFinite(moved.z));assert.equal(moved.selected,true);
 assert.equal(JSON.parse(store.get('tavi-academy-v1')).step,1,'completed action must save before timer');timers.clear();
 for(const id of ids)elements[id]=new Element(id);elements['search-panel'].hidden=true;elements['delete-panel'].hidden=true;elements.practice.append(elements.canvas,elements['search-panel'],elements['delete-panel']);document.activeElement=null;
 await import('../js/app.js?checkpoint-reload');assert.equal(elements.mission.textContent,lessons[1].steps[1].mission);elements.start.onclick();
 // Replay the introductory Move and confirm with left-click as well as Enter.
 elements['restart-lesson'].onclick();elements.start.onclick();key('G');emit(elements.practice,'pointermove',{target:elements.canvas,clientX:100,clientY:100});emit(elements.practice,'pointermove',{target:elements.canvas,clientX:140,clientY:90});emit(elements.practice,'pointerdown',{target:elements.canvas,button:0});assert.equal(JSON.parse(store.get('tavi-academy-v1')).step,1);advance();assert.equal(elements.mission.textContent,lessons[1].steps[1].mission);
 }else advance();
 }
 assert.equal(elements.completion.hidden,false);assert.equal(JSON.parse(store.get('tavi-academy-v1')).finished,true);assert.match(elements['progress-label'].textContent,/100%/);
 timers.clear();for(const id of ids)elements[id]=new Element(id);elements['search-panel'].hidden=true;elements['delete-panel'].hidden=true;elements.practice.append(elements.canvas,elements['search-panel'],elements['delete-panel']);document.activeElement=null;
 await import('../js/app.js?finished-reload');assert.equal(elements.completion.hidden,false);assert.match(elements.mission.textContent,/Course complete/);assert.match(elements.tavi.src,/celebrating/);elements.start.onclick();
 key('Esc');assert.equal(document.activeElement,elements.exit);
 // Completed lessons remain replayable, including the final challenge.
 elements['lesson-nav'].children[5].onclick();assert.equal(elements.mission.textContent,lessons[5].steps[0].mission);assert.equal(elements.completion.hidden,true);
 elements['restart-course'].onclick();assert.equal(JSON.parse(store.get('tavi-academy-v1')).lesson,0);assert.equal(elements.completion.hidden,true);
 elements.exit.onclick();assert.equal(document.activeElement,elements.start);elements.start.onclick();key('Esc');assert.equal(document.activeElement,elements.exit);
 elements.start.onclick();assert.equal(key('Shift + Tab').defaultPrevented,false);
 assert.equal(key('Tab').defaultPrevented,false,'ordinary Tab navigation remains available outside mode exercises');
 elements['deck-filter'].value='extrude';emit(elements['deck-filter'],'input');assert.ok(elements['deck-list'].children.length>0);elements['deck-list'].children[0].onclick();assert.match(elements['deck-status'].textContent,/Demonstration/);assert.equal(JSON.parse(store.get('tavi-academy-v1')).step,0);
 }finally{globalThis.setTimeout=realTimeout;globalThis.clearTimeout=realClear;}
});
