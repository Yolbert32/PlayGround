(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const introCard = document.getElementById('introCard');
  const resultCard = document.getElementById('resultCard');
  const state = {playing:false, won:false, lost:false, coins:0, lives:3, time:300, camera:0, last:0, elapsed:0, shake:0, keys:{}, touch:{left:false,right:false,jump:false}, jumpLock:false};
  const player = {x:90,y:0,vx:0,vy:0,w:25,h:39,ground:false,face:1,bounce:0,invuln:0};
  const platforms = [
    {x:0,w:300,y:0,depth:45,kind:'grass'},
    {x:375,w:175,y:-28,depth:42,kind:'grass'},
    {x:630,w:185,y:-5,depth:45,kind:'mint'},
    {x:895,w:175,y:-38,depth:42,kind:'grass'},
    {x:1150,w:215,y:-6,depth:48,kind:'coral'},
    {x:1450,w:190,y:-35,depth:42,kind:'grass'},
    {x:1710,w:235,y:-5,depth:45,kind:'mint'},
    {x:2020,w:260,y:-28,depth:46,kind:'grass'},
    {x:2370,w:300,y:0,depth:54,kind:'grass',goal:true}
  ];
  const coins = [];
  [[175,0],[230,-72],[415,-88],[470,-104],[510,-72],[685,-100],[750,-100],[940,-114],[1000,-114],[1200,-100],[1270,-114],[1320,-85],[1500,-120],[1570,-110],[1770,-100],[1840,-100],[1910,-78],[2080,-125],[2160,-125],[2240,-100],[2440,-95],[2530,-95]].forEach(([x,dy],i)=>coins.push({x,y:dy,r:10,got:false,phase:i*.7}));
  const enemies = [{x:460,y:0,dir:1,min:395,max:525,dead:false},{x:725,y:0,dir:-1,min:650,max:790,dead:false},{x:1225,y:0,dir:1,min:1170,max:1340,dead:false},{x:1800,y:0,dir:-1,min:1730,max:1920,dead:false},{x:2140,y:0,dir:1,min:2050,max:2250,dead:false}];
  const clouds = Array.from({length:12},(_,i)=>({x:i*230+20,y:45+(i*53)%155,s:0.65+(i%4)*.14,phase:i*2}));
  let width=1,height=1,dpr=1,scale=1,groundLine=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const screenX=x=>(x-state.camera)*scale;
  const groundY=p=>groundLine-p.y*scale;
  function resize(){
    const r=canvas.getBoundingClientRect(); dpr=Math.min(devicePixelRatio||1,2); width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    scale=clamp(width/950,.62,1.15);groundLine=height*(width<700?.70:.72);
  }
  window.addEventListener('resize',resize);resize();
  function roundedRect(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
  function drawCloud(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#fff9ec';ctx.beginPath();ctx.ellipse(0,0,48,13,0,0,Math.PI*2);ctx.ellipse(-22,-7,22,18,0,0,Math.PI*2);ctx.ellipse(1,-15,25,24,0,0,Math.PI*2);ctx.ellipse(27,-5,20,16,0,0,Math.PI*2);ctx.fill();ctx.restore()}
  function drawBackground(){
    const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#83d8f0');sky.addColorStop(.63,'#c7eff0');sky.addColorStop(1,'#fff0c8');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
    const sunX=width*.81,sunY=height*.22;ctx.fillStyle='#ffe899';ctx.beginPath();ctx.arc(sunX,sunY,37*scale,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff2ba55';ctx.beginPath();ctx.arc(sunX,sunY,53*scale,0,Math.PI*2);ctx.fill();
    clouds.forEach(c=>{let cx=((c.x-state.camera*.17+state.elapsed*3)%(width+220))-80;drawCloud(cx,c.y*height/560,c.s*scale)});
    // Distant floating green hills
    for(let i=0;i<7;i++){const x=((i*210-state.camera*.28+width*2)%(width+270))-100;const y=groundLine-70*scale-(i%3)*13;ctx.fillStyle=i%2?'#a1dfbd':'#b0e5c4';ctx.beginPath();ctx.ellipse(x,y,155*scale,44*scale,0,Math.PI,0);ctx.lineTo(x+155*scale,groundLine+20);ctx.lineTo(x-155*scale,groundLine+20);ctx.fill()}
    // Tiny faraway clouds / birds
    ctx.strokeStyle='#fff8e4';ctx.lineWidth=2;for(let i=0;i<5;i++){let x=((i*217-state.camera*.1+width)%(width+100));let y=groundLine-120*scale-(i%2)*30;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+5,y-7,x+11,y);ctx.quadraticCurveTo(x+18,y-7,x+23,y);ctx.stroke()}
  }
  function drawPlatform(p){
    const x=screenX(p.x),y=groundY(p),w=p.w*scale,d=p.depth*scale;if(x+w< -30||x>width+30)return;
    const colors=p.kind==='mint'?['#82d39e','#58b77e','#449c6a']:p.kind==='coral'?['#ffad77','#f0845b','#d96b50']:['#8ed98b','#68bf72','#4c9f63'];
    ctx.fillStyle=colors[2];ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w,y+d);ctx.lineTo(x+w-13*scale,y+d+11*scale);ctx.lineTo(x+13*scale,y+d+11*scale);ctx.lineTo(x,y+d);ctx.closePath();ctx.fill();
    ctx.fillStyle=colors[1];ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w-8*scale,y+8*scale);ctx.lineTo(x+8*scale,y+8*scale);ctx.closePath();ctx.fill();
    ctx.fillStyle=colors[0];ctx.beginPath();ctx.roundRect(x,y-7*scale,w,17*scale,[8*scale,8*scale,3*scale,3*scale]);ctx.fill();
    // cheerful island flecks
    for(let i=0;i<Math.floor(p.w/75);i++){let sx=x+(i*73+28)*scale,sy=y+15*scale;if(sx>x+8&&sx<x+w-8){ctx.fillStyle=i%2?'#ffeb9b':'#f9fff0';ctx.beginPath();ctx.ellipse(sx,sy,2.1*scale,1.2*scale,0,0,Math.PI*2);ctx.fill()}}
    if(p.goal){const gx=x+w-35*scale;ctx.strokeStyle='#fff7dd';ctx.lineWidth=3*scale;ctx.beginPath();ctx.moveTo(gx,y-8*scale);ctx.lineTo(gx,y-114*scale);ctx.stroke();ctx.fillStyle='#ff7964';ctx.beginPath();ctx.moveTo(gx,y-112*scale);ctx.lineTo(gx+42*scale,y-99*scale);ctx.lineTo(gx,y-84*scale);ctx.closePath();ctx.fill();ctx.fillStyle='#ffe58a';ctx.beginPath();ctx.arc(gx,y-117*scale,5*scale,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff2bd';ctx.beginPath();ctx.ellipse(gx-8*scale,y+5*scale,13*scale,4*scale,0,0,Math.PI*2);ctx.fill()}
  }
  function drawCoin(c){if(c.got)return;let bob=Math.sin(state.elapsed*4+c.phase)*4*scale,x=screenX(c.x),y=groundY({y:c.y})+bob;if(x< -30||x>width+30)return;let spin=.72+Math.abs(Math.sin(state.elapsed*5+c.phase))*.28;ctx.save();ctx.translate(x,y);ctx.scale(spin,1);ctx.fillStyle='#e7a93e';ctx.beginPath();ctx.ellipse(0,1*scale,9*scale,12*scale,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd55d';ctx.beginPath();ctx.ellipse(0,-1*scale,7*scale,10*scale,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff0a3';ctx.lineWidth=1.5*scale;ctx.beginPath();ctx.moveTo(1*scale,-6*scale);ctx.lineTo(-1*scale,5*scale);ctx.stroke();ctx.restore()}
  function drawEnemy(e){if(e.dead)return;const x=screenX(e.x),y=groundY({y:e.y})-8*scale;if(x< -30||x>width+30)return;const bob=Math.sin(state.elapsed*8+e.x)*1.5*scale;ctx.save();ctx.translate(x,y+bob);ctx.fillStyle='#d99569';ctx.beginPath();ctx.ellipse(0,0,14*scale,10*scale,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f0bd85';ctx.beginPath();ctx.ellipse(0,-5*scale,10*scale,8*scale,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.beginPath();ctx.ellipse(-4*scale,-1*scale,3*scale,4*scale,0,0,Math.PI*2);ctx.ellipse(4*scale,-1*scale,3*scale,4*scale,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#536b73';ctx.beginPath();ctx.arc(-3*scale,0,1.4*scale,0,Math.PI*2);ctx.arc(5*scale,0,1.4*scale,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ad7158';ctx.beginPath();ctx.ellipse(0,7*scale,6*scale,2.2*scale,0,0,Math.PI*2);ctx.fill();ctx.restore()}
  function drawPlayer(){
    let x=screenX(player.x),y=groundY({y:player.y})-player.h*scale;const blink=player.invuln>0&&Math.floor(state.elapsed*15)%2===0;if(blink)return;
    ctx.fillStyle='#31546922';ctx.beginPath();ctx.ellipse(x+1*scale,groundY({y:player.y})+2*scale,16*scale,4*scale,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(x,y);if(player.face<0){ctx.translate(25*scale,0);ctx.scale(-1,1)}
    let b=Math.sin(player.bounce)*1.3*scale;
    // legs / shoes
    roundedRect(3*scale,27*scale+b,8*scale,10*scale,3*scale,'#557db0');roundedRect(15*scale,27*scale-b,8*scale,10*scale,3*scale,'#557db0');roundedRect(1*scale,34*scale+b,11*scale,5*scale,2*scale,'#684d50');roundedRect(14*scale,34*scale-b,11*scale,5*scale,2*scale,'#684d50');
    // overalls
    roundedRect(4*scale,17*scale,18*scale,15*scale,5*scale,'#628fc7');ctx.fillStyle='#f5cb70';ctx.beginPath();ctx.arc(9*scale,22*scale,1.5*scale,0,Math.PI*2);ctx.arc(18*scale,22*scale,1.5*scale,0,Math.PI*2);ctx.fill();
    // arms and shirt
    roundedRect(0,16*scale,6*scale,12*scale,3*scale,'#f2a47d');roundedRect(20*scale,16*scale,6*scale,12*scale,3*scale,'#f2a47d');roundedRect(4*scale,9*scale,18*scale,13*scale,5*scale,'#f29270');
    // face
    ctx.fillStyle='#ffd1a0';ctx.beginPath();ctx.ellipse(14*scale,10*scale,9*scale,9*scale,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(18*scale,10*scale,2.5*scale,3.3*scale,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#44545b';ctx.beginPath();ctx.arc(19*scale,10*scale,1.2*scale,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d77d68';ctx.lineWidth=1*scale;ctx.beginPath();ctx.arc(17*scale,14*scale,3*scale,.2,1.8);ctx.stroke();
    // cap
    ctx.fillStyle='#f27860';ctx.beginPath();ctx.ellipse(13*scale,3*scale,11*scale,5.3*scale,0,Math.PI,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(17*scale,5*scale,9*scale,2.4*scale,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff4dd';ctx.beginPath();ctx.arc(12*scale,1*scale,2.1*scale,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function updateHud(){document.getElementById('coins').textContent=String(state.coins).padStart(2,'0');document.getElementById('lives').textContent=String(state.lives).padStart(2,'0');document.getElementById('timer').textContent=String(Math.max(0,Math.ceil(state.time)));const p=clamp(player.x/2630,0,1);document.getElementById('progressText').textContent=Math.round(p*100)+'%';document.getElementById('progressBar').style.width=(p*100)+'%'}
  function toast(){const t=document.getElementById('toast');t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}
  function reset(){state.coins=0;state.lives=3;state.time=300;state.camera=0;state.elapsed=0;state.won=false;state.lost=false;state.shake=0;player.x=90;player.y=0;player.vx=0;player.vy=0;player.invuln=0;coins.forEach(c=>c.got=false);enemies.forEach((e,i)=>{e.dead=false;e.x=[460,725,1225,1800,2140][i];e.dir=i%2? -1:1});updateHud()}
  function start(){reset();state.playing=true;overlay.classList.add('hidden');introCard.classList.remove('hidden');resultCard.classList.add('hidden');state.last=performance.now()}
  function end(win){state.playing=false;state.won=win;overlay.classList.remove('hidden');introCard.classList.add('hidden');resultCard.classList.remove('hidden');document.getElementById('resultEyebrow').textContent=win?'✦ COURSE CLEAR!':'TIME TO TRY AGAIN';document.getElementById('resultTitle').textContent=win?'You did it!':'Almost there!';document.getElementById('resultMessage').textContent=win?`You found ${state.coins} coins and made the kingdom smile.`:'The flag is waiting just a little farther on.'}
  document.getElementById('playButton').addEventListener('click',start);document.getElementById('againButton').addEventListener('click',start);
  function keyDown(e){if(['ArrowLeft','ArrowRight','ArrowUp',' ','a','d','w','A','D','W'].includes(e.key))e.preventDefault();state.keys[e.key.toLowerCase()]=true;if((e.key===' '||e.key==='ArrowUp'||e.key.toLowerCase()==='w')&&!state.jumpLock){state.keys.jumpPressed=true;state.jumpLock=true}}
  function keyUp(e){state.keys[e.key.toLowerCase()]=false;if(e.key===' '||e.key==='ArrowUp'||e.key.toLowerCase()==='w')state.jumpLock=false}
  window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',()=>{state.keys={};state.touch={left:false,right:false,jump:false}});
  document.querySelectorAll('[data-control]').forEach(btn=>{const key=btn.dataset.control;const down=e=>{e.preventDefault();state.touch[key]=true;if(key==='jump'&&!state.jumpLock){state.keys.jumpPressed=true;state.jumpLock=true}try{btn.setPointerCapture(e.pointerId)}catch{}};const up=e=>{e.preventDefault();state.touch[key]=false;if(key==='jump')state.jumpLock=false};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up)});
  let muted=false;document.getElementById('soundButton').addEventListener('click',e=>{muted=!muted;e.currentTarget.innerHTML=muted?'♫ <span>SOUND OFF</span>':'♫ <span>SOUND ON</span>'});
  function update(dt){state.elapsed+=dt;if(!state.playing)return;state.time-=dt;if(state.time<=0){state.time=0;updateHud();end(false);return}
    const left=state.keys.arrowleft||state.keys.a||state.touch.left,right=state.keys.arrowright||state.keys.d||state.touch.right,jump=state.keys.jumpPressed||state.touch.jump;
    const dir=(right?1:0)-(left?1:0);if(dir){player.vx+=dir*930*dt;player.face=dir}else player.vx*=Math.pow(.001,dt);player.vx=clamp(player.vx,-270,270);
    if(jump&&player.ground){player.vy=490;player.ground=false;player.bounce=0}state.keys.jumpPressed=false;
    player.vy-=1250*dt;player.x+=player.vx*dt;player.y+=player.vy*dt;player.x=Math.max(0,player.x);player.ground=false;
    // Landing only while falling, preserving the little gaps between islands.
    if(player.vy<=0){for(const p of platforms){const top=p.y;if(player.x+player.w*.75>p.x&&player.x+player.w*.25<p.x+p.w&&player.y<=top+5&&player.y-player.vy*dt>=top-2){player.y=top;player.vy=0;player.ground=true;break}}}
    for(const c of coins){if(c.got)continue;if(Math.abs(player.x+player.w/2-c.x)<22&&Math.abs(player.y-player.h/2-c.y)<28){c.got=true;state.coins++;}}
    for(const e of enemies){if(e.dead)continue;e.x+=e.dir*54*dt;if(e.x<e.min||e.x>e.max)e.dir*=-1;if(player.invuln>0)continue;const close=Math.abs(player.x+player.w/2-e.x)<22&&Math.abs(player.y-18-e.y)<23;if(close){if(player.vy< -30&&player.y>e.y+8){e.dead=true;player.vy=360;player.ground=false}else{player.invuln=1.5;state.shake=.2;state.lives--;player.vy=260;player.vx=player.x<e.x?-230:230;if(state.lives<=0){updateHud();end(false);return}}}}
    player.invuln=Math.max(0,player.invuln-dt);if(player.y< -150){state.lives--;if(state.lives<=0){updateHud();end(false);return}player.x=Math.max(30,player.x-130);player.y=100;player.vy=0;player.invuln=1.4}
    if(player.ground)player.bounce+=dt*10;const target=clamp(player.x-width/2.5,0,2630-width/scale);state.camera+=(target-state.camera)*Math.min(1,dt*4.5);if(state.shake>0)state.shake-=dt;
    const goal=platforms[platforms.length-1];if(player.x+player.w>goal.x+goal.w-60&&player.ground){end(true);return}updateHud()
  }
  function render(){ctx.save();if(state.shake>0)ctx.translate((Math.random()-.5)*8,(Math.random()-.5)*5);drawBackground();platforms.forEach(drawPlatform);coins.forEach(drawCoin);enemies.forEach(drawEnemy);drawPlayer();ctx.restore()}
  function frame(now){const dt=Math.min(.035,(now-state.last)/1000||0);state.last=now;update(dt);render();requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();
