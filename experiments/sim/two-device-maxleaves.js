// The Max player's device vanishes mid-match: on Noah's device the computer must take over Max and the match must go on.
const {launch}=require('./lib2.js');const RELAY=process.argv[2];
(async()=>{const L=await launch(RELAY),A=await L.page('A'),B=await L.page('B');
await A.ev(()=>{PF.list[0].mxTut=1;});
await A.tap(23);await A.tap(0);await A.tap(0);await A.tap(0,900);const code=await A.ev(()=>net.code);
await B.tap(23);await B.tap(0);await B.tap(2);for(const ch of code)await B.tap(220+'BCDFGHJKLMNPQRSTVWXZ'.indexOf(ch),100);await B.tap(0,1200);
for(let i=0;i<4;i++)await A.tap(201,150);await A.tap(0,1200);await A.tap(0,700);await B.tap(0,500);await B.tap(0,1500);console.log('go: A',await A.ev(()=>state+' '+duel.role),'B',await B.ev(()=>state+' '+duel.role));
const see=()=>B.ev(()=>JSON.stringify({st:state,net:duel.net,max:duel.max,bx:Math.round(blk.x),bob:objs.map(o=>o.y.toFixed(1)).join(),t:timeLeft.toFixed(1),banner,paused,c:collected}));
await B.p.waitForTimeout(1500);console.log('before',await see());
if(process.argv[3]==='home')await A.ev(()=>goMenu());else await A.p.close();await B.p.waitForTimeout(2500);console.log('A gone',await see());await B.p.waitForTimeout(1500);console.log('later ',await see());
const ba=await B.p.locator('#c').boundingBox();
for(let n=0;n<5;n++){const t=await B.ev(()=>{const o=objs.filter(q=>q.st==='float'&&!q.hb)[0];return{x:o.x*KS,y:(o.y+OY)*KS};});await B.p.mouse.move(ba.x+t.x,ba.y+t.y);await B.p.mouse.down();await B.p.waitForTimeout(400);console.log(' holding',await B.ev(()=>JSON.stringify({cx:charging&&Math.round(crossX(charging.o)),tx:duel.mx.tx,e:duel.mx.e,dive:duel.mx.dive,skip:duel.cmx.skip,hist:duel.cmx.hist.length,gx:duel.cmx.gx,pid:duel.pid,lock:!!duel.tut})),await see());for(let i=0;i<90;i++){if(await B.ev(()=>wasOn||!charging))break;await B.p.waitForTimeout(25);}await B.p.mouse.up();await B.p.waitForTimeout(1500);}
console.log('end',await see());await B.shot('ml');console.log('errors',L.errs);await L.b.close();})();
