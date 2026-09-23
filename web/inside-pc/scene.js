import * as THREE from 'three';
import {OrbitControls} from '../luxury/vendor/OrbitControls.js';

const $ = selector => document.querySelector(selector);
const host = $('#scene');
const definitions = [
  {id:'case', name:'Case', color:'#84a4ae', role:'The frame and panels that hold and protect the computer.', fact:'A case also directs airflow through the machine.', offset:[-3.5,.2,-1.6]},
  {id:'motherboard', name:'Motherboard', color:'#387d76', role:'The main circuit board. Every major component connects to it.', fact:'It lets the CPU, memory, storage, and expansion cards communicate.', offset:[-2.7,.3,-.2]},
  {id:'cpu', name:'CPU', color:'#cba875', role:'The processor carries out instructions and calculations.', fact:'It handles general tasks; it is often called the computer’s brain.', offset:[-1.6,2.9,1.5]},
  {id:'gpu', name:'Graphics card', color:'#aa8bd1', role:'The graphics card draws images, video, and 3D scenes.', fact:'A dedicated GPU has its own processor and memory.', offset:[2.9,-1.2,1.4]},
  {id:'ram', name:'Memory (RAM)', color:'#9abb72', role:'Fast temporary workspace for apps you are using now.', fact:'RAM is cleared when the computer is turned off.', offset:[2.4,2.1,1.2]},
  {id:'storage', name:'Storage (SSD)', color:'#e2a87f', role:'Keeps files, apps, and the operating system when power is off.', fact:'An SSD has no spinning disk and loads data quickly.', offset:[3.3,.45,.6]},
  {id:'power', name:'Power supply', color:'#7395b7', role:'Converts power from the wall into the voltages PC parts need.', fact:'Its cables deliver power to the motherboard and other parts.', offset:[-2.2,-2.1,2.2]},
  {id:'cooling', name:'Cooling', color:'#80cbd1', role:'Fans and heatsinks move heat away from the components.', fact:'Air needs a clear path into and out of the case.', offset:[2.4,2.4,-1.6]}
];
const state = {selected:null, hidden:new Set(), exploded:0, xray:false, shadows:true, room:'black', environment:'studio', rotation:0};
const groups = new Map(), normalOpacities = new WeakMap(), contactShadows = [];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 800px)');
$('.advanced').open = !mobile.matches;
mobile.addEventListener('change', event => {$('.advanced').open = !event.matches;});

