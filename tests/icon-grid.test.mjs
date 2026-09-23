import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutPins} from '../web/icon-grid.mjs';
import {appSymbol} from '../web/icons.mjs';
const ids=['welcome','luxury','hardware','files','notes','terminal','focus','settings','about'];
test('colliding saved icon positions produce separate grid cells across viewports',()=>{
 for(const width of [280,320,390,768,1440])for(const height of [320,600,900]){
  const pins=ids.map(id=>({id,x:1,y:1}));const {placements,contentHeight}=layoutPins(pins,width,height);
  assert.equal(placements.length,ids.length);
  for(const a of placements){assert.ok(a.left>=0&&a.left+92<=width);assert.ok(a.top+102<=contentHeight);for(const b of placements){if(a===b)continue;assert.ok(a.left+92<=b.left||b.left+92<=a.left||a.top+102<=b.top||b.top+102<=a.top);}}
  assert.deepEqual(layoutPins(pins,width,height).placements,placements);
 }
});
test('each app has a distinct recognizable SVG and an active variant',()=>{
 assert.equal(new Set(ids.map(id=>appSymbol(id))).size,ids.length);
 for(const id of ids){assert.match(appSymbol(id),/^<svg/);assert.notEqual(appSymbol(id,true),appSymbol(id,false));}
});
