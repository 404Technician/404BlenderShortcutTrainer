import {lessons} from './lessons.js';
import {isValidScene} from './viewport.js';

export const stepKey=(lesson,step)=>`${lesson}:${step}`;
export const captureStart=view=>structuredClone({scene:view.state,history:view.history,future:view.future});
export const validStart=s=>!!s&&isValidScene(s.scene)&&['history','future'].every(k=>Array.isArray(s[k])&&s[k].length<=100&&s[k].every(isValidScene));
export function sanitizeStarts(starts){
 const clean={};if(!starts||typeof starts!=='object'||Array.isArray(starts))return clean;
 lessons.forEach((l,i)=>l.steps.forEach((_,j)=>{const key=stepKey(i,j);if(validStart(starts[key]))clean[key]=structuredClone(starts[key]);}));return clean;
}
export function restoreStart(view,start){view.cancel();const s=structuredClone(start);view.state=s.scene;view.history=s.history;view.future=s.future;view.draw();}
// Compatibility fallback for old saves: replay the lesson prerequisites using the
// same viewport operations. New visits use exact persisted starting snapshots.
export function initializeStep(view,lesson,step){
 view.reset();for(const s of lessons[lesson].steps.slice(0,step)){
 if(s.modal){view.begin(s.action,{freeXY:s.freeXY===true,viewAligned:s.viewAligned===true});if(s.axis)view.constrain(s.axis);view.adjust(s.numeric||1.1);if(s.cancel)view.cancel();else view.confirm();}
 else if(['orbit','pan','zoom'].includes(s.action))view.navigate(s.action,80,25);
 else if(s.action!=='search')view.apply(s.action);
 }
 return captureStart(view);
}
export function bestSteps(data){
 return lessons.map((l,i)=>data.completed.includes(i)?l.steps.length:Math.max(i===data.lesson?data.step:0,Array.isArray(data.bestSteps)&&Number.isInteger(data.bestSteps[i])&&data.bestSteps[i]>=0&&data.bestSteps[i]<=l.steps.length?data.bestSteps[i]:0));
}
