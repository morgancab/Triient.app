/* ---------- Ajuster mon entraînement : séances et heures, sport par sport ----------
   Par sport : séances par semaine (CFG.sc) et fourchette d'heures (CFG.vt) du début de prépa au pic, par pas de 15 min.
   Les deux ronds règlent chaque borne ; la barre entre eux décale toute la fourchette ; un appui sur la piste y amène le rond le plus proche.
   vtDraft = {sc, vt, v0, g} : v0 = volumes de ces séances avant réglage des heures (bornes « par défaut »), g = plan par défaut complet
   (contour du graphique). Appliquer enregistre la course (sauvegardée et synchronisée) et recharge le plan ; les séances gardent leurs
   identifiants (semaine.jour.sport), les coches restent. Rien ne touche le plan affiché avant. */
var VT_UI=[['swim','Natation',30,360],['bike','Vélo',30,900],['run','Course à pied',30,480]],vtDraft=null,vtDrag=null;   // [sport, nom, min, max du curseur en minutes]
var VT_XS=[['brick','Enchaînement vélo-course','dès que le plan en prévoit'],['str','Renforcement','gainage et prévention']];
var VT_K={c1:'charge',c2:'charge',c3:'charge',rec:'décharge',taper:'affûtage'};
function vtX(sp){return VT_UI.filter(function(y){return y[0]===sp;})[0];}
// séances du brouillon, ou null si c'est la répartition par défaut du total choisi dans le formulaire de course
function vtScOut(){var d=scDefault(NSESS0),sc=vtDraft.sc;return Object.keys(SC_COLS).every(function(k){return (sc[k]||0)===d[k];})?null:Object.assign({},sc);}
function vtCur(){var o=null;VT_UI.forEach(function(x){if(vtDraft.vt[x[0]])(o=o||{})[x[0]]=vtDraft.vt[x[0]].slice();});return o;}
function vtPrep(){vtDraft.v0=volPlan(vtScOut());vtDraft.g=normVol(vtDraft.v0.map(function(v){return v.slice();}));}
function vtDef(sp){var r=spRange(vtDraft.v0,sp);return r?[Math.round(r[0]/15)*15,Math.round(r[1]/15)*15]:null;}
function vtVal(sp){return vtDraft.vt[sp]||vtDef(sp);}
function vtPlan(){return volFor(vtScOut(),vtCur());}
function vtPeak(V){var all=ALLM;return Math.max.apply(null,V.map(function(v,i){return isLoad(KINDS[i])?rowMinM(v,all):0;}));}
function vtChanged(){return JSON.stringify(vtScOut())!==JSON.stringify(CFG.sc||null)||JSON.stringify(vtCur())!==JSON.stringify(CFG.vt||null);}
function vtMod(sp){return !!vtDraft.vt[sp]||(vtDraft.sc[sp]||0)!==scDefault(NSESS0)[sp];}
// repère concret sous chaque borne : km à allure d'endurance (natation : 22 min au km)
function vtKm(sp,m){var k=sp==='swim'?60/22:tokKmh(sp==='run'?'R':'B','z2'),x=m/60*k;return k?'≈ '+(x<10?String(Math.round(x*10)/10).replace('.',','):Math.round(x))+' km':'';}
function vtP(x,m){return Math.max(0,Math.min(1,(m-x[2])/(x[3]-x[2]))).toFixed(4);}
// mini-graphique : minutes du sport semaine par semaine (barres pleines : ton réglage ; contour : par défaut, seulement si différent)
function vtChart(sp,V){
  var g=vtDraft.g,n=KINDS.length-1,mx=1,i,mod=vtMod(sp),h='',ht=function(m){return m>0?Math.max(4,Math.round(m/mx*100)):0;};
  for(i=0;i<n;i++)mx=Math.max(mx,spMin(V[i],sp),mod?spMin(g[i],sp):0);
  for(i=0;i<n;i++){
    var a=spMin(V[i],sp),b=spMin(g[i],sp),k=KINDS[i];
    h+='<i class="'+(isLoad(k)?'':'k')+'" data-sp="'+sp+'" data-t="'+esc('Semaine '+(i+1)+' · '+VT_K[k]+' · '+fh(a)+(mod&&Math.abs(a-b)>=5?' (par défaut '+fh(b)+')':''))+'">'+
      '<em class="f" style="height:'+ht(a)+'%"></em>'+(mod?'<em class="g" style="height:'+ht(b)+'%"></em>':'')+'</i>';
  }
  return h;
}
function vtRo(sp){return vtMod(sp)?'<span>Semaine par semaine</span><span class="vt-lg"><i class="f"></i>ton réglage<i class="g"></i>par défaut</span>':'<span>Ta progression semaine par semaine</span><span>touche une barre</span>';}
function vtStep(k,label,n,sub){
  return '<div class="vt-row"><span>'+label+(sub?'<small>'+sub+'</small>':'')+'</span><div class="vt-step">'+
    '<button data-act="vtsc" data-k="'+k+'" data-v="-1" aria-label="Une séance de moins"'+(n<=SC_MIN[k]?' disabled':'')+'>−</button><b>'+n+'</b>'+
    '<button data-act="vtsc" data-k="'+k+'" data-v="1" aria-label="Une séance de plus"'+(n>=SC_MAX[k]?' disabled':'')+'>+</button></div></div>';
}
function vtCard(x,V){
  var sp=x[0],d=vtDef(sp);if(!d)return '';
  var v=vtVal(sp),n=vtDraft.sc[sp],a=vtDraft.vt[sp]?spRange(V,sp):null,span=x[3]-x[2],st=span<=360?60:span<=600?120:180,tk='',t;
  for(t=st;t<=x[3];t+=st)if(t>x[2])tk+='<span style="--p:'+vtP(x,t)+'">'+(t/60)+'h</span>';
  var h='<section class="vt-c sp-'+sp+'"><div class="vt-h"><span class="ad-ic sp-'+sp+'">'+ic(sp,20)+'</span><b>'+x[1]+'</b>'+
    (vtMod(sp)?'<button class="vt-mod" data-act="vtdef" data-v="'+sp+'"><i></i>Laisser par défaut</button>':'<span class="vt-def">Par défaut</span>')+'</div>'+
    vtStep(sp,'Séances par semaine',n)+
    '<div class="vt-nums"><div class="vt-n"><small>Début de prépa</small><b id="vt-la-'+sp+'">'+fh(v[0])+'</b><span id="vt-ka-'+sp+'">'+vtKm(sp,v[0])+'</span></div>'+
      '<span class="vt-arw">'+ic('right',18)+'</span><div class="vt-n r"><small>Pic</small><b id="vt-lb-'+sp+'">'+fh(v[1])+'</b><span id="vt-kb-'+sp+'">'+vtKm(sp,v[1])+'</span></div></div>'+
    '<div class="dual" id="vt-d-'+sp+'" data-sp="'+sp+'" style="--a:'+vtP(x,v[0])+';--b:'+vtP(x,v[1])+';--da:'+vtP(x,d[0])+';--db:'+vtP(x,d[1])+'">'+
      '<div class="dual-d"></div><div class="dual-f"></div><div class="dual-h" title="Glisse pour décaler toute la fourchette"><i></i><i></i><i></i></div>'+
      '<input type="range" id="vt-a-'+sp+'" min="'+x[2]+'" max="'+x[3]+'" step="15" value="'+v[0]+'" aria-label="'+x[1]+' : heures en début de prépa">'+
      '<input type="range" id="vt-b-'+sp+'" min="'+x[2]+'" max="'+x[3]+'" step="15" value="'+v[1]+'" aria-label="'+x[1]+' : heures au pic"></div>'+
    '<div class="vt-tk" aria-hidden="true">'+tk+'</div>'+
    '<div class="vt-ch" id="vt-ch-'+sp+'" aria-hidden="true">'+vtChart(sp,V)+'</div><div class="vt-ro" id="vt-ro-'+sp+'">'+vtRo(sp)+'</div>';
  if(a&&a[1]<v[1]-10)h+='<div class="vt-w">'+ic('alert',16)+'<span>'+(n<SC_MAX[sp]?'Avec '+n+' séance'+(n>1?'s':'')+', ton pic plafonne à <b>'+fh(a[1])+'</b> : ajoute une séance pour aller plus haut.':'Ton pic plafonne à <b>'+fh(a[1])+'</b> : chaque séance a une durée maximale.')+'</span></div>';
  else if(a&&a[0]>v[0]+10)h+='<div class="vt-w i">'+ic('info',16)+'<span>Chaque séance a une durée minimale : ton début de prépa reste à <b>'+fh(a[0])+'</b>.</span></div>';
  return h+'</section>';
}
function vtWeek(){
  var sc=vtDraft.sc,p=function(k){return sc[k]?'<span class="vt-p sp-'+k+'">'+ic(k,15)+'<b>'+sc[k]+'</b></span>':'';};
  return '<div class="vt-wk"><span class="eyebrow">Ta semaine type</span><div class="vt-ps">'+p('swim')+p('bike')+p('run')+p('brick')+p('str')+'<span class="vt-tot">'+scTotal(sc)+' séances</span></div></div>';
}
function vtBarIn(V){
  var ch=vtChanged();
  return '<div class="vt-bt"><span><b>'+scTotal(vtDraft.sc)+' séances</b> · pic <b>'+fh(vtPeak(V))+'</b></span><small>'+(ch?'Actuellement '+NSESS+' séances · pic '+fh(vtPeak(VOL)):'C’est ton plan actuel')+'</small></div>'+
    '<button class="btn pri" data-act="vtapply"'+(ch?'':' disabled')+'>Appliquer</button>';
}
function openVt(){
  vtDraft={sc:Object.assign({},scDefault(NSESS0),CFG.sc||{}),vt:{}};
  VT_UI.forEach(function(x){var c=CFG.vt&&CFG.vt[x[0]];vtDraft.vt[x[0]]=c?c.slice():null;});
  vtPrep();renderVt();sheetRoute('vt');
}
function renderVt(){
  var sh=document.getElementById('sheet'),st=sh.scrollTop,V=vtPlan(),any=!!vtScOut()||!!vtCur();
  var b='<p class="vt-intro">Choisis tes séances et tes heures dans chaque sport. Glisse les ronds pour ton début de prépa et ton pic. Pour tout décaler d’un coup, glisse la poignée sous la barre.</p>'+
    vtWeek()+VT_UI.map(function(x){return vtCard(x,V);}).join('')+
    '<section class="vt-c sp-str"><div class="vt-h"><span class="ad-ic sp-str">'+ic('str',20)+'</span><b>Autres séances</b></div>'+VT_XS.map(function(x){return vtStep(x[0],x[1],vtDraft.sc[x[0]]||0,x[2]);}).join('')+'</section>'+
    '<p class="vt-note">Ton plan garde sa progression, ses semaines de décharge et son affûtage. Monte progressivement : une hausse brutale du volume est la première cause de blessure. Tes coches restent ; une séance retirée perd la sienne.</p>'+
    (any?'<button class="lnk vt-reset" data-act="vtreset">Tout remettre par défaut</button>':'')+
    '<div class="vt-bar" id="vt-bar">'+vtBarIn(V)+'</div>';
  showSheet('Ajuster mon entraînement','Séances et heures, sport par sport',b);
  sh.scrollTop=st;
}
// pendant un glissement : chiffres, barre, graphique et total suivent ; le reste (alertes, boutons) au relâchement
function vtLive(sp,setInputs){
  var x=vtX(sp),v=vtVal(sp),V=vtPlan(),q=function(id){return document.getElementById(id);},set=function(id,t){var e=q(id);if(e)e.textContent=t;};
  set('vt-la-'+sp,fh(v[0]));set('vt-lb-'+sp,fh(v[1]));set('vt-ka-'+sp,vtKm(sp,v[0]));set('vt-kb-'+sp,vtKm(sp,v[1]));
  var dl=q('vt-d-'+sp);if(dl&&dl.style&&dl.style.setProperty){dl.style.setProperty('--a',vtP(x,v[0]));dl.style.setProperty('--b',vtP(x,v[1]));}
  if(setInputs){var ia=q('vt-a-'+sp),ib=q('vt-b-'+sp);if(ia)ia.value=v[0];if(ib)ib.value=v[1];}
  var ch=q('vt-ch-'+sp);if(ch)ch.innerHTML=vtChart(sp,V);
  var br=q('vt-bar');if(br)br.innerHTML=vtBarIn(V);
}
// rond natif (doigt, souris, clavier). Un rond peut passer de l'autre côté : la fourchette est simplement triée.
function vtSlide(t){
  var m=/^vt-([ab])-(swim|bike|run)$/.exec(t.id||'');if(!m||!vtDraft)return false;
  var sp=m[2],old=vtVal(sp),o=document.getElementById('vt-'+(m[1]==='a'?'b':'a')+'-'+sp);
  var val=+t.value,ov=o&&o.value!==''&&o.value!=null?+o.value:old[m[1]==='a'?1:0];
  vtDraft.vt[sp]=[Math.min(val,ov),Math.max(val,ov)];
  vtLive(sp,false);
  return true;
}
// barre du milieu (décale toute la fourchette) et piste (appui : le rond le plus proche y va ; glissé : il suit)
function vtAt(g,cx){var x=g.x,m=x[2]+Math.max(0,Math.min(1,(cx-g.r.left-13)/(g.r.width-26)))*(x[3]-x[2]);return Math.max(x[2],Math.min(x[3],Math.round(m/15)*15));}
function vtNear(v,m){return v[0]===v[1]?(m<v[0]?0:1):Math.abs(m-v[0])<=Math.abs(m-v[1])?0:1;}
function vtMove(g,cx){
  var x=g.x,v=g.v0.slice();
  if(g.both){var sh=Math.round((cx-g.x0)/(g.r.width-26)*(x[3]-x[2])/15)*15;sh=Math.max(x[2]-v[0],Math.min(x[3]-v[1],sh));v=[v[0]+sh,v[1]+sh];}
  else{v[g.i]=vtAt(g,cx);v=[Math.min(v[0],v[1]),Math.max(v[0],v[1])];}
  var o=vtVal(g.sp);if(o[0]===v[0]&&o[1]===v[1])return;
  vtDraft.vt[g.sp]=v;vtLive(g.sp,true);
}
document.addEventListener('pointerdown',function(e){
  var t=e.target,d=t&&t.closest&&t.closest('.dual');
  if(!d||!vtDraft||t.tagName==='INPUT'||e.button>0)return;
  var sp=d.getAttribute('data-sp');
  var g=vtDrag={sp:sp,x:vtX(sp),r:d.getBoundingClientRect(),id:e.pointerId,x0:e.clientX,y0:e.clientY,v0:vtVal(sp).slice(),both:!!t.closest('.dual-h'),go:false,i:0,el:d};
  if(!g.both){   // saisie sur la piste entre les deux ronds (hors des ronds) : toute la fourchette suit
    var px=function(m){return g.r.left+13+(g.r.width-26)*vtP(g.x,m);};
    g.both=e.clientX>px(g.v0[0])+14&&e.clientX<px(g.v0[1])-14;
  }
});
document.addEventListener('pointermove',function(e){
  var g=vtDrag;if(!g||e.pointerId!==g.id)return;
  if(!g.go){
    var dx=Math.abs(e.clientX-g.x0),dy=Math.abs(e.clientY-g.y0);
    if(dx<6&&dy<6)return;
    if(dy>dx){vtDrag=null;return;}                                 // geste vertical : on laisse défiler
    g.go=true;g.i=vtNear(g.v0,vtAt(g,g.x0));
    try{g.el.setPointerCapture(g.id);}catch(_){}
  }
  vtMove(g,e.clientX);
});
document.addEventListener('pointerup',function(e){
  var g=vtDrag;if(!g||e.pointerId!==g.id)return;vtDrag=null;
  if(!g.go){if(g.both)return;g.i=vtNear(g.v0,vtAt(g,e.clientX));vtMove(g,e.clientX);}   // simple appui sur la piste
  if(vtDraft)renderVt();
});
document.addEventListener('pointercancel',function(e){var g=vtDrag;if(!g||e.pointerId!==g.id)return;vtDrag=null;if(g.go&&vtDraft)renderVt();});
// graphique : touche ou survole une semaine pour lire sa valeur
function vtPick(e){
  var b=e.target&&e.target.closest&&e.target.closest('.vt-ch i');if(!b)return;
  var ro=document.getElementById('vt-ro-'+b.getAttribute('data-sp'));
  Array.prototype.forEach.call(b.parentNode.querySelectorAll('i.on'),function(x){x.classList.remove('on');});
  b.classList.add('on');if(ro)ro.innerHTML='<b>'+esc(b.getAttribute('data-t'))+'</b>';
}
document.addEventListener('pointerdown',vtPick);document.addEventListener('pointerover',vtPick);
function vtApply(){
  if(!vtChanged()){closeSheet();return;}
  var r=Object.assign({},state.race||CFG),sc=vtScOut(),vt=vtCur();
  if(sc)r.sc=sc;else delete r.sc;
  if(vt)r.vt=vt;else delete r.vt;
  state.race=r;state.ui.flash='Plan mis à jour';save();
  track('vol_adjust',[sc?'seances':'',vt?Object.keys(vt).join('+'):''].filter(Boolean).join('|')||'reset');
  // fenêtre fermée et retirée de l'adresse avant de recharger : le plan recalculé s'affiche, sans rouvrir le réglage
  document.getElementById('sheetbg').classList.remove('on');sheetKey=null;sheetDepth=0;syncUrl(false);
  location.reload();
}
