// "Be Noah" with Swipe: a scripted flicking Noah against the computer Max. The flick is the game's own swipe throw
// (finger on the toy for g seconds, then the normal swing and flight); only who decides to throw is scripted.
// Noah levels: [gesture seconds, pause between throws, chance of a bad flick, chance he picks the toy furthest from Max]
const {open}=require('./lib.js');const N=+(process.argv[2]||50),OV=JSON.parse(process.argv[3]||'{}'),TU=JSON.parse(process.argv[4]||'{}');
const LV=process.argv[5]?JSON.parse(process.argv[5]):{beginner:[.38,1.3,.3,.2],middling:[.28,.8,.15,.6],expert:[.2,.5,.05,.95]};
(async()=>{const {b,p,errs}=await open(375,812,1);
const out=await p.evaluate(({N,OV,LV,TU})=>{window.setTimeout=()=>0;Object.assign(TUNE,TUNE0,TU);Object.assign(CMX,OV);const res=[];
 for(const name in LV){const [g,w,bad,smart]=LV[name],row=[];for(let stage=1;stage<=10;stage++){let nw=0,bl=0;for(let n=0;n<N;n++){startDuel(stage,'noah',true);swipeMode=true;RS=(stage*7919+n*104729+1)>>>0;let f=0,won=false,wait=1.2,hold=0;
   while(state==='play'&&f<60*240){
    if(charging){hold+=1/60;if(hold>=g){const o=charging.o,tc=rnd()<bad?(rnd()<.5?.7:1.4):1;pendingLaunch={o,f:assistSwipe(o,tc,0),steer:0};charging=null;swingT=swingDur;swingHit=false;wait=w*(.7+rnd()*.6);}}
    else if(!pendingLaunch&&swingT<=0){wait-=1/60;if(wait<=0){const fl=objs.filter(o=>o.st==='float'&&!(o.born&&NOW<o.born+.3));if(fl.length){let o=fl[~~(rnd()*fl.length)];if(rnd()<smart)o=fl.reduce((a,c)=>Math.abs(crossX(c)-blk.x)>Math.abs(crossX(a)-blk.x)?c:a);charging={o,c:1,tc:1,sx:o.x,sy:o.y,fx:o.x,fy:o.y,lx:o.x,ly:o.y,lt:0,peak:0,len:60,cpu:true};splashSide=o.x<CX?-1:1;hold=0;}}}
    NOW+=1/60;step(1/60);f++;if(collected>=need){won=true;break;}}
   if(won)nw++;bl+=duel.blocks;}row.push([Math.round(nw/N*100),Math.round(bl/N)]);}res.push([name,row]);}
 goMenu();return res;},{N,OV,LV,TU});
console.log('Swipe: Noah win % at stages 1..10   N='+N+' '+JSON.stringify(OV));for(const r of out)console.log(r[0].padEnd(10)+r[1].map(v=>(v[0]+'%').padStart(6)).join('')+'   blocks '+r[1].map(v=>v[1]).join(' '));
if(errs.length)console.log(errs);await b.close();})();
