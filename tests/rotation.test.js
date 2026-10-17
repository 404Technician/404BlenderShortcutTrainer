import test from 'node:test';
import assert from 'node:assert/strict';
import {Viewport,isValidScene} from '../js/viewport.js';
import {camera,cubeMesh,meshEdges,transform,center,axisQuaternion,objectQuaternion,rotateVector} from '../js/geometry.js';
function view(){globalThis.ResizeObserver=class{observe(){}};globalThis.window={devicePixelRatio:1};return new Viewport({clientWidth:700,clientHeight:345,getBoundingClientRect:()=>({left:40,top:25}),getContext:()=>new Proxy({},{get:()=>()=>{},set:()=>true})});}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function pointer(v,angle,radius=70){const o=v.modal.source,p=v.project([o.x,o.y,o.z],v.modal.base);v.adjustPointer(40+p[0]+radius*Math.cos(angle),25+p[1]+radius*Math.sin(angle));}
test('view rotation captures the actual camera axis for oblique, front, top and orbited views',()=>{
 for(const [yaw,pitch] of [[.55,.55],[0,0],[0,Math.PI/2],[2.1,.8]]){
 const v=view();Object.assign(v.state,{yaw,pitch});const expected=camera(v.state,700,345).toward.map(n=>-n);v.begin('rotate',{viewAligned:true});assert.deepEqual(v.modal.rotationAxis,expected);v.adjust(.6);
 const q=v.active().rotation;near(q[0],Math.cos(.3));expected.forEach((n,i)=>near(q[i+1],n*Math.sin(.3)));const axis=[...v.modal.rotationAxis];v.state.yaw+=1;v.state.pitch=.2;v.adjust(.3);assert.deepEqual(v.modal.rotationAxis,axis);
 }
});
test('orbiting before R updates the captured axis while an active rotation keeps its original axis',()=>{
 const v=view();v.begin('rotate',{viewAligned:true});const first=[...v.modal.rotationAxis];v.cancel();v.navigate('orbit',30,-20);v.begin('rotate',{viewAligned:true});assert.notDeepEqual(v.modal.rotationAxis,first);const expected=camera(v.state,700,345).toward.map(n=>-n);assert.deepEqual(v.modal.rotationAxis,expected);v.state.yaw+=.5;v.adjust(.4);assert.deepEqual(v.modal.rotationAxis,expected);
});
test('clockwise and counterclockwise pointer rotation match projected pivot angles at every size and zoom',()=>{
 for(const [w,h] of [[320,300],[700,345],[1280,500]])for(const zoom of [.4,1,2.1])for(const delta of [-.7,.7]){
 const v=view();v.canvas.clientWidth=w;v.canvas.clientHeight=h;v.state.zoom=zoom;Object.assign(v.active(),{rx:.4,ry:.2,rz:.3});const source=structuredClone(v.active()),pivot=v.project([source.x,source.y,source.z]),a=v.project(transform([1,1,1],source));v.begin('rotate',{viewAligned:true});pointer(v,.2);assert.deepEqual(v.active(),source);pointer(v,.2+delta);near(v.modal.amount,-delta);
 const b=v.project(transform([1,1,1],v.active())),x=a[0]-pivot[0],y=a[1]-pivot[1];near(b[0]-pivot[0],x*Math.cos(delta)-y*Math.sin(delta));near(b[1]-pivot[1],x*Math.sin(delta)+y*Math.cos(delta));assert.ok(v.modal.moved);
 }
});
test('angular rotation does not accelerate with repeated events and crosses the angle seam smoothly',()=>{
 const objects=[];for(const count of [1,8,60]){const v=view();v.begin('rotate',{viewAligned:true});pointer(v,.1);for(let i=1;i<=count;i++)pointer(v,.1+.9*i/count);const before=structuredClone(v.active());pointer(v,1);assert.deepEqual(v.active(),before);objects.push(v.active());}
 objects[0].rotation.forEach((n,i)=>near(n,objects[1].rotation[i]));objects[0].rotation.forEach((n,i)=>near(n,objects[2].rotation[i]));
 const v=view();v.begin('rotate',{viewAligned:true});pointer(v,170*Math.PI/180);pointer(v,190*Math.PI/180);near(v.modal.amount,-20*Math.PI/180);for(let i=1;i<=36;i++)pointer(v,(190+i*10)*Math.PI/180);near(v.modal.amount,-380*Math.PI/180);
});
test('view rotation preserves mesh, dimensions and translated pivot without Euler drift',()=>{
 const v=view(),mesh=cubeMesh();Object.assign(v.active(),{x:2,y:-1,z:.4,rx:.3,ry:.7,rz:.2});const source=structuredClone(v.active());v.begin('rotate',{viewAligned:true});for(let i=0;i<100;i++)v.adjust(.7);const o=v.active(),world=mesh.vertices.map(p=>transform(p,o));center(world).forEach((n,i)=>near(n,[o.x,o.y,o.z][i]));for(const e of meshEdges(mesh))near(Math.hypot(...world[e.a].map((n,i)=>n-world[e.b][i])),2);assert.equal(o.rx,source.rx);assert.equal(o.ry,source.ry);assert.equal(o.rz,source.rz);near(Math.hypot(...o.rotation),1);
});
test('explicit X Y Z rotation composes around the selected world axis after a view rotation',()=>{
 for(const axis of ['x','y','z']){const v=view();v.begin('rotate',{viewAligned:true});v.adjust(.4);v.confirm();const source=structuredClone(v.active()),p=rotateVector([1,1,1],objectQuaternion(source));v.begin('rotate');v.constrain(axis);v.adjust(1);const expected=rotateVector(p,axisQuaternion('xyz'.split('').map(k=>k===axis?1:0),.6)),actual=transform([1,1,1],v.active());expected.forEach((n,i)=>near(n,actual[i]));}
});
test('view rotation cancellation, confirmation, undo, redo and duplication preserve quaternion state',()=>{
 const v=view(),before=structuredClone(v.state);v.begin('rotate',{viewAligned:true});v.adjust(.5);v.cancel();assert.deepEqual(v.state,before);v.begin('rotate',{viewAligned:true});v.adjust(.5);v.confirm();const after=structuredClone(v.state);assert.ok(isValidScene(after));v.apply('undo');assert.deepEqual(v.state,before);v.apply('redo');assert.deepEqual(v.state,after);v.begin('duplicate');v.adjust(1);v.confirm();assert.deepEqual(v.active().rotation,after.objects[0].rotation);v.active().rotation=[0,0,0,0];assert.equal(isValidScene(v.state),false);
});
test('near-pivot samples, resizing and arrow handover re-anchor angular interaction without jumps',()=>{
 const v=view();v.begin('rotate',{viewAligned:true});const source=structuredClone(v.active());pointer(v,0,0);pointer(v,0,70);assert.deepEqual(v.active(),source);pointer(v,.4);const before=structuredClone(v.active());pointer(v,0,0);pointer(v,1);assert.deepEqual(v.active(),before);v.canvas.clientWidth=350;pointer(v,2);assert.deepEqual(v.active(),before);v.nudge(.25);const nudged=structuredClone(v.active());pointer(v,1);assert.deepEqual(v.active(),nudged);pointer(v,1.1);assert.notDeepEqual(v.active(),nudged);
});
