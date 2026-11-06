import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x82dafa);
scene.fog = new THREE.Fog(0x82dafa, 38, 105);
const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, .1, 150);
const hemi = new THREE.HemisphereLight(0xdff8ff, 0x806344, 2.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d5, 3.2); sun.position.set(-12, 24, 13); sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536); sun.shadow.camera.left = -34; sun.shadow.camera.right = 34; sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35; sun.shadow.bias = -.00025; scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, .28));
const mat = (color, roughness=.8) => new THREE.MeshStandardMaterial({ color, roughness });
const materials = {
  grass: mat(0x55c95a), grassBright: mat(0x73dc65), dirt: mat(0xb8753b), soil: mat(0x935633),
  white: mat(0xfff7dc), red: mat(0xe63c3c), blue: mat(0x276ac5), skin: mat(0xffc28c),
  dark: mat(0x46304a), shoe: mat(0x603e31), gold: new THREE.MeshStandardMaterial({ color:0xffc928, metalness:.65, roughness:.25, emissive:0x684008 }),
  block: mat(0xf6a844), brick: mat(0xc76639), leaf: mat(0x259c61), flower: mat(0xff75ab),
  cloud: new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}), water: mat(0x46c9df),
};
function mesh(geometry, material, parent=scene, x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent, material, x,y,z, sx,sy,sz){return mesh(new THREE.BoxGeometry(sx,sy,sz),material,parent,x,y,z)}
function sphere(parent,material,x,y,z,sx,sy=sx,sz=sx,detail=16){const o=mesh(new THREE.SphereGeometry(1,detail,12),material,parent,x,y,z);o.scale.set(sx,sy,sz);return o;}
function cylinder(parent,material,x,y,z,rt,rb,h,segments=12){return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material,parent,x,y,z)}

// Puffy clouds and faraway candy-colored sky islands set the scale of the world.
for(let i=0;i<18;i++){
  const x=(i%6-2.5)*15 + Math.sin(i*12)*2, z=-i*7-13, y=8+(i%4)*2.1;
  const cloud=new THREE.Group(); scene.add(cloud); cloud.position.set(x,y,z);
  for(let j=0;j<4;j++) sphere(cloud,materials.cloud,(j-1.5)*1.25,Math.sin(j*3)*.28,0,1.35,.72,1.05,12);
  cloud.scale.setScalar(.7+(i%3)*.16);
}
for(let i=0;i<12;i++){
  const x=(i%4-1.5)*26+(i%2)*5,z=-i*10-22;
  const isle=new THREE.Group();scene.add(isle);isle.position.set(x,-1.7,z);
  cylinder(isle,mat(i%2?0x59c879:0x74d490),0,0,0,2.4,.15,1.0,7);
  const tip=mesh(new THREE.ConeGeometry(1.75,3.8,7),mat(0x9a784e),isle,0,-2.1,0);tip.rotation.y=.3;
  sphere(isle,materials.cloud,-2,-2.4,0,.7,.42,.7,10);sphere(isle,materials.cloud,2,-2,0,.8,.45,.6,10);
}

