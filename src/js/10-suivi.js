/* ---------- Suivi de l'app (propriétaire) ---------- */
var adminD=null,adminBusy=false,adminErr='',adminT=0;
function adminLoad(){
  if(adminBusy)return;
  adminBusy=true;adminErr='';
  if(tab==='admin')render(true);
  acctCall('GET','/pub/admin/stats?days='+admDays).then(function(j){adminEv=j&&j.ok?j:null;if(tab==='admin')safeRender();}).catch(function(){});
  acctCall('GET','/pub/admin/overview').then(function(j){
    if(j&&j.ok){adminD=j;adminT=Date.now();}
    else adminErr=(j&&j.status===403)?'Accès réservé au propriétaire.':((j&&j.error)||'Chargement impossible.');
  }).catch(function(){adminErr='Serveur injoignable.';}).then(function(){adminBusy=false;if(tab==='admin')safeRender();});
}
function admFmt(k){return (FORMATS[k]&&FORMATS[k].n)||(k==='custom'?'Distances libres':'');}
// Distances de sa course (natation · vélo · course), vide si l'app ne les a pas transmises
function admDist(x){return x&&x.swimM>0&&x.bikeM>0&&x.runM>0?fk(x.swimM)+' · '+fk(x.bikeM)+' · '+fk(x.runM)+' km':'';}
// Pastilles d'un utilisateur : appareil, installation, Garmin, envois vers la montre (inconnu tant que son app n'a rien envoyé)
function admBadges(u){
  var b=[];
  if(u.device)b.push('<span class="chip">'+esc(u.device)+'</span>');
  if(u.installed!=null)b.push(u.installed?'<span class="chip ok">App installée</span>':'<span class="chip">Navigateur</span>');
  if(u.garmin!=null)b.push(u.garmin?'<span class="chip ok">Garmin</span>':'<span class="chip">Sans Garmin</span>');
  if(u.sent)b.push('<span class="chip">'+u.sent+' envoi'+(u.sent>1?'s':'')+' montre</span>');
  return b.length?'<div class="adm-b">'+b.join('')+'</div>':'';
}
function admUser(u){
  var pctv=u.total?Math.round(u.done/u.total*100):0,rd=parseISO(u.raceDate);
  return '<button class="adm-u" data-act="admuser" data-id="'+esc(u.id||'')+'"><div class="row"><b class="adm-n">'+esc(u.name||u.email)+'</b>'+(u.owner?'<span class="chip">Toi</span>':'')+'<span class="sp"></span><span class="small muted">'+esc(ago(u.seen))+'</span>'+ic('right',16)+'</div>'+
    (u.name?'<div class="small muted adm-e">'+esc(u.email)+'</div>':'')+
    '<div class="adm-r">'+(u.race?'<b>'+esc(u.race)+'</b><br><span class="small muted">'+[rd?fmtDay(rd)+' '+rd.getFullYear():'',u.format==='custom'&&admDist(u)?admDist(u):admFmt(u.format),u.weeks?u.weeks+' semaines':''].filter(Boolean).map(esc).join(' · ')+'</span>':'<span class="small muted">Aucun plan créé</span>')+'</div>'+
    (u.race?(u.total?'<div class="pr-h" style="margin:8px 0 5px"><span>Progression</span><span>'+u.done+' / '+u.total+' séances · '+pctv+' %</span></div>'+bar(pctv):'<div class="small muted" style="margin-top:8px">Progression pas encore reçue</div>'):'')+
    admBadges(u)+'<div class="small muted" style="margin-top:8px">Inscrit le '+esc(admFull(u.created))+(u.visits?' · '+u.visits+' visite'+(u.visits>1?'s':''):'')+'</div></button>';
}
/* Fiche d'un utilisateur (#admin?s=usr:ID) */
var admCache={},admCur=null;
// Date et heure : « jeu. 5 nov. · 09:54 » (année ajoutée si ce n'est pas l'année en cours) ; admFull : toujours avec l'année
function admHM(d){return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
function admWhen(t){var d=new Date(t);return DAYS[(d.getDay()+6)%7].slice(0,3).toLowerCase()+'. '+fmtDay(d)+(d.getFullYear()!==new Date().getFullYear()?' '+d.getFullYear():'')+' · '+admHM(d);}
function admFull(t){if(!t)return '–';var d=new Date(t);return DAYS[(d.getDay()+6)%7].slice(0,3).toLowerCase()+'. '+fmtDay(d)+' '+d.getFullYear()+' à '+admHM(d);}
function openAdmUser(id){
  var u=((adminD&&adminD.users)||[]).filter(function(x){return x.id===id;})[0];
  admCur=id;
  showSheet(u?(u.name||u.email):'Utilisateur',u&&u.name?u.email:'',admCache[id]?admDetail(admCache[id]):'<div id="adm-det"><div class="skel" aria-label="Chargement"><i></i><i></i></div></div>');
  sheetRoute('usr:'+id);
  acctCall('GET','/pub/admin/user?id='+encodeURIComponent(id)).then(function(j){
    if(!j||!j.ok)throw new Error((j&&j.error)||'Erreur');
    admCache[id]=j;var el=document.getElementById('adm-det');if(admCur===id&&el)el.outerHTML=admDetail(j);
  }).catch(function(e){var el=document.getElementById('adm-det');if(admCur===id&&el&&!admCache[id])el.innerHTML='<p class="small muted">Fiche indisponible ('+esc(errTxt(e))+').</p>';});
}
function admDetail(j){
  var u=j.user,r=j.race,p=j.plan,vs=j.visits||[],kv=function(k,v){return '<div class="adm-kv"><span>'+k+'</span><b>'+v+'</b></div>';};
  var yn=function(v,a,b){return v==null?'<span class="muted">Inconnu</span>':v?a:b;},grp2=function(t,rows,def){var p=t.split(' · ');return admFoldHtml('adm-u-'+p[0].toLowerCase().replace(/[^a-z]+/g,'-'),t,'','<div class="scard">'+rows+'</div>',def);};
  var h=grp2('Profil',
    kv('E-mail',esc(u.email))+kv('Inscrit le',esc(admFull(u.created)))+kv('Dernière visite',esc(admFull(u.seen))+'<br><span class="small muted">'+esc(ago(u.seen))+'</span>')+kv('Connexion Google',esc(admFull(u.lastLogin)))+
    kv('Visites',u.visits==null?'<span class="muted">Inconnu</span>':u.visits)+kv('Dernier appareil',u.device?esc(u.device):'<span class="muted">Inconnu</span>')+kv('App installée',yn(u.installed,'Oui','Pas encore vue')),true);
  h+=grp2('Garmin',kv('Connexion',yn(u.garmin,'Connecté','Non connecté')+(u.garminKey?' · clé dans le compte':''))+kv('Séances envoyées vers la montre',u.sent==null?'<span class="muted">Inconnu</span>':u.sent)+kv('Activités Garmin reçues',u.acts==null?'<span class="muted">Inconnu</span>':u.acts));
  if(r){var rd=parseISO(r.date),pc=u.total?Math.round(u.done/u.total*100):0;
    h+=grp2('Plan',kv('Course',esc(r.name||'Sans nom'))+kv('Date',esc(rd?fmtDay(rd)+' '+rd.getFullYear():'–'))+kv('Format',esc(admFmt(r.format)||'–'))+(admDist(r)?kv('Distances',esc(admDist(r))+(r.bikeUp||r.runUp?'<br><span class="small muted">'+esc([r.bikeUp?'vélo D+ '+r.bikeUp+' m':'',r.runUp?'course D+ '+r.runUp+' m':''].filter(Boolean).join(' · '))+'</span>':'')):'')+kv('Durée',esc((r.weeks||'–')+' semaines'))+(r.sessions?kv('Séances par semaine',r.sessions):'')+
      (r.sc?kv('Séances par sport',esc([['swim','natation'],['bike','vélo'],['run','course'],['brick','enchaînement'],['str','renfo']].filter(function(k){return r.sc[k[0]];}).map(function(k){return r.sc[k[0]]+' '+k[1];}).join(' · '))):'')+
      (r.vt&&Object.keys(r.vt).length?kv('Volumes réglés',VT_UI.filter(function(x){return r.vt[x[0]];}).map(function(x){var v=r.vt[x[0]];return esc(x[1])+' : '+(v[0]===v[1]?fh(v[0]):fh(v[0])+' → '+fh(v[1]));}).join('<br>')):'')+
      kv('Progression',u.total?u.done+' / '+u.total+' · '+pc+' %':'<span class="muted">Pas encore reçue</span>')+(p?kv('Séances cochées',p.checked)+kv('Associations manuelles',p.linked)+kv('Questionnaire de niveau',p.levelTest?'Rempli':'Non')+kv('Absences',p.away)+(p.injuries!=null?kv('Blessures déclarées',p.injuries+(p.paused?' · <span class="chip">en pause</span>':'')):'')+kv('Séances manquées traitées',p.missed):''),true);}
  else h+=grp2('Plan',kv('Course','<span class="muted">Aucun plan créé</span>'));
  var sts=(j.steps||[]).slice().sort(function(x,y){return x.date>y.date?1:-1;});
  if(r)h+=grp2('Courses intermédiaires'+(sts.length?' · '+sts.length:''),sts.length?sts.map(function(st){
    var sd=parseISO(st.date),k=STEP_K[st.kind]?st.kind:'tri';
    return '<div class="adm-st"><span class="ad-ic sp-'+(k==='tri'?'race':k)+'">'+ic(STEP_ICO[k],18)+'</span><div><b>'+esc(st.name||'Sans nom')+'</b>'+
      '<div class="small muted">'+[sd?fmtDay(sd)+' '+sd.getFullYear():'',stepDist({kind:k,format:st.format,distM:st.distM}),st.city].filter(Boolean).map(esc).join(' · ')+'</div></div>'+
      '<span class="chip'+(st.prio==='key'?' ok':'')+'">'+esc(STEP_P[st.prio]||'Préparation')+'</span></div>';
  }).join(''):kv('Aucune course renseignée',''));
  // Visites des 30 derniers jours, jour par jour
  var now=new Date(),d0=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()-29*864e5,days=[],i,n30=0;
  for(i=0;i<30;i++)days.push(0);
  vs.forEach(function(v){if(v.kind!=='visit'||v.t<d0)return;var k=Math.floor((v.t-d0)/864e5);if(k>=0&&k<30){days[k]++;n30++;}});
  var mx=Math.max.apply(null,days)||1;
  var dd30=days.map(function(_,k){return isoDate(new Date(d0+k*864e5+43200000));});
  h+=grp2('Visites sur 30 jours · '+n30,admHist(days,[fmtDay(new Date(d0)),'Aujourd’hui'],dd30,['visite','visites']),true);
  // Appareils : chacun avec ses propres valeurs (Garmin et envois vers la montre sont enregistrés sur chaque appareil)
  if((j.devices||[]).length)h+=grp2('Appareils · '+j.devices.length,j.devices.map(function(x){
    var t=[x.n?x.n+' visite'+(x.n>1?'s':''):'',x.garmin===1?'Garmin':x.garmin===0?'sans Garmin':'',x.sent?x.sent+' envoi'+(x.sent>1?'s':'')+' montre':'','vu '+admWhen(x.last)].filter(Boolean);
    return '<div class="adm-kv"><span>'+esc(x.device||'Inconnu')+'</span><b>'+esc(t.join(' · '))+'</b></div>';}).join(''));
  h+=grp2('Historique',vs.length?vs.slice(0,60).map(function(v){return '<div class="adm-v"><time>'+esc(admWhen(v.t))+'</time><span>'+(v.kind==='login'?'<b>Connexion Google</b>':esc(v.device||'Visite'))+'</span></div>';}).join(''):'<div class="adm-kv"><span>Aucune visite enregistrée pour l’instant</span></div>');
  h+='<p class="small muted" style="margin:12px 4px 0">Installation, Garmin et envois vers la montre réunissent tous ses appareils : oui si c’est vrai sur au moins un, et le plus grand nombre d’envois. Ces informations ne sont connues que si l’utilisateur a gardé les statistiques d’usage activées, et seulement depuis cette version de l’app.</p>';
  return '<div id="adm-det">'+h+'</div>';
}
/* ---------- Suivi de l'app : analyse (propriétaire) ----------
   Deux sources : les compteurs anonymes par jour (route /pub/admin/stats : écran d'accueil, formulaire, plans remplis, ouvertures, recherches…)
   et les comptes (vue d'ensemble : inscription, visites, progression, appareil, Garmin). Le compte du propriétaire est exclu des calculs.
   admAnalytics est pure (données en entrée, HTML en sortie) pour pouvoir être testée. */
var adminEv=null,admDays=30;
function admPct(a,b){return b?Math.round(a/b*100):0;}
function admCount(list,key){var o={};list.forEach(function(x){var k=key(x);if(k)o[k]=(o[k]||0)+1;});return Object.keys(o).map(function(k){return [k,o[k]];}).sort(function(a,b){return b[1]-a[1];});}
function admRows(list,total,col){var mx=Math.max.apply(null,list.map(function(x){return x[1];}).concat([1]));return list.map(function(x){return prRow(esc(x[0]),x[1]+(total?' · '+admPct(x[1],total)+' %':''),Math.round(x[1]/mx*100),col);}).join('');}
// Histogramme jour par jour : touche, glisse le doigt ou survole pour lire la valeur d'un jour (dates : AAAA-MM-JJ, unit : [singulier, pluriel]).
// Chaque jour est une colonne pleine hauteur (<i>), la barre visible est dedans (<em>) : même un jour à 0 se touche facilement.
function admHist(vals,lbl,dates,unit){
  var mx=Math.max.apply(null,vals.concat([1])),tot=vals.reduce(function(p,c){return p+c;},0),u=function(n){return n+' '+(unit?(n>1?unit[1]:unit[0]):'');};
  return '<div class="adm-hw"><div class="adm-ro"><span>Total '+u(tot)+'</span><span>max '+Math.max.apply(null,vals.concat([0]))+'</span></div><div class="adm-hist">'+vals.map(function(c,i){var d=dates&&parseISO(dates[i]),t=(d?DAYS[(d.getDay()+6)%7].slice(0,3).toLowerCase()+'. '+fmtDay(d):'')+' : '+u(c);return '<i'+(c?'':' class="z"')+' data-t="'+esc(t)+'" title="'+esc(t)+'"><em style="height:'+(c?Math.max(8,Math.round(c/mx*100)):4)+'%"></em></i>';}).join('')+'</div><div class="adm-hl"><span>'+esc(lbl[0])+'</span><span>'+esc(lbl[1])+'</span></div></div>';
}
// le jour se déduit de la position horizontale : pas besoin de viser une barre fine
function admHistAt(h,x){
  var bars=h.querySelectorAll('i'),r=h.getBoundingClientRect();if(!bars.length||!r.width)return;
  var b=bars[Math.max(0,Math.min(bars.length-1,Math.floor((x-r.left)/r.width*bars.length)))],w=h.closest('.adm-hw'),ro=w&&w.querySelector('.adm-ro');
  if(!ro||b.classList.contains('on'))return;
  Array.prototype.forEach.call(h.querySelectorAll('i.on'),function(x){x.classList.remove('on');});
  b.classList.add('on');ro.innerHTML='<b>'+esc(b.getAttribute('data-t'))+'</b>';
}
var admScrub=null;
document.addEventListener('pointerdown',function(e){var h=e.target&&e.target.closest&&e.target.closest('.adm-hist');if(!h)return;admScrub=h;admHistAt(h,e.clientX);});
document.addEventListener('pointermove',function(e){var h=admScrub||(e.pointerType==='mouse'&&e.target&&e.target.closest&&e.target.closest('.adm-hist'));if(h)admHistAt(h,e.clientX);});
document.addEventListener('pointerup',function(){admScrub=null;});
document.addEventListener('pointercancel',function(){admScrub=null;});
// Blocs dépliants du suivi : ouverts ou fermés comme on les a laissés (la page se recharge à chaque actualisation)
var admFold={};
function admFoldHtml(id,title,sub,body,def){
  var o=admFold[id]!==undefined?admFold[id]:!!def;
  return '<details class="fold adm-f" data-fold="'+id+'"'+(o?' open':'')+'><summary><span>'+title+(sub?'<small>'+sub+'</small>':'')+'</span></summary><div class="fbody">'+body+'</div></details>';
}
document.addEventListener('toggle',function(e){var d=e.target,k=d&&d.getAttribute&&d.getAttribute('data-fold');if(k&&/^adm-/.test(k))admFold[k]=d.open;},true);
function admPlanLbl(p){var x=String(p).split('|'),f=FORMATS[x[0]];return (f?f.n:x[0])+(x[1]?' · '+x[1].replace('s',' séances'):'')+(x[2]?' · '+(['Débutant','Intermédiaire','Confirmé'][+x[2].slice(1)]||x[2]):'');}
function admAnalytics(D,E,days,now){
  now=now||Date.now();
  var DAY=864e5,U=(D.users||[]).filter(function(u){return !u.owner;}),n=U.length,T=(E&&E.totals)||{},t=function(k){return T[k]||0;},since=Date.parse(new Date(now-(days-1)*DAY).toISOString().slice(0,10)+'T00:00:00Z');   // début du 1er jour UTC affiché
  var tile=function(v,l,sub){return '<div class="adm-c"><b>'+v+'</b><span>'+l+'</span>'+(sub?'<small>'+sub+'</small>':'')+'</div>';},h='';
  var card=function(title,sub,body){return admFoldHtml('adm-'+title.toLowerCase().replace(/[^a-z]+/g,'-'),title,sub,body,/^Activit/.test(title));};
  var newN=U.filter(function(u){return u.created>=since;}).length;
  // 1. Entonnoir d'inscription
  if(E){
    var steps=[['Page d’accueil vue',t('gate_view')],['« Créer mon plan » touché',t('guest_start')],['Formulaire « Ta course » ouvert',t('setup_view')],['Plan rempli',t('plan_created')],['Compte créé',newN]],top=Math.max(steps[0][1],1);
    var fun=steps.map(function(st,i){var prev=i?steps[i-1][1]:0;return prRow(st[0],st[1]+(i&&prev?' · '+admPct(st[1],prev)+' %':''),Math.round(st[1]/top*100));}).join('');
    fun+='<div class="adm-g" style="margin-top:6px">'+tile(admPct(newN,steps[0][1])+' %','Visiteur → compte')+tile(admPct(newN,t('plan_created'))+' %','Plan rempli → compte')+'</div>'+
      '<p class="small muted" style="margin:10px 0 0">Le pourcentage de chaque ligne est calculé par rapport à l’étape précédente. Les étapes viennent des compteurs anonymes (un visiteur qui recharge la page compte plusieurs fois), la dernière vient des comptes.</p>';
    h+=card('Entonnoir d’inscription',days+' jours',fun);
  }
  // 2. Activité jour par jour
  if(E){
    var dd=[],opens=[],plans=[],accs=[],i;
    // jours en heure universelle, comme les compteurs du serveur (sinon, entre minuit et 1 h ou 2 h, tout glisse d'un jour)
    var utcDay=function(t){return new Date(t).toISOString().slice(0,10);};
    for(i=days-1;i>=0;i--)dd.push(utcDay(now-i*DAY));
    var people=[];
    dd.forEach(function(d){var x=(E.daily||{})[d]||{};opens.push(x.open||0);plans.push(x.plan_created||0);people.push((E.acc||{})[d]||0);accs.push(U.filter(function(u){return utcDay(u.created)===d;}).length);});
    var sum=function(a){return a.reduce(function(p,c){return p+c;},0);},lbl=[fmtDay(parseISO(dd[0])),'Aujourd’hui'];
    var avg=function(a){return String(Math.round(sum(a)/days*10)/10).replace('.',',');};
    h+=card('Activité',days+' jours','<div class="adm-g" style="margin-top:0">'+tile(avg(people),'Personnes actives par jour','en moyenne, comptes distincts')+tile(avg(opens),'Appareils actifs par jour','en moyenne')+tile(sum(accs),'Nouveaux comptes')+tile(t('install'),'Premiers lancements','navigateurs ou appareils neufs')+'</div>'+
      '<div class="eyebrow" style="margin:16px 0 0">Personnes actives</div>'+admHist(people,lbl,dd,['personne','personnes'])+
      '<div class="eyebrow" style="margin:10px 0 0">Appareils qui ouvrent l’app</div>'+admHist(opens,lbl,dd,['appareil','appareils'])+
      '<div class="eyebrow" style="margin:10px 0 0">Nouveaux comptes</div>'+admHist(accs,lbl,dd,['compte','comptes'])+
      '<details class="adm-lex"><summary>Comment lire ces chiffres</summary>'+
        '<p><b>Personnes actives</b> : comptes distincts qui ont ouvert l’app ce jour-là. Une personne sur iPhone et sur ordinateur compte une fois. Seuls les comptes qui gardent les statistiques d’usage activées sont suivis.</p>'+
        '<p><b>Appareils actifs</b> : navigateurs ou apps installées qui ont ouvert l’app ce jour-là, une fois par jour chacun, sans compte nécessaire. Une même personne peut en avoir plusieurs (sur iPhone, Safari et l’app installée comptent séparément).</p>'+
        '<p><b>Premiers lancements</b> : premières ouvertures sur un navigateur ou un appareil. Changer de navigateur ou effacer ses données compte à nouveau : ce n’est pas un nombre de personnes.</p>'+
        '<p><b>Nouveaux comptes</b> : inscriptions réelles, sans doublon. Toutes les dates sont en heure universelle (une heure de décalage avec la France en hiver).</p></details>');
  }
  // 3. Engagement des comptes
  if(n){
    var withPlan=U.filter(function(u){return u.race;}).length,active=U.filter(function(u){return u.done>0;}).length,back=U.filter(function(u){return (u.visits||0)>=2;}).length;
    var el7=U.filter(function(u){return u.created<=now-7*DAY;}),r7=el7.filter(function(u){return u.seen>=u.created+7*DAY;}).length,el30=U.filter(function(u){return u.created<=now-30*DAY;}),r30=el30.filter(function(u){return u.seen>=u.created+30*DAY;}).length;
    var prog=U.filter(function(u){return u.total>0;}),avgP=prog.length?Math.round(prog.reduce(function(p,u){return p+u.done/u.total;},0)/prog.length*100):0;
    var rec=[['Aujourd’hui',0,1],['2 à 7 jours',1,7],['8 à 30 jours',7,30],['Plus de 30 jours',30,1e9]].map(function(b){return [b[0],U.filter(function(u){var a=(now-u.seen)/DAY;return a>=b[1]&&a<b[2];}).length];});
    h+=card('Engagement','sur '+n+' compte'+(n>1?'s':''),
      '<div class="adm-g" style="margin-top:0">'+tile(admPct(withPlan,n)+' %','Avec un plan')+tile(admPct(active,n)+' %','Au moins 1 séance cochée')+tile(admPct(back,n)+' %','Revenus (2 visites ou plus)')+tile(avgP+' %','Plan réalisé en moyenne')+
      tile(el7.length?admPct(r7,el7.length)+' %':'–','Encore là après 7 jours',el7.length?r7+' sur '+el7.length:'pas encore de recul')+tile(el30.length?admPct(r30,el30.length)+' %':'–','Encore là après 30 jours',el30.length?r30+' sur '+el30.length:'pas encore de recul')+'</div>'+
      '<div class="eyebrow" style="margin:16px 0 8px">Dernière visite</div>'+admRows(rec,n)+
      '<p class="small muted" style="margin:10px 0 0">« Encore là » : comptes revenus au moins 7 (ou 30) jours après leur inscription, parmi ceux inscrits depuis assez longtemps.</p>');
    // 4. Qui sont-ils
    var dev=admCount(U,function(u){return u.device?u.device.split(' · ')[0]:'';}),how=[['App installée',U.filter(function(u){return u.installed===1;}).length],['Navigateur seulement',U.filter(function(u){return u.installed===0;}).length]];
    var fm=admCount(U.filter(function(u){return u.format;}),function(u){return admFmt(u.format);}),wk=admCount(U.filter(function(u){return u.weeks;}),function(u){return u.weeks<=12?'12 semaines ou moins':u.weeks<=20?'13 à 20 semaines':u.weeks<=30?'21 à 30 semaines':'Plus de 30 semaines';});
    var mo=admCount(U.filter(function(u){var d=parseISO(u.raceDate);return d&&d.getTime()>=now-DAY;}),function(u){var d=parseISO(u.raceDate);return MONTHS_L[d.getMonth()]+' '+d.getFullYear();});
    mo.sort(function(a,b){var p=function(x){var q=x[0].split(' ');return +q[1]*12+MONTHS_L.indexOf(q[0]);};return p(a)-p(b);});
    h+=card('Qui sont-ils','',
      (fm.length?'<div class="eyebrow" style="margin:0 0 8px">Format de course</div>'+admRows(fm,withPlan):'')+
      (wk.length?'<div class="eyebrow" style="margin:16px 0 8px">Durée du plan</div>'+admRows(wk,withPlan):'')+
      (mo.length?'<div class="eyebrow" style="margin:16px 0 8px">Mois de course à venir</div>'+admRows(mo.slice(0,8),0):'')+
      (dev.length?'<div class="eyebrow" style="margin:16px 0 8px">Appareil</div>'+admRows(dev,0):'')+
      (how[0][1]+how[1][1]?'<div class="eyebrow" style="margin:16px 0 8px">Façon d’utiliser l’app</div>'+admRows(how,how[0][1]+how[1][1]):'')+
      '<div class="eyebrow" style="margin:16px 0 8px">Garmin</div>'+admRows([['Garmin connecté',U.filter(function(u){return u.garmin===1;}).length],['Ont envoyé au moins une séance sur la montre',U.filter(function(u){return u.sent>0;}).length]],n));
  }
  // 5. Ce qu'ils cherchent et choisissent
  if(E){
    var tp=(E.top||{}),lst=function(k,f){return (tp[k]||[]).slice(0,8).map(function(x){return [f?f(x[0]):x[0],x[1]];});};
    var pc=lst('plan_created',admPlanLbl),rp=lst('race_pick'),sm=lst('search_miss');
    // Garmin : seuls les compteurs marqués (« u » : assistant ouvert, une fois par appareil ; « wiz » : réussite de l'assistant ; « sync » : clé déjà présente)
    // sont comparables entre eux. Les anciens compteurs sans marque mélangeaient ouvertures répétées et synchronisations : affichés à part.
    var pv=function(k,p){var r=(tp[k]||[]).filter(function(x){return x[0]===p;})[0];return r?r[1]:0;},wo=pv('wiz_start','u'),wk2=pv('garmin_connected','wiz'),gs=pv('garmin_connected','sync');
    var oldW=t('wiz_start')-wo,oldG=t('garmin_connected')-wk2-gs,gAcc=U.filter(function(u){return u.garmin===1;}).length;
    var gw='<div class="adm-g" style="margin-top:0">'+tile(wo,'Ont ouvert l’assistant','appareils')+tile(wk2,'Connectés via l’assistant','appareils')+tile(t('wiz_error'),'Échecs de connexion','tentatives, une personne peut réessayer')+tile(wo?admPct(Math.min(wk2,wo),wo)+' %':'–','Assistant réussi',wo?wk2+' sur '+wo:'pas encore de données')+'</div>'+
      '<div class="eyebrow" style="margin:16px 0 8px">Autres repères</div>'+admRows([['Comptes avec Garmin connecté (aujourd’hui)',gAcc],['Garmin retrouvé sur un nouvel appareil, sans l’assistant',gs]],0)+
      (oldW||oldG?'<p class="small muted" style="margin:10px 0 0">Anciens compteurs, avant la correction du 5 novembre : '+oldW+' ouverture'+(oldW>1?'s':'')+' de l’assistant et '+oldG+' « Garmin connecté ». Ils comptaient chaque ouverture et chaque appareil qui retrouvait sa clé (changement de domaine, deuxième appareil, propriétaire compris) : ils ne se comparent pas entre eux.</p>':'')+
      '<p class="small muted" style="margin:10px 0 0">Le chiffre fiable des personnes est « Comptes avec Garmin connecté » : il vient des comptes, sans doublon, et se met à jour à la prochaine ouverture de l’app de chacun.</p>';
    h+=card('Choix et recherches',days+' jours',
      (pc.length?'<div class="eyebrow" style="margin:0 0 8px">Plans remplis (format · séances · niveau)</div>'+admRows(pc,0):'')+
      (rp.length?'<div class="eyebrow" style="margin:16px 0 8px">Courses choisies dans la liste</div>'+admRows(rp,0):'')+
      (sm.length?'<div class="eyebrow" style="margin:16px 0 8px">Recherches sans résultat</div>'+admRows(sm,0)+'<p class="small muted" style="margin:6px 0 0">À ajouter au catalogue.</p>':'')+
      '<div class="eyebrow" style="margin:16px 0 8px">Connexion Garmin</div>'+gw);
  }
  return h;
}
function vAdmin(){
  var h=topbar('Propriétaire','Suivi de l’app',false,'more');
  if(!acct())return h+emptyState('info','Connexion requise','Connecte-toi avec le compte propriétaire pour voir le suivi.','','');
  if(!adminBusy&&!adminErr&&(!adminD||Date.now()-adminT>3e5))setTimeout(adminLoad,0);
  if(adminErr&&!adminD)return h+emptyState('info','Suivi indisponible',esc(adminErr),'','<button class="btn" data-act="admreload">Réessayer</button>');
  if(!adminD)return h+'<section class="card"><div class="skel" aria-label="Chargement"><i></i><i></i></div></section>';
  var t=adminD.totals,c=function(v,l){return '<div class="adm-c"><b>'+v+'</b><span>'+l+'</span></div>';};
  h+='<div class="row" style="margin:0 0 12px"><span class="small muted">Ton compte est exclu des chiffres</span><span class="sp"></span><button class="chip" style="border:0;min-height:32px;padding:0 12px" data-act="admreload">'+(adminBusy?'Mise à jour…':'Actualiser')+'</button></div>';
  h+=admFoldHtml('adm-vue','Vue d’ensemble','',
    '<div class="adm-g" style="margin-top:0">'+c(t.users,'Comptes')+c(t.withPlan,'Avec un plan')+c(t.active7,'Actifs 7 jours')+c(t.active30,'Actifs 30 jours')+c(t.new7,'Nouveaux 7 jours')+c(t.new30,'Nouveaux 30 jours')+
    (t.installed!=null?c(t.installed,'App installée')+c(t.garmin,'Garmin connecté')+c(t.sent,'Séances envoyées vers la montre'):'')+'</div>'+
    (adminErr?'<p class="small muted" style="margin:12px 0 0">Dernière mise à jour impossible : '+esc(adminErr)+'</p>':''),true);
  h+='<div class="rng" role="group" aria-label="Période" style="margin:0 0 12px">'+[7,30,90].map(function(x){return '<button data-act="admdays" data-v="'+x+'" aria-pressed="'+(admDays===x)+'">'+x+' jours</button>';}).join('')+'</div>';
  h+=admAnalytics(adminD,adminEv,admDays);
  h+=admFoldHtml('adm-users','Utilisateurs',adminD.users.length+' compte'+(adminD.users.length>1?'s':''),adminD.users.map(admUser).join(''),true);
  return h;
}

