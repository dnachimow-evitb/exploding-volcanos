const cv=document.getElementById('c'),W=380,H=600;let X=cv.getContext('2d');
const song=document.getElementById('song');
const CX=190,CY=176,G=0.22,T=58,CHARGE_RATE=0.55,CHARGE_MAX=1.7;
const windAng=-1.45,swingEnd=1.5,idleAng=0.9,swingDur=0.32;
const BASE=['🦆','⛵','🦕'],NEWBY={2:'🚚',3:'🚗',4:'🐙',5:'🪣',6:'🦈',7:'🐬',8:'🐸',9:'🦸',10:'🚀'};
const TOYNAME={'🚚':'Monster Truck','🚗':'Car','🐙':'Octopus','🪣':'Pail','🦈':'Shark','🐬':'Dolphin','🐸':'Froggy','🦸':'Action Figure','🚀':'Rocket'};
const DIFF=[{cr:34,drift:0,blk:0,time:30},{cr:33,drift:.2,blk:0,time:32},{cr:31,drift:.35,blk:0,time:35},{cr:29,drift:.5,blk:1.2,time:38},{cr:27,drift:.65,blk:1.6,time:41},{cr:25,drift:.8,blk:2.0,time:44},{cr:23,drift:.95,blk:2.3,time:47},{cr:21,drift:1.1,blk:2.6,time:50},{cr:19,drift:1.25,blk:2.9,time:53},{cr:17,drift:1.4,blk:3.2,time:56}];
const diff=()=>DIFF[Math.min(round-1,9)];
let craterR=30,score=0,round=1,collected=0,need=0,combo=0,bestCombo=0;
let objs=[],parts=[],eParts=[],rings=[],ejecta=[],collectedToys=[],currentToys=[],landed=[],state='menu';
let charging=null,pendingLaunch=null,armAng=idleAng,swingT=0,swingHit=false,splashSide=1,paused=false;
let newToyEm=null,bannerT=0,banner='',newToyT=0;
let wave=0,volP=0,shake=0,flash=0,flashCol='#fff',eruptT=0,hintT=0;
let blk={on:false,x:190,dir:1,spd:0,y:292};
let timeLeft=30,roundTime=30,hbTimer=0,lastNow=0;
// ── SPRITE ART: drop PNGs into assets/toys/ ; falls back to emoji until they exist ──
const SPRITE_FILE={'🦆':'duck','⛵':'boat','🦕':'dino','🚚':'monstertruck','🚗':'car','🐙':'octopus','🪣':'pail','🦈':'shark','🐬':'dolphin','🐸':'frog','🦸':'actionfigure','🚀':'rocket'};
const sprites={};
for(const em in SPRITE_FILE){const img=new Image();img.onload=()=>{img._ok=true;};img.src='assets/toys/'+SPRITE_FILE[em]+'.png';sprites[em]=img;}
function paintToy(em,size){const img=sprites[em];if(img&&img._ok){X.drawImage(img,-size/2,-size/2,size,size);}else{X.font=(size*0.83).toFixed(0)+'px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText(em,0,0);}}

function catchHit(x,y,vy){return vy>0&&Math.abs(x-CX)<craterR*1.35&&y>CY-craterR*.7&&y<CY+craterR;}
function ideal(o){return{vx:(CX-o.x)/T,vy:(CY-o.y-0.5*G*T*T)/T};}
function handPos(){const kx=190,base=372,s=splashSide,sX=kx+18*s,sY=base-20,ex=sX+s*Math.cos(armAng)*26,ey=sY+Math.sin(armAng)*26;return{x:ex+s*Math.cos(armAng+0.5)*22,y:ey+Math.sin(armAng+0.5)*22};}

// ── AUDIO ──
let AC=null,muted=false;
function initAudio(){try{if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){}
 if(song&&!muted&&song.paused){song.volume=0.5;song.play().catch(()=>{});}}
function blip(f,dur,type,vol,to){if(!AC||muted)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);g.gain.setValueAtTime(vol||.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+dur);}
function noise(dur,vol,ff,q,slide){if(!AC||muted)return;const t=AC.currentTime,sr=AC.sampleRate,n=AC.createBufferSource(),b=AC.createBuffer(1,Math.max(1,~~(sr*dur)),sr),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;n.buffer=b;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(ff||1000,t);if(slide)f.frequency.exponentialRampToValueAtTime(slide,t+dur);f.Q.value=q||1;const g=AC.createGain();g.gain.setValueAtTime(vol||.3,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);n.connect(f).connect(g).connect(AC.destination);n.start(t);n.stop(t+dur);}
function sfxSplash(){noise(.3,.4,1500,.7,400);}
function sfxPlop(){noise(.22,.34,950,.9,280);blip(420,.1,'sine',.1,260);}
function sfxScore(){blip(520,.12,'square',.16,1040);setTimeout(()=>blip(800,.1,'square',.12),55);}
function sfxHair(){blip(420,.1,'triangle',.18,820);setTimeout(()=>blip(920,.18,'triangle',.16,1320),85);}
function sfxBlock(){blip(170,.14,'sawtooth',.22,70);noise(.12,.18,300,.6);}
function sfxErupt(){noise(1.1,.55,600,.4,100);blip(150,1.0,'sawtooth',.28,38);setTimeout(()=>noise(.7,.4,300,.5,80),120);}
function sfxFanfare(){blip(660,.12,'square',.2,990);setTimeout(()=>blip(880,.12,'square',.18,1180),120);setTimeout(()=>blip(1180,.2,'square',.18),250);}

function startRound(carry){const d=diff();craterR=d.cr;need=currentToys.length;collected=0;combo=0;
 const single=round>=3;
 objs=currentToys.map((em,i)=>{let x,y;const L=carry?landed[i]:null;
  if(L){x=L.x;y=L.y;}
  else if(single){x=CX+(Math.random()-.5)*30;y=462+(Math.random()-.5)*16;}
  else{const left=i%2===0;x=left?(58+Math.random()*74):(248+Math.random()*76);y=442+Math.random()*42;}
  const vx=(Math.random()<.5?-1:1)*(0.4+d.drift)*(single?1:.5);
  return{em,x,y,vx,vy:0,bob:Math.random()*6.28,st:'float',sq:0,hb:false,isNew:false};});
 if(newToyEm){const idx=currentToys.lastIndexOf(newToyEm);if(idx>=0){objs[idx].isNew=true;objs[idx].x=CX+(Math.random()-.5)*26;objs[idx].y=458;}}
 parts=[];eParts=[];rings=[];ejecta=[];collectedToys=[];landed=[];charging=null;pendingLaunch=null;swingT=0;swingHit=false;armAng=idleAng;splashSide=1;
 blk.on=d.blk>0;blk.spd=d.blk;blk.x=110;blk.dir=1;blk.y=292;
 timeLeft=d.time;roundTime=d.time;hbTimer=5+Math.random()*3;hintT=round===1?6:0;
 bannerT=2.6;newToyT=newToyEm?5:0;banner=round===1?'Round 1 — splash away!':('Round '+round+'!');}
function startGame(){round=1;score=0;bestCombo=0;currentToys=[...BASE];newToyEm=null;landed=[];state='intro';}
function dist(a,b,c,d){return Math.hypot(a-c,b-d);}
function spawnHairball(){const left=Math.random()<.5;objs.push({hb:true,x:left?70:310,y:450,vx:(Math.random()-.5)*.6,vy:0,bob:Math.random()*6.28,st:'float',sq:0,life:8,r:16});}
function waterBurst(x,y,big){const n=big?26:12;for(let i=0;i<n;i++){const a=-1.57+(Math.random()-.5)*(big?2.4:2),s=(big?3:2)+Math.random()*(big?9:5);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(big?4:2),life:1,r:(big?4:3)+Math.random()*(big?7:4),col:['#bfeaff','#8ed8ff','#ffffff','#5bc0f0'][~~(Math.random()*4)]});}rings.push({x,y,r:6,life:1});}

// ── INPUT ──
// v2: sx/sy = screen-space logical coords (HUD, cards); x/y = game-world coords (toys)
function P(e){const r=cv.getBoundingClientRect(),sx=(e.clientX-r.left)/KS,sy=(e.clientY-r.top)/KS;return{sx,sy,x:sx,y:sy-OY};}
function down(e){initAudio();const p=P(e);
 if(dist(p.sx,p.sy,W-26,SAFE+24)<20){muted=!muted;if(song){if(muted)song.pause();else song.play().catch(()=>{});}return;}
 if((state==='play'||paused)&&dist(p.sx,p.sy,W-64,SAFE+24)<18){paused=!paused;if(!paused)lastNow=performance.now();return;}
 if(paused){if(card&&p.sx>card.x&&p.sx<card.x+card.w&&p.sy>card.y&&p.sy<card.y+card.h)card.act();return;}
 if(state!=='play'){if(card&&p.sx>card.x&&p.sx<card.x+card.w&&p.sy>card.y&&p.sy<card.y+card.h)card.act();return;}
 if(charging||pendingLaunch||swingT>0)return;
 let best=null,bd=74;objs.forEach(o=>{if(o.st!=='float')return;const d=dist(p.x,p.y,o.x,o.y);if(d<bd){bd=d;best=o;}});
 if(best){charging={o:best,c:0.3};hintT=0;splashSide=best.x<190?-1:1;}}
function release(){if(!charging)return;pendingLaunch={o:charging.o,f:charging.c};charging=null;swingT=swingDur;swingHit=false;}
function doLaunch(){if(!pendingLaunch)return;const o=pendingLaunch.o,f=pendingLaunch.f,iv=ideal(o);
 o.st='fly';o.vx=iv.vx*f;o.vy=iv.vy*f;o.drift=diff().drift*.012;o.blocked=0;o.rot=0;o.sq=1;
 shake=6;flash=.3;flashCol='#dff4ff';const hp=handPos();waterBurst(hp.x,hp.y,true);waterBurst(o.x,o.y,true);sfxSplash();pendingLaunch=null;}
cv.addEventListener('pointerdown',e=>{e.preventDefault();down(e);});
window.addEventListener('pointerup',release);
window.addEventListener('pointercancel',release);

