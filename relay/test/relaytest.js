// Tests the relay with real WebSocket clients. Run it against a local copy: in relay/, `npx wrangler dev --ip 127.0.0.1 --port 8791 --local`,
// then `node test/relaytest.js ws://127.0.0.1:8791` (needs `npm install ws`). All 13 checks passed on 2026-11-18 (wrangler 4.164.0).
const WebSocket=require('ws');const BASE=process.argv[2]||'ws://127.0.0.1:8787',OK='https://dnachimow-evitb.github.io';
const conn=(code,role,origin=OK)=>new Promise(res=>{const ws=new WebSocket(BASE+'/room/'+code+'?role='+role,{headers:{Origin:origin}});const o={ws,msgs:[],closed:null,err:null};ws.on('message',d=>o.msgs.push(d.toString()));ws.on('close',(c,r)=>{o.closed=[c,r.toString()];});ws.on('error',e=>{o.err=String(e.message);res(o);});ws.on('open',()=>setTimeout(()=>res(o),250));ws.on('unexpected-response',(rq,rs)=>{o.err='http '+rs.statusCode;res(o);});});
const wait=ms=>new Promise(r=>setTimeout(r,ms));let fail=0;const check=(name,ok,got)=>{console.log((ok?'PASS ':'FAIL ')+name+(ok?'':'  got '+JSON.stringify(got)));if(!ok)fail++;};
(async()=>{
 const j0=await conn('ABCD','join');await wait(200);check('join with no host is refused 4004',j0.closed&&j0.closed[0]===4004&&j0.msgs.some(m=>m.includes('"code":4004')),[j0.closed,j0.msgs]);
 const h=await conn('ABCD','host');check('host gets room count 1',h.msgs.includes('{"_":"room","n":1}'),h.msgs);
 const h2=await conn('ABCD','host');await wait(200);check('second host on the same code is refused 4009',h2.closed&&h2.closed[0]===4009,h2.closed);
 const g=await conn('ABCD','join');await wait(200);check('both told count 2',h.msgs.includes('{"_":"room","n":2}')&&g.msgs.includes('{"_":"room","n":2}'),[h.msgs,g.msgs]);
 const g3=await conn('ABCD','join');await wait(200);check('third device is refused 4003',g3.closed&&g3.closed[0]===4003,g3.closed);
 h.ws.send('{"a":1}');g.ws.send('{"b":2}');await wait(300);check('host -> guest relayed, not echoed',g.msgs.includes('{"a":1}')&&!h.msgs.includes('{"a":1}'),[h.msgs,g.msgs]);check('guest -> host relayed',h.msgs.includes('{"b":2}'),h.msgs);
 h.ws.send('x'.repeat(5000));await wait(300);check('oversized message dropped',!g.msgs.some(m=>m.length>4096),g.msgs.map(m=>m.length));
 const other=await conn('WXYZ','host');h.ws.send('{"only":"ABCD"}');await wait(300);check('rooms are separate',!other.msgs.includes('{"only":"ABCD"}'),other.msgs);
 g.ws.close();await wait(400);check('host told the guest left (count 1)',h.msgs[h.msgs.length-1]==='{"_":"room","n":1}',h.msgs);
 const g4=await conn('ABCD','join');await wait(200);check('a new guest can take the free place',g4.msgs.includes('{"_":"room","n":2}'),g4.msgs);
 const bad=await conn('ABCD','join','https://evil.example');check('other websites are refused (403)',bad.err==='http 403'||/403/.test(bad.err||''),bad.err);
 const low=await conn('abcd','host');check('a bad code is refused (404)',/404/.test(low.err||''),low.err);
 for(const o of[h,g4,other])o.ws.close();await wait(300);console.log(fail?fail+' FAILED':'ALL PASSED');process.exit(fail?1:0);})();
