// main game regression: Push Easy round 1 scores with a real press-and-hold; Swipe Easy scores with a real swipe; round 4 Max sweeps by himself
const {open}=require('./lib.js');const S=__dirname;
(async()=>{const {b,p,errs,tap}=await open();const bb=await p.locator('#c').boundingBox();
const toy=()=>p.evaluate(()=>{const o=objs.find(q=>q.st==='float'&&!q.hb);return o?{x:o.x*KS,y:(o.y+OY)*KS}:null;});
await tap(0);await tap(0);await tap(0,900);await tap(0,1200); // Noah, Push, Easy, Let's Splash
let t=await toy();await p.mouse.move(bb.x+t.x,bb.y+t.y);await p.mouse.down();
for(let i=0;i<60;i++){if(await p.evaluate(()=>wasOn))break;await p.waitForTimeout(40);}await p.mouse.up();await p.waitForTimeout(1800);
console.log('push',JSON.stringify(await p.evaluate(()=>({collected,score,duel,blk:blk.on,toys:ST.toys}))));
await p.evaluate(()=>goMenu());await p.waitForTimeout(900);
await tap(0);await tap(2);await tap(0,900);await tap(0,1200); // Noah, Swipe, Easy
t=await toy();await p.mouse.move(bb.x+t.x,bb.y+t.y);await p.mouse.down();await p.mouse.move(bb.x+t.x+(187-t.x)*.5,bb.y+t.y-150,{steps:6});await p.mouse.up();await p.waitForTimeout(1900);
console.log('swipe',JSON.stringify(await p.evaluate(()=>({collected,misses:rdMiss,swipeMode}))));
await p.evaluate(()=>goMenu());await p.waitForTimeout(900);
for(let i=0;i<3;i++)await tap(6,200); // Rd 4
await tap(0);await tap(0);await p.screenshot({path:S+'/r_easy.png'});await tap(0,900);await tap(0,1200);
const x1=await p.evaluate(()=>blk.x);await p.waitForTimeout(700);const q=await p.evaluate(()=>({on:blk.on,x:blk.x,round,need,sink:duel}));console.log('round4',x1.toFixed(0),JSON.stringify(q));
await p.screenshot({path:S+'/r_r4.png'});
await p.evaluate(()=>goMenu());await p.setViewportSize({width:375,height:667});await p.waitForTimeout(1500);await p.screenshot({path:S+'/r_short.png'});
await tap(23);await p.screenshot({path:S+'/r_short2.png'});
console.log('errors',errs);await b.close();})();
