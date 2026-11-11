/* Exploding Volcanos in the Bathtub — "fable-supreme"
   Foundation: the Opus 5.5 repaint (scene, tub, water, cone, kids' proportions).
   Added on top: drawn vector toys, a motion system (easing, squash & stretch, hit-stop),
   living characters, a wordless tutorial, kid-sized touch targets, eased cards and buttons.
   Rules, scoring, difficulty table, round structure and the song are unchanged. */
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
// ── SPRITE ART: drop PNGs into assets/toys/ ; otherwise the drawn vector toys below are used ──
const SPRITE_FILE={'🦆':'duck','⛵':'boat','🦕':'dino','🚚':'monstertruck','🚗':'car','🐙':'octopus','🪣':'pail','🦈':'shark','🐬':'dolphin','🐸':'frog','🦸':'actionfigure','🚀':'rocket'};
const sprites={};
for(const em in SPRITE_FILE){const img=new Image();img.onload=()=>{img._ok=true;};img.onerror=()=>{};img.src='assets/toys/'+SPRITE_FILE[em]+'.png';sprites[em]=img;}
function paintToy(em,size){const img=sprites[em];if(img&&img._ok){X.drawImage(img,-size/2,-size/2,size,size);return;}const c=toyCv[em];if(c){const s=size*1.5;X.drawImage(c,-s/2,-s/2,s,s);}}

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
 objs.forEach((o,i)=>{o.born=NOW+.12+i*.06;});smoke=[];buildOn=false;tutOn=round===1;tutT=0;idleT=0;
 parts=[];eParts=[];rings=[];ejecta=[];collectedToys=[];landed=[];charging=null;pendingLaunch=null;swingT=0;swingHit=false;armAng=idleAng;splashSide=1;
 blk.on=d.blk>0;blk.spd=d.blk;blk.x=110;blk.dir=1;blk.y=292;
 timeLeft=d.time;roundTime=d.time;hbTimer=5+Math.random()*3;hintT=round===1?6:0;
 bannerT=2.6;newToyT=newToyEm?5:0;banner=round===1?'Round 1 — splash away!':('Round '+round+'!');}
function startGame(){round=1;score=0;bestCombo=0;currentToys=[...BASE];newToyEm=null;landed=[];objs=[];ejecta=[];confet=[];collected=0;need=0;combo=0;craterR=DIFF[0].cr;blk.on=false;scoreShown=0;lastScore=0;state='intro';}
function dist(a,b,c,d){return Math.hypot(a-c,b-d);}
function spawnHairball(){const left=Math.random()<.5;objs.push({hb:true,x:left?70:310,y:450,vx:(Math.random()-.5)*.6,vy:0,bob:Math.random()*6.28,st:'float',sq:0,life:8,r:16});}
function waterBurst(x,y,big){const n=big?26:12;for(let i=0;i<n;i++){const a=-1.57+(Math.random()-.5)*(big?2.4:2),s=(big?3:2)+Math.random()*(big?9:5);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(big?4:2),life:1,r:(big?4:3)+Math.random()*(big?7:4),col:['#bfeaff','#8ed8ff','#ffffff','#5bc0f0'][~~(Math.random()*4)]});}rings.push({x,y,r:6,life:1});}

// ── INPUT ──
// v2: sx/sy = screen-space logical coords (HUD, cards); x/y = game-world coords (toys)
function P(e){const r=cv.getBoundingClientRect(),sx=(e.clientX-r.left)/KS,sy=(e.clientY-r.top)/KS;return{sx,sy,x:sx,y:sy-OY};}
function down(e){const wasPlaying=song&&!song.paused;initAudio();const p=P(e);
 if(dist(p.sx,p.sy,W-28,SAFE+28)<25){if(!wasPlaying&&!muted)return;muted=!muted;if(song){if(muted)song.pause();else song.play().catch(()=>{});}return;}
 if((state==='play'||paused)&&dist(p.sx,p.sy,W-74,SAFE+28)<23){paused=!paused;sfxClick();if(!paused){lastNow=performance.now();acc=0;}return;}
 if(paused||state!=='play'){if(card&&card.act&&p.sx>card.x&&p.sx<card.x+card.w&&p.sy>card.y&&p.sy<card.y+card.h)press={key:card.key,act:card.act};return;}
 if(charging||pendingLaunch||swingT>0)return;
 let best=null,bd=74;objs.forEach(o=>{if(o.st!=='float')return;const d=dist(p.x,p.y,o.x,o.y);if(d<bd){bd=d;best=o;}});
 if(best){charging={o:best,c:0.3};hintT=0;splashSide=best.x<190?-1:1;}}
function release(){if(press){const p=press;press=null;pressUntil=NOW+.12;sfxClick();setTimeout(()=>{if(p.key===uiKey)p.act();},90);return;}
 if(!charging)return;pendingLaunch={o:charging.o,f:assist(charging.o,charging.c)};charging=null;swingT=swingDur;swingHit=false;}