// ── PHYSICS ──
function step(dt){
 wave+=1.1;volP+=.05;if(hintT>0)hintT-=dt;if(bannerT>0)bannerT-=dt;if(newToyT>0)newToyT-=dt;
 if(shake>0)shake*=.82;if(flash>0)flash-=.04;
 if(charging)armAng+=(windAng-armAng)*0.22;
 else if(swingT>0){const p=1-swingT/swingDur;
   if(p<0.45)armAng=windAng+(swingEnd-windAng)*((p/0.45)*(p/0.45));
   else armAng=swingEnd+(idleAng-swingEnd)*((p-0.45)/0.55);
   if(!swingHit&&p>=0.42){swingHit=true;doLaunch();}
   swingT-=dt;}
 else armAng+=((idleAng+Math.sin(wave*.05)*.1)-armAng)*0.1;
 if(pendingLaunch&&swingT<=0)doLaunch();
 if(charging){charging.c=Math.min(charging.c+dt*CHARGE_RATE,CHARGE_MAX);}
 if(state==='play'){
   const fpN=collected/Math.max(need,1);if(fpN>=.7)shake=Math.max(shake,(fpN-.65)*4);
   timeLeft-=dt;if(timeLeft<=0){timeLeft=0;state='gameover';return;}
   hbTimer-=dt;if(hbTimer<=0&&!objs.some(o=>o.hb&&o.st!=='gone')){spawnHairball();hbTimer=8+Math.random()*4;}
 }
 if(blk.on){blk.x+=blk.spd*blk.dir;if(blk.x>298||blk.x<82)blk.dir*=-1;blk.y=292+Math.sin(wave*.05)*8;}
 const d=diff();
 objs.forEach(o=>{
  if(o.sq>0)o.sq*=.86;
  if(o.hb&&o.st==='float'){o.life-=dt;if(o.life<=0){o.st='gone';pop(o.x,o.y-20,'gurgle...','#9a7a4a');}}
  const held=(charging&&charging.o===o)||(pendingLaunch&&pendingLaunch.o===o);
  if(o.st==='float'){if(held){}else{o.x+=o.vx;o.y+=Math.sin(wave*.04+o.bob)*.06;
   if(o.x<46||o.x>334)o.vx*=-1;if(Math.abs(o.x-CX)<58)o.vx=(o.x<CX?-1:1)*Math.abs(o.vx);}
  }else if(o.st==='fly'){
   o.vx+=o.drift||0;o.vy+=G;o.x+=o.vx;o.y+=o.vy;o.rot=(o.rot||0)+o.vx*.05;
   if(blk.on&&!o.blocked&&dist(o.x,o.y,blk.x,blk.y)<30){o.blocked=1;o.vy=Math.abs(o.vy)*.5+1;o.vx*=-.5;shake=5;pop(blk.x,blk.y-34,'BLOCKED!','#ff5555');sfxBlock();}
   if(catchHit(o.x,o.y,o.vy)){
     if(o.hb){combo++;bestCombo=Math.max(bestCombo,combo);timeLeft+=5;score+=50;shake=8;flash=.35;flashCol='#ffe9b0';collectedToys.push('🧶');
       pop(CX,CY-18,'HAIRBALL! +50  +5s','#ffd23f');splash(CX,CY,'#8a5a2a',26);sfxHair();o.st='gone';
     }else{collected++;combo++;bestCombo=Math.max(bestCombo,combo);collectedToys.push(o.em);
       const fpN2=collected/need,fpPrev=(collected-1)/need;
       if(fpN2>=.85&&fpPrev<.85)pop(CX,CY-46,'gonna OVERFLOW?!','#ff4400');else if(fpN2>=.6&&fpPrev<.6)pop(CX,CY-46,"it's getting HOTTER!",'#ff8a1a');else if(fpN2>=.35&&fpPrev<.35)pop(CX,CY-46,"it's getting bigger!",'#ffd23f');
       if(combo===3)pop(190,150,'Look, Daddy, look!','#7fd0ff');
       const mult=Math.min(combo,5),pts=(12+round*2)*mult;score+=pts;shake=7;flash=.3;flashCol='#fff';
       splash(CX,CY,'#ffcc00',24);waterBurst(CX,CY,false);
       for(let k=0;k<10;k++){const a=-1.57+(Math.random()-.5)*1.4,s=3+Math.random()*5;eParts.push({x:CX,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:3+Math.random()*4,col:'#ff8a1a'});}
       pop(CX,CY-22,'+'+pts+(mult>1?'  x'+mult+'!':''),'#ffd23f');sfxScore();
       o.st='gone';if(collected>=need)setTimeout(roundWin,380);}
   }else if((o.vy>0&&o.y>=448)||o.x<22||o.x>358){
     combo=0;
     if(o.hb){o.st='gone';waterBurst(Math.max(40,Math.min(340,o.x)),456,false);}
     else{o.st='float';o.x=Math.max(58,Math.min(322,o.x));o.y=Math.max(448,Math.min(o.y,486));o.vx=(Math.random()<.5?-1:1)*(0.4+d.drift)*(round>=3?1:.4);o.vy=0;o.blocked=0;
       waterBurst(o.x,o.y-6,false);pop(o.x,o.y-26,'missed — splash!','#bcdfff');sfxPlop();}
   }
  }
 });
 objs=objs.filter(o=>!(o.hb&&o.st==='gone'));
 parts=parts.filter(p=>p.life>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.16;p.life-=.04;});
 rings=rings.filter(r=>r.life>0);rings.forEach(r=>{r.r+=(r.big?8:2.6);r.life-=(r.big?.03:.045);});
 eParts=eParts.filter(p=>p.life>0);eParts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.2;p.life-=.022;p.r*=.985;});
}
function updateEjecta(){if(!ejecta.length)return;for(const e of ejecta){if(!e.alive)continue;if(e.delay>0){e.delay--;continue;}e.vy+=0.32;e.x+=e.vx;e.y+=e.vy;e.rot+=e.rotSpeed;
  if((e.vy>0&&e.y>462)||e.y>590||e.x<-30||e.x>W+30){e.alive=false;const lx=Math.max(58,Math.min(322,e.x)),ly=Math.max(450,Math.min(e.y,484));if(e.y<560&&e.x>14&&e.x<W-14){waterBurst(lx,ly,false);if(Math.random()<.4)sfxPlop();}if(e.em!=='🧶')landed.push({x:lx,y:ly});}}
 ejecta=ejecta.filter(e=>e.alive);}
function drawEjecta(){ejecta.forEach(e=>{if(e.delay>0)return;X.save();X.translate(e.x,e.y);
  X.globalAlpha=.55;X.fillStyle='#fff';X.beginPath();X.arc(0,0,23,0,6.28);X.fill();X.globalAlpha=1;
  X.rotate(e.rot);X.shadowColor='rgba(0,0,0,.35)';X.shadowBlur=5;paintToy(e.em,40);X.restore();});}
function splash(x,y,col,n){for(let i=0;i<n;i++){const a=-1.57+(Math.random()-.5)*2.4,s=2+Math.random()*6;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:1,r:3+Math.random()*5,col});}}
function pop(x,y,t,c){const e=document.createElement('div');e.className='fp';e.textContent=t;e.style.color=c;
 const wr=document.getElementById('w');
 e.style.left=(x*KS-22)+'px';e.style.top=((y+OY)*KS-12)+'px';wr.appendChild(e);setTimeout(()=>e.remove(),1000);}
function roundWin(){
 if(round>=10){score+=150+Math.round(timeLeft)*10;state='win';eruptT=160;bigErupt();return;}
 state='erupt';eruptT=160;score+=need*15+combo*5+Math.round(timeLeft)*10;bigErupt();
 banner='💦 The toys rain back into the tub!';bannerT=3.4;
 setTimeout(()=>{round++;newToyEm=NEWBY[round]||null;if(newToyEm)currentToys=[...currentToys,newToyEm];
   if(newToyEm){state='newtoy';sfxFanfare();}else{startRound(true);state='play';lastNow=performance.now();}},3500);
}
function bigErupt(){sfxErupt();shake=18;flash=.42;flashCol='#ffce8a';rings.push({x:CX,y:CY,r:10,life:1,big:true});
 for(let i=0;i<55;i++){const a=-1.57+(Math.random()-.5)*1.9,s=4+Math.random()*12;eParts.push({x:CX,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:4+Math.random()*6,col:['#ff3300','#ff7700','#ffcc00','#ff5500','#ffe066'][~~(Math.random()*5)]});}
 ejecta=collectedToys.map((em,i)=>({em,x:CX+(Math.random()-.5)*20,y:CY-4,vx:(Math.random()-.5)*9,vy:-(7+Math.random()*6),rot:(Math.random()-.5)*.7,rotSpeed:(Math.random()-.5)*.28,alive:true,delay:~~(i*4)}));}


// ══════════════════════════════════════════════════════════════════════════
// ── DRAW (Opus 5.5 repaint): one holistic storybook repaint, matched to the cover art ──
//    crisp on Retina (devicePixelRatio), fills the whole phone screen,
//    warm outlined style for wall, tub, water, volcano, Noah & Max together.
// ══════════════════════════════════════════════════════════════════════════
const OUT='#3b1f0e',TAU=6.2832;
const FF='ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
const SKIN='#f6c08f',SKIN_D='#e09a68',SKIN_L='#ffdcb8';
let HS=600,OY=0,DY=0,SAFE=0,KS=1,DPR=1,wallCache=null,rocks=null,card=null;
function fnt(w,s){return w+' '+s+'px '+FF;}
function circ(x,y,r){X.beginPath();X.arc(x,y,r,0,TAU);}
function ell(x,y,rx,ry,rot){X.beginPath();X.ellipse(x,y,rx,ry,rot||0,0,TAU);}
function rr(x,y,w,h,r){X.beginPath();X.roundRect(x,y,w,h,r);}
function rpoly(pts,r){const n=pts.length;X.beginPath();for(let i=0;i<n;i++){const a=pts[(i+n-1)%n],b=pts[i],c=pts[(i+1)%n];if(i===0)X.moveTo((a[0]+b[0])/2,(a[1]+b[1])/2);X.arcTo(b[0],b[1],(b[0]+c[0])/2,(b[1]+c[1])/2,r);}X.closePath();}
function ink(fill,lw){X.fillStyle=fill;X.fill();X.lineWidth=lw||3;X.lineJoin='round';X.strokeStyle=OUT;X.stroke();}
function label(t,x,y,size,fill,stroke,lw,w){X.font=fnt(w||900,size);X.textAlign='center';X.textBaseline='middle';
 if(stroke){X.lineJoin='round';X.lineWidth=lw||4;X.strokeStyle=stroke;X.strokeText(t,x,y);}X.fillStyle=fill;X.fillText(t,x,y);X.textBaseline='alphabetic';}
