// The Noah player leaves mid-match (Home twice, or the page dies), in Push or Swipe, possibly mid wind-up: on Max's device the computer must throw and Max must still steer.
const {launch}=require('./lib2.js');const RELAY=process.argv[2];
(async()=>{for(const sw of[0,1])for(const how of['home','close','hide']){const L=await launch(RELAY),A=await L.page('A'),B=await L.page('B');
await A.ev(()=>{PF.list[0].mxTut=1;});
await A.tap(23);await A.tap(0);await A.tap(0);await A.tap(0,900);const code=await A.ev(()=>net.code);
await B.tap(23);await B.tap(0);await B.tap(2);for(const ch of code)await B.tap(220+'BCDFGHJKLMNPQRSTVWXZ'.indexOf(ch),100);await B.tap(0,1200);
await A.tap(201,200);await A.tap(201,200);await A.tap(0,1200);await A.tap(0,700);await B.tap(sw?2:0,500);await B.tap(0,1500);
const ba=await B.p.locator('#c').boundingBox(),K=await A.ev(()=>KS);
const t=await B.ev(()=>{const o=objs.filter(q=>q.st==='float'&&!q.hb)[0];return{x:o.x*KS,y:(o.y+OY)*KS};});await B.p.mouse.move(ba.x+t.x,ba.y+t.y);await B.p.mouse.down();await B.p.waitForTimeout(500);
if(how==='home')await B.ev(()=>goMenu());else if(how==='close')await B.p.close();else await B.ev(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'));});
await A.p.waitForTimeout(2500);const see=()=>A.ev(()=>JSON.stringify({st:state,net:duel&&duel.net,noah:duel&&duel.noah,sw:swipeMode,bx:Math.round(blk.x),ch:!!charging,fly:objs.filter(o=>o.st==='fly').length,c:collected,bl:duel&&duel.blocks,t:timeLeft.toFixed(1),banner}));
console.log((sw?'SWIPE ':'PUSH  ')+how,await see());
await A.p.mouse.move(ba.x+100*K,ba.y+650*K);await A.p.mouse.down();let act=0,x0=await A.ev(()=>blk.x);for(let i=0;i<60;i++){await A.p.waitForTimeout(100);if(await A.ev(()=>!!charging||objs.some(o=>o.st==='fly')))act++;}
console.log('   6 s later',await see(),'| Max steered',Math.round(x0),'->',await A.ev(()=>Math.round(blk.x)),'| computer Noah busy in',act,'of 60 looks');
if(L.errs.length)console.log('errors',L.errs);await L.b.close();}})();
