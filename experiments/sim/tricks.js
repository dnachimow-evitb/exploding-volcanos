// Balance for Noah's tricks: a scripted Noah (the computer Noah's code, skill k) carrying three of one trick, against the computer Max.
// The script arms a trick as soon as none is armed, so every one of the three is used early in the match.
const {open}=require('./lib.js');const KS=JSON.parse(process.argv[2]||'[0.2,0.6]'),N=+(process.argv[3]||60),SW=process.argv[4]==='swipe';
(async()=>{const {b,p,errs}=await open(375,812,1);
const out=await p.evaluate(({KS,N,SW})=>{window.setTimeout=()=>0;Object.assign(TUNE,TUNE0);const res=[];
 for(const k of KS)for(const tr of[null,'decoy','rocket','double']){const row=[];for(let stage=1;stage<=10;stage++){let nw=0;for(let n=0;n<N;n++){startDuel(stage,'noah',true);duel.noah='cpu';swipeMode=SW;duel.cpu.k=k;duel.nbag=tr?[0,1,2].map(()=>({k:tr,armed:false})):[];RS=(stage*7919+n*104729+1)>>>0;let f=0,won=false;
   while(state==='play'&&f<60*240){if(!duel.nbag.some(e=>e.armed)&&duel.nbag.length)duel.nbag[0].armed=true;NOW+=1/60;step(1/60);f++;if(collected>=need){won=true;break;}}if(won)nw++;}row.push(Math.round(nw/N*100));}res.push([k,tr||'none',row]);}
 goMenu();return res;},{KS,N,SW});
console.log('Noah win % at stages 1..10, N='+N+(SW?' SWIPE':' PUSH'));for(const r of out)console.log(('skill '+r[0]+' '+r[1]).padEnd(18)+r[2].map(v=>(v+'%').padStart(6)).join('')+'   mean '+Math.round(r[2].reduce((a,c)=>a+c)/10));
if(errs.length)console.log(errs);await b.close();})();
