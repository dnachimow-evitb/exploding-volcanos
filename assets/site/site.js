// Story website: the hamburger menu (phones and narrow windows). Shared by story.html and album.html.
(function(){
  var btn=document.getElementById('menubtn'),menu=document.getElementById('menu');
  if(!btn||!menu)return;
  function set(open){menu.hidden=!open;menu.classList.toggle('open',open);btn.setAttribute('aria-expanded',open?'true':'false');btn.setAttribute('aria-label',open?'Close menu':'Menu');}
  btn.addEventListener('click',function(e){e.stopPropagation();set(!menu.classList.contains('open'));});
  menu.addEventListener('click',function(e){if(e.target.closest('a'))set(false);});
  document.addEventListener('click',function(e){if(menu.classList.contains('open')&&!e.target.closest('.bar'))set(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&menu.classList.contains('open')){set(false);btn.focus();}});
  window.addEventListener('resize',function(){if(window.innerWidth>1020)set(false);});
})();

// Links between the site's own pages carry the site version (?v=N), so following one always fetches the current
// page and never an old copy a phone has saved. Section links within the same page are left alone.
(function(){
  var v=document.documentElement.getAttribute('data-v');if(!v)return;
  var here=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('a[href]').forEach(function(a){
    var m=(a.getAttribute('href')||'').match(/^(story\.html|album\.html)(#.*)?$/);
    if(m&&m[1]!==here)a.setAttribute('href',m[1]+'?v='+v+(m[2]||''));
  });
})();

// Side rail (wide screens): light up the part of the story that is on screen.
(function(){
  var links=document.querySelectorAll('.rail a[data-s]');if(!links.length||!('IntersectionObserver' in window))return;
  var order=[].map.call(links,function(a){return a.getAttribute('data-s');}),seen={};
  function paint(){var cur=null;order.forEach(function(id){if(seen[id])cur=id;});[].forEach.call(links,function(a){a.classList.toggle('on',a.getAttribute('data-s')===cur);});}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){seen[e.target.id]=e.isIntersecting;});paint();},{rootMargin:'-45% 0px -45% 0px'});
  order.forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el);});
})();
