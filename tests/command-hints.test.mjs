import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteArgument,suggestRemoval} from '../web/command-hints.mjs';
import {FileSystem,HOME,tokenize,resolvePath} from '../web/filesystem.mjs';
function fixture(){const map=new Map();return new FileSystem({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)});}
test('format filenames as round-trip-safe terminal arguments',()=>{
 for(const name of ['plan.txt','Untitled 2.txt',`O'Brien.txt`,'say "hello".txt','a\\b.txt','a>b.txt'])assert.equal(tokenize(quoteArgument(name))[0].value,name);
});
test('reported rm commands suggest quoting without changing any files',()=>{
 const fs=fixture(),cwd=HOME+'/Documents';fs.touch(cwd+'/Untitled 2.txt');fs.touch(cwd+'/Untitled.txt');
 const before=JSON.stringify(fs.data);
 assert.equal(suggestRemoval(['Untitled','2.txt'],cwd,fs.data.entries),'rm "Untitled 2.txt"');
 assert.equal(suggestRemoval(['Untitled','2.txt','Untitled.txt'],cwd,fs.data.entries),'rm "Untitled 2.txt" Untitled.txt');
 assert.equal(JSON.stringify(fs.data),before);
 assert.throws(()=>fs.remove(['Untitled','2.txt'].map(p=>resolvePath(p,cwd))));assert.equal(JSON.stringify(fs.data),before);
 const args=tokenize('rm "Untitled 2.txt" Untitled.txt').slice(1).map(t=>resolvePath(t.value,cwd));fs.remove(args);
 assert.ok(!fs.data.entries[cwd+'/Untitled 2.txt']);assert.ok(!fs.data.entries[cwd+'/Untitled.txt']);assert.ok(fs.data.entries[cwd+'/My note.txt']);
});
test('never suggest an ambiguous grouping or an unrelated missing path',()=>{
 const fs=fixture(),cwd=HOME+'/Documents';for(const name of ['a b','c','a','b c'])fs.touch(cwd+'/'+name);
 assert.equal(suggestRemoval(['a','b','c'],cwd,fs.data.entries),null);
 assert.equal(suggestRemoval(['missing','file'],cwd,fs.data.entries),null);
});
