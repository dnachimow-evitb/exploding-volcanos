// Before a publish: a player who has been playing the LIVE game (game-fable-v7.js) opens the new build as the live page.
// Their saved players, coins, toys and badges must carry over, the test-only parts must be absent, and the game must play.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const ROOT='/home/user/exploding-volcanos',MIME={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.svg':'image/svg+xml','.webmanifest':'application/json'};
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:375,height:812},serviceWorkers:'block'}),p=await ctx.newPage();let NEW=false;const errs=[];
p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>{const u=new URL(r.request().url());let f=path.join(ROOT,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(u.hostname!=='game.test'||!fs.existsSync(f)||!fs.statSync(f).isFile())return r.fulfill({status:404,body:''});
 let body=fs.readFileSync(f);if(NEW&&/game-fable-v7\.js$/.test(f))body=fs.readFileSync(ROOT+'/game-test.js');r.fulfill({body,contentType:MIME[path.extname(f)]||'application/octet-stream'});});
const tap=async(id,w=600)=>{const r=await p.evaluate(id=>{const h=[card,card2,card3,card4,...hits].find(b=>b&&(b.id||0)===id);return h?{x:(h.x+h.w/2)*KS,y:(h.y+h.h/2)*KS}:null;},id);if(!r)throw new Error('no button '+id);const bb=await p.locator('#c').boundingBox();await p.mouse.click(bb.x+r.x,bb.y+r.y);await p.waitForTimeout(w);};
// 1. the live game as it is today: make a player with history
await p.goto('http://game.test/index.html');await p.waitForTimeout(2500);
await p.evaluate(()=>{const q=PF.list[0];q.name='Mia';q.coins=137;q.owned=['🐳'].filter(e=>ALL_TOYS.includes(e));Object.assign(q.st,{games:9,rounds:41,toys:260,wins:2,bestScore:3200,bestStreak:21,hair:12});PF.list.push({...JSON.parse(JSON.stringify(q)),name:'Sam',coins:5});pfSave();});
const old=await p.evaluate(()=>({v:VERSION,keys:Object.keys(localStorage),list:PF.list.map(q=>[q.name,q.coins,q.st.toys,q.st.wins,q.line.join('')])}));console.log('LIVE NOW',JSON.stringify(old));
// 2. the same browser opens the new build at the live address
NEW=true;await p.goto('http://game.test/index.html');await p.waitForTimeout(2500);
const nw=await p.evaluate(()=>({v:VERSION,TEST,list:PF.list.map(q=>[q.name,q.coins,q.st.toys,q.st.wins,q.line.join('')]),extra:PF.list.map(q=>[q.gear.length,q.wear.length,q.mxBest,q.mxTut,JSON.stringify(q.pw),q.st.mxBlocks]),badges:BADGES.length,logs:LOGS.length,relay:RELAY}));
console.log('NEW BUILD',JSON.stringify(nw));console.log('players, coins, toys, wins and lineup identical:',JSON.stringify(old.list)===JSON.stringify(nw.list));
console.log('test-only buttons on the start screen (must be none):',await p.evaluate(()=>hits.filter(h=>[17,6,26].includes(h.id)).length));
await p.screenshot({path:__dirname+'/live1.png'});
await tap(23);console.log('Multiplayer card test button present (must be false):',await p.evaluate(()=>[card,card2,card3,card4,...hits].some(h=>h&&h.id===2)));await tap(7);
// 3. play: original game one throw; Max game start; Smart Max start
await tap(0);await tap(0);await tap(0,900);await tap(0,1200);const bb=await p.locator('#c').boundingBox();const t=await p.evaluate(()=>{const o=objs.find(q=>q.st==='float');return{x:o.x*KS,y:(o.y+OY)*KS};});await p.mouse.move(bb.x+t.x,bb.y+t.y);await p.mouse.down();for(let i=0;i<60;i++){if(await p.evaluate(()=>wasOn))break;await p.waitForTimeout(40);}await p.mouse.up();await p.waitForTimeout(1800);
console.log('original game: toy in',await p.evaluate(()=>collected),'log lines',await p.evaluate(()=>LOGS.length));await p.evaluate(()=>goMenu());await p.waitForTimeout(900);
await tap(2);console.log('Max (first time goes to Max School):',await p.evaluate(()=>state+' tut='+!!(duel&&duel.tut)));await p.evaluate(()=>goMenu());await p.waitForTimeout(900);
await tap(0);await tap(0);await tap(25);await tap(0);await tap(0,3300);console.log('Smart Max:',await p.evaluate(()=>state+' rate row hits '+hits.filter(h=>h.id>=27&&h.id<=29).length));await p.evaluate(()=>goMenu());await p.waitForTimeout(600);
await p.reload();await p.waitForTimeout(2300);console.log('after reload:',JSON.stringify(await p.evaluate(()=>PF.list.map(q=>[q.name,q.coins]))),'storage keys',JSON.stringify(await p.evaluate(()=>Object.keys(localStorage))));
console.log('errors',errs);await b.close();})();
