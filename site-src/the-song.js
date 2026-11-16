// Song player
(function(){
  var a=document.getElementById('songaudio'),b=document.getElementById('playbtn'),f=document.getElementById('fill'),t=document.getElementById('time'),tr=document.getElementById('track'),
      ip=document.getElementById('ico-play'),iz=document.getElementById('ico-pause');
  function fmt(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+('0'+s%60).slice(-2);}
  function ui(){var on=!a.paused;ip.style.display=on?'none':'';iz.style.display=on?'':'none';b.setAttribute('aria-label',on?'Pause the song':'Play the song');}
  b.addEventListener('click',function(){if(a.paused)a.play().catch(function(){});else a.pause();});
  a.addEventListener('play',ui);a.addEventListener('pause',ui);a.addEventListener('ended',ui);
  a.addEventListener('timeupdate',function(){var d=a.duration||0,p=d?a.currentTime/d*100:0;f.style.width=p+'%';tr.setAttribute('aria-valuenow',Math.round(p));t.textContent=fmt(a.currentTime)+(d?' / '+fmt(d):'');});
  function seek(x){var r=tr.getBoundingClientRect(),d=a.duration;if(d)a.currentTime=Math.min(1,Math.max(0,(x-r.left)/r.width))*d;}
  tr.addEventListener('click',function(e){seek(e.clientX);});
  tr.addEventListener('keydown',function(e){if(!a.duration)return;if(e.key==='ArrowRight')a.currentTime=Math.min(a.duration,a.currentTime+5);if(e.key==='ArrowLeft')a.currentTime=Math.max(0,a.currentTime-5);});
})();
