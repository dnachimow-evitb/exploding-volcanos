/* Exploding Volcanoes in the Bathtub — version 7 ("fable-v7"): PUSH or SWIPE, chosen on the start screen.
   swipeMode=false is the version 5 game (press and hold, no wall bounces); its Hard only hides the green "it will score" signal.
   swipeMode=true is the version 6 game (swipe to throw, wall rebounds, haptics, then Easy or Hard).
   Every difference between the two is behind the swipeMode flag.
   Based on version 5 ("fable-v5"):
   A from-scratch visual build: flat sticker-book art, the real cover as the title screen,
   and a layout that keeps the wall decor above the tub at every screen shape.
   Rules, scoring, difficulty table, round structure and the song are unchanged.
   The game logic and motion helpers are carried over from fable-supreme; every draw call is new. */
const VERSION='v8.21'; // shown small in the corner of the start screen; bump it with every change
let card2=null,card3=null,pressId=0,hardMode=false; // extra buttons; Easy / Hard (swipe only)
let homeAsk=0,homeWasPaused=false; // "Go Home?" question during play (uiT-based open time + 1; 0 = closed)
let pfToy=0; // toy picker for the current player (time it opened, 0 = closed)
let testRound=1; // TEST PAGE ONLY: which round a new game starts on (the small Round button on the start screen)
// MULTIPLAYER (v8): a second rule set beside the main game; it never changes how the main game plays.
// duel = null in the main game. In a match it holds the stage, which boy this device plays (role), who drives each
// boy (noah / max: 'touch' = a finger here, 'cpu' = the computer; 'net' = the other device, not built yet), Max's
// state (mx: tx = where he is steering to, e = his energy 0..1, dive = a dive in progress, timers for his powers) and the
// computer Noah's state (cpu). Design: experiments/v8-design.md. Work list: experiments/v8-backlog.md.
let mpPg=0; // which Multiplayer card is showing: 0 = the menu, 1 = Play The Computer, 2 = Play A Person
let duel=null,mpT0=0,mpStage=3; // mpT0: Multiplayer card on the start screen (time it opened, 0 = closed); mpStage: stage picked on it
const DUEL_Y=246; // Max's lane in a match: higher up the tub than in the main game (292), where he and Noah stand in the same spot and one hides the other
const MAX_L=82,MAX_R=298; // how far Max can swim (the same span the computer Max sweeps in the main game)
// TUNE: the numbers that decide whether a match is fair. First guesses; the test page can change them (Multiplayer card).
// spd = Max's swim speed when fresh (units a frame); reach = how close to Max a toy must pass to be blocked;
// tire = how much of his energy one block or one dive costs (0..1); rest = seconds to refill from empty;
// clock = the stage's time multiplied by this.
// ENERGY (v8.3, replaces the dunk): Max has one energy bar. Every block and every dive uses some; it refills by
// itself. The emptier it is, the slower he swims (down to TIRED of full speed). He never stops answering the finger,
// and a toy that touches him is always blocked. Noah's opening is a tired Max who cannot get across in time.
const TUNE0={spd:2.2,reach:25,tire:.35,rest:11,clock:1.3},TUNE={...TUNE0},TIRED=.2;
const BUCKET_T=6,BLAST_W=32,SPLASH_T=2.4,JUICE_T=3.5; // JUICE_T: seconds the Juice Box keeps Max's energy full // powers: seconds a caught toy stays in the Bucket; half-width of the Squirt Blaster's jet; seconds the Big Splash wave runs
const DIVE_SPD=9,DIVE_T=.32; // a dive: this fast (units a frame) for at most this long
// POWERS: charges a player owns and spends (saved per player as pw:{key:count}). Up to 3 are packed for a match and one
// Big Splash is always free. A charge is only used up when its button is tapped, so unused ones are never lost.
// [key, name, seconds it lasts (0 = instant)]. What each does is in usePower; its picture is in powIcon.
const POW=[['splash','Big Splash',0],['noodle','Pool Noodle',10],['flip','Flippers',10],['bucket','Bucket',12],['blast','Squirt Blaster',0],['bubble','Bubble Bath',5],['juice','Juice Box',3.5]],
 // NOAH'S TRICKS (v8.16): charges like Max's powers, packed and spent the same way, but each one changes Noah's NEXT throw.
 // Only a person plays Noah in a match (on a second device), so only a person uses these. What each does: doLaunch.
 ROCKET_REACH=.6,DECOY_TIRE=2, // a rocket is too quick to swat unless Max is nearly under it; swatting a decoy tires Max twice as much as a real block
 TRK=[['decoy','Decoy Duck',0],['rocket','Rocket Throw',0],['double','Double Throw',0]],ALLPW=POW.concat(TRK),POW_PRICE=15,POWNAME=Object.fromEntries(ALLPW.map(q=>[q[0],q[1]]));
const POWDESC={splash:'A wave sweeps the toys to your side.',noodle:'A much wider reach for 10 seconds.',flip:'Swim much faster for 10 seconds.',bucket:'Your next block catches the toy.',blast:'Knocks down a toy flying above Max.',bubble:'Bubbles hide the toys from Noah.',juice:'Full energy, and no tiring for a moment.',decoy:'A fake throw. Max tires himself for nothing.',rocket:'Your next throw flies twice as fast.',double:'Your next throw sends two toys at once.'};
const COIN_DUEL=[2,5]; // coins for a match of 20 seconds or more: lost, won
function pwFix(o){const r={};for(const q of ALLPW)r[q[0]]=o&&typeof o[q[0]]==='number'?clamp(o[q[0]]|0,0,99):1;return r;} // a player new to powers starts with one of each
// repeatable randomness for everything that affects play (toy positions, drift, hairball, the computer's choices).
// Effects keep Math.random. Two devices and the Daily Bath will need both sides to draw the same numbers.
let RS=(Date.now()^0x9e3779b9)>>>0;function rnd(){RS=RS+0x6D2B79F5|0;let t=Math.imul(RS^RS>>>15,1|RS);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
let noahT0=0,selGear=null,gearPg=0; // Dress Noah card (time it opened, 0 = closed); the locked piece currently picked on it
let toyPg=0; // page of Other Toys on the My Toys card (8 per page)
let toysT0=0,selSlot=-1,selToy=null; // My Toys card (time it opened, 0 = closed); the spot / toy currently picked on it
let nameEd=null,pfDel=0; // in-game name keyboard {mode,txt,t0}; delete question (time it opened, 0 = closed)
let hits=[],pfOpen=false,pfT0=0; // extra tap areas (button ids 5+); Players card on the start screen
let card4=null,bdgPg=0,bdgT0=0; // Badges card on the start screen: 0 closed, 1-2 badges, 3 stats
let howTo=0,howT0=0; // How To Play card on the start screen: 0 closed, 1 The Game, 2 Push, 3 Swipe
let swipeMode=false,menuStep=0,menuT0=0; // Push or Swipe; start screen step 0 = Push/Swipe, 1 = Easy/Hard
const cv=document.getElementById('c'),W=380,H=600;let X=cv.getContext('2d');
const song=document.getElementById('song');
const CX=190,CY=176,G=0.22,T=58,CHARGE_RATE=0.55,CHARGE_MAX=1.7;
const windAng=-1.45,swingEnd=1.5,idleAng=0.9,swingDur=0.32;
const BASE=['🦆','⛵','🦕'],NEWBY={2:'🚚',3:'🚗',4:'🐙',5:'🪣',6:'🦈',7:'🐬',8:'🐸',9:'🦸',10:'🚀'};
const TOYNAME={'🚚':'Monster Truck','🚗':'Car','🐙':'Octopus','🪣':'Pail','🦈':'Shark','🐬':'Dolphin','🐸':'Froggy','🦸':'Action Figure','🚀':'Rocket'};
Object.assign(TOYNAME,{'🦆':'Duck','⛵':'Sailboat','🦕':'Dino',whale:'Whale',turtle:'Turtle',sub:'Submarine',crab:'Crab',star:'Starfish',tug:'Tugboat',penguin:'Penguin',pdino:'Purple Dino',jelly:'Jellyfish',ring:'Swim Ring',clown:'Clownfish',seal:'Seal',puffer:'Pufferfish',seahorse:'Seahorse',train:'Train',narwhal:'Narwhal',crayon:'Crayon',banana:'Banana',teddy:'Teddy Bear',zebra:'Zebra',robot:'Robot',guitar:'Guitar',firetruck:'Fire Truck',unicorn:'Unicorn',airplane:'Airplane',helicopter:'Helicopter',soldier:'Toy Soldier'});
// TOY SHOP: toys bought with coins. Coins come only from playing (rounds won, badge levels); there is no real money.
// A player's LINEUP is 12 spots: the first 3 start the game, then one joins each round. It starts as the default set
// and the player can put any toy they own into any spot. Coins, owned toys and the lineup are saved per player.
const SHOP=[['crayon',25],['whale',30],['jelly',35],['turtle',40],['ring',45],['crab',50],['clown',55],['star',60],['banana',65],['seal',70],['soldier',72],['penguin',75],['teddy',80],['puffer',85],['tug',90],['zebra',95],['seahorse',100],['robot',105],['sub',110],['airplane',115],['train',120],['guitar',125],['pdino',130],['helicopter',135],['firetruck',140],['narwhal',150],['unicorn',160]]; // keep in price order: locked toys are listed in this order
const TOY_SWAP={speedboat:'train'},swapToy=e=>TOY_SWAP[e]||e; // replaced toys: a saved player who had the old one gets the new one
// NOAH'S GEAR: things Noah wears, bought with coins like toys: [key, price, name]. What a player owns (gear) and
// what Noah has on (wear) are saved per player. Any number can be worn at once. The drawing is in kidHead (hat,
// goggles, mustache) and foamFinger; a new piece needs a row here and its drawing there.
const GEAR=[['nose',30,'Clown Nose'],['hat',40,'Hat'],['bow',50,'Bow Tie'],['goggles',60,'Goggles'],['floaties',70,'Floaties'],['stache',80,'Mustache'],['snorkel',90,'Snorkel'],['finger',100,'Foam Finger'],['shades',110,'Sunglasses'],['lei',120,'Flower Lei'],['crown',140,'Crown'],['duck',160,'Duck Hat']],NOWEAR=[]; // in price order; the card shows 8 to a page
// pieces that sit in the same place: putting one on takes the other(s) off
const GEAR_SLOT={hat:'head',crown:'head',duck:'head',goggles:'eyes',shades:'eyes',bow:'neck',lei:'neck'};
function gearOn(q,k){const sl=GEAR_SLOT[k];q.wear=q.wear.filter(e=>e!==k&&!(sl&&GEAR_SLOT[e]===sl));q.wear.push(k);}
const gearFix=(a,ok)=>GEAR.map(g=>g[0]).filter(k=>Array.isArray(a)&&a.includes(k)&&(!ok||ok.includes(k)));
const COIN_ROUND=5,COIN_WIN=25,COIN_BADGE=[0,20,40,80]; // per round won, extra for finishing all 10, per badge level
const DEF_LINE=[...BASE,...Object.values(NEWBY)],ALL_TOYS=DEF_LINE.concat(SHOP.map(q=>q[0])),priceOf=em=>{const q=SHOP.find(z=>z[0]===em);return q?q[1]:0;};
let LINE={...NEWBY}; // the toy that joins in each round of the current game (from the player's lineup)
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
function paintToy(em,size,grey){if(grey&&toyGrey[em]){const z=size*1.5;X.drawImage(toyGrey[em],-z/2,-z/2,z,z);return;}const img=sprites[em];if(img&&img._ok){X.drawImage(img,-size/2,-size/2,size,size);return;}const c=toyCv[em];if(c){const s=size*1.5;X.drawImage(c,-s/2,-s/2,s,s);}}

function catchHit(x,y,vy){return vy>0&&Math.abs(x-CX)<craterR*1.35&&y>CY-craterR*.7&&y<CY+craterR;}
function ideal(o){return{vx:(CX-o.x)/T,vy:(CY-o.y-0.5*G*T*T)/T};}
// When you play Max, Noah is DRAWN lower in the tub (v8.7) so Max's whole body is in view above him. This is a picture
// only: Noah never touches the toys, and the lane, the block rule, the throws and the toys are exactly where they were.
const noahBase=()=>372+(duel&&duel.role==='max'?60:0);
function handPos(){const kx=190,base=noahBase(),s=splashSide,sX=kx+18*s,sY=base-20,ex=sX+s*Math.cos(armAng)*26,ey=sY+Math.sin(armAng)*26;return{x:ex+s*Math.cos(armAng+0.5)*22,y:ey+Math.sin(armAng+0.5)*22};}

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

// how fast a toy drifts across the tub (units per frame). v7.23: the per-round increase is halved (round 10: 1.1, was 1.8).
// When toys bump they turn around and keep their own speed; they used to trade speeds, so a toy that touched the
// slow hairball took its near-zero speed and sat still.
function floatSpd(d){return 0.4+d.drift*.5;}
function startRound(carry){rdMiss=0;rdBlock=0;rdFirst=true;const d=diff();craterR=d.cr;need=currentToys.length;collected=0;combo=0;
 const single=round>=3;
 objs=currentToys.map((em,i)=>{let x,y;const L=carry?landed[i]:null;
  if(L){x=L.x;y=L.y;}
  else if(single){const col=i%6,row=(i/6|0)%3;x=58+col*50+(row%2)*20+(rnd()-.5)*8;y=448+row*19+(rnd()-.5)*6;} // spread across the whole tub
  else{const left=i%2===0;x=left?(58+rnd()*74):(248+rnd()*76);y=442+rnd()*42;}
  const vx=(rnd()<.5?-1:1)*floatSpd(d)*(single?1:.5);
  return{em,x,y,vx,vy:0,bob:rnd()*6.28,st:'float',sq:0,hb:false,isNew:false,id:i};});
 if(newToyEm){const idx=currentToys.lastIndexOf(newToyEm);if(idx>=0){objs[idx].isNew=true;objs[idx].x=CX+(rnd()-.5)*26;objs[idx].y=458;}}
 objs.forEach((o,i)=>{o.born=NOW+.12+i*.06;});smoke=[];buildOn=false;tutOn=round===1;tutT=0;idleT=0;
 parts=[];eParts=[];rings=[];ejecta=[];collectedToys=[];landed=[];charging=null;pendingLaunch=null;swingT=0;swingHit=false;armAng=idleAng;splashSide=1;
 blk.on=d.blk>0;blk.spd=d.blk;blk.x=110;blk.dir=1;blk.y=292;
 timeLeft=d.time;roundTime=d.time;hbTimer=5+rnd()*3;hintT=round===1?6:0;
 bannerT=2.6;newToyT=newToyEm?5:0;banner=round===1?'Round 1 — Splash Away!':('Round '+round+'!');}
function startGame(){duel=null;stat('games');streak=0;round=1;score=0;bestCombo=0;{const L=PF.list[PF.cur].line;currentToys=L.slice(0,3);LINE={};for(let r=2;r<=10;r++)LINE[r]=L[r+1];}if(TEST&&testRound>1){round=testRound;for(let r=2;r<=round;r++)if(LINE[r])currentToys.push(LINE[r]);}newToyEm=null;landed=[];objs=[];ejecta=[];confet=[];collected=0;need=0;combo=0;craterR=DIFF[0].cr;blk.on=false;scoreShown=0;lastScore=0;state='intro';}
function dist(a,b,c,d){return Math.hypot(a-c,b-d);}
// ── MULTIPLAYER: one staged round, Noah against Max ──
// Where a good throw of toy o passes Max's lane (from the same flight maths as the throw itself).
function crossX(o){const iv=ideal(o),q=iv.vy*iv.vy-2*G*(o.y-DUEL_Y),t=q>0?(-iv.vy-Math.sqrt(q))/G:T*.45;return o.x+iv.vx*t;}
let lastPack=[],lastPackN=[]; // what was packed last time, offered again on the next bag card
function startDuel(stage,role,now,nt){const q=PF.list[PF.cur];stage=clamp(stage|0,1,10); // nt: a match between two devices {net:'N'|'M', seed, toys, wear} (see TWO DEVICES)
 duel={stage,role,lastSec:99,noah:role==='noah'?'touch':'cpu',max:role==='max'?'touch':'cpu',blocks:0,over:null,pid:null,tired:0,coins:0,t:0,pack:[],info:null,bag:[],free:1,earned:[],wave:0,jet:0,
  mx:{tx:CX,dive:0,dx:CX,e:1,juice:0,noodle:0,flip:0,bucket:0,held:null,bub:0},cpu:{wait:1.5,bad:false,fakeAt:0,side:0,avoid:0,late:0,k:null},cmx:{hist:[],key:null,err:0,dive:false,skip:false,n0:0,gt:0,gx:null}};
 if(nt){duel.net=nt.net;duel.noah=role==='noah'?'touch':'net';duel.max=role==='max'?'touch':'net';duel.wearN=role==='noah'?null:gearFix(nt.wear);duel.rx=CX;duel.nt=0;duel.ready=false;duel.peerReady=false;duel.leave=0;}
 if(role==='noah'&&!nt)duel.bag=(stage>=10?['bubble','noodle','juice']:stage>=8?['noodle','juice']:stage>=6?['noodle']:[]).map(k=>({k})); // what the computer Max packs
 duel.nbag=[];{const have={...q.pw};for(const k of(role==='noah'?lastPackN:lastPack))if(have[k]>0&&duel.pack.length<3){have[k]--;duel.pack.push(k);}}
 RS=nt?(nt.seed>>>0)||1:(Date.now()>>>0)||1;swipeMode=false;hardMode=false;streak=0;round=stage;score=0;bestCombo=0;currentToys=nt?nt.toys.filter(e=>ALL_TOYS.includes(e)).slice(0,stage+2):q.line.slice(0,stage+2);LINE={};newToyEm=null;landed=[];objs=[];ejecta=[];confet=[];scoreShown=0;lastScore=0;mpT0=0;
 startRound(false);objs.forEach(o=>{o.vx=Math.sign(o.vx||1)*Math.max(Math.abs(o.vx),DUEL_DRIFT);});blk.on=true;blk.spd=0;blk.x=CX;blk.dir=1;timeLeft=roundTime=Math.round(diff().time*TUNE.clock*(!nt&&role==='max'?lerp(CAMP.c0,CAMP.c1,(stage-1)/9)/TUNE0.clock:1));if(!nt&&role==='max')duel.cpu.k=lerp(CAMP.k0,CAMP.k1,(stage-1)/9);tutOn=false;hintT=0;
 state=role==='max'?'duelbag':'duelintro';if(now)duelGo();} // matches open on the bag card (a new player is sent to Max School first, see playMax); now: straight in (tests)
// SOLO GAMES (v8.19, Derek): playing the computer is not Multiplayer. From the start screen: Noah (the original game),
// Max (ten rounds against the computer Noah) and Noah Vs Smart Max (ten rounds against the Max that reacts, with tricks).
// The two new ones are a "duel" without a connection: win a round to reach the next, lose and try it again.
// CAMP: how the computer Noah's skill and the clock grow over the ten rounds of the Max game (measured: experiments/sim/camp.js).
const CAMP={k0:.15,k1:.8,c0:1.3,c1:1.2};let campBlocks=0,campS=0;
const solo=D=>!!D&&!D.net&&!D.wasNet&&!D.tut;
function startCamp(role,keep){if(!keep){campBlocks=0;campS=0;}const r=keep||(TEST&&testRound>1?testRound:1);startDuel(r,role);if(!keep&&role==='max')stat('mxGames');}
function duelGo(){const q=PF.list[PF.cur];if(duel.role==='noah'){lastPackN=duel.pack.slice();duel.nbag=duel.pack.map(k=>({k,armed:false}));}
 if(duel.role==='max'){q.mxN=(q.mxN||0)+1;pfSave();lastPack=duel.pack.slice();duel.bag=duel.pack.map(k=>({k}));}
 if(duel.net){duel.ready=true;netSend({t:'rdy',sw:swipeMode?1:0});state='duelwait';netMaybeGo();return;} // two devices: wait until both are ready
 duelStart();}
const NET_QUIET=3000;
function duelStart(){if(duel.net)duel.rxT=performance.now();banner=(duel.net?'Stage ':'Round ')+duel.stage+(duel.role==='max'?': Block The Toys!':': Splash Away!');bannerT=3;state='play';lastNow=performance.now();acc=0;}
// THE BLOCK RULE in a match: a rising toy that touches Max, anywhere from his raised hands down to his chest, is
// blocked. Height never matters to the player: if it would pass through him, he gets it. The Pool Noodle widens him.
const maxReach=()=>TUNE.reach*(duel.mx.noodle>0?1.7:1);
// v8.21 PARKING FIX (Derek's recording: one toy left, Max stood on its only path and blocked 21 throws in a row).
// In matches only: (1) a blocked toy is SWATTED ACROSS THE TUB (it lands on the far side from where it was thrown), so the
// next throw comes from a new place and Max has to swim for it, which is where his energy matters; (2) toys drift faster
// (DUEL_DRIFT), so no lane stays put. Tried and dropped: "too tired to block" (the result became pure arithmetic: every
// scripted Max lost at tire .35 and every one won at .2) and a computer Noah who waits for a clear lane (it only ran his clock down).
const DUEL_DRIFT=.8,SWAT={a:70,b:60};
function maxHit(o){return !(duel.tut&&duel.tut.noBlock)&&o.vy<0&&Math.abs(o.x-blk.x)<maxReach()*(o.fast?ROCKET_REACH:1)&&o.y>blk.y-TUNE.reach&&o.y<blk.y+74;}
function swat(o){const vy=Math.abs(o.vy)*.5+1,h=Math.max(20,452-o.y),t=(-vy+Math.sqrt(vy*vy+2*G*h))/G,far=o.vx>0?1:-1,tx=CX+far*(SWAT.a+rnd()*SWAT.b);o.vy=vy;o.vx=(tx-o.x)/Math.max(8,t);} // o.vx>0: it was thrown from the left, so it lands on the right
// a match that lasted at least 20 seconds pays one random charge, and a second for winning
function duelReward(won){const q=PF.list[PF.cur],D=duel;if(D.t<20)return;D.coins=COIN_DUEL[won?1:0];q.coins=(q.coins||0)+D.coins;for(let i=0;i<(won?2:1);i++){const k=ALLPW[~~(rnd()*ALLPW.length)][0];q.pw[k]++;D.earned.push(k);}pfSave();}
function duelEnd(w){const D=duel;if(D.net==='N')netSend({t:'end',w});if(D.mx.held){D.mx.held.o.st='float';D.mx.held=null;}if(w==='max'&&D.role==='max'&&!D.net&&!D.wasNet){const q=PF.list[PF.cur];if(D.stage>(q.mxBest||0))q.mxBest=D.stage;
  stat('mxRounds');statMax('mxBestRound',D.stage);if(!collected)stat('mxShut');if(!D.usedPow)stat('mxNoPow');if(need-collected===1)stat('mxClose');if(D.stage>=8)stat('mxLate');if(D.stage>=10){stat('mxWins');q.coins=(q.coins||0)+COIN_WIN;}}duelReward(w===D.role);pfSave();D.over=w;charging=null;pendingLaunch=null;swingT=0;state='duelend';mood(mxc,'laugh',6);hop(mxc,3.2);mood(noah,'oops',2.5);sfxFanfare();}
// DIVE: tap a spot and Max lunges there fast. It costs the same energy as a block, and he needs that much left.
function maxDive(x){const m=duel.mx;if(state!=='play'||paused)return;duel.dives=(duel.dives||0)+1;if(m.e<TUNE.tire){duel.dives--;if(NOW-duel.tired>1.2){duel.tired=NOW;pop(blk.x,blk.y-40,'Too Tired To Dive!','#ffd23f');blip(200,.12,'sawtooth',.12,120);}return;}m.dive=DIVE_T;duel.dove=1.2;m.dx=clamp(x,MAX_L,MAX_R);m.tx=m.dx;m.e-=TUNE.tire;waterBurst(blk.x,blk.y+78,true);blip(300,.16,'triangle',.18,760);haptic(1);mood(mxc,'gotcha',.5);}
// what the toy does when Max gets it (a block, or the Squirt Blaster)
function mxCount(o,dive){stat('mxBlocks');if(o.hb)stat('mxHair');if(dive)stat('mxDives');campS++;statMax('mxBestStreak',campS);campBlocks++;statMax('mxBestScore',campBlocks);} // a real block in the Max game
function maxBlock(o,free,jet){const D=duel,m=D.mx;if(D.net==='M')netSend({t:'B',i:o.id,c:m.bucket>0&&!m.held?1:0,j:jet?1:0});D.blocks++;haptic(2);o.blocked=1;if(!free)m.e=Math.max(0,m.e-TUNE.tire); // a block tires him, and so does a hit with the Squirt Blaster (jet)
 if(o.dc){if(!free)m.e=Math.max(0,m.e-TUNE.tire*(DECOY_TIRE-1));D.blocks--;o.st='gone';waterBurst(o.x,o.y,false);pop(blk.x,blk.y-36,'Fooled! A Decoy!','#7fe0ff');sfxBlock();mood(mxc,'wow',1);mood(noah,'cheer',1);return;} // he spent the energy and got nothing
 if(m.bucket>0&&!m.held){mxCount(o,D.dove>0);m.bucket=0;m.held={o,t:BUCKET_T};if(!free)m.e=Math.min(1,m.e+TUNE.tire);o.st='held';pop(blk.x,blk.y-40,'In The Bucket!','#ffb020');sfxBlock();mood(mxc,'gotcha',1.1);hop(mxc,3.2);mood(noah,'wow',.8);combo=0;streak=0;return;} // caught: out of play for 4 seconds
 mxCount(o,D.dove>0);if(jet||D.tut){o.vy=Math.abs(o.vy)*.5+1;o.vx=jet?(o.x<CX?-3:3):o.vx*-.5;}else swat(o);shake=3;rdBlock++;pop(blk.x,blk.y-36,'Max Got It!','#ffb020');sfxBlock();mood(mxc,'gotcha',1.1);hop(mxc,3.2);mood(noah,'wow',.8);}
function usePower(k,free){const D=duel,m=D.mx,q=PF.list[PF.cur];if(state!=='play'||paused)return;
 if(free){if(!D.free)return;D.free=0;}else{const i=D.bag.findIndex(b=>b.k===k);if(i<0||(!D.tut&&D.max!=='cpu'&&!(q.pw[k]>0)))return;D.bag.splice(i,1);if(!D.tut&&D.max!=='cpu'){q.pw[k]--;pfSave();}} // Max School lends the powers; nothing leaves the player's stock there
 D.usedPow=true;stat('mxPow');
 const dir=blk.x<CX-12?-1:blk.x>CX+12?1:(objs.filter(o=>o.st==='float'&&o.x<CX).length*2>=objs.filter(o=>o.st==='float').length?-1:1);
 if(D.net==='M')netSend({t:'P',k,d:dir});powFx(k,dir);}
// what a power does (on both devices in a two-device match; only Max's own device decides Squirt Blaster hits)
function powFx(k,dir){const D=duel,m=D.mx;pop(blk.x,blk.y-58,POWNAME[k]+'!','#7fe0ff');haptic(2);blip(440,.18,'square',.16,1100);
 if(k==='splash'){D.wave=SPLASH_T;D.waveDir=dir;shake=7;flash=.16;flashCol='#dff4ff';for(let i=-2;i<=2;i++)waterBurst(blk.x+i*38,blk.y+84,true);rings.push({x:blk.x,y:blk.y+84,r:10,life:1,big:true});sfxSplash();
  if(charging&&charging.cpu&&!D.net){charging=null;D.cpu.wait=SPLASH_T*.8;}else if(charging&&D.net!=='M'){charging=null;} // the wave knocks the toy out of Noah's hand
 }else if(k==='noodle')m.noodle=10;else if(k==='flip')m.flip=10;else if(k==='bucket')m.bucket=12;else if(k==='bubble')m.bub=5;else if(k==='juice'){m.e=1;m.juice=JUICE_T;sparkle(blk.x,blk.y+34,14);mood(mxc,'laugh',1.2);hop(mxc,3);}
 else if(k==='blast'){D.jet=.4;sfxSplash();if(D.net!=='N')objs.forEach(o=>{if(o.st==='fly'&&!o.blocked&&Math.abs(o.x-blk.x)<BLAST_W&&o.y<blk.y+60)maxBlock(o,false,true);});}}
function duelStep(dt){const D=duel,m=D.mx;D.t+=dt;if(D.dove>0)D.dove-=dt;
 if(D.net&&D.rxT&&performance.now()-D.rxT>NET_QUIET){netDrop();} // both devices talk many times a second: silence means the other phone is asleep or gone, so the computer takes over now instead of the match standing still
 if(D.tut&&D.tut.lock)m.tx=CX;if(D.max==='cpu')cpuMax(dt);
 // Max: a dive in progress, or swimming toward where he is steered at a limited speed (Flippers: faster)
 if(D.max==='net'){blk.x+=(D.rx-blk.x)*.4;}else
 {const x0=blk.x;if(m.dive>0){m.dive-=dt;blk.x+=clamp(m.dx-blk.x,-DIVE_SPD,DIVE_SPD);if(Math.abs(m.dx-blk.x)<1)m.dive=0;}else{const sp=TUNE.spd*lerp(TIRED,1,m.e)*(m.flip>0?1.7:1);blk.x+=clamp(m.tx-blk.x,-sp,sp);}
  blk.x=clamp(blk.x,MAX_L,MAX_R);const dx=blk.x-x0;if(Math.abs(dx)>.9&&Math.random()<(m.dive>0||m.flip>0?.9:.3))parts.push({x:blk.x-Math.sign(dx)*24,y:blk.y+80,vx:-Math.sign(dx)*(.6+Math.random()),vy:-1-Math.random()*1.5,life:.8,r:2+Math.random()*2.5,col:'#dff4ff'});} // a wake
 if(D.max!=='net')m.e=m.juice>0?1:Math.min(1,m.e+dt/Math.max(.5,TUNE.rest)); // Juice Box: nothing tires him while it lasts
 for(const k of['noodle','flip','bucket','bub','juice'])if(m[k]>0)m[k]-=dt;if(D.jet>0)D.jet-=dt;
 if(D.wave>0){D.wave-=dt;const g=D.waveDir;objs.forEach(o=>{if(o.st==='float'){o.x=clamp(o.x+g*3.4,46,334);o.vx=g*Math.abs(o.vx);}});} // Big Splash: the wave carries every toy to Max's side, and they keep drifting that way
 if(m.held){m.held.t-=dt;if(m.held.t<=0&&D.net!=='M'){const o=m.held.o;o.st='float';o.x=rnd()<.5?64:316;o.y=462;o.vx=(o.x<CX?1:-1)*floatSpd(diff());o.vy=0;o.blocked=0;waterBurst(o.x,o.y-6,false);sfxPlop();m.held=null;}} // the bucket is tipped out by a wall
 {const sec=Math.ceil(timeLeft);if(sec!==D.lastSec){D.lastSec=sec;if(sec<=5&&sec>0)blip(sec<=3?880:660,.09,'square',.12);}} // the last five seconds tick
 if(D.tut)tutStep(dt);else if(D.noah==='cpu')cpuNoah(dt);
 if(D.net&&(D.nt+=dt)>=(D.net==='N'?.066:.05)){D.nt=0;if(D.net==='N')netSend({t:'s',tl:Math.round(timeLeft*100)/100,c:collected,sw:swipeMode?1:0,o:objs.filter(o=>!o.dc).map(o=>[o.id,Math.round(o.x*10)/10,Math.round(o.y*10)/10,o.st==='float'?0:o.st==='fly'?1:o.st==='held'?3:2,Math.round(o.vx*100)/100,o.hb?1:0,o.hb?Math.round(o.life*10)/10:0]),ch:charging&&!charging.cpu?[charging.o.id,Math.round(charging.c*1000)/1000,Math.round(charging.steer||0)]:null});
  else netSend({t:'m',x:Math.round(blk.x*10)/10,e:Math.round(m.e*100)/100,tm:[m.noodle,m.flip,m.bucket,m.juice].map(v=>Math.max(0,Math.round(v*10)/10))});}}
// MAX SCHOOL (v8.6): a hands-on lesson for each thing Max can do. Noah's throws are scripted and wait for the player,
// the clock is stopped, energy is kept full (except in the Energy lesson) and the powers are lent, not spent.
// Each lesson: n = its name, s = what to do, k = the power it teaches. The script for each is in tutStep.
const TUT=[{n:'Swim',s:'Drag left and right to move Max.'},{n:'Block',s:'Get in the way of the toy.'},{n:'Block Again',s:'Now one from the other side.'},
 {n:'Dive',s:'Too far to swim! Tap the ring to dive.'},{n:'Energy',s:'Blocks and dives tire Max. Rest refills the bar.'},
 {n:'Juice Box',s:'Max is tired. Tap it: full energy for a while!',k:'juice'},
 {n:'Big Splash',s:'Tap it. A wave sweeps the toys to your side.',k:'splash'},{n:'Pool Noodle',s:'Tap it, then block. What a reach!',k:'noodle'},{n:'Flippers',s:'Tap it, then swim. So fast!',k:'flip'},
 {n:'Bucket',s:'Tap it, then block. Max catches the toy!',k:'bucket'},{n:'Squirt Blaster',s:'A toy will get past Max. Then tap it!',k:'blast'},{n:'Bubble Bath',s:'Tap it. Bubbles hide the toys from Noah.',k:'bubble'}];
function playMax(){if(!(PF.list[PF.cur].mxTut>0))startTut();else startCamp('max');} // Play As Max: a player who has never seen Max School goes there first (it can be skipped)
function startTut(){startDuel(1,'max');const D=duel;D.pack=[];D.bag=[];D.free=0;D.tut={i:0,ph:0,t:0,ok:0,fr:0,trav:0,lx:blk.x,msg:'',o:null,tries:0};need=99;bannerT=0;state='play';lastNow=performance.now();acc=0;tutSet();}
function tutSet(){const D=duel,T=D.tut,L=TUT[T.i];T.ph=0;T.t=0;T.trav=0;T.lx=blk.x;T.msg='';T.tries=0;T.slow=false;T.noBlock=false;T.lock=false;D.bag=L.k?[{k:L.k}]:[];const m=D.mx;m.noodle=m.flip=m.bucket=m.bub=0;D.wave=0;if(T.i===4||L.k==='juice')m.e=.12;}
function tutEnd(skip){const q=PF.list[PF.cur],D=duel;D.tut.slow=false;charging=null;pendingLaunch=null;swingT=0;D.earned=[];
 if(skip){if(!q.mxTut)q.mxTut=1;pfSave();startCamp('max');return;}
 if(q.mxTut<2){q.mxTut=2;for(let i=0;i<3;i++){const k=POW[~~(rnd()*POW.length)][0];q.pw[k]++;D.earned.push(k);}}pfSave();state='tutend';sfxFanfare();mood(mxc,'laugh',5);} // finishing it the first time pays three powers
// a scripted throw: wind up on a toy placed at one side (-1 left, 1 right, 0 middle) ...
function tutWind(side){const T=duel.tut,o=objs.find(q=>q.st==='float'&&!q.hb);if(!o)return false;o.x=side<0?70:side>0?310:CX;o.y=462;o.vx=0;charging={o,c:.3,sx:o.x,sy:o.y,fx:o.x,fy:o.y,lx:o.x,ly:o.y,lt:0,peak:0,len:0,tc:.3,cpu:true};splashSide=o.x<CX?-1:1;T.sweet=0;T.o=o;return true;}
// ... then hold the wind-up at the point where it will score until ready is true, and throw. Returns true once thrown.
function tutHold(ready){const T=duel.tut;if(!charging)return false;if(!T.sweet&&hitsAt(charging.o,charging.c))T.sweet=charging.c;if(!T.sweet)return false;charging.c=T.sweet;if(!ready)return false;pendingLaunch={o:charging.o,f:assist(charging.o,T.sweet)};charging=null;swingT=swingDur;swingHit=false;T.b0=duel.blocks;T.c0=collected;return true;}
const tutLanded=()=>{const T=duel.tut;return !charging&&!pendingLaunch&&swingT<=0&&T.o&&T.o.st!=='fly';}; // the scripted throw is over, one way or another
function tutStep(dt){const D=duel,T=D.tut,m=D.mx,L=TUT[T.i],inWay=k=>charging&&Math.abs(crossX(charging.o)-blk.x)<maxReach()*(k||.8);
 timeLeft=roundTime;hbTimer=99;T.t+=dt;if(T.i!==4&&L.k!=='juice')m.e=1;if(T.lock)m.tx=CX;
 objs.forEach(o=>{if(o.st==='gone'&&!o.hb){o.st='float';o.x=rnd()<.5?80:300;o.y=462;o.vx=(rnd()<.5?-1:1)*.4;o.vy=0;o.blocked=0;}}); // a toy that goes in comes back: the lesson never runs out of toys
 if(m.held)m.held.t=Math.min(m.held.t,2.4);
 if(T.ok>0){T.ok-=dt;if(T.ok<=0){if(T.i>=TUT.length-1)tutEnd(false);else{T.i++;tutSet();}}return;}
 const win=()=>{T.ok=1.1;T.msg='';T.slow=false;pop(CX,blk.y-70,'Nice!','#ffd23f');sfxScore();mood(mxc,'laugh',1);hop(mxc,3);},again=t=>{T.ph=0;T.t=0;T.msg=t;T.tries++;},far=()=>Math.abs(112-blk.x)>Math.abs(268-blk.x)?-1:1,near=()=>-far();
 T.trav+=Math.abs(blk.x-T.lx);T.lx=blk.x;
 // a plain "throw, and it must be blocked" lesson step, used by Block, Pool Noodle and Bucket
 const throwAt=(side,done)=>{if(T.ph===0){if(T.t>.9&&tutWind(side))T.ph=1;}else if(T.ph===1){if(tutHold(inWay()))T.ph=2;}else if(T.ph===2){if(done())win();else if(tutLanded())again('Try again. Stand where the ring is.');}};
 if(T.i===0){if(T.trav>170)win();}
 else if(T.i===1)throwAt(-1,()=>D.blocks>T.b0);
 else if(T.i===2)throwAt(1,()=>D.blocks>T.b0);
 else if(T.i===3){if(T.ph===0){if(T.t>.9&&tutWind(far())){T.ph=1;T.d0=D.dives||0;}}else if(T.ph===1){if(tutHold(inWay()))T.ph=2;}
  else if(T.ph===2){if(D.blocks>T.b0){if((D.dives||0)>T.d0||T.tries>=2)win();else again('Good block! Now try a dive: tap the ring.');}else if(tutLanded())again('Try again. Tap the ring to dive there.');}}
 else if(T.i===4){m.e=Math.min(1,m.e+dt/4);if(m.e>=.98||T.t>5)win();}
 else{const used=!D.bag.length;
  if(L.k==='splash'||L.k==='bubble'||L.k==='juice'){if(used){if(T.ph===0){T.ph=1;T.t=0;}else if(T.t>(L.k==='juice'?1.6:2.8))win();}else if(L.k==='juice')m.e=Math.min(m.e,.12);}
  else if(L.k==='flip'){if(used){if(T.ph===0){T.ph=1;T.t=0;T.trav=0;}else if(T.trav>190||T.t>5)win();}}
  else if(L.k==='noodle'){if(used){m.noodle=10;if(T.ph===0){T.ph=10;T.t=0;}else{T.ph-=10;throwAt(far(),()=>D.blocks>T.b0);T.ph+=10;}}}
  else if(L.k==='bucket'){if(used){if(!m.held)m.bucket=12;if(T.ph===0){T.ph=10;T.t=0;T.h=false;}else if(T.h){if(!m.held)win();}else if(m.held){T.h=true;T.msg='Caught! Noah has to wait for it.';}else{T.ph-=10;throwAt(near(),()=>false);T.ph+=10;}}}
  else if(L.k==='blast'){T.noBlock=true;T.lock=true; // Max is held in the middle and lets one go past, so there is something to shoot down
   if(T.ph===0){if(used)D.bag=[{k:'blast'}];if(T.t>1.6&&tutWind(0))T.ph=1;}
   else if(T.ph===1){if(used)D.bag=[{k:'blast'}];if(tutHold(Math.abs(blk.x-CX)<6))T.ph=2;}
   else if(T.ph===2){const o=T.o;if(o.st==='fly'&&o.y<blk.y-30&&!o.blocked){T.slow=true;T.msg='Now! Tap the Blaster!';}
    if(D.blocks>T.b0){T.slow=false;win();}else if(tutLanded()||collected>T.c0){T.slow=false;D.bag=[{k:'blast'}];again('Try again. Tap it when the toy is above Max.');}else if(used&&!T.slow){D.bag=[{k:'blast'}];T.msg='Wait for the toy to fly over Max.';}}}}}
// COMPUTER MAX (for a match you play as Noah). He watches the toy being wound up, a little late (his reaction time),
// and swims to where it will pass; a throw too far to swim to makes him dive, if he thinks of it and has the energy.
// With no wind-up to read (a Swipe throw) he goes for a toy already on its way up. The stage sets his skill (k = 0 at
// stage 1 .. 1 at stage 10): reaction time, how well he judges the spot, how often he dives, how often he is caught
// napping, and what he packs (startDuel). He plays by the same rules as a person: same speed, reach and energy.
// AGAINST SWIPE (v8.10) a flick has no wind-up, so he ANTICIPATES instead: between throws he waits where the next flick is
// most likely to pass (the side of the tub with more toys; guard = how often he bothers), and he is already watching
// for a finger on a toy, so his reaction is shorter (lag x swipe). The throw itself is untouched.
const CMX={lag:[1.1,.4],err:[60,12],dive:[0,.7],nap:[.55,.08],swipe:.5,guard:[.05,.95]}; // each [stage 1, stage 10]: reaction seconds, how far off he judges the spot, chance he thinks to dive, chance he misses a throw altogether. v8.9: from simulated matches
function cpuMax(dt){const D=duel,m=D.mx,a=D.cmx,k=(round-1)/9,L=q=>lerp(q[0],q[1],k);
 let see=null;if(charging)see={x:crossX(charging.o),key:charging.o};else{const o=objs.find(q=>q.st==='fly'&&!q.blocked&&q.vy<0&&q.y>blk.y+20);if(o)see={x:o.x+o.vx*Math.max(0,(o.y-blk.y)/Math.max(2,-o.vy)),key:o};}
 a.hist.push(see);const lag=Math.round(L(CMX.lag)*(swipeMode?CMX.swipe:1)*60);while(a.hist.length>lag+1)a.hist.shift();const sn=a.hist.length>lag?a.hist[0]:null;
 if(sn){if(sn.key!==a.key){a.key=sn.key;a.err=(rnd()-.5)*2*L(CMX.err);a.dive=rnd()<L(CMX.dive);a.skip=rnd()<L(CMX.nap);} // a new throw: how far off he judges it, whether he thinks to dive, whether he misses it altogether
  if(!a.skip){const x=clamp(sn.x+a.err,MAX_L,MAX_R);m.tx=x;if(a.dive&&m.e>=TUNE.tire+.1&&Math.abs(x-blk.x)>50)maxDive(x);
   if(D.free&&round>=6&&Math.abs(x-blk.x)>55&&m.e<TUNE.tire+.1)usePower('splash',true);}}
 else if(swipeMode){if((a.gt-=dt)<=0){a.gt=.5;const fl=objs.filter(o=>o.st==='float'&&!o.hb),lf=fl.filter(o=>o.x<CX),side=lf.length*2>fl.length?lf:lf.length*2<fl.length?fl.filter(o=>o.x>=CX):fl;a.gx=fl.length&&rnd()<L(CMX.guard)?side.reduce((t,o)=>t+crossX(o),0)/side.length:null;}if(a.gx!=null)m.tx=clamp(a.gx,MAX_L,MAX_R);} // guarding against a flick
 else if(k>.35)m.tx=CX; // between throws the better ones come back to the middle
 if(D.bag.length){const n0=a.n0||(a.n0=D.bag.length),used=n0-D.bag.length;if(1-timeLeft/roundTime>=(used+1)/(n0+1))usePower(D.bag[0].k);}} // his powers, spread through the match
// COMPUTER NOAH. He throws the way a Push player does (hold, let go when it will score), so the person playing Max
// can read him. The stage sets his skill (k = 0 at stage 1 .. 1 at stage 10): how quickly he winds up, how long he waits between throws, how
// often he lets go too early, how often he picks the toy furthest from Max, and how often he starts on one side and
// switches to the other (a fake). While Max is tired he hurries.
function cpuNoah(dt){const D=duel,c=D.cpu,k=c.k!=null?c.k:(round-1)/9;
 if(charging){const o=charging.o;charging.c=Math.min(CHARGE_MAX,charging.c+dt*CHARGE_RATE*(lerp(1,1.8,k)-1)); // higher stages: a quicker wind-up (1.3 seconds at stage 1 down to about 0.7 at stage 10)
  if(c.fakeAt&&charging.c>=c.fakeAt){charging=null;c.fakeAt=0;c.avoid=c.side;c.wait=.1;return;}
  const go=c.bad?charging.c>=.8:hitsAt(o,charging.c);
  if(go&&(c.late-=dt)<=0){pendingLaunch={o,f:c.bad?charging.c:assist(o,charging.c)};charging=null;swingT=swingDur;swingHit=false;c.wait=lerp(1.5,.3,k)*(.7+rnd()*.6);}
  else if(charging.c>=CHARGE_MAX){charging=null;c.wait=.3;} // never found the shot (a toy right under the crater): try another
  return;}
 if(pendingLaunch||swingT>0)return;
 c.wait-=dt*(D.mx.e<.5?2.2:1);if(c.wait>0)return; // he hurries while Max is tired
 const fl=objs.filter(o=>o.st==='float'&&!(o.born&&NOW<o.born+.3)&&(!o.hb||rnd()<.5));if(!fl.length)return;
 let pool=fl;if(c.avoid){const q=fl.filter(o=>(o.x<CX?-1:1)!==c.avoid);if(q.length)pool=q;c.avoid=0;}
 let o=pool[~~(rnd()*pool.length)];if(rnd()<lerp(.2,.9,k))o=pool.reduce((a,b)=>Math.abs(crossX(b)-blk.x)>Math.abs(crossX(a)-blk.x)?b:a);
 c.side=o.x<CX?-1:1;c.bad=rnd()<(D.mx.bub>0?.75:lerp(.3,.04,k));c.fakeAt=fl.length>1&&rnd()<lerp(0,.3,k)?.55+rnd()*.3:0;c.late=rnd()*lerp(.12,.02,k);
 charging={o,c:.3,sx:o.x,sy:o.y,fx:o.x,fy:o.y,lx:o.x,ly:o.y,lt:0,peak:0,len:0,tc:.3,cpu:true};splashSide=c.side;}
let hbN=0;
function spawnHairball(){const left=rnd()<.5;objs.push({id:100+(hbN=(hbN+1)%800),hb:true,x:left?70:310,y:450,vx:(rnd()-.5)*.6,vy:0,bob:rnd()*6.28,st:'float',sq:0,life:8,r:16});}
function waterBurst(x,y,big){const n=big?26:12;for(let i=0;i<n;i++){const a=-1.57+(Math.random()-.5)*(big?2.4:2),s=(big?3:2)+Math.random()*(big?9:5);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(big?4:2),life:1,r:(big?4:3)+Math.random()*(big?7:4),col:['#bfeaff','#8ed8ff','#ffffff','#5bc0f0'][~~(Math.random()*4)]});}rings.push({x,y,r:6,life:1});}

