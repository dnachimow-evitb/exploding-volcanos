// Summary of botlogs/*.txt (from runall.sh): for each mode and player, by round: first-try win %, share of games that cleared
// the round, average tries, and how close the wins were; then where players gave up.
const fs=require('fs'),dir=process.argv[2]||__dirname+'/botlogs';const pad=(x,n=5)=>String(x).padStart(n);
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.txt')).sort()){const rows=[];for(const line of fs.readFileSync(dir+'/'+f,'utf8').split('\n')){const q=line.split('|').map(s=>s.trim());if(q.length<8)continue;const r={round:+q[3].slice(1),res:q[4],sec:parseInt(q[5]),gave:/GAVEUP/.test(line)};for(const x of q.slice(6)){const m=x.match(/^(\S+) (.*)$/);if(m)r[m[1]]=m[2];}rows.push(r);}
 if(!rows.length){console.log(f+': empty');continue;}const S=Math.max(...rows.map(r=>+r.sess)),isMax=f.startsWith('max');
 const first=[],clear=[],tries=[],marg=[],blk=[];for(let rd=1;rd<=10;rd++){const R=rows.filter(r=>r.round===rd),F=R.filter(r=>r.try==='1'),W=R.filter(r=>r.res==='WIN');
  first.push(F.length?Math.round(100*F.filter(r=>r.res==='WIN').length/F.length):null);clear.push(Math.round(100*W.length/S));tries.push(W.length?(R.length/W.length).toFixed(1):'-');
  marg.push(W.length?Math.round(100*W.reduce((t,r)=>{const[a,b]=r.in.split('/').map(Number);return t+(isMax?(b-a)/b:parseFloat(r.left)/Math.max(1,r.sec+parseFloat(r.left)));},0)/W.length):null);
  blk.push(R.length?Math.round(R.reduce((t,r)=>t+parseFloat(r.blk||r.maxblk||0),0)/R.length):null);}
 const g=rows.filter(r=>r.gave).map(r=>r.round),gh={};g.forEach(r=>gh[r]=(gh[r]||0)+1);
 console.log('\n'+f.replace('.txt','')+'  ('+S+' games, '+rows.length+' rounds)');console.log('  round      '+[1,2,3,4,5,6,7,8,9,10].map(x=>pad(x)).join(''));
 console.log('  1st-try %  '+first.map(x=>pad(x==null?'-':x)).join(''));console.log('  cleared %  '+clear.map(x=>pad(x)).join(''));console.log('  tries/win  '+tries.map(x=>pad(x)).join(''));console.log('  margin %   '+marg.map(x=>pad(x==null?'-':x)).join('')+(isMax?'   (toys Noah still needed)':'   (clock left)'));console.log('  blocks     '+blk.map(x=>pad(x==null?'-':x)).join(''));
 console.log('  finished all ten: '+rows.filter(r=>r.round===10&&r.res==='WIN').length+' of '+S+'; gave up at: '+(Object.keys(gh).length?Object.entries(gh).map(e=>'r'+e[0]+' x'+e[1]).join(', '):'never'));}
