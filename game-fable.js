/* Exploding Volcanos in the Bathtub — "fable" visual pass.
   Rules, physics, timing and scoring are the same as game.js; everything that is DRAWN is new:
   hi-DPI canvas, cached painted background, drawn toys (no emoji), cover-art style volcano / tub / kids. */
'use strict';
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
let charging=null,pendingLaunch=null,armAng=idleAng,swingT=0,swingHit=false,splashSide=1,paused=false;
let newToyEm=null,bannerT=0,banner='',newToyT=0;
let wave=0,volP=0,shake=0,flash=0,flashCol='#fff',eruptT=0,hintT=0;
let blk={on:false,x:190,dir:1,spd:0,y:292};
let timeLeft=30,roundTime=30,hbTimer=0,lastNow=0;
let card=null,pops=[],smoke=[],volGulp=0,SC=1,bgCv=null,bgDirty=true;

// ───────────────────────── drawing helpers ─────────────────────────
const TAU=Math.PI*2,PI=Math.PI,INK='#2a1a12';
const FONT='"Arial Rounded MT Bold","Baloo 2","Nunito","Segoe UI",system-ui,-apple-system,sans-serif';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(seed){return()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function ell(g,x,y,rx,ry,rot){g.beginPath();g.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),rot||0,0,TAU);}
function circ(g,x,y,r){g.beginPath();g.arc(x,y,Math.max(.01,r),0,TAU);}
function rr(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r);}
function fs(g,fill,stroke,lw){if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}}
function rpoly(g,pts,r){g.beginPath();const n=pts.length,a=pts[n-1],b=pts[0];g.moveTo((a[0]+b[0])/2,(a[1]+b[1])/2);for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n];g.arcTo(p[0],p[1],q[0],q[1],r[i]);}g.closePath();}
function star(g,x,y,R,r){g.beginPath();for(let i=0;i<10;i++){const a=-PI/2+i*PI/5,q=i%2?r:R;g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}g.closePath();}
function txt(s,x,y,size,fill,o){o=o||{};X.font=(o.w||800)+' '+size+'px '+FONT;X.textAlign=o.a||'center';X.textBaseline=o.b||'alphabetic';
 if(o.s){X.lineJoin='round';X.lineWidth=o.sw||size*.3;X.strokeStyle=o.s;X.strokeText(s,x,y);}X.fillStyle=fill;X.fillText(s,x,y);X.textBaseline='alphabetic';}
function fit(s,maxW,size){X.font='900 '+size+'px '+FONT;const w=X.measureText(s).width;return w>maxW?size*maxW/w:size;}
function lavaText(s,x,y,size,o){o=o||{};X.save();X.font='900 '+size+'px '+FONT;X.textAlign='center';X.textBaseline='middle';X.lineJoin='round';
 X.strokeStyle=o.ink||'#3a0a00';X.lineWidth=size*.24;X.strokeText(s,x,y+size*.09);X.strokeText(s,x,y);
 const g=X.createLinearGradient(0,y-size*.42,0,y+size*.42),cols=o.cols||['#fff27a','#ffb21a','#f0480c'];cols.forEach((c,i)=>g.addColorStop(i/(cols.length-1),c));
 X.fillStyle=g;X.fillText(s,x,y);X.restore();}

// ───────────────────────── toys (drawn once into small canvases) ─────────────────────────
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
function buildToys(){for(const em in TOYS){const c=document.createElement('canvas');c.width=c.height=120*TOYPX;const g=c.getContext('2d');g.scale(TOYPX,TOYPX);g.translate(60,60);TOYS[em](toyKit(g),g);toyCv[em]=c;}}
// PNG sprites dropped into assets/toys/ still take over automatically (same as the original).
const SPRITE_FILE={'🦆':'duck','⛵':'boat','🦕':'dino','🚚':'monstertruck','🚗':'car','🐙':'octopus','🪣':'pail','🦈':'shark','🐬':'dolphin','🐸':'frog','🦸':'actionfigure','🚀':'rocket'};
const sprites={};
for(const em in SPRITE_FILE){const img=new Image();img.onload=()=>{img._ok=true;};img.onerror=()=>{};img.src='assets/toys/'+SPRITE_FILE[em]+'.png';sprites[em]=img;}
function paintToy(em,size){const img=sprites[em];if(img&&img._ok){X.drawImage(img,-size/2,-size/2,size,size);return;}const c=toyCv[em];if(c){const s=size*1.5;X.drawImage(c,-s/2,-s/2,s,s);}}

function catchHit(x,y,vy){return vy>0&&Math.abs(x-CX)<craterR*1.35&&y>CY-craterR*.7&&y<CY+craterR;}
function ideal(o){return{vx:(CX-o.x)/T,vy:(CY-o.y-0.5*G*T*T)/T};}
function handPos(){const kx=190,base=372,s=splashSide,sX=kx+18*s,sY=base-20,ex=sX+s*Math.cos(armAng)*26,ey=sY+Math.sin(armAng)*26;return{x:ex+s*Math.cos(armAng+0.5)*22,y:ey+Math.sin(armAng+0.5)*22};}

// ───────────────────────── audio (unchanged) ─────────────────────────
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

// ───────────────────────── game flow (unchanged rules) ─────────────────────────
function startRound(carry){const d=diff();craterR=d.cr;need=currentToys.length;collected=0;combo=0;
 const single=round>=3;
 objs=currentToys.map((em,i)=>{let x,y;const L=carry?landed[i]:null;
  if(L){x=L.x;y=L.y;}
  else if(single){x=CX+(Math.random()-.5)*30;y=462+(Math.random()-.5)*16;}
  else{const left=i%2===0;x=left?(58+Math.random()*74):(248+Math.random()*76);y=442+Math.random()*42;}
  const vx=(Math.random()<.5?-1:1)*(0.4+d.drift)*(single?1:.5);
  return{em,x,y,vx,vy:0,bob:Math.random()*6.28,st:'float',sq:0,hb:false,isNew:false};});
 if(newToyEm){const idx=currentToys.lastIndexOf(newToyEm);if(idx>=0){objs[idx].isNew=true;objs[idx].x=CX+(Math.random()-.5)*26;objs[idx].y=458;}}
 parts=[];eParts=[];rings=[];ejecta=[];smoke=[];collectedToys=[];landed=[];charging=null;pendingLaunch=null;swingT=0;swingHit=false;armAng=idleAng;splashSide=1;
 blk.on=d.blk>0;blk.spd=d.blk;blk.x=110;blk.dir=1;blk.y=292;
 timeLeft=d.time;roundTime=d.time;hbTimer=5+Math.random()*3;hintT=round===1?6:0;
 bannerT=2.6;newToyT=newToyEm?5:0;banner=round===1?'Round 1 — splash away!':('Round '+round+'!');}
function startGame(){round=1;score=0;bestCombo=0;currentToys=[...BASE];newToyEm=null;landed=[];objs=[];eParts=[];collected=0;need=0;combo=0;craterR=DIFF[0].cr;blk.on=false;state='intro';}
function dist(a,b,c,d){return Math.hypot(a-c,b-d);}
function spawnHairball(){const left=Math.random()<.5;objs.push({hb:true,x:left?70:310,y:450,vx:(Math.random()-.5)*.6,vy:0,bob:Math.random()*6.28,st:'float',sq:0,life:8,r:16});}
function waterBurst(x,y,big){const n=big?26:12;for(let i=0;i<n;i++){const a=-1.57+(Math.random()-.5)*(big?2.4:2),s=(big?3:2)+Math.random()*(big?9:5);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(big?4:2),life:1,r:(big?4:3)+Math.random()*(big?7:4),col:['#bfeaff','#8ed8ff','#ffffff','#5bc0f0'][~~(Math.random()*4)]});}rings.push({x,y,r:6,life:1});}

