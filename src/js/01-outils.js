'use strict';
(function(){

/* =====================================================================
   1. CONSTANTES & OUTILS
   ===================================================================== */
/* Profil de test : uniquement en local (localhost, 127.0.0.1, fichier). http://localhost:8080/?profil=nom ouvre un espace
   isolé (stockage séparé, sans connexion Google, sans statistiques ni synchronisation). Voir DEV.md. Ignoré partout ailleurs. */
var DEV=(function(){
  if(!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)&&!/^file:/.test(location.protocol))return '';
  var m=/[?&]profil=([\w-]{1,24})(?:&|$)/.exec(location.search||'');
  return m?m[1]:'';
})();
var KEY='triient:v1'+(DEV?':dev-'+DEV:'');
// Ancien nom de l'app : les données enregistrées sous l'ancienne clé sont reprises une fois, puis l'ancienne clé est effacée.
try{(function(o){var v=localStorage.getItem(o);if(v===null)return;if(localStorage.getItem(KEY)===null)localStorage.setItem(KEY,v);localStorage.removeItem(o);})('ironman-sables-2027:v1'+(DEV?':dev-'+DEV:''));}catch(e){}
var PUB_API='https://triient.morgancabironman.workers.dev';
if(DEV){
  try{
    if(/[?&]reset=1(?:&|$)/.test(location.search)){                          // ?profil=nom&reset=1 : repart de zéro puis retire le paramètre
      localStorage.removeItem(KEY);
      history.replaceState(null,'',location.href.replace(/([?&])reset=1&?/,'$1').replace(/[?&]$/,''));
    }
  }catch(e){}
}
var DAY=864e5;
/* ---------- La course : format, date, distances ----------
   Tout le plan se déduit de cette configuration (state.race, créée à l'écran de démarrage).
   Les utilisateurs existants (avant la prise en charge de plusieurs courses) gardent l'Ironman des Sables d'Olonne. */
var FORMATS={
  sprint:{n:'Sprint',cls:'sprint',swim:750,bike:20000,run:5000,wmin:6,wmax:12,taper:1,peak:[4,5.5,7],cut:0,hr:[0.96,0.98],fat:0.12},
  olympic:{n:'Olympique',cls:'olympic',swim:1500,bike:40000,run:10000,wmin:8,wmax:16,taper:1,peak:[5,7,9],cut:0,hr:[0.93,0.95],fat:0.25},
  half:{n:'Demi-distance (70.3)',cls:'half',swim:1900,bike:90000,run:21100,wmin:12,wmax:24,taper:2,peak:[7,10,12.5],cut:8.5*3600,hr:[0.88,0.90],fat:0.55},
  full:{n:'Distance complète (140.6)',cls:'full',swim:3800,bike:180000,run:42195,wmin:18,wmax:30,taper:2,peak:[10,13,0],cut:17*3600,hr:[0.84,0.86],fat:1},
  custom:{n:'Autre distance',cls:'custom',swim:1500,bike:40000,run:10000}
};
var SABLES={id:'sables27',name:'Ironman des Sables d’Olonne',city:'Les Sables-d’Olonne',date:'2027-06-27',format:'full',swimM:3800,bikeM:178000,runM:42195,bikeUp:1334,runUp:200,start:'2027-01-04',weeks:25,level:2,peak:0};
function parseISO(s){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function fmtClass(c){
  if(c.format!=='custom')return FORMATS[c.format]?c.format:'full';
  return c.bikeM<30000?'sprint':c.bikeM<65000?'olympic':c.bikeM<135000?'half':'full';
}
function loadRaceCfg(){
  var s=null;try{s=JSON.parse(localStorage.getItem(KEY));}catch(e){}
  if(s&&s.race&&s.race.date&&s.race.start)return {cfg:s.race,fresh:false};
  var used=s&&((s.done&&Object.keys(s.done).length)||(s.sv&&s.sv.url)||(s.ui&&(s.ui.tab||s.ui.welcomed||s.ui.dflt||s.ui.prof)));
  return {cfg:SABLES,fresh:!used,migrate:!!used};
}
var RCFG=loadRaceCfg(),CFG=RCFG.cfg,FCLS=fmtClass(CFG),FMT=FORMATS[FCLS];
var RACE_DATE=parseISO(CFG.date);
var PLAN_START=parseISO(CFG.start);
var NW=CFG.weeks;
var RACE={swimM:CFG.swimM,bikeM:CFG.bikeM,runM:CFG.runM,cutoff:FMT.cut||0};
var RNAME=CFG.name||'Ma course',IS_SABLES=CFG.id==='sables27';
var RUNLBL=RACE.runM>=42000?'marathon':(RACE.runM>=21000&&RACE.runM<=21200)?'semi-marathon':fk(RACE.runM)+' km';
function fmtInt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
var RL=IS_SABLES?'Ironman':'course';       // « allure course » ; l'Ironman des Sables (plan d'origine) garde « allure Ironman »
var DAYS=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
var MONTHS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
var MONTHS_L=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

function nowDate(){
  var n=new Date(),q=/[?&]today=(\d{4})-(\d{2})-(\d{2})/.exec(location.search||'');
  return q?new Date(+q[1],+q[2]-1,+q[3],n.getHours(),n.getMinutes(),n.getSeconds()):n;
}
function today(){var n=nowDate();return new Date(n.getFullYear(),n.getMonth(),n.getDate());}
function addDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);}
function diffDays(a,b){return Math.round((a-b)/DAY);}
function dnum(d){return d.getDate()===1?'1er':String(d.getDate());}
function fmtDay(d){return dnum(d)+' '+MONTHS[d.getMonth()];}
function fmtLong(d){return DAYS[(d.getDay()+6)%7]+' '+dnum(d)+' '+MONTHS_L[d.getMonth()]+' '+d.getFullYear();}
function fmtRange(s){
  var e=addDays(s,6);
  return s.getMonth()===e.getMonth()?dnum(s)+' – '+fmtDay(e):fmtDay(s)+' – '+fmtDay(e);
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
function R5(x){return Math.round(x/5)*5;}
// Durées : toujours au format 1h36. fm sert aux consignes des séances, où « 45 min » reste plus naturel sous l'heure.
function fm(m){var h=Math.floor(m/60),r=m%60;return h?h+'h'+(r<10?'0':'')+r:m+' min';}
function fh(m){m=Math.round(m);var r=m%60;return Math.floor(m/60)+'h'+(r<10?'0':'')+r;}
function km(m){return (m/1000).toFixed(1).replace('.',',');}
function pct(a,b){return b?Math.max(0,Math.min(100,Math.round(a/b*100))):0;}

var ICONS={
  dash:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  week:'<path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  plan:'<path d="M3 3v18h18"/><path d="M8 7h8M8 12h11M8 17h6"/>',
  notes:'<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  swim:'<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  bike:'<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
  run:'<circle cx="15" cy="4.5" r="1.8"/><path d="M14 7.5l-3 6.5"/><path d="M13.6 9l3.4 2.4 2.5-1"/><path d="M13 9l-3.5 1-2.2 3"/><path d="M11 14l3.5 2.5-1.5 4.5"/><path d="M11 14l-3 3.5-3.5 1"/>',
  brick:'<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  str:'<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  rest:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  chart:'<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V7M18 17v-8"/>',
  more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  race:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',down:'<path d="m6 9 6 6 6-6"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  gear:'<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  watch:'<rect x="6" y="6" width="12" height="12" rx="3"/><path d="m9 6 .6-3h4.8l.6 3M9 18l.6 3h4.8l.6-3M12 9.5V12l1.5 1.2"/>'
};
function ic(n,s){s=s||22;return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[n]+'</svg>';}

