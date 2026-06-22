const cv=document.getElementById('c'),X=cv.getContext('2d'),W=380,H=600;
const song=document.getElementById('song');
const CX=190,CY=176,G=0.22,T=58,CHARGE_RATE=0.55,CHARGE_MAX=1.7;
const windAng=-1.45,swingEnd=1.5,idleAng=0.9,swingDur=0.32;
const BASE=['🦆','⛵','🦕'],NEWBY={2:'🚚',3:'🚗',4:'🐙',5:'🪣',6:'🦈',7:'🐬',8:'🐸',9:'🦸',10:'🚀'};
const TOYNAME={'🚚':'Monster Truck','🚗':'Car','🐙':'Octopus','🪣':'Pail','🦈':'Shark','🐬':'Dolphin','🐸':'Froggy','🦸':'Action Figure','🚀':'Rocket'};
const DIFF=[{cr:34,drift:0,blk:0,time:30},{cr:33,drift:.2,blk:0,time:32},{cr:31,drift:.35,blk:0,time:35},{cr:29,drift:.5,blk:1.2,time:38},{cr:27,drift:.65,blk:1.6,time:41},{cr:25,drift:.8,blk:2.0,time:44},{cr:23,drift:.95,blk:2.3,time:47},{cr:21,drift:1.1,blk:2.6,time:50},{cr:19,drift:1.25,blk:2.9,time:53},{cr:17,drift:1.4,blk:3.2,time:56}];
const diff=()=>DIFF[Math.min(round-1,9)];
let craterR=30,score=0,round=1,collected=0,need=0,combo=0,bestCombo=0;
let objs=[],parts=[],eParts=[],rings=[],ejecta=[],collectedToys=[],currentToys=[],landed=[],state='menu';
let charging=null,pendingLaunch=null,armAng=idleAng,swingT=0,swingHit=false,splashSide=1;
let newToyEm=null,bannerT=0,banner='',newToyT=0;
let wave=0,volP=0,shake=0,flash=0,flashCol='#fff',eruptT=0,hintT=0;
let blk={on:false,x:190,dir:1,spd:0,y:292};
let timeLeft=30,roundTime=30,hbTimer=0,lastNow=0;

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
function P(e){const r=cv.getBoundingClientRect(),sx=W/r.width,sy=H/r.height;return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};}
function down(e){initAudio();const p=P(e);
 if(dist(p.x,p.y,W-22,46)<20){muted=!muted;if(song){if(muted)song.pause();else song.play().catch(()=>{});}return;}
 if(state!=='play'){if(card&&p.x>card.x&&p.x<card.x+card.w&&p.y>card.y&&p.y<card.y+card.h)card.act();return;}
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
  X.rotate(e.rot);X.font='34px sans-serif';X.textAlign='center';X.textBaseline='middle';X.shadowColor='rgba(0,0,0,.35)';X.shadowBlur=5;X.fillText(e.em,0,0);X.restore();});}
function splash(x,y,col,n){for(let i=0;i<n;i++){const a=-1.57+(Math.random()-.5)*2.4,s=2+Math.random()*6;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:1,r:3+Math.random()*5,col});}}
function pop(x,y,t,c){const e=document.createElement('div');e.className='fp';e.textContent=t;e.style.color=c;
 const wr=document.getElementById('w'),r=cv.getBoundingClientRect(),wb=wr.getBoundingClientRect(),sx=r.width/W,sy=r.height/H;
 e.style.left=(x*sx+r.left-wb.left-22)+'px';e.style.top=(y*sy+r.top-wb.top-12)+'px';wr.appendChild(e);setTimeout(()=>e.remove(),1000);}
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