// ── INPUT ──
function P(e){const r=cv.getBoundingClientRect(),sx=W/r.width,sy=H/r.height;return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};}
function down(e){initAudio();const p=P(e);
 if(dist(p.x,p.y,W-22,46)<20){muted=!muted;if(song){if(muted)song.pause();else song.play().catch(()=>{});}return;}
 if((state==='play'||paused)&&dist(p.x,p.y,W-56,46)<16){paused=!paused;if(!paused)lastNow=performance.now();return;}
 if(paused){if(card&&p.x>card.x&&p.x<card.x+card.w&&p.y>card.y&&p.y<card.y+card.h)card.act();return;}
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
  if(o.hb&&o.st==='float'){o.life-=dt;if(o.life<=0){o.st='gone';pop(o.x,o.y-20,'gurgle...','#d9b98a');}}
  const held=(charging&&charging.o===o)||(pendingLaunch&&pendingLaunch.o===o);
  if(o.st==='float'){if(held){}else{o.x+=o.vx;o.y+=Math.sin(wave*.04+o.bob)*.06;
   if(o.x<46||o.x>334)o.vx*=-1;if(Math.abs(o.x-CX)<58)o.vx=(o.x<CX?-1:1)*Math.abs(o.vx);}
  }else if(o.st==='fly'){
   o.vx+=o.drift||0;o.vy+=G;o.x+=o.vx;o.y+=o.vy;o.rot=(o.rot||0)+o.vx*.05;
   if(Math.random()<.45)parts.push({x:o.x+(Math.random()-.5)*14,y:o.y+8,vx:(Math.random()-.5)*.8,vy:.5,life:.7,r:2+Math.random()*2.5,col:'#dff4ff'});
   if(blk.on&&!o.blocked&&dist(o.x,o.y,blk.x,blk.y)<30){o.blocked=1;o.vy=Math.abs(o.vy)*.5+1;o.vx*=-.5;shake=5;pop(blk.x,blk.y-34,'BLOCKED!','#ff6a5a');sfxBlock();}
   if(catchHit(o.x,o.y,o.vy)){volGulp=1;
     if(o.hb){combo++;bestCombo=Math.max(bestCombo,combo);timeLeft+=5;score+=50;shake=8;flash=.35;flashCol='#ffe9b0';collectedToys.push('🧶');
       pop(CX,CY-18,'HAIRBALL! +50  +5s','#ffd23f');splash(CX,CY,'#8a5a2a',26);sfxHair();o.st='gone';
     }else{collected++;combo++;bestCombo=Math.max(bestCombo,combo);collectedToys.push(o.em);
       const fpN2=collected/need,fpPrev=(collected-1)/need;
       if(fpN2>=.85&&fpPrev<.85)pop(CX,CY-46,'gonna OVERFLOW?!','#ff5a2a');else if(fpN2>=.6&&fpPrev<.6)pop(CX,CY-46,"it's getting HOTTER!",'#ff9a2a');else if(fpN2>=.35&&fpPrev<.35)pop(CX,CY-46,"it's getting bigger!",'#ffd23f');
       if(combo===3)pop(190,116,'Look, Daddy, look!','#9fe0ff');
       const mult=Math.min(combo,5),pts=(12+round*2)*mult;score+=pts;shake=7;flash=.3;flashCol='#fff';
       splash(CX,CY,'#ffcc00',24);waterBurst(CX,CY,false);
       for(let k=0;k<10;k++){const a=-1.57+(Math.random()-.5)*1.4,s=3+Math.random()*5;eParts.push({x:CX,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:3+Math.random()*4,col:'#ff8a1a'});}
       pop(CX,CY-22,'+'+pts+(mult>1?'  x'+mult+'!':''),'#ffd23f');sfxScore();
       o.st='gone';if(collected>=need)setTimeout(roundWin,380);}
   }else if((o.vy>0&&o.y>=448)||o.x<22||o.x>358){
     combo=0;
     if(o.hb){o.st='gone';waterBurst(Math.max(40,Math.min(340,o.x)),456,false);}
     else{o.st='float';o.x=Math.max(58,Math.min(322,o.x));o.y=Math.max(448,Math.min(o.y,486));o.vx=(Math.random()<.5?-1:1)*(0.4+d.drift)*(round>=3?1:.4);o.vy=0;o.blocked=0;
       waterBurst(o.x,o.y-6,false);pop(o.x,o.y-26,'missed — splash!','#cfeaff');sfxPlop();}
   }
  }
 });
 objs=objs.filter(o=>!(o.hb&&o.st==='gone'));
 stepFx();
}
function stepFx(){
 parts=parts.filter(p=>p.life>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.16;p.life-=.04;});
 rings=rings.filter(r=>r.life>0);rings.forEach(r=>{r.r+=(r.big?8:2.6);r.life-=(r.big?.03:.045);});
 eParts=eParts.filter(p=>p.life>0);eParts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.2;p.life-=.022;p.r*=.985;});
}
function updateEjecta(){if(!ejecta.length)return;for(const e of ejecta){if(!e.alive)continue;if(e.delay>0){e.delay--;continue;}e.vy+=0.32;e.x+=e.vx;e.y+=e.vy;e.rot+=e.rotSpeed;
  if((e.vy>0&&e.y>462)||e.y>590||e.x<-30||e.x>W+30){e.alive=false;const lx=Math.max(58,Math.min(322,e.x)),ly=Math.max(450,Math.min(e.y,484));if(e.y<560&&e.x>14&&e.x<W-14){waterBurst(lx,ly,false);if(Math.random()<.4)sfxPlop();}if(e.em!=='🧶')landed.push({x:lx,y:ly,em:e.em});}}
 ejecta=ejecta.filter(e=>e.alive);}
function splash(x,y,col,n){for(let i=0;i<n;i++){const a=-1.57+(Math.random()-.5)*2.4,s=2+Math.random()*6;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:1,r:3+Math.random()*5,col});}}
function pop(x,y,t,c){pops.push({x,y,t,c,age:0});}
function roundWin(){
 if(round>=10){score+=150+Math.round(timeLeft)*10;state='win';eruptT=160;bigErupt();return;}
 state='erupt';eruptT=160;score+=need*15+combo*5+Math.round(timeLeft)*10;bigErupt();
 banner='The toys rain back into the tub!';bannerT=3.4;
 setTimeout(()=>{round++;newToyEm=NEWBY[round]||null;if(newToyEm)currentToys=[...currentToys,newToyEm];
   if(newToyEm){state='newtoy';sfxFanfare();}else{startRound(true);state='play';lastNow=performance.now();}},3500);
}
function bigErupt(){sfxErupt();shake=18;flash=.42;flashCol='#ffce8a';rings.push({x:CX,y:CY,r:10,life:1,big:true});
 for(let i=0;i<55;i++){const a=-1.57+(Math.random()-.5)*1.9,s=4+Math.random()*12;eParts.push({x:CX,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:4+Math.random()*6,col:['#ff3300','#ff7700','#ffcc00','#ff5500','#ffe066'][~~(Math.random()*5)]});}
 ejecta=collectedToys.map((em,i)=>({em,x:CX+(Math.random()-.5)*20,y:CY-4,vx:(Math.random()-.5)*9,vy:-(7+Math.random()*6),rot:(Math.random()-.5)*.7,rotSpeed:(Math.random()-.5)*.28,alive:true,delay:~~(i*4)}));}

// ───────────────────────── static background (painted once per resize) ─────────────────────────
const RIM=[[22,190],[358,190],[378,590],[2,590]],RIM_R=[30,30,44,44],BAS=[[38,206],[342,206],[366,570],[14,570]],BAS_R=[24,24,40,40],WL=248;
function paper(g,x,y,rot,name,shirt,hair,nameCol){g.save();g.translate(x,y);g.rotate(rot);g.lineCap='round';
 g.fillStyle='rgba(0,20,60,.22)';g.fillRect(-14,-19,32,42);g.fillStyle='#fffdf2';g.fillRect(-16,-21,32,42);g.strokeStyle='rgba(60,40,20,.45)';g.lineWidth=1;g.strokeRect(-16,-21,32,42);
 g.fillStyle='rgba(255,214,110,.95)';g.fillRect(-7,-24.5,14,6);
 [[-11,-14,'#ffcc33'],[11,-12,'#ff6fa3'],[-11,4,'#5cc8ff'],[11,6,'#7ed53c']].forEach(s=>{star(g,s[0],s[1],2.6,1.1);g.fillStyle=s[2];g.fill();});
 g.strokeStyle='#3a2a20';g.lineWidth=1.4;
 g.beginPath();g.moveTo(-4,0);g.lineTo(-10,-5);g.moveTo(4,0);g.lineTo(10,-5);g.moveTo(-3,7);g.lineTo(-4,12.5);g.moveTo(3,7);g.lineTo(4,12.5);g.stroke();
 g.beginPath();g.moveTo(-4,-2.5);g.lineTo(4,-2.5);g.lineTo(6,7.5);g.lineTo(-6,7.5);g.closePath();fs(g,shirt,'#3a2a20',1.3);
 circ(g,0,-8.5,5.6);fs(g,'#ffd9b0','#3a2a20',1.3);
 g.strokeStyle=hair;g.lineWidth=1.5;g.beginPath();for(let i=-4;i<=4;i+=2){g.moveTo(i,-12.5);g.lineTo(i*1.4,-16.5);}g.stroke();
 g.fillStyle='#3a2a20';circ(g,-2,-9.3,.8);g.fill();circ(g,2,-9.3,.8);g.fill();g.strokeStyle='#d1402a';g.lineWidth=1.1;g.beginPath();g.arc(0,-7.6,2.4,.25,PI-.25);g.stroke();
 g.font='900 6.6px '+FONT;g.textAlign='center';g.fillStyle=nameCol;g.fillText(name,0,19.4);g.restore();}
