import test from 'node:test';
import assert from 'node:assert/strict';
import {FileSystem,FS_KEY,HOME,resolvePath,tokenize} from '../web/filesystem.mjs';
function storage(initial={}){const data=new Map(Object.entries(initial));return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
test('paths, parent traversal and quoted redirection',()=>{
 assert.equal(resolvePath('../Downloads',HOME+'/Documents'),HOME+'/Downloads');
 assert.equal(resolvePath('~/Documents/./Ideas/..'),HOME+'/Documents');
 assert.equal(resolvePath('../../../../',HOME),'/');
 assert.deepEqual(tokenize('echo "a > b" >> "a file.txt"').map(t=>[t.value,t.operator]),[['echo',false],['a > b',false],['>>',true],['a file.txt',false]]);
 assert.throws(()=>tokenize('cat "unfinished'));assert.throws(()=>resolvePath('bad\nname'));
});
test('legacy note migrates without changing the original backup',()=>{
 const store=storage({'daniel-os-note':'precious old note'}),fs=new FileSystem(store);
 assert.equal(fs.get(fs.data.active).content,'precious old note');
 fs.mkdir(HOME+'/Documents/Ideas');const restored=new FileSystem(store);
 assert.equal(restored.get(restored.data.active).content,'precious old note');
 assert.equal(store.getItem('daniel-os-note'),'precious old note');
});
test('rename, move folder with active file, copies, no overwrites',()=>{
 const fs=new FileSystem(storage()),old=fs.data.active;
 fs.move(old,HOME+'/Documents/Plan.txt');assert.equal(fs.data.active,HOME+'/Documents/Plan.txt');
 fs.write(fs.data.active,'one');fs.write(fs.data.active,'two',true);assert.equal(fs.get(fs.data.active).content,'onetwo');
 fs.move(HOME+'/Documents',HOME+'/Projects');assert.equal(fs.data.active,HOME+'/Projects/Plan.txt');
 fs.move(HOME+'/Projects',HOME+'/Downloads',true);assert.equal(fs.get(HOME+'/Downloads/Projects/Plan.txt').content,'onetwo');
 assert.throws(()=>fs.move(fs.data.active,HOME+'/Downloads/Projects/Plan.txt'));
 assert.throws(()=>fs.move(HOME+'/Projects',HOME+'/Projects/inside'));
 assert.throws(()=>fs.move(HOME,HOME+'/other'));
});
test('write failure is atomic and another tab cannot overwrite newer changes',()=>{
 const store=storage(),fs=new FileSystem(store);fs.write(fs.data.active,'saved');
 store.setItem=()=>{throw Error('quota');};assert.throws(()=>fs.write(fs.data.active,'lost'),/Could not save/);assert.equal(fs.get(fs.data.active).content,'saved');
 const shared=storage(),a=new FileSystem(shared),b=new FileSystem(shared);a.mkdir(HOME+'/new');assert.throws(()=>b.mkdir(HOME+'/stale'),/another tab/);assert.equal(b.data.entries[HOME+'/stale'],undefined);
});
test('corrupt workspace is preserved and never replaced on write',()=>{
 const store=storage({[FS_KEY]:'bad-json'}),fs=new FileSystem(store);assert.ok(fs.loadError);assert.throws(()=>fs.write(fs.data.active,'new'));assert.equal(store.getItem(FS_KEY),'bad-json');
});
