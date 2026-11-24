// Reads a test log pasted by Derek (the "Log" button on the test start screen) and judges difficulty and fun per game and round.
//   node readlog.js log.txt
// Targets it measures against (DEVELOPER-GUIDE, "Tuning from real play"):
//   first-try win rate about 85% in round 1 falling to about 40% in round 10; a round should rarely take more than 3 tries;
//   a win should be close some of the time; a quit or a long stop right after a loss is a warning.
const fs=require('fs'),txt=fs.readFileSync(process.argv[2],'utf8'),rows=[];
for(const line of txt.split('\n')){const f=line.split('|').map(s=>s.trim());if(f.length<8||!/^v\d/.test(f[0]))continue;const r={v:f[0],when:f[1],game:f[2],round:+f[3].slice(1),res:f[4],sec:parseInt(f[5])};
 for(const q of f.slice(6)){const m=q.match(/^(\S+) (.*)$/);if(m)r[m[1]]=m[2];}
 if(r.in){const[a,b]=r.in.split('/').map(Number);r.got=a;r.need=b;}rows.push(r);}
if(!rows.length){console.log('no log lines found');process.exit(0);}
const num=x=>x==null||x==='-'?null:parseFloat(x),avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null,f1=x=>x==null?'  -':x.toFixed(1).padStart(4),pct=x=>x==null?'  -':(Math.round(x*100)+'%').padStart(4);
const target=r=>.85-(r-1)*.05,games=[...new Set(rows.map(r=>r.game))];
console.log(rows.length+' rounds, '+rows[0].when+' to '+rows[rows.length-1].when+', versions '+[...new Set(rows.map(r=>r.v))].join(' '));
const notes=[];
for(const g of games){const isMax=/max$|max-|^max/.test(g)&&!/smartmax/.test(g);console.log('\n'+g+'\n round plays  win  1st-try target tries  margin  tired still  felt');
 for(let rd=1;rd<=10;rd++){const R=rows.filter(r=>r.game===g&&r.round===rd);if(!R.length)continue;const done=R.filter(r=>r.res!=='QUIT'),W=R.filter(r=>r.res==='WIN'),first=done.filter(r=>num(r.try)===1),quits=R.filter(r=>r.res==='QUIT').length;
  // margin: how close the round was, 0 = decided at the very end, 1 = never in doubt. Max: share of toys Noah still needed. Noah: share of the clock left.
  const marg=avg(W.map(r=>/max/.test(g)&&!/smartmax/.test(g)?(r.need-r.got)/r.need:num(r.left)/Math.max(1,r.sec+num(r.left)))),maxTry=Math.max(0,...R.map(r=>num(r.try)||0)),felt=['easy','fun','hard'].map(k=>R.filter(r=>r.felt===k).length);
  const w1=first.length?first.filter(r=>r.res==='WIN').length/first.length:null,t=target(rd);
  console.log(' '+String(rd).padStart(4)+String(R.length).padStart(6)+' '+pct(done.length?W.length/done.length:null)+'   '+pct(w1)+'   '+pct(t)+'  '+String(maxTry).padStart(4)+'   '+f1(marg)+'   '+pct(avg(R.map(r=>num(r.tired)).filter(x=>x!=null).map(x=>x/100)))+' '+f1(avg(R.map(r=>num(r.still)).filter(x=>x!=null)))+'  '+(felt.some(x=>x)?'easy '+felt[0]+' fun '+felt[1]+' hard '+felt[2]:'-')+(quits?'  quits '+quits:''));
  const tag=g+' round '+rd+': ';
  if(first.length>=3&&w1>t+.25)notes.push(tag+'TOO EASY? first-try wins '+pct(w1).trim()+' against a target of '+pct(t).trim());
  if(first.length>=3&&w1<t-.25)notes.push(tag+'TOO HARD? first-try wins '+pct(w1).trim()+' against a target of '+pct(t).trim());
  if(maxTry>=4)notes.push(tag+'A WALL: took '+maxTry+' tries');
  if(W.length>=2&&marg!=null&&marg>.6)notes.push(tag+'NEVER IN DOUBT: wins had a margin of '+marg.toFixed(1));
  if(R.some(r=>num(r.still)>8&&r.res==='WIN'&&isMax))notes.push(tag+'PARKING: Max won after standing still '+Math.max(...R.map(r=>num(r.still)||0))+' s');
  if(felt[0]>felt[1]+felt[2]&&felt[0]>=2)notes.push(tag+'player says EASY ('+felt[0]+' of '+(felt[0]+felt[1]+felt[2])+')');
  if(felt[2]>felt[1]+felt[0]&&felt[2]>=2)notes.push(tag+'player says HARD ('+felt[2]+' of '+(felt[0]+felt[1]+felt[2])+')');}}
// stopping: the last round of a sitting (a gap over 3 minutes before the next, or the end of the log)
const stops=rows.filter((r,i)=>i===rows.length-1||num(rows[i+1].gap)==null||num(rows[i+1].gap)>180);
console.log('\nsittings: '+stops.length+'; they ended on: '+stops.map(r=>r.game+' r'+r.round+' '+r.res).join(', '));
const bad=stops.filter(r=>r.res!=='WIN').length;if(stops.length>=3&&bad/stops.length>.6)notes.push('STOPPING AFTER A LOSS: '+bad+' of '+stops.length+' sittings ended on a loss or a quit');
const pw={};rows.forEach(r=>(r.pw&&r.pw!=='-'?r.pw.split('+'):[]).concat(r.trk&&r.trk!=='-'?r.trk.split('+'):[]).forEach(k=>pw[k]=(pw[k]||0)+1));if(Object.keys(pw).length)console.log('powers and tricks used: '+Object.entries(pw).sort((a,b)=>b[1]-a[1]).map(e=>e[0]+' '+e[1]).join(', '));
console.log('\nWHAT STANDS OUT'+(notes.length?'':': nothing against the targets (or too few rounds: a flag needs 3 first tries at a round)'));notes.forEach(n=>console.log(' - '+n));
