/* =====================================================================
   4. VUES
   ===================================================================== */
var TABS=[['dash','Accueil','home'],['week','Semaine','week'],['data','Données','chart'],['race','Course','race'],['more','Plus','more']];
var TABNAMES=['dash','week','data','race','more','plan','admin'];
function tabOf(t){return t==='plan'||t==='admin'?'more':t;}
/* Routage par URL : #onglet ou #week?w=12&d=3 (semaine 12, jour 3 = jeudi) */
function parseRoute(){
  var h=(location.hash||'').slice(1),q=h.indexOf('?'),p={};
  if(q>=0)h.slice(q+1).split('&').forEach(function(kv){var a=kv.split('=');if(a[0])p[a[0]]=decodeURIComponent(a[1]||'');});
  return {tab:q<0?h:h.slice(0,q),p:p};
}
var tab=state.ui.tab||'dash',wv=status().w,sel=null,openSet={},pendDay=null;
function applyRoute(){
  var r=parseRoute();
  if(TABNAMES.indexOf(r.tab)>=0)tab=r.tab;
  if(TABNAMES.indexOf(tab)<0)tab='dash';
  if(tab==='week'){
    var w=parseInt(r.p.w,10),d=parseInt(r.p.d,10);
    if(w>=1&&w<=NW)wv=w;
    pendDay=(d>=0&&d<=6)?d:null;
  }
}
/* Fenêtres : #week?w=12&s=act:ID (settings, legal, away, acts, act:ID, assoc:ID, link:SID, usr:ID pour le suivi propriétaire) */
var sheetKey=null,sheetDepth=0,routing=false;
function routeHash(day){
  var q=[];
  if(tab==='week'){q.push('w='+wv);if(day!=null)q.push('d='+day);}
  if(sheetKey)q.push('s='+encodeURIComponent(sheetKey));
  return '#'+tab+(q.length?'?'+q.join('&'):'');
}
function syncUrl(push,day){
  if(routing)return;
  var h=routeHash(day),r=parseRoute();
  if(day==null&&r.tab===tab&&(tab!=='week'||+r.p.w===wv)&&(r.p.s||null)===sheetKey)return; /* même page : on garde &d= éventuel */
  if(location.hash===h)return;
  try{history[push?'pushState':'replaceState'](null,'',h);}catch(e){}
}
function sheetRoute(k){
  if(sheetKey===k)return;
  sheetKey=k;
  if(routing)return;
  sheetDepth++;syncUrl(true);
}
function openSheetByKey(k){
  var i=k.indexOf(':'),n=i<0?k:k.slice(0,i),v=i<0?'':k.slice(i+1);
  if(n==='settings')openSheet();
  else if(n==='legal')openLegal();
  else if(n==='away')openAwayList();
  else if(n==='vt')openVt();
  else if(n==='acts')openAllActs();
  else if(n==='level')openLevel();
  else if(n==='steps')openSteps();
  else if(n==='act')openActDetail(v);
  else if(n==='assoc')openPickSess(v);
  else if(n==='link')openPickAct(v);
  else if(n==='usr')openAdmUser(v);
}
function onRoute(){
  var r=parseRoute(),w=parseInt(r.p.w,10),s=r.p.s||null;
  if(r.tab===tab&&(tab!=='week'||w===wv)&&r.p.d==null&&s===sheetKey)return;
  routing=true;
  try{
    applyRoute();state.ui.tab=tab;save();
    if(!s){sheetDepth=0;if(sheetKey){sheetKey=null;document.getElementById('sheetbg').classList.remove('on');}}
    else sheetDepth=sheetDepth>0?Math.max(1,sheetDepth-1):0;
    render(false);
    if(s&&s!==sheetKey)openSheetByKey(s);
  }finally{routing=false;}
}
window.addEventListener('popstate',onRoute);
window.addEventListener('hashchange',onRoute);
applyRoute();
var SPN={swim:'Natation',bike:'Vélo',run:'Course',brick:'Brick',str:'Renfo',rest:'Repos',race:'Course'};