const platforms=[];
function platform(x,z,y,w,d,topColor=0x5bcf59){
  const g=new THREE.Group();scene.add(g);g.position.set(x,y,z);
  const topMat=mat(topColor), sideMat=mat(0xa56538), shadowBand=mat(0x8e532f);
  box(g,topMat,0,-.17,0,w,.34,d);
  box(g,sideMat,0,-.64,0,w-.12,.62,d-.12);
  box(g,shadowBand,0,-.96,0,w-.42,.18,d-.42);
  box(g,mat(topColor===0x5bcf59?0x8be56a:0x9be779),0,.015,0,w,.06,d);
  platforms.push({x,z,y,w,d});
  return g;
}
const start=platform(0,4,0,12,14,0x55c958);
const p1=platform(0,-6,1.15,5.1,5.2,0x68d65d);
const p2=platform(4,-13,2.25,5.4,5.2,0x58c86a);
const p3=platform(-1,-20,3.0,6.0,5.8,0x65d45f);
const p4=platform(-6,-27,2.2,5.5,5.6,0x58c86a);
const p5=platform(0,-34,1.45,7.0,6.2,0x68d65d);
const finish=platform(0,-43,1.0,12,10,0x61ce61);
function questionBlock(parent,x,y,z){
  const group=new THREE.Group();parent.add(group);group.position.set(x,y,z);
  box(group,materials.block,0,0,0,1.35,1.35,1.35);
  const edge=mat(0xffd77b);for(const [a,b] of [[-.58,-.58],[.58,-.58],[-.58,.58],[.58,.58]]) sphere(group,edge,a,b,.69,.09,.09,.06,8);
  const qmat=mat(0xfff2bf);const q=mesh(new THREE.TorusGeometry(.24,.09,8,16,Math.PI*1.72),qmat,group,0,.08,.70);q.rotation.z=-.48;
  sphere(group,qmat,.12,-.33,.7,.075,.075,.075,8);
  return group;
}
questionBlock(start,-3,2.8,-1);questionBlock(start,0,2.8,-3);questionBlock(start,3,2.8,-1);
questionBlock(p2,0,2.8,0);questionBlock(p5,2.7,2.7,1.4);
function flower(parent,x,z,color){
  cylinder(parent,materials.leaf,x,.28,z,.045,.045,.56,7);sphere(parent,mat(color),x,.58,z,.17,.17,.17,10);
  for(let n=0;n<4;n++){const a=n*Math.PI/2;sphere(parent,mat(color),x+Math.cos(a)*.17,.54,z+Math.sin(a)*.17,.12,.12,.12,8)}
}
function tree(parent,x,z,scale=1){
  cylinder(parent,mat(0x97603a),x,.62*scale,z,.18*scale,.24*scale,1.25*scale,9);
  sphere(parent,mat(0x2dad64),x,1.48*scale,z,.8*scale,.82*scale,.8*scale,12);
  sphere(parent,mat(0x50c96d),x-.42*scale,1.53*scale,z+.08,.45*scale,.5*scale,.48*scale,10);
  sphere(parent,mat(0x3bb866),x+.42*scale,1.55*scale,z-.08,.48*scale,.48*scale,.48*scale,10);
}
for(const [g,coords] of [[start,[[-5,-4],[5,-4],[-5,8],[5,8]]],[p3,[[-2,-1],[2,1]]],[finish,[[-5,0],[5,1]]]]){
  coords.forEach(([x,z],i)=>{if(i%2===0)tree(g,x,z,.7);else flower(g,x,z,0xff79ad)});
}
for(let i=0;i<7;i++)flower(p1,-1.7+i*.55,1.7, i%2?0xffd447:0xff82b4);
for(let i=0;i<8;i++)flower(finish,-4.5+i*1.3,3.5,i%2?0xffdf55:0xff87b9);

const hero=new THREE.Group();scene.add(hero);
const body=new THREE.Group();hero.add(body);
const torso=mesh(new THREE.CapsuleGeometry(.38,.47,5,10),materials.blue,body,0,1.0,0);torso.scale.set(.83,1,.75);
box(body,materials.red,0,1.64,0,.68,.26,.58);
sphere(body,materials.skin,0,1.98,0,.35,.37,.33,16);
const cap=mesh(new THREE.CylinderGeometry(.37,.37,.19,16),materials.red,body,0,2.26,0);cap.rotation.y=.15;
mesh(new THREE.CylinderGeometry(.4,.4,.065,16),materials.red,body,0,2.17,-.08).scale.set(1,.7,.78);
sphere(body,materials.white,0,2.27,-.11,.16,.12,.07,10);
sphere(body,materials.blue,-.14,2.02,-.29,.045,.07,.03,8);sphere(body,materials.blue,.14,2.02,-.29,.045,.07,.03,8);
sphere(body,materials.skin,0,1.87,-.31,.16,.07,.055,10);
const armL=mesh(new THREE.CapsuleGeometry(.12,.34,4,8),materials.red,body,-.43,1.24,0);armL.rotation.z=-.48;
const armR=mesh(new THREE.CapsuleGeometry(.12,.34,4,8),materials.red,body,.43,1.24,0);armR.rotation.z=.48;
const legL=mesh(new THREE.CapsuleGeometry(.14,.28,4,8),materials.blue,body,-.19,.43,0);const legR=mesh(new THREE.CapsuleGeometry(.14,.28,4,8),materials.blue,body,.19,.43,0);
const shoeL=mesh(new THREE.SphereGeometry(1,12,8),materials.shoe,body,-.2,.16,-.06);shoeL.scale.set(.24,.14,.34);
const shoeR=mesh(new THREE.SphereGeometry(1,12,8),materials.shoe,body,.2,.16,-.06);shoeR.scale.set(.24,.14,.34);
const shadow=mesh(new THREE.CircleGeometry(.65,20),new THREE.MeshBasicMaterial({color:0x28646a,transparent:true,opacity:.22,depthWrite:false}),scene,0,.035,0);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;