// ── INPUT ──
// v2: sx/sy = screen-space logical coords (HUD, cards); x/y = game-world coords (toys)
function P(e){const r=cv.getBoundingClientRect(),sx=(e.clientX-r.left)/KS,sy=(e.clientY-r.top)/KS;return{sx,sy,x:sx,y:sy-OY};}
function down(e){const wasPlaying=song&&!song.paused;initAudio();const p=P(e);
 if(dist(p.sx,p.sy,W-28,SAFE+28)<25){if(!wasPlaying&&!muted)return;muted=!muted;if(song){if(muted)song.pause();else song.play().catch(()=>{});}return;}
 if(duel&&duel.net&&state==='play'&&dist(p.sx,p.sy,W-120,SAFE+28)<22){sfxClick();if(NOW-duel.leave<2.5)goMenu();else{duel.leave=NOW;banner='Tap Home Again To Leave';bannerT=2.5;}return;} // two devices: the match cannot pause, so Home asks with a second tap
 if(duel&&duel.net&&state==='play'&&dist(p.sx,p.sy,W-74,SAFE+28)<23)return;
 if((state==='play'||paused)&&dist(p.sx,p.sy,W-120,SAFE+28)<22){sfxClick();askHome();return;} // home button: asks first, then back to the start screen
 if((state==='play'||paused)&&dist(p.sx,p.sy,W-74,SAFE+28)<23){paused=!paused;homeAsk=0;sfxClick();if(!paused){lastNow=performance.now();acc=0;}return;}
 if(paused||state!=='play'){for(const b of[card,card2,card3,card4,...hits])if(b&&b.act&&p.sx>b.x&&p.sx<b.x+b.w&&p.sy>b.y&&p.sy<b.y+b.h){press={key:b.key,act:b.act,id:b.id||0,now:b.now};break;}return;}
 if(duel&&duel.tut&&p.sx<114&&p.sy>SAFE+6&&p.sy<SAFE+52){sfxClick();tutEnd(true);return;} // Max School: Skip
 if(duel&&duel.role==='noah'){const b=duelBar().find(b=>p.sx>b.x-4&&p.sx<b.x+b.w+4&&p.sy>b.y-4&&p.sy<b.y+b.h+4);if(b){useTrick(b.k);return;}} // one of Noah's tricks
 if(duel&&duel.role==='max'){const b=duelBar().find(b=>p.sx>b.x-4&&p.sx<b.x+b.w+4&&p.sy>b.y-4&&p.sy<b.y+b.h+4);if(b){usePower(b.k,b.free);return;} // a power button
  duel.pid=e.pointerId;duel.mx.tx=clamp(p.x,MAX_L,MAX_R);duel.tap={id:e.pointerId,t:performance.now(),x:p.x,sx:p.sx,sy:p.sy,far:0};return;} // playing Max: the newest finger steers him; it never grabs a toy
 if(charging||pendingLaunch||swingT>0)return;
 if(hardMode&&swipeMode&&objs.filter(o=>o.st==='fly').length>=HARD_MAX_AIR)return;
 let best=null,bd=74;objs.forEach(o=>{if(o.st!=='float')return;const d=dist(p.x,p.y,o.x,o.y);if(d<bd){bd=d;best=o;}});
 if(best){charging={o:best,c:0.3,sx:p.x,sy:p.y,fx:p.x,fy:p.y,lx:p.x,ly:p.y,lt:performance.now(),peak:0,len:0,tc:0.3};hintT=0;splashSide=best.x<190?-1:1;haptic(1);}}
function release(e){if(press){const p=press;press=null;pressUntil=NOW+.12;pressId=p.id||0;sfxClick();if(p.now){if(p.key===uiKey)p.act();}else setTimeout(()=>{if(p.key===uiKey)p.act();},90);return;}
 if(duel&&duel.role==='max'){const tp=duel.tap,id=e?e.pointerId:null;if(id==null||id===duel.pid)duel.pid=null;if(tp&&(id==null||id===tp.id)){duel.tap=null;if(performance.now()-tp.t<260&&tp.far<16&&Math.abs(tp.x-blk.x)>40)maxDive(tp.x);}return;} // a quick tap well away from Max is a dive (a tap near him only steers); the throw in progress belongs to the other side
 if(!charging)return;
 if(!swipeMode){pendingLaunch={o:charging.o,f:assist(charging.o,charging.c)};charging=null;swingT=swingDur;swingHit=false;return;}
 if(charging.len<SWIPE_MIN){charging=null;tutOn=true;tutT=0;return;}
 {const st=charging.ts||0;pendingLaunch={o:charging.o,f:assistSwipe(charging.o,charging.tc,st),steer:st};}haptic(2);charging=null;swingT=swingDur;swingHit=false;}
let dcN=0;
function useTrick(k){const D=duel,q=PF.list[PF.cur],b=D.nbag.find(e=>e.k===k&&!e.armed);if(state!=='play'||!b||!(q.pw[k]>0))return;b.armed=true;q.pw[k]--;pfSave();pop(190,noahBase()-78,POWNAME[k]+'!','#7fe0ff');blip(440,.18,'square',.16,1100);haptic(2);} // armed: it changes the next throw
function doLaunch(){if(!pendingLaunch)return;const o=pendingLaunch.o,f=pendingLaunch.f,iv=ideal(o),D=duel,nk=D&&D.nbag,take=k=>{const i=nk?nk.findIndex(b=>b.k===k&&b.armed):-1;if(i<0)return false;nk.splice(i,1);return true;},
  fx=q=>{shake=3;flash=.12;flashCol='#dff4ff';mood(noah,'throw',.45);tutOn=false;const hp=handPos();waterBurst(hp.x,hp.y,true);waterBurst(q.x,q.y,true);sfxSplash();},tell=q=>{if(D&&D.net==='N')netSend({t:'L',i:q.id,x:q.x,y:q.y,vx:q.vx,vy:q.vy,dr:q.drift,f:q.fast||0,dc:q.dc?1:0,em:q.dc?q.em:0});};
 const vx=(iv.vx+(pendingLaunch.steer||0)/T)*f,vy=iv.vy*f,dr=diff().drift*.012;pendingLaunch=null;
 if(take('decoy')){const q={id:900+(dcN=(dcN+1)%90),dc:true,em:o.em,hb:false,x:o.x,y:o.y,vx,vy,drift:dr,st:'fly',blocked:0,bn:0,rot:0,sq:1,bob:0};objs.push(q);tell(q);fx(q);return;} // DECOY DUCK: a copy of the toy flies; the real one never leaves the water
 o.st='fly';o.vx=vx;o.vy=vy;o.drift=dr;o.blocked=0;o.bn=0;o.rot=0;o.sq=1;o.fast=take('rocket')?2:0;tell(o);fx(o); // ROCKET THROW: the same throw, flown at twice the speed
 if(take('double')){const fl=objs.filter(q=>q.st==='float'&&!q.hb),o2=fl.filter(q=>(q.x<CX)!==(o.x<CX)).sort((a,b)=>Math.abs(b.x-CX)-Math.abs(a.x-CX))[0]||fl[0];if(o2){const i2=ideal(o2),f2=swipeMode?assistSwipe(o2,1,0):assist(o2,1);o2.st='fly';o2.vx=i2.vx*f2;o2.vy=i2.vy*f2;o2.drift=dr;o2.blocked=0;o2.bn=0;o2.rot=0;o2.sq=1;o2.fast=0;tell(o2);waterBurst(o2.x,o2.y,true);}}} // DOUBLE THROW: a second toy goes too, from the other side if there is one, thrown true
cv.addEventListener('pointerdown',e=>{e.preventDefault();down(e);});
window.addEventListener('pointerup',release);
window.addEventListener('pointercancel',release);
window.addEventListener('pointermove',e=>{if(duel&&duel.role==='max'){if(state!=='play')return;if(duel.pid==null){if(e.pointerType==='mouse'&&!(e.buttons&1))return;duel.pid=e.pointerId;} // a finger that was already down takes over the steering
  if(e.pointerId===duel.pid){const q=P(e);duel.mx.tx=clamp(q.x,MAX_L,MAX_R);if(duel.tap&&duel.tap.id===e.pointerId)duel.tap.far=Math.max(duel.tap.far,Math.hypot(q.sx-duel.tap.sx,q.sy-duel.tap.sy));}return;}if(charging&&swipeMode)swipeMove(P(e));});

// ── PHYSICS ──
// one frame of flight for a thrown toy (a Rocket Throw gets two a frame)
function flyStep(o,d){
   o.vx+=o.drift||0;o.vy+=G;o.x+=o.vx;o.y+=o.vy;o.rot=(o.rot||0)+o.vx*.05;if(swipeMode)wallBounce(o);
   if(Math.random()<.4)parts.push({x:o.x+(Math.random()-.5)*14,y:o.y+8,vx:(Math.random()-.5)*.8,vy:.5,life:.7,r:2+Math.random()*2.5,col:'#dff4ff'});
   if(blk.on&&!o.blocked&&duel&&duel.net!=='N'&&maxHit(o))maxBlock(o); // two devices: only Max's own device decides a block
   else if(blk.on&&!o.blocked&&!duel&&dist(o.x,o.y,blk.x,blk.y)<30){o.blocked=1;o.vy=Math.abs(o.vy)*.5+1;o.vx*=-.5;shake=3;rdBlock++;stat('blocks');pop(blk.x,blk.y-36,'Max Got It!','#ffb020');sfxBlock();mood(mxc,'gotcha',1.1);hop(mxc,3.2);mood(noah,'wow',.8);}
   if(duel&&duel.net==='M'){if(o.dc&&o.vy>0&&o.y>=448)o.st='gone';} // Max's device: Noah's device says how every throw ends (a decoy that lands just vanishes)
   else if(!(duel&&o.blocked)&&catchHit(o.x,o.y,o.vy)){scoreToy(o);if(duel&&duel.net==='N')netSend({t:'S',i:o.id});
   }else if((o.vy>0&&o.y>=448)||(!swipeMode&&(o.x<22||o.x>358))){
     combo=0;streak=0;
     if(o.hb||o.dc){o.st='gone';waterBurst(Math.max(40,Math.min(340,o.x)),456,false);}
     else{rdMiss++;stat('misses');o.st='float';o.x=Math.max(58,Math.min(322,o.x));o.y=Math.max(448,Math.min(o.y,486));o.vx=(rnd()<.5?-1:1)*(duel?Math.max(DUEL_DRIFT,floatSpd(d)):floatSpd(d)*(round>=3?1:.4));o.vy=0;o.blocked=0;
       waterBurst(o.x,o.y-6,false);pop(o.x,o.y-30,'Splash! Try Again!','#dff4ff');sfxPlop();mood(noah,'oops',.9);mood(mxc,'laugh',.8);mood(vol,'aww',.9);}
   }
}
function step(dt){
 if(charging&&!swipeMode){charging.c=Math.min(charging.c+dt*CHARGE_RATE,CHARGE_MAX);}
 if(duel)duelStep(dt);
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
 if(state==='play'){
   
   if(duel&&duel.net==='M'){}else{
   if(!(buildOn&&build>.54))timeLeft-=dt;if(timeLeft<=0){timeLeft=0;if(duel){if(collected>=need)return;duelEnd('max');return;}statMax('bestScore',score);state='gameover';return;}
   hbTimer-=dt;if(hbTimer<=0&&!objs.some(o=>o.hb&&o.st!=='gone')){spawnHairball();hbTimer=8+rnd()*4;}}
 }
 if(blk.on){if(!duel){blk.x+=blk.spd*blk.dir;if(blk.x>298||blk.x<82)blk.dir*=-1;}blk.y=(duel?DUEL_Y:292)+Math.sin(wave*.05)*8;} // in a match Max is moved by duelStep
 const d=diff();
 // toys float freely (the original drift); when two bump they bounce apart instead of stacking
 {const fl=objs.filter(o=>o.st==='float'&&!(charging&&charging.o===o)&&!(pendingLaunch&&pendingLaunch.o===o));
  for(let i=0;i<fl.length;i++)for(let j=i+1;j<fl.length;j++){const a=fl[i],b=fl[j],dx=b.x-a.x,dy=b.y-a.y;if(Math.abs(dx)<34&&Math.abs(dy)<20){const sg=dx>=0?1:-1,sy=(dy>0||(dy===0&&(i+j)%2))?.5:-.5;if((b.vx-a.vx)*sg<0){a.vx=-sg*Math.abs(a.vx);b.vx=sg*Math.abs(b.vx);}a.x=clamp(a.x-sg*.6,46,334);b.x=clamp(b.x+sg*.6,46,334);a.y=clamp(a.y-sy,442,490);b.y=clamp(b.y+sy,442,490);}}}
 const nLeft=objs.filter(o=>o.st==='float'&&o.x<CX).length,nRight=objs.filter(o=>o.st==='float'&&o.x>=CX).length;
 objs.forEach(o=>{
  if(o.sq>0)o.sq*=.86;
  if(o.hb&&o.st==='float'){o.life-=dt;if(o.life<=0){o.st='gone';pop(o.x,o.y-20,'Gurgle…','#9a7a4a');}}
  const held=(charging&&charging.o===o)||(pendingLaunch&&pendingLaunch.o===o);
  if(o.st==='float'){if(held){}else{o.x+=o.vx*clamp(7/(nLeft+nRight),.5,1);o.y+=Math.sin(wave*.04+o.bob)*.06;
   if(o.x<46)o.vx=Math.abs(o.vx);else if(o.x>334)o.vx=-Math.abs(o.vx);} // toys drift wall to wall (v7.21: the no-go zone in the middle is gone)
  }else if(o.st==='fly'){flyStep(o,d);if(o.fast&&o.st==='fly')flyStep(o,d);
  }
 });
 objs=objs.filter(o=>!((o.hb||o.dc)&&o.st==='gone'));
 parts=parts.filter(p=>p.life>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.16;p.life-=.04;});
 rings=rings.filter(r=>r.life>0);rings.forEach(r=>{r.r+=(r.big?8:2.6);r.life-=(r.big?.03:.045);});
 eParts=eParts.filter(p=>p.life>0);eParts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.2;p.life-=.022;p.r*=.985;});
}
function updateEjecta(){if(!ejecta.length)return;for(const e of ejecta){if(!e.alive)continue;if(e.delay>0){e.delay--;continue;}e.vy+=0.32;e.x+=e.vx;e.y+=e.vy;e.rot+=e.rotSpeed;
  if((e.vy>0&&e.y>462)||e.y>590||e.x<-30||e.x>W+30){e.alive=false;const lx=Math.max(58,Math.min(322,e.x)),ly=Math.max(450,Math.min(e.y,484));if(e.y<560&&e.x>14&&e.x<W-14){waterBurst(lx,ly,false);if(Math.random()<.4)sfxPlop();}if(e.em!=='🧶')landed.push({x:lx,y:ly});}}
 ejecta=ejecta.filter(e=>e.alive);}
function splash(x,y,col,n){for(let i=0;i<n;i++){const a=-1.57+(Math.random()-.5)*2.4,s=2+Math.random()*6;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:1,r:3+Math.random()*5,col});}}
// a toy (or the hairball) goes into the volcano
function scoreToy(o){if(o.dc){o.st='gone';sparkle(CX,CY-6,6);pop(CX,CY-22,'Just A Decoy!','#7fe0ff');return;}
     if(o.hb){stat('hair');streak++;statMax('bestStreak',streak);combo++;bestCombo=Math.max(bestCombo,combo);timeLeft+=5;score+=50;shake=4;flash=.18;flashCol='#ffe9b0';collectedToys.push('🧶');freeze=3;vol.sv+=.5;mood(vol,'yuck',1.3);mood(noah,'cheer',1);hop(noah,3);sparkle(CX,CY-6,10);
       pop(CX,CY-18,'Hairball! +50  +5s','#ffd23f');splash(CX,CY,'#8a5a2a',26);sfxHair();o.st='gone';
     }else{if(duel){campS=0;stat('mxLet');}stat('toys');streak++;statMax('bestStreak',streak);if(rdFirst&&o.isNew)stat('newFirst');rdFirst=false;if(o.bn)stat('rebounds');collected++;combo++;bestCombo=Math.max(bestCombo,combo);statMax('bestCombo',bestCombo);collectedToys.push(o.em);
       const fpN2=collected/need,fpPrev=(collected-1)/need;
       if(fpN2>=.85&&fpPrev<.85)pop(CX,CY-46,'Gonna Overflow?!','#ff4400');else if(fpN2>=.6&&fpPrev<.6)pop(CX,CY-46,"It's Getting Hotter!",'#ff8a1a');else if(fpN2>=.35&&fpPrev<.35)pop(CX,CY-46,"It's Getting Bigger!",'#ffd23f');
       if(combo===3)pop(190,150,'Look, Daddy, Look!','#7fd0ff');
       const mult=Math.min(combo,5),pts=(12+round*2)*mult*(o.bn?2:1);score+=pts;if(o.bn){pop(CX,CY-74,'Rebound! x2','#7fe0ff');sparkle(CX,CY-10,12);}shake=4;flash=.14;flashCol='#fff3c4';freeze=3;vol.sv+=.55;mood(vol,'gulp',.75);mood(noah,'cheer',1);hop(noah,3);mood(mxc,'aww',.9);sparkle(CX,CY-6,combo>=3?14:8);
       splash(CX,CY,'#ffcc00',24);waterBurst(CX,CY,false);
       for(let k=0;k<10;k++){const a=-1.57+(Math.random()-.5)*1.4,s=3+Math.random()*5;eParts.push({x:CX,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:3+Math.random()*4,col:'#ff8a1a'});}
       pop(CX,CY-22,'+'+pts+(mult>1?'  x'+mult+'!':''),'#ffd23f');sfxScore();
       o.st='gone';if(collected>=need){buildOn=true;build=0;sfxRise();setTimeout(roundWin,700);}}
}
function roundWin(){if(state!=='play')return;
 if(duel){if(duel.role==='noah'&&!duel.net&&!duel.wasNet){const q=PF.list[PF.cur];if(duel.stage>(q.nhBest||0))q.nhBest=duel.stage;}duelReward(duel.role==='noah');duel.over='noah';charging=null;pendingLaunch=null;state='erupt';eruptT=160;bigErupt();setTimeout(()=>{if(duel&&state==='erupt'){state='duelend';sfxFanfare();}},3500);return;} // a match: the eruption, then the result card (no coins or main-game stats yet)
 {const c=COIN_ROUND+(round>=10?COIN_WIN:0);addCoins(c);pop(CX,CY-104,'+'+c+' Coins','#ffd23f');}
 stat('rounds');if(!rdMiss)stat('perfect');if(diff().blk>0&&!rdBlock)stat('sneak');if(timeLeft>=15)stat('quick');if(hardMode)stat('hardRounds');statMax('bestRound',round);
 if(round>=10){score+=150+Math.round(timeLeft)*10;stat('wins');statMax('bestScore',score);state='win';eruptT=160;bigErupt();return;}
 state='erupt';eruptT=160;score+=need*15+combo*5+Math.round(timeLeft)*10;statMax('bestScore',score);bigErupt();
 
 setTimeout(()=>{if(state!=='erupt')return;round++;newToyEm=LINE[round]||null;if(newToyEm)currentToys=[...currentToys,newToyEm];
   if(newToyEm){state='newtoy';sfxFanfare();}else{startRound(true);state='play';lastNow=performance.now();}},3500);
}
function bigErupt(){sfxErupt();shake=12;flash=.42;flashCol='#ffce8a';freeze=7;punch=1;surge=1;buildOn=false;confettiBurst(state==='win'?60:36);mood(noah,'cheer',3.6);mood(mxc,'laugh',3.6);vol.sv+=.9;rings.push({x:CX,y:CY,r:10,life:1,big:true});
 for(let i=0;i<55;i++){const a=-1.57+(Math.random()-.5)*1.9,s=4+Math.random()*12;eParts.push({x:CX,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:4+Math.random()*6,col:['#ff3300','#ff7700','#ffcc00','#ff5500','#ffe066'][~~(Math.random()*5)]});}
 ejecta=collectedToys.map((em,i)=>({em,x:CX+(Math.random()-.5)*20,y:CY-4,vx:(Math.random()-.5)*9,vy:-(7+Math.random()*6),rot:(Math.random()-.5)*.7,rotSpeed:(Math.random()-.5)*.28,alive:true,delay:~~(i*4)}));}

// ── v5 shared state ──
const TAU=6.2832,PI=Math.PI,INK='#ffffff';
const FF='ui-rounded,"SF Pro Rounded","Segoe UI","Helvetica Neue",system-ui,sans-serif';
let HS=720,OY=72,SAFE=0,SAFEB=0,KS=1,DPR=1,bg=null,card=null;
let NOW=0,uiT=0,uiKey='',freeze=0,acc=0,punch=0,surge=0,build=0,buildOn=false,idleT=0,tutOn=false,tutT=0,wasOn=false,press=null,pressUntil=0;
let pops=[],smoke=[],sparks=[],confet=[],scoreShown=0,scorePop=0,comboPop=0,lastCombo=0,lastScore=0,frameMs=16,slowN=0,QCAP=3;
const noah={mood:'',t:0,hop:0,hv:0,blink:0,nb:2.5,lean:0},mxc={mood:'',t:0,hop:0,hv:0,blink:0,nb:1.7},vol={mood:'',t:0,sq:0,sv:0,blink:0,nb:3.1};

// ── TOYS: vector art with a white sticker keyline (INK is white here) ──
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
whale(k){const{E,C,blob,sh,line,eye}=k;
 line('M-8 -18L-8 -31','#7fd0ff',4,2.4);line('M-8 -31Q-19 -43 -25 -33','#7fd0ff',4,2.4);line('M-8 -31Q3 -43 9 -33','#7fd0ff',4,2.4);
 blob('#3b7fe0',['M26 4L47 -17L42 4L47 24Z',E(-4,8,36,24)]);
 sh('M-36 16Q-6 32 26 14Q14 32 -6 32Q-26 32 -36 16Z','#dff3ff');
 eye(-21,2,3.8);line('M-33 12Q-25 18 -16 14','#173f86',2.4);sh(C(-13,10,4),'rgba(255,120,150,.45)');
 sh('M2 12Q12 18 6 26Q-2 20 2 12Z','#2a62b8',2);},
turtle(k){const{E,C,blob,sh,line,eye}=k;
 blob('#8fd14f',['M-34 8L-48 13L-34 18Z',E(-21,24,10,8),E(17,24,10,8),C(35,0,12)]);
 blob('#2e9e5b',['M-37 16Q-36 -30 -2 -30Q32 -30 31 16Z']);
 sh('M-37 16L31 16L27 22L-33 22Z','#f3e3a0',2.4);
 [[-4,-9,9],[-21,3,5.5],[13,3,5.5],[-12,-21,4],[6,-21,4]].forEach(q=>sh(C(q[0],q[1],q[2]),'#7fd08a',2,'#1f7a43'));
 eye(39,-3,3.2);line('M35 6Q40 9 45 5','#3f7a1c',2);},
sub(k){const{E,C,blob,sh,line,gloss}=k;
 line('M4 -24L4 -41L14 -41','#555b66',4.5,2.4);
 blob('#e9412f',['M-37 8L-49 -7L-49 23Z']);
 blob('#ffd43b',['M-10 -10L-10 -27L14 -27L14 -10Z',E(2,9,40,20)]);
 sh('M-34 17Q2 30 38 17Q30 28 2 29Q-26 28 -34 17Z','#f7b500');
 [-15,4,23].forEach(x=>{sh(C(x,6,7),'#c8efff',2.6);gloss(C(x-2,4,2.2));});
 line('M-2 -18L8 -18','#b97f00',2.2);},
crab(k){const{E,C,blob,sh,line,eye}=k;
 ['M-22 22L-36 34','M-11 27L-18 41','M22 22L36 34','M11 27L18 41'].forEach(d=>line(d,'#ef4136',6,2.6));
 line('M-22 2Q-39 -4 -36 -20','#ef4136',7,2.8);line('M22 2Q39 -4 36 -20','#ef4136',7,2.8);
 blob('#ef4136',[C(-36,-27,11),C(36,-27,11),E(0,10,30,20)]);
 sh('M-36 -27L-31 -39L-41 -39Z','#fff',1.6);sh('M36 -27L31 -39L41 -39Z','#fff',1.6);
 line('M-9 -8L-11 -19','#ef4136',4,2.2);line('M9 -8L11 -19','#ef4136',4,2.2);
 [-11,11].forEach(x=>{sh(C(x,-22,6.5),'#fff',2.4);eye(x+1,-21.5,3.4);});
 line('M-9 12Q0 20 9 12','#8f1a10',2.6);sh(C(-19,8,4),'rgba(255,255,255,.35)');sh(C(19,8,4),'rgba(255,255,255,.35)');},
star(k){const{C,S,blob,sh,line,eye}=k;
 blob('#ff8a3d',[S(0,2,46,22)],4);
 [[0,-26,3],[-25,-5,3],[25,-5,3],[-15,25,3],[15,25,3],[0,22,2.4]].forEach(q=>sh(C(q[0],q[1],q[2]),'#ffc48a'));
 eye(-8,-2,3.8);eye(8,-2,3.8);line('M-7 9Q0 15 7 9','#a33f00',2.6);
 sh(C(-15,6,3.6),'rgba(255,90,90,.45)');sh(C(15,6,3.6),'rgba(255,90,90,.45)');},
tug(k){const{C,blob,sh,line,gloss}=k;
 sh(C(9,-44,4.5),'#eef2f8',2);sh(C(17,-38,3.2),'#eef2f8',2);
 blob('#ffd43b',['M-9 -20L-9 -38L5 -38L5 -20Z']);sh('M-9 -34L5 -34L5 -29L-9 -29Z','#e9412f');
 blob('#ffffff',['M-23 11L-23 -14L15 -14L15 11Z']);blob('#2f6fe0',['M-27 -14L19 -14L19 -21L-27 -21Z'],3);
 sh(C(-12,-2,5.4),'#c8efff',2.4);sh(C(4,-2,5.4),'#c8efff',2.4);
 blob('#e9412f',['M-46 10L46 10Q42 37 26 37L-30 37Q-42 37 -46 10Z']);
 sh('M-42 18L42 18L40 24L-40 24Z','#fff');gloss('M-36 12.5L8 12.5L8 14.5L-35.5 14.5Z');
 sh(C(30,29,3.4),'#2a1a12');},
penguin(k){const{E,C,blob,sh,line,eye}=k;
 blob('#ff9a1f',[E(-12,42,11,5.5),E(12,42,11,5.5)],3);
 blob('#27375e',['M-23 -2Q-42 12 -32 30L-20 20Z','M23 -2Q42 12 32 30L20 20Z',E(0,4,27,39)]);
 sh(E(0,12,18,28),'#ffffff');sh(E(-9,-19,8.5,9.5),'#fff');sh(E(9,-19,8.5,9.5),'#fff');
 eye(-8,-19,3.8);eye(8,-19,3.8);sh('M-7 -11L7 -11L0 -2Z','#ff9a1f',2.2);
 sh(C(-15,-8,3.6),'rgba(255,120,150,.5)');sh(C(15,-8,3.6),'rgba(255,120,150,.5)');},