let seed=7;function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647;}

// ── BACKDROP: tiled wall, window, kids' drawings, floor (cached), + live sun & bubbles ──
function kidDrawing(x,y,w,h,rot,name,shirt,hairCol,nameCol){X.save();X.translate(x+w/2,y+h/2);X.rotate(rot);
 X.fillStyle='rgba(0,25,70,.22)';X.fillRect(-w/2+3,-h/2+4,w,h);X.fillStyle='#fffdf5';X.fillRect(-w/2,-h/2,w,h);
 X.strokeStyle='rgba(59,31,14,.35)';X.lineWidth=1;X.strokeRect(-w/2,-h/2,w,h);
 X.strokeStyle='#3a3a3a';X.lineWidth=1.6;X.lineCap='round';circ(0,-h*.2,6.5);X.stroke();
 X.strokeStyle=hairCol;X.lineWidth=2;X.beginPath();for(let i=0;i<5;i++){X.moveTo(-5+i*2.5,-h*.2-6);X.lineTo(-6+i*3,-h*.2-10);}X.stroke();
 X.fillStyle='#3a3a3a';circ(-2.3,-h*.21,.9);X.fill();circ(2.3,-h*.21,.9);X.fill();X.strokeStyle='#d33';X.lineWidth=1.2;X.beginPath();X.arc(0,-h*.19,2.6,.3,2.8);X.stroke();
 X.fillStyle=shirt;X.beginPath();X.moveTo(0,-h*.2+7);X.lineTo(-7,h*.12);X.lineTo(7,h*.12);X.closePath();X.fill();
 X.strokeStyle='#3a3a3a';X.lineWidth=1.6;X.beginPath();X.moveTo(-4,-h*.04);X.lineTo(-12,-h*.14);X.moveTo(4,-h*.04);X.lineTo(12,-h*.14);X.moveTo(-3,h*.12);X.lineTo(-5,h*.24);X.moveTo(3,h*.12);X.lineTo(5,h*.24);X.stroke();
 X.fillStyle='#f5b800';[[-w*.36,-h*.36],[w*.34,-h*.3],[w*.32,h*.05]].forEach(([sx,sy])=>{X.beginPath();for(let i=0;i<10;i++){const a=i*.628-1.57,r=i%2?1.4:3.4;X.lineTo(sx+Math.cos(a)*r,sy+Math.sin(a)*r);}X.closePath();X.fill();});
 X.font=fnt(900,9.5);X.textAlign='center';X.textBaseline='middle';X.fillStyle=nameCol;X.fillText(name,0,h*.38);X.textBaseline='alphabetic';
 X.fillStyle='rgba(255,236,170,.85)';X.save();X.translate(-w/2+4,-h/2);X.rotate(-.6);X.fillRect(-7,-3,14,6);X.restore();X.save();X.translate(w/2-4,-h/2);X.rotate(.6);X.fillRect(-7,-3,14,6);X.restore();
 X.restore();}
function buildWall(){const k=KS*DPR,c=document.createElement('canvas');c.width=Math.ceil(W*k);c.height=Math.ceil(HS*k);
 const main=X;X=c.getContext('2d');X.setTransform(k,0,0,k,0,0);
 const floorY=OY+470,t=38;
 X.fillStyle='#17609c';X.fillRect(0,0,W,floorY);seed=11;
 for(let y=floorY-t*Math.ceil(floorY/t);y<floorY;y+=t)for(let x=-8;x<W;x+=t){const j=rnd()*14-7;
  X.fillStyle='hsl('+(203+j*.6).toFixed(1)+',66%,'+(50+j*.5).toFixed(1)+'%)';rr(x+1.6,y+1.6,t-3.2,t-3.2,5);X.fill();
  const hg=X.createLinearGradient(x,y,x+t,y+t);hg.addColorStop(0,'rgba(255,255,255,.30)');hg.addColorStop(.45,'rgba(255,255,255,0)');hg.addColorStop(1,'rgba(0,30,80,.14)');X.fillStyle=hg;rr(x+1.6,y+1.6,t-3.2,t-3.2,5);X.fill();
  if(rnd()<.1){X.fillStyle='rgba(255,255,255,.5)';ell(x+t*.3,y+t*.28,5,2.2,-.6);X.fill();}}
 const vg=X.createLinearGradient(0,0,0,floorY);vg.addColorStop(0,'rgba(4,18,48,.38)');vg.addColorStop(.55,'rgba(4,18,48,0)');X.fillStyle=vg;X.fillRect(0,0,W,floorY);
 // warm sunbeam from the window
 X.fillStyle='rgba(255,236,170,.10)';X.beginPath();X.moveTo(18,OY+DY+74);X.lineTo(96,OY+DY+74);X.lineTo(260,floorY);X.lineTo(70,floorY);X.closePath();X.fill();
 // window
 const wx=16,wy=OY+DY+70,ww=80,wh=102;
 const sg=X.createLinearGradient(0,wy,0,wy+wh);sg.addColorStop(0,'#86cfff');sg.addColorStop(1,'#eaf8ff');X.fillStyle=sg;X.fillRect(wx,wy,ww,wh);
 X.fillStyle='#93d46e';ell(wx+18,wy+wh+4,42,26);X.fill();X.fillStyle='#6cbf4f';ell(wx+70,wy+wh+8,38,24);X.fill();
 X.fillStyle='#fff';circ(wx+56,wy+28,7);X.fill();circ(wx+65,wy+25,9);X.fill();circ(wx+74,wy+29,6);X.fill();
 X.fillStyle='rgba(255,255,255,.35)';X.beginPath();X.moveTo(wx+44,wy+wh-8);X.lineTo(wx+62,wy+54);X.lineTo(wx+70,wy+54);X.lineTo(wx+52,wy+wh-8);X.fill();
 X.lineWidth=7;X.strokeStyle='#fffaf0';X.strokeRect(wx,wy,ww,wh);X.fillStyle='#fffaf0';X.fillRect(wx+ww/2-3,wy,6,wh);X.fillRect(wx,wy+wh/2-3,ww,6);
 X.lineWidth=2.5;X.strokeStyle=OUT;rr(wx-3.5,wy-3.5,ww+7,wh+7,5);X.stroke();X.lineWidth=1.5;X.strokeRect(wx+3.5,wy+3.5,ww/2-6.5,wh/2-6.5);X.strokeRect(wx+ww/2+3,wy+3.5,ww/2-6.5,wh/2-6.5);X.strokeRect(wx+3.5,wy+wh/2+3,ww/2-6.5,wh/2-6.5);X.strokeRect(wx+ww/2+3,wy+wh/2+3,ww/2-6.5,wh/2-6.5);
 // sill, plant, bubble-saurus bottle
 const sy=wy+wh+3.5;
 X.fillStyle='#4e9d3a';[[-.5,-16,5,12],[.35,-18,5,13],[0,-22,4.5,12],[-1,-10,4,10],[1,-11,4,10]].forEach(([r,dy,a,b])=>{X.save();X.translate(wx+18,sy-12+dy*.6);X.rotate(r);ell(0,dy*.5,a,b);ink('#5fb646',1.6);X.restore();});
 X.beginPath();X.moveTo(wx+7,sy-14);X.lineTo(wx+29,sy-14);X.lineTo(wx+26,sy);X.lineTo(wx+10,sy);X.closePath();ink('#e2793c',2);
 rr(wx+58,sy-30,18,30,5);ink('#9b55d6',2);rr(wx+62,sy-36,10,7,2);ink('#6b2fa6',1.8);rr(wx+60,sy-22,14,12,2);X.fillStyle='#fff';X.fill();X.fillStyle='#3a9c3a';ell(wx+67,sy-16,4,2.6);X.fill();circ(wx+70.5,sy-18.5,1.8);X.fill();
 rr(wx-8,sy,ww+16,9,3);ink('#fffaf0',2.5);
 // kids' drawings taped to the tiles
 kidDrawing(296,OY+DY+68,54,58,-.07,'NOAH','#e5533d','#2b1a12','#2e9a4a');
 kidDrawing(312,OY+DY+130,52,54,.08,'MAX','#3d7be5','#e07a2c','#7a3fc0');
 if(OY>=70){rr(286,OY+46,90,7,3);ink('#fffaf0',2.2);rr(296,OY+14,16,32,5);ink('#ff6f8a',2);rr(300,OY+8,8,7,2);ink('#d94a66',1.6);rr(318,OY+22,14,24,4);ink('#4fc3a1',2);
  X.save();X.translate(352,OY+36);ell(0,2,11,8);ink('#ffd23f',2);circ(6,-7,6);ink('#ffd23f',2);X.fillStyle='#ff9a1a';ell(12,-6,4,2);X.fill();X.fillStyle=OUT;circ(7.5,-8.5,1.2);X.fill();X.restore();}
 // baseboard + floor + bath mat
 X.fillStyle='#f4ead8';X.fillRect(0,floorY-6,W,9);X.fillStyle=OUT;X.fillRect(0,floorY-7,W,1.6);X.fillRect(0,floorY+3,W,1.6);
 let y=floorY+4,r=0;while(y<HS){const h=14+r*6,tw=40+r*8;for(let i=0,x=W/2-tw*Math.ceil(W/2/tw+1);x<W;i++,x+=tw){X.fillStyle=(i+r)%2?'#5aaee6':'#83c7f2';X.fillRect(x,y,tw,h);}X.fillStyle='rgba(20,70,130,.35)';X.fillRect(0,y+h-1.5,W,1.5);y+=h;r++;}
 X.fillStyle='rgba(0,30,70,.28)';ell(CX,OY+602,196,22);X.fill();
 if(HS>OY+612){const my=OY+586,mh=Math.min(58,HS-my-10);if(mh>18){
  X.strokeStyle='#f3f0e2';X.lineWidth=1.6;X.lineCap='round';for(let x=104;x<=276;x+=6){X.beginPath();X.moveTo(x,my+mh);X.lineTo(x+(x%12?1:-1),my+mh+6);X.stroke();}
  rr(100,my,180,mh,16);ink('#9fcf6a',2.5);rr(108,my+6,164,mh-12,11);X.lineWidth=2;X.setLineDash([5,4]);X.strokeStyle='rgba(255,255,255,.55)';X.stroke();X.setLineDash([]);}}
 X=main;wallCache={c,k,hs:HS,oy:OY};}