function paintBg(g){const R=rng(11);g.lineJoin=g.lineCap='round';
 // tiled wall
 let gr=g.createLinearGradient(0,0,0,215);gr.addColorStop(0,'#2f8fdb');gr.addColorStop(1,'#236fbd');g.fillStyle=gr;g.fillRect(0,0,W,H);
 const t=19;for(let y=-2;y<215;y+=t)for(let x=0;x<W;x+=t){const v=R();g.fillStyle=v<.1?'rgba(150,232,255,.5)':v<.2?'rgba(40,110,205,.55)':'rgba(120,200,250,'+(.3+R()*.22).toFixed(3)+')';rr(g,x+1,y+1,t-2,t-2,3.5);g.fill();
  g.fillStyle='rgba(255,255,255,.16)';rr(g,x+3,y+2.6,t-9,2.4,1.2);g.fill();}
 gr=g.createLinearGradient(0,60,0,215);gr.addColorStop(0,'rgba(8,40,90,0)');gr.addColorStop(1,'rgba(8,40,90,.28)');g.fillStyle=gr;g.fillRect(0,60,W,155);
 // sunbeam from the window
 g.fillStyle='rgba(255,250,210,.09)';g.beginPath();g.moveTo(98,70);g.lineTo(98,152);g.lineTo(300,215);g.lineTo(380,215);g.lineTo(380,150);g.closePath();g.fill();
 // window
 rr(g,12,68,86,86,7);fs(g,'#fff5df','#4a3020',3);
 gr=g.createLinearGradient(0,74,0,148);gr.addColorStop(0,'#8fdcff');gr.addColorStop(1,'#e6f9ff');g.save();rr(g,19,75,72,72,3);g.fillStyle=gr;g.fill();g.clip();
 g.fillStyle='#fff';[[66,92,9],[75,95,7],[58,96,6]].forEach(c=>{circ(g,c[0],c[1],c[2]);g.fill();});
 g.fillStyle='#63c14a';[[24,150,14],[40,154,13],[86,150,15],[70,156,12]].forEach(c=>{circ(g,c[0],c[1],c[2]);g.fill();});
 g.fillStyle='#3fa23a';[[32,152,8],[80,153,8]].forEach(c=>{circ(g,c[0],c[1],c[2]);g.fill();});
 const sx=38,sy=98;g.strokeStyle='#ffc21a';g.lineWidth=2.4;for(let i=0;i<10;i++){const a=i*TAU/10;g.beginPath();g.moveTo(sx+Math.cos(a)*14,sy+Math.sin(a)*14);g.lineTo(sx+Math.cos(a)*19,sy+Math.sin(a)*19);g.stroke();}
 circ(g,sx,sy,11.5);fs(g,'#ffe033','#e0a000',1.8);g.fillStyle='#4a2a00';circ(g,sx-3.6,sy-2,1.5);g.fill();circ(g,sx+3.6,sy-2,1.5);g.fill();g.strokeStyle='#4a2a00';g.lineWidth=1.5;g.beginPath();g.arc(sx,sy+1,5,.3,PI-.3);g.stroke();
 g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.moveTo(60,75);g.lineTo(74,75);g.lineTo(44,147);g.lineTo(30,147);g.closePath();g.fill();g.restore();
 rr(g,19,75,72,72,3);g.strokeStyle='#4a3020';g.lineWidth=2;g.stroke();
 g.strokeStyle='#4a3020';g.lineWidth=6.5;g.beginPath();g.moveTo(55,76);g.lineTo(55,146);g.moveTo(20,111);g.lineTo(90,111);g.stroke();g.strokeStyle='#fff5df';g.lineWidth=3.5;g.stroke();
 rr(g,7,152,96,9,3.5);fs(g,'#fff5df','#4a3020',2.6);
 // kids' drawings taped to the wall (as on the cover)
 paper(g,124,124,-.09,'NOAH','#ef5a3a','#2b1608','#2f9a3a');paper(g,258,122,.08,'MAX','#3f8fe6','#c8611c','#8a4fd0');
 // shelf + bottles + towel
 g.strokeStyle='#8a8f9a';g.lineWidth=3;g.beginPath();g.moveTo(302,160);g.lineTo(372,160);g.stroke();
 g.save();rr(g,316,157,42,30,[2,2,7,7]);g.clip();['#ff6fa3','#ffd43b','#8a5fe0','#3fc7c0','#ff6fa3'].forEach((c,i)=>{g.fillStyle=c;g.fillRect(316,157+i*6.4,42,6.6);});g.fillStyle='rgba(255,255,255,.22)';g.fillRect(322,157,5,32);g.restore();rr(g,316,157,42,30,[2,2,7,7]);g.strokeStyle=INK;g.lineWidth=2.2;g.stroke();
 rr(g,301,104,11,10,2.5);fs(g,'#5a2a8a',INK,2);rr(g,295,112,23,35,6.5);fs(g,'#8f55d8',INK,2.2);rr(g,298.5,121,16,19,3);g.fillStyle='#fff8e8';g.fill();
 ell(g,305.5,133,5,3.6);g.fillStyle='#3fa23a';g.fill();circ(g,310.5,128.5,2.6);g.fill();g.fillRect(302.5,134,1.8,4);g.fillRect(307.5,134,1.8,4);g.fillStyle='rgba(255,255,255,.35)';rr(g,297.5,115,3,26,1.5);g.fill();
 g.fillStyle='#b9c0cc';g.fillRect(330.5,112,3.6,9);rr(g,325,107.5,13,5.5,2);fs(g,'#e6eaf0',INK,1.8);rr(g,323.5,120,17,27,4.5);fs(g,'#ef4136',INK,2.2);rr(g,326,128,12,9,2);g.fillStyle='#fff';g.fill();g.fillStyle='rgba(255,255,255,.35)';rr(g,325.5,123,2.6,20,1.3);g.fill();
 rr(g,346,129,23,18,5);fs(g,'#3fc7c0',INK,2.2);rr(g,344.5,124,26,7,2.5);fs(g,'#ffd43b',INK,2);g.fillStyle='rgba(255,255,255,.4)';rr(g,349,134,3,9,1.5);g.fill();
 rr(g,286,146,90,8,3);fs(g,'#d39a5a',INK,2.4);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(290,148,82,1.8);
 // floor + bath mat peeking out under the tub
 g.fillStyle='#184a8c';g.fillRect(0,556,W,44);rr(g,46,578,288,40,10);fs(g,'#b9cf3a','#5f7a12',2.5);
 // tub: shadow on the wall, rim, basin
 g.fillStyle='rgba(6,30,70,.3)';rpoly(g,[[18,184],[362,184],[380,330],[0,330]],[30,30,10,10]);g.fill();
 rpoly(g,RIM,RIM_R);gr=g.createLinearGradient(0,188,0,592);gr.addColorStop(0,'#ffffff');gr.addColorStop(.5,'#f4f7fb');gr.addColorStop(1,'#dbe4ef');fs(g,gr,'#1f3a5c',3.5);
 g.save();rpoly(g,BAS,BAS_R);gr=g.createLinearGradient(0,206,0,570);gr.addColorStop(0,'#c3d2e2');gr.addColorStop(.2,'#dbe6f0');gr.addColorStop(1,'#c8d6e6');g.fillStyle=gr;g.fill();g.clip();
 gr=g.createLinearGradient(0,204,0,240);gr.addColorStop(0,'rgba(30,60,105,.4)');gr.addColorStop(1,'rgba(30,60,105,0)');g.fillStyle=gr;g.fillRect(0,204,W,40);g.restore();
 rpoly(g,BAS,BAS_R);g.strokeStyle='#1f3a5c';g.lineWidth=2.6;g.stroke();
 g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=3;g.beginPath();g.moveTo(150,197);g.lineTo(332,197);g.stroke();g.beginPath();g.moveTo(30,582);g.lineTo(150,582);g.stroke();g.beginPath();g.moveTo(168,582);g.lineTo(182,582);g.stroke();
 g.strokeStyle='rgba(120,150,190,.35)';g.lineWidth=2.5;g.beginPath();g.moveTo(40,587);g.lineTo(340,587);g.stroke();
 // faucet + knobs
 ell(g,96,198,34,6.5);fs(g,'#c9d2dd','#1f3a5c',2.2);
 [[66,'#ef4136'],[126,'#3f8fe6']].forEach(k=>{rr(g,k[0]-4,186,8,10,2);fs(g,'#aeb8c6','#1f3a5c',2);circ(g,k[0],184,6.5);fs(g,k[1],'#1f3a5c',2.2);circ(g,k[0]-1.8,182.2,1.9);g.fillStyle='rgba(255,255,255,.7)';g.fill();});
 const sp=new Path2D('M86 198L86 180Q86 167 96 167Q106 167 106 180L106 191');g.strokeStyle='#1f3a5c';g.lineWidth=13;g.stroke(sp);g.strokeStyle='#d3dbe6';g.lineWidth=8.5;g.stroke(sp);
 g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=2.2;g.stroke(new Path2D('M84.5 194L84.5 180Q85 170 93 169'));
 rr(g,100.5,188,11,6,2);fs(g,'#aeb8c6','#1f3a5c',2);
}
function buildBg(){bgCv=bgCv||document.createElement('canvas');bgCv.width=cv.width;bgCv.height=cv.height;const g=bgCv.getContext('2d');g.setTransform(SC,0,0,SC,0,0);paintBg(g);bgDirty=false;}

// ───────────────────────── water ─────────────────────────
const wv=x=>Math.sin((x+wave)*.088)*3+Math.sin((x-wave*.8)*.12)*1.6;
const FOAM=(()=>{const R=rng(5),a=[];for(let i=0;i<64;i++){const k=i%4,y=262+R()*296,f=(y-206)/364;let x;if(k===0)x=38-24*f+3+R()*9;else if(k===1)x=342+24*f-3-R()*9;else{x=34+R()*312;}a.push({x,y:k>1?(k===2?563-R()*9:WL+2+R()*7):y,r:2.6+R()*4.6,ph:R()*6.28});}return a;})();
function waterBase(){X.save();rpoly(X,BAS,BAS_R);X.clip();
 const g=X.createLinearGradient(0,WL,0,570);g.addColorStop(0,'#a6ecfa');g.addColorStop(.22,'#5cc6f3');g.addColorStop(1,'#2a8cdb');X.fillStyle=g;
 X.beginPath();X.moveTo(0,WL);for(let x=0;x<=W;x+=6)X.lineTo(x,WL+wv(x));X.lineTo(W,H);X.lineTo(0,H);X.closePath();X.fill();
 // drifting light glints
 X.lineWidth=2.4;X.lineCap='round';
 for(let j=0;j<7;j++){const y0=282+j*43;X.strokeStyle='rgba(255,255,255,'+(.15+.05*Math.sin(wave*.02+j)).toFixed(3)+')';X.setLineDash([22+j%3*8,26]);X.lineDashOffset=wave*.22*(j%2?1:-1)+j*17;X.beginPath();
  for(let x=4;x<=376;x+=12){const y=y0+Math.sin(x*.045+wave*.025+j*1.7)*6+Math.sin(x*.1-wave*.018+j)*3;x===4?X.moveTo(x,y):X.lineTo(x,y);}X.stroke();}
 X.setLineDash([]);
 // foam: along the back waterline and hugging the tub edges
 X.beginPath();for(let i=0;i<27;i++){const x=22+i*13+Math.sin(wave*.03+i)*3,r=3.4+(i*7%5)*.9;X.moveTo(x+r,WL+wv(x)+1.5);X.arc(x,WL+wv(x)+1.5,r,0,TAU);}
 FOAM.forEach(b=>{const y=b.y+Math.sin(wave*.04+b.ph)*1.6;X.moveTo(b.x+b.r,y);X.arc(b.x,y,b.r,0,TAU);});
 X.fillStyle='rgba(255,255,255,.9)';X.fill();X.strokeStyle='rgba(110,185,235,.55)';X.lineWidth=1;X.stroke();
 X.restore();}
function faucetDrip(){const t=(wave*.0045)%1;if(t<.3){const k=t/.3,y=195+k*k*54;X.beginPath();X.moveTo(106,y-5);X.quadraticCurveTo(109.6,y,106,y+2.6);X.quadraticCurveTo(102.4,y,106,y-5);fs(X,'#d9f4ff','#3f8fd0',1);}
 else if(t<.5){const k=(t-.3)/.2;X.save();X.globalAlpha=(1-k)*.8;X.strokeStyle='#fff';X.lineWidth=1.5;ell(X,106,251,3+k*10,1+k*3);X.stroke();X.restore();}}
// draw something that sits IN the water: solid above the waterline, ghosted below it
function floatDraw(wy,fn){X.save();X.beginPath();X.rect(-30,-30,W+60,wy+30);X.clip();fn();X.restore();
 X.save();X.beginPath();X.rect(-30,wy,W+60,80);X.clip();X.globalAlpha=.2;fn();X.restore();}
function ripple(x,y,rx,ph){const p=(wave*.011+(ph||0))%1;X.save();X.strokeStyle='#fff';X.lineWidth=1.7;X.lineCap='round';X.globalAlpha=.75;X.beginPath();X.ellipse(x,y,rx,rx*.2,0,.12,PI-.12);X.stroke();
 X.globalAlpha=.4*(1-p);ell(X,x,y,rx*(1.05+p*.5),rx*.2*(1.05+p*.5));X.stroke();X.restore();}

