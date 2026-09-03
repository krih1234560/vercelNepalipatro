/* Shared dark mode: one control in the navbar, remembered on every page. */
(function () {
  'use strict';
  var KEY='nepalipatro-theme';
  var moon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var sun='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  function saved(){try{return localStorage.getItem(KEY)==='dark';}catch(e){return false;}}
  function persist(v){try{localStorage.setItem(KEY,v?'dark':'light');}catch(e){}}
  function apply(v){
    document.body.classList.toggle('dark-mode',v);
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.content=v?'#0b1a2e':'#f5f7fb';
    document.dispatchEvent(new CustomEvent('themechange',{detail:{dark:v}}));
  }
  function init(){
    var nav=document.querySelector('.navbar .nav, nav.nav, .nav');
    if(!nav) return;
    var btn=document.getElementById('globalThemeToggle') || document.createElement('button');
    btn.type='button'; btn.id='globalThemeToggle'; btn.className='global-theme-toggle';
    btn.setAttribute('aria-label','Toggle dark mode'); btn.title='Toggle dark mode';
    var dark=saved(); apply(dark); btn.innerHTML=dark?sun:moon;
    if(!btn.parentNode) nav.appendChild(btn);
    btn.addEventListener('click',function(){dark=!dark;apply(dark);persist(dark);btn.innerHTML=dark?sun:moon;});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