function backdrop(){if(!wallCache||wallCache.k!==KS*DPR||wallCache.hs!==HS||wallCache.oy!==OY)buildWall();
 X.drawImage(wallCache.c,0,0,W,HS);
 const sx=36,sy=OY+DY+94;X.save();X.beginPath();X.rect(19.5,OY+DY+73.5,33,44);X.clip();
 X.strokeStyle='#ffc21a';X.lineWidth=2.5;X.lineCap='round';for(let i=0;i<10;i++){const a=i*.628+wave*.006;X.beginPath();X.moveTo(sx+Math.cos(a)*13,sy+Math.sin(a)*13);X.lineTo(sx+Math.cos(a)*18,sy+Math.sin(a)*18);X.stroke();}
 circ(sx,sy,10);X.fillStyle='#ffe23a';X.fill();X.strokeStyle='#e0a400';X.lineWidth=1.5;X.stroke();
 X.fillStyle=OUT;circ(sx-3.5,sy-2,1.4);X.fill();circ(sx+3.5,sy-2,1.4);X.fill();X.strokeStyle=OUT;X.lineWidth=1.4;X.beginPath();X.arc(sx,sy+1,4,.3,2.84);X.stroke();X.restore();
 const span=OY+200;for(let i=0;i<8;i++){const sp=.12+(i%3)*.05,y=span-((wave*sp+i*97)%(span+30)),x=40+((i*83)%300)+Math.sin(wave*.02+i)*12,r=4+(i%4)*2.5;
  X.save();X.globalAlpha=.55;X.strokeStyle='#fff';X.lineWidth=1.2;circ(x,y,r);X.stroke();X.globalAlpha=.18;X.fillStyle=i%2?'#ffd1f0':'#c9f2ff';X.fill();X.globalAlpha=.85;X.fillStyle='#fff';circ(x-r*.35,y-r*.35,r*.25);X.fill();X.restore();}}

// ── TUB: glossy porcelain basin with a front apron, claw feet and drips ──
const TUB_O=[[22,184],[358,184],[376,560],[4,560]],TUB_I=[[38,199],[342,199],[360,546],[20,546]];
function tub(){
 for(const fx of[44,336]){X.save();X.translate(fx,596);ell(0,0,15,9);ink('#e8b23a',2.5);X.fillStyle='rgba(255,255,255,.5)';ell(-4,-3,5,2);X.fill();X.restore();}
 X.beginPath();X.moveTo(8,540);X.lineTo(372,540);X.quadraticCurveTo(372,594,336,596);X.lineTo(44,596);X.quadraticCurveTo(8,594,8,540);X.closePath();
 const ag=X.createLinearGradient(0,540,0,596);ag.addColorStop(0,'#f6efe4');ag.addColorStop(1,'#cbbca9');X.fillStyle=ag;X.fill();
 const sh=X.createLinearGradient(8,0,372,0);sh.addColorStop(0,'rgba(120,95,70,.28)');sh.addColorStop(.3,'rgba(255,255,255,.15)');sh.addColorStop(.75,'rgba(120,95,70,0)');sh.addColorStop(1,'rgba(120,95,70,.3)');X.fillStyle=sh;X.fill();
 X.lineWidth=3.5;X.strokeStyle=OUT;X.stroke();
 for(let i=0;i<6;i++){const dx=40+i*61+(i%2)*14,ph=((wave*.006)+i*.37)%1,dy=560+ph*30;X.save();X.globalAlpha=1-ph;X.fillStyle='#bfe9ff';X.beginPath();X.moveTo(dx,dy-6);X.quadraticCurveTo(dx+3.5,dy,dx,dy+3);X.quadraticCurveTo(dx-3.5,dy,dx,dy-6);X.fill();X.restore();
  X.fillStyle='rgba(191,233,255,.8)';rr(dx-1.6,556,3.2,6+(i%3)*4,2);X.fill();}
 rpoly(TUB_O,30);const og=X.createLinearGradient(0,184,0,560);og.addColorStop(0,'#fffdf8');og.addColorStop(1,'#efe5d6');X.fillStyle=og;X.fill();X.lineWidth=4;X.strokeStyle=OUT;X.stroke();
 X.save();rpoly(TUB_O,30);X.clip();X.strokeStyle='rgba(255,255,255,.95)';X.lineWidth=3;rpoly([[27,189],[353,189],[371,555],[9,555]],26);X.stroke();X.restore();
 rpoly(TUB_I,22);const ig=X.createLinearGradient(0,199,0,290);ig.addColorStop(0,'#c4b5a1');ig.addColorStop(1,'#eae1d3');X.fillStyle=ig;X.fill();X.lineWidth=2.5;X.strokeStyle='#8f7f6c';X.stroke();
 // chrome faucet on the back rim
 X.save();X.translate(300,186);rr(-18,-7,36,13,6);const cg=X.createLinearGradient(0,-7,0,6);cg.addColorStop(0,'#ffffff');cg.addColorStop(.5,'#b9c3cf');cg.addColorStop(1,'#7d8896');X.fillStyle=cg;X.fill();X.lineWidth=2.2;X.strokeStyle=OUT;X.stroke();
 rr(-5,0,10,16,4);X.fillStyle=cg;X.fill();X.stroke();for(const s of[-1,1]){circ(s*24,-2,6);X.fillStyle=s<0?'#ff8a80':'#8ecbff';X.fill();X.stroke();}
 const dp=(wave*.02)%1;X.fillStyle='#bfe9ff';circ(0,18+dp*40,2.4);X.fill();X.restore();}

// ── WATER: deep gradient, caustics, foam (no more blue film over everything) ──
function water(){X.save();rpoly(TUB_I,22);X.clip();const top=246;
 const wg=X.createLinearGradient(0,top,0,548);wg.addColorStop(0,'#94ddff');wg.addColorStop(.35,'#52b8f3');wg.addColorStop(1,'#2a84d6');X.fillStyle=wg;
 X.beginPath();X.moveTo(10,top);for(let x=10;x<=W-10;x+=5)X.lineTo(x,top+Math.sin((x+wave)*.088)*3.5+Math.sin((x-wave*.8)*.12)*2);X.lineTo(W-10,560);X.lineTo(10,560);X.closePath();X.fill();
 X.strokeStyle='rgba(255,255,255,.16)';X.lineWidth=2;for(let i=0;i<8;i++){const y0=284+i*32;X.beginPath();for(let x=12;x<=W-12;x+=10){const yy=y0+Math.sin(x*.05+wave*.03+i)*6+Math.sin(x*.11-wave*.02)*3;x===12?X.moveTo(x,yy):X.lineTo(x,yy);}X.stroke();}
 const eg=X.createLinearGradient(10,0,W-10,0);eg.addColorStop(0,'rgba(10,60,140,.28)');eg.addColorStop(.14,'rgba(10,60,140,0)');eg.addColorStop(.86,'rgba(10,60,140,0)');eg.addColorStop(1,'rgba(10,60,140,.28)');X.fillStyle=eg;X.fillRect(10,top,W-20,320);
 for(let i=0;i<27;i++){const x=22+i*13,y=top+3+Math.sin(i*1.7)*2+Math.sin(wave*.05+i)*1.4,r=4+((i*7)%5);X.fillStyle='rgba(255,255,255,.92)';circ(x,y,r);X.fill();X.fillStyle='rgba(150,200,235,.5)';circ(x+r*.25,y+r*.35,r*.55);X.fill();}
 for(let y=272;y<540;y+=24){const f=(y-199)/347;for(const side of[-1,1]){const x=side<0?(38+(20-38)*f+7):(342+(360-342)*f-7);const r=4+((y*3)%4)+Math.sin(wave*.05+y)*.8;X.fillStyle='rgba(255,255,255,.85)';circ(x,y,r);X.fill();circ(x-side*6,y+6,r*.6);X.fill();}}
 X.restore();}

// ── VOLCANO: squat rocky cone, crater ON TOP (= the physics target), lava streams ──
const VB=270;
function coneHalf(v){const r=craterR*1.15+6;return r+(118-r)*Math.pow(v,1.7)+Math.sin(v*23)*1.4*v;}
function conePath(){const top=CY+3,N=16;X.beginPath();X.moveTo(CX-coneHalf(0),top);
 for(let i=1;i<=N;i++){const v=i/N;X.lineTo(CX-coneHalf(v),top+v*(VB-top));}
 X.quadraticCurveTo(CX,VB+18,CX+coneHalf(1),VB);
 for(let i=N-1;i>=0;i--){const v=i/N;X.lineTo(CX+coneHalf(v),top+v*(VB-top));}X.closePath();}
function lookTarget(){let t=charging?charging.o:objs.find(o=>o.st==='fly');
 if(!t)return{x:Math.sin(wave*.02)*2,y:1.5};const dx=t.x-CX,dy=t.y-(CY+30),d=Math.hypot(dx,dy)||1;return{x:dx/d*3.6,y:dy/d*3.6};}
