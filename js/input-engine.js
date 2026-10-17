export function normalizeKey(event){
 const key=event.key.toLowerCase();
 if(['control','shift','alt','meta'].includes(key))return null;
 const parts=[];
 if(event.ctrlKey||event.metaKey)parts.push('ctrl');
 if(event.altKey)parts.push('alt');
 if(event.shiftKey)parts.push('shift');
 parts.push(key==='escape'?'esc':key);
 return parts.join(' + ');
}
export class InputEngine{
 constructor(){this.reset([]);}
 reset(expected){this.expected=expected.map(k=>k.toLowerCase());this.index=0;this.last=0;}
 feed(token,now=Date.now()){
 token=token.toLowerCase();
 if(this.index>0&&this.index<this.expected.length&&now-this.last>15000){this.index=0;return {status:'timeout',index:0};}
 this.last=now;
 if(token!==this.expected[this.index])return {status:'wrong',index:this.index};
 this.index++;
 return {status:this.index===this.expected.length?'matched':'partial',index:this.index};
 }
}
