import test from 'node:test';
import assert from 'node:assert/strict';
import {Viewport} from '../js/viewport.js';
import {camera} from '../js/geometry.js';
function makeView(){globalThis.ResizeObserver=class{observe(){}};globalThis.window={devicePixelRatio:1};const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});return new Viewport({getContext:()=>ctx,clientWidth:700,clientHeight:345});}
test('axis moves and numeric Z use exact scene coordinates',()=>{const v=makeView();for(const axis of ['x','y','z']){v.reset();v.begin('move');v.constrain(axis);v.adjust(2);assert.equal(v.active()[axis],2);for(const other of ['x','y','z'].filter(a=>a!==axis))assert.equal(v.active()[other],0);v.confirm();assert.equal(v.modal,null);}});
test('move cancellation restores scene, duplicate undo/redo preserves originals',()=>{const v=makeView();v.begin('move');v.adjust(3);v.cancel();assert.equal(v.active().x,0);v.begin('duplicate');v.adjust(2);v.confirm();assert.equal(v.state.objects.length,2);assert.equal(v.state.objects[0].x,0);assert.equal(v.state.objects[1].x,2);v.apply('undo');assert.equal(v.state.objects.length,1);v.apply('redo');assert.equal(v.state.objects.length,2);});
test('edit selections, extrusion, inset and deletion remain separate actions',()=>{const v=makeView();v.apply('edit');for(const type of ['vertices','edges','faces']){v.apply(type);assert.equal(v.state.selection,type);}v.apply('top');v.begin('extrude');v.adjust(1);v.confirm();assert.equal(v.active().extrusion,1);v.begin('inset');v.adjust(.5);v.confirm();assert.ok(v.active().inset>0);v.apply('object');assert.equal(v.state.mode,'object');v.apply('delete');assert.equal(v.state.objects.length,0);v.apply('undo');assert.equal(v.state.objects.length,1);v.apply('save');assert.equal(v.state.saved,true);});
test('orbit, pan and zoom affect camera only',()=>{const v=makeView();const original=structuredClone(v.active());v.navigate('orbit',30,20);assert.notEqual(v.state.yaw,.55);v.navigate('pan',30,20);assert.equal(v.state.panX,30);v.navigate('zoom',40);assert.ok(v.state.zoom>1);assert.deepEqual(v.active(),original);});
test('default MMB orbit independently follows left, right, up and down drags at every zoom',()=>{
 // Blender's upright turntable makes the visible near side follow the drag.
 // Verify projected motion, not merely an implementation-specific angle sign.
 for(const yaw of [.55,2.1,-1.3])for(const zoom of [.4,1,2.1])for(const [name,dx,dy] of [['left',-20,0],['right',20,0],['up',0,-20],['down',0,20]]){
 const v=makeView();Object.assign(v.state,{yaw,zoom});const before=structuredClone(v.state),cam=camera(v.state,700,345),point=[cam.toward[0],cam.toward[1],0],a=v.project(point);
 v.navigate('orbit',dx,dy);const b=v.project(point);
 if(dx)assert.ok((b[0]-a[0])*dx>0,`${name} orbit reversed`);
 if(dy)assert.ok((b[1]-a[1])*dy>0,`${name} orbit reversed`);
 assert.ok(Math.abs(v.state.yaw-(yaw-dx*.009))<1e-12);assert.ok(Math.abs(v.state.pitch-(before.pitch+dy*.006))<1e-12);
 assert.deepEqual(v.state.objects,before.objects);assert.equal(v.state.zoom,zoom);assert.equal(v.state.panX,before.panX);assert.equal(v.state.panY,before.panY);assert.equal(v.history.length,0);
 const nextCam=camera(v.state,700,345);assert.ok(Math.abs(Math.hypot(...nextCam.position)-8)<1e-12);assert.ok(v.project([0,0,0]).every((n,i)=>Math.abs(n-v.project([0,0,0],before)[i])<1e-12),'origin target must stay fixed');
 }
});
test('orbit sensitivity is independent of event density and pitch retains its limits',()=>{
 const scenes=[];for(const count of [1,8,60]){const v=makeView();for(let i=0;i<count;i++)v.navigate('orbit',30/count,20/count);scenes.push(v.state);}
 for(const s of scenes){assert.ok(Math.abs(s.yaw-(.55-30*.009))<1e-12);assert.ok(Math.abs(s.pitch-(.55+20*.006))<1e-12);}
 const v=makeView();v.navigate('orbit',0,-10000);assert.equal(v.state.pitch,.12);v.navigate('orbit',0,10000);assert.equal(v.state.pitch,1.3);
});
test('pan and wheel zoom directions remain unchanged and preserve object transforms',()=>{
 const v=makeView(),objects=structuredClone(v.state.objects),yaw=v.state.yaw,pitch=v.state.pitch;
 v.navigate('pan',30,-20);assert.equal(v.state.panX,30);assert.equal(v.state.panY,-20);v.navigate('pan',-10,15);assert.equal(v.state.panX,20);assert.equal(v.state.panY,-5);
 // app.js converts wheel deltaY to -deltaY * .5: wheel up zooms in, down zooms out.
 v.navigate('zoom',-(-100)*.5);assert.equal(v.state.zoom,1.15);v.navigate('zoom',-(100)*.5);assert.ok(Math.abs(v.state.zoom-1)<1e-12);
 assert.equal(v.state.yaw,yaw);assert.equal(v.state.pitch,pitch);assert.deepEqual(v.state.objects,objects);
});
test('duplicate absolute displacement never accumulates between pointer events',()=>{
 for(const action of ['move','duplicate']){const v=makeView();v.begin(action);for(const amount of [0,.1,.2,.3,.3])v.adjust(amount);assert.ok(Math.abs(v.active().x-.3)<1e-10,`${action} drifted to ${v.active().x}`);}
});
test('G and Shift+D share pointer sensitivity across viewport sizes, zoom and axes',()=>{
 for(const [w,h] of [[320,300],[768,345],[1280,500]])for(const zoom of [.4,1,2.1])for(const axis of [null,'x','y','z']){
 const positions=[];
 for(const action of ['move','duplicate']){
 const v=makeView();v.canvas.clientWidth=w;v.canvas.clientHeight=h;v.state.zoom=zoom;v.active().x=.7;v.active().y=-.3;v.active().z=.2;
 const source=structuredClone(v.active());v.begin(action);if(axis)v.constrain(axis);
 v.adjustPointer(100,100);assert.deepEqual(v.active(),source,'first pointer event must not jump');
 for(const [x,y] of [[110,98],[120,95],[140,88],[140,88]])v.adjustPointer(x,y);
 positions.push(['x','y','z'].map(k=>v.active()[k]));
 if(action==='duplicate'){assert.deepEqual({...v.state.objects[0],selected:true},source);assert.equal(v.state.objects.filter(o=>o.selected).length,1);assert.equal(v.state.active,1);}
 }
 assert.deepEqual(positions[0],positions[1],`${w}×${h}, zoom ${zoom}, axis ${axis}`);
 }
});
test('pointer displacement is independent of event density and scales inversely with zoom',()=>{
 const positions=[];for(const count of [1,8,60]){const v=makeView();v.begin('duplicate');v.adjustPointer(0,0);for(let i=1;i<=count;i++)v.adjustPointer(40*i/count,-10*i/count);positions.push(v.active().x);}assert.equal(positions[0],positions[1]);assert.equal(positions[0],positions[2]);
 const amounts=[];for(const zoom of [.5,1,2]){const v=makeView();v.state.zoom=zoom;v.begin('move');v.adjustPointer(0,0);v.adjustPointer(40,-10);amounts.push(v.modal.amount);}assert.ok(Math.abs(amounts[0]-2*amounts[1])<1e-10);assert.ok(Math.abs(amounts[1]-2*amounts[2])<1e-10);
});
test('cancel duplicate restores the entire scene and does not add undo history',()=>{const v=makeView();v.active().x=1.2;v.state.zoom=1.6;const before=structuredClone(v.state);v.begin('duplicate');v.adjustPointer(0,0);v.adjustPointer(40,10);v.cancel();assert.deepEqual(v.state,before);assert.equal(v.history.length,0);assert.equal(v.future.length,0);v.apply('delete');assert.equal(v.begin('duplicate'),false);});
test('resize and new axis re-anchor pointer without a sudden jump',()=>{const v=makeView();v.begin('move');v.adjustPointer(10,10);v.adjustPointer(40,10);const amount=v.modal.amount;v.canvas.clientWidth=350;v.adjustPointer(200,100);assert.equal(v.modal.amount,amount);v.constrain('z');v.adjustPointer(300,100);assert.equal(v.modal.amount,amount);assert.equal(v.active().x,0);});
test('invalid pointer samples are ignored and preview snapshots stay immutable',()=>{const v=makeView();v.begin('duplicate');const before=structuredClone(v.modal.base);v.adjustPointer(NaN,1);v.adjust(Infinity);v.adjustPointer(0,0);v.adjustPointer(30,0);v.adjustPointer(30,0);assert.deepEqual(v.modal.base,before);assert.equal(v.state.objects.length,2);v.confirm();v.apply('undo');assert.deepEqual(v.state,before);v.apply('redo');assert.equal(v.state.objects.length,2);});
test('switching between trainer arrow adjustment and pointer movement does not jump',()=>{const v=makeView();v.begin('duplicate');v.adjustPointer(0,0);v.adjustPointer(30,0);v.nudge(.25);const amount=v.modal.amount;v.adjustPointer(300,200);assert.equal(v.modal.amount,amount);v.adjustPointer(310,200);assert.ok(v.modal.amount>amount);});
test('undo snapshot memory is bounded during repeated practice',()=>{const v=makeView();for(let i=0;i<120;i++){v.begin('move');v.adjust(.1);v.confirm();}assert.equal(v.history.length,100);});
test('introductory free Move follows screen displacement on XY with rotated cameras and zoom',()=>{
 for(const yaw of [0,.55,2.1,-1.3])for(const pitch of [.12,.55,1.3])for(const zoom of [.4,1,2.1])for(const [w,h] of [[320,300],[700,345],[1280,500]]){
 const v=makeView();Object.assign(v.state,{yaw,pitch,zoom,panX:17,panY:-9});v.canvas.clientWidth=w;v.canvas.clientHeight=h;v.active().z=.2;
 const source=structuredClone(v.active()),a=v.project([source.x,source.y,source.z]);v.begin('move',{freeXY:true});v.adjustPointer(100,100);assert.deepEqual(v.active(),source);v.adjustPointer(108,97);
 const o=v.active(),b=v.project([o.x,o.y,o.z]);assert.ok(Math.abs(b[0]-a[0]-8)<1e-8);assert.ok(Math.abs(b[1]-a[1]+3)<1e-8);assert.equal(o.z,source.z);assert.equal(o.selected,true);assert.equal(v.modal.moved,true);
 }
});
test('free Move supports horizontal, vertical and diagonal input without accumulated drift',()=>{
 const results=[];for(const count of [1,8,60]){const v=makeView();v.begin('move',{freeXY:true});v.adjustPointer(100,100);for(let i=1;i<=count;i++)v.adjustPointer(120*i/count+100,100-20*i/count);const before=structuredClone(v.active());v.adjustPointer(220,80);assert.deepEqual(v.active(),before);results.push(before);}
 assert.deepEqual(results[0],results[1]);assert.deepEqual(results[0],results[2]);assert.notEqual(results[0].x,0);assert.notEqual(results[0].y,0);assert.equal(results[0].z,0);
 const v=makeView();v.state.yaw=0;v.begin('move',{freeXY:true});v.adjustPointer(10,10);v.adjustPointer(10,0);assert.ok(Math.abs(v.active().x)<1e-10);assert.notEqual(v.active().y,0);assert.ok(v.modal.moved,'Y-only movement can complete the exercise');
});
test('free Move small deltas stay small, zoom reduces displacement, and horizon rays are ignored',()=>{
 const distances=[];for(const zoom of [.4,1,2.1]){const v=makeView();v.state.zoom=zoom;v.begin('move',{freeXY:true});v.adjustPointer(100,100);v.adjustPointer(101,99);distances.push(Math.hypot(v.active().x,v.active().y));assert.ok(distances.at(-1)<.2);const before=structuredClone(v.active());v.adjustPointer(101,-100000);assert.deepEqual(v.active(),before);v.adjustPointer(102,98);assert.ok(Math.hypot(v.active().x,v.active().y)<.4);}
 assert.ok(distances[0]>distances[1]&&distances[1]>distances[2]);
});
test('free Move resize and arrow handover re-anchor without jumps',()=>{
 const v=makeView();v.begin('move',{freeXY:true});v.adjustPointer(10,10);v.adjustPointer(30,0);v.nudge(.25);const before=structuredClone(v.active());v.adjustPointer(300,200);assert.deepEqual(v.active(),before);v.canvas.clientWidth=350;v.adjustPointer(50,50);assert.deepEqual(v.active(),before);v.adjustPointer(51,49);assert.equal(v.active().z,0);assert.notDeepEqual(v.active(),before);
});
test('free Move confirm, cancel, undo and redo preserve the original scene and selection',()=>{
 const v=makeView(),before=structuredClone(v.state);v.begin('move',{freeXY:true});v.adjustPointer(10,10);v.adjustPointer(40,0);v.cancel();assert.deepEqual(v.state,before);assert.equal(v.history.length,0);
 v.begin('move',{freeXY:true});v.adjustPointer(10,10);v.adjustPointer(40,0);v.confirm();const after=structuredClone(v.state);assert.equal(v.modal,null);assert.equal(v.active().selected,true);v.apply('undo');assert.deepEqual(v.state,before);v.apply('redo');assert.deepEqual(v.state,after);
 for(const axis of ['x','y','z']){v.reset();v.begin('move',{freeXY:true});v.constrain(axis);v.adjust(2);assert.equal(v.active()[axis],2);for(const other of ['x','y','z'].filter(k=>k!==axis))assert.equal(v.active()[other],0);}
});
