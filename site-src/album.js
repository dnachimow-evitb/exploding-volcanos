// Album page: tapping a track loads Suno's own embed player for it. Nothing from Suno loads before a tap.
(function(){
  var stage=document.getElementById('stage'),list=document.getElementById('tracks');if(!stage||!list)return;
  list.addEventListener('click',function(e){
    var b=e.target.closest('.trk');if(!b)return;
    [].forEach.call(list.querySelectorAll('.trk'),function(x){x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b?'true':'false');});
    var f=document.createElement('iframe');
    f.src='https://suno.com/embed/'+b.getAttribute('data-id');f.title='Player: '+b.getAttribute('data-title');
    f.setAttribute('allow','autoplay; encrypted-media');f.setAttribute('loading','eager');
    stage.innerHTML='';stage.appendChild(f);stage.classList.add('live');
    if(window.innerWidth<1020)stage.scrollIntoView({behavior:'smooth',block:'center'});
  });
})();
