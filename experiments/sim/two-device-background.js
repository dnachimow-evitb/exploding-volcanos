// One phone goes silent mid-match (asleep, app switched: its connection stays open but it says nothing).
// The other must not stand still: after 3 seconds of silence the computer takes over there. arg: which side goes silent.
const {launch}=require('./lib2.js');const RELAY=process.argv[2],WHO=process.argv[3]||'noah';
(async()=>{const L=await launch(RELAY),A=await L.page('A'),B=await L.page('B');
await A.ev(()=>{PF.list[0].mxTut=1;});
await A.tap(23);await A.tap(0);await A.tap(0);await A.tap(0,900);const code=await A.ev(()=>net.code);
await B.tap(23);await B.tap(0);await B.tap(2);for(const ch of code)await B.tap(220+'BCDFGHJKLMNPQRSTVWXZ'.indexOf(ch),100);await B.tap(0,1200);
for(let i=0;i<2;i++)await A.tap(201,150);await A.tap(0,1200);await A.tap(0,700);await B.tap(0,500);await B.tap(0,1500);
const F=WHO==='noah'?B:A,O=WHO==='noah'?A:B;
const see=P=>P.ev(()=>JSON.stringify({st:state,net:duel&&duel.net,noah:duel&&duel.noah,max:duel&&duel.max,bx:Math.round(blk.x),busy:!!charging||objs.some(o=>o.st==='fly'),c:collected,t:timeLeft.toFixed(1),banner}));
await F.ev(()=>{netSend=()=>{};});
for(const s of[1,2.5,4.5,9]){await O.p.waitForTimeout(s===1?1000:s===2.5?1500:s===4.5?2000:4500);console.log(WHO+' silent '+s+' s: other sees',await see(O));}
console.log('the silent one, once its connection is cut:',await see(F));console.log('errors',L.errs);await L.b.close();})();
