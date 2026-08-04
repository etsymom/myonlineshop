(function(global){
  'use strict';
  function initials(name){return String(name||'Creator').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'C'}
  function setImage(img,url,name){
    const fallback=img?.parentElement?.querySelector('.profile-avatar-fallback');
    if(fallback)fallback.textContent=initials(name);
    if(!img)return;if(!url){img.removeAttribute('src');img.style.display='none';return}
    img.style.display='block';img.onerror=()=>{img.style.display='none'};img.src=url;
  }
  function render(data){
    const name=data.name||'Creator',username=data.username||('@'+name.replace(/\s+/g,'').toLowerCase());
    document.getElementById('creator-name-title').textContent=name;
    document.getElementById('creator-username').textContent=username.startsWith('@')?username:'@'+username;
    document.getElementById('creator-category').textContent=data.category||'';
    document.getElementById('creator-desc').textContent=data.bio||'This creator has not added a bio yet.';
    document.getElementById('verified-badge').classList.toggle('is-visible',!!data.verified);
    document.getElementById('verified-badge').setAttribute('aria-hidden',String(!data.verified));
    document.getElementById('stat-subscribers').textContent=Number(data.subscribers||0).toLocaleString();
    setImage(document.getElementById('profile-avatar'),data.avatar,name);setImage(document.getElementById('sub-avatar'),data.avatar,name);
    const cover=document.getElementById('profile-cover');
    cover.style.backgroundImage=data.cover?`url("${String(data.cover).replace(/"/g,'%22')}")`:'linear-gradient(135deg,#2d1b4e,#6d4893)';
    document.getElementById('about-name').textContent='About '+name;
    document.getElementById('about-copy').textContent=data.fullBio||data.bio||'More from this creator is coming soon.';
  }
  function creatorLogin(){const dynamic=document.getElementById('creator-login-dynamic');if(dynamic)return dynamic.click();location.href='join-beta.html'}
  function moveSettings(){const host=document.getElementById('profile-settings');if(!host)return;['currencyPicker','languagePicker'].forEach(id=>{const el=document.getElementById(id);if(el&&el.parentElement!==host)host.appendChild(el)})}
  document.addEventListener('DOMContentLoaded',()=>{moveSettings();const observer=new MutationObserver(moveSettings);observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),5000)});
  global.CreatorProfileUI={render,creatorLogin,moveSettings};
})(window);