function volcano(){const fp=collected/Math.max(need,1),pl=Math.sin(volP)*.5+.5,top=CY+3,hh=VB-top,er=(state==='erupt'||state==='win');
 X.save();const gr=craterR*(3+fp*1.6);X.globalAlpha=Math.min(1,.25+pl*.12+fp*.35);const rg=X.createRadialGradient(CX,CY,0,CX,CY,gr);rg.addColorStop(0,fp>.6?'#ff4a10':'#ffa020');rg.addColorStop(1,'rgba(255,60,0,0)');X.fillStyle=rg;circ(CX,CY,gr);X.fill();X.restore();
 conePath();const vg=X.createLinearGradient(CX-118,0,CX+118,0);vg.addColorStop(0,'#8a766d');vg.addColorStop(.38,'#5f4d45');vg.addColorStop(.7,'#3e312b');vg.addColorStop(1,'#251c18');X.fillStyle=vg;X.fill();
 X.save();conePath();X.clip();
 const tg=X.createLinearGradient(0,top,0,top+56);tg.addColorStop(0,'rgba(255,120,30,'+(.28+fp*.35).toFixed(2)+')');tg.addColorStop(1,'rgba(255,120,30,0)');X.fillStyle=tg;X.fillRect(CX-130,top,260,56);
 if(!rocks){seed=3;rocks=[];for(let i=0;i<48;i++)rocks.push({u:rnd()*2-1,v:.06+rnd()*.92,s:2+rnd()*4.5,l:rnd()<.45,rot:rnd()*3});}
 rocks.forEach(k=>{const x=CX+k.u*coneHalf(k.v)*.93,y=top+k.v*hh;X.fillStyle=k.l?'rgba(170,148,134,.45)':'rgba(20,14,12,.45)';ell(x,y,k.s*1.3,k.s*.8,k.rot);X.fill();});
 X.strokeStyle='rgba(20,14,12,.35)';X.lineWidth=2;[-.78,-.45,.42,.74].forEach(u=>{X.beginPath();X.moveTo(CX+u*coneHalf(.04),top+3);X.quadraticCurveTo(CX+u*coneHalf(.5)*1.02,top+hh*.5,CX+u*coneHalf(.96),top+hh*.96);X.stroke();});
 [[-.9,.95],[-.66,.72],[.7,.88],[.9,.6]].forEach(([u,m],i)=>{const len=Math.min(1,(.2+fp*.72+(er?.5:0))*m+Math.sin(volP*1.3+i)*.03),pts=[];
  for(let s=0;s<=12;s++){const v=s/12*len;pts.push([CX+u*coneHalf(v)*.9+Math.sin(v*9+i*2)*3.5,top+v*hh]);}
  X.lineCap='round';X.lineJoin='round';[[10,'rgba(255,90,0,.30)'],[6.5,'#d8320a'],[4,'#ff8a10'],[1.6,'#ffe45c']].forEach(([w,c])=>{X.strokeStyle=c;X.lineWidth=w;X.beginPath();pts.forEach((p,j)=>j?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));X.stroke();});
  const tp=pts[pts.length-1];X.fillStyle='#ff6a00';circ(tp[0],tp[1]+1.5,3.8);X.fill();X.fillStyle='#ffe45c';circ(tp[0]-.8,tp[1]+.6,1.4);X.fill();});
 X.restore();
 conePath();X.lineWidth=3.5;X.strokeStyle=OUT;X.lineJoin='round';X.stroke();
 // crater
 const cr=craterR+4,cry=cr*.38;
 ell(CX,CY,cr+7,cry+4.5);ink('#76625a',3);
 const cg=X.createRadialGradient(CX,CY-1,1,CX,CY,cr);cg.addColorStop(0,'#fff3a0');cg.addColorStop(.35,fp>.5?'#ffcf2e':'#ff9a1a');cg.addColorStop(.8,fp>.5?'#ff4a0a':'#c2300a');cg.addColorStop(1,'#5a1204');ell(CX,CY,cr,cry);X.fillStyle=cg;X.fill();
 X.save();ell(CX,CY,cr,cry);X.clip();X.fillStyle='rgba(60,20,8,.55)';ell(CX,CY-cry*.95,cr*1.05,cry*.7);X.fill();
 for(let i=0;i<3;i++){const ph=(volP*.8+i*.33)%1,bx=CX+(i-1)*cr*.45,by=CY+cry*.2;X.globalAlpha=1-ph;X.strokeStyle='#fff6b0';X.lineWidth=1.3;ell(bx,by,2+ph*4,1+ph*1.6);X.stroke();}X.restore();
 X.strokeStyle='rgba(255,190,120,.6)';X.lineWidth=2;X.beginPath();X.ellipse(CX,CY,cr+3.5,cry+2.2,0,.3,2.84);X.stroke();
 if(state==='play'){X.save();X.globalAlpha=.3+pl*.25;X.strokeStyle='#ffe27a';X.lineWidth=1.6;X.setLineDash([4,5]);X.lineDashOffset=-wave*.3;ell(CX,CY,cr+13,cry+8);X.stroke();X.restore();}
 // face — the eyes follow whatever toy you're aiming
 const ey=CY+31,lk=lookTarget();
 for(const s of[-1,1]){const ex=CX+s*16;ell(ex,ey,9.5,11);ink('#fff',2.5);X.fillStyle=OUT;circ(ex+lk.x,ey+lk.y,4.8);X.fill();X.fillStyle='#fff';circ(ex+lk.x+1.6,ey+lk.y-1.8,1.6);X.fill();}
 X.strokeStyle=OUT;X.lineWidth=3;X.lineCap='round';for(const s of[-1,1]){const ex=CX+s*16;X.beginPath();if(fp>.6||er){X.moveTo(ex+s*8,ey-13);X.lineTo(ex-s*5,ey-18);}else{X.moveTo(ex-7,ey-16);X.quadraticCurveTo(ex,ey-20,ex+7,ey-16);}X.stroke();}
 const my=CY+52;
 if(er||fp>=.99){ell(CX,my+2,11,9.5);ink('#7a1206',2.5);X.fillStyle='#ff6f61';ell(CX,my+7,6.5,3.2);X.fill();}
 else if(fp>.5){X.beginPath();X.arc(CX,my-3,11,0,Math.PI);X.closePath();ink('#7a1206',2.5);X.fillStyle='#fff';X.fillRect(CX-7.5,my-2,15,3.5);}
 else{X.beginPath();X.moveTo(CX-11,my-4);X.quadraticCurveTo(CX,my+7,CX+11,my-4);X.strokeStyle=OUT;X.lineWidth=3;X.stroke();}
 X.fillStyle='rgba(255,110,80,.35)';ell(CX-29,my-8,6,3.5);X.fill();ell(CX+29,my-8,6,3.5);X.fill();
 // foam where the cone meets the water
 for(let i=0;i<24;i++){const x=CX-122+i*(244/23),q=(x-CX)/122,y=VB+9*(1-q*q)+Math.sin(i*1.9)*1.6+Math.sin(wave*.06+i)*1.4,r=5+((i*5)%4);X.fillStyle='rgba(255,255,255,.94)';circ(x,y,r);X.fill();X.fillStyle='rgba(150,205,240,.55)';circ(x+r*.3,y+r*.35,r*.5);X.fill();}
 if(state!=='menu'){const full=fp>=.99;rr(CX-24,VB-30,48,20,10);ink(full?'#ff5a3a':'#fff6e0',2.5);label(full?'FULL!':(collected+'/'+need),CX,VB-19.5,12.5,full?'#fff':OUT);}
 const steamN=fp>.5?5:3;if(state==='play'||state==='menu')for(let i=0;i<steamN;i++){const ag=(wave*.7+i*28)%80,p=ag/80;X.save();X.globalAlpha=(1-p)*.42;X.fillStyle=fp>.6?'#ffb08a':'#fff4e0';circ(CX+(i-2)*9+Math.sin(p*5)*5,CY-10-p*(34+fp*20),4+p*9);X.fill();X.restore();}}

// ── HAIRBALL (unchanged look, warm outline) ──
function drawHairball(x,y,r,sq){const s1=1+sq*.3,s2=1-sq*.2;X.save();X.translate(x,y);X.scale(s1,s2);
 X.strokeStyle='#6b4423';X.lineWidth=2.5;X.lineCap='round';for(let i=0;i<16;i++){const a=i/16*TAU+wave*.02,r2=r+5+Math.sin(wave*.18+i)*3;X.beginPath();X.moveTo(Math.cos(a)*(r-3),Math.sin(a)*(r-3));X.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);X.stroke();}
 circ(0,0,r);ink('#8a5a2a',2.5);X.strokeStyle='#6b4423';X.lineWidth=1.4;for(let i=0;i<5;i++){X.beginPath();X.arc(2,-2,r-5-i*2,.6,2.4);X.stroke();}
 [[-5,-3],[5,-3]].forEach(([ex,ey])=>{circ(ex,ey,4.5);ink('#fff',1.4);X.fillStyle=OUT;circ(ex+1,ey,2.2);X.fill();});
 X.strokeStyle=OUT;X.lineWidth=1.8;X.beginPath();X.arc(0,4,4,.1,3.04);X.stroke();X.restore();}
function drawRings(){rings.forEach(r=>{X.save();X.globalAlpha=Math.max(0,r.life)*(r.big?.6:.55);X.strokeStyle=r.big?'#ffffff':'#dff4ff';X.lineWidth=r.big?6:2;ell(r.x,r.y,r.r,r.r*(r.big?.55:.4));X.stroke();X.restore();});}

// ── TOYS: sit IN the water (ripple, shadow, lapping wave) with a soft "grab me" glow ──
function floatFX(x,y,ph){X.save();X.globalAlpha=.22;X.fillStyle='#0b4f9a';ell(x,y+14,19,5);X.fill();
 const p=(wave*.01+ph)%1;X.globalAlpha=(1-p)*.6;X.strokeStyle='#eafaff';X.lineWidth=1.6;ell(x,y+13,16+p*16,4+p*4);X.stroke();X.restore();}
function lap(x,y){X.save();X.globalAlpha=.6;X.fillStyle='#86d4fb';X.beginPath();X.ellipse(x,y+12,17,4.5,0,0,Math.PI);X.fill();X.globalAlpha=.9;X.fillStyle='#fff';circ(x-12,y+12.5,2.2);X.fill();circ(x+11,y+13,1.8);X.fill();X.restore();}
function drawObjs(){objs.forEach(o=>{if(o.st==='gone')return;const fly=o.st==='fly',held=(charging&&charging.o===o)||(pendingLaunch&&pendingLaunch.o===o),by=o.y+((fly||held)?0:Math.sin(wave*.045+o.bob)*3.2);
 const canGrab=o.st==='float'&&!charging&&!pendingLaunch&&swingT<=0;
 if(!fly)floatFX(o.x,by,o.bob);
 if(canGrab){const pu=.5+Math.sin(wave*.08+o.bob)*.5;X.save();X.globalAlpha=.35+pu*.3;const gg=X.createRadialGradient(o.x,by,12,o.x,by,31);gg.addColorStop(0,'rgba(255,245,170,0)');gg.addColorStop(.75,o.hb?'rgba(255,200,40,.9)':'rgba(255,248,190,.9)');gg.addColorStop(1,'rgba(255,245,170,0)');X.fillStyle=gg;circ(o.x,by,31);X.fill();
  X.globalAlpha=.5+pu*.35;X.strokeStyle='#fff';X.lineWidth=2;circ(o.x,by,26);X.stroke();X.restore();}
 if(o.hb){drawHairball(o.x,by,o.r,o.sq||0);if(canGrab){label('BONUS! +5s',o.x,by-34,11.5,'#ffd23f',OUT,3);label(Math.ceil(o.life)+'s',o.x,by+33,10,'#fff',OUT,3);}}
 else{const sq=o.sq||0,s1=1+sq*.4,s2=1-sq*.3;X.save();X.translate(o.x,by);X.rotate(o.rot||0);X.scale(s1,s2);X.shadowColor='rgba(0,0,0,.35)';X.shadowBlur=5;X.shadowOffsetY=2;paintToy(o.em,38);X.restore();if(!fly&&!held)lap(o.x,by);}
 if(o.isNew&&newToyT>0){const pu=(Math.sin(wave*.2)+1)/2;X.save();X.globalAlpha=.55+pu*.45;X.strokeStyle='#ffcc00';X.lineWidth=3;circ(o.x,by,30);X.stroke();label('NEW!',o.x,by-37,12.5,'#ffd23f',OUT,3.5);X.restore();}});}
