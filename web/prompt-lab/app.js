import {prompts,categories,motions,filterPrompts,buildPrompt} from './prompts.mjs';
const $=selector=>document.querySelector(selector);
const storageKey='daniel-os-pixel-prompt-lab-v1';
const detailKeys=['project','audience','goal','style','stack'];
const state={selected:'hero',category:'All',query:'',favorites:new Set(),details:{},motion:'count',motionGroup:'All'};
const designPresets=[
 {id:'editorial',name:'Editorial',palette:['#f6efe5','#293f3d','#bd7358'],style:'Warm editorial; expressive serif type, generous whitespace, a quiet grid, tactile photography, terracotta accents.',headline:'A considered point of view'},
 {id:'modern',name:'Modern',palette:['#e9f1ec','#143b3e','#8ce3ba'],style:'Modern and precise; geometric sans-serif type, modular grid, crisp imagery, cool mineral colors, restrained motion.',headline:'Built for what is next'},
 {id:'playful',name:'Playful',palette:['#fff0d9','#283a6c','#ff8377'],style:'Playful but usable; rounded type, vivid color blocks, friendly illustrations, purposeful interactions.',headline:'Good ideas feel alive'},
 {id:'luxury',name:'Quiet luxury',palette:['#ebe4d8','#302f2c','#987d5d'],style:'Quiet luxury; refined type pairing, generous space, warm materials, cinematic imagery, subtle transitions.',headline:'Craft in every detail'}
];
const motionGroups={All:()=>true,Entrance:m=>['typewriter','stagger','reveal','mask','easing'].includes(m.id),Interaction:m=>['hover','ripple','flip','accordion','carousel','magnetic'].includes(m.id),'Depth & data':m=>['count','marquee','morph','parallax','progress','shimmer'].includes(m.id)};
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
 $('#cards').innerHTML=visible.map(prompt=>`<article class="prompt-card ${state.selected===prompt.id?'selected':''}" data-card="${prompt.id}" data-kind="${prompt.category}"><div class="card-meta"><span>${prompt.label}</span><button class="save" type="button" data-save="${prompt.id}" aria-label="${state.favorites.has(prompt.id)?'Remove':'Save'} ${prompt.title}" aria-pressed="${state.favorites.has(prompt.id)}" title="${state.favorites.has(prompt.id)?'Remove from saved':'Save prompt'}">${state.favorites.has(prompt.id)?'♥':'♡'}</button></div><h3>${prompt.title}</h3><p>${prompt.summary}</p><div class="card-bottom"><span>${prompt.category}</span><button type="button" data-choose="${prompt.id}" aria-label="Use ${prompt.title}">Use this prompt ↗</button></div></article>`).join('');
}
function renderDesignPresets(){
 const selected=designPresets.find(p=>p.style===state.details.style);
 $('#design-presets').innerHTML=designPresets.map(p=>`<button type="button" data-preset="${p.id}" aria-pressed="${selected?.id===p.id}"><span class="preset-swatches" aria-hidden="true">${p.palette.map(c=>`<i style="background:${c}"></i>`).join('')}</span><span>${p.name}</span></button>`).join('');
 const preview=selected||designPresets[0];
 $('#design-preview').style.setProperty('--preview-paper',preview.palette[0]);
 $('#design-preview').style.setProperty('--preview-ink',preview.palette[1]);
 $('#design-preview').style.setProperty('--preview-pop',preview.palette[2]);
 $('#design-preview').dataset.direction=preview.id;
 $('#design-preview').innerHTML=`<div class="design-preview-caption"><span>LIVE STYLE STUDY</span><strong>${preview.name}</strong></div><div class="design-preview-page"><div class="mini-top"><b>FORM / FIELD</b><span>MENU</span></div><div class="mini-layout"><div><small>01 / POINT OF VIEW</small><strong>${preview.headline}</strong><i></i><i></i><b>EXPLORE &nbsp; ↗</b></div><div class="mini-art"><span>✦</span></div></div></div>`;
}
$('#design-presets').addEventListener('click',event=>{const button=event.target.closest('[data-preset]');if(!button)return;const preset=designPresets.find(p=>p.id===button.dataset.preset);if(!preset)return;state.details.style=preset.style;$('#style').value=preset.style;renderDesignPresets();updatePrompt();persist();});
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
for(const key of detailKeys){const field=$(`#${key}`);field.value=state.details[key]||'';field.addEventListener('input',()=>{state.details[key]=field.value;updatePrompt();if(key==='style')renderDesignPresets();persist();});}
$('#prompt-output').addEventListener('input',updateWordCount);
$('#reset-brief').addEventListener('click',()=>{state.details={};for(const key of detailKeys)$(`#${key}`).value='';updatePrompt();renderDesignPresets();persist();toast('Brief details cleared.');});
$('#copy').addEventListener('click',async()=>{
 const output=$('#prompt-output');try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(output.value);else{output.select();if(!document.execCommand('copy'))throw new Error('Copy unavailable');}$('#copy-label').textContent='Copied — paste into your AI';setTimeout(()=>$('#copy-label').textContent='Copy prompt',2500);toast('Copied. Paste the prompt into your AI tool.');}
 catch{output.focus();output.select();toast('Clipboard access is unavailable. Your prompt is selected to copy manually.');}
});
$('#download').addEventListener('click',()=>{const blob=new Blob([$('#prompt-output').value+'\n'],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`pixel-prompt-${state.selected}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Prompt downloaded.');});
function renderMotionFilters(){
 $('#motion-filters').innerHTML=Object.keys(motionGroups).map(group=>`<button type="button" data-motion-group="${group}" aria-pressed="${state.motionGroup===group}">${group}</button>`).join('');
}
function renderMotionList(){
 $('#motion-list').innerHTML=motions.filter(motionGroups[state.motionGroup]).map((motion,index)=>`<button type="button" data-motion="${motion.id}" aria-pressed="${state.motion===motion.id}"><span>${String(motions.indexOf(motion)+1).padStart(2,'0')}</span>${motion.name}</button>`).join('');
}
let motionFrame;
function playMotion(){
 cancelAnimationFrame(motionFrame);
 const motion=motions.find(item=>item.id===state.motion)||motions[0],index=motions.indexOf(motion);
 $('#motion-name').textContent=motion.name;$('#motion-description').textContent=`${motion.plain} ${motion.when}`;$('#motion-index').textContent=`${String(index+1).padStart(2,'0')} / ${String(motions.length).padStart(2,'0')}`;
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
  flip:'<div class="flip-scene"><div class="flip-card"><div>Hover to explore ↗</div><div>More detail, same space.</div></div></div><span class="demo-hint">Hover over the card</span>',
  reveal:'<div class="demo-reveal"><small>NEW SECTION</small><strong>First impressions last.</strong><span>Content arrives as it enters view.</span></div>',
  mask:'<div class="demo-mask"><span>DESIGN WITH INTENT.</span></div>',
  parallax:'<div class="demo-parallax"><span class="depth depth-back"></span><span class="depth depth-middle"></span><span class="depth depth-front">✦</span></div><span class="demo-hint">Move your pointer across the scene</span>',
  progress:'<div class="demo-progress" role="img" aria-label="Progress reaches 72 percent"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="progress-track" cx="50" cy="50" r="42"/><circle class="progress-fill" cx="50" cy="50" r="42"/></svg><span>72<small>%</small></span></div>',
  accordion:'<div class="demo-accordion"><button type="button" aria-expanded="false">What happens next? <span>+</span></button><div hidden>We shape a clear brief, then turn it into a buildable design.</div></div>',
  carousel:'<div class="demo-carousel"><div><small>FEATURED IDEA <span id="carousel-index">01 / 03</span></small><strong id="carousel-title">A stronger first screen</strong><p id="carousel-copy">Lead with one specific promise.</p></div><button type="button" aria-label="Next featured idea">→</button></div>',
  magnetic:'<button type="button" class="demo-magnetic">Explore the work <span>↗</span></button><span class="demo-hint">Move your pointer near the button</span>',
  shimmer:'<div class="demo-skeleton" aria-label="Loading placeholder"><i></i><i></i><i></i><i></i></div>'
 };
 stage.innerHTML=markup[motion.id];
 if(motion.id==='count'){
  const number=$('#count-number'),start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){number.textContent='87';return;}
  const step=now=>{if(state.motion!=='count')return;const progress=Math.min(1,(now-start)/1450);number.textContent=String(Math.round(87*(1-Math.pow(1-progress,3))));if(progress<1)motionFrame=requestAnimationFrame(step);};motionFrame=requestAnimationFrame(step);
 }
 if(motion.id==='ripple')stage.querySelector('button').addEventListener('click',event=>{const button=event.currentTarget;const ring=document.createElement('span');const size=Math.max(button.clientWidth,button.clientHeight);ring.style.width=ring.style.height=`${size}px`;ring.style.left=`${event.offsetX-size/2}px`;ring.style.top=`${event.offsetY-size/2}px`;button.append(ring);ring.addEventListener('animationend',()=>ring.remove(),{once:true});});
 if(motion.id==='accordion'){const button=stage.querySelector('button'),panel=stage.querySelector('.demo-accordion div');button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));button.querySelector('span').textContent=open?'−':'+';panel.hidden=!open;});}
 if(motion.id==='carousel'){let current=0;const slides=[['A stronger first screen','Lead with one specific promise.'],['A clearer path','Make the next action obvious.'],['A lasting impression','Let the visual system carry the story.']];stage.querySelector('button').addEventListener('click',()=>{current=(current+1)%slides.length;$('#carousel-index').textContent=`0${current+1} / 03`;$('#carousel-title').textContent=slides[current][0];$('#carousel-copy').textContent=slides[current][1];stage.querySelector('.demo-carousel').classList.remove('slide-in');void stage.offsetWidth;stage.querySelector('.demo-carousel').classList.add('slide-in');});}
 if(motion.id==='parallax'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){stage.addEventListener('pointermove',event=>{const rect=stage.getBoundingClientRect(),offset=(event.clientX-rect.left)/rect.width-.5;stage.querySelectorAll('.depth').forEach((layer,index)=>layer.style.transform=`translateX(${offset*(index+1)*18}px)`);});stage.addEventListener('pointerleave',()=>stage.querySelectorAll('.depth').forEach(layer=>layer.style.transform=''));}
 if(motion.id==='magnetic'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const button=stage.querySelector('button');stage.addEventListener('pointermove',event=>{const rect=button.getBoundingClientRect(),x=Math.max(-8,Math.min(8,(event.clientX-(rect.left+rect.width/2))*.08)),y=Math.max(-8,Math.min(8,(event.clientY-(rect.top+rect.height/2))*.08));button.style.transform=`translate(${x}px,${y}px)`;});stage.addEventListener('pointerleave',()=>button.style.transform='');}
}
$('#motion-filters').addEventListener('click',event=>{const button=event.target.closest('[data-motion-group]');if(!button)return;state.motionGroup=button.dataset.motionGroup;if(!motions.filter(motionGroups[state.motionGroup]).some(motion=>motion.id===state.motion))state.motion=motions.find(motionGroups[state.motionGroup]).id;renderMotionFilters();renderMotionList();playMotion();});
$('#motion-list').addEventListener('click',event=>{const button=event.target.closest('[data-motion]');if(!button)return;state.motion=button.dataset.motion;renderMotionList();playMotion();});
$('#replay').addEventListener('click',playMotion);
renderFilters();renderCards();updatePrompt();renderDesignPresets();renderMotionFilters();renderMotionList();playMotion();
