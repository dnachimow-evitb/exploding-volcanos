// Balance for "Be Noah": a scripted Noah of fixed skill (the computer Noah's own code, skill k) against the computer Max at each stage.
const {open}=require('./lib.js');const KS=JSON.parse(process.argv[2]||'[0.2,0.6]'),N=+(process.argv[3]||60),OV=JSON.parse(process.argv[4]||'{}');
(async()=>{const {b,p,errs}=await open(375,812,1);
const out=await p.evaluate(({KS,N,OV})=>{window.setTimeout=()=>0;Object.assign(TUNE,TUNE0);Object.assign(CMX,OV);const res=[];
 for(const k of KS){const row=[];for(let stage=1;stage<=10;stage++){let nw=0,bl=0;for(let n=0;n<N;n++){startDuel(stage,'noah',true);duel.noah='cpu';duel.cpu.k=k;RS=(stage*7919+n*104729+1)>>>0;let f=0,won=false;
   while(state==='play'&&f<60*240){NOW+=1/60;step(1/60);f++;if(collected>=need){won=true;break;}}if(won)nw++;bl+=duel.blocks;}row.push([Math.round(nw/N*100),Math.round(bl/N)]);}res.push([k,row]);}
 goMenu();return res;},{KS,N,OV});
console.log('Noah win % at stages 1..10 (blocks by Max)   N='+N+' '+JSON.stringify(OV));for(const r of out)console.log(('Noah skill '+r[0]).padEnd(16)+r[1].map(v=>(v[0]+'%').padStart(6)).join('')+'   blocks '+r[1].map(v=>v[1]).join(' '));
if(errs.length)console.log(errs);await b.close();})();
