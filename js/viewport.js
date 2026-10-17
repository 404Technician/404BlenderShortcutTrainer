import {objectMesh,editFace,validMesh,projectPoint,camera,dot,center,normal,transform,rayOnXY} from './geometry.js';
import {renderScene} from './renderer.js';
import {validQuaternion,axisQuaternion,objectQuaternion,multiplyQuaternion} from './geometry.js';
export const initialScene=()=>({objects:[{x:0,y:0,z:0,sx:1,sy:1,sz:1,rx:0,ry:0,rz:0,extrusion:0,inset:0,selected:true}],active:0,mode:'object',selection:'vertices',top:false,yaw:.55,pitch:.55,zoom:1,panX:0,panY:0,saved:false});
const copy=v=>JSON.parse(JSON.stringify(v));
export function isValidScene(s){
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 return !!s&&Array.isArray(s.objects)&&s.objects.length<=100&&s.objects.every(o=>o&&['x','y','z','sx','sy','sz','rx','ry','rz','extrusion','inset'].every(k=>finite(o[k]))&&['sx','sy','sz'].every(k=>o[k]>0)&&typeof o.selected==='boolean'&&(o.mesh===undefined||validMesh(o.mesh))&&(o.rotation===undefined||validQuaternion(o.rotation)))&&Number.isInteger(s.active)&&s.active>=0&&(s.objects.length===0?s.active===0:s.active<s.objects.length)&&['object','edit'].includes(s.mode)&&['vertices','edges','faces'].includes(s.selection)&&typeof s.top==='boolean'&&['yaw','pitch','zoom','panX','panY'].every(k=>finite(s[k]))&&s.zoom>=.4&&s.zoom<=2.1&&s.pitch>=.12&&s.pitch<=1.3&&typeof s.saved==='boolean';
}
export class Viewport{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.state=initialScene();this.history=[];this.future=[];this.modal=null;this.facePolygons=[];this.resizeObserver=new ResizeObserver(()=>this.draw());this.resizeObserver.observe(canvas);}
 reset(){this.state=initialScene();this.history=[];this.future=[];this.modal=null;this.draw();}
 pushHistory(state){this.history.push(copy(state));if(this.history.length>100)this.history.shift();}
 checkpoint(){this.pushHistory(this.state);this.future=[];}
 active(){return this.state.objects[this.state.active];}
 apply(action){
 const s=this.state,o=this.active();
 if(action==='undo'){if(this.history.length){this.future.push(copy(s));this.state=this.history.pop();}this.draw();return;}
 if(action==='redo'){if(this.future.length){this.pushHistory(s);this.state=this.future.pop();}this.draw();return;}
 this.checkpoint();
 if(action==='edit'){s.mode='edit';s.top=false;}
 if(action==='object'){s.mode='object';s.top=false;}
 if(['vertices','edges','faces'].includes(action))s.selection=action;
 if(action==='top'){s.top=true;if(o)o.selected=true;}
 if(action==='select'&&o)o.selected=true;
 if(action==='all')s.objects.forEach(o=>o.selected=true);
 if(action==='none')s.objects.forEach(o=>o.selected=false);
 if(action==='invert')s.objects.forEach(o=>o.selected=!o.selected);
 if(action==='delete'){s.objects=s.objects.filter(o=>!o.selected);s.active=Math.max(0,s.objects.length-1);}
 if(action==='save')s.saved=true;
 if(action==='hide'&&o)o.hidden=!o.hidden;
 if(action==='frame'){s.zoom=1;s.panX=0;s.panY=0;}
 if(action==='panels')s.panels=!s.panels;
 this.draw();
 }
 begin(action,{freeXY=false,viewAligned=false}={}){if(this.modal||!this.active())return false;this.modal={action,freeXY:action==='move'&&freeXY,viewAligned:action==='rotate'&&viewAligned,rotationAxis:camera(this.state,this.canvas.clientWidth,this.canvas.clientHeight).toward.map(v=>-v),offset:[0,0],base:copy(this.state),source:copy(this.active()),axis:null,amount:0,moved:false,pointer:null};if(action==='duplicate'){const o=copy(this.modal.source);this.state.objects.forEach(o=>o.selected=false);o.selected=true;this.state.objects.push(o);this.state.active=this.state.objects.length-1;}this.draw();return true;}
 constrain(axis){if(this.modal){this.modal.axis=axis;this.modal.pointer=null;this.adjust(this.modal.amount);}}
 adjust(amount){
 if(!this.modal)return;
 if(!Number.isFinite(amount))return;
 const m=this.modal;
 this.state=copy(m.base);
 // Every preview starts from the same source, never from the previous moved duplicate.
 if(m.action==='duplicate'){this.state.objects.forEach(o=>o.selected=false);const duplicate=copy(m.source);duplicate.selected=true;this.state.objects.push(duplicate);this.state.active=this.state.objects.length-1;}
 const o=this.active();if(!o)return;
 const axis=m.axis||'x';m.amount=amount;m.moved=Math.abs(amount)>.03;
 if(['move','duplicate'].includes(m.action)){if(m.freeXY&&!m.axis){m.offset=[amount,m.offset[1]];o.x+=m.offset[0];o.y+=m.offset[1];m.moved=Math.hypot(...m.offset)>.03;}else o[axis]+=amount;}
 if(m.action==='scale'){const factor=Math.max(.15,1+amount*.4);if(m.axis)o['s'+axis]*=factor;else ['sx','sy','sz'].forEach(k=>o[k]*=factor);}
 if(m.action==='rotate'){
 if(m.viewAligned||m.axis||m.source.rotation){const direction=m.axis?['x','y','z'].map(k=>k===m.axis?1:0):m.viewAligned?m.rotationAxis:[0,0,1],angle=m.viewAligned&&!m.axis?amount:amount*.6;o.rotation=multiplyQuaternion(axisQuaternion(direction,angle),objectQuaternion(m.source));}
 else o.rz+=amount*.6;
 }
 if(m.action==='extrude'){const distance=Math.max(0,amount);o.mesh=editFace(objectMesh(m.source),'extrude',distance);o.extrusion+=distance;}
 if(m.action==='inset'){const fraction=Math.min(.65,Math.abs(amount)*.3);o.mesh=editFace(objectMesh(m.source),'inset',fraction);o.inset=Math.min(.85,o.inset+fraction);}
 this.draw();
 }
 project(point,s=this.state){return projectPoint(point,s,this.canvas.clientWidth,this.canvas.clientHeight);}
 rotationPointerAngle(x,y){const m=this.modal,o=m.source,pivot=this.project([o.x,o.y,o.z],m.base),rect=this.canvas.getBoundingClientRect?.()||{left:0,top:0},px=x-rect.left-pivot[0],py=y-rect.top-pivot[1];return Math.hypot(px,py)<8?null:Math.atan2(py,px);}
 adjustPointer(x,y){
 const m=this.modal;if(!m||!Number.isFinite(x)||!Number.isFinite(y))return;
 const size=`${this.canvas.clientWidth}:${this.canvas.clientHeight}`;
 if(!m.pointer||m.pointer.size!==size){m.pointer={x,y,size,amount:m.amount,offset:[...m.offset],angle:m.viewAligned&&!m.axis?this.rotationPointerAngle(x,y):null};return;}
 const dx=x-m.pointer.x,dy=y-m.pointer.y;let amount;
 if(m.viewAligned&&!m.axis){
 // Re-anchor near the pivot instead of flipping 180 degrees when crossing its center.
 const angle=this.rotationPointerAngle(x,y);if(angle===null){m.pointer.angle=null;return;}
 if(m.pointer.angle==null){m.pointer.angle=angle;return;}
 const delta=Math.atan2(Math.sin(angle-m.pointer.angle),Math.cos(angle-m.pointer.angle));m.pointer.angle=angle;
 this.adjust(m.amount-delta);return;
 }
 if(m.freeXY&&!m.axis){
 const origin=[m.source.x+m.pointer.offset[0],m.source.y+m.pointer.offset[1],m.source.z],screen=this.project(origin,m.base);
 // Anchor the ray at the object's screen position, retaining the initial grab offset.
 const point=rayOnXY(screen[0]+dx,screen[1]+dy,m.source.z,m.base,this.canvas.clientWidth,this.canvas.clientHeight);
 if(!point)return;
 m.offset=[point[0]-m.source.x,point[1]-m.source.y];this.adjust(m.offset[0]);m.amount=Math.hypot(...m.offset);return;
 }
 if(['move','duplicate','extrude'].includes(m.action)){
 const axis=m.axis||'x',o=m.source;let p=[o.x,o.y,o.z],q=[...p];q['xyz'.indexOf(axis)]+=1;
 if(m.action==='extrude'){const mesh=objectMesh(o),face=mesh.faces[mesh.selectedFace].map(i=>mesh.vertices[i]),c=center(face),n=normal(face);p=transform(c,o);q=transform(c.map((v,i)=>v+n[i]),o);}
 const a=this.project(p,m.base),b=this.project(q,m.base),vx=b[0]-a[0],vy=b[1]-a[1],length2=vx*vx+vy*vy;
 // Project screen displacement onto the rendered axis; zoom and viewport size use the same projection.
 amount=length2>1?(dx*vx+dy*vy)/length2:0;
 }else amount=dx/(Math.max(1,Math.min(this.canvas.clientWidth,this.canvas.clientHeight))*.2);
 this.adjust(m.pointer.amount+amount);
 }
 nudge(delta){if(this.modal&&Number.isFinite(delta)){this.adjust((this.modal.freeXY&&!this.modal.axis?this.modal.offset[0]:this.modal.amount)+delta);this.modal.pointer=null;}}
 confirm(){if(!this.modal)return;this.pushHistory(this.modal.base);this.future=[];this.modal=null;this.draw();}
 cancel(){if(this.modal){this.state=this.modal.base;this.modal=null;this.draw();}}
 // With this camera basis, yaw must decrease for rightward dragging. Browser Y grows
 // downward; increasing pitch already makes the near side follow a downward drag.
 navigate(action,dx=25,dy=15){const s=this.state;if(action==='orbit'){s.yaw-=dx*.009;s.pitch=Math.max(.12,Math.min(1.3,s.pitch+dy*.006));}if(action==='pan'){s.panX+=dx;s.panY+=dy;}if(action==='zoom')s.zoom=Math.max(.4,Math.min(2.1,s.zoom+dx*.003));this.draw();}
 hit(x,y,topOnly=false){
 const r=this.render;if(!r||x<0||y<0||x>=this.canvas.clientWidth||y>=this.canvas.clientHeight)return false;
 const id=r.pick[Math.floor(y*r.ratio)*r.width+Math.floor(x*r.ratio)],face=r.records[id];
 return !!face&&face.object===this.state.active&&(!topOnly||face.top);
 }
 draw(){
 const c=this.canvas,ctx=this.ctx,w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;
 const dpr=Math.min(window.devicePixelRatio||1,2),s=this.state;
 this.render=renderScene({...s,modalAxis:this.modal?.axis},w,h,dpr);
 const r=this.render;c.width=r.width;c.height=r.height;
 if(typeof ImageData!=='undefined')ctx.putImageData(new ImageData(r.pixels,r.width,r.height),0,0);
 ctx.setTransform(dpr,0,0,dpr,0,0);this.drawAxes(w);
 ctx.fillStyle='#c5c5cc';ctx.font='11px system-ui';ctx.fillText(s.saved?'Practice save recorded ✓':s.mode==='edit'?`Mesh · ${s.selection} selection`:'Perspective · Cube',15,h-40);
 if(s.panels){ctx.fillStyle='#332e41';ctx.fillRect(w-145,110,135,h-170);ctx.fillStyle='#dfd6ed';ctx.fillText('Sidebar · example',w-135,132);ctx.fillText('Transform',w-135,160);ctx.fillText('Location X / Y / Z',w-135,187);ctx.fillStyle='#332e41';ctx.fillRect(12,70,65,105);ctx.fillStyle='#dfd6ed';ctx.fillText('Toolbar',20,92);ctx.fillText('Move',20,122);ctx.fillText('Rotate',20,150);}
 }
 drawAxes(w){
 const ctx=this.ctx,cam=camera(this.state,w,this.canvas.clientHeight),origin=[w-51,73],axes=[[1,0,0],[0,1,0],[0,0,1]],colors=['#ed737b','#9cc77b','#82a8f0'];
 const order=axes.map((v,i)=>({v,i,depth:dot(v,cam.toward)})).sort((a,b)=>a.depth-b.depth);
 for(const {v,i} of order){const x=origin[0]+dot(v,cam.right)*25,y=origin[1]-dot(v,cam.up)*25;ctx.beginPath();ctx.moveTo(...origin);ctx.lineTo(x,y);ctx.strokeStyle=colors[i];ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fillStyle=colors[i];ctx.fill();ctx.fillStyle='#252527';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('XYZ'[i],x,y);}
 ctx.textAlign='start';ctx.textBaseline='alphabetic';
 }
}
