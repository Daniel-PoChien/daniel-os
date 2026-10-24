import test from 'node:test';
import assert from 'node:assert/strict';
import {prompts,categories,motions,filterPrompts,buildPrompt} from '../web/prompt-lab/prompts.mjs';
test('prompt library supports searchable categories and saved items',()=>{
 assert.ok(prompts.length>=10);
 assert.equal(new Set(prompts.map(prompt=>prompt.id)).size,prompts.length);
 assert.ok(prompts.every(prompt=>categories.includes(prompt.category)));
 assert.deepEqual(filterPrompts('count up').map(prompt=>prompt.id),['motion']);
 assert.deepEqual(filterPrompts('','Saved',new Set(['hero','motion'])).map(prompt=>prompt.id),['hero','motion']);
 assert.ok(motions.length>=9);
});
test('generated prompt carries the specific brief and practical quality checks',()=>{
 const text=buildPrompt(prompts.find(prompt=>prompt.id==='motion'),{project:'Northline Coffee',audience:'remote workers',goal:'book a tasting',style:'warm editorial',stack:'HTML and CSS'});
 for(const phrase of ['Northline Coffee','remote workers','book a tasting','warm editorial','HTML and CSS','Count Up','Marquee','Hover Lift','reduced-motion','implementation checklist'])assert.ok(text.includes(phrase),phrase);
 assert.ok(!text.includes('[project or brand]'));
 assert.throws(()=>buildPrompt({id:'unknown'}));
});
