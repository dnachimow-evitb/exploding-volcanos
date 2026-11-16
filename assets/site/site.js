// Story website: the hamburger menu (phones and narrow windows). Shared by story.html and album.html.
(function(){
  var btn=document.getElementById('menubtn'),menu=document.getElementById('menu');
  if(!btn||!menu)return;
  function set(open){menu.classList.toggle('open',open);btn.setAttribute('aria-expanded',open?'true':'false');btn.setAttribute('aria-label',open?'Close menu':'Menu');}
  btn.addEventListener('click',function(e){e.stopPropagation();set(!menu.classList.contains('open'));});
  menu.addEventListener('click',function(e){if(e.target.closest('a'))set(false);});
  document.addEventListener('click',function(e){if(menu.classList.contains('open')&&!e.target.closest('.bar'))set(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&menu.classList.contains('open')){set(false);btn.focus();}});
  window.addEventListener('resize',function(){if(window.innerWidth>1020)set(false);});
})();
