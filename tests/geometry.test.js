import test from 'node:test';
import assert from 'node:assert/strict';
import {cubeMesh,meshEdges,normal,center,dot,editFace,validMesh,transform,projectPoint,camera,objectMesh} from '../js/geometry.js';
import {initialScene,Viewport,isValidScene} from '../js/viewport.js';
import {renderScene} from '../js/renderer.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function closed(mesh){assert.ok(validMesh(mesh));assert.equal(mesh.vertices.length-meshEdges(mesh).length+mesh.faces.length,2);assert.ok(meshEdges(mesh).every(e=>e.faces.length===2));}
function view(){globalThis.ResizeObserver=class{observe(){}};globalThis.window={devicePixelRatio:1};const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});return new Viewport({clientWidth:700,clientHeight:345,getContext:()=>ctx});}
test('default cube has exact Blender dimensions, topology and outward flat normals',()=>{
 const mesh=cubeMesh();closed(mesh);assert.equal(mesh.vertices.length,8);assert.equal(meshEdges(mesh).length,12);assert.equal(mesh.faces.length,6);assert.deepEqual(center(mesh.vertices),[0,0,0]);
 for(let i=0;i<3;i++){assert.equal(Math.min(...mesh.vertices.map(p=>p[i])),-1);assert.equal(Math.max(...mesh.vertices.map(p=>p[i])),1);}
 for(const face of mesh.faces){const p=face.map(i=>mesh.vertices[i]),n=normal(p);near(dot(n,center(p)),1);for(let i=0;i<4;i++){const a=p[i],b=p[(i+1)%4],c=p[(i+2)%4];near(Math.hypot(...a.map((v,k)=>v-b[k])),2);near(dot(a.map((v,k)=>v-b[k]),c.map((v,k)=>v-b[k])),0);}}
});
test('extrude and inset replace the selected cap with connected quad topology',()=>{
 let mesh=cubeMesh();const original=structuredClone(mesh);mesh=editFace(mesh,'extrude',1);closed(mesh);assert.equal(mesh.vertices.length,12);assert.equal(mesh.faces.length,10);near(center(mesh.faces[mesh.selectedFace].map(i=>mesh.vertices[i]))[2],2);assert.deepEqual(original,cubeMesh());
 mesh=editFace(mesh,'inset',.25);closed(mesh);assert.equal(mesh.vertices.length,16);assert.equal(mesh.faces.length,14);const cap=mesh.faces[mesh.selectedFace].map(i=>mesh.vertices[i]);assert.deepEqual(cap,[[-.75,-.75,2],[.75,-.75,2],[.75,.75,2],[-.75,.75,2]]);
 mesh=editFace(mesh,'extrude',.5);closed(mesh);near(center(mesh.faces[mesh.selectedFace].map(i=>mesh.vertices[i]))[2],2.5);
});
test('object transforms preserve origin pivot, proportions and mesh coordinates',()=>{
 const o=initialScene().objects[0],mesh=cubeMesh();o.sx=o.sy=o.sz=2;o.rx=.4;o.ry=.7;o.rz=.2;o.x=3;o.y=-2;o.z=1;
 const world=mesh.vertices.map(p=>transform(p,o));const c=center(world);[3,-2,1].forEach((v,i)=>near(c[i],v));for(const e of meshEdges(mesh))near(Math.hypot(...world[e.a].map((v,i)=>v-world[e.b][i])),4);assert.deepEqual(mesh,cubeMesh());
});
test('perspective uses reciprocal camera depth and a common camera for grid and geometry',()=>{
 const s=initialScene(),cam=camera(s,700,345),direction=cam.toward;
 const p=cam.right,q=p.map((v,i)=>v+direction[i]*2),a=projectPoint(p,s,700,345),b=projectPoint(q,s,700,345);near((b[0]-cam.cx)/(a[0]-cam.cx),8/6);
 for(const [w,h] of [[320,300],[700,345],[1280,500]]){const p=projectPoint([0,0,0],s,w,h);near(p[0],w*.5);near(p[1],h*.56);assert.ok(projectPoint([0,0,1],s,w,h)[1]<p[1]);}
});
test('depth buffer picks only visible faces and resolves overlapping objects regardless of order',()=>{
 const s=initialScene(),cam=camera(s,320,300),front={...s.objects[0],...Object.fromEntries('xyz'.split('').map((k,i)=>[k,cam.toward[i]*1.5]))};s.objects.push(front);
 const record=scene=>{const r=renderScene(scene,320,300),p=projectPoint([front.x,front.y,front.z],scene,320,300),id=r.pick[Math.floor(p[1])*r.width+Math.floor(p[0])];return r.records[id];};
 assert.equal(record(s).object,1);s.objects.reverse();assert.equal(record(s).object,0);
 const r=renderScene(initialScene(),320,300);assert.equal(r.records.length,3);assert.ok(!r.records.some(f=>f.face===0));
});
test('selection overlays are occluded by foreground geometry',()=>{
 const s=initialScene();s.mode='edit';s.selection='vertices';s.objects[0].selected=true;const cam=camera(s,320,300),foreground={...s.objects[0],selected:false,sx:2,sy:2,sz:2};'xyz'.split('').forEach((k,i)=>foreground[k]=cam.toward[i]*3);s.objects.push(foreground);
 const a=renderScene(s,320,300),onlyFront=renderScene({...s,objects:[foreground]},320,300);assert.deepEqual(a.pixels,onlyFront.pixels);
});
test('mesh previews, duplicate, cancellation, undo and saved-scene validation retain topology',()=>{
 const v=view();v.apply('edit');v.apply('top');const before=structuredClone(v.state);v.begin('extrude');v.adjust(1);v.adjust(1);closed(v.active().mesh);v.cancel();assert.deepEqual(v.state,before);
 v.begin('extrude');v.adjust(1);v.confirm();v.begin('inset');v.adjust(.5);v.confirm();const model=structuredClone(v.active().mesh);v.begin('duplicate');v.adjust(2);v.confirm();assert.deepEqual(v.active().mesh,model);assert.deepEqual(v.state.objects[0].mesh,model);v.apply('undo');assert.equal(v.state.objects.length,1);v.apply('undo');assert.equal(objectMesh(v.active()).faces.length,10);v.apply('redo');assert.deepEqual(v.active().mesh,model);
 assert.ok(isValidScene(v.state));v.active().mesh.faces[0][0]=99999;assert.equal(isValidScene(v.state),false);
});
test('legacy saved modeling scenes upgrade to closed mesh without mutation',()=>{const o={...initialScene().objects[0],extrusion:1,inset:.2},original=structuredClone(o),mesh=objectMesh(o);closed(mesh);assert.equal(mesh.faces.length,14);assert.deepEqual(o,original);});
test('invalid winding, degenerate faces and nonplanar saved meshes are rejected',()=>{
 for(const mutate of [m=>m.faces[0].reverse(),m=>m.vertices[0]=[...m.vertices[1]],m=>m.vertices[0][0]+=.2]){const m=cubeMesh();mutate(m);assert.equal(validMesh(m),false);}
});
test('solid faces cover coplanar grid lines across sizes and pixel ratios',()=>{
 for(const [w,h,ratio] of [[320,300,1],[700,345,2],[1280,500,2]]){const s=initialScene(),r=renderScene(s,w,h,ratio),p=projectPoint([0,1,0],s,w,h),x=Math.floor(p[0]*ratio),y=Math.floor(p[1]*ratio),id=r.pick[y*r.width+x];assert.equal(r.records[id]?.face,3);}
});
test('extrusion pointer follows the transformed selected-face normal',()=>{
 const v=view();v.active().rx=.5;v.active().sz=1.4;const mesh=objectMesh(v.active()),face=mesh.faces[mesh.selectedFace].map(i=>mesh.vertices[i]),c=center(face),n=normal(face),a=v.project(transform(c,v.active())),b=v.project(transform(c.map((p,i)=>p+n[i]),v.active()));
 v.begin('extrude');v.adjustPointer(...a);v.adjustPointer(...b);near(v.active().extrusion,1);closed(v.active().mesh);
});