pdino(k){const{E,C,blob,sh,line,eye}=k;
 blob('#9b5de5',['M-26 6Q-43 3 -48 -11Q-47 13 -29 22Z','M-22 24L-22 42L-10 42L-10 27Z','M8 26L8 42L20 42L20 25Z',E(-4,12,30,20),'M11 -18Q11 -42 31 -38Q24 -28 25 -14Z',C(27,-7,17)]);
 sh(E(-4,24,18,6),'#e3c8ff');
 [[-17,3,4],[-5,-1,3.2],[6,6,3],[-22,13,2.6]].forEach(q=>sh(C(q[0],q[1],q[2]),'#7a3fc0'));
 sh('M39 -15L49 -24L43 -8Z','#fff3d0',2);sh('M30 -22L36 -34L37 -20Z','#fff3d0',2);
 line('M-22 37L-10 37','#7a3fc0',2);line('M8 37L20 37','#7a3fc0',2);
 eye(31,-9,3.6);line('M30 1Q36 4 41 0','#4a1f85',2.2);sh(C(23,-1,3.2),'rgba(255,120,150,.45)');},
jelly(k){const{C,blob,sh,line,eye}=k;
 ['M-20 6Q-27 24 -19 41','M-7 8Q-12 27 -5 45','M7 8Q12 27 5 45','M20 6Q27 24 19 41'].forEach(d=>line(d,'#ffb3e0',6.5,2.8));
 blob('#ff7fc8',['M-33 4Q-36 -41 0 -41Q36 -41 33 4Q21 13 11 4Q0 13 -11 4Q-21 13 -33 4Z']);
 [[-17,-27,3.4],[-4,-33,2.4],[18,-25,3]].forEach(q=>sh(C(q[0],q[1],q[2]),'#ffc4ea'));
 eye(-10,-12,3.8);eye(10,-12,3.8);line('M-6 -3Q0 3 6 -3','#a8327a',2.6);
 sh(C(-19,-6,4),'rgba(255,255,255,.45)');sh(C(19,-6,4),'rgba(255,255,255,.45)');},
ring(k){const{C,blob,sh,gloss}=k;
 const pt=(a,r)=>(Math.cos(a)*r).toFixed(1)+' '+(2+Math.sin(a)*r).toFixed(1),wedge=(a0,a1)=>'M'+pt(a0,40)+'A40 40 0 0 1 '+pt(a1,40)+'L'+pt(a1,17)+'A17 17 0 0 0 '+pt(a0,17)+'Z';
 blob('#ff5a4a',[C(0,2,40)]);for(let i=0;i<4;i++)sh(wedge(i*PI/2+.35,i*PI/2+1.1),'#ffffff');
 sh(C(0,2,17),'#8fdcff',3.5,'#ffffff');gloss('M-27 -17Q-17 -30 -3 -32Q-15 -25 -22 -13Z');},
clown(k){const{E,C,blob,sh,line,eye}=k;
 blob('#ff8a1f',['M-29 2L-48 -15L-43 2L-48 19Z','M-9 -17Q2 -35 15 -17Z','M-7 19Q2 33 11 19Z',E(-1,2,34,22)]);
 sh('M-17 -17Q-23 2 -17 21L-7 22Q-13 2 -7 -19Z','#ffffff',2,'#2a1a12');sh('M8 -20Q2 2 8 23L17 20Q11 2 17 -17Z','#ffffff',2,'#2a1a12');
 eye(24,-4,3.8);line('M22 7Q27 10 31 5','#a34400',2.4);sh(C(18,7,3.4),'rgba(255,255,255,.4)');},
seal(k){const{E,C,blob,sh,line,eye}=k;
 blob('#8d9bb0',['M-40 20L-50 7L-35 11Z','M4 22Q14 37 27 32Q19 25 15 16Z','M-44 22Q-30 4 -6 6Q10 -34 28 -34Q44 -32 42 -14Q40 4 26 12Q16 30 -8 30Q-30 32 -44 22Z']);
 sh('M-36 23Q-10 12 14 14Q10 28 -8 29Q-26 30 -36 23Z','#dfe6f1');
 sh(C(41,-21,3.2),'#2a1a12');eye(29,-24,3.6);line('M33 -15Q38 -12 42 -16','#55627a',2.2);
 line('M36 -19L46 -24','#55627a',1.6);line('M36 -17L47 -17','#55627a',1.6);sh(C(24,-15,3.6),'rgba(255,130,150,.45)');},
puffer(k){const{E,C,blob,sh,line,eye}=k;let d='';for(let i=0;i<28;i++){const a=i/28*TAU,r=i%2?42:33;d+=(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(Math.sin(a)*r).toFixed(1);}
 blob('#ffd43b',[d+'Z'],3.2);sh(E(0,13,24,14),'#fff6c2');
 [[-20,-18,3],[0,-25,2.6],[20,-18,3]].forEach(q=>sh(C(q[0],q[1],q[2]),'#f7b500'));
 [-11,11].forEach(x=>{sh(C(x,-6,8.2),'#fff',2.4);eye(x+1,-5,4.2);});
 sh(C(0,11,4.2),'#b34d00');sh(C(-20,6,4),'rgba(255,110,90,.45)');sh(C(20,6,4),'rgba(255,110,90,.45)');},
seahorse(k){const{E,C,blob,sh,line,eye}=k;
 blob('#ffd43b',['M-12 -6L-30 -14L-29 8L-13 9Z'],3);
 line('M2 -14Q-14 -2 -7 12Q1 22 -3 31Q-8 43 -21 41Q-32 37 -29 27Q-25 19 -17 23Q-13 27 -17 31','#2fbf9a',10,3.2);
 blob('#2fbf9a',['M-6 -38L-1 -48L5 -40L11 -48L15 -37Z','M17 -31L43 -27L43 -20L17 -17Z',E(-4,3,12,14),C(6,-24,16)]);
 sh(E(-1,4,6.5,10),'#bff0dd');['M-6 -2L4 -2','M-7 4L5 4','M-6 10L4 10'].forEach(d=>line(d,'#2fbf9a',1.8));
 line('M-25 -7L-16 -2M-26 0L-16 2','#e0a800',1.8);
 sh(C(9,-27,6.4),'#fff',2,'#1f8f72');eye(10.5,-26.5,3.8);sh(C(0,-16,3.6),'rgba(255,120,150,.55)');sh(C(42,-23.5,2.2),'#1f8f72');},
train(k){const{C,blob,sh,line,gloss}=k;
 sh(C(27,-39,5),'#eef2f8',2);sh(C(36,-45,3.4),'#eef2f8',2);
 blob('#2b2b33',['M17 -31L35 -31L33 -24L19 -24Z','M20 -8L20 -25L32 -25L32 -8Z'],3);
 blob('#ffd43b',['M40 7L49 21L40 21Z',C(6,-10,7.5)],2.8);
 blob('#2fa84f',['M-8 -8L34 -8Q41 -8 41 0L41 21L-8 21Z']);
 blob('#e53935',['M-40 -29L-6 -29L-6 21L-40 21Z']);blob('#2b2b33',['M-45 -36L-1 -36L-1 -29L-45 -29Z'],3);
 sh('M-33 -21L-13 -21L-13 -5L-33 -5Z','#c8efff',2.5,'#2a2a33');gloss('M-30 -8L-26 -18L-22 -18L-26 -8Z');
 line('M-6 5L41 5','#ffd43b',3.2);line('M-40 8L-6 8','#ffd43b',3.2);
 [-27,-5,20].forEach(x=>{blob('#2b2b33',[C(x,26,10)],3);sh(C(x,26,4.4),'#e53935',2,'#d5dae2');});
 line('M-27 30L20 30','#9aa7b8',3.2);},
narwhal(k){const{E,C,blob,sh,line,eye}=k;
 blob('#fff3d0',['M-29 -5L-49 -31L-21 -12Z'],2.8);line('M-33 -12L-27 -9','#d9c79a',1.6);line('M-39 -20L-33 -17','#d9c79a',1.6);
 blob('#7fb7d9',['M26 6L47 -15L42 6L47 26Z',E(-4,10,36,22)]);
 sh('M-36 18Q-6 33 26 15Q14 32 -6 32Q-26 32 -36 18Z','#e6f4fb');
 [[2,-2,3],[12,2,2.4],[-6,-6,2.2]].forEach(q=>sh(C(q[0],q[1],q[2]),'#5f98bd'));
 eye(-20,5,3.8);line('M-32 14Q-24 20 -15 16','#3d6f91',2.4);sh(C(-12,12,4),'rgba(255,120,150,.45)');},
crayon(k,g){const{blob,sh,line}=k;g.save();g.rotate(.62);
 blob('#e53935',['M-9 -22L0 -47L9 -22Z','M-12 -22L12 -22L12 36L-12 36Z']);
 sh('M-4.5 -34L0 -47L4.5 -34Z','#a81f1c');sh('M-12 -10L12 -10L12 24L-12 24Z','#ffd9d4');
 line('M-12 -3L12 -3','#b71c1c',2.2);line('M-12 17L12 17','#b71c1c',2.2);line('M-7 7Q-3 2 0 7Q3 12 7 7','#b71c1c',2.4);
 line('M-7 -18L-7 31','rgba(255,255,255,.4)',3);g.restore();},
banana(k){const{C,blob,sh,line}=k;
 blob('#8a5a2a',['M-42 -19L-33 -25L-29 -16L-38 -11Z'],2.8);
 blob('#ffd43b',['M-38 -15Q-31 27 14 27Q41 25 45 4Q30 16 8 14Q-22 12 -30 -19Z']);
 sh(C(43,6,3.2),'#6b4423');line('M-24 2Q-6 20 22 19','#fff27a',3.4);line('M-31 -8Q-28 6 -18 14','#e0a800',2);},
teddy(k){const{E,C,blob,sh,line,eye}=k;
 blob('#b9793f',[E(-13,40,10,7),E(13,40,10,7),E(-25,13,9,13),E(25,13,9,13),E(0,20,22,22),C(-20,-31,10),C(20,-31,10),C(0,-16,22)]);
 sh(C(-20,-31,5),'#e8b98a');sh(C(20,-31,5),'#e8b98a');sh(E(0,22,13,14),'#e8b98a');sh(E(0,-9,10.5,8.5),'#f0d2ad');
 sh(E(0,-13,4.2,3.2),'#3a2410');line('M0 -10L0 -6M-5 -5Q0 -1 5 -5','#3a2410',2);
 eye(-9,-21,3.4);eye(9,-21,3.4);sh(C(-15,-11,3.6),'rgba(255,120,130,.5)');sh(C(15,-11,3.6),'rgba(255,120,130,.5)');},
zebra(k){const{E,C,blob,sh,line,eye}=k;
 blob('#b4bdcd',['M-19 16L-19 40L-11 40L-11 18Z','M15 16L15 40L23 40L23 16Z'],3);sh('M-19 35L-11 35L-11 40L-19 40Z','#2a2a33');sh('M15 35L23 35L23 40L15 40Z','#2a2a33');
 line('M-31 3Q-44 7 -42 20','#eef1f7',5.5,2.8);blob('#2a2a33',['M-47 17L-38 17L-41 31Z'],2.4);
 blob('#eef1f7',['M25 -37L22 -48L32 -42Z','M-29 14L-29 42L-18 42L-18 18Z','M3 18L3 42L14 42L14 18Z',E(-6,6,28,17),'M7 6Q11 -22 22 -33L37 -20Q29 -6 25 13Z','M18 -33Q22 -46 36 -44Q50 -40 50 -27Q49 -14 36 -13Q22 -14 18 -24Z']);
 sh('M-31 12Q-6 25 21 12Q14 23 -6 24Q-24 23 -31 12Z','#cfd7e4');sh('M26 -39L25 -45L30 -42Z','#ffb3c7');
 ['M-23 -9L-17 -10L-19 9L-25 7Z','M-12 -11L-5 -11L-8 13L-14 13Z','M0 -10L7 -9L4 13L-2 13Z','M12 -5L18 -2L14 11L9 11Z','M12 -12L20 -8L17 -1L10 -5Z','M16 -22L25 -16L22 -10L14 -15Z','M22 -31L29 -27L27 -22L20 -25Z'].forEach(d=>sh(d,'#2a2a33'));
 ['M-29 25L-18 25','M-29 32L-18 32','M3 25L14 25','M3 32L14 32'].forEach(d=>line(d,'#2a2a33',3.2));
 sh('M-29 37L-18 37L-18 42L-29 42Z','#2a2a33');sh('M3 37L14 37L14 42L3 42Z','#2a2a33');
 sh('M9 -4Q9 -26 21 -38L26 -35Q16 -24 15 -4Z','#2a2a33');
 sh(E(44,-23,7.5,8.5),'#3a3a45');sh(C(46.5,-26,1.5),'#ffffff');line('M40 -17Q44 -15 48 -18','#ffffff',1.6);
 sh(C(32,-29,5.2),'#ffffff',1.6,'#2a2a33');eye(33,-28.5,3.6);sh(C(28,-19,3.6),'rgba(255,120,150,.55)');},
robot(k){const{C,blob,sh,line,eye}=k;
 line('M0 -40L0 -47','#9aa7b8',3.5,2.2);blob('#e53935',[C(0,-47,3.6)],2.2);
 line('M-22 -4L-34 8L-30 20','#9aa7b8',7,2.8);line('M22 -4L34 8L30 20','#9aa7b8',7,2.8);
 blob('#9aa7b8',['M-15 24L-15 41L-4 41L-4 24Z','M4 24L4 41L15 41L15 24Z','M-18 -40L18 -40L18 -15L-18 -15Z']);
 blob('#5b7fd6',['M-22 -11L22 -11L22 25L-22 25Z']);
 [-8,8].forEach(x=>{sh(C(x,-29,5.6),'#fff',2.2,'#2a2a33');eye(x+.6,-28.6,3);});sh('M-9 -21L9 -21L9 -18L-9 -18Z','#2a2a33');
 sh('M-14 -4L14 -4L14 10L-14 10Z','#ffd43b',2.2,'#2a2a33');sh(C(-7,3,3),'#e53935');sh(C(1,3,3),'#2fc24a');line('M7 0L11 0M7 5L11 5','#2a2a33',1.8);
 sh('M-16 15L16 15L16 19L-16 19Z','#34509c');},
guitar(k,g){const{C,S,blob,sh,line}=k;g.save();g.rotate(.5);
 blob('#3a2410',['M-6 -48L6 -48L7 -39L-7 -39Z'],2.6);blob('#6b4423',['M-4 -40L4 -40L4 -2L-4 -2Z'],3);
 blob('#c98a3c',[C(0,2,15),C(0,24,21)]);sh(C(0,12,6.5),'#3a2410');sh('M-8 30L8 30L8 34L-8 34Z','#3a2410');
 ['M-2 -44L-2 32','M0 -44L0 32','M2 -44L2 32'].forEach(d=>line(d,'#fff3d0',1));
 sh(S(-10,22,5.5,2.5),'#8a5bd6');sh('M10 20L14 20L11 25L15 25L8 33L10 27L7 27Z','#ffd43b');g.restore();},
firetruck(k){const{C,blob,sh,line,gloss}=k;
 line('M-42 -21L4 -21','#d5dae2',4.5,2.4);[-34,-24,-14,-4].forEach(x=>line('M'+x+' -24L'+x+' -14','#d5dae2',3));
 blob('#3fa9f5',['M15 -31L24 -31L24 -24L15 -24Z'],2.4);
 blob('#e53935',['M-46 16L-46 -12L8 -12L8 -24L30 -24Q38 -24 40 -14L46 -10L46 16Z']);
 sh('M13 -20L30 -20L35 -10L13 -10Z','#c8efff',2.5);gloss('M16 -12L19 -18L23 -18L20 -12Z');
 line('M-44 3L44 3','#ffffff',3.4);sh('M39 -4Q45 -3 45 2L39 2Z','#fff3a0',1.5);sh('M-38 -7L-20 -7L-20 -1L-38 -1Z','#ffd43b',1.6);
 [-24,24].forEach(x=>{blob('#2b2b33',[C(x,18,12.5)],3);sh(C(x,18,5.5),'#d5dae2',2);});},
unicorn(k){const{E,C,S,blob,sh,line,eye}=k;
 blob('#ff7fc8',['M-32 0Q-48 4 -46 24Q-40 26 -38 12Q-36 8 -30 8Z'],3);
 blob('#ffd43b',['M31 -33L41 -48L37 -30Z'],2.4);
 blob('#fbf3ff',['M-26 14L-26 42L-17 42L-17 18Z','M-9 18L-9 42L0 42L0 18Z','M9 18L9 42L18 42L18 16Z','M24 -35L21 -46L31 -39Z',E(-6,6,28,17),'M10 2Q15 -30 29 -37Q44 -38 45 -25Q43 -14 30 -13Q28 2 22 14Z']);
 sh('M12 -6Q10 -30 26 -39Q16 -24 20 -8Z','#ff7fc8');sh('M9 2Q4 -18 16 -32Q10 -14 15 2Z','#8a5bd6');sh('M6 8Q0 -6 8 -20Q6 -4 12 8Z','#3fa9f5');
 ['M-26 38L-17 38','M-9 38L0 38','M9 38L18 38'].forEach(d=>line(d,'#ffd43b',5));
 sh(S(-12,6,6,2.7),'#ffd43b');eye(32,-27,3.4);line('M38 -17Q41 -15 43 -18','#b06fc0',2);sh(C(27,-20,3.4),'rgba(255,120,170,.5)');},
airplane(k){const{E,C,blob,sh,line,gloss}=k;
 blob('#e53935',['M-38 -8L-48 -31L-33 -31L-20 -10Z','M-10 6L8 6L-6 36L-19 36Z']);
 blob('#f4f6fa',['M-43 2Q-41 -12 -20 -12L24 -12Q44 -10 46 4Q40 14 20 14L-30 14Q-43 12 -43 2Z']);
 sh('M29 -9Q40 -7 43 0L29 0Z','#7fd0ff',2.2,'#2a2a33');[-10,2,14].forEach(x=>sh(C(x,-3,3.8),'#7fd0ff',1.8,'#2a2a33'));
 line('M-40 7L42 7','#e53935',2.8);blob('#9aa7b8',[E(-4,19,8,4.5)],2.4);gloss('M-30 -9L16 -9L16 -7.5L-30 -7.5Z');},
helicopter(k){const{C,blob,sh,line,gloss}=k;
 line('M-8 22L-10 31M18 22L20 31','#555b66',3.4,2);line('M-18 32L30 32','#555b66',4.2,2.2);
 line('M4 -14L4 -25','#555b66',4.2,2.2);line('M-36 -27L44 -27','#555b66',5,2.4);blob('#2b2b33',[C(4,-27,4)],2.2);
 blob('#ff8a1f',['M-18 2L-47 -5L-47 4L-18 13Z','M-8 -14Q30 -18 37 6Q35 22 10 22L-12 22Q-23 20 -23 6Q-23 -10 -8 -14Z']);
 blob('#e53935',[C(-46,-1,6.5)],2.4);sh(C(-46,-1,2.2),'#fff');
 sh('M8 -10Q28 -10 33 6L8 6Z','#c8efff',2.5,'#2a2a33');gloss('M12 -6Q18 -7 22 -4L14 2Z');
 line('M-20 13L30 13','#ffd43b',3);},
soldier(k){const{E,C,blob,sh,line,eye}=k; // classic green plastic army man: one green all over, darker green for shade, on his oval stand
 blob('#3d7d2e',[E(0,40,29,7)]);
 line('M-16 9L42 -15','#2f6323',5,2.6);line('M-18 10L-4 4','#2f6323',9,2.6);
 blob('#58a845',['M-5 10L-19 39L-8 39L3 17Z','M1 10L10 39L21 39L11 10Z','M-11 -15L11 -15L12 15L-10 15Z',C(2,-23,12.5)]);
 sh('M-19 39L-8 39L-6 33L-16 33Z','#3d7d2e');sh('M10 39L21 39L19 33L9 33Z','#3d7d2e');sh('M-10 9L12 9L12 14L-10 14Z','#3d7d2e');
 sh('M-10 -15L-3 -15L-4 9L-10 9Z','#4a9539');
 blob('#3d7d2e',['M-13 -31Q-12 -47 3 -47Q18 -47 19 -31L23 -28L-15 -28Z'],3);sh('M-9 -34Q-7 -43 2 -44Q-4 -40 -4 -34Z','#58a845');
 eye(8,-22,3.4);line('M5 -15.5Q8.5 -12.5 12 -16','#2f6323',2.2);sh(C(0,-17,2.6),'#8fd07c');
 line('M10 -2L24 -6','#58a845',7,2.4);line('M-8 -6L-9 5L3 2','#58a845',7,2.4);sh(C(24,-6,4.6),'#4a9539');sh(C(3,2,4.6),'#4a9539');},
'🧶'(k){const{C,sh,line,eye}=k;let d='';for(let i=0;i<24;i++){const a=i/24*TAU,r=i%2?40:31;d+=(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(Math.sin(a)*r).toFixed(1);}
 sh(d+'Z','#8a5a2a',5,'#4a2e12');sh(C(0,0,30),'#9a6832');
 line('M-18 -6Q-4 -24 16 -12','#6b4423',2.6);line('M-20 8Q0 -8 20 6','#6b4423',2.6);line('M-12 20Q4 8 18 18','#6b4423',2.6);
 [-10,10].forEach(x=>{sh(C(x,-5,8.5),'#fff',2.4);eye(x+1.5,-4,4.2);});line('M-7 10Q0 16 7 10','#3a2410',3);},
};
const toyCv={},toyGrey={},TOYPX=3;

// ── motion helpers (easing, moods, forgiveness, particles, fixed-step loop) ──
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const EZ={out:t=>1-Math.pow(1-clamp(t,0,1),3),in:t=>{t=clamp(t,0,1);return t*t*t;},
 back:t=>{t=clamp(t,0,1);const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);},
 elastic:t=>{t=clamp(t,0,1);return t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-.75)*2.0944)+1;}};
function mood(c,m,d){c.mood=m;c.t=d;}
function hop(c,v){c.hv=-v;}
function sfxClick(){blip(700,.07,'triangle',.14,980);}
function sfxTick(){blip(980,.08,'sine',.16,1320);}
function sfxRise(){blip(90,.7,'sawtooth',.14,300);noise(.7,.16,200,.6,900);}
function hitsAt(o,f,st){const iv=ideal(o),dr=diff().drift*.012;let vx=(iv.vx+(st||0)/T)*f,vy=iv.vy*f,x=o.x,y=o.y;for(let i=0;i<(swipeMode?220:110);i++){vy+=G;vx+=dr;x+=vx;y+=vy;if(swipeMode){if(x<WALL_L&&vx<0){x=WALL_L;vx*=-BNC;}else if(x>WALL_R&&vx>0){x=WALL_R;vx*=-BNC;}}if(catchHit(x,y,vy))return true;if(y>556||(!swipeMode&&(x<0||x>W)))return false;}return false;}
function assist(o,f){if(hitsAt(o,f))return f;for(const d of[.02,-.02,.04,-.04])if(hitsAt(o,f+d))return f+d;return f;}
function pop(x,y,t,c){pops.forEach(p=>{if(p.age<.55&&Math.abs(p.y-y)<21&&Math.abs(p.x-x)<120)y-=23;});pops.push({x,y,t,c,age:0,big:/^\+|Hairball/.test(t)});}
function star(x,y,R,r,rot){X.beginPath();for(let i=0;i<10;i++){const a=(rot||0)-PI/2+i*PI/5,q=i%2?r:R;X.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}X.closePath();}
function sparkle(x,y,n){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=1.5+Math.random()*4.5;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.5,life:1,r:3+Math.random()*4,rot:Math.random()*3,col:['#fff6b0','#ffd23f','#ffffff'][i%3]});}}
function lavaSpit(n,pw){for(let k=0;k<n;k++){const a=-1.57+(Math.random()-.5)*.85,s=(3+Math.random()*4)+pw*(5+Math.random()*5);eParts.push({x:CX+(Math.random()-.5)*16,y:CY,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:pw<1?.8:1,r:(pw<1?2.5:4)+Math.random()*(pw<1?3:5),col:['#ff5500','#ff8800','#ffcc00'][~~(Math.random()*3)]});}}
function confettiBurst(n){const cols=['#ffd23f','#ff8a10','#5fd0ff','#ff6f8a','#7ad17a','#fff6e0'];for(let i=0;i<n;i++)confet.push({x:CX+(Math.random()-.5)*30,y:CY-10,vx:(Math.random()-.5)*11,vy:-(5+Math.random()*10),rot:Math.random()*6,vr:(Math.random()-.5)*.4,col:cols[i%6],life:1,w:5+Math.random()*4});}
function fxStep(){parts=parts.filter(p=>p.life>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.16;p.life-=.04;});
 rings=rings.filter(r=>r.life>0);rings.forEach(r=>{r.r+=(r.big?8:2.6);r.life-=(r.big?.03:.045);});
 eParts=eParts.filter(p=>p.life>0);eParts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.2;p.life-=.022;p.r*=.985;});}
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
function lookAt(x,y){let t=charging?charging.o:(pendingLaunch?pendingLaunch.o:objs.find(o=>o.st==='fly'));if(!t&&ejecta.length)t=ejecta.find(e=>e.delay<=0);
 if(!t)return[Math.sin(NOW*.7+x)*.5,-.15+Math.sin(NOW*.43+x)*.25];const dx=t.x-x,dy=t.y-y,d=Math.hypot(dx,dy)||1;return[dx/d,dy/d];}
function eruptTick(){if(eruptT>0)eruptT--;
 if(eruptT>122&&eruptT%3===0)lavaSpit(2,1);
 if(eruptT>96&&eruptT%4===0)smoke.push({x:CX+(Math.random()-.5)*26,y:CY-14,vx:(Math.random()-.5)*1.4,vy:-(1.6+Math.random()*2),r:9+Math.random()*8,life:1,c:Math.random()<.5?'#6a5a55':'#4a3b35'});
 if(eruptT>30&&eruptT<150&&eruptT%5===0)parts.push({x:26+Math.random()*328,y:-OY-12,vx:(Math.random()-.5),vy:7+Math.random()*3,life:1.7,r:3+Math.random()*2.2,col:'#bfeaff'});
 if(state==='win'&&eruptT<100&&confet.length<70&&Math.random()<.5)confet.push({x:Math.random()*W,y:-OY-10,vx:(Math.random()-.5)*2,vy:1+Math.random()*2,rot:Math.random()*6,vr:(Math.random()-.5)*.3,col:['#ffd23f','#ff8a10','#5fd0ff','#ff6f8a','#7ad17a'][~~(Math.random()*5)],life:1,w:5+Math.random()*4});}
function sim(){
 if(state==='menu'){wave+=1.1;volP+=.05;if(flash>0)flash-=.04;if(shake>0)shake*=.82;if(Math.random()<.09)lavaSpit(1,.2);fxStep();}
 else if(state==='play'){if(!(duel&&duel.tut&&duel.tut.slow&&(++duel.tut.fr%6)))step(1/60);} // Max School slows time for the Squirt Blaster lesson
 else{wave+=1.1;volP+=.05;if(shake>0)shake*=.82;if(flash>0)flash-=.04;if(bannerT>0)bannerT-=1/60;armAng+=((idleAng)-armAng)*0.1;fxStep();}
 if(state!=='menu')updateEjecta();
 if(state==='erupt'||state==='win')eruptTick();}
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

// ══════════════════════════════════════════════════════════════════════════
// ── V5 RENDERER: flat sticker-book art. Solid colours, white keylines on the
//    actors (volcano, kids, toys), no gradients, no see-through fades. ──
// ══════════════════════════════════════════════════════════════════════════
const C={wall:'#2a6fdb',tile:'#3b82ee',tileHi:'#3478e6',navy:'#14296b',deep:'#0d1c54',water:'#2ec4f6',waterLt:'#7fe1fd',waterDk:'#1aa3e6',tubIn:'#d3e2f8',tubSh:'#b0c9f0',apron:'#e6eefb',
 rock:'#3d3344',rockLt:'#5a4d64',rockDk:'#2b2331',lava:'#ff7a1a',hot:'#ffd23f',lavaDk:'#e2360a',skin:'#f6c08f',skinD:'#e39a6a',hairN:'#2b1a12',hairM:'#e07a2c',
 green:'#2fc24a',greenD:'#1b8f33',gold:'#ffd23f',amber:'#ff9a1a',go:'#35d07a',mouth:'#5a1a10',tongue:'#f08a78'};