function menuToys(){BASE.forEach((em,i)=>{const p=[[84,458],[296,468],[236,506]][i],by=p[1]+Math.sin(wave*.045+i*2)*3.2;floatFX(p[0],by,i*.3);X.save();X.translate(p[0],by);X.shadowColor='rgba(0,0,0,.35)';X.shadowBlur=5;X.shadowOffsetY=2;paintToy(em,38);X.restore();lap(p[0],by);});}

// ── KIDS: shared parts so Noah & Max share one style ──
function limb(pts,w){X.lineCap='round';X.lineJoin='round';X.beginPath();pts.forEach((p,i)=>i?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));X.strokeStyle=OUT;X.lineWidth=w+5;X.stroke();X.strokeStyle=SKIN;X.lineWidth=w;X.stroke();
 X.strokeStyle='rgba(255,255,255,.35)';X.lineWidth=w*.3;X.stroke();}
function hand(x,y,r){circ(x,y,r);ink(SKIN,2.5);X.fillStyle='rgba(255,255,255,.4)';circ(x-r*.3,y-r*.35,r*.35);X.fill();}
function bathBody(x,top,w,h,wl,rx){ // ripples + back foam, torso cut at the waterline, front water collar
 for(let i=0;i<2;i++){const ph=(wave*.012+i*.5)%1;X.save();X.globalAlpha=(1-ph)*.5;X.strokeStyle='#e8f8ff';X.lineWidth=2;ell(x,wl+2,rx+4+ph*30,rx*.3+ph*8);X.stroke();X.restore();}
 for(let i=0;i<9;i++){const a=Math.PI+i/8*Math.PI;X.fillStyle='#fff';circ(x+Math.cos(a)*rx,wl+Math.sin(a)*rx*.26,3.5+((i*3)%3));X.fill();}
 X.save();X.beginPath();X.rect(0,0,W,wl);X.clip();rr(x-w/2,top,w,h,18);const tg=X.createLinearGradient(x-w/2,0,x+w/2,0);tg.addColorStop(0,SKIN_L);tg.addColorStop(.6,SKIN);tg.addColorStop(1,SKIN_D);X.fillStyle=tg;X.fill();X.lineWidth=3;X.strokeStyle=OUT;X.stroke();
 X.strokeStyle='rgba(180,100,60,.45)';X.lineWidth=1.5;X.beginPath();X.moveTo(x-10,top+12);X.quadraticCurveTo(x-5,top+16,x,top+13);X.quadraticCurveTo(x+5,top+16,x+10,top+12);X.stroke();X.restore();}
function collar(x,wl,rx){X.beginPath();X.ellipse(x,wl,rx,rx*.27,0,0,Math.PI);X.closePath();X.fillStyle='rgba(122,206,250,.96)';X.fill();
 for(let i=0;i<10;i++){const a=i/9*Math.PI;X.fillStyle='#fff';circ(x+Math.cos(a)*rx,wl+Math.sin(a)*rx*.26,3.2+((i*7)%3)+Math.sin(wave*.09+i)*.5);X.fill();}}
function headBase(x,y,r){rr(x-r*.3,y+r*.65,r*.6,r*.6,5);X.fillStyle=SKIN_D;X.fill();
 for(const e of[-1,1]){ell(x+e*r,y+2,r*.26,r*.34);ink(SKIN,2.5);X.fillStyle=SKIN_D;ell(x+e*r,y+2,r*.11,r*.19);X.fill();}
 circ(x,y,r);const hg=X.createRadialGradient(x-r*.35,y-r*.4,3,x,y,r*1.1);hg.addColorStop(0,SKIN_L);hg.addColorStop(.7,SKIN);hg.addColorStop(1,SKIN_D);X.fillStyle=hg;X.fill();X.lineWidth=3;X.strokeStyle=OUT;X.stroke();}
function hair(x,y,r,col,hi,v){X.beginPath();X.moveTo(x-r-1.5,y+5);const n=11;
 for(let i=0;i<=n;i++){const a=Math.PI*1.02+i/n*Math.PI*.96,rad=r+(i%2?8+((i*v)%4):1.5);X.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad);}
 X.lineTo(x+r+1.5,y+5);X.lineTo(x+r-5,y-7);for(let i=0;i<=6;i++){X.lineTo(x+r-7-i*(2*r-14)/6,y-(i%2?7:13));}X.lineTo(x-r+5,y-7);X.closePath();
 X.fillStyle=col;X.fill();X.lineWidth=2.5;X.strokeStyle=OUT;X.lineJoin='round';X.stroke();
 X.strokeStyle=hi;X.lineWidth=2;X.lineCap='round';for(let i=0;i<4;i++){const a=Math.PI*1.22+i*.3;X.beginPath();X.moveTo(x+Math.cos(a)*(r-5),y+Math.sin(a)*(r-5));X.lineTo(x+Math.cos(a)*(r+3),y+Math.sin(a)*(r+3));X.stroke();}}
function face(x,y,k,mood,freckles){X.save();X.translate(x,y);X.scale(k,k);
 X.fillStyle='rgba(255,120,100,.38)';ell(-17,9,6,4);X.fill();ell(17,9,6,4);X.fill();
 if(freckles){X.fillStyle='rgba(170,80,40,.7)';[[-19,5],[-15,8],[-20,10],[15,8],[19,5],[20,10]].forEach(f=>{circ(f[0],f[1],1.1);X.fill();});}
 if(mood==='laugh'){X.strokeStyle=OUT;X.lineWidth=3;X.lineCap='round';for(const s of[-1,1]){X.beginPath();X.arc(s*10,3,5,Math.PI*1.1,Math.PI*1.9);X.stroke();}}
 else{for(const s of[-1,1]){const ex=s*10;ell(ex,1,6.5,7.5);ink('#fff',2.2);X.fillStyle='#2a160c';circ(ex+(mood==='cheeky'?-s*.5+1.5:0),-1,4);X.fill();X.fillStyle='#fff';circ(ex+1.3,-2.6,1.4);X.fill();}
  X.strokeStyle=OUT;X.lineWidth=2.6;X.lineCap='round';for(const s of[-1,1]){X.beginPath();
   if(mood==='focus'){X.moveTo(s*16,-11);X.lineTo(s*5,-8);}else if(mood==='cheeky'){X.moveTo(s*16,-10+(s>0?-3:1));X.lineTo(s*5,-8+(s>0?1:-3));}else{X.moveTo(s*15,-9);X.quadraticCurveTo(s*10,-13,s*5,-9);}X.stroke();}}
 if(mood==='focus'){X.beginPath();X.moveTo(-7,14);X.quadraticCurveTo(0,16,7,13);X.strokeStyle=OUT;X.lineWidth=2.6;X.stroke();ell(5,16.5,3.6,3);ink('#ff7b8a',1.5);}
 else{const d=mood==='laugh'?29:mood==='cheeky'?21:25;X.beginPath();X.moveTo(-11,10);X.quadraticCurveTo(0,d,11,10);X.closePath();ink('#8c1a0e',2.5);X.save();X.clip();X.fillStyle='#fff';X.fillRect(-11,9,22,4.5);X.fillStyle='#ff7b8a';ell(0,d-6,6,4);X.fill();X.restore();}
 X.restore();}
function nameTag(t,x,y,col){X.font=fnt(900,10.5);const w=X.measureText(t).width+16;rr(x-w/2,y-8,w,16,8);ink('#fff6e0',2);label(t,x,y+.5,10.5,col);}
function maxBlocker(){if(!blk.on)return;const mx=blk.x,hY=blk.y,headY=blk.y+38,wob=Math.sin(wave*.22)*2,wl=headY+42;
 bathBody(mx,headY+12,42,40,wl,32);collar(mx,wl,32);
 limb([[mx-15,headY+18],[mx-19,headY-8],[mx-14,hY+wob]],10);limb([[mx+15,headY+18],[mx+19,headY-8],[mx+14,hY-wob]],10);
 headBase(mx,headY,22);hair(mx,headY,22,'#e07a2c','#ffb066',3);face(mx,headY+1,.82,'cheeky',true);
 hand(mx-14,hY+wob,8.5);hand(mx+14,hY-wob,8.5);nameTag('MAX',mx,wl+20,'#7a3fc0');}
function kid(){const kx=190,base=372,hy=base-44,s=splashSide,er=(state==='erupt'||state==='win'),wl=base+6;
 if(!er)limb([[kx-18*s,base-20],[kx-46*s,base-12]],11);
 bathBody(kx,base-34,50,52,wl,38);collar(kx,wl,38);
 if(!er){hand(kx-46*s,base-12,7.5);const sX=kx+18*s,sY=base-20,ex=sX+s*Math.cos(armAng)*26,ey=sY+Math.sin(armAng)*26,hx=ex+s*Math.cos(armAng+0.5)*22,hy2=ey+Math.sin(armAng+0.5)*22;limb([[sX,sY],[ex,ey],[hx,hy2]],11);hand(hx,hy2,8);}
 headBase(kx,hy,27);hair(kx,hy,27,'#2b1a12','#5d3d29',5);face(kx,hy+2,1,er?'laugh':charging?'focus':'happy');
 if(er){[-1,1].forEach(sg=>limb([[kx+18*sg,base-20],[kx+30*sg,hy+16],[kx+27*sg,hy+4]],11));[-1,1].forEach(sg=>hand(kx+27*sg,hy+4,8));}
 if(state!=='menu')nameTag('NOAH',kx,wl+22,'#1f6fb8');}

