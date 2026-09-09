const $ = (s, root = document) => root.querySelector(s);
const apps = [
  {id:'welcome',name:'Welcome',icon:'✳',color:'#c5e783'},
  {id:'luxury',name:'Luxury Studio',icon:'⌂',color:'#dabe8e'},
  {id:'files',name:'Files',icon:'▱',color:'#a9c6d4'},
  {id:'notes',name:'Notes',icon:'≡',color:'#efdc9b'},
  {id:'terminal',name:'Terminal',icon:'›_',color:'#293c3b',ink:'#daeccb'},
  {id:'focus',name:'Focus',icon:'◷',color:'#dbb6a0'},
  {id:'settings',name:'Settings',icon:'⚙',color:'#c8ccbf'},
  {id:'about',name:'About',icon:'d.',color:'#e8eddf'}
];
let topZ = 10, note = '', theme = 'midnight';
const themes = {midnight:'#121e2c',forest:'#1b302c',ink:'#282633'};
try {note=localStorage.getItem('daniel-os-note') || '';theme=localStorage.getItem('daniel-os-theme') || 'midnight';} catch {}
if (!themes[theme]) theme='midnight';
document.documentElement.style.setProperty('--wall', themes[theme]);
const windows = new Map();
let storageFailed=false;
function persist(key,value){try{localStorage.setItem(key,value);storageFailed=false;return true;}catch{storageFailed=true;toast('Storage is unavailable. Export your note to keep it.');return false;}}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
function icon(app){return `<span class="app-icon" style="--tile:${app.color};--ink:${app.ink || '#334138'}">${app.icon}</span>`;}
$('#dock').innerHTML=apps.map(app=>`<button data-open="${app.id}" aria-label="Open ${app.name}" title="${app.name}">${icon(app)}<span class="dock-label">${app.name}</span></button>`).join('');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function animateWindow(win, frames, duration=180) {
 win.getAnimations().forEach(animation=>animation.cancel());
 if(reducedMotion.matches) return Promise.resolve();
 return win.animate(frames,{duration,easing:'cubic-bezier(.2,.8,.2,1)'}).finished.catch(()=>{});
}
function raise(win,id){
 windows.forEach(other=>other.classList.toggle('active',other===win));
 win.style.zIndex=++topZ;$('#active-app').textContent=apps.find(a=>a.id===id).name;
}
function focusApp(win){requestAnimationFrame(()=>{if(!win.isConnected||win.classList.contains('hidden'))return;($('textarea, #command',win)||win).focus({preventScroll:true});});}
function frontmost(){
 const visible=[...windows.entries()].filter(([,win])=>!win.classList.contains('hidden')&&!win.dataset.leaving);
 visible.sort((a,b)=>Number(b[1].style.zIndex)-Number(a[1].style.zIndex));
 if(visible.length){raise(visible[0][1],visible[0][0]);focusApp(visible[0][1]);}else $('#active-app').textContent='Workspace';
}
function toggleMaximize(win){
 const before=win.getBoundingClientRect();win.classList.toggle('maximized');
 const after=win.getBoundingClientRect();
 animateWindow(win,[{transform:`translate(${before.x-after.x}px,${before.y-after.y}px) scale(${before.width/after.width},${before.height/after.height})`},{transform:'none'}],240);
}
function clampWindow(win){
 if(win.classList.contains('maximized'))return;
 win.style.left=`${Math.max(10,Math.min(win.offsetLeft,innerWidth-win.offsetWidth-10))}px`;
 win.style.top=`${Math.max(10,Math.min(win.offsetTop,$('#desktop').clientHeight-Math.min(win.offsetHeight,280)-100))}px`;
}
window.addEventListener('resize',()=>windows.forEach(clampWindow));
function updateDock(){apps.forEach(a=>$(`#dock [data-open="${a.id}"]`).classList.toggle('running',windows.has(a.id)));}
function openApp(id){
 const app=apps.find(a=>a.id===id);if(!app)return false;
 if(windows.has(id)){const win=windows.get(id);delete win.dataset.leaving;win.style.pointerEvents='';const hidden=win.classList.contains('hidden');win.classList.remove('hidden');raise(win,id);animateWindow(win,hidden?[{opacity:0,transform:'translateY(35px) scale(.95)'},{opacity:1,transform:'none'}]:[{opacity:.9},{opacity:1}]);focusApp(win);return true;}
 const win=document.createElement('section');win.className='window';if(id==='luxury')win.classList.add('luxury-window');win.setAttribute('aria-label',app.name);win.setAttribute('role','region');win.tabIndex=-1;
 const count=windows.size;win.style.left=`${Math.min(390+count*25,Math.max(10,innerWidth-630))}px`;win.style.top=`${Math.min(82+count*24,Math.max(10,innerHeight-530))}px`;
 if(id==='luxury'){win.style.left='10px';win.style.top='10px';}
 win.innerHTML=`<header class="titlebar"><div class="controls"><button aria-label="Close ${app.name}" data-control="close"></button><button aria-label="Minimize ${app.name}" data-control="min"></button><button aria-label="Maximize or restore ${app.name}" data-control="max"></button></div><span class="window-title">${app.name}</span><span class="window-code">0${apps.indexOf(app)+1}</span></header><div class="window-body"></div>`;
 $('#windows').append(win);windows.set(id,win);raise(win,id);updateDock();
 win.addEventListener('pointerdown',()=>raise(win,id));
 win.addEventListener('click',async e=>{
 const action=e.target.closest('[data-control]')?.dataset.control;
 if(action==='max'){toggleMaximize(win);return;}
 if(!['close','min'].includes(action)||win.dataset.leaving)return;
 win.dataset.leaving=action;win.style.pointerEvents='none';
 await animateWindow(win,[{opacity:1,transform:'none'},{opacity:0,transform:action==='min'?'translateY(50px) scale(.93)':'scale(.97)'}]);
 if(win.dataset.leaving!==action)return;
 if(action==='close'){win.remove();windows.delete(id);}else win.classList.add('hidden');
 delete win.dataset.leaving;win.style.pointerEvents='';updateDock();frontmost();
 });
 const bar=$('.titlebar',win);let drag,frame=0,dx=0,dy=0;
 bar.addEventListener('dblclick',e=>{if(!e.target.closest('button'))toggleMaximize(win);});
 bar.addEventListener('pointerdown',e=>{
 if(e.button!==0||e.target.closest('button')||win.classList.contains('maximized'))return;
 win.getAnimations().forEach(animation=>animation.cancel());
 drag={x:e.clientX,y:e.clientY,left:win.offsetLeft,top:win.offsetTop};dx=dy=0;
 bar.setPointerCapture(e.pointerId);win.classList.add('dragging');
 });
 bar.addEventListener('pointermove',e=>{
 if(!drag)return;
 dx=Math.max(0,Math.min(innerWidth-win.offsetWidth,drag.left+e.clientX-drag.x))-drag.left;
 dy=Math.max(0,Math.min($('#desktop').clientHeight-140,drag.top+e.clientY-drag.y))-drag.top;
 if(!frame)frame=requestAnimationFrame(()=>{win.style.transform=`translate3d(${dx}px,${dy}px,0)`;frame=0;});
 });
 function finishDrag(){if(!drag)return;cancelAnimationFrame(frame);frame=0;win.style.left=`${drag.left+dx}px`;win.style.top=`${drag.top+dy}px`;win.style.transform='';win.classList.remove('dragging');drag=null;}
 bar.addEventListener('pointerup',finishDrag);bar.addEventListener('pointercancel',finishDrag);bar.addEventListener('lostpointercapture',finishDrag);
 render(id,$('.window-body',win));animateWindow(win,[{opacity:0,transform:'translateY(14px) scale(.975)'},{opacity:1,transform:'none'}],220);focusApp(win);return true;
}
function exportNote(){const url=URL.createObjectURL(new Blob([note],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='My note.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
let duration=25,remaining=25*60,endTime=null,timerRunning=false;
function timerSeconds(){return timerRunning?Math.max(0,Math.ceil((endTime-Date.now())/1000)):remaining;}
function updateTimer(){const seconds=timerSeconds();if(timerRunning&&seconds===0){timerRunning=false;remaining=0;toast('Focus session complete. Time for a break.');}const el=$('#focus-time');if(el){el.textContent=`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;$('#timer-toggle').textContent=timerRunning?'Pause':seconds===0?'Start again':'Start focus';}}
function render(id,body){
 if(id==='luxury'){body.classList.add('luxury-body');body.innerHTML='<iframe src="luxury/?v=horizon-villa" title="Luxury building simulator" allow="fullscreen"></iframe>';}
 if(id==='welcome')body.innerHTML=`<div class="welcome"><span class="eyebrow">A SPACE OF YOUR OWN</span><h2>Hello, Daniel<span style="color:#91ac72">.</span></h2><p>A clear desktop. A fresh start.<br>Your everyday tools, together in one little world.</p><div class="welcome-grid"><button data-open="notes"><span class="glyph">≡</span><span><strong>Catch a thought</strong><small>Open your notebook ↗</small></span></button><button data-open="focus"><span class="glyph">◷</span><span><strong>Find your focus</strong><small>Make room for deep work ↗</small></span></button></div><div class="welcome-footer"><span>BUILT FOR THE WAY YOU THINK</span><span>⌘ K to explore</span></div></div>`;
 if(id==='notes'){
 body.innerHTML=`<div class="notes-body"><div class="toolbar">My note.txt<button id="export-note">Export .txt ↗</button><span id="save-status"></span></div><textarea aria-label="Your note" placeholder="An idea, a plan, a little reminder…"></textarea></div>`;
 $('textarea',body).value=note;$('#save-status').textContent=storageFailed?'Not saved — export to keep':'Saved on this device';
 $('textarea',body).addEventListener('input',e=>{note=e.target.value;$('#save-status').textContent=persist('daniel-os-note',note)?'Saved on this device':'Not saved — export to keep';});$('#export-note').onclick=exportNote;
 }
 if(id==='files'){
 body.innerHTML=`<div class="toolbar">▱ Home / Daniel<span>3 files</span></div><div class="file-list"><button class="file-item" data-open="notes"><span class="file-symbol">▤</span><span><strong>My note.txt</strong><small>Your personal notebook</small></span><span>TEXT</span></button><button class="file-item" data-open="about"><span class="file-symbol">▤</span><span><strong>Read me.txt</strong><small>A few things about this workspace</small></span><span>TEXT</span></button><button class="file-item" id="commands-file"><span class="file-symbol">›_</span><span><strong>Commands.txt</strong><small>A quick guide to your terminal</small></span><span>TEXT</span></button></div>`;
 $('#commands-file').onclick=()=>{openApp('terminal');terminalPrint(help);};
 }
 if(id==='terminal'){
 body.innerHTML=`<div class="terminal"><pre id="terminal-output"></pre><form><label for="command">daniel ~ %</label><input id="command" aria-label="Terminal command" autocomplete="off" spellcheck="false"></form></div>`;
 terminalPrint('Daniel OS [Version 1.0]\nYour browser workspace shell. Type help to begin.\n');
 const history=[];let historyIndex=0;
 $('form',body).onsubmit=e=>{e.preventDefault();const input=$('#command');const command=input.value.trim();if(!command)return;history.push(command);historyIndex=history.length;input.value='';terminalPrint(`daniel ~ % ${command}`);execute(command);};
 $('#command').onkeydown=e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();historyIndex=Math.max(0,Math.min(history.length,historyIndex+(e.key==='ArrowUp'?-1:1)));e.target.value=history[historyIndex]||'';}};
 }
 if(id==='focus'){
 body.innerHTML=`<div class="timer"><span class="eyebrow">ONE THING AT A TIME</span><div class="time" id="focus-time"></div><p>Give your next idea a little uninterrupted time.</p><p><label>Session <select id="duration"><option value="25">25 minutes</option><option value="50">50 minutes</option><option value="5">5 minute break</option></select></label></p><button class="primary" id="timer-toggle">Start focus</button><button class="secondary" id="timer-reset">Reset</button></div>`;
 $('#timer-toggle').onclick=()=>{if(timerRunning){remaining=timerSeconds();timerRunning=false;}else{if(remaining===0)remaining=Number($('#duration').value)*60;endTime=Date.now()+remaining*1000;timerRunning=true;}updateTimer();};
 $('#duration').value=String(duration);$('#timer-reset').onclick=()=>{duration=Number($('#duration').value);timerRunning=false;remaining=duration*60;updateTimer();};$('#duration').onchange=$('#timer-reset').onclick;updateTimer();
 }
 if(id==='settings'){
 body.innerHTML=`<div class="settings"><span class="eyebrow">MAKE IT FEEL LIKE YOU</span><h2>Your desktop</h2><p>Choose a backdrop for your day.</p><div class="swatches">${Object.entries(themes).map(([name,color])=>`<button data-theme="${name}" style="--color:${color}">${name[0].toUpperCase()+name.slice(1)}</button>`).join('')}</div><h2 style="margin-top:30px">A little more personal</h2><p>Notes and wallpaper stay in this browser. Export your note for a backup or to take it to another device.</p><button class="secondary" id="backup">Export my note ↗</button></div>`;
 $('.swatches',body).onclick=e=>{const name=e.target.dataset.theme;if(name)setTheme(name);};$('#backup').onclick=exportNote;markTheme();
 }
 if(id==='about')body.innerHTML=`<div class="about"><span class="badge">PERSONAL WORKSPACE / VERSION 1.0</span><h2>Daniel OS.</h2><p>A small home for thoughts, tools, and whatever comes next. Open a few apps, move things around, and make it yours.</p><p>This is a browser desktop. Files are built-in workspace documents; notes stay on this device. The terminal runs a small set of workspace commands. Keep this tab open for focus reminders.</p><p>Desktop interaction inspired by <a href="https://termcavetw.vercel.app" target="_blank" rel="noopener noreferrer">termcave ↗</a>. Independently built for GitHub Pages.</p></div>`;
}
const help='Commands:\n  help          Show this guide\n  ls            List workspace files\n  cat note      Read your note\n  open <app>    Open welcome, files, notes, focus, settings, about\n  date          Current date and time\n  whoami        About this workspace\n  echo <text>   Print text\n  clear         Clear terminal\n\nThis shell does not run system commands.';
function terminalPrint(text){const output=$('#terminal-output');if(output){output.textContent+=text+'\n';output.parentElement.scrollTop=output.parentElement.scrollHeight;}}
function execute(command){const [cmd,...args]=command.split(/\s+/);switch(cmd){case 'help':terminalPrint(help);break;case 'ls':terminalPrint('My note.txt\nRead me.txt\nCommands.txt');break;case 'cat':terminalPrint(args.join(' ')==='note'?note||'(Your note is empty.)':'Use: cat note');break;case 'open':terminalPrint(openApp(args[0])?'Opened '+args[0]:'Unknown app. Type help for app names.');break;case 'date':terminalPrint(new Date().toLocaleString());break;case 'whoami':terminalPrint('Daniel — personal browser workspace');break;case 'echo':terminalPrint(args.join(' '));break;case 'clear':$('#terminal-output').textContent='';break;default:terminalPrint(`Unknown command: ${cmd}. Type help.`);}}
function markTheme(){document.querySelectorAll('[data-theme]').forEach(el=>{el.classList.toggle('selected',el.dataset.theme===theme);el.setAttribute('aria-pressed',el.dataset.theme===theme);});}
function setTheme(name){theme=name;document.documentElement.style.setProperty('--wall',themes[name]);persist('daniel-os-theme',name);markTheme();}
document.addEventListener('click',e=>{const target=e.target.closest('[data-open]');if(target)openApp(target.dataset.open);});
$('#home').onclick=()=>openApp('welcome');$('#wallpaper').onclick=()=>openApp('settings');
$('#tidy').onclick=()=>{let index=0;windows.forEach(win=>{const before=win.getBoundingClientRect();win.classList.remove('maximized','hidden');win.style.left=`${Math.max(10,Math.min(160+index*35,innerWidth-win.offsetWidth-10))}px`;win.style.top=`${Math.max(10,Math.min(45+index*35,innerHeight-win.offsetHeight-155))}px`;const after=win.getBoundingClientRect();animateWindow(win,[{transform:`translate(${before.x-after.x}px,${before.y-after.y}px)`},{transform:'none'}],260);index++;});};
let selectedResult=0;
function selectResult(index){const buttons=[...document.querySelectorAll('[data-launch]')];selectedResult=Math.max(0,Math.min(index,buttons.length-1));buttons.forEach((button,i)=>{button.classList.toggle('selected',i===selectedResult);});buttons[selectedResult]?.scrollIntoView({block:'nearest'});}
function searchResults(){const query=$('#app-search').value.toLowerCase();const results=apps.filter(a=>a.name.toLowerCase().includes(query));$('#search-results').innerHTML=results.length?results.map(a=>`<button data-launch="${a.id}">${icon(a)}<span>${a.name}</span></button>`).join(''):'<p style="padding:18px;color:#73816a">No apps found. Try another name.</p>';selectResult(0);}
function showLauncher(){if(!$('#launcher').open)$('#launcher').showModal();$('#app-search').value='';searchResults();$('#app-search').focus();}
$('#launcher').addEventListener('click',e=>{if(e.target===$('#launcher')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#search-button').onclick=showLauncher;$('#close-search').onclick=()=>$('#launcher').close();$('#app-search').oninput=searchResults;
$('#app-search').onkeydown=e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();selectResult(selectedResult+(e.key==='ArrowDown'?1:-1));}if(e.key==='Enter'){const id=$('[data-launch].selected')?.dataset.launch;if(id){$('#launcher').close();openApp(id);}}};
$('#search-results').onclick=e=>{const id=e.target.closest('[data-launch]')?.dataset.launch;if(id){$('#launcher').close();openApp(id);}};
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();showLauncher();}});
function tick(){const now=new Date();$('#clock').textContent=now.toLocaleDateString(undefined,{month:'short',day:'numeric'})+'  '+now.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});updateTimer();}
setInterval(tick,1000);tick();openApp('welcome');if(new URLSearchParams(location.search).get('app')==='luxury')openApp('luxury');
const context=document.modelContext;
if(context?.registerTool){
 const lifecycle=new AbortController();
 const tool={name:'open_workspace_app',title:'Open workspace app',description:'Open or restore a Daniel OS app on the visible desktop.',inputSchema:{type:'object',properties:{app:{type:'string',enum:apps.map(a=>a.id)}},required:['app'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).some(k=>k!=='app')||!apps.some(a=>a.id===input.app))throw new Error('Choose a valid workspace app.');openApp(input.app);return {opened:input.app};}};
 try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
