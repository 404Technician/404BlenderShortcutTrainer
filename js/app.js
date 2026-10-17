import {lessons,deck} from './lessons.js';
import {InputEngine,normalizeKey} from './input-engine.js';
import {Viewport,initialScene} from './viewport.js';
import {Progress} from './progress.js';
import {stepKey,captureStart,restoreStart,initializeStep,prepareStep} from './exercise-state.js';
const $=id=>document.getElementById(id),engine=new InputEngine(),view=new Viewport($('canvas'));
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('Unavailable');},setItem(){throw Error('Unavailable');}};}
const progress=new Progress(storage);
let lesson=progress.data.lesson,stepIndex=progress.data.step,busy=false,hints=0,mistakes=0,drag=null,advanceTimer=null,pendingAdvance=null,demoTimer=null,demoSnapshot=null;
if(progress.data.scene){try{if(Array.isArray(progress.data.scene.objects)&&['object','edit'].includes(progress.data.scene.mode)){view.state=progress.data.scene;view.history=progress.data.history||[];view.future=progress.data.future||[];view.draw();}}catch{view.reset();}}
const current=()=>lessons[lesson].steps[stepIndex];
const final=()=>lesson===5;
const pose=(name,alt)=>{$('tavi').src=`./assets/tavi/tavi-${name}.webp`;$('tavi').alt=alt;};
let lastInstructionId=null,instructionAnimation=null;
function drawShortcut(target,keys){
 keys.forEach((key,i)=>{
 if(i){const arrow=document.createElement('span');arrow.textContent='→';arrow.setAttribute('aria-label','then');target.append(arrow);}
 key.split(' + ').forEach((part,j)=>{
 if(j){const plus=document.createElement('span');plus.textContent='+';plus.setAttribute('aria-label','hold together');target.append(plus);}
 const k=document.createElement('kbd');k.textContent=part;k.dataset.key=part.toLowerCase();target.append(k);
 });
 });
}
function updateInstructionPanel(){
 $('instructor-intro').hidden=lesson!==0||stepIndex!==0;
 const id=`${lesson}:${current().id}`;
 if(id===lastInstructionId)return;
 lastInstructionId=id;instructionAnimation?.cancel();
 if(progress.data.finished&&lesson===5)return;
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
 instructionAnimation=$('instruction-panel').animate?.([
 {backgroundColor:'#e4d6f5',boxShadow:'0 0 0 3px #c7b0eb66'},
 {backgroundColor:'#eee8f8',boxShadow:'0 0 0 0 transparent'}
 ],{duration:400,easing:'ease-out'});
 }
}
function persist(){progress.data.lesson=lesson;progress.data.step=stepIndex;progress.data.scene=structuredClone(view.state);progress.data.history=structuredClone(view.history);progress.data.future=structuredClone(view.future);progress.save();}
function syncViewport(){const s=view.state;$('mode').textContent=s.mode.toUpperCase()+' MODE';$('selection-mode').textContent=s.mode==='edit'?`${s.selection} · ${s.top?'top face selected':'choose a component'}`:`${s.objects.length} object${s.objects.length===1?'':'s'} · ${s.objects.filter(o=>o.selected).length} selected`;}
function keyGuide(){const s=current();$('key-guide').replaceChildren();$('instruction-shortcut').replaceChildren();if(final()&&hints<2){const text=document.createElement('small');text.textContent='Recall the shortcut. A hint is always available.';$('key-guide').append(text);const reminder=document.createElement('small');reminder.textContent='Try recalling the keys, or ask Tavi for a hint.';$('instruction-shortcut').append(reminder);return;}
 const prompt=document.createElement('span');prompt.className='shortcut-prompt';prompt.textContent=lesson===0?'Use':s.keys[0]==='LMB'?'Click':'Press';$('instruction-shortcut').append(prompt);
 drawShortcut($('instruction-shortcut'),s.keys);drawShortcut($('key-guide'),s.keys);
 if(s.modal&&!s.numeric){const note=document.createElement('small');note.textContent=s.cancel?'then Esc / right-click':'then adjust + Enter / left-click · arrows adjust in this trainer';$('key-guide').append(note);}
}
function render(){
 const beforePreparation=JSON.stringify(view.state);prepareStep(view.state,current());
 if(JSON.stringify(view.state)!==beforePreparation){progress.data.starts[stepKey(lesson,stepIndex)]=captureStart(view);view.draw();persist();}
 if(!progress.data.finished&&!progress.data.starts[stepKey(lesson,stepIndex)]){progress.data.starts[stepKey(lesson,stepIndex)]=captureStart(view);persist();}
 const s=current();engine.reset(s.keys);busy=false;hints=0;mistakes=0;$('nav-demo').textContent='Show navigation demonstration';$('nav-demo').onclick=navigationDemo;$('lesson-label').textContent=`LESSON ${lesson+1} OF 6`;$('lesson-title').textContent=lessons[lesson].title;$('dialogue').textContent=lessons[lesson].intro;$('mission').textContent=s.mission;$('explanation').textContent=s.explanation;$('hint-text').textContent='';$('feedback').textContent=progress.available?'Click Start practice, then follow Tavi’s mission.':'Local storage is unavailable. You can practice, but progress will not survive reload.';$('exercise-count').textContent=`Exercise ${stepIndex+1} / ${lessons[lesson].steps.length}`;$('operation').textContent='Focus the viewport to practice';$('navigation-alternative').hidden=lesson!==0;$('completion').hidden=!progress.data.finished;pose(final()?'thinking':lesson===0?'welcome':lesson===3?'sitting':'teaching',final()?'Tavi thinking about your challenge':'Tavi guiding your current lesson');keyGuide();renderNav();syncViewport();
 if(document.activeElement===$('practice'))$('feedback').textContent='Ready for the next mission. Your practice area is active.';
 if(progress.recovered){$('feedback').textContent='Saved data could not be restored safely. This lesson has restarted; completed lessons are kept.';progress.recovered=false;}
 updateInstructionPanel();
 if(progress.data.finished&&lesson===5){busy=true;$('mission').textContent='Course complete. Replay a lesson or explore your Shortcut Deck.';$('explanation').textContent='Take what you learned into Blender and make something of your own.';$('dialogue').textContent='You did it! Ready to make something?';$('key-guide').replaceChildren();$('instruction-shortcut').replaceChildren();pose('celebrating','Tavi celebrating your completed course');$('operation').textContent='Course complete ✓';}
}
function renderNav(){const count=lessons.reduce((sum,l)=>sum+l.steps.length,0);const done=progress.data.bestSteps.reduce((sum,n)=>sum+n,0);$('previous-step').disabled=lesson===0&&stepIndex===0&&!progress.data.finished;const firstIncomplete=lessons.findIndex((_,i)=>!progress.data.completed.includes(i));$('progress-label').textContent=`${Math.round(done/count*100)}% complete`;$('lesson-nav').replaceChildren();lessons.forEach((l,i)=>{const b=document.createElement('button');b.textContent=`${progress.data.completed.includes(i)?'✓':i+1}  ${['Look Around','Transform','Axes','Edit Mode','Survival','Final Challenge'][i]}`;b.className=i===lesson?'current':progress.data.completed.includes(i)?'done':'';b.disabled=i!==lesson&&!progress.data.completed.includes(i)&&i!==firstIncomplete;if(i===lesson)b.setAttribute('aria-current','step');b.onclick=()=>selectLesson(i);$('lesson-nav').append(b);});}
function releaseDrag(){if(drag&&$('canvas').hasPointerCapture?.(drag.pointerId))$('canvas').releasePointerCapture(drag.pointerId);drag=null;}
function resetTransient(){clearTimeout(advanceTimer);if(pendingAdvance){const finish=pendingAdvance;pendingAdvance=null;finish();}clearTimeout(demoTimer);if(demoSnapshot){view.state=demoSnapshot.state;view.history=demoSnapshot.history;view.future=demoSnapshot.future;demoSnapshot=null;view.draw();}view.cancel();busy=false;releaseDrag();$('search-panel').hidden=true;$('delete-panel').hidden=true;}
function selectLesson(i){resetTransient();lesson=i;stepIndex=0;progress.data.finished=false;view.reset();progress.data.starts[stepKey(lesson,0)]=captureStart(view);persist();lastInstructionId=null;render();}
function message(text,success=false){$('feedback').textContent=text;pose(success?'celebrating':'thinking',success?'Tavi celebrating a correct action':'Tavi offering encouragement');}
function wrong(){mistakes++;const s=current();message(view.modal?(engine.index===s.keys.length?'The tool is already active. Adjust it, then confirm — or cancel to start again.':`The tool is active. Next press ${s.keys[engine.index]}. Esc cancels so you can start again.`):mistakes>1?`Let's try again. ${s.hints[1]}`:'Almost! Check the mission and try again.');}
function success(){
 if(busy)return;busy=true;syncViewport();const responses={move:'That move is confirmed.',duplicate:'Your copy is in place.',rotate:'That rotation is confirmed.',scale:'Your new size is confirmed.',extrude:'You added connected geometry.',inset:'Your top face has a border.',top:'Just the top face is selected.',save:'Practice save recorded.',undo:'The last action is reversed.',redo:'The action is back.'};message(current().cancel?'Good catch! Cancelling puts the cube back.':`✓ Nice! ${responses[current().action]||'That’s one less menu you’ll need.'}`,true);$('operation').textContent='Action complete ✓';
 const next={...progress.data,starts:{...progress.data.starts},bestSteps:[...progress.data.bestSteps],lesson,step:stepIndex+1,scene:structuredClone(view.state),history:structuredClone(view.history),future:structuredClone(view.future)};
 if(next.step===lessons[lesson].steps.length){next.completed=[...new Set([...next.completed,lesson])];if(lesson===5){next.finished=true;next.step=stepIndex;}else{next.lesson++;next.step=0;next.scene=initialScene();next.history=[];next.future=[];}}
 next.bestSteps[lesson]=Math.max(next.bestSteps[lesson],stepIndex+1);
 if(!next.finished)prepareStep(next.scene,lessons[next.lesson].steps[next.step]);
 if(!next.finished)next.starts[stepKey(next.lesson,next.step)]=structuredClone({scene:next.scene,history:next.history,future:next.future});
 // Commit before the feedback delay so reloading or opening the deck cannot lose a completed action.
 progress.data=next;progress.save();
 pendingAdvance=()=>{lesson=next.lesson;stepIndex=next.step;view.state=structuredClone(next.scene);view.history=structuredClone(next.history);view.future=structuredClone(next.future);view.draw();if(next.finished&&lesson===5){renderNav();$('completion').hidden=false;$('dialogue').textContent='You did it! Now create something of your own.';pose('celebrating','Tavi celebrating your completed course');$('operation').textContent='Course complete ✓';$('feedback').textContent='Your Shortcut Deck is ready whenever you need a reminder.';$('completion').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});return;}render();if(document.activeElement===$('practice'))$('operation').textContent='Training active · follow the mission';};
 advanceTimer=setTimeout(()=>{const finish=pendingAdvance;pendingAdvance=null;finish?.();},750);
}
function cancel(){if(!view.modal&&!$('delete-panel').hidden){$('delete-panel').hidden=true;engine.reset(current().keys);message('Deletion cancelled. Try X again when you’re ready.');return;}
 if(view.modal){view.cancel();syncViewport();engine.reset(current().keys);if(current().cancel)success();else{message(['extrude','duplicate'].includes(current().action)?'Trainer preview reset. In Blender, cancelling this movement leaves the new geometry or copy; Undo removes it.':'Cancelled. Nothing lost — start the shortcut again.');$('operation').textContent='Cancelled · start again';}return;}
 $('exit').focus();$('operation').textContent='Training paused';}