const TUB_O=[[22,184],[358,184],[376,560],[4,560]],TUB_I=[[38,199],[342,199],[360,546],[20,546]];
function fnt(w,s){return w+' '+s+'px '+FF;}
function circ(x,y,r){X.beginPath();X.arc(x,y,Math.max(.01,r),0,TAU);}
function ell(x,y,rx,ry,rot){X.beginPath();X.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),rot||0,0,TAU);}
function rr(x,y,w,h,r){X.beginPath();X.roundRect(x,y,w,h,r);}
function rpoly(pts,r){const n=pts.length;X.beginPath();for(let i=0;i<n;i++){const a=pts[(i+n-1)%n],b=pts[i],c=pts[(i+1)%n];if(i===0)X.moveTo((a[0]+b[0])/2,(a[1]+b[1])/2);X.arcTo(b[0],b[1],(b[0]+c[0])/2,(b[1]+c[1])/2,r);}X.closePath();}
function fill(c){X.fillStyle=c;X.fill();}
function text(t,x,y,size,col,o){o=o||{};X.font=fnt(o.w||900,size);X.textAlign=o.a||'center';X.textBaseline='middle';if(o.s){X.lineJoin='round';X.lineWidth=o.sw||size*.34;X.strokeStyle=o.s;X.strokeText(t,x,y);}X.fillStyle=col;X.fillText(t,x,y);}
// sticker passes: 0 = white keyline under everything, 1 = colour
let PASS=1,BRD=3.2;
function shp(c){if(PASS){X.fillStyle=c;X.fill();}else{X.lineJoin='round';X.lineWidth=BRD*2;X.strokeStyle='#fff';X.stroke();X.fillStyle='#fff';X.fill();}}
function lin(pts,w,c){X.beginPath();pts.forEach((p,i)=>i?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));X.lineCap='round';X.lineJoin='round';X.strokeStyle=PASS?c:'#fff';X.lineWidth=PASS?w:w+BRD*2;X.stroke();}
function sticker(fn,b){BRD=b||3.2;PASS=0;fn();PASS=1;fn();}
function buildToys(){for(const em in TOYS){const c=document.createElement('canvas');c.width=c.height=120*TOYPX;const g=c.getContext('2d');g.scale(TOYPX,TOYPX);g.translate(60,60);TOYS[em](toyKit(g),g);
 const t=document.createElement('canvas');t.width=t.height=c.width;const tg=t.getContext('2d');tg.drawImage(c,0,0);tg.globalCompositeOperation='source-in';tg.fillStyle='#ffffff';tg.fillRect(0,0,t.width,t.height);
 g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-over';for(let i=0;i<16;i++){const a=i/16*TAU;g.drawImage(t,Math.cos(a)*2.6*TOYPX,Math.sin(a)*2.6*TOYPX);}g.globalCompositeOperation='source-over';toyCv[em]=c;}
 for(const q of SHOP){const src=toyCv[q[0]],c=document.createElement('canvas');c.width=c.height=src.width;const g=c.getContext('2d');g.drawImage(src,0,0);try{const im=g.getImageData(0,0,c.width,c.height),d=im.data;for(let i=0;i<d.length;i+=4){const v=(d[i]*.3+d[i+1]*.59+d[i+2]*.11)*.55+105;d[i]=d[i+1]=d[i+2]=v;}g.putImageData(im,0,0);}catch(e){}toyGrey[q[0]]=c;}}

// ── BACKDROP (cached): wall, decor that always sits ABOVE the tub, floor, tub ──
function poster(x,y,k,rot,name,shirt,hairC,nameC){X.save();X.translate(x,y);X.rotate(rot);X.scale(k,k);
 X.fillStyle='#10245f';X.fillRect(-21,-25,46,58);X.fillStyle='#fffdf2';X.fillRect(-23,-28,46,58);X.fillStyle=C.gold;X.fillRect(-8,-32,16,8);
 X.strokeStyle=C.navy;X.lineWidth=2;X.lineCap='round';X.beginPath();X.moveTo(-5,0);X.lineTo(-13,-7);X.moveTo(5,0);X.lineTo(13,-7);X.moveTo(-3.5,9);X.lineTo(-5,17);X.moveTo(3.5,9);X.lineTo(5,17);X.stroke();
 X.beginPath();X.moveTo(0,-6);X.lineTo(-7.5,10);X.lineTo(7.5,10);X.closePath();fill(shirt);circ(0,-12,6.5);fill('#ffd9b0');X.strokeStyle=C.navy;X.lineWidth=1.8;X.stroke();
 X.strokeStyle=hairC;X.lineWidth=2.2;X.beginPath();for(let i=-2;i<=2;i++){X.moveTo(i*2.4,-17.5);X.lineTo(i*3.2,-22.5);}X.stroke();
 X.fillStyle=C.navy;circ(-2.3,-13,1);X.fill();circ(2.3,-13,1);X.fill();X.strokeStyle='#e2360a';X.lineWidth=1.4;X.beginPath();X.arc(0,-11.5,2.8,.3,PI-.3);X.stroke();
 X.font=fnt(900,9.5);X.textAlign='center';X.textBaseline='middle';X.fillStyle=nameC;X.fillText(name,0,23.5);X.restore();}
function paintBg(){const k=KS*DPR,c=document.createElement('canvas');c.width=Math.ceil(W*k);c.height=Math.ceil(HS*k);const main=X;X=c.getContext('2d');X.setTransform(k,0,0,k,0,0);
 const floorY=OY+508,t=38;X.fillStyle=C.wall;X.fillRect(0,0,W,HS);
 let sd=7;const rn=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
 const ACC=['#ffd23f','#ff7a59','#4ad6a7','#ff9ac1'],tall=(OY+170-(SAFE+84))>=190,by0=floorY-t*Math.floor((floorY-(SAFE+94))/t);
 for(let y=floorY-t*Math.ceil(floorY/t);y<floorY;y+=t)for(let x=0;x<W;x+=t)if(rn()<.14){X.fillStyle=C.tileHi;X.fillRect(x,y,t,t);}
 X.strokeStyle=C.tile;X.lineWidth=2.5;X.beginPath();for(let x=0;x<=W;x+=t){X.moveTo(x,0);X.lineTo(x,floorY);}for(let y=floorY-t*Math.ceil(floorY/t);y<floorY;y+=t){X.moveTo(0,y);X.lineTo(W,y);}X.stroke();
 // decor zone = between the HUD and the top of the tub, whatever the screen shape
 const zt=SAFE+(tall?84:124),zb=OY+170,kz=clamp((zb-zt)/170,.45,1);
 {const h=tall?34:20,y=SAFE+(tall?84:90),dr=tall?4.4:2.8;X.fillStyle=C.deep;X.fillRect(0,y+h,W,3);for(let x=0,i=0;x<W;x+=h,i++){X.fillStyle=ACC[i%4];X.fillRect(x,y,h,h);X.fillStyle='#fff';X.beginPath();X.arc(x+h/2,y+h/2,dr,0,TAU);X.fill();}}
 X.save();X.translate(17,zb-126*kz*1.15);X.scale(kz*1.15,kz*1.15);X.lineCap='round';X.lineJoin='round';
 rr(5,7,96,112,12);fill('#1f58b8');rr(0,0,96,112,12);fill('#fff');rr(6,6,84,100,8);fill('#d3e0f6');
 X.save();rr(9,9,78,94,6);X.clip();X.fillStyle='#86d8ff';X.fillRect(0,0,100,120);X.fillStyle='#b4ebff';X.fillRect(0,58,100,60);
 X.fillStyle='#c9f2ff';X.beginPath();X.moveTo(52,9);X.lineTo(66,9);X.lineTo(30,103);X.lineTo(16,103);X.closePath();X.fill();X.beginPath();X.moveTo(74,9);X.lineTo(80,9);X.lineTo(44,103);X.lineTo(38,103);X.closePath();X.fill();
 circ(31,34,19);fill('#fff3b0');circ(31,34,13);fill(C.gold);
 X.fillStyle='#fff';circ(60,27,7);X.fill();circ(69,24,9);X.fill();circ(77,29,6.5);X.fill();rr(54,27,30,8,4);X.fill();
 ell(24,110,48,32);fill('#5fd06e');ell(80,116,46,34);fill('#35b257');X.fillStyle='#7a4a22';X.fillRect(67.5,74,3,12);circ(69,70,8.5);fill('#1f9a48');circ(64,75,5.5);fill('#1f9a48');circ(74.5,75,5.5);fill('#1f9a48');X.restore();
 X.fillStyle='#fff';X.fillRect(45,9,6,94);X.fillRect(9,53,78,6);X.fillStyle='#d3e0f6';X.fillRect(51,9,1.6,94);X.fillRect(9,59,78,1.6);
 for(const g of[0,1]){X.save();if(g){X.translate(96,0);X.scale(-1,1);}X.beginPath();X.moveTo(-8,-3);X.lineTo(27,-3);X.quadraticCurveTo(24,40,7,60);X.quadraticCurveTo(15,86,10,110);X.lineTo(-8,110);X.closePath();fill('#ff6b57');
  X.strokeStyle='#e04a38';X.lineWidth=2.2;X.beginPath();X.moveTo(8,0);X.quadraticCurveTo(8,36,0,56);X.moveTo(18,0);X.quadraticCurveTo(16,38,4,58);X.moveTo(1,66);X.quadraticCurveTo(5,88,2,108);X.stroke();rr(-9,55,19,9,4.5);fill(C.gold);X.restore();}
 rr(-13,-9,122,7,3.5);fill(C.gold);circ(-13,-5.5,5.5);fill(C.gold);circ(109,-5.5,5.5);fill(C.gold);
 rr(-5,123,106,4,2);fill('#1f58b8');rr(-9,110,114,12,6);fill('#fff');
 ell(72,92,5,10,-.5);fill('#2fae56');ell(80,89,5,12,0);fill('#3cc266');ell(88,93,5,10,.5);fill('#2fae56');X.beginPath();X.moveTo(70,98);X.lineTo(90,98);X.lineTo(87,111);X.lineTo(73,111);X.closePath();fill('#e2793c');rr(68.5,96,23,5,2.5);fill('#f08a4a');X.restore();
 if(tall){const sy=zb-138;rr(W-114,sy+4,104,8,4);fill('#1f58b8');rr(W-116,sy,104,8,4);fill('#fff');
  rr(W-103,sy-8-30,10,9,3);fill('#d94a78');rr(W-108,sy-32,20,32,7);fill('#ff6b9a');rr(W-104,sy-24,12,13,3);fill('#fff');
  rr(W-78,sy-8-22,9,8,3);fill('#2aa57e');rr(W-82,sy-25,17,25,6);fill('#4ad6a7');rr(W-79,sy-18,11,9,2.5);fill('#fff');
  X.save();X.translate(W-36,sy-15);paintToy('🦆',26);X.restore();}
 poster(W-113,zb-58*kz,kz*1.43,-.07,'NOAH','#e5533d',C.hairN,'#1f9a3a');poster(W-42,zb-64*kz,kz*1.43,.08,'MAX','#3d7be5',C.hairM,'#7a3fc0');
 // floor
 X.fillStyle=C.deep;X.fillRect(0,floorY,W,HS-floorY);X.fillStyle='#fff';X.fillRect(0,floorY-6,W,8);
 X.save();X.translate(0,OY);ell(190,598,186,14);fill('#081440');
 // tub: flat white porcelain, one shade tone
 for(const fx of[46,334]){circ(fx,590,13);fill(C.gold);}
 X.beginPath();X.moveTo(8,538);X.lineTo(372,538);X.quadraticCurveTo(372,594,334,596);X.lineTo(46,596);X.quadraticCurveTo(8,594,8,538);X.closePath();fill(C.apron);
 X.save();X.clip();X.fillStyle=C.tubIn;X.fillRect(0,576,W,30);X.restore();
 rpoly(TUB_O,30);fill('#fff');rpoly(TUB_I,22);fill(C.tubIn);X.save();rpoly(TUB_I,22);X.clip();X.fillStyle=C.tubSh;X.fillRect(0,199,W,26);X.restore();
 X.restore();X=main;bg={c,k,hs:HS,oy:OY,safe:SAFE};}
function backdrop(){if(!bg||bg.k!==KS*DPR||bg.hs!==HS||bg.oy!==OY||bg.safe!==SAFE)paintBg();X.drawImage(bg.c,0,0,W,HS);}

// ── WATER: flat aqua, drifting light bands, white foam ──
const waterY=x=>246+Math.sin((x+wave)*.088)*(3.5+surge*7)+Math.sin((x-wave*.8)*.12)*(2+surge*4);
function water(){X.save();rpoly(TUB_I,22);X.clip();
 X.beginPath();X.moveTo(10,562);for(let x=10;x<=W-10;x+=6)X.lineTo(x,waterY(x));X.lineTo(W-10,562);X.closePath();fill(C.water);
 X.beginPath();X.moveTo(10,562);for(let x=10;x<=W-10;x+=8)X.lineTo(x,492+Math.sin(x*.04+wave*.02)*6);X.lineTo(W-10,562);X.closePath();fill(C.waterDk);
 X.strokeStyle=C.waterLt;X.lineWidth=5;X.lineCap='round';for(let i=0;i<5;i++){const y0=296+i*44;X.setLineDash([40+i%2*16,104]);X.lineDashOffset=wave*.45*(i%2?1:-1)+i*83;X.beginPath();for(let x=14;x<=W-14;x+=12){const y=y0+Math.sin(x*.05+wave*.03+i)*5;x===14?X.moveTo(x,y):X.lineTo(x,y);}X.stroke();}X.setLineDash([]);
 X.fillStyle='#fff';X.beginPath();for(let i=0;i<24;i++){const x=24+i*14.5,r=5+((i*7)%4);X.moveTo(x+r,waterY(x)+2);X.arc(x,waterY(x)+2,r,0,TAU);}X.fill();X.restore();}
function foam(x,y,rx,front){X.fillStyle='#fff';X.beginPath();const n=Math.round(rx/4.2);for(let i=0;i<=n;i++){const a=(front?0:PI)+i/n*PI,r=3.4+((i*5)%3)+Math.sin(wave*.08+i)*.5,px=x+Math.cos(a)*rx,py=y+Math.sin(a)*rx*.25;X.moveTo(px+r,py);X.arc(px,py,r,0,TAU);}X.fill();}
function lapWater(x,y,rx){X.beginPath();X.ellipse(x,y,rx,rx*.25,0,0,PI);X.closePath();fill(C.water);}

// ── VOLCANO ──
const VB=270,CHIPS=(()=>{let s=5;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;},a=[];for(let i=0;i<26;i++)a.push({u:r()*2-1,v:.1+r()*.86,w:5+r()*7,l:r()<.5});return a;})();
function coneHalf(v){const r=craterR*1.15+6;return r+(118-r)*Math.pow(v,1.7);}
function conePath(){const top=CY+3,N=14;X.beginPath();X.moveTo(CX-coneHalf(0),top);for(let i=1;i<=N;i++){const v=i/N;X.lineTo(CX-coneHalf(v),top+v*(VB-top));}X.quadraticCurveTo(CX,VB+18,CX+coneHalf(1),VB);for(let i=N-1;i>=0;i--){const v=i/N;X.lineTo(CX+coneHalf(v),top+v*(VB-top));}X.closePath();}
function volFace(fp,er){const ey=CY+35,my=CY+60,lk=lookAt(CX,ey),LINE='#ffe9d2';let m=vol.mood;
 if(er)m=eruptT>64?'erupt':'relief';else if(!m)m=(build>0||fp>=.85)?'burst':fp>.6?'hot':fp>.33?'happy':'calm';
 const shut=m==='erupt'||m==='relief'||(m==='gulp'&&vol.t<.5),blink=vol.blink>0&&!shut&&m!=='burst'&&m!=='yuck';X.lineCap='round';X.lineJoin='round';
 for(const s of[-1,1]){ell(CX+s*34,my-7,7,4.5);fill(fp>.6?'#ff7a4a':'#c9603f');}
 for(const s of[-1,1]){const ex=CX+s*18;X.strokeStyle=LINE;X.lineWidth=4;
  if(m==='yuck'){X.beginPath();X.moveTo(ex+s*7,ey-7);X.lineTo(ex-s*4,ey);X.lineTo(ex+s*7,ey+7);X.stroke();}
  else if(shut){X.beginPath();X.arc(ex,ey+5,9,PI*1.12,PI*1.88);X.stroke();}
  else if(blink){X.beginPath();X.moveTo(ex-9,ey+1);X.lineTo(ex+9,ey+1);X.stroke();}
  else{const big=(m==='burst'||m==='aww'||m==='gulp')?1.1:1,jx=m==='burst'?(Math.random()-.5)*1.4:0,px=ex+lk[0]*4+jx,py=ey+lk[1]*4;ell(ex,ey,11,12.5*big);fill('#fff');circ(px,py,m==='burst'?4.2:6.4);fill('#17102a');circ(px+2.1,py-2.4,2.1);fill('#fff');}
  if(m==='hot'||m==='burst'||m==='aww'){X.strokeStyle=LINE;X.lineWidth=3.6;X.beginPath();X.moveTo(ex+s*9,ey-17);X.lineTo(ex-s*6,ey-22);X.stroke();}}
 if(m==='burst'){const d=(NOW*22)%16;X.beginPath();X.moveTo(CX+44,ey-18+d);X.quadraticCurveTo(CX+49,ey-9+d,CX+44,ey-6+d);X.quadraticCurveTo(CX+39,ey-9+d,CX+44,ey-18+d);fill('#9fe6ff');}
 X.strokeStyle=LINE;X.lineWidth=4;
 if(m==='erupt'){ell(CX,my+3,13,11);fill('#7a1206');ell(CX,my+8.5,7.5,4);fill(C.tongue);}
 else if(m==='hot'){X.beginPath();X.arc(CX,my-4,13,0,PI);X.closePath();fill('#7a1206');rr(CX-9,my-4,18,5,2);fill('#fff');}
 else if(m==='burst'){const j=Math.sin(NOW*40)*.9;X.beginPath();X.moveTo(CX-11,my+j);X.quadraticCurveTo(CX-5.5,my-5,CX,my);X.quadraticCurveTo(CX+5.5,my+5,CX+11,my-j);X.stroke();}
 else if((m==='gulp'&&vol.t>.5)||m==='aww'){const a=m==='aww';ell(CX,my,a?5.5:7.5,a?6.5:8.5);fill('#7a1206');}
 else if(m==='yuck'){X.beginPath();X.moveTo(CX-11,my);X.quadraticCurveTo(CX-5.5,my-5,CX,my);X.quadraticCurveTo(CX+5.5,my+5,CX+11,my);X.stroke();ell(CX+5,my+7,5,6.5);fill(C.tongue);}
 else{const w=m==='calm'?10:13,d=m==='calm'?7:11;X.beginPath();X.moveTo(CX-w,my-5);X.quadraticCurveTo(CX,my+d,CX+w,my-5);X.stroke();}}
function volcano(){const er=(state==='erupt'||state==='win'),fp=er?1:collected/Math.max(need,1),top=CY+3,hh=VB-top,cr=craterR+4,cry=cr*.38;
 const heat=clamp((fp-.5)/.5,0,1),trem=er?(eruptT>112?2.4:0):(heat*heat*1.1+build*3),pl=Math.sin(volP)*.5+.5;
 X.save();const sw=1+build*.055+Math.sin(NOW*2.1)*.006,sq=vol.sq;X.translate(CX+(Math.random()-.5)*trem,VB+(Math.random()-.5)*trem*.4);X.scale((1+sq*.07)*sw,(1-sq*.1)*sw);X.translate(-CX,-VB);
 sticker(()=>{ell(CX,CY,cr+7,cry+5);shp(C.rockLt);conePath();shp(C.rock);if(!PASS)return;
  X.save();conePath();X.clip();const h0=coneHalf(0);
  X.beginPath();X.moveTo(CX-h0-4,top);X.lineTo(CX-h0+9,top);X.lineTo(CX-58,VB+22);X.lineTo(CX-134,VB+22);X.closePath();fill(C.rockLt);
  X.beginPath();X.moveTo(CX+h0-7,top);X.lineTo(CX+h0+4,top);X.lineTo(CX+134,VB+22);X.lineTo(CX+74,VB+22);X.closePath();fill(C.rockDk);
  CHIPS.forEach(k=>{const x=CX+k.u*coneHalf(k.v)*.88,y=top+k.v*hh;if(Math.abs(x-CX)<46&&y<CY+84)return;rr(x-k.w/2,y-2.2,k.w,4.4,2.2);fill(k.l?'#6b5d76':'#241c2a');});
  [[-.84,.9],[-.52,.58],[.56,.74],[.87,.55]].forEach(([u,m],i)=>{const len=Math.min(1,(.18+fp*.7+build*.2+(er?.5:0))*m),pts=[];for(let s=0;s<=10;s++){const v=s/10*len;pts.push([CX+u*coneHalf(v)*.86+Math.sin(v*8+i*2)*3,top+v*hh]);}
   const st=(w,c)=>{X.strokeStyle=c;X.lineWidth=w;X.lineCap='round';X.lineJoin='round';X.beginPath();pts.forEach((p,j)=>j?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]));X.stroke();};st(12,C.lavaDk);st(8,C.lava);st(2.8,C.hot);});
  X.restore();
  ell(CX,CY,cr,cry);fill(C.lavaDk);ell(CX,CY+1.5,cr*.86,cry*.74);fill(fp>.5?C.hot:C.lava);ell(CX,CY+2.5,cr*.5,cry*.4);fill(fp>.5?'#fff6b0':C.hot);
  if(er&&eruptT>100){const k=Math.min(1,(160-eruptT)/7)*EZ.out((eruptT-100)/18),h=200*k,wob=Math.sin(NOW*22)*4,sp=(w,c,hh2)=>{X.beginPath();X.moveTo(CX-w,CY+2);X.quadraticCurveTo(CX-w*.6+wob,CY-hh2*.5,CX-w*.3-wob,CY-hh2);X.quadraticCurveTo(CX,CY-hh2-w*.5,CX+w*.3-wob,CY-hh2);X.quadraticCurveTo(CX+w*.6+wob,CY-hh2*.5,CX+w,CY+2);X.closePath();fill(c);};sp(cr*.85,C.lavaDk,h);sp(cr*.62,C.lava,h*.94);sp(cr*.32,C.hot,h*.86);}
  volFace(fp,er);},3.6);
 X.restore();
 if(state==='play'&&!buildOn){const aim=!!charging;X.save();X.strokeStyle=aim?'#fff':'#ffe9a8';X.lineWidth=aim?3.5:2.5;X.setLineDash([6,6]);X.lineDashOffset=-wave*.3;ell(CX,CY,cr+14+(aim?Math.sin(NOW*8)*1.5:0),cry+9);X.stroke();X.restore();}
 X.fillStyle='#fff';X.beginPath();for(let i=0;i<22;i++){const x=CX-120+i*(240/21),q=(x-CX)/120,y=VB+10*(1-q*q)+Math.sin(wave*.06+i)*1.4,r=5.5+((i*5)%4);X.moveTo(x+r,y);X.arc(x,y,r,0,TAU);}X.fill();}

// ── NOAH & MAX: flat shapes, dot eyes, big grins ──
function kidHead(x,y,r,hairC,browC,o){const m=o.mood,lk=o.look||[0,0],k=r/27;
 circ(x-r*.98,y+3,r*.25);shp(C.skin);circ(x+r*.98,y+3,r*.25);shp(C.skin);rr(x-r,y-r*.96,r*2,r*1.96,r*.88);shp(C.skin);
 X.save();X.translate(x,y);if(o.flip)X.scale(-1,1);X.beginPath();X.moveTo(-r*1.06,-r*.02);X.quadraticCurveTo(-r*1.22,-r*.95,-r*.56,-r*1.12);X.lineTo(-r*.66,-r*1.44);X.lineTo(-r*.2,-r*1.2);X.lineTo(-r*.02,-r*1.56);X.lineTo(r*.28,-r*1.2);X.lineTo(r*.7,-r*1.42);X.lineTo(r*.62,-r*1.08);X.quadraticCurveTo(r*1.22,-r*.95,r*1.06,-r*.02);
 X.quadraticCurveTo(r*.95,-r*.5,r*.52,-r*.54);X.lineTo(r*.3,-r*.34);X.lineTo(r*.04,-r*.58);X.lineTo(-r*.24,-r*.34);X.lineTo(-r*.5,-r*.56);X.quadraticCurveTo(-r*.95,-r*.5,-r*1.06,-r*.02);X.closePath();shp(hairC);X.restore();
 const wr=o.wear||NOWEAR,gog=wr.includes('goggles'); // Noah's gear (see GEAR). The hat and the goggle frames are sticker shapes (white rim); lenses and mustache are details.
 if(wr.includes('hat')){const dome=()=>{X.beginPath();X.moveTo(x-r*1.09,y-r*.56);X.bezierCurveTo(x-r*1.14,y-r*1.3,x-r*.6,y-r*1.6,x,y-r*1.6);X.bezierCurveTo(x+r*.6,y-r*1.6,x+r*1.14,y-r*1.3,x+r*1.09,y-r*.56);X.closePath();},sp=Math.abs(Math.cos(NOW*7)); // propeller beanie (v7.47: the red cap plus the mustache read as Mario)
  rr(x-r*.055,y-r*1.86,r*.11,r*.3,r*.04);shp(C.navy);ell(x,y-r*1.84,r*(.12+.5*sp),r*.1);shp(C.lava);circ(x,y-r*1.84,r*.1);shp(C.gold);
  dome();shp('#8a5bd6');if(PASS){X.save();dome();X.clip();ell(x,y-r*.56,r*.42,r*1.1);fill(C.gold);for(const g of[-1,1]){ell(x+g*r*1.2,y-r*.56,r*.42,r*1.1);fill('#12a5a0');}X.restore();}
  rr(x-r*1.12,y-r*.74,r*2.24,r*.22,r*.08);shp(C.navy);}
 if(wr.includes('crown')){X.beginPath();X.moveTo(x-r*.98,y-r*.6);[[-1.04,-1.72],[-.72,-1.42],[-.5,-1.78],[-.25,-1.42],[0,-1.86],[.25,-1.42],[.5,-1.78],[.72,-1.42],[1.04,-1.72],[.98,-.6]].forEach(q=>X.lineTo(x+r*q[0],y+r*q[1]));X.closePath();shp(C.gold);
  if(PASS){X.fillStyle=C.amber;X.fillRect(x-r*.98,y-r*.86,r*1.96,r*.26);[[-.6,'#e0457a'],[0,'#12a5a0'],[.6,'#8a5bd6']].forEach(q=>{circ(x+r*q[0],y-r*1.08,r*.11);fill(q[1]);});}}
 if(wr.includes('duck')&&PASS){X.save();X.translate(x,y-r*1.36);X.rotate(Math.sin(NOW*2.2)*.09);paintToy('🦆',r*1.5);X.restore();} // the duck toy riding on his head (it carries its own white rim)
 const shd=wr.includes('shades');if(shd){X.save();X.translate(x,y+2*k);X.scale(k,k);lin([[-27,-1],[27,-1]],3.4,'#1c1c28');for(const s of[-1,1]){rr(s*10.8-9.6,-6.5,19.2,15.5,5.5);shp('#1c1c28');}X.restore();}
 if(gog){X.save();X.translate(x,y+2*k);X.scale(k,k);rr(-27.5,-2.5,55,8,3);shp(C.navy);for(const s of[-1,1]){rr(s*10.5-10,-8,20,19,7.5);shp('#12a5a0');}X.restore();}
 if(wr.includes('snorkel')){const g=o.side||1;X.save();X.translate(x,y+2*k);X.scale(k,k);lin([[g*8,15.5],[g*25,17.5],[g*34,9],[g*34,-38]],6,C.amber);lin([[g*34,-38],[g*34,-47]],6,C.lavaDk);if(PASS){rr(g*8-5,11.5,10,8,3);fill(C.navy);}X.restore();} // tube up the side of the head (side: +1 right, -1 left)
 if(!PASS)return;X.save();X.translate(x,y+2*k);X.scale(k,k);X.lineCap='round';X.lineJoin='round';
 if(gog)for(const s of[-1,1]){rr(s*10.5-7.2,-5.2,14.4,13.4,5);fill('#d6f3ff');}
 if(o.freckles){X.fillStyle='#c9703a';[[-18,7],[-14,10.5],[-20,11.5],[14,10.5],[18,7],[20,11.5]].forEach(f=>{circ(f[0],f[1],1.3);X.fill();});}
 for(const s of[-1,1]){const ex=s*10.5;X.strokeStyle='#2a160c';X.lineWidth=3.4;
  if(shd){X.strokeStyle='#fff';X.lineWidth=2.2;X.beginPath();X.moveTo(ex-5,3);X.lineTo(ex-1,-3);X.stroke();} // sunglasses hide the eyes: just a glint
  else if(m==='laugh'){X.beginPath();X.arc(ex,5,5.6,PI*1.1,PI*1.9);X.stroke();}
  else if(o.blink){X.beginPath();X.moveTo(ex-5,2);X.lineTo(ex+5,2);X.stroke();}
  else{const px=ex+lk[0]*1.8,py=1.5+lk[1]*1.8;circ(px,py,m==='wow'?4.8:4.1);fill('#2a160c');circ(px+1.3,py-1.6,1.4);fill('#fff');}
  X.strokeStyle=browC;X.lineWidth=3.4;X.beginPath();
  if(m==='focus'){X.moveTo(s*16,-9);X.lineTo(s*6,-6);}else if(m==='cheeky'){X.moveTo(s*16,-8+(s>0?-3:1));X.lineTo(s*6,-7+(s>0?1:-3));}else if(m==='wow'||m==='laugh'||m==='throw'){X.moveTo(s*15.5,-10);X.quadraticCurveTo(s*10.5,-14,s*5.5,-10.5);}else{X.moveTo(s*15.5,-8);X.quadraticCurveTo(s*10.5,-11,s*5.5,-8.5);}X.stroke();}
 if(m==='focus'){X.beginPath();X.moveTo(-6,14);X.lineTo(6,13);X.strokeStyle=C.mouth;X.lineWidth=3;X.stroke();ell(5,16.5,3.8,3.2);fill(C.tongue);}
 else if(m==='wow'){ell(0,16,4.8,6);fill(C.mouth);}
 else{const d=(m==='laugh'||m==='throw')?27:m==='cheeky'?21:23.5,mp=()=>{X.beginPath();X.moveTo(-11.5,10.5);X.lineTo(11.5,10.5);X.quadraticCurveTo(10,d,0,d);X.quadraticCurveTo(-10,d,-11.5,10.5);X.closePath();};
  mp();fill(C.mouth);X.save();mp();X.clip();X.fillStyle='#fff';X.fillRect(-12,9,24,5.4);ell(0,d-1,7,4.4);fill(C.tongue);X.restore();}
 if(wr.includes('stache')){X.beginPath();X.moveTo(0,8.4);X.bezierCurveTo(4,5.6,10,7.4,14,9);X.bezierCurveTo(17.5,10.2,20,7.6,19,3.6);X.bezierCurveTo(22.6,9.6,17.6,14.6,12,13.2);X.bezierCurveTo(7,12.2,3,13,0,11);X.bezierCurveTo(-3,13,-7,12.2,-12,13.2);X.bezierCurveTo(-17.6,14.6,-22.6,9.6,-19,3.6);X.bezierCurveTo(-20,7.6,-17.5,10.2,-14,9);X.bezierCurveTo(-10,7.4,-4,5.6,0,8.4);X.closePath();X.lineWidth=2.6;X.strokeStyle='#fff';X.stroke();fill('#8a4a1c');} // thin, curled-up tips, brown (not a bushy black one)
 if(wr.includes('nose')){circ(0,5.2,5.6);fill('#fff');circ(0,5.2,4.4);fill('#ff3b30');circ(-1.4,3.8,1.3);fill('#fff');}
 X.restore();}
// bow tie under the chin; arm floaties: a puffy band round the upper arm from shoulder a towards elbow b (call inside sticker())
function bowTie(x,y,z){for(const g of[-1,1]){X.beginPath();X.moveTo(x,y);X.lineTo(x+g*13*z,y-7.5*z);X.lineTo(x+g*13*z,y+7.5*z);X.closePath();shp('#e0457a');}circ(x,y,3.6*z);shp('#a3264f');}
function floatie(a,b,z){z=z||1;const P=t=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];lin([P(.32),P(.74)],18*z,C.lava);if(PASS){X.beginPath();X.moveTo(...P(.45));X.lineTo(...P(.61));X.lineCap='butt';X.strokeStyle='#fff';X.lineWidth=18*z;X.stroke();}}
// flower lei round the neck (same place as the bow tie)
function lei(x,y,z){[[-20,-13],[-16,-4],[-9,3],[0,6],[9,3],[16,-4],[20,-13]].forEach((q,i)=>{const c=['#ff6fa8',C.gold,'#8a5bd6'][i%3];circ(x+q[0]*z,y+q[1]*z,5.4*z);shp(c);if(PASS){circ(x+q[0]*z,y+q[1]*z,1.9*z);fill(i%3===1?C.lava:'#fff3bf');}});}
// foam finger: a big foam hand on Noah's free hand (hx,hy = his hand; sg = which side; call inside sticker())
function foamFinger(hx,hy,sg){X.save();X.translate(hx,hy);X.rotate(sg*.22); // v7.49: a FIST with the pointing finger at its outer edge and three folded knuckles beside it. A lone finger in the middle of a palm read as a rude gesture; do not centre it again.
 rr(sg*12-6.5,-50,13,38,6.5);shp(C.gold);for(const q of[1.5,-6,-13.5]){circ(sg*q,-18.5,5);shp(C.gold);}rr(-19,-19,38,30,8);shp(C.gold);rr(-14,10,28,8,3);shp(C.amber);
 if(PASS){X.lineCap='round';X.strokeStyle=C.amber;X.lineWidth=2.2;for(const q of[5.2,-2.2,-9.7]){X.beginPath();X.moveTo(sg*q,-19);X.lineTo(sg*q,-11);X.stroke();}text('#1',0,-1,13,C.navy);}X.restore();}
function nameTag(t,x,y,col){X.font=fnt(900,11);const w=X.measureText(t).width+18;rr(x-w/2,y-9,w,18,5);fill('#fff');text(t,x,y+.5,11,col);}
function drawMax(mx,hY){const headY=hY+38,wob=Math.sin(wave*.22)*2,wl=headY+44,er=(state==='erupt'||state==='win'),m=mxc.mood,hopY=mxc.hop+(er?-Math.abs(Math.sin(NOW*7+1))*4:0),hd=headY+Math.sin(NOW*2.4+1)*.5,wig=m==='gotcha'?Math.sin(NOW*30)*3:0;
 foam(mx,wl,33,false);X.save();X.beginPath();X.rect(-20,-500,W+40,wl+500);X.clip();X.translate(0,hopY);
 sticker(()=>{[[-1,wob],[1,-wob]].forEach(a=>{const sg=a[0],hy2=hY+a[1];lin([[mx+16*sg,headY+22],[mx+35*sg,headY+2],[mx+(27-wig)*sg,hy2+5]],10.5,C.skin);circ(mx+(27-wig)*sg,hy2,10);shp(C.skin);});
  rr(mx-21,headY+12,42,80,19);shp(C.skin);if(PASS){ell(mx,headY+17,13,6);fill(C.skinD);}
  kidHead(mx,hd,22,C.hairM,'#a84f16',{mood:(er||m==='gotcha'||m==='laugh')?'laugh':(m==='aww'||(duel&&state==='play'&&duel.mx.e<TUNE.tire))?'wow':'cheeky',freckles:true,flip:true,look:lookAt(mx,headY),blink:mxc.blink>0});});
 X.restore();lapWater(mx,wl,33);foam(mx,wl,33,true);if(duel&&state==='play')maxGear(mx,hY,wl);
 nameTag('Max',mx,wl+22,'#c2530f');}
function maxBlocker(){if(blk.on)drawMax(blk.x,blk.y);}
// what Max's powers look like on him (both players see these)
function maxGear(mx,hY,wl){const m=duel.mx;X.save();X.lineCap='round';
 if(m.noodle>0&&(m.noodle>2||Math.sin(NOW*18)>0)){const R=maxReach()+6;X.beginPath();X.moveTo(mx-R,hY-2);X.quadraticCurveTo(mx,hY-16,mx+R,hY-2);X.lineWidth=16;X.strokeStyle='#fff';X.stroke();X.lineWidth=10;X.strokeStyle='#ff6fa8';X.stroke();}
 if(m.flip>0&&(m.flip>2||Math.sin(NOW*18)>0))for(const g of[-1,1]){X.beginPath();X.moveTo(mx+g*30,wl+2);X.lineTo(mx+g*52,wl-16);X.lineTo(mx+g*56,wl+2);X.closePath();X.lineJoin='round';X.lineWidth=5;X.strokeStyle='#fff';X.stroke();fill(C.green);}
 if(m.bucket>0||m.held){X.save();X.translate(mx,hY-22+Math.sin(NOW*6)*1.5);X.rotate(m.held?0:PI);paintToy('🪣',40);X.restore();if(m.held){X.save();X.translate(mx,hY-40);paintToy(m.held.o.hb?'🧶':m.held.o.em,22);X.restore();text(Math.ceil(m.held.t)+'',mx+28,hY-22,14,'#fff',{s:C.navy});}}
 if(m.juice>0&&(m.juice>2||Math.sin(NOW*18)>0)){const jx=mx+30,jy=hY+44+Math.sin(NOW*14)*1.5;X.lineJoin='round';rr(jx-9,jy-11,18,24,3);X.lineWidth=5;X.strokeStyle='#fff';X.stroke();fill(C.lava);X.fillStyle=C.hot;X.fillRect(jx-9,jy-2,18,7);X.beginPath();X.moveTo(jx-3,jy-11);X.lineTo(jx-9,jy-21);X.lineWidth=3;X.strokeStyle='#fff';X.stroke();}
 if(duel.jet>0){const h=hY+10;X.fillStyle='#fff';X.fillRect(mx-BLAST_W*.55,60,BLAST_W*1.1,h-60);X.fillStyle=C.waterLt;X.fillRect(mx-BLAST_W*.36,60,BLAST_W*.72,h-60);}
 X.restore();}
// Bubble Bath: bubbles over the bottom of the tub hide the toys
function drawBubbles(){const b=duel&&duel.mx.bub;if(!(b>0))return;const k=Math.min(1,b/.4,(5-b)/.3+.2);for(let i=0;i<34;i++){const x=28+(i*53%330)+Math.sin(NOW*1.3+i)*6,y=436+(i*29%62)+Math.cos(NOW*1.7+i*2)*5,r=(17+(i*7%12))*k;circ(x,y,r);fill('#fff');X.lineWidth=2.5;X.strokeStyle=C.waterLt;X.stroke();circ(x-r*.3,y-r*.3,r*.22);fill(C.waterLt);}}
// Playing Max: (1) a marker on the water where he is swimming to, (2) his energy bar under his name, (3) on stages 1 to
// 3 only, a "stand here" ring where the throw being wound up will pass.
function duelHints(){if(state!=='play')return;const m=duel.mx,wl=blk.y+82;X.save();X.lineCap='round';
 if((duel.stage<=3||(duel.net&&swipeMode))&&charging){const cx=crossX(charging.o),ok=Math.abs(cx-blk.x)<maxReach()*.8;X.setLineDash([8,7]);X.lineDashOffset=-NOW*30;X.lineWidth=7;X.strokeStyle=C.navy;ell(cx,wl-2,30,10);X.stroke();X.lineWidth=3.5;X.strokeStyle=ok?C.go:C.gold;X.stroke();X.setLineDash([]);
  if(!ok){const g=cx>blk.x?1:-1,ax=blk.x+g*(44+((NOW*2)%1)*8);arrowHead(ax,blk.y+40,g>0?0:PI,11,C.gold);if(Math.abs(cx-blk.x)>60&&m.e>=TUNE.tire&&(!duel.tut||duel.tut.i===3))text('Tap Here To Dive!',clamp(cx,70,W-70),wl+22,12.5,C.gold,{s:C.navy});}}
 if(Math.abs(m.tx-blk.x)>8){X.beginPath();X.moveTo(m.tx-8,wl+10);X.lineTo(m.tx,wl+1);X.lineTo(m.tx+8,wl+10);X.strokeStyle=C.navy;X.lineWidth=7;X.stroke();X.strokeStyle='#fff';X.lineWidth=3.5;X.stroke();}
 X.restore();}
// Max's name and energy bar, on top of everything else in the tub, for both players: the Max player needs to find
// him and read his energy; the Noah player wants to know when he is tired.
function maxBar(){if(state!=='play')return;const m=duel.mx,wl=blk.y+82;nameTag('Max',blk.x,wl+22,'#c2530f');
 {const f=m.e,x=blk.x-30,y=wl+35,low=f<TUNE.tire;rr(x-2,y-2,64,14,5);fill(C.navy);rr(x,y,60,10,3.5);fill('#c9d8f2');if(f>.02){rr(x,y,Math.max(6,60*f),10,3.5);fill(low?C.lavaDk:f<.6?C.amber:C.go);}text(low?'Tired!':'Energy',blk.x,y+20,low?12:10,low?C.hot:'#fff',{s:C.navy});} // his energy bar: green, amber, red
}
// the power buttons along the bottom of the screen (screen coordinates): the free Big Splash, then what was packed
function duelBar(){if(!duel||state!=='play')return[];const D=duel,list=D.role==='noah'?D.nbag.map(b=>({k:b.k,armed:b.armed})):(D.free?[{k:'splash',free:true}]:[]).concat(D.bag.map(b=>({k:b.k}))),sz=54,gap=10,x0=W/2-(list.length*sz+(list.length-1)*gap)/2,y=HS-lblB-sz-2;return list.map((b,i)=>({...b,x:x0+i*(sz+gap),y,w:sz,h:sz}));}
function drawDuelBar(){duelBar().forEach(b=>{if(duel.tut&&!(duel.tut.ok>0)&&(TUT[duel.tut.i].k!=='blast'||duel.tut.slow)){const y=b.y-18-Math.abs(Math.sin(NOW*5))*10;arrowHead(b.x+b.w/2,y,PI/2,13,C.gold);text('Tap',b.x+b.w/2,y-24,14,C.gold,{s:C.navy});}rr(b.x,b.y+4,b.w,b.h,10);fill(C.deep);rr(b.x,b.y,b.w,b.h,10);fill(b.armed?C.hot:'#fff');X.save();X.translate(b.x+b.w/2,b.y+b.h/2-4+(b.armed?Math.sin(NOW*8)*1.5:0));powIcon(b.k,15);X.restore();text(b.armed?'Ready':b.free?'Free':b.k==='juice'?'Juice':POWNAME[b.k].split(' ')[b.k==='decoy'||b.k==='rocket'||b.k==='double'?0:POWNAME[b.k].split(' ').length-1],b.x+b.w/2,b.y+b.h-8,9.5,b.free||b.armed?C.lavaDk:C.navy);});}
// a small picture of each power, centred on 0,0, about z units in radius
function powIcon(k,z){X.save();X.lineCap='round';X.lineJoin='round';const ol=w=>{X.lineWidth=w||2.4;X.strokeStyle=C.navy;X.stroke();};
 if(k==='splash'){X.beginPath();X.moveTo(-z*1.1,z*.7);X.quadraticCurveTo(-z*.9,-z*.9,z*.1,-z*.8);X.quadraticCurveTo(z*.9,-z*.7,z*.7,-z*.05);X.quadraticCurveTo(z*.2,-z*.4,z*.05,z*.1);X.quadraticCurveTo(z*.6,z*.1,z*1.1,z*.7);X.closePath();ol();fill(C.water);circ(z*.95,-z*.75,z*.16);ol(2);fill(C.water);circ(-z*.2,-z*1.05,z*.13);ol(2);fill(C.water);}
 else if(k==='noodle'){X.beginPath();X.arc(0,z*.75,z*1.05,PI*1.13,PI*1.87);X.lineWidth=z*.62;X.strokeStyle=C.navy;X.stroke();X.lineWidth=z*.4;X.strokeStyle='#ff6fa8';X.stroke();}
 else if(k==='flip'){X.rotate(.35);X.beginPath();X.moveTo(-z*.28,-z);X.lineTo(z*.28,-z);X.lineTo(z*.85,z*.75);X.quadraticCurveTo(0,z*1.15,-z*.85,z*.75);X.closePath();ol();fill(C.green);X.strokeStyle=C.greenD;X.lineWidth=2;for(const g of[-.35,0,.35]){X.beginPath();X.moveTo(g*z*.5,-z*.3);X.lineTo(g*z*1.4,z*.7);X.stroke();}}
 else if(k==='bucket'){paintToy('🪣',z*2.3);}
 else if(k==='blast'){rr(-z*.95,-z*.6,z*1.6,z*.62,z*.2);ol();fill(C.lava);rr(-z*.7,-z*.1,z*.5,z*.9,z*.14);ol();fill(C.lavaDk);rr(z*.6,-z*.47,z*.42,z*.34,z*.08);ol(2);fill(C.gold);X.beginPath();X.moveTo(z*1.1,-z*.3);X.lineTo(z*1.25,-z*.3);X.lineWidth=z*.3;X.strokeStyle=C.water;X.stroke();}
 else if(k==='decoy'){paintToy('🦆',z*2);X.setLineDash([3,3]);X.lineWidth=2;X.strokeStyle=C.lava;circ(0,0,z*1.12);X.stroke();X.setLineDash([]);}
 else if(k==='rocket'){paintToy('🚀',z*2.1);}
 else if(k==='double'){X.save();X.translate(-z*.42,z*.15);paintToy('⛵',z*1.5);X.restore();X.save();X.translate(z*.45,-z*.2);paintToy('🦕',z*1.5);X.restore();}
 else if(k==='juice'){X.beginPath();X.moveTo(z*.1,-z*.7);X.lineTo(z*.55,-z*1.25);X.lineWidth=z*.2;X.strokeStyle=C.navy;X.stroke();rr(-z*.62,-z*.72,z*1.24,z*1.6,z*.16);ol();fill(C.lava);X.fillStyle=C.hot;X.fillRect(-z*.62,-z*.12,z*1.24,z*.5);star(0,z*.13,z*.3,z*.14);fill('#fff');}
 else{[[-.35,.2,.62],[.5,-.25,.46],[.38,.6,.3]].forEach(q=>{circ(q[0]*z,q[1]*z,q[2]*z);ol(2.2);fill('#eaf8ff');circ((q[0]-q[2]*.3)*z,(q[1]-q[2]*.3)*z,q[2]*z*.2);fill('#fff');});}
 X.restore();}

