// Friends-themed Snake PWA - simple but feature-complete
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const spdEl = document.getElementById('spd');
const pauseBtn = document.getElementById('pause');
const muteBtn = document.getElementById('mute');
const bgm = document.getElementById('bgm');

let TILE = 16;
let COLS = canvas.width / TILE;
let ROWS = canvas.height / TILE;

let snake = [{x: Math.floor(COLS/2), y: Math.floor(ROWS/2)}];
let dir = {x:1,y:0};
let nextDir = dir;
let food = null;
let obstacles = [];
let powerups = [];
let score = 0;
let speed = 6; // ticks per second base
let speedMultiplier = 1;
let gameRunning = true;
let tickAcc = 0;
let lastTime = performance.now();

// colors inspired by a "friends" palette
const colors = {
  bg: '#0b0b0f',
  snake: '#ffffff',
  head: '#f6c90e',
  food: '#f04f6d',
  obstacle: '#33363b',
  power_speed: '#1db8f6',
  power_grow: '#f6c90e',
  power_slow: '#f04f6d'
};

function randCell(){return {x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS)}};

function placeFood(){
  for(let i=0;i<100;i++){
    const c = randCell();
    if(isEmpty(c)){ food = c; return; }
  }
  food = null;
}

function isEmpty(cell){
  if(cell.x<0||cell.y<0||cell.x>=COLS||cell.y>=ROWS) return false;
  if(snake.some(s=>s.x===cell.x&&s.y===cell.y)) return false;
  if(obstacles.some(o=>o.x===cell.x&&o.y===cell.y)) return false;
  if(powerups.some(p=>p.x===cell.x&&p.y===cell.y)) return false;
  return true;
}

function initObstacles(n=8){
  obstacles = [];
  for(let i=0;i<n;i++){
    let c=randCell();
    if(isEmpty(c)) obstacles.push(c);
  }
}

function spawnPowerup(){
  const types = ['speed','grow','slow'];
  const type = types[Math.floor(Math.random()*types.length)];
  for(let i=0;i<50;i++){
    const c=randCell();
    if(isEmpty(c)){ powerups.push({x:c.x,y:c.y,type,dur: (type==='speed'?5000:8000)}); return; }
  }
}

function reset(){
  TILE = Math.floor(Math.min(canvas.width, canvas.height)/30);
  COLS = Math.floor(canvas.width/TILE);
  ROWS = Math.floor(canvas.height/TILE);
  snake = [{x: Math.floor(COLS/2), y: Math.floor(ROWS/2)}];
  dir = {x:1,y:0}; nextDir = dir;
  score=0; speed=6; speedMultiplier=1; gameRunning=true;
  initObstacles(10);
  powerups=[]; placeFood();
  scoreEl.textContent = score; spdEl.textContent = speed*speedMultiplier;
}

function tick(){
  // move
  dir = nextDir;
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
  // wrap-around
  head.x = (head.x + COLS) % COLS;
  head.y = (head.y + ROWS) % ROWS;
  // collisions with self or obstacle
  if(snake.some(s=>s.x===head.x && s.y===head.y) || obstacles.some(o=>o.x===head.x && o.y===head.y)){
    gameOver();
    return;
  }
  snake.unshift(head);
  // food
  if(food && head.x===food.x && head.y===food.y){
    score += 10; placeFood();
    // occasionally spawn powerups
    if(Math.random()<0.35) spawnPowerup();
  } else {
    snake.pop();
  }
  // powerups
  for(let i=0;i<powerups.length;i++){
    const p=powerups[i];
    if(head.x===p.x && head.y===p.y){
      applyPowerup(p.type);
      powerups.splice(i,1);
      break;
    }
  }
  scoreEl.textContent = score;
}

function applyPowerup(type){
  if(type==='speed'){
    speedMultiplier = 2;
    setTimeout(()=>{ speedMultiplier = 1; spdEl.textContent = speed*speedMultiplier; }, 5000);
  } else if(type==='grow'){
    // grow snake by 3 instantly
    for(let i=0;i<3;i++) snake.push({...snake[snake.length-1]});
  } else if(type==='slow'){
    speedMultiplier = 0.5;
    setTimeout(()=>{ speedMultiplier = 1; spdEl.textContent = speed*speedMultiplier; }, 6000);
  }
  spdEl.textContent = speed*speedMultiplier;
}

function gameOver(){
  gameRunning=false;
  bgm.pause();
  alert('Game Over — Score: ' + score + '\nRefresh to play again.');
}