const coins=[];
function coin(x,y,z){const group=new THREE.Group();scene.add(group);group.position.set(x,y,z);
  const c=mesh(new THREE.TorusGeometry(.36,.115,10,22),materials.gold,group);c.rotation.y=Math.PI/2;
  const glint=mesh(new THREE.TorusGeometry(.18,.045,7,16),mat(0xffeb78),group,0,0,.015);glint.rotation.y=Math.PI/2;
  coins.push({group,collected:false,baseY:y,phase:Math.random()*6});
}
[[-1,1.5,1],[0,2,-2],[0,2.65,-5],[1.2,2.7,-8],[4,3.55,-12],[2,4.0,-16],[-1,4.25,-19],[-5,3.2,-23],[-6,3.0,-27],[0,2.4,-32],[1,2.7,-35],[0,2.0,-41],[3,2.1,-43],[-3,2.1,-43]].forEach(v=>coin(...v));
const enemies=[];
function enemy(x,z,minX,maxX){const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
  const shell=mesh(new THREE.SphereGeometry(.52,14,12),mat(0xa95336),g,0,.48,0);shell.scale.set(1,.8,1);
  sphere(g,mat(0xf2bc74),0,.25,0,.39,.2,.39,12);
  sphere(g,materials.white,-.17,.56,-.39,.13,.16,.08,10);sphere(g,materials.white,.17,.56,-.39,.13,.16,.08,10);
  sphere(g,materials.dark,-.16,.54,-.46,.052,.075,.035,8);sphere(g,materials.dark,.18,.54,-.46,.052,.075,.035,8);
  const footL=mesh(new THREE.SphereGeometry(1,10,8),materials.shoe,g,-.22,.08,-.03);footL.scale.set(.22,.11,.29);
  const footR=mesh(new THREE.SphereGeometry(1,10,8),materials.shoe,g,.22,.08,-.03);footR.scale.set(.22,.11,.29);
  enemies.push({g,minX,maxX,dir:1,alive:true,feet:[footL,footR]});
}
enemy(1,3,-3.9,3.9);
const goal=new THREE.Group();scene.add(goal);goal.position.set(0,1,-45.5);
cylinder(goal,mat(0xffcf3c),-1.65,1.8,0,.13,.13,3.6,12);cylinder(goal,mat(0xffcf3c),1.65,1.8,0,.13,.13,3.6,12);
const arch=mesh(new THREE.TorusGeometry(1.65,.14,12,32,Math.PI),mat(0xffd744),goal,0,3.45,0);arch.rotation.z=Math.PI;
const starMesh=mesh(new THREE.OctahedronGeometry(.58,1),mat(0xffef76),goal,0,2.6,-.05);starMesh.material.emissive=new THREE.Color(0x94640d);starMesh.material.emissiveIntensity=.3;
box(goal,mat(0xf44d5b),-.02,1.5,-.05,1.0,.62,.08);
for(let i=0;i<4;i++){const tile=box(goal,mat(i%2?0xf9df92:0xffffff),-.3+(i%2)*.35,1.63-Math.floor(i/2)*.25,.04,.32,.23,.04);tile.rotation.z=-.08;}
for(let i=0;i<12;i++){const c=mesh(new THREE.OctahedronGeometry(.07,0),materials.gold,goal,Math.cos(i)*2,2.3+Math.sin(i*2)*.8,-.4);c.userData.orbit=i;}

