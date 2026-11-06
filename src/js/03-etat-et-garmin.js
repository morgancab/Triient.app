/* =====================================================================
   3. ÉTAT & SAUVEGARDE LOCALE
   ===================================================================== */
var memOnly=false;
function loadState(){
  try{
    var s=JSON.parse(localStorage.getItem(KEY));
    if(s&&typeof s==='object')return {done:s.done||{},ui:s.ui||{},links:s.links||{},sv:s.sv||{},race:s.race};
  }catch(e){}
  return {done:{},ui:{},links:{},sv:{}};
}
var state=loadState();
// Ancienne adresse du serveur (avant le changement de nom) : remplacée par la nouvelle.
(function(o){if(state.sv&&o.test(state.sv.url||''))state.sv.url=state.sv.url.replace(o,PUB_API);if(state.ui&&o.test(state.ui.pubApi||''))state.ui.pubApi=state.ui.pubApi.replace(o,PUB_API);})(/^https:\/\/ironman-strava\.morgancabironman\.workers\.dev/);
// Efface les notes (fatigue, douleurs) enregistrées par les anciennes versions
try{var s0=JSON.parse(localStorage.getItem(KEY));if(s0&&s0.notes)localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
if(RCFG.migrate&&!state.race){state.race=SABLES;try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}   // utilisateur existant : on fige sa course (Ironman des Sables d'Olonne)
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(state));memOnly=false;}
  catch(e){if(!memOnly){memOnly=true;toast('Stockage local indisponible : les données ne seront pas conservées');}}
  try{cloudSchedule();}catch(e){}
}
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}

/* ---------- Garmin (via intervals.icu) : rapprochement automatique activités ↔ séances, associations manuelles ----------
   Une activité Garmin coche toute seule la séance du plan la plus proche (même discipline, même semaine
   ou semaine précédente, durée ≥ 50 % du prévu). Les associations manuelles (state.links) priment :
   links[idActivité] = idSéance (forcée) ou 0 (ignorée). */
