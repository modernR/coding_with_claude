(function(){
  var DOCS = window.__DOCS__ || [];
  var PART = window.__PARTNAME__ || "";
  var content = document.getElementById('content');
  var crumbEl = document.getElementById('crumb');
  var curDoc = 0;

  function docTitle(i){ var d=DOCS.find(function(x){return x.idx===i;}); return d?d.title:""; }

  // ---------- 문서 전환 ----------
  function showDoc(i, targetId){
    curDoc = i;
    document.querySelectorAll('.doc').forEach(function(a){
      a.style.display = (parseInt(a.dataset.doc,10)===i) ? '' : 'none';
    });
    // 사이드바 상태
    document.querySelectorAll('.toc-doc-btn').forEach(function(b){
      var on = parseInt(b.dataset.doc,10)===i;
      b.classList.toggle('active', on);
      b.classList.toggle('open', on);
    });
    document.querySelectorAll('.toc-sub').forEach(function(s){
      s.classList.toggle('open', parseInt(s.dataset.for,10)===i);
    });
    if(targetId){
      var el=document.getElementById(targetId);
      if(el){ el.scrollIntoView(); }
      content.scrollTop = content.scrollTop; // noop keep
    } else {
      content.scrollTop = 0;
    }
    updateCrumb();
    updateNavBtns();
    setActiveHeading(targetId);
  }

  function updateCrumb(sectionText){
    var html = '<b>'+escapeHtml(PART)+'</b>';
    html += '<span class="sep">›</span>'+escapeHtml(docTitle(curDoc));
    if(sectionText){ html += '<span class="sep">›</span>'+escapeHtml(sectionText); }
    crumbEl.innerHTML = html;
  }

  function updateNavBtns(){
    var idxs = DOCS.map(function(d){return d.idx;});
    var pos = idxs.indexOf(curDoc);
    document.getElementById('prevBtn').disabled = pos<=0;
    document.getElementById('nextBtn').disabled = pos>=idxs.length-1;
  }

  function setActiveHeading(id){
    document.querySelectorAll('.toc-l2,.toc-l3-a').forEach(function(a){ a.classList.remove('active'); });
    if(id){
      var a=document.querySelector('[data-target="'+id+'"]');
      if(a){ a.classList.add('active'); a.scrollIntoView({block:'nearest'}); }
    }
  }

  // ---------- 사이드바 클릭 ----------
  document.querySelectorAll('.toc-doc-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var i=parseInt(btn.dataset.doc,10);
      if(i===curDoc){ // 토글 접기/펴기
        btn.classList.toggle('open');
        document.querySelector('.toc-sub[data-for="'+i+'"]').classList.toggle('open');
      } else { showDoc(i); }
    });
  });
  document.querySelectorAll('.toc-l2,.toc-l3-a').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var i=parseInt(a.dataset.doc,10), t=a.dataset.target;
      if(i!==curDoc){ showDoc(i,t); } else {
        var el=document.getElementById(t); if(el) el.scrollIntoView();
        setActiveHeading(t); updateCrumb(a.textContent);
      }
    });
  });

  // ---------- 이전/다음 ----------
  document.getElementById('prevBtn').addEventListener('click',function(){
    var idxs=DOCS.map(function(d){return d.idx;}), p=idxs.indexOf(curDoc);
    if(p>0) showDoc(idxs[p-1]);
  });
  document.getElementById('nextBtn').addEventListener('click',function(){
    var idxs=DOCS.map(function(d){return d.idx;}), p=idxs.indexOf(curDoc);
    if(p<idxs.length-1) showDoc(idxs[p+1]);
  });

  // ---------- 스크롤 스파이(현재 섹션 → 브레드크럼/목차 강조) ----------
  var spyTimer=null;
  content.addEventListener('scroll', function(){
    if(spyTimer) return;
    spyTimer=setTimeout(function(){
      spyTimer=null;
      var art=document.querySelector('.doc[data-doc="'+curDoc+'"]');
      if(!art) return;
      var hs=art.querySelectorAll('h2,h3'); var top=content.getBoundingClientRect().top+80;
      var cur=null;
      hs.forEach(function(h){ if(h.getBoundingClientRect().top<=top) cur=h; });
      if(cur){ updateCrumb(cur.textContent); setActiveHeading(cur.id); }
      else { updateCrumb(); setActiveHeading(null); }
    },90);
  });

  // ---------- 사이드바 크기 조절 ----------
  var resizer=document.getElementById('resizer'), sidebar=document.getElementById('sidebar'), dragging=false;
  var saved=localStorage.getItem('cwc_sidebar_w');
  if(saved) sidebar.style.width=saved+'px';
  resizer.addEventListener('mousedown',function(e){dragging=true;resizer.classList.add('active');e.preventDefault();document.body.style.userSelect='none';});
  window.addEventListener('mousemove',function(e){
    if(!dragging) return;
    var w=Math.min(620,Math.max(180,e.clientX));
    sidebar.style.width=w+'px';
  });
  window.addEventListener('mouseup',function(){
    if(!dragging) return; dragging=false; resizer.classList.remove('active');
    document.body.style.userSelect='';
    localStorage.setItem('cwc_sidebar_w', parseInt(sidebar.style.width,10));
  });

  // ---------- 툴팁 ----------
  var tip=document.getElementById('tip');
  function showTip(el){
    var term=el.textContent, body=el.getAttribute('data-tip')||'';
    tip.innerHTML='<span class="tip-term">'+escapeHtml(term)+'</span>'+escapeHtml(body);
    tip.classList.add('show');
    var r=el.getBoundingClientRect();
    tip.style.left='0px'; tip.style.top='0px';
    var tw=tip.offsetWidth, th=tip.offsetHeight;
    var x=r.left + r.width/2 - tw/2;
    x=Math.max(8, Math.min(window.innerWidth-tw-8, x));
    var y=r.top - th - 8;
    if(y<8) y=r.bottom+8;
    tip.style.left=x+'px'; tip.style.top=y+'px';
  }
  function hideTip(){ tip.classList.remove('show'); }
  document.body.addEventListener('mouseover',function(e){ if(e.target.classList&&e.target.classList.contains('tt')) showTip(e.target); });
  document.body.addEventListener('mouseout',function(e){ if(e.target.classList&&e.target.classList.contains('tt')) hideTip(); });

  function escapeHtml(s){ return (s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  // 초기화
  showDoc(DOCS.length?DOCS[0].idx:0);
})();
