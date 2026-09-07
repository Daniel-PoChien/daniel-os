import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
const $=s=>document.querySelector(s), defaults={floors:2,width:18,finish:'limestone',light:'golden',pool:true,roof:false};
let state={...defaults};
try{const s=JSON.parse(localStorage.getItem('daniel-os-luxury')||'null');if(s&&[1,2,3].includes(s.floors)&&[14,16,18,20,22,24].includes(s.width)&&['limestone','ivory','basalt'].includes(s.finish)&&['day','golden','dusk'].includes(s.light)&&typeof s.pool==='boolean'&&typeof s.roof==='boolean')state={...defaults,...s};}catch{}
const host=$('#viewport');let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{$('#loading').textContent='3D rendering is unavailable. Enable hardware acceleration or try another browser.';document.querySelectorAll('aside input, aside button, aside select, .views button').forEach(el=>el.disabled=true);}
if(renderer){
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;host.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','3D luxury villa; use camera buttons or drag to explore');
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(42,1,.1,500), controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.minDistance=14;controls.maxDistance=85;controls.maxPolarAngle=Math.PI*.48;controls.target.set(0,3,0);controls.autoRotateSpeed=.6;
const hemi=new THREE.HemisphereLight(0xc5e7ff,0x696245,2);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffd4a3,3.5);sun.position.set(-22,30,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:1,far:100});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;scene.add(sun);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.7,...extra});
const stone=mat(0xdbd3be),trim=mat(0xe7e0d0),wood=mat(0x795338),dark=mat(0x25363b),glass=mat(0x85b7c0,{metalness:.45,roughness:.16,transparent:true,opacity:.55}),water=mat(0x208f9d,{metalness:.4,roughness:.18}),green=mat(0x536b44),trunk=mat(0x66513b),warm=mat(0xffd08a,{emissive:0xffa54d,emissiveIntensity:.6}),cushion=mat(0xe8dfca);
let building=new THREE.Group();scene.add(building);
function box(parent,w,h,d,x,y,z,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
box(scene,200,.3,200,0,-1.7,0,mat(0x527b85,{roughness:.3,metalness:.2}));box(scene,38,1.6,32,0,-.7,0,mat(0x7b8073));box(scene,37,.15,31,0,.15,0,mat(0x959d80));box(scene,30,.2,23,0,.3,1,trim);
for(const [x,z] of [[-15,-10],[15,-10],[-15,9],[15,10],[-14,-3],[15,-2]]){box(scene,.28,3.6,.28,x,2,z,trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2,2),green);crown.position.set(x,4,z);crown.scale.set(1,1.35,1);crown.castShadow=true;scene.add(crown);box(scene,2.6,.4,2.6,x,.55,z,dark);}
for(let i=0;i<7;i++)box(scene,2.7,.12,1.2,0,.43,-14+i*1.6,stone);
function build(){
 building.traverse(o=>{if(o.geometry)o.geometry.dispose();});scene.remove(building);building=new THREE.Group();scene.add(building);
 const w=state.width,n=state.floors;stone.color.set({limestone:0xdbd3be,ivory:0xf4f1ea,basalt:0x53595c}[state.finish]);
 for(let f=0;f<n;f++){
 const y=.55+f*3.7,fw=w-f*1.8,offset=f*.65;
 box(building,fw+.8,.32,11,offset,y,0,trim);
 box(building,fw,3.35,.3,offset,y+1.8,-4.8,stone);
 box(building,.3,3.35,10,offset-fw/2,y+1.8,0,stone);
 box(building,.3,3.35,10,offset+fw/2,y+1.8,0,stone);
 box(building,fw-.4,2.9,.07,offset,y+1.7,4.6,glass);
 for(let x=-fw/2+.4;x<fw/2;x+=2.5){box(building,.08,3.25,.13,offset+x,y+1.8,4.65,dark);}
 box(building,fw,.12,.18,offset,y+.3,4.65,dark);
 box(building,fw,.12,.18,offset,y+3.3,4.65,dark);
 box(building,.15,3.3,7,offset+fw*.18,y+1.8,-1,stone);
 // Furnished living suite visible through glazing and in the cutaway.
 box(building,3,.5,1.3,offset-2,y+.6,2.3,cushion);box(building,3,.7,.25,offset-2,y+1,1.65,wood);
 box(building,1.7,.35,.9,offset-2,y+.4,3.7,wood);
 box(building,2.7,.55,3,offset+fw*.32,y+.6,0,cushion);box(building,2.7,1,.2,offset+fw*.32,y+.9,-1.5,wood);
 box(building,fw-.6,.055,.12,offset,y+3.3,4.3,warm);
 if(f>0){box(building,fw+.5,.18,1.3,offset,y,5.4,trim);box(building,fw+.5,.95,.05,offset,y+.6,5.95,glass);box(building,fw+.5,.055,.08,offset,y+1.1,5.95,dark);}
 }
 const top=.55+n*3.7;
 if(!state.roof){box(building,w-(n-1)*1.8+1.2,.35,11.4,(n-1)*.65,top,0,trim);box(building,4,.25,3,2,top+.3,-1,dark);}
 // Timber screening and a shaded garden pavilion.
 for(let i=0;i<10;i++)box(building,.14,n*3.7,.3,-w/2+.4+i*.28,n*1.85+.55,4.8,wood);
 for(const x of [-10,-5])for(const z of [8,12])box(building,.15,2.7,.15,x,1.8,z,dark);
 for(let x=-10.3;x<-4.7;x+=.45)box(building,.18,.18,4.7,x,3.2,10,wood);
 if(state.pool){box(building,12,.22,5,4,.5,10,stone);box(building,11.5,.1,4.5,4,.66,10,water);for(let i=0;i<6;i++)box(building,11.1,.006,.018,4,.716,8.1+i*.73,trim);}
 else box(building,12,.18,5,4,.5,10,green);
 for(const x of [-1,2,5]){box(building,1.1,.25,2.2,x,.65,14,cushion);box(building,1.1,.25,.65,x,.85,13.3,wood);}
 $('#area').textContent=Array.from({length:n},(_,f)=>(w-f*1.8)*10).reduce((a,b)=>a+b,0).toFixed(0);$('#height').textContent=(n*3.7+.9).toFixed(1);$('#floors-value').textContent=n;$('#width-value').textContent=w+' m';
}
function lighting(){const dusk=state.light==='dusk',gold=state.light==='golden';scene.background=new THREE.Color(dusk?0x344b64:gold?0xbac5c7:0xb9d8e6);scene.fog=new THREE.Fog(scene.background,65,170);sun.color.set(gold?0xffcb90:dusk?0x91acff:0xfff5e6);sun.intensity=dusk?.6:3.5;sun.position.set(gold?-24:15,gold?17:35,20);hemi.intensity=dusk?.7:2;warm.emissiveIntensity=dusk?3:.6;$('.scene-label').style.color=dusk?'#e5edf3':'#172b35';$('.hint').style.color=dusk?'#d4e0e6':'#18333f';}
function view(name){controls.target.set(0,3,1);camera.position.set(...({perspective:[34,25,40],front:[0,10,48],plan:[0,62,.1]}[name]));controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
function sync(){for(const key of ['floors','width','light'])$('#'+key).value=state[key];for(const key of ['pool','roof'])$('#'+key).checked=state[key];document.querySelectorAll('[data-finish]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.finish===state.finish));build();lighting();}
for(const key of ['floors','width','light','pool','roof'])$('#'+key).addEventListener('input',e=>{state[key]=['pool','roof'].includes(key)?e.target.checked:['floors','width'].includes(key)?Number(e.target.value):e.target.value;sync();$('#status').textContent='Unsaved changes.';});
document.querySelectorAll('[data-finish]').forEach(b=>b.onclick=()=>{state.finish=b.dataset.finish;sync();$('#status').textContent='Unsaved changes.';});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));controls.addEventListener('start',()=>document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('active')));
$('#rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('#rotate').setAttribute('aria-pressed',controls.autoRotate);};
$('#save').onclick=()=>{try{localStorage.setItem('daniel-os-luxury',JSON.stringify(state));$('#status').textContent='Design saved on this device.';}catch{$('#status').textContent='Storage unavailable. Keep this tab open.';}};
$('#reset').onclick=()=>{state={...defaults};controls.autoRotate=false;$('#rotate').setAttribute('aria-pressed','false');sync();view('perspective');$('#status').textContent='Default design restored. Save to keep it.';};
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}).observe(host);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#loading').textContent='3D graphics were interrupted. Reload this app to resume.';});
sync();view('perspective');$('#loading').textContent='';let visible=true;new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}).observe(host);
renderer.setAnimationLoop(()=>{if(document.hidden||!visible)return;controls.update();renderer.render(scene,camera);});
}