function confirm(){const s=current();if(view.modal){if(s.cancel){message('For this mission, cancel with Esc or right-click.');return;}if(engine.index<s.keys.length){message('Finish the axis or numeric sequence before confirming.');return;}if(!view.modal.moved){message('Move your pointer to adjust the operation before confirming.');return;}if(['scale','extrude'].includes(s.action)&&view.modal.amount<=0){message('For this mission, make it bigger or pull upward before confirming.');return;}view.confirm();success();}}
function accept(token,event){
 if(busy)return;
 const s=current();if(token==='esc'){cancel();return;}
 if(token==='enter'&&view.modal&&!s.numeric){confirm();return;}
 const result=engine.feed(token);
 if(result.status==='timeout'){view.cancel();$('delete-panel').hidden=true;engine.reset(s.keys);syncViewport();$('operation').textContent='Sequence reset · start again';message('That sequence timed out. Start it again; take up to 15 seconds between keys.');return;}
 if(result.status==='wrong'){wrong();return;}
 const index=engine.index;
 if(s.modal){
 if(index===1){if(!view.begin(s.action)){engine.reset(s.keys);message('Select an object before starting this tool. Restart the lesson if your scene is empty.');return;}$('operation').textContent=`${s.action.toUpperCase()} active · move pointer · Enter confirms · Esc cancels`;}
 if(s.axis&&token===s.axis){view.constrain(s.axis);$('operation').textContent=`${s.action.toUpperCase()} on ${s.axis.toUpperCase()} · adjust then confirm`;}
 if(s.numeric&&token===String(s.numeric)){view.adjust(s.numeric);$('operation').textContent=`Z: ${s.numeric} units · Enter confirms`;}
 if(s.numeric&&result.status==='matched'){view.confirm();success();}
 syncViewport();return;
 }
 if(s.action==='delete'){if(index===1){$('delete-panel').hidden=false;$('operation').textContent='Delete confirmation open · Enter or Esc';return;}$('delete-panel').hidden=true;view.apply('delete');success();return;}
 if(result.status==='matched'){
 if(s.action==='search'){openSearch();return;}
 if(['orbit','pan','zoom'].includes(s.action)){success();return;}
 view.apply(s.action);syncViewport();success();
 }
}
function openSearch(){ $('search-panel').hidden=false;$('command-search').value='';$('search-results').textContent='Move · Rotate · Scale · Extrude Region · Inset Faces';$('command-search').focus();$('feedback').textContent='Search example open. Press Esc or close this example to continue.';}
function closeSearch(){if($('search-panel').hidden)return;$('search-panel').hidden=true;$('practice').focus();success();}
$('command-search').addEventListener('input',()=>{const q=$('command-search').value.toLowerCase();$('search-results').textContent=deck.filter(d=>d.name.toLowerCase().includes(q)).map(d=>d.name).slice(0,6).join(' · ')||'No matching command. Try “Extrude”.';});
$('search-panel').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeSearch();}});$('close-search').onclick=closeSearch;
$('practice').addEventListener('keydown',e=>{
 if(!$('search-panel').hidden){if(e.key==='Escape'){e.preventDefault();closeSearch();}return;}
 if(e.target!==$('practice')||e.repeat)return;
 if(busy){if(e.key==='Escape'){e.preventDefault();$('exit').focus();}return;}
 if(e.key===' '&&['top','select'].includes(current().action)){e.preventDefault();accept('lmb');return;}
 if(view.modal&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&!current().numeric){e.preventDefault();view.nudge(['ArrowRight','ArrowUp'].includes(e.key)?.25:-.25);$('operation').textContent='Trainer arrow adjustment · Enter confirms · Esc cancels';return;}
 if(e.code?.startsWith('Numpad')&&['1','2','3'].includes(e.key)){e.preventDefault();message('Use 1, 2 or 3 on the number row, not the numpad.');return;}
 const token=normalizeKey(e);if(!token)return;
 // Only mode exercises consume Tab; ordinary focus navigation stays available elsewhere.
 if(e.key==='Tab'&&(e.shiftKey||!current().keys.includes('Tab')))return;
 const intercepted=new Set(['g','r','s','x','y','z','e','i','a','tab','1','2','3','enter','esc','shift + d','alt + a','ctrl + z','ctrl + shift + z','ctrl + s','f3']);
 if(!intercepted.has(token))return;
 e.preventDefault();document.querySelectorAll('#key-guide kbd, #instruction-shortcut kbd').forEach(k=>{if(token.split(' + ').includes(k.dataset.key)){k.classList.add('pressed');setTimeout(()=>k.classList.remove('pressed'),220);}});accept(token,e);
});
$('practice').addEventListener('focus',()=>{$('operation').textContent=view.modal?'Operation active · Enter confirms · Esc cancels':'Training active · follow the mission';$('start').textContent='Practice is active';});
$('practice').addEventListener('blur',e=>{if(!$('practice').contains(e.relatedTarget)){releaseDrag();if(view.modal){view.cancel();engine.reset(current().keys);syncViewport();}$('start').textContent='Resume practice →';$('operation').textContent='Training paused · click to resume';}});
$('start').onclick=()=>{$('practice').focus();};$('exit').onclick=()=>{view.cancel();engine.reset(current().keys);syncViewport();$('start').focus();$('operation').textContent='Training paused';};
$('practice').addEventListener('pointerdown',e=>{
 if(e.target!==$('canvas')||busy)return;
 $('practice').focus();
 if(e.button===1){e.preventDefault();if(view.modal){message('Confirm or cancel the active tool before navigating.');return;}drag={x:e.clientX,y:e.clientY,total:0,action:e.shiftKey?'pan':'orbit',pointerId:e.pointerId};$('canvas').setPointerCapture(e.pointerId);return;}
 if(e.button===2){if(view.modal||!$('delete-panel').hidden)cancel();return;}
 if(e.button!==0)return;
 if(view.modal){confirm();return;}
 const s=current();if(['top','select'].includes(s.action)){const rect=$('canvas').getBoundingClientRect();if(view.hit(e.clientX-rect.left,e.clientY-rect.top,s.action==='top'))accept('lmb');else message('Click directly on '+(s.action==='top'?'the top surface of the cube.':'the cube.'));}
});
$('practice').addEventListener('pointermove',e=>{
 if(busy)return;
 if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;drag.total+=Math.abs(dx)+Math.abs(dy);view.navigate(drag.action,dx,dy);return;}
 if(e.target===$('canvas')&&view.modal&&document.activeElement===$('practice')&&!current().numeric){view.adjustPointer(e.clientX,e.clientY);const m=view.modal;$('operation').textContent=`${m.action.toUpperCase()}${m.axis?' · '+m.axis.toUpperCase():''} · ${m.amount.toFixed(2)} · Enter confirms · Esc cancels`;}
});
$('practice').addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.pointerId){const d=drag;releaseDrag();if(d.total>12&&lesson===0&&current().action===d.action)accept(d.action==='pan'?'shift + mmb drag':'mmb drag');else if(lesson===0)message('Hold the middle mouse button and drag a little farther.');}});
$('practice').addEventListener('pointercancel',()=>{releaseDrag();if(view.modal)cancel();});
$('canvas').addEventListener('lostpointercapture',()=>{drag=null;});
$('practice').addEventListener('wheel',e=>{if(document.activeElement!==$('practice')||e.target!==$('canvas'))return;e.preventDefault();if(busy)return;if(view.modal){message('Confirm or cancel the active tool before zooming.');return;}view.navigate('zoom',-e.deltaY*.5,0);if(lesson===0&&current().action==='zoom')accept('wheel');},{passive:false});
$('practice').addEventListener('contextmenu',e=>{if(document.activeElement===$('practice'))e.preventDefault();});
$('practice').addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
$('confirm-delete').onclick=()=>{accept('enter');$('practice').focus();};$('cancel-delete').onclick=()=>{cancel();$('practice').focus();};
$('hint').onclick=()=>{hints++;$('hint-text').textContent=current().hints[Math.min(hints-1,1)];pose('welcome','Tavi helping with a hint');keyGuide();};
function previousStep(){
 resetTransient();let targetLesson=lesson,targetStep=stepIndex;
 if(!progress.data.finished){if(targetStep>0)targetStep--;else if(targetLesson>0){targetLesson--;targetStep=lessons[targetLesson].steps.length-1;}else return;}
 const key=stepKey(targetLesson,targetStep),start=progress.data.starts[key]||initializeStep(view,targetLesson,targetStep);
 restoreStart(view,start);lesson=targetLesson;stepIndex=targetStep;progress.data.finished=false;progress.data.starts[key]=captureStart(view);persist();lastInstructionId=null;render();$('practice').focus();
}
$('previous-step').onclick=previousStep;
$('restart-lesson').onclick=()=>selectLesson(lesson);
$('restart-course').onclick=()=>{resetTransient();progress.reset();lesson=0;stepIndex=0;view.reset();persist();lastInstructionId=null;render();};
$('practice-again').onclick=()=>{progress.data.finished=false;selectLesson(0);$('start').focus();};
function navigationDemo(){if(busy)return;const action=current().action;view.navigate(action,action==='zoom'?90:65,20);$('feedback').textContent=`Demonstration: ${action} changes the view. This is an alternative to physical mouse practice.`;$('nav-demo').textContent='Continue after demonstration';$('nav-demo').onclick=()=>{success();$('nav-demo').textContent='Show navigation demonstration';$('nav-demo').onclick=navigationDemo;};}
$('nav-demo').onclick=navigationDemo;
function demonstration(item){
 resetTransient();const saved=JSON.parse(JSON.stringify(view.state)),history=view.history,future=view.future;demoSnapshot={state:saved,history,future};view.reset();const a=item.action;
 if(['orbit','pan','zoom'].includes(a))view.navigate(a,80,25);
 else if(['move','rotate','scale','duplicate','extrude','inset','numeric','confirm','cancel'].includes(a)){if(['extrude','inset'].includes(a)){view.state.mode='edit';view.state.selection='faces';view.state.top=true;}view.begin(a==='numeric'?'move':['confirm','cancel'].includes(a)?'move':a);if(a==='numeric'){view.constrain('z');view.adjust(2);}else{if(item.shortcut.includes('→'))view.constrain('x');view.adjust(1.1);}if(a==='cancel')view.cancel();else view.confirm();}
 else if(a==='delete')view.apply('delete');else if(a==='undo'||a==='redo'){view.begin('move');view.adjust(1);view.confirm();view.apply('undo');if(a==='redo')view.apply('redo');}else if(a==='search'){$('operation').textContent='Search: Move · Extrude Region · Inset Faces';}else view.apply(a);
 syncViewport();$('deck-status').textContent=`Demonstration: ${item.name}. ${item.description} Watch the practice viewport above.`;$('feedback').textContent=`DEMONSTRATION · ${item.name} · your course progress is unchanged`;$('practice').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});busy=true;
 demoTimer=setTimeout(()=>{view.state=saved;view.history=history;view.future=future;demoSnapshot=null;view.draw();render();},3500);
}
function renderDeck(){const q=$('deck-filter').value.trim().toLowerCase();$('deck-list').replaceChildren();const items=deck.filter(d=>Object.values(d).join(' ').toLowerCase().includes(q));items.forEach(d=>{const b=document.createElement('button');b.className='deck-card';b.setAttribute('aria-label',`Demonstrate ${d.name}: ${d.shortcut}`);const cat=document.createElement('span');cat.className='category';cat.textContent=d.category;const key=document.createElement('kbd');key.textContent=d.shortcut;const name=document.createElement('strong');name.textContent=d.name;const description=document.createElement('small');description.textContent=d.description;const context=document.createElement('small');context.textContent='Context: '+d.context;b.append(cat,key,name,description,context);b.onclick=()=>demonstration(d);$('deck-list').append(b);});if(!items.length){const p=document.createElement('p');p.textContent='No shortcuts found. Try “move” or “face”.';$('deck-list').append(p);}}
$('deck-filter').oninput=renderDeck;render();renderDeck();
