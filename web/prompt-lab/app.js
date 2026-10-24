import {prompts,categories,motions,filterPrompts,buildPrompt} from './prompts.mjs';
const $=selector=>document.querySelector(selector);
const storageKey='daniel-os-pixel-prompt-lab-v1';
const detailKeys=['project','audience','goal','style','stack'];
const state={selected:'hero',category:'All',query:'',favorites:new Set(),details:{},motion:'count'};
try{
 const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
 if(saved&&typeof saved==='object'){
  if(Array.isArray(saved.favorites))state.favorites=new Set(saved.favorites.filter(id=>prompts.some(p=>p.id===id)));
  if(saved.details&&typeof saved.details==='object')for(const key of detailKeys)if(typeof saved.details[key]==='string')state.details[key]=saved.details[key].slice(0,120);
  if(prompts.some(p=>p.id===saved.selected))state.selected=saved.selected;
 }
}catch{}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({selected:state.selected,favorites:[...state.favorites],details:state.details}));}catch{toast('Browser storage is unavailable; you can still copy your prompt.');}}
let toastTimer;
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2800);}
function renderFilters(){
 $('#filters').innerHTML=[...categories,'Saved'].map(category=>`<button type="button" data-category="${category}" aria-pressed="${state.category===category}">${category}</button>`).join('');
}
function renderCards(){
 const visible=filterPrompts(state.query,state.category,state.favorites);
 $('#result-count').textContent=`${visible.length} ${visible.length===1?'prompt':'prompts'}`;
 $('#empty').hidden=visible.length>0;
 $('#cards').innerHTML=visible.map(prompt=>`<article class="prompt-card ${state.selected===prompt.id?'selected':''}" data-card="${prompt.id}"><div class="card-meta"><span>${prompt.label}</span><button class="save" type="button" data-save="${prompt.id}" aria-label="${state.favorites.has(prompt.id)?'Remove':'Save'} ${prompt.title}" aria-pressed="${state.favorites.has(prompt.id)}" title="${state.favorites.has(prompt.id)?'Remove from saved':'Save prompt'}">${state.favorites.has(prompt.id)?'♥':'♡'}</button></div><h3>${prompt.title}</h3><p>${prompt.summary}</p><div class="card-bottom"><span>${prompt.category}</span><button type="button" data-choose="${prompt.id}" aria-label="Use ${prompt.title}">Use this prompt ↗</button></div></article>`).join('');
}
function selectedPrompt(){return prompts.find(prompt=>prompt.id===state.selected)||prompts[0];}
function updatePrompt(){
 const prompt=selectedPrompt();$('#selected-title').textContent=prompt.title;
 const output=$('#prompt-output');output.value=buildPrompt(prompt,state.details);
 updateWordCount();
}
function updateWordCount(){const words=$('#prompt-output').value.trim().split(/\s+/).filter(Boolean).length;$('#word-count').textContent=`${words} words`;} 
function choose(id){if(!prompts.some(prompt=>prompt.id===id))return;state.selected=id;renderCards();updatePrompt();persist();if(matchMedia('(max-width:720px)').matches)$('#builder').scrollIntoView({behavior:'smooth',block:'start'});}
$('#filters').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(!button)return;state.category=button.dataset.category;renderFilters();renderCards();});
$('#search').addEventListener('input',event=>{state.query=event.target.value;renderCards();});
$('#cards').addEventListener('click',event=>{
 const save=event.target.closest('[data-save]');if(save){const id=save.dataset.save;state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);renderCards();persist();toast(state.favorites.has(id)?'Saved to your prompts.':'Removed from saved.');return;}
 const chooseButton=event.target.closest('[data-choose]');if(chooseButton)choose(chooseButton.dataset.choose);
});
for(const key of detailKeys){const field=$(`#${key}`);field.value=state.details[key]||'';field.addEventListener('input',()=>{state.details[key]=field.value;updatePrompt();persist();});}
$('#prompt-output').addEventListener('input',updateWordCount);
$('#reset-brief').addEventListener('click',()=>{state.details={};for(const key of detailKeys)$(`#${key}`).value='';updatePrompt();persist();toast('Brief details cleared.');});
$('#copy').addEventListener('click',async()=>{
 const output=$('#prompt-output');try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(output.value);else{output.select();if(!document.execCommand('copy'))throw new Error('Copy unavailable');}toast('Prompt copied. Make something excellent.');}
 catch{output.focus();output.select();toast('Clipboard access is unavailable. Your prompt is selected to copy manually.');}
});
$('#download').addEventListener('click',()=>{const blob=new Blob([$('#prompt-output').value+'\n'],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`pixel-prompt-${state.selected}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Prompt downloaded.');});
function renderMotionList(){
 $('#motion-list').innerHTML=motions.map((motion,index)=>`<button type="button" data-motion="${motion.id}" aria-pressed="${state.motion===motion.id}"><span>${String(index+1).padStart(2,'0')}</span>${motion.name}</button>`).join('');
}
let motionFrame;
function playMotion(){
 cancelAnimationFrame(motionFrame);
 const motion=motions.find(item=>item.id===state.motion)||motions[0],index=motions.indexOf(motion);
 $('#motion-name').textContent=motion.name;$('#motion-description').textContent=`${motion.plain} ${motion.when}`;$('#motion-index').textContent=`${String(index+1).padStart(2,'0')} / 09`;
 const stage=$('#demo');stage.replaceChildren();
 const markup={
  count:'<div class="demo-count"><span id="count-number">0</span><small> %</small></div>',
  marquee:'<div class="demo-marquee"><div class="demo-track"><span>ASTRA</span><span>NOVA</span><span>ORBIT</span><span>FORMA</span><span>ASTRA</span><span>NOVA</span><span>ORBIT</span><span>FORMA</span></div></div>',
  typewriter:'<div class="demo-type">Make every pixel count.</div>',
  stagger:'<div class="demo-stagger"><span>01</span><span>02</span><span>03</span></div>',
  hover:'<button type="button" class="demo-hover">A thoughtful card<small>Hover or focus to see it lift ↑</small></button>',
  morph:'<div class="demo-morph" aria-label="Animated changing shape"></div>',
  easing:'<div class="demo-easing" aria-label="A dot moving with ease-out timing"></div>',
  ripple:'<button type="button" class="demo-ripple">Click for feedback</button>',
  flip:'<div class="flip-scene"><div class="flip-card"><div>Hover to explore ↗</div><div>More detail, same space.</div></div></div><span class="demo-hint">Hover over the card</span>'
 };
 stage.innerHTML=markup[motion.id];
 if(motion.id==='count'){
  const number=$('#count-number'),start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){number.textContent='87';return;}
  const step=now=>{if(state.motion!=='count')return;const progress=Math.min(1,(now-start)/1450);number.textContent=String(Math.round(87*(1-Math.pow(1-progress,3))));if(progress<1)motionFrame=requestAnimationFrame(step);};motionFrame=requestAnimationFrame(step);
 }
 if(motion.id==='ripple')stage.querySelector('button').addEventListener('click',event=>{const button=event.currentTarget;const ring=document.createElement('span');const size=Math.max(button.clientWidth,button.clientHeight);ring.style.width=ring.style.height=`${size}px`;ring.style.left=`${event.offsetX-size/2}px`;ring.style.top=`${event.offsetY-size/2}px`;button.append(ring);ring.addEventListener('animationend',()=>ring.remove(),{once:true});});
}
$('#motion-list').addEventListener('click',event=>{const button=event.target.closest('[data-motion]');if(!button)return;state.motion=button.dataset.motion;renderMotionList();playMotion();});
$('#replay').addEventListener('click',playMotion);
renderFilters();renderCards();updatePrompt();renderMotionList();playMotion();