function kid(){const wr=duel&&duel.wearN?duel.wearN:PF.list[PF.cur].wear,flo=wr.includes('floaties'),kx=190,base=noahBase(),s=splashSide,er=(state==='erupt'||state==='win'),wl=base+8,busy=charging||pendingLaunch||swingT>0;
 const cheer=er||(noah.mood==='cheer'&&!busy),hopY=noah.hop+(er?-Math.abs(Math.sin(NOW*7))*4:0),hy=base-44+Math.sin(NOW*2.2)*.8;
 const tl=charging?-s*(.05+.07*Math.min(1,charging.c/1.2)):swingT>0?s*.14:0;noah.lean+=(tl-noah.lean)*.25;noah.ab=(noah.ab||0)+((busy?1:0)-(noah.ab||0))*.3;
 foam(kx,wl,40,false);X.save();X.beginPath();X.rect(-20,-500,W+40,wl+500);X.clip();X.translate(kx,wl+12);X.rotate(noah.lean);X.translate(-kx,-(wl+12)+hopY);
 sticker(()=>{
  rr(kx-25,base-35,50,92,22);shp(C.skin);if(PASS){ell(kx,base-29,15,7);fill(C.skinD);}
  if(!cheer){const rest=(sg,ph)=>[[kx+18*sg,base-18],[kx+35*sg,base+1],[kx+41*sg,base-14+Math.sin(NOW*2.4+ph)*2.5]],arm=q=>{lin(q,12,C.skin);if(flo)floatie(q[0],q[1]);circ(q[2][0],q[2][1]-1,9.5);shp(C.skin);};{const q=rest(-s,1.3);arm(q);if(wr.includes('finger'))foamFinger(q[2][0],q[2][1]-1,-s);}
   const sX=kx+18*s,sY=base-20,ex=sX+s*Math.cos(armAng)*26,ey=sY+Math.sin(armAng)*26,hx=ex+s*Math.cos(armAng+0.5)*22,hy2=ey+Math.sin(armAng+0.5)*22,r=rest(s,0),b=noah.ab||0,mix=(u,v)=>[lerp(u[0],v[0],b),lerp(u[1],v[1],b)];arm([mix(r[0],[sX,sY]),mix(r[1],[ex,ey]),mix(r[2],[hx,hy2])]);}
  else[-1,1].forEach(sg=>{const wg=Math.sin(NOW*9+sg)*4,hx=kx+42*sg+wg,hy2=hy-22;lin([[kx+18*sg,base-20],[kx+38*sg,hy+12],[hx,hy2]],12,C.skin);if(flo)floatie([kx+18*sg,base-20],[kx+38*sg,hy+12]);circ(hx,hy2-2,9.5);shp(C.skin);if(sg===-s&&wr.includes('finger'))foamFinger(hx,hy2-2,sg);});
  const nm=noah.mood;kidHead(kx,hy,27,C.hairN,'#2b1a12',{mood:cheer?'laugh':charging?'focus':nm==='throw'?'throw':(nm==='wow'||nm==='oops')?'wow':'happy',look:lookAt(kx,hy),blink:noah.blink>0,wear:wr,side:s});if(wr.includes('bow'))bowTie(kx,base-10,1);if(wr.includes('lei'))lei(kx,base-11,1);});
 X.restore();lapWater(kx,wl,40);foam(kx,wl,40,true);nameTag('Noah',kx,wl+24,'#1f5fd0');}

// ── TOYS ──
function toyFloat(em,x,by,size,rot,sx,sy,hb){ell(x,by+size*.38,size*.52,size*.13);fill(C.waterDk);X.save();X.translate(x,by);X.rotate(rot);X.scale(sx,sy);paintToy(em,size);X.restore();}
function drawObjs(){const anyHeld=charging||pendingLaunch;objs.map((o,i)=>[o,i]).sort((a,b)=>((a[0].st==='fly')-(b[0].st==='fly'))||(a[0].y-b[0].y)).forEach(([o,i])=>{if(o.st==='gone'||o.st==='held')return;if(o.born&&NOW<o.born)return;
 const fly=o.st==='fly',held=(charging&&charging.o===o)||(pendingLaunch&&pendingLaunch.o===o),bk=o.born?EZ.back((NOW-o.born)/.38):1,em=o.hb?'🧶':o.em,size=o.hb?36:(need>8?30:need>5?33:36);
 let nudge=0;if(!anyHeld&&idleT>3.5&&!fly){const ph=(idleT*1.1-i*.33)%3.2;if(ph>0&&ph<.42)nudge=-Math.sin(ph/.42*PI)*9;}
 const by=o.y+((fly||held)?0:Math.sin(wave*.045+o.bob)*3.2)+nudge,canGrab=o.st==='float'&&!anyHeld&&swingT<=0&&!(duel&&duel.role==='max'),sq=o.sq||0;
 if(fly){X.save();X.translate(o.x,by);X.rotate(o.rot||0);X.scale(1+sq*.4,1-sq*.3);paintToy(em,size);X.restore();return;}
 if(canGrab&&(o.hb||need<=4)){const pu=.5+Math.sin(wave*.08+o.bob)*.5;X.strokeStyle=o.hb?C.gold:'#fff';X.lineWidth=3;X.setLineDash([7,7]);X.lineDashOffset=-wave*.25;circ(o.x,by,29+pu*2);X.stroke();X.setLineDash([]);}
 let s1=(1+sq*.4)*bk,s2=(1-sq*.3)*bk,dy=0,jx=0,rot=Math.sin(wave*.03+o.bob)*.09;
 if(held&&charging){const k=clamp((charging.c-.3)/1.1,0,1);s1*=1+k*.15;s2*=1-k*.15;dy=k*3.5;jx=(Math.random()-.5)*k*1.6;rot=0;}
 toyFloat(em,o.x+jx,by+dy,size,rot,s1,s2);
 if(o.hb&&canGrab){text('Bonus! +5s',o.x,by-36,12.5,C.gold,{s:C.navy});text(Math.ceil(o.life)+'s',o.x,by+36,11,'#fff',{s:C.navy});}
 if(o.isNew&&newToyT>0)text('New!',o.x,by-38+Math.sin(NOW*6)*2,14,C.gold,{s:C.navy});});}
function drawRings(){rings.forEach(r=>{X.save();X.globalAlpha=Math.max(0,r.life);X.strokeStyle='#fff';X.lineWidth=r.big?6:2.5;ell(r.x,r.y,r.r,r.r*(r.big?.55:.38));X.stroke();X.restore();});}
function drawEjecta(){ejecta.forEach(e=>{if(e.delay>0)return;X.save();X.translate(e.x,e.y);X.rotate(e.rot);paintToy(e.em,38);X.restore();});}
function drawParts(){smoke.forEach(p=>{X.globalAlpha=Math.max(0,Math.min(1,p.life*1.4));circ(p.x,p.y,p.r);fill(p.c);});X.globalAlpha=1;
 parts.forEach(p=>{const r=p.r*Math.min(1,p.life);if(r<.4)return;circ(p.x,p.y,r);fill(p.col==='#8a5a2a'?p.col:(p.col==='#ffcc00'?C.hot:'#fff'));});
 eParts.forEach(p=>{circ(p.x,p.y,p.r+1.6);fill(C.lavaDk);circ(p.x,p.y,p.r);fill(C.lava);circ(p.x-p.r*.15,p.y-p.r*.2,p.r*.5);fill(C.hot);});
 sparks.forEach(p=>{const r=p.r*p.life+1;star(p.x,p.y,r,r*.42,p.rot);fill(p.col==='#ffffff'?'#fff':C.gold);});
 confet.forEach(p=>{X.save();X.translate(p.x,p.y);X.rotate(p.rot);X.scale(1,Math.cos(NOW*7+p.rot));X.fillStyle=p.col;X.fillRect(-p.w/2,-p.w*.3,p.w,p.w*.6);X.restore();});}
function drawPops(){pops.forEach(p=>{const k=p.age,sc=k<.16?lerp(.4,1.2,EZ.out(k/.16)):lerp(1.2,1,EZ.out((k-.16)/.22)),size=p.big?21:16;if(k>.92)return;
 X.save();X.font=fnt(900,size);const hw=X.measureText(p.t).width*.6+8;X.translate(clamp(p.x,hw,W-hw),p.y-EZ.out(k)*44);X.scale(sc,sc);text(p.t,0,0,size,p.big?C.gold:'#fff',{s:C.navy});X.restore();});}

// ── AIM + TUTORIAL ──
function arrowHead(x,y,ang,s,col){X.save();X.translate(x,y);X.rotate(ang);X.beginPath();X.moveTo(s,0);X.lineTo(-s*.7,-s*.8);X.lineTo(-s*.25,0);X.lineTo(-s*.7,s*.8);X.closePath();X.lineJoin='round';X.lineWidth=5;X.strokeStyle=C.navy;X.stroke();fill(col);X.restore();}
function bubble(t,x,y,col,tc){X.font=fnt(900,15);const w=X.measureText(t).width+26,bx=clamp(x-w/2,8,W-w-8);rr(bx,y-15+3,w,30,6);fill(C.deep);rr(bx,y-15,w,30,6);fill(col);text(t,bx+w/2,y+.5,15,tc);}
function chargeGuide(){if(!charging){wasOn=false;return;}if(swipeMode)charging.c+=(charging.tc-charging.c)*.25;charging.steer=(charging.steer||0)+((charging.ts||0)-(charging.steer||0))*.25;const o=charging.o,iv=ideal(o),f=charging.c,dr=diff().drift*.012;
 let vx=(iv.vx+(charging.steer||0)/T)*f,vy=iv.vy*f,tx=o.x,ty=o.y,on=false;const pts=[];
 for(let i=0;i<(swipeMode?220:110);i++){vy+=G;vx+=dr;tx+=vx;ty+=vy;if(swipeMode){if(tx<WALL_L&&vx<0){tx=WALL_L;vx*=-BNC;}else if(tx>WALL_R&&vx>0){tx=WALL_R;vx*=-BNC;}}if(catchHit(tx,ty,vy)){on=true;break;}if(ty>556||(!swipeMode&&(tx<0||tx>W)))break;pts.push([tx,ty]);}
 const show=on&&!hardMode;if(hardMode&&swipeMode)pts.length=Math.min(pts.length,HARD_ARC);if(show&&!wasOn){sfxTick();haptic(1);}wasOn=show;const col=show?C.go:'#fff',sh=~~(NOW*14);
 pts.forEach((p,i)=>{if((i+sh)%3===1||i<3)return;const r=Math.max(2.6,5.4-i*.02);circ(p[0],p[1],r+1.8);fill(C.navy);circ(p[0],p[1],r);fill(col);});
 const frac=Math.min(f/1.4,1);X.lineCap='round';X.strokeStyle=C.navy;X.lineWidth=9;circ(o.x,o.y,32);X.stroke();X.strokeStyle=col;X.lineWidth=5;X.beginPath();X.arc(o.x,o.y,32,-1.57,-1.57+TAU*frac);X.stroke();
 if(show){X.save();X.strokeStyle=C.go;X.lineWidth=4.5;ell(CX,CY,craterR+16+Math.sin(NOW*16)*1.5,craterR*.5+10);X.stroke();X.restore();const pu=1+Math.sin(NOW*16)*.06;X.save();X.translate(o.x,o.y+(swipeMode?54:-52));X.scale(pu,pu);if(!charging.cpu)bubble('Let Go!',0,0,C.go,'#fff');X.restore();}
 else if(charging.cpu){}
 else if(!swipeMode)bubble('Hold…',o.x,o.y-52,'#fff',C.navy);
 else if(charging.len<SWIPE_MIN)bubble('Swipe Up!',o.x,o.y-52,'#fff',C.navy);
 // the swipe itself: a line from where the finger went down to where it is now
 if(charging.len>4){X.lineCap='round';X.beginPath();X.moveTo(charging.sx,charging.sy);X.lineTo(charging.fx,charging.fy);X.strokeStyle=C.navy;X.lineWidth=9;X.stroke();X.strokeStyle=col;X.lineWidth=4.5;X.stroke();circ(charging.fx,charging.fy,9);fill(C.navy);circ(charging.fx,charging.fy,6.5);fill(col);}}
// wordless demo: a dashed arrow sweeps from the toy to the crater until the first real throw
function tutorial(){if(!tutOn||state!=='play'||charging||pendingLaunch||swingT>0)return;const o=objs.find(q=>q.st==='float'&&!q.hb);if(!o||(o.born&&NOW<o.born+.4))return;
 const iv=ideal(o),pts=[];let vx=iv.vx,vy=iv.vy,x=o.x,y=o.y;for(let i=0;i<T-3;i++){vy+=G;x+=vx;y+=vy;pts.push([x,y]);}
 const t=(tutT%2.4)/2.4,grow=EZ.out(t/.55),n=Math.max(18,~~(pts.length*grow)),p1=(NOW*1.5)%1;
 X.save();X.globalAlpha=1-p1;X.strokeStyle='#fff';X.lineWidth=4;circ(o.x,o.y,20+p1*18);X.stroke();X.restore();
 const path=()=>{X.beginPath();for(let i=6;i<n;i++)i===6?X.moveTo(pts[i][0],pts[i][1]):X.lineTo(pts[i][0],pts[i][1]);};
 X.lineCap='round';X.lineJoin='round';X.setLineDash([10,9]);X.lineDashOffset=-NOW*40;path();X.strokeStyle=C.navy;X.lineWidth=9;X.stroke();path();X.strokeStyle='#fff';X.lineWidth=4.5;X.stroke();X.setLineDash([]);
 const a=pts[n-1],b=pts[Math.max(0,n-4)];arrowHead(a[0],a[1],Math.atan2(a[1]-b[1],a[0]-b[0]),12,'#fff');
 bubble(swipeMode?'Swipe It In!':'Press And Hold',o.x,o.y+50,'#fff',C.navy);}

// ── HUD ──
function chip(x,y,w,h){const r=Math.min(6,h/2);rr(x,y+3,w,h,r);fill(C.deep);rr(x,y,w,h,r);fill('#fff');}
function roundBtn(x,y,kind){rr(x-19,y-16,38,38,8);fill(C.deep);rr(x-19,y-19,38,38,8);fill('#fff');X.fillStyle=C.navy;
 if(kind==='pause'){rr(x-7,y-7.5,5,15,1.8);X.fill();rr(x+2,y-7.5,5,15,1.8);X.fill();}
 else if(kind==='home'){X.beginPath();X.moveTo(x-12,y-.5);X.lineTo(x,y-11);X.lineTo(x+12,y-.5);X.closePath();X.fill();X.fillRect(x-8,y-1.5,16,11.5);X.fillStyle='#fff';X.fillRect(x-2.5,y+3,5,7);}
 else if(kind==='play'){X.beginPath();X.moveTo(x-5,y-8);X.lineTo(x+8,y);X.lineTo(x-5,y+8);X.closePath();X.fill();}
 else{X.beginPath();X.moveTo(x-10,y-4);X.lineTo(x-5,y-4);X.lineTo(x+1,y-9.5);X.lineTo(x+1,y+9.5);X.lineTo(x-5,y+4);X.lineTo(x-10,y+4);X.closePath();X.fill();X.lineWidth=2.4;X.strokeStyle=C.navy;X.lineCap='round';
  if(kind==='mute'){X.beginPath();X.moveTo(x+5,y-4.5);X.lineTo(x+12,y+4.5);X.moveTo(x+12,y-4.5);X.lineTo(x+5,y+4.5);X.stroke();}else{X.beginPath();X.arc(x+2,y,5.5,-.9,.9);X.stroke();X.beginPath();X.arc(x+2,y,10,-.9,.9);X.stroke();}}}
function drawMute(){roundBtn(W-28,SAFE+28,muted?'mute':'sound');}
function drawPauseBtn(){if(!(duel&&duel.net))roundBtn(W-74,SAFE+28,paused?'play':'pause');roundBtn(W-120,SAFE+28,'home');}
function hud(){const s=SAFE,sp=1+scorePop*scorePop*.2;
 if(duel&&duel.tut){const T=duel.tut,L=TUT[T.i];rr(10,s+13,100,36,6);fill('#34509c');rr(10,s+10,100,36,6);fill('#5b7fd6');text('Skip',60,s+29,16,'#fff');text('Max School',175,s+22,13,'#fff',{s:C.navy});text('Lesson '+(T.i+1)+' Of '+TUT.length,175,s+40,11.5,C.hot,{s:C.navy});
  const y=s+70,k=EZ.back(Math.min(1,T.t/.3)+(T.ph?1:0));X.save();X.translate(W/2,y+29);X.scale(lerp(.9,1,Math.min(1,k)),lerp(.9,1,Math.min(1,k)));rr(-176,-26,352,58,9);fill(C.deep);rr(-176,-29,352,58,9);fill('#fff');text(L.n,0,-13,17,C.lava);text(T.msg||L.s,0,10,12.5,C.navy,{w:800});X.restore();return;}
 if(duel){chip(10,s+10,100,36);text('Blocks '+duel.blocks,60,s+29,16,C.navy);text((solo(duel)?'Round ':'Stage ')+round,60,s+62,12.5,'#fff',{s:C.navy});}else{
 X.save();X.translate(60,s+28);X.scale(sp,sp);chip(-50,-18,100,36);star(-30,0,11,5.4);fill(C.gold);text(String(Math.round(scoreShown)),13,1,19,C.navy);X.restore();
 text((hardMode?'Hard · ':'Round ')+round+'/10',60,s+62,12.5,hardMode?C.hot:'#fff',{s:C.navy});}
 if(combo>1&&!duel){const cp=1+comboPop*.3;X.save();X.translate(60,s+84);X.scale(cp,cp);X.fillStyle=C.deep;X.fillRect(-33,-9,66,24);X.fillStyle='#fff';X.fillRect(-33,-12,66,24);text('x'+combo+' Combo',0,.5,10.5,C.lavaDk);X.restore();}
 const tw=104,tx=119,ty=s+17,pct=clamp(timeLeft/roundTime,0,1),low=state==='play'&&timeLeft<8,tc=low?C.amber:pct>.5?C.go:C.gold;
 rr(tx,ty+3,tw,22,6);fill(C.deep);rr(tx,ty,tw,22,6);fill('#fff');rr(tx+3,ty+3,tw-6,16,4);fill('#c9d8f2');
 if(pct>0){rr(tx+3,ty+3,Math.max(10,(tw-6)*pct),16,4);fill(tc);}
 const pu=low?1+Math.sin(NOW*9)*.12:1;X.save();X.translate(tx+tw/2,ty+11.5);X.scale(pu,pu);text(String(Math.ceil(timeLeft)),0,0,13,C.navy);X.restore();
 // toy tracker: empty slots fill with the real toy as it goes in
 const n=need,gap=Math.min(22,150/Math.max(n,1)),x0=tx+tw/2-(n-1)*gap/2;
 for(let i=0;i<n;i++){const o=objs[i],lit=!o||o.hb||o.st==='gone',x=x0+i*gap,y=s+58;if(lit){X.save();X.translate(x,y);paintToy(currentToys[i],13.5);X.restore();}else{circ(x,y,6.5);fill(C.deep);circ(x,y,4);fill(C.tile);}}}
function drawBanner(){if(bannerT<=0)return;const k=EZ.back((2.6-bannerT)/.35)*Math.min(1,bannerT/.25);if(k<=0)return;X.save();X.translate(W/2,96);X.scale(k,k);X.font=fnt(900,17);const w=X.measureText(banner).width+38;chip(-w/2,-18,w,36);text(banner,0,1,17,C.lavaDk);X.restore();}

// ── CARDS + TITLE ──
function cardBegin(cw,ch,title,age){age=age==null?uiT:age;const cx=(W-cw)/2,cy=(HS-ch)/2;X.fillStyle='rgba(13,28,84,'+(.84*EZ.out(age/.2)).toFixed(3)+')';X.fillRect(0,0,W,HS);
 const sc=lerp(.8,1,EZ.back(age/.36));X.save();X.translate(W/2,cy+ch/2+(1-EZ.out(age/.3))*30);X.scale(sc,sc);X.rotate(-.018);X.translate(-W/2,-(cy+ch/2));
 rr(cx,cy+9,cw,ch,12);fill('#060f38');rr(cx,cy,cw,ch,12);fill('#fff');
 const bn=(dy,c)=>{X.beginPath();X.moveTo(cx-15,cy+6+dy);X.lineTo(cx+cw+15,cy+6+dy);X.lineTo(cx+cw+3,cy+33+dy);X.lineTo(cx+cw+15,cy+60+dy);X.lineTo(cx-15,cy+60+dy);X.lineTo(cx-3,cy+33+dy);X.closePath();fill(c);};bn(6,'#a82a06');bn(0,C.lava);X.fillStyle=C.hot;X.fillRect(cx-7,cy+52,cw+14,3.5);
 text(title,W/2,cy+31,26,'#fff',{s:C.lavaDk,sw:6});return{cx,cy,age};}
function cardEnd(){X.restore();}
function button(bx,by,bw,bh,t,act,o){o=o||{};const id=o.id||0,down=(press&&press.key===uiKey&&press.id===id)||(NOW<pressUntil&&pressId===id),cx=bx+bw/2,cy=by+bh/2,pu=down?0:Math.sin(NOW*4)*.016,dy=down?5:0;
 X.save();X.translate(cx,cy);X.scale(1+pu,1+pu);X.translate(-cx,-cy);rr(bx,by+8,bw,bh,9);fill(o.colD||C.greenD);rr(bx,by+dy,bw,bh,9);fill(down?(o.colP||'#27a83f'):(o.col||C.green));
 const fz=o.size||22;X.font=fnt(900,fz);const tw=X.measureText(t).width,iw=o.icon?fz*1.2:0,x0=cx-(tw+iw)/2;
 if(o.icon){const ix=x0+fz*.42,iy=cy+dy+1,z=fz*.5;X.beginPath();X.moveTo(ix-z*.6,iy-z*.85);X.lineTo(ix+z*.9,iy);X.lineTo(ix-z*.6,iy+z*.85);X.closePath();X.lineJoin='round';X.lineWidth=3;X.strokeStyle='#fff';X.stroke();fill('#fff');}
 text(t,x0+iw+tw/2,cy+dy+1-(o.sub?8:0),fz,'#fff');if(o.sub)text(o.sub,cx,cy+dy+15,11.5,'#fff',{w:800});X.restore();const hit={x:bx-8,y:by-6,w:bw+16,h:bh+18,act,key:uiKey,id};if(id===2)card2=hit;else if(id===3)card3=hit;else if(id===4)card4=hit;else if(id>=5)hits.push(hit);else card=hit;}
function cardToy(em,x,y,size,age,delay){const k=EZ.elastic((age-delay)/.7);if(k<=0)return;X.save();X.translate(x,y+Math.sin(NOW*3+x)*3);X.scale(k,k);paintToy(em,size);X.restore();}
function body(t,y,size,col){text(t,W/2,y,size||15,col||C.navy,{w:800});}
function check(x,y){circ(x,y,8);fill('#fff');circ(x,y,6.5);fill(C.green);X.strokeStyle='#fff';X.lineWidth=2.4;X.lineCap='round';X.lineJoin='round';X.beginPath();X.moveTo(x-3,y);X.lineTo(x-.8,y+2.4);X.lineTo(x+3.2,y-2.2);X.stroke();}
function drawIntroCard(){const cw=328,ch=306,{cy,age}=cardBegin(cw,ch,'Noah’s Bath Toys');
 const n=currentToys.length,gap=Math.min(92,264/Math.max(n-1,1)),tz=n>3?Math.max(26,gap*1.15):62,sx=W/2-(n-1)*gap/2;currentToys.forEach((em,i)=>cardToy(em,sx+i*gap,cy+128,tz,age,.2+i*(n>3?.05:.12)));
 body('Splash them into the volcano!',cy+188,16);body('A new toy joins every round',cy+211,13,'#4a6fc4');
 button((W-236)/2,cy+ch-80,236,58,'Let’s Splash!',()=>{startRound(false);state='play';lastNow=performance.now();});cardEnd();}
function drawNewToyCard(){const cw=328,ch=366,{cx,cy,age}=cardBegin(cw,ch,'New Toy!');
 X.save();X.translate(W/2,cy+144);burstShape(104,74,14,NOW*.3);fill(C.hot);burstShape(86,60,14,NOW*.3+.11);fill('#fff3bf');X.restore();cardToy(newToyEm,W/2,cy+142,84,age,.25);
 body(TOYNAME[newToyEm]||'New Toy',cy+226,24);body('Joins the tub for round '+round,cy+250,13.5,'#4a6fc4');
 const n=currentToys.length,gap=Math.min(28,(cw-60)/n),sx=W/2-(n-1)*gap/2;currentToys.forEach((em,i)=>{const k=EZ.back((age-.5-i*.04)/.3);if(k<=0)return;X.save();X.translate(sx+i*gap,cy+278);X.scale(k,k);paintToy(em,i===n-1?24:19);X.restore();});
 button((W-220)/2,cy+ch-66,220,56,'Splash On!',()=>{startRound(true);state='play';lastNow=performance.now();});cardEnd();}
// ── BADGES AND STATS ── lifetime numbers kept on this phone (localStorage). Each badge has three levels: Bronze, Silver, Gold.
const ST_KEY='evitb-stats-v1'; // old single-player save, read once to become Player 1
// PLAYERS: up to 4 profiles on this phone, each with its own stats and badges (localStorage key PF_KEY).
// Stats saved before profiles existed (ST_KEY) become the first player's.
// TEST: true only on the test page (play-test.html). The test page keeps its players and badges under its own
// key, so trying things there can never damage the live game's saved progress. On its first visit it starts
// from a copy of the live progress.
const TEST=/play-test/.test(location.pathname),PF_LIVE='evitb-profiles-v1';
const PF_KEY=TEST?'evitb-test-profiles-v1':PF_LIVE,PF_MAX=4,PF_ICONS=['🦆','🐙','⛵','🦕'],PF_TOYS=[...BASE,...Object.values(NEWBY)]; // PF_ICONS: handed out to new players in turn; PF_TOYS: every toy in the game, any of which a player can pick
const ST0={games:0,rounds:0,toys:0,misses:0,hair:0,blocks:0,newFirst:0,sneak:0,perfect:0,quick:0,rebounds:0,hardRounds:0,wins:0,bestScore:0,bestStreak:0,bestRound:0,bestCombo:0,
 // the Max game (v8.19): the same kind of numbers, for playing Max against the computer
 mxGames:0,mxRounds:0,mxBlocks:0,mxHair:0,mxDives:0,mxPow:0,mxShut:0,mxNoPow:0,mxClose:0,mxLate:0,mxWins:0,mxLet:0,mxBestStreak:0,mxBestScore:0,mxBestRound:0};
function pfFix(o){const r={...ST0};if(o)for(const k in ST0)if(typeof o[k]==='number')r[k]=o[k];return r;}
let PF={cur:0,list:[]},ST;
try{const sv=JSON.parse(localStorage.getItem(PF_KEY)||(TEST&&localStorage.getItem(PF_LIVE))||'null');if(sv&&Array.isArray(sv.list)&&sv.list.length){PF.list=sv.list.slice(0,PF_MAX).map((q,i)=>({name:String(q.name||'Player '+(i+1)).slice(0,10),icon:ALL_TOYS.includes(swapToy(q.icon))?swapToy(q.icon):PF_ICONS[i],st:pfFix(q.st),coins:typeof q.coins==='number'?Math.max(0,q.coins|0):null,owned:Array.isArray(q.owned)?[...new Set(q.owned.map(swapToy))].filter(e=>priceOf(e)):[],line:Array.isArray(q.line)?q.line.map(swapToy):q.line,gear:gearFix(q.gear),wear:gearFix(q.wear,gearFix(q.gear)),mxBest:clamp(q.mxBest|0,0,10),mxN:Math.max(0,q.mxN|0),mxTut:clamp(q.mxTut|0,0,2),nhBest:clamp(q.nhBest|0,0,10),pw:pwFix(q.pw)}));PF.cur=clamp(sv.cur|0,0,PF.list.length-1);}}catch(e){}
if(!PF.list.length){let old=null;try{old=JSON.parse(localStorage.getItem(ST_KEY)||'null');}catch(e){}PF.list=[{name:'Player 1',icon:PF_ICONS[0],st:pfFix(old),coins:null,owned:[],line:null,gear:[],wear:[],mxBest:0,mxN:0,mxTut:0,nhBest:0,pw:pwFix(null)}];}
ST=PF.list[PF.cur].st;
const owns=(q,em)=>DEF_LINE.includes(em)||q.owned.includes(em);
function lineFix(q){const L=q.line;if(!(Array.isArray(L)&&L.length===12&&new Set(L).size===12&&L.every(e=>owns(q,e))))q.line=DEF_LINE.slice();}
PF.list.forEach(lineFix);
function pfSave(){try{localStorage.setItem(PF_KEY,JSON.stringify(PF));}catch(e){}}
function pfPick(i){PF.cur=i;ST=PF.list[i].st;toastQ=[];toast=null;pfSave();}
// Names are typed on the game's own letter keys (no system pop-ups: those do not open everywhere).
function pfAdd(){if(PF.list.length<PF_MAX)nameEd={mode:'add',txt:'',t0:uiT};}
function pfRename(){const n=PF.list[PF.cur].name;nameEd={mode:'rename',txt:/^Player \d$/.test(n)?'':n.replace(/[^A-Za-z]/g,'').slice(0,10),t0:uiT};} // a default "Player 1" starts blank
function pfDelete(){if(PF.list.length>1)pfDel=uiT||.001;}
function pfType(ch){const e=nameEd;if(!e)return;if(ch==='<')e.txt=e.txt.slice(0,-1);else if(e.txt.length<10)e.txt+=e.txt.length?ch.toLowerCase():ch.toUpperCase();}
function pfNameDone(){const e=nameEd;if(!e||!e.txt)return;if(e.mode==='add'){const icon=PF_ICONS.find(c=>!PF.list.some(q=>q.icon===c))||PF_ICONS[0];PF.list.push({name:e.txt,icon,st:pfFix(null),coins:0,owned:[],line:DEF_LINE.slice(),gear:[],wear:[],mxBest:0,mxN:0,mxTut:0,nhBest:0,pw:pwFix(null)});pfPick(PF.list.length-1);pfToy=uiT||.001;}else{PF.list[PF.cur].name=e.txt;pfSave();}nameEd=null;}
function pfDeleteDone(){pfDel=0;if(PF.list.length<2)return;PF.list.splice(PF.cur,1);pfPick(Math.min(PF.cur,PF.list.length-1));}
window.addEventListener('keydown',ev=>{if(!nameEd)return;if(ev.key==='Backspace'){pfType('<');ev.preventDefault();}else if(ev.key==='Enter')pfNameDone();else if(/^[a-zA-Z]$/.test(ev.key))pfType(ev.key);});
function drawNameCard(){const e=nameEd,cw=336,ch=408,{cx,cy}=cardBegin(cw,ch,e.mode==='add'?'New Player':'Rename',uiT-e.t0);
 const fx=cx+28,fw=cw-56;rr(fx,cy+78,fw,48,8);fill(C.navy);rr(fx+3,cy+81,fw-6,42,6);fill('#fff');
 if(e.txt){X.font=fnt(900,25);const tw=X.measureText(e.txt).width;text(e.txt,W/2,cy+103,25,C.navy);if(Math.sin(NOW*7)>0&&e.txt.length<10){X.fillStyle=C.lava;X.fillRect(W/2+tw/2+3,cy+90,3,25);}}
 else{text('Tap The Letters',W/2,cy+103,15,'#9aa8c7',{w:800});}
 const key=(x,y,w,label,id,act)=>{const dn=press&&press.id===id,d=dn?3:0;rr(x,y+4,w,40,7);fill('#9db7e6');rr(x,y+d,w,40,7);fill(dn?'#cfe0fa':'#eef4fd');text(label,x+w/2,y+21+d,label.length>1?14:20,C.navy);hits.push({x:x-2,y:y-2,w:w+4,h:46,act,key:uiKey,id});};
 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((L,i)=>key(cx+16+(i%7)*44,cy+140+(i/7|0)*46,40,L,20+i,()=>pfType(L)));
 key(cx+16+5*44,cy+140+3*46,84,'Erase',50,()=>pfType('<'));
 const x0=W/2-(104+12+164)/2,yb=cy+ch-78;button(x0,yb,104,46,'Cancel',()=>{nameEd=null;},{size:16,id:7,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});
 button(x0+116,yb,164,46,'Save',pfNameDone,{size:20,col:e.txt?C.green:'#aab4cc',colD:e.txt?C.greenD:'#8793ad',colP:e.txt?'#27a83f':'#aab4cc'});cardEnd();}
function drawToyCard(){const q=PF.list[PF.cur],list=PF_TOYS.concat(q.owned),nc=list.length>30?6:list.length>20?5:4,pit=nc===6?49:nc===5?58:72,cs=pit-8,cw=320,ch=188+Math.ceil(list.length/nc)*pit,{cx,cy}=cardBegin(cw,ch,'Pick A Toy',uiT-pfToy);
 body('Tap a toy for '+q.name+'.',cy+84,13,'#4a6fc4');
 list.forEach((em,i)=>{const x=cx+(cw-nc*pit+8)/2+(i%nc)*pit,y=cy+102+(i/nc|0)*pit,cur=em===q.icon,id=60+i,dn=press&&press.id===id;if(cur){rr(x-3,y-3,cs+6,cs+6,10);fill(C.lava);}rr(x,y,cs,cs,8);fill(cur?'#fff3bf':dn?'#cfe0fa':'#eef4fd');
  X.save();X.translate(x+cs/2,y+cs/2+(cur?Math.sin(NOW*5)*2:0));paintToy(em,cs*.72);X.restore();hits.push({x:x-3,y:y-3,w:cs+6,h:cs+6,act:()=>{q.icon=em;pfSave();pfToy=0;},key:uiKey,id});});
 button((W-180)/2,cy+ch-70,180,46,'Back',()=>{pfToy=0;},{size:18,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});cardEnd();}
function drawDeleteCard(){const q=PF.list[PF.cur],cw=312,ch=262,{cx,cy}=cardBegin(cw,ch,'Delete Player?',uiT-pfDel);
 X.save();X.translate(W/2,cy+104);paintToy(q.icon,50);X.restore();body(q.name,cy+146,20);body('All of their badges will be gone.',cy+170,12.5,'#4a6fc4');
 const x0=W/2-(128+12+128)/2,yb=cy+ch-72;button(x0,yb,128,46,'Keep',()=>{pfDel=0;},{size:18});
 button(x0+140,yb,128,46,'Delete',pfDeleteDone,{size:18,id:8,col:C.lava,colD:'#a82a06',colP:'#e2580f'});cardEnd();}
const pfBadges=q=>BADGES.reduce((n,b)=>n+b.t.filter(v=>q.st[b.id]>=v).length,0);
// who is playing: a chip in the top left of the start screen; tap it to open the Players card
function drawChip(){const q=PF.list[PF.cur];X.font=fnt(900,14);const w=X.measureText(q.name).width+64,h=36,x=12,y=SAFE+10;rr(x,y+4,w,h,8);fill(C.deep);rr(x,y,w,h,8);fill('#fff');
 X.save();X.translate(x+20,y+h/2);paintToy(q.icon,26);X.restore();text(q.name,x+38,y+h/2+1,14,C.navy,{a:'left'});X.beginPath();X.moveTo(x+w-20,y+14);X.lineTo(x+w-9,y+14);X.lineTo(x+w-14.5,y+22);X.closePath();fill(C.lava);
 hits.push({x:x-4,y:y-4,w:w+8,h:h+12,act:()=>{pfOpen=true;pfT0=uiT;},key:uiKey,id:5});
 // coins: tap to open My Toys
 X.font=fnt(900,14);const c2=x+w+8,w2=X.measureText(''+q.coins).width+42;rr(c2,y+4,w2,h,8);fill(C.deep);rr(c2,y,w2,h,8);fill('#fff');coin(c2+17,y+h/2,9);text(''+q.coins,c2+31,y+h/2+1,14,C.navy,{a:'left'});
 hits.push({x:c2-2,y:y-4,w:w2+4,h:h+12,act:openToys,key:uiKey,id:16});}
