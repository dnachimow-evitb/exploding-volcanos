// A whole match between two game pages through a local relay, both sides played with real pointer input.
const {launch}=require('./lib2.js');const RELAY=process.argv[2];
(async()=>{const L=await launch(RELAY),A=await L.page('A'),B=await L.page('B');
await A.ev(()=>{PF.list[0].name='Dad';PF.list[0].mxTut=1;});await B.ev(()=>{PF.list[0].name='Kid';PF.list[0].icon='🦕';PF.list[0].wear=['hat','goggles'];PF.list[0].gear=['hat','goggles'];});
await A.tap(23);await A.tap(0);await A.tap(0);await A.tap(0,900);const code=await A.ev(()=>net.code);
await B.tap(23);await B.tap(0);await B.tap(2);for(const ch of code)await B.tap(220+'BCDFGHJKLMNPQRSTVWXZ'.indexOf(ch),100);await B.tap(0,1200);
console.log('lobby: A',await A.ev(()=>net.st+' '+net.side+' stage '+net.stage),'| B',await B.ev(()=>net.st+' '+net.side+' stage '+net.stage));
await A.tap(201,300);await A.tap(201,300);await A.tap(200,400);console.log('stage after host changes: A',await A.ev(()=>net.stage),'B',await B.ev(()=>net.stage));await A.shot('x1');await B.shot('x2');
await A.tap(0,1200);console.log('after Play: A',await A.ev(()=>state+' net='+duel.net+' role='+duel.role),'| B',await B.ev(()=>state+' net='+duel.net+' role='+duel.role));
console.log('same toys in the same places:',JSON.stringify(await A.ev(()=>objs.map(o=>o.em+Math.round(o.x)).join()))===JSON.stringify(await B.ev(()=>objs.map(o=>o.em+Math.round(o.x)).join())),await A.ev(()=>objs.length));
await A.tap(0,700);console.log('A ready:',await A.ev(()=>state),'B still',await B.ev(()=>state));await A.shot('x3');
await B.tap(0,500);await B.tap(0,1200);console.log('both go: A',await A.ev(()=>state),'B',await B.ev(()=>state));
const ba=await A.p.locator('#c').boundingBox(),K=await A.ev(()=>KS);
// B plays Noah (press the toy furthest from Max, hold until green, let go); A steers Max onto the wind-up it sees
await A.p.mouse.move(ba.x+190*K,ba.y+650*K);await A.p.mouse.down();
let stop=false,log=[];const follow=(async()=>{while(!stop){const q=await A.ev(()=>({st:state,cx:charging?crossX(charging.o):null}));if(q.st!=='play')break;if(q.cx!=null)await A.p.mouse.move(ba.x+q.cx*K,ba.y+650*K,{steps:2});await A.p.waitForTimeout(60);}})();
let shots=0;for(let n=0;n<60;n++){const st=await B.ev(()=>state);if(st!=='play')break;
 const t=await B.ev(()=>{const fl=objs.filter(q=>q.st==='float'&&!q.hb);if(!fl.length)return null;const o=fl.reduce((a,c)=>Math.abs(crossX(c)-blk.x)>Math.abs(crossX(a)-blk.x)?c:a);return{x:o.x*KS,y:(o.y+OY)*KS};});
 if(!t){await B.p.waitForTimeout(300);continue;}
 await B.p.mouse.move(ba.x+t.x,ba.y+t.y);await B.p.mouse.down();for(let i=0;i<70;i++){if(await B.ev(()=>wasOn||!charging))break;await B.p.waitForTimeout(30);}
 if(n===1){const a=await A.ev(()=>({ch:charging?charging.o.id+':'+charging.c.toFixed(2):null,bx:Math.round(blk.x),tl:timeLeft.toFixed(1),o:objs.map(o=>Math.round(o.x)).join()})),b=await B.ev(()=>({ch:charging?charging.o.id+':'+charging.c.toFixed(2):null,bx:Math.round(blk.x),tl:timeLeft.toFixed(1),o:objs.map(o=>Math.round(o.x)).join()}));console.log('mid wind-up  A sees',JSON.stringify(a),'\\n             B has ',JSON.stringify(b));await A.shot('x4');await B.shot('x5');}
 await B.p.mouse.up();await B.p.waitForTimeout(1000);
 if(n===3){await A.p.mouse.up();const q=await A.ev(()=>{const b=duelBar().find(b=>b.free);return b?{x:(b.x+b.w/2)*KS,y:(b.y+b.h/2)*KS}:null;});if(q){await A.p.mouse.click(ba.x+q.x,ba.y+q.y);await A.p.waitForTimeout(500);console.log('A used Big Splash: B wave',await B.ev(()=>duel.wave>0),'B toys',await B.ev(()=>objs.filter(o=>o.st==='float').map(o=>Math.round(o.x)).join()));await B.shot('x6');}await A.p.mouse.move(ba.x+190*K,ba.y+650*K);await A.p.mouse.down();}
 if(n%4===2)console.log(' t',await B.ev(()=>timeLeft.toFixed(0)),'B: in',await B.ev(()=>collected+'/'+need+' blocks '+duel.blocks),'| A: in',await A.ev(()=>collected+'/'+need+' blocks '+duel.blocks+' e '+duel.mx.e.toFixed(2)),'| B sees Max e',await B.ev(()=>duel.mx.e.toFixed(2)+' x '+Math.round(blk.x)),'A x',await A.ev(()=>Math.round(blk.x)));}
stop=true;await follow;await A.p.mouse.up();
for(let i=0;i<24;i++){if(await A.ev(()=>state)==='duelend'&&await B.ev(()=>state)==='duelend')break;await A.p.waitForTimeout(500);}await A.p.waitForTimeout(1300);
console.log('END  A',JSON.stringify(await A.ev(()=>({st:state,over:duel.over,c:collected,n:need,blocks:duel.blocks,earned:duel.earned.length,best:PF.list[0].mxBest}))),'\\n     B',JSON.stringify(await B.ev(()=>({st:state,over:duel.over,c:collected,n:need,blocks:duel.blocks,earned:duel.earned.length,nh:PF.list[0].nhBest}))));
await A.shot('x7');await B.shot('x8');
// Play Again brings both back to the Connected card; then a second match where B's phone vanishes mid-match
await B.tap(0,900);console.log('again: A',await A.ev(()=>state+' '+(net&&net.st)),'B',await B.ev(()=>state+' '+(net&&net.st)));
await A.tap(2,400);console.log('swapped: A',await A.ev(()=>net.side),'B',await B.ev(()=>net.side));await A.tap(2,400);
await A.tap(0,1200);await A.tap(0,600);await B.tap(0,500);await B.tap(0,1500);console.log('match 2: A',await A.ev(()=>state),'B',await B.ev(()=>state));
await B.p.close();await A.p.waitForTimeout(2500);console.log('B gone: A',JSON.stringify(await A.ev(()=>({st:state,net:duel.net,noah:duel.noah,banner,netObj:net===null}))));
await A.p.waitForTimeout(4000);console.log('computer Noah is throwing:',await A.ev(()=>!!charging||objs.some(o=>o.st==='fly')||collected>0||duel.blocks>0));
console.log('errors',L.errs);await L.b.close();})();
