// Indexed, outward-wound quad mesh. Object transforms stay separate from mesh coordinates.
export const cubeMesh=()=>({vertices:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],faces:[[3,2,1,0],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]],selectedFace:5});
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const unit=a=>{const n=Math.hypot(...a);return a.map(v=>v/(n||1));};
export function normal(points){const a=sub(points[1],points[0]),b=sub(points[2],points[0]);return unit([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]);}
export const center=points=>points[0].map((_,i)=>points.reduce((s,p)=>s+p[i],0)/points.length);
export function multiplyQuaternion(a,b){
 const [w,x,y,z]=a,[v,i,j,k]=b;
 return unit([w*v-x*i-y*j-z*k,w*i+x*v+y*k-z*j,w*j-x*k+y*v+z*i,w*k+x*j-y*i+z*v]);
}
export const axisQuaternion=(axis,angle)=>{const n=unit(axis),s=Math.sin(angle/2);return [Math.cos(angle/2),...n.map(v=>v*s)];};
export function objectQuaternion(o){return o.rotation||multiplyQuaternion(axisQuaternion([0,0,1],o.rz),multiplyQuaternion(axisQuaternion([0,1,0],o.ry),axisQuaternion([1,0,0],o.rx)));}
export function rotateVector(p,q){
 const [w,x,y,z]=q,[a,b,c]=p,t=[2*(y*c-z*b),2*(z*a-x*c),2*(x*b-y*a)];
 return [a+w*t[0]+y*t[2]-z*t[1],b+w*t[1]+z*t[0]-x*t[2],c+w*t[2]+x*t[1]-y*t[0]];
}
export const validQuaternion=q=>Array.isArray(q)&&q.length===4&&q.every(Number.isFinite)&&Math.abs(Math.hypot(...q)-1)<1e-6;
export function transform([x,y,z],o){
 x*=o.sx;y*=o.sy;z*=o.sz;
 if(o.rotation){const p=rotateVector([x,y,z],o.rotation);return p.map((v,i)=>v+[o.x,o.y,o.z][i]);}
 let a=o.rx;[y,z]=[y*Math.cos(a)-z*Math.sin(a),y*Math.sin(a)+z*Math.cos(a)];
 a=o.ry;[x,z]=[x*Math.cos(a)+z*Math.sin(a),-x*Math.sin(a)+z*Math.cos(a)];
 a=o.rz;[x,y]=[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];
 return [x+o.x,y+o.y,z+o.z];
}
export function editFace(source,action,amount){
 const mesh=structuredClone(source);if(amount<=1e-6)return mesh;
 const ids=mesh.faces[mesh.selectedFace],points=ids.map(i=>mesh.vertices[i]);
 const n=normal(points),c=center(points),start=mesh.vertices.length;
 const ring=points.map(p=>action==='extrude'?p.map((v,i)=>v+n[i]*amount):p.map((v,i)=>c[i]+(v-c[i])*(1-Math.min(.85,amount))));
 mesh.vertices.push(...ring);
 const next=ids.map((_,i)=>start+i);
 // Replace the old cap with a connected side/rim loop and a new cap.
 mesh.faces.splice(mesh.selectedFace,1);
 ids.forEach((id,i)=>{const j=(i+1)%ids.length;mesh.faces.push([id,ids[j],next[j],next[i]]);});
 mesh.faces.push(next);mesh.selectedFace=mesh.faces.length-1;return mesh;
}
export function objectMesh(o){
 if(o.mesh)return o.mesh;
 // Upgrade existing saved exercises without changing their progress or storage key.
 let mesh=cubeMesh();if(o.extrusion>0)mesh=editFace(mesh,'extrude',o.extrusion);
 if(o.inset>0)mesh=editFace(mesh,'inset',o.inset);return mesh;
}
export function meshEdges(mesh){
 const edges=new Map();mesh.faces.forEach((face,f)=>face.forEach((a,i)=>{const b=face[(i+1)%face.length],key=[a,b].sort((a,b)=>a-b).join(':');if(!edges.has(key))edges.set(key,{a,b,faces:[]});edges.get(key).faces.push(f);}));return [...edges.values()];
}
export function validMesh(m){
 if(!(!!m&&Array.isArray(m.vertices)&&m.vertices.length>=8&&m.vertices.length<=2048&&m.vertices.every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite))&&Array.isArray(m.faces)&&m.faces.length>=6&&m.faces.length<=2048&&m.faces.every(f=>Array.isArray(f)&&f.length===4&&new Set(f).size===4&&f.every(i=>Number.isInteger(i)&&i>=0&&i<m.vertices.length))&&Number.isInteger(m.selectedFace)&&m.selectedFace>=0&&m.selectedFace<m.faces.length))return false;
 const directed=new Set();
 for(const f of m.faces){
 const p=f.map(i=>m.vertices[i]),n=normal(p);
 if(Math.hypot(...n)<.9||Math.abs(dot(n,sub(p[3],p[0])))>1e-7)return false;
 for(let i=0;i<4;i++){const key=`${f[i]}:${f[(i+1)%4]}`;if(directed.has(key))return false;directed.add(key);}
 }
 return meshEdges(m).every(e=>e.faces.length===2&&directed.has(`${e.a}:${e.b}`)&&directed.has(`${e.b}:${e.a}`));
}
export function camera(s,w,h){
 const a=s.yaw,b=s.pitch,right=[Math.cos(a),-Math.sin(a),0],up=[-Math.sin(a)*Math.sin(b),-Math.cos(a)*Math.sin(b),Math.cos(b)],toward=[Math.sin(a)*Math.cos(b),Math.cos(a)*Math.cos(b),Math.sin(b)];
 return {right,up,toward,position:toward.map(v=>v*8),focal:520*Math.min(w/700,h/345)*s.zoom,cx:w*.5+s.panX,cy:h*.56+s.panY,near:.2};
}
export function cameraPoint(p,cam){return [dot(p,cam.right),dot(p,cam.up),8-dot(p,cam.toward)];}
export function screenPoint(p,cam){return [cam.cx+cam.focal*p[0]/p[2],cam.cy-cam.focal*p[1]/p[2],p[2]];}
export function projectPoint(p,s,w,h){const cam=camera(s,w,h);return screenPoint(cameraPoint(p,cam),cam);}
export function rayOnXY(x,y,z,s,w,h){
 const cam=camera(s,w,h),u=(x-cam.cx)/cam.focal,v=(cam.cy-y)/cam.focal;
 const direction=cam.toward.map((n,i)=>-n+u*cam.right[i]+v*cam.up[i]);
 if(Math.abs(direction[2])<1e-6)return null;
 const t=(z-cam.position[2])/direction[2];
 // Ignore rays behind the camera or too close to the horizon to be useful for practice.
 if(t<cam.near||t>64)return null;
 return [cam.position[0]+direction[0]*t,cam.position[1]+direction[1]*t,z];
}
export function clipNear(points,near){
 const out=[];points.forEach((b,i)=>{const a=points[(i+points.length-1)%points.length],ai=a[2]>=near,bi=b[2]>=near;if(ai!==bi){const t=(near-a[2])/(b[2]-a[2]);out.push(a.map((v,k)=>v+(b[k]-v)*t));}if(bi)out.push(b);});return out;
}
