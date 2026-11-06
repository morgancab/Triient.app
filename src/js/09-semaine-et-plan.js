/* ---------- Distance estimée des séances vélo / course : durée de chaque bloc × vitesse cible ----------
   Vitesses : celles calculées depuis tes activités Garmin (autoProf) ; à défaut, repères par défaut (ou seuil saisi pour la course). */
var DEF_RUN={soft:430,z2:390,tempo:330,im:375},DEF_BIKE={soft:23,z2:26,ft:28,sw:30,im:28};
function tokKmh(t,k){
  var ap=autoProf(),p=effProf(ap),hz=ap&&ap.hz,v=0;
  if(t==='R'){
    var pace=0;
    if(ap&&k==='im'&&ap.imRun)pace=ap.imRun;
    else if(ap&&ap.runAt&&k!=='im'){
      var d={soft:[0,hz[0]],z2:[hz[0]+1,hz[1]],tempo:[hz[2]+1,hz[3]]}[k],pa=d&&ap.runAt(d[1]),pb=d&&ap.runAt(d[0]||d[1]-10);
      if(pa&&pb)pace=k==='soft'?pa*1.05:(pa+pb)/2;
    }
    if(!pace&&p.thr&&RN[k]&&RN[k][3]!==undefined)pace=p.thr+(RN[k][3]+RN[k][4])/2;
    if(!pace)pace=DEF_RUN[k]||DEF_RUN.z2;
    return 3600/pace;
  }
  if(t==='B'){
    if(ap){
      var fl={im:1,ft:1.03,sw:1.10}[k];
      if(fl&&ap.imBike)v=ap.imBike*fl;
      else if(ap.bikeAt){var z={soft:1,z2:2,ft:3,sw:4}[k];if(z===1)v=(ap.bikeAt(hz[0])||0)*0.95;else if(z){var sa=ap.bikeAt(hz[z-2]+1),sb=ap.bikeAt(hz[z-1]);if(sa&&sb)v=(sa+sb)/2;}}
    }
    if(!v&&!ap&&k==='im')v=declBikeIm();
    return v||DEF_BIKE[k]||DEF_BIKE.z2;
  }
  return 0;
}
function estKm(s){
  if(s.sp!=='bike'&&s.sp!=='run'&&s.sp!=='brick')return null;
  var out={bike:0,run:0};
  var acc=function(st,n){
    var sport=st.t==='B'?'bike':st.t==='R'?'run':st.rest?(s.sp==='bike'?'bike':'run'):null;
    if(!sport)return;
    var v=st.rest?tokKmh(sport==='bike'?'B':'R','soft')*(sport==='run'?0.8:1):tokKmh(st.t,st.key),m;
    m=st.u==='mtr'?st.val:st.u==='km'?st.val*1000:st.u==='s'?st.val*v/3.6:st.val*v*1000/60;
    out[sport]+=m*n;
  };
  if(s.wk)wkBlocks(s.wk).forEach(function(r){if(r.k==='step')acc(r.st,1);else if(r.k==='rep')r.steps.forEach(function(st){acc(st,r.n);});});
  else if(s.sp==='bike'||s.sp==='run')out[s.sp]=s.min*tokKmh(s.sp==='bike'?'B':'R','z2')*1000/60;
  return out.bike+out.run>0?out:null;
}
function kmRound(m){var k=m/1000;return k<10?(Math.round(k*2)/2).toFixed(1).replace('.',','):String(Math.round(k));}
function kmChips(s){
  if(s.m)return '<span class="mc">'+km(s.m)+' km</span>';
  var e=estKm(s);if(!e)return '';
  var c=function(m,l){return m>=500?'<span class="mc" title="Distance estimée d’après tes allures cibles">≈ '+kmRound(m)+' km'+(l?' '+l:'')+'</span>':'';};
  return s.sp==='brick'?c(e.bike,'vélo')+c(e.run,'course'):c(e.bike+e.run,'');
}
function wkBlocks(wk){
  var rows=[],sec='main',grp=null;
  var close=function(){if(grp){rows.push({k:'rep',n:grp.n,steps:grp.steps});grp=null;}};
  wk.split('\n').forEach(function(l){
    var t=l.trim(),m;
    if(!t){close();return;}
    if((m=/^(\d+)x$/.exec(t))){close();grp={n:+m[1],steps:[]};return;}
    if(t.charAt(0)!=='-'){close();if(/^warmup$/i.test(t))sec='warm';else if(/^cooldown$/i.test(t))sec='cool';else{sec='main';if(!/^main$/i.test(t))rows.push({k:'head',text:t});}return;}
    m=/^-\s+(\d+)(m|s|mtr|km)(?:\s+(rest|\{([RBS]):(\w+)\}))?$/.exec(t);
    if(!m)return;
    var st={sec:sec,dur:durTxt(+m[1],m[2]),val:+m[1],u:m[2],rest:m[3]==='rest',t:m[4],key:m[5]};
    if(grp)grp.steps.push(st);
    else{
      var prev=rows[rows.length-1],f=prev&&prev.k==='rep'&&prev.steps[0];
      if(f&&f.dur===st.dur&&f.t===st.t&&f.key===st.key)prev.n++;      // « (n-1) × [effort + récup] » puis un dernier effort = « n × »
      else rows.push({k:'step',st:st});
    }
  });
  close();
  return rows;
}
function chipsFor(t,k){
  var raw=tx('{'+t.toLowerCase()+':'+k+'}'),out=[];
  if(raw.charAt(0)!=='(')return out;
  raw.slice(1,-1).split(' · ').forEach(function(p){
    out.push({c:/bpm/.test(p)?'hr':/\/km|\/100|km\/h/.test(p)?'pc':'rpe',t:p.replace(/^≈ /,'').replace(/^RPE\s*/,'Effort ')});
  });
  if(t==='B'){var lb=wkLab('B',k);if(/km\/h$/.test(lb)){out=out.filter(function(c){return !/km\/h/.test(c.t);});out.push({c:'pc',t:lb.replace('-','–').replace('km/h',' km/h')});}}
  var ord={pc:0,hr:1,rpe:2};
  return out.sort(function(a,b){return ord[a.c]-ord[b.c];});
}
function stepRow(st,name){
  var base=(TOKN[st.t]||{})[st.key]||'';
  var nm=name||(st.rest?'Repos':st.sec==='warm'?'Échauffement'+(base?' · '+base.toLowerCase():''):st.sec==='cool'?'Retour au calme'+(base?' · '+base.toLowerCase():''):base||'Bloc');
  var chips=st.rest?[]:chipsFor(st.t,st.key);
  return '<div class="st"><span class="du">'+esc(st.dur)+'</span><div class="bd"><div class="nm">'+esc(nm)+'</div>'+(chips.length?'<div class="chips">'+chips.map(function(c){return '<span class="cp '+c.c+'">'+esc(c.t)+'</span>';}).join('')+'</div>':'')+'</div></div>';
}
function stepsHtml(s){
  var out='';
  wkBlocks(s.wk).forEach(function(r){
    if(r.k==='head')out+='<div class="sub-t">'+esc(r.text)+'</div>';
    else if(r.k==='step')out+=stepRow(r.st);
    else out+='<div class="rep"><div class="rh">'+r.n+' ×</div>'+r.steps.map(function(st,i){return stepRow(st,i>0&&!st.rest?'Récupération':null);}).join('')+'</div>';
  });
  return out;
}
var TIP_SKIP=/^(Échauffement|Corps de séance|Retour au calme|Série \d|Complète en|Durée totale|Toute la sortie|Reste de la sortie|Footing en|Footing très|Endurance|Puis |Dernières 5|Fin de sortie|Entre et après|\d+ (×|min))/i;
function liHtml(l){var t=tx(l),m=/^([^:]{3,44}) : (.+)$/.exec(t);return '<li>'+(m?'<b>'+esc(m[1])+'</b> : '+esc(m[2]):esc(t))+'</li>';}
function detailBody(s){
  var h='',blocks=s.wk?stepsHtml(s):'';
  if(blocks)h+='<div class="sec-t">Déroulé</div>'+blocks;
  var tl=blocks?s.lines.filter(function(l){return !TIP_SKIP.test(l);}):s.lines;
  if(tl.length)h+='<div class="sec-t">'+(blocks?'Conseils':'Détail de la séance')+'</div><ul>'+tl.map(liHtml).join('')+'</ul>';
  return h;
}
function pq(s){return mmss(s).replace(':',"'");}
function swimRange(k){
  var ap=autoProf(),p=state.ui.prof||{},im=ap&&ap.imSwim;if(!im)return null;
  var cs=p.css||ap.css||im-10;
  return {easy:[im+6,im+14],end:[im,im+6],im:[im-3,im+3],css:[cs-1,cs+1],fast:[cs-6,cs-2]}[k]||null;
}
function wkTgt(t,k){
  var zi={sprint:['Z4-Z5 HR','Z4-Z5 HR'],olympic:['Z4 HR','Z4 HR'],half:['Z3 HR','Z3 HR']}[FCLS]||['Z2-Z3 HR','Z2-Z3 HR'];
  if(t==='R')return {soft:'Z1 HR',z2:'Z2 HR',tempo:'Z4 HR',im:zi[0]}[k]||'';   // allure de course : la FC accompagne l'allure
  if(t==='B')return {soft:'Z1 HR',z2:'Z2 HR',ft:'Z3 HR',sw:'Z4 HR',im:zi[1]}[k]||'';
  return '';
}
function wkLab(t,k){
  var ap=autoProf();if(!ap)return '';
  if(t==='R'){
    if(k==='im')return ap.imRun?pq(ap.imRun*0.97)+'-'+pq(ap.imRun*1.03)+'/km':'';
    var hz=ap.hz,d={soft:[0,hz[0]],z2:[hz[0]+1,hz[1]],tempo:[hz[2]+1,hz[3]]}[k];
    if(!d||!ap.runAt)return '';
    var pa=ap.runAt(d[1]),pb=ap.runAt(d[0]||d[1]-10);
    if(!pa||!pb)return '';
    return k==='soft'?pq(pa)+'+/km':pq(pa)+'-'+pq(pb)+'/km';
  }
  if(t==='B'){
    var fl={im:1,ft:1.03,sw:1.10}[k];
    if(fl&&ap.imBike){var vl=ap.imBike*fl;return Math.round(vl*0.95)+'-'+Math.round(vl*1.05)+'km/h';}
    var z={z2:2,ft:3,sw:4}[k];
    if(z&&ap.bikeAt){var sa=ap.bikeAt(ap.hz[z-2]+1),sb=ap.bikeAt(ap.hz[z-1]);if(sa&&sb)return Math.round(sa)+'-'+Math.round(sb)+'km/h';}
    return '';
  }
  if(t==='S'){var r=swimRange(k);return r?pq(r[0])+'-'+pq(r[1])+'/100':'';}
  return '';
}
// Allure CIBLE (vraie cible de vitesse sur la montre) : course (blocs tempo et allure Ironman) et natation (tous les blocs).
// Prérequis côté intervals.icu : le « seuil d’allure » du sport (et ses zones d’allure) doit être renseigné, sinon l’allure est supprimée à l’export Garmin.
function wkPace(t,k){
  if(t==='S'){var sr=swimRange(k);return sr?mmss(sr[0])+'-'+mmss(sr[1])+'/100m Pace':'';}
  if(t==='B'){var apb=autoProf(),fb={im:1,ft:1.03,sw:1.10}[k];if(!apb||!apb.imBike||!fb)return '';var vb=apb.imBike*fb;return mmss(3600/(vb*1.05))+'-'+mmss(3600/(vb*0.95))+'/km Pace';}
  var ap=autoProf();if(t!=='R'||!ap)return '';
  var a,b;
  if(k==='im'&&ap.imRun){a=ap.imRun*0.97;b=ap.imRun*1.03;}
  else if(k==='tempo'&&ap.runAt){a=ap.runAt(ap.hz[3]);b=ap.runAt(ap.hz[2]+1);}
  if(!a||!b)return '';
  return mmss(a)+'-'+mmss(b)+'/km Pace';
}
function wkText(wk){
  return wk.split('\n').filter(function(l){var t=l.trim();return !t||t.charAt(0)==='-'||/^\d+x$/.test(t)||/^(warmup|cooldown)$/i.test(t);}).map(function(l){
    var m=/^(\s*-\s)(\d+(?:m|s|mtr|km))\s+\{([RBS]):(\w+)\}\s*$/.exec(l);
    if(m){var pc=wkPace(m[3],m[4]),lab=wkLab(m[3],m[4]);if(pc)return m[1]+(m[3]==='S'&&lab?lab+' ':'')+m[2]+' '+pc;var tg=wkTgt(m[3],m[4]);return m[1]+(lab?lab+' ':'')+m[2]+(tg?' '+tg:'');}
    return l.replace(/\{([RBS]):(\w+)\}/g,function(_,t,k){return wkTgt(t,k);}).replace(/\s+$/,'');
  }).join('\n');
}
// Nom de la séance dans Garmin : jour + date + sport et type de séance + durée (distance pour la natation). Ex. « Jeu 3 juin · Course Allure Ironman · 1h15 »
function evName(s){
  var d=addDays(PLAN_START,sessIdx(s)),dt=DAYS[s.d].slice(0,3)+' '+dnum(d)+' '+MONTHS[d.getMonth()].replace('.','');
  var q=s.sp==='swim'&&s.m?km(s.m)+' km':fm(s.min).replace(/ min$/,'min');
  var t=s.title.replace(' · ',' '),n=dt+' · '+t+' · '+q;
  if(n.length>48)n=dt+' · '+t;                                   // trop long : on garde la date et le titre
  if(n.length>48)n=n.slice(0,47).replace(/\s+\S*$/,'')+'…';       // encore trop long : on tronque proprement
  return n;
}
function evOf(s){
  var d=addDays(PLAN_START,sessIdx(s)),type={swim:'Swim',bike:'Ride',run:'Run',brick:'Run',str:'WeightTraining'}[s.sp];
  return {category:'WORKOUT',start_date_local:isoDate(d)+'T00:00:00',type:type,name:evName(s),description:s.wk?wkText(s.wk):s.lines.map(function(l){return tx(l);}).join('\n'),external_id:'im27:'+s.id};
}
var pushing=false;
/* Semaine d’essai : la semaine 1 du plan est envoyée sur les 6 prochains jours, marquée [ESSAI], pour voir à quoi ressemblent les séances sur la montre */
function previewList(){return ALLS.filter(function(s){return s.w===1&&s.sp!=='race';});}
function previewOps(){
  var sv=state.sv,t1=addDays(today(),1),o=isoDate(t1),n=isoDate(addDays(t1,32));
  return svFetch('/api/events?oldest='+o+'&newest='+n).then(function(r){if(!r.ok)throw new Error('Erreur '+r.status);return r.json();}).then(function(ex){
    return (Array.isArray(ex)?ex:[]).filter(function(e){return e.external_id&&String(e.external_id).indexOf('im27prev:')===0;});
  });
}
function runOps(ops){
  var chain=Promise.resolve();
  ops.forEach(function(op){chain=chain.then(function(){return svFetch(op[0],{method:op[1],headers:{'Content-Type':'application/json'},body:op[2]?JSON.stringify(op[2]):undefined}).then(function(r){if(!r.ok)throw new Error('Erreur '+r.status);});});});
  return chain;
}
function errTxt(e){var m=(e&&e.message)||'Échec';return m==='Failed to fetch'||m==='Load failed'?'Serveur injoignable':m;}
function pushPreview(){
  if(!state.sv.url||!state.sv.key){toast('Configure d’abord la synchronisation (Réglages)');return Promise.resolve();}
  if(pushing)return Promise.resolve();
  pushing=true;toast('Envoi de la semaine d’essai…');
  var t1=addDays(today(),1);
  return previewOps().then(function(old){
    var ops=old.map(function(e){return ['/api/events/'+e.id,'DELETE',null];});
    previewList().forEach(function(s){
      var ev=evOf(s);
      ev.start_date_local=isoDate(addDays(t1,Math.max(0,s.d-1)))+'T00:00:00';
      ev.name='[ESSAI] '+s.title;ev.external_id='im27prev:'+s.id;
      ops.push(['/api/events','POST',ev]);
    });
    return runOps(ops).then(function(){return ops.filter(function(o){return o[1]==='POST';}).length;});
  }).then(function(n){pushing=false;toast(n+' séances d’essai envoyées du '+fmtDay(t1)+' au '+fmtDay(addDays(t1,5)));})
    .catch(function(e){pushing=false;toast(errTxt(e));});
}
function clearPreview(){
  if(!state.sv.url||!state.sv.key||pushing)return Promise.resolve();
  pushing=true;
  return previewOps().then(function(old){return runOps(old.map(function(e){return ['/api/events/'+e.id,'DELETE',null];})).then(function(){return old.length;});})
    .then(function(n){pushing=false;toast(n?n+' séance'+(n>1?'s':'')+' d’essai retirée'+(n>1?'s':''):'Aucune séance d’essai à retirer');})
    .catch(function(e){pushing=false;toast(errTxt(e));});
}
/* Envoi d'UNE séance vers Garmin (bouton dans le détail de la séance) */
function garminBlock(s){
  var sv=state.sv,di=sessIdx(s)-diffDays(today(),PLAN_START);          // jours restants avant la séance
  if(!(sv.url&&sv.key)||s.sp==='rest'||s.sp==='race'||di<0)return '';
  var sent=(state.ui.sent||{})[s.id];
  // intervals.icu ne transmet à Garmin que les 7 prochains jours : une séance lointaine n'est pas visible sur Garmin tout de suite
  var later=di>7?' Elle n’apparaîtra dans Garmin Connect et sur ta montre qu’à partir du '+fmtDay(addDays(PLAN_START,sessIdx(s)-7))+' : intervals.icu ne transmet à Garmin que les 7 prochains jours (tu la vois déjà dans ton calendrier intervals.icu).':'';
  return '<div class="act"><b>Envoi vers la montre</b>'+(sent
    ?'<div class="small muted">Envoyée '+ago(sent)+' vers ton calendrier intervals.icu, puis Garmin Connect et ta montre.'+later+'</div><button class="btn" style="margin:10px 0 0" data-act="pushsess" data-id="'+s.id+'">Renvoyer</button>'
    :'<div class="small muted">Envoie cette séance (étapes et cibles) vers ta montre, via intervals.icu.'+later+'</div><button class="btn pri" style="margin:10px 0 0" data-act="pushsess" data-id="'+s.id+'">Envoyer vers Garmin</button>')+'</div>';
}
function dayEvents(d){
  return svFetch('/api/events?oldest='+d+'&newest='+d).then(function(r){if(!r.ok)throw new Error('Erreur '+r.status);return r.json();}).then(function(ex){return Array.isArray(ex)?ex:[];});
}
function pushSession(sid){
  var s=SBY[sid],sv=state.sv;
  if(!s)return Promise.resolve();
  if(!sv.url||!sv.key){toast('Configure d’abord la synchronisation (Réglages)');return Promise.resolve();}
  if(pushing)return Promise.resolve();
  pushing=true;
  var ev=evOf(s);
  return dayEvents(ev.start_date_local.slice(0,10)).then(function(ex){
    var e=ex.filter(function(x){return x.external_id===ev.external_id;})[0];
    return svFetch(e?'/api/events/'+e.id:'/api/events',{method:e?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ev)})
      .then(function(r){if(!r.ok)throw new Error('Erreur '+r.status);return e?'mise à jour':'envoyée';});
  }).then(function(w){
    pushing=false;(state.ui.sent=state.ui.sent||{})[sid]=Date.now();save();render(true);
    toast('Séance '+w+' : '+s.title);return w;
  }).catch(function(e){pushing=false;toast(errTxt(e));return null;});
}
function pushSettings(){
  return '<h4>Envoi des séances vers Garmin</h4><p>Ouvre une séance (onglet Semaine) et touche « Envoyer vers Garmin » : elle part par étapes (échauffement, séries, cibles d’allure ou de FC) vers ton calendrier intervals.icu, qui la transmet à Garmin Connect puis à ta montre (réglage « Upload planned workouts » d’intervals.icu).</p>'+
    '<p class="small muted" style="margin:8px 0">Pour voir dès maintenant à quoi ressemblent les séances sur ta montre, envoie la semaine 1 en essai (marquée [ESSAI], sur les 6 prochains jours).</p><div class="btns"><button class="btn" data-act="pushprev">Envoyer une semaine d’essai</button><button class="btn" data-act="clearprev">Retirer l’essai</button></div>'+
    '<p class="small muted">Le plan commence le '+fmtDay(PLAN_START)+' '+PLAN_START.getFullYear()+'.</p>';
}
function hasProf(){var p=state.ui.prof||{};return !!(p.ftp||p.fc||p.thr||p.css);}
function ago(t){if(!t)return 'jamais';var m=Math.round((Date.now()-t)/6e4);return m<1?'à l’instant':m<60?'il y a '+m+' min':m<1440?'il y a '+Math.round(m/60)+' h':'il y a '+Math.round(m/1440)+' j';}
function vActs(list){
  var sv=state.sv,h='<section class="card"><div class="row"><h2 style="margin:0">Garmin</h2><span class="sp"></span>';
  if(!(sv.url&&sv.key))
    return h+'<span class="chip">Facultatif</span></div><p class="small muted" style="margin:8px 0 12px">Avec une montre Garmin, tes séances se cochent toutes seules et partent sur ta montre. Sans montre, coche-les en touchant le rond de chaque séance : tout le reste marche pareil.</p><button class="btn" data-act="garminwiz" style="margin:0">Connecter Garmin</button></section>';
  var acts=(list||sv.acts||[]).slice().sort(function(x,y){return y.s>x.s?1:-1;});
  var chip=sv.err?'Hors ligne':sv.werr?'Problème':sv.conn===false?'Non connecté':'Connecté';
  h+='<span class="chip">'+chip+'</span></div>';
  h+='<p class="small muted" style="margin:8px 0 12px">'+(sv.conn===false&&!sv.werr?'Aucune synchro réussie pour l’instant : vérifie la clé intervals.icu (Réglages). ':'Mise à jour automatique après chaque activité synchronisée par Garmin. ')+'Dernière synchro : '+ago(sv.t)+(sv.err?' · '+esc(sv.err):'')+(sv.werr?' · '+esc(sv.werr):'')+'</p>';
  var un=acts.filter(function(a){return actSport(a)&&dayIdx(a)>=0&&LK.a2s[a.id]===undefined;}).length;
  if(un)h+='<p class="small" style="margin:0 0 10px"><b>'+un+' activité'+(un>1?'s':'')+' non associée'+(un>1?'s':'')+'</b> <span class="muted">(trop courte ou sans séance équivalente). Touche-la pour l’associer.</span></p>';
  acts.slice(0,8).forEach(function(a){
    var sid=LK.a2s[a.id],s=sid&&SBY[sid],lab=!actSport(a)?'Non suivie':dayIdx(a)<0?'Avant le plan':s?'→ '+sessLabel(s):sid===0?'Ignorée':'Non associée';
    h+='<button class="srow" data-act="actdetail" data-aid="'+esc(a.id)+'"><span class="sr-t"><b>'+esc(a.n||a.t)+'</b><small>'+esc(actDate(a)+' · '+actLine(a))+'</small></span><span class="sr-b'+(s?' ok':'')+'">'+esc(lab)+'</span></button>';
  });
  if(!acts.length)h+='<p class="small muted" style="margin:0 0 10px">Aucune activité pour l’instant.</p>';
  return h+'<button class="btn" data-act="allacts" style="margin:4px 0 8px">Toutes mes activités ('+(sv.acts||[]).length+')</button><button class="btn" data-act="syncsv" style="margin:4px 0 0">Synchroniser maintenant</button><p class="small muted" style="margin:8px 0 0">Données Garmin Connect via intervals.icu</p></section>';
}
function nextSession(wk){
  var t=today(),i,j;
  for(i=0;i<7;i++){
    var day=wk.days[i];if(diffDays(day.date,t)<0)continue;
    for(j=0;j<day.sessions.length;j++){var s=day.sessions[j];if(s.sp!=='rest'&&!isDone(s))return {s:s,day:diffDays(day.date,t)===0?'Aujourd’hui':day.name};}
  }
  for(i=0;i<7;i++)for(j=0;j<wk.days[i].sessions.length;j++){var q=wk.days[i].sessions[j];if(q.sp!=='rest'&&!isDone(q)&&diffDays(wk.days[i].date,t)<0)return {s:q,day:wk.days[i].name+' (à rattraper)'};}
  return null;
}
function chart(st){
  var W=340,H=156,L=26,B=22,T=8,R=4,slot=(W-L-R)/NW,bw=Math.min(8,slot-4);
  var maxH=0;PLAN.forEach(function(w){maxH=Math.max(maxH,w.min/60);});
  var top=Math.ceil(maxH/4)*4,yv=function(v){return T+(H-T-B)*(1-v/top);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Volume d’entraînement prévu et réalisé, semaine par semaine. Touche une barre pour le détail." data-act="chart">',v,i;
  for(v=0;v<=top;v+=4){
    s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yv(v)+'" y2="'+yv(v)+'" stroke="'+(v?'#2c2c2e':'#48484a')+'" stroke-width="1"/><text x="'+(L-6)+'" y="'+(yv(v)+3.5)+'" text-anchor="end" font-size="10" fill="#85847d">'+v+'</text>';
  }
  var cw=sel||st.w;
  for(i=0;i<NW;i++){
    var wk=PLAN[i],x=L+i*slot+(slot-bw)/2,ph=wk.min/60,dh=wkStats(wk).dmin/60;
    if(wk.n===cw)s+='<rect x="'+(L+i*slot)+'" y="'+T+'" width="'+slot+'" height="'+(H-T-B)+'" rx="3" fill="rgba(255,255,255,.07)"/>';
    s+=col(x,yv(ph),bw,yv(0)-yv(ph),'#3a3a3d');
    if(dh>0)s+=col(x,yv(dh),bw,yv(0)-yv(dh),'#f5f4ef');
  }
  [1,5,9,13,17,21,25].forEach(function(n){
    var cx=L+(n-1)*slot+slot/2;
    s+='<text x="'+cx+'" y="'+(H-6)+'" text-anchor="middle" font-size="10" fill="'+(n===st.w&&st.s!=='before'?'#f5f4ef':'#85847d')+'" font-weight="'+(n===st.w?700:400)+'">S'+n+'</text>';
  });
  return s+'</svg>';
}
function col(x,y,w,h,fill){
  if(h<=0)return '';var r=Math.min(3,h,w/2);
  return '<path d="M'+x+' '+(y+h)+'V'+(y+r)+'Q'+x+' '+y+' '+(x+r)+' '+y+'H'+(x+w-r)+'Q'+(x+w)+' '+y+' '+(x+w)+' '+(y+r)+'V'+(y+h)+'Z" fill="'+fill+'"/>';
}
function readout(n){
  var wk=PLAN[n-1],ws=wkStats(wk);
  return '<b>S'+n+'</b> · '+KIND[wk.kind]+' · prévu <b>'+fh(ws.min)+'</b> · réalisé <b>'+fh(ws.dmin)+'</b>';
}

/* ---------- Semaine ---------- */
function vWeek(){
  var st=status(),wk=PLAN[wv-1],ws=wkStats(wk),t=today(),h='';
  h+=topbar(wk.ph.n+' · '+KIND[wk.kind],'Semaine '+wv,false);
  var sub=wv===st.w&&(st.s==='during'||st.s==='raceday')?'Semaine en cours':(wv<st.w||st.s==='after')?'Semaine passée':'À venir';
  h+='<div class="nav"><button class="iconbtn" data-act="wkd" data-d="-1" aria-label="Semaine précédente"'+(wv<=1?' disabled':'')+'>'+ic('left')+'</button>'+
    '<button class="nav-c" data-act="tab" data-tab="plan" aria-label="Voir toutes les semaines"><b>'+fmtRange(wk.start)+ic('down',14)+'</b><small>'+sub+'</small></button>'+
    '<button class="iconbtn" data-act="wkd" data-d="1" aria-label="Semaine suivante"'+(wv>=NW?' disabled':'')+'>'+ic('right')+'</button></div>';
  if(wv!==st.w)h+='<div style="text-align:center;margin:-4px 0 14px"><button class="chip hl" style="border:0;min-height:32px;padding:0 14px" data-act="wknow">Aller à la semaine en cours</button></div>';
  if(st.s==='before')h+='<div class="banner">'+ic('info',20)+'<div><b>Le programme n’a pas encore commencé.</b> Il démarre le '+fmtLong(PLAN_START).toLowerCase()+', dans '+st.days+' jour'+(st.days>1?'s':'')+'. Tu peux déjà consulter les semaines à venir.</div></div>';
  h+=weekStrip(wk);
  h+=awayBanner(wk);
  h+='<section class="card theme"><div class="eyebrow">Thème de la semaine</div><div class="t">'+esc(wk.theme)+'</div><p>'+esc(wk.kind==='rec'?'Semaine de décharge : le volume baisse d’environ un tiers. Garde les séances faciles, dors plus, mange bien. C’est ici que tu absorbes la charge et que tu progresses.':wk.ph.tip)+'</p>'+
    '<div class="wprog"><div class="row"><b>'+ws.d+' / '+ws.n+' séances</b><span class="sp"></span><span class="small muted">'+fh(ws.dmin)+' / '+fh(ws.min)+(ws.m?' · '+km(ws.m)+' km nage':'')+'</span></div>'+bar(pct(ws.d,ws.n))+'</div></section>';
  wk.days.forEach(function(day,di){
    var isToday=diffDays(day.date,t)===0,real=day.sessions.filter(function(s){return s.sp!=='rest';}),dn=real.filter(function(s){return isDone(s);}).length;
    h+='<div class="day" id="day-'+di+'"><h3>'+day.name+'</h3><small>'+fmtDay(day.date)+'</small>'+(isToday?'<span class="chip hl">Aujourd’hui</span>':'')+'<span class="sp"></span>'+(real.length?'<small>'+dn+' / '+real.length+'</small>':'')+'</div>';
    day.sessions.forEach(function(s){h+=sessCard(s,isToday);});
    if(!day.sessions.length)h+='<p class="small muted" style="margin:0 2px 8px">Jour libre : les séances prévues ont été déplacées.</p>';
  });
  h+='<details class="fold" style="margin-top:22px"><summary>'+ic('info',20)+'<span>Repères d’effort<small>Échelle d’effort, FTP, FC max, CSS</small></span></summary><div class="fbody legendrpe"><b>Effort</b> = ressenti sur 10.<br><b>3–4</b> facile, tu peux parler · <b>'+BK.im[0].replace('RPE ','')+'</b> allure '+(IS_SABLES?'Ironman':'de course')+', régulière et contrôlée · <b>7</b> soutenu, phrases courtes · <b>8+</b> très dur.<br><b>FTP</b> = puissance moyenne maximale tenable 1 h à vélo · <b>FC max</b> = fréquence cardiaque maximale · <b>CSS</b> = vitesse critique de nage (allure tenable ≈ 1 500 m).<br>'+(autoProf()?'<b>Zones, allures et vitesses : calculées automatiquement</b> à partir de tes activités Garmin (FC réelle, allures réelles) et de ton estimation de course (allure Ironman). Les repères saisis dans les réglages restent prioritaires.<br>':'')+(hasProf()||autoProf()?'':'<button class="chip hl" style="border:0;min-height:32px;padding:0 14px;margin:8px 0" data-act="settings">Renseigner mes repères (watts, bpm, allures)</button><br>')+'Un jour sans forme ? Remplace la séance par du facile : la régularité prime sur l’intensité.</div></details>';
  return h;
}
function sessCard(s,isToday){
  var a=LK.s2a[s.id],ok=isDone(s),isOpen=openSet[s.id]!==undefined?openSet[s.id]:false,mc='';
  var parts=s.title.split(' · '),over=parts.length>1?parts[0]:'',ttl=parts.length>1?parts.slice(1).join(' · '):s.title;
  if(s.sp==='race')mc='<span class="mc dur">'+esc(s.sum)+'</span>';
  else if(s.sp==='rest')mc='<span class="mc">Récupération</span>';
  else mc='<span class="mc dur">'+fh(s.min)+'</span>'+kmChips(s)+'<span class="mc">'+esc(s.tag)+'</span>';
  if(s.adapt)mc+='<span class="mc adp">Adapté</span>';
  if(s.moved)mc+='<span class="mc adp">Déplacé</span>';
  var mi=isMissed(s),mr=missRec()[s.id];
  if(mi&&!mr)mc+='<span class="mc mis">Manquée</span>';
  else if(mi&&mr&&mr.a==='skip')mc+='<span class="mc">Laissée de côté</span>';
  var h='<div class="sess sp-'+s.sp+(ok?' done':'')+(isOpen?' open':'')+'" data-sid="'+s.id+'"><div class="s-row">'+
    '<button class="s-main" data-act="open" data-id="'+s.id+'" aria-expanded="'+isOpen+'"><span class="s-ic">'+ic(s.sp,24)+'</span><span class="s-txt">'+(over?'<span class="s-ov">'+esc(over)+'</span>':'')+'<span class="s-t">'+esc(ttl)+'</span><span class="s-m">'+mc+'</span>'+
      (s.sum&&s.sp!=='race'&&s.sp!=='rest'?'<span class="s-sum">'+esc(s.sum)+'</span>':'')+(a?'<span class="s-sum"><b class="sv">Garmin</b> '+esc(actLine(a)+actWhen(a,s))+'</span>':'')+'</span><span class="s-chev">'+ic('down',20)+'</span></button>'+
    '<button class="chk" role="checkbox" aria-checked="'+ok+'" aria-label="'+(s.sp==='race'?'Course terminée':s.sp==='rest'?'Repos respecté':'Séance réalisée')+' : '+esc(s.title)+'" data-act="toggle" data-id="'+s.id+'"><i>'+ic('check',18)+'</i></button></div>'+
    '<div class="s-det">'+(mi&&!mr?'<div class="goal miss-g"><b>Séance manquée</b>'+missButtons(s)+'</div>':'')+awayNote(s)+(s.goal?'<div class="goal"><b>Objectif</b>'+esc(s.goal)+'</div>':'')+actBlock(s)+detailBody(s)+(s.tip?'<div class="tip">'+esc(s.tip)+'</div>':'')+garminBlock(s)+'</div></div>';
  if(s.sp==='rest')h=h.replace(/<button class="chk".*?<\/button>/,'');
  return h;
}

/* ---------- 25 semaines ---------- */
var planOpen={},TL_COL=['#3f6ea8','#5b97e0','#a9cfff','#f5f4ef'];
// Frise du plan : une colonne par semaine, sa hauteur montre le volume. Une pointe marque chaque course.
function planTimeline(st,vis,live){
  var mx=0,cur=live?st.w:0,h='';
  PLAN.forEach(function(w){mx=Math.max(mx,w.min);});
  var colOf=function(n){for(var i=0;i<vis.length;i++)if(n>=vis[i].a&&n<=vis[i].b)return TL_COL[vis[i].i];return TL_COL[0];};
  var left=function(n){return (n-0.5)/NW*100;};
  h+='<div class="tl" role="group" aria-label="Volume du plan, semaine par semaine">';
  if(cur)h+='<div class="tl-now" style="left:'+Math.max(9,Math.min(91,left(cur)))+'%">Aujourd’hui</div>';
  h+='<div class="tl-flags">';
  stepList().forEach(function(x){if(stepInPlan(x)){var n=Math.floor(idxOfDate(parseYmd(x.date))/7)+1;h+='<i class="tl-flag" style="left:'+left(n)+'%;color:#ff9f0a" title="'+esc(x.name)+'">'+ic('race',14)+'</i>';}});
  h+='<i class="tl-flag" style="left:'+left(NW)+'%" title="'+esc(RNAME)+'">'+ic('race',14)+'</i></div><div class="tl-bars">';
  PLAN.forEach(function(w){
    var isCur=w.n===cur,past=cur&&w.n<cur,fut=cur&&w.n>cur,step=stepsOfWeek(w.n).length>0;
    h+='<button class="tl-b'+(isCur?' cur':'')+'" data-act="gowk" data-w="'+w.n+'" aria-label="Semaine '+w.n+', '+KIND[w.kind]+', '+fh(w.min)+'"'+(isCur?' aria-current="true"':'')+'><span style="height:'+Math.max(10,Math.round(w.min/mx*100))+'%;background:'+(isCur?'#fff':step?'#ff9f0a':colOf(w.n))+';opacity:'+(fut?'.45':past?'.75':'1')+'"></span></button>';
  });
  h+='</div><div class="tl-t">';
  vis.forEach(function(v){h+='<span style="flex:'+(v.b-v.a+1)+'">S'+v.a+'</span>';});
  return h+'</div></div>';
}
function planRaces(){
  var l=stepList().filter(stepInPlan).sort(function(a,b){return a.date<b.date?-1:1;});
  if(!l.length)return '';
  return '<div class="tl-rs"><div class="eyebrow" style="margin:0 0 6px">Courses intermédiaires</div>'+l.map(function(x){var d=parseYmd(x.date);return '<button class="tl-r" data-act="stepedit" data-id="'+esc(x.id)+'"><i>'+ic('race',14)+'</i><span>'+esc(x.name)+'</span><small>'+esc(fmtDay(d))+' · S'+(Math.floor(idxOfDate(d)/7)+1)+'</small></button>';}).join('')+'</div>';
}
function planFold(id,def){return planOpen[id]!==undefined?planOpen[id]:!!def;}
function vPlan(){
  var st=status(),h='';
  h+=topbar('Vue d’ensemble',NW+' semaines',false,'more');
  var tot=0;PLAN.forEach(function(w){tot+=w.min;});
  var live=st.s==='during'||st.s==='raceday';
  var cur=st.s==='before'?0:st.s==='after'?NW:(st.w-1)+((diffDays(today(),PLAN_START)%7)+1)/7;
  var curW=st.s==='before'?1:st.s==='after'?NW:st.w;
  var vis=[];
  PHASES.forEach(function(p,i){var a=0,b=0,w;for(w=1;w<=NW;w++)if(phaseOf(w)===p){if(!a)a=w;b=w;}if(a)vis.push({p:p,i:i,a:a,b:b});});
  var yr=PLAN_START.getFullYear()!==RACE_DATE.getFullYear();
  h+='<section class="card"><div class="row"><h2 style="margin:0">Le programme</h2><span class="sp"></span><span class="chip">'+fh(tot)+' au total</span></div>'+
    '<p class="plan-dates">'+fmtDay(PLAN_START)+' '+PLAN_START.getFullYear()+' → '+fmtLong(RACE_DATE).toLowerCase()+'</p>'+
    '';
  h+=planTimeline(st,vis,live);
  vis.forEach(function(v){
    var p=v.p,i=v.i,here=curW>=v.a&&curW<=v.b;
    h+='<details class="phd" data-pl="ph'+i+'"'+(planFold('ph'+i,here)?' open':'')+'><summary><i style="background:'+TL_COL[i]+'"></i><b>'+p.n+'</b><span class="muted">S'+v.a+(v.b>v.a?' à S'+v.b:'')+'</span>'+(live&&here?'<span class="now" style="margin-left:0">En cours</span>':'')+'</summary><p>'+p.d+'</p></details>';
  });
  h+='<p class="plan-note">Cycles de 3 semaines de charge + 1 de décharge, puis un affûtage de '+T_TAPER+' semaine'+(T_TAPER>1?'s':'')+' avant la semaine de course.</p>'+planRaces()+'</section>';
  h+='<h2 class="plan-h">Semaine par semaine'+(live?'<button class="wkt-now" data-act="plancur">Semaine en cours'+ic('down',14)+'</button>':'')+'</h2>';
  BLOCKS.forEach(function(b){
    var bm=0,bd=0,bn=0,i;
    for(i=b.a;i<=b.b;i++){bm+=PLAN[i-1].min;var q=wkStats(PLAN[i-1]);bd+=q.d;bn+=q.n;}
    var isNow=live&&curW>=b.a&&curW<=b.b,past=st.s==='after'||(live&&curW>b.b),all=bn>0&&bd===bn,last=addDays(PLAN[b.b-1].start,6);
    h+='<section class="pblk'+(isNow?' cur':'')+(past?' past':'')+'"><div class="pb-h"><i class="pb-d" style="background:'+TL_COL[PHASES.indexOf(phaseOf(b.a))]+'"></i><div class="pb-t"><b>'+b.n+(isNow?'<span class="now">En cours</span>':'')+'</b><small>'+fmtDay(PLAN[b.a-1].start)+' → '+fmtDay(last)+(yr?' '+last.getFullYear():'')+' · '+fh(bm)+'</small></div><span class="pb-c'+(all?' ok':'')+'" aria-label="'+bd+' séances faites sur '+bn+'">'+(all?ic('check',14):bd+'/'+bn)+'</span></div>'+
      (isNow?'<p class="pb-g">'+esc(b.g)+'</p>':'')+'<div class="wkt-g">';
    for(i=b.a;i<=b.b;i++){
      var wk=PLAN[i-1],ws=wkStats(wk),isCur=i===st.w&&live,ok=ws.n>0&&ws.d===ws.n,isRace=wk.kind==='race',soft=wk.kind==='rec'||wk.kind==='taper',flag=stepsOfWeek(i).length>0,dp=pct(ws.d,ws.n);
      h+='<button class="wkt'+(isCur?' cur':'')+(soft?' soft':'')+(isRace?' race':'')+(ok?' ok':'')+'" data-act="gowk" data-w="'+i+'" aria-label="Semaine '+i+', '+esc(fmtRange(wk.start))+', '+KIND[wk.kind]+', '+(isRace?'jour de course':fh(wk.min))+', '+ws.d+' séances faites sur '+ws.n+'"'+(isCur?' aria-current="true"':'')+'><span class="wkt-top"><b>S'+i+'</b>'+
        (ok?'<i class="wkt-ok">'+ic('check',10)+'</i>':flag?'<i class="wkt-fl">'+ic('race',13)+'</i>':isRace?'<i>'+ic('race',13)+'</i>':soft?'<em>'+(wk.kind==='rec'?'Récup':'Affût')+'</em>':'')+
        '</span><span class="wkt-h">'+(isRace?'Jour J':fh(wk.min))+'</span><small>'+fmtDay(wk.start)+'</small>'+(dp&&!ok?'<span class="wkt-p"><i style="width:'+dp+'%"></i></span>':'')+'</button>';
    }
    h+='</div></section>';
  });
  return h;
}
document.getElementById('view').addEventListener('toggle',function(e){var d=e.target;if(d&&d.getAttribute&&d.getAttribute('data-pl'))planOpen[d.getAttribute('data-pl')]=d.open;},true);