function drawPlayers(){const age=uiT-pfT0,n=PF.list.length,cw=336,ch=232+n*56,{cx,cy}=cardBegin(cw,ch,'Players',age);
 body('Tap a player to pick who is playing.',cy+82,12.5,'#4a6fc4');
 PF.list.forEach((q,i)=>{const y=cy+124+i*56,cur=i===PF.cur,x=cx+16,w=cw-32;if(cur){rr(x-3,y-27,w+6,54,10);fill(C.lava);}rr(x,y-24,w,48,8);fill(cur?'#fff3bf':'#eef4fd');
  X.save();X.translate(x+28,y);paintToy(q.icon,36);X.restore();text(q.name,x+56,y-7,17,C.navy,{a:'left'});text(pfBadges(q)+' Of '+BADGES.length*3+' Badges',x+56,y+12,11.5,'#4a6fc4',{a:'left',w:800});if(cur)check(x+w-22,y);
  hits.push({x,y:y-26,w,h:52,act:()=>pfPick(i),key:uiKey,id:10+i});});
 const sm=[];if(n<PF_MAX)sm.push(['Add',60,pfAdd,6]);sm.push(['Rename',84,pfRename,7]);sm.push(['Toy',58,()=>{pfToy=uiT||.001;},9]);if(n>1)sm.push(['Delete',78,pfDelete,8]);
 let x=W/2-(sm.reduce((t,q)=>t+q[1],0)+(sm.length-1)*8)/2;const yb=cy+106+n*56;sm.forEach(q=>{button(x,yb,q[1],34,q[0],q[2],{size:13.5,id:q[3],col:q[3]===8?C.lava:'#5b7fd6',colD:q[3]===8?'#a82a06':'#34509c',colP:q[3]===8?'#e2580f':'#4a6cc0'});x+=q[1]+8;});
 button((W-214)/2,cy+ch-72,214,50,'Done',()=>{pfOpen=false;},{size:20});cardEnd();}
let streak=0,rdMiss=0,rdBlock=0,rdFirst=true,toast=null,toastQ=[]; // streak: scores in a row with no miss (carries across rounds)
// best: a personal-best badge (a record, not a running total). Its row shows the record and the goal instead of a fraction.
const BADGES=[
 {id:'newFirst',name:'New Toy First!',how:'Get the new toy in first',t:[1,5,10]},
 {id:'hair',name:'Hairball Hero',how:'Throw hairballs in',t:[10,20,50]},
 {id:'sneak',name:'Sneak Past Max',how:'Win a round, no Max blocks',t:[1,5,15]},
 {id:'bestStreak',name:'Never Miss',how:'Toys in a row, no misses',best:'Best streak',t:[10,20,40]},
 {id:'perfect',name:'Perfect Round',how:'Win a round, no misses',t:[1,10,30]},
 {id:'quick',name:'Beat The Clock',how:'Win with 15 seconds left',t:[1,10,30]},
 {id:'toys',name:'Volcano Feeder',how:'Toys in the volcano',t:[50,250,1000]},
 {id:'rounds',name:'Kaboom!',how:'Volcano explosions',t:[10,50,150]},
 {id:'rebounds',name:'Rebound Champ',how:'Score off a wall (Swipe)',t:[5,25,75]},
 {id:'hardRounds',name:'Hard Hat',how:'Win rounds in Hard',t:[5,25,75]},
 {id:'wins',name:'This Is The End!',how:'Finish all 10 rounds',t:[1,3,10]},
 {id:'bestScore',name:'Big Score',how:'Best score in one game',best:'Best game',t:[1000,3000,6000]},
 // MAX'S BADGES (v8.19): the same twelve ideas for the Max game. Only games against the computer count.
 {id:'mxNoPow',mx:1,name:'Bare Hands',how:'Win a round, no powers',t:[1,5,15]},
 {id:'mxHair',mx:1,name:'Hairball Stopper',how:'Block hairballs',t:[5,15,40]},
 {id:'mxDives',mx:1,name:'Big Dive',how:'Block right after a dive',t:[5,25,75]},
 {id:'mxBestStreak',mx:1,name:'Brick Wall',how:'Blocks in a row, none get in',best:'Best streak',t:[5,10,20]},
 {id:'mxShut',mx:1,name:'Shut Out',how:'Win a round, no toys get in',t:[1,10,30]},
 {id:'mxClose',mx:1,name:'Close Call',how:'Win with one toy to go',t:[1,10,30]},
 {id:'mxBlocks',mx:1,name:'Toy Stopper',how:'Toys blocked',t:[50,250,1000]},
 {id:'mxRounds',mx:1,name:'Bath Saver',how:'Rounds won as Max',t:[10,50,150]},
 {id:'mxPow',mx:1,name:'Power Player',how:'Powers used',t:[10,40,120]},
 {id:'mxLate',mx:1,name:'Tough Tub',how:'Win rounds 8, 9 and 10',t:[3,10,30]},
 {id:'mxWins',mx:1,name:'Bath Time Boss',how:'Finish all 10 rounds as Max',t:[1,3,10]},
 {id:'mxBestScore',mx:1,name:'Big Blocker',how:'Most blocks in one game',best:'Best game',t:[25,60,120]}];
// players saved before coins existed are paid for the badge levels they already hold
PF.list.forEach(q=>{if(q.coins==null)q.coins=BADGES.reduce((n,b)=>n+[0,20,60,140][b.t.filter(v=>q.st[b.id]>=v).length],0);});
function addCoins(n){const q=PF.list[PF.cur];q.coins=(q.coins||0)+n;pfSave();}
function coin(x,y,r){circ(x,y,r);fill(C.navy);circ(x,y,r*.84);fill(C.amber);circ(x,y,r*.62);fill(C.gold);}
const TIER=['','Bronze','Silver','Gold'],tierOf=b=>b.t.filter(v=>ST[b.id]>=v).length;
function statSet(id,v){if((duel&&!(id.startsWith('mx')&&solo(duel)&&duel.role==='max'))||v<=ST[id])return; // a match never touches the main game's stats and badges
 const b=BADGES.find(q=>q.id===id),t0=b?tierOf(b):0;ST[id]=v;if(b){const t1=tierOf(b);if(t1>t0){let c=0;for(let t=t0+1;t<=t1;t++)c+=COIN_BADGE[t];PF.list[PF.cur].coins+=c;toastQ.push({b,tier:t1,coins:c});}}pfSave();}
function stat(id){statSet(id,ST[id]+1);}
function statMax(id,v){statSet(id,v);}
const MEDAL=[['#c3cde3','#9aa8c7'],['#e09a5a','#a85f24'],['#dfe6f1','#8e9bb3'],['#ffd23f','#e08a00']];
// each badge has its own picture, drawn inside a medal whose rim shows the level (grey = not earned yet, then bronze, silver, gold)
function badgeIcon(id,z){X.lineCap='round';X.lineJoin='round';
 if(id==='mxWins')id='wins';else if(id==='mxClose')id='quick';else if(id==='mxLate')id='hardRounds';
 if(id==='toys')paintToy('🦆',z*2.2);
 else if(id==='mxBlocks'){sticker(()=>kidHead(0,z*.2,z*.7,C.hairM,'#a84f16',{mood:'gotcha',freckles:true,flip:true}),2);}
 else if(id==='mxRounds'){rr(-z*.95,-z*.1,z*1.9,z*.8,z*.3);fill('#fff');X.lineWidth=z*.16;X.strokeStyle=C.navy;X.stroke();X.fillStyle=C.water;X.fillRect(-z*.78,-z*.02,z*1.56,z*.22);for(const q of[[-.5,-.4,.22],[0,-.55,.28],[.5,-.4,.22]]){circ(q[0]*z,q[1]*z,q[2]*z);fill('#bfeaff');}}
 else if(id==='mxHair'){paintToy('🧶',z*1.9);X.strokeStyle=C.lava;X.lineWidth=z*.24;circ(0,0,z*.98);X.stroke();X.beginPath();X.moveTo(-z*.68,-z*.68);X.lineTo(z*.68,z*.68);X.stroke();}
 else if(id==='mxDives'){X.strokeStyle='#5bc0f0';X.lineWidth=z*.22;for(const q of[-.5,0,.5]){X.beginPath();X.moveTo(-z*.9,q*z);X.lineTo(-z*.2,q*z);X.stroke();}X.save();X.translate(z*.3,0);X.rotate(-.5);X.beginPath();X.ellipse(0,0,z*.62,z*.36,0,0,PI*2);fill(C.hairM);X.restore();}
 else if(id==='mxBestStreak'){for(let r=0;r<3;r++)for(let c=-1;c<2;c++){rr((c+(r%2?.5:0))*z*.72-z*.34,(r-1)*z*.5-z*.2,z*.64,z*.4,z*.06);fill(r%2?C.lava:C.lavaDk);}}
 else if(id==='mxShut'){circ(0,0,z);fill(C.navy);text('0',0,z*.08,z*1.5,'#fff');}
 else if(id==='mxNoPow'){for(const g of[-1,1]){circ(g*z*.45,0,z*.48);fill('#f7c59a');X.lineWidth=z*.12;X.strokeStyle='#a84f16';X.stroke();}}
 else if(id==='mxPow'){powIcon('splash',z*.95);}
 else if(id==='mxBestScore'){star(0,0,z*1.08,z*.5);fill(C.lava);star(0,0,z*.5,z*.24);fill('#fff');}
 else if(id==='hair')paintToy('🧶',z*2.1);
 else if(id==='sneak'){sticker(()=>kidHead(0,z*.2,z*.7,C.hairM,'#a84f16',{mood:'cheeky',freckles:true,flip:true}),2);}
 else if(id==='newFirst'){burstShape(z*1.15,z*.78,9,-.2);fill(C.lava);text('1st',0,z*.06,z*.86,'#fff');}
 else if(id==='bestStreak'){circ(0,0,z);fill(C.lava);circ(0,0,z*.7);fill('#fff');circ(0,0,z*.42);fill(C.lava);circ(0,0,z*.16);fill('#fff');}
 else if(id==='perfect'){circ(0,0,z);fill(C.green);X.strokeStyle='#fff';X.lineWidth=z*.3;X.beginPath();X.moveTo(-z*.48,z*.02);X.lineTo(-z*.12,z*.4);X.lineTo(z*.5,-z*.36);X.stroke();}
 else if(id==='quick'){circ(0,0,z);fill(C.navy);circ(0,0,z*.8);fill('#fff');X.strokeStyle=C.navy;X.lineWidth=z*.2;X.beginPath();X.moveTo(0,0);X.lineTo(0,-z*.48);X.stroke();X.strokeStyle=C.lava;X.beginPath();X.moveTo(0,0);X.lineTo(z*.42,z*.2);X.stroke();}
 else if(id==='rounds'){X.beginPath();X.moveTo(-z*1.05,z*.9);X.lineTo(-z*.36,-z*.3);X.lineTo(z*.36,-z*.3);X.lineTo(z*1.05,z*.9);X.closePath();fill('#7a4a2c');X.fillStyle=C.lava;X.fillRect(-z*.36,-z*.42,z*.72,z*.26);for(const q of[[-.5,-.85,.2],[0,-1.02,.24],[.5,-.85,.2]]){circ(q[0]*z,q[1]*z,q[2]*z);fill(C.hot);}}
 else if(id==='rebounds'){X.fillStyle=C.navy;X.fillRect(-z*1.02,-z,z*.26,z*2);X.strokeStyle=C.lava;X.lineWidth=z*.26;X.beginPath();X.moveTo(z*.9,z*.8);X.lineTo(-z*.6,0);X.lineTo(z*.5,-z*.62);X.stroke();X.beginPath();X.moveTo(z*.95,-z*.88);X.lineTo(z*.1,-z*.82);X.lineTo(z*.62,-z*.2);X.closePath();fill(C.lava);}
 else if(id==='hardRounds'){X.beginPath();X.arc(0,z*.2,z*.86,PI,0);X.closePath();fill(C.gold);X.fillStyle=C.amber;X.fillRect(-z*1.08,z*.2,z*2.16,z*.3);X.fillRect(-z*.14,-z*.72,z*.28,z*.92);}
 else if(id==='wins'){X.strokeStyle=C.amber;X.lineWidth=z*.2;for(const g of[-1,1]){X.beginPath();X.arc(g*z*.66,-z*.38,z*.34,g>0?-PI*.5:PI*.5,g>0?PI*.5:PI*1.5);X.stroke();}X.beginPath();X.moveTo(-z*.66,-z*.9);X.lineTo(z*.66,-z*.9);X.quadraticCurveTo(z*.66,z*.2,0,z*.36);X.quadraticCurveTo(-z*.66,z*.2,-z*.66,-z*.9);X.closePath();fill(C.gold);X.fillStyle=C.amber;X.fillRect(-z*.14,z*.3,z*.28,z*.36);X.fillStyle=C.lava;X.fillRect(-z*.52,z*.62,z*1.04,z*.3);}
 else{star(0,0,z*1.08,z*.5);fill(C.gold);star(0,0,z*.5,z*.24);fill('#fff');}}
function medal(x,y,r,tier,id){const m=MEDAL[tier];X.save();X.translate(x,y);
 if(tier)for(const g of[-1,1]){X.beginPath();X.moveTo(g*r*.1,-r*.4);X.lineTo(g*r*.85,-r*1.42);X.lineTo(g*r*.28,-r*1.42);X.lineTo(-g*r*.3,-r*.5);X.closePath();fill(g<0?C.lava:'#5b7fd6');}
 circ(0,0,r);fill(C.navy);circ(0,0,r*.88);fill(m[1]);circ(0,0,r*.76);fill(m[0]);circ(0,0,r*.66);fill('#fff');
 X.save();X.beginPath();X.arc(0,0,r*.66,0,PI*2);X.clip();badgeIcon(id,r*.46);X.restore();X.restore();}
function drawToast(){if(!toast){if(!toastQ.length||state==='menu')return;toast=toastQ.shift();toast.t0=NOW;sfxFanfare();}
 const a=NOW-toast.t0;if(a>2.8){toast=null;return;}
 const k=a<.3?EZ.back(a/.3):a>2.5?1-EZ.in((a-2.5)/.3):1,w=252,h=58,x=(W-w)/2,y=SAFE+88;
 X.save();X.translate(W/2,y+h/2);X.scale(k,k);X.rotate(-.015);X.translate(-W/2,-(y+h/2));rr(x,y+5,w,h,9);fill(C.deep);rr(x,y,w,h,9);fill('#fff');medal(x+34,y+h/2+3,20,toast.tier,toast.b.id);
 text(TIER[toast.tier]+' Badge!'+(toast.coins?'   +'+toast.coins+' Coins':''),x+64,y+19,12.5,C.lava,{a:'left'});text(toast.b.name,x+64,y+38,17,C.navy,{a:'left'});X.restore();}
function drawBadges(){const age=uiT-bdgT0,cw=336,ch=470,NB=BADGES.length/6,NP=NB+2,mxp=bdgPg<=NB?bdgPg>NB/2:bdgPg===NP,{cx,cy}=cardBegin(cw,ch,(mxp?'Max’s ':'Noah’s ')+(bdgPg<=NB?'Badges':'Stats'),age);
 text(bdgPg+' Of '+NP,cx+cw-20,cy+80,12,'#4a6fc4',{a:'right',w:800});if(bdgPg>NB)text(PF.list[PF.cur].name,cx+20,cy+80,12,'#4a6fc4',{a:'left',w:800});
 if(bdgPg<=NB){const got=BADGES.reduce((n,b)=>n+tierOf(b),0);text(PF.list[PF.cur].name+'  ·  '+got+' Of '+BADGES.length*3,cx+20,cy+80,12,'#4a6fc4',{a:'left',w:800});
  BADGES.slice((bdgPg-1)*6,bdgPg*6).forEach((b,i)=>{const y=cy+118+i*48,tr=tierOf(b),v=ST[b.id],nx=b.t[Math.min(tr,2)],lo=tr?b.t[tr-1]:0,f=tr>=3?1:clamp(v/nx,0,1),bx=cx+cw-86,bw=68;
   medal(cx+37,y+(tr?3:0),19,tr,b.id);text(b.name,cx+66,y-9,15.5,C.navy,{a:'left'});text(b.best?b.best+': '+v:b.how,cx+66,y+10,b.how.length>26?10.5:11.5,'#4a6fc4',{a:'left',w:800});
   text(tr>=3?'Gold!':b.best?'Goal: '+nx:Math.min(v,nx)+' / '+nx,bx+bw,y-9,12,tr>=3?C.amber:C.navy,{a:'right'});text(tr>=3?'Top Level':'Next: '+TIER[tr+1],bx+bw,y+21,9.5,MEDAL[Math.min(tr+1,3)][1],{a:'right'});X.fillStyle='#d3e2f8';X.fillRect(bx,y+5,bw,8);X.fillStyle=MEDAL[Math.min(tr+1,3)][1];X.fillRect(bx,y+5,bw*f,8);});}
 else{(mxp?[['Games Played',ST.mxGames],['Rounds Won',ST.mxRounds],['Toys Blocked',ST.mxBlocks],['Toys That Got In',ST.mxLet],['Hairballs Blocked',ST.mxHair],['Diving Blocks',ST.mxDives],['Powers Used',ST.mxPow],['Most Blocks In A Game',ST.mxBestScore],['Best Round',ST.mxBestRound],['Longest Block Streak',ST.mxBestStreak]]
   :[['Games Played',ST.games],['Rounds Won',ST.rounds],['Toys In The Volcano',ST.toys],['Misses',ST.misses],['Hairballs',ST.hair],['Blocked By Max',ST.blocks],['Best Score',ST.bestScore],['Best Round',ST.bestRound],['Longest No-Miss Streak',ST.bestStreak],['Best Combo',ST.bestCombo]]).forEach((r,i)=>{const y=cy+108+i*28;
   if(i%2===0){X.fillStyle='#eef4fd';X.fillRect(cx+12,y-14,cw-24,28);}text(r[0],cx+24,y+1,14.5,C.navy,{a:'left',w:800});text(''+r[1],cx+cw-24,y+1,16,C.lava,{a:'right'});});}
 const x0=W/2-(96+12+176)/2,yb=cy+ch-72,nxt=bdgPg===NB/2?'Max’s Badges':bdgPg<NB?'More Badges':bdgPg===NB?'Next: Stats':bdgPg<NP?'Max’s Stats':'Done';button(x0,yb,96,48,bdgPg===1?'Close':'Back',()=>{bdgPg--;},{size:16,id:7,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});
 button(x0+108,yb,176,48,nxt,()=>{bdgPg=bdgPg<NP?bdgPg+1:0;},{size:19});cardEnd();}
// ── MY TOYS (start screen): the player's 12-spot lineup, every toy in the game, and the shop ──
function openToys(){toysT0=uiT||.001;selSlot=-1;selToy=null;toyPg=0;}
function toyPlace(em,i){const q=PF.list[PF.cur],L=q.line,j=L.indexOf(em);if(j>=0)L[j]=L[i];L[i]=em;pfSave();selSlot=-1;selToy=null;}
function toyBuy(){const q=PF.list[PF.cur],em=selToy,pr=priceOf(em);if(!em||owns(q,em)||q.coins<pr)return;q.coins-=pr;q.owned.push(em);pfSave();sfxFanfare();
 {const rest=ALL_TOYS.filter(e=>!q.line.includes(e)),i=rest.filter(e=>owns(q,e)).indexOf(em);toyPg=i<0?0:Math.floor(i/8);}} // jump to the page the new toy is now on (owned toys are listed first, so normally page 1)
