// A full bag: the given powers plus (optionally) the free Big Splash, against no powers at all.
const {open}=require('./lib.js');const BAGS=JSON.parse(process.argv[2]),CELLS=JSON.parse(process.argv[3]),N=+(process.argv[4]||80);
(async()=>{const {b,p,errs}=await open(375,812,1);
const out=await p.evaluate(({BAGS,CELLS,N})=>{window.setTimeout=()=>0;const q=PF.list[PF.cur];Object.assign(TUNE,TUNE0);
 const BOT={sharp:{react:.25,lapse:0},slow:{react:.5,lapse:.25}};
 const run=(bot,stage,bag,free)=>{const B=BOT[bot];let mw=0;
  for(let n=0;n<N;n++){startDuel(stage,'max',true);duel.free=free?1:0;RS=(stage*7919+n*104729+1)>>>0;for(const k of bag)q.pw[k]=99;duel.bag=bag.map(k=>({k}));
   const timed=bag.filter(k=>k!=='blast'&&k!=='splash');const hist=[];let f=0,lost=false,cur=null,ign=false,ut=0;
   while(state==='play'&&f<60*240){const m=duel.mx,cx=charging?crossX(charging.o):null;hist.push(cx);const seen=hist[Math.max(0,hist.length-1-Math.round(B.react*60))];
    if(charging&&charging.o!==cur){cur=charging.o;ign=Math.random()<B.lapse;}
    if(seen!=null&&!ign){const x=Math.max(82,Math.min(298,seen));m.tx=x;if(m.e>=TUNE.tire+.1&&Math.abs(x-blk.x)>45)maxDive(x);}
    const frac=1-timeLeft/roundTime;
    if(ut<timed.length&&frac>=(ut+1)/(timed.length+1)){usePower(timed[ut]);ut++;}
    if(duel.bag.some(e=>e.k==='blast')&&objs.some(o=>o.st==='fly'&&!o.blocked&&Math.abs(o.x-blk.x)<BLAST_W&&o.y<blk.y-26))usePower('blast');
    if(seen!=null&&!ign&&Math.abs(seen-blk.x)>55&&m.e<TUNE.tire+.1){if(duel.free)usePower('splash',true);else if(duel.bag.some(e=>e.k==='splash'))usePower('splash');}
    NOW+=1/60;step(1/60);f++;if(collected>=need){lost=true;break;}}
   if(!lost)mw++;}
  return Math.round(mw/N*100);};
 const res=[];for(const g of BAGS)res.push([g,CELLS.map(c=>run(c[0],c[1],g[0],g[1]))]);goMenu();return res;},{BAGS,CELLS,N});
console.log('Max win %   N='+N);console.log('bag'.padEnd(34)+CELLS.map(c=>(c[0]+' s'+c[1]).padStart(10)).join(''));
for(const r of out)console.log(((r[0][0].join('+')||'none')+(r[0][1]?' +free':'')).padEnd(34)+r[1].map(v=>(v+'%').padStart(10)).join(''));
if(errs.length)console.log(errs);await b.close();})();