function topbar(eyebrow,title,withGear,back){
  return '<header class="top">'+(back?'<button class="iconbtn" data-act="tab" data-tab="'+back+'" aria-label="Retour">'+ic('left',22)+'</button>':'')+
    '<div class="top-t"><div class="eyebrow">'+esc(eyebrow)+'</div><h1>'+esc(title)+'</h1></div>'+
    (withGear?'<button class="iconbtn" data-act="settings" aria-label="Réglages et sauvegarde">'+ic('gear',22)+'</button>':'')+'</header>';
}
function bar(p,c){return '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+p+'"><i style="--p:'+p+'%'+(c?';--c:'+c:'')+'"></i></div>';}
function prRow(label,val,p,c){return '<div class="pr"><div class="pr-h"><b>'+label+'</b><span>'+val+'</span></div>'+bar(p,c)+'</div>';}

/* ---------- Accueil ---------- */
function ringSvg(p){var r=44,c=2*Math.PI*r;return '<svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="'+r+'" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="10"/><circle cx="52" cy="52" r="'+r+'" fill="none" stroke="#f5f4ef" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+(c*Math.max(0,Math.min(100,p))/100).toFixed(1)+' '+c.toFixed(1)+'"/></svg>';}
function weekStrip(wk){
  var t=today(),L=['L','M','M','J','V','S','D'];
  return '<div class="wstrip">'+wk.days.map(function(day,i){
    var real=day.sessions.filter(function(s){return s.sp!=='rest';}),isT=diffDays(day.date,t)===0;
    var dots=real.map(function(s){return '<i class="sp-'+s.sp+(isDone(s)?' d':'')+'"></i>';}).join('');
    return '<button class="wd7'+(isT?' today':'')+(real.length?'':' rest')+'" data-act="gowd" data-w="'+wk.n+'" data-d="'+i+'" aria-label="'+esc(day.name+' '+fmtDay(day.date))+'"><span class="dl">'+L[i]+'</span><span class="dn">'+day.date.getDate()+'</span><span class="dd">'+dots+'</span></button>';
  }).join('')+'</div>';
}
// Photo du bloc d'accueil : départ natation d'un Ironman (U.S. Navy / Chief Journalist Deborah Carson, domaine public, Wikimedia Commons)
function heroHtml(st){
  var art='<div class="h3-bg" style="--pos:50% 40%"><img src="'+HERO_IMG+'" alt=""></div><div class="h3-shade"></div>',big='style="font-size:44px;margin:10px 0 6px;letter-spacing:-.03em"',cls='card hero2 hero3 photo';
  if(st.s==='raceday')return '<section class="'+cls+'">'+art+'<div class="h3-in"><div class="h3-center"><div class="eyebrow">Jour J</div><div class="big" '+big+'>C’est aujourd’hui</div><div class="small" style="color:rgba(255,255,255,.8)">'+esc(RNAME)+' · '+esc(fmtLong(RACE_DATE))+'</div></div></div></section>';
  if(st.s==='after')return '<section class="'+cls+'">'+art+'<div class="h3-in"><div class="h3-center"><div class="eyebrow">'+esc(RNAME)+'</div><div class="big" '+big+'>Terminé</div><div class="small" style="color:rgba(255,255,255,.8)">Bravo, tu l’as préparé jusqu’au bout.</div></div></div></section>';
  var elapsed=st.s==='before'?0:Math.min(NW*7,diffDays(today(),PLAN_START)+1);
  return '<section class="'+cls+'" aria-label="Compte à rebours">'+art+'<div class="h3-in"><div class="h3-top"><div class="h2l"><div class="eyebrow">'+esc(RNAME)+' · '+fmtDay(RACE_DATE)+' '+RACE_DATE.getFullYear()+'</div><div class="big" id="cd-d">–</div><div class="unit"><span id="cd-u">jours</span> avant la course</div>'+
    '<div class="cd2"><span><b id="cd-h">–</b> h</span><span><b id="cd-m">–</b> min</span><span><b id="cd-s">–</b> s</span></div></div>'+
    '<div class="ring">'+ringSvg(pct(elapsed,NW*7))+'<div class="rc"><b>'+(st.s==='before'?'–':'S'+st.w)+'</b><small>sur '+NW+'</small></div></div></div></div></section>';
}
function todayHtml(st,cur){
  var t=today(),h='';
  if(st.s==='raceday'||st.s==='after')return '';
  if(st.s==='before')
    return '<div class="sh"><h2>Prochainement</h2></div><section class="card"><div class="row" style="align-items:flex-start"><div class="mi">'+ic('week',22)+'</div><div><b style="font-size:17px">Le programme démarre dans '+st.days+' jour'+(st.days>1?'s':'')+'</b><div class="small muted" style="margin-top:2px">'+esc(fmtLong(PLAN_START))+' · semaine 1 : reprise douce.</div></div></div><button class="btn pri" style="margin:16px 0 0" data-act="gowk" data-w="1">Voir la semaine 1</button></section>';
  var day=cur.days.filter(function(d){return diffDays(d.date,t)===0;})[0],list=day?day.sessions.filter(function(s){return s.sp!=='rest';}):[];
  h+='<div class="sh"><h2>Aujourd’hui</h2><span class="muted small">'+esc(fmtDay(t))+'</span></div>';
  if(list.length){list.forEach(function(s){h+=sessCard(s,true);});return h;}
  var nx=nextSession(cur);
  h+='<section class="card"><div class="row" style="align-items:flex-start"><div class="mi">'+ic('rest',22)+'</div><div><b style="font-size:17px">Jour de repos</b><div class="small muted" style="margin-top:2px">Dors bien, hydrate-toi : c’est là que tu progresses.</div></div></div>'+
    (nx?'<button class="next sp-'+nx.s.sp+'" data-act="gowk" data-w="'+st.w+'" style="margin-top:14px"><span class="ico">'+ic(nx.s.sp,22)+'</span><span style="flex:1;min-width:0"><span class="eyebrow" style="display:block;font-size:11px">Prochaine séance · '+esc(nx.day)+'</span><b style="display:block;font-size:15.5px;font-weight:650;margin-top:2px">'+esc(nx.s.title)+'</b></span>'+ic('right',20)+'</button>':'')+'</section>';
  return h;
}
function homeActs(){
  var sv=state.sv,acts=(sv.acts||[]).filter(function(a){return actSport(a);}).sort(function(x,y){return y.s>x.s?1:-1;}).slice(0,2);
  var off=sv.err||sv.werr||sv.conn===false,h='<div class="sh"><h2>Dernières activités</h2><span class="sync-s'+(off?' off':'')+'"><i></i>'+(off?'Hors ligne':'Synchro '+ago(sv.t))+'</span></div>';
  if(!acts.length)return h+'<section class="card"><p class="small muted" style="margin:0">Aucune activité pour l’instant. Elles apparaissent ici après chaque sortie synchronisée par Garmin.</p></section>';
  h+='<section class="card" style="padding-bottom:8px">';
  acts.forEach(function(a){
    var sid=LK.a2s[a.id],s=sid&&SBY[sid],lab=dayIdx(a)<0?'Avant le plan':s?'→ '+sessLabel(s):sid===0?'Ignorée':'Non associée';
    h+='<button class="srow" data-act="actdetail" data-aid="'+esc(a.id)+'"><span class="sr-t"><b>'+esc(a.n||a.t)+'</b><small>'+esc(actDate(a)+' · '+actLine(a))+'</small></span><span class="sr-b'+(s?' ok':'')+'">'+esc(lab)+'</span></button>';
  });
  return h+'<button class="btn" data-act="allacts" style="margin:10px 0 6px">Toutes mes activités ('+(sv.acts||[]).length+')</button></section>';
}
function vHome(){
  var st=status(),S_=stats(),cur=PLAN[st.w-1],ws=wkStats(cur),h='',a0=acct(),first=((a0&&a0.name)||'').split(' ')[0];
  h+='<header class="top"><div class="top-t"><div class="eyebrow">'+esc(fmtLong(today()))+'</div><h1>'+(first?'Bonjour '+esc(first):'Accueil')+'</h1></div><button class="iconbtn" data-act="settings" aria-label="Réglages et sauvegarde">'+ic('gear',22)+'</button></header>';
  h+=heroHtml(st);
  if(st.s==='during')h+='<p class="hline"><b>Semaine '+st.w+' sur '+NW+'</b> · '+esc(cur.ph.n)+(cur.kind==='rec'?' · semaine plus légère pour récupérer':cur.kind==='taper'?' · on baisse le volume avant la course':'')+'</p>';
  var inj0=injCard();
  h+=inj0||missCard();   // blessure en cours : pas de relance sur les séances manquées
  var nxs=nextStep();if(nxs){var nxd=diffDays(parseYmd(nxs.date),today());h+='<p class="hline"><b>Prochaine course : '+esc(nxs.name)+'</b> · '+(nxd?'J-'+nxd:'aujourd’hui')+'</p>';}
  // installation iOS
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent||'');
  if(!isStandalone()&&!state.ui.hideInstall){
    if(deferredInstall)h+='<section class="card"><div class="install">'+ic('share',22)+'<div><p><b>Installe l’app</b> sur ton téléphone : elle s’ouvre en plein écran, comme une vraie appli, et marche même sans connexion.</p><div class="btns" style="margin-top:10px"><button class="btn pri" data-act="doinstall" style="height:44px">Installer</button><button class="btn" data-act="hideinstall" style="height:44px">Plus tard</button></div></div></div></section>';
    else if(ios)h+='<section class="card"><div class="install">'+ic('share',22)+'<div><p><b>Installe l’app</b> : touche le bouton Partager de Safari, puis « Sur l’écran d’accueil ». Elle s’ouvrira en plein écran, comme une vraie appli.</p><button class="chip" style="margin-top:10px;border:0;min-height:32px" data-act="hideinstall">Compris</button></div></div></section>';
  }
  h+=todayHtml(st,cur);
  // cette semaine : un seul bloc (jours, avancement, thème)
  h+='<div class="sh"><h2>'+(st.s==='before'?'Première semaine':'Cette semaine')+'</h2><button class="lnk" data-act="gowk" data-w="'+st.w+'">Voir le détail'+ic('right',16)+'</button></div>'+
    '<section class="card wkcard">'+weekStrip(cur)+
    '<div class="wkline"><b>Séances</b><span>'+ws.d+' sur '+ws.n+'</span></div>'+bar(pct(ws.d,ws.n))+
    '<div class="wkline"><b>Temps</b><span>'+fh(ws.dmin)+' sur '+fh(ws.min)+'</span></div>'+bar(pct(ws.dmin,ws.min))+
    '<p class="wktheme"><b>Cette semaine :</b> '+esc(cur.theme)+'</p></section>';
  if(state.sv.url&&state.sv.key)h+=homeActs();
  // progression dans le plan (le détail par sport et le volume sont dans Données)
  if(st.s!=='before'){
    var pp=pct(S_.t.d,S_.t.n);
    h+='<div class="sh"><h2>Ma progression</h2></div><section class="card dsum pgcard"><div class="eyebrow">Plan réalisé</div><div class="dbig">'+pp+' %<small>'+S_.t.d+' séance'+(S_.t.d>1?'s':'')+' sur '+S_.t.n+'</small></div>'+bar(pp)+
      '<div class="kpis" style="grid-template-columns:1fr 1fr"><div class="kpi"><div class="kl">Temps</div><div class="kv" style="font-size:19px">'+fh(S_.t.dmin)+'</div><div class="ks">sur '+fh(S_.t.min)+'</div></div><div class="kpi"><div class="kl">Semaines</div><div class="kv" style="font-size:19px">'+Math.min(st.w,NW)+'</div><div class="ks">sur '+NW+'</div></div></div>'+
      '<div class="quick"><button data-act="tab" data-tab="data">'+ic('chart',18)+'Mes données</button><button data-act="tab" data-tab="plan">'+ic('plan',18)+'Tout le plan</button></div></section>';
  }
  if(!(state.sv.url&&state.sv.key))h+=garminTip();
  return '<div class="home">'+h+'</div>';
}
function mrow(icon,t,sub,act,attrs,tint){return '<button class="mrow" data-act="'+act+'" '+(attrs||'')+'><span class="mi'+(tint?' t-'+tint:'')+'">'+ic(icon,22)+'</span><span style="flex:1;min-width:0"><b>'+t+'</b><small>'+sub+'</small></span>'+ic('right',18)+'</button>';}
function vMore(){
  var t=stats().t,rd=diffDays(RACE_DATE,today()),aw=awayList().length,grp=function(title,rows){return '<div class="eyebrow sgl">'+title+'</div><div class="menu">'+rows+'</div>';};
  return topbar('Ton espace','Plus',false)+
    '<button class="mhero" data-act="tab" data-tab="plan"><span class="mh-top"><span class="eyebrow">Ma course</span>'+(rd>=0?'<span class="mh-j">J-'+rd+'</span>':'')+'</span><b class="mh-n">'+esc(RNAME)+'</b>'+
      '<span class="mh-s">'+esc(fmtLong(RACE_DATE))+' · '+FMT.n+'</span>'+bar(pct(t.d,t.n))+
      '<span class="mh-f"><span>'+t.d+' / '+t.n+' séances</span><span class="mh-l">Voir mon plan de '+NW+' semaines'+ic('right',16)+'</span></span></button>'+
    grp('Mon entraînement',mrow('race','Mes courses',stepList().length?stepList().length+' course'+(stepList().length>1?'s':'')+' intermédiaire'+(stepList().length>1?'s':''):'Ajouter une course intermédiaire','steps','','red')+mrow('week','Vacances & blessures',injNow()?esc(injNow().label+' · '+awayDesc(injNow())):aw?aw+' période'+(aw>1?'s':'')+' enregistrée'+(aw>1?'s':''):'Vacances, week-end ou blessure : le plan s’adapte','awaylist','','green')+mrow('plan','Ajuster mon entraînement',CFG.vt||CFG.sc?'Réglage personnalisé · '+NSESS+' séances par semaine':'Séances et heures, sport par sport','vtopen','','blue')+(lvOffered()?mrow('chart','Mon niveau',lvAny()?'Modifier mes temps de référence':'Estimer mes allures en 3 questions','level','','orange'):''))+
    grp('L’app',mrow('gear','Réglages','Garmin, compte, sauvegarde','settings','','blue')+mrow('share','Partager l’app','Envoyer le lien à un ami','shareapp','','purple'))+
    (acct()&&acct().admin?grp('Propriétaire',mrow('chart','Suivi de l’app','Utilisateurs, courses, progression','tab','data-tab="admin"','grey')):'')+
    '<div style="text-align:center;margin:6px 0 4px"><button class="lnk" data-act="legal" style="margin:0;color:var(--t3)">Mentions légales et confidentialité</button></div>';
}
function autoSummary(){
  var ap=autoProf();
  if(!ap){
    var dp=declProf(),bi=declBikeIm(),ds=[];
    if(dp.thr)ds.push('seuil course ≈ '+mmss(dp.thr)+' /km');
    if(bi)ds.push('vélo ≈ '+Math.round(bi)+' km/h');
    if(dp.css)ds.push('CSS natation ≈ '+mmss(dp.css)+' /100 m');
    return ds.length?'<br><b>Calculé d’après ton questionnaire :</b> '+ds.join(' · ')+'.':' (Synchronise Garmin pour les calculer, ou remplis le questionnaire de niveau.)';
  }
  var hz=ap.hz,s='<br><b>Calculé aujourd’hui :</b> zone 2 = '+(hz[0]+1)+'–'+hz[1]+' bpm';
  if(ap.imRun)s+=' · allure '+(RL==='course'?'de course':RL+' course')+' ≈ '+mmss(ap.imRun)+' /km';
  if(ap.imBike)s+=' · vélo ≈ '+Math.round(ap.imBike)+' km/h';
  if(ap.imSwim)s+=' · nage ≈ '+mmss(ap.imSwim)+' /100 m';
  return s+'.';
}
/* ---------- Séances structurées → calendrier intervals.icu → Garmin Connect → montre ----------
   Chaque séance du plan est décrite par étapes (syntaxe d’intervals.icu) avec des cibles de zone de FC ou d’allure
   tirées de tes données (autoProf). Intervals.icu transmet ensuite la semaine à venir à Garmin Connect. */
// Intervals.icu n'exporte vers Garmin que les cibles de FC (zones) : l'allure / la vitesse est donc écrite dans le NOM de l'étape
// (ex. « 6'40-7'05/km »), affiché sur la montre, et la cible réelle de l'étape est une zone de FC.
/* ---------- Détail d'une séance : déroulé par blocs (durée, nom, pastilles de cibles) + conseils ---------- */
var TOKN={R:{soft:'Facile',z2:'Endurance',tempo:'Tempo',im:'Allure '+RL},B:{soft:'Facile',z2:'Endurance',ft:'Force-endurance',sw:'Sweet spot',im:'Allure '+RL},S:{easy:'Souple',end:'Aisé',im:'Allure '+RL,css:'Seuil',fast:'Rapide'}};
function durTxt(n,u){return u==='m'?(n<60?n+' min':fm(n)):u==='s'?n+' s':u==='mtr'?n+' m':n+' km';}
/* ---------- Mode vacances / week-end ----------
   Une période (dates + intensité + matériel dispo) remplace, pendant ces jours, chaque séance par sa variante « récupération »
   générée par les mêmes constructeurs que le plan (mêmes cibles, même envoi Garmin, même rapprochement). Les séances sont modifiées
   sur place ; s.orig garde l'original pour revenir en arrière à tout moment. La semaine de course n'est jamais modifiée.
   Blessure (type 'injury') : p.stop = sports arrêtés {swim, bike, run, str}, leurs séances deviennent du repos ; les autres sports suivent
   p.mode (identique, allégé, minimum). p.open : pause « jusqu'à nouvel ordre », recalculée chaque jour jusqu'à 7 jours devant (awayTo),
   jusqu'à ce que l'athlète indique sa reprise. La date de course ne bouge pas : les séances de la période sont retirées, pas décalées. */
var AWAY_F={light:0.7,min:0.4},AWAY_N={same:'Identique',light:'Allégé',min:'Minimum',off:'Repos',eve:'Veille de course'},awayDraft=null;
var INJ_SP=[['swim','Natation'],['bike','Vélo'],['run','Course à pied'],['str','Renforcement']],INJ_AHEAD=7;
function isInj(p){return p&&p.type==='injury';}
// fin effective d'une période : une pause ouverte avance avec les jours
function awayTo(p){if(!p.open)return p.to;var f=parseYmd(p.from),h=addDays(today(),INJ_AHEAD);return isoDate(f&&f>h?f:h);}
function injRest(w){
  var r=restDay(w);r.title='Repos · blessure';r.sum='Pause pour guérir';r.goal='Laisser la blessure guérir. La reprise se décide avec ton médecin ou ton kiné.';
  r.lines=['Suis les consignes de ton médecin ou de ton kiné','Sommeil, hydratation et repas équilibrés aident aussi à guérir','Si la douleur persiste ou augmente, consulte de nouveau'];
  return r;
}
function injStopped(o,p){var x=p.stop||{};return o.sp==='brick'?!!(x.bike||x.run):!!x[o.sp];}
function injAll(p){var x=p.stop||{};return INJ_SP.every(function(k){return x[k[0]];});}
// résumé lisible : « Pause complète », « Vélo et course à pied à l’arrêt », « Identique »…
function awayDesc(p){
  if(!isInj(p))return AWAY_N[p.mode];
  if(injAll(p))return 'Pause complète';
  var l=INJ_SP.filter(function(k){return (p.stop||{})[k[0]];}).map(function(k){return k[1].toLowerCase();});
  return l.length?(l.length>1?l.slice(0,-1).join(', ')+' et '+l[l.length-1]:l[0]).replace(/^./,function(c){return c.toUpperCase();})+' à l’arrêt':'Aucun sport arrêté';
}
function awaySpan(p){var f=parseYmd(p.from);return p.open?'depuis le '+fmtDay(f)+' · jusqu’à nouvel ordre':fmtDay(f)+' → '+fmtDay(parseYmd(p.to));}
// blessure en cours aujourd'hui (pour le bandeau d'accueil)
function injNow(){var t=isoDate(today());return awayList().filter(function(p){return isInj(p)&&p.from<=t&&awayTo(p)>=t;})[0]||null;}
function r5(n){return Math.round(n/5)*5;}
function awayRun(w,ph,min,f){return runMid(w,'rec',ph,Math.max(20,Math.min(60,r5(min*f*0.6))));}
// la séance est-elle faisable sur place (matériel dispo, pas en repos) ?
function awayFeasible(o,p){return p.mode!=='off'&&!(o.sp==='swim'&&!p.pool)&&!((o.sp==='bike'||o.sp==='brick')&&!p.bike);}
function adaptFields(o,p){
  if(o.sp==='rest'||o.sp==='race'||o.w>=NW)return null;
  var pw=o.w,w=REFW[pw-1]||pw,v=VOL[pw-1],kind=META[pw-1][0],ph=phaseOf(pw).k,f=AWAY_F[p.mode],n;
  if(p.mode==='off')return restDay(pw);
  if(p.mode==='same'){
    if(awayFeasible(o,p))return null;
    // même intensité : le matériel manque, on garde la logique de la séance sous forme de course
    if(o.sp==='swim')return runMid(w,kind,ph,Math.max(40,Math.min(75,r5(o.min*0.9))));
    if(o.sp==='bike')return (o.d===2?runMid:runLong)(w,kind,ph,Math.max(40,Math.min(90,r5(o.min*0.6))));
    if(o.sp==='brick')return runMid(w,'rec',ph,Math.max(15,o.min));
    return null;
  }
  if(o.ex){   // séances ajoutées au-delà de 8 : même logique, avec leur constructeur
    if((o.sp==='swim'&&!p.pool)||(o.sp==='bike'&&!p.bike))return awayRun(w,ph,o.min,f);
    var xm=v[o.ex]||o.min||30;
    return o.ex===8||o.ex===15||o.ex===16?swimC(w,'rec',ph,Math.max(800,Math.round(xm*f/100)*100)):o.ex===9||o.ex===12||o.ex===13?runEasy(w,'rec',ph,Math.max(20,r5(xm*f))):o.ex===10||o.ex===14||o.ex===17?bikeEasy(w,'rec',ph,Math.max(30,r5(xm*f))):strengthB(w,'rec',ph,Math.max(10,r5(xm*f)));
  }
  if(o.sp==='swim'){
    if(!p.pool)return awayRun(w,ph,o.min,f);
    n=Math.max(800,Math.round(v[o.d===1?0:1]*f/100)*100);
    return (o.d===1?swimA:swimB)(w,'rec',ph,n);
  }
  if(o.sp==='bike'){
    if(!p.bike)return awayRun(w,ph,o.min,f);
    return (o.d===2?bikeMid:bikeLong)(w,'rec',ph,Math.max(30,r5(v[o.d===2?2:4]*f)));
  }
  if(o.sp==='brick')return runMid(w,'rec',ph,Math.max(15,r5(v[5]*f)));
  if(o.sp==='run')return (o.d===3?runMid:runLong)(w,'rec',ph,Math.max(25,r5(v[o.d===3?3:6]*f)));
  if(o.sp==='str')return strength(w,'rec',ph,Math.max(15,r5(v[7]*f)));
  return null;
}
function copySess(s){var c={};Object.keys(s).forEach(function(k){c[k]=s[k];});return c;}
function awayList(){return state.ui.away||[];}
var ORIGPOS={},AWAY_SPAN=8,AWAY_CAP=200;
function gday(g){return PLAN[Math.floor(g/7)].days[g%7].sessions;}
// séance d'origine, avec son vrai jour de départ (w, d) même si elle a déjà été déplacée
function awaySrc(s){var pos=ORIGPOS[s.id]||{w:s.w,d:s.d};return Object.assign({},s.orig||s,{w:pos.w,d:pos.d});}
// Plan d'une période (sans rien modifier) : pour chaque séance de la période, sa version adaptée et, si besoin, le jour (global) où la reporter
function planAway(p){
  var a=parseYmd(p.from),b=parseYmd(awayTo(p)),ops=[];
  if(!a||!b||b<a)return null;
  if(isInj(p)){
    var ia=Math.max(0,idxOfDate(a)),ib=Math.min(NW*7-1,idxOfDate(b)),gi,lp={mode:p.mode==='off'?'min':p.mode,pool:true,bike:true};
    for(gi=ia;gi<=ib;gi++){
      if(Math.floor(gi/7)+1>=NW)continue;
      gday(gi).forEach(function(s){
        var src=awaySrc(s);if(src.sp==='rest'||src.sp==='race')return;
        ops.push({s:s,src:src,d0:gi,to:null,nf:injStopped(src,p)?injRest(src.w):lp.mode==='same'?null:adaptFields(src,lp)});
      });
    }
    return ops;
  }
  var fi=idxOfDate(a),ti=idxOfDate(b),N=NW*7,tod=idxOfDate(today()),g,extra={},movers=[];
  var mp={mode:p.mode==='off'?'same':p.mode,pool:true,bike:true};
  var load=function(x){var t=extra[x]||0;gday(x).forEach(function(s){if(s.sp!=='rest')t+=s.min;});return t;};
  for(g=Math.max(0,fi);g<=Math.min(N-1,ti);g++){
    if(Math.floor(g/7)+1>=NW)continue;
    gday(g).forEach(function(s){
      var src=awaySrc(s);if(src.sp==='rest'||src.sp==='race')return;
      var op={s:s,src:src,d0:g,nf:null,to:null};
      if(p.move==='out'&&!awayFeasible(src,p)){op.nf=adaptFields(src,mp);movers.push(op);}
      else op.nf=adaptFields(src,p);
      ops.push(op);
    });
  }
  if(movers.length){
    var cand=[];
    for(g=Math.max(0,fi-AWAY_SPAN,tod);g<=Math.min(N-1,ti+AWAY_SPAN);g++){
      if(g>=fi&&g<=ti)continue;
      var wk=PLAN[Math.floor(g/7)];if(wk.n>=NW)continue;
      if(wk.layout[g%7].every(function(x){return (x.orig||x).sp==='rest'&&!(x.orig||x).fr;}))continue;   // on ne touche pas au jour de repos de conception
      cand.push(g);
    }
    movers.sort(function(x,y){return y.src.min-x.src.min;}).forEach(function(op){
      var pair=op.src.sp==='brick'?movers.filter(function(q){return q.src.sp==='bike'&&q.d0===op.d0&&q.to!==null;})[0]:null,m=op.nf?op.nf.min:op.src.min;
      if(pair){op.to=pair.to;extra[pair.to]=(extra[pair.to]||0)+m;return;}
      var best=null,bc=1e9;
      cand.forEach(function(c){
        var l=load(c),cost=l+25*(c<fi?fi-c:c-ti)+(l+m>AWAY_CAP?100:0);
        if(cost<bc){bc=cost;best=c;}
      });
      if(best===null){op.nf=adaptFields(op.src,p);return;}            // aucun jour disponible : version adaptée sur place
      op.to=best;extra[best]=(extra[best]||0)+m;
    });
  }
  return ops;
}
function moveSess(s,to,from,p){
  var arr=gday(s.w*7-7+s.d),i=arr.indexOf(s);
  if(i>=0)arr.splice(i,1);
  s.w=Math.floor(to/7)+1;s.d=to%7;gday(to).push(s);
  s.moved={from:from,pid:p.id,label:p.label};
}
/* ---------- Courses intermédiaires ----------
   L'objectif reste la course principale. Chaque étape (state.ui.steps) remplace les séances de son jour et allège les jours autour, par-dessus le plan :
   supprimer l'étape rétablit tout. Les jours antérieurs à son ajout ne sont pas modifiés, pour ne pas réécrire ce qui a déjà été fait.
   Étape : {id, name, city, kind:'tri'|'run'|'bike'|'swim', format (tri), distM (autres), date, prio:'prep'|'key', added}.
   Catalogue une discipline : [nom, ville, pays, discipline, distance en m (0 = variable), mois habituel, options]. Comme pour RACE_CAT, surtout un MOIS
   habituel : l'utilisateur choisit le jour exact après vérification sur le site officiel. */
var STEP_CAT=[
  ['Semi-marathon de Paris','Paris','FR','run',21097,3,{date:'2027-03-07'}],
  ['Marathon de Paris','Paris','FR','run',42195,4,{date:'2027-04-04'}],
  ['Marseille-Cassis','Marseille','FR','run',20000,10],
  ['Marathon Nice-Cannes','Nice','FR','run',42195,11],
  ['Run In Lyon · Marathon','Lyon','FR','run',42195,10],
  ['Run In Lyon · Semi-marathon','Lyon','FR','run',21097,10],
  ['Marathon des quais de Bordeaux','Bordeaux','FR','run',42195,11],
  ['Semi-marathon des quais de Bordeaux','Bordeaux','FR','run',21097,11],
  ['Reims Champagne Run · Semi-marathon','Reims','FR','run',21097,10],
  ['Marathon du Médoc','Pauillac','FR','run',42195,9],
  ['Marathon de La Rochelle','La Rochelle','FR','run',42195,11],
  ['Marathon d’Annecy','Annecy','FR','run',42195,4],
  ['Marathon de Tokyo','Tokyo','JP','run',42195,3],
  ['Marathon de Boston','Boston','US','run',42195,4],
  ['Marathon de Londres','Londres','GB','run',42195,4],
  ['Marathon du Cap','Le Cap','ZA','run',42195,5],
  ['Marathon de Sydney','Sydney','AU','run',42195,8],
  ['Marathon de Berlin','Berlin','DE','run',42195,9],
  ['Marathon de Chicago','Chicago','US','run',42195,10],
  ['Marathon de New York','New York','US','run',42195,11],
  ['Marathon de Valence','Valence','ES','run',42195,12],
  ['Marathon d’Amsterdam','Amsterdam','NL','run',42195,10],
  ['Marathon de Rome','Rome','IT','run',42195,3],
  ['L’Étape du Tour','Parcours variable','FR','bike',0,7],
  ['La Marmotte Granfondo des Alpes','Le Bourg-d’Oisans','FR','bike',174000,6],
  ['L’Ardéchoise','Saint-Félicien','FR','bike',0,6],
  ['GF Mont Ventoux','Vaison-la-Romaine','FR','bike',135000,6],
  ['Maratona dles Dolomites','Corvara','IT','bike',138000,7],
  ['Paris-Roubaix Challenge','Roubaix','FR','bike',0,4],
  ['Tour des Flandres Cyclo','Audenarde','BE','bike',0,4],
  ['Open Swim Paris','Paris','FR','swim',5000,7],
  ['Open Swim Lyon','Lyon','FR','swim',5000,9],
  ['Open Swim Agde','Agde','FR','swim',1300,6],
  ['EDF Aqua Challenge Nice','Nice','FR','swim',10000,9],
  ['NAPO Swim Cup','Ajaccio','FR','swim',5000,8],
  ['Défi de Monte-Cristo','Marseille','FR','swim',5000,6],
  ['Traversée du lac d’Annecy','Annecy','FR','swim',0,8]
];
var STEP_K={tri:'Triathlon',run:'Course à pied',bike:'Vélo',swim:'Natation'},STEP_ICO={tri:'race',run:'run',bike:'bike',swim:'swim'},STEP_P={prep:'Préparation',key:'Importante'};
var STEP_PRE={prep:[1,2,2],key:[5,7,10]},STEP_POST={prep:[1,2,2],key:[3,4,7]},stepDraft=null,stepQT=null,stepQS=0;
function stepList(){return state.ui.steps||[];}
function stepDist(st){return st.kind==='tri'?(FORMATS[st.format]||FORMATS.olympic).n:st.distM?STEP_K[st.kind]+' · '+fk(st.distM)+' km':STEP_K[st.kind];}
// taille de l'effort : 0 court, 1 moyen, 2 long (la durée d'allègement et de récupération en dépend)
function stepClass(st){
  if(st.kind==='tri')return ({sprint:0,olympic:1,half:2,full:2})[st.format]||1;
  var m=st.distM||0,l=({run:[10500,30000],bike:[60000,120000],swim:[3000,6000]})[st.kind];
  return !m?1:m<=l[0]?0:m<=l[1]?1:2;
}
// Avant : veille = activation seulement, avant-veille = minimum, puis allégé. Après : repos (sauf effort court en préparation), minimum, puis allégé.
function stepModes(st){
  var g0=idxOfDate(parseYmd(st.date)),c=stepClass(st),key=st.prio==='key',add=st.added?idxOfDate(parseYmd(st.added)):-1e9,o={},i;
  for(i=1;i<=STEP_PRE[st.prio][c];i++)if(g0-i>=add)o[g0-i]=i===1?'eve':i===2?'min':'light';
  for(i=1;i<=STEP_POST[st.prio][c];i++)if(g0+i>=add)o[g0+i]=i===1?((key||c>0)?'off':'min'):i===2?'min':'light';
  return o;
}
// Version adaptée d'une séance : plafonnée en durée, car un pourcentage d'une très longue sortie reste trop long près d'une course
var STEP_CAP={light:{bike:150,run:75},min:{bike:60,run:40}},STEP_RANK={light:1,min:2,eve:3,off:4};
function stepAdapt(src,mode){
  if(mode==='off'||(mode==='min'&&(src.sp==='brick'||src.sp==='str')))return restDay(src.w);
  var nf=adaptFields(src,{mode:mode,pool:true,bike:true});if(!nf)return null;
  var cap=(STEP_CAP[mode]||{})[nf.sp],pw=src.w;
  if(cap&&nf.min>cap)nf=(nf.sp==='bike'?bikeMid:runMid)(REFW[pw-1]||pw,'rec',phaseOf(pw).k,cap);
  return nf;
}
function stepActivation(){
  return S('run','Course · Activation','Veille de course',20,['15 min de footing très facile {r:soft}','4 × 20 s de lignes droites relâchées, récup 1 min','Pas plus : garde tes jambes pour demain. Prépare ton matériel et dors bien'],{sum:'20 min facile + 4 lignes droites',goal:'Réveiller les jambes sans fatiguer. Tu peux aussi la remplacer par du repos.',wk:WK(['Main','- 15m {R:soft}','- 5m {R:z2}'])});
}
function stepInPlan(st){var d=parseYmd(st.date);if(!d)return false;var g=idxOfDate(d);return g>=0&&g<(NW-1)*7;}
// Ce que l'étape change, sans rien modifier
function stepOps(st){
  if(!stepInPlan(st))return null;
  var g0=idxOfDate(parseYmd(st.date)),m=stepModes(st),ops=[];
  gday(g0).forEach(function(s){var src=awaySrc(s);if(src.sp!=='rest'&&src.sp!=='race')ops.push({g:g0,s:s,src:src,race:true,nf:restDay(src.w),mode:'off'});});
  Object.keys(m).map(Number).sort(function(a,b){return a-b;}).forEach(function(g){
    if(g<0||g>=(NW-1)*7)return;
    gday(g).forEach(function(s){
      var src=awaySrc(s);if(src.sp==='rest'||src.sp==='race')return;
      if(m[g]==='eve'){
        var act=st.kind!=='swim'&&!ops.some(function(o){return o.g===g&&o.mode==='eve';});
        ops.push(act?{g:g,s:s,src:src,nf:stepActivation(),mode:'eve'}:{g:g,s:s,src:src,nf:restDay(src.w),mode:'off'});
        return;
      }
      var nf=stepAdapt(src,m[g]);
      if(nf)ops.push({g:g,s:s,src:src,nf:nf,mode:m[g]});
    });
  });
  return ops.sort(function(x,y){return x.g-y.g;});
}
function stepSess(st){
  var g=idxOfDate(parseYmd(st.date)),key=st.prio==='key';
  var s=S('race',st.name,key?'Importante':'Préparation',0,key?['Échauffe-toi progressivement, puis pars à une allure que tu peux tenir jusqu’au bout','Utilise la nutrition et le matériel prévus pour ta course principale','Note tes sensations : elles aideront à ajuster la fin de ta préparation']:['Prends-la comme une séance de qualité : teste ton matériel, ta nutrition et ton allure','Inutile de tout donner : l’objectif reste ta course principale','Rien de nouveau le jour J : garde ce que tu as déjà éprouvé à l’entraînement'],{sum:stepDist(st),goal:key?'Réussir cette course, avec ton objectif principal en tête.':'Te tester sans entamer ta préparation.',tip:'Les jours suivants sont allégés pour récupérer.'});
  s.id='st.'+st.id;s.w=Math.floor(g/7)+1;s.d=g%7;s.step=st.id;SBY[s.id]=s;
  return s;
}
function applySteps(skip){
  var list=stepList().filter(function(st){return st.id!==skip&&stepInPlan(st);}).sort(function(a,b){return a.date<b.date?-1:1;});
  list.forEach(function(st){
    (stepOps(st)||[]).forEach(function(op){
      var s=op.s;if(s.adapt&&s.adapt.step&&STEP_RANK[s.adapt.mode]>=STEP_RANK[op.mode])return;   // si deux courses se suivent, la version la plus légère l'emporte
      var snap=s.orig||copySess(s),id=snap.id,w=s.w,d=s.d,mv=s.moved;
      Object.keys(s).forEach(function(k){delete s[k];});
      Object.assign(s,op.nf,{id:id,w:w,d:d,orig:snap,adapt:{mode:op.mode,label:st.name,pid:st.id,step:true}});
      if(mv)s.moved=mv;
    });
  });
  list.forEach(function(st){
    Object.keys(stepModes(st)).map(Number).forEach(function(g){      // une séance retirée ne laisse pas de carte « Repos » en double
      if(g<0||g>=(NW-1)*7)return;
      var arr=gday(g),keep=arr.filter(function(x){return x.sp!=='rest';});
      if(!keep.length)keep=arr.slice(0,1);
      arr.splice(0,arr.length);keep.forEach(function(x){arr.push(x);});
    });
  });
  list.forEach(function(st){var arr=gday(idxOfDate(parseYmd(st.date)));arr.splice(0,arr.length,stepSess(st));});
}
function stepsOfWeek(n){return stepList().filter(function(st){return stepInPlan(st)&&Math.floor(idxOfDate(parseYmd(st.date))/7)+1===n;});}
function nextStep(){var t=isoDate(today());return stepList().filter(function(st){return st.date>=t&&stepInPlan(st);}).sort(function(a,b){return a.date<b.date?-1:1;})[0]||null;}
function stepSearch(q){
  var n=normS(q),tk=n.split(' ').filter(function(t){return t.length>1;}),out=[];
  if(n.length<2)return out;
  STEP_CAT.forEach(function(e){
    var hay=normS(e[0]+' '+e[1]+' '+(CC_NAMES[e[2]]||e[2])+' '+({run:'course pied running marathon',bike:'velo cyclosportive granfondo',swim:'natation eau libre traversee'})[e[3]]);
    if(tk.every(function(t){return hay.indexOf(t)>=0;}))out.push({src:'cat',name:e[0],city:e[1],cc:e[2],kind:e[3],distM:e[4],month:e[5],date:(e[6]&&e[6].date)||''});
  });
  return out.concat(catSearch(q).map(function(r){return Object.assign({},r,{kind:'tri'});})).slice(0,12);
}
function stepBounds(){var mn=today();if(PLAN_START>mn)mn=PLAN_START;return {min:mn,max:addDays(PLAN[NW-1].start,-1)};}
function stepNew(){
  var b=stepBounds(),c=b.min;
  return {id:'',name:'',city:'',kind:'run',format:'olympic',distKm:'',date:'',prio:'prep',added:isoDate(today()),q:'',res:[],hint:'',cal:{y:c.getFullYear(),m:c.getMonth()}};
}
function stepFromDraft(d){
  var km=parseFloat(String(d.distKm).replace(',','.')),o={id:d.id||('s'+Date.now()),name:String(d.name||'').trim(),city:d.city||'',kind:d.kind,date:d.date,prio:d.prio,added:d.added};
  if(d.kind==='tri')o.format=d.format;else o.distM=km>0?Math.round(km*1000):0;
  return o;
}
function stepResHtml(d){
  if(d.picked||!d.q||normS(d.q).length<2)return '';
  if(!d.res.length)return '<p class="small muted" style="margin:8px 0 0">'+(d.load?'Recherche…':'Aucune course trouvée : garde ce nom, puis choisis la discipline et la date ci-dessous.')+'</p>';
  return '<div class="rres">'+d.res.map(function(r,i){
    var loc=[r.city,CC_NAMES[r.cc]||r.cc].filter(Boolean).join(' · '),when=r.date?fmtLong(parseISO(r.date)):(r.month?'habituellement en '+MONTHS_L[r.month-1]:''),what=r.kind==='tri'?FORMATS[r.format].n:stepDist(r);
    return '<button class="rr" data-act="steppick" data-i="'+i+'"><span class="t"><b>'+esc(r.name)+'</b><small>'+esc(loc)+(loc&&when?' · ':'')+esc(when)+' · '+esc(what)+'</small></span><span class="tag'+(r.src==='wt'?' wt':'')+'">'+(r.src==='wt'?'World Triathlon':'Catalogue')+'</span></button>';
  }).join('')+'</div>';
}
function stepPick(r){
  var d=stepDraft,b=stepBounds();if(!d||!r)return;
  track('race_pick',r.name);
  d.name=r.name;d.city=r.city||'';d.kind=r.kind;d.q='';d.picked=true;d.res=[];d.date='';d.hint='';
  if(r.kind==='tri')d.format=r.format;else d.distKm=r.distM?String(r.distM/1000).replace('.',','):'';
  var rd=r.date?parseISO(r.date):null;
  if(rd&&rd>=b.min&&rd<=b.max){d.date=r.date;d.cal={y:rd.getFullYear(),m:rd.getMonth()};d.hint='Date à reconfirmer à l’inscription.';}
  else if(r.month){
    var y=b.min.getFullYear();if(new Date(y,r.month,0)<b.min)y++;
    d.cal={y:y,m:r.month-1};
    d.hint=new Date(y,r.month-1,1)>b.max?'Cette course a lieu habituellement en '+MONTHS_L[r.month-1]+', après la fin de ta préparation.':'Date habituelle : '+MONTHS_L[r.month-1]+'. Choisis le jour exact (à confirmer sur le site officiel).';
  }else d.hint='Date non connue : cherche-la sur le site officiel, puis choisis le jour exact.';
  if(!r.distM&&r.kind!=='tri')d.hint+=' Le parcours change selon les éditions : indique la distance.';
  renderStep();
}
function stepPvHtml(d){
  if(!d.date)return '<p class="small muted" style="margin:0">Choisis la date pour voir ce qui change dans ton plan.</p>';
  var st=stepFromDraft(d);
  if(!stepInPlan(st))return '<p class="small muted" style="margin:0">Cette date est en dehors de ton plan : il ne sera pas modifié.</p>';
  applyAway(null,st.id);
  var ops=stepOps(st)||[],nr=ops.filter(function(o){return o.race;}).length,nd=ops.filter(function(o){return !o.race&&o.nf.sp==='rest';}).length,na=ops.length-nr-nd,left=diffDays(RACE_DATE,parseYmd(d.date));
  var dn=function(x){return DAYS[(x.getDay()+6)%7].slice(0,3)+' '+dnum(x);},h='';
  h+='<div class="dh"><span>Aperçu</span><span class="dstat"><b class="c-del">'+(nr+nd)+' supprimée'+(nr+nd>1?'s':'')+'</b> · <b class="c-mod">'+na+' modifiée'+(na>1?'s':'')+'</b></span></div>';
  if(left<21)h+='<p class="small" style="margin:0 0 8px;color:#ffd60a">Cette course a lieu '+left+' jours avant ta course principale : cela peut nuire à ton objectif.</p>';
  var aw=awayList().filter(function(p){return p.from<=d.date&&awayTo(p)>=d.date;})[0];
  if(aw)h+='<p class="small muted" style="margin:0 0 8px">Pendant « '+esc(aw.label)+' » : la course passe avant.</p>';
  if(!ops.length)h+='<p class="small muted" style="margin:0">Aucune séance modifiée sur ces dates.</p>';
  ops.forEach(function(o){h+='<div class="arow"><span class="ad">'+dn(addDays(PLAN_START,o.g))+'</span><span class="ar"><s>'+awayLine(o.src)+'</s><br><b class="'+(o.race||o.nf.sp==='rest'?'c-del':'c-mod')+'">'+(o.race?'Remplacée par la course':o.nf.sp==='rest'?'Supprimée (repos)':awayLine(o.nf))+'</b></span></div>';});
  applyAway();
  return h;
}
function renderStep(){
  var d=stepDraft,sh=document.getElementById('sheet'),st=sh.scrollTop,b=stepBounds();
  var seg=function(act,key,opts){return '<div class="rng" role="group">'+opts.map(function(o){return '<button data-act="'+act+'" data-v="'+o[0]+'" aria-pressed="'+(d[key]===o[0])+'">'+o[1]+'</button>';}).join('')+'</div>';};
  // Un seul champ, comme à la création du plan : on tape le nom (recherche) ; sans choix dans la liste, le texte tapé devient le nom de la course
  var h='<div class="eyebrow" style="margin:0 0 8px">Ta course</div><input class="tinp" id="st-q" maxlength="60" autocomplete="off" placeholder="Nom, ville ou discipline (ex. marathon, Lyon)" value="'+esc(d.name||'')+'"><div id="st-res">'+stepResHtml(d)+'</div>'+
    '<p class="small muted" id="st-help" style="margin:8px 0 0">'+(d.picked?ic('check',14).replace('class="ic"','class="ic" style="display:inline;vertical-align:-2px;color:var(--brand)"')+' Course trouvée : discipline, distance et date sont remplies ci-dessous.':'Pas dans la liste ? Garde simplement le nom que tu as tapé : ça marche pour n’importe quelle course.')+'</p>'+
    '<div class="eyebrow" style="margin:18px 0 8px">Discipline</div>'+seg('stepkind','kind',[['run','Course'],['bike','Vélo'],['swim','Natation'],['tri','Triathlon']]);
  if(d.kind==='tri')h+=seg('stepfmt','format',[['sprint','Sprint'],['olympic','Olympique'],['half','70.3'],['full','Complet']]);
  else h+='<label class="inp" style="margin-top:8px"><span>Distance<small>km</small></span><input id="st-dist" inputmode="decimal" autocomplete="off" placeholder="'+({run:'10',bike:'100',swim:'2'})[d.kind]+'" value="'+esc(d.distKm||'')+'"></label>';
  h+='<div class="eyebrow" style="margin:18px 0 8px">Date</div>'+(d.hint?'<p class="small muted" style="margin:0 0 8px">'+esc(d.hint)+'</p>':'')+
    (b.min>b.max?'<p class="small muted" style="margin:0">Plus de date disponible avant la semaine de ta course principale.</p>':calHtml('step',d.date,d.date,b.min,b.max,d.cal.y,d.cal.m))+
    '<div class="eyebrow" style="margin:18px 0 8px">Importance</div>'+seg('stepprio','prio',[['prep','Préparation'],['key','Importante']])+
    '<p class="small muted" style="margin:8px 0 0">'+(d.prio==='key'?'Une course que tu veux réussir : plusieurs jours allégés avant, activation seule la veille, repos le lendemain.':'Un test ou un plaisir : activation seule la veille, puis 1 ou 2 jours de récupération.')+'</p>'+
    '<div class="card ad-ch" id="st-pv" style="margin:18px 0 14px">'+stepPvHtml(d)+'</div>'+
    '<button class="btn pri" data-act="stepsave" style="margin:0 0 10px">'+(d.id?'Enregistrer':'Ajouter la course')+'</button>'+(d.id?'<button class="btn dng" data-act="stepdel">Supprimer la course</button>':'<button class="btn" data-act="steps">Annuler</button>');
  showSheet(d.id?'Modifier la course':'Ajouter une course','Ton plan s’adapte, ton objectif principal ne change pas',h);
  sh.scrollTop=st;
}
function openStepEdit(id){
  var st=stepList().filter(function(x){return x.id===id;})[0];if(!st)return;
  var dt=parseYmd(st.date)||stepBounds().min;
  stepDraft=Object.assign({},st,{format:st.format||'olympic',distKm:st.distM?String(st.distM/1000).replace('.',','):'',q:'',res:[],hint:'',cal:{y:dt.getFullYear(),m:dt.getMonth()}});
  renderStep();
}
function saveStep(){
  var d=stepDraft,o=stepFromDraft(d),list=state.ui.steps=stepList().slice(),i,done=false;
  if(!o.name){toast('Indique le nom de la course');return;}
  if(!o.date){toast('Choisis la date de la course');return;}
  for(i=0;i<list.length;i++)if(list[i].id===o.id){list[i]=o;done=true;}
  if(!done)list.push(o);
  applyAway();save();stepDraft=null;render(true);openSteps();toast(o.name+' : plan adapté');
}
function delStep(){
  var d=stepDraft;if(!d||!d.id)return;
  if(!confirm('Supprimer cette course et rétablir les séances d’origine ?'))return;
  state.ui.steps=stepList().filter(function(x){return x.id!==d.id;});
  delete state.done['st.'+d.id];delete SBY['st.'+d.id];
  applyAway();save();stepDraft=null;render(true);openSteps();toast('Plan rétabli');
}
function openSteps(){
  var list=stepList().slice().sort(function(a,b){return a.date<b.date?-1:1;}),b='<div class="eyebrow" style="margin:0 0 8px">Objectif principal</div><div class="srow" style="cursor:default"><span class="sr-t"><b>'+esc(RNAME)+'</b><small>'+esc(fmtLong(RACE_DATE))+' · '+FMT.n+'</small></span></div>';
  b+='<div class="eyebrow" style="margin:18px 0 8px">Étapes</div>';
  if(!list.length)b+='<p class="muted" style="margin:0 0 4px">Aucune pour l’instant. Ajoute un 10 km, une cyclosportive ou un autre triathlon : le plan s’allège autour de la course.</p>';
  list.forEach(function(st){
    var d=parseYmd(st.date);
    b+='<button class="srow" data-act="stepedit" data-id="'+esc(st.id)+'"><span class="sr-t"><b>'+esc(st.name)+'</b><small>'+esc((d?fmtDay(d)+' '+d.getFullYear():'')+' · '+stepDist(st))+'</small></span><span class="sr-b'+(st.prio==='key'?' ok':'')+'">'+(stepInPlan(st)?STEP_P[st.prio]:'Hors plan')+'</span></button>';
  });
  b+='<button class="btn pri" data-act="stepnew" style="margin-top:12px">Ajouter une course</button>';
  showSheet('Mes courses','Ton objectif et tes étapes',b);sheetRoute('steps');
}
/* ---------- Séance manquée ----------
   Une séance passée, non faite et sans décision est « manquée ». L'app recommande : la laisser tomber, la reporter ou en faire une version courte.
   Décisions dans state.ui.missed[id] = {a:'skip'} ou {a:'move'|'short', to:'AAAA-MM-JJ'}. Le report passe par le même mécanisme que les vacances : annuler rétablit tout. */
var MISS_DAYS=7,MISS_MAX_DAY=120;
function missRec(){return state.ui.missed||{};}
function isMissed(s){return !!s&&s.sp!=='rest'&&s.sp!=='race'&&s.w<NW&&!isDone(s)&&(s.w-1)*7+s.d<idxOfDate(today());}
function missedList(){
  var t=idxOfDate(today()),rec=missRec(),out=[],g;
  for(g=t-1;g>=Math.max(0,t-MISS_DAYS);g--){if(g<(NW-1)*7)gday(g).forEach(function(x){if(isMissed(x)&&!rec[x.id])out.push(x);});}
  return out;
}
// Le jour le plus adapté dans les 7 prochains : ni repos prévu, ni même discipline le même jour, ni journée déjà chargée, ni autour d'une longue séance ou d'une course
function missTarget(m,sp){
  var t=idxOfDate(today()),N=(NW-1)*7,block={},best=null,bc=1e9,g;
  stepList().forEach(function(x){if(stepInPlan(x)){var c=idxOfDate(parseYmd(x.date));block[c-1]=block[c]=block[c+1]=1;}});
  var isLong=function(i){return i>=0&&i<N&&gday(i).some(function(x){return x.sp!=='rest'&&x.min>=120;});};
  for(g=Math.max(0,t);g<=Math.min(N-1,t+6);g++){
    var wk=PLAN[Math.floor(g/7)];
    if(wk.kind==='taper'||wk.kind==='race'||block[g]||isLong(g-1)||isLong(g+1))continue;
    if(wk.layout[g%7].every(function(x){return (x.orig||x).sp==='rest'&&!(x.orig||x).fr;}))continue;
    var l=0,same=false;gday(g).forEach(function(x){if(x.sp!=='rest'){l+=x.min;if(x.sp===sp)same=true;}});
    if(same||l+m>MISS_MAX_DAY)continue;
    var c2=l+(g-t)*10;
    if(c2<bc){bc=c2;best=g;}
  }
  return best;
}
function missAdvice(s){
  var src=awaySrc(s),kind=PLAN[src.w-1].kind,nf=(src.sp==='brick'||src.sp==='str')?null:stepAdapt(src,'light'),isShort=!!nf&&nf.sp!=='rest'&&nf.min<src.min;
  var canMove=src.sp!=='brick'&&kind!=='taper',o={move:canMove?missTarget(src.min,src.sp):null,short:canMove&&isShort?missTarget(nf.min,src.sp):null,shortMin:isShort?nf.min:0};
  if(src.sp==='brick'||src.sp==='str'||src.min<=30||kind==='rec'||kind==='taper'){o.rec='skip';o.why='Ne la rattrape pas : elle ne manquera pas à ta préparation. Passe à la suite.';}
  else if(src.min>=90&&o.short!==null){o.rec='short';o.why='Séance importante, mais trop longue pour s’ajouter telle quelle à ta semaine : fais-en une version plus courte.';}
  else if(o.move!==null){o.rec='move';o.why='Elle trouve sa place cette semaine sans te surcharger.';}
  else if(o.short!==null){o.rec='short';o.why='Telle quelle, elle chargerait trop ta semaine : fais-en une version plus courte.';}
  else{o.rec='skip';o.why='Ta semaine est déjà bien remplie : mieux vaut passer à la suite que tout rattraper.';}
  return o;
}
function missDay(g){var d=addDays(PLAN_START,g);return DAYS[(d.getDay()+6)%7].slice(0,3).toLowerCase()+'. '+fmtDay(d);}
function missButtons(s){
  var o=missAdvice(s),b=[];
  var btn=function(k,t){return '<button class="btn'+(o.rec===k?' pri':'')+'" data-act="missdo" data-id="'+s.id+'" data-a="'+k+'">'+t+'</button>';};
  if(o.short!==null)b.push(['short',btn('short','Version courte ('+fh(o.shortMin)+') '+missDay(o.short))]);
  if(o.move!==null)b.push(['move',btn('move','Reporter au '+missDay(o.move))]);
  b.push(['skip',btn('skip','Laisser tomber')]);
  b.sort(function(x,y){return (y[0]===o.rec)-(x[0]===o.rec);});
  return '<p class="small muted" style="margin:0 0 10px">'+o.why+'</p><div class="miss-b">'+b.map(function(x){return x[1];}).join('')+'</div>';
}
function missCard(){
  var l=missedList();if(!l.length)return '';
  if(l.length>=3){
    return '<section class="card miss-c"><div class="eyebrow">Séances manquées</div><h2 style="margin:6px 0 6px">'+l.length+' séances non faites en 7 jours</h2><p class="small muted" style="margin:0 0 12px">Ça arrive. Ne cherche pas à tout rattraper : c’est le meilleur moyen de te blesser. Reprends simplement le plan là où il en est.</p><div class="miss-b"><button class="btn pri" data-act="missall">Reprendre le plan</button><button class="btn" data-act="gowk" data-w="'+l[0].w+'">Voir les séances</button></div></section>';
  }
  var s=l[0],src=awaySrc(s),d=addDays(PLAN_START,ORIGPOS[s.id]?(ORIGPOS[s.id].w-1)*7+ORIGPOS[s.id].d:(s.w-1)*7+s.d);
  return '<section class="card miss-c"><div class="eyebrow">Séance manquée'+(l.length>1?' · 1 sur '+l.length:'')+'</div><h2 style="margin:6px 0 2px">'+esc(src.title)+'</h2><p class="small muted" style="margin:0 0 10px">'+esc(DAYS[(d.getDay()+6)%7]+' '+fmtDay(d))+' · '+fh(src.min)+'</p>'+missButtons(s)+'</section>';
}
function missDo(id,a){
  var s=SBY[id];if(!s)return;
  var o=missAdvice(s),m=state.ui.missed=state.ui.missed||{},g=a==='move'?o.move:a==='short'?o.short:null,msg='Séance laissée de côté : on continue';
  if(a==='skip')m[id]={a:'skip'};
  else{if(g===null)return;m[id]={a:a,to:isoDate(addDays(PLAN_START,g))};msg=(a==='short'?'Version courte prévue ':'Séance reportée au ')+missDay(g);}
  applyAway();save();render(true);toast(msg);
}
function missUndo(id){
  var m=state.ui.missed||{};delete m[id];
  applyAway();save();render(true);toast('Report annulé');
}
function missAll(){
  var m=state.ui.missed=state.ui.missed||{};
  missedList().forEach(function(x){m[x.id]={a:'skip'};});
  save();render(true);toast('C’est reparti : on reprend le plan');
}
function applyMissed(){
  var rec=missRec(),N=(NW-1)*7;
  Object.keys(rec).forEach(function(id){
    var r=rec[id],x=SBY[id],pos=ORIGPOS[id],d=r.to&&parseYmd(r.to);if(!x||!pos||!d)return;
    var g=idxOfDate(d);if(g<0||g>=N)return;
    if(r.a==='short'){
      var src=awaySrc(x),nf=stepAdapt(src,'light');
      if(nf){var snap=x.orig||copySess(x),w=x.w,dd=x.d;Object.keys(x).forEach(function(k){delete x[k];});Object.assign(x,nf,{id:id,w:w,d:dd,orig:snap,adapt:{mode:'light',label:'Séance manquée',pid:'miss'}});}
    }
    moveSess(x,g,(pos.w-1)*7+pos.d,{id:'miss',label:'Séance manquée'});
  });
}
// skip : identifiant d'une période à ignorer (aperçu en cours de modification) ; skipStep : pareil pour une course intermédiaire
function applyAway(skip,skipStep){
  PLAN.forEach(function(wk){if(!wk.layout){wk.layout=wk.days.map(function(day){return day.sessions.slice();});wk.layout.forEach(function(l,i){l.forEach(function(s){ORIGPOS[s.id]={w:wk.n,d:i};});});}});
  ALLS.forEach(function(s){
    if(!s.orig)return;
    var o=s.orig;Object.keys(s).forEach(function(k){delete s[k];});Object.assign(s,o);
  });
  PLAN.forEach(function(wk){wk.days.forEach(function(day,i){day.sessions=wk.layout[i].slice();day.sessions.forEach(function(s){s.w=wk.n;s.d=i;delete s.moved;});});});
  awayList().forEach(function(p){
    if(p.id===skip)return;
    var ops=planAway(p);if(!ops)return;
    ops.forEach(function(op){
      var s=op.s;
      if(op.nf){
        var snap=s.orig||copySess(s),id=snap.id,w=s.w,d=s.d;
        Object.keys(s).forEach(function(k){delete s[k];});
        Object.assign(s,op.nf,{id:id,w:w,d:d,orig:snap,adapt:{mode:p.mode,label:p.label,pid:p.id}});
      }
      if(op.to!==null){var pos=ORIGPOS[s.id];moveSess(s,op.to,(pos.w-1)*7+pos.d,p);}
    });
  });
  applyMissed();
  applySteps(skipStep);
  PLAN.forEach(function(wk){
    wk.min=0;wk.m=0;wk.count=0;
    wk.days.forEach(function(day){day.sessions.forEach(function(s){if(s.sp!=='rest'){wk.count++;wk.min+=s.min;wk.m+=s.m;}});});
  });
}
function newAwayDraft(wn,type){
  var mon=PLAN[Math.max(0,Math.min(NW-1,wn-1))].start,vac=type==='vacances';
  if(type==='injury'){   // blessure : à partir d'aujourd'hui (ou du début du plan), tout arrêté, jusqu'à nouvel ordre
    var t0=today(),f0=t0<PLAN_START?PLAN_START:t0>RACE_DATE?mon:t0;
    return {id:'',type:'injury',label:'Blessure',from:isoDate(f0),to:isoDate(addDays(f0,13)),open:true,stop:{swim:true,bike:true,run:true,str:true},mode:'same',move:'none',pool:true,bike:true};
  }
  return {id:'',type:type,label:vac?'Vacances':'Week-end',from:isoDate(vac?mon:addDays(mon,4)),to:isoDate(addDays(mon,6)),mode:vac?'min':'same',move:vac?'none':'out',pool:true,bike:true};
}
