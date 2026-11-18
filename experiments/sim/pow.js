// How much is each power worth? Scripted Max players that USE the power, many matches, compared with none.
// usage: node pow.js '<conditions json>' '<cells json>' N     condition = [powerKey|null, count]   cell = [bot, stage]
const {open}=require('./lib.js');const CONDS=JSON.parse(process.argv[2]),CELLS=JSON.parse(process.argv[3]),N=+(process.argv[4]||80);
(async()=>{const {b,p,errs}=await open(375,812,1);
const out=await p.evaluate(({CONDS,CELLS,N})=>{window.setTimeout=()=>0;const q=PF.list[PF.cur];Object.assign(TUNE,TUNE0);
 const BOT={sharp:{react:.25,lapse:0},slow:{react:.5,lapse:.25}};
 const run=(bot,stage,pk,count)=>{const B=BOT[bot];let mw=0,toys=0,used=0;
  for(let n=0;n<N;n++){startDuel(stage,'max',true);duel.free=0;RS=(stage*7919+n*104729+1)>>>0;if(pk){q.pw[pk]=99;duel.bag=Array.from({length:count},()=>({k:pk}));}
   const hist=[];let f=0,lost=false,cur=null,ign=false,u=0;
   while(state==='play'&&f<60*240){const m=duel.mx,cx=charging?crossX(charging.o):null;hist.push(cx);const seen=hist[Math.max(0,hist.length-1-Math.round(B.react*60))];
    if(charging&&charging.o!==cur){cur=charging.o;ign=Math.random()<B.lapse;}
    if(seen!=null&&!ign){const x=Math.max(82,Math.min(298,seen));m.tx=x;if(m.e>=TUNE.tire+.1&&Math.abs(x-blk.x)>45)maxDive(x);}
    // when to use the power
    if(pk&&u<count){const frac=1-timeLeft/roundTime,due=frac>=(u+1)/(count+1);let go=false;
     if(pk==='splash')go=seen!=null&&!ign&&((Math.abs(seen-blk.x)>55&&m.e<TUNE.tire+.1)||frac>=(u+1)/(count+1)+.12);
     else if(pk==='blast')go=objs.some(o=>o.st==='fly'&&!o.blocked&&Math.abs(o.x-blk.x)<BLAST_W&&o.y<blk.y-26);
     else if(pk==='juice')go=m.e<TUNE.tire;
     else go=due;
     if(go){usePower(pk);u++;}}
    NOW+=1/60;step(1/60);f++;if(collected>=need){lost=true;break;}}
   if(!lost)mw++;toys+=collected/need;used+=u;}
  return[Math.round(mw/N*100),Math.round(toys/N*100),+(used/N).toFixed(1)];};
 const res=[];for(const c of CONDS)res.push([c,CELLS.map(cell=>run(cell[0],cell[1],c[0],c[1]))]);goMenu();return res;},{CONDS,CELLS,N});
console.log('Max win %  (toys Noah got in %, charges used)   N='+N);console.log('condition'.padEnd(16)+CELLS.map(c=>(c[0]+' s'+c[1]).padStart(18)).join(''));
for(const r of out)console.log(((r[0][0]||'none')+(r[0][0]?' x'+r[0][1]:'')).padEnd(16)+r[1].map(v=>(v[0]+'% ('+v[1]+', '+v[2]+')').padStart(18)).join(''));
if(errs.length)console.log(errs);await b.close();})();
