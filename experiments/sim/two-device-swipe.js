// Two pages: Max stands still, Noah flicks (Swipe) and should win; both devices must agree, and the joiner hosts nothing.
const {launch}=require('./lib2.js');const RELAY=process.argv[2];
(async()=>{const L=await launch(RELAY),A=await L.page('A'),B=await L.page('B');
await A.ev(()=>{PF.list[0].mxTut=1;});await B.ev(()=>{PF.list[0].mxTut=1;});
// this time the HOST is Noah and the joiner is Max
await A.tap(23);await A.tap(0);await A.tap(0);await A.tap(2,900);const code=await A.ev(()=>net.code);
await B.tap(23);await B.tap(0);await B.tap(2);for(const ch of code)await B.tap(220+'BCDFGHJKLMNPQRSTVWXZ'.indexOf(ch),100);await B.tap(0,1200);
console.log('sides: A',await A.ev(()=>net.side),'B',await B.ev(()=>net.side));
await A.tap(0,1200);console.log('prep: A',await A.ev(()=>state+' '+duel.net),'B',await B.ev(()=>state+' '+duel.net));
await A.tap(2,600);console.log('A chose Swipe, waits:',await A.ev(()=>state+' swipe='+swipeMode));await B.tap(0,1300);console.log('go: A',await A.ev(()=>state),'B',await B.ev(()=>state+' swipe='+swipeMode));
const ba=await A.p.locator('#c').boundingBox();let ring=false;
for(let n=0;n<40;n++){if(await A.ev(()=>state)!=='play')break;const t=await A.ev(()=>{const o=objs.find(q=>q.st==='float'&&!q.hb);return o?{x:o.x*KS,y:(o.y+OY)*KS}:null;});if(!t){await A.p.waitForTimeout(300);continue;}
 await A.p.mouse.move(ba.x+t.x,ba.y+t.y);await A.p.mouse.down();await A.p.waitForTimeout(220);if(!ring){ring=await B.ev(()=>!!charging&&swipeMode);if(ring){await B.shot('y1');console.log('Max sees the finger on the toy (the tell):',ring);}}
 await A.p.mouse.move(ba.x+t.x+(187-t.x)*.5,ba.y+t.y-150,{steps:5});await A.p.mouse.up();await A.p.waitForTimeout(1500);
 if(n<3)console.log(' in: A',await A.ev(()=>collected+'/'+need+' miss '+rdMiss+' blocks '+duel.blocks+' objs '+objs.map(o=>o.st[0]+Math.round(o.x)+','+Math.round(o.y)).join(' ')),'| B',await B.ev(()=>collected+'/'+need+' blocks '+duel.blocks+' max '+Math.round(blk.x)));}
for(let i=0;i<30;i++){if(await A.ev(()=>state)==='duelend'&&await B.ev(()=>state)==='duelend')break;await A.p.waitForTimeout(500);}await A.p.waitForTimeout(1200);
console.log('END  A',JSON.stringify(await A.ev(()=>({st:state,over:duel.over,c:collected,n:need}))),' B',JSON.stringify(await B.ev(()=>({st:state,over:duel.over,c:collected,n:need}))));await B.shot('y2');
// Max's device leaves from the result card; Noah's device must cope
await B.tap(3,900);console.log('B left: A',await A.ev(()=>state+' net='+duel.net+' netObj='+(net===null)));await A.tap(0,700);console.log('A Home ->',await A.ev(()=>state));
console.log('errors',L.errs);await L.b.close();})();