function listUI(){
  $('#part-list').innerHTML = definitions.map(part => `<div class="part-item" style="--part:${part.color}" data-part="${part.id}"><button class="part-select" data-select="${part.id}" aria-pressed="false" aria-label="View ${part.name}"><span class="swatch"></span><span>${part.name}</span></button><button class="eye" data-hide="${part.id}" aria-label="Hide ${part.name}" aria-pressed="false" title="Hide or show ${part.name}">◉</button></div>`).join('');
  $('#part-list').addEventListener('click', event => {
    const hide = event.target.closest('[data-hide]');
    if(hide){toggleHidden(hide.dataset.hide);return;}
    const select = event.target.closest('[data-select]');
    if(select)selectPart(select.dataset.select);
  });
  updateUI();
}
function updateUI(){
  for(const part of definitions){
    const button = $(`[data-select="${part.id}"]`), eye = $(`[data-hide="${part.id}"]`);
    button.setAttribute('aria-pressed',String(state.selected===part.id));
    eye.setAttribute('aria-pressed',String(state.hidden.has(part.id)));
    eye.setAttribute('aria-label',`${state.hidden.has(part.id)?'Show':'Hide'} ${part.name}`);
    eye.textContent = state.hidden.has(part.id)?'○':'◉';
  }
  $('#show-all').disabled = !state.selected && !state.hidden.size;
  const part = definitions.find(item => item.id===state.selected);
  $('#detail').innerHTML = part ? `<span class="eyebrow">${String(definitions.indexOf(part)+1).padStart(2,'0')} / COMPONENT</span><h2>${part.name}</h2><p>${part.role}</p><span class="fact">Did you know? ${part.fact}</span>` : '<span class="eyebrow">SELECT A PART</span><h2>Every piece has a purpose.</h2><p>Choose a component above or click it in the 3D view to learn what it does.</p>';
}
function selectPart(id){state.selected = state.selected===id ? null : id;state.hidden.delete(id);updateSceneVisibility();updateUI();}
function toggleHidden(id){state.hidden.has(id)?state.hidden.delete(id):state.hidden.add(id);if(state.selected===id)state.selected=null;updateSceneVisibility();updateUI();}
function updateSceneVisibility(){
  for(const [id, group] of groups)group.visible = !state.hidden.has(id) && (!state.selected || state.selected===id);
  for(const shadow of contactShadows)shadow.visible = state.shadows && !state.selected && !state.hidden.has(shadow.userData.partId) && (shadow.userData.partId==='case'||state.exploded<.03);
  applyXray();
}
function remember(material){normalOpacities.set(material,material.opacity);return material;}
function material(color,metalness=.2,roughness=.42,options={}){return remember(new THREE.MeshStandardMaterial({color,metalness,roughness,...options}));}
function attach(group,geometry,mat,x=0,y=0,z=0){const own=mat.clone();normalOpacities.set(own,mat.opacity);const mesh=new THREE.Mesh(geometry,own);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.partId=group.userData.partId;group.add(mesh);return mesh;}
function box(group,w,h,d,mat,x=0,y=0,z=0){return attach(group,new THREE.BoxGeometry(w,h,d),mat,x,y,z);}
function cylinder(group,r,h,mat,x,y,z,segments=32){const mesh=attach(group,new THREE.CylinderGeometry(r,r,h,segments),mat,x,y,z);mesh.rotation.x=Math.PI/2;return mesh;}
function line(group,points,mat){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return attach(group,new THREE.TubeGeometry(curve,24,.025,5,false),mat);}
function addGroup(id){const group=new THREE.Group();group.userData.partId=id;groups.set(id,group);scene.add(group);return group;}
function framePiece(group,w,h,d,x,y,z,mat){box(group,w,h,d,mat,x,y,z);}
function buildComputer(){
  const dark=material('#263540',.62,.32), metal=material('#788e94',.67,.31), edge=material('#b7cbd0',.75,.2), board=material('#20544d',.18,.72), circuit=material('#63ae91',.45,.4), copper=material('#caa16a',.74,.31), black=material('#1e2a31',.32,.51), violet=material('#654d86',.45,.35), glass=material('#a7dbdd',.13,.16,{transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false});
  const pc=addGroup('case');
  framePiece(pc,3.75,.13,2.35,0,-2.46,0,dark);framePiece(pc,3.75,.13,2.35,0,2.46,0,dark);
  for(const x of [-1.84,1.84])for(const z of [-1.12,1.12])framePiece(pc,.1,4.9,.1,x,0,z,metal);
  for(const y of [-2.39,2.39])for(const z of [-1.12,1.12])framePiece(pc,3.6,.08,.08,0,y,z,edge);
  for(const y of [-2.39,2.39])for(const x of [-1.84,1.84])framePiece(pc,.08,.08,2.25,x,y,0,edge);
  box(pc,3.55,4.72,.08,dark,0,0,-1.09);box(pc,3.55,4.72,.035,glass,0,0,1.12).userData.ignorePick=true;
  box(pc,.1,4.7,2.18,glass,1.81,0,0).userData.ignorePick=true;box(pc,.16,.2,.04,circuit,1.34,2.38,1.04);
  const mb=addGroup('motherboard');box(mb,3.05,4.0,.12,board,-.13,.08,-.79);box(mb,3.15,4.1,.08,metal,-.13,.08,-.88);
  for(let i=0;i<13;i++){
    const x=-1.47+(i%4)*.91, y=-1.64+Math.floor(i/4)*1.04;
    box(mb,.18,.07,.018,circuit,x,y,-.715);
  }
  for(let i=0;i<5;i++){box(mb,.25,.38,.05,black,-1.34+i*.61,-1.1,-.68);box(mb,.36,.05,.04,copper,-1.34+i*.61,-.84,-.66);}
  const cpu=addGroup('cpu');box(cpu,.96,.96,.11,copper,-.7,.78,-.58);box(cpu,.69,.69,.08,metal,-.7,.78,-.47);
  for(let i=0;i<5;i++){box(cpu,.03,.7,.025,black,-1.21+i*.25,.78,-.46);box(cpu,.7,.03,.025,black,-.7,.27+i*.25,-.46);}
  const gpu=addGroup('gpu');box(gpu,2.65,.62,.3,violet,.05,-.63,-.15);box(gpu,2.75,.08,.37,black,.05,-.98,-.15);box(gpu,.13,.75,.37,metal,-1.33,-.63,-.15);
  for(const x of [-.56,.55]){cylinder(gpu,.26,.045,black,x,-.63,.025);cylinder(gpu,.18,.05,metal,x,-.63,.054);for(let i=0;i<6;i++){const blade=box(gpu,.16,.035,.015,dark,x+Math.cos(i*Math.PI/3)*.12,-.63+Math.sin(i*Math.PI/3)*.12,.09);blade.rotation.z=i*Math.PI/3;}}
  const ram=addGroup('ram');for(let i=0;i<2;i++){const x=.69+i*.26;box(ram,.09,1.45,.21,board,x,1.12,-.55);box(ram,.14,.15,.25,metal,x,1.83,-.55);for(let j=0;j<4;j++)box(ram,.035,.17,.22,black,x,1.58-j*.28,-.425);}
  const storage=addGroup('storage');box(storage,.83,.53,.12,black,1.02,-.1,-.48);box(storage,.68,.33,.018,metal,1.02,-.1,-.405);box(storage,.45,.05,.019,circuit,1.02,-.1,-.39);
  const power=addGroup('power');box(power,1.48,.78,1.4,dark,-.82,-1.83,.2);box(power,1.35,.08,1.44,metal,-.82,-1.44,.2);cylinder(power,.28,.025,metal,-.82,-1.82,.92);cylinder(power,.17,.027,black,-.82,-1.82,.94);
  for(const x of [-1.45,-1.28,-1.11])line(power,[[x,-1.7,.75],[x,-1.28,.8],[x+.2,-.89,.64],[x+.25,-.25,.1]],copper);
  const cool=addGroup('cooling');for(const y of [-1.32,.05,1.42]){cylinder(cool,.47,.12,metal,1.48,y,.18);cylinder(cool,.35,.13,black,1.48,y,.22);for(let i=0;i<5;i++){const blade=box(cool,.29,.08,.018,edge,1.48+Math.cos(i*1.256)*.16,y+Math.sin(i*1.256)*.16,.3);blade.rotation.z=i*1.256+.5;}cylinder(cool,.09,.14,circuit,1.48,y,.32);}
  for(let i=0;i<6;i++)box(cool,.045,.74,.18,metal,-.7+(i-2.5)*.11,.78,.21);
  for(const part of definitions){const group=groups.get(part.id);group.userData.base=group.position.clone();group.userData.offset=new THREE.Vector3(...part.offset);group.traverse(object=>{if(object.isMesh)object.userData.partId=part.id;});}
}
function makeContact(partId,x,y,z,w,h){const shader=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uColor:{value:new THREE.Color('#071922')}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 uColor; varying vec2 vUv; void main(){vec2 p=(vUv-.5)*2.; float alpha=exp(-dot(p,p)*4.)*.36;gl_FragColor=vec4(uColor,alpha);}'});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),shader);mesh.position.set(x,y,z);mesh.userData.partId=partId;mesh.renderOrder=2;scene.add(mesh);contactShadows.push(mesh);}
function applyXray(){for(const [id,group] of groups){group.traverse(object=>{if(!object.isMesh)return;const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats){const normal=normalOpacities.get(mat)??1;const transparency=state.xray && (!state.selected || id!==state.selected);mat.transparent=transparency||normal<1;mat.opacity=transparency?Math.min(normal,id==='case'?.07:.22):normal;mat.depthWrite=!mat.transparent;mat.needsUpdate=true;}});}}
function makeEnvironment(kind){
  const presets={studio:{base:[.12,.2,.24],lights:[[.05,.38,2.6,8],[.63,.31,1.4,9],[.34,.76,.9,7]]},daylight:{base:[.26,.36,.48],lights:[[.22,.35,3.1,11],[.78,.45,1.25,10],[.53,.78,.95,7]]},warm:{base:[.29,.18,.11],lights:[[.08,.32,2.8,8],[.68,.38,1.7,9],[.41,.74,.75,7]]}};
  const p=presets[kind],w=128,h=64,data=new Float32Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let value=.38;for(const [cx,cy,strength,spread] of p.lights){const dx=Math.min(Math.abs(x/w-cx),1-Math.abs(x/w-cx)),dy=y/h-cy;value+=strength*Math.exp(-(dx*dx+dy*dy)*spread*spread);}const i=(y*w+x)*4;data[i]=p.base[0]*value;data[i+1]=p.base[1]*value;data[i+2]=p.base[2]*value;data[i+3]=1;}
  const texture=new THREE.DataTexture(data,w,h,THREE.RGBAFormat,THREE.FloatType);texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.LinearSRGBColorSpace;texture.needsUpdate=true;return texture;
}
listUI();
let renderer,scene,camera,controls,keyLight,fillLight,floor,backgroundWall,pmrem,environments={},raycaster,pointer,down,visible=true;
try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(7.3,5.1,9.8);
  controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,0);controls.minDistance=5.6;controls.maxDistance=23;controls.enableDamping=!reducedMotion;controls.dampingFactor=.08;controls.enablePan=false;controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;controls.update();
  scene.add(new THREE.AmbientLight('#c8dfeb',1.25));keyLight=new THREE.DirectionalLight('#eaf8ff',3.2);keyLight.position.set(4,8,6);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.camera.left=-8;keyLight.shadow.camera.right=8;keyLight.shadow.camera.top=8;keyLight.shadow.camera.bottom=-8;keyLight.shadow.bias=-.0005;scene.add(keyLight);fillLight=new THREE.DirectionalLight('#9bd7ce',1.5);fillLight.position.set(-5,3,-4);scene.add(fillLight);
  floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:'#142532',roughness:.85}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.58;floor.receiveShadow=true;scene.add(floor);
  backgroundWall=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshBasicMaterial({color:'#132432',side:THREE.DoubleSide}));backgroundWall.position.z=-12;scene.add(backgroundWall);
  buildComputer();makeContact('case',0,-2.565,0,6,5);contactShadows[0].rotation.x=-Math.PI/2;makeContact('cpu',-.7,.78,-.7,1.2,1.2);makeContact('gpu',.05,-.63,-.7,2.9,.9);makeContact('power',-.82,-1.83,-.7,1.7,.85);
  pmrem=new THREE.PMREMGenerator(renderer);for(const kind of ['studio','daylight','warm']){const source=makeEnvironment(kind);environments[kind]=pmrem.fromEquirectangular(source).texture;source.dispose();}scene.environment=environments.studio;
  raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();$('#loading').remove();
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(w&&h){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}};new ResizeObserver(resize).observe(host);resize();
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});observer.observe(host);
  renderer.domElement.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY,time:performance.now()};});
  renderer.domElement.addEventListener('pointerup',event=>{
    if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>7||performance.now()-down.time>600)return;
    down=null;const rect=renderer.domElement.getBoundingClientRect();const x=event.clientX-rect.left,y=event.clientY-rect.top;
    pointer.set(x/rect.width*2-1,-y/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects([...groups.values()].filter(g=>g.visible),true).filter(item=>!item.object.userData.ignorePick);
    const internal=hits.find(item=>item.object.userData.partId!=='case');
    let id=internal?.object.userData.partId;
    if(!id&&!state.selected&&hits.length){
      let closest=Infinity;
      for(const [partId,group] of groups){if(partId==='case'||!group.visible)continue;
        const center=new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3()).project(camera);
        const distance=Math.hypot(x-(center.x+1)*rect.width/2,y-(1-center.y)*rect.height/2);
        if(distance<closest){closest=distance;id=partId;}
      }
    }
    if(!id)id=hits[0]?.object.userData.partId;
    if(id)selectPart(id);
  });
  const target=new THREE.Vector3();let last=performance.now();
  renderer.setAnimationLoop(now=>{if(!visible||document.hidden)return;const delta=Math.min((now-last)/1000,.1);last=now;for(const group of groups.values()){target.copy(group.userData.offset).multiplyScalar(state.exploded).add(group.userData.base);group.position.lerp(target,reducedMotion?1:Math.min(1,delta*7));}controls.update();renderer.render(scene,camera);});
}catch(error){console.error(error);$('#loading').textContent='This 3D view needs a browser with WebGL enabled. The parts and explanations below still work.';}

