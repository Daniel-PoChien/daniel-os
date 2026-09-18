import {resolvePath} from './filesystem.mjs?v=desktop-pins-rm-1';
export function quoteArgument(value){return /^[a-zA-Z0-9_./~+-]+$/.test(value)?value:'"'+value.replace(/[\\"]/g,'\\$&')+'"';}
// Suggest a correction only when one unambiguous grouping matches existing files.
// Never run the suggestion: rm still requires explicitly separated arguments.
export function suggestRemoval(names,cwd,entries){
 if(names.length<2||names.length>32)return null;
 const memo=new Map();
 function choices(start){
  if(start===names.length)return [[]];if(memo.has(start))return memo.get(start);
  const found=[];
  for(let end=start+1;end<=names.length&&found.length<2;end++){
   const name=names.slice(start,end).join(' ');let path;try{path=resolvePath(name,cwd);}catch{continue;}
   if(entries[path]?.type!=='file')continue;
   for(const tail of choices(end)){found.push([name,...tail]);if(found.length===2)break;}
  }
  memo.set(start,found);return found;
 }
 const matches=choices(0);
 if(matches.length!==1||matches[0].length===names.length)return null;
 return 'rm '+(matches[0].some(n=>n.startsWith('-'))?'-- ':'')+matches[0].map(quoteArgument).join(' ');
}
