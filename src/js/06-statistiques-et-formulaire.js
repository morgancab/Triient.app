/* ---------- Statistiques d'usage anonymes ----------
   Envoie seulement un nom d'événement et une propriété courte (ex. « plan_created », « half|7s|l1 ») ; le serveur ne garde que des compteurs
   par jour. Aucun identifiant, cookie ni donnée personnelle. Désactivable dans Réglages → À propos, et respecte « Ne pas me suivre » du navigateur. */
function statsOn(){try{return !(state.ui&&state.ui.noStats)&&navigator.doNotTrack!=='1'&&window.doNotTrack!=='1';}catch(e){return true;}}
// Étapes de l'entonnoir d'inscription : une seule fois par appareil, pour que l'entonnoir compte des visiteurs et non des affichages
function trackOnce(name,prop){var tk=state.ui.tk||(state.ui.tk={});if(tk[name])return;tk[name]=1;save0();track(name,prop);}
function track(name,prop){
  if(DEV||!statsOn()||/^file:/.test(location.protocol)||/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))return;   // local : tests et développement ne comptent pas
  if(state.ui.own||(acct()&&acct().admin))return;   // les appareils du propriétaire ne comptent pas non plus
  try{
    var url=((state.ui&&state.ui.pubApi)||PUB_API)+'/pub/ev',body=JSON.stringify({e:name,p:prop||''});
    if(navigator.sendBeacon&&navigator.sendBeacon(url,new Blob([body],{type:'text/plain'})))return;
    fetch(url,{method:'POST',body:body,keepalive:true,mode:'no-cors'}).catch(function(){});
  }catch(e){}
}
var adminStats=null;
function loadAdminStats(){
  if(!state.sv||!state.sv.url||!state.sv.key)return;
  svFetch('/api/admin/stats?days=30').then(function(r){return r.ok?r.json():null;}).then(function(j){adminStats=j&&j.ok?j:null;}).catch(function(){});
}
function statsHtml(){
  var s=adminStats;if(!s)return '';
  var t=s.totals||{},days=Object.keys(s.daily||{}).sort().slice(-7),n=function(k){return t[k]||0;},cell=function(a,b){return '<tr><td>'+a+'</td><td style="text-align:right"><b>'+b+'</b></td></tr>';};
  var conv=n('setup_view')?Math.round(n('plan_created')/n('setup_view')*100)+' %':'–';
  var top=function(k,title){var l=(s.top&&s.top[k])||[];return l.length?'<h4>'+title+'</h4><table style="width:100%;font-size:13.5px;border-collapse:collapse">'+l.slice(0,8).map(function(x){return cell(esc(x[0]),x[1]);}).join('')+'</table>':'';};
  return '<p class="small muted">'+s.days+' derniers jours, compteurs anonymes.</p><table style="width:100%;font-size:14px;border-collapse:collapse">'+
    cell('Nouvelles installations',n('install'))+cell('Ouvertures (par jour et appareil)',n('open'))+cell('Page d’accueil vue',n('gate_view'))+cell('« Créer mon plan » touché',n('guest_start'))+cell('Plan rempli, connexion demandée',n('login_step'))+cell('Connexions Google',n('login'))+cell('Écran « Ta course » vu',n('setup_view'))+cell('Plans créés',n('plan_created')+' <span class="muted">('+conv+' des vues)</span>')+cell('Changements de course',n('plan_changed'))+cell('Garmin connecté',n('garmin_connected'))+'</table>'+
    '<h4>7 derniers jours (ouvertures · plans)</h4><table style="width:100%;font-size:13.5px;border-collapse:collapse">'+days.map(function(d){var x=s.daily[d]||{};return cell(d.slice(5),(x.open||0)+' · '+(x.plan_created||0));}).join('')+'</table>'+
    top('plan_created','Plans créés (format | séances | niveau)')+top('race_pick','Courses choisies')+top('search_miss','Recherches sans résultat : à ajouter au catalogue');
}
var deferredInstall=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredInstall=e;try{if(document.getElementById('view'))render(true);}catch(x){}});
window.addEventListener('appinstalled',function(){deferredInstall=null;state.ui.hideInstall=true;save();try{render(true);}catch(x){}});
function isStandalone(){return (window.navigator.standalone===true)||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);}
function doInstall(){if(!deferredInstall)return;deferredInstall.prompt();deferredInstall.userChoice.then(function(){deferredInstall=null;render(true);});}
function shareApp(){
  var url=location.href.split('#')[0].split('?')[0];
  if(navigator.share){navigator.share({title:'Triient',text:'Un plan d’entraînement triathlon sur mesure, gratuit.',url:url}).catch(function(){});return;}
  try{navigator.clipboard.writeText(url).then(function(){toast('Lien copié');},function(){toast(url);});}catch(e){toast(url);}
}
var SETUP=RCFG.fresh&&!(state&&state.race),raceDraft=null;
function pad2(n){return ('0'+n).slice(-2);}
function planSpan(iso,cls,o){
  var d=parseISO(iso),F=FORMATS[cls];if(!d||!F)return null;o=o||{};
  var t=today(),dow=(t.getDay()+6)%7,base=dow===0?t:addDays(t,7-dow),startMon=base,raceMon=addDays(d,-((d.getDay()+6)%7));
  if(o.startMode==='date'&&o.start){var sd=parseISO(o.start);if(sd){var sw=(sd.getDay()+6)%7;startMon=sw===0?sd:addDays(sd,7-sw);if(startMon<base)startMon=base;}}      // le plan démarre un lundi
  var avail=Math.round((raceMon-startMon)/DAY/7)+1,custom=o.startMode==='date'&&o.start;
  if(avail<4){
    var gap=Math.round((raceMon-base)/DAY/7)+1;
    return {err:custom&&gap>=4?'Choisis un début au moins 4 semaines avant la course.':(avail<1?'Cette date est trop proche (ou passée) : il faut au moins 4 semaines pour préparer un plan.':'La course est dans moins de 4 semaines : trop court pour un plan d’entraînement.'),avail:avail};
  }
  var n=Math.min(52,avail);
  return {n:n,avail:avail,start:addDays(raceMon,-(n-1)*7),short:n<F.wmin,wmin:F.wmin};
}
function startHtml(d,span){
  var h='<div class="rsec"><div class="eyebrow">Début de l’entraînement</div><div class="rng" role="group" aria-label="Début de l’entraînement"><button data-act="setstart" data-v="now" aria-pressed="'+(d.startMode!=='date')+'">Dès maintenant</button><button data-act="setstart" data-v="date" aria-pressed="'+(d.startMode==='date')+'">À une date précise</button></div>';
  if(d.startMode==='date'){
    var mx=d.date?addDays(parseISO(d.date),-28):addDays(today(),800),sd=d.start?parseISO(d.start):null;
    h+='<div class="cal-s" style="margin:12px 0 8px">'+(sd?'<b>'+esc(fmtLong(sd))+'</b>':'<span class="cal-hint" style="margin:0">Touche le jour de ton premier entraînement</span>')+'</div>'+calHtml('rstart',d.start,d.start,today(),mx,d.scal.y,d.scal.m)+'<p class="small muted" style="margin:8px 0 0">Le plan démarre le lundi de cette semaine-là, ou ce lundi s’il est déjà passé.</p>';
  }else h+='<p class="small muted" style="margin:8px 0 0">Première semaine : dès lundi prochain (ou aujourd’hui si on est lundi).</p>';
  return h+'</div>';
}
function customCls(d){var b=parseFloat(String(d.bikeKm).replace(',','.'));return fmtClass({format:'custom',bikeM:isFinite(b)?b*1000:0});}
function raceCls(d){return d.format==='custom'?customCls(d):d.format;}
var DEFSESS={sprint:[4,5,6],olympic:[5,6,7],half:[6,7,8],full:[7,8,8]},PERSESS={sprint:1.5,olympic:1.8,half:2.3,full:2.8};
function sessOf(d){return d.sessions!=null?d.sessions:DEFSESS[raceCls(d)][d.level];}
function maxPeak(n,cls){return Math.min(n,8)*PERSESS[cls]+Math.max(0,n-8)*PERSESS[cls]*0.55;}   // au-delà de 8 : séances plus courtes (natation, footing, vélo facile, renfo)
function defPeak(cls,lvl,n){var F=FORMATS[cls],base=F.peak[lvl]||REF_PEAK/60;return n==null?base:Math.min(base,maxPeak(n,cls));}
function peakOf(d){var cls=raceCls(d);return d.peak!=null?d.peak:defPeak(cls,d.level,sessOf(d));}
function fmtHrs(x){var h=Math.floor(x+1e-9),m=Math.round((x-h)*60);return m===60?(h+1)+'h00':h+'h'+pad2(m);}
function newRaceDraft(){
  var t=addDays(today(),84);
  return {name:'',date:'',format:'olympic',level:1,peak:null,swimKm:'',bikeKm:'',runKm:'',bikeUp:'',runUp:'',cal:{y:t.getFullYear(),m:t.getMonth()},detail:false,startMode:'now',start:'',scal:{y:today().getFullYear(),m:today().getMonth()}};
}
// Titre d'étape : numéro sur fond neutre, remplacé par une coche verte quand l'étape est remplie (le vert dit « c'est fait »)
function fstep(n,t,ok){return '<div class="eyebrow fstep">'+(n?'<i'+(ok?' class="ok" aria-label="Étape '+n+' remplie"':'')+'>'+(ok?ic('check',14):n)+'</i>':'')+t+'</div>';}
// Frise de la prépa : les phases du plan (même découpage que le moteur) dans leurs gris, le jour de course en vert
function planFrise(n,cls,race){
  var T=(FORMATS[cls]||{}).taper||1,B=Math.max(1,n-1-T),e1=Math.max(1,Math.round(B*8/22)),e2=Math.min(B-1,Math.max(e1+1,Math.round(B*16/22)));
  if(e2<e1)e2=e1;
  var ph=[['Fondation',e1,REF_PHASES[0].col],['Développement',e2-e1,REF_PHASES[1].col],['Spécifique',B-e2,REF_PHASES[2].col],['Affûtage',n-B,REF_PHASES[3].col]].filter(function(x){return x[1]>0;});
  var sem=function(k){return k+' sem.';};
  return '<div class="rf-bar" role="img" aria-label="'+esc(ph.map(function(x){return x[0]+' '+x[1]+' semaines';}).join(', ')+', puis la course')+'">'+
      ph.map(function(x){return '<span style="flex:'+x[1]+';background:'+x[2]+'"></span>';}).join('')+'<i></i></div>'+
    '<div class="rf-leg">'+ph.map(function(x){return '<span><i style="background:'+x[2]+'"></i>'+x[0]+'<b>'+sem(x[1])+'</b></span>';}).join('')+
      '<span class="jj"><i></i>Jour J<b>'+esc(race)+'</b></span></div>';
}
function raceFormHtml(d){
  var cls=raceCls(d),F=FORMATS[cls]||FORMATS.olympic,span=d.date?planSpan(d.date,cls,d):null,pk=peakOf(d),dn=function(x){return DAYS[(x.getDay()+6)%7].slice(0,3).toLowerCase()+' '+fmtDay(x);};
  var h='';
  if(SETUP)h+='<header class="top"><div class="top-t"><div class="eyebrow">Bienvenue</div><h1>Ta course</h1></div></header><p class="muted" style="margin:-6px 0 22px;line-height:1.5">5 étapes pour un plan sur mesure, jour par jour, de la première séance jusqu’au jour J</p>';
  // Un seul champ : on tape le nom (recherche dans le catalogue et World Triathlon) ; sans choix dans la liste, le texte tapé devient le nom de la course
  var okFmt=d.format!=='custom'||(parseFloat(String(d.swimKm).replace(',','.'))>0&&parseFloat(String(d.bikeKm).replace(',','.'))>0&&parseFloat(String(d.runKm).replace(',','.'))>0);
  h+='<div class="rsec">'+fstep(1,'Ta course',!!String(d.name||'').trim())+'<input class="tinp" id="rf-q" maxlength="60" autocomplete="off" placeholder="Nom, ville ou pays (ex. Nice, Roth, Embrun)" value="'+esc(d.name||'')+'"><div id="rf-res">'+raceResultsHtml(d)+'</div>'+
    '<p class="small muted" style="margin:8px 0 0">'+(d.picked?ic('check',14).replace('class="ic"','class="ic" style="display:inline;vertical-align:-2px;color:var(--brand)"')+' Course trouvée : format et date sont remplis ci-dessous.':'Pas dans la liste ? Garde simplement le nom que tu as tapé : ça marche pour n’importe quelle course.')+'</p></div>';
  // format
  var fcard=function(k){var f=FORMATS[k];return '<button class="fmtc" data-act="setfmt" data-v="'+k+'" aria-pressed="'+(d.format===k)+'"><b>'+f.n+'</b><small>'+(k==='custom'?'Distances libres':fk(f.swim)+' · '+fk(f.bike)+' · '+fk(f.run)+' km')+'</small></button>';};
  h+='<div class="rsec">'+fstep(2,'Format',okFmt)+'<div class="fmtgrid">'+['sprint','olympic','half','full','custom'].map(fcard).join('')+'</div>';
  if(d.format==='custom')h+='<div style="margin-top:10px">'+[['swim','Natation','km (ex. 1,5)'],['bike','Vélo','km (ex. 40)'],['run','Course à pied','km (ex. 10)']].map(function(r){return '<label class="inp"><span>'+r[1]+'<small>'+r[2]+'</small></span><input id="rf-'+r[0]+'" inputmode="decimal" autocomplete="off" value="'+esc(d[r[0]+'Km'])+'"></label>';}).join('')+'</div>';
  h+='</div>';
  // date
  var mn=addDays(today(),28),mx=addDays(today(),800);
  h+='<div class="rsec">'+fstep(3,'Date de la course',!!d.date&&!!span&&!span.err)+'<div class="cal-s">'+(d.date?'<b>'+esc(fmtLong(parseISO(d.date)))+'</b>':'<span class="cal-hint" style="margin:0">Touche le jour de la course</span>')+'</div>'+(d.hint?'<p class="rhint" style="margin:0 0 8px">'+ic('info',16)+'<span>'+esc(d.hint)+'</span></p>':'')+(d.note?'<p class="small muted" style="margin:0 0 8px">'+esc(d.note)+'</p>':'')+calHtml('race',d.date,d.date,mn,mx,d.cal.y,d.cal.m)+'</div>';
  h+=startHtml(d,span);
  // niveau + volume
  h+='<div class="rsec">'+fstep(4,'Ton niveau',true)+'<div class="rng" role="group" aria-label="Niveau">'+['Débutant','Intermédiaire','Confirmé'].map(function(l,i){return '<button data-act="setlvl" data-v="'+i+'" aria-pressed="'+(d.level===i)+'">'+l+'</button>';}).join('')+'</div>'+
    '<p class="small muted" style="margin:8px 0 0">'+['Premier triathlon ou reprise : une progression douce, pour arriver au départ en forme.','Tu t’entraînes régulièrement ou tu as déjà fait quelques courses.','Plusieurs saisons d’entraînement : tu vises un chrono.'][d.level]+'</p></div>';
  var ns=sessOf(d);
  h+='<div class="rsec">'+fstep(5,'Ton temps d’entraînement',true)+'<div class="fcard"><div class="eyebrow" style="margin:0 0 8px">Séances par semaine</div><div class="stp"><button class="iconbtn" data-act="setsess" data-v="-1" aria-label="Moins de séances">−</button><b>'+ns+'</b><button class="iconbtn" data-act="setsess" data-v="1" aria-label="Plus de séances">+</button><span class="small muted">en moyenne</span></div><p class="small muted" style="margin:8px 0 0">'+({3:'Natation, vélo long et sortie longue : l’essentiel.',4:'L’essentiel + une séance de course en semaine.',5:'Natation, vélo et course, avec un vélo en semaine.',6:'Deux natations, deux vélos, deux courses.',7:'Tout, avec un enchaînement vélo-course (ou du renforcement).',8:'Le plan complet, renforcement et enchaînements compris.',9:'Le plan complet + une 3e natation (endurance).',10:'+ 3e natation et un footing facile en plus.',11:'+ 3e natation, footing facile et vélo d’endurance.',12:'Prépa chargée : 3 natations, 3 vélos, 3 courses, 2 renforcements, enchaînements compris.'})[ns]+'</p>';
  h+='<div class="eyebrow" style="margin:18px 0 8px">Au plus fort de la prépa</div><div class="stp"><button class="iconbtn" data-act="setpeak" data-v="-1" aria-label="Moins d’heures">−</button><b>'+fmtHrs(pk)+'</b><button class="iconbtn" data-act="setpeak" data-v="1" aria-label="Plus d’heures">+</button><span class="small muted">par semaine</span></div><p class="small muted" style="margin:8px 0 0">Le plan monte progressivement jusqu’à cette charge, avec une semaine plus légère toutes les 4 semaines.'+(pk>maxPeak(ns,cls)*1.02?' <span style="color:#ffd60a">Beaucoup d’heures pour '+ns+' séances : les sorties longues seront plafonnées.</span>':'')+'</p>'+
    (!SETUP&&(CFG.vt||CFG.sc)&&cls===FCLS?'<p class="small muted" style="margin:8px 0 0">Ton réglage sport par sport (« Ajuster mon entraînement »'+(CFG.sc?', '+NSESS+' séances':'')+') est conservé'+(CFG.sc?' si tu gardes '+NSESS0+' séances ici':'')+'.</p>':'')+'</div></div>';
  // détails du parcours
  h+='<details class="fold" style="margin:0 0 20px"'+(d.detail?' open':'')+' data-fold="rdetail"><summary><span>Détails du parcours<small>Dénivelé, pour une estimation plus juste (optionnel)</small></span></summary><div class="fbody"><label class="inp"><span>Dénivelé vélo<small>D+ total (m)</small></span><input id="rf-bup" inputmode="numeric" autocomplete="off" value="'+esc(d.bikeUp)+'" placeholder="ex. 800"></label><label class="inp"><span>Dénivelé course<small>D+ total (m)</small></span><input id="rf-rup" inputmode="numeric" autocomplete="off" value="'+esc(d.runUp)+'" placeholder="ex. 100"></label></div></details>';
  // aperçu
  var ok=!!d.date&&span&&!span.err&&(d.format!=='custom'||(parseFloat(String(d.swimKm).replace(',','.'))>0&&parseFloat(String(d.bikeKm).replace(',','.'))>0&&parseFloat(String(d.runKm).replace(',','.'))>0));
  h+='<div class="rsec">'+fstep(0,'Ton plan')+'<div class="rsum">';
  if(!d.date)h+='Choisis la date de ta course pour voir ton plan.';
  else if(span.err)h+='<div class="re">'+esc(span.err)+'</div>';
  else{
    h+='<b>'+span.n+' semaines</b> · du '+dn(span.start)+' '+span.start.getFullYear()+' au '+dn(parseISO(d.date))+'<br>'+ns+' séances · jusqu’à <b>'+fmtHrs(pk)+'</b> par semaine · '+({sprint:'sprint',olympic:'olympique',half:'demi-distance',full:'distance complète'})[cls]+
      planFrise(span.n,cls,dn(parseISO(d.date)));
    if(span.short)h+='<div class="rw">Plan court ('+span.n+' semaines) : idéalement '+span.wmin+' semaines ou plus pour ce format.</div>';
    if(span.avail>span.n)h+='<div class="rw">La course est dans '+span.avail+' semaines : le plan est limité à '+span.n+' semaines et démarre donc le '+dn(span.start)+'.</div>';
  }
  h+='</div></div>';
  // création : bouton fixé en bas de l'écran avec le résumé ; changement de course (fenêtre) : bouton dans le formulaire
  if(SETUP)h+='<div class="fbar"><div class="fbar-t">'+(ok?'<b>'+span.n+' semaines</b> · '+ns+' séances · '+fmtHrs(pk)+' max':(!d.date?'Choisis la date de ta course':'Vérifie la date de ta course'))+'</div><button class="btn pri" data-act="racesave"'+(ok?'':' disabled style="opacity:.4"')+'>Créer mon plan</button></div>';
  else h+='<button class="btn pri" data-act="racesave"'+(ok?'':' disabled style="opacity:.4"')+'>Changer de course</button>';
  if(!SETUP)h+='<button class="btn" data-act="closesheet" style="margin-top:10px">Annuler</button><p class="small muted" style="margin:12px 2px 0">Changer de course remplace ton plan et réinitialise les séances cochées et les associations. Tes activités Garmin et tes réglages sont conservés.</p>';
  if(SETUP)h+=accountSetupHtml();
  if(SETUP&&!acct())h+='<details class="fold" style="margin:22px 0 0" data-fold="rcode"><summary><span>Récupérer une sauvegarde par code<small>Pour les plans sauvegardés avec l’ancien code de récupération</small></span></summary><div class="fbody"><label class="inp wide"><span>Code de récupération</span><input id="cloud-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-X"></label><button class="btn" data-act="cloudget">Récupérer ma sauvegarde</button></div></details>';
  if(SETUP)h+='<p class="small muted" style="margin:18px 2px 0;text-align:center;line-height:1.6">Plans indicatifs, sans avis médical.<br><button class="lnk" data-act="legal" style="margin:0">Mentions légales et confidentialité</button></p>';
  if(SETUP)h+='<div style="height:88px"></div>';   // place de la barre « Créer mon plan »
  return '<div class="rform">'+h+'</div>';
}
function renderSetup(){
  var d=raceDraft||(raceDraft=newRaceDraft()),h=raceFormHtml(d);
  if(SETUP){var vw=document.getElementById('view'),y=window.pageYOffset||0;document.body.classList.add('setup');vw.className='';vw.innerHTML=h;window.scrollTo(0,y);}
  else{var sh=document.getElementById('sheet'),st=sh.scrollTop;showSheet('Changer de course','Ton plan est recalculé pour la nouvelle course',h);sh.scrollTop=st;}
}
function saveRace(){
  var d=raceDraft,cls=raceCls(d),F=FORMATS[cls],span=d.date&&planSpan(d.date,cls,d),num=function(x){var n=parseFloat(String(x).replace(',','.'));return isFinite(n)&&n>0?n:null;};
  if(!span||span.err){toast('Vérifie la date de la course');return;}
  var sw=F.swim,bk=F.bike,rn=F.run;
  if(d.format==='custom'){sw=Math.round(num(d.swimKm)*1000);bk=Math.round(num(d.bikeKm)*1000);rn=Math.round(num(d.runKm)*1000);if(!(sw>0&&bk>0&&rn>0)){toast('Renseigne les trois distances');return;}}
  else if(d.dist){sw=d.dist.swimM;bk=d.dist.bikeM;rn=d.dist.runM;}
  else{var f0=FORMATS[d.format];sw=f0.swim;bk=f0.bike;rn=f0.run;}
  var pk=peakOf(d),yr=parseISO(d.date).getFullYear(),nsess=sessOf(d);
  var cfg={sessions:nsess,id:'c'+Date.now().toString(36),name:d.name.trim()||(FORMATS[d.format].n+' '+yr),city:d.city||'',date:d.date,format:d.format,swimM:sw,bikeM:bk,runM:rn,bikeUp:num(d.bikeUp),runUp:num(d.runUp),start:isoDate(span.start),weeks:span.n,level:d.level,peak:(cls==='full'&&nsess===8&&Math.abs(pk-REF_PEAK/60)<0.05)?0:pk};
  if(!SETUP&&cls===FCLS){if(CFG.vt)cfg.vt=CFG.vt;if(CFG.sc&&nsess===NSESS0)cfg.sc=CFG.sc;}   // même format : le réglage par sport suit (séances : si le total n'a pas changé)
  if(!SETUP){
    if(!confirm('Remplacer ton plan actuel par un nouveau plan pour « '+cfg.name+' » ? Les séances cochées et les associations seront réinitialisées.'))return;
    state.done={};state.links={};state.ui.missed={};state.ui.away=[];state.ui.sent={};state.ui.race={};state.ui.welcomed=undefined;
  }
  (SETUP?trackOnce:track)(SETUP?'plan_created':'plan_changed',cls+'|'+nsess+'s|l'+d.level);
  if(SETUP&&loginOn()){state.ui.pendingRace=cfg;save();trackOnce('login_step','');window.scrollTo(0,0);render(false);return;}
  state.race=cfg;save();location.reload();
}