$('#explode').addEventListener('input',event=>{state.exploded=Number(event.target.value)/100;$('#explode-value').textContent=`${event.target.value}%`;updateSceneVisibility();});
$('#show-all').addEventListener('click',()=>{state.selected=null;state.hidden.clear();updateSceneVisibility();updateUI();});
$('#xray').addEventListener('change',event=>{state.xray=event.target.checked;applyXray();});
$('#ao').addEventListener('change',event=>{state.shadows=event.target.checked;if(renderer)renderer.shadowMap.enabled=state.shadows;updateSceneVisibility();});
for(const button of document.querySelectorAll('[data-room]'))button.addEventListener('click',()=>{state.room=button.dataset.room;for(const item of document.querySelectorAll('[data-room]'))item.setAttribute('aria-pressed',String(item===button));if(floor){floor.material.color.set(state.room==='white'?'#e7eae8':'#142532');backgroundWall.material.color.set(state.room==='white'?'#edf2f0':'#132432');}document.querySelector('.stage').classList.toggle('white-room',state.room==='white');});
$('#environment').addEventListener('change',event=>{state.environment=event.target.value;if(scene)scene.environment=environments[state.environment];});
$('#rotation').addEventListener('input',event=>{state.rotation=Number(event.target.value);$('#rotation-value').textContent=`${state.rotation}°`;if(scene)scene.environmentRotation.y=THREE.MathUtils.degToRad(state.rotation);if(keyLight){const angle=THREE.MathUtils.degToRad(state.rotation);keyLight.position.set(6*Math.cos(angle),8,6*Math.sin(angle));fillLight.position.set(-5*Math.cos(angle),3,-5*Math.sin(angle));}});
$('#reset').addEventListener('click',()=>{state.selected=null;state.hidden.clear();state.exploded=0;state.xray=false;state.shadows=true;$('#explode').value=0;$('#explode-value').textContent='0%';$('#xray').checked=false;$('#ao').checked=true;$('#environment').value='studio';$('#environment').dispatchEvent(new Event('change'));$('#rotation').value=0;$('#rotation').dispatchEvent(new Event('input'));document.querySelector('[data-room="black"]').click();if(camera&&controls){camera.position.set(7.3,5.1,9.8);controls.target.set(0,0,0);controls.update();}if(renderer)renderer.shadowMap.enabled=true;updateSceneVisibility();updateUI();});
