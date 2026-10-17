import {readFileSync} from 'node:fs';
import {lessons} from '../js/lessons.js';
import {projectPoint} from '../js/geometry.js';
let instance=0;
export class Element extends EventTarget{
 constructor(id=''){super();Object.assign(this,{id,children:[],dataset:{},hidden:false,value:'',textContent:'',clientWidth:720,clientHeight:345,classList:{add(){},remove(){}}});}
 append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}setAttribute(k,v){this[k]=v;}
 contains(el){return el===this||this.children.some(c=>c.contains(el));}
 focus(){const old=document.activeElement;document.activeElement=this;if(old&&old!==this)emit(old,'blur',{relatedTarget:this});emit(this,'focus');}
 scrollIntoView(){}getBoundingClientRect(){return {left:0,top:0};}
 setPointerCapture(id){this.captured=id;}hasPointerCapture(id){return this.captured===id;}releasePointerCapture(){this.captured=null;}
 getContext(){return new Proxy({},{get:()=>()=>{},set:()=>true});}
}
export function emit(el,type,props={}){const event=new Event(type,{cancelable:true});for(const [k,v]of Object.entries(props))Object.defineProperty(event,k,{value:v});el.dispatchEvent(event);return event;}
export async function createApp(seed){
 const globals=['document','window','ResizeObserver','matchMedia','setTimeout','clearTimeout'],old=new Map(globals.map(k=>[k,globalThis[k]]));
 const ids=[...readFileSync(new URL('../index.html',import.meta.url),'utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]),elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
 elements['search-panel'].hidden=true;elements['delete-panel'].hidden=true;elements.practice.append(elements.canvas,elements['search-panel'],elements['delete-panel']);
 const store=new Map(),timers=new Map();let timer=0;
 globalThis.document={getElementById:id=>elements[id],createElement:()=>new Element(),querySelectorAll:()=>[],activeElement:null};globalThis.window={devicePixelRatio:1,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};globalThis.ResizeObserver=class{observe(){}};globalThis.matchMedia=()=>({matches:true});
 globalThis.setTimeout=(fn,ms)=>{timers.set(++timer,{fn,ms});return timer;};globalThis.clearTimeout=id=>timers.delete(id);
 const data=typeof seed==='function'?seed():seed;if(data)store.set('tavi-academy-v1',JSON.stringify(data));
 await import(`../js/app.js?navigation-test-${++instance}`);
 const key=token=>{const parts=token.toLowerCase().split(' + '),k=parts.at(-1);return emit(elements.practice,'keydown',{key:k==='esc'?'Escape':k==='tab'?'Tab':k==='enter'?'Enter':k,shiftKey:parts.includes('shift'),ctrlKey:parts.includes('ctrl'),altKey:parts.includes('alt'),repeat:false});};
 const advance=()=>{for(const [id,t]of [...timers])if(t.ms===750){timers.delete(id);t.fn();}};
 const saved=()=>JSON.parse(store.get('tavi-academy-v1'));
 const complete=()=>{
 const d=saved(),s=lessons[d.lesson].steps[d.step];elements.practice.focus();
 if(['orbit','pan'].includes(s.action)){emit(elements.practice,'pointerdown',{target:elements.canvas,button:1,shiftKey:s.action==='pan',clientX:100,clientY:100,pointerId:1});emit(elements.practice,'pointermove',{target:elements.canvas,clientX:130,clientY:110});emit(elements.practice,'pointerup',{pointerId:1});}
 else if(s.action==='zoom')emit(elements.practice,'wheel',{target:elements.canvas,deltaY:-80});
 else if(['top','select'].includes(s.action))key(' ');
 else{for(const token of s.keys)key(token);
 if(s.modal&&!s.numeric){
 if(s.viewAligned){const o=d.scene.objects[d.scene.active],[x,y]=projectPoint([o.x,o.y,o.z],d.scene,720,345);emit(elements.practice,'pointermove',{target:elements.canvas,clientX:x+70,clientY:y});emit(elements.practice,'pointermove',{target:elements.canvas,clientX:x+70*Math.cos(.4),clientY:y+70*Math.sin(.4)});}
 else{emit(elements.practice,'pointermove',{target:elements.canvas,clientX:100,clientY:100});emit(elements.practice,'pointermove',{target:elements.canvas,clientX:140,clientY:90});}
 key(s.cancel?'Esc':'Enter');
 }
 if(s.action==='search')elements['close-search'].onclick();
 }advance();return s;
 };
 return {elements,store,timers,key,advance,saved,complete,close(){timers.clear();for(const [k,v]of old){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}};
}