// ── AIM GUIDE + HINT ──
function chargeGuide(){if(!charging)return;const o=charging.o,iv=ideal(o),f=charging.c,dr=diff().drift*.012;
 let vx=iv.vx*f,vy=iv.vy*f,tx=o.x,ty=o.y,onTarget=false;const pts=[];
 for(let i=0;i<110;i++){vy+=G;vx+=dr;tx+=vx;ty+=vy;if(catchHit(tx,ty,vy)){onTarget=true;break;}if(ty>556||tx<0||tx>W)break;pts.push({x:tx,y:ty});}
 const col=onTarget?'#3ad17a':(o.hb?'#ffd23f':'#7fe0ff');
 pts.forEach((p,i)=>{if(i%2)return;X.save();X.globalAlpha=Math.max(.25,1-i/110);circ(p.x,p.y,Math.max(2.6,5-i*.025));X.fillStyle=col;X.fill();X.lineWidth=1.4;X.strokeStyle=OUT;X.stroke();X.restore();});
 const frac=Math.min(f/1.4,1);X.lineCap='round';X.strokeStyle='rgba(59,31,14,.45)';X.lineWidth=7;circ(o.x,o.y,30);X.stroke();
 X.strokeStyle=col;X.lineWidth=5;X.beginPath();X.arc(o.x,o.y,30,-1.57,-1.57+TAU*frac);X.stroke();
 label(onTarget?'RELEASE! ✋':'hold…',o.x,o.y-44,13.5,col,OUT,4);
 if(onTarget){X.save();X.strokeStyle='#3ad17a';X.lineWidth=3.5;ell(CX,CY,craterR+14,craterR*.5+8);X.stroke();X.restore();}}
function aimHint(){if(hintT<=0||charging)return;const o=objs.find(o=>o.st==='float'&&!o.hb);if(!o)return;
 const a=(Math.sin(wave*.12)+1)/2,hx=Math.max(96,Math.min(W-96,o.x));X.save();X.globalAlpha=.6+a*.4;
 label('👆 hold a toy to wind up,',hx,o.y+52,12.5,'#fff',OUT,3.5);label('release to splash it in!',hx,o.y+68,12.5,'#fff',OUT,3.5);X.restore();}

// ── PARTICLES / EJECTA ──
function drawParts(){parts.forEach(p=>{X.save();X.globalAlpha=p.life;X.fillStyle=p.col;circ(p.x,p.y,Math.max(.1,p.r*p.life));X.fill();X.restore();});
 eParts.forEach(p=>{X.save();X.globalAlpha=p.life*.85;X.fillStyle=p.col;circ(p.x,p.y,p.r);X.fill();X.globalAlpha=p.life*.5;X.fillStyle='#fff6b0';circ(p.x-p.r*.3,p.y-p.r*.3,p.r*.35);X.fill();X.restore();});}
function drawEjecta(){ejecta.forEach(e=>{if(e.delay>0)return;X.save();X.translate(e.x,e.y);
 const g=X.createRadialGradient(0,0,6,0,0,28);g.addColorStop(0,'rgba(255,170,60,.55)');g.addColorStop(1,'rgba(255,90,0,0)');X.fillStyle=g;circ(0,0,28);X.fill();
 X.rotate(e.rot);X.shadowColor='rgba(0,0,0,.35)';X.shadowBlur=5;paintToy(e.em,40);X.restore();});}

// ── HUD (screen space, under the notch) ──
function roundBtn(x,y,kind){circ(x,y,16);ink('#fff6e0',2.5);X.fillStyle='rgba(255,255,255,.7)';ell(x-4,y-8,7,3,-.3);X.fill();X.fillStyle=OUT;
 if(kind==='pause'){rr(x-6,y-6.5,4.5,13,1.5);X.fill();rr(x+1.5,y-6.5,4.5,13,1.5);X.fill();}
 else if(kind==='play'){X.beginPath();X.moveTo(x-4,y-7);X.lineTo(x+7,y);X.lineTo(x-4,y+7);X.closePath();X.fill();}
 else{X.beginPath();X.moveTo(x-8,y-3.5);X.lineTo(x-4,y-3.5);X.lineTo(x+1,y-8);X.lineTo(x+1,y+8);X.lineTo(x-4,y+3.5);X.lineTo(x-8,y+3.5);X.closePath();X.fill();
  X.lineWidth=2;X.strokeStyle=OUT;X.lineCap='round';if(kind==='mute'){X.beginPath();X.moveTo(x+4,y-4);X.lineTo(x+10,y+4);X.moveTo(x+10,y-4);X.lineTo(x+4,y+4);X.stroke();}
  else{X.beginPath();X.arc(x+2,y,5,-.9,.9);X.stroke();X.beginPath();X.arc(x+2,y,9,-.9,.9);X.stroke();}}}
function drawMute(){roundBtn(W-26,SAFE+24,muted?'mute':'sound');}
function drawPauseBtn(){roundBtn(W-64,SAFE+24,paused?'play':'pause');}
function hud(){const s=SAFE;const hg=X.createLinearGradient(0,0,0,s+84);hg.addColorStop(0,'rgba(6,28,58,.7)');hg.addColorStop(.65,'rgba(6,28,58,.32)');hg.addColorStop(1,'rgba(6,28,58,0)');X.fillStyle=hg;X.fillRect(0,0,W,s+84);
 rr(10,s+9,98,30,15);ink('#fff6e0',2.5);X.font='15px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText('⭐',28,s+24.5);X.textBaseline='alphabetic';label(String(score),68,s+25,17,OUT);
 label('ROUND '+round+'/10',59,s+53,11,'#fff',OUT,3.5);
 if(combo>1)label('🔥 x'+combo,59,s+70,14,'#ffb020',OUT,4);
 const cx=206,tw=118,tx=cx-tw/2+8,ty=s+16,pct=Math.max(0,timeLeft/roundTime),low=timeLeft<8,tc=low?'#ff3a3a':pct>.5?'#3ad17a':'#ffcc00';
 const pulse=low?(1+Math.sin(wave*.5)*.1):1;X.save();X.translate(tx-15,ty+8);X.scale(pulse,pulse);circ(0,0,11);ink(low?'#ff5a5a':'#fff6e0',2.2);X.strokeStyle=OUT;X.lineWidth=2;X.lineCap='round';X.beginPath();X.moveTo(0,0);X.lineTo(0,-6);X.moveTo(0,0);X.lineTo(4,2);X.stroke();X.restore();
 rr(tx,ty,tw,16,8);X.fillStyle='rgba(0,0,0,.35)';X.fill();
 if(pct>0){const pw=Math.max(16,tw*pct);rr(tx,ty,pw,16,8);X.fillStyle=tc;X.fill();X.fillStyle='rgba(255,255,255,.45)';rr(tx+5,ty+3,Math.max(6,pw-10),4,2);X.fill();}
 X.lineWidth=2.5;X.strokeStyle=OUT;rr(tx,ty,tw,16,8);X.stroke();label(String(Math.ceil(timeLeft)),tx+tw/2,ty+8.5,12,'#fff',OUT,3);
 const tot=need,dw=tot*14,ds=cx-dw/2;for(let i=0;i<tot;i++){circ(ds+i*14+7,s+48,5.5);X.fillStyle=i<collected?'#ffcc00':'rgba(255,255,255,.25)';X.fill();X.lineWidth=1.8;X.strokeStyle=OUT;X.stroke();}}
function drawBanner(){if(bannerT<=0)return;X.save();X.globalAlpha=Math.min(1,bannerT/0.5);X.font=fnt(900,14);const w=X.measureText(banner).width+30;
 rr(W/2-w/2,72,w,30,15);ink('#fff6e0',2.5);label(banner,W/2,87.5,14,'#e2360a');X.restore();}

// ── CARDS ──
function panel(cw,ch,cyO,dim){X.fillStyle='rgba(6,20,40,'+(dim==null?.62:dim)+')';X.fillRect(0,0,W,HS);const cx=(W-cw)/2,cy=cyO==null?(HS-ch)/2:cyO;
 X.save();X.shadowColor='rgba(0,0,0,.35)';X.shadowBlur=18;X.shadowOffsetY=6;rr(cx,cy,cw,ch,22);X.fillStyle='#fff8ea';X.fill();X.restore();
 rr(cx,cy,cw,ch,22);X.lineWidth=5;const bg=X.createLinearGradient(cx,cy,cx+cw,cy+ch);bg.addColorStop(0,'#ffb020');bg.addColorStop(1,'#ff5a1a');X.strokeStyle=bg;X.stroke();
 rr(cx-2.5,cy-2.5,cw+5,ch+5,24);X.lineWidth=2.5;X.strokeStyle=OUT;X.stroke();return{cx,cy};}
function button(bx,by,bw,bh,t){rr(bx,by+4,bw,bh,bh/2);X.fillStyle='#9c1f06';X.fill();X.lineWidth=2.5;X.strokeStyle=OUT;X.stroke();
 rr(bx,by,bw,bh,bh/2);const g=X.createLinearGradient(0,by,0,by+bh);g.addColorStop(0,'#ff7a2a');g.addColorStop(1,'#e2360a');X.fillStyle=g;X.fill();X.stroke();
 X.fillStyle='rgba(255,255,255,.35)';rr(bx+12,by+4,bw-24,bh*.3,bh*.15);X.fill();label(t,bx+bw/2,by+bh/2+1,16,'#fff',OUT,4);}
function logo(y){[['EXPLODING',-28,40,0],['VOLCANOS',18,44,1]].forEach(([w,dy,sz,rock])=>{X.font=fnt(900,sz);let x=W/2-X.measureText(w).width/2;
  for(let i=0;i<w.length;i++){const chr=w[i],cw=X.measureText(chr).width,bob=Math.sin(wave*.05+i*.7)*1.5;X.save();X.translate(x+cw/2,y+dy+bob);X.rotate(Math.sin(i*1.7+dy)*.08);
   X.font=fnt(900,sz);X.textAlign='center';X.textBaseline='middle';X.lineJoin='round';X.lineWidth=10;X.strokeStyle=OUT;X.strokeText(chr,0,0);
   const g=X.createLinearGradient(0,-sz/2,0,sz/2);if(rock){X.lineWidth=5;X.strokeStyle='#ff7a10';X.strokeText(chr,0,0);g.addColorStop(0,'#8a7a72');g.addColorStop(.6,'#4a3b35');g.addColorStop(1,'#2a201c');}else{g.addColorStop(0,'#ffe45c');g.addColorStop(.5,'#ff8a10');g.addColorStop(1,'#e2360a');}
   X.fillStyle=g;X.fillText(chr,0,0);X.restore();x+=cw;}});
 label('in the BATHTUB!',W/2,y+56,22,'#5fd0ff',OUT,6);}
