// The Max game (ten rounds against the computer Noah): win % by round for scripted Max players, for a CAMP setting.
// node camp.js '[{"camp":{"k0":.3},"react":.2}]' 20   (the scripted Max uses no powers and never dives)
const {open}=require('./lib.js');
const sets=JSON.parse(process.argv[2]||'[{}]'),N=+(process.argv[3]||60);
(async()=>{const {b,p,errs}=await open(375,812,1);
const out=await p.evaluate(({sets,N})=>{const realST=window.setTimeout;window.setTimeout=()=>0;const res=[];
 for(const set of sets){Object.assign(TUNE,TUNE0,set.tune||{});Object.assign(CAMP,set.camp||{});const react=set.react??.25,lapse=set.lapse??0,row=[];
  for(let stage=1;stage<=10;stage++){let mw=0,bl=0,tl=0,thr=0;
   for(let n=0;n<N;n++){startDuel(stage,'max',true);RS=(stage*7919+n*104729+1)>>>0;startDuel.x=0;const hist=[];let f=0,lost=false,cur=null,ign=false;
    while(state==='play'&&f<60*200){const tgt=charging?crossX(charging.o):null;hist.push(tgt);const seen=hist[Math.max(0,hist.length-1-Math.round(react*60))];
     if(charging&&charging.o!==cur){cur=charging.o;ign=Math.random()<lapse;thr++;}
     if(seen!=null&&!ign)duel.mx.tx=Math.max(82,Math.min(298,seen));
     NOW+=1/60;step(1/60);f++;if(collected>=need){lost=true;break;}}
    if(!lost)mw++;bl+=duel.blocks;tl+=timeLeft;}
   row.push({s:stage,maxWin:Math.round(mw/N*100),blocks:+(bl/N).toFixed(1),left:+(tl/N).toFixed(0)});}
  res.push({set,row});}
 window.setTimeout=realST;goMenu();return res;},{sets,N});
for(const r of out){console.log(JSON.stringify(r.set));console.log(' stage   '+r.row.map(q=>String(q.s).padStart(4)).join(''));console.log(' MaxWin% '+r.row.map(q=>String(q.maxWin).padStart(4)).join(''));console.log(' blocks  '+r.row.map(q=>String(Math.round(q.blocks)).padStart(4)).join(''));console.log(' secLeft '+r.row.map(q=>String(q.left).padStart(4)).join(''));}
if(errs.length)console.log('errors',errs);await b.close();})();