const keys=new Set(), touch=new Set();
let started=false,won=false,coinsTaken=0,lives=3,checkpoint=0,lastToast=0;
let vy=0,grounded=true,moveX=0,moveZ=0,worldTime=0,invulnerable=0;
const checkpoints=[{x:0,y:0,z:4},{x:0,y:1.15,z:-6},{x:4,y:2.25,z:-13},{x:-1,y:3,z:-20},{x:-6,y:2.2,z:-27},{x:0,y:1.45,z:-34},{x:0,y:1,z:-43}];
hero.position.set(0,0,4);shadow.position.set(0,.045,4);
camera.position.set(0,7.5,15.5);camera.lookAt(0,1.1,.2);
const livesEl=document.querySelector('#lives'),coinsEl=document.querySelector('#coins'),objectiveCount=document.querySelector('#objective-count');
const overlay=document.querySelector('#overlay'),winOverlay=document.querySelector('#win-overlay'),toast=document.querySelector('#toast');
function announce(text){toast.textContent=text;toast.classList.add('show');lastToast=2.2;}
function begin(){started=true;overlay.classList.add('hidden');document.querySelector('#bottom-tip').classList.remove('hidden');announce('READY? LET’S GO!');}
document.querySelector('#play-button').addEventListener('click',begin);
document.querySelector('#replay-button').addEventListener('click',()=>location.reload());
window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Shift'].includes(e.key))e.preventDefault();
  keys.add(e.key.toLowerCase());if(e.key===' '&&started)jump();
  if(e.key.toLowerCase()==='r'&&won)location.reload();
},{passive:false});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
function jump(){if(!started||won)return;if(grounded){vy=9.0;grounded=false;body.scale.y=.94;setTimeout(()=>body.scale.y=1,130)}}
document.querySelector('#jump-button').addEventListener('pointerdown',e=>{e.preventDefault();jump()});
for(const button of document.querySelectorAll('.dpad button')){
  const dir=button.dataset.dir;
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touch.add(dir)});
  const release=()=>touch.delete(dir);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
function down(...names){return names.some(n=>keys.has(n))}
function moveInput(){let x=0,z=0;
 if(down('a','arrowleft')||touch.has('left'))x-=1;if(down('d','arrowright')||touch.has('right'))x+=1;
 if(down('w','arrowup')||touch.has('up'))z-=1;if(down('s','arrowdown')||touch.has('down'))z+=1;
 const l=Math.hypot(x,z)||1;return{x:x/l,z:z/l,active:!!(x||z)};
}
function setLives(){livesEl.textContent=String(lives)}
function updateCoinHud(){coinsEl.textContent=String(coinsTaken).padStart(2,'0');objectiveCount.textContent=`· ${Math.min(coinsTaken,8)} / 8 COINS`}
function respawn(){
  lives--;setLives();if(lives<=0){lives=3;announce('TAKE A BREATH — TRY AGAIN!')}else announce('OOPS! BACK TO THE TRAIL');
  const cp=checkpoints[checkpoint];hero.position.set(cp.x,cp.y,cp.z);vy=0;grounded=true;moveX=0;moveZ=0;invulnerable=1.5;
}
function collect(coinObj){coinObj.collected=true;scene.remove(coinObj.group);coinsTaken++;updateCoinHud();announce(coinsTaken>=8?'COIN STREAK!':'NICE PICKUP!');}
function winGame(){if(won)return;won=true;document.querySelector('#final-stats').textContent=`Coins collected: ${coinsTaken} / ${coins.length}  ·  Lives left: ${lives}`;winOverlay.classList.remove('hidden');}
function clampPlayer(){
 const px=hero.position.x,pz=hero.position.z;
 if(hero.position.y < -10){respawn();return}
 const previous=hero.position.y-vy*(1/60);
 if(vy<=0){
  let landing=null;
  for(const p of platforms){
   if(px>p.x-p.w/2+.24&&px<p.x+p.w/2-.24&&pz>p.z-p.d/2+.24&&pz<p.z+p.d/2-.24&&previous>=p.y-.08&&hero.position.y<=p.y+.11){if(!landing||p.y>landing.y)landing=p;}
  }
  if(landing){hero.position.y=landing.y;vy=0;grounded=true;
   const idx=platforms.indexOf(landing);if(idx>checkpoint){checkpoint=idx; if(idx===3||idx===5)announce('CHECKPOINT!');}
  } else grounded=false;
 }
}

