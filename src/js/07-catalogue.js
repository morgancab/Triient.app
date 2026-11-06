/* ---------- Catalogue de courses ----------
   Grandes courses récurrentes : [nom, ville, pays, format, mois habituel (1-12), options]. On ne donne qu'un MOIS habituel (les dates changent chaque
   année) : l'utilisateur choisit le jour exact après vérification sur le site officiel. Les épreuves de la fédération internationale (dates exactes)
   viennent en plus de l'API World Triathlon, via le Worker (route /pub/races). Course absente : saisie libre. */
var RACE_CAT=window.RACE_CAT||[];   // fichier races.js, mis à jour automatiquement (voir CATALOGUE.md)
var CC_NAMES={RO:'Roumanie',IL:'Israël',AE:'Émirats arabes unis',TW:'Taïwan',KR:'Corée du Sud',PL:'Pologne',SK:'Slovaquie',UZ:'Ouzbékistan',OM:'Oman',CZ:'Tchéquie',RS:'Serbie',HR:'Croatie',GR:'Grèce',NO:'Norvège',FR:'France',DE:'Allemagne',AT:'Autriche',CH:'Suisse',ES:'Espagne',IT:'Italie',GB:'Royaume-Uni',NL:'Pays-Bas',DK:'Danemark',SE:'Suède',EE:'Estonie',US:'États-Unis',CA:'Canada',AU:'Australie',NZ:'Nouvelle-Zélande',ZA:'Afrique du Sud',BR:'Brésil',MX:'Mexique',BE:'Belgique',PT:'Portugal',LU:'Luxembourg',JP:'Japon',CN:'Chine'};
function normS(s){return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();}
function catSearch(q){
  var n=normS(q),tk=n.split(' ').filter(Boolean),out=[];
  if(n.length<2)return out;
  RACE_CAT.forEach(function(e){
    var hay=normS(e[0]+' '+e[1]+' '+(CC_NAMES[e[2]]||e[2])+' '+({full:'ironman 140.6 xxl',half:'70.3 demi',olympic:'olympique',sprint:'sprint'})[e[3]]);
    if(!tk.filter(function(t){return t.length>1;}).every(function(t){return hay.indexOf(t)>=0;}))return;
    out.push({src:'cat',name:e[0],city:e[1],cc:e[2],format:e[3],month:e[4],date:(e[5]&&e[5].date&&e[5].date>=isoDate(today()))?e[5].date:'',ff:!!(e[5]&&e[5].ff),note:(e[5]&&e[5].note)||'',dist:(e[5]&&(e[5].sw||e[5].bk||e[5].rn||e[5].bikeM))?{swimM:e[5].sw||FORMATS[e[3]].swim,bikeM:e[5].bk||e[5].bikeM||FORMATS[e[3]].bike,runM:e[5].rn||FORMATS[e[3]].run}:null,bikeUp:(e[5]&&e[5].bikeUp)||'',runUp:(e[5]&&e[5].runUp)||'',_s:normS(e[0]).indexOf(tk[0])===0?0:1});
  });
  return out.sort(function(a,b){return a._s-b._s;}).slice(0,12);
}
// épreuves World Triathlon : formats déduits des « spécifications » de l'événement
function wtFormat(specs){
  var t=(specs||[]).map(function(s){return normS(s);}).join(' ');
  if(/ironman|full/.test(t))return 'full';
  if(/middle|70 3|half|long distance|\blong\b/.test(t))return 'half';      // « Long Distance » = circuits T100 (~100 km) : plus proche d'un 70.3 que d'un Ironman
  if(/standard|olympic/.test(t))return 'olympic';
  if(/sprint/.test(t))return 'sprint';
  return 'olympic';
}
function wtResults(list){
  return (list||[]).map(function(e){
    var t=String(e.title||''),dist=/\bT100\b/i.test(t)?{swimM:2000,bikeM:80000,runM:18000}:/\bT50\b/i.test(t)?{swimM:1000,bikeM:40000,runM:10000}:null;     // formats propres aux circuits T100 / T50
    return {src:'wt',name:t,city:e.venue||'',cc:e.cc||'',format:dist?(dist.bikeM>=80000?'half':'olympic'):wtFormat(e.specs),date:e.date||'',dist:dist,bikeUp:'',runUp:''};
  }).filter(function(r){return r.name;});
}
var raceQT=null,raceQSeq=0;
function remoteRaces(q,cb){
  var base=(state.ui&&state.ui.pubApi)||PUB_API;
  try{
    fetch(base+'/pub/races?q='+encodeURIComponent(q)+'&from='+isoDate(today())).then(function(r){return r.json();}).then(function(j){cb(j&&j.ok?wtResults(j.events):[]);}).catch(function(){cb([]);});
  }catch(e){cb([]);}
}
function raceResultsHtml(d){
  var all=(d.cres||[]).concat(d.rres||[]);d.shown=all;
  if(d.picked||!d.q||d.q.length<2)return '';
  if(!all.length)return '<p class="small muted" style="margin:8px 0 0">'+(d.rload?'Recherche…':'Aucune course trouvée : garde ce nom, puis choisis le format et la date ci-dessous.')+'</p>';
  return '<div class="rres">'+all.map(function(r,i){
    var loc=[r.city,CC_NAMES[r.cc]||r.cc].filter(Boolean).join(' · '),when=r.date?fmtLong(parseISO(r.date)):(r.month?'habituellement en '+MONTHS_L[r.month-1]:'');
    return '<button class="rr" data-act="racepick" data-i="'+i+'"><span class="t"><b>'+esc(r.name)+'</b><small>'+esc(loc)+(loc&&when?' · ':'')+esc(when)+' · '+FORMATS[r.format].n+'</small></span><span class="tag'+(r.src==='wt'?' wt':'')+'">'+(r.src==='wt'?'World Triathlon':'Catalogue')+'</span></button>';
  }).join('')+(d.rload?'<p class="small muted" style="margin:6px 2px 0">Recherche des épreuves World Triathlon…</p>':'')+'</div>';
}
function pickRace(r){
  var d=raceDraft;if(!d||!r)return;
  track('race_pick',r.name);
  d.name=r.name;d.city=r.city||'';d.format=r.format;d.sessions=null;d.peak=null;d.dist=r.dist||null;d.bikeUp=r.bikeUp?String(r.bikeUp):'';d.runUp=r.runUp?String(r.runUp):'';d.detail=!!(d.bikeUp||d.runUp);
  d.q='';d.picked=true;d.cres=[];d.rres=[];d.hint='';d.note=r.note||'';
  if(r.date){d.date=r.date;var pd=parseISO(r.date);d.cal={y:pd.getFullYear(),m:pd.getMonth()};if(r.ff)d.hint='Date issue du calendrier officiel de la fédération (FFTRI) : à reconfirmer à l’inscription.';}
  else if(!r.month){d.date='';var t0=addDays(today(),112);d.cal={y:t0.getFullYear(),m:t0.getMonth()};d.hint='Date non connue : cherche-la sur le site officiel de la course, puis choisis le jour exact.';}
  else{
    d.date='';var t=today(),y=t.getFullYear(),m=r.month||t.getMonth()+1;
    if(new Date(y,m-1,28)<addDays(t,28))y++;
    d.cal={y:y,m:m-1};d.hint='Date habituelle : '+MONTHS_L[m-1]+'. Choisis le jour exact (à confirmer sur le site officiel de la course).';
  }
  renderSetup();
}
var dcalM=null,dcalPend=false;
function calHtml(ns,from,to,minD,maxD,cy,cm){
  var first=new Date(cy,cm,1),off=(first.getDay()+6)%7,dim=new Date(cy,cm+1,0).getDate(),t=today(),f=parseYmd(from),e=parseYmd(to),i,g='';
  var prevOk=new Date(cy,cm,0)>=minD,nextOk=new Date(cy,cm+1,1)<=maxD;
  ['L','M','M','J','V','S','D'].forEach(function(x){g+='<div class="cal-w">'+x+'</div>';});
  for(i=0;i<off;i++)g+='<div></div>';
  for(i=1;i<=dim;i++){
    var dt=new Date(cy,cm,i),iso=isoDate(dt),dis=dt<minD||dt>maxD,inr=f&&e&&dt>=f&&dt<=e,st=f&&dt.getTime()===f.getTime(),en=e&&dt.getTime()===e.getTime(),wd=(dt.getDay()+6)%7;
    g+='<button class="cd'+(dis?' dis':'')+(inr?' in':'')+(st?' st':'')+(en?' en':'')+(st&&en?' one':'')+(dt.getTime()===t.getTime()?' td':'')+(wd>=5?' we':'')+'" data-act="calday" data-ns="'+ns+'" data-d="'+iso+'" aria-label="'+esc(fmtLong(dt))+'" aria-pressed="'+!!inr+'"'+(dis?' disabled':'')+'><span>'+i+'</span></button>';
  }
  return '<div class="cal"><div class="cal-h"><button class="iconbtn" data-act="calnav" data-ns="'+ns+'" data-v="-1" aria-label="Mois précédent"'+(prevOk?'':' disabled')+'>'+ic('left',18)+'</button><b>'+MONTHS_L[cm]+' '+cy+'</b><button class="iconbtn" data-act="calnav" data-ns="'+ns+'" data-v="1" aria-label="Mois suivant"'+(nextOk?'':' disabled')+'>'+ic('right',18)+'</button></div><div class="cal-g">'+g+'</div></div>';
}
// 1re touche : début ; 2e touche : fin (les dates s'ordonnent toutes seules)
function calPick(from,to,pending,iso){
  if(pending){var a=from<=iso?from:iso,b=from<=iso?iso:from;return {from:a,to:b,pending:false};}
  return {from:iso,to:iso,pending:true};
}
function awayCalInit(d){var f=parseYmd(d.from)||PLAN_START;d.cal={y:f.getFullYear(),m:f.getMonth()};d.pending=false;return d;}
function awayDates(p){
  var f=parseYmd(p.from),t=parseYmd(p.to),dn=function(d){return DAYS[(d.getDay()+6)%7].slice(0,3).toLowerCase()+' '+fmtDay(d);},n=f&&t?diffDays(t,f)+1:0;
  if(!p.cal)awayCalInit(p);
  if(isInj(p)){
    var seg2='<div class="rng" role="group"><button data-act="injopen" data-v="1" aria-pressed="'+!!p.open+'">Jusqu’à nouvel ordre</button><button data-act="injopen" data-v="0" aria-pressed="'+!p.open+'">Jusqu’à une date</button></div>';
    if(p.open)return '<div class="eyebrow" style="margin:18px 0 8px">Durée</div>'+seg2+'<p class="small muted" style="margin:8px 0 0">Le plan reste en pause jusqu’à ce que tu indiques ta reprise. Touche le jour où la blessure a commencé.</p>'+
      '<div class="cal-s">'+(f?'Depuis le <b>'+dn(f)+'</b>':'')+'</div>'+calHtml('away',p.from,p.from,PLAN_START,RACE_DATE,p.cal.y,p.cal.m);
    return '<div class="eyebrow" style="margin:18px 0 8px">Durée</div>'+seg2+'<div class="rng" role="group" aria-label="Raccourcis" style="margin-top:8px">'+[['1w','1 semaine'],['2weeks','2 semaines'],['month','1 mois']].map(function(x){return '<button data-act="calpreset" data-v="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div>'+
      '<div class="cal-s">'+(f&&t?'<b>'+dn(f)+'</b> → <b>'+dn(t)+'</b> · '+n+' jour'+(n>1?'s':''):'')+(p.pending?'<span class="cal-hint">Touche le dernier jour</span>':'')+'</div>'+
      calHtml('away',p.from,p.to,PLAN_START,RACE_DATE,p.cal.y,p.cal.m);
  }
  return '<div class="eyebrow" style="margin:18px 0 8px">Dates</div><div class="rng" role="group" aria-label="Raccourcis">'+[['weekend','Week-end'],['week','Semaine'],['2weeks','2 semaines']].map(function(x){return '<button data-act="calpreset" data-v="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div>'+
    '<div class="cal-s">'+(f&&t?'<b>'+dn(f)+'</b> → <b>'+dn(t)+'</b> · '+n+' jour'+(n>1?'s':''):'')+(p.pending?'<span class="cal-hint">Touche le dernier jour</span>':'')+'</div>'+
    calHtml('away',p.from,p.to,PLAN_START,RACE_DATE,p.cal.y,p.cal.m);
}
function awayPreset(p,v){
  var a=parseYmd(p.from)||PLAN_START,mon=addDays(a,-((a.getDay()+6)%7)),lo=PLAN_START,hi=RACE_DATE;
  var cl=function(d){return d<lo?lo:d>hi?hi:d;},r={weekend:[4,6],week:[0,6],'2weeks':[0,13]}[v];
  if(isInj(p)){p.to=isoDate(cl(addDays(a,{'1w':6,'2weeks':13,month:29}[v]||6)));p.touched=true;awayCalInit(p);return;}   // blessure : à partir du jour de début
  p.from=isoDate(cl(addDays(mon,r[0])));p.to=isoDate(cl(addDays(mon,r[1])));p.touched=true;awayCalInit(p);
}
function awayPreview(p){
  applyAway(p.id);
  var ops=planAway(p),rows=[],saved=0,moved=0;
  if(ops){
    ops.forEach(function(op){
      if(!op.nf&&op.to===null)return;
      rows.push({d:addDays(PLAN_START,op.d0),src:op.src,nf:op.nf,to:op.to===null?null:addDays(PLAN_START,op.to)});
      if(op.nf)saved+=op.src.min-op.nf.min;if(op.to!==null)moved++;
    });
  }
  applyAway();
  return {rows:rows,saved:saved,moved:moved,bad:!ops};
}
function awayLine(x){return esc(x.title)+(x.sp==='rest'?'':' · '+fh(x.min));}
function renderAway(){
  var p=awayDraft,sh=document.getElementById('sheet'),st=sh.scrollTop,pv=awayPreview(p);
  var seg=function(act,key,opts){return '<div class="rng" role="group">'+opts.map(function(o){return '<button data-act="'+act+'" data-v="'+o[0]+'" aria-pressed="'+(p[key]===o[0])+'">'+o[1]+'</button>';}).join('')+'</div>';};
  var b='<div class="eyebrow" style="margin:0 0 8px">Type</div>'+seg('awaytype','type',[['weekend','Week-end'],['vacances','Vacances'],['injury','Blessure']]);
  if(isInj(p)){
    var sx=p.stop||{},all=injAll(p),stx=stepList().filter(function(st){return st.date>=p.from&&st.date<=awayTo(p);});
    b+='<div class="tip" style="margin:14px 0 0"><b>Demande conseil à un médecin.</b> Lui ou ton kiné peut te dire quels sports arrêter, combien de temps, et quand reprendre. L’app adapte ton plan, elle ne remplace pas un avis médical.</div>'+
      awayDates(p)+
      '<div class="eyebrow" style="margin:18px 0 8px">Sports arrêtés</div><div class="rng" role="group">'+INJ_SP.map(function(k){return '<button data-act="injsp" data-v="'+k[0]+'" aria-pressed="'+!!sx[k[0]]+'">'+k[1]+'</button>';}).join('')+'</div>'+
      '<button class="chip" style="border:0;min-height:32px;margin-top:8px" data-act="injall">'+(all?'Garder certains sports':'Tout arrêter : pause du plan')+'</button>'+
      '<p class="small muted" style="margin:8px 0 0">'+(all?'Aucune séance pendant la période : le plan est en pause.':'Les séances des sports arrêtés deviennent du repos. L’enchaînement vélo-course s’arrête si l’un des deux l’est.')+'</p>';
    if(!all)b+='<div class="eyebrow" style="margin:18px 0 8px">Les autres sports</div>'+seg('awaymode','mode',[['same','Identique'],['light','Allégé'],['min','Minimum']])+
      '<p class="small muted" style="margin:8px 0 0">'+({same:'Séances inchangées.',light:'Environ −30 % : séances plus courtes et faciles, sans intensité.',min:'Environ −60 % : un simple entretien.'})[p.mode==='off'?'min':p.mode]+'</p>';
    if(stx.length)b+='<p class="small" style="margin:12px 0 0;color:#ffd60a">'+esc(stx.map(function(st){return st.name;}).join(', '))+' tombe'+(stx.length>1?'nt':'')+' pendant cette période et reste'+(stx.length>1?'nt':'')+' au programme. Retire-'+(stx.length>1?'les':'la')+' dans Mes courses si tu ne peux pas y participer.</p>';
  }else{
  b+=awayDates(p)+
    '<div class="eyebrow" style="margin:18px 0 8px">Intensité</div>'+seg('awaymode','mode',[['same','Identique'],['light','Allégé'],['min','Minimum'],['off','Repos']])+
    '<p class="small muted" style="margin:8px 0 0">'+({same:'Séances inchangées : seul le matériel manquant les modifie.',light:'Environ −30 % : mêmes jours, séances plus courtes et faciles, plus d’intensité.',min:'Environ −60 % : un simple entretien, séances courtes et faciles.',off:'Aucune séance pendant la période.'})[p.mode]+'</p>';
  if(p.mode!=='off')b+='<div class="eyebrow" style="margin:18px 0 8px">Matériel sur place</div><div class="rng"><button data-act="awayeq" data-v="pool" aria-pressed="'+!!p.pool+'">Piscine</button><button data-act="awayeq" data-v="bike" aria-pressed="'+!!p.bike+'">Vélo</button></div><p class="small muted" style="margin:8px 0 0">Sans piscine ou sans vélo, la séance est remplacée par un footing'+(p.mode==='same'?' de même logique':' facile')+'.</p>';
  b+='<div class="eyebrow" style="margin:18px 0 8px">Séances impossibles sur place</div>'+seg('awaymove','move',[['none','Les remplacer'],['out','Les reporter']])+
    '<p class="small muted" style="margin:8px 0 0">'+(p.move==='out'?'Les séances que tu ne peux pas faire (matériel absent, ou repos) sont déplacées sur les jours autour de la période (jusqu’à 8 jours avant ou après), les moins chargés d’abord, sans toucher aux jours de repos. Elles gardent leur contenu.':'Elles restent sur leur jour, remplacées par une version adaptée (ou du repos).')+'</p>';
  }
  b+='<div class="card ad-ch" style="margin:18px 0 14px"><div class="dh"><span>Aperçu</span>'+(pv.bad?'':'<span class="dstat">'+pv.rows.length+' séance'+(pv.rows.length>1?'s':'')+(pv.saved?' · <b>'+(pv.saved>=0?'−':'+')+fh(Math.abs(pv.saved))+'</b>':'')+'</span>')+'</div>';
  if(pv.bad)b+='<p class="small muted" style="margin:0">Vérifie les dates.</p>';
  else if(!pv.rows.length)b+='<p class="small muted" style="margin:0">Aucune séance modifiée sur ces dates.</p>';
  else pv.rows.forEach(function(r){
    var dn=function(d){return DAYS[(d.getDay()+6)%7].slice(0,3)+' '+dnum(d);},dl=function(d){return DAYS[(d.getDay()+6)%7]+' '+fmtDay(d);};
    b+='<div class="arow"><span class="ad">'+dn(r.d)+'</span><span class="ar">'+(r.nf?'<s>'+awayLine(r.src)+'</s><br><b class="'+(r.nf.sp==='rest'?'c-del':'c-mod')+'">'+(r.nf.sp==='rest'?'Repos':awayLine(r.nf))+'</b>':'<b>'+awayLine(r.src)+'</b>')+(r.to?'<div class="mvto">→ Reportée au <b>'+dl(r.to)+'</b></div>':'')+'</span></div>';
  });
  if(isInj(p)&&p.open&&!pv.bad)b+='<p class="small muted" style="margin:10px 0 0">L’aperçu montre les 7 prochains jours : la pause continue ensuite tant que tu n’as pas indiqué ta reprise.</p>';
  b+='</div>'+(isInj(p)&&p.id&&p.open?'<button class="btn pri" data-act="injresume" data-id="'+esc(p.id)+'" style="margin:0 0 10px">J’ai repris l’entraînement</button>':'')+
    '<button class="btn'+(isInj(p)&&p.id&&p.open?'':' pri')+'" data-act="awaysave" style="margin:0 0 10px">'+(p.id?'Enregistrer':isInj(p)?(injAll(p)?'Mettre le plan en pause':'Adapter mon plan'):'Activer')+'</button>'+(p.id?'<button class="btn dng" data-act="awaydel">Supprimer la période</button>':'<button class="btn" data-act="closesheet">Annuler</button>');
  showSheet(p.id?'Modifier la période':isInj(p)?'Blessure':'Vacances / week-end',isInj(p)?'La date de ta course ne change pas : les séances de la période sont retirées':'Le plan s’adapte, tu peux revenir en arrière à tout moment',b);
  sh.scrollTop=st;
}
function saveAway(){
  var p=awayDraft,inj=isInj(p),a=parseYmd(p.from),b=parseYmd(inj&&p.open?p.from:p.to);
  if(!a||!b||b<a){toast('Vérifie les dates');return;}
  var list=state.ui.away=state.ui.away||[],o={id:p.id||('a'+Date.now()),type:p.type,label:p.label,from:p.from,to:inj&&p.open?p.from:p.to,mode:p.mode,move:p.move||'none',pool:!!p.pool,bike:!!p.bike},i,done=false;
  if(inj){var sx=p.stop||{};o.open=!!p.open;o.stop={};INJ_SP.forEach(function(k){if(sx[k[0]])o.stop[k[0]]=true;});o.move='none';if(o.mode==='off')o.mode='min';}
  for(i=0;i<list.length;i++)if(list[i].id===o.id){list[i]=o;done=true;}
  if(!done)list.push(o);
  applyAway();save();closeSheet();render(true);
  toast(inj?(injAll(o)?'Plan en pause. Prends soin de toi':'Plan adapté à ta blessure'):o.label+' enregistré : plan adapté');
}
function delAway(){
  if(!awayDraft||!awayDraft.id)return;
  if(!confirm('Supprimer cette période et rétablir les séances d’origine ?'))return;
  state.ui.away=awayList().filter(function(x){return x.id!==awayDraft.id;});
  applyAway();save();closeSheet();render(true);toast('Plan rétabli');
}
// Reprise après une blessure : la période s'arrête la veille, avec ou sans semaine allégée
function injResume(id){
  var p=awayList().filter(function(x){return x.id===id;})[0];if(!p)return;
  showSheet('Reprise de l’entraînement','Reprends avec l’accord de ton médecin ou de ton kiné',
    '<p style="margin:0 0 14px">Après une pause, quelques jours en douceur limitent le risque de rechute. Si la douleur revient, arrête-toi et demande conseil.</p>'+
    '<button class="btn pri" data-act="injback" data-id="'+esc(id)+'" data-v="soft" style="margin:0 0 10px">Reprise progressive : 1 semaine allégée</button>'+
    '<button class="btn" data-act="injback" data-id="'+esc(id)+'" data-v="full" style="margin:0 0 10px">Reprendre le plan normalement</button>'+
    '<button class="btn" data-act="closesheet">Pas encore</button>');
}
function injBack(id,v){
  var list=awayList(),p=list.filter(function(x){return x.id===id;})[0];if(!p)return;
  var t=today(),y=isoDate(addDays(t,-1));
  if(p.from>y)state.ui.away=list.filter(function(x){return x.id!==id;});   // commencée aujourd'hui : rien à garder
  else{p.open=false;p.to=y;}
  if(v==='soft')(state.ui.away=state.ui.away||[]).push({id:'a'+Date.now(),type:'vacances',label:'Reprise progressive',from:isoDate(t),to:isoDate(addDays(t,6)),mode:'light',move:'none',pool:true,bike:true});
  applyAway();save();closeSheet();render(true);toast(v==='soft'?'Bonne reprise : une semaine en douceur':'Bonne reprise');
}
// Accueil : blessure en cours (pause ouverte ou période datée)
function injCard(){
  var p=injNow();if(!p)return '';
  var n=diffDays(today(),parseYmd(p.from));
  return '<section class="card"><div class="install">'+ic('info',22)+'<div><p><b>'+(injAll(p)?'Plan en pause':'Plan adapté')+' · '+esc(p.label)+'</b><br><span class="small muted">'+esc(awayDesc(p))+' · '+(p.open?(n>0?'depuis '+n+' jour'+(n>1?'s':''):'depuis aujourd’hui'):'jusqu’au '+fmtDay(parseYmd(p.to)))+'</span></p>'+
    '<div class="btns" style="margin-top:10px">'+(p.open?'<button class="btn pri" data-act="injresume" data-id="'+esc(p.id)+'" style="height:44px">J’ai repris</button>':'')+'<button class="btn" data-act="awayedit" data-id="'+esc(p.id)+'" style="height:44px">Modifier</button></div></div></div></section>';
}
function openAwayList(){
  var list=awayList().slice().sort(function(x,y){return x.from<y.from?-1:1;}),b='';
  if(!list.length)b+='<p class="muted">Aucune période pour l’instant. Pendant un week-end ou des vacances, le plan est allégé ou modifié selon ce que tu choisis. En cas de blessure, il arrête les sports que tu ne peux plus pratiquer, ou se met en pause.</p>';
  list.forEach(function(p){
    b+='<button class="srow" data-act="awayedit" data-id="'+esc(p.id)+'"><span class="sr-t"><b>'+esc(p.label)+' · '+esc(awayDesc(p))+'</b><small>'+esc(awaySpan(p))+'</small></span><span class="sr-b">Modifier</span></button>';
  });
  b+='<div class="btns" style="margin-top:12px"><button class="btn pri" data-act="awayopen" data-w="'+wv+'">Vacances ou week-end</button><button class="btn" data-act="awayopen" data-t="injury" data-w="'+wv+'">Déclarer une blessure</button></div>';
  showSheet('Vacances & blessures','Adapter le plan pendant une absence ou une blessure',b);sheetRoute('away');
}
function awayBanner(wk){
  var a0=idxOfDate(wk.start),a1=a0+6,ps=awayList().filter(function(p){var f=parseYmd(p.from),t=parseYmd(awayTo(p));return f&&t&&idxOfDate(f)<=a1&&idxOfDate(t)>=a0;});
  var sts=stepsOfWeek(wk.n).map(function(st){return '<div class="banner" style="align-items:center">'+ic('race',20)+'<div style="flex:1"><b>'+esc(st.name)+'</b><br>'+esc(fmtLong(parseYmd(st.date))+' · '+STEP_P[st.prio])+'</div><button class="chip" style="border:0" data-act="stepedit" data-id="'+esc(st.id)+'">Modifier</button></div>';}).join('');
  if(!ps.length)return sts;
  return sts+ps.map(function(p){return '<div class="banner" style="align-items:center">'+ic('info',20)+'<div style="flex:1"><b>'+esc(p.label)+' · '+esc(awayDesc(p))+'</b><br>'+esc(awaySpan(p))+'</div><button class="chip" style="border:0" data-act="awayedit" data-id="'+esc(p.id)+'">Modifier</button></div>';}).join('');
}
function awayNote(s){
  if(s.moved&&s.moved.pid==='miss'){var o0=addDays(PLAN_START,s.moved.from);return '<div class="goal adp-n"><b>Séance reportée</b>Prévue à l’origine le '+DAYS[(o0.getDay()+6)%7].toLowerCase()+' '+fmtDay(o0)+(s.adapt?', en version plus longue':'')+'.<br><button class="chip" style="border:0;min-height:28px;margin-top:8px" data-act="missundo" data-id="'+s.id+'">Annuler le report</button></div>';}
  if(s.step)return '<div class="goal adp-n"><b>Course intermédiaire</b>Tes séances autour de cette course sont adaptées.<br><button class="chip" style="border:0;min-height:28px;margin-top:8px" data-act="stepedit" data-id="'+esc(s.step)+'">Modifier la course</button></div>';
  if(!s.adapt&&!s.moved)return '';
  var pid=(s.adapt||s.moved).pid,lab=(s.adapt||s.moved).label,t='';
  var ap=awayList().filter(function(x){return x.id===pid;})[0];
  if(s.adapt&&s.orig)t+='<b>Séance adaptée · '+esc(lab)+' ('+esc(ap?awayDesc(ap):AWAY_N[s.adapt.mode])+')</b>Séance d’origine : '+esc(s.orig.title)+(s.orig.sp!=='rest'?' · '+fh(s.orig.min):'')+'.<br>';
  else t+='<b>Séance déplacée · '+esc(lab)+'</b>';
  if(s.moved){var o=addDays(PLAN_START,s.moved.from);t+='Prévue à l’origine le '+DAYS[(o.getDay()+6)%7].toLowerCase()+' '+fmtDay(o)+'.<br>';}
  return '<div class="goal adp-n">'+t+'<button class="chip" style="border:0;min-height:28px;margin-top:8px" data-act="'+(s.adapt&&s.adapt.step?'stepedit':'awayedit')+'" data-id="'+esc(pid)+'">'+(s.adapt&&s.adapt.step?'Modifier la course':'Modifier la période')+'</button></div>';
}
