// Story website scripts, shared by every page built from site-src/. First: the hamburger menu.
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


// Side rail (wide screens): light up the part of the story that is on screen.
(function(){
  var links=document.querySelectorAll('.rail a[data-s]');if(!links.length||!('IntersectionObserver' in window))return;
  var order=[].map.call(links,function(a){return a.getAttribute('data-s');}),seen={};
  function paint(){var cur=null;order.forEach(function(id){if(seen[id])cur=id;});[].forEach.call(links,function(a){a.classList.toggle('on',a.getAttribute('data-s')===cur);});}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){seen[e.target.id]=e.isIntersecting;});paint();},{rootMargin:'-45% 0px -45% 0px'});
  order.forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el);});
})();

// Fade sections in as they scroll into view.
(function(){
  var els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){[].forEach.call(els,function(e){e.classList.add('in');});return;}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'});
  [].forEach.call(els,function(e){io.observe(e);});
})();
