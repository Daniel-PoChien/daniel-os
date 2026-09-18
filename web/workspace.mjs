import {quoteArgument,suggestRemoval} from './command-hints.mjs';
import {FileSystem,HOME,basename,parentPath,resolvePath,displayPath,tokenize} from './filesystem.mjs?v=desktop-pins-rm-1';
export function createWorkspace({openApp,toast}){
 const $=s=>document.querySelector(s);
 let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error('unavailable');}};}
 const fs=new FileSystem(storage);let cwd=HOME,previous=HOME,folder=HOME,draft=null,unsaved=false,history=[],historyIndex=0;
 const help=`FILES & FOLDERS\n  pwd                        Show current directory\n  ls [path]                  List files and folders\n  cd [path]                  Change directory (.., ~, /, -)\n  tree [path]                Show a directory tree\n  mkdir <path>               Create a folder\n  touch <file>               Create an empty text file\n  cat <file>                 Read a file (cat note: current note)\n  mv <source> <target>        Move or rename; never overwrite\n  cp <source> <target>        Copy a file or folder\n  rm <file> [file...]         Permanently remove files (not folders)\n  echo text > file           Save text to a file\n  echo text >> file          Append text to a file\n  open <path|app>            Open a folder, file, or app\n  edit <file>                Open a file in Notes\n  download <file>            Export a file to your computer\n\nWORKSPACE\n  apps, history, date, whoami, clear, help\n\nTab completes paths; ↑ / ↓ recalls commands; Ctrl+L clears.\nQuote names with spaces: cd "My projects" or rm "Untitled 2.txt"\nVirtual folders live in this browser, not on your computer.`;
 const appIds=['welcome','luxury','files','notes','terminal','focus','settings','about'];
 const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const noteDir=()=>fs.data.active?parentPath(fs.data.active):(fs.data.entries[HOME+'/Documents']?.type==='directory'?HOME+'/Documents':HOME);
 function saveDraft(){if(!unsaved)return;fs.write(fs.data.active,draft);unsaved=false;}
 function report(e){toast(e.message);const status=$('#save-status');if(status&&unsaved)status.textContent='Not saved — export to keep';}
 function guard(fn){try{return fn();}catch(e){report(e);}}
 function prompt(){const label=$('#terminal-prompt');if(label)label.textContent=`daniel ${displayPath(cwd)} %`;}
 function print(text){const out=$('#terminal-output');if(out){out.textContent+=String(text)+'\n';out.parentElement.scrollTop=out.parentElement.scrollHeight;}}
 function download(path=fs.data.active){if(!path)throw Error('Open a note first.');const node=fs.get(path);if(node.type!=='file')throw Error('Choose a file to download.');const content=path===fs.data.active&&unsaved?draft:node.content;const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=basename(path);link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function refresh(){prompt();const body=$('[aria-label="Files"] .window-body');if(body)renderFiles(body);const name=$('#note-name');if(name&&!fs.data.active){renderNotes($('[aria-label="Notes"] .window-body'));return;}if(name){name.value=basename(fs.data.active);$('#note-path').textContent=displayPath(parentPath(fs.data.active));const area=$('#note-editor');if(!unsaved&&area.value!==fs.get(fs.data.active).content)area.value=fs.get(fs.data.active).content;} }
 function openFile(path){saveDraft();fs.activate(path);draft=null;unsaved=false;openApp('notes');renderNotes($('[aria-label="Notes"] .window-body'));$('#note-editor').focus();}
 function newNote(dir){saveDraft();let i=1,path=dir+'/Untitled.txt';while(fs.data.entries[path])path=dir+`/Untitled ${++i}.txt`;fs.touch(path);openFile(path);refresh();}
 function renderNotes(body){
  if(!fs.data.active){body.innerHTML='<div class="notes-body"><div class="toolbar"><button id="new-note">New note</button></div><p class="empty-folder">No note is open. Create a note or open a file from Files.</p></div>';$('#new-note').onclick=()=>guard(()=>newNote(noteDir()));return;}
  body.innerHTML=`<div class="notes-body"><div class="toolbar note-toolbar"><form id="rename-note"><input id="note-name" aria-label="Note filename" maxlength="160" required><button>Rename</button></form><button id="new-note">New</button><button id="export-note">Export ↗</button></div><div class="note-meta"><span id="note-path"></span><span id="save-status" role="status"></span></div><textarea id="note-editor" aria-label="Your note" placeholder="An idea, a plan, a little reminder…"></textarea></div>`;
  $('#note-name').value=basename(fs.data.active);$('#note-path').textContent=displayPath(parentPath(fs.data.active));$('#note-editor').value=unsaved?draft:fs.get(fs.data.active).content;
  $('#save-status').textContent=unsaved?'Not saved — export to keep':fs.loadError?'Storage unavailable':'Saved on this device';
  $('#note-editor').oninput=e=>{draft=e.target.value;unsaved=true;guard(()=>{saveDraft();$('#save-status').textContent='Saved on this device';});};
  $('#rename-note').onsubmit=e=>{e.preventDefault();guard(()=>{saveDraft();const name=$('#note-name').value.trim();if(!name||name==='.'||name==='..'||name.includes('/')||/[\x00-\x1f\x7f]/.test(name))throw Error('Use a filename without slashes or control characters.');const target=parentPath(fs.data.active)+'/'+name;if(target!==fs.data.active&&fs.data.entries[target])throw Error('That name already exists. Choose another filename.');fs.move(fs.data.active,target);refresh();toast('File renamed.');});};
  $('#export-note').onclick=()=>guard(()=>download());$('#new-note').onclick=()=>guard(()=>newNote(noteDir()));
 }
 function renderFiles(body){
  if(!fs.data.entries[folder])folder=HOME;
  const entries=fs.list(folder);
  body.innerHTML=`<div class="files-shell"><aside class="files-sidebar">${['Home','Desktop','Documents','Downloads'].map(name=>`<button data-place="${name==='Home'?HOME:HOME+'/'+name}" class="${folder===(name==='Home'?HOME:HOME+'/'+name)?'selected':''}">▱ ${name}</button>`).join('')}</aside><section class="files-main"><div class="toolbar"><button id="files-up" aria-label="Parent folder">↑</button><span class="folder-path">${escape(displayPath(folder))}</span><button id="files-note">New note</button></div><form id="new-folder" class="toolbar"><input id="folder-name" aria-label="New folder name" placeholder="New folder name" required maxlength="160"><button>Create folder</button></form><div class="file-list">${entries.length?entries.map(([p,n])=>`<button class="file-item" data-path="${escape(p)}"><span class="file-symbol">${n.type==='directory'?'▱':'▤'}</span><span><strong>${escape(basename(p))}</strong><small>${n.type==='directory'?'Folder':new TextEncoder().encode(n.content).length+' bytes'}</small></span></button>`).join(''):'<p class="empty-folder">This folder is empty. Create a note or folder to begin.</p>'}</div><div class="files-status">${entries.length} items · Saved in this browser</div></section></div>`;
  body.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>guard(()=>{folder=b.dataset.place;renderFiles(body);}));
  body.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>guard(()=>{const path=b.dataset.path;if(fs.get(path).type==='directory'){folder=path;renderFiles(body);}else openFile(path);}));
  $('#files-up').onclick=()=>{folder=parentPath(folder);renderFiles(body);};$('#files-note').onclick=()=>guard(()=>newNote(folder));
  $('#new-folder').onsubmit=e=>{e.preventDefault();guard(()=>{const name=$('#folder-name').value.trim();if(!name||name==='.'||name==='..'||name.includes('/'))throw Error('Enter a folder name without slashes.');fs.mkdir(resolvePath(name,folder));renderFiles(body);});};
 }
 function renderTerminal(body){
  body.innerHTML='<div class="terminal"><pre id="terminal-output" role="log" aria-label="Terminal output"></pre><form><label id="terminal-prompt" for="command"></label><input id="command" aria-label="Terminal command" autocomplete="off" spellcheck="false" autocapitalize="off"></form></div>';
  print('Daniel OS shell 2.0\nDocuments, Downloads, Desktop — your workspace is ready.\nType help for commands. Tab completes paths.\nNames with spaces need quotes: rm "My note.txt"\n');if(fs.loadError)print(fs.loadError);prompt();
  body.querySelector('form').onsubmit=e=>{e.preventDefault();const input=$('#command'),line=input.value.trim();if(!line)return;history.push(line);historyIndex=history.length;input.value='';print(`daniel ${displayPath(cwd)} % ${line}`);try{execute(line);}catch(e){print('Error: '+e.message);}prompt();};
  $('#command').onkeydown=e=>{if(e.ctrlKey&&e.key.toLowerCase()==='l'){e.preventDefault();$('#terminal-output').textContent='';}if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();historyIndex=Math.max(0,Math.min(history.length,historyIndex+(e.key==='ArrowUp'?-1:1)));e.target.value=history[historyIndex]||'';}if(e.key==='Tab'){e.preventDefault();try{complete(e.target);}catch(e){print(e.message);}}};
 }
 function complete(input){
  const line=input.value;let tokens,incomplete=false;try{tokens=tokenize(line);}catch{incomplete=true;try{tokens=tokenize(line+'"');}catch{try{tokens=tokenize(line+"'");}catch{return;}}}
  if(!tokens.length)return;
  const trailing=!incomplete&&/\s$/.test(line),part=trailing?'':tokens.at(-1).value;
  const quote=s=>'"'+s.replace(/[\\"]/g,'\\$&')+'"';
  let candidates;
  if(tokens.length===1&&!trailing)candidates=['help','pwd','ls','cd','tree','mkdir','touch','cat','mv','cp','rm','echo','open','edit','download','apps','history','date','whoami','clear'].filter(c=>c.startsWith(part));
  else {const slash=part.lastIndexOf('/'),prefix=slash<0?'':part.slice(0,slash+1),name=part.slice(slash+1);candidates=fs.list(resolvePath(prefix||'.',cwd)).filter(([p,n])=>basename(p).startsWith(name)&&(tokens[0].value!=='cd'||n.type==='directory')).map(([p,n])=>prefix+basename(p)+(n.type==='directory'?'/':''));}
  if(candidates.length===1){const prior=trailing?tokens:tokens.slice(0,-1);input.value=prior.map(t=>t.operator?t.value:quote(t.value)).join(' ')+(prior.length?' ':'')+quote(candidates[0]);}
  else if(candidates.length>1)print(candidates.map(quoteArgument).join('  '));
 }
 function execute(line){
  const tokens=tokenize(line);if(!tokens.length)return;
  const redirection=tokens.findIndex(t=>t.operator);let target=null,append=false;
  if(redirection>=0){if(tokens[0].value!=='echo'||redirection!==tokens.length-2||tokens.at(-1).operator)throw Error('Use echo text > file or echo text >> file.');target=resolvePath(tokens.at(-1).value,cwd);append=tokens[redirection].value==='>>';tokens.splice(redirection);}
  const [cmd,...args]=tokens.map(t=>t.value);
  const count=(min,max=min)=>{if(args.length<min||args.length>max)throw Error('Invalid arguments for '+cmd+'. Type help.');};
  const path=(i=0)=>resolvePath(args[i],cwd);
  switch(cmd){
   case 'help':count(0);print(help);break;
   case 'pwd':count(0);print(cwd);break;
   case 'ls':count(0,1);{const p=args.length?path():cwd,n=fs.get(p);print(n.type==='file'?quoteArgument(basename(p)):fs.list(p).map(([p,n])=>quoteArgument(basename(p)+(n.type==='directory'?'/':''))).join('\n')||'(empty)');}break;
   case 'cd':count(0,1);{const next=args[0]==='-'?previous:args.length?path():HOME;if(fs.get(next).type!=='directory')throw Error('Not a directory: '+next);previous=cwd;cwd=next;}break;
   case 'tree':count(0,1);{const start=args.length?path():cwd;const lines=[displayPath(start)];let visited=0;function walk(p,depth){if(depth>20){lines.push('  '.repeat(depth)+'…');return;}for(const [child,n] of fs.list(p)){if(++visited>500)return;lines.push('  '.repeat(depth)+basename(child)+(n.type==='directory'?'/':''));if(n.type==='directory')walk(child,depth+1);}}walk(start,1);print(lines.join('\n'));}break;
   case 'mkdir':count(1);fs.mkdir(path());refresh();break;
   case 'touch':count(1);fs.touch(path());refresh();break;
   case 'cat':count(1);{const p=args[0]==='note'?fs.data.active:path();const n=fs.get(p);if(n.type!=='file')throw Error('Not a file.');print(n.content);}break;
   case 'mv':case 'cp':count(2);saveDraft();{const src=path(),dest=fs.move(src,path(1),cmd==='cp');if(cmd==='mv'){const remap=p=>p===src||p.startsWith(src+'/')?dest+p.slice(src.length):p;cwd=remap(cwd);previous=remap(previous);folder=remap(folder);}refresh();}break;
   case 'rm':{const names=args[0]==='--'?args.slice(1):args;if(!names.length)throw Error('Use rm <file> [file...].');if(args[0]!=='--'&&args.some(a=>a.startsWith('-')))throw Error('rm removes files only; flags are not supported. Use -- for names starting with a dash.');saveDraft();const paths=names.map(name=>resolvePath(name,cwd));try{fs.remove(paths);}catch(error){if(error.message.startsWith('No such file or directory:')){const suggestion=suggestRemoval(names,cwd,fs.data.entries);throw Error(error.message+'\nNo files were removed.'+(suggestion?'\nFilenames with spaces need quotes. Try: '+suggestion:'\nUse ls to check exact names. Quote names with spaces, for example: rm "My note.txt"'));}throw error;}if(!fs.data.active){draft=null;unsaved=false;}refresh();print('Removed '+new Set(paths).size+' file(s).');}break;
   case 'echo':if(target){saveDraft();fs.write(target,args.join(' ')+'\n',append);refresh();}else print(args.join(' '));break;
   case 'edit':count(1);openFile(path());break;
   case 'open':count(1);if(appIds.includes(args[0])){openApp(args[0]);break;}{const p=path();if(fs.get(p).type==='directory'){folder=p;openApp('files');renderFiles($('[aria-label="Files"] .window-body'));}else openFile(p);}break;
   case 'download':count(1);download(path());print('Download requested.');break;
   case 'apps':count(0);print(appIds.join('  '));break;
   case 'history':count(0);print(history.map((v,i)=>`${i+1}  ${v}`).join('\n'));break;
   case 'date':count(0);print(new Date().toLocaleString());break;
   case 'whoami':count(0);print('daniel');break;
   case 'clear':count(0);$('#terminal-output').textContent='';break;
   default:throw Error('Unknown command: '+cmd+'. Type help.');
  }
 }
 window.addEventListener('beforeunload',e=>{if(unsaved){e.preventDefault();e.returnValue='';}});
 return {render(id,body){({notes:renderNotes,files:renderFiles,terminal:renderTerminal})[id](body);},exportNote:()=>guard(()=>download()),beforeClose(id){if(id==='notes')try{saveDraft();}catch(e){report(e);return false;}return true;}};
}