var LK={s2a:{},a2s:{}},ALLS=[],SBY={};
function indexSess(){PLAN.forEach(function(wk){wk.days.forEach(function(day){day.sessions.forEach(function(s){SBY[s.id]=s;if(s.sp!=='rest'&&s.sp!=='race')ALLS.push(s);});});});}
indexSess();
function plLocal(str){var m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(str||'');return m?new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5]):null;}
function actSport(a){var t=a.t||'';if(/Swim/.test(t))return 'swim';if(/Ride/.test(t))return 'bike';if(/Run/.test(t))return 'run';if(t==='WeightTraining'||t==='Workout'||t==='Crossfit')return 'str';return null;}
function dayIdx(a){var d=plLocal(a.s);return d?Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-PLAN_START)/DAY):-999;}
function sessIdx(s){return (s.w-1)*7+s.d;}
function sessLabel(s){return 'S'+s.w+' · '+DAYS[s.d]+' '+fmtDay(addDays(PLAN_START,sessIdx(s)));}
function actDate(a){var d=plLocal(a.s);return d?DAYS[(d.getDay()+6)%7]+' '+fmtDay(d):'';}
function actLine(a){
  var p=[fh(Math.round(a.d/60))];
  if(a.m>0)p.push(km(a.m)+' km');
  if(a.h)p.push(a.h+' bpm');
  if(a.w)p.push(a.w+' W');
  return p.join(' · ');
}
function actWhen(a,s){var di=dayIdx(a);return di===sessIdx(s)||di<0?'':' · fait le '+DAYS[di%7].toLowerCase()+' '+fmtDay(addDays(PLAN_START,di));}
function computeLinks(){
  var acts=((state.sv&&state.sv.acts)||[]).filter(function(a){return a&&a.s;}),man=state.links||{},s2a={},a2s={},used={},pairs=[];
  acts.forEach(function(a){var m=man[a.id];if(m===undefined)return;used[a.id]=1;a2s[a.id]=m||0;if(m)s2a[m]=a;});
  var bikes=acts.filter(function(a){return actSport(a)==='bike';});
  acts.forEach(function(a){
    var k=actSport(a);if(used[a.id]||!k||a.d<600)return;
    var ai=dayIdx(a),aw=Math.floor(ai/7),ab=false,st=plLocal(a.s);
    if(ai<0)return;
    if(k==='run')ab=bikes.some(function(b){var bs=plLocal(b.s);if(!bs||dayIdx(b)!==ai)return false;var gap=(st-(bs.getTime()+(b.e||b.d)*1000))/6e4;return gap>=-5&&gap<=60;});
    ALLS.forEach(function(s){
      if(s2a[s.id]||state.done[s.id])return;
      var sw=s.w-1;if(sw>aw||sw<aw-1)return;
      if(!(k===s.sp||(k==='run'&&s.sp==='brick'&&ab)))return;
      var si=sw*7+s.d,r=k==='swim'?a.m/(s.m||1):a.d/60/(s.min||1);
      if(r<0.5)return;
      pairs.push([Math.abs(si-ai)+Math.abs(Math.log(r))*4+(k==='run'&&s.sp==='run'&&ab?3:0)+(sw<aw?1.5:0),a,s]);
    });
  });
  pairs.sort(function(x,y){return x[0]-y[0];});
  pairs.forEach(function(p){var a=p[1],s=p[2];if(used[a.id]||s2a[s.id])return;used[a.id]=1;s2a[s.id]=a;a2s[a.id]=s.id;});
  LK={s2a:s2a,a2s:a2s};
}
function isDone(s){return !!(state.done[s.id]||LK.s2a[s.id]);}
function doneMin(s){var a=LK.s2a[s.id];return a?Math.round(a.d/60):s.min;}
function doneM(s){var a=LK.s2a[s.id];return a?a.m:s.m;}
function actBlock(s){
  if(s.sp==='rest'||s.sp==='race')return '';
  var a=LK.s2a[s.id],sv=state.sv||{};
  if(a)return '<div class="act"><b>Activité Garmin</b><div class="an">'+esc(a.n)+'</div><div class="small muted">'+esc(actDate(a)+' · '+actLine(a))+'</div><button class="btn" style="margin:10px 0 8px" data-act="actdetail" data-aid="'+esc(a.id)+'">Voir le détail de l’activité</button><div class="btns"><button class="btn" data-act="pickact" data-sid="'+s.id+'">Changer</button><button class="btn" data-act="unlink" data-aid="'+esc(a.id)+'">Dissocier</button></div></div>';
  if(sv.url&&sv.key)return '<div class="act"><b>Activité réalisée</b><div class="small muted">Aucune activité associée'+(state.done[s.id]?' (cochée à la main)':'')+'.</div><button class="btn" style="margin:10px 0 0" data-act="pickact" data-sid="'+s.id+'">Associer une activité Garmin</button></div>';
  return '';
}

function status(){
  var t=today(),d=diffDays(t,PLAN_START),rd=diffDays(RACE_DATE,t);
  if(d<0)return {s:'before',w:1,days:-d};
  if(rd<0)return {s:'after',w:NW};
  return {s:rd===0?'raceday':'during',w:Math.min(NW,Math.floor(d/7)+1),elapsed:d};
}
function wkStats(wk){
  var r={n:0,d:0,min:0,dmin:0,m:0,dm:0};
  wk.days.forEach(function(day){day.sessions.forEach(function(s){
    if(s.sp==='rest')return;
    var ok=isDone(s);r.n++;r.min+=s.min;r.m+=s.m;
    if(ok){r.d++;r.dmin+=doneMin(s);r.dm+=doneM(s);}
  });});
  return r;
}
function stats(){
  var t={n:0,d:0,min:0,dmin:0},sp={swim:{m:0,dm:0,min:0,dmin:0},bike:{min:0,dmin:0},run:{min:0,dmin:0},str:{min:0,dmin:0}};
  PLAN.forEach(function(wk){wk.days.forEach(function(day){day.sessions.forEach(function(s){
    if(s.sp==='rest')return;
    var ok=isDone(s),k=s.sp==='brick'?'run':s.sp;
    t.n++;t.min+=s.min;if(ok){t.d++;t.dmin+=doneMin(s);}
    if(sp[k]){sp[k].min+=s.min;if(ok)sp[k].dmin+=doneMin(s);if(k==='swim'){sp.swim.m+=s.m;if(ok)sp.swim.dm+=doneM(s);}}
  });});});
  return {t:t,sp:sp};
}

