import {layoutPins} from './icon-grid.mjs';
const KEY='daniel-os-desktop-pins-v1';
export function setupDesktopPins({apps,icon,toast}){
 const desktop=document.querySelector('#desktop'),layer=document.querySelector('#desktop-pins');
 let pins=[{id:'files',x:1,y:.05},{id:'notes',x:1,y:.24},{id:'about',x:1,y:.43}],drag=null,blockedUntil=0;
 try{const stored=localStorage.getItem(KEY);if(stored!==null){const parsed=JSON.parse(stored);if(!Array.isArray(parsed))throw Error('Invalid pins');pins=parsed.filter((p,i,all)=>apps.some(a=>a.id===p.id)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&all.findIndex(a=>a.id===p.id)===i).map(p=>({id:p.id,x:Math.max(0,Math.min(1,p.x)),y:Math.max(0,Math.min(1,p.y))}));}}catch{toast('Desktop layout could not be loaded.');}
 function save(next){try{localStorage.setItem(KEY,JSON.stringify(next));pins=next;render();return true;}catch{toast('Could not save the desktop layout. Browser storage may be full.');return false;}}
 function render(){const layout=layoutPins(pins,desktop.clientWidth,desktop.clientHeight);layer.innerHTML='<div class="pin-grid-content" style="height:'+layout.contentHeight+'px"></div>';const content=layer.firstElementChild;content.innerHTML=layout.placements.map(pin=>{const app=apps.find(a=>a.id===pin.id);return `<div class="desktop-pin" style="left:${pin.left}px;top:${pin.top}px"><button class="pin-launch" data-open="${app.id}" aria-label="Open ${app.name}" title="Drag to reposition">${icon(app)}<span>${app.name}</span></button><button class="unpin" data-unpin="${app.id}" aria-label="Unpin ${app.name} from desktop" title="Unpin from desktop">×</button></div>`;}).join('');window.dispatchEvent(new Event('desktop-pins-rendered'));}

 function place(id,x,y){const next=pins.filter(p=>p.id!==id);next.push({id,x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))});if(save(next))toast('Pinned '+apps.find(a=>a.id===id).name+' to desktop.');}
 function cancel(){if(!drag)return;drag.ghost?.remove();drag.source.classList.remove('pin-drag-source');desktop.classList.remove('pin-drop-target');drag=null;}
 document.addEventListener('pointerdown',e=>{
  const source=e.target.closest('#dock [data-open], .pin-launch');if(!source||e.button!==0)return;
  drag={id:source.dataset.open,source,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
 });
 document.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;
  if(!drag.moved){drag.moved=true;drag.ghost=document.createElement('div');drag.ghost.className='pin-ghost';drag.ghost.innerHTML=icon(apps.find(a=>a.id===drag.id));document.body.append(drag.ghost);drag.source.classList.add('pin-drag-source');desktop.classList.add('pin-drop-target');}
  e.preventDefault();drag.ghost.style.transform=`translate3d(${e.clientX-25}px,${e.clientY-25}px,0)`;
 },{passive:false});
 document.addEventListener('pointerup',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;
  if(drag.moved){blockedUntil=performance.now()+400;const rect=desktop.getBoundingClientRect();const hit=document.elementFromPoint(e.clientX,e.clientY);if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom-105&&!hit?.closest('.window,#dock')){const col=Math.max(0,Math.floor((e.clientX-rect.left-12)/100)),row=Math.max(0,Math.floor((e.clientY-rect.top-12+layer.scrollTop)/112));const cols=Math.max(1,Math.floor((desktop.clientWidth-24)/100)),rows=Math.max(1,Math.floor((desktop.clientHeight-154)/112));place(drag.id,cols>1?col/(cols-1):0,rows>1?row/(rows-1):0);}else toast('Drop onto an empty area of the desktop.');}cancel();
 });
 document.addEventListener('pointercancel',cancel);window.addEventListener('blur',cancel);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();if(e.shiftKey&&e.key==='Enter'){const source=e.target.closest('#dock [data-open]');if(source){e.preventDefault();place(source.dataset.open,Math.max(0,1-Math.floor(pins.length/4)*.16),(pins.length%4)*.22);}}});
 document.addEventListener('click',e=>{if(e.detail>0&&performance.now()<blockedUntil&&e.target.closest('[data-open]')){e.preventDefault();e.stopImmediatePropagation();return;}const unpin=e.target.closest('[data-unpin]');if(unpin){e.preventDefault();save(pins.filter(p=>p.id!==unpin.dataset.unpin));}},true);
 document.querySelectorAll('#dock [data-open]').forEach(b=>{b.title+=' · Drag to desktop or Shift+Enter to pin';});
 window.addEventListener('resize',render);render();
}
