// shared: open the test page from disk (no server), tap real buttons by id
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const ROOT='/home/user/exploding-volcanos',MIME={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
exports.open=async(w=375,h=812,scale=2)=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:scale});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push(m.text());});
 await p.route('**/*',r=>{const u=new URL(r.request().url()),f=path.join(ROOT,decodeURIComponent(u.pathname));if(u.hostname==='game.test'&&fs.existsSync(f)&&fs.statSync(f).isFile())r.fulfill({body:fs.readFileSync(f),contentType:MIME[path.extname(f)]||'application/octet-stream'});else r.fulfill({status:404,body:''});});
 await p.goto('http://game.test/play-test.html');await p.waitForTimeout(2500);
 const tap=async(id,wait=600)=>{const r=await p.evaluate(id=>{const h=[card,card2,card3,card4,...hits].find(b=>b&&(b.id||0)===id);return h?{x:(h.x+h.w/2)*KS,y:(h.y+h.h/2)*KS}:null;},id);if(!r)throw new Error('no hit '+id);const bb=await p.locator('#c').boundingBox();await p.mouse.click(bb.x+r.x,bb.y+r.y);await p.waitForTimeout(wait);};
 return{b,p,errs,tap};};
