// simulated matches, Max with a dive. Bots: sharp (0.25 s reaction), slow (0.5 s, ignores 1 throw in 4), still.
const {open}=require('./lib.js');const SETS=JSON.parse(process.argv[2]),STAGES=JSON.parse(process.argv[3]||'[1,3,5,8,10]'),N=+(process.argv[4]||30);
(async()=>{const {b,p,errs}=await open(375,812,1);
const out=await p.evaluate(({SETS,STAGES,N})=>{window.setTimeout=()=>0;const res=[];
 const run=(tune,react,lapse,stage,dive)=>{Object.assign(TUNE,TUNE0,tune);let mw=0;
  for(let n=0;n<N;n++){startDuel(stage,'max',true);duel.free=0;RS=(stage*7919+n*104729+1)>>>0;const hist=[];let f=0,lost=false,cur=null,ign=false;
   while(state==='play'&&f<60*240){hist.push(charging?crossX(charging.o):null);const seen=hist[Math.max(0,hist.length-1-Math.round(react*60))];
    if(charging&&charging.o!==cur){cur=charging.o;ign=Math.random()<lapse;}
    if(seen!=null&&!ign){const x=Math.max(82,Math.min(298,seen));duel.mx.tx=x;if(dive&&duel.mx.e>=TUNE.tire+.1&&Math.abs(x-blk.x)>45)maxDive(x);}
    NOW+=1/60;step(1/60);f++;if(collected>=need){lost=true;break;}}
   if(!lost)mw++;}return Math.round(mw/N*100);};
 for(const t of SETS)res.push([JSON.stringify(t),STAGES.map(s=>run(t,.25,0,s,true)),STAGES.map(s=>run(t,.5,.25,s,true)),STAGES.map(s=>run(t,.5,.25,s,false)),run(t,9,0,3,false)]);
 goMenu();return res;},{SETS,STAGES,N});
console.log('stages '+STAGES.join(' ')+' | sharp | slow | slow, never dives | still');for(const r of out)console.log(r[0].padEnd(40)+' | '+r[1].map(v=>String(v).padStart(3)).join(' ')+' | '+r[2].map(v=>String(v).padStart(3)).join(' ')+' | '+r[3].map(v=>String(v).padStart(3)).join(' ')+' | '+r[4]);
if(errs.length)console.log(errs);await b.close();})();
