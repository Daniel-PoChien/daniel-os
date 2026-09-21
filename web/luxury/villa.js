import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {DRACOLoader} from './vendor/DRACOLoader.js';
const $=s=>document.querySelector(s),host=$('#viewport');
let renderer,controls,model,paths,playing=false,rail=false,time=0,route='interior',last=0,visible=true,lastFilmButton=null;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa9bbc2);scene.fog=new THREE.Fog(0xa9bbc2,110,420);
const camera=new THREE.PerspectiveCamera(48,1,.06,1000);
function status(text){$('#status').textContent=text;}
function setPlay(){ $('#play').textContent=playing?'Pause tour Ⅱ':time>=duration()?'Replay tour ▷':'Play '+(route==='interior'?'interior tour':'golden-hour tour')+' ▷';$('#play').setAttribute('aria-pressed',String(playing));}
function duration(){return paths?.[route]?.duration||30;}
function stamp(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');}
function progress(){ $('#progress').value=time;$('#elapsed').textContent=stamp(time)+' / '+stamp(duration());}
const p=new THREE.Vector3(),t=new THREE.Vector3();
function applyTour(){if(!paths)return;const frames=paths[route].frames,n=Math.min(time*24,frames.length-1),i=Math.floor(n),b=frames[Math.min(i+1,frames.length-1)],a=frames[i],f=n-i;p.fromArray(a.p).lerp(new THREE.Vector3(...b.p),f);t.fromArray(a.t).lerp(new THREE.Vector3(...b.t),f);camera.position.copy(p);controls.target.copy(t);camera.lookAt(t);camera.fov=paths[route].fov;camera.updateProjectionMatrix();progress();}
function stop(){playing=false;rail=false;$('.hint').textContent='Drag to explore · Scroll or pinch to zoom';if(controls)controls.enabled=true;setPlay();}
function begin(){if(!paths||!model)return;rail=true;$('.hint').textContent='Guided camera · Pause or scrub to inspect · Explore freely to move';host.dataset.mode=route;controls.enabled=false;$('#reveal').checked=false;reveal(false);document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('active'));$('#scene-caption').textContent=paths[route].name;}
function reveal(value){model?.traverse(o=>{if(/roof[ _]slab|Timber[ _]soffit/i.test(o.name))o.visible=!value;});}
function view(name){if(!controls)return;stop();const views={exterior:{p:[17,3.9,12],t:[11,1.2,0],f:56},living:{p:[10.8,1.65,-.95],t:[11,1.35,3.2],f:72},playing:{p:[6.4,1.55,-8.2],t:[9,1.1,-7.2],f:72},plan:{p:[10,42,-8],t:[10,0,-8],f:48}};const v=views[name];host.dataset.mode=name;camera.position.fromArray(v.p);controls.target.fromArray(v.t);camera.fov=v.f;camera.updateProjectionMatrix();controls.update();$('#reveal').checked=name==='plan';reveal(name==='plan');document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('#scene-caption').textContent={exterior:'Pool, terrace, and viridian forest.',living:'Open living, dining, and kitchen.',playing:'Two open connections to kitchen and entry.',plan:'The refined three-bedroom floor plan.'}[name];}
try{
renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.prepend(renderer.domElement);
controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.2;controls.maxDistance=85;controls.maxPolarAngle=Math.PI*.49;
scene.background=new THREE.Color(0x49655c);scene.fog=new THREE.Fog(0x49655c,65,210);
scene.add(new THREE.HemisphereLight(0xd8e4d5,0x253b31,2.4));
const sun=new THREE.DirectionalLight(0xffc47e,3.1);sun.position.set(-22,14,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:110});sun.shadow.normalBias=.12;sun.shadow.bias=-.0004;scene.add(sun);
for(const [x,y,z] of [[-6,3.4,-2],[0,3.5,-4],[7.5,3.3,4.5],[7.5,3.3,-2]]){const light=new THREE.PointLight(0xffd6a0,22,10,2);light.position.set(x,y,z);scene.add(light);}
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}).observe(host);
new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(!visible){playing=false;setPlay();$('#video').pause();}}).observe(host);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();$('#loading').textContent='3D graphics were interrupted. Reload the app, or watch a camera film.';});
view('exterior');
const draco=new DRACOLoader();draco.setDecoderPath('./vendor/draco/');const loader=new GLTFLoader();loader.setDRACOLoader(draco);
Promise.all([loader.loadAsync('assets/vesper-villa.glb'),fetch('assets/camera-paths.json').then(r=>{if(!r.ok)throw Error('Camera paths unavailable');return r.json();})]).then(([g,data])=>{
 model=g.scene;paths=data;model.traverse(o=>{if(o.isMesh){o.castShadow=!/leaf|glass|water/i.test(o.name);o.receiveShadow=true;if(/leaf/i.test(o.material?.name))o.material.side=THREE.DoubleSide;}});scene.add(model);$('#loading').textContent='';for(const id of ['play','progress','restart','exit-tour','reveal'])$('#'+id).disabled=false;$('#progress').max=duration();progress();status('Villa ready. Choose a room or start the tour.');
}).catch(error=>{$('#loading').textContent='The 3D villa could not load. Reload to retry, or watch the camera films.';status(error.message);});
renderer.setAnimationLoop(ms=>{const delta=last?Math.min((ms-last)/1000,.1):0;last=ms;if(document.hidden||!visible||!$('#film').hidden)return;if(playing){time=Math.min(duration(),time+delta);applyTour();if(time>=duration()){playing=false;setPlay();status('Tour complete. Replay or explore freely.');}}else if(!rail)controls.update();renderer.render(scene,camera);});
}catch(error){$('#loading').textContent='WebGL is unavailable in this browser. You can still watch the camera films.';status('Enable hardware acceleration to explore in 3D.');}
$('#play').onclick=()=>{if(playing){playing=false;setPlay();status('Tour paused.');return;}if(time>=duration())time=0;begin();playing=true;applyTour();setPlay();status('Tour playing. Pause or scrub to inspect a room.');};
$('#progress').oninput=e=>{begin();playing=false;time=Number(e.target.value);applyTour();setPlay();status('Tour paused at '+stamp(time)+'.');};
$('#restart').onclick=()=>{time=0;begin();applyTour();playing=true;setPlay();};
$('#exit-tour').onclick=()=>{stop();status('Drag to look around and explore from here.');};
$('#tour-select').onchange=e=>{stop();route=e.target.value;time=0;$('.tour-card h3').textContent=route==='interior'?'Interior house tour':'Golden-hour house tour';$('.tour-card p').textContent=route==='interior'?'Entry → playing room → kitchen → living → terrace → pool':'Five seconds outside, then a complete passage through Vesper.';$('#progress').max=duration();progress();setPlay();status('Camera route selected. Press play to begin.');};
$('#reveal').onchange=e=>{stop();reveal(e.target.checked);};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
document.querySelectorAll('[data-film]').forEach(b=>b.onclick=()=>{lastFilmButton=b;stop();const type=b.dataset.film;$('#film').hidden=false;const video=$('#video');video.poster='assets/'+(type==='interior'?'interior':'exterior')+'.png';video.preload='metadata';video.src='assets/'+type+'-tour.mp4';video.load();video.play().catch(()=>status('Press play in the video to start.'));$('#close-film').focus();});
$('#close-film').onclick=()=>{$('#video').pause();$('#film').hidden=true;lastFilmButton?.focus();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#film').hidden)$('#close-film').click();});
$('#video').addEventListener('error',()=>status('The film could not load. Close it and try again.'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;setPlay();$('#video').pause();}});
