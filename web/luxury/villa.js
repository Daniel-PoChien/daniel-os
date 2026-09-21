import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {DRACOLoader} from './vendor/DRACOLoader.js';
const $=s=>document.querySelector(s),host=$('#viewport');
let renderer,controls,model,paths,playing=false,rail=false,time=0,route='interior',last=0,visible=true,lastFilmButton=null;
let walking=false,yaw=0,pitch=0,walkPhase=0,jumpHeight=0,jumpVelocity=0,grounded=true;const keys=new Set(),walkRay=new THREE.Raycaster(),walkDirection=new THREE.Vector3(),walkRight=new THREE.Vector3(),walkVelocity=new THREE.Vector3(),collisionOrigin=new THREE.Vector3();
const touchMode=matchMedia('(pointer:coarse)').matches;let touchX=0,touchY=0;
const mobileStyle=document.createElement('style');mobileStyle.textContent='#mobile-controls{position:absolute;z-index:4;left:16px;right:16px;bottom:18px;display:flex;align-items:flex-end;justify-content:space-between;pointer-events:none}.move-pad{display:grid;grid-template-columns:repeat(3,50px);grid-template-rows:repeat(2,50px);gap:5px}.move-pad button,#mobile-jump{pointer-events:auto;border:1px solid #f0d7aa99;background:#142832dd;color:#fff;touch-action:none;user-select:none;-webkit-user-select:none}.move-pad button{border-radius:12px;font-size:19px}.move-pad button[data-move=KeyW]{grid-column:2}.move-pad button[data-move=KeyA]{grid-column:1;grid-row:2}.move-pad button[data-move=KeyS]{grid-column:2;grid-row:2}.move-pad button[data-move=KeyD]{grid-column:3;grid-row:2}#mobile-jump{width:72px;height:72px;border-radius:50%;font-size:14px}#mobile-controls[hidden]{display:none!important}';document.head.append(mobileStyle);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa9bbc2);scene.fog=new THREE.Fog(0xa9bbc2,110,420);
const camera=new THREE.PerspectiveCamera(48,1,.06,1000);
const materialLooks={
 'Low iron glass':{color:0x86aaa0,roughness:.08,metalness:0,opacity:.22,transparent:true,transmission:.55,depthWrite:false},
 'Oatmeal woven linen':{color:0xb9a98e,roughness:.92,metalness:0},
 'Satin brass':{color:0xb6843f,roughness:.28,metalness:.82},
 'Dark patinated bronze':{color:0x25352d,roughness:.34,metalness:.66},
 'Quarter-sawn natural oak':{color:0x9a6338,roughness:.48,metalness:0},
 'Warm porcelain':{color:0xd5cdb7,roughness:.25,metalness:0},
 'Warm 2700 K glow':{color:0xffb45d,roughness:.36,metalness:0,emissive:0xff7b25,emissiveIntensity:2.1},
 'Exterior thermowood':{color:0x65412e,roughness:.55,metalness:0},
 'Viridian upholstery':{color:0x1c5a45,roughness:.88,metalness:0},
 'Charcoal ceramics':{color:0x202824,roughness:.33,metalness:0},
 'Chalk | fine lime plaster':{color:0xd8cfba,roughness:.86,metalness:0},
 'Fine granite gravel':{color:0x7f7d70,roughness:.96,metalness:0},
 'Warm grey limestone':{color:0x92897a,roughness:.68,metalness:0},
 'Viridian leaves':{color:0x17643d,roughness:.72,metalness:0,side:THREE.DoubleSide},
 'Forest humus':{color:0x34271e,roughness:.98,metalness:0},
 'Forest bark':{color:0x49362a,roughness:.92,metalness:0},
 'Clay cushion':{color:0xa34d32,roughness:.88,metalness:0},
 'Pool water':{color:0x087b75,roughness:.12,metalness:.06,opacity:.88,transparent:true,transmission:.18,depthWrite:false},
 'Canopy variation 3':{color:0x476a2d,roughness:.82,metalness:0},
 'Canopy variation 2':{color:0x164a30,roughness:.82,metalness:0},
 'Canopy variation 1':{color:0x397443,roughness:.82,metalness:0},
 'Canopy variation 0':{color:0x27673b,roughness:.82,metalness:0},
 'Mirror 13.4':{color:0xb9c9c2,roughness:.06,metalness:.92},
 'Mirror 15.7':{color:0xb9c9c2,roughness:.06,metalness:.92},
 'Mirror 18.45':{color:0xb9c9c2,roughness:.06,metalness:.92}
};
function translateMaterial(material){
 const look=materialLooks[material.name];if(!look)return;
 if(look.color!==undefined)material.color.setHex(look.color);
 for(const key of ['roughness','metalness','opacity','transparent','transmission','depthWrite','side','emissiveIntensity'])if(look[key]!==undefined&&key in material)material[key]=look[key];
 if(look.emissive!==undefined&&material.emissive)material.emissive.setHex(look.emissive);
 material.needsUpdate=true;
}
function status(text){$('#status').textContent=text;}
function setPlay(){ $('#play').textContent=playing?'Pause tour Ⅱ':time>=duration()?'Replay tour ▷':'Play '+(route==='interior'?'interior tour':'golden-hour tour')+' ▷';$('#play').setAttribute('aria-pressed',String(playing));}
function duration(){return paths?.[route]?.duration||30;}
function stamp(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');}
function progress(){ $('#progress').value=time;$('#elapsed').textContent=stamp(time)+' / '+stamp(duration());}
const p=new THREE.Vector3(),t=new THREE.Vector3();
function applyTour(){if(!paths)return;const frames=paths[route].frames,n=Math.min(time*24,frames.length-1),i=Math.floor(n),b=frames[Math.min(i+1,frames.length-1)],a=frames[i],f=n-i;p.fromArray(a.p).lerp(new THREE.Vector3(...b.p),f);t.fromArray(a.t).lerp(new THREE.Vector3(...b.t),f);camera.position.copy(p);controls.target.copy(t);camera.lookAt(t);camera.fov=paths[route].fov;camera.updateProjectionMatrix();progress();}
function stop(){playing=false;rail=false;$('.hint').textContent='Drag to explore · Scroll or pinch to zoom';if(controls)controls.enabled=true;setPlay();}
function exitWalk(){if(!walking)return;walking=false;keys.clear();walkVelocity.set(0,0,0);jumpHeight=jumpVelocity=0;grounded=true;camera.position.y=1.67;camera.rotation.z=0;if(controls)controls.enabled=true;$('#walk').textContent='Walk inside';$('.views').hidden=false;$('#mobile-controls').hidden=true;$('.hint').textContent='Drag to explore · Scroll or pinch to zoom';status('First-person walk ended.');}
function startWalk(){if(!model||!renderer)return;stop();walking=true;walkPhase=jumpHeight=jumpVelocity=0;grounded=true;walkVelocity.set(0,0,0);controls.enabled=false;camera.position.set(8.7,1.67,-15);camera.rotation.order='YXZ';yaw=0;pitch=0;camera.rotation.set(0,0,0);$('#walk').textContent='Exit walk';$('.views').hidden=true;$('#mobile-controls').hidden=!touchMode;$('.hint').textContent=touchMode?'Use arrows to walk · Drag the scene to look · Tap Jump':'WASD to walk · Shift to move faster · Space to jump · Mouse to look · Esc to exit';$('#scene-caption').textContent='First-person walkthrough from the entry.';if(!touchMode)renderer.domElement.requestPointerLock?.();status(touchMode?'Touch walk mode enabled.':'Walk mode: WASD, Shift, Space, and mouse.');}
function jump(){if(walking&&grounded){grounded=false;jumpVelocity=4.65;}}
function bodyBlocked(heading,distance){walkRight.set(-heading.z,0,heading.x);for(const height of [.42,.95,1.48])for(const side of [-.22,0,.22]){collisionOrigin.set(camera.position.x, height, camera.position.z).addScaledVector(walkRight,side);walkRay.set(collisionOrigin,heading);walkRay.far=distance;const hit=walkRay.intersectObject(model,true).find(result=>!/(leaf|canopy|water)/i.test(result.object.material?.name||''));if(hit)return true;}return false;}
function updateWalk(delta){if(!walking)return;const forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),side=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),moving=forward||side;walkDirection.set(0,0,0);if(moving){walkDirection.set(-Math.sin(yaw),0,-Math.cos(yaw)).multiplyScalar(forward);walkRight.set(Math.cos(yaw),0,-Math.sin(yaw)).multiplyScalar(side);walkDirection.add(walkRight).normalize().multiplyScalar(keys.has('ShiftLeft')||keys.has('ShiftRight')?4.8:3.2);}walkVelocity.lerp(walkDirection,1-Math.exp(-10*delta));const speed=walkVelocity.length();if(speed>.04){const heading=walkVelocity.clone().normalize();if(!bodyBlocked(heading,.5+speed*delta))camera.position.addScaledVector(walkVelocity,delta);else walkVelocity.set(0,0,0);walkPhase+=speed*delta*5.2;}if(!grounded){jumpVelocity-=11.8*delta;jumpHeight+=jumpVelocity*delta;if(jumpHeight<=0){jumpHeight=jumpVelocity=0;grounded=true;}}const blend=1-Math.exp(-12*delta),bob=grounded&&speed>.12?Math.sin(walkPhase)*Math.min(.045,speed*.012):0,sway=speed>.12?Math.sin(walkPhase*.5)*.008:0;camera.position.y=THREE.MathUtils.lerp(camera.position.y,1.67+jumpHeight+bob,blend);camera.rotation.set(pitch,yaw,sway);}
function begin(){if(!paths||!model)return;rail=true;$('.hint').textContent='Guided camera · Pause or scrub to inspect · Explore freely to move';host.dataset.mode=route;controls.enabled=false;$('#reveal').checked=false;reveal(false);document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('active'));$('#scene-caption').textContent=paths[route].name;}
function reveal(value){model?.traverse(o=>{if(/roof[ _]slab|Timber[ _]soffit/i.test(o.name))o.visible=!value;});}
function view(name){if(!controls)return;stop();const views={exterior:{p:[17,3.9,12],t:[11,1.2,0],f:56},living:{p:[10.8,1.65,-.95],t:[11,1.35,3.2],f:72},playing:{p:[6.4,1.55,-8.2],t:[9,1.1,-7.2],f:72},office:{p:[3.7,1.65,-13.3],t:[3.7,1.2,-15.2],f:66},primary:{p:[13.7,1.65,-4.8],t:[15.3,1.2,-4.8],f:68},terrace:{p:[13,1.75,5.8],t:[12.9,1.15,2.7],f:62},plan:{p:[10,42,-8],t:[10,0,-8],f:48}};const v=views[name];host.dataset.mode=name;camera.position.fromArray(v.p);controls.target.fromArray(v.t);camera.fov=v.f;camera.updateProjectionMatrix();controls.update();$('#reveal').checked=name==='plan';reveal(name==='plan');document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('#scene-caption').textContent={exterior:'Pool, terrace, and viridian forest.',living:'Open living, dining, and kitchen.',playing:'Two open connections to kitchen and entry.',office:'A quiet, separate workspace facing the forest.',primary:'Primary bedroom with dressing room and bathroom.',terrace:'Covered terrace opening toward the infinity pool.',plan:'The refined three-bedroom floor plan.'}[name];}
try{
renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;host.prepend(renderer.domElement);
controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.2;controls.maxDistance=85;controls.maxPolarAngle=Math.PI*.49;
scene.background=new THREE.Color(0x49655c);scene.fog=new THREE.Fog(0x49655c,65,210);
scene.add(new THREE.HemisphereLight(0xc5d7cd,0x17251e,1.25));
const sun=new THREE.DirectionalLight(0xffad68,4.0);sun.position.set(-22,14,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:110});sun.shadow.normalBias=.12;sun.shadow.bias=-.0004;scene.add(sun);
for(const [x,y,z] of [[-6,3.4,-2],[0,3.5,-4],[7.5,3.3,4.5],[7.5,3.3,-2]]){const light=new THREE.PointLight(0xffc175,15,9,2);light.position.set(x,y,z);scene.add(light);}
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}).observe(host);
new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(!visible){playing=false;setPlay();$('#video').pause();}}).observe(host);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();$('#loading').textContent='3D graphics were interrupted. Reload the app, or watch a camera film.';});
view('exterior');
const draco=new DRACOLoader();draco.setDecoderPath('./vendor/draco/');const loader=new GLTFLoader();loader.setDRACOLoader(draco);
const villaDownload=new Promise((resolve,reject)=>loader.load('assets/vesper-villa.glb',resolve,event=>{if(event.total){const percent=Math.round(event.loaded/event.total*100);$('#loading').textContent=`Loading the furnished forest house… ${percent}%`;status(`Downloading interactive scene · ${percent}%`);}},reject));
Promise.all([villaDownload,fetch('assets/camera-paths.json').then(r=>{if(!r.ok)throw Error('Camera paths unavailable');return r.json();})]).then(([g,data])=>{
 model=g.scene;paths=data;const translated=new Set();model.traverse(o=>{if(o.isMesh){o.castShadow=!/leaf|glass|water/i.test(o.name);o.receiveShadow=true;for(const material of (Array.isArray(o.material)?o.material:[o.material]))if(material&&!translated.has(material)){translateMaterial(material);translated.add(material);}}});scene.add(model);$('#loading').textContent='';for(const id of ['play','progress','reveal','walk'])$('#'+id).disabled=false;$('#progress').max=duration();progress();status('Villa ready. Choose a view, tour, or walk inside.');
}).catch(error=>{$('#loading').textContent='The 3D villa could not load. Reload to retry, or watch the camera films.';status(error.message);});
renderer.setAnimationLoop(ms=>{const delta=last?Math.min((ms-last)/1000,.1):0;last=ms;if(document.hidden||!visible||!$('#film').hidden)return;if(walking)updateWalk(delta);else if(playing){time=Math.min(duration(),time+delta);applyTour();if(time>=duration()){playing=false;setPlay();status('Tour complete. Replay or explore freely.');}}else if(!rail)controls.update();renderer.render(scene,camera);});
}catch(error){$('#loading').textContent='WebGL is unavailable in this browser. You can still watch the camera films.';status('Enable hardware acceleration to explore in 3D.');}
$('#play').onclick=()=>{if(playing){playing=false;setPlay();status('Tour paused.');return;}if(time>=duration())time=0;begin();playing=true;applyTour();setPlay();status('Tour playing. Pause or scrub to inspect a room.');};
$('#progress').oninput=e=>{begin();playing=false;time=Number(e.target.value);applyTour();setPlay();status('Tour paused at '+stamp(time)+'.');};
$('#tour-select').onchange=e=>{stop();route=e.target.value;time=0;$('.tour-card h3').textContent=route==='interior'?'Interior house tour':'Golden-hour house tour';$('.tour-card p').textContent=route==='interior'?'Entry → playing room → kitchen → living → terrace → pool':'Five seconds outside, then a complete passage through Vesper.';$('#progress').max=duration();progress();setPlay();status('Camera route selected. Press play to begin.');};
$('#reveal').onchange=e=>{stop();reveal(e.target.checked);};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
document.querySelectorAll('[data-film]').forEach(b=>b.onclick=()=>{lastFilmButton=b;stop();const type=b.dataset.film;$('#film').hidden=false;const video=$('#video');video.poster='assets/'+(type==='interior'?'interior':'exterior')+'.png';video.preload='metadata';video.src='assets/'+type+'-tour.mp4';video.load();video.play().catch(()=>status('Press play in the video to start.'));$('#close-film').focus();});
$('#walk').onclick=()=>walking?(document.exitPointerLock?.(),exitWalk()):startWalk();
document.addEventListener('pointerlockchange',()=>{if(!touchMode&&walking&&document.pointerLockElement!==renderer?.domElement)exitWalk();});
document.addEventListener('mousemove',event=>{if(!walking||document.pointerLockElement!==renderer?.domElement)return;yaw-=event.movementX*.0022;pitch=Math.max(-1.35,Math.min(1.35,pitch-event.movementY*.0022));camera.rotation.set(pitch,yaw,0);});
document.addEventListener('keydown',event=>{keys.add(event.code);if(walking&&event.code==='Space'){event.preventDefault();jump();}});document.addEventListener('keyup',event=>keys.delete(event.code));
for(const button of document.querySelectorAll('[data-move]')){const press=event=>{event.preventDefault();keys.add(button.dataset.move);button.setPointerCapture?.(event.pointerId);},release=event=>{event.preventDefault();keys.delete(button.dataset.move);};button.addEventListener('pointerdown',press);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);}
$('#mobile-jump').addEventListener('pointerdown',event=>{event.preventDefault();jump();});
renderer?.domElement.addEventListener('touchstart',event=>{if(!walking||!touchMode)return;const finger=event.touches[0];touchX=finger.clientX;touchY=finger.clientY;},{passive:true});
renderer?.domElement.addEventListener('touchmove',event=>{if(!walking||!touchMode)return;event.preventDefault();const finger=event.touches[0],dx=finger.clientX-touchX,dy=finger.clientY-touchY;touchX=finger.clientX;touchY=finger.clientY;yaw-=dx*.006;pitch=Math.max(-1.25,Math.min(1.25,pitch-dy*.006));camera.rotation.set(pitch,yaw,0);},{passive:false});
$('#close-film').onclick=()=>{$('#video').pause();$('#film').hidden=true;lastFilmButton?.focus();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#film').hidden)$('#close-film').click();});
$('#video').addEventListener('error',()=>status('The film could not load. Close it and try again.'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;setPlay();$('#video').pause();}});