function drawCard(t,b,bt,act,menu){const cw=316,ch=226,cyO=menu?HS-ch-Math.max(22,HS*.05):null,{cy}=panel(cw,ch,cyO,menu?.28:.62);
 if(menu)logo(Math.max(SAFE+86,OY+86));
 label(t,W/2,cy+40,22,'#ff6a10',OUT,5);b.split('\n').forEach((l,i)=>label(l,W/2,cy+78+i*21,13.5,'#5a3a24',null,0,700));
 const bw=170,bh=46,bx=(W-bw)/2,by=cy+ch-66;button(bx,by,bw,bh,bt);card={x:bx,y:by,w:bw,h:bh+4,act};}
function drawPauseCard(){const cw=270,ch=184,{cy}=panel(cw,ch);label('Paused',W/2,cy+44,26,'#ff6a10',OUT,5);label('Round '+round+'  ·  Score '+score,W/2,cy+82,13.5,'#5a3a24',null,0,700);
 const bw=170,bh=46,bx=(W-bw)/2,by=cy+ch-68;button(bx,by,bw,bh,'▶  RESUME');card={x:bx,y:by,w:bw,h:bh+4,act:()=>{paused=false;lastNow=performance.now();}};}
function drawIntroCard(){const cw=330,ch=304,{cy}=panel(cw,ch);
 label('Noah’s Bath Toys!',W/2,cy+42,23,'#ff6a10',OUT,5);label('Splash these into the volcano:',W/2,cy+76,13.5,'#5a3a24',null,0,700);
 const toys=currentToys,n=toys.length,gap=80,sx2=W/2-(n-1)*gap/2,ry=cy+140;
 toys.forEach((em,i)=>{const b=Math.sin(wave*.12+i*1.2)*6,x=sx2+i*gap;X.fillStyle='rgba(95,190,240,.28)';ell(x,ry+34,26,7);X.fill();X.save();X.translate(x,ry+b);X.shadowColor='rgba(0,0,0,.22)';X.shadowBlur=6;X.shadowOffsetY=3;paintToy(em,60);X.restore();});
 label('a new toy joins every round!',W/2,cy+206,12.5,'#9a7a5a',null,0,800);
 const bw=230,bh=48,bx=(W-bw)/2,by=cy+ch-72;button(bx,by,bw,bh,'START SPLASHING →');
 card={x:bx,y:by,w:bw,h:bh+4,act:()=>{startRound(false);state='play';lastNow=performance.now();}};}
function drawNewToyCard(){const cw=326,ch=352,{cx,cy}=panel(cw,ch);
 for(let i=0;i<5;i++){X.fillStyle=['#ffcc00','#ff8a1a','#3ec6ff','#ff5577','#7ad17a'][i];circ(cx+32+i*65,cy+20+Math.sin(wave*.1+i)*4,3.5);X.fill();}
 label('✨ NEW TOY! ✨',W/2,cy+48,24,'#ffb020',OUT,5);
 const by=cy+122+Math.sin(wave*.13)*8;X.fillStyle='rgba(95,190,240,.28)';ell(W/2,cy+162,34,8);X.fill();X.save();X.translate(W/2,by);X.shadowColor='rgba(0,0,0,.25)';X.shadowBlur=8;X.shadowOffsetY=3;paintToy(newToyEm,76);X.restore();
 label(TOYNAME[newToyEm]||'New Toy',W/2,cy+184,21,OUT);label('splashes into the tub for round '+round+'!',W/2,cy+207,13,'#7a5a3e',null,0,700);
 const n=currentToys.length,gap=Math.min(30,(cw-44)/n),sx2=W/2-(n-1)*gap/2,ry=cy+240;
 currentToys.forEach((em,i)=>{if(i===n-1){const pu=(Math.sin(wave*.2)+1)/2;X.save();X.globalAlpha=.4+pu*.4;X.fillStyle='#ffcc00';circ(sx2+i*gap,ry,15);X.fill();X.restore();}X.save();X.translate(sx2+i*gap,ry);paintToy(em,26);X.restore();});
 label('your toy collection ('+n+')',W/2,cy+266,11.5,'#9a7a5a',null,0,800);
 const bw=190,bh=46,bx=(W-bw)/2,bby=cy+ch-62;button(bx,bby,bw,bh,'SPLASH ON →');
 card={x:bx,y:bby,w:bw,h:bh+4,act:()=>{startRound(true);state='play';lastNow=performance.now();}};}
function overlay(){if(paused){drawPauseCard();return;}
 if(state==='menu')drawCard('How to Play','Noah splashes toys into the volcano!\nHold a toy to wind up, release to splash.\nEach round adds a new toy!','START',()=>startGame(),true);
 else if(state==='intro')drawIntroCard();
 else if(state==='newtoy')drawNewToyCard();
 else if(state==='win')drawCard('🏆 You Win!','All 10 rounds cleared!\nScore: '+score+'   Best combo: x'+bestCombo,'PLAY AGAIN',()=>startGame());
 else if(state==='gameover')drawCard('⏰ Time\'s Up!','Out of time on round '+round+'.\nScore: '+score+' — give this round another go!','RETRY ROUND',()=>{startRound(false);state='play';lastNow=performance.now();});else card=null;}

// ── ERUPTION TITLES ──
function bigText(lines,size,fill,lw){lines.forEach(([t,dy])=>{X.font=fnt(900,size);X.textAlign='center';X.textBaseline='middle';X.lineJoin='round';X.lineWidth=lw;X.strokeStyle=OUT;X.strokeText(t,0,dy);X.fillStyle=fill;X.fillText(t,0,dy);});X.textBaseline='alphabetic';}
function eruptFX(){if(state!=='erupt'&&state!=='win')return;if(eruptT>0)eruptT--;
 if(eruptT>122&&eruptT%3===0){for(let k=0;k<2;k++){const a=-1.57+(Math.random()-.5)*.8,s=8+Math.random()*8;eParts.push({x:CX+(Math.random()-.5)*16,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:4+Math.random()*5,col:['#ff5500','#ff8800','#ffcc00'][~~(Math.random()*3)]});}}
 if(eruptT>135){const a=(160-eruptT)/25;X.save();X.globalAlpha=Math.sin(a*3.14)*.4;X.fillStyle='#ff7a00';X.fillRect(0,-OY,W,HS);X.restore();}
 if(state==='erupt'&&eruptT>134){const a=Math.min(1,(160-eruptT)/8),sc=0.6+a*0.5;X.save();X.translate(W/2,H/2-6);X.scale(sc,sc);X.globalAlpha=a;bigText([['THIS IS',-24],['THE END!',22]],40,'#ffd23f',8);X.restore();}
 else if(state==='erupt'&&eruptT>116){const a=(134-eruptT)/9,sc=1+Math.sin(Math.min(1,a)*3.14)*0.3;X.save();X.translate(W/2,H/2-6);X.scale(sc,sc);bigText([['POW! POW!',0]],50,'#ff4400',9);X.restore();}
 else if(state==='erupt'&&eruptT>10){const sc=0.6+Math.min(1,(116-eruptT)/12)*0.4;X.save();X.translate(W/2,124);X.scale(sc,sc);bigText([['EXPLODING VOLCANOS',-16]],30,'#ff8a1a',6);bigText([['in the BATHTUB!',14]],22,'#5fd0ff',6);X.restore();}}

// ── LOOP ──
function loop(now){
 try{
  const dt=Math.min((now-lastNow)/1000||0,.05);lastNow=now;
  X.setTransform(KS*DPR,0,0,KS*DPR,0,0);X.save();if(shake>.3)X.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  if(state==='menu'){wave+=1.1;volP+=.05;}
  else{if(paused){}else if(state==='play')step(dt);else{wave+=1.1;volP+=.05;if(shake>0)shake*=.82;if(flash>0)flash-=.04;if(bannerT>0)bannerT-=dt;armAng+=((idleAng)-armAng)*0.1;rings=rings.filter(r=>r.life>0);rings.forEach(r=>{r.r+=(r.big?8:2.6);r.life-=(r.big?.03:.045);});eParts=eParts.filter(p=>p.life>0);eParts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.2;p.life-=.022;p.r*=.985;});}
   if(!paused)updateEjecta();}
  backdrop();X.save();X.translate(0,OY);
  tub();water();volcano();maxBlocker();if(state==='menu')menuToys();drawObjs();kid();drawRings();aimHint();chargeGuide();drawParts();eruptFX();drawEjecta();drawBanner();
  X.restore();if(state!=='menu')hud();X.restore();
  if(flash>0){X.save();X.globalAlpha=Math.min(1,flash);X.fillStyle=flashCol;X.fillRect(0,0,W,HS);X.restore();}
  overlay();drawMute();if(state==='play'||paused)drawPauseBtn();
 }catch(err){console.error(err);}
 requestAnimationFrame(loop);
}

// ── RESPONSIVE: fill the whole phone screen, crisp at the device pixel ratio ──
function resize(){const vw=window.innerWidth,vh=window.innerHeight;let cw,ch;
 if(vh/vw>=H/W){cw=vw;ch=vh;HS=W*vh/vw;}else{ch=vh;cw=vh*W/H;HS=H;}
 KS=cw/W;DPR=Math.min(window.devicePixelRatio||1,3);OY=Math.round((HS-H)*.62);
 const sp=document.getElementById('safe');SAFE=sp?sp.offsetHeight/KS:0;DY=Math.max(0,Math.round(SAFE+88-(OY+70)));
 const wEl=document.getElementById('w');wEl.style.width=cw+'px';wEl.style.height=ch+'px';wEl.classList.toggle('boxed',HS===H&&cw<vw-4);
 cv.style.width=cw+'px';cv.style.height=ch+'px';cv.width=Math.round(cw*DPR);cv.height=Math.round(ch*DPR);wallCache=null;}
window.addEventListener('resize',resize);resize();
requestAnimationFrame(loop);