function draw(){
  ctx.fillStyle = colors.bg; ctx.fillRect(0,0,canvas.width,canvas.height);
  // grid subtle
  ctx.strokeStyle = 'rgba(255,255,255,0.02)'; ctx.lineWidth=1;
  for(let x=0;x<COLS;x++){ ctx.beginPath(); ctx.moveTo(x*TILE,0); ctx.lineTo(x*TILE,canvas.height); ctx.stroke(); }
  for(let y=0;y<ROWS;y++){ ctx.beginPath(); ctx.moveTo(0,y*TILE); ctx.lineTo(canvas.width,y*TILE); ctx.stroke(); }
  // obstacles
  for(const o of obstacles){
    ctx.fillStyle = colors.obstacle;
    ctx.fillRect(o.x*TILE+1, o.y*TILE+1, TILE-2, TILE-2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(o.x*TILE+4, o.y*TILE+4, TILE-6, TILE-6);
  }
  // powerups
  for(const p of powerups){
    if(p.type==='speed') ctx.fillStyle = colors.power_speed;
    if(p.type==='grow') ctx.fillStyle = colors.power_grow;
    if(p.type==='slow') ctx.fillStyle = colors.power_slow;
    ctx.beginPath();
    ctx.arc(p.x*TILE + TILE/2, p.y*TILE + TILE/2, TILE/3, 0, Math.PI*2);
    ctx.fill();
  }
  // food
  if(food){
    ctx.fillStyle = colors.food;
    ctx.beginPath();
    ctx.arc(food.x*TILE + TILE/2, food.y*TILE + TILE/2, TILE/2.6, 0, Math.PI*2);
    ctx.fill();
  }
  // snake
  for(let i=0;i<snake.length;i++){
    const s = snake[i];
    ctx.fillStyle = (i===0?colors.head:colors.snake);
    ctx.fillRect(s.x*TILE+1, s.y*TILE+1, TILE-2, TILE-2);
  }
}

function gameLoop(ts){
  if(!gameRunning) return;
  const dt = ts - lastTime; lastTime = ts;
  tickAcc += dt;
  const interval = 1000 / (speed * speedMultiplier);
  while(tickAcc > interval){
    tickAcc -= interval;
    tick();
  }
  draw();
  requestAnimationFrame(gameLoop);
}

// controls
window.addEventListener('keydown', e=>{
  const k = e.key;
  if(k==='ArrowUp' && dir.y!==1) nextDir = {x:0,y:-1};
  if(k==='ArrowDown' && dir.y!==-1) nextDir = {x:0,y:1};
  if(k==='ArrowLeft' && dir.x!==1) nextDir = {x:-1,y:0};
  if(k==='ArrowRight' && dir.x!==-1) nextDir = {x:1,y:0};
  if(k===' '){ // speed boost while space held
    speedMultiplier = 2;
    setTimeout(()=>{ speedMultiplier = 1; spdEl.textContent = speed*speedMultiplier; }, 300);
  }
});

pauseBtn.addEventListener('click', ()=>{
  gameRunning = !gameRunning;
  if(gameRunning){ lastTime = performance.now(); requestAnimationFrame(gameLoop); bgm.play(); pauseBtn.textContent='Pause'; }
  else { bgm.pause(); pauseBtn.textContent='Resume'; }
});

muteBtn.addEventListener('click', ()=>{
  bgm.muted = !bgm.muted;
  muteBtn.textContent = bgm.muted ? 'Unmute' : 'Mute';
});

// mobile swipe
let startX=0,startY=0;
canvas.addEventListener('touchstart',e=>{ const t=e.touches[0]; startX=t.clientX; startY=t.clientY; });
canvas.addEventListener('touchend',e=>{ const t=e.changedTouches[0]; const dx=t.clientX-startX, dy=t.clientY-startY; if(Math.abs(dx)>Math.abs(dy)){ if(dx>10 && dir.x!==-1) nextDir={x:1,y:0}; if(dx<-10 && dir.x!==1) nextDir={x:-1,y:0}; } else { if(dy>10 && dir.y!==-1) nextDir={x:0,y:1}; if(dy<-10 && dir.y!==1) nextDir={x:0,y:-1}; } });

// responsive
window.addEventListener('resize', ()=>{ canvas.width = Math.min(640, Math.floor(window.innerWidth*0.6)); canvas.height = canvas.width; reset(); });

// start
canvas.width = Math.min(640, Math.floor(window.innerWidth*0.6)); canvas.height = canvas.width; reset();
requestAnimationFrame(gameLoop);

// autostart music on user action
window.addEventListener('click', ()=>{ if(bgm.paused) bgm.play(); }, {once:true});

// register service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').then(()=>console.log('SW registered')).catch(e=>console.warn(e));
}