// ───────────────────────── volcano ─────────────────────────
const VB=92,VYB=314;
function slope(s,cr){const hw=(1-s)*(1-s)*(cr+4)+2*s*(1-s)*(cr+16)+s*s*VB,y=CY+1+2*s*(1-s)*71+s*s*(VYB-CY-1);return[hw,y];}
function volPath(cr,ry){X.beginPath();X.moveTo(CX-cr-4,CY+1);X.quadraticCurveTo(CX-cr-16,CY+72,CX-VB,VYB);X.quadraticCurveTo(CX,VYB+26,CX+VB,VYB);X.quadraticCurveTo(CX+cr+16,CY+72,CX+cr+4,CY+1);X.quadraticCurveTo(CX,CY+ry*2+9,CX-cr-4,CY+1);X.closePath();}
const ROCKS=(()=>{const R=rng(23),a=[];for(let i=0;i<34;i++)a.push({u:R()*2-1,s:.08+R()*.9,w:4+R()*6,f:R()});return a;})();
const RIVS=[{a:-.9,len:.86,ph:1},{a:-.56,len:.5,ph:3.1},{a:.6,len:.62,ph:5},{a:.93,len:.8,ph:2.2},{a:-.16,len:.13,ph:0},{a:.2,len:.1,ph:4}];
function lookTarget(){let o=null;if(charging)o=charging.o;else if(pendingLaunch)o=pendingLaunch.o;else o=objs.find(q=>q.st==='fly');if(!o&&ejecta.length)o=ejecta.find(e=>e.delay<=0);return o||null;}
function volcano(){const cr=craterR,ry=cr*.4,hot=state==='erupt'||state==='win',fp=hot?1:collected/Math.max(need,1),pl=Math.sin(volP)*.5+.5;
 // glow on the wall behind
 X.save();X.globalAlpha=Math.min(1,(.16+pl*.14)+fp*.3);const R0=cr*(3+fp*1.5),rg=X.createRadialGradient(CX,CY,0,CX,CY,R0);rg.addColorStop(0,fp>.6?'#ff6a1a':'#ffb347');rg.addColorStop(1,'rgba(255,90,0,0)');X.fillStyle=rg;circ(X,CX,CY,R0);X.fill();X.restore();
 // steam
 if(state==='play'||state==='menu'){const n=fp>.5?5:3;for(let i=0;i<n;i++){const ag=(wave*.7+i*28)%80,p=ag/80;X.save();X.globalAlpha=(1-p)*.42;X.fillStyle=fp>.6?'#ffb08a':'#fff1d6';circ(X,CX+(i-2)*8+Math.sin(p*5+i)*6,CY-10-p*(34+fp*22),4+p*10);X.fill();X.restore();}}
 // back rim, hole, lava pool
 ell(X,CX,CY,cr+5,ry+5);fs(X,'#4a4048','#0e0a10',3);ell(X,CX,CY+1,cr,ry);X.fillStyle='#1a0806';X.fill();
 X.save();ell(X,CX,CY+1,cr,ry);X.clip();const ly=CY+1+ry*.55*(1-fp),lg=X.createRadialGradient(CX,ly,1,CX,ly,cr);lg.addColorStop(0,fp>.55?'#fff6b0':'#ffc84d');lg.addColorStop(.55,fp>.55?'#ff8a1a':'#f2600f');lg.addColorStop(1,'#8a1a05');
 ell(X,CX,ly,cr*.98,ry*.95);X.fillStyle=lg;X.fill();
 for(let i=0;i<3;i++){const p=(wave*.018+i*.37)%1;X.globalAlpha=1-p;circ(X,CX+(i-1)*cr*.5+Math.sin(i*9)*3,ly+Math.cos(i*5)*ry*.3,(1.4+i*.9)*Math.sin(p*PI)+.4);X.fillStyle='#fff3a0';X.fill();}X.restore();
 // eruption fountain rises from inside the crater
 if(hot&&eruptT>104){const k=Math.min(1,(160-eruptT)/9)*Math.min(1,(eruptT-104)/16),h=175*k,wob=Math.sin(wave*.6)*4,g=X.createLinearGradient(0,CY,0,CY-h);g.addColorStop(0,'#fff6b0');g.addColorStop(.35,'#ffb21a');g.addColorStop(.8,'rgba(245,80,15,.85)');g.addColorStop(1,'rgba(240,60,10,0)');
  X.fillStyle=g;X.beginPath();X.moveTo(CX-cr*.8,CY+2);X.quadraticCurveTo(CX-cr*.45+wob,CY-h*.5,CX-13-wob,CY-h);X.lineTo(CX+13-wob,CY-h);X.quadraticCurveTo(CX+cr*.45+wob,CY-h*.5,CX+cr*.8,CY+2);X.closePath();X.fill();}
 // cone
 const bg=X.createLinearGradient(CX-VB,0,CX+VB,0);bg.addColorStop(0,'#5b4f58');bg.addColorStop(.38,'#3a3038');bg.addColorStop(1,'#1b151b');
 volPath(cr,ry);fs(X,bg,null);
 X.save();volPath(cr,ry);X.clip();X.lineCap='round';
 ROCKS.forEach(r=>{const q=slope(r.s,cr),x=CX+r.u*q[0]*.88,y=q[1]+(1-r.u*r.u)*(ry+4)*(1-r.s)+6;X.strokeStyle='rgba(8,4,8,.5)';X.lineWidth=1.8;X.beginPath();X.arc(x,y,r.w,.25,PI-.25);X.stroke();X.strokeStyle='rgba(255,255,255,'+(r.u<0?.11:.05)+')';X.lineWidth=1.4;X.beginPath();X.arc(x,y+r.w*.9,r.w*.8,PI+.5,TAU-.5);X.stroke();});
 // heat building up from below as it fills
 if(fp>0){const hg=X.createLinearGradient(0,VYB+16,0,VYB+16-(VYB-CY)*Math.min(1,fp*1.1));hg.addColorStop(0,'rgba(255,90,10,'+(.34+pl*.12).toFixed(3)+')');hg.addColorStop(1,'rgba(255,90,10,0)');X.fillStyle=hg;X.fillRect(CX-VB-4,CY,VB*2+8,VYB-CY+30);}
 const sg=X.createLinearGradient(0,VYB-30,0,VYB+16);sg.addColorStop(0,'rgba(10,30,70,0)');sg.addColorStop(1,'rgba(10,30,70,.5)');X.fillStyle=sg;X.fillRect(CX-VB-4,VYB-30,VB*2+8,60);
 X.restore();
 volPath(cr,ry);X.strokeStyle='#0e0a10';X.lineWidth=3.5;X.lineJoin='round';X.stroke();
 // lava rivulets creep further down the more toys are in
 X.lineCap=X.lineJoin='round';
 RIVS.forEach(rv=>{const tm=rv.len*(.34+.66*fp),pts=[];for(let s=0;s<=tm+.001;s+=.03){const q=slope(s,cr);pts.push([CX+rv.a*q[0]*(1-.1*s)+Math.sin(s*15+rv.ph)*3.2*Math.min(1,s*6),q[1]+(1-rv.a*rv.a)*(ry+4)*(1-s)]);}
  const path=()=>{X.beginPath();pts.forEach((p,i)=>i?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));},e=pts[pts.length-1];
  path();X.strokeStyle='#7a1404';X.lineWidth=8.5;X.stroke();circ(X,e[0],e[1]+1,5.4);X.fillStyle='#7a1404';X.fill();
  path();X.strokeStyle=fp>.6?'#ff7a1a':'#f55a12';X.lineWidth=5.4;X.stroke();circ(X,e[0],e[1]+1,3.8);X.fillStyle=fp>.6?'#ff7a1a':'#f55a12';X.fill();
  path();X.strokeStyle='rgba(255,220,90,'+(.7+pl*.3).toFixed(2)+')';X.lineWidth=2;X.stroke();});
 // glowing front lip
 X.beginPath();X.moveTo(CX-cr-3,CY+2);X.quadraticCurveTo(CX,CY+ry*2+8,CX+cr+3,CY+2);X.strokeStyle='rgba(255,'+(~~(170+pl*70-fp*60))+',40,'+(.75+pl*.25).toFixed(2)+')';X.lineWidth=2.6+fp*1.4;X.stroke();
 // target ring
 if(state==='play'){X.save();X.strokeStyle='rgba(255,236,150,.6)';X.lineWidth=1.6;X.setLineDash([5,6]);X.lineDashOffset=-wave*.25;ell(X,CX,CY,cr+10,ry+8);X.stroke();X.restore();}
 // face
 const ey=CY+47,dx=Math.min(17,slope(.3,cr)[0]*.4),t=lookTarget(),gulp=volGulp;let px=0,py=-.3;
 if(t){const d=Math.hypot(t.x-CX,t.y-ey)||1;px=(t.x-CX)/d;py=(t.y-ey)/d;}else{px=Math.sin(wave*.011)*.6;py=-.2+Math.cos(wave*.017)*.3;}
 const blink=!hot&&((wave*.9+80)%260)<8;
 [-1,1].forEach(sg2=>{const ex=CX+dx*sg2;
  if(hot){X.strokeStyle='#fff';X.lineWidth=3.6;X.beginPath();X.arc(ex,ey+4,8,PI*1.12,PI*1.88);X.stroke();}
  else if(blink){X.strokeStyle='#fff';X.lineWidth=3;X.beginPath();X.moveTo(ex-8,ey+1);X.lineTo(ex+8,ey+1);X.stroke();}
  else{ell(X,ex,ey,10,11.5+gulp*1.5);fs(X,'#fff','#0e0a10',2.5);circ(X,ex+px*3.6,ey+py*4,5.3);X.fillStyle='#1a0a00';X.fill();circ(X,ex+px*3.6+1.8,ey+py*4-2,1.9);X.fillStyle='#fff';X.fill();}
  if(fp>.6&&!hot){X.strokeStyle='#0e0a10';X.lineWidth=3;X.beginPath();X.moveTo(ex-9*sg2,ey-17);X.lineTo(ex+7*sg2,ey-13.5);X.stroke();}
  ell(X,CX+(dx+13)*sg2,ey+14,6.5,4);X.fillStyle='rgba(255,110,50,.45)';X.fill();});
 const my=CY+69,mw=(hot?15:8+fp*6)+gulp*3,mh=(hot?24:5+fp*13)+gulp*7;
 const mouth=()=>{X.beginPath();X.moveTo(CX-mw,my);X.quadraticCurveTo(CX,my+2.5,CX+mw,my);X.quadraticCurveTo(CX+mw,my+mh,CX,my+mh);X.quadraticCurveTo(CX-mw,my+mh,CX-mw,my);X.closePath();};
 X.save();mouth();X.fillStyle='#6a0f0f';X.fill();X.clip();ell(X,CX,my+mh,mw*.62,mh*.42);X.fillStyle='#ff7a6a';X.fill();if(mh>12){X.fillStyle='#fff';rr(X,CX-mw*.45,my,mw*.9,3.6,1.5);X.fill();}X.restore();mouth();X.strokeStyle='#0e0a10';X.lineWidth=2.5;X.stroke();
 // foam where the cone meets the bathwater
 X.beginPath();for(let i=0;i<=18;i++){const u=i/18,x=(1-u)*(1-u)*(CX-VB)+2*u*(1-u)*CX+u*u*(CX+VB)+Math.sin(wave*.03+i)*1.2,y=VYB+2*u*(1-u)*26+1+Math.sin(wave*.05+i*2)*1.2,r=3.6+(i*5%4)*1.1;X.moveTo(x+r,y);X.arc(x,y,r,0,TAU);}
 X.fillStyle='rgba(255,255,255,.92)';X.fill();X.strokeStyle='rgba(110,185,235,.55)';X.lineWidth=1;X.stroke();
}