// ── DRAW ──
function tile(){X.fillStyle='#3d8ecf';X.fillRect(0,0,W,H);const t=42;
 for(let x=0;x<W;x+=t)for(let y=0;y<H;y+=t){X.fillStyle='rgba(255,255,255,.06)';X.fillRect(x+1,y+1,t-2,t-2);}
 X.strokeStyle='rgba(255,255,255,.16)';X.lineWidth=1;
 for(let x=0;x<=W;x+=t){X.beginPath();X.moveTo(x,0);X.lineTo(x,H);X.stroke();}for(let y=0;y<=H;y+=t){X.beginPath();X.moveTo(0,y);X.lineTo(W,y);X.stroke();}
 X.fillStyle='#b8dff5';X.beginPath();X.roundRect(12,12,78,92,4);X.fill();X.fillStyle='rgba(255,255,255,.4)';X.fillRect(16,16,70,42);
 X.strokeStyle='#7a4f10';X.lineWidth=4;X.beginPath();X.roundRect(12,12,78,92,4);X.stroke();X.lineWidth=3;X.beginPath();X.moveTo(51,12);X.lineTo(51,104);X.stroke();X.beginPath();X.moveTo(12,58);X.lineTo(90,58);X.stroke();
 const sx=30,sy=32;X.fillStyle='#ffe033';X.beginPath();X.arc(sx,sy,14,0,6.28);X.fill();X.strokeStyle='#d4a800';X.lineWidth=2.5;X.stroke();
 for(let i=0;i<8;i++){const a=i*.785+wave*.008;X.beginPath();X.moveTo(sx+Math.cos(a)*17,sy+Math.sin(a)*17);X.lineTo(sx+Math.cos(a)*22,sy+Math.sin(a)*22);X.strokeStyle='#ffcc00';X.lineWidth=2;X.stroke();}
 X.fillStyle='#2a1800';X.beginPath();X.arc(sx-4,sy-2,2,0,6.28);X.fill();X.beginPath();X.arc(sx+4,sy-2,2,0,6.28);X.fill();X.beginPath();X.arc(sx,sy+3,4,.1,3.04);X.fill();
 ['#e03030','#3355ee'].forEach((c,i)=>{X.fillStyle='#b0b0c4';X.beginPath();X.roundRect(W-26,10+i*46,18,5,2);X.fill();X.fillStyle=c;X.beginPath();X.roundRect(W-24,15+i*46,14,40,3);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=2.5;X.stroke();X.fillStyle='rgba(255,255,255,.3)';X.fillRect(W-24,22+i*46,14,5);});
 X.fillStyle='#5a2a8a';X.beginPath();X.roundRect(20,107,12,9,3);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=2;X.stroke();
 X.fillStyle='#8844cc';X.beginPath();X.roundRect(13,115,26,50,7);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=2.5;X.stroke();
 X.fillStyle='#fff';X.beginPath();X.roundRect(16,128,20,26,3);X.fill();
 X.fillStyle='#3a9c3a';X.beginPath();X.ellipse(26,143,6,4.5,0,0,6.28);X.fill();X.beginPath();X.arc(31,139,3,0,6.28);X.fill();X.fillRect(20,142,2,4);X.fillRect(30,144,2,4);
 X.fillStyle='#1a0a00';X.beginPath();X.arc(32,138,.9,0,6.28);X.fill();
 X.fillStyle='rgba(255,255,255,.6)';X.beginPath();X.arc(41,110,2.2,0,6.28);X.fill();X.beginPath();X.arc(45,102,1.5,0,6.28);X.fill();X.beginPath();X.arc(39,99,1.1,0,6.28);X.fill();
}
function tub(){X.fillStyle='#eeeae0';X.beginPath();X.moveTo(28,196);X.lineTo(352,196);X.lineTo(372,556);X.lineTo(8,556);X.closePath();X.fill();X.strokeStyle='#1a0a00';X.lineWidth=4.5;X.stroke();
 X.fillStyle='#e2ddd2';X.beginPath();X.moveTo(36,202);X.lineTo(344,202);X.lineTo(362,548);X.lineTo(18,548);X.closePath();X.fill();
 X.fillStyle='rgba(255,255,255,.8)';X.beginPath();X.roundRect(26,192,326,12,6);X.fill();
 X.fillStyle='#c8c8d8';X.beginPath();X.roundRect(W/2-22,188,44,14,6);X.fill();X.beginPath();X.arc(W/2-10,188,7,3.14,0);X.fill();X.beginPath();X.arc(W/2+10,188,7,3.14,0);X.fill();X.strokeStyle='#8888aa';X.lineWidth=2.5;X.beginPath();X.roundRect(W/2-22,188,44,14,6);X.stroke();}
function water(top){X.save();X.beginPath();X.moveTo(36,202);X.lineTo(344,202);X.lineTo(362,548);X.lineTo(18,548);X.closePath();X.clip();
 if(!top){const wg=X.createLinearGradient(0,248,0,556);wg.addColorStop(0,'rgba(74,178,250,.72)');wg.addColorStop(1,'rgba(20,92,172,.82)');X.fillStyle=wg;}else X.fillStyle='rgba(60,160,240,.42)';
 X.beginPath();X.moveTo(14,248+(top?16:0));
 for(let x=14;x<=W-14;x+=5)X.lineTo(x,248+(top?16:0)+Math.sin((x+wave+(top?20:0))*.088)*4.5+Math.sin((x-wave*.8)*.12)*2.4);
 X.lineTo(W-14,556);X.lineTo(14,556);X.closePath();X.fill();
 if(!top){X.fillStyle='rgba(190,235,255,.32)';X.beginPath();X.moveTo(14,246);for(let x=14;x<=W-14;x+=5)X.lineTo(x,246+Math.sin((x+wave*1.4)*.1)*3);X.lineTo(W-14,278);X.lineTo(14,278);X.closePath();X.fill();
  for(let i=0;i<9;i++){const bx=32+i*36+Math.sin(wave*.04+i)*10,by=250+Math.sin(wave*.06+i*1.5)*4;X.fillStyle='rgba(255,255,255,.6)';X.beginPath();X.ellipse(bx,by,6+i%3*2,3,0,0,6.28);X.fill();X.strokeStyle='rgba(255,255,255,.35)';X.lineWidth=1;X.stroke();}}X.restore();}