function drawMyToys(){const q=PF.list[PF.cur],cw=344,ch=502,{cx,cy}=cardBegin(cw,ch,'My Toys',uiT-toysT0),L=q.line;
 coin(cx+26,cy+80,9);text(q.coins+' Coins',cx+41,cy+81,15,C.navy,{a:'left'});text(q.name+'’s Lineup',cx+cw-18,cy+81,12,'#4a6fc4',{a:'right',w:800});
 // the 12 spots
 const sx=cx+(cw-6*52+4)/2;L.forEach((em,i)=>{const x=sx+(i%6)*52,y=cy+96+(i/6|0)*50,sel=i===selSlot,id=40+i;if(sel){rr(x-3,y-3,54,52,9);fill(C.lava);}rr(x,y,48,46,7);fill(sel?'#fff3bf':'#eef4fd');
  X.save();X.translate(x+24,y+18+(sel?Math.sin(NOW*6)*1.5:0));paintToy(em,30);X.restore();text(i<3?'Start':'Round '+(i-1),x+24,y+39,8,'#4a6fc4',{w:800});
  hits.push({x,y,w:48,h:46,act:()=>{if(selToy&&owns(q,selToy))toyPlace(selToy,i);else if(selSlot>=0&&selSlot!==i){const t=L[selSlot];L[selSlot]=L[i];L[i]=t;pfSave();selSlot=-1;}else{selSlot=selSlot===i?-1:i;selToy=null;}},key:uiKey,id});});
 text('The first 3 start the game. One more joins each round.',W/2,cy+203,10,'#4a6fc4',{w:800});
 // the pool: only the toys that are NOT in the lineup (always 8 while there are 20 toys). Owned ones come first, in colour; locked ones follow, grey with a price, cheapest first.
 const rest=ALL_TOYS.filter(e=>!L.includes(e)),all=rest.filter(e=>owns(q,e)).concat(rest.filter(e=>!owns(q,e))),pages=Math.max(1,Math.ceil(all.length/8)),gx=cx+(cw-4*78+4)/2;toyPg=clamp(toyPg,0,pages-1);
 const pool=all.slice(toyPg*8,toyPg*8+8);text('Other Toys'+(pages>1?'   '+(toyPg+1)+' Of '+pages:''),W/2,cy+223,12.5,C.navy);
 if(pages>1)[[-1,gx,20],[1,gx+4*78-4-40,21]].forEach(a=>{const on=a[0]<0?toyPg>0:toyPg<pages-1,x=a[1],y=cy+211,dn=press&&press.id===a[2];rr(x,y+2,40,22,6);fill(on?'#34509c':'#aab4cc');rr(x,y+(dn?2:0),40,22,6);fill(on?'#5b7fd6':'#c9d1e2');
   X.beginPath();X.moveTo(x+20+a[0]*7,y+11+(dn?2:0));X.lineTo(x+20-a[0]*5,y+4+(dn?2:0));X.lineTo(x+20-a[0]*5,y+18+(dn?2:0));X.closePath();fill('#fff');
   if(on)hits.push({x:x-8,y:y-8,w:56,h:34,act:()=>{toyPg+=a[0];},key:uiKey,id:a[2]});});
 pool.forEach((em,n)=>{const x=gx+(n%4)*78,y=cy+236+(n/4|0)*76,own=owns(q,em),sel=em===selToy,pr=priceOf(em),id=70+ALL_TOYS.indexOf(em);if(sel){rr(x-3,y-3,80,76,10);fill(C.lava);}rr(x,y,74,70,8);fill(sel?'#fff3bf':own?'#eef4fd':'#dfe3ec');
  X.save();X.translate(x+37,y+29+(sel?Math.sin(NOW*6)*1.5:0));paintToy(em,own?44:40,!own);X.restore();
  if(own)text(TOYNAME[em]||'',x+37,y+60,10,'#4a6fc4',{w:800});else{const t=''+pr;X.font=fnt(900,12);const tw=X.measureText(t).width;coin(x+37-tw/2-5,y+59,6);text(t,x+37-tw/2+5,y+59.5,12,q.coins>=pr?C.navy:'#7c879f',{a:'left'});}
  hits.push({x,y,w:74,h:70,act:()=>{if(owns(q,em)&&selSlot>=0)toyPlace(em,selSlot);else{selToy=selToy===em?null:em;if(!owns(q,em))selSlot=-1;}},key:uiKey,id});});
 const own=selToy&&owns(q,selToy),pr=selToy?priceOf(selToy):0,can=selToy&&!own&&q.coins>=pr,nm=selToy?TOYNAME[selToy]||'This Toy':'';
 body(selToy?(own?'Now tap a spot for '+nm+'.':can?'Buy '+nm+' for '+pr+' coins?':nm+': you need '+(pr-q.coins)+' more coins.'):selSlot>=0?'Now tap a toy, or another spot to swap.':'Tap a spot, then tap a toy.',cy+408,13.5);
 const x0=W/2-(80+8+92+8+124)/2,yb=cy+ch-70,B={col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'};
 button(x0,yb,80,46,'Close',()=>{toysT0=0;},{size:15,id:7,...B});
 button(x0+88,yb,92,46,'Default',()=>{q.line=DEF_LINE.slice();pfSave();selSlot=-1;selToy=null;},{size:15,id:19,col:'#8a5bd6',colD:'#5a359c',colP:'#7648c2'});
 button(x0+188,yb,124,46,'Buy',toyBuy,{size:19,col:can?C.green:'#aab4cc',colD:can?C.greenD:'#8793ad',colP:can?'#27a83f':'#aab4cc'});cardEnd();}
// ── DRESS NOAH (start screen): buy gear with coins and choose what Noah wears in the game ──
function openMulti(){mpPg=0;mpT0=uiT||.001;mpStage=clamp((PF.list[PF.cur].mxBest||0)+1,1,10);} // opens on the next stage this player has not beaten
function openNoah(){noahT0=uiT||.001;selGear=null;gearPg=0;}
function gearTap(k){const q=PF.list[PF.cur];if(q.gear.includes(k)){const i=q.wear.indexOf(k);if(i>=0)q.wear.splice(i,1);else gearOn(q,k);selGear=null;pfSave();sfxTick();}else selGear=selGear===k?null:k;}
function gearBuy(){const q=PF.list[PF.cur],g=GEAR.find(z=>z[0]===selGear);if(!g||q.gear.includes(g[0])||q.coins<g[1])return;q.coins-=g[1];q.gear.push(g[0]);gearOn(q,g[0]);selGear=null;pfSave();sfxFanfare();} // a new piece goes straight on
function noahBust(x,y,z,wear,mood){const r=27*z;sticker(()=>{rr(x-25*z,y+9*z,50*z,92*z,22*z);shp(C.skin);if(PASS){ell(x,y+15*z,15*z,7*z);fill(C.skinD);}
  for(const sg of[-1,1]){const q=[[x+18*sg*z,y+26*z],[x+35*sg*z,y+45*z],[x+41*sg*z,y+30*z+Math.sin(NOW*2.4+sg)*2.5*z]];lin(q,12*z,C.skin);if(wear.includes('floaties'))floatie(q[0],q[1],z);circ(q[2][0],q[2][1]-z,9.5*z);shp(C.skin);if(sg<0&&wear.includes('finger')){X.save();X.translate(q[2][0],q[2][1]-z);X.scale(z,z);foamFinger(0,0,sg);X.restore();}}
  kidHead(x,y,r,C.hairN,'#2b1a12',{mood:mood||'happy',look:[0,0],blink:noah.blink>0,wear});if(wear.includes('bow'))bowTie(x,y+34*z,z);if(wear.includes('lei'))lei(x,y+33*z,z);},3.2*z);}
function gearIcon(k,z){if(k==='lei')sticker(()=>lei(0,z*.1,z/17),2);else if(k==='bow')sticker(()=>bowTie(0,z*.2,z/13),2);else if(k==='floaties')sticker(()=>{floatie([-z*1.1,z*.9],[z*.9,-z*.55],z/15);},2);else if(k==='finger'){X.save();X.translate(0,z*.62);X.scale(z/26,z/26);sticker(()=>foamFinger(0,0,-1),2.4);X.restore();}else{const tall=k==='crown'||k==='duck';sticker(()=>kidHead(0,z*(tall?.5:.3),z*(tall?.54:.62),C.hairN,'#2b1a12',{mood:'happy',wear:[k]}),2);}}
function drawNoah(){const q=PF.list[PF.cur],cw=336,ch=566,{cx,cy}=cardBegin(cw,ch,'Dress Noah',uiT-noahT0);
 coin(cx+26,cy+80,9);text(q.coins+' Coins',cx+41,cy+81,15,C.navy,{a:'left'});const pages=Math.ceil(GEAR.length/8);gearPg=clamp(gearPg,0,pages-1);
 if(pages>1){text((gearPg+1)+' Of '+pages,cx+cw-88,cy+81,12.5,C.navy);[[-1,cx+cw-160,20],[1,cx+cw-58,21]].forEach(a=>{const on=a[0]<0?gearPg>0:gearPg<pages-1,x=a[1],y=cy+70,dn=press&&press.id===a[2];rr(x,y+2,40,22,6);fill(on?'#34509c':'#aab4cc');rr(x,y+(dn?2:0),40,22,6);fill(on?'#5b7fd6':'#c9d1e2');
   X.beginPath();X.moveTo(x+20+a[0]*7,y+11+(dn?2:0));X.lineTo(x+20-a[0]*5,y+4+(dn?2:0));X.lineTo(x+20-a[0]*5,y+18+(dn?2:0));X.closePath();fill('#fff');
   if(on)hits.push({x:x-8,y:y-8,w:56,h:34,act:()=>{gearPg+=a[0];selGear=null;},key:uiKey,id:a[2]});});}
 // Noah in the tub, wearing what is switched on
 const pw=cw-40,ph=150,x0=cx+20,y0=cy+96;X.save();rr(x0,y0,pw,ph,8);X.clip();X.fillStyle=C.wall;X.fillRect(x0,y0,pw,ph);X.strokeStyle=C.tile;X.lineWidth=2.5;X.beginPath();for(let x=x0+20;x<x0+pw;x+=38){X.moveTo(x,y0);X.lineTo(x,y0+ph);}for(let y=y0+14;y<y0+ph;y+=38){X.moveTo(x0,y);X.lineTo(x0+pw,y);}X.stroke();
 noahBust(W/2,y0+74+Math.sin(NOW*2.2)*.8,1.1,q.wear);X.fillStyle=C.water;X.fillRect(x0,y0+ph-22,pw,22);X.fillStyle='#fff';X.fillRect(x0,y0+ph-24,pw,3);X.restore();
 // the pieces: owned ones switch on and off with a tap (tick = on); locked ones show a price
 const gx=cx+(cw-4*78+4)/2;GEAR.slice(gearPg*8,gearPg*8+8).forEach((g,n)=>{const k=g[0],x=gx+(n%4)*78,y=cy+258+(n/4|0)*92,own=q.gear.includes(k),on=q.wear.includes(k),sel=k===selGear,id=30+gearPg*8+n;if(sel||on){rr(x-3,y-3,80,90,10);fill(sel?C.lava:C.green);}rr(x,y,74,84,8);fill(sel||on?'#fff3bf':own?'#eef4fd':'#dfe3ec');
  X.save();X.translate(x+37,y+27+(sel?Math.sin(NOW*6)*1.5:0));gearIcon(k,22);X.restore();text(g[2],x+37,y+61,g[2].length>9?9:10,C.navy,{w:800});
  if(own)text(on?'On':'Off',x+37,y+73,10,on?C.greenD:'#7c879f');else{const t=''+g[1];X.font=fnt(900,12);const tw=X.measureText(t).width;coin(x+37-tw/2-5,y+72.5,6);text(t,x+37-tw/2+5,y+73,12,q.coins>=g[1]?C.navy:'#7c879f',{a:'left'});}
  if(on)check(x+64,y+10);hits.push({x,y,w:74,h:84,act:()=>gearTap(k),key:uiKey,id});});
 const g=GEAR.find(z=>z[0]===selGear),can=g&&q.coins>=g[1];
 body(g?(can?'Buy the '+g[2]+' for '+g[1]+' coins?':g[2]+': you need '+(g[1]-q.coins)+' more coins.'):q.gear.length?'Tap a piece to put it on or take it off.':'Tap a piece to buy it for Noah.',cy+464,13.5);
 const xb=W/2-(104+12+164)/2,yb=cy+ch-70;button(xb,yb,104,46,'Close',()=>{noahT0=0;},{size:16,id:7,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});
 button(xb+116,yb,164,46,'Buy',gearBuy,{size:19,col:can?C.green:'#aab4cc',colD:can?C.greenD:'#8793ad',colP:can?'#27a83f':'#aab4cc'});cardEnd();}
// ── HOW TO PLAY (start screen) ── five pages. The Game (toys, clock, Max, hairball); Two Ways To Play (Push or Swipe is a choice, plus Easy or Hard); Way 1: Push and Way 2: Swipe (a small looping demo and three short steps each); Coins And Toys.
const HOWTO=[null,
 {name:'The Game',rows:[['toy','The Toys','Throw them all into the volcano.'],['clock','The Clock','Get them in before time runs out.'],['max','Max','He pops up and blocks your throw.'],['hair','The Hairball','Throw it in for 5 more seconds.']],note:'A new toy joins every round.',next:'Next: 2 Ways'},
 {name:'Two Ways To Play',rows:[['push','Push','Press and hold a toy, then let go.'],['swipe','Swipe','Flick a toy up at the volcano.'],['mode','Easy Or Hard','Hard hides the green dots.']],note:'You choose on the start screen. Try both!',next:'Next: Push'},
 {name:'Way 1: Push',steps:['Press a toy and hold.','Let go when the dots turn green.','It flies into the volcano!'],note:'Hard: the dots never turn green.',next:'Next: Swipe'},
 {name:'Way 2: Swipe',steps:['Put your finger on a toy.','Swipe up at the volcano.','Bigger swipe, bigger throw!'],note:'Bounce it off a wall for double points.',next:'Next: Coins'},
 {name:'Coins And Toys',rows:[['coin','Coins','Win rounds and badges to earn coins.'],['shop','New Toys','Buy new toys with your coins.'],['line','Your Lineup','Pick the 12 toys you play with.'],['noah','Dress Noah','Buy him a hat, goggles and more.']],note:'Tap My Toys or Noah on the start screen.',next:'Got It!'}];
function drawHowTo(){const pg=HOWTO[howTo],age=uiT-howT0,cw=324,ch=428,{cx,cy}=cardBegin(cw,ch,'How To Play',age);
 text(pg.name,W/2-(pg.name.length>13?14:0),cy+84,pg.name.length>13?19:23,C.navy);text(howTo+' Of '+(HOWTO.length-1),cx+cw-20,cy+84,12,'#4a6fc4',{a:'right',w:800});
 if(pg.rows){pg.rows.forEach((r,i)=>{const y=cy+122+i*54,ix=cx+46,k=EZ.back((age-.15-i*.08)/.3);if(k<=0)return;X.save();X.translate(ix,y);X.scale(k,k);
   if(r[0]==='toy'){X.rotate(Math.sin(NOW*2)*.12);paintToy('🦆',40);}
   else if(r[0]==='hair'){X.rotate(Math.sin(NOW*2+2)*.12);paintToy('🧶',38);}
   else if(r[0]==='clock'){circ(0,0,19);fill(C.navy);circ(0,0,15.5);fill('#fff');X.strokeStyle=C.navy;X.lineCap='round';X.lineWidth=3.4;X.beginPath();X.moveTo(0,0);X.lineTo(0,-7);X.stroke();X.strokeStyle=C.lava;X.lineWidth=3;const a=NOW*2.2-PI/2;X.beginPath();X.moveTo(0,0);X.lineTo(Math.cos(a)*11,Math.sin(a)*11);X.stroke();circ(0,0,2.6);fill(C.navy);}
   else if(r[0]==='push'){circ(0,0,18);fill(C.navy);circ(0,0,15);fill('#fff');circ(0,0,6.5+Math.sin(NOW*6)*2);fill(C.lava);}
   else if(r[0]==='swipe'){const dy=-((NOW*1.4)%1)*8;X.translate(0,dy+4);X.lineCap='round';X.strokeStyle=C.lava;X.lineWidth=7;X.beginPath();X.moveTo(0,14);X.lineTo(0,-4);X.stroke();X.beginPath();X.moveTo(-11,-3);X.lineTo(0,-18);X.lineTo(11,-3);X.closePath();fill(C.lava);}
   else if(r[0]==='mode'){rr(-17,-18,34,15,4);fill(C.green);rr(-17,3,34,15,4);fill(C.lava);}
   else if(r[0]==='coin'){X.translate(0,Math.sin(NOW*3)*2);coin(0,0,17);star(0,0,7.5,3.4);fill('#fff');}
   else if(r[0]==='shop'){X.rotate(Math.sin(NOW*2)*.12);paintToy('whale',42);}
   else if(r[0]==='line'){[['🦆',-13,3],['robot',0,-5],['🚀',13,3]].forEach(q=>{X.save();X.translate(q[1],q[2]);paintToy(q[0],24);X.restore();});}
   else if(r[0]==='noah'){X.translate(0,6);sticker(()=>kidHead(0,0,14,C.hairN,'#2b1a12',{mood:'happy',wear:['hat','goggles']}));}
   else{X.translate(0,4);sticker(()=>kidHead(0,0,15,C.hairM,'#a84f16',{mood:'cheeky',freckles:true,flip:true}));}
   X.restore();text(r[1],cx+82,y-9,16.5,C.navy,{a:'left'});text(r[2],cx+82,y+11,12.5,'#4a6fc4',{a:'left',w:800});});
  body(pg.note,cy+336,12.5,C.lavaDk);
  {const x0=W/2-(96+12+176)/2,yb=cy+ch-74;button(x0,yb,96,48,howTo===1?'Close':'Back',()=>{howTo--;},{size:16,id:7,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});button(x0+108,yb,176,48,pg.next,()=>{howTo=howTo<HOWTO.length-1?howTo+1:0;},{size:19});}cardEnd();return;}
 // demo panel: a toy, the volcano, a finger, and the dotted throw line
 const pw=272,ph=124,x0=(W-pw)/2,y0=cy+102,tx=x0+54,ty=y0+94,vx=x0+196,vy=y0+44,t=(NOW%3.4)/3.4;
 X.save();rr(x0,y0,pw,ph,8);X.clip();X.fillStyle=C.wall;X.fillRect(x0,y0,pw,ph);
 X.beginPath();X.moveTo(vx-58,y0+ph);X.lineTo(vx-20,vy);X.lineTo(vx+20,vy);X.lineTo(vx+58,y0+ph);X.closePath();fill('#7a4a2c');X.fillStyle=C.lava;X.fillRect(vx-20,vy-4,40,9);
 X.fillStyle=C.water;X.fillRect(x0,y0+ph-22,pw,22);X.fillStyle='#fff';X.fillRect(x0,y0+ph-24,pw,3);
 const arc=u=>[tx+(vx-tx)*u,ty+(vy-ty)*u-150*u*(1-u)],N=13,swipe=howTo===4;
 let grow,fly,fx=tx,fy=ty,finger=true; // grow: how much of the line shows; fly: toy along the line
 if(swipe){const m=clamp((t-.12)/.3,0,1);grow=t<.5?m:0;fly=clamp((t-.5)/.3,0,1);fx=tx+42*EZ.out(m);fy=ty-58*EZ.out(m);finger=t<.5;}
 else{grow=t<.55?clamp(t/.42,0,1):0;fly=clamp((t-.55)/.3,0,1);finger=t<.55;}
 const green=grow>=1;
 for(let i=1;i<=N;i++){if(i/N>grow)break;const q=arc(i/(N+1));circ(q[0],q[1],5.2);fill(C.navy);circ(q[0],q[1],3.6);fill(green?C.go:'#fff');}
 if(swipe&&finger&&grow>0){X.lineCap='round';X.beginPath();X.moveTo(tx,ty);X.lineTo(fx,fy);X.strokeStyle=C.navy;X.lineWidth=8;X.stroke();X.strokeStyle='#fff';X.lineWidth=4;X.stroke();}
 if(fly<1){const q=fly>0?arc(fly):[tx,ty];X.save();X.translate(q[0],q[1]);X.rotate(fly*5);paintToy('🦆',34);X.restore();}
 else{const k=EZ.back((t-.8)/.1);X.save();X.translate(vx,vy-6);X.scale(k,k);burstShape(34,22,10,NOW);fill(C.navy);burstShape(29,18,10,NOW);fill(C.hot);X.restore();}
 if(finger){const pr=swipe?0:Math.sin(NOW*9)*1.2;circ(fx+9,fy+10,13+pr);fill(C.navy);circ(fx+9,fy+10,10+pr);fill('#fff');}
 X.restore();
 if(finger&&green)bubble('Let Go!',tx+30,y0+20,C.go,'#fff');
 pg.steps.forEach((st,i)=>{const y=cy+252+i*27;circ(cx+34,y,11);fill(C.lava);text(''+(i+1),cx+34,y+1,14,'#fff');text(st,cx+54,y+1,15,C.navy,{a:'left',w:800});});
 body(pg.note,cy+336,12.5,'#4a6fc4');
 const qx=W/2-(96+12+176)/2,yb=cy+ch-74;button(qx,yb,96,48,'Back',()=>{howTo--;},{size:16,id:7,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});button(qx+108,yb,176,48,pg.next,()=>{howTo++;},{size:19});cardEnd();}
// ── MULTIPLAYER CARDS ──
function tuneSave(){if(TEST)try{localStorage.setItem('evitb-test-tune-v84',JSON.stringify(TUNE));}catch(e){}}
if(TEST)try{const t=JSON.parse(localStorage.getItem('evitb-test-tune-v84')||'null');if(t)for(const k in TUNE0)if(typeof t[k]==='number')TUNE[k]=t[k];}catch(e){}
function nudgeBtn(x,y,t,act,id,on){const dn=press&&press.id===id,d=dn?2:0;rr(x,y+3,34,28,7);fill(on?'#34509c':'#aab4cc');rr(x,y+d,34,28,7);fill(on?(dn?'#4a6cc0':'#5b7fd6'):'#c9d1e2');text(t,x+17,y+14.5+d,19,'#fff');if(on)hits.push({x:x-4,y:y-4,w:42,h:38,act,key:uiKey,id});}
const TUNE_ROWS=[['spd','Max Speed',.1,.5,7,v=>v.toFixed(1)],['reach','Max Reach',1,14,60,v=>''+v],['tire','Tire Per Block',.05,0,1,v=>Math.round(v*100)+'%'],['rest','Rest To Full',1,1,30,v=>v+' s'],['clock','Clock',.1,.3,3,v=>'x '+v.toFixed(1)]];
// ── TWO DEVICES (v8.12: finding the other player; the match itself is not built yet) ──
// Multiplayer against a person: you pick Max or Noah and are paired with someone who has the other side, either a
// friend (Start A Game shows a four-letter code, Join A Game types it) or anyone (Quick Match). The devices talk
// through the relay (relay/), which passes messages and keeps nothing. Codes are consonants only, so no code spells
// a word. In Quick Match the other player's name is never shown or sent: only their toy.
// net = null when not connecting. how: 'start' | 'join' | 'quick'. st: 'side' (choosing a side), 'code' (typing a
// code), 'waiting' (code shown, nobody yet), 'joining', 'looking' (Quick Match), 'paired', 'error'.
const RELAY=window.RELAY_URL||'wss://exploding-volcanoes-relay.dnachimow.workers.dev',CODE_AB='BCDFGHJKLMNPQRSTVWXZ';
let net=null;
function netCode(){let c='';for(let i=0;i<4;i++)c+=CODE_AB[~~(Math.random()*CODE_AB.length)];return c;}
function netClose(){const N=net;net=null;if(N&&N.ws){try{N.ws.close();}catch(e){}}}
function netFail(N,msg){if(net!==N)return;N.st='error';N.err=msg;try{N.ws&&N.ws.close();}catch(e){}N.ws=null;}
function netSend(o){if(net&&net.ws&&net.ws.readyState===1)try{net.ws.send(JSON.stringify(o));}catch(e){}}
function netRoom(code,role){const N=net,q=PF.list[PF.cur];N.code=code;N.role=role;N.st=role==='host'?'waiting':'joining';N.no=0;N.t0=uiT;let ws;try{ws=new WebSocket(RELAY+'/room/'+code+'?role='+role);}catch(e){netFail(N,'Could not connect.');return;}N.ws=ws;
 ws.onmessage=ev=>{if(net!==N||N.ws!==ws)return;let m;try{m=JSON.parse(ev.data);}catch(e){return;}if(!m||typeof m!=='object')return;
  if(m._==='no')N.no=m.code;
  else if(m._==='room'){if(m.n<2&&duel&&duel.net)netDrop();if(m.n>=2)netSend({t:'hi',name:N.how==='quick'?'':q.name,icon:q.icon,side:N.side,v:VERSION});else if(N.st==='paired'){N.peer=null;if(role==='host'){N.st='waiting';N.note='The other player left.';}else netFail(N,'The other player left.');}}
  else if(m.t==='hi'){if(N.st==='paired')return;N.stage=N.stage||clamp((q.mxBest||0)+1,1,10);N.peer={name:N.how==='quick'?'':String(m.name||'').replace(/[^A-Za-z]/g,'').slice(0,10),icon:ALL_TOYS.includes(m.icon)?m.icon:'🦆',v:String(m.v||'')};if(role==='join')N.side=m.side==='max'?'noah':'max';N.st='paired';N.note='';N.t0=uiT;sfxFanfare();if(role==='host')netSend({t:'cfg',stage:N.stage,side:N.side});} // the one who started the game keeps the side they chose; the one who joined takes the other
  else if(m.t==='wave'){N.wave=NOW;sfxScore();}
  else netMsg(N,m);};
 ws.onclose=ev=>{if(net!==N||N.ws!==ws)return;const c=N.no||ev.code;if(duel&&duel.net){netDrop();if(net!==N)return;}
  if(c===4009&&role==='host'){netRoom(netCode(),'host');return;} // that code is in use: take another
  if(c===4004&&N.how==='quick'&&(N.tries=(N.tries||0)+1)<10){setTimeout(()=>{if(net===N&&N.ws===ws)netRoom(code,'join');},400);return;} // matched, but the other device has not opened the room yet
  netFail(N,c===4004?'No game with that code.':c===4003?'That game is full.':N.st==='paired'?'The connection was lost.':'Could not connect. Check the internet.');};
 ws.onerror=()=>{};}
function netQuick(){const N=net;N.st='looking';N.t0=uiT;let ws;try{ws=new WebSocket(RELAY+'/match?side='+N.side);}catch(e){netFail(N,'Could not connect.');return;}N.ws=ws;
 ws.onmessage=ev=>{if(net!==N||N.ws!==ws)return;let m;try{m=JSON.parse(ev.data);}catch(e){return;}if(m&&m._==='match'&&/^[A-Z]{4}$/.test(m.code||'')){N.ws=null;try{ws.close();}catch(e){}netRoom(m.code,m.role==='host'?'host':'join');}};
 ws.onclose=()=>{if(net===N&&N.ws===ws)netFail(N,'Could not connect. Check the internet.');};ws.onerror=()=>{};}
// A MATCH BETWEEN TWO DEVICES (v8.13).
// Each device runs the game and each is in charge of its own boy, so nobody waits on the network to see their own
// move. Noah's device ('N') owns the toys, the clock and every score; Max's device ('M') owns where Max is, his
// energy, his powers and every block. They tell each other:
//   N -> M   s  about 15 times a second: clock, toys in, every toy [id,x,y,state,vx,hairball,life], the wind-up
//            L  a throw has left Noah's hand (M then flies that toy itself, so it can judge the block at once)
//            S  a toy went in       end  the clock ran out
//   M -> N   m  20 times a second: where Max is, his energy, his power timers
//            B  Max blocked toy i (c: caught in the Bucket, j: with the Squirt Blaster)      P  a power was used
// A block reaches Noah's device a moment late and is applied to the toy where it is by then. If it arrives after the
// toy has already gone in, the score stands. Before the match: cfg (stage, sides), start, setup (seed, Noah's toys and
// outfit), rdy from each, then go. If the other device goes, the computer takes over that boy (netDrop).
const byId=id=>objs.find(o=>o.id===id);
function netBegin(){const N=net,q=PF.list[PF.cur];if(!N||N.st!=='paired')return;N.st='starting';N.t0=uiT;if(N.side==='noah'){const su={t:'setup',stage:N.stage,seed:(Math.random()*2147483647)|0,toys:q.line.slice(),wear:q.wear.slice()};netSend(su);netSetup(su);}}
function netSetup(m){const N=net;if(!N||!Array.isArray(m.toys))return;N.stage=clamp(m.stage|0,1,10);N.st='playing';startDuel(N.stage,N.side,false,{net:N.side==='noah'?'N':'M',seed:m.seed|0,toys:m.toys.map(String),wear:Array.isArray(m.wear)?m.wear:[]});}
function netMaybeGo(){const D=duel;if(D&&D.net==='N'&&D.ready&&D.peerReady&&state==='duelwait'){netSend({t:'go'});duelStart();}}
function netDrop(){const D=duel,N=net;if(!D||!D.net)return; // the other device has gone
 if(state==='play'){D.wasNet=true;D.net=null;if(D.max==='net')D.max='cpu';if(D.noah==='net'){D.noah='cpu';swipeMode=false;charging=null;pendingLaunch=null;swingT=0;} // the computer Noah only knows the Push throw: left in Swipe he wound up for ever (v8.17)
  banner='They Left. The Computer Took Over.';bannerT=3.5;net=null;if(N&&N.ws){try{N.ws.close();}catch(e){}}}
 else if(state==='duelend'||state==='erupt'){D.wasNet=true;D.net=null;net=null;if(N&&N.ws){try{N.ws.close();}catch(e){}}}
 else{goMenu(true);if(net===N&&N){netFail(N,'The other player left.');}else net={how:'start',st:'error',err:'The other player left.',t0:uiT};mpPg=2;mpT0=uiT||.001;}}
function netMsg(N,m){const D=duel,q=PF.list[PF.cur];if(D)D.rxT=performance.now();
 if(m.t==='cfg'){if(N.role==='join'&&N.st==='paired'){N.stage=clamp(m.stage|0,1,10);N.side=m.side==='max'?'noah':'max';}return;}
 if(m.t==='start'){if(N.role==='join')netBegin();return;}
 if(m.t==='again'){if(D&&(state==='duelend'||state==='duelwait'||state==='duelbag'||state==='duelintro')){goMenu(true);mpPg=2;mpT0=uiT||.001;N.st='paired';N.t0=uiT;}return;}
 if(m.t==='setup'){if(N.side==='max'&&(N.st==='starting'||N.st==='paired'||N.st==='playing'))netSetup(m);return;}
 if(!D||!D.net)return;const mx=D.mx;
 if(m.t==='rdy'){D.peerReady=true;if(D.net==='M')swipeMode=!!m.sw;netMaybeGo();return;}
 if(m.t==='go'){if(D.net==='M'&&state==='duelwait')duelStart();return;}
 if(D.net==='M'){ // from Noah's device
  if(state!=='play')return;
  if(m.t==='s'&&Array.isArray(m.o)){timeLeft=+m.tl||0;swipeMode=!!m.sw;const seen={};
   for(const a of m.o){const id=a[0],st=a[3];seen[id]=1;let o=byId(id);if(!o){if(!a[5]||st===2)continue;o={id,hb:true,x:a[1],y:a[2],vx:a[4],vy:0,bob:0,st:'float',sq:0,life:a[6],r:16};objs.push(o);}
    if(st===0){if(o.st!=='float'){o.st='float';o.vy=0;o.blocked=0;o.x=a[1];o.y=a[2];if(mx.held&&mx.held.o===o)mx.held=null;}else{o.x+=(a[1]-o.x)*.4;o.y+=(a[2]-o.y)*.4;}o.vx=a[4];if(o.hb)o.life=a[6];}
    else if(st===1){if(o.st==='float'||o.st==='held'){o.st='fly';o.x=a[1];o.y=a[2];o.vx=a[4];o.vy=-6;o.blocked=0;}}
    else if(st===3){if(o.st!=='held'){o.st='held';if(!mx.held||mx.held.o!==o)mx.held={o,t:BUCKET_T};}}
    else if(o.st!=='gone'){o.st='gone';}}
   objs=objs.filter(o=>!o.hb||seen[o.id]);collected=m.c|0;
   if(m.ch){const o=byId(m.ch[0]);if(o&&o.st==='float'){if(!charging||charging.o!==o)splashSide=o.x<CX?-1:1;charging={o,c:+m.ch[1]||.3,tc:+m.ch[1]||.3,steer:+m.ch[2]||0,ts:+m.ch[2]||0,sx:o.x,sy:o.y,fx:o.x,fy:o.y,lx:o.x,ly:o.y,lt:0,peak:0,len:99,cpu:true};}}else if(charging)charging=null;}
  else if(m.t==='L'){let o=byId(m.i);if(!o&&m.dc&&ALL_TOYS.includes(m.em)){o={id:m.i,dc:true,em:m.em,hb:false,bob:0};objs.push(o);}if(o){o.fast=m.f?2:0;o.x=+m.x;o.y=+m.y;o.st='fly';o.vx=+m.vx;o.vy=+m.vy;o.drift=+m.dr||0;o.blocked=0;o.bn=0;o.rot=0;o.sq=1;charging=null;swingT=swingDur*.55;swingHit=true;shake=3;mood(noah,'throw',.45);const hp=handPos();waterBurst(hp.x,hp.y,true);waterBurst(o.x,o.y,true);sfxSplash();}}
  else if(m.t==='S'){const o=byId(m.i);if(o&&o.st!=='gone'){if(mx.held&&mx.held.o===o)mx.held=null;o.blocked=0;scoreToy(o);}}
  else if(m.t==='end'){if(m.w==='max')duelEnd('max');}}
 else{ // from Max's device
  if(m.t==='m'){D.rx=clamp(+m.x||CX,MAX_L,MAX_R);mx.e=clamp(+m.e||0,0,1);if(Array.isArray(m.tm)){mx.noodle=+m.tm[0]||0;mx.flip=+m.tm[1]||0;mx.bucket=+m.tm[2]||0;mx.juice=+m.tm[3]||0;}}
  else if(state!=='play')return;
  else if(m.t==='B'){const o=byId(m.i);if(o&&o.st==='fly'&&!o.blocked){mx.bucket=m.c&&!mx.held?1:0;maxBlock(o,true,!!m.j);}} // a late block on a toy that already went in is ignored: the score stands
  else if(m.t==='P'&&POWNAME[m.k])powFx(m.k,m.d<0?-1:1);}}
// copy text to the phone's clipboard. Must run inside a tap (see now:true). Tries the modern way, then the old one.
function copyText(t,done){let ok=false;try{const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;font-size:16px';document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,t.length);ok=document.execCommand('copy');document.body.removeChild(ta);}catch(e){}
 if(ok){done(true);return;}try{navigator.clipboard.writeText(t).then(()=>done(true),()=>done(false));}catch(e){done(false);}}
// INVITE LINK (v8.15): the easiest way to get a friend in. Send It opens the phone's own share sheet (Messages,
// WhatsApp, ...) with a short message and a link that carries the code; opening that link starts the game and joins
// straight away, with nothing to type. Where there is no share sheet the message is copied instead.
let JOIN=(()=>{try{const c=(new URLSearchParams(location.search).get('join')||'').toUpperCase();return /^[BCDFGHJKLMNPQRSTVWXZ]{4}$/.test(c)?c:null;}catch(e){return null;}})();
const inviteUrl=c=>(/^https?:/.test(location.protocol)?location.origin+location.pathname:'https://dnachimow-evitb.github.io/exploding-volcanos/')+'?join='+c;
const inviteText=c=>'Play Exploding Volcanoes with me! Tap to join my game (code '+c+'):';
function sendInvite(N){const c=N.code,done=ok=>{N.copied=ok?NOW:-NOW;N.sent=0;};try{if(navigator.share){navigator.share({text:inviteText(c),url:inviteUrl(c)}).then(()=>{N.sent=NOW;},()=>{});return;}}catch(e){}copyText(inviteText(c)+' '+inviteUrl(c),done);}
function joinFromLink(){const c=JOIN;JOIN=null;try{history.replaceState(null,'',location.pathname);}catch(e){}openMulti();mpPg=2;netGo('join');net.txt=c;netRoom(c,'join');}
function netGo(how){net={how,side:null,st:how==='join'?'code':'side',txt:'',ws:null,peer:null,err:'',note:'',t0:uiT};}
function netSide(sd){const N=net;N.side=sd;if(N.how==='start')netRoom(netCode(),'host');else netQuick();}
function pickBtn(x,y,w,h,t,sub,act,id,col,colD,colP){button(x,y,w,h,t,act,{size:21,id,sub,col,colD,colP});}
function drawPerson(){const q=PF.list[PF.cur],N=net,B={col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'},back=(y,cx)=>button((W-160)/2,y,160,42,N?'Cancel':'Back',()=>{if(net)netClose();else{mpPg=0;mpT0=uiT;}},{size:16,id:7,...B});
 if(!N){const cw=328,ch=384,{cx,cy}=cardBegin(cw,ch,'Play A Person',uiT-mpT0);body('Max against Noah, on two phones.',cy+88,14.5);
  pickBtn((W-256)/2,cy+110,256,56,'Start A Game','Get A Code For A Friend',()=>netGo('start'),0);
  pickBtn((W-256)/2,cy+180,256,56,'Join A Game','Type A Friend’s Code',()=>netGo('join'),2,'#5b7fd6','#34509c','#4a6cc0');
  pickBtn((W-256)/2,cy+250,256,56,'Quick Match','Play Anyone',()=>netGo('quick'),3,C.lava,'#a82a06','#e2580f');back(cy+ch-54);cardEnd();return;}
 const age=uiT-N.t0;
 if(N.st==='side'){const cw=328,ch=330,{cx,cy}=cardBegin(cw,ch,'Pick A Side',age);body(N.how==='start'?'Your friend gets the other one.':'You play someone who picked the other.',cy+88,14);
  [['max','Be Max','Block The Toys',C.hairM,'#a84f16',0,C.lava,'#a82a06','#e2580f'],['noah','Be Noah','Throw The Toys',C.hairN,'#2b1a12',2,'#5b7fd6','#34509c','#4a6cc0']].forEach((r,i)=>{const x=W/2-150+i*156,y=cy+108;button(x,y,144,128,'',()=>netSide(r[0]),{id:r[5],col:r[6],colD:r[7],colP:r[8]});
   const dn=(press&&press.id===r[5])?5:0;X.save();X.translate(x+72,y+52+dn);sticker(()=>kidHead(0,0,27,r[3],r[4],i?{mood:'happy',wear:q.wear}:{mood:'cheeky',freckles:true,flip:true}),2.4);X.restore();text(r[1],x+72,y+98+dn,19,'#fff');text(r[2],x+72,y+116+dn,10.5,'#fff',{w:800});});
  back(cy+ch-56);cardEnd();return;}
 if(N.st==='code'){const cw=336,ch=400,{cx,cy}=cardBegin(cw,ch,'Join A Game',age);body('Type your friend’s code.',cy+86,14);
  for(let i=0;i<4;i++){const x=W/2-110+i*56,y=cy+102;rr(x,y+3,48,54,8);fill(C.deep);rr(x,y,48,54,8);fill(N.txt[i]?'#fff3bf':'#eef4fd');if(N.txt[i])text(N.txt[i],x+24,y+29,30,C.navy);else if(i===N.txt.length&&Math.sin(NOW*7)>0){X.fillStyle=C.lava;X.fillRect(x+12,y+40,24,4);}}
  CODE_AB.split('').forEach((L,i)=>{const x=cx+(cw-7*44+4)/2+(i%7)*44,y=cy+176+(i/7|0)*46,id=220+i,dn=press&&press.id===id,d=dn?3:0;rr(x,y+4,40,40,7);fill('#9db7e6');rr(x,y+d,40,40,7);fill(dn?'#cfe0fa':'#eef4fd');text(L,x+20,y+21+d,20,C.navy);hits.push({x:x-2,y:y-2,w:44,h:46,act:()=>{if(N.txt.length<4)N.txt+=L;},key:uiKey,id});});
  {const x=cx+(cw-7*44+4)/2+6*44,y=cy+176+2*46,dn=press&&press.id===241,d=dn?3:0;rr(x,y+4,40,40,7);fill('#9db7e6');rr(x,y+d,40,40,7);fill(dn?'#cfe0fa':'#eef4fd');text('⌫',x+20,y+21+d,18,C.navy);hits.push({x:x-2,y:y-2,w:44,h:46,act:()=>{N.txt=N.txt.slice(0,-1);},key:uiKey,id:241});}
  const ok=N.txt.length===4,x0=W/2-(104+12+164)/2,yb=cy+ch-70;button(x0,yb,104,46,'Cancel',netClose,{size:16,id:7,...B});button(x0+116,yb,164,46,'Join',()=>{if(net&&net.txt.length===4)netRoom(net.txt,'join');},{size:20,col:ok?C.green:'#aab4cc',colD:ok?C.greenD:'#8793ad',colP:ok?'#27a83f':'#aab4cc'});cardEnd();return;}
 if(N.st==='waiting'||N.st==='joining'||N.st==='looking'){const start=N.st==='waiting'&&N.how==='start',cw=328,ch=start?418:300,{cx,cy}=cardBegin(cw,ch,start?'Your Code':N.st==='looking'?'Quick Match':'Connecting',age),dots='.'.repeat(1+(~~(NOW*2.5)%3));
  if(start){const cp=()=>copyText(N.code,ok=>{N.copied=ok?NOW:-NOW;}),did=N.copied>0&&NOW-N.copied<2.2,bad=N.copied<0&&NOW+N.copied<3,dn=press&&press.id===210,d=dn?3:0;
   for(let i=0;i<4;i++){const x=W/2-118+i*60,y=cy+92;rr(x,y+4,52,62,9);fill(C.deep);rr(x,y+d,52,62,9);fill(did?'#d6f5dc':'#fff3bf');text(N.code[i],x+26,y+33+d,36,C.navy);}
   hits.push({x:W/2-124,y:cy+86,w:248,h:76,act:cp,key:uiKey,id:210,now:true}); // tap the code itself, or the button under it, to copy it
   {const y=cy+170,sent=N.sent&&NOW-N.sent<2.5;[[W/2-122,'Send It',212,()=>sendInvite(N),sent?C.green:C.lava,sent?C.greenD:'#a82a06',sent?'Sent!':null],[W/2+4,'Copy Code',211,cp,did?C.green:'#5b7fd6',did?C.greenD:'#34509c',did?'Copied!':null]].forEach(r=>{const dn2=press&&press.id===r[2],d2=dn2?3:0;rr(r[0],y+4,118,38,8);fill(r[5]);rr(r[0],y+d2,118,38,8);fill(r[4]);text(r[6]||r[1],r[0]+59,y+20+d2,15,'#fff');hits.push({x:r[0]-2,y:y-4,w:122,h:48,act:r[3],key:uiKey,id:r[2],now:true});});}
   body(bad?'Could not copy. Tell them the letters.':'Send It: your friend just taps the link.',cy+232,14,bad?C.lavaDk:C.navy);body('Or they tap Multiplayer, Play A Person, Join A Game.',cy+254,11,'#4a6fc4');body(N.note||('Waiting for your friend'+dots),cy+288,14,N.note?C.lavaDk:C.navy);body('You are '+(N.side==='max'?'Max':'Noah')+'.',cy+312,12,'#4a6fc4');}
  else{X.save();X.translate(W/2,cy+124);X.rotate(NOW*2.2);for(let i=0;i<8;i++){X.rotate(TAU/8);circ(0,-26,5.5-i*.35);fill(i%2?C.lava:C.hot);}X.restore();
   body(N.st==='looking'?'Looking for a player'+dots:'Connecting'+dots,cy+180,15);if(N.st==='looking'){body('You are '+(N.side==='max'?'Max':'Noah')+'.',cy+204,12,'#4a6fc4');if(age>12&&N.side==='max')body('Nobody yet. Keep waiting, or cancel and play the computer.',cy+224,10.5,C.lavaDk);else if(age>12)body('Nobody yet. Keep waiting, or cancel and play the main game.',cy+224,10.5,C.lavaDk);}}
  back(cy+ch-58);cardEnd();return;}
 if(N.st==='paired'){const cw=328,ch=448,{cx,cy}=cardBegin(cw,ch,'Connected!',age),me=N.side,P=N.peer,nm=P.name||'A Player',wv=N.wave&&NOW-N.wave<1.6;
  [[me==='max',q.icon,'You',W/2-78],[me!=='max',P.icon,nm,W/2+78]].forEach((r,i)=>{const kk=EZ.back((age-.1-i*.12)/.35);if(kk<=0)return;X.save();X.translate(r[3],cy+128);X.scale(kk,kk);sticker(()=>kidHead(0,0,26,r[0]?C.hairM:C.hairN,r[0]?'#a84f16':'#2b1a12',r[0]?{mood:'cheeky',freckles:true,flip:true}:{mood:'happy',wear:i?[]:q.wear}),2.4);X.save();X.translate(26,24);paintToy(r[1],30);X.restore();X.restore();
   text(r[2],r[3],cy+178,16,C.navy);text(r[0]?'Max':'Noah',r[3],cy+197,12,'#4a6fc4',{w:800});});text('VS',W/2,cy+128,22,C.lava,{s:'#fff',sw:6});
  const host=N.role==='host';if(P.v&&P.v!==VERSION)body('Different versions: you '+VERSION+', them '+P.v+'.',cy+222,11,C.lavaDk);else if(wv)body(nm+' waved!',cy+222,13,C.lavaDk);
  text('Stage',cx+52,cy+250,16,C.navy,{a:'left'});const cfg=()=>netSend({t:'cfg',stage:N.stage,side:N.side});
  if(host){nudgeBtn(cx+126,cy+235,'−',()=>{N.stage=clamp(N.stage-1,1,10);cfg();},200,N.stage>1);nudgeBtn(cx+206,cy+235,'+',()=>{N.stage=clamp(N.stage+1,1,10);cfg();},201,N.stage<10);}
  text(''+N.stage,cx+183,cy+250,22,C.lava);text((N.stage+2)+' Toys',cx+cw-34,cy+250,12,'#4a6fc4',{a:'right',w:800});
  if(host){button((W-232)/2,cy+276,232,54,'Play!',()=>{if(net&&net.st==='paired'){cfg();netSend({t:'start'});netBegin();}},{size:23,icon:1});button(W/2-116,cy+346,112,36,'Swap Sides',()=>{N.side=N.side==='max'?'noah':'max';cfg();},{size:12.5,id:2,col:'#8a5bd6',colD:'#5a359c',colP:'#7648c2'});button(W/2+4,cy+346,112,36,'Wave',()=>{netSend({t:'wave'});sfxTick();},{size:13,id:3,col:'#12a5a0',colD:'#0b6f6c',colP:'#0e8f8a'});}
  else{body('Waiting for '+nm+' to start'+'.'.repeat(1+(~~(NOW*2.5)%3)),cy+298,14);button((W-140)/2,cy+340,140,38,'Wave',()=>{netSend({t:'wave'});sfxTick();},{size:14,id:3,col:'#12a5a0',colD:'#0b6f6c',colP:'#0e8f8a'});}
  button((W-160)/2,cy+ch-52,160,38,'Leave',netClose,{size:15,id:7,...B});cardEnd();return;}
 if(N.st==='starting'||N.st==='playing'){const cw=300,ch=220,{cx,cy}=cardBegin(cw,ch,'Get Ready',age);body('Starting the match'+'.'.repeat(1+(~~(NOW*2.5)%3)),cy+110,15);back(cy+ch-62);cardEnd();return;}
 {const cw=320,ch=250,{cx,cy}=cardBegin(cw,ch,'Oh No!',age);body(N.err||'Something went wrong.',cy+104,15);body('Nothing was lost. Try again.',cy+128,12,'#4a6fc4');button((W-180)/2,cy+ch-86,180,50,'OK',netClose,{size:20});cardEnd();}}
function drawMultiMenu(){const cw=324,ch=392,{cx,cy}=cardBegin(cw,ch,'Multiplayer',uiT-mpT0);body('Noah throws. Max blocks.',cy+88,15);
 pickBtn((W-256)/2,cy+110,256,58,'Play A Person','Two Phones',()=>{mpPg=2;mpT0=uiT;},0,C.lava,'#a82a06','#e2580f');
 if(TEST)button((W-256)/2,cy+190,256,40,'Test: Any Round + Tuning',()=>{mpPg=1;mpT0=uiT;},{size:14,id:2,col:'#e08a00',colD:'#a85f24',colP:'#c97800'}); // v8.19: Multiplayer is for people only. The old Play The Computer card stays on the test page for its tuning panel.
 button((W-200)/2,cy+256,200,36,'Max School',startTut,{size:14,id:24,col:'#8a5bd6',colD:'#5a359c',colP:'#7648c2'});
 button((W-160)/2,cy+ch-58,160,42,'Close',()=>{mpT0=0;},{size:16,id:7,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});cardEnd();}
function drawMulti(){const q=PF.list[PF.cur],O=30,cw=336,ch=(TEST?570:340)+O,{cx,cy:cy0}=cardBegin(cw,ch,'Test: Any Round',uiT-mpT0),cy=cy0+O;
 // the ten stages: a tick on each one this player has beaten as Max
 for(let i=1;i<=10;i++){const x=cx+cw/2-135+(i-1)*30,y=cy0+158,won=i<=(q.mxBest||0),cur=i===mpStage;if(cur){rr(x-13,y-13,26,26,7);fill(C.lava);}rr(x-10.5,y-10.5,21,21,5);fill(won?C.green:'#dfe3ec');text(''+i,x,y+.5,11.5,won?'#fff':'#7c879f');if(i<=(q.nhBest||0)){circ(x,y+16,3);fill('#5b7fd6');}hits.push({x:x-15,y:y-15,w:30,h:30,act:()=>{mpStage=i;},key:uiKey,id:130+i});} // green: beaten as Max; blue dot: beaten as Noah
 body('Block as Max, or throw as Noah.',cy0+88,16);
 text('Stage',cx+34,cy0+128,17,C.navy,{a:'left'});nudgeBtn(cx+116,cy0+113,'−',()=>{mpStage=clamp(mpStage-1,1,10);},100,mpStage>1);text(''+mpStage,cx+173,cy0+128,22,C.lava);nudgeBtn(cx+196,cy0+113,'+',()=>{mpStage=clamp(mpStage+1,1,10);},101,mpStage<10);text((mpStage+2)+' Toys',cx+cw-30,cy0+128,12.5,'#4a6fc4',{a:'right',w:800});
 // v8.18: Be Noah is back (it was removed in v8.11). Derek: in the main game Max only swims back and forth; here the computer Max
 // reacts to the throw "like basketball defense", which is a different game, and Noah's tricks (the decoy) belong in it.
 button((W-304)/2,cy+158,148,56,'Be Max',()=>{campBlocks=0;campS=0;startDuel(mpStage,'max');},{size:22});button((W-304)/2+156,cy+158,148,56,'Be Noah',()=>{campBlocks=0;campS=0;startDuel(mpStage,'noah');},{size:22,id:2,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});
 button((W-200)/2,cy+228,200,32,'Max School',startTut,{size:14,id:24,col:'#8a5bd6',colD:'#5a359c',colP:'#7648c2',sub:null});
 if(TEST){X.fillStyle='#eef4fd';X.fillRect(cx+12,cy+18+258,cw-24,214);text('Tuning (Test Page Only)',cx+24,cy+18+274,12,C.lavaDk,{a:'left'});
  hits.push({x:cx+cw-92,y:cy+18+262,w:76,h:26,act:()=>{Object.assign(TUNE,TUNE0);tuneSave();},key:uiKey,id:120});text('Reset',cx+cw-24,cy+18+274,12,'#5b7fd6',{a:'right'});
  TUNE_ROWS.forEach((r,i)=>{const y=cy+18+290+i*36,v=TUNE[r[0]],set=d=>{TUNE[r[0]]=Math.round(clamp(TUNE[r[0]]+d,r[3],r[4])*100)/100;tuneSave();};text(r[1],cx+24,y+15,14,C.navy,{a:'left',w:800});nudgeBtn(cx+158,y,'−',()=>set(-r[2]),110+i*2,v>r[3]);text(r[5](v),cx+226,y+15,15,C.navy);nudgeBtn(cx+260,y,'+',()=>set(r[2]),111+i*2,v<r[4]);});}
 button((W-180)/2,cy0+ch-66,180,44,'Back',()=>{mpPg=0;mpT0=uiT;},{size:17,id:7,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});cardEnd();}
function drawDuelIntro(){const D=duel,mx=D.role==='max',cw=324,ch=440,{cx,cy,age}=cardBegin(cw,ch,mx?'You Are Max!':'You Are Noah!');
 X.save();X.translate(W/2,cy+128);const k=EZ.elastic((age-.1)/.8);X.scale(k,k);sticker(()=>{if(mx)kidHead(0,4,32,C.hairM,'#a84f16',{mood:'cheeky',freckles:true,flip:true});else kidHead(0,4,32,C.hairN,'#2b1a12',{mood:'happy',wear:PF.list[PF.cur].wear});});X.restore();
 // the two things to know, each with a small moving picture
 (mx?[['Drag to swim. Tap a spot to dive.'],['A toy that hits Max is blocked.'],['Blocks and dives tire him out.'],['Hold out until the clock hits 0!']]:[['Throw every toy in the volcano.'],['A toy that hits Max is blocked.'],['Watch his energy. A tired Max is slow!'],['Beat the clock!']]).forEach((r,i)=>{const y=cy+196+i*34;circ(cx+34,y,12);fill(C.lava);text(''+(i+1),cx+34,y+1,15,'#fff');text(r[0],cx+54,y+1,13.5,C.navy,{a:'left',w:800});});
 text((solo(D)?'Round ':'Stage ')+D.stage+'   ·   '+need+' Toys   ·   '+Math.round(roundTime)+' Seconds',W/2,cy+336,12,'#4a6fc4',{w:800});
 if(solo(D))button((W-224)/2,cy+ch-82,224,58,'Next',()=>{state='duelbag';},{size:23,icon:1});else {const x0=(W-300)/2,yb=cy+ch-82;button(x0,yb,144,58,'Push',()=>{swipeMode=false;state='duelbag';},{size:23,sub:'Press And Hold'});button(x0+156,yb,144,58,'Swipe',()=>{swipeMode=true;state='duelbag';},{size:23,id:2,sub:'Flick To Throw',col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});}cardEnd();} // only Noah's side opens on this card now (Max has Max School and the bag): pick how to throw
// PACK YOUR BAG: up to 3 charges for this match. Tap a power to pack one, tap a slot to take it out. A power you have
// none of can be bought with coins. Nothing leaves the player's stock until it is used in the match.
function drawBag(){const D=duel,q=PF.list[PF.cur],nh=D.role==='noah',LIST=nh?TRK:POW,cw=336,ch=nh?422:516,{cx,cy}=cardBegin(cw,ch,nh?'Pack Your Tricks':'Pack Your Bag');
 coin(cx+26,cy+80,9);text(q.coins+' Coins',cx+41,cy+81,15,C.navy,{a:'left'});text((solo(D)?'Round ':'Stage ')+D.stage,cx+cw-18,cy+81,12,'#4a6fc4',{a:'right',w:800});
 const left=k=>q.pw[k]-D.pack.filter(e=>e===k).length;
 for(let i=0;i<3;i++){const x=W/2-99+i*70,y=cy+98,k=D.pack[i],dn=press&&press.id===150+i;rr(x,y+3,58,58,10);fill(k?C.deep:'#c9d1e2');rr(x,y+(dn?2:0),58,58,10);fill(k?'#fff3bf':'#eef4fd');if(k){X.save();X.translate(x+29,y+29);powIcon(k,17);X.restore();hits.push({x,y,w:58,h:58,act:()=>{D.pack.splice(i,1);},key:uiKey,id:150+i});}else text(''+(i+1),x+29,y+30,20,'#aab4cc');}
 text(nh?'Tap a trick in the match: it changes your next throw.':'Plus one free Big Splash every match.',W/2,cy+176,11,'#4a6fc4',{w:800});
 LIST.forEach((p,n)=>{const k=p[0],nc=Math.min(4,LIST.length),x=cx+(cw-nc*80+6)/2+(n%4)*80,y=cy+190+(n/4|0)*94,have=left(k),sel=D.info===k,id=160+n;if(sel){rr(x-3,y-3,80,94,10);fill(C.lava);}rr(x,y,74,88,8);fill(sel?'#fff3bf':have>0?'#eef4fd':'#dfe3ec');
  X.save();X.translate(x+37,y+29+(sel?Math.sin(NOW*6)*1.5:0));powIcon(k,16);X.restore();text(p[1],x+37,y+60,p[1].length>11?8.2:p[1].length>8?9.2:10.5,C.navy,{w:800});
  if(have>0)text('x'+have,x+37,y+75,12,C.greenD);else{const t=''+POW_PRICE;X.font=fnt(900,12);const tw=X.measureText(t).width;coin(x+37-tw/2-5,y+74.5,6);text(t,x+37-tw/2+5,y+75,12,q.coins>=POW_PRICE?C.navy:'#7c879f',{a:'left'});}
  hits.push({x,y,w:74,h:88,act:()=>{D.info=k;if(left(k)>0&&D.pack.length<3){D.pack.push(k);sfxTick();}},key:uiKey,id});});
 const sk=D.info,can=sk&&q.coins>=POW_PRICE;
 {const my=nh?cy+300:cy+394;body(sk?POWDESC[sk]:D.pack.length<3?(nh?'Tap a trick to pack it.':'Tap a power to pack it.'):'Bag is full. Tap a slot to take one out.',my,13.5);
 if(sk)text(can?'Buy one more for '+POW_PRICE+' coins?':'One more costs '+POW_PRICE+' coins. You need '+(POW_PRICE-q.coins)+' more.',W/2,my+20,11,'#4a6fc4',{w:800});}
 const x0=W/2-(80+8+92+8+124)/2,yb=cy+ch-70,B={col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'};
 button(x0,yb,80,46,'Back',()=>{const nt=!!D.net;goMenu();if(nt)mpT0=.001;},{size:15,id:7,...B});
 button(x0+88,yb,92,46,'Buy',()=>{const k=D.info;if(!k||q.coins<POW_PRICE)return;q.coins-=POW_PRICE;q.pw[k]++;pfSave();sfxFanfare();},{size:17,id:19,col:can?'#e08a00':'#aab4cc',colD:can?'#a85f24':'#8793ad',colP:can?'#c97800':'#aab4cc'});
 button(x0+188,yb,124,46,'Go!',duelGo,{size:21});cardEnd();}
function drawTutEnd(){const D=duel,cw=324,ch=392,{cx,cy,age}=cardBegin(cw,ch,'Max School: Done!');
 X.save();X.translate(W/2,cy+134);burstShape(96,68,14,NOW*.3);fill(C.hot);burstShape(80,56,14,NOW*.3+.11);fill('#fff3bf');const k=EZ.elastic((age-.15)/.8);X.scale(k,k);X.rotate(Math.sin(NOW*3)*.05);sticker(()=>kidHead(0,4,30,C.hairM,'#a84f16',{mood:'laugh',freckles:true,flip:true}));X.restore();
 body('You know every move Max has!',cy+214,17);
 if(D.earned.length){X.font=fnt(900,13);const t='You Earned',tw=X.measureText(t).width,w=tw+10+D.earned.length*34,x=W/2-w/2;text(t,x,cy+246,13,C.navy,{a:'left'});D.earned.forEach((q,i)=>{const kk=EZ.back((age-.6-i*.2)/.3);if(kk<=0)return;X.save();X.translate(x+tw+26+i*34,cy+245);X.scale(kk,kk);powIcon(q,12);X.restore();});}
 else body('Come back any time from the Multiplayer card.',cy+246,12,'#4a6fc4');
 button((W-232)/2,cy+272,232,52,'Play As Max',()=>startCamp('max'),{icon:1,size:21});
 button((W-140)/2,cy+ch-56,140,38,'Home',goMenu,{size:15,id:3,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});cardEnd();}
function drawDuelWait(){const cw=300,ch=250,{cx,cy,age}=cardBegin(cw,ch,'Ready!');X.save();X.translate(W/2,cy+112);X.rotate(NOW*2.2);for(let i=0;i<8;i++){X.rotate(TAU/8);circ(0,-24,5.2-i*.3);fill(i%2?C.lava:C.hot);}X.restore();
 body('Waiting for '+((net&&net.peer&&net.peer.name)||'the other player')+'.'.repeat(1+(~~(NOW*2.5)%3)),cy+170,14.5);button((W-150)/2,cy+ch-58,150,38,'Leave',goMenu,{size:15,id:7,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});cardEnd();}
function drawDuelCard(){const D=duel,mw=D.over==='max',you=D.over===D.role,cw=324,ch=436,{cx,cy,age}=cardBegin(cw,ch,mw?'Max Wins!':'Noah Wins!');
 X.save();X.translate(W/2,cy+134);burstShape(96,68,14,NOW*.3);fill(C.hot);burstShape(80,56,14,NOW*.3+.11);fill('#fff3bf');const k=EZ.elastic((age-.15)/.8);X.scale(k,k);X.rotate(Math.sin(NOW*3)*.05);
 sticker(()=>{if(mw)kidHead(0,4,30,C.hairM,'#a84f16',{mood:'laugh',freckles:true,flip:true});else kidHead(0,4,30,C.hairN,'#2b1a12',{mood:'laugh',wear:PF.list[PF.cur].wear});});X.restore();
 body(mw?(you?'You saved bath time!':'Max saved bath time!'):(you?'Kaboom! You did it!':'Kaboom! The volcano blew.'),cy+214,17);
 body('Blocks '+D.blocks+'   ·   Toys In '+collected+' Of '+need+'   ·   '+(solo(D)?'Round ':'Stage ')+D.stage,cy+238,12.5,'#4a6fc4');
 if(D.earned.length){X.font=fnt(900,13);const t='You Earned',tw=X.measureText(t).width,ct='+'+D.coins,cw2=X.measureText(ct).width+22,w=tw+10+D.earned.length*34+10+cw2,x=W/2-w/2;text(t,x,cy+272,13,C.navy,{a:'left'});D.earned.forEach((k,i)=>{const kk=EZ.back((age-.6-i*.2)/.3);if(kk<=0)return;X.save();X.translate(x+tw+26+i*34,cy+271);X.scale(kk,kk);powIcon(k,12);X.restore();});const cx2=x+tw+10+D.earned.length*34+10;coin(cx2+8,cy+271,7.5);text(ct,cx2+20,cy+272,13,C.navy,{a:'left'});}
 else text('Play 20 seconds or more to earn a power.',W/2,cy+272,11,'#4a6fc4',{w:800});
 if(D.net||D.wasNet){const B={col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'},on=D.net&&net&&net.st==='playing'; // two devices: back to the Connected card together, or home
  button((W-232)/2,cy+306,232,52,on?'Play Again':'Home',()=>{if(on){netSend({t:'again'});goMenu(true);mpPg=2;mpT0=uiT||.001;net.st='paired';net.t0=uiT;}else goMenu();},{icon:on?1:0,size:21});if(on)button((W-120)/2,cy+ch-62,120,38,'Leave',goMenu,{size:15,id:3,...B});cardEnd();return;}
 // a solo game: win to reach the next round, lose and try this one again; after round 10 it starts over
 {const nx=you&&D.stage<10,all=you&&D.stage>=10,sw=swipeMode;if(all)text('All 10 rounds cleared!  +'+COIN_WIN+' coins',W/2,cy+290,12,C.lavaDk,{w:800});
  button((W-232)/2,cy+306,232,52,nx?'Next Round':all?'Play Again':'Try Again',()=>{const r=D.role;if(all)startCamp(r);else startCamp(r,nx?D.stage+1:D.stage);if(r==='noah'&&!all){swipeMode=sw;state='duelbag';}},{icon:1,size:21});}
 button((W-140)/2,cy+ch-62,140,38,'Home',goMenu,{size:15,id:3,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});cardEnd();}
function askHome(){if(homeAsk)return;homeWasPaused=paused;homeAsk=(paused?uiT:0)+1;paused=true;}
function drawHomeCard(){const cw=300,ch=282,{cy}=cardBegin(cw,ch,'Go Home?',uiT-(homeAsk-1));body('This game will end.',cy+96,16);body('Your badges are safe.',cy+119,13,'#4a6fc4');
 button((W-216)/2,cy+140,216,52,'Keep Playing',()=>{homeAsk=0;if(!homeWasPaused){paused=false;lastNow=performance.now();acc=0;}},{size:21});
 button((W-216)/2,cy+208,216,44,'Go Home',goMenu,{id:2,size:17,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});cardEnd();}
function goMenu(keep){homeAsk=0;duel=null;mpT0=0;if(keep!==true)netClose();paused=false;charging=null;pendingLaunch=null;swingT=0;objs=[];ejecta=[];parts=[];eParts=[];rings=[];pops=[];confet=[];smoke=[];sparks=[];buildOn=false;build=0;shake=0;flash=0;blk.on=false;collected=0;need=0;combo=0;state='menu';menuStep=0;howTo=0;bdgPg=0;toysT0=0;noahT0=0;pfOpen=false;nameEd=null;pfDel=0;pfToy=0;lastNow=performance.now();acc=0;}
function drawPauseCard(){const cw=288,ch=286,{cy}=cardBegin(cw,ch,'Paused');body(duel&&duel.tut?'Max School  ·  Lesson '+(duel.tut.i+1)+' Of '+TUT.length:duel?'Multiplayer  ·  Stage '+duel.stage+'  ·  Blocks '+duel.blocks:(swipeMode?'Swipe ':'Push ')+(hardMode?'Hard':'Easy')+'  ·  Round '+round+'  ·  Score '+score,cy+100,13.5);
 button((W-208)/2,cy+124,208,58,'Resume',()=>{paused=false;lastNow=performance.now();acc=0;},{icon:1});
 button((W-208)/2,cy+204,208,50,'Start Screen',askHome,{id:2,size:18,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'});cardEnd();}
function drawResultCard(win){const age=win?uiT-1.75:uiT;if(age<0){card=null;return;}
 if(win){const cw=324,ch=340,{cx,cy}=cardBegin(cw,ch,'You Did It!',age);X.save();X.translate(W/2,cy+144);burstShape(104,74,14,NOW*.3);fill(C.hot);burstShape(86,60,14,NOW*.3+.11);fill('#fff3bf');X.restore();
  const k=EZ.elastic((age-.15)/.8);X.save();X.translate(W/2,cy+146);X.scale(k*2,k*2);X.rotate(Math.sin(NOW*3)*.06);
  X.lineCap='round';for(const g of[-1,1]){X.beginPath();X.arc(g*15,-9,8,g>0?-PI*.5:PI*.5,g>0?PI*.5:PI*1.5);X.lineWidth=4.5;X.strokeStyle=C.amber;X.stroke();}
  X.beginPath();X.moveTo(-15,-21);X.lineTo(15,-21);X.quadraticCurveTo(15,4,0,8);X.quadraticCurveTo(-15,4,-15,-21);X.closePath();fill(C.gold);rr(-3.5,7,7,9,1);fill(C.amber);rr(-12,15,24,7,3.5);fill(C.lava);star(0,-8,6,2.9);fill('#fff');X.restore();
  body('All 10 rounds cleared!',cy+226,17);body('Score '+score+'   ·   Best combo x'+bestCombo,cy+250,13.5,'#4a6fc4');
  button((W-224)/2,cy+ch-74,224,58,'Play Again',()=>startGame(),{icon:1});cardEnd();}
 else{const cw=324,ch=292,{cy}=cardBegin(cw,ch,'So Close!',age),n=need,gap=Math.min(44,(cw-70)/Math.max(n,1)),x0=W/2-(n-1)*gap/2,sz=Math.min(40,gap*.95);
  for(let i=0;i<n;i++){const o=objs[i],got=!o||o.st==='gone',kk=EZ.back((age-.2-i*.05)/.3);if(kk<=0)continue;X.save();X.translate(x0+i*gap,cy+118);X.scale(kk,kk);paintToy(currentToys[i],sz);if(got)check(sz*.38,sz*.34);X.restore();}
  body(collected>0?'You splashed '+collected+' of '+need+'. Nice!':'So nearly! Have another go.',cy+166,16);body('Round '+round+' is waiting for you',cy+189,13,'#4a6fc4');
  button((W-224)/2,cy+ch-78,224,58,'Try Again',()=>{startRound(false);state='play';lastNow=performance.now();},{icon:1});cardEnd();}}
const cover=new Image();cover.onload=()=>{cover._ok=true;};cover.onerror=()=>{};cover.src='assets/cover-volcanoes.webp'; // corrected spelling (Volcanoes); the old art is still at assets/cover.png
function drawMenu(){const t=38;X.fillStyle=C.wall;X.fillRect(0,0,W,HS);X.strokeStyle=C.tile;X.lineWidth=2.5;X.beginPath();for(let x=0;x<=W;x+=t){X.moveTo(x,0);X.lineTo(x,HS);}for(let y=8;y<HS;y+=t){X.moveTo(0,y);X.lineTo(W,y);}X.stroke();
 const pw=Math.round((W-48)*.85),py=SAFE+84, // cover is 85% of its old width (v7.34): the lower half needed the room
k0=lerp(.85,1,EZ.back(uiT/.5)),ih=py+pw+30,bandH=HS-ih; // the taped picture sits below the player chip and sound button
 X.save();X.translate(W/2,py+pw/2);X.rotate(-.022);X.scale(k0,k0);X.fillStyle=C.deep;X.fillRect(-pw/2-3,-pw/2,pw+16,pw+16);X.fillStyle='#fff';X.fillRect(-pw/2-8,-pw/2-8,pw+16,pw+16);
 if(cover._ok)X.drawImage(cover,-pw/2,-pw/2,pw,pw);else{X.fillStyle=C.lava;X.fillRect(-pw/2,-pw/2,pw,pw);text('EXPLODING',0,-30,40,'#fff');text('VOLCANOES',0,18,40,C.hot);text('In The Bathtub!',0,62,22,'#fff');}
 for(const g of[-1,1]){X.save();X.translate(g*(pw/2-10),-pw/2-6);X.rotate(g*.55);X.fillStyle=C.gold;X.fillRect(-24,-8,48,16);X.restore();}X.restore();
 const wy=x=>ih+Math.sin(x*.05+NOW*1.4)*5,edge=()=>{X.beginPath();X.moveTo(0,HS);for(let x=0;x<=W;x+=8)X.lineTo(x,wy(x));X.lineTo(W,HS);X.closePath();};
 edge();fill(C.water);X.beginPath();for(let x=0;x<=W;x+=8)x?X.lineTo(x,wy(x)):X.moveTo(x,wy(x));X.strokeStyle='#fff';X.lineWidth=5;X.stroke();
 X.beginPath();X.moveTo(0,HS);for(let x=0;x<=W;x+=8)X.lineTo(x,ih+bandH*.64+Math.sin(x*.04+NOW)*6);X.lineTo(W,HS);X.closePath();fill(C.waterDk);
 // the toys float in a row on the waterline, above the buttons, so nothing sits on top of them
 [['🦆',52,0],['🐙',144,1],['⛵',236,2],['🦕',328,4]].forEach(d=>{const k=EZ.back((uiT-.4-d[2]*.1)/.4);if(k<=0)return;const y=wy(d[1])+3+Math.sin(NOW*2+d[2])*2.5;toyFloat(d[0],d[1],y,42,Math.sin(NOW*1.3+d[2])*.1,k,k);});
 const bw=232,bx=(W-bw)/2,appear=(k,y,h,fn)=>{if(k<=0)return;X.save();X.translate(W/2,y+h/2);X.scale(k,k);X.translate(-W/2,-(y+h/2));fn();X.restore();};
 if(uiT<.7)card=null;
 if(!howTo&&!bdgPg&&!pfOpen&&!toysT0&&!noahT0&&!mpT0&&uiT>.6)drawChip();
 const tby=ih+34+(bandH-34-SAFEB-56*2-46-36-14*3)*.5; // test buttons sit in the empty margin left of Push and Swipe, clear of everything on any phone
 if(TEST&&menuStep===0&&!howTo&&!bdgPg&&!pfOpen&&!toysT0&&!noahT0&&!mpT0&&uiT>.6)button(5,tby+14,60,28,'+50',()=>addCoins(50),{size:13,id:17,col:'#e08a00',colD:'#a85f24',colP:'#c97800'}); // test page only
 if(TEST&&menuStep===0&&!howTo&&!bdgPg&&!pfOpen&&!toysT0&&!noahT0&&!mpT0&&uiT>.6)button(5,tby+56+14+14,60,28,'Rd '+testRound,()=>{testRound=testRound>=10?1:testRound+1;},{size:12.5,id:6,col:'#e08a00',colD:'#a85f24',colP:'#c97800'}); // test page only: tap to choose the starting round
 if(JOIN&&uiT>.9&&!howTo&&!bdgPg&&!pfOpen&&!toysT0&&!noahT0&&!mpT0)joinFromLink();
 if(howTo){drawHowTo();}
 else if(bdgPg){drawBadges();}
 else if(toysT0){drawMyToys();}
 else if(noahT0){drawNoah();}
 else if(mpT0){if(mpPg===2)drawPerson();else if(mpPg===1)drawMulti();else drawMultiMenu();}
 else if(pfOpen){if(nameEd)drawNameCard();else if(pfToy)drawToyCard();else if(pfDel)drawDeleteCard();else drawPlayers();}
 else if(menuStep===0){const bh=56,gap=14,mh=46,bk=36,by=ih+34+(bandH-34-SAFEB-bh*2-mh-bk-gap*3)*.5,ry=by+(bh+gap)*2+mh+gap; // step 1 of 2: how to throw. v8: a Multiplayer button sits under Swipe; the small row (at ry) moved down
  appear(EZ.back((uiT-1)/.45),ry,bk,()=>{button(bx,ry,78,bk,'How To Play',()=>{howTo=1;howT0=uiT;},{size:11,id:3,col:'#8a5bd6',colD:'#5a359c',colP:'#7648c2'});button(bx+82,ry,48,bk,'Badges',()=>{bdgPg=1;bdgT0=uiT;},{size:11,id:4,col:'#12a5a0',colD:'#0b6f6c',colP:'#0e8f8a'});button(bx+134,ry,54,bk,'My Toys',openToys,{size:11,id:18,col:'#e08a00',colD:'#a85f24',colP:'#c97800'});button(bx+192,ry,40,bk,'Noah',openNoah,{size:11,id:22,col:'#e0457a',colD:'#a3264f',colP:'#c93a6a'});});
  if(uiT>.7)text('Pick A Game',W/2,by-19,15,'#fff',{s:C.navy});
  // v8.19: three games against the computer, then Multiplayer (people only). Noah is the original game, untouched.
  appear(EZ.back((uiT-.7)/.45),by,bh,()=>button(bx,by,bw,bh,'Noah',()=>{menuStep=1;menuT0=uiT;},{size:25,id:0,sub:'Throw The Toys'}));
  appear(EZ.back((uiT-.85)/.45),by+bh+gap,bh,()=>button(bx,by+bh+gap,bw,bh,'Max',playMax,{size:25,id:2,sub:'Block The Toys',col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'}));
  appear(EZ.back((uiT-.95)/.45),by+(bh+gap)*2,mh,()=>button(bx,by+(bh+gap)*2,bw,mh,'Multiplayer',openMulti,{size:20,id:23,sub:'Play A Person',col:C.lava,colD:'#a82a06',colP:'#e2580f'}));
 }else if(menuStep===1){const bh=56,gap=20,bk=36,by=ih+34+(bandH-34-SAFEB-bh*2-gap*2-bk)*.5,mt=uiT-menuT0; // Noah's game, step 1: how to throw
  text('How Do You Throw?',W/2,by-19,15,'#fff',{s:C.navy});
  appear(EZ.back(mt/.35),by,bh,()=>button(bx,by,bw,bh,'Push',()=>{swipeMode=false;menuStep=2;menuT0=uiT;},{size:25,id:0,sub:'Press And Hold'}));
  appear(EZ.back((mt-.1)/.35),by+bh+gap,bh,()=>button(bx,by+bh+gap,bw,bh,'Swipe',()=>{swipeMode=true;menuStep=2;menuT0=uiT;},{size:25,id:2,sub:'Flick To Throw',col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'}));
  appear(EZ.back((mt-.2)/.35),by+(bh+gap)*2,bk,()=>button((W-120)/2,by+(bh+gap)*2,120,bk,'Back',()=>{menuStep=0;menuT0=0;swipeMode=false;},{size:16,id:3,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'}));
 }else{const bh=56,gap=14,mh=46,bk=36,by=ih+34+(bandH-34-SAFEB-bh*2-mh-bk-gap*3)*.5,mt=uiT-menuT0; // Noah's game, step 2: Easy, Hard (Push Hard only hides the green signal), or Smart Max
  text((swipeMode?'Swipe':'Push')+': Easy, Hard Or Smart Max?',W/2,by-19,15,'#fff',{s:C.navy});
  appear(EZ.back(mt/.35),by,bh,()=>button(bx,by,bw,bh,'Easy',()=>{hardMode=false;startGame();},{size:25,id:0,sub:'With Hints'}));
  appear(EZ.back((mt-.1)/.35),by+bh+gap,bh,()=>button(bx,by+bh+gap,bw,bh,'Hard',()=>{hardMode=true;startGame();},{size:25,id:2,sub:'No Hints',col:C.lava,colD:'#a82a06',colP:'#e2580f'}));
  // v8.20 (Derek): Noah Vs Smart Max is a third choice beside Easy and Hard, not a game of its own on the start screen
  appear(EZ.back((mt-.2)/.35),by+(bh+gap)*2,mh,()=>button(bx,by+(bh+gap)*2,bw,mh,'Smart Max',()=>{const sw=swipeMode;startCamp('noah');swipeMode=sw;},{size:20,id:25,sub:'He Fights Back. You Get Tricks.',col:'#8a5bd6',colD:'#5a359c',colP:'#7648c2'}));
  appear(EZ.back((mt-.3)/.35),by+(bh+gap)*2+mh+gap,bk,()=>button((W-120)/2,by+(bh+gap)*2+mh+gap,120,bk,'Back',()=>{menuStep=1;menuT0=uiT;},{size:16,id:3,col:'#5b7fd6',colD:'#34509c',colP:'#4a6cc0'}));}
 text(VERSION+(TEST?' TEST':''),W-16,HS-lblB-12,10,TEST?C.hot:'#d6efff',{a:'right',w:800});if(TEST)text(dbg,16,HS-lblB-12,9,'#d6efff',{a:'left',w:800});}
function overlay(){card=null;card2=null;card3=null;card4=null;hits.length=0; // v8.13: the main button (card) is cleared every frame like the others. It used to survive onto a card that had no main button of its own, so a tap there ran the PREVIOUS card's button (found when the joiner's Wave tapped the old Join).
 const key=paused?'pause':state;if(key!==uiKey){uiKey=key;uiT=0;card=null;press=null;}
 if(paused){if(homeAsk)drawHomeCard();else drawPauseCard();return;}
 if(state==='menu')drawMenu();else if(state==='intro')drawIntroCard();else if(state==='newtoy')drawNewToyCard();else if(state==='win')drawResultCard(true);else if(state==='gameover')drawResultCard(false);else if(state==='duelend')drawDuelCard();else if(state==='duelintro')drawDuelIntro();else if(state==='duelbag')drawBag();else if(state==='tutend')drawTutEnd();else if(state==='duelwait')drawDuelWait();else card=null;}

// ── ERUPTION LETTERING ──
function big(t,dy,size,col){text(t,0,dy+size*.09,size,C.navy,{s:C.navy,sw:size*.36});text(t,0,dy,size,col,{s:C.navy,sw:size*.3});}
function burstShape(r1,r2,n,rot){X.beginPath();for(let i=0;i<n*2;i++){const a=rot+i*PI/n,q=i%2?r2:r1;X.lineTo(Math.cos(a)*q,Math.sin(a)*q*.72);}X.closePath();}
function eruptFX(){if(state!=='erupt')return;
 if(eruptT>134){const sc=lerp(.5,1.08,EZ.back((160-eruptT)/11));X.save();X.translate(W/2,H/2-6);X.scale(sc,sc);X.rotate(-.03);big('This Is',-24,40,C.hot);big('The End!',22,40,C.hot);X.restore();}
 else if(eruptT>116){const a=(134-eruptT)/18;X.save();X.translate(W/2,H/2-6);[[-74,-10,-.14,0],[70,14,.12,.42]].forEach(q=>{const k=EZ.back((a-q[3])/.3);if(k<=0)return;X.save();X.translate(q[0],q[1]);X.rotate(q[2]);X.scale(k,k);burstShape(92,62,12,NOW);fill(C.navy);burstShape(84,56,12,NOW);fill(C.hot);burstShape(62,42,12,NOW+.13);fill('#fff');text('POW!',0,2,38,C.lavaDk);X.restore();});X.restore();}
 else if(eruptT>14){const sc=lerp(.5,1,EZ.back((116-eruptT)/14))*Math.min(1,(eruptT-14)/8);X.save();X.translate(W/2,122);X.scale(sc,sc);big('EXPLODING VOLCANOES',-16,27.5,C.lava);big('In The Bathtub!',16,22,'#fff');X.restore();}}

// ── SWIPE TO THROW (version 6) ──
// Power comes from the swipe: how far the finger travels up the screen (any upward direction counts in full,
// so a swipe at a side wall is as strong as one at the crater), boosted by how fast it moved.
// "Effective swipe" = distance x speed factor. 110 to 280 effective units is the sweet zone (power 0.8 to 1.2):
// that is a fast flick of about 80 to 205 units, or a slow drag of about 150 to 370.
// Past that, power climbs slowly to a ceiling of 1.5, so a huge swipe overshoots a little, not wildly.
// The swipe's direction steers the throw: STEER_DEAD radians either side of the true line is free, then
// every further radian moves the landing spot STEER_GAIN units sideways.
// HARD MODE: no green "it will score" signal, only the first HARD_ARC steps of the arc, and at most HARD_MAX_AIR toys flying.
const HARD_MAX_AIR=3,HARD_ARC=22;
const SWIPE_MIN=16,SWIPE_FAST=1500,STEER_DEAD=.06,STEER_GAIN=200;
function swipeMove(p){const c=charging,o=c.o,now=performance.now(),dtm=now-c.lt;
 if(dtm>8){const v=Math.hypot(p.x-c.lx,p.y-c.ly)/dtm*1000;c.peak=Math.max(c.peak,Math.min(v,2400));c.lx=p.x;c.ly=p.y;c.lt=now;}
 const ux=CX-o.x,uy=CY-o.y,ul=Math.hypot(ux,uy)||1;c.fx=p.x;c.fy=p.y;{const sx=p.x-c.sx,sy=p.y-c.sy,sd=Math.hypot(sx,sy)||1;c.len=sd*clamp(-sy/sd*1.6,0,1);}
 // speed is what makes a throw hard (x0.75 slow drag .. x1.35 fast flick); a wide middle band of swipe lengths all give close to the right power
 const e=c.len*(.75+.6*Math.min(c.peak/SWIPE_FAST,1));c.tc=e<110?.3+.5*e/110:e<280?.8+.4*(e-110)/170:Math.min(1.5,1.2+.3*(e-280)/200);
 // DIRECTION: how far the swipe leans off the toy-to-crater line steers the landing spot left or right
 const dx=p.x-c.sx,dy=p.y-c.sy;if(Math.hypot(dx,dy)>24){const dev=Math.atan2((ux*dy-uy*dx)/ul,(ux*dx+uy*dy)/ul),a=Math.max(0,Math.abs(dev)-STEER_DEAD);c.ts=clamp(Math.sign(dev)*Math.tan(Math.min(a,1.3))*STEER_GAIN,-460,460);}}
// flicks are less precise than holds, so near-misses snap to the crater from further away (±0.09 instead of ±0.04); direction gets no snap beyond its small dead zone
function assistSwipe(o,f,st){if(hitsAt(o,f,st))return f;for(const d of[.03,-.03,.06,-.06,.09,-.09])if(hitsAt(o,f+d,st))return f+d;return f;}
// WALLS: a flying toy bounces off the two side walls (not the top); in off a wall scores double.
const WALL_L=16,WALL_R=364,BNC=.82;
function wallBounce(o){let hit=false;if(o.x<WALL_L&&o.vx<0){o.x=WALL_L;o.vx*=-BNC;hit=true;}else if(o.x>WALL_R&&o.vx>0){o.x=WALL_R;o.vx*=-BNC;hit=true;}
 if(hit){o.bn=(o.bn||0)+1;o.sq=.8;rings.push({x:o.x,y:o.y,r:6,life:1});sparkle(o.x,o.y,5);blip(300,.09,'triangle',.16,560);haptic(1);}}
// haptic tick: real vibration where the browser has it; on iPhone, the switch-control trick (may not fire on every iOS version)
let hapEl=null;
function haptic(n){if(!swipeMode&&!duel)return;try{if(navigator.vibrate){navigator.vibrate(n>1?[12,40,18]:10);return;}
 if(!hapEl){const l=document.createElement('label');l.style.cssText='position:fixed;left:-99px;top:-99px;opacity:0;pointer-events:none';const i=document.createElement('input');i.type='checkbox';i.setAttribute('switch','');l.appendChild(i);document.body.appendChild(l);hapEl=l;}
 hapEl.click();if(n>1)setTimeout(()=>hapEl.click(),70);}catch(e){}}

// ── FRAME ──
function draw(){X.setTransform(KS*DPR,0,0,KS*DPR,0,0);X.globalAlpha=1;
 if(state==='menu'){overlay();drawMute();return;}
 X.fillStyle=C.wall;X.fillRect(0,0,W,HS);X.save();const pz=1+EZ.in(punch)*.05,sk=shake>.3;if(sk||pz>1.001){const px=W/2,py=OY+290;X.translate(px+(sk?(Math.random()-.5)*shake:0),py+(sk?(Math.random()-.5)*shake:0));X.scale(pz,pz);X.translate(-px,-py);}
 backdrop();X.save();X.translate(0,OY);
 water();volcano();maxBlocker();kid();if(duel){if(duel.role==='max')duelHints();maxBar();}drawObjs();drawBubbles();drawRings();tutorial();chargeGuide();drawParts();eruptFX();drawEjecta();drawBanner();drawPops();
 X.restore();hud();drawDuelBar();X.restore();
 if(flash>0){X.save();X.globalAlpha=Math.min(1,flash);X.fillStyle=flashCol;X.fillRect(0,0,W,HS);X.restore();}
 overlay();drawToast();drawMute();if(state==='play'||paused)drawPauseBtn();}
// fill the phone; never shorter than 720 logical px, so the wall decor always clears the tub
// iPhone home-screen app: the page is drawn UNDER the clock/battery bar, and right after launch the phone can
// report a too-short window and a zero top inset, then correct them without telling the page. So: (1) the size is
// re-checked twice a second (see watchSize), (2) if the window is still reported short we use the real screen
// height and pin the game to the top, (3) if the top inset still reads zero we assume one, so the top buttons
// always sit below the bar.
let lastSize='',dbg='',lblB=0,pinLatch=false,resizeN=0; // lblB: how far the corner labels sit above the bottom edge
function resize(){const vw=window.innerWidth,MINH=720,ios=/iPhone|iPad|iPod/.test(navigator.userAgent),port=vw<window.innerHeight,
  sa=navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches),homeApp=sa&&ios&&port;
 let vh=window.innerHeight,pin=false,cw,ch;
 // pinLatch (v7.44): once pinned, stay pinned. Making the page screen-tall makes the phone report the full height,
 // and un-pinning on that made it report the short height again: an endless flip that flashed the screen (v7.42).
 if(homeApp&&Math.abs(screen.width-vw)<2&&(screen.height>vh+8||pinLatch)){vh=screen.height;pin=true;}pinLatch=pin;
 if(vh/vw>=MINH/W){cw=vw;ch=vh;HS=W*vh/vw;}else{ch=vh;cw=vh*W/MINH;HS=MINH;}
 KS=cw/W;DPR=Math.max(1,Math.min(window.devicePixelRatio||1,QCAP,Math.sqrt(2.7e6/(cw*ch))));OY=Math.round((HS-600)*.6);
 const sp=document.getElementById('safe'),sb=document.getElementById('safeb');SAFE=sp?sp.offsetHeight/KS:0;SAFEB=sb?sb.offsetHeight/KS:0;
 const rawSafe=Math.round(SAFE*KS);if(homeApp)SAFE=Math.max(SAFE,(screen.height>=812?54:22)/KS);
 lblB=Math.max(SAFEB,homeApp&&screen.height>=812?34/KS:0)+8; // home-screen app: the bottom inset can read zero, which put the version label in the rounded corner / home bar
 dbg='s'+rawSafe+'>'+Math.round(SAFE*KS)+' h'+window.innerHeight+'/'+screen.height+(sa?' app':' web')+(pin?' pin2':'');
 const wEl=document.getElementById('w');wEl.style.position=pin?'absolute':'relative';wEl.style.top=pin?'0':'';wEl.style.left=pin?'0':'';
 // v7.42: the phone clips everything below the window height it reports (812 of 874 on Derek's iPhone), so a
 // taller game alone was cut off at the bottom. In pin mode the PAGE is made screen-tall as well (the known
 // workaround for this home-screen bug), so the part below the reported window is real page and gets drawn.
 {const R=document.documentElement.style,B=document.body.style,px=ch+'px';
  R.height=pin?px:'';R.minHeight=pin?px:'';R.overflow=pin?'visible':'';
  B.position=pin?'absolute':'';B.top=pin?'0':'';B.left=pin?'0':'';B.right=pin?'auto':'';B.bottom=pin?'auto':'';B.width=pin?'100%':'';B.height=pin?px:'';B.minHeight=pin?px:'';B.overflow=pin?'visible':'';B.display=pin?'block':'';
  if(pin&&(window.scrollY||window.scrollX))window.scrollTo(0,0);}
 wEl.style.width=cw+'px';wEl.style.height=ch+'px';wEl.classList.toggle('boxed',cw<vw-4);
 cv.style.width=cw+'px';cv.style.height=ch+'px';{const pw=Math.round(cw*DPR),ph=Math.round(ch*DPR);if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;resizeN++;}}bg=null;} // the canvas is only re-made when its size really changes (re-making it blanks it for a frame)
function sizeKey(){const sp=document.getElementById('safe'),sb=document.getElementById('safeb');return window.innerWidth+'x'+window.innerHeight+'/'+(sp?sp.offsetHeight:0)+'/'+(sb?sb.offsetHeight:0);}
function watchSize(){const k=sizeKey();if(k!==lastSize){lastSize=k;resize();}}
window.addEventListener('resize',watchSize);window.addEventListener('orientationchange',()=>setTimeout(watchSize,250));window.addEventListener('pageshow',watchSize);window.addEventListener('scroll',()=>{if(window.scrollY||window.scrollX)window.scrollTo(0,0);});document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false}); // the screen-tall page must never scroll

if(window.visualViewport)window.visualViewport.addEventListener('resize',watchSize);setInterval(watchSize,500);
buildToys();resize();
requestAnimationFrame(loop);