// ───────────────────────── Noah & Max ─────────────────────────
const SK_N='#e39c64',SH_N='#c47a45',HR_N='#2b1608',SK_M='#f0b47e',SH_M='#d2925c',HR_M='#c8611c';
function limb(pts,w,col){X.lineCap=X.lineJoin='round';X.beginPath();pts.forEach((p,i)=>i?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));X.strokeStyle=INK;X.lineWidth=w+5;X.stroke();X.strokeStyle=col;X.lineWidth=w;X.stroke();}
function head(x,y,r,skin,shade,hair,hairHi,o){X.save();X.translate(x,y);X.scale(r/26,r/26);X.lineJoin=X.lineCap='round';
 [-1,1].forEach(sg=>{ell(X,27*sg,2,6.5,8.5);fs(X,skin,INK,2.6);ell(X,27*sg,2,3,4.6);X.fillStyle=shade;X.fill();});
 const g=X.createRadialGradient(-7,-8,6,0,0,28);g.addColorStop(0,skin);g.addColorStop(.72,skin);g.addColorStop(1,shade);circ(X,0,0,26);fs(X,g,INK,3);
 X.save();if(o.flip)X.scale(-1,1);
 X.beginPath();X.moveTo(-27,3);X.quadraticCurveTo(-35,-15,-24,-24);X.lineTo(-29,-33);X.lineTo(-17,-30);X.lineTo(-14,-41);X.lineTo(-5,-33);X.lineTo(2,-43);X.lineTo(8,-33);X.lineTo(18,-40);X.lineTo(19,-29);X.lineTo(31,-31);X.quadraticCurveTo(35,-14,27,3);
 X.quadraticCurveTo(25,-12,17,-17);X.lineTo(12,-10.5);X.lineTo(5,-18);X.lineTo(-1,-10.5);X.lineTo(-8,-18);X.lineTo(-13,-11);X.lineTo(-19,-17);X.quadraticCurveTo(-25,-11,-27,3);X.closePath();fs(X,hair,INK,2.6);
 X.strokeStyle=hairHi;X.lineWidth=2.2;X.beginPath();X.moveTo(-18,-25);X.quadraticCurveTo(-10,-31,-3,-27);X.moveTo(6,-28);X.quadraticCurveTo(14,-32,21,-24);X.stroke();X.restore();
 const lx=o.look?o.look[0]:0,ly=o.look?o.look[1]:0;
 [-1,1].forEach(sg=>{const ex=10*sg,ey=1;
  if(o.laugh){X.beginPath();X.arc(ex,ey+3.5,6,PI*1.12,PI*1.88);X.strokeStyle=INK;X.lineWidth=2.9;X.stroke();}
  else{const px=ex+lx*1.8,py=ey+ly*1.8;ell(X,px,py,4.1,5.4);X.fillStyle='#1a0a00';X.fill();circ(X,px+1.3,py-2,1.7);X.fillStyle='#fff';X.fill();circ(X,px-1.2,py+2,.8);X.fillStyle='rgba(255,255,255,.7)';X.fill();}
  if(o.mis){X.strokeStyle=INK;X.lineWidth=2.6;X.beginPath();X.moveTo(ex+7*sg,ey-13);X.lineTo(ex-5*sg,ey-8.6);X.stroke();}
  ell(X,19.5*sg,9,6.2,4.2);X.fillStyle='rgba(255,84,60,.42)';X.fill();});
 if(o.freckles){X.fillStyle='rgba(150,70,30,.7)';[[-21,6],[-17,9.5],[-14,5.5],[21,6],[17,9.5],[14,5.5],[0,5]].forEach(f=>{circ(X,f[0],f[1],1.1);X.fill();});}
 X.strokeStyle=shade;X.lineWidth=1.8;X.beginPath();X.arc(0,4.5,2.2,.3,PI-.3);X.stroke();
 const mw=o.laugh?12:9.5,mh=o.laugh?13:8,my=10.5;if(o.mis&&!o.laugh)X.rotate(-.1);
 const mouth=()=>{X.beginPath();X.moveTo(-mw,my);X.quadraticCurveTo(0,my+2,mw,my);X.quadraticCurveTo(mw*.95,my+mh,0,my+mh);X.quadraticCurveTo(-mw*.95,my+mh,-mw,my);X.closePath();};
 X.save();mouth();X.fillStyle='#7a1010';X.fill();X.clip();X.fillStyle='#fff';X.fillRect(-mw,my,mw*2,o.laugh?4.6:3.6);ell(X,0,my+mh,mw*.6,mh*.42);X.fillStyle='#ff8a7a';X.fill();X.restore();mouth();X.strokeStyle=INK;X.lineWidth=2.4;X.stroke();
 X.restore();}
function torso(x,top,w,bot,skin,shade){const g=X.createLinearGradient(x-w,0,x+w,0);g.addColorStop(0,skin);g.addColorStop(.7,skin);g.addColorStop(1,shade);
 X.beginPath();X.moveTo(x-w+3,bot);X.lineTo(x-w,top+17);X.quadraticCurveTo(x-w,top,x-w+16,top);X.lineTo(x+w-16,top);X.quadraticCurveTo(x+w,top,x+w,top+17);X.lineTo(x+w-3,bot);X.closePath();fs(X,g,INK,3);}
function nameTag(s,x,y,col){txt(s,x,y,11,col,{w:900,s:'rgba(10,40,80,.85)',sw:3.6});}
function kid(){const kx=190,base=372,hy=base-44,s=splashSide,wy=base+22,cheer=state==='erupt'||state==='win',t=lookTarget();
 let look=[0,.15];if(t){const d=Math.hypot(t.x-kx,t.y-hy)||1;look=[(t.x-kx)/d,(t.y-hy)/d];}
 X.save();X.globalAlpha=.24;X.fillStyle='#0b3f8f';ell(X,kx,wy+13,36,12);X.fill();X.restore();
 floatDraw(wy,()=>{
  if(!cheer){limb([[kx-18*s,base-20],[kx-33*s,base-2],[kx-45*s,base+12]],11,SH_N);
   const sX=kx+18*s,sY=base-20,ex=sX+s*Math.cos(armAng)*26,ey=sY+Math.sin(armAng)*26,hx=ex+s*Math.cos(armAng+0.5)*22,hy2=ey+Math.sin(armAng+0.5)*22;
   limb([[sX,sY],[ex,ey],[hx,hy2]],11,SK_N);circ(X,hx,hy2,8.5);fs(X,SK_N,INK,2.4);}
  else[-1,1].forEach(sg=>{const w2=Math.sin(wave*.25+sg)*5,hx=kx+43*sg+w2,hy2=hy-20;limb([[kx+18*sg,base-20],[kx+38*sg,base-22],[hx,hy2]],11,SK_N);circ(X,hx,hy2-3,8.5);fs(X,SK_N,INK,2.4);});
  torso(kx,base-34,25,base+40,SK_N,SH_N);
  head(kx,hy,26,SK_N,SH_N,HR_N,'#5a3418',{laugh:cheer||swingT>0||!!pendingLaunch,look});
 });
 ripple(kx,wy,37,0);nameTag('NOAH',kx,wy+19,'#bff0ff');}
function maxBlocker(){if(!blk.on)return;const mx=blk.x,hY=blk.y,headY=blk.y+38,wob=Math.sin(wave*.22)*2,wy=headY+48,t=lookTarget();
 let look=[0,-.6];if(t){const d=Math.hypot(t.x-mx,t.y-headY)||1;look=[(t.x-mx)/d,(t.y-headY)/d];}
 X.save();X.globalAlpha=.22;X.fillStyle='#0b3f8f';ell(X,mx,wy+11,30,10);X.fill();X.restore();
 floatDraw(wy,()=>{
  [[-1,wob],[1,-wob]].forEach(a=>{const sg=a[0],hy2=hY+a[1];limb([[mx+15*sg,headY+20],[mx+25*sg,headY-2],[mx+15*sg,hy2+7]],9.5,SK_M);
   X.strokeStyle=INK;X.lineWidth=4.6;X.lineCap='round';const hx=mx+14*sg;[[-6.5,-8],[0,-11],[6.5,-8]].forEach(f=>{circ(X,hx+f[0],hy2+f[1],3.3);X.stroke();});circ(X,hx,hy2,9.5);X.stroke();
   X.fillStyle=SK_M;[[-6.5,-8],[0,-11],[6.5,-8]].forEach(f=>{circ(X,hx+f[0],hy2+f[1],3.3);X.fill();});circ(X,hx,hy2,9.5);X.fill();});
  torso(mx,headY+13,21,wy+16,SK_M,SH_M);
  head(mx,headY,22,SK_M,SH_M,HR_M,'#e88a3a',{mis:true,freckles:true,flip:true,look});
 });
 ripple(mx,wy,31,.4);nameTag('MAX',mx,wy+18,'#ffd9a0');}

