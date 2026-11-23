// two (or more) game pages in one browser, served from disk as http://localhost:1234, talking to a LOCAL relay
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const ROOT='/home/user/exploding-volcanos',MIME={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
exports.launch=async(relay)=>{const b=await chromium.launch({args:['--no-proxy-server','--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests']});const errs=[];
 const page=async(name)=>{const ctx=await b.newContext({viewport:{width:375,height:812},deviceScaleFactor:2});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/404|WebSocket/.test(m.text()))errs.push(name+': '+m.text());});
  await p.addInitScript(r=>{window.RELAY_URL=r;},relay);
  await p.route('**/*',r=>{const u=new URL(r.request().url()),f=path.join(ROOT,decodeURIComponent(u.pathname));if(u.hostname==='localhost'&&fs.existsSync(f)&&fs.statSync(f).isFile())r.fulfill({body:fs.readFileSync(f),contentType:MIME[path.extname(f)]||'application/octet-stream'});else r.fulfill({status:404,body:''});});
  await p.goto('http://localhost:1234/play-test.html');await p.waitForTimeout(2300);
  const tap=async(id,wait=500)=>{const r=await p.evaluate(id=>{const h=[card,card2,card3,card4,...hits].find(b=>b&&(b.id||0)===id);return h?{x:(h.x+h.w/2)*KS,y:(h.y+h.h/2)*KS}:null;},id);if(!r)throw new Error(name+': no button '+id);const bb=await p.locator('#c').boundingBox();await p.mouse.click(bb.x+r.x,bb.y+r.y);await p.waitForTimeout(wait);};
  return{p,tap,ev:f=>p.evaluate(f),shot:n=>p.screenshot({path:__dirname+'/'+n+'.png'})};};
 return{b,errs,page};};
