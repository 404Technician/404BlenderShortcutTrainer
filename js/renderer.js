import {camera,cameraPoint,screenPoint,clipNear,objectMesh,transform,normal,center,dot,sub,meshEdges,unit} from './geometry.js';

// Small software depth buffer keeps Canvas, static hosting and zero dependencies.
// Perspective-correct reciprocal depth is shared by surfaces, grid, overlays and picking.
export function renderScene(s,w,h,ratio=1){
 const width=Math.max(1,Math.round(w*ratio)),height=Math.max(1,Math.round(h*ratio)),size=width*height;
 const pixels=new Uint8ClampedArray(size*4),depth=new Float32Array(size).fill(Infinity),pick=new Int32Array(size).fill(-1),records=[];
 for(let i=0;i<size;i++){pixels[i*4]=37;pixels[i*4+1]=37;pixels[i*4+2]=39;pixels[i*4+3]=255;}
 const cam=camera(s,w,h),project=p=>{const q=screenPoint(p,cam);return [q[0]*ratio,q[1]*ratio,q[2]];};
 const paint=(x,y,z,color,id=-1,overlay=false)=>{
 if(x<0||y<0||x>=width||y>=height)return;const i=y*width+x;
 if(z>depth[i]+(overlay?.035:0))return;
 const k=i*4;pixels[k]=color[0];pixels[k+1]=color[1];pixels[k+2]=color[2];
 if(!overlay){depth[i]=z;pick[i]=id;}
 };
 const line=(a,b,color,overlay=false,thickness=1)=>{
 let p=cameraPoint(a,cam),q=cameraPoint(b,cam);
 if(p[2]<cam.near&&q[2]<cam.near)return;
 if(p[2]<cam.near||q[2]<cam.near){const t=(cam.near-p[2])/(q[2]-p[2]),cut=p.map((v,i)=>v+(q[i]-v)*t);if(p[2]<cam.near)p=cut;else q=cut;}
 p=project(p);q=project(q);const dx=q[0]-p[0],dy=q[1]-p[1];let lo=0,hi=1;
 // Clip in screen space before rasterizing long world/grid lines.
 for(const [v,d,max] of [[p[0],dx,width-1],[p[1],dy,height-1]]){if(Math.abs(d)<1e-9){if(v<0||v>max)return;}else{const t0=-v/d,t1=(max-v)/d;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));}}
 if(lo>hi)return;const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))*(hi-lo))),radius=Math.max(0,Math.floor(thickness*ratio/2));
 for(let j=0;j<=steps;j++){const t=lo+(hi-lo)*j/steps,x=Math.round(p[0]+dx*t),y=Math.round(p[1]+dy*t),z=1/((1-t)/p[2]+t/q[2]);for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++)paint(x+ox,y+oy,z,color,-1,overlay);}
 };
 const triangle=(a,b,c,color,id)=>{
 const area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(area)<1e-8)return;
 const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
 const px=x+.5,py=y+.5,wb=((px-a[0])*(c[1]-a[1])-(py-a[1])*(c[0]-a[0]))/area,wc=((b[0]-a[0])*(py-a[1])-(b[1]-a[1])*(px-a[0]))/area,wa=1-wb-wc;
 if(wa>=-1e-7&&wb>=-1e-7&&wc>=-1e-7)paint(x,y,1/(wa/a[2]+wb/b[2]+wc/c[2]),color,id);
 }
 };
 // Grid is a viewport background overlay: coplanar grid lines must not scar a solid face.
 for(let i=-10;i<=10;i++){line([i,-10,0],[i,10,0],i===0?[112,151,98]:[53,53,56],true);line([-10,i,0],[10,i,0],i===0?[174,82,88]:[53,53,56],true);}
 const prepared=[];
 s.objects.forEach((o,object)=>{
 if(o.hidden)return;const mesh=objectMesh(o),vertices=mesh.vertices.map(p=>transform(p,o)),visible=[];
 mesh.faces.forEach((ids,face)=>{
 const points=ids.map(i=>vertices[i]),n=normal(points),front=dot(n,sub(cam.position,center(points)))>1e-8;visible[face]=front;if(!front)return;
 // A restrained camera-relative studio key; flat normals preserve sharp corners.
 const viewNormal=[dot(n,cam.right),dot(n,cam.up),dot(n,cam.toward)],brightness=.47+.38*Math.max(0,dot(viewNormal,unit([-.35,.75,.65]))),gray=Math.round(205*brightness);
 const selected=o.selected&&(!s.top||face===mesh.selectedFace),tint=s.mode==='edit'&&s.selection==='faces'&&selected;
 const color=tint?[Math.round(gray*.65+255*.35),Math.round(gray*.65+153*.35),Math.round(gray*.65+57*.35)]:[gray,gray,gray];
 const clipped=clipNear(points.map(p=>cameraPoint(p,cam)),cam.near).map(project);if(clipped.length<3)return;
 const id=records.length;records.push({object,face,top:face===mesh.selectedFace});
 for(let i=1;i<clipped.length-1;i++)triangle(clipped[0],clipped[i],clipped[i+1],color,id);
 });prepared.push({o,mesh,vertices,visible});
 });
 // Draw overlays only after every object has contributed to the depth buffer.
 for(const {o,mesh,vertices,visible} of prepared){
 const selectedIds=new Set(s.top?mesh.faces[mesh.selectedFace]:mesh.vertices.map((_,i)=>i));
 for(const e of meshEdges(mesh)){
 const count=e.faces.filter(f=>visible[f]).length;
 if(s.mode==='object'){if(o.selected&&count===1)line(vertices[e.a],vertices[e.b],[255,153,57],true,1.5);}
 else if(count){const selected=o.selected&&selectedIds.has(e.a)&&selectedIds.has(e.b);line(vertices[e.a],vertices[e.b],selected?[255,153,57]:[40,40,40],true,s.selection==='edges'?1.5:1);}
 }
 if(s.mode==='edit'&&s.selection==='vertices')vertices.forEach((v,i)=>{
 const cp=cameraPoint(v,cam);if(cp[2]<cam.near||!mesh.faces.some((f,j)=>visible[j]&&f.includes(i)))return;const p=project(cp),r=Math.max(2,Math.round(3*ratio));
 const color=o.selected&&selectedIds.has(i)?[255,176,81]:[30,30,30];
 for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r)paint(Math.round(p[0])+x,Math.round(p[1])+y,p[2],color,-1,true);
 });
 }
 if(s.modalAxis){const i='xyz'.indexOf(s.modalAxis),a=[0,0,0],b=[0,0,0];a[i]=-10;b[i]=10;line(a,b,[[210,83,91],[112,173,94],[102,140,233]][i],true);}
 return {pixels,depth,pick,records,width,height,ratio};
}