// ───────────────────────── toys in play ─────────────────────────
function drawHairball(x,y,r,sq){const s1=1+sq*.3,s2=1-sq*.2;X.save();X.translate(x,y);X.scale(s1,s2);X.lineJoin=X.lineCap='round';
 X.beginPath();for(let i=0;i<26;i++){const a=i/26*TAU+wave*.01,q=i%2?r+5+Math.sin(wave*.18+i)*2:r-.5;X.lineTo(Math.cos(a)*q,Math.sin(a)*q);}X.closePath();fs(X,'#8a5a2a','#3f2710',2.4);
 circ(X,0,0,r-1.5);X.fillStyle='#9a6832';X.fill();
 X.strokeStyle='#6b4423';X.lineWidth=1.5;for(let i=0;i<3;i++){X.beginPath();X.arc(2-i*2,-3+i*3,r-5-i*2.5,.5+i*.5,2.5+i*.6);X.stroke();}
 [[-5,-3],[5,-3]].forEach(e=>{circ(X,e[0],e[1],4.6);fs(X,'#fff',INK,1.3);circ(X,e[0]+1,e[1]+.4,2.2);X.fillStyle='#1a0a00';X.fill();});
 X.strokeStyle='#3a2410';X.lineWidth=1.9;X.beginPath();X.arc(0,3.5,4,.2,PI-.2);X.stroke();X.restore();}
function grabRing(x,y,r,col,ph){X.save();X.globalAlpha=.5+Math.sin(wave*.08+ph)*.22;X.strokeStyle=col;X.lineWidth=2.2;X.lineCap='round';X.setLineDash([2.5,7.5]);X.lineDashOffset=-wave*.3;circ(X,x,y,r);X.stroke();X.restore();}
function drawObjs(){objs.forEach(o=>{if(o.st==='gone')return;const fly=o.st==='fly',held=(charging&&charging.o===o)||(pendingLaunch&&pendingLaunch.o===o),by=o.y+((fly||held)?0:Math.sin(wave*.045+o.bob)*3.2);
 const canGrab=o.st==='float'&&!charging&&!pendingLaunch&&swingT<=0,isNew=o.isNew&&newToyT>0,sq=o.sq||0;
 if(fly){X.save();X.translate(o.x,by);if(o.hb){X.rotate(o.rot||0);drawHairball(0,0,o.r,sq);}else{X.rotate(o.rot||0);X.scale(1+sq*.4,1-sq*.3);paintToy(o.em,36);}X.restore();return;}
 const wy=by+(o.hb?10:12),jig=held&&charging?(Math.random()-.5)*charging.c*1.6:0;
 if(o.hb)floatDraw(wy,()=>drawHairball(o.x+jig,by,o.r,sq));
 else floatDraw(wy,()=>{X.save();X.translate(o.x+jig,by);X.rotate(Math.sin(wave*.03+o.bob)*.09);X.scale(1+sq*.4,1-sq*.3);paintToy(o.em,36);X.restore();});
 ripple(o.x,wy,o.hb?19:23,o.bob);
 if(canGrab)grabRing(o.x,by,o.hb?28:29,o.hb||isNew?'#ffd23f':'#ffffff',o.bob);
 if(o.hb&&canGrab){txt('BONUS! +5s',o.x,by-31,11.5,'#ffd23f',{w:900,s:'#3a2410',sw:3.4});txt(Math.ceil(o.life)+'s',o.x,by+36,10,'#fff',{w:900,s:'#3a2410',sw:3});}
 if(isNew){const pu=(Math.sin(wave*.2)+1)/2;X.save();X.globalAlpha=.6+pu*.4;X.strokeStyle='#ffd23f';X.lineWidth=3;circ(X,o.x,by,31+pu*2);X.stroke();txt('NEW!',o.x,by-37,13,'#ffd23f',{w:900,s:'#3a2410',sw:3.6});X.restore();}
});}
function demoToys(){[['🦆',74,404,0],['⛵',268,368,2],['🦕',310,412,4]].forEach(d=>{const by=d[2]+Math.sin(wave*.045+d[3])*3.2,wy=by+12;floatDraw(wy,()=>{X.save();X.translate(d[1],by);X.rotate(Math.sin(wave*.03+d[3])*.09);paintToy(d[0],36);X.restore();});ripple(d[1],wy,23,d[3]);});}
function drawRings(){rings.forEach(r=>{X.save();X.globalAlpha=Math.max(0,r.life)*(r.big?.6:.6);X.strokeStyle=r.big?'#fff3d0':'#ffffff';X.lineWidth=r.big?6:2;ell(X,r.x,r.y,r.r,r.r*(r.big?.55:.36));X.stroke();if(!r.big){X.globalAlpha*=.5;ell(X,r.x,r.y,r.r*.6,r.r*.2);X.stroke();}X.restore();});}
function drawEjecta(){ejecta.forEach(e=>{if(e.delay>0)return;X.save();X.translate(e.x,e.y);X.rotate(e.rot);paintToy(e.em,40);X.restore();});}
function drawParts(){
 smoke.forEach(p=>{X.globalAlpha=Math.max(0,p.life)*.5;X.fillStyle=p.c;circ(X,p.x,p.y,p.r);X.fill();});X.globalAlpha=1;
 parts.forEach(p=>{const sp=Math.hypot(p.vx,p.vy),r=p.r*p.life;if(r<.3)return;X.save();X.globalAlpha=Math.min(1,p.life*1.3);X.translate(p.x,p.y);X.rotate(Math.atan2(p.vy,p.vx));X.fillStyle=p.col;ell(X,0,0,r*(1+Math.min(sp,9)*.07),r*.82);X.fill();
  if(r>2.2){X.fillStyle='rgba(255,255,255,.75)';circ(X,r*.2,-r*.3,r*.3);X.fill();}X.restore();});
 eParts.forEach(p=>{X.globalAlpha=Math.min(1,p.life*1.2);X.fillStyle='#b3200a';circ(X,p.x,p.y,p.r+1.2);X.fill();X.fillStyle=p.col;circ(X,p.x,p.y,p.r);X.fill();X.fillStyle='rgba(255,246,170,.9)';circ(X,p.x-p.r*.15,p.y-p.r*.2,p.r*.45);X.fill();});X.globalAlpha=1;}
function chargeGuide(){if(!charging)return;const o=charging.o,iv=ideal(o),f=charging.c,dr=diff().drift*.012;
 let vx=iv.vx*f,vy=iv.vy*f,tx=o.x,ty=o.y,onTarget=false;const pts=[];
 for(let i=0;i<110;i++){vy+=G;vx+=dr;tx+=vx;ty+=vy;if(catchHit(tx,ty,vy)){onTarget=true;break;}if(ty>556||tx<0||tx>W)break;pts.push({x:tx,y:ty});}
 const col=onTarget?'#4be08a':(o.hb?'#ffd23f':'#8fe6ff'),dark=onTarget?'#0b5a30':(o.hb?'#6a4a00':'#0d4a78');
 pts.forEach((p,i)=>{if((i+~~(wave*.25))%3)return;const r=Math.max(2.2,4.8-i*.028);X.save();X.globalAlpha=Math.max(.3,1-i/120);circ(X,p.x,p.y,r+1.3);X.fillStyle=dark;X.fill();circ(X,p.x,p.y,r);X.fillStyle=col;X.fill();X.restore();});
 const frac=Math.min(f/1.4,1);X.lineCap='round';X.strokeStyle='rgba(10,30,60,.55)';X.lineWidth=8;circ(X,o.x,o.y,31);X.stroke();
 X.strokeStyle=col;X.lineWidth=5;X.beginPath();X.arc(o.x,o.y,31,-PI/2,-PI/2+TAU*frac);X.stroke();
 const pu=onTarget?1+Math.sin(wave*.5)*.08:1;X.save();X.translate(o.x,o.y-44);X.scale(pu,pu);txt(onTarget?'RELEASE!':'hold…',0,0,onTarget?15:13,col,{w:900,s:dark,sw:4});X.restore();
 if(onTarget){X.save();X.strokeStyle='#4be08a';X.lineWidth=3.5;X.globalAlpha=.7+Math.sin(wave*.5)*.3;ell(X,CX,CY,craterR+11,craterR*.4+9);X.stroke();X.restore();}}
function aimHint(){if(hintT<=0||charging)return;const o=objs.find(o=>o.st==='float'&&!o.hb);if(!o)return;
 const a=(Math.sin(wave*.12)+1)/2,p=(wave*.02)%1;X.save();X.strokeStyle='#fff';X.lineWidth=2.5;X.globalAlpha=(1-p)*.9;circ(X,o.x,o.y,14+p*26);X.stroke();X.globalAlpha=.7+a*.3;
 txt('Hold a toy to wind up,',o.x<120?120:o.x>260?260:o.x,o.y+56,12.5,'#fff',{w:900,s:'#0d3a66',sw:3.8});txt('release to splash it in!',o.x<120?120:o.x>260?260:o.x,o.y+72,12.5,'#fff',{w:900,s:'#0d3a66',sw:3.8});X.restore();}

