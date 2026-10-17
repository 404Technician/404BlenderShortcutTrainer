import {lessons} from './lessons.js';
import {isValidScene} from './viewport.js';
import {sanitizeStarts,bestSteps} from './exercise-state.js';
const KEY='tavi-academy-v1';
const emptyProgress=()=>({lesson:0,step:0,completed:[],finished:false,starts:{},bestSteps:lessons.map(()=>0)});
export class Progress{
 constructor(storage){
 this.storage=storage;this.available=true;this.recovered=false;this.data=emptyProgress();let raw;
 try{raw=storage.getItem(KEY);}catch{this.available=false;return;}
 if(!raw)return;
 let d;try{d=JSON.parse(raw);}catch{this.recovered=true;return;}
 if(!d||!Number.isInteger(d.lesson)||d.lesson<0||d.lesson>=lessons.length||!Number.isInteger(d.step)||d.step<0||!Array.isArray(d.completed)){this.recovered=true;return;}
 const completed=[];for(let i=0;i<lessons.length&&d.completed.includes(i);i++)completed.push(i);
 const reachable=Math.min(completed.length,lessons.length-1),lesson=Math.min(d.lesson,reachable);
 this.data={lesson,step:0,completed,finished:d.finished===true&&completed.length===lessons.length,starts:sanitizeStarts(d.starts)};
 const validStep=d.step<lessons[lesson].steps.length&&lesson===d.lesson;
 if(validStep&&isValidScene(d.scene)){
 this.data.step=d.step;this.data.scene=d.scene;
 for(const key of ['history','future'])this.data[key]=Array.isArray(d[key])&&d[key].length<=100&&d[key].every(isValidScene)?d[key]:[];
 }else if(d.scene||d.step){this.recovered=true;}
 this.data.bestSteps=bestSteps({...this.data,bestSteps:d.bestSteps});
 }
 save(){try{this.storage.setItem(KEY,JSON.stringify(this.data));}catch{this.available=false;}}
 reset(){this.data=emptyProgress();this.recovered=false;this.save();}
}