const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.035);worldTime+=dt;
 for(const c of coins){if(!c.collected){c.group.rotation.y+=dt*1.65;c.group.position.y=c.baseY+Math.sin(worldTime*2.7+c.phase)*.16;}}
 starMesh.rotation.y=worldTime*1.3;starMesh.rotation.z=Math.sin(worldTime*1.7)*.15;
 goal.children.forEach(o=>{if(o.geometry&&o.geometry.type==='OctahedronGeometry'&&o!==starMesh){const a=o.userData.orbit;o.position.x=Math.cos(worldTime*1.4+a)*2;o.position.y=2.3+Math.sin(worldTime*2+a)*.8;o.rotation.y+=dt*2;}});
 if(started&&!won){
  const input=moveInput(),run=down('shift')?8.7:6.4;
  const targetX=input.x*run,targetZ=input.z*run;
  const smooth=Math.min(1,dt*11);moveX+=(targetX-moveX)*smooth;moveZ+=(targetZ-moveZ)*smooth;
  hero.position.x+=moveX*dt;hero.position.z+=moveZ*dt;
  if(input.active){const angle=Math.atan2(input.x,-input.z);body.rotation.y=THREE.MathUtils.lerp(body.rotation.y,angle,Math.min(1,dt*10));}
  if(!grounded)vy-=23*dt;hero.position.y+=vy*dt;clampPlayer();
  const moving=input.active&&grounded;const stride=moving?Math.sin(worldTime*(down('shift')?15:11))*.52:0;
  legL.rotation.x=stride;legR.rotation.x=-stride;armL.rotation.x=-stride*.55;armR.rotation.x=stride*.55;
  body.position.y=grounded&&moving?Math.abs(Math.sin(worldTime*11))*.075:0;
  shadow.position.set(hero.position.x,.045+Math.max(0,hero.position.y)*.002,hero.position.z);shadow.scale.setScalar(Math.max(.45,1-hero.position.y*.055));
  if(invulnerable>0){invulnerable-=dt;hero.visible=Math.floor(worldTime*12)%2===0}else hero.visible=true;
  for(const c of coins){if(!c.collected&&hero.position.distanceTo(c.group.position)<1.02)collect(c)}
  for(const e of enemies){if(!e.alive)continue;e.g.position.x+=e.dir*1.35*dt;if(e.g.position.x>e.maxX||e.g.position.x<e.minX)e.dir*=-1;e.g.rotation.y=e.dir>0?Math.PI:0;e.feet[0].rotation.z=Math.sin(worldTime*8)*.22;e.feet[1].rotation.z=-Math.sin(worldTime*8)*.22;
   const dx=hero.position.x-e.g.position.x,dz=hero.position.z-e.g.position.z,dist=Math.hypot(dx,dz);
   if(dist<.9&&hero.position.y>e.g.position.y+.55&&vy<1){e.alive=false;e.g.scale.y=.17;setTimeout(()=>scene.remove(e.g),450);vy=6.4;grounded=false;announce('NICE STOMP!');}
   else if(dist<.82&&hero.position.y<1.1&&invulnerable<=0)respawn();
  }
  const target=new THREE.Vector3(hero.position.x,hero.position.y+1.1,hero.position.z-3.8);
  const desired=new THREE.Vector3(hero.position.x,hero.position.y+7.5,hero.position.z+11.5);
  camera.position.lerp(desired,Math.min(1,dt*3.1));camera.lookAt(target);
  if(hero.position.z<-39&&Math.abs(hero.position.x)<2.1&&Math.abs(hero.position.z+45.5)<2.3)winGame();
 }
 if(lastToast>0){lastToast-=dt;if(lastToast<=0)toast.classList.remove('show')}
 renderer.render(scene,camera);
}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w<650?58:52;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();updateCoinHud();setLives();
document.querySelector('#bottom-tip').classList.add('hidden');animate();