// ───────────────────────── HUD ─────────────────────────
const HUDH=62;
function icoFlame(x,y,s){X.beginPath();X.moveTo(x,y-s);X.quadraticCurveTo(x+s*.9,y-s*.1,x+s*.55,y+s*.6);X.quadraticCurveTo(x,y+s*1.1,x-s*.55,y+s*.6);X.quadraticCurveTo(x-s*.9,y,x-s*.25,y-s*.35);X.quadraticCurveTo(x-s*.1,y-s*.6,x,y-s);X.closePath();fs(X,'#ff7a1a','#7a1404',1.4);ell(X,x,y+s*.35,s*.28,s*.4);X.fillStyle='#ffe066';X.fill();}
function icoClock(x,y,r,col){circ(X,x,y,r);fs(X,'#fff',col,2);X.strokeStyle=col;X.lineWidth=1.8;X.lineCap='round';X.beginPath();X.moveTo(x,y-r*.55);X.lineTo(x,y);X.lineTo(x+r*.4,y+r*.2);X.stroke();}
function roundBtn(x,y){circ(X,x,y,13);fs(X,'rgba(255,255,255,.14)','rgba(255,255,255,.45)',1.5);}
function drawMute(){const x=W-22,y=46;roundBtn(x,y);X.fillStyle='#fff';X.beginPath();X.moveTo(x-7,y-2.6);X.lineTo(x-4,y-2.6);X.lineTo(x,y-6.5);X.lineTo(x,y+6.5);X.lineTo(x-4,y+2.6);X.lineTo(x-7,y+2.6);X.closePath();X.fill();
 X.strokeStyle='#fff';X.lineWidth=1.7;X.lineCap='round';if(muted){X.beginPath();X.moveTo(x+2.6,y-3);X.lineTo(x+7.6,y+3);X.moveTo(x+7.6,y-3);X.lineTo(x+2.6,y+3);X.stroke();}else{X.beginPath();X.arc(x,y,3.6,-.8,.8);X.stroke();X.beginPath();X.arc(x,y,6.8,-.8,.8);X.stroke();}}
function drawPauseBtn(){const x=W-56,y=46;roundBtn(x,y);X.fillStyle='#fff';if(paused){X.beginPath();X.moveTo(x-3.6,y-6);X.lineTo(x+6,y);X.lineTo(x-3.6,y+6);X.closePath();X.fill();}else{rr(X,x-5.2,y-5.5,3.8,11,1.2);X.fill();rr(X,x+1.4,y-5.5,3.8,11,1.2);X.fill();}}
function hud(){let g=X.createLinearGradient(0,0,0,HUDH);g.addColorStop(0,'#17406a');g.addColorStop(1,'#0c2742');X.fillStyle=g;X.fillRect(-10,-10,W+20,HUDH+10);
 X.fillStyle='#ffb21a';X.fillRect(-10,HUDH-2,W+20,2);g=X.createLinearGradient(0,HUDH,0,HUDH+9);g.addColorStop(0,'rgba(4,20,45,.4)');g.addColorStop(1,'rgba(4,20,45,0)');X.fillStyle=g;X.fillRect(-10,HUDH,W+20,9);
 star(X,21,20,11,5);fs(X,'#ffd23f','#7a4a00',1.6);txt(''+score,37,27,20,'#fff',{a:'left',w:900});
 if(combo>1){icoFlame(19,45,8);txt('x'+combo,31,50,14,'#ffb347',{a:'left',w:900});}
 txt('ROUND',W-12,15,9,'#8fc4ee',{a:'right',w:900});txt(round+'/10',W-12,31,15,'#fff',{a:'right',w:900});
 // timer
 const tw=130,tx=(W-tw)/2,ty=8,pct=clamp(timeLeft/roundTime,0,1),low=timeLeft<8,tc=low?'#ff4a4a':pct>.5?'#3ad17a':'#ffcc33';
 rr(X,tx,ty,tw,12,6);X.fillStyle='rgba(0,0,0,.45)';X.fill();
 if(pct>0){X.save();rr(X,tx,ty,tw,12,6);X.clip();X.fillStyle=tc;X.fillRect(tx,ty,tw*pct,12);X.fillStyle='rgba(255,255,255,.35)';X.fillRect(tx,ty+2,tw*pct,3.4);X.restore();}
 rr(X,tx,ty,tw,12,6);X.strokeStyle='rgba(255,255,255,.55)';X.lineWidth=1.5;X.stroke();
 const sec=Math.ceil(timeLeft),pulse=low?(1+Math.sin(wave*.5)*.12):1;X.save();X.translate(W/2,34);X.scale(pulse,pulse);icoClock(-15,0,7,low?'#c22':'#17406a');txt(''+sec,-4,1,17,low?'#ff6a6a':'#fff',{a:'left',b:'middle',w:900});X.restore();
 // toy tracker: every toy lights up once it is in the volcano
 const n=need,sp=Math.min(17,186/Math.max(n,1)),x0=W/2-(n-1)*sp/2;
 for(let i=0;i<n;i++){const o=objs[i],lit=!o||o.hb||o.st==='gone';X.save();X.translate(x0+i*sp,52);if(lit){circ(X,0,0,7.6);X.fillStyle='rgba(255,210,63,.3)';X.fill();}else X.globalAlpha=.3;paintToy(currentToys[i],lit?11.5:10);X.restore();}
}
function lowTimeVignette(){if(state!=='play'||timeLeft>=8)return;const a=(.16+Math.sin(wave*.5)*.08)*(1-timeLeft/8)+.06,g=X.createRadialGradient(W/2,H/2+30,170,W/2,H/2+30,400);g.addColorStop(0,'rgba(255,30,30,0)');g.addColorStop(1,'rgba(255,30,30,'+a.toFixed(3)+')');X.fillStyle=g;X.fillRect(0,HUDH,W,H-HUDH);}
function drawBanner(){if(bannerT<=0)return;const a=Math.min(1,bannerT/0.5);X.save();X.globalAlpha=a;X.font='800 14px '+FONT;const w=X.measureText(banner).width+34;
 rr(X,W/2-w/2,69,w,30,15);fs(X,'rgba(12,39,66,.92)','#ffb21a',2);txt(banner,W/2,84.5,14,'#ffe08a',{b:'middle'});X.restore();}
function drawPops(){pops.forEach(p=>{const k=p.age,e=1-Math.pow(1-k,3),sc=k<.18?.6+k/.18*.6:1.2-Math.min(1,(k-.18)/.3)*.12,a=k<.65?1:1-(k-.65)/.35;X.save();X.globalAlpha=clamp(a,0,1);X.font='900 17px '+FONT;const hw=X.measureText(p.t).width*sc/2+6;
 X.translate(clamp(p.x,hw,W-hw),p.y-e*62);X.scale(sc,sc);txt(p.t,0,0,17,p.c,{w:900,b:'middle',s:'#1a0f0a',sw:4.6});X.restore();});}

// ───────────────────────── cards & title screen ─────────────────────────
function dim(a){X.fillStyle='rgba(6,22,44,'+a+')';X.fillRect(0,0,W,H);}
function panel(x,y,w,h){X.fillStyle='rgba(0,10,30,.35)';rr(X,x+2,y+7,w,h,22);X.fill();
 const g=X.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#fffef8');g.addColorStop(1,'#ffedcc');rr(X,x,y,w,h,22);fs(X,g,'#12314f',4);
 rr(X,x+6.5,y+6.5,w-13,h-13,16);X.strokeStyle='#ffb21a';X.lineWidth=2.2;X.stroke();}
function button(label,bx,by,bw,bh,act){const p=1+Math.sin(performance.now()*.005)*.022;X.save();X.translate(bx+bw/2,by+bh/2);X.scale(p,p);
 rr(X,-bw/2,-bh/2+4.5,bw,bh,bh/2);X.fillStyle='#8f1a06';X.fill();
 const g=X.createLinearGradient(0,-bh/2,0,bh/2);g.addColorStop(0,'#ff8a2e');g.addColorStop(1,'#ea3a0d');rr(X,-bw/2,-bh/2,bw,bh,bh/2);fs(X,g,'#5a1204',2.5);
 rr(X,-bw/2+9,-bh/2+4,bw-18,bh*.34,bh*.17);X.fillStyle='rgba(255,255,255,.3)';X.fill();
 txt(label,0,1.5,16,'#fff',{w:900,b:'middle',s:'#8f1a06',sw:3.4});X.restore();card={x:bx,y:by,w:bw,h:bh,act};}
function bodyLines(lines,y,size,col,gap){lines.forEach((l,i)=>txt(l,W/2,y+i*(gap||19),size||13,col||'#5a4636',{w:700}));}
function confetti(){const cols=['#ffcc33','#ff7a2e','#3ec6ff','#ff5c8a','#7ed53c','#b667e8'],t=performance.now()*.06;for(let i=0;i<46;i++){const x=(i*83+Math.sin(t*.02+i)*22)%W,y=((t*(1+i%5*.22)+i*61)%(H+40))-20;X.save();X.translate(x,y);X.rotate(t*.04+i);X.fillStyle=cols[i%6];X.fillRect(-4,-2.2,8,4.4);X.restore();}}
function sunburst(x,y,r,col){const t=performance.now()*.0006;X.save();X.translate(x,y);X.rotate(t);X.fillStyle=col;for(let i=0;i<12;i++){X.rotate(TAU/12);X.beginPath();X.moveTo(0,0);X.lineTo(r,-r*.13);X.lineTo(r,r*.13);X.closePath();X.fill();}X.restore();}
function bigToy(em,x,y,size){X.save();X.translate(x,y);paintToy(em,size);X.restore();}
function drawMenu(){const g=X.createLinearGradient(0,0,0,250);g.addColorStop(0,'rgba(6,26,56,.72)');g.addColorStop(.6,'rgba(6,26,56,.3)');g.addColorStop(1,'rgba(6,26,56,0)');X.fillStyle=g;X.fillRect(0,0,W,250);
 const b=Math.sin(wave*.05)*2.5;
 lavaText('EXPLODING',W/2,82+b,fit('EXPLODING',318,56));
 lavaText('VOLCANOS',W/2,134+b,fit('VOLCANOS',318,58),{cols:['#8a7d88','#4a3f48','#241b22'],ink:'#ff6a12'});
 txt('in the Bathtub!',W/2,180+b,23,'#c9f3ff',{w:900,s:'#0d3a66',sw:6});
 panel(26,436,328,146);bodyLines(['Noah splashes toys into the volcano!','Hold a toy to wind up, release to splash.','Each round adds a new toy!'],466,13);
 button('START',W/2-88,516,176,46,()=>startGame());}
function drawCard(title,cols,lines,bt,act,deco,stars){dim(.62);if(deco)deco();const cw=318,ch=208,cx=(W-cw)/2,cy=(H-ch)/2;panel(cx,cy,cw,ch);
 if(stars)[[-46,15,-.25],[0,21,0],[46,15,.25]].forEach((q,i)=>{X.save();X.translate(W/2+q[0],cy-6+Math.abs(q[0])*.12+Math.sin(performance.now()*.004+i)*2);X.rotate(q[2]);star(X,0,0,q[1],q[1]*.48);X.lineJoin='round';fs(X,'#ffd23f','#7a4a00',2.6);star(X,0,0,q[1]*.55,q[1]*.26);X.fillStyle='#fff3a0';X.fill();X.restore();});
 lavaText(title,W/2,cy+50,fit(title,cw-56,34),{cols});bodyLines(lines,cy+96,13.5,'#5a4636',21);button(bt,W/2-92,cy+ch-66,184,46,act);}
