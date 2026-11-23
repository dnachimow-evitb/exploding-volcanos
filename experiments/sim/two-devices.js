const {launch}=require('./lib2.js') // two or three game pages against a LOCAL relay: start it in relay/ with `npx wrangler dev --ip 127.0.0.1 --port 8794 --local`, then `node two-devices.js ws://127.0.0.1:8794`;const RELAY=process.argv[2];
(async()=>{const L=await launch(RELAY),A=await L.page('A'),B=await L.page('B');const st=x=>x.ev(()=>net?net.st+(net.err?':'+net.err:''):'none');
await A.ev(()=>{PF.list[0].name='Dad';});await B.ev(()=>{PF.list[0].name='Noah';PF.list[0].icon='🦕';});
// menu
await A.tap(23);await A.shot('w0');await A.tap(0);await A.shot('w1');
// A starts a game as Max
await A.tap(0);await A.shot('w2');await A.tap(0,900);const code=await A.ev(()=>net.code);console.log('A',await st(A),'code',code,/^[BCDFGHJKLMNPQRSTVWXZ]{4}$/.test(code));await A.shot('w3');
// B joins with a wrong code first
await B.tap(23);await B.tap(0);await B.tap(2);await B.shot('w4');
const type=async(x,c)=>{for(const ch of c){await x.tap(220+'BCDFGHJKLMNPQRSTVWXZ'.indexOf(ch),120);}};
const wrong=code==='BBBB'?'CCCC':'BBBB';await type(B,wrong);await B.tap(0,1200);console.log('B wrong code ->',await st(B));await B.shot('w5');await B.tap(0);
// then the right one, with a mistake corrected by erase
await B.tap(2);await type(B,code.slice(0,3)+'Z');await B.tap(241,150);await type(B,code[3]);await B.tap(0,1300);
console.log('paired: A',await st(A),JSON.stringify(await A.ev(()=>({side:net.side,peer:net.peer}))),'| B',await st(B),JSON.stringify(await B.ev(()=>({side:net.side,peer:net.peer}))));
await A.shot('w6');await B.tap(0,600);await A.shot('w7');console.log('A saw the wave:',await A.ev(()=>!!net.wave&&NOW-net.wave<2));
// a third phone cannot get in
const C=await L.page('C');await C.tap(23);await C.tap(0);await C.tap(2);await type(C,code);await C.tap(0,1200);console.log('C third ->',await st(C));await C.tap(0);
// B leaves: A goes back to waiting with the same code, and C can now join
await B.tap(7,900);console.log('B left: A',await st(A),JSON.stringify(await A.ev(()=>net.note)),'same code',code===await A.ev(()=>net.code));
await C.tap(2);await type(C,code);await C.tap(0,1300);console.log('C joins the free place: A',await st(A),'C',await st(C),await C.ev(()=>net.side));
// A (host) leaves: C is told
await A.tap(7,900);console.log('A left: C',await st(C));await C.tap(0);
// Quick Match: A wants Max, B wants Max (must NOT pair), C wants Noah (pairs with A, who waited longest)
await A.tap(3);await A.tap(0,700);await B.tap(3);await B.tap(0,900);console.log('two Maxes waiting: A',await st(A),'B',await st(B));await A.shot('w8');
await C.tap(3);await C.tap(2,2500);console.log('quick: A',await st(A),await A.ev(()=>net.side+' sees name "'+net.peer.name+'" toy '+net.peer.icon),'| C',await st(C),await C.ev(()=>net.side+' sees name "'+net.peer.name+'"'),'| B',await st(B));
await A.shot('w9');
// cancel while looking, then close the card: nothing left connected
await B.tap(7,500);console.log('B cancelled ->',await st(B));await A.ev(()=>goMenu());await C.ev(()=>goMenu());console.log('after going home: A',await st(A),'C',await st(C));
console.log('errors',L.errs);await L.b.close();})();
