// Noah's tricks over the connection: two game pages through a local relay; B is Noah and uses Decoy Duck, Rocket Throw and Double Throw.
const {launch}=require('./lib2.js');const RELAY=process.argv[2];
(async()=>{const L=await launch(RELAY),A=await L.page('A'),B=await L.page('B');
await A.ev(()=>{PF.list[0].name='Dad';PF.list[0].mxTut=1;});
await A.tap(23);await A.tap(0);await A.tap(0);await A.tap(0,900);const code=await A.ev(()=>net.code);
await B.tap(23);await B.tap(0);await B.tap(2);for(const ch of code)await B.tap(220+'BCDFGHJKLMNPQRSTVWXZ'.indexOf(ch),100);await B.tap(0,1200);
await A.tap(201,300);await A.tap(201,300);await A.tap(0,1200);console.log('A',await A.ev(()=>state+' '+duel.role),'| B',await B.ev(()=>state+' '+duel.role));
await A.tap(0,700);await B.tap(0,600);console.log('B after Push:',await B.ev(()=>state));await B.tap(160,200);await B.tap(161,200);await B.tap(162,200);await B.shot('y1');await B.tap(0,1500);
console.log('go: A',await A.ev(()=>state),'B',await B.ev(()=>state+' '+JSON.stringify(duel.nbag)));
const ba=await A.p.locator('#c').boundingBox(),K=await A.ev(()=>KS);
const use=async k=>{const q=await B.p.evaluate(k=>{const b=duelBar().find(b=>b.k===k&&!b.armed);return b?{x:(b.x+b.w/2)*KS,y:(b.y+b.h/2)*KS}:null;},k);await B.p.mouse.click(ba.x+q.x,ba.y+q.y);await B.p.waitForTimeout(200);};
// near: throw the toy whose path passes closest to Max (so he blocks it); far: the one furthest from him
const thr=async near=>{const t=await B.p.evaluate(near=>{const fl=objs.filter(q=>q.st==='float'&&!q.hb);const d=c=>Math.abs(crossX(c)-blk.x),o=fl.reduce((a,c)=>(near?d(c)<d(a):d(c)>d(a))?c:a);return{x:o.x*KS,y:(o.y+OY)*KS,cx:crossX(o)};},near);await B.p.mouse.move(ba.x+t.x,ba.y+t.y);await B.p.mouse.down();for(let i=0;i<90;i++){if(await B.ev(()=>wasOn||!charging))break;await B.p.waitForTimeout(25);}await B.p.mouse.up();return t;};
const see=P=>P.ev(()=>JSON.stringify({fly:objs.filter(o=>o.st==='fly').map(o=>(o.dc?'DECOY':o.em)+(o.fast?' fast':'')+' y'+Math.round(o.y)),n:objs.filter(o=>!o.hb).length,c:collected,e:+duel.mx.e.toFixed(2),blocks:duel.blocks}));
// 1. decoy, with Max steered under it
const t=await B.p.evaluate(()=>{const fl=objs.filter(q=>q.st==='float'&&!q.hb);return crossX(fl[0]);});
await A.p.mouse.move(ba.x+190*K,ba.y+650*K);await A.p.mouse.down();
await use('decoy');const d=await thr(true);await A.p.mouse.move(ba.x+d.cx*K,ba.y+650*K,{steps:3});await B.p.waitForTimeout(120);
console.log('decoy in the air  A',await see(A),'\n                  B',await see(B));await A.shot('y2');
await B.p.waitForTimeout(1800);console.log('after the decoy   A',await see(A),'\n                  B',await see(B));
await A.p.mouse.move(ba.x+190*K,ba.y+650*K,{steps:3});await A.p.waitForTimeout(2500);
// 2. rocket, away from Max
await use('rocket');await thr(false);await B.p.waitForTimeout(120);console.log('rocket in the air A',await see(A),'\n                  B',await see(B));await A.shot('y3');
await B.p.waitForTimeout(2000);console.log('after the rocket  A',await see(A),'\n                  B',await see(B));
// 3. double
await use('double');await thr(false);await B.p.waitForTimeout(200);console.log('double in the air A',await see(A),'\n                  B',await see(B));await A.shot('y4');
await B.p.waitForTimeout(2500);console.log('after the double  A',await see(A),'\n                  B',await see(B));
console.log('B stock',await B.ev(()=>JSON.stringify([PF.list[0].pw.decoy,PF.list[0].pw.rocket,PF.list[0].pw.double])),'bar',await B.ev(()=>duelBar().length),'| A bar',await A.ev(()=>duelBar().map(b=>b.k).join()));
await A.p.mouse.up();console.log('errors',L.errs);await L.b.close();})();