function drawIntroCard(){dim(.66);const cw=328,ch=300,cx=(W-cw)/2,cy=(H-ch)/2;panel(cx,cy,cw,ch);
 lavaText('Noah’s Bath Toys!',W/2,cy+48,fit('Noah’s Bath Toys!',cw-60,30));txt('Splash these into the volcano:',W/2,cy+84,13.5,'#5a4636',{w:700});
 rr(X,cx+24,cy+98,cw-48,96,16);fs(X,'#bfe9ff','#5cb6ea',2);X.save();rr(X,cx+24,cy+98,cw-48,96,16);X.clip();X.fillStyle='#7fd0f7';X.beginPath();X.moveTo(cx,cy+170);for(let x=cx;x<=cx+cw;x+=8)X.lineTo(x,cy+166+Math.sin(x*.07+performance.now()*.003)*3);X.lineTo(cx+cw,cy+200);X.lineTo(cx,cy+200);X.closePath();X.fill();X.restore();
 const n=currentToys.length,gap=82,sx2=W/2-(n-1)*gap/2;currentToys.forEach((em,i)=>bigToy(em,sx2+i*gap,cy+146+Math.sin(performance.now()*.004+i*1.2)*5,50));
 txt('A new toy joins every round!',W/2,cy+218,12.5,'#8a6f58',{w:800});
 button('START SPLASHING!',W/2-104,cy+ch-64,208,46,()=>{startRound(false);state='play';lastNow=performance.now();});}
function drawNewToyCard(){dim(.66);confetti();const cw=326,ch=330,cx=(W-cw)/2,cy=(H-ch)/2;panel(cx,cy,cw,ch);
 lavaText('NEW TOY!',W/2,cy+46,34);
 X.save();rr(X,cx+12,cy+70,cw-24,112,10);X.clip();sunburst(W/2,cy+126,150,'rgba(255,190,40,.28)');X.restore();
 circ(X,W/2,cy+126,44);fs(X,'#fff7d6','#ffb21a',3);bigToy(newToyEm,W/2,cy+126+Math.sin(performance.now()*.004)*5,58);
 txt(TOYNAME[newToyEm]||'New Toy',W/2,cy+204,21,'#3a2418',{w:900});txt('splashes into the tub for round '+round+'!',W/2,cy+224,13,'#7a6450',{w:700});
 const n=currentToys.length,gap=Math.min(26,(cw-50)/n),sx2=W/2-(n-1)*gap/2,ry=cy+250;
 currentToys.forEach((em,i)=>{if(i===n-1){const pu=(Math.sin(performance.now()*.006)+1)/2;X.save();X.globalAlpha=.45+pu*.4;circ(X,sx2+i*gap,ry,14);X.fillStyle='#ffcc33';X.fill();X.restore();}bigToy(em,sx2+i*gap,ry,18);});
 button('SPLASH ON!',W/2-92,cy+ch-62,184,46,()=>{startRound(true);state='play';lastNow=performance.now();});}
function drawPauseCard(){dim(.62);const cw=264,ch=176,cx=(W-cw)/2,cy=(H-ch)/2;panel(cx,cy,cw,ch);
 lavaText('Paused',W/2,cy+48,30,{cols:['#9fe0ff','#3fa9f5','#1c6fb5'],ink:'#0d2f52'});txt('Round '+round+'  ·  Score '+score,W/2,cy+86,13.5,'#5a4636',{w:700});
 button('RESUME',W/2-84,cy+ch-66,168,46,()=>{paused=false;lastNow=performance.now();});}
function overlay(){if(paused){drawPauseCard();return;}
 if(state==='menu')drawMenu();
 else if(state==='intro')drawIntroCard();
 else if(state==='newtoy')drawNewToyCard();
 else if(state==='win')drawCard('YOU WIN!',null,['All 10 rounds cleared!','Score: '+score+'     Best combo: x'+bestCombo],'PLAY AGAIN',()=>startGame(),confetti,true);
 else if(state==='gameover')drawCard('TIME’S UP!',['#9fe0ff','#3fa9f5','#1c6fb5'],['Out of time on round '+round+'.','Score: '+score+' — give this round another go!'],'RETRY ROUND',()=>{startRound(false);state='play';lastNow=performance.now();});
 else card=null;}

// ───────────────────────── eruption ─────────────────────────
function burst(x,y,r1,r2,n,rot){X.beginPath();for(let i=0;i<n*2;i++){const a=rot+i*PI/n,q=i%2?r2:r1;X.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q*.7);}X.closePath();}
function eruptFX(){if(state!=='erupt'&&state!=='win')return;if(eruptT>0)eruptT--;
 if(eruptT>122&&eruptT%3===0){for(let k=0;k<2;k++){const a=-1.57+(Math.random()-.5)*.8,s=8+Math.random()*8;eParts.push({x:CX+(Math.random()-.5)*16,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:4+Math.random()*5,col:['#ff5500','#ff8800','#ffcc00'][~~(Math.random()*3)]});}}
 if(eruptT>96&&eruptT%4===0)smoke.push({x:CX+(Math.random()-.5)*26,y:CY-14,vx:(Math.random()-.5)*1.4,vy:-(1.6+Math.random()*2),r:9+Math.random()*8,life:1,c:Math.random()<.5?'#5a4a55':'#3a3038'});
 if(eruptT>135){const a=(160-eruptT)/25;X.save();X.globalAlpha=Math.sin(a*3.14)*.4;X.fillStyle='#ff7a00';X.fillRect(0,0,W,H);X.restore();}
 if(state!=='erupt')return;
 if(eruptT>134){const a=Math.min(1,(160-eruptT)/8),sc=0.6+a*0.5;X.save();X.translate(W/2,H/2-6);X.scale(sc,sc);X.globalAlpha=a;lavaText('THIS IS',0,-24,40,{cols:['#fff7b0','#ffd23f','#ff9a1a']});lavaText('THE END!',0,22,40,{cols:['#fff7b0','#ffd23f','#ff9a1a']});X.restore();}
 else if(eruptT>116){const a=(134-eruptT)/9,sc=1+Math.sin(Math.min(1,a)*3.14)*0.3;X.save();X.translate(W/2,H/2-6);X.scale(sc,sc);X.rotate(-.06);
  burst(0,0,150,96,14,wave*.01);fs(X,'#ffe14d','#3a0a00',5);burst(0,0,118,74,14,wave*.01+.11);X.fillStyle='#fff7c2';X.fill();lavaText('POW! POW!',0,2,44,{cols:['#ff9a1a','#ff4a12','#d81e05']});X.restore();}
 else if(eruptT>10){const sc=0.6+Math.min(1,(116-eruptT)/12)*0.4;X.save();X.translate(W/2,134);X.scale(sc,sc);lavaText('EXPLODING VOLCANOS',0,-14,fit('EXPLODING VOLCANOS',340,31));txt('in the BATHTUB!',0,24,23,'#c9f3ff',{w:900,s:'#0d3a66',sw:6});X.restore();}}

// ───────────────────────── frame ─────────────────────────
function tickFx(dt){pops.forEach(p=>p.age+=dt);pops=pops.filter(p=>p.age<1);volGulp*=.88;if(volGulp<.01)volGulp=0;
 smoke=smoke.filter(p=>p.life>0);smoke.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy*=.985;p.r+=.4;p.life-=.013;});}
function scene(){if(bgDirty||!bgCv)buildBg();X.drawImage(bgCv,0,0,W,H);
 faucetDrip();waterBase();volcano();maxBlocker();kid();
 if(state==='menu')demoToys();
 drawObjs();drawRings();aimHint();chargeGuide();drawParts();eruptFX();drawEjecta();lowTimeVignette();
 if(state!=='menu'){hud();drawBanner();}drawPops();}
function loop(now){
 try{
  const dt=Math.min((now-lastNow)/1000||0,.05);lastNow=now;
  X.setTransform(SC,0,0,SC,0,0);X.globalAlpha=1;X.fillStyle='#236fbd';X.fillRect(0,0,W,H);X.save();if(shake>.3)X.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  if(paused){}
  else if(state==='menu'){wave+=1.1;volP+=.05;if(Math.random()<.12){const a=-1.57+(Math.random()-.5)*.9,s=2.5+Math.random()*3.5;eParts.push({x:CX+(Math.random()-.5)*20,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.8,r:2.5+Math.random()*3,col:['#ff5500','#ff8800','#ffcc00'][~~(Math.random()*3)]});}stepFx();}
  else if(state==='play')step(dt);
  else{wave+=1.1;volP+=.05;if(shake>0)shake*=.82;if(flash>0)flash-=.04;if(bannerT>0)bannerT-=dt;armAng+=((idleAng)-armAng)*0.1;stepFx();}
  if(!paused){if(state!=='menu')updateEjecta();tickFx(dt);}
  scene();
  X.restore();if(flash>0){X.save();X.globalAlpha=Math.min(1,flash);X.fillStyle=flashCol;X.fillRect(0,0,W,H);X.restore();}overlay();drawMute();if(state==='play'||paused)drawPauseBtn();
 }catch(err){X.restore();if(!loop.failed){loop.failed=true;console.error(err);}}
 requestAnimationFrame(loop);
}

// ── RESPONSIVE + SHARP: size the backing store to real device pixels ──
function resize(){const vw=window.innerWidth,vh=window.innerHeight,sc=Math.min(vw/W,vh/H),cw=Math.round(W*sc),ch=Math.round(H*sc),wEl=document.getElementById('w');
 wEl.style.width=cw+'px';wEl.style.height=ch+'px';cv.style.width=cw+'px';cv.style.height=ch+'px';
 SC=clamp(sc*Math.min(window.devicePixelRatio||1,3),1,4);cv.width=Math.round(W*SC);cv.height=Math.round(H*SC);bgDirty=true;}
window.addEventListener('resize',resize);
buildToys();resize();
requestAnimationFrame(loop);
