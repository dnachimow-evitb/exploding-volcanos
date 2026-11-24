// BOT PLAYTEST: scripted players of three skill levels play whole ten-round games in every mode, through the game's own
// test log (logEnd), so the output is the same kind of log Derek pastes and readlog.js can judge it.
//   node playtest.js <mode> <persona> <sessions> > out.txt        modes: max, smart-push, smart-swipe, noah-push, noah-swipe
// A session starts at round 1; a win moves on, a loss is tried again; after `grit` losses on one round the player gives up.
const {open}=require('./lib.js');const MODE=process.argv[2],WHO=process.argv[3],SESS=+(process.argv[4]||8),OV=JSON.parse(process.argv[5]||'{}');
const MAXP={kid:{react:.55,lapse:.25,diveP:0,pack:[],center:false,grit:3},
 casual:{react:.38,lapse:.1,diveP:.4,pack:['noodle','flip','juice'],center:true,grit:4},
 good:{react:.22,lapse:.03,diveP:.9,pack:['noodle','juice','bucket'],center:true,grit:6}};
const PUSHP={kid:{wait:1.6,bad:.35,smart:.1,tricks:[],grit:3},casual:{wait:1.0,bad:.18,smart:.5,tricks:['double','decoy','rocket'],grit:4},good:{wait:.5,bad:.05,smart:.95,tricks:['double','decoy','rocket'],grit:6}};
const SWP={kid:{g:.38,wait:1.3,bad:.3,smart:.2,tricks:[],grit:3},casual:{g:.28,wait:.8,bad:.15,smart:.6,tricks:['double','decoy','rocket'],grit:4},good:{g:.2,wait:.5,bad:.05,smart:.95,tricks:['double','decoy','rocket'],grit:6},derekish:{g:.2,wait:1.4,bad:.3,smart:.97,tricks:['double','decoy','rocket'],grit:6}};
const P=Object.assign({},(MODE==='max'?MAXP:/push/.test(MODE)?PUSHP:SWP)[WHO.split('+')[0]],OV.p||{});if(!P){console.error('no persona');process.exit(1);}
(async()=>{const {b,p,errs}=await open(375,812,1);
const out=await p.evaluate(({MODE,WHO,SESS,P,OV})=>{window.setTimeout=()=>0;Object.assign(TUNE,TUNE0);if(OV.camp)Object.assign(CAMP,OV.camp);if(OV.cmx)Object.assign(CMX,OV.cmx);if(OV.tune)Object.assign(TUNE,OV.tune);
 let sd=12345;const R=()=>{sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 const q=PF.list[PF.cur];for(const k in q.pw)q.pw[k]=999;const lines=[],dt=1/60;
 // ---- the players
 function maxBot(S){const m=duel.mx;let tgt=charging?crossX(charging.o):null;if(tgt==null){const o=pendingLaunch?pendingLaunch.o:objs.find(q=>q.st==='fly'&&!q.blocked&&q.vy<0&&q.y>blk.y);if(o)tgt=o.st==='fly'?o.x+o.vx*Math.max(0,(o.y-blk.y)/Math.max(2,-o.vy)):crossX(o);} // he keeps watching the toy through the swing and the flight
 S.hist.push(tgt);const seen=S.hist[Math.max(0,S.hist.length-1-Math.round(P.react*60))];
  if(charging&&charging.o!==S.cur){S.cur=charging.o;S.ign=R()<P.lapse;S.dove=false;}
  if(seen!=null&&!S.ign){const x=clamp(seen,MAX_L,MAX_R);m.tx=x;if(!S.dove&&P.diveP&&Math.abs(x-blk.x)>60&&m.e>=TUNE.tire*2){S.dove=true;if(R()<P.diveP)maxDive(x);}}
  else if(P.center&&seen==null&&tgt==null)m.tx=CX;
  const has=k=>duel.bag.some(b=>b.k===k);
  if(has('juice')&&m.e<.2)usePower('juice');else if(duel.free&&m.e<.3&&timeLeft<roundTime*.7)usePower('splash',true);
  else if(charging&&seen!=null&&Math.abs(seen-blk.x)>70){if(has('flip')&&m.flip<=0)usePower('flip');else if(has('noodle')&&m.noodle<=0)usePower('noodle');}
  if(has('bucket')&&!m.held&&m.bucket<=0&&need-collected<=2)usePower('bucket');}
  function arm(){const nb=duel&&duel.nbag;if(!nb||!nb.length||nb.some(e=>e.armed))return;const m=duel.mx,fl=objs.filter(o=>o.st==='float'&&!o.hb).length;
   const pick=k=>{const e=nb.find(x=>x.k===k&&!x.armed);if(e){e.armed=true;if(RL)RL.tk.push(k);return true;}return false;};
   if(fl>=2&&timeLeft<roundTime*.8&&pick('double'))return;if(m.e>.7&&timeLeft<roundTime*.6&&pick('decoy'))return;if(timeLeft<roundTime*.5)pick('rocket');}
 function pickToy(S,smart){const fl=objs.filter(o=>o.st==='float'&&!(o.born&&NOW<o.born+.3));if(!fl.length)return null;let o=fl[~~(R()*fl.length)];if(blk.on&&R()<smart)o=fl.reduce((a,c)=>Math.abs(crossX(c)-blk.x)>Math.abs(crossX(a)-blk.x)?c:a);return o;}
 function pushBot(S){if(charging){const o=charging.o,go=S.bad?charging.c>=S.badAt:hitsAt(o,charging.c);if(go){pendingLaunch={o,f:S.bad?charging.c:assist(o,charging.c)};charging=null;swingT=swingDur;swingHit=false;S.wait=P.wait*(.7+R()*.6);}else if(charging.c>=CHARGE_MAX){charging=null;S.wait=.3;}return;}
  if(pendingLaunch||swingT>0)return;S.wait-=dt;if(S.wait>0)return;const o=pickToy(S,P.smart);if(!o)return;if(duel&&P.tricks.length)arm();S.bad=R()<P.bad;S.badAt=.6+R()*.25;charging={o,c:.3,sx:o.x,sy:o.y,fx:o.x,fy:o.y,lx:o.x,ly:o.y,lt:0,peak:0,len:0,tc:.3,cpu:true};splashSide=o.x<CX?-1:1;}
 function swipeBot(S){if(charging){S.hold+=dt;if(S.hold>=P.g){const o=charging.o,tc=R()<P.bad?(R()<.5?.7:1.4):1;pendingLaunch={o,f:assistSwipe(o,tc,0),steer:0};charging=null;swingT=swingDur;swingHit=false;S.wait=P.wait*(.7+R()*.6);}return;}
  if(pendingLaunch||swingT>0)return;S.wait-=dt;if(S.wait>0)return;const o=pickToy(S,P.smart);if(!o)return;if(duel&&P.tricks.length)arm();charging={o,c:1,tc:1,sx:o.x,sy:o.y,fx:o.x,fy:o.y,lx:o.x,ly:o.y,lt:0,peak:0,len:60,cpu:true};splashSide=o.x<CX?-1:1;S.hold=0;}
 // ---- one round
 function playRound(r,seed){const S={hist:[],cur:null,ign:false,dove:false,wait:1.2,hold:0},n0=LOGS.length;
  if(MODE==='max'){lastPack=P.pack.slice();startDuel(r,'max',true);}
  else if(MODE==='smart-push'||MODE==='smart-swipe'){lastPackN=P.tricks.slice();startDuel(r,'noah');swipeMode=MODE==='smart-swipe';duelGo();}
  else{duel=null;swipeMode=MODE==='noah-swipe';hardMode=false;testRound=r;startGame();startRound(false);state='play';}
  RS=(seed>>>0)||1;const bot=MODE==='max'?maxBot:/push/.test(MODE)?pushBot:swipeBot;let f=0;
  while(state==='play'&&f<60*400){bot(S);NOW+=dt;step(dt);f++;if(collected>=need&&state==='play'){buildOn=false;roundWin();break;}}
  if(state==='play'){if(RL)logEnd('STUCK');}
  const L=LOGS.length>n0?LOGS[LOGS.length-1]:'NO LOG r'+r+' state '+state;goMenu();return L;}
 for(let s=0;s<SESS;s++){logTry={};logLast=0;let r=1,tries=0,guard=0;while(r<=10&&guard++<80){let L=playRound(r,(s*7919+r*104729+tries*31+WHO.length*977+MODE.length*13+1)>>>0);const f=L.split(' | ');if(f.length>4){f[2]=MODE+'@'+WHO;L=f.join(' | ')+' | sess '+(s+1);}lines.push(L);
   const win=/\| WIN \|/.test(L);if(win){r++;tries=0;}else if(++tries>=P.grit){lines[lines.length-1]+=' | GAVEUP';break;}}}
 return lines;},{MODE,WHO,SESS,P,OV});
console.log(out.join('\n'));if(errs.length)console.error('errors',errs);await b.close();})();