function doLaunch(){if(!pendingLaunch)return;const o=pendingLaunch.o,f=pendingLaunch.f,iv=ideal(o);
 o.st='fly';o.vx=iv.vx*f;o.vy=iv.vy*f;o.drift=diff().drift*.012;o.blocked=0;o.rot=0;o.sq=1;
 shake=3;flash=.12;flashCol='#dff4ff';mood(noah,'throw',.45);tutOn=false;const hp=handPos();waterBurst(hp.x,hp.y,true);waterBurst(o.x,o.y,true);sfxSplash();pendingLaunch=null;}
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
   
   if(!(buildOn&&build>.54))timeLeft-=dt;if(timeLeft<=0){timeLeft=0;state='gameover';return;}
   hbTimer-=dt;if(hbTimer<=0&&!objs.some(o=>o.hb&&o.st!=='gone')){spawnHairball();hbTimer=8+Math.random()*4;}
 }
 if(blk.on){blk.x+=blk.spd*blk.dir;if(blk.x>298||blk.x<82)blk.dir*=-1;blk.y=292+Math.sin(wave*.05)*8;}
 const d=diff();
 objs.forEach(o=>{
  if(o.sq>0)o.sq*=.86;
  if(o.hb&&o.st==='float'){o.life-=dt;if(o.life<=0){o.st='gone';pop(o.x,o.y-20,'Gurgle…','#9a7a4a');}}
  const held=(charging&&charging.o===o)||(pendingLaunch&&pendingLaunch.o===o);
  if(o.st==='float'){if(held){}else{o.x+=o.vx;o.y+=Math.sin(wave*.04+o.bob)*.06;
   if(o.x<46||o.x>334)o.vx*=-1;if(Math.abs(o.x-CX)<58)o.vx=(o.x<CX?-1:1)*Math.abs(o.vx);}
  }else if(o.st==='fly'){
   o.vx+=o.drift||0;o.vy+=G;o.x+=o.vx;o.y+=o.vy;o.rot=(o.rot||0)+o.vx*.05;
   if(Math.random()<.4)parts.push({x:o.x+(Math.random()-.5)*14,y:o.y+8,vx:(Math.random()-.5)*.8,vy:.5,life:.7,r:2+Math.random()*2.5,col:'#dff4ff'});
   if(blk.on&&!o.blocked&&dist(o.x,o.y,blk.x,blk.y)<30){o.blocked=1;o.vy=Math.abs(o.vy)*.5+1;o.vx*=-.5;shake=3;pop(blk.x,blk.y-36,'Max got it!','#ffb020');sfxBlock();mood(mxc,'gotcha',1.1);hop(mxc,3.2);mood(noah,'wow',.8);}
   if(catchHit(o.x,o.y,o.vy)){
     if(o.hb){combo++;bestCombo=Math.max(bestCombo,combo);timeLeft+=5;score+=50;shake=4;flash=.18;flashCol='#ffe9b0';collectedToys.push('🧶');freeze=3;vol.sv+=.5;mood(vol,'yuck',1.3);mood(noah,'cheer',1);hop(noah,3);sparkle(CX,CY-6,10);
       pop(CX,CY-18,'Hairball! +50  +5s','#ffd23f');splash(CX,CY,'#8a5a2a',26);sfxHair();o.st='gone';
     }else{collected++;combo++;bestCombo=Math.max(bestCombo,combo);collectedToys.push(o.em);
       const fpN2=collected/need,fpPrev=(collected-1)/need;
       if(fpN2>=.85&&fpPrev<.85)pop(CX,CY-46,'Gonna overflow?!','#ff4400');else if(fpN2>=.6&&fpPrev<.6)pop(CX,CY-46,"It's getting hotter!",'#ff8a1a');else if(fpN2>=.35&&fpPrev<.35)pop(CX,CY-46,"It's getting bigger!",'#ffd23f');
       if(combo===3)pop(190,150,'Look, Daddy, look!','#7fd0ff');
       const mult=Math.min(combo,5),pts=(12+round*2)*mult;score+=pts;shake=4;flash=.14;flashCol='#fff3c4';freeze=3;vol.sv+=.55;mood(vol,'gulp',.75);mood(noah,'cheer',1);hop(noah,3);mood(mxc,'aww',.9);sparkle(CX,CY-6,combo>=3?14:8);
       splash(CX,CY,'#ffcc00',24);waterBurst(CX,CY,false);
       for(let k=0;k<10;k++){const a=-1.57+(Math.random()-.5)*1.4,s=3+Math.random()*5;eParts.push({x:CX,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:3+Math.random()*4,col:'#ff8a1a'});}
       pop(CX,CY-22,'+'+pts+(mult>1?'  x'+mult+'!':''),'#ffd23f');sfxScore();
       o.st='gone';if(collected>=need){buildOn=true;build=0;sfxRise();setTimeout(roundWin,700);}}
   }else if((o.vy>0&&o.y>=448)||o.x<22||o.x>358){
     combo=0;
     if(o.hb){o.st='gone';waterBurst(Math.max(40,Math.min(340,o.x)),456,false);}
     else{o.st='float';o.x=Math.max(58,Math.min(322,o.x));o.y=Math.max(448,Math.min(o.y,486));o.vx=(Math.random()<.5?-1:1)*(0.4+d.drift)*(round>=3?1:.4);o.vy=0;o.blocked=0;
       waterBurst(o.x,o.y-6,false);pop(o.x,o.y-30,'Splash! Try again!','#dff4ff');sfxPlop();mood(noah,'oops',.9);mood(mxc,'laugh',.8);mood(vol,'aww',.9);}
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
function splash(x,y,col,n){for(let i=0;i<n;i++){const a=-1.57+(Math.random()-.5)*2.4,s=2+Math.random()*6;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:1,r:3+Math.random()*5,col});}}
function roundWin(){
 if(round>=10){score+=150+Math.round(timeLeft)*10;state='win';eruptT=160;bigErupt();return;}
 state='erupt';eruptT=160;score+=need*15+combo*5+Math.round(timeLeft)*10;bigErupt();
 
 setTimeout(()=>{round++;newToyEm=NEWBY[round]||null;if(newToyEm)currentToys=[...currentToys,newToyEm];
   if(newToyEm){state='newtoy';sfxFanfare();}else{startRound(true);state='play';lastNow=performance.now();}},3500);
}
function bigErupt(){sfxErupt();shake=12;flash=.42;flashCol='#ffce8a';freeze=7;punch=1;surge=1;buildOn=false;confettiBurst(state==='win'?60:36);mood(noah,'cheer',3.6);mood(mxc,'laugh',3.6);vol.sv+=.9;rings.push({x:CX,y:CY,r:10,life:1,big:true});
 for(let i=0;i<55;i++){const a=-1.57+(Math.random()-.5)*1.9,s=4+Math.random()*12;eParts.push({x:CX,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:4+Math.random()*6,col:['#ff3300','#ff7700','#ffcc00','#ff5500','#ffe066'][~~(Math.random()*5)]});}
 ejecta=collectedToys.map((em,i)=>({em,x:CX+(Math.random()-.5)*20,y:CY-4,vx:(Math.random()-.5)*9,vy:-(7+Math.random()*6),rot:(Math.random()-.5)*.7,rotSpeed:(Math.random()-.5)*.28,alive:true,delay:~~(i*4)}));}


// ══════════════════════════════════════════════════════════════════════════
// ── DRAW (Opus 5.5 repaint, kept as the foundation): storybook scene matched to the cover art ──
//    crisp on Retina (devicePixelRatio), fills the whole phone screen,
//    warm outlined style for wall, tub, water, volcano, Noah & Max together.
// ══════════════════════════════════════════════════════════════════════════
const OUT='#3b1f0e',TAU=6.2832;
const FF='ui-rounded,"SF Pro Rounded","Segoe UI","Helvetica Neue",system-ui,sans-serif';
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
 X.save();X.beginPath();X.rect(wx,wy,ww,wh);X.clip();X.fillStyle='#93d46e';ell(wx+18,wy+wh+4,42,26);X.fill();X.fillStyle='#6cbf4f';ell(wx+70,wy+wh+8,38,24);X.fill();X.restore();
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
 X.beginPath();X.moveTo(10,top);for(let x=10;x<=W-10;x+=5)X.lineTo(x,top+Math.sin((x+wave)*.088)*(3.5+surge*7)+Math.sin((x-wave*.8)*.12)*(2+surge*4));X.lineTo(W-10,560);X.lineTo(10,560);X.closePath();X.fill();
 X.strokeStyle='rgba(255,255,255,.16)';X.lineWidth=2;for(let i=0;i<8;i++){const y0=284+i*32;X.beginPath();for(let x=12;x<=W-12;x+=10){const yy=y0+Math.sin(x*.05+wave*.03+i)*6+Math.sin(x*.11-wave*.02)*3;x===12?X.moveTo(x,yy):X.lineTo(x,yy);}X.stroke();}
 const eg=X.createLinearGradient(10,0,W-10,0);eg.addColorStop(0,'rgba(10,60,140,.28)');eg.addColorStop(.14,'rgba(10,60,140,0)');eg.addColorStop(.86,'rgba(10,60,140,0)');eg.addColorStop(1,'rgba(10,60,140,.28)');X.fillStyle=eg;X.fillRect(10,top,W-20,320);
 for(let i=0;i<27;i++){const x=22+i*13,y=top+3+Math.sin(i*1.7)*2+Math.sin(wave*.05+i)*1.4,r=4+((i*7)%5);X.fillStyle='rgba(255,255,255,.92)';circ(x,y,r);X.fill();X.fillStyle='rgba(150,200,235,.5)';circ(x+r*.25,y+r*.35,r*.55);X.fill();}
 for(let y=272;y<540;y+=24){const f=(y-199)/347;for(const side of[-1,1]){const x=side<0?(38+(20-38)*f+7):(342+(360-342)*f-7);const r=4+((y*3)%4)+Math.sin(wave*.05+y)*.8;X.fillStyle='rgba(255,255,255,.85)';circ(x,y,r);X.fill();circ(x-side*6,y+6,r*.6);X.fill();}}
 X.restore();}

// ── fable-supreme state (declared here so the toy painter and the layer below can share it) ──
const PI=Math.PI,INK=OUT;
let NOW=0,uiT=0,uiKey='',freeze=0,acc=0,punch=0,surge=0,build=0,buildOn=false,SAFEB=0,idleT=0,tutOn=false,tutT=0,wasOn=false,press=null,pressUntil=0;
let pops=[],smoke=[],sparks=[],confet=[],scoreShown=0,scorePop=0,comboPop=0,lastCombo=0,lastScore=0,frameMs=16,slowN=0,QCAP=3;
const noah={mood:'',t:0,hop:0,hv:0,blink:0,nb:2.5,lean:0},mxc={mood:'',t:0,hop:0,hv:0,blink:0,nb:1.7},vol={mood:'',t:0,sq:0,sv:0,blink:0,nb:3.1};

// ── TOYS: all 12 (plus the hairball) drawn as vector art once, cached to small canvases — no emoji ──
function toyKit(g){
 const P=d=>new Path2D(d);
 const C=(x,y,r)=>`M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
 const E=(x,y,a,b)=>`M${x-a} ${y}a${a} ${b} 0 1 0 ${2*a} 0a${a} ${b} 0 1 0 ${-2*a} 0Z`;
 const S=(x,y,R,r)=>{let d='';for(let i=0;i<10;i++){const a=-PI/2+i*PI/5,q=i%2?r:R;d+=(i?'L':'M')+(x+Math.cos(a)*q).toFixed(1)+' '+(y+Math.sin(a)*q).toFixed(1);}return d+'Z';};
 g.lineJoin=g.lineCap='round';
 const blob=(fill,ds,lw)=>{lw=lw||3.5;const ps=ds.map(P);g.strokeStyle=INK;g.lineWidth=lw*2;ps.forEach(p=>g.stroke(p));g.fillStyle=fill;ps.forEach(p=>g.fill(p));};
 const sh=(d,fill,lw,stroke)=>{const p=P(d);if(fill){g.fillStyle=fill;g.fill(p);}if(lw){g.strokeStyle=stroke||INK;g.lineWidth=lw;g.stroke(p);}};
 const line=(d,col,lw,ol)=>{const p=P(d);if(ol){g.strokeStyle=INK;g.lineWidth=lw+ol*2;g.stroke(p);}g.strokeStyle=col;g.lineWidth=lw;g.stroke(p);};
 const eye=(x,y,r)=>{r=r||3.6;sh(C(x,y,r),'#1a0a00');sh(C(x+r*.35,y-r*.38,r*.38),'#fff');};
 const gloss=d=>sh(d,'rgba(255,255,255,.5)');
 return{C,E,S,blob,sh,line,eye,gloss};
}
const TOYS={
'🦆'(k){const{C,E,blob,sh,line,eye,gloss}=k;
 blob('#ffd43b',['M-28 6L-47 -8L-38 18Z',E(-4,17,35,22),C(17,-14,20)]);
 sh('M-24 14Q-8 3 6 16Q-6 31 -22 25Z','#f7b500',2.5,'#b97f00');
 blob('#ff8a1f',['M33 -18Q52 -17 49 -8Q41 -1 32 -6Z'],2.6);line('M36 -10Q42 -10.5 48 -9.5','#b34d00',1.6);
 eye(21,-19,4.6);sh(C(29,-6,4.5),'rgba(255,110,80,.45)');gloss(E(7,-27,7,3.2));gloss(E(-14,2,10,3));},
'⛵'(k){const{blob,sh,line,gloss}=k;
 line('M0 -47L0 14','#8a5a2a',4,2);
 blob('#ffffff',['M6 -42L36 7L6 7Z']);sh('M6 -20L22.5 -15L26 -9.5L6 -12Z','#ff5a4a');sh('M6 -4L29.5 -3.5L33 2L6 3Z','#ff5a4a');
 blob('#ffd43b',['M-5 -30L-5 7L-28 7Z']);
 blob('#ff9a1f',['M0 -48L-15 -43L0 -38Z'],2.5);
 blob('#e9412f',['M-45 13L45 13Q40 39 22 39L-22 39Q-40 39 -45 13Z']);
 sh('M-41 20L41 20L39 26L-39 26Z','#fff');gloss('M-36 15.5L10 15.5L10 17.5L-35.5 17.5Z');},
'🦕'(k){const{C,E,blob,sh,line,eye}=k;
 blob('#35b89c',['M-24 4Q-42 2 -48 -14Q-47 12 -27 22Z',E(-5,13,29,19),'M10 8Q19 -18 21 -30Q23 -45 35 -43Q48 -41 45 -30Q43 -23 34 -23Q32 -6 25 14Z','M-23 22L-23 41L-11 41L-11 26Z','M7 24L7 41L19 41L19 22Z']);
 sh(E(-4,24,19,6.5),'#b6f0cf');
 [[-16,4,4],[-4,0,3.4],[7,6,3],[-22,13,2.6],[24,-12,2.4],[26,-2,2.8]].forEach(s=>sh(C(s[0],s[1],s[2]),'#1f8f86'));
 line('M-23 36L-11 36','#1f8f86',2);line('M7 36L19 36','#1f8f86',2);
 eye(37,-35,3.4);line('M36 -28Q41 -26 44 -30','#0f5a55',2);sh(C(31,-29,3),'rgba(255,120,120,.4)');},
'🚚'(k){const{C,blob,sh,line,gloss}=k;
 blob('#555b66',['M-34 -6L34 -6L30 6L-30 6Z'],3);
 [-22,24].forEach(x=>{blob('#2b2b33',[C(x,18,20)]);line(C(x,18,16.5),'#4a4a55',3);sh(C(x,18,9),'#d5dae2',2.5);sh(C(x,18,3.4),'#7b8490');});
 blob('#43b02a',['M-41 -4L-41 -18Q-41 -22 -37 -22L-14 -22L-6 -39L20 -39Q26 -39 28 -33L32 -22L38 -20Q43 -19 43 -14L43 -4Z']);
 sh('M-9 -22L-3 -34L18 -34L22 -22Z','#c8efff',2.5);gloss('M-4 -24L0 -32L5 -32L1 -24Z');
 sh('M-38 -8Q-26 -18 -13 -10Q-22 -12 -25 -6Q-30 -11 -38 -8Z','#ffd43b');sh('M-36 -8Q-28 -13 -20 -10Q-25 -10 -27 -7Q-31 -9 -36 -8Z','#ff7a1a');
 sh('M36 -16L42 -15L42 -10L36 -10Z','#fff3a0',1.5);},
'🚗'(k){const{C,blob,sh,line,gloss}=k;
 blob('#ef4136',['M-46 18L-46 4Q-46 -2 -38 -4L-27 -6Q-17 -27 -1 -27L11 -27Q24 -27 32 -6L40 -4Q46 -2 46 6L46 18Z']);
 sh('M-19 -6Q-13 -21 -3 -21L-3 -6Z','#c8efff',2.5);sh('M4 -21L11 -21Q20 -21 25 -6L4 -6Z','#c8efff',2.5);
 gloss('M-15 -8Q-12 -16 -8 -18L-6 -8Z');line('M-44 7L44 7','rgba(255,255,255,.75)',3);
 sh('M39 0Q45 1 45 6L39 6Z','#fff3a0',1.5);sh('M-46 2L-41 2L-41 7L-46 7Z','#8f1a10');
 [-24,24].forEach(x=>{blob('#2b2b33',[C(x,20,12.5)],3);sh(C(x,20,5.5),'#d5dae2',2);});},
'🐙'(k){const{C,blob,sh,line,eye}=k;
 ['M-22 6Q-30 30 -45 25','M-12 12Q-16 34 -28 41','M0 14Q-2 32 3 44','M12 12Q16 34 28 41','M22 6Q30 30 45 25'].forEach(d=>line(d,'#c66bf2',9.5,3.2));
 blob('#c66bf2',['M-31 8Q-36 -42 0 -44Q36 -42 31 8Q16 19 0 17Q-16 19 -31 8Z']);
 [[-16,-31,3.4],[-5,-36,2.4],[17,-30,2.8]].forEach(s=>sh(C(s[0],s[1],s[2]),'#e3b0ff'));
 [-11,11].forEach(x=>{sh(C(x,-9,8.6),'#fff',2.5);eye(x+1,-8,4.4);});
 line('M-7 5Q0 11 7 5','#4a1a66',2.6);sh(C(-21,1,4.4),'rgba(255,110,150,.5)');sh(C(21,1,4.4),'rgba(255,110,150,.5)');},
'🪣'(k){const{E,S,blob,sh,line}=k;
 line('M-30 -15Q0 -66 30 -15','#ffd43b',4,2.6);
 blob('#3fa9f5',['M-31 -15L31 -15L23 37Q0 44 -23 37Z']);
 sh('M-25 -6L-20 31','',0);line('M-23 -4L-18.5 30','rgba(255,255,255,.45)',4.5);
 sh(S(2,13,13,5.6),'#ffd43b',2.4);
 blob('#7fd0ff',[E(0,-15,32,8.5)],3);sh(E(0,-14.5,26,5.2),'#1c6fb5');},
'🦈'(k){const{C,blob,sh,line,eye}=k;
 blob('#6e93b8',['M-33 4L-50 -19L-41 4L-50 25Z','M-7 -15L3 -41L17 -15Z','M2 15L-8 35L17 20Z','M-44 4Q-20 -22 14 -19Q40 -15 49 4Q37 23 8 23Q-22 23 -44 4Z']);
 sh('M-34 9Q0 25 46 7Q36 23 8 23Q-18 23 -34 9Z','#eef5fa');
 sh('M22 9L25 14L28.5 10.5L32 15L35.5 10.5L39 14L43 7.5Q32 14 22 9Z','#fff',1.6);
 line('M9 -6Q7 0 9 6','#44668a',2);line('M3 -6Q1 0 3 6','#44668a',2);
 eye(31,-6,3.6);line('M26 -12L35 -10','#2a1a12',2);},
'🐬'(k){const{blob,sh,line,eye}=k;
 blob('#3f9ee6',['M-30 22L-49 30Q-39 37 -30 31Q-26 43 -13 41L-22 22Z','M-6 -24Q-18 -43 -24 -40Q-23 -28 -18 -20Z','M-34 24Q-35 -21 2 -27Q25 -29 35 -15L48 -11Q48 -4 36 -3Q16 7 -4 5Q-22 7 -25 27Z','M7 2Q5 18 -6 23Q-5 11 -3 4Z']);
 sh('M35 -5Q16 6 -4 4.5Q-17 6 -23 17Q-17 -3 4 -4Q20 -4 35 -8Z','#d9f1ff');
 eye(25,-15,3.2);line('M37 -4.5Q31 -5 27 -8.5','#1c5c96',2);sh('M-10 -22Q4 -25 14 -22Q4 -21 -10 -19Z','rgba(255,255,255,.4)');},
'🐸'(k){const{C,E,blob,sh,line,eye}=k;
 blob('#7ed53c',[E(-26,36,14,6),E(26,36,14,6),E(0,15,33,24),C(-17,-17,14),C(17,-17,14),E(0,-2,33,22)]);
 sh(E(0,25,19,11),'#dcf7a6');
 [-17,17].forEach(x=>{sh(C(x,-18,9.6),'#fff',2.5);eye(x+1,-17,5);});
 line('M-21 2Q0 19 21 2','#2f6b12',3);sh(C(-4,-4,1.3),'#2f6b12');sh(C(4,-4,1.3),'#2f6b12');
 sh(C(-25,5,4.5),'rgba(255,120,120,.45)');sh(C(25,5,4.5),'rgba(255,120,120,.45)');},
'🦸'(k){const{C,S,blob,sh,line}=k;
 blob('#e53935',['M-18 -15L-35 37L35 37L18 -15Z']);
 blob('#2f6fe0',['M-14 14L-16 37L-4 37L-2 18Z','M14 14L16 37L4 37L2 18Z']);
 blob('#e53935',['M-17 36L-17 44L-3 44L-4 36Z','M17 36L17 44L3 44L4 36Z'],3);
 line('M-15 -11L-29 -1L-21 9','#2f6fe0',8,3);line('M15 -11L29 -1L21 9','#2f6fe0',8,3);
 blob('#f2b98a',[C(-21,10,4.6),C(21,10,4.6)],2.6);
 blob('#2f6fe0',['M-16 -17L16 -17L13 18L-13 18Z']);
 sh('M-13.6 11L13.6 11L13 18L-13 18Z','#ffd43b',2.2);sh(S(0,-3,8,3.4),'#ffd43b',2);
 blob('#f2b98a',[C(0,-31,14)]);
 sh('M-14 -33Q-13 -49 2 -47Q15 -46 14 -33Q4 -41 -14 -33Z','#4a2a14',2.4);
 sh('M-13.5 -34Q0 -38 13.5 -34L13 -27Q0 -30 -13 -27Z','#1d2b4f');sh(C(-5.5,-31,2.3),'#fff');sh(C(5.5,-31,2.3),'#fff');
 line('M-5 -23Q0 -19 5 -23','#7a2a1a',2);},
'🚀'(k,g){const{C,blob,sh,line,gloss}=k;g.save();g.rotate(.6);
 blob('#ff9a1f',['M-10 25Q-13 41 0 50Q13 41 10 25Z'],3);sh('M-5 25Q-6.5 36 0 42Q6.5 36 5 25Z','#fff27a');
 blob('#e53935',['M-15 0L-33 27L-15 21Z','M15 0L33 27L15 21Z']);
 blob('#f4f6fa',['M0 -47Q21 -24 16 19L-16 19Q-21 -24 0 -47Z']);
 sh('M0 -47Q11 -36 15 -22L-15 -22Q-11 -36 0 -47Z','#e53935',2.6);
 sh('M-16 10L16 10L16 19L-16 19Z','#c9d1dc');line('M-16 10L16 10','#2a1a12',2.2);
 sh(C(0,-6,8.6),'#7fd0ff',3);gloss(C(-2.6,-8.6,2.6));
 line('M-10 -16Q-13 0 -11 8','rgba(255,255,255,.7)',3);
 blob('#e53935',['M-3 6L-3 26L3 26L3 6Z'],2.4);g.restore();},
'🧶'(k){const{C,sh,line,eye}=k;let d='';for(let i=0;i<24;i++){const a=i/24*TAU,r=i%2?40:31;d+=(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(Math.sin(a)*r).toFixed(1);}
 sh(d+'Z','#8a5a2a',5,'#4a2e12');sh(C(0,0,30),'#9a6832');
 line('M-18 -6Q-4 -24 16 -12','#6b4423',2.6);line('M-20 8Q0 -8 20 6','#6b4423',2.6);line('M-12 20Q4 8 18 18','#6b4423',2.6);
 [-10,10].forEach(x=>{sh(C(x,-5,8.5),'#fff',2.4);eye(x+1.5,-4,4.2);});line('M-7 10Q0 16 7 10','#3a2410',3);},
};
const toyCv={},TOYPX=3;

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

// ── KIDS: shared parts (from the Opus repaint) ──
function collar(x,wl,rx){X.beginPath();X.ellipse(x,wl,rx,rx*.27,0,0,Math.PI);X.closePath();X.fillStyle='rgba(122,206,250,.96)';X.fill();
 for(let i=0;i<10;i++){const a=i/9*Math.PI;X.fillStyle='#fff';circ(x+Math.cos(a)*rx,wl+Math.sin(a)*rx*.26,3.2+((i*7)%3)+Math.sin(wave*.09+i)*.5);X.fill();}}

// ══════════════════════════════════════════════════════════════════════════
// ── FABLE-SUPREME LAYER: motion system, living characters, kid-first UX ──
//    Everything above this line is the Opus 5.5 repaint (scene, tub, water)
//    with small hooks; everything below is new.
// ══════════════════════════════════════════════════════════════════════════
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
// easing: nothing in the UI moves linearly
const EZ={out:t=>1-Math.pow(1-clamp(t,0,1),3),in:t=>{t=clamp(t,0,1);return t*t*t;},
 back:t=>{t=clamp(t,0,1);const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);},
 elastic:t=>{t=clamp(t,0,1);return t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-.75)*2.0944)+1;}};
function mood(c,m,d){c.mood=m;c.t=d;}
function hop(c,v){c.hv=-v;}
function sfxClick(){blip(700,.07,'triangle',.14,980);}
function sfxTick(){blip(980,.08,'sine',.16,1320);}
function sfxRise(){blip(90,.7,'sawtooth',.14,300);noise(.7,.16,200,.6,900);}
// input forgiveness: a release within 0.04 charge (~70 ms) of an on-target throw counts as on target
function hitsAt(o,f){const iv=ideal(o),dr=diff().drift*.012;let vx=iv.vx*f,vy=iv.vy*f,x=o.x,y=o.y;for(let i=0;i<110;i++){vy+=G;vx+=dr;x+=vx;y+=vy;if(catchHit(x,y,vy))return true;if(y>556||x<0||x>W)return false;}return false;}
function assist(o,f){if(hitsAt(o,f))return f;for(const d of[.02,-.02,.04,-.04])if(hitsAt(o,f+d))return f+d;return f;}
function pop(x,y,t,c){pops.forEach(p=>{if(p.age<.55&&Math.abs(p.y-y)<21&&Math.abs(p.x-x)<120)y-=23;});pops.push({x,y,t,c,age:0,big:/^\+|Hairball/.test(t)});}
function star(x,y,R,r,rot){X.beginPath();for(let i=0;i<10;i++){const a=(rot||0)-PI/2+i*PI/5,q=i%2?r:R;X.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}X.closePath();}
function sparkle(x,y,n){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=1.5+Math.random()*4.5;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.5,life:1,r:3+Math.random()*4,rot:Math.random()*3,col:['#fff6b0','#ffd23f','#ffffff'][i%3]});}}
function lavaSpit(n,pw){for(let k=0;k<n;k++){const a=-1.57+(Math.random()-.5)*.85,s=(3+Math.random()*4)+pw*(5+Math.random()*5);eParts.push({x:CX+(Math.random()-.5)*16,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:pw<1?.8:1,r:(pw<1?2.5:4)+Math.random()*(pw<1?3:5),col:['#ff5500','#ff8800','#ffcc00'][~~(Math.random()*3)]});}}
function confettiBurst(n){const cols=['#ffd23f','#ff8a10','#5fd0ff','#ff6f8a','#7ad17a','#fff6e0'];for(let i=0;i<n;i++)confet.push({x:CX+(Math.random()-.5)*30,y:CY-10,vx:(Math.random()-.5)*11,vy:-(5+Math.random()*10),rot:Math.random()*6,vr:(Math.random()-.5)*.4,col:cols[i%6],life:1,w:5+Math.random()*4});}
function fxStep(){parts=parts.filter(p=>p.life>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.16;p.life-=.04;});
 rings=rings.filter(r=>r.life>0);rings.forEach(r=>{r.r+=(r.big?8:2.6);r.life-=(r.big?.03:.045);});
 eParts=eParts.filter(p=>p.life>0);eParts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.2;p.life-=.022;p.r*=.985;});}

// one real frame of "life": blinks, moods, springs, counters, soft particles
function tickLife(dt){NOW+=dt;uiT+=dt;
 [noah,mxc,vol].forEach(c=>{if(c.t>0){c.t-=dt;if(c.t<=0)c.mood='';}c.nb-=dt;if(c.nb<=0){c.blink=.13;c.nb=2+Math.random()*3.2;}if(c.blink>0)c.blink-=dt;});
 [noah,mxc].forEach(c=>{c.hv+=-c.hop*.2;c.hv*=.78;c.hop+=c.hv;});
 vol.sv+=-vol.sq*.22;vol.sv*=.8;vol.sq+=vol.sv;
 if(buildOn)build=Math.min(1,build+dt/.7);else if(build>0)build=Math.max(0,build-dt*5);
 if(punch>0)punch=Math.max(0,punch-dt*2.4);if(surge>0)surge=Math.max(0,surge-dt*.4);
 scoreShown+=(score-scoreShown)*.2;if(Math.abs(score-scoreShown)<.6)scoreShown=score;
 if(score!==lastScore){if(score>lastScore)scorePop=1;lastScore=score;}if(scorePop>0)scorePop=Math.max(0,scorePop-dt*3.4);
 if(combo!==lastCombo){if(combo>1)comboPop=1;lastCombo=combo;}if(comboPop>0)comboPop=Math.max(0,comboPop-dt*3);
 pops.forEach(p=>p.age+=dt);pops=pops.filter(p=>p.age<1.05);
 smoke=smoke.filter(p=>p.life>0);smoke.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy*=.985;p.r+=.4;p.life-=.013;});
 sparks=sparks.filter(p=>p.life>0);sparks.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vx*=.94;p.vy=p.vy*.94+.08;p.rot+=.12;p.life-=.03;});
 confet=confet.filter(p=>p.life>0&&p.y<620);confet.forEach(p=>{p.vx*=.975;p.vy=p.vy*.975+.16;p.x+=p.vx+Math.sin(NOW*5+p.rot)*.6;p.y+=p.vy;p.rot+=p.vr;p.life-=.005;});
 if(state==='play'&&!charging&&!pendingLaunch&&swingT<=0)idleT+=dt;else idleT=0;
 if(tutOn)tutT+=dt;}

// ── VOLCANO: the Opus cone, now a character ──
const VB=270;
function coneHalf(v){const r=craterR*1.15+6;return r+(118-r)*Math.pow(v,1.7)+Math.sin(v*23)*1.4*v;}
function conePath(){const top=CY+3,N=16;X.beginPath();X.moveTo(CX-coneHalf(0),top);
 for(let i=1;i<=N;i++){const v=i/N;X.lineTo(CX-coneHalf(v),top+v*(VB-top));}
 X.quadraticCurveTo(CX,VB+18,CX+coneHalf(1),VB);
 for(let i=N-1;i>=0;i--){const v=i/N;X.lineTo(CX+coneHalf(v),top+v*(VB-top));}X.closePath();}
function lookAt(x,y){let t=charging?charging.o:(pendingLaunch?pendingLaunch.o:objs.find(o=>o.st==='fly'));if(!t&&ejecta.length)t=ejecta.find(e=>e.delay<=0);
 if(!t)return[Math.sin(NOW*.7+x)*.5,.25+Math.sin(NOW*.43+x)*.2];const dx=t.x-x,dy=t.y-y,d=Math.hypot(dx,dy)||1;return[dx/d,dy/d];}
function dbl(w){X.lineCap='round';X.lineJoin='round';X.strokeStyle=OUT;X.lineWidth=w+3.2;X.stroke();X.strokeStyle='#fff6e0';X.lineWidth=w;X.stroke();}
function mline(w){X.lineCap='round';X.lineJoin='round';X.save();X.translate(0,1.8);X.strokeStyle='rgba(255,222,196,.6)';X.lineWidth=w;X.stroke();X.restore();X.strokeStyle='#1c0c04';X.lineWidth=w+.4;X.stroke();}
function volFace(fp,er){const ey=CY+31,my=CY+52,lk=lookAt(CX,ey);let m=vol.mood;
 if(er)m=eruptT>64?'erupt':'relief';else if(!m)m=(build>0||fp>=.85)?'burst':fp>.6?'hot':fp>.33?'happy':'calm';
 const shut=m==='erupt'||(m==='gulp'&&vol.t<.5),blink=vol.blink>0&&!shut&&m!=='burst'&&m!=='yuck';
 const ck=m==='burst'?1.5:m==='gulp'?1.25:1;X.fillStyle='rgba(255,110,80,'+(.3+fp*.3).toFixed(2)+')';for(const s of[-1,1]){ell(CX+s*29,my-8,6*ck,3.5*ck);X.fill();}
 if(m==='burst')for(const s of[-1,1]){X.beginPath();X.arc(CX+s*24,my-5,10,s>0?-1.05:PI-1.05,s>0?1.05:PI+1.05);X.strokeStyle='#2a1408';X.lineWidth=2.4;X.lineCap='round';X.stroke();}
 for(const s of[-1,1]){const ex=CX+s*16;
  if(m==='yuck'){X.beginPath();X.moveTo(ex+s*6,ey-6);X.lineTo(ex-s*4,ey);X.lineTo(ex+s*6,ey+6);dbl(3);}
  else if(shut){X.beginPath();X.arc(ex,ey+4,8,PI*1.12,PI*1.88);dbl(3.2);}
  else if(blink){X.beginPath();X.moveTo(ex-8,ey+1);X.lineTo(ex+8,ey+1);dbl(3);}
  else{const wide=(m==='burst'||m==='aww'||m==='gulp')?1.13:1,jx=m==='burst'?(Math.random()-.5)*1.2:0;ell(ex,ey,9.5,11*wide);ink('#fff',2.5);
   X.fillStyle=OUT;circ(ex+lk[0]*3.6+jx,ey+lk[1]*3.6,m==='burst'?3.5:4.8);X.fill();X.fillStyle='#fff';circ(ex+lk[0]*3.6+1.7,ey+lk[1]*3.6-1.9,1.8);X.fill();circ(ex+lk[0]*3.6-1.6,ey+lk[1]*3.6+1.8,.8);X.fill();X.save();ell(ex,ey,9.5,11*wide);X.clip();X.fillStyle='rgba(90,60,90,.25)';X.fillRect(ex-10,ey-12,20,6.5);X.restore();
   if(m==='calm'||m==='relief'){X.save();ell(ex,ey,9.5,11);X.clip();X.fillStyle='#5c4d55';X.fillRect(ex-11,ey-12,22,8+Math.sin(NOW*1.3)*.8);X.restore();ell(ex,ey,9.5,11);X.lineWidth=2.5;X.strokeStyle=OUT;X.stroke();X.beginPath();X.moveTo(ex-8.6,ey-4);X.lineTo(ex+8.6,ey-4);X.lineWidth=2;X.stroke();}}
  X.strokeStyle='#2a1408';X.lineWidth=3;X.lineCap='round';X.beginPath();
  if(m==='hot'||m==='burst'||m==='aww'){X.moveTo(ex+s*8,ey-13);X.lineTo(ex-s*5,ey-18);X.stroke();}
  else if(m==='yuck'){X.moveTo(ex+s*8,ey-18);X.lineTo(ex-s*5,ey-13);X.stroke();}
  else if(m==='happy'||m==='gulp'){X.moveTo(ex-7,ey-16);X.quadraticCurveTo(ex,ey-20.5,ex+7,ey-16);X.stroke();}}
 if(m==='burst'||(m==='hot'&&fp>.75)){const d=(NOW*22)%16;X.fillStyle='#bfeaff';X.beginPath();X.moveTo(CX+39,ey-16+d);X.quadraticCurveTo(CX+43,ey-9+d,CX+39,ey-6+d);X.quadraticCurveTo(CX+35,ey-9+d,CX+39,ey-16+d);X.fill();X.strokeStyle=OUT;X.lineWidth=1.3;X.stroke();}
 if(m==='erupt'){ell(CX,my+2,11,9.5);ink('#7a1206',2.5);X.fillStyle='#ff6f61';ell(CX,my+7,6.5,3.2);X.fill();}
 else if(m==='hot'){X.beginPath();X.arc(CX,my-3,11,0,PI);X.closePath();ink('#7a1206',2.5);X.fillStyle='#fff';X.fillRect(CX-7.5,my-2,15,3.5);}
 else if(m==='burst'){const j=Math.sin(NOW*40)*.8;X.beginPath();X.moveTo(CX-9,my+j);X.quadraticCurveTo(CX-4.5,my-4,CX,my);X.quadraticCurveTo(CX+4.5,my+4,CX+9,my-j);mline(3.2);}
 else if(m==='gulp'&&vol.t>.5){ell(CX,my,6.5,7.5);ink('#7a1206',2.5);}
 else if(m==='aww'){ell(CX,my+1,4.6,5.2);ink('#7a1206',2.3);}
 else if(m==='yuck'){X.beginPath();X.moveTo(CX-10,my);X.quadraticCurveTo(CX-5,my-5,CX,my);X.quadraticCurveTo(CX+5,my+5,CX+10,my);mline(3.2);ell(CX+4,my+6,4.4,6);ink('#ff7b8a',2);}
 else{const w=m==='calm'?7.5:11,d=m==='calm'?4:7.5;X.beginPath();X.moveTo(CX-w,my-4);X.quadraticCurveTo(CX,my+d,CX+w,my-4);mline(3.2);if(m==='relief'||m==='gulp'){ell(CX+2,my+3.5,4,4.6);ink('#ff7b8a',1.8);}}}
function volcano(){const er=(state==='erupt'||state==='win'),fp=er?1:collected/Math.max(need,1),pl=Math.sin(volP)*.5+.5,top=CY+3,hh=VB-top;
 const heat=clamp((fp-.5)/.5,0,1),trem=er?(eruptT>112?2.4:0):(heat*heat*1.2+build*3.2);
 X.save();const gr=craterR*(3+fp*1.6+build*1.3);X.globalAlpha=Math.min(1,.25+pl*.12+fp*.35+build*.3);const rg=X.createRadialGradient(CX,CY,0,CX,CY,gr);rg.addColorStop(0,fp>.6?'#ff5a10':'#ffa020');rg.addColorStop(1,'rgba(255,60,0,0)');X.fillStyle=rg;circ(CX,CY,gr);X.fill();X.restore();
 const steamN=fp>.5?5:3;if(state==='play'||state==='menu')for(let i=0;i<steamN;i++){const ag=(wave*.7+i*28)%80,p=ag/80;X.save();X.globalAlpha=(1-p)*.42;X.fillStyle=fp>.6?'#ffb08a':'#fff4e0';circ(CX+(i-2)*9+Math.sin(p*5)*5,CY-10-p*(34+fp*20),4+p*9);X.fill();X.restore();}
 X.save();const sw=1+build*.055+Math.sin(NOW*2.1)*.006,sq=vol.sq;X.translate(CX+(Math.random()-.5)*trem,VB+(Math.random()-.5)*trem*.4);X.scale((1+sq*.07)*sw,(1-sq*.1)*sw);X.translate(-CX,-VB);
 conePath();const vg=X.createLinearGradient(CX-118,0,CX+118,0);vg.addColorStop(0,'#7c6a70');vg.addColorStop(.36,'#4d4047');vg.addColorStop(.7,'#2e252c');vg.addColorStop(1,'#19131a');X.fillStyle=vg;X.fill();
 X.save();conePath();X.clip();
 const tg=X.createLinearGradient(0,top,0,top+56);tg.addColorStop(0,'rgba(255,120,30,'+(.28+fp*.35).toFixed(2)+')');tg.addColorStop(1,'rgba(255,120,30,0)');X.fillStyle=tg;X.fillRect(CX-130,top,260,56);
 if(!rocks){seed=3;rocks=[];for(let i=0;i<48;i++)rocks.push({u:rnd()*2-1,v:.06+rnd()*.92,s:2+rnd()*4.5,l:rnd()<.45,rot:rnd()*3});}
 rocks.forEach(k=>{const x=CX+k.u*coneHalf(k.v)*.93,y=top+k.v*hh;if(Math.abs(x-CX)<42&&y>CY+12&&y<CY+88)return;const q=k.s*1.9;X.lineCap='round';X.strokeStyle='rgba(8,4,8,.55)';X.lineWidth=2.2;X.beginPath();X.arc(x,y,q,.2,PI-.2);X.stroke();X.strokeStyle='rgba(255,232,224,'+(k.u<0?.2:.08)+')';X.lineWidth=1.6;X.beginPath();X.arc(x,y+q*.25,q,PI+.5,TAU-.5);X.stroke();});
 {const lg=X.createLinearGradient(CX-118,0,CX-40,0);lg.addColorStop(0,'rgba(255,214,190,.22)');lg.addColorStop(1,'rgba(255,214,190,0)');X.fillStyle=lg;X.fillRect(CX-124,top,90,hh+20);const wg=X.createLinearGradient(0,VB-44,0,VB+16);wg.addColorStop(0,'rgba(80,170,245,0)');wg.addColorStop(1,'rgba(80,170,245,.4)');X.fillStyle=wg;X.fillRect(CX-124,VB-44,248,64);}
 X.strokeStyle='rgba(20,14,12,.35)';X.lineWidth=2;[-.78,-.45,.42,.74].forEach(u=>{X.beginPath();X.moveTo(CX+u*coneHalf(.04),top+3);X.quadraticCurveTo(CX+u*coneHalf(.5)*1.02,top+hh*.5,CX+u*coneHalf(.96),top+hh*.96);X.stroke();});
 [[-.9,.95],[-.66,.72],[.7,.88],[.9,.6]].forEach(([u,m],i)=>{const len=Math.min(1,(.2+fp*.72+build*.2+(er?.5:0))*m+Math.sin(volP*1.3+i)*.03),pts=[];
  for(let s=0;s<=12;s++){const v=s/12*len;pts.push([CX+u*coneHalf(v)*.9+Math.sin(v*9+i*2)*3.5,top+v*hh]);}
  X.lineCap='round';X.lineJoin='round';[[20,'rgba(255,110,0,.13)'],[11,'rgba(255,90,0,.30)'],[6.5,'#d8320a'],[4,'#ff8a10'],[1.6,'#ffe45c']].forEach(([w,c])=>{X.strokeStyle=c;X.lineWidth=w;X.beginPath();pts.forEach((p,j)=>j?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));X.stroke();});
  const tp=pts[pts.length-1];X.fillStyle='#ff6a00';circ(tp[0],tp[1]+1.5,3.8);X.fill();X.fillStyle='#ffe45c';circ(tp[0]-.8,tp[1]+.6,1.4);X.fill();});
 X.restore();
 conePath();X.lineWidth=3.5;X.strokeStyle=OUT;X.lineJoin='round';X.stroke();
 const cr=craterR+4,cry=cr*.38;
 ell(CX,CY,cr+7,cry+4.5);ink('#76625a',3);
 const cg=X.createRadialGradient(CX,CY-1,1,CX,CY,cr);cg.addColorStop(0,'#fff3a0');cg.addColorStop(.35,fp>.5?'#ffcf2e':'#ff9a1a');cg.addColorStop(.8,fp>.5?'#ff4a0a':'#c2300a');cg.addColorStop(1,'#5a1204');ell(CX,CY,cr,cry);X.fillStyle=cg;X.fill();
 X.save();ell(CX,CY,cr,cry);X.clip();X.fillStyle='rgba(60,20,8,.55)';ell(CX,CY-cry*.95,cr*1.05,cry*.7);X.fill();
 for(let i=0;i<3;i++){const ph=(volP*.8+i*.33)%1,bx=CX+(i-1)*cr*.45,by=CY+cry*.2;X.globalAlpha=1-ph;X.strokeStyle='#fff6b0';X.lineWidth=1.3;ell(bx,by,2+ph*4,1+ph*1.6);X.stroke();}X.restore();
 X.strokeStyle='rgba(255,190,120,.6)';X.lineWidth=2;X.beginPath();X.ellipse(CX,CY,cr+3.5,cry+2.2,0,.3,2.84);X.stroke();
 if(er&&eruptT>100){const k=Math.min(1,(160-eruptT)/7)*EZ.out((eruptT-100)/18),h=190*k,wob=Math.sin(NOW*22)*4,g=X.createLinearGradient(0,CY,0,CY-h);g.addColorStop(0,'#fff6b0');g.addColorStop(.35,'#ffb21a');g.addColorStop(.8,'rgba(245,80,15,.85)');g.addColorStop(1,'rgba(240,60,10,0)');
  X.fillStyle=g;X.beginPath();X.moveTo(CX-cr*.8,CY+2);X.quadraticCurveTo(CX-cr*.45+wob,CY-h*.5,CX-14-wob,CY-h);X.lineTo(CX+14-wob,CY-h);X.quadraticCurveTo(CX+cr*.45+wob,CY-h*.5,CX+cr*.8,CY+2);X.closePath();X.fill();}
 X.save();X.translate(CX,CY+40);X.scale(1.15,1.15);X.translate(-CX,-(CY+40)+8.5);volFace(fp,er);X.restore();
 X.restore();
 // the target: always readable, loud while you aim
 if(state==='play'&&!buildOn){const aim=!!charging;X.save();X.globalAlpha=aim?.95:.45+pl*.25;X.strokeStyle='#fff3b0';X.lineWidth=aim?3:2;X.setLineDash([5,5]);X.lineDashOffset=-wave*.3;ell(CX,CY,cr+13+(aim?Math.sin(NOW*8)*1.5:0),cry+8);X.stroke();X.restore();}
 for(let i=0;i<24;i++){const x=CX-122+i*(244/23),q=(x-CX)/122,y=VB+9*(1-q*q)+Math.sin(i*1.9)*1.6+Math.sin(wave*.06+i)*1.4,r=5+((i*5)%4);X.fillStyle='rgba(255,255,255,.94)';circ(x,y,r);X.fill();X.fillStyle='rgba(150,205,240,.55)';circ(x+r*.3,y+r*.35,r*.5);X.fill();}}

// ── KIDS ──
function backFoam(x,wl,rx){for(let i=0;i<2;i++){const ph=(wave*.012+i*.5)%1;X.save();X.globalAlpha=(1-ph)*.5;X.strokeStyle='#e8f8ff';X.lineWidth=2;ell(x,wl+2,rx+4+ph*30,rx*.3+ph*8);X.stroke();X.restore();}
 for(let i=0;i<9;i++){const a=PI+i/8*PI;X.fillStyle='#fff';circ(x+Math.cos(a)*rx,wl+Math.sin(a)*rx*.26,3.5+((i*3)%3));X.fill();}}
function nameTag(t,x,y,col){X.font=fnt(900,10.5);const w=X.measureText(t).width+16;rr(x-w/2,y-8,w,16,8);ink('#fff6e0',2);label(t,x,y+.5,10.5,col);}
function drawMax(mx,hY){const headY=hY+38,wob=Math.sin(wave*.22)*2,wl=headY+42,er=(state==='erupt'||state==='win'),m=mxc.mood,hopY=mxc.hop+(er?-Math.abs(Math.sin(NOW*7+1))*4:0),br=Math.sin(NOW*2.4+1)*.9,hd=headY+br*.5;
 backFoam(mx,wl,32);
 X.save();X.beginPath();X.rect(-20,-400,W+40,wl+400);X.clip();X.translate(0,hopY);torso(mx,headY+12,42,64);X.restore();
 collar(mx,wl,32);
 X.save();X.translate(0,hopY);const wig=m==='gotcha'?Math.sin(NOW*30)*3:0;
 limb([[mx-15,headY+18],[mx-19,headY-8],[mx-14+wig,hY+wob]],10);limb([[mx+15,headY+18],[mx+19,headY-8],[mx+14-wig,hY-wob]],10);
 headBase(mx,hd,22);hair(mx,hd,22,'#d9701f','#ffb45e',3);
 face(mx,hd+1,.82,{mood:(er||m==='gotcha'||m==='laugh')?'laugh':m==='aww'?'wow':'cheeky',freckles:true,look:lookAt(mx,headY),blink:mxc.blink>0,iris:'#3f6a34',irisHi:'#9cc96a',brow:'#a84f16'});
 hand(mx-14+wig,hY+wob,8.5,-PI/2-.2,true);hand(mx+14-wig,hY-wob,8.5,-PI/2+.2,true);X.restore();
 nameTag('Max',mx,wl+20,'#7a3fc0');}
function maxBlocker(){if(state==='menu'){drawMax(300,300+Math.sin(wave*.05)*6);return;}if(blk.on)drawMax(blk.x,blk.y);}
function kid(){const kx=190,base=372,s=splashSide,er=(state==='erupt'||state==='win'),wl=base+6,menu=state==='menu',busy=charging||pendingLaunch||swingT>0;
 const cheer=er||(noah.mood==='cheer'&&!busy),hopY=noah.hop+(er?-Math.abs(Math.sin(NOW*7))*4:0),hy=base-44+Math.sin(NOW*2.2)*.8;
 const tl=charging?-s*(.05+.07*Math.min(1,charging.c/1.2)):swingT>0?s*.14:0;noah.lean+=(tl-noah.lean)*.25;
 const pose=()=>{X.translate(kx,wl+12);X.rotate(noah.lean);X.translate(-kx,-(wl+12)+hopY);},ang=menu?-1.05+Math.sin(NOW*7)*.38:armAng;
 backFoam(kx,wl,38);
 X.save();X.beginPath();X.rect(-20,-400,W+40,wl+400);X.clip();pose();
 if(!cheer)limb([[kx-18*s,base-20],[kx-46*s,base-12]],11);
 torso(kx,base-34,50,70);X.restore();
 collar(kx,wl,38);
 X.save();pose();
 if(!cheer){hand(kx-46*s,base-12,7.5,s>0?PI*.85:PI*.15);const sX=kx+18*s,sY=base-20,ex=sX+s*Math.cos(ang)*26,ey=sY+Math.sin(ang)*26,hx=ex+s*Math.cos(ang+0.5)*22,hy2=ey+Math.sin(ang+0.5)*22;limb([[sX,sY],[ex,ey],[hx,hy2]],11);hand(hx,hy2,8.5,Math.atan2(hy2-ey,hx-ex),true);}
 headBase(kx,hy,27);hair(kx,hy,27,'#2a1810','#6a4630',5);
 const nm=noah.mood,fm=cheer?'laugh':charging?'focus':(nm==='throw')?'throw':(nm==='wow'||nm==='oops')?'wow':'happy';
 face(kx,hy+2,1,{mood:fm,look:lookAt(kx,hy),blink:noah.blink>0});
 if(cheer)[-1,1].forEach(sg=>{const wg=Math.sin(NOW*9+sg)*4,hx=kx+41*sg+wg,hy2=hy-20;limb([[kx+18*sg,base-20],[kx+37*sg,hy+12],[hx,hy2]],11);hand(hx,hy2-2,8.5,-PI/2+sg*.25,true);});
 X.restore();
 if(!menu)nameTag('Noah',kx,wl+22,'#1f6fb8');}

// ── TOYS IN PLAY ──
function drawObjs(){const anyHeld=charging||pendingLaunch;objs.forEach((o,i)=>{if(o.st==='gone')return;if(o.born&&NOW<o.born)return;
 const fly=o.st==='fly',held=(charging&&charging.o===o)||(pendingLaunch&&pendingLaunch.o===o),bk=o.born?EZ.back((NOW-o.born)/.38):1;
 let nudge=0;if(!anyHeld&&idleT>3.5&&!fly){const ph=(idleT*1.1-i*.33)%3.2;if(ph>0&&ph<.42)nudge=-Math.sin(ph/.42*PI)*8;}
 const fb=o.y+((fly||held)?0:Math.sin(wave*.045+o.bob)*3.2),by=fb+nudge,canGrab=o.st==='float'&&!anyHeld&&swingT<=0,isNew=o.isNew&&newToyT>0;
 if(!fly)floatFX(o.x,fb,o.bob);
 if(canGrab){const pu=.5+Math.sin(wave*.08+o.bob)*.5;X.save();X.globalAlpha=.3+pu*.25;X.strokeStyle=o.hb?'#ffd23f':'#fff6be';X.lineWidth=7;circ(o.x,by,27);X.stroke();X.globalAlpha=.55+pu*.4;X.strokeStyle='#fff';X.lineWidth=2;circ(o.x,by,27+pu*1.5);X.stroke();X.restore();}
 X.save();if(anyHeld&&!held&&!fly)X.globalAlpha=.6;
 if(o.hb){drawHairball(o.x,by,o.r*bk,o.sq||0);if(canGrab){label('Bonus! +5s',o.x,by-34,11.5,'#ffd23f',OUT,3);label(Math.ceil(o.life)+'s',o.x,by+33,10,'#fff',OUT,3);}}
 else{const sq=o.sq||0;let s1=(1+sq*.4)*bk,s2=(1-sq*.3)*bk,dy=0,jx=0,rot=fly?(o.rot||0):Math.sin(wave*.03+o.bob)*.09;
  if(held&&charging){const k=clamp((charging.c-.3)/1.1,0,1);s1*=1+k*.15;s2*=1-k*.15;dy=k*3.5;jx=(Math.random()-.5)*k*1.6;rot=0;}
  X.translate(o.x+jx,by+dy);X.rotate(rot);X.scale(s1,s2);paintToy(o.em,34);}
 X.restore();
 if(!o.hb&&!fly&&!held)lap(o.x,by);
 if(isNew){const pu=(Math.sin(wave*.2)+1)/2;X.save();X.globalAlpha=.55+pu*.45;X.strokeStyle='#ffcc00';X.lineWidth=3;circ(o.x,by,31);X.stroke();label('New!',o.x,by-38,12.5,'#ffd23f',OUT,3.5);X.restore();}});}
function menuToys(){BASE.forEach((em,i)=>{const p=[[84,458],[262,444],[150,496]][i],by=p[1]+Math.sin(wave*.045+i*2)*3.2,k=EZ.back((uiT-.5-i*.12)/.4);if(k<=0)return;floatFX(p[0],by,i*.3);X.save();X.translate(p[0],by);X.rotate(Math.sin(wave*.03+i)*.09);X.scale(k,k);paintToy(em,36);X.restore();lap(p[0],by);});}

// ── AIM GUIDE ──
function chargeGuide(){if(!charging){wasOn=false;return;}const o=charging.o,iv=ideal(o),f=charging.c,dr=diff().drift*.012;
 let vx=iv.vx*f,vy=iv.vy*f,tx=o.x,ty=o.y,onTarget=false;const pts=[];
 for(let i=0;i<110;i++){vy+=G;vx+=dr;tx+=vx;ty+=vy;if(catchHit(tx,ty,vy)){onTarget=true;break;}if(ty>556||tx<0||tx>W)break;pts.push({x:tx,y:ty});}
 if(onTarget&&!wasOn)sfxTick();wasOn=onTarget;
 const col=onTarget?'#3ad17a':(o.hb?'#ffd23f':'#8fe6ff'),sh=~~(NOW*14);
 pts.forEach((p,i)=>{if((i+sh)%3===1)return;X.save();X.globalAlpha=Math.max(.3,1-i/120);circ(p.x,p.y,Math.max(2.6,(onTarget?5.6:5)-i*.025));X.fillStyle=col;X.fill();X.lineWidth=1.4;X.strokeStyle=OUT;X.stroke();X.restore();});
 const frac=Math.min(f/1.4,1);X.lineCap='round';X.strokeStyle='rgba(59,31,14,.5)';X.lineWidth=8;circ(o.x,o.y,31);X.stroke();
 X.strokeStyle=col;X.lineWidth=5;X.beginPath();X.arc(o.x,o.y,31,-1.57,-1.57+TAU*frac);X.stroke();
 const lx=clamp(o.x,52,W-52),pu=onTarget?1+Math.sin(NOW*16)*.08:1;X.save();X.translate(lx,o.y-47);X.scale(pu,pu);label(onTarget?'Let go!':'Hold…',0,0,onTarget?17:13,col,OUT,onTarget?5:4);X.restore();
 if(onTarget){X.save();X.strokeStyle='#3ad17a';X.lineWidth=4;X.globalAlpha=.75+Math.sin(NOW*16)*.25;ell(CX,CY,craterR+15,craterR*.5+9);X.stroke();X.restore();}}
// ── WORDLESS TUTORIAL: a ghost finger shows hold → aim → let go until the first real throw ──
function finger(x,y,down){X.save();X.translate(x,y);X.rotate(-.3);const k=down?.9:1;X.scale(k,k);
 rr(-14,16,28,24,10);ink(SKIN,2.4);rr(-5.5,-1,11,26,5.5);ink(SKIN,2.4);X.fillStyle=SKIN;X.fillRect(-4,14,8,8);X.fillStyle='rgba(255,255,255,.55)';rr(-3,2,3,9,1.5);X.fill();X.restore();}
function tutorial(){if(!tutOn||state!=='play'||charging||pendingLaunch||swingT>0)return;const o=objs.find(q=>q.st==='float'&&!q.hb);if(!o||(o.born&&NOW<o.born+.4))return;
 const t=tutT%3.3,iv=ideal(o),hold=clamp((t-.55)/1.35,0,1),f=.3+hold*.7,on=hold>=.96;
 if(t>.55&&t<2.25){let vx=iv.vx*f,vy=iv.vy*f,x=o.x,y=o.y;X.save();for(let i=0;i<80;i++){vy+=G;x+=vx;y+=vy;if(catchHit(x,y,vy)||y>o.y+2)break;if(i%3===0){X.globalAlpha=.85-i*.006;circ(x,y,3.6);X.fillStyle=on?'#3ad17a':'#fff';X.fill();X.lineWidth=1.2;X.strokeStyle=OUT;X.stroke();}}X.restore();
  X.lineCap='round';X.strokeStyle='rgba(59,31,14,.4)';X.lineWidth=7;circ(o.x,o.y,31);X.stroke();X.strokeStyle=on?'#3ad17a':'#fff';X.lineWidth=4.5;X.beginPath();X.arc(o.x,o.y,31,-1.57,-1.57+TAU*hold*.72);X.stroke();}
 if(t>=2.25&&t<3.05){const fr=EZ.out((t-2.25)/.8)*T,gx=o.x+iv.vx*fr,gy=o.y+iv.vy*fr+.5*G*fr*fr;X.save();X.globalAlpha=.6;X.translate(gx,gy);X.rotate(fr*.05);paintToy(o.em,30);X.restore();}
 const arr=EZ.out(t/.5),down=t>.5&&t<2.2,lift=t>=2.2?EZ.out((t-2.2)/.3):0,fx=o.x+8+(1-arr)*26+lift*20,fy=o.y+10+(1-arr)*34+lift*26;
 X.save();X.globalAlpha=t>2.9?clamp((3.3-t)/.4,0,1):clamp(t/.25,0,1);
 if(down){const p=(NOW*1.6)%1;X.save();X.globalAlpha*=(1-p);X.strokeStyle='#fff';X.lineWidth=2.5;circ(o.x,o.y,12+p*16);X.stroke();X.restore();}
 finger(fx,fy,down);
 label(t<2.2?(on?'Let go!':'Hold…'):'Let go!',clamp(o.x,70,W-70),o.y+62,13,on||t>=2.2?'#b9ffd6':'#fff',OUT,4);X.restore();}

// ── PARTICLES ──
function drawParts(){smoke.forEach(p=>{X.globalAlpha=Math.max(0,p.life)*.5;X.fillStyle=p.c;circ(p.x,p.y,p.r);X.fill();});X.globalAlpha=1;
 parts.forEach(p=>{const r=p.r*Math.min(1,p.life);if(r<.3)return;const sp=Math.hypot(p.vx,p.vy);X.save();X.globalAlpha=Math.min(1,p.life*1.3);X.translate(p.x,p.y);X.rotate(Math.atan2(p.vy,p.vx));X.fillStyle=p.col;ell(0,0,r*(1+Math.min(sp,9)*.07),r*.82);X.fill();if(r>2.4){X.fillStyle='rgba(255,255,255,.75)';circ(r*.2,-r*.3,r*.3);X.fill();}X.restore();});
 eParts.forEach(p=>{X.globalAlpha=Math.min(1,p.life*1.2);X.fillStyle='#b3200a';circ(p.x,p.y,p.r+1.2);X.fill();X.fillStyle=p.col;circ(p.x,p.y,p.r);X.fill();X.fillStyle='rgba(255,246,170,.9)';circ(p.x-p.r*.2,p.y-p.r*.25,p.r*.42);X.fill();});
 sparks.forEach(p=>{X.globalAlpha=Math.min(1,p.life*1.5);star(p.x,p.y,p.r*p.life+1,(p.r*p.life+1)*.42,p.rot);X.fillStyle=p.col;X.fill();X.lineWidth=1;X.strokeStyle='rgba(120,70,0,.5)';X.stroke();});
 confet.forEach(p=>{X.save();X.globalAlpha=Math.min(1,p.life*3);X.translate(p.x,p.y);X.rotate(p.rot);X.scale(1,Math.cos(NOW*7+p.rot));X.fillStyle=p.col;X.fillRect(-p.w/2,-p.w*.3,p.w,p.w*.6);X.restore();});X.globalAlpha=1;}
function drawEjecta(){ejecta.forEach(e=>{if(e.delay>0)return;X.save();X.translate(e.x,e.y);
 const g=X.createRadialGradient(0,0,6,0,0,26);g.addColorStop(0,'rgba(255,190,80,.5)');g.addColorStop(1,'rgba(255,90,0,0)');X.fillStyle=g;circ(0,0,26);X.fill();
 X.rotate(e.rot);paintToy(e.em,36);X.restore();});}
function drawPops(){pops.forEach(p=>{const k=p.age,sc=k<.16?lerp(.4,1.2,EZ.out(k/.16)):lerp(1.2,1,EZ.out((k-.16)/.22)),a=k<.72?1:1-(k-.72)/.33,size=p.big?19:15.5;
 X.save();X.globalAlpha=clamp(a,0,1);X.font=fnt(900,size);const hw=X.measureText(p.t).width*.6+6;X.translate(clamp(p.x,hw,W-hw),p.y-EZ.out(k)*44);X.scale(sc,sc);label(p.t,0,0,size,p.c,OUT,4.5);X.restore();});}

// ── HUD (screen space, under the notch) ──
function chip(x,y,w,h){rr(x,y+2.5,w,h,h/2);X.fillStyle='rgba(40,20,8,.3)';X.fill();rr(x,y,w,h,h/2);ink('#fff6e0',2.5);X.fillStyle='rgba(255,255,255,.8)';rr(x+9,y+3.5,w-18,h*.2,h*.1);X.fill();}
function icoStar(x,y,R){star(x,y,R,R*.5);X.lineJoin='round';ink('#ffd23f',2);star(x-R*.08,y-R*.1,R*.45,R*.22);X.fillStyle='#fff6b0';X.fill();}
function icoFlame(x,y,s){X.beginPath();X.moveTo(x,y-s);X.quadraticCurveTo(x+s*.95,y-s*.1,x+s*.58,y+s*.6);X.quadraticCurveTo(x,y+s*1.1,x-s*.58,y+s*.6);X.quadraticCurveTo(x-s*.95,y,x-s*.25,y-s*.35);X.quadraticCurveTo(x-s*.1,y-s*.6,x,y-s);X.closePath();ink('#ff7a1a',2);ell(x,y+s*.36,s*.28,s*.4);X.fillStyle='#ffe45c';X.fill();}
function icoTrophy(x,y,s){X.save();X.translate(x,y);X.scale(s,s);X.lineJoin='round';X.lineCap='round';
 for(const g of[-1,1]){X.beginPath();X.arc(g*15,-9,8,g>0?-PI*.5:PI*.5,g>0?PI*.5:PI*1.5);X.lineWidth=6.5;X.strokeStyle=OUT;X.stroke();X.lineWidth=2.6;X.strokeStyle='#ffd23f';X.stroke();}
 X.beginPath();X.moveTo(-15,-21);X.lineTo(15,-21);X.quadraticCurveTo(15,4,0,8);X.quadraticCurveTo(-15,4,-15,-21);X.closePath();ink('#ffd23f',2.6);
 rr(-3.5,8,7,8,1);ink('#f0b020',2.2);rr(-12,15,24,7,3);ink('#e2793c',2.5);X.fillStyle='rgba(255,255,255,.6)';rr(-10.5,-18,4,14,2);X.fill();star(1,-8,5.5,2.6);X.fillStyle='#fff6b0';X.fill();X.restore();}
const BTN_R=19;
function roundBtn(x,y,kind){circ(x,y+2.5,BTN_R);X.fillStyle='rgba(40,20,8,.3)';X.fill();circ(x,y,BTN_R);ink('#fff6e0',2.5);X.fillStyle='rgba(255,255,255,.8)';ell(x-5,y-10,8,3.2,-.3);X.fill();X.fillStyle=OUT;
 if(kind==='pause'){rr(x-7,y-7.5,5,15,1.6);X.fill();rr(x+2,y-7.5,5,15,1.6);X.fill();}
 else if(kind==='play'){X.beginPath();X.moveTo(x-5,y-8);X.lineTo(x+8,y);X.lineTo(x-5,y+8);X.closePath();X.fill();}
 else{X.beginPath();X.moveTo(x-10,y-4);X.lineTo(x-5,y-4);X.lineTo(x+1,y-9.5);X.lineTo(x+1,y+9.5);X.lineTo(x-5,y+4);X.lineTo(x-10,y+4);X.closePath();X.fill();
  X.lineWidth=2.2;X.strokeStyle=OUT;X.lineCap='round';if(kind==='mute'){X.beginPath();X.moveTo(x+5,y-4.5);X.lineTo(x+12,y+4.5);X.moveTo(x+12,y-4.5);X.lineTo(x+5,y+4.5);X.stroke();}
  else{X.beginPath();X.arc(x+2,y,5.5,-.9,.9);X.stroke();X.beginPath();X.arc(x+2,y,10,-.9,.9);X.stroke();}}}
function drawMute(){roundBtn(W-28,SAFE+28,muted?'mute':'sound');}
function drawPauseBtn(){roundBtn(W-74,SAFE+28,paused?'play':'pause');}
function hud(){const s=SAFE,hg=X.createLinearGradient(0,0,0,s+92);hg.addColorStop(0,'rgba(6,28,58,.72)');hg.addColorStop(.65,'rgba(6,28,58,.34)');hg.addColorStop(1,'rgba(6,28,58,0)');X.fillStyle=hg;X.fillRect(0,0,W,s+92);
 const sp=1+scorePop*scorePop*.2;X.save();X.translate(62,s+27);X.scale(sp,sp);chip(-52,-17,104,34);icoStar(-32,0,10.5);label(String(Math.round(scoreShown)),14,1,18,OUT);X.restore();
 label('Round '+round+'/10',62,s+59,12,'#fff',OUT,3.5);
 if(combo>1){const cp=1+EZ.out(comboPop)*.35*comboPop;X.save();X.translate(62,s+80);X.scale(cp,cp);icoFlame(-17,-1,8);label('x'+combo,6,0,15,'#ffb020',OUT,4);X.restore();}
 const tw=118,tx=154,ty=s+18,cxm=tx+tw/2,pct=clamp(timeLeft/roundTime,0,1),low=state==='play'&&timeLeft<8,tc=low?'#ff9a1a':pct>.5?'#3ad17a':'#ffcc00';
 const pulse=low?(1+Math.sin(NOW*9)*.1):1;X.save();X.translate(tx-17,ty+9);X.scale(pulse,pulse);circ(0,0,12);ink(low?'#ffc266':'#fff6e0',2.3);X.strokeStyle=OUT;X.lineWidth=2.2;X.lineCap='round';X.beginPath();X.moveTo(0,0);X.lineTo(0,-6.5);X.moveTo(0,0);X.lineTo(4.4,2.2);X.stroke();X.restore();
 rr(tx,ty,tw,18,9);X.fillStyle='rgba(20,10,4,.4)';X.fill();
 if(pct>0){const pw=Math.max(18,tw*pct);rr(tx,ty,pw,18,9);X.fillStyle=tc;X.fill();X.fillStyle='rgba(255,255,255,.45)';rr(tx+6,ty+3.5,Math.max(6,pw-12),4.2,2.1);X.fill();}
 X.lineWidth=2.5;X.strokeStyle=OUT;rr(tx,ty,tw,18,9);X.stroke();label(String(Math.ceil(timeLeft)),cxm,ty+9.5,12.5,'#fff',OUT,3.2);
 // toy tracker: each toy lights up once it is inside the volcano
 const n=need,gap=Math.min(21,150/Math.max(n,1)),x0=cxm-8-(n-1)*gap/2;
 for(let i=0;i<n;i++){const o=objs[i],lit=!o||o.hb||o.st==='gone',x=x0+i*gap,y=s+53;if(lit){circ(x,y,8.5);X.fillStyle='#ffd23f';X.fill();X.lineWidth=1.6;X.strokeStyle=OUT;X.stroke();}else{circ(x,y,7.5);X.fillStyle='rgba(255,246,224,.2)';X.fill();}
  X.save();X.translate(x,y);if(!lit)X.globalAlpha=.8;paintToy(currentToys[i],lit?12:10.5);X.restore();}}
function drawBanner(){if(bannerT<=0)return;const age=2.6-bannerT,k=EZ.back(age/.35),a=Math.min(1,bannerT/.4);if(k<=0)return;X.save();X.globalAlpha=a;X.translate(W/2,88);X.scale(k,k);X.font=fnt(900,16);const w=X.measureText(banner).width+36;
 chip(-w/2,-17,w,34);label(banner,0,1,16,'#e2360a');X.restore();}

// ── CARDS, BUTTONS, TITLE ──
function cardEnd(){X.restore();}
function logo(y){const age=uiT;let n=0;[['EXPLODING',-28,41,0],['VOLCANOS',19,45,1]].forEach(([w,dy,sz,rock])=>{X.font=fnt(900,sz);let x=W/2-X.measureText(w).width/2;
  for(let i=0;i<w.length;i++,n++){const chr=w[i],cw=X.measureText(chr).width,k=EZ.back((age-.1-n*.045)/.42),bob=Math.sin(wave*.05+i*.7)*1.5;if(k>0){X.save();X.translate(x+cw/2,y+dy+bob-(1-k)*46);X.rotate(Math.sin(i*1.7+dy)*.08);X.scale(k,k);
   X.font=fnt(900,sz);X.textAlign='center';X.textBaseline='middle';X.lineJoin='round';X.lineWidth=10;X.strokeStyle=OUT;X.strokeText(chr,0,3);X.strokeText(chr,0,0);
   const g=X.createLinearGradient(0,-sz/2,0,sz/2);if(rock){X.lineWidth=5;X.strokeStyle='#ff7a10';X.strokeText(chr,0,0);g.addColorStop(0,'#9a8a82');g.addColorStop(.6,'#4a3b35');g.addColorStop(1,'#2a201c');}else{g.addColorStop(0,'#ffe45c');g.addColorStop(.5,'#ff8a10');g.addColorStop(1,'#e2360a');}
   X.fillStyle=g;X.fillText(chr,0,0);X.restore();}x+=cw;}});
 const k=EZ.back((age-1)/.4);if(k>0){X.save();X.translate(W/2,y+59);X.scale(k,k);label('in the Bathtub!',0,0,23,'#5fd0ff',OUT,6);X.restore();}}
function drawMenu(){const g=X.createLinearGradient(0,0,0,OY+240);g.addColorStop(0,'rgba(6,24,52,.72)');g.addColorStop(.7,'rgba(6,24,52,.25)');g.addColorStop(1,'rgba(6,24,52,0)');X.fillStyle=g;X.fillRect(0,0,W,OY+240);
 logo(Math.max(SAFE+78,(SAFE+OY+158)/2+6));
 const bw=216,bh=64,bx=(W-bw)/2,by=HS-SAFEB-bh-Math.max(26,HS*.035),k=EZ.back((uiT-1.2)/.45);
 if(k>0){X.save();X.translate(W/2,by+bh/2);X.scale(k,k);X.translate(-W/2,-(by+bh/2));button(bx,by,bw,bh,'Play',()=>startGame(),{icon:1,size:28,halo:1});X.restore();
  if(uiT>4.5&&!press){const p=((uiT-4.5)%1.6)/1.6,dn=p>.35&&p<.7;finger(bx+bw-34+(dn?0:6),by+bh-18+(dn?0:8),dn);}}else card=null;}
function sunburst(x,y,r){X.save();X.translate(x,y);X.rotate(NOW*.5);X.fillStyle='rgba(255,190,40,.3)';for(let i=0;i<12;i++){X.rotate(TAU/12);X.beginPath();X.moveTo(0,0);X.lineTo(r,-r*.13);X.lineTo(r,r*.13);X.closePath();X.fill();}X.restore();}
function cardToy(em,x,y,size,age,delay){const k=EZ.elastic((age-delay)/.7);if(k<=0)return;X.fillStyle='rgba(95,190,240,.3)';ell(x,y+size*.62,size*.5,size*.13);X.fill();X.save();X.translate(x,y+Math.sin(NOW*3+x)*4);X.scale(k,k);paintToy(em,size);X.restore();}
function bodyText(lines,y,gap){lines.forEach((l,i)=>label(l,W/2,y+i*(gap||21),13.5,'#5a3a24',null,0,700));}
function overlay(){const key=paused?'pause':state;if(key!==uiKey){uiKey=key;uiT=0;card=null;press=null;}
 if(paused){drawPauseCard();return;}
 if(state==='menu')drawMenu();
 else if(state==='intro')drawIntroCard();
 else if(state==='newtoy')drawNewToyCard();
 else if(state==='win')drawResultCard(true);
 else if(state==='gameover')drawResultCard(false);
 else card=null;}

// ── ERUPTION: build-up → impact pause → fountain, toys, confetti, the song's punchline ──
function eruptTick(){if(eruptT>0)eruptT--;
 if(eruptT>122&&eruptT%3===0)lavaSpit(2,1);
 if(eruptT>96&&eruptT%4===0)smoke.push({x:CX+(Math.random()-.5)*26,y:CY-14,vx:(Math.random()-.5)*1.4,vy:-(1.6+Math.random()*2),r:9+Math.random()*8,life:1,c:Math.random()<.5?'#6a5a55':'#4a3b35'});
 if(eruptT>30&&eruptT<150&&eruptT%5===0)parts.push({x:26+Math.random()*328,y:-OY-12,vx:(Math.random()-.5),vy:7+Math.random()*3,life:1.7,r:3+Math.random()*2.2,col:'#bfeaff'});
 if(state==='win'&&eruptT<100&&confet.length<70&&Math.random()<.5)confet.push({x:Math.random()*W,y:-OY-10,vx:(Math.random()-.5)*2,vy:1+Math.random()*2,rot:Math.random()*6,vr:(Math.random()-.5)*.3,col:['#ffd23f','#ff8a10','#5fd0ff','#ff6f8a','#7ad17a'][~~(Math.random()*5)],life:1,w:5+Math.random()*4});}
function bigText(lines,size,fill,lw){lines.forEach(([t,dy])=>{X.font=fnt(900,size);X.textAlign='center';X.textBaseline='middle';X.lineJoin='round';X.lineWidth=lw;X.strokeStyle=OUT;X.strokeText(t,0,dy+size*.07);X.strokeText(t,0,dy);
  const g=X.createLinearGradient(0,dy-size*.45,0,dy+size*.45);g.addColorStop(0,fill[0]);g.addColorStop(1,fill[1]);X.fillStyle=g;X.fillText(t,0,dy);});X.textBaseline='alphabetic';}
function burstShape(r1,r2,n,rot){X.beginPath();for(let i=0;i<n*2;i++){const a=rot+i*PI/n,q=i%2?r2:r1;X.lineTo(Math.cos(a)*q,Math.sin(a)*q*.72);}X.closePath();}
function eruptFX(){if(state!=='erupt'&&state!=='win')return;
 if(eruptT>135){const a=(160-eruptT)/25;X.save();X.globalAlpha=Math.sin(a*3.14)*.36;X.fillStyle='#ff7a00';X.fillRect(-10,-OY-10,W+20,HS+20);X.restore();}
 if(state!=='erupt')return;
 if(eruptT>134){const sc=lerp(.5,1.1,EZ.back((160-eruptT)/11));X.save();X.translate(W/2,H/2-6);X.scale(sc,sc);X.rotate(-.03);bigText([['This is',-24],['the end!',22]],40,['#fff7b0','#ffc21a'],8);X.restore();}
 else if(eruptT>116){const a=(134-eruptT)/18;X.save();X.translate(W/2,H/2-6);
  [[-74,-10,-.14,0],[70,14,.12,.42]].forEach(q=>{const k=EZ.back((a-q[3])/.3);if(k<=0)return;X.save();X.translate(q[0],q[1]);X.rotate(q[2]);X.scale(k,k);burstShape(88,58,12,NOW);ink('#ffe45c',4);burstShape(66,44,12,NOW+.13);X.fillStyle='#fff7c2';X.fill();bigText([['POW!',1]],38,['#ff8a10','#e2360a'],8);X.restore();});X.restore();}
 else if(eruptT>10){const sc=lerp(.5,1,EZ.back((116-eruptT)/14));X.save();X.globalAlpha=Math.min(1,(eruptT-10)/12);X.translate(W/2,128);X.scale(sc,sc);bigText([['EXPLODING VOLCANOS',-16]],30,['#ffe45c','#ff7a10'],7);bigText([['in the Bathtub!',15]],22,['#bff0ff','#5fd0ff'],6);X.restore();}}

// ══════════════════════════════════════════════════════════════════════════
// ── ART PASS v2: painted characters (form shading, coloured line, real hands),
//    shaded toys with a glossy rim, and full-colour cards ──
// ══════════════════════════════════════════════════════════════════════════
const LN_SKIN='#a2522a',LN_SOFT='rgba(162,82,42,.55)';
function skinGrad(x,y,r){const g=X.createRadialGradient(x-r*.35,y-r*.45,r*.1,x,y,r*1.15);g.addColorStop(0,'#ffe6c8');g.addColorStop(.45,SKIN);g.addColorStop(1,'#dc8f5e');return g;}
function buildToys(){for(const em in TOYS){const c=document.createElement('canvas');c.width=c.height=120*TOYPX;const g=c.getContext('2d');g.scale(TOYPX,TOYPX);g.translate(60,60);TOYS[em](toyKit(g),g);
 // form shading: light from the upper left, cool shadow underneath
 g.globalCompositeOperation='source-atop';const s=g.createLinearGradient(-40,-48,34,46);s.addColorStop(0,'rgba(255,255,255,.36)');s.addColorStop(.42,'rgba(255,255,255,0)');s.addColorStop(.6,'rgba(20,30,90,0)');s.addColorStop(1,'rgba(20,30,90,.32)');g.fillStyle=s;g.fillRect(-60,-60,120,120);
 // glossy bath-toy rim so every toy reads cleanly against the water
 const t=document.createElement('canvas');t.width=t.height=c.width;const tg=t.getContext('2d');tg.drawImage(c,0,0);tg.globalCompositeOperation='source-in';tg.fillStyle='#ffffff';tg.fillRect(0,0,t.width,t.height);
 g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-over';for(let i=0;i<14;i++){const a=i/14*TAU;g.drawImage(t,Math.cos(a)*2.3*TOYPX,Math.sin(a)*2.3*TOYPX);}
 g.globalCompositeOperation='source-over';toyCv[em]=c;}}
// tapered arm with a coloured outline, a form shadow and a wet highlight
function limb(pts,w,w2){X.lineCap='round';X.lineJoin='round';w2=w2||w*.8;const n=pts.length-1,lw=i=>lerp(w,w2,n>1?i/(n-1):0);
 const seg=(i,width,col,ox,oy)=>{X.beginPath();X.moveTo(pts[i][0]+ox,pts[i][1]+oy);X.lineTo(pts[i+1][0]+ox,pts[i+1][1]+oy);X.strokeStyle=col;X.lineWidth=width;X.stroke();};
 for(let i=0;i<n;i++)seg(i,lw(i)+4.6,LN_SKIN,0,0);for(let i=0;i<n;i++)seg(i,lw(i),SKIN,0,0);
 for(let i=0;i<n;i++){const q=lw(i);seg(i,q*.42,'rgba(214,130,82,.55)',q*.2,q*.22);seg(i,q*.2,'rgba(255,242,224,.75)',-q*.2,-q*.22);}}
function hand(x,y,r,ang,open){X.save();X.translate(x,y);X.rotate((ang==null?-PI/2:ang)+PI/2);X.lineJoin='round';
 const f=open?[[-.74,-.74,.3],[-.27,-1.1,.33],[.24,-1.1,.33],[.7,-.78,.3]]:[[-.6,-.58,.33],[-.2,-.84,.35],[.22,-.84,.35],[.6,-.6,.32]];
 X.beginPath();f.forEach(q=>{X.moveTo((q[0]+q[2])*r,q[1]*r);X.arc(q[0]*r,q[1]*r,q[2]*r,0,TAU);});X.moveTo(r*1.34,r*.02);X.arc(r*1.02,r*.02,r*.32,0,TAU);X.moveTo(r,0);X.arc(0,0,r,0,TAU);
 X.strokeStyle=LN_SKIN;X.lineWidth=4.4;X.stroke();X.fillStyle=skinGrad(0,-r*.2,r*1.7);X.fill();
 X.strokeStyle=LN_SOFT;X.lineWidth=1.2;X.lineCap='round';X.beginPath();X.moveTo(-r*.45,-r*.15);X.quadraticCurveTo(0,r*.12,r*.5,-r*.2);X.stroke();X.restore();}
function torso(x,top,w,h){const hw=w/2,b=top+h;X.beginPath();X.moveTo(x-hw*.34,top-4);X.quadraticCurveTo(x-hw*.5,top+3,x-hw,top+9);X.quadraticCurveTo(x-hw*1.22,top+13,x-hw*1.18,top+26);X.lineTo(x-hw*.98,b);X.lineTo(x+hw*.98,b);X.lineTo(x+hw*1.18,top+26);X.quadraticCurveTo(x+hw*1.22,top+13,x+hw,top+9);X.quadraticCurveTo(x+hw*.5,top+3,x+hw*.34,top-4);X.closePath();
 const g=X.createLinearGradient(x-hw,0,x+hw,0);g.addColorStop(0,'#ffdfbd');g.addColorStop(.5,SKIN);g.addColorStop(1,'#dd9263');X.fillStyle=g;X.fill();X.strokeStyle=LN_SKIN;X.lineWidth=2.6;X.lineJoin='round';X.stroke();
 X.save();X.clip();const sg=X.createRadialGradient(x,top-2,2,x,top-2,hw*1.25);sg.addColorStop(0,'rgba(186,96,58,.6)');sg.addColorStop(1,'rgba(186,96,58,0)');X.fillStyle=sg;X.fillRect(x-w,top-6,w*2,h);X.restore();
 X.strokeStyle=LN_SOFT;X.lineWidth=1.4;X.lineCap='round';X.beginPath();X.moveTo(x-hw*.62,top+15);X.quadraticCurveTo(x-hw*.3,top+19,x-3,top+16);X.moveTo(x+hw*.62,top+15);X.quadraticCurveTo(x+hw*.3,top+19,x+3,top+16);X.stroke();}
function headPath(r){X.beginPath();X.moveTo(-r,-r*.08);X.bezierCurveTo(-r,-r*1.32,r,-r*1.32,r,-r*.08);X.bezierCurveTo(r*1.06,r*.62,r*.52,r*1.04,0,r*1.04);X.bezierCurveTo(-r*.52,r*1.04,-r*1.06,r*.62,-r,-r*.08);X.closePath();}
function headBase(x,y,r){X.save();X.translate(x,y);X.lineJoin='round';X.lineCap='round';
 rr(-r*.32,r*.6,r*.64,r*.72,5);X.fillStyle='#d68a5a';X.fill();
 for(const e of[-1,1]){ell(e*r,r*.12,r*.25,r*.33);X.fillStyle=SKIN;X.fill();X.strokeStyle=LN_SKIN;X.lineWidth=2.3;X.stroke();X.strokeStyle='rgba(186,96,58,.85)';X.lineWidth=1.5;X.beginPath();X.arc(e*r*1.02,r*.12,r*.13,e>0?-1.2:PI-1.4,e>0?1.4:PI+1.2);X.stroke();}
 headPath(r);X.fillStyle=skinGrad(0,0,r);X.fill();
 X.save();headPath(r);X.clip();
 let g=X.createLinearGradient(0,-r,0,-r*.05);g.addColorStop(0,'rgba(150,70,30,.55)');g.addColorStop(1,'rgba(150,70,30,0)');X.fillStyle=g;X.fillRect(-r*1.1,-r*1.1,r*2.2,r*1.1);
 g=X.createRadialGradient(0,r*1.3,r*.1,0,r*1.3,r*.95);g.addColorStop(0,'rgba(200,106,66,.6)');g.addColorStop(1,'rgba(200,106,66,0)');X.fillStyle=g;X.fillRect(-r*1.1,r*.3,r*2.2,r);
 X.restore();headPath(r);X.strokeStyle=LN_SKIN;X.lineWidth=2.6;X.stroke();X.restore();}
function hair(x,y,r,col,hi,v){X.save();X.translate(x,y);X.lineJoin='round';const n=7+(v%2);
 X.beginPath();X.moveTo(-r*1.04,r*.24);X.lineTo(-r*1.05,0);
 for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,am=PI+PI*(t0+t1)/2+Math.sin(i*2.3+v)*.1,ae=PI+PI*t1,len=r*(.3+((i*v+3)%4)*.08)*(i===0||i===n-1?.5:1),tr=r*1.04+len;
  X.quadraticCurveTo(Math.cos(am-.17)*(r*1.13+len*.4),Math.sin(am-.17)*(r*1.13+len*.4),Math.cos(am+.1)*tr,Math.sin(am+.1)*tr);
  X.quadraticCurveTo(Math.cos(ae)*(r*1.08+len*.22),Math.sin(ae)*(r*1.08+len*.22),Math.cos(ae)*r*1.05,Math.sin(ae)*r*1.05);}
 X.lineTo(r*1.04,r*.24);X.quadraticCurveTo(r*.98,-r*.3,r*.74,-r*.56);
 for(let j=0;j<5;j++){const tx=r*(.52-j*.26),ty=-r*(.4+(j%2)*.1),vx=tx-r*.14;X.quadraticCurveTo(tx+r*.12,ty-r*.12,tx,ty);X.quadraticCurveTo(tx-r*.03,-r*.58,vx,-r*.68);}
 X.quadraticCurveTo(-r*.98,-r*.36,-r*1.04,r*.24);X.closePath();
 const g=X.createLinearGradient(0,-r*1.5,0,r*.2);g.addColorStop(0,hi);g.addColorStop(.42,col);g.addColorStop(1,col);X.fillStyle=g;X.fill();X.strokeStyle='rgba(22,9,4,.9)';X.lineWidth=2.4;X.stroke();
 X.save();X.clip();X.lineCap='round';X.strokeStyle='rgba(255,255,255,.22)';X.lineWidth=r*.18;X.beginPath();X.arc(0,r*.2,r*1.02,PI*1.2,PI*1.6);X.stroke();X.strokeStyle='rgba(255,255,255,.14)';X.lineWidth=r*.08;X.beginPath();X.arc(0,r*.25,r*.82,PI*1.24,PI*1.52);X.stroke();
 X.strokeStyle='rgba(10,4,2,.35)';X.lineWidth=1.5;for(let j=0;j<4;j++){X.beginPath();X.moveTo(r*(.4-j*.26),-r*.5);X.quadraticCurveTo(r*(.5-j*.28),-r*.95,r*(.3-j*.3),-r*1.15);X.stroke();}X.restore();X.restore();}
function face(x,y,k,o){const m=o.mood,lk=o.look||[0,0],iris=o.iris||'#5a3216',irisHi=o.irisHi||'#a8642c',brow=o.brow||'#2b1a12',DK='#2a160c';X.save();X.translate(x,y);X.scale(k,k);X.lineCap='round';X.lineJoin='round';
 for(const s of[-1,1]){const g=X.createRadialGradient(s*17.5,9.5,0,s*17.5,9.5,9);g.addColorStop(0,'rgba(255,92,80,.62)');g.addColorStop(1,'rgba(255,92,80,0)');X.fillStyle=g;circ(s*17.5,9.5,9);X.fill();}
 if(o.freckles){X.fillStyle='rgba(170,80,40,.75)';[[-20,5.5],[-16,8.5],[-21,10.5],[-13,6],[16,8.5],[20,5.5],[21,10.5],[13,6],[-2,7],[2.5,8]].forEach(f=>{circ(f[0],f[1],1.05);X.fill();});}
 for(const s of[-1,1]){const ex=s*10.5,ey=.5;
  if(m==='laugh'){X.beginPath();X.arc(ex,ey+4.5,6.2,PI*1.08,PI*1.92);X.strokeStyle=DK;X.lineWidth=3.3;X.stroke();X.lineWidth=1.7;X.beginPath();X.moveTo(ex+s*5.8,ey+1.8);X.lineTo(ex+s*8.4,ey);X.stroke();}
  else if(o.blink){X.beginPath();X.moveTo(ex-6.2,ey+1.5);X.quadraticCurveTo(ex,ey+4.4,ex+6.2,ey+1.5);X.strokeStyle=DK;X.lineWidth=3;X.stroke();}
  else{const wow=m==='wow',ry=wow?9.6:8.4,px=ex+lk[0]*2+(m==='cheeky'?1:0),py=ey+.5+lk[1]*2.2,ir=wow?4.5:5.5;
   ell(ex,ey,7.1,ry);X.fillStyle='#fff';X.fill();X.save();ell(ex,ey,7.1,ry);X.clip();X.fillStyle='rgba(110,84,110,.3)';X.fillRect(ex-8,ey-ry,16,ry*.6);
   const ig=X.createRadialGradient(px,py+2,.5,px,py,ir);ig.addColorStop(0,irisHi);ig.addColorStop(1,iris);circ(px,py,ir);X.fillStyle=ig;X.fill();X.strokeStyle='rgba(30,12,4,.7)';X.lineWidth=1;X.stroke();
   X.fillStyle='#1a0c06';circ(px,py,ir*.52);X.fill();X.fillStyle='#fff';circ(px+1.9,py-2.3,1.9);X.fill();circ(px-1.9,py+2.1,.85);X.fill();X.restore();
   X.beginPath();X.ellipse(ex,ey,7.1,ry,0,PI*1.04,PI*1.96);X.strokeStyle=DK;X.lineWidth=2.9;X.stroke();X.beginPath();X.ellipse(ex,ey,7.1,ry,0,.3,PI-.3);X.strokeStyle='rgba(120,60,30,.55)';X.lineWidth=1.3;X.stroke();
   X.beginPath();X.moveTo(ex+s*6.7,ey-3.2);X.lineTo(ex+s*9.2,ey-5.4);X.strokeStyle=DK;X.lineWidth=1.8;X.stroke();}
  X.strokeStyle=brow;X.lineWidth=3;X.beginPath();
  if(m==='focus'){X.moveTo(s*17,-13);X.quadraticCurveTo(s*11,-13.5,s*5,-9.5);}
  else if(m==='cheeky'){X.moveTo(s*17,-11.5+(s>0?-3.5:1));X.quadraticCurveTo(s*11,-14+(s>0?-2:0),s*5,-10+(s>0?1:-3));}
  else if(m==='wow'||m==='laugh'||m==='throw'){X.moveTo(s*16.5,-13.5);X.quadraticCurveTo(s*10.5,-19,s*5,-14.5);}
  else{X.moveTo(s*16.5,-11);X.quadraticCurveTo(s*10.5,-15.5,s*5,-12);}
  X.stroke();}
 X.strokeStyle='rgba(168,82,44,.8)';X.lineWidth=1.7;X.beginPath();X.arc(0,6.2,2.5,.45,PI-.45);X.stroke();X.fillStyle='rgba(255,255,255,.55)';circ(-1,4.2,1.1);X.fill();
 if(m==='focus'){X.beginPath();X.moveTo(-7,14.5);X.quadraticCurveTo(0,17,7,13.5);X.strokeStyle='#6a1408';X.lineWidth=2.6;X.stroke();ell(5,17.2,3.8,3.2);X.fillStyle='#ff7b8a';X.fill();X.strokeStyle='#b83a4a';X.lineWidth=1.4;X.stroke();}
 else if(m==='wow'){ell(0,17,5,6.2);X.fillStyle='#7a1610';X.fill();X.strokeStyle='#6a1408';X.lineWidth=2.2;X.stroke();X.fillStyle='#ff7b8a';ell(0,20.5,3,2);X.fill();}
 else{const d=(m==='laugh'||m==='throw')?28:m==='cheeky'?21.5:24.5,mp=()=>{X.beginPath();X.moveTo(-11.5,11);X.quadraticCurveTo(0,13.5,11.5,11);X.quadraticCurveTo(9,d,0,d);X.quadraticCurveTo(-9,d,-11.5,11);X.closePath();};
  mp();const mg=X.createLinearGradient(0,11,0,d);mg.addColorStop(0,'#5a0e0a');mg.addColorStop(1,'#a3221a');X.fillStyle=mg;X.fill();X.save();X.clip();
  X.fillStyle='#fff';X.beginPath();X.moveTo(-12,10);X.lineTo(12,10);X.lineTo(11,15);X.quadraticCurveTo(0,17,-11,15);X.closePath();X.fill();
  const tg=X.createRadialGradient(0,d-2,1,0,d-2,8);tg.addColorStop(0,'#ff96a0');tg.addColorStop(1,'#f0606e');X.fillStyle=tg;ell(0,d-1.5,7,4.6);X.fill();X.restore();
  mp();X.strokeStyle='#6a1408';X.lineWidth=2.2;X.stroke();X.strokeStyle='rgba(186,96,58,.6)';X.lineWidth=1.4;X.beginPath();X.arc(0,d-3,7,.7,PI-.7);X.stroke();}
 X.restore();}

// ── CARDS: water-blue panel, lava ribbon, cream well, green "go" button ──
function cardBegin(cw,ch,o){o=o||{};const age=o.age==null?uiT:o.age,cx=(W-cw)/2,cy=o.cy==null?(HS-ch)/2+10:o.cy;
 X.fillStyle='rgba(4,18,44,'+((o.dim==null?.62:o.dim)*EZ.out(age/.25)).toFixed(3)+')';X.fillRect(0,0,W,HS);
 const sc=lerp(.78,1,EZ.back(age/.38));X.save();X.globalAlpha=clamp(age/.12,0,1);X.translate(W/2,cy+ch/2+(1-EZ.out(age/.3))*34);X.scale(sc,sc);X.translate(-W/2,-(cy+ch/2));
 rr(cx+2,cy+11,cw,ch,28);X.fillStyle='rgba(2,10,30,.42)';X.fill();
 rr(cx-5,cy-5,cw+10,ch+10,32);X.fillStyle=OUT;X.fill();
 rr(cx-2.5,cy-2.5,cw+5,ch+5,30);let g=X.createLinearGradient(0,cy,0,cy+ch);g.addColorStop(0,'#ffe45c');g.addColorStop(.5,'#ffa51a');g.addColorStop(1,'#f0480c');X.fillStyle=g;X.fill();
 rr(cx+3.5,cy+3.5,cw-7,ch-7,24);g=X.createLinearGradient(0,cy,0,cy+ch);g.addColorStop(0,'#4dbcff');g.addColorStop(.55,'#238be8');g.addColorStop(1,'#145cc0');X.fillStyle=g;X.fill();X.lineWidth=2;X.strokeStyle='rgba(6,30,80,.6)';X.stroke();
 X.save();rr(cx+3.5,cy+3.5,cw-7,ch-7,24);X.clip();
 X.fillStyle='rgba(255,255,255,.11)';X.beginPath();X.moveTo(cx,cy+ch*.24);for(let x=cx;x<=cx+cw+10;x+=10)X.lineTo(x,cy+ch*.24+Math.sin(x*.045+NOW*1.2)*6);X.lineTo(cx+cw,cy);X.lineTo(cx,cy);X.closePath();X.fill();
 for(let i=0;i<9;i++){const bx=cx+8+((i*71)%(cw-16)),by=cy+ch-((NOW*14*(1+i%3*.3)+i*53)%(ch+20)),br=3+(i%4)*2;circ(bx,by,br);X.fillStyle='rgba(255,255,255,.12)';X.fill();X.strokeStyle='rgba(255,255,255,.42)';X.lineWidth=1.3;X.stroke();}
 X.restore();
 if(o.title){const rw=o.rw||232,rx=W/2-rw/2,ry=cy-24,k=lerp(.6,1,EZ.back((age-.1)/.4));X.save();X.translate(W/2,ry+24);X.scale(k,k);X.translate(-W/2,-(ry+24));X.lineJoin='round';
  for(const s of[-1,1]){X.beginPath();X.moveTo(W/2+s*(rw/2-8),ry+11);X.lineTo(W/2+s*(rw/2+17),ry+11);X.lineTo(W/2+s*(rw/2+9),ry+30);X.lineTo(W/2+s*(rw/2+17),ry+49);X.lineTo(W/2+s*(rw/2-8),ry+49);X.closePath();X.fillStyle='#b82c08';X.fill();X.lineWidth=2.5;X.strokeStyle=OUT;X.stroke();}
  rr(rx,ry,rw,48,14);g=X.createLinearGradient(0,ry,0,ry+48);g.addColorStop(0,'#ffa22e');g.addColorStop(1,'#ea3f0c');X.fillStyle=g;X.fill();X.lineWidth=2.5;X.strokeStyle=OUT;X.stroke();
  X.fillStyle='rgba(255,255,255,.3)';rr(rx+10,ry+5,rw-20,10,5);X.fill();label(o.title,W/2,ry+25.5,o.ts||23,'#fff',OUT,5);X.restore();}
 return{cx,cy,age};}
function well(x,y,w,h){rr(x,y+2.5,w,h,18);X.fillStyle='rgba(4,30,80,.4)';X.fill();rr(x,y,w,h,18);const g=X.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#fffdf4');g.addColorStop(1,'#ffecc0');X.fillStyle=g;X.fill();X.lineWidth=2.5;X.strokeStyle=OUT;X.stroke();}
function cardText(t,y,size,col){label(t,W/2,y,size||14.5,col||'#fff','rgba(6,34,84,.85)',3.6,800);}
function button(bx,by,bw,bh,t,act,o){o=o||{};const down=(press&&press.key===uiKey)||NOW<pressUntil,pu=down?0:Math.sin(NOW*4)*.014,cx=bx+bw/2,cy=by+bh/2,dy=down?4:0;
 X.save();X.translate(cx,cy);X.scale(1+pu,1+pu);X.translate(-cx,-cy);
 if(o.halo&&!down){const p=(NOW*.75)%1;X.save();X.globalAlpha=(1-p)*.6;rr(bx-p*16,by-p*16,bw+p*32,bh+p*32+5,(bh+p*32)/2);X.lineWidth=4;X.strokeStyle='#eaffb0';X.stroke();X.restore();}
 rr(bx,by+5.5,bw,bh,bh/2);X.fillStyle='#12701f';X.fill();X.lineWidth=2.5;X.strokeStyle='#0b3d12';X.stroke();
 rr(bx,by+dy,bw,bh,bh/2);const g=X.createLinearGradient(0,by,0,by+bh);g.addColorStop(0,down?'#5fcc3c':'#8cec4e');g.addColorStop(1,down?'#1f9a2c':'#27b637');X.fillStyle=g;X.fill();X.stroke();
 X.fillStyle='rgba(255,255,255,.4)';rr(bx+14,by+dy+5,bw-28,bh*.26,bh*.13);X.fill();
 const fz=o.size||19;X.font=fnt(900,fz);const tw=X.measureText(t).width,iw=o.icon?fz*1.25:0,x0=cx-(tw+iw)/2;
 if(o.icon){const ix=x0+fz*.45,iy=cy+dy+1,s=fz*.5;X.beginPath();X.moveTo(ix-s*.55,iy-s*.8);X.lineTo(ix+s*.85,iy);X.lineTo(ix-s*.55,iy+s*.8);X.closePath();X.lineJoin='round';X.lineWidth=4.5;X.strokeStyle='#0b3d12';X.stroke();X.fillStyle='#fff';X.fill();}
 label(t,x0+iw+tw/2,cy+dy+1,fz,'#fff','#0b3d12',4.5);X.restore();
 card={x:bx-8,y:by-8,w:bw+16,h:bh+21,act,key:uiKey};}
function drawIntroCard(){const cw=330,ch=300,{cx,cy,age}=cardBegin(cw,ch,{title:'Noah’s bath toys'});
 well(cx+20,cy+42,cw-40,112);const n=currentToys.length,gap=90,sx2=W/2-(n-1)*gap/2;currentToys.forEach((em,i)=>cardToy(em,sx2+i*gap,cy+90,56,age,.2+i*.12));
 cardText('Splash them into the volcano!',cy+178,15.5);cardText('A new toy joins every round',cy+200,12.5,'#d6efff');
 button((W-232)/2,cy+ch-78,232,56,'Let’s splash!',()=>{startRound(false);state='play';lastNow=performance.now();},{size:21,halo:1});cardEnd();}
function drawNewToyCard(){const cw=326,ch=366,{cx,cy,age}=cardBegin(cw,ch,{title:'New toy!'});
 well(cx+20,cy+42,cw-40,128);X.save();rr(cx+22,cy+44,cw-44,124,16);X.clip();sunburst(W/2,cy+106,200);X.restore();
 cardToy(newToyEm,W/2,cy+100,78,age,.3);
 const nm=TOYNAME[newToyEm]||'New toy';label(nm.charAt(0)+nm.slice(1).toLowerCase(),W/2,cy+195,24,'#fff',OUT,5);cardText('joins the tub for round '+round+'!',cy+219,13.5,'#d6efff');
 rr(cx+20,cy+236,cw-40,38,19);X.fillStyle='rgba(4,30,80,.4)';X.fill();
 const n=currentToys.length,gap=Math.min(27,(cw-70)/n),sx2=W/2-(n-1)*gap/2,ry=cy+255;
 currentToys.forEach((em,i)=>{const k=EZ.back((age-.5-i*.04)/.3);if(k<=0)return;if(i===n-1){const pu=(Math.sin(NOW*6)+1)/2;X.save();X.globalAlpha=.5+pu*.4;X.fillStyle='#ffd23f';circ(sx2+i*gap,ry,14);X.fill();X.restore();}X.save();X.translate(sx2+i*gap,ry);X.scale(k,k);paintToy(em,19);X.restore();});
 button((W-214)/2,cy+ch-76,214,56,'Splash on!',()=>{startRound(true);state='play';lastNow=performance.now();},{size:21,halo:1});cardEnd();}
function drawPauseCard(){const cw=284,ch=186,{cy}=cardBegin(cw,ch,{title:'Paused',rw:190});cardText('Round '+round+'  ·  Score '+score,cy+62,15);
 button((W-204)/2,cy+ch-80,204,56,'Resume',()=>{paused=false;lastNow=performance.now();acc=0;},{icon:1,size:21});cardEnd();}
function drawResultCard(win){const age=win?uiT-1.75:uiT;if(age<0){card=null;return;}
 if(win){const cw=322,ch=328,{cx,cy}=cardBegin(cw,ch,{age,title:'You did it!'});
  well(cx+20,cy+42,cw-40,122);X.save();rr(cx+22,cy+44,cw-44,118,16);X.clip();sunburst(W/2,cy+104,200);X.restore();
  const k=EZ.elastic((age-.15)/.8);X.save();X.translate(W/2,cy+100);X.scale(k,k);X.rotate(Math.sin(NOW*3)*.06);icoTrophy(0,6,2);X.restore();
  [[-98,70,.3],[98,70,.42],[-70,126,.5],[70,126,.58]].forEach(q=>{const sk=EZ.back((age-q[2])/.35);if(sk>0){star(W/2+q[0],cy+q[1],9*sk,4*sk,NOW*1.5);X.fillStyle='#ffd23f';X.fill();X.lineWidth=1.6;X.strokeStyle=OUT;X.stroke();}});
  cardText('All 10 rounds cleared!',cy+190,16);cardText('Score '+score+'   ·   Best combo x'+bestCombo,cy+213,13.5,'#d6efff');
  button((W-220)/2,cy+ch-80,220,56,'Play again',()=>startGame(),{icon:1,size:21,halo:1});cardEnd();}
 else{const cw=322,ch=292,{cx,cy}=cardBegin(cw,ch,{age,title:'So close!'});
  well(cx+20,cy+42,cw-40,70);const n=need,gap=Math.min(34,(cw-80)/Math.max(n,1)),x0=W/2-(n-1)*gap/2;
  for(let i=0;i<n;i++){const o=objs[i],lit=!o||o.st==='gone',kk=EZ.back((age-.25-i*.05)/.3);if(kk<=0)continue;X.save();X.translate(x0+i*gap,cy+77);X.scale(kk,kk);if(!lit)X.globalAlpha=.28;paintToy(currentToys[i],lit?25:21);X.restore();}
  cardText('You splashed '+collected+' of '+need+' toys!',cy+138,15.5);cardText('Score '+score+'. Let’s try round '+round+' again!',cy+160,13,'#d6efff');
  button((W-220)/2,cy+ch-80,220,56,'Try again',()=>{startRound(false);state='play';lastNow=performance.now();},{icon:1,size:21,halo:1});cardEnd();}}

// ── FRAME ──
function sim(){
 if(state==='menu'){wave+=1.1;volP+=.05;if(flash>0)flash-=.04;if(shake>0)shake*=.82;if(Math.random()<.09)lavaSpit(1,.2);fxStep();}
 else if(state==='play')step(1/60);
 else{wave+=1.1;volP+=.05;if(shake>0)shake*=.82;if(flash>0)flash-=.04;if(bannerT>0)bannerT-=1/60;armAng+=((idleAng)-armAng)*0.1;fxStep();}
 if(state!=='menu')updateEjecta();
 if(state==='erupt'||state==='win')eruptTick();}
function draw(){X.setTransform(KS*DPR,0,0,KS*DPR,0,0);X.globalAlpha=1;X.fillStyle='#17609c';X.fillRect(0,0,W,HS);
 X.save();const pz=1+EZ.in(punch)*.05,sk=shake>.3;if(sk||pz>1.001){const px=W/2,py=OY+290;X.translate(px+(sk?(Math.random()-.5)*shake:0),py+(sk?(Math.random()-.5)*shake:0));X.scale(pz,pz);X.translate(-px,-py);}
 backdrop();X.save();X.translate(0,OY);
 tub();water();volcano();maxBlocker();kid();if(state==='menu')menuToys();drawObjs();drawRings();tutorial();chargeGuide();drawParts();eruptFX();drawEjecta();drawBanner();drawPops();
 X.restore();
 if(build>0){const g=X.createRadialGradient(W/2,OY+200,90,W/2,OY+200,520);g.addColorStop(0,'rgba(20,6,0,0)');g.addColorStop(1,'rgba(20,6,0,'+(build*.5).toFixed(3)+')');X.fillStyle=g;X.fillRect(0,0,W,HS);}
 if(state!=='menu')hud();X.restore();
 if(flash>0){X.save();X.globalAlpha=Math.min(1,flash);X.fillStyle=flashCol;X.fillRect(0,0,W,HS);X.restore();}
 overlay();drawMute();if(state==='play'||paused)drawPauseBtn();}
function loop(now){
 try{
  let dtr=(now-lastNow)/1000||0;lastNow=now;if(dtr>.25||dtr<0)dtr=0;
  if(dtr>0&&dtr<.1){frameMs+=(dtr*1000-frameMs)*.05;if(frameMs>25){if(++slowN>150&&QCAP>1.5){QCAP-=.5;slowN=0;frameMs=16;resize();}}else if(slowN>0)slowN--;}
  const dt=Math.abs(dtr-1/60)<.0045?1/60:Math.min(dtr,.05);
  if(!paused){tickLife(dt);if(freeze>0)freeze-=dt*60;else{acc+=dt;let n=0;while(acc>=1/60-1e-4&&n<3){sim();acc-=1/60;n++;if(freeze>0)break;}if(acc>.1)acc=0;}}
  else{NOW+=dt;uiT+=dt;}
  draw();
 }catch(err){if(!loop.bad){loop.bad=true;console.error(err);}}
 requestAnimationFrame(loop);
}

// ── RESPONSIVE: fill the phone, respect notch + home bar, cap pixels so old iPhones hold 60fps ──
function resize(){const vw=window.innerWidth,vh=window.innerHeight;let cw,ch;
 if(vh/vw>=H/W){cw=vw;ch=vh;HS=W*vh/vw;}else{ch=vh;cw=vh*W/H;HS=H;}
 KS=cw/W;DPR=Math.max(1,Math.min(window.devicePixelRatio||1,QCAP,Math.sqrt(2.7e6/(cw*ch))));OY=Math.round((HS-H)*.62);
 const sp=document.getElementById('safe'),sb=document.getElementById('safeb');SAFE=sp?sp.offsetHeight/KS:0;SAFEB=sb?sb.offsetHeight/KS:0;DY=Math.max(0,Math.round(SAFE+96-(OY+70)));
 const wEl=document.getElementById('w');wEl.style.width=cw+'px';wEl.style.height=ch+'px';wEl.classList.toggle('boxed',HS===H&&cw<vw-4);
 cv.style.width=cw+'px';cv.style.height=ch+'px';cv.width=Math.round(cw*DPR);cv.height=Math.round(ch*DPR);wallCache=null;}
window.addEventListener('resize',resize);
buildToys();resize();
requestAnimationFrame(loop);
