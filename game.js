(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = 720, H = 540, TILE = 40;
  const roadLanes = [
    { y: 100, dir: 1, speed: 73 }, { y: 140, dir: -1, speed: 87 },
    { y: 180, dir: 1, speed: 66 }, { y: 220, dir: -1, speed: 96 },
    { y: 320, dir: -1, speed: 75 }, { y: 360, dir: 1, speed: 91 },
    { y: 400, dir: -1, speed: 68 }, { y: 440, dir: 1, speed: 104 }
  ];
  const driverColors = ['#ff7450','#6c93ff','#f2bf4c','#bf87ee','#45c3a0','#ec6da4'];
  const STORAGE = 'afterimage-runs-v1';
  let savedRuns = loadRuns(), best = Number(localStorage.getItem('afterimage-best') || 0);
  let score = 0, lives = 3, runNumber = (Number(localStorage.getItem('afterimage-run-number')) || 0) + 1;
  let running = false, ended = false, runStart = 0, lastTime = 0, cars = [], particles = [], homes = [false,false,false,false,false];
  let frog = { x: 360, y: 500, fromX: 360, fromY: 500, targetX: 360, targetY: 500, moving: 0, blink: 0, invuln: 0 };
  let currentTape = [], moveCount = 0, audioOn = false, audioCtx = null, pointerStart = null, toastTimer = 0;
  const $ = id => document.getElementById(id);

  function loadRuns() { try { const r = JSON.parse(localStorage.getItem(STORAGE) || '[]'); return Array.isArray(r) ? r.slice(0, 6) : []; } catch (_) { return []; } }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  }
  function getDriver(index) {
    if (savedRuns.length) return savedRuns[index % savedRuns.length];
    return { id: 0, tape: null, name: 'LIVE TAPE' };
  }
  function buildCars() {
    cars = [];
    roadLanes.forEach((lane, li) => {
      const count = li % 2 === 0 ? 3 : 2;
      for (let j = 0; j < count; j++) {
        const driverIndex = (li * 2 + j) % Math.max(1, savedRuns.length || 6);
        const driver = getDriver(driverIndex);
        const width = 48 + ((li + j) % 3) * 7;
        let x = 25 + j * (W / count) + (li * 37 + j * 59) % 43;
        if (lane.dir < 0) x = W - x;
        cars.push({ x, y: lane.y, lane: li, dir: lane.dir, speed: lane.speed * (0.82 + ((li * 17 + j * 13) % 30) / 100), width, height: 25, color: driverColors[(driver.id + li + j) % driverColors.length], driver, driverIndex, tapeIndex: (j * 2 + li) % Math.max(1, driver.tape ? driver.tape.length : 1), nextSteer: 1.1 + ((li * 3 + j * 7) % 20) / 10, steer: 0, steerTarget: 0, bob: Math.random() * 6.28, horn: false });
      }
    });
  }
  function updateHUD() {
    $('score').textContent = String(score).padStart(2, '0');
    $('bestScore').textContent = String(best).padStart(2, '0');
    $('driverCount').textContent = String(savedRuns.length).padStart(2, '0');
    $('lifeCount').textContent = `${String(lives).padStart(2,'0')} / 03`;
    $('lives').setAttribute('aria-label', `${lives} chances remaining`);
    [...$('lives').children].forEach((el, i) => el.classList.toggle('lost', i >= lives));
    $('runLabel').textContent = `RUN ${String(runNumber).padStart(3, '0')}`;
    $('restartButton').disabled = !running && !ended;
    const log = $('driverLog');
    if (!savedRuns.length) log.innerHTML = '<div class="empty-log">YOUR FIRST RUN<br>IS WAITING TO HAPPEN.</div>';
    else log.innerHTML = savedRuns.slice(0, 4).map((r, i) => `<div class="driver-entry"><i class="driver-chip" style="background:${driverColors[(r.id || i) % driverColors.length]}"></i><b>RUN ${String(r.id).padStart(3,'0')}</b><span>${r.crossings || 0} X</span></div>`).join('');
  }
  function initializeRun() {
    lives = 3; currentTape = []; moveCount = 0; ended = false; running = true; runStart = performance.now();
    frog = { x: 360, y: 500, fromX: 360, fromY: 500, targetX: 360, targetY: 500, moving: 0, blink: 0, invuln: 1.5 };
    particles = []; buildCars();
    $('overlay').classList.add('hidden'); $('restartButton').disabled = false;
    $('canvas').focus({ preventScroll: true }); updateHUD(); sound(530, .08, 'sine');
  }
  function finishRun(reason) {
    if (ended) return;
    running = false; ended = true;
    if (currentTape.length) {
      const run = { id: runNumber, tape: currentTape.slice(0, 180), crossings: score, reason, date: Date.now() };
      savedRuns.unshift(run); savedRuns = savedRuns.slice(0, 6);
      try { localStorage.setItem(STORAGE, JSON.stringify(savedRuns)); } catch (_) {}
    }
    runNumber++; localStorage.setItem('afterimage-run-number', String(runNumber - 1));
    const won = reason === 'escape';
    $('overlayEyebrow').textContent = won ? 'THE LOOP IS YOURS' : 'ANOTHER YOU TAKES THE WHEEL';
    $('overlayTitle').innerHTML = won ? 'CLEAN<br>GETAWAY.' : 'YOU LEFT<br>A TRACE.';
    $('overlayText').textContent = won ? `You made ${score} garden ${score === 1 ? 'visit' : 'visits'}. Your instincts are now in the traffic.` : `You crossed ${score} time${score === 1 ? '' : 's'}. Your moves are saved. The next traffic will drive like you.`;
    $('playButton').innerHTML = '<span>RUN IT BACK</span><b>↗</b>';
    $('overlay').classList.remove('hidden'); $('restartButton').disabled = false;
    updateHUD(); showToast('YOUR MOVES ARE NOW IN TRAFFIC'); sound(won ? 760 : 180, .2, won ? 'triangle' : 'sawtooth');
  }
  function startRun() {
    if (running) return;
    localStorage.setItem('afterimage-run-number', String(runNumber));
    $('playButton').innerHTML = '<span>START RUN</span><b>↗</b>';
    initializeRun();
  }
  function newRun() {
    if (running) finishRun('restart');
    startRun();
  }
  function showToast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1500);
  }
  function sound(freq, duration, type = 'sine') {
    if (!audioOn) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(Math.max(45, freq * .65), audioCtx.currentTime + duration);
      gain.gain.setValueAtTime(.055, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
      osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  }
  function move(dx, dy) {
    if (!running || frog.moving > 0) return;
    const nx = Math.max(22, Math.min(W - 22, frog.x + dx * TILE));
    const ny = Math.max(28, Math.min(520, frog.y + dy * TILE));
    if (nx === frog.x && ny === frog.y) return;
    frog.fromX = frog.x; frog.fromY = frog.y; frog.targetX = nx; frog.targetY = ny; frog.moving = .14;
    moveCount++;
    const now = performance.now() - runStart;
    currentTape.push({ t: Math.round(now), d: dx === 1 ? 'R' : dx === -1 ? 'L' : dy === -1 ? 'U' : 'D' });
    currentTape = currentTape.slice(-180);
    if (savedRuns.length === 0) cars.forEach((car, i) => { if (!car.driver.tape) { car.liveMove = { d: dx, t: 0.18 + (i % 5) * .075 }; } });
    sound(dy < 0 ? 440 : 330, .055);
    if (ny < 70 && Math.abs(nx - (72 + Math.round((nx - 72) / 144) * 144)) < 22) reachHome(nx);
  }
  function reachHome(x) {
    const slot = Math.max(0, Math.min(4, Math.round((x - 72) / 144)));
    if (!homes[slot]) {
      homes[slot] = true; score++; best = Math.max(best, score);
      localStorage.setItem('afterimage-best', String(best));
      burst(72 + slot * 144, 37, '#d8f36a', 18); showToast(['A CLEAN ESCAPE','YOU MADE IT','THE GARDEN REMEMBERS','ONE MORE YOU','NICE TIMING'][slot]);
      sound(720 + score * 30, .16, 'triangle'); updateHUD();
      frog.x = 360; frog.y = 500; frog.targetX = 360; frog.targetY = 500; frog.moving = .35; frog.invuln = 1.2;
      if (homes.every(Boolean)) { homes = [false,false,false,false,false]; showToast('ALL GARDENS CLEARED · KEEP GOING'); }
    } else { frog.targetY = 80; frog.moving = .14; showToast('THAT GARDEN IS ALREADY YOURS'); }
  }
  function loseLife() {
    if (frog.invuln > 0 || !running) return;
    lives--; frog.invuln = 1.2; burst(frog.x, frog.y, '#ff7450', 13); sound(150, .24, 'sawtooth');
    if (lives <= 0) { lives = 0; updateHUD(); finishRun('crash'); return; }
    frog.x = 360; frog.y = 500; frog.fromX = 360; frog.fromY = 500; frog.targetX = 360; frog.targetY = 500; frog.moving = .28;
    showToast('OOPS — A PAST YOU GOT YOU'); updateHUD();
  }
  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) { const a = Math.random() * Math.PI * 2, speed = 25 + Math.random() * 100; particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .35 + Math.random() * .45, max: .8, color, size: 2 + Math.random() * 4 }); }
  }
  function steerCar(car, direction) {
    const lane = roadLanes[car.lane];
    // Only steer into a lane that flows in the same direction. Avoid the median and lawns.
    const choices = roadLanes.map((l, i) => ({ l, i })).filter(o => o.l.dir === car.dir && Math.abs(o.l.y - lane.y) === 40);
    const target = direction < 0 ? choices.filter(o => o.l.y < lane.y).sort((a,b) => b.l.y-a.l.y)[0] : choices.filter(o => o.l.y > lane.y).sort((a,b) => a.l.y-b.l.y)[0];
    if (target) { car.lane = target.i; car.y = target.l.y; car.steer = direction; }
  }
