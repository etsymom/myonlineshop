(function(){
'use strict';
function esc(v){const n=document.createElement('span');n.textContent=String(v||'');return n.innerHTML}
document.addEventListener('DOMContentLoaded',async()=>{
const id=new URLSearchParams(location.search).get('id');if(!id||!window.CuratedProfiles)return;
let p;try{p=CuratedProfiles.find((await CuratedProfiles.load()).profiles,id)}catch(_){return}
const albums=(p?.albums||[]).filter(a=>a.member_only),blogs=(p?.blogs||[]).filter(b=>b.member_only);if(!albums.length&&!blogs.length)return;
const main=document.getElementById('main-content');if(!main)return;const s=document.createElement('section');s.className='ux-card';s.style.marginTop='28px';
s.innerHTML='<p class="ux-kicker">Premium preview</p><h2>Inside the members-only library</h2><p class="ux-lead">See what this creator plans to offer when secure payments and entitlements launch after the closed beta.</p><div class="ux-grid" id="premium-preview-items"></div><div class="ux-status info" style="margin-top:18px">Demo only -- checkout is disabled and no payment will be taken.</div>';main.appendChild(s);
const root=s.querySelector('#premium-preview-items');
const cards=albums.map(a=>'<article class="ux-card" style="position:relative;overflow:hidden">'+(a.cover_src?'<img src="'+esc(a.cover_src)+'" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;filter:brightness(.52)">':'')+'<span class="ux-badge" style="position:absolute;top:18px;right:18px">Locked</span><h3>'+esc(a.title)+'</h3><p>'+esc(a.description)+'</p><p class="ux-meta">'+Number(a.media_count||0)+' premium items - R'+Number(a.price||0)+' planned monthly access</p><button class="ux-primary" type="button" disabled aria-disabled="true">Available after closed beta</button></article>');
root.innerHTML=cards.concat(blogs.map(b=>'<article class="ux-card"><span class="ux-badge">Members-only note</span><h3>'+esc(b.title)+'</h3><p>'+esc(b.summary)+'</p><button class="ux-ghost" type="button" disabled aria-disabled="true">Locked during beta</button></article>')).join('');
});
})();