function conePath(vy){X.beginPath();X.moveTo(CX-86,vy+128);X.lineTo(CX-58,vy+58);X.lineTo(CX-34,vy+6);X.lineTo(CX-craterR-2,vy-58);X.lineTo(CX-craterR,vy-70);X.lineTo(CX,vy-80);X.lineTo(CX+craterR,vy-70);X.lineTo(CX+craterR+2,vy-58);X.lineTo(CX+34,vy+6);X.lineTo(CX+58,vy+58);X.lineTo(CX+86,vy+128);X.closePath();}
function volcano(){const vy=196,fp=collected/Math.max(need,1),pl=Math.sin(volP)*.5+.5;
 X.save();X.globalAlpha=(.16+pl*.14)+fp*.3;const rg=X.createRadialGradient(CX,CY,0,CX,CY,craterR*(3+fp*1.5));rg.addColorStop(0,fp>.6?'#ff3000':'#ff9a00');rg.addColorStop(1,'rgba(255,40,0,0)');X.fillStyle=rg;X.beginPath();X.arc(CX,CY,craterR*(3+fp*1.5),0,6.28);X.fill();X.restore();
 const vg=X.createLinearGradient(CX-86,0,CX+86,0);vg.addColorStop(0,'#3a2410');vg.addColorStop(.45,'#1e1208');vg.addColorStop(1,'#0e0703');X.fillStyle=vg;conePath(vy);X.fill();X.strokeStyle='#0a0804';X.lineWidth=4;X.stroke();
 X.fillStyle='rgba(20,12,4,.5)';[[-50,vy+40,13,7,.2],[40,vy+36,11,6,-.15],[-60,vy+82,11,6,.3],[52,vy+76,10,5,-.1]].forEach(r=>{X.save();X.translate(CX+r[0],r[1]);X.rotate(r[4]);X.beginPath();X.ellipse(0,0,r[2],r[3],0,0,6.28);X.fill();X.restore();});
 const bottom=vy+120,topFull=CY-2,lvl=bottom-fp*(bottom-topFull);
 if(fp>0){X.save();conePath(vy);X.clip();
   const lg=X.createLinearGradient(0,lvl,0,bottom);lg.addColorStop(0,'#ffb000');lg.addColorStop(.5,'#ff5500');lg.addColorStop(1,'#aa1500');X.fillStyle=lg;X.fillRect(CX-90,lvl,180,bottom-lvl+8);
   X.fillStyle='#ffe066';X.beginPath();X.moveTo(CX-90,lvl);for(let x=-90;x<=90;x+=7)X.lineTo(CX+x,lvl+Math.sin((x+wave*2.2)*.16)*2.6);X.lineTo(CX+90,lvl+7);X.lineTo(CX-90,lvl+7);X.closePath();X.fill();
   for(let i=0;i<4;i++){const bx=CX-40+i*26+Math.sin(wave*.06+i)*8,by=lvl+10+((wave*1.3+i*30)%40);X.fillStyle='rgba(255,210,80,.7)';X.beginPath();X.arc(bx,by,2+i%2,0,6.28);X.fill();}
   X.restore();}
 ['#ff3300','#ff6600','#ffaa00'].forEach((c,i)=>{const lx=CX-26+i*26,ty=vy-26+i*14,by=ty+14+pl*6+fp*10;X.fillStyle=c;X.beginPath();X.moveTo(lx-4,ty);X.lineTo(lx+4,ty);X.quadraticCurveTo(lx+3,by+6,lx,by+10);X.quadraticCurveTo(lx-3,by+6,lx-4,ty);X.closePath();X.fill();});
 const cg=X.createRadialGradient(CX,CY-3,2,CX,CY,craterR);cg.addColorStop(0,fp>.55?'#ffe066':'#ff8a1a');cg.addColorStop(.5,fp>.55?'#ff3000':'#9a2400');cg.addColorStop(1,'#2a0600');X.fillStyle=cg;X.beginPath();X.ellipse(CX,CY,craterR,craterR*.4,0,0,6.28);X.fill();
 X.strokeStyle='rgba(255,'+(~~(150+pl*95-fp*80))+',0,'+(.8+pl*.2)+')';X.lineWidth=3.5+fp*1.5;X.beginPath();X.ellipse(CX,CY,craterR+1,craterR*.42,0,0,6.28);X.stroke();
 X.strokeStyle='rgba(255,220,0,.4)';X.lineWidth=1.5;X.setLineDash([4,4]);X.beginPath();X.ellipse(CX,CY,craterR+8,craterR*.5+4,0,0,6.28);X.stroke();X.setLineDash([]);
 X.fillStyle='rgba(0,0,0,.55)';X.beginPath();X.roundRect(CX-26,vy+58,52,20,6);X.fill();
 X.strokeStyle=fp>=.99?'#ff4040':'rgba(255,180,60,.7)';X.lineWidth=2;X.stroke();
 X.fillStyle=fp>=.99?'#ff6a6a':'#ffd23f';X.font='800 13px sans-serif';X.textAlign='center';X.fillText(fp>=.99?'FULL!':(collected+'/'+need),CX,vy+72);
 [[CX-18,vy-28],[CX+18,vy-28]].forEach(([ex,ey])=>{X.fillStyle='#fff';X.beginPath();X.ellipse(ex,ey,10,11,0,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=2.5;X.stroke();X.fillStyle='#1a0a00';X.beginPath();X.arc(ex+1,ey-2-pl*2,5,0,6.28);X.fill();X.fillStyle='#fff';X.beginPath();X.arc(ex+3,ey-4-pl*2,1.8,0,6.28);X.fill();});
 X.strokeStyle='#ff6600';X.lineWidth=2.5;if(fp>.6){X.fillStyle='#880000';X.beginPath();X.arc(CX,vy-8,11,0,3.14);X.fill();X.stroke();X.fillStyle='#fff';X.fillRect(CX-9,vy-8,6,5);X.fillRect(CX-1,vy-8,5,5);X.fillRect(CX+5,vy-8,5,5);}else{X.beginPath();X.moveTo(CX-9,vy-6);X.quadraticCurveTo(CX,vy-4,CX+9,vy-6);X.stroke();}
 const steamN=fp>.5?5:3;if(state==='play')for(let i=0;i<steamN;i++){const ag=(wave*.7+i*28)%80,p=ag/80;X.save();X.globalAlpha=(1-p)*.36;X.fillStyle=fp>.6?'rgba(255,90,30,.7)':'rgba(255,180,60,.7)';X.beginPath();X.arc(CX+(i-2)*9+Math.sin(p*5)*5,CY-12-p*(32+fp*20),4+p*9,0,6.28);X.fill();X.restore();}
}
function drawHairball(x,y,r,sq){const s1=1+sq*.3,s2=1-sq*.2;X.save();X.translate(x,y);X.scale(s1,s2);
 X.strokeStyle='#6b4423';X.lineWidth=2.5;X.lineCap='round';for(let i=0;i<16;i++){const a=i/16*6.28+wave*.02;const r2=r+5+Math.sin(wave*.18+i)*3;X.beginPath();X.moveTo(Math.cos(a)*(r-3),Math.sin(a)*(r-3));X.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);X.stroke();}
 X.fillStyle='#8a5a2a';X.beginPath();X.arc(0,0,r,0,6.28);X.fill();X.strokeStyle='#5a3a18';X.lineWidth=2;X.stroke();
 X.strokeStyle='#6b4423';X.lineWidth=1.4;for(let i=0;i<5;i++){X.beginPath();X.arc(2,-2,r-5-i*2,.6,2.4);X.stroke();}
 [[-5,-3],[5,-3]].forEach(([ex,ey])=>{X.fillStyle='#fff';X.beginPath();X.arc(ex,ey,4.5,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=1.2;X.stroke();X.fillStyle='#1a0a00';X.beginPath();X.arc(ex+1,ey,2.2,0,6.28);X.fill();});
 X.strokeStyle='#3a2410';X.lineWidth=1.8;X.beginPath();X.arc(0,4,4,.1,3.04);X.stroke();X.restore();}
function drawRings(){rings.forEach(r=>{X.save();X.globalAlpha=Math.max(0,r.life)*(r.big?.6:.55);X.strokeStyle=r.big?'#ffffff':'#dff4ff';X.lineWidth=r.big?6:2;X.beginPath();X.ellipse(r.x,r.y,r.r,r.r*(r.big?.55:.4),0,0,6.28);X.stroke();X.restore();});}
function drawObjs(){objs.forEach(o=>{if(o.st==='gone')return;const fly=o.st==='fly',held=(charging&&charging.o===o)||(pendingLaunch&&pendingLaunch.o===o),by=o.y+((fly||held)?0:Math.sin(wave*.045+o.bob)*3.2);
 const canGrab=o.st==='float'&&!charging&&!pendingLaunch&&swingT<=0;
 if(canGrab){X.save();X.globalAlpha=.4+Math.sin(wave*.08+o.bob)*.18;X.strokeStyle=o.hb?'#ffd23f':(o.isNew&&newToyT>0?'#ffcc00':'#ffe066');X.lineWidth=o.hb?3.5:3;X.setLineDash([5,5]);X.beginPath();X.arc(o.x,by,o.hb?28:27,0,6.28);X.stroke();X.setLineDash([]);X.restore();}
 if(o.hb){drawHairball(o.x,by,o.r,o.sq||0);if(canGrab){X.fillStyle='#ffd23f';X.font='800 11px sans-serif';X.textAlign='center';X.fillText('BONUS! +5s',o.x,by-32);X.fillStyle='#fff';X.font='700 9px sans-serif';X.fillText('('+Math.ceil(o.life)+'s)',o.x,by+34);}
 }else{const sq=o.sq||0,s1=1+sq*.4,s2=1-sq*.3;X.save();X.translate(o.x,by);X.rotate(o.rot||0);X.scale(s1,s2);X.shadowColor='rgba(0,0,0,.4)';X.shadowBlur=6;X.font='30px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText(o.em,0,0);X.restore();}
 if(o.isNew&&newToyT>0){const pu=(Math.sin(wave*.2)+1)/2;X.save();X.globalAlpha=.55+pu*.45;X.strokeStyle='#ffcc00';X.lineWidth=3;X.beginPath();X.arc(o.x,by,30,0,6.28);X.stroke();X.fillStyle='#ffcc00';X.font='800 12px sans-serif';X.textAlign='center';X.fillText('NEW!',o.x,by-34);X.restore();}
 if(!fly){X.save();X.globalAlpha=.2;X.strokeStyle='#fff';X.lineWidth=1.5;X.beginPath();X.ellipse(o.x,by+13,18,4,0,0,6.28);X.stroke();X.restore();}
});}
function maxBlocker(){if(!blk.on)return;const mx=blk.x,hY=blk.y,headY=blk.y+38,wob=Math.sin(wave*.22)*2;
 X.save();X.globalAlpha=.22;X.fillStyle='#bfeaff';X.beginPath();X.ellipse(mx,headY+44,30,9,0,0,6.28);X.fill();X.restore();
 X.fillStyle='#bf7448';X.beginPath();X.roundRect(mx-20,headY+12,40,58,9);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=3.5;X.stroke();
 X.strokeStyle='#bf7448';X.lineWidth=12;X.lineCap='round';
 X.beginPath();X.moveTo(mx-15,headY+16);X.lineTo(mx-14,hY+wob);X.stroke();X.beginPath();X.moveTo(mx+15,headY+16);X.lineTo(mx+14,hY-wob);X.stroke();
 [[-14,hY+wob],[14,hY-wob]].forEach(([dx,dy])=>{X.fillStyle='#d08858';X.beginPath();X.arc(mx+dx,dy,9,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=2;X.stroke();});
 X.fillStyle='#bf7448';X.beginPath();X.arc(mx,headY,22,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=3.5;X.stroke();
 [-23,23].forEach(ex=>{X.fillStyle='#bf7448';X.beginPath();X.arc(mx+ex,headY,6,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=2.5;X.stroke();});
 X.fillStyle='#c8501a';X.beginPath();X.arc(mx,headY-3,20,3.14,0);X.fill();
 [[-9,-19,6,11,-.2],[2,-22,5,11,0],[12,-17,5,9,.25]].forEach(t=>{X.save();X.translate(mx+t[0],headY+t[1]);X.rotate(t[4]);X.beginPath();X.ellipse(0,0,t[2],t[3],0,0,6.28);X.fill();X.restore();});
 X.strokeStyle='#8a3010';X.lineWidth=1.5;X.beginPath();X.arc(mx,headY-3,20,3.14,0);X.stroke();
 [[mx-8,headY-1],[mx+8,headY-1]].forEach(([ex,ey])=>{X.fillStyle='#fff';X.beginPath();X.arc(ex,ey,6,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=2;X.stroke();X.fillStyle='#1a0a00';X.beginPath();X.arc(ex+1.5,ey,3,0,6.28);X.fill();});
 X.strokeStyle='#8a3010';X.lineWidth=2.5;X.lineCap='round';X.beginPath();X.moveTo(mx-13,headY-10);X.lineTo(mx-3,headY-6);X.stroke();X.beginPath();X.moveTo(mx+13,headY-10);X.lineTo(mx+3,headY-6);X.stroke();
 X.strokeStyle='#7a1010';X.lineWidth=2.5;X.beginPath();X.arc(mx,headY+7,8,.12,3.0);X.stroke();
 X.fillStyle='#9a4a28';[[-12,5],[-8,8],[12,5],[8,8]].forEach(f=>{X.beginPath();X.arc(mx+f[0],headY+f[1],1.3,0,6.28);X.fill();});
 X.fillStyle='rgba(0,0,0,.62)';X.beginPath();X.roundRect(mx-19,headY-48,38,16,5);X.fill();X.fillStyle='#ffd23f';X.font='800 11px sans-serif';X.textAlign='center';X.fillText('MAX',mx,headY-36);}
function chargeGuide(){if(!charging)return;const o=charging.o,iv=ideal(o),f=charging.c,dr=diff().drift*.012;
 let vx=iv.vx*f,vy=iv.vy*f,tx=o.x,ty=o.y,onTarget=false;const pts=[];
 for(let i=0;i<110;i++){vy+=G;vx+=dr;tx+=vx;ty+=vy;if(catchHit(tx,ty,vy)){onTarget=true;break;}if(ty>556||tx<0||tx>W)break;pts.push({x:tx,y:ty});}
 const col=onTarget?'#3ad17a':(o.hb?'#ffd23f':'#7fe0ff');
 pts.forEach((p,i)=>{if(i%2)return;X.save();X.globalAlpha=Math.max(.2,1-i/110);X.fillStyle=col;X.beginPath();X.arc(p.x,p.y,Math.max(2.2,4.5-i*.025),0,6.28);X.fill();X.restore();});
 const frac=Math.min(f/1.4,1);X.strokeStyle='rgba(0,0,0,.3)';X.lineWidth=5;X.beginPath();X.arc(o.x,o.y,30,0,6.28);X.stroke();
 X.strokeStyle=col;X.lineWidth=5;X.beginPath();X.arc(o.x,o.y,30,-1.57,-1.57+6.28*frac);X.stroke();
 X.fillStyle=col;X.font='800 12px sans-serif';X.textAlign='center';X.fillText(onTarget?'RELEASE! ✋':'hold…',o.x,o.y-40);
 if(onTarget){X.save();X.strokeStyle='#3ad17a';X.lineWidth=3.5;X.beginPath();X.ellipse(CX,CY,craterR+10,craterR*.5+6,0,0,6.28);X.stroke();X.restore();}}
function aimHint(){if(hintT<=0||charging)return;const o=objs.find(o=>o.st==='float'&&!o.hb);if(!o)return;
 const a=(Math.sin(wave*.12)+1)/2;X.save();X.globalAlpha=.55+a*.4;X.fillStyle='#fff';X.font='800 12px sans-serif';X.textAlign='center';
 X.fillText('👆 hold a toy to wind up,',o.x,o.y+58);X.fillText('release to splash it in!',o.x,o.y+74);X.restore();}
function kid(){const kx=190,base=372,hy=base-44,s=splashSide;
 X.save();X.globalAlpha=.2;X.fillStyle='#0033aa';X.beginPath();X.ellipse(kx,base+38,32,15,0,0,6.28);X.fill();X.restore();
 if(state!=='erupt'&&state!=='win'){
 const rsX=kx-18*s,rsY=base-20,rhx=kx-46*s,rhy=base-12;
 X.strokeStyle='#c87040';X.lineWidth=13;X.lineCap='round';X.beginPath();X.moveTo(rsX,rsY);X.lineTo(rhx,rhy);X.stroke();X.fillStyle='#d88050';X.beginPath();X.arc(rhx,rhy,7,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=2;X.stroke();
 const sX=kx+18*s,sY=base-20,ex=sX+s*Math.cos(armAng)*26,ey=sY+Math.sin(armAng)*26,hx=ex+s*Math.cos(armAng+0.5)*22,hy2=ey+Math.sin(armAng+0.5)*22;
 X.strokeStyle='#c87040';X.lineWidth=13;X.beginPath();X.moveTo(sX,sY);X.lineTo(ex,ey);X.lineTo(hx,hy2);X.stroke();X.fillStyle='#d88050';X.beginPath();X.arc(hx,hy2,8,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=2;X.stroke();
 }
 X.fillStyle='#2255cc';X.beginPath();X.roundRect(kx-24,base-32,48,72,8);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=3.5;X.stroke();X.strokeStyle='rgba(120,170,255,.5)';X.lineWidth=2;for(let i=0;i<3;i++){X.beginPath();X.moveTo(kx-24,base-20+i*12);X.lineTo(kx+24,base-20+i*12);X.stroke();}
 X.fillStyle='#c87040';X.beginPath();X.roundRect(kx-9,hy+19,18,17,5);X.fill();X.beginPath();X.arc(kx,hy,26,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=4;X.stroke();
 [-28,28].forEach(ex2=>{X.fillStyle='#c87040';X.beginPath();X.ellipse(kx+ex2,hy,8,10,0,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=3;X.stroke();X.fillStyle='#b86030';X.beginPath();X.ellipse(kx+ex2,hy,4,6,0,0,6.28);X.fill();});
 X.fillStyle='#1a0800';X.beginPath();X.arc(kx,hy-4,24,3.14,0);X.fill();[[-10,-26,7,13,-.15],[2,-28,6,12,.05],[14,-25,5,11,.25]].forEach(t=>{X.save();X.translate(kx+t[0],hy+t[1]);X.rotate(t[4]);X.beginPath();X.ellipse(0,0,t[2],t[3],0,0,6.28);X.fill();X.restore();});
 X.beginPath();X.ellipse(kx-20,hy-2,10,16,.3,3.14,0);X.fill();X.beginPath();X.ellipse(kx+20,hy-2,10,15,-.3,3.14,0);X.fill();
 [[kx-10,hy-4],[kx+10,hy-4]].forEach(([ex3,ey3])=>{X.fillStyle='#fff';X.beginPath();X.ellipse(ex3,ey3,7.5,8.5,0,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=2.5;X.stroke();X.fillStyle='#1a0a00';X.beginPath();X.arc(ex3+.5,ey3-1,4,0,6.28);X.fill();X.fillStyle='#fff';X.beginPath();X.arc(ex3+2,ey3-2.5,1.5,0,6.28);X.fill();X.strokeStyle='#1a0800';X.lineWidth=2.5;X.beginPath();X.moveTo(ex3-7,ey3-11);X.quadraticCurveTo(ex3,ey3-14,ex3+7,ey3-11);X.stroke();});
 X.fillStyle='#aa1800';X.beginPath();X.arc(kx,hy+10,12,.1,3.04);X.fill();X.fillStyle='#fff';X.fillRect(kx-10,hy+10,6,5);X.fillRect(kx-2,hy+10,6,5);X.fillRect(kx+4,hy+10,6,5);X.strokeStyle='#1a0a00';X.lineWidth=3;X.beginPath();X.arc(kx,hy+10,12,.1,3.04);X.stroke();
 X.save();X.globalAlpha=.32;X.fillStyle='#ff8060';X.beginPath();X.ellipse(kx-21,hy+6,8,5.5,0,0,6.28);X.fill();X.beginPath();X.ellipse(kx+21,hy+6,8,5.5,0,0,6.28);X.fill();X.restore();
 X.fillStyle='rgba(0,0,0,.62)';X.beginPath();X.roundRect(kx-23,base-4,46,16,5);X.fill();X.fillStyle='#7fd0ff';X.font='800 11px sans-serif';X.textAlign='center';X.fillText('NOAH',kx,base+8);
 if(state==='erupt'||state==='win'){X.strokeStyle='#c87040';X.lineWidth=13;X.lineCap='round';[-1,1].forEach(sg=>{X.beginPath();X.moveTo(kx+18*sg,base-20);X.lineTo(kx+27*sg,hy+4);X.stroke();});[-1,1].forEach(sg=>{X.fillStyle='#d88050';X.beginPath();X.arc(kx+27*sg,hy+4,8,0,6.28);X.fill();X.strokeStyle='#1a0a00';X.lineWidth=2;X.stroke();});}}
function drawParts(){parts.forEach(p=>{X.save();X.globalAlpha=p.life;X.fillStyle=p.col;X.beginPath();X.arc(p.x,p.y,p.r*p.life,0,6.28);X.fill();X.restore();});eParts.forEach(p=>{X.save();X.globalAlpha=p.life*.85;X.fillStyle=p.col;X.beginPath();X.arc(p.x,p.y,p.r,0,6.28);X.fill();X.restore();});}
function drawMute(){X.font='18px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText(muted?'🔇':'🔊',W-22,46);X.textBaseline='alphabetic';}
function drawBanner(){if(bannerT<=0)return;X.save();X.globalAlpha=Math.min(1,bannerT/0.5);X.font='800 14px sans-serif';const w=X.measureText(banner).width+28;
 X.fillStyle='rgba(8,4,2,.85)';X.beginPath();X.roundRect(W/2-w/2,66,w,30,9);X.fill();X.strokeStyle='#ffd23f';X.lineWidth=2;X.stroke();
 X.fillStyle='#ffd23f';X.textAlign='center';X.textBaseline='middle';X.fillText(banner,W/2,82);X.textBaseline='alphabetic';X.restore();}
function hud(){X.fillStyle='rgba(8,4,2,.82)';X.fillRect(0,0,W,58);X.fillStyle='rgba(255,180,0,.35)';X.fillRect(0,56,W,2);
 X.fillStyle='#ffd23f';X.font='800 16px sans-serif';X.textAlign='left';X.fillText('⭐ '+score,12,24);
 if(combo>1){X.fillStyle='#ff8800';X.font='800 13px sans-serif';X.textAlign='left';X.fillText('🔥 x'+combo,12,46);}
 X.fillStyle='#fff';X.font='700 12px sans-serif';X.textAlign='right';X.fillText('Round '+round+'/10',W-12,20);
 const tot=need,dw=tot*15,ds=(W-dw)/2;for(let i=0;i<tot;i++){X.fillStyle=i<collected?'#ffcc00':'rgba(255,255,255,.22)';X.beginPath();X.arc(ds+i*15+7,52,5,0,6.28);X.fill();}
 const tw=130,tx=(W-tw)/2,ty=8,pct=Math.max(0,timeLeft/roundTime),low=timeLeft<8;
 X.fillStyle='rgba(0,0,0,.5)';X.beginPath();X.roundRect(tx,ty,tw,11,6);X.fill();
 const tc=low?'#ff3a3a':pct>.5?'#3ad17a':'#ffcc00';X.fillStyle=tc;X.beginPath();X.roundRect(tx,ty,tw*pct,11,6);X.fill();
 X.strokeStyle='rgba(255,255,255,.5)';X.lineWidth=1.5;X.beginPath();X.roundRect(tx,ty,tw,11,6);X.stroke();
 const sec=Math.ceil(timeLeft),pulse=low?(1+Math.sin(wave*.5)*.12):1;X.save();X.translate(W/2,34);X.scale(pulse,pulse);
 X.fillStyle=low?'#ff5a5a':'#fff';X.font='900 18px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText('⏱ '+sec,0,0);X.restore();X.textBaseline='alphabetic';}
let card=null;
function overlay(){if(state==='menu')drawCard('🌋 Exploding Volcanos','Noah splashes toys into the volcano!\nHold a toy to wind up, release to splash.\nEach round adds a new toy!','START',()=>startGame());
 else if(state==='intro')drawIntroCard();
 else if(state==='newtoy')drawNewToyCard();
 else if(state==='win')drawCard('🏆 You Win!','All 10 rounds cleared!\nScore: '+score+'   Best combo: x'+bestCombo,'PLAY AGAIN',()=>startGame());
 else if(state==='gameover')drawCard('⏰ Time\'s Up!','You reached Round '+round+'.\nScore: '+score+'   Best combo: x'+bestCombo,'TRY AGAIN',()=>startGame());else card=null;}
function drawCard(t,b,bt,act){X.fillStyle='rgba(0,0,0,.6)';X.fillRect(0,0,W,H);const cw=314,ch=216,cx=(W-cw)/2,cy=(H-ch)/2;
 X.fillStyle='#fff';X.beginPath();X.roundRect(cx,cy,cw,ch,18);X.fill();X.strokeStyle='#ffcc00';X.lineWidth=4;X.stroke();
 X.fillStyle='#cc2200';X.font='800 20px sans-serif';X.textAlign='center';X.fillText(t,W/2,cy+42);
 X.fillStyle='#444';X.font='500 12.5px sans-serif';b.split('\n').forEach((l,i)=>X.fillText(l,W/2,cy+72+i*19));
 const bw=160,bh=44,bx=(W-bw)/2,by=cy+ch-58;X.fillStyle='#cc2200';X.beginPath();X.roundRect(bx,by,bw,bh,12);X.fill();X.fillStyle='#fff';X.font='800 15px sans-serif';X.fillText(bt,W/2,by+28);card={x:bx,y:by,w:bw,h:bh,act};}
function drawIntroCard(){X.fillStyle='rgba(0,0,0,.68)';X.fillRect(0,0,W,H);
 const cw=326,ch=296,cx=(W-cw)/2,cy=(H-ch)/2;
 X.fillStyle='#fff';X.beginPath();X.roundRect(cx,cy,cw,ch,20);X.fill();X.strokeStyle='#ffcc00';X.lineWidth=4;X.stroke();
 X.fillStyle='#cc2200';X.font='800 21px sans-serif';X.textAlign='center';X.fillText('🛁 Noah’s Bath Toys!',W/2,cy+46);
 X.fillStyle='#666';X.font='500 13px sans-serif';X.fillText('Splash these into the volcano:',W/2,cy+74);
 const toys=currentToys,n=toys.length,gap=72,sx2=W/2-(n-1)*gap/2,ry=cy+138;
 toys.forEach((em,i)=>{const b=Math.sin(wave*.12+i*1.2)*6;X.save();X.font='52px sans-serif';X.textAlign='center';X.textBaseline='middle';X.shadowColor='rgba(0,0,0,.2)';X.shadowBlur=6;X.fillText(em,sx2+i*gap,ry+b);X.restore();});X.textBaseline='alphabetic';
 X.fillStyle='#888';X.font='600 12px sans-serif';X.fillText('a new toy joins every round!',W/2,cy+200);
 const bw=200,bh=46,bx=(W-bw)/2,bbtY=cy+ch-60;X.fillStyle='#cc2200';X.beginPath();X.roundRect(bx,bbtY,bw,bh,12);X.fill();X.fillStyle='#fff';X.font='800 15px sans-serif';X.textAlign='center';X.fillText('START SPLASHING →',W/2,bbtY+29);
 card={x:bx,y:bbtY,w:bw,h:bh,act:()=>{startRound(false);state='play';lastNow=performance.now();}};}
function drawNewToyCard(){X.fillStyle='rgba(0,0,0,.68)';X.fillRect(0,0,W,H);
 const cw=324,ch=320,cx=(W-cw)/2,cy=(H-ch)/2;
 X.fillStyle='#fff';X.beginPath();X.roundRect(cx,cy,cw,ch,20);X.fill();X.strokeStyle='#ffcc00';X.lineWidth=4;X.stroke();
 for(let i=0;i<5;i++){X.fillStyle=['#ffcc00','#ff8a1a','#3ec6ff','#ff5577','#7ad17a'][i];X.beginPath();X.arc(cx+30+i*66,cy+18+Math.sin(wave*.1+i)*4,3,0,6.28);X.fill();}
 X.fillStyle='#ff8800';X.font='800 23px sans-serif';X.textAlign='center';X.fillText('✨ NEW TOY! ✨',W/2,cy+46);
 const by=cy+120+Math.sin(wave*.13)*8;X.save();X.font='66px sans-serif';X.textBaseline='middle';X.shadowColor='rgba(0,0,0,.25)';X.shadowBlur=8;X.fillText(newToyEm,W/2,by);X.restore();X.textBaseline='alphabetic';
 X.fillStyle='#222';X.font='800 20px sans-serif';X.fillText(TOYNAME[newToyEm]||'New Toy',W/2,cy+174);
 X.fillStyle='#777';X.font='500 13px sans-serif';X.fillText('splashes into the tub for round '+round+'!',W/2,cy+196);
 const n=currentToys.length,gap=Math.min(30,(cw-44)/n),sx2=W/2-(n-1)*gap/2,ry=cy+232;
 currentToys.forEach((em,i)=>{const isN=i===n-1;if(isN){const pu=(Math.sin(wave*.2)+1)/2;X.save();X.globalAlpha=.4+pu*.4;X.fillStyle='#ffcc00';X.beginPath();X.arc(sx2+i*gap,ry,15,0,6.28);X.fill();X.restore();}X.font='22px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText(em,sx2+i*gap,ry);});X.textBaseline='alphabetic';
 X.fillStyle='#999';X.font='600 11px sans-serif';X.fillText('your toy collection ('+n+')',W/2,cy+258);
 const bw=180,bh=44,bx=(W-bw)/2,bbtY=cy+ch-56;X.fillStyle='#cc2200';X.beginPath();X.roundRect(bx,bbtY,bw,bh,12);X.fill();X.fillStyle='#fff';X.font='800 15px sans-serif';X.textAlign='center';X.fillText('SPLASH ON →',W/2,bbtY+28);
 card={x:bx,y:bbtY,w:bw,h:bh,act:()=>{startRound(true);state='play';lastNow=performance.now();}};}
function eruptFX(){if(state!=='erupt'&&state!=='win')return;if(eruptT>0)eruptT--;
 if((state==='erupt'||state==='win')&&eruptT>122&&eruptT%3===0){for(let k=0;k<2;k++){const a=-1.57+(Math.random()-.5)*.8,s=8+Math.random()*8;eParts.push({x:CX+(Math.random()-.5)*16,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:4+Math.random()*5,col:['#ff5500','#ff8800','#ffcc00'][~~(Math.random()*3)]});}}
 if(eruptT>135){const a=(160-eruptT)/25;X.save();X.globalAlpha=Math.sin(a*3.14)*.4;X.fillStyle='#ff7a00';X.fillRect(0,0,W,H);X.restore();}
 if(state==='erupt'&&eruptT>134){const a=Math.min(1,(160-eruptT)/8),sc=0.6+a*0.5;
  X.save();X.translate(W/2,H/2-6);X.scale(sc,sc);X.globalAlpha=a;X.textAlign='center';X.textBaseline='middle';X.lineWidth=7;X.lineJoin='round';X.strokeStyle='#3a0a00';X.font='900 40px sans-serif';X.fillStyle='#ffd23f';
  X.strokeText('THIS IS',0,-24);X.fillText('THIS IS',0,-24);X.strokeText('THE END!',0,22);X.fillText('THE END!',0,22);X.restore();X.textBaseline='alphabetic';}
 else if(state==='erupt'&&eruptT>116){const a=(134-eruptT)/9,sc=1+Math.sin(Math.min(1,a)*3.14)*0.3;
  X.save();X.translate(W/2,H/2-6);X.scale(sc,sc);X.textAlign='center';X.textBaseline='middle';X.lineWidth=8;X.lineJoin='round';X.strokeStyle='#3a0a00';X.font='900 50px sans-serif';X.fillStyle='#ff4400';
  X.strokeText('POW! POW!',0,0);X.fillText('POW! POW!',0,0);X.restore();X.textBaseline='alphabetic';}
 else if(state==='erupt'&&eruptT>10){const sc=0.6+Math.min(1,(116-eruptT)/12)*0.4;
  X.save();X.translate(W/2,116);X.scale(sc,sc);X.textAlign='center';X.textBaseline='middle';X.lineWidth=5;X.lineJoin='round';X.strokeStyle='#3a0a00';
  X.font='900 30px sans-serif';X.strokeText('EXPLODING VOLCANOS',0,-16);X.fillStyle='#ff8a1a';X.fillText('EXPLODING VOLCANOS',0,-16);
  X.font='900 22px sans-serif';X.strokeText('in the BATHTUB!',0,14);X.fillStyle='#3ec6ff';X.fillText('in the BATHTUB!',0,14);
  X.restore();X.textBaseline='alphabetic';}}
function loop(now){
 try{
  const dt=Math.min((now-lastNow)/1000||0,.05);lastNow=now;
  X.clearRect(0,0,W,H);X.save();if(shake>.3)X.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  if(state!=='menu'){if(state==='play')step(dt);else{wave+=1.1;volP+=.05;if(shake>0)shake*=.82;if(flash>0)flash-=.04;if(bannerT>0)bannerT-=dt;armAng+=((idleAng)-armAng)*0.1;rings=rings.filter(r=>r.life>0);rings.forEach(r=>{r.r+=(r.big?8:2.6);r.life-=(r.big?.03:.045);});eParts=eParts.filter(p=>p.life>0);eParts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.2;p.life-=.022;p.r*=.985;});}
   updateEjecta();
   tile();tub();water(false);volcano();maxBlocker();drawObjs();kid();water(true);drawRings();aimHint();chargeGuide();drawParts();eruptFX();drawEjecta();hud();drawBanner();}else{tile();}
  X.restore();if(flash>0){X.save();X.globalAlpha=flash;X.fillStyle=flashCol;X.fillRect(0,0,W,H);X.restore();}overlay();drawMute();
 }catch(err){}
 requestAnimationFrame(loop);
}

// ── RESPONSIVE: scale the 380x600 canvas to fill any phone screen ──
function resize(){const vw=window.innerWidth,vh=window.innerHeight,sc=Math.min(vw/W,vh/H),cw=Math.round(W*sc),ch=Math.round(H*sc),wEl=document.getElementById('w');wEl.style.width=cw+'px';wEl.style.height=ch+'px';cv.style.width=cw+'px';cv.style.height=ch+'px';}
window.addEventListener('resize',resize);resize();
requestAnimationFrame(loop);
