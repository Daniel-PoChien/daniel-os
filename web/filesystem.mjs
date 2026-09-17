export const HOME='/home/daniel';
export const FS_KEY='daniel-os-filesystem-v1';
export function tokenize(line){
 const tokens=[];let value='',quote='',started=false;
 for(let i=0;i<line.length;i++){
  const c=line[i];
  if(c==='\\'&&quote!=="'"){if(++i===line.length)throw Error('Trailing escape.');value+=line[i];started=true;}
  else if(quote){if(c===quote)quote='';else value+=c;}
  else if(c==='"'||c==="'"){quote=c;started=true;}
  else if(/\s/.test(c)){if(started){tokens.push({value,operator:false});value='';started=false;}}
  else if(c==='>'){if(started){tokens.push({value,operator:false});value='';started=false;}tokens.push({value:line[i+1]==='>'?(i++,'>>'):'>',operator:true});}
  else {value+=c;started=true;}
 }
 if(quote)throw Error('Unclosed quote.');if(started)tokens.push({value,operator:false});return tokens;
}
export function resolvePath(input='~',cwd=HOME){
 if(typeof input!=='string'||!input||/[\x00-\x1f\x7f]/.test(input))throw Error('Enter a valid path.');
 if(input==='~'||input.startsWith('~/'))input=HOME+input.slice(1);
 const parts=(input.startsWith('/')?input:cwd+'/'+input).split('/'),out=[];
 for(const part of parts){if(!part||part==='.')continue;if(part==='..')out.pop();else {if(part.length>160)throw Error('Name is too long (maximum 160 characters).');out.push(part);}}
 return '/'+out.join('/');
}
export const parentPath=path=>path.slice(0,path.lastIndexOf('/'))||'/';
export const basename=path=>path.split('/').pop()||'/';
export const displayPath=path=>path===HOME?'~':path.startsWith(HOME+'/')?'~'+path.slice(HOME.length):path;
const directory=()=>({type:'directory'});
const file=content=>({type:'file',content});
export class FileSystem {
 constructor(storage){
  this.storage=storage;this.loadError='';this.raw=null;
  const entries=Object.create(null);['/','/home',HOME,...['Desktop','Documents','Downloads'].map(n=>HOME+'/'+n)].forEach(p=>entries[p]=directory());
  let old='';try{old=storage.getItem('daniel-os-note')||'';}catch{}
  entries[HOME+'/Documents/My note.txt']=file(old);
  entries[HOME+'/Desktop/Read me.txt']=file('Welcome to Daniel OS.\n\nDocuments, Downloads, and Desktop are virtual folders saved in this browser.\nUse Files or type help in Terminal. Notes can edit and rename any text file.\nUse download to export a file to your computer. Browser data does not sync between devices.');
  this.data={version:1,entries,active:HOME+'/Documents/My note.txt'};
  try{this.raw=storage.getItem(FS_KEY);if(this.raw!==null){const saved=JSON.parse(this.raw);this.validate(saved);this.data=saved;}}
  catch{this.loadError='Workspace storage could not be read. Existing stored data was left untouched. Reload after restoring storage access.';}
 }
 validate(data){
  if(!data||data.version!==1||!data.entries||typeof data.entries!=='object')throw Error('Invalid workspace');
  for(const [path,node] of Object.entries(data.entries)){
   if(resolvePath(path)!==path||!path.startsWith('/')||!node||!['file','directory'].includes(node.type)||(node.type==='file'&&typeof node.content!=='string'))throw Error('Invalid entry');
   if(path!=='/'&&data.entries[parentPath(path)]?.type!=='directory')throw Error('Missing parent');
  }
  for(const path of ['/','/home',HOME])if(data.entries[path]?.type!=='directory')throw Error('Missing home');
  if(data.entries[data.active]?.type!=='file')throw Error('Missing note');
 }
 get(path){const entry=this.data.entries[path];if(!entry)throw Error('No such file or directory: '+displayPath(path));return entry;}
 list(path){if(this.get(path).type!=='directory')throw Error('Not a directory: '+displayPath(path));return Object.entries(this.data.entries).filter(([p])=>p!=='/'&&parentPath(p)===path).sort(([a,x],[b,y])=>x.type===y.type?a.localeCompare(b):x.type==='directory'?-1:1);}
 commit(change){
  if(this.loadError)throw Error(this.loadError);
  const next=JSON.parse(JSON.stringify(this.data));change(next);this.validate(next);
  try{if(this.storage.getItem(FS_KEY)!==this.raw)throw Error('conflict');const raw=JSON.stringify(next);this.storage.setItem(FS_KEY,raw);this.raw=raw;}
  catch(e){throw Error(e.message==='conflict'?'Workspace changed in another tab. Export unsaved text, then reload.':'Could not save: browser storage is unavailable or full. Export your unsaved text.');}
  this.data=next;
 }
 checkNew(path){if(path=== '/'||this.data.entries[path])throw Error('Name already exists: '+displayPath(path));if(this.get(parentPath(path)).type!=='directory')throw Error('Parent is not a directory.');}
 mkdir(path){this.checkNew(path);this.commit(d=>{d.entries[path]=directory();});}
 write(path,content,append=false){if(this.data.entries[path]?.type==='directory')throw Error('Cannot write to a directory.');if(!this.data.entries[path])this.checkNew(path);this.commit(d=>{d.entries[path]=file((append?(d.entries[path]?.content||''):'')+content);});}
 touch(path){if(this.data.entries[path]){if(this.get(path).type!=='file')throw Error('Not a file.');return;}this.write(path,'');}
 activate(path){if(this.get(path).type!=='file')throw Error('Not a text file.');if(this.data.active!==path)this.commit(d=>{d.active=path;});}
 move(source,target,copy=false){
  const node=this.get(source);if(target===source)return target;
  if(this.data.entries[target]?.type==='directory')target=target+'/'+basename(source);
  this.checkNew(target);
  if(['/','/home',HOME].includes(source))throw Error('Cannot move system folders.');
  if(target.startsWith(source+'/'))throw Error('Cannot move or copy a folder inside itself.');
  this.commit(d=>{for(const [p,n] of Object.entries(this.data.entries)){if(p===source||p.startsWith(source+'/')){d.entries[target+p.slice(source.length)]={...n};if(!copy)delete d.entries[p];}}
   if(!copy&&(d.active===source||d.active.startsWith(source+'/')))d.active=target+d.active.slice(source.length);
  });return target;
 }
}
