/* ---------- Données : agrégats, forme, graphiques ---------- */
var SPCOL={swim:'#3987e5',bike:'#199e70',run:'#d95926',str:'#98989f',oth:'#6c6c70'};
var SPLBL={swim:'Natation',bike:'Vélo',run:'Course à pied',str:'Renforcement',oth:'Autres'};
var ZONES=[['Récupération','#7fdc9b'],['Endurance','#30d158'],['Tempo','#ffd60a'],['Seuil','#ff9f0a'],['Maximal','#ff5e4e']];
var dsel=null;
function skey(a){return actSport(a)||'oth';}
function dataActs(){return ((state.sv&&state.sv.acts)||[]).filter(function(a){return a&&a.s&&plLocal(a.s);});}
function wIdx(a){return Math.floor(dayIdx(a)/7);}
function curWk(){return Math.floor(diffDays(today(),PLAN_START)/7);}
function wStart(w){return addDays(PLAN_START,w*7);}
function fmtSec(s){return fh(Math.round(s/60));}
function paceTxt(k,m,s){
  if(!m||!s)return '–';
  var v=m/s;
  if(k==='run')return mmss(1000/v)+' /km';
  if(k==='swim')return mmss(100/v)+' /100 m';
  if(k==='bike')return (v*3.6).toFixed(1).replace('.',',')+' km/h';
  return '–';
}
// unité d'affichage de la section Données : durée (par défaut) ou distance
function dMetric(){return state.ui.dmetric==='dist'?'dist':'time';}
function weekAgg(acts){
  var m={};
  acts.forEach(function(a){
    var w=wIdx(a),o=m[w];
    if(!o)o=m[w]={w:w,n:0,l:0,sec:0,msum:0,dm:{swim:0,bike:0,run:0,str:0,oth:0},swim:0,bike:0,run:0,str:0,oth:0};
    var k=skey(a);o[k]+=a.d;o.sec+=a.d;o.n++;o.l+=a.l||0;o.dm[k]+=a.m||0;o.msum+=a.m||0;
  });
  return m;
}
function niceScale(mx){
  var steps=[1,2,4,5,10,20,25,50,100,200],st=steps[steps.length-1],i;
  for(i=0;i<steps.length;i++)if(mx/steps[i]<=5){st=steps[i];break;}
  return {step:st,top:Math.max(st,Math.ceil(mx/st)*st)};
}
function dlt(cur,prev,fmt){var d=cur-prev;if(!cur&&!prev)return '';return (d>0?'+':d<0?'−':'±')+fmt(Math.abs(d))+' vs sem. préc.';}
function kpi(l,v,sub){return '<div class="kpi"><div class="kl">'+l+'</div><div class="kv">'+v+'</div>'+(sub?'<div class="ks">'+sub+'</div>':'')+'</div>';}
function dataCard(title,sub,inner){return '<section class="card"><h2>'+title+(sub?'<small>'+sub+'</small>':'')+'</h2>'+inner+'</section>';}

// Fitness (CTL) / fatigue (ATL) : valeurs calculées par intervals.icu après chaque activité, prolongées par la décroissance exponentielle les jours de repos
function fitSeries(acts){
  var by={},first=null;
  acts.forEach(function(a){
    if(!(a.cl>0||a.al>0))return;
    var d=dayIdx(a),p=by[d];
    if(!p||a.s>p.s)by[d]=a;
    if(first===null||d<first)first=d;
  });
  if(first===null)return null;
  var end=diffDays(today(),PLAN_START),ctl=0,atl=0,out=[],d;
  for(d=first;d<=end;d++){
    if(by[d]){ctl=by[d].cl;atl=by[d].al;}else{ctl*=Math.exp(-1/42);atl*=Math.exp(-1/7);}
    out.push([d,ctl,atl]);
  }
  return out.length>1?out:null;
}
function formLabel(t){return t>5?'Frais':t>=-10?'Équilibré':t>=-30?'En charge':'Surcharge';}
function fitChart(S){
  var W=340,H=150,L=30,B=20,T=8,R=8,n=S.length,mx=0,i;
  S.forEach(function(p){mx=Math.max(mx,p[1],p[2]);});
  var sc=niceScale(Math.max(mx,5)),x=function(i){return L+i*(W-L-R)/(n-1);},y=function(v){return T+(H-T-B)*(1-v/sc.top);},v;
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Évolution de la condition et de la fatigue, avec l’écart entre les deux coloré du vert au rouge" data-ch="fit">';
  for(v=0;v<=sc.top+1e-9;v+=sc.step)s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="'+(v?'#2c2c2e':'#48484a')+'"/><text x="'+(L-6)+'" y="'+(y(v)+3.5)+'" text-anchor="end" font-size="10" fill="#85847d">'+v+'</text>';
  // Écart entre les deux courbes, coloré selon la fraîcheur (mêmes seuils que formLabel)
  var gapC=function(i){var t=((S[i][1]-S[i][2])+(S[i+1][1]-S[i+1][2]))/2;return t>=-10?'#30d158':t>=-30?'#ff9f0a':'#ff5e4e';},g0=0;
  for(i=0;i<n-1;i++){
    if(i<n-2&&gapC(i+1)===gapC(g0))continue;
    var up='',dn='',k;
    for(k=g0;k<=i+1;k++){up+=(k>g0?'L':'M')+x(k).toFixed(1)+' '+y(S[k][1]).toFixed(1);dn='L'+x(k).toFixed(1)+' '+y(S[k][2]).toFixed(1)+dn;}
    s+='<path d="'+up+dn+'Z" fill="'+gapC(g0)+'" fill-opacity=".42"/>';
    g0=i+1;
  }
  [[1,'#a9a8a0'],[2,'#f5f4ef']].forEach(function(sr){
    var d='';S.forEach(function(p,i){d+=(i?'L':'M')+x(i).toFixed(1)+' '+y(p[sr[0]]).toFixed(1);});
    s+='<path d="'+d+'" fill="none" stroke="'+sr[1]+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  });
  var ly=S[n-1];
  s+='<circle cx="'+x(n-1)+'" cy="'+y(ly[1])+'" r="4" fill="#a9a8a0" stroke="#1c1c1e" stroke-width="2"/><circle cx="'+x(n-1)+'" cy="'+y(ly[2])+'" r="4" fill="#f5f4ef" stroke="#1c1c1e" stroke-width="2"/>';
  var lastM=-1,every=n>200?1:0;
  S.forEach(function(p,i){var dt=addDays(PLAN_START,p[0]),m=dt.getMonth();if(m!==lastM){if(lastM!==-1&&i>8)s+='<text x="'+x(i)+'" y="'+(H-5)+'" text-anchor="middle" font-size="10" fill="#85847d">'+MONTHS[m].replace('.','')+'</text>';lastM=m;}});
  var pts=S.map(function(p,i){
    var dt=addDays(PLAN_START,p[0]),tsb=p[1]-p[2];
    return {x:x(i),dots:[[y(p[1]),'#a9a8a0'],[y(p[2]),'#f5f4ef']],tip:'<b>'+DAYS[(dt.getDay()+6)%7]+' '+fmtDay(dt)+' '+dt.getFullYear()+'</b><br>Condition <b>'+Math.round(p[1])+'</b> · Fatigue <b>'+Math.round(p[2])+'</b><br>Fraîcheur <b>'+(tsb>0?'+':tsb<0?'−':'')+Math.abs(Math.round(tsb))+'</b> · '+formLabel(tsb)};
  });
  CH.fit={W:W,H:H,T:T,B:B,pts:pts};
  return s+hvLayer()+'</svg>';
}
function stackChart(wks,agg,sel){
  var W=340,H=170,L=30,B=20,T=8,R=4,n=wks.length,slot=(W-L-R)/n,bw=Math.min(24,Math.max(3,slot-2)),mx=0,v,dist=dMetric()==='dist',val=function(o,k){return dist?(o.dm[k]||0)/1000:o[k]/3600;};
  wks.forEach(function(w){var o=agg[w];if(o){var tt=0;['swim','bike','run','str','oth'].forEach(function(k){tt+=val(o,k);});mx=Math.max(mx,tt);}});
  var sc=niceScale(Math.max(mx,dist?5:1)),yv=function(q){return T+(H-T-B)*(1-q/sc.top);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Volume hebdomadaire par discipline, en '+(dist?'kilomètres':'heures')+'. Survole ou touche une barre pour le détail." data-act="dchart" data-ch="vol">',pts=[];
  for(v=0;v<=sc.top+1e-9;v+=sc.step)s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yv(v)+'" y2="'+yv(v)+'" stroke="'+(v?'#2c2c2e':'#48484a')+'"/><text x="'+(L-6)+'" y="'+(yv(v)+3.5)+'" text-anchor="end" font-size="10" fill="#85847d">'+v+'</text>';
  var lastM=-1,lblEvery=n>30?Math.ceil(n/10):1;
  wks.forEach(function(w,i){
    var o=agg[w],x=L+i*slot+(slot-bw)/2,m=wStart(w).getMonth();
    if(m!==lastM){if(lastM!==-1||i===0)s+='<text x="'+(L+i*slot)+'" y="'+(H-5)+'" font-size="10" fill="#85847d">'+MONTHS[m].replace('.','')+'</text>';lastM=m;}
    if(w===sel)s+='<rect x="'+(L+i*slot)+'" y="'+T+'" width="'+slot+'" height="'+(H-T-B)+'" rx="3" fill="rgba(255,255,255,.07)"/>';
    pts.push({x:L+i*slot+slot/2,tip:weekReadout(agg,w)});
    if(!o)return;
    var keys=['swim','bike','run','str','oth'].filter(function(k){return val(o,k)>0;}),acc=0;
    keys.forEach(function(k,j){
      var hrs=val(o,k),y1=yv(acc+hrs),y0=yv(acc),hh=Math.max(1.2,(y0-y1)-(acc>0?2:0));
      s+=j===keys.length-1?col(x,y1,bw,hh,SPCOL[k]):'<rect x="'+x+'" y="'+y1+'" width="'+bw+'" height="'+hh+'" fill="'+SPCOL[k]+'"/>';
      acc+=hrs;
    });
  });
  CH.vol={W:W,H:H,T:T,B:B,band:slot,pts:pts};
  return s+hvLayer()+'</svg>';
}
function weekReadout(agg,w){
  var o=agg[w],d=wStart(w);
  var t='<b>'+fmtDay(d)+' – '+fmtDay(addDays(d,6))+'</b>';
  if(!o||!o.n)return t+' · aucune activité';
  var dist=dMetric()==='dist',p=[];['swim','bike','run','str','oth'].forEach(function(k){if(dist?o.dm[k]>0:o[k]>0)p.push(SPLBL[k].split(' ')[0]+' '+(dist?km(o.dm[k])+' km':fmtSec(o[k])));});
  var main=dist?km(o.msum)+' km':fmtSec(o.sec),other=dist?fmtSec(o.sec):(o.msum>0?km(o.msum)+' km':'');
  return t+' · <b>'+main+'</b>'+(other?' · '+other:'')+' · '+o.n+' séance'+(o.n>1?'s':'')+'<br>'+p.join(' · ');
}
// intervals.icu découpe souvent en 7 zones : on affiche les 5 zones habituelles, en regroupant tout ce qui dépasse le seuil
function zonesHtml(zt,hz,compact){
  var z=[0,0,0,0,0],tot=0,i;
  (zt||[]).forEach(function(v,j){z[Math.min(j,4)]+=v||0;tot+=v||0;});
  if(!tot)return '';
  var bar='<div class="zbar" role="img" aria-label="Répartition du temps par zone de fréquence cardiaque">',rows='';
  for(i=0;i<5;i++){
    var v=z[i],pc=Math.round(v/tot*100),rng='';
    if(hz&&hz.length>=5)rng=i===0?'moins de '+(hz[0]+1)+' bpm':i===4?'plus de '+hz[3]+' bpm':(hz[i-1]+1)+'–'+hz[i]+' bpm';
    bar+='<span style="flex:'+v+';background:'+ZONES[i][1]+'" title="Z'+(i+1)+' · '+fmtSec(v)+' · '+pc+' %"></span>';
    if(!compact||v>0)rows+='<div class="zrow"><i style="background:'+ZONES[i][1]+'"></i><span>Z'+(i+1)+' '+ZONES[i][0]+(rng?'<small class="zn"> · '+rng+'</small>':'')+'</span><span>'+fmtSec(v)+' · '+pc+' %</span></div>';
  }
  return bar+'</div>'+rows;
}
// Part de chaque discipline prévue par le plan sur des semaines (une séance enchaînée compte en course, comme dans stats())
function planShare(w0,w1){
  var o={swim:0,bike:0,run:0,tot:0},w;
  for(w=Math.max(0,w0);w<=Math.min(NW-1,w1);w++)PLAN[w].days.forEach(function(day){day.sessions.forEach(function(x){
    var k=x.sp==='brick'?'run':x.sp;if(o[k]!==undefined){o[k]+=x.min;o.tot+=x.min;}
  });});
  return o;
}
// Le point du coach : forme, régularité, intensité et équilibre sur les 4 dernières semaines terminées, puis une seule action à faire
function coachCard(all,aggAll,cw,fs){
  var st=status(),a=cw-4,b=cw-1,sig=[],pl=0,done=0,w,lab=null,tsb=0,add=function(c,t,v){sig.push('<div class="csig"><i class="sg-'+c+'"></i><span>'+t+'</span><b>'+v+'</b></div>');};
  if(fs&&fs.length){var last=fs[fs.length-1];tsb=last[1]-last[2];lab=formLabel(tsb);}
  for(w=Math.max(0,a);w<=Math.min(NW-1,b);w++){pl+=PLAN[w].min;done+=((aggAll[w]||{}).sec||0)/60;}
  var rp=pl>0?Math.round(done/pl*100):null;
  if(rp!==null)add(rp>=85?'ok':rp>=70?'warn':'bad','Régularité',rp+' % du plan réalisé');
  var zt=[0,0,0,0,0],zs=0,sec={swim:0,bike:0,run:0},secT=0;
  all.forEach(function(x){var i=wIdx(x);if(i<a||i>b)return;var k=skey(x);if(sec[k]!==undefined){sec[k]+=x.d;secT+=x.d;}(x.zt||[]).forEach(function(v,j){zt[Math.min(j,4)]+=v||0;zs+=v||0;});});
  var easy=zs?pct(zt[0]+zt[1],zs):null;
  if(easy!==null)add(easy>=70?'ok':easy>=55?'warn':'bad','Intensité',easy+' % en facile (repère : 80 %)');
  var ps=planShare(a,b),gapK=null,gap=0;
  if(ps.tot&&secT)['swim','bike','run'].forEach(function(k){var g=Math.round(sec[k]/secT*100)-Math.round(ps[k]/ps.tot*100);if(g<gap){gap=g;gapK=k;}});
  if(gapK&&gap<=-10)add('warn','Équilibre',SPLBL[gapK]+' : '+Math.abs(gap)+' points sous le plan');else if(ps.tot&&secT)add('ok','Équilibre','proche du plan');
  if(!lab&&!sig.length)return '';
  var kind=(st.s==='during'||st.s==='raceday')?PLAN[st.w-1].kind:'',todo;
  if(st.s==='after')todo='Ta course est passée : récupère, puis choisis ton prochain objectif.';
  else if(lab==='Surcharge')todo='Allège les 2 ou 3 prochains jours : remplace la prochaine séance intense par du facile ou du repos.';
  else if(kind==='taper'||kind==='race')todo='Tu es en affûtage : moins de volume, le même rythme sur les efforts courts. Ne rattrape rien, garde ta fraîcheur.';
  else if(rp!==null&&rp<70)todo='Priorité à la régularité : fais les séances clés de la semaine, sans chercher à rattraper le reste.';
  else if(easy!==null&&easy<70)todo='Ralentis sur tes séances faciles : reste en zone 1 ou 2, tu dois pouvoir parler sans effort.';
  else if(gapK&&gap<=-10)todo='Redonne de la place à ta discipline en retrait ('+SPLBL[gapK].toLowerCase()+') : ne saute pas ses prochaines séances.';
  else if(kind==='rec')todo='Semaine de décharge : garde tes séances faciles et dors plus. C’est là que tu absorbes le travail.';
  else if(lab==='En charge')todo='Tu accumules de la fatigue, c’est normal : suis le plan et soigne ton sommeil.';
  else if(st.s==='before')todo='Ton plan commence le '+fmtDay(PLAN_START)+' : d’ici là, garde une routine facile et régulière.';
  else todo='Tout est en place : suis ton plan cette semaine.';
  var F=lab&&FORMES[lab];
  return '<section class="card coach"><div class="row"><h2 style="margin:0">Le point du coach</h2><span class="sp"></span>'+(F?'<span class="fpill" style="--fc:'+F.c+';--fb:'+F.c+'26"><i></i>'+lab+'</span>':'')+'</div>'+
    '<p class="coach-t"><b>Cette semaine :</b> '+todo+'</p>'+(sig.length?'<div class="eyebrow" style="margin:0 0 4px">Tes 4 dernières semaines</div>'+sig.join(''):'')+'</section>';
}
function sportStats(k,acts){
  var s={n:0,sec:0,m:0,up:0,hrS:0,hrT:0,lng:null,best:null},minM={swim:1000,bike:30000,run:5000}[k];
  acts.forEach(function(a){
    if(skey(a)!==k)return;
    s.n++;s.sec+=a.d;s.m+=a.m;s.up+=a.z||0;
    if(a.h){s.hrS+=a.h*a.d;s.hrT+=a.d;}
    if(!s.lng||a.d>s.lng.d)s.lng=a;
    if(minM&&a.m>=minM&&a.d>0){var sp=a.m/a.d;if(!s.best||sp>s.best.sp)s.best={a:a,sp:sp};}
  });
  return s;
}
function sportCard(k,s,totSec){
  var m='';
  var add=function(l,v){m+='<div>'+l+'<b>'+v+'</b></div>';};
  add('Séances',s.n);add('Temps',fmtSec(s.sec));
  if(s.m>0)add('Distance',km(s.m)+' km');
  if(k==='swim'||k==='bike'||k==='run')add(k==='bike'?'Vitesse moy.':'Allure moy.',paceTxt(k,s.m,s.sec));
  if(s.hrT)add('FC moy.',Math.round(s.hrS/s.hrT)+' bpm');
  if(k==='bike'||k==='run')add('Dénivelé',Math.round(s.up).toLocaleString('fr-FR')+' m');
  if(s.lng)add('Plus longue',fh(Math.round(s.lng.d/60))+(s.lng.m>0?' · '+km(s.lng.m)+' km':''));
  if(s.best)add('Meilleure '+(k==='bike'?'vitesse':'allure')+' (≥ '+{swim:'1',bike:'30',run:'5'}[k]+' km)',paceTxt(k,s.best.a.m,s.best.a.d));
  return '<section class="card sp-'+k+'"><div class="row" style="margin-bottom:2px"><span class="s-ic" style="width:36px;height:36px;border-radius:10px">'+ic(k,20)+'</span><h2 style="margin:0">'+SPLBL[k]+'</h2><span class="sp"></span><span class="chip">'+pct(s.sec,totSec)+' % du temps</span></div>'+bar(pct(s.sec,totSec),SPCOL[k])+'<div class="mt">'+m+'</div></section>';
}
function idxOfDate(d){return Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-PLAN_START)/DAY);}
function parseYmd(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function dRange(acts){
  var f=state.ui.dflt||{m:'26w'},t=today(),cw=curWk(),to=t,from,n={'4w':4,'12w':12,'26w':26}[f.m];
  if(n)from=wStart(cw-n+1);
  else if(f.m==='ytd')from=new Date(t.getFullYear(),0,1);
  else if(f.m==='custom'){from=parseYmd(f.from)||addDays(t,-90);to=parseYmd(f.to)||t;if(to<from){var x=from;from=to;to=x;}}
  else{var mn=null;acts.forEach(function(a){var d=plLocal(a.s);if(d&&(!mn||d<mn))mn=d;});from=mn?new Date(mn.getFullYear(),mn.getMonth(),mn.getDate()):addDays(t,-90);}
  return {from:from,to:to,fi:idxOfDate(from),ti:idxOfDate(to)};
}
function dFilterBar(R,n){
  var f=state.ui.dflt||{m:'26w'},chips=[['4w','4 semaines'],['12w','3 mois'],['26w','6 mois'],['all','Tout'],['custom','Dates…']];
  var h='<div class="rng" style="flex-wrap:wrap" role="group" aria-label="Période">'+chips.map(function(c){return '<button data-act="dflt" data-v="'+c[0]+'" aria-pressed="'+(f.m===c[0])+'">'+c[1]+'</button>';}).join('')+'</div>';
  if(f.m==='custom'){var cm=dcalM||{y:R.to.getFullYear(),m:R.to.getMonth()};h+='<div style="margin-top:10px">'+calHtml('data',isoDate(R.from),isoDate(R.to),new Date(2025,0,1),today(),cm.y,cm.m)+(dcalPend?'<div class="cal-hint" style="margin:8px 0 0">Touche le dernier jour de la période</div>':'')+'</div>';}
  return h+'<div class="small muted" style="margin:8px 0 16px">Du '+fmtDay(R.from)+' '+R.from.getFullYear()+' au '+fmtDay(R.to)+' '+R.to.getFullYear()+' · '+n+' activité'+(n>1?'s':'')+'</div>';
}
var mfOpen={};
document.addEventListener('toggle',function(e){var d=e.target;if(d&&d.getAttribute&&d.getAttribute('data-mf'))mfOpen[d.getAttribute('data-mf')]=d.open;},true);
function mfold(id,title,inner){return '<details class="mf" data-mf="'+id+'"'+(mfOpen[id]?' open':'')+'><summary>'+title+'</summary><div>'+inner+'</div></details>';}
var FORMES={'Frais':{c:'#30d158',t:'Tu es bien reposé : c’est le bon moment pour une séance exigeante.'},'Équilibré':{c:'#6aa8f0',t:'Ta charge d’entraînement et ta récupération sont bien équilibrées.'},'En charge':{c:'#ffd60a',t:'Tu accumules de la fatigue : normal en pleine préparation. Soigne ton sommeil et ton alimentation.'},'Surcharge':{c:'#ff6b5e',t:'Fatigue élevée : allège les prochains jours pour éviter la blessure.'}};
// Progression dans le plan (sans Garmin) : séances cochées et temps réalisé jusqu'à aujourd'hui
function planProgressCard(){
  var st=status();   // avant le début du plan : affichée seulement si des séances sont déjà cochées
  var n=0,d=0,min=0,dmin=0,w,lim=st.s==='before'?0:st.w;
  // séances prévues jusqu'à cette semaine, plus celles cochées en avance (semaines suivantes)
  for(w=0;w<NW;w++)PLAN[w].days.forEach(function(day){day.sessions.forEach(function(s){
    if(s.sp==='rest')return;var ok=isDone(s);if(w>=lim&&!ok)return;
    n++;min+=s.min;if(ok){d++;dmin+=doneMin(s);}
  });});
  if(!n)return '';
  var p=pct(d,n);
  return '<section class="card dsum"><div class="eyebrow">Ta progression dans le plan</div><div class="dbig">'+d+'<small>séance'+(d>1?'s':'')+' sur '+n+' prévues jusqu’ici</small></div>'+bar(p)+
    '<div class="kpis"><div class="kpi"><div class="kl">Réalisé</div><div class="kv">'+p+' %</div></div><div class="kpi"><div class="kl">Temps</div><div class="kv" style="font-size:19px">'+fh(dmin)+'</div><div class="ks">sur '+fh(min)+'</div></div><div class="kpi"><div class="kl">Semaine</div><div class="kv">'+Math.min(NW,st.w)+'</div><div class="ks">sur '+NW+'</div></div></div>'+
    '<div class="dnote">'+(p>=85?'<b>Très régulier.</b> Continue comme ça.':p>=60?'<b>Bon rythme.</b> Quelques séances manquées, ce n’est pas grave : la régularité sur la durée compte plus.':'<b>Tu as pris du retard.</b> Reprends sans chercher à tout rattraper : choisis les séances clés de la semaine.')+'</div></section>';
}
/* Sans Garmin (ou avant la première activité) : avancement par sport, calculé sur les séances cochées (durées prévues) */
function sportProgressCard(){
  var st=status();
  var K=[['swim','Natation'],['bike','Vélo'],['run','Course à pied'],['str','Renforcement']],a={},w,lim=st.s==='before'?0:st.w;
  K.forEach(function(k){a[k[0]]={n:0,d:0,min:0,dmin:0};});
  for(w=0;w<NW;w++)PLAN[w].days.forEach(function(day){day.sessions.forEach(function(s){
    var k=s.sp==='brick'?'run':s.sp;if(!a[k]||(w>=lim&&!isDone(s)))return;   // + séances cochées en avance
    a[k].n++;a[k].min+=s.min;if(isDone(s)){a[k].d++;a[k].dmin+=doneMin(s);}
  });});
  var rows=K.filter(function(k){return a[k[0]].n;}).map(function(k){var x=a[k[0]];return prRow(k[1],x.d+' / '+x.n+' · '+fh(x.dmin),pct(x.d,x.n),'var(--'+k[0]+')');}).join('');
  return rows?'<section class="card"><h2>Par sport<small>séances cochées jusqu’ici</small></h2>'+rows+'</section>':'';
}
// Accueil sans Garmin : rappel discret (coche à la main), Garmin proposé sans insister ; « Masquer » le retire
function garminTip(){
  if(state.ui.hideGTip)return '';
  return '<section class="card gtip"><div class="row" style="align-items:flex-start;gap:12px"><span class="gi">'+ic('check',18)+'</span><div style="flex:1;min-width:0"><b>Séance faite ? Touche son rond</b>'+
    '<p class="small muted" style="margin:3px 0 0;line-height:1.45">Ta progression se met à jour. Avec une montre Garmin, c’est automatique.</p>'+
    '<div class="row" style="gap:16px;margin-top:8px"><button class="lnk" data-act="garminwiz" style="margin:0">Connecter Garmin</button><button class="lnk" data-act="hidegtip" style="margin:0;color:var(--t3)">Masquer</button></div></div></div></section>';
}
function vData(){
  var all=dataActs(),sv=state.sv,linked=!!(sv.url&&sv.key);
  if(!linked||!all.length)return planProgressCard()+sportProgressCard()+vActs();
  var cw=curWk(),aggAll=weekAgg(all),tw=aggAll[cw]||{n:0,l:0,sec:0,msum:0},pw=aggAll[cw-1]||{n:0,l:0,sec:0,msum:0},h='',d0=wStart(cw),dist=dMetric()==='dist',st0=status();
  // 1. Le point du coach : comment je vais, que faire
  var fsAll=fitSeries(all);
  h+=coachCard(all,aggAll,cw,fsAll);
  // 2. Cette semaine, en clair
  var planned=(st0.s==='during'||st0.s==='raceday')?PLAN[st0.w-1].min:0;
  h+='<section class="card dsum"><div class="eyebrow">Cette semaine · '+fmtDay(d0)+' – '+fmtDay(addDays(d0,6))+'</div><div class="dbig">'+fmtSec(tw.sec)+(planned?'<small>sur '+fh(planned)+' prévues</small>':'')+'</div>'+(planned?bar(pct(tw.sec/60,planned)):'')+
    '<div class="kpis" style="grid-template-columns:1fr 1fr">'+kpi('Séances',tw.n,planned?'sur '+PLAN[st0.w-1].count+' prévues':dlt(tw.n,pw.n,String))+kpi('Distance',km(tw.msum)+' km',planned?'':dlt(tw.msum/1000,pw.msum/1000,function(q){return q.toFixed(1).replace('.',',')+' km';}))+'</div></section>';
  // 3. Sur la période
  var R=dRange(all),acts=all.filter(function(a){var d=dayIdx(a);return d>=R.fi&&d<=R.ti;}),agg=weekAgg(acts);
  h+='<h2 class="plan-h" style="margin-top:22px">Sur la durée</h2>'+dFilterBar(R,acts.length);
  if(!acts.length)return h+'<section class="card"><p class="muted" style="margin:0">Aucune activité sur cette période.</p></section>'+vActs(acts);
  var tSec=0,tM=0,fi0=R.ti;
  acts.forEach(function(a){tSec+=a.d;tM+=(skey(a)==='str'?0:a.m||0);fi0=Math.min(fi0,dayIdx(a));});
  var wkCount=Math.max(1,Math.ceil((R.ti-fi0+1)/7));
  h+='<div class="kpis"><div class="kpi"><div class="kl">Par semaine</div><div class="kv" style="font-size:19px">'+fmtSec(tSec/wkCount)+'</div><div class="ks">'+fmtSec(tSec)+' au total</div></div><div class="kpi"><div class="kl">Séances / sem.</div><div class="kv" style="font-size:19px">'+(Math.round(acts.length/wkCount*10)/10).toString().replace('.',',')+'</div><div class="ks">'+acts.length+' au total</div></div><div class="kpi"><div class="kl">Distance</div><div class="kv" style="font-size:19px">'+Math.round(tM/1000).toLocaleString('fr-FR')+' km</div><div class="ks">nage, vélo, course</div></div></div>';
  // Respect du plan (semaines terminées de la période)
  var pl=0,done=0,wk;
  for(wk=Math.max(0,Math.floor(R.fi/7));wk<Math.min(NW,cw);wk++){if(wk*7>R.ti)break;pl+=PLAN[wk].min;done+=((aggAll[wk]||{}).sec||0)/60;}
  if(pl>0){
    var rp=Math.round(done/pl*100);
    h+='<section class="card"><div class="dtitle"><h2>Respect du plan</h2><span class="chip'+(rp>=85?' hl':'')+'">'+rp+' %</span></div>'+bar(Math.min(100,rp))+
      '<div class="row small muted" style="margin-top:8px"><span>'+fh(Math.round(done))+' réalisées</span><span class="sp"></span><span>'+fh(Math.round(pl))+' prévues</span></div></section>';
  }
  // Intensité : facile / soutenu / intense, puis les 5 zones
  var zt=[0,0,0,0,0];
  acts.forEach(function(a){if(a.zt)a.zt.forEach(function(v,i){zt[Math.min(i,4)]+=v||0;});});
  var zs=zt.reduce(function(x,y){return x+y;},0);
  if(zs>0){
    var easy=pct(zt[0]+zt[1],zs),hard=pct(zt[3]+zt[4],zs),mid=Math.max(0,100-easy-hard);
    var verdict=easy>=70?'<b>Bonne base.</b> La plupart de ton temps est facile : c’est ce qui construit l’endurance sans t’épuiser.':easy>=55?'<b>Un peu trop d’intensité.</b> Garde plus de séances vraiment faciles : tu progresseras avec moins de fatigue.':'<b>Beaucoup d’intensité.</b> Ralentis sur les séances faciles : tu dois pouvoir parler sans effort.';
    var band=function(c,t,s,v){return '<div class="band"><i style="background:'+c+'"></i><span>'+t+'<small>'+s+'</small></span><b>'+v+' %</b></div>';};
    h+='<section class="card"><div class="dtitle"><h2>Intensité</h2></div><p class="dsub">Repère : environ 80 % de ton temps en facile, d’après ta fréquence cardiaque.</p>'+
      '<div class="zbar" role="img" aria-label="Répartition facile, soutenu, intense"><span style="flex:'+Math.max(easy,0.5)+';background:#30d158"></span><span style="flex:'+Math.max(mid,0.5)+';background:#ffd60a"></span><span style="flex:'+Math.max(hard,0.5)+';background:#ff5e4e"></span></div>'+
      band('#30d158','Facile · zones 1 et 2','tu peux parler sans effort',easy)+band('#ffd60a','Soutenu · zone 3','respiration plus marquée',mid)+band('#ff5e4e','Intense · zones 4 et 5','effort dur, phrases courtes',hard)+
      '<div class="dnote">'+verdict+'</div>'+mfold('zones','Voir mes 5 zones',zonesHtml(zt,sv.hrz,false))+'</section>';
  }
  // Volume semaine par semaine
  var w0=Math.floor(R.fi/7),w1=Math.floor(R.ti/7),wks=[],w;
  for(w=w0;w<=w1;w++)wks.push(w);
  if(wks.length<2)wks=[w1-1,w1];
  var sel=dsel!==null&&wks.indexOf(dsel)>=0?dsel:w1,prev3=0,lastF=(aggAll[cw-1]||{}).sec||0;
  [2,3,4].forEach(function(n){prev3+=((aggAll[cw-n]||{}).sec||0)/3;});
  var trend=prev3>0&&lastF>0?Math.round((lastF/prev3-1)*100):null;
  h+='<section class="card"><div class="dtitle"><h2>Ton volume</h2></div><p class="dsub">Touche une barre pour le détail de la semaine.</p>'+
    '<div class="rng" style="margin:0 0 12px" role="group" aria-label="Unité d’affichage"><button data-act="dmetric" data-v="time" aria-pressed="'+!dist+'">Temps</button><button data-act="dmetric" data-v="dist" aria-pressed="'+dist+'">Distance</button></div>'+
    '<div class="chartwrap" data-wks="'+wks.join(',')+'">'+stackChart(wks,agg,sel)+'</div>'+
    '<div class="legend" style="flex-wrap:wrap">'+['swim','bike','run','str'].filter(function(k){return !(dist&&k==='str');}).map(function(k){return '<span><i style="background:'+SPCOL[k]+'"></i>'+SPLBL[k].split(' ')[0]+'</span>';}).join('')+'</div>'+
    '<div class="readout" id="dro">'+weekReadout(agg,sel)+'</div>'+
    (trend!==null?'<div class="dnote">'+(trend>30?'<b>Hausse marquée.</b> La semaine dernière dépasse de '+trend+' % la moyenne des 3 précédentes : surveille tes sensations et tes douleurs.':trend<-30?'<b>Semaine plus légère.</b> '+Math.abs(trend)+' % sous la moyenne des 3 précédentes. Si elle n’était pas prévue, reprends progressivement.':'<b>Progression régulière.</b> La semaine dernière reste proche de la moyenne des 3 précédentes.')+'</div>':'')+'</section>';
  // Répartition par sport, comparée au plan
  var sp={swim:{sec:0,m:0},bike:{sec:0,m:0},run:{sec:0,m:0},str:{sec:0,m:0}};
  acts.forEach(function(a){var k=skey(a);if(sp[k]){sp[k].sec+=a.d;sp[k].m+=a.m||0;}});
  var spTot=sp.swim.sec+sp.bike.sec+sp.run.sec+sp.str.sec,tri=sp.swim.sec+sp.bike.sec+sp.run.sec,share=planShare(Math.floor(R.fi/7),Math.min(cw-1,Math.floor(R.ti/7)));
  if(spTot>0){
    var rows='',bars='<div class="zbar" role="img" aria-label="Répartition du temps par sport">';
    ['swim','bike','run','str'].forEach(function(k){
      if(!sp[k].sec)return;
      bars+='<span style="flex:'+sp[k].sec+';background:'+SPCOL[k]+'" title="'+SPLBL[k]+'"></span>';
      var plan=share.tot&&share[k]!==undefined&&tri?' · prévu '+pct(share[k],share.tot)+' %':'';
      rows+='<div class="spr sp-'+k+'"><div class="ico">'+ic(k,20)+'</div><div class="bd"><div class="pr-h" style="margin:0"><b>'+SPLBL[k]+'</b><span>'+(share[k]!==undefined&&tri?pct(sp[k].sec,tri):pct(sp[k].sec,spTot))+' %'+plan+'</span></div><div class="small muted">'+fmtSec(sp[k].sec)+(sp[k].m>0&&k!=='str'?' · '+km(sp[k].m)+' km':'')+'</div></div></div>';
    });
    var detail='';
    ['swim','bike','run','str'].forEach(function(k){var s=sportStats(k,acts);if(s.n)detail+=sportCard(k,s,spTot);});
    h+='<section class="card"><div class="dtitle"><h2>Par discipline</h2></div><p class="dsub">Part de chaque discipline comparée à ton plan.</p>'+bars+'</div><div style="height:10px"></div>'+rows+mfold('sports','Voir le détail par discipline',detail)+'</section>';
  }
  // Évolution de la forme
  var view=fsAll?fsAll.filter(function(p){return p[0]>=R.fi&&p[0]<=R.ti;}):[];
  if(view.length>=2){
    var last=view[view.length-1],tsb=last[1]-last[2];
    h+='<section class="card"><div class="dtitle"><h2>Ta forme dans le temps</h2></div><p class="dsub">L’écart entre les deux courbes indique ta fraîcheur : du rouge, il faut récupérer.</p>'+
      '<div class="kpis" style="margin-bottom:10px">'+kpi('Condition',Math.round(last[1]),'ta base (6 sem.)')+kpi('Fatigue',Math.round(last[2]),'7 derniers jours')+kpi('Fraîcheur',(tsb>0?'+':tsb<0?'−':'')+Math.abs(Math.round(tsb)),'condition − fatigue')+'</div>'+
      '<div class="chartwrap">'+fitChart(view)+'</div><div class="legend"><span><i style="background:#f5f4ef"></i>Fatigue</span><span><i style="background:#a9a8a0"></i>Condition</span></div><div class="legend" style="flex-wrap:wrap;margin-top:4px"><span><i style="background:#30d158;opacity:.6"></i>Tout va bien</span><span><i style="background:#ff9f0a;opacity:.6"></i>En charge</span><span><i style="background:#ff5e4e;opacity:.6"></i>Surcharge</span></div></section>';
  }
  return h+vActs(acts);
}

/* ---------- Fiche détaillée d'une activité ---------- */
var detCache={},detCur=null;
function findAct(aid){var r=null;((state.sv&&state.sv.acts)||[]).forEach(function(x){if(String(x.id)===String(aid))r=x;});return r;}
function actKpi(l,v){return '<div class="kpi"><div class="kl">'+l+'</div><div class="kv" style="font-size:17px">'+v+'</div></div>';}
function tmTxt(sec){sec=Math.round(sec);return sec>=3600?Math.floor(sec/3600)+':'+('0'+Math.floor(sec%3600/60)).slice(-2)+':'+('0'+sec%60).slice(-2):Math.floor(sec/60)+':'+('0'+sec%60).slice(-2);}
function okv(v){return v!=null&&isFinite(v);}
// valeurs manquantes (pauses de la montre, capteur coupé) : interpolation linéaire, valeur tenue aux extrémités
function fillGaps(vals){
  var n=vals.length,out=vals.slice(),first=-1,prev,i,j;
  for(i=0;i<n;i++)if(okv(vals[i])){first=i;break;}
  if(first<0)return null;
  for(i=0;i<first;i++)out[i]=vals[first];
  prev=first;
  for(i=first+1;i<n;i++)if(okv(vals[i])){for(j=prev+1;j<i;j++)out[j]=vals[prev]+(vals[i]-vals[prev])*(j-prev)/(i-prev);prev=i;}
  for(i=prev+1;i<n;i++)out[i]=vals[prev];
  return out;
}
// tranches à l'arrêt (feux, pauses, repos en piscine) : pas de mesure, ou vitesse très inférieure à la vitesse habituelle
// lissage léger (moyenne pondérée 1-2-1 sur les voisins mesurés) : les points sont déjà des moyennes de quelques secondes
function smooth3(vals){return vals.map(function(v,i){if(!okv(v))return v;var a=vals[i-1],b=vals[i+1],s=2*v,w=2;if(okv(a)){s+=a;w++;}if(okv(b)){s+=b;w++;}return s/w;});}
function pauseMask(k,sv){
  var thr=k==='swim'?0.3:0.8,act=sv.filter(function(v){return okv(v)&&v>thr;}),none={m:[],g:[]};
  if(act.length<5)return none;
  var med=medianOf(act),cut=Math.max(thr,med*0.45),m=sv.map(function(v){return !okv(v)||v<=cut;});
  // tranches de transition (arrêt partiel, rattrapage GPS à la reprise) : collées à un arrêt et loin de la vitesse habituelle -> interpolées, pas dessinées à 0
  var g=m.map(function(p,i){return !p&&!!(m[i-1]||m[i+1])&&(sv[i]<med*0.8||sv[i]>med*1.3);});
  return m.filter(Boolean).length+g.filter(Boolean).length>m.length*0.6?none:{m:m,g:g};
}
function lineSvg(vals,step,o){
  var W=340,H=o.h||120,L=40,B=18,T=8,R=6,pts=[],mask=o.mask||[];
  vals.forEach(function(v){if(okv(v))pts.push(v);});
  if(pts.length<3)return '';
  var full=fillGaps(vals);
  var srt=pts.slice().sort(function(a,b){return a-b;}),lo=srt[Math.floor(srt.length*0.03)],hi=srt[Math.min(srt.length-1,Math.floor(srt.length*0.97))];
  if(hi-lo<1e-6){lo-=1;hi+=1;}
  var pad=(hi-lo)*0.1;lo-=pad;hi+=pad;
  if(o.base0)lo=0;
  var n=vals.length,cw=(W-L-R)/(n-1),x=function(i){return L+i*cw;},y=function(v){var f=Math.max(0,Math.min(1,(v-lo)/(hi-lo)));return T+(H-T-B)*(o.inv?f:1-f);};
  var gid='gr-'+o.id,lbl=o.pauseLbl||'Pause';
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.label)+'" data-ch="'+o.id+'"><defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+o.color+'" stop-opacity=".30"/><stop offset="1" stop-color="'+o.color+'" stop-opacity="0"/></linearGradient></defs>';
  [0,0.5,1].forEach(function(f){
    var v=lo+(hi-lo)*(o.inv?f:1-f),yy=T+(H-T-B)*f;
    s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="#2c2c2e"/><text x="'+(L-5)+'" y="'+(yy+3.5)+'" text-anchor="end" font-size="10" fill="#85847d">'+o.fmt(v)+'</text>';
  });
  var i=0,j;
  while(i<n){
    if(mask[i]){j=i;while(j+1<n&&mask[j+1])j++;var x0=Math.max(L,x(i)-cw/2),x1=Math.min(W-R,x(j)+cw/2);s+='<rect x="'+x0.toFixed(1)+'" y="'+T+'" width="'+(x1-x0).toFixed(1)+'" height="'+(H-T-B)+'" rx="3" fill="rgba(255,255,255,.075)"/>';i=j+1;}
    else i++;
  }
  var d='',hp=[];
  full.forEach(function(v,q){
    var stop=o.drop&&mask[q],yy=stop?H-B:y(v);
    d+=(q?'L':'M')+x(q).toFixed(1)+' '+yy.toFixed(1);
    var ok=okv(vals[q]),t='<span class="tm">'+tmTxt(q*step)+'</span><br>';
    if(stop)hp.push({x:x(q),dots:[[yy,o.color]],tip:t+'<b>'+(o.zeroTip||lbl)+'</b>'+(o.zeroTip?'<br><span class="tm">'+lbl+'</span>':'')+(o.tipx?o.tipx(q):'')});
    else hp.push({x:x(q),dots:ok?[[y(vals[q]),o.color]]:[],tip:t+(ok?'<b>'+o.tip(vals[q])+'</b>'+(o.tipx?o.tipx(q):'')+(mask[q]?'<br><span class="tm">'+lbl+'</span>':''):'<b>'+(mask[q]?lbl:'Pas de mesure')+'</b>'+(o.tipx?o.tipx(q):''))});
  });
  s+='<path d="'+d+'L'+x(n-1).toFixed(1)+' '+(H-B)+'L'+x(0).toFixed(1)+' '+(H-B)+'Z" fill="url(#'+gid+')"/>';
  s+='<path d="'+d+'" fill="none" stroke="'+o.color+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  var dur=(n-1)*step/60,tm=[1,2,5,10,15,20,30,60,120].filter(function(m){return dur/m<=5;})[0]||120,t;
  for(t=0;t<=dur+1e-9;t+=tm)s+='<text x="'+(L+(t*60/step)*(W-L-R)/(n-1))+'" y="'+(H-4)+'" text-anchor="middle" font-size="10" fill="#85847d">'+(t>=60&&tm>=60?Math.round(t/60)+' h':Math.round(t)+(t===0?' min':''))+'</text>';
  CH[o.id]={W:W,H:H,T:T,B:B,pts:hp};
  return s+hvLayer()+'</svg>';
}
function chartCard(title,sub,svg,stat,note){return svg?'<div class="card ad-ch"><div class="dh"><span>'+title+'</span>'+(sub?'<small>'+sub+'</small>':'')+(stat?'<span class="dstat">'+stat+'</span>':'')+'</div><div class="chartwrap">'+svg+'</div>'+(note||'')+'</div>':'';}
function splitsHtml(k,sp){
  var L=sp.l;if(!L||!L.length)return '';
  var maxV=0,fastV=0;L.forEach(function(x){x.v=x.d/Math.max(1,x.t);maxV=Math.max(maxV,x.v);if(Math.abs(x.d-sp.u)<2)fastV=Math.max(fastV,x.v);});
  var h='<div class="spl" style="color:var(--t2);font-size:10.5px;text-transform:uppercase;letter-spacing:.05em"><span>'+(k==='run'?'km':'tronçon')+'</span><span></span><span>'+(k==='run'?'allure':'vitesse')+'</span><span>FC</span></div>';
  L.forEach(function(x,i){
    var full=Math.abs(x.d-sp.u)<2,lab=full?(k==='run'?String(i+1):String((i+1)*sp.u/1000)):(x.d/1000).toFixed(1).replace('.',',')+' km';
    h+='<div class="spl"><span>'+lab+(full&&k==='ride'?' km':'')+'</span><span><span class="b'+(full&&x.v===fastV&&L.length>2?' fast':'')+'" style="display:block;width:'+Math.round(35+65*x.v/maxV)+'%;--c:'+SPCOL[k==='ride'?'bike':'run']+'"></span></span><span'+(full&&x.v===fastV&&L.length>2?' class="pf"':'')+'>'+(k==='run'?mmss(x.t*1000/x.d)+' /km':(x.v*3.6).toFixed(1).replace('.',',')+' km/h')+'</span><span>'+(x.h||'–')+'</span></div>';
  });
  return h;
}
function ivHtml(iv){
  var work=iv.filter(function(x){return x.k==='W';});
  if(!work.length)return '';
  var n=0,h='<div class="ivr h"><span>#</span><span>Distance</span><span>Temps</span><span>Allure</span><span>FC</span></div>';
  iv.forEach(function(x){
    if(x.k==='R'){if(x.t>=5)h+='<div class="ivr rest" style="grid-template-columns:1fr"><span>Repos '+(x.t<120?x.t+' s':mmss(x.t))+'</span></div>';return;}
    n++;
    h+='<div class="ivr"><span>'+n+'</span><span>'+x.d+' m</span><span>'+mmss(x.t)+'</span><span>'+(x.d>0?mmss(x.t/x.d*100):'–')+'</span><span>'+(x.h||'–')+'</span></div>';
  });
  return h;
}
function detMore(a,j){
  var k=skey(a),s=j.s,h='',noted=false,thr=k==='swim'?0.3:0.8,lbl=k==='swim'?'Repos':'Pause';
  var paceAt=function(i){var v=s&&s.v&&s.v[i];if(!(v>0.3))return '';return '<br>'+(k==='run'?(v>0.8?mmss(1000/v)+' /km':''):k==='bike'?(v*3.6).toFixed(1).replace('.',',')+' km/h':k==='swim'?mmss(100/v)+' /100 m':'');};
  var hrAt=function(i){var v=s&&s.h&&s.h[i];return v?'<br>'+Math.round(v)+' bpm':'';};
  var pm=s&&s.v?pauseMask(k,s.v):{m:[],g:[]},mask=pm.m;
  var note=function(){if(noted||!mask.some(Boolean))return '';noted=true;return '<div class="pl"><i></i>'+(k==='swim'?'Repos entre les séries · allure à l’arrêt':k==='bike'?'Pauses et arrêts · vitesse à 0':'Pauses et arrêts · allure à l’arrêt')+'</div>';};
  var conv=function(f){return smooth3(s.v.map(function(v,i){return mask[i]||pm.g[i]||!(v>thr)?null:v;})).map(function(v){return okv(v)?f(v):null;});};
  var pace=function(title,sub,vals,inv,col,lab,fmt,tip){return chartCard(title,sub+' · lissé',lineSvg(vals,s.step,{id:'d-pace',color:col,inv:inv,drop:true,base0:!inv,zeroTip:!inv?'0 km/h':'',mask:mask,pauseLbl:lbl,label:lab,fmt:fmt,tip:tip,tipx:hrAt}),'moy <b>'+paceTxt(k,a.m,a.d)+'</b>',note());};
  if(s&&s.v){
    if(k==='run')h+=pace('Allure','min/km',conv(function(v){return 1000/v;}),true,SPCOL.run,'Allure au cours de la course',function(v){return mmss(v);},function(v){return mmss(v)+' /km';});
    else if(k==='bike')h+=pace('Vitesse','km/h',conv(function(v){return v*3.6;}),false,SPCOL.bike,'Vitesse au cours de la sortie',function(v){return Math.round(v);},function(v){return v.toFixed(1).replace('.',',')+' km/h';});
    else if(k==='swim')h+=pace('Allure','/100 m',conv(function(v){return 100/v;}),true,SPCOL.swim,'Allure de nage',function(v){return mmss(v);},function(v){return mmss(v)+' /100 m';});
  }
  if(s&&s.h&&s.h.some(Boolean))h+=chartCard('Fréquence cardiaque','bpm · minutes',lineSvg(s.h.map(function(v){return v>0?v:null;}),s.step,{id:'d-hr',color:'#f5f4ef',mask:mask,pauseLbl:lbl,label:'Fréquence cardiaque au cours de l’activité',fmt:function(v){return Math.round(v);},tip:function(v){return Math.round(v)+' bpm';},tipx:paceAt}),a.h?'moy <b>'+a.h+'</b>'+(a.x?' · max <b>'+a.x+'</b>':'')+' bpm':'',note());
  if(s&&s.a&&(k==='run'||k==='bike')&&a.z>5)h+=chartCard('Altitude','m',lineSvg(s.a,s.step,{id:'d-alt',color:'#98989f',h:96,mask:mask,pauseLbl:lbl,label:'Profil d’altitude',fmt:function(v){return Math.round(v);},tip:function(v){return Math.round(v)+' m';},tipx:hrAt}),'<b>+'+a.z+' m</b> de dénivelé',note());
  if(j.sp&&j.sp.l&&j.sp.l.length>1)h+=chartCard(k==='run'?'Allure par kilomètre':'Vitesse par tranche de '+(j.sp.u/1000)+' km','',splitsHtml(k==='run'?'run':'ride',j.sp));
  if(k==='swim'&&j.iv&&j.iv.length)h+=chartCard('Séries','distance · temps · allure /100 m',ivHtml(j.iv));
  return h||'<p class="small muted">Pas de détail supplémentaire pour cette activité.</p>';
}
function adHero(a,k){
  var big=[['Durée',fh(a.d/60),'']],p;
  if(a.m>0)big.push(['Distance',km(a.m),'km']);
  if(k==='run'||k==='swim'||k==='bike'){p=paceTxt(k,a.m,a.d);var q=p.indexOf(' ');big.push([k==='bike'?'Vitesse moy.':'Allure moy.',q>0?p.slice(0,q):p,q>0?p.slice(q+1):'']);}
  return '<div class="ad-hero sp-'+(k==='oth'?'str':k)+'">'+big.map(function(b){return '<div><span class="kl">'+b[0]+'</span><b>'+b[1]+(b[2]?'<small>'+b[2]+'</small>':'')+'</b></div>';}).join('')+'</div>';
}
// « Charge » d'intervals.icu, traduite : niveau, repère et comparaison à tes propres séances de la même discipline
function effortCard(a,k){
  var lvl=null,cmp='',zh=zonesHtml(a.zt,state.sv.hrz,true),hr='';
  if(a.l>0){
    lvl=a.l<40?['Léger','#30d158']:a.l<90?['Modéré','#7fdc9b']:a.l<160?['Soutenu','#ffd60a']:a.l<250?['Dur','#ff9f0a']:['Très dur','#ff5e4e'];
    var same=dataActs().filter(function(x){return skey(x)===k&&x.l>0;});
    if(same.length>=5&&SPLBL[k]&&k!=='oth'){var below=same.filter(function(x){return x.l<a.l;}).length;cmp='Plus exigeante que <b>'+pct(below,same.length)+' %</b> de tes séances de '+SPLBL[k].toLowerCase()+'.';}
  }
  if(a.h)hr='<div class="ef-hr"><span>Fréquence cardiaque</span><b>'+a.h+' bpm en moyenne'+(a.x?' · '+a.x+' max':'')+'</b></div>';
  if(!lvl&&!hr&&!zh)return '';
  var h='<div class="card ad-ch"><div class="dh"><span>Effort</span></div>';
  if(lvl){
    h+='<div class="ef-t"><b style="color:'+lvl[1]+'">'+lvl[0]+'</b><span>'+a.l+' points</span></div>'+
      '<div class="ef-bar" role="img" aria-label="Niveau d’effort : '+lvl[0]+'"><i style="left:'+Math.min(100,a.l/3)+'%"></i></div>'+
      '<p class="small muted" style="margin:8px 0 0">'+(cmp?cmp+' ':'')+'Repère : 100 points ≈ 1 h à ton seuil.</p>';
  }
  return h+hr+(zh?'<div style="margin-top:12px">'+zh+'</div>':'')+'</div>';
}
function actDetailBody(a){
  var k=skey(a),sid=LK.a2s[a.id],s=sid&&SBY[sid],h=adHero(a,k),t='';
  if(s){
    var pr=k==='swim'&&s.m?Math.round(a.m/s.m*100):Math.round(a.d/60/Math.max(1,s.min)*100),vd=pr<80?['Plus court que prévu','#ff9f0a']:pr>120?['Plus long que prévu','#ff9f0a']:['Conforme au plan','#30d158'];
    h+='<div class="act ad-plan sp-'+(k==='oth'?'str':k)+'"><div class="row"><b>Séance du plan</b><span class="sp"></span><span class="ad-v" style="color:'+vd[1]+'">'+vd[0]+'</span></div><div class="an">'+esc(s.title)+'</div><div class="small muted" style="margin-bottom:8px">'+esc(sessLabel(s))+' · prévu '+fh(s.min)+(s.m?' · '+km(s.m)+' km':'')+' · réalisé <b style="color:var(--t1)">'+pr+' %</b></div>'+bar(Math.min(100,pr),SPCOL[k]||null)+'</div>';
  }
  if(a.z>0&&k!=='swim')t+=actKpi('Dénivelé +',a.z+' m');
  if(a.c>0)t+=actKpi('Cadence',k==='run'?Math.round(a.c*2)+' pas/min':k==='swim'?Math.round(a.c)+' mvt/min':Math.round(a.c)+' tr/min');
  if(a.w)t+=actKpi('Puissance',a.w+' W');
  if(a.k)t+=actKpi('Calories',a.k+' kcal');
  if(a.e>a.d+60)t+=actKpi('Pauses',fmtSec(a.e-a.d));
  if(t)h+='<div class="kpis" style="grid-template-columns:repeat(2,1fr)">'+t+'</div>';
  h+='<div id="det-more">'+(detCache[a.id]?detMore(a,detCache[a.id]):'<div class="skel" aria-label="Chargement du détail"><i></i><i></i></div>')+'</div>';
  h+=effortCard(a,k);
  if(dayIdx(a)>=0&&actSport(a))h+='<button class="btn" data-act="picksess" data-aid="'+esc(a.id)+'">'+(s?'Changer la séance associée':'Associer à une séance du plan')+'</button>';
  return h;
}
function openActDetail(aid){
  var a=findAct(aid);if(!a)return;
  detCur=a.id;
  showSheet(a.n||a.t,actDate(a)+(a.dv?' · '+a.dv:''),actDetailBody(a),skey(a));sheetRoute('act:'+a.id);
  if(detCache[a.id])return;
  svFetch('/api/activity?id='+encodeURIComponent(a.id))
    .then(function(r){if(!r.ok)throw new Error('Erreur '+r.status);return r.json();})
    .then(function(j){detCache[a.id]=j;var el=document.getElementById('det-more');if(detCur===a.id&&el)el.innerHTML=detMore(a,j);})
    .catch(function(e){var el=document.getElementById('det-more'),m=(e&&e.message)||'';if(detCur===a.id&&el)el.innerHTML='<p class="small muted">Détail indisponible ('+esc(m==='Failed to fetch'||m==='Load failed'?'hors ligne':m)+').</p>';});
}

/* ---------- Garmin : feuilles de choix, synchronisation ---------- */
function showSheet(title,sub,body,k){
  var sh=document.getElementById('sheet');
  sh.innerHTML='<div class="row shead">'+(k?'<span class="ad-ic sp-'+(k==='oth'?'str':k)+'">'+ic(k==='oth'?'str':k,22)+'</span>':'')+'<div style="min-width:0"><h2 style="font-size:20px">'+esc(title)+'</h2>'+(sub?'<div class="small muted">'+esc(sub)+'</div>':'')+'</div><span class="sp"></span><button class="iconbtn" data-act="closesheet" aria-label="Fermer" style="background:#2c2c2e">'+ic('left',22).replace('m15 18-6-6 6-6','M18 6 6 18M6 6l12 12')+'</button></div>'+body;
  sh.scrollTop=0;document.getElementById('sheetbg').classList.add('on');
}
function openPickAct(sid){
  var s=SBY[sid];if(!s)return;
  var k=s.sp==='brick'?'run':s.sp,si=sessIdx(s),cur=LK.s2a[sid];
  var list=((state.sv.acts)||[]).filter(function(a){return actSport(a)===k&&Math.abs(dayIdx(a)-si)<=21;})
    .sort(function(x,y){return Math.abs(dayIdx(x)-si)-Math.abs(dayIdx(y)-si)||(y.s>x.s?1:-1);});
  var b=list.length?'':'<p class="muted">Aucune activité de ce type dans les 3 semaines autour de cette séance.</p>';
  list.forEach(function(a){
    var os=LK.a2s[a.id]&&SBY[LK.a2s[a.id]];
    var lab=cur&&cur.id===a.id?'Associée ici':os?'Liée à '+sessLabel(os):'Non associée';
    b+='<button class="srow" data-act="link" data-aid="'+esc(a.id)+'" data-sid="'+sid+'"><span class="sr-t"><b>'+esc(a.n||a.t)+'</b><small>'+esc(actDate(a)+' · '+actLine(a))+'</small></span><span class="sr-b'+(cur&&cur.id===a.id?' ok':'')+'">'+esc(lab)+'</span></button>';
  });
  showSheet('Associer une activité',s.title+' · '+sessLabel(s),b);sheetRoute('link:'+sid);
}
function openPickSess(aid){
  var a=null;((state.sv.acts)||[]).forEach(function(x){if(String(x.id)===String(aid))a=x;});if(!a)return;
  var k=actSport(a),ai=dayIdx(a),cur=LK.a2s[a.id],b='';
  if(!k)b='<p class="muted">Ce type d’activité ('+esc(a.t)+') n’est pas suivi dans le plan.</p>';
  else{
    b+='<div class="btns" style="margin-bottom:12px">'+(state.links[a.id]!==undefined?'<button class="btn" data-act="autolink" data-aid="'+esc(a.id)+'">Automatique</button>':'')+'<button class="btn" data-act="unlink" data-aid="'+esc(a.id)+'">Ne pas associer</button></div>';
    var list=ALLS.filter(function(s){return (k===s.sp||(k==='run'&&s.sp==='brick'))&&Math.abs(sessIdx(s)-ai)<=21;})
      .sort(function(x,y){return Math.abs(sessIdx(x)-ai)-Math.abs(sessIdx(y)-ai)||sessIdx(x)-sessIdx(y);});
    if(!list.length)b+='<p class="muted">Aucune séance équivalente dans les 3 semaines autour de cette activité.</p>';
    list.forEach(function(s){
      var o=LK.s2a[s.id],lab=cur===s.id?'Associée ici':o?'Déjà liée : '+(o.n||'activité'):state.done[s.id]?'Cochée à la main':'Libre';
      b+='<button class="srow" data-act="link" data-aid="'+esc(a.id)+'" data-sid="'+s.id+'"><span class="sr-t"><b>'+esc(s.title)+'</b><small>'+esc(sessLabel(s)+' · '+fh(s.min))+'</small></span><span class="sr-b'+(cur===s.id?' ok':'')+'">'+esc(lab)+'</span></button>';
    });
  }
  showSheet('Associer à une séance',a.n+' · '+actDate(a),b);sheetRoute('assoc:'+a.id);
}
function openAllActs(){
  var acts=((state.sv.acts)||[]).slice().sort(function(x,y){return y.s>x.s?1:-1;}),tot={swim:[0,0,0],bike:[0,0,0],run:[0,0,0],str:[0,0,0]};
  acts.forEach(function(a){var k=actSport(a);if(k){tot[k][0]++;tot[k][1]+=a.d;tot[k][2]+=a.m;}});
  var b='';
  if(!acts.length)b='<p class="muted">Aucune activité reçue pour l’instant. Vérifie que Garmin est bien connecté dans intervals.icu, puis touche « Synchroniser maintenant ».</p>';
  else{
    b+='<div class="card" style="background:var(--card2);margin:0 0 14px">';
    [['swim','Natation'],['bike','Vélo'],['run','Course à pied'],['str','Renforcement']].forEach(function(r){
      var t=tot[r[0]];
      b+='<div class="spr sp-'+r[0]+'"><div class="ico">'+ic(r[0],20)+'</div><div class="bd"><div class="pr-h" style="margin:0"><b>'+r[1]+'</b><span>'+t[0]+' séance'+(t[0]>1?'s':'')+' · '+fh(Math.round(t[1]/60))+(t[2]?' · '+km(t[2])+' km':'')+'</span></div></div></div>';
    });
    b+='</div>';
    var cur='';
    acts.forEach(function(a){
      var d=plLocal(a.s);if(!d)return;
      var mo=MONTHS_L[d.getMonth()]+' '+d.getFullYear();
      if(mo!==cur){cur=mo;b+='<h4>'+mo+'</h4>';}
      var k=actSport(a),sid=LK.a2s[a.id],s=sid&&SBY[sid],lab=s?'→ '+sessLabel(s):(k?SPN[k]:(a.t||'Autre')),inner='<span class="sr-t"><b>'+esc(a.n||a.t)+'</b><small>'+esc(actDate(a)+' · '+actLine(a))+'</small></span><span class="sr-b'+(s?' ok':'')+'">'+esc(lab)+'</span>';
      b+='<button class="srow" data-act="actdetail" data-aid="'+esc(a.id)+'">'+inner+'</button>';
    });
  }
  showSheet('Mes activités',acts.length+' activité'+(acts.length>1?'s':'')+' depuis janvier 2026',b);sheetRoute('acts');
}
function setLink(aid,sid){
  var L=state.links;
  Object.keys(L).forEach(function(k){if(L[k]===sid&&k!==String(aid))delete L[k];});
  L[aid]=sid;save();closeSheet();render(true);toast('Activité associée');
}
function isoDate(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function svBase(){return (state.sv.url||'').replace(/\/+$/,'');}
function svFetch(path,opt){opt=opt||{};opt.headers=Object.assign({Authorization:'Bearer '+state.sv.key,'X-Icu-Key':state.sv.key},opt.headers||{});return fetch(svBase()+path,opt);}
var syncing=false,pendingRender=false;
function typing(){var ae=document.activeElement;return !!(ae&&/^(TEXTAREA|INPUT)$/.test(ae.tagName));}
function safeRender(){if(typing()){pendingRender=true;return;}render(true);}
document.addEventListener('focusout',function(){setTimeout(function(){if(pendingRender&&!typing()){pendingRender=false;render(true);}},60);});
function syncActs(force,loud){
  var sv=state.sv;if(!sv.url||!sv.key||syncing)return;
  if(!force&&Date.now()-(sv.t||0)<60000)return;
  syncing=true;
  svFetch('/api/activities?since='+isoDate(addDays(today(),-400)))
    .then(function(r){if(!r.ok)throw new Error(r.status===401?'Clé invalide':'Erreur serveur ('+r.status+')');return r.json();})
    .then(function(j){
      var acts=j.activities||[],changed=JSON.stringify(acts)!==JSON.stringify(sv.acts||[])||sv.conn!==!!j.connected||!!sv.err||(sv.werr||'')!==(j.error||'');
      sv.acts=acts;if(j.meta){if(j.meta.hrz)sv.hrz=j.meta.hrz;sv.meta=j.meta;}sv.conn=!!j.connected;sv.werr=j.error||'';sv.t=Date.now();sv.err='';save();
      if(j.connected&&acts.length&&!state.ui.gtracked){state.ui.gtracked=1;save();track('garmin_connected','sync');}   // clé déjà là (retrouvée depuis le compte, ancien domaine…) : pas une connexion via l'assistant
      if(loud)toast('Activités synchronisées');
      if(changed||loud)safeRender();
      else{var ss=document.querySelector('.sync-s');if(ss)ss.innerHTML='<i></i>Synchro '+ago(sv.t);}   // rien de neuf : seule l'heure de synchro change
    })
    .catch(function(e){
      var m=(e&&e.message)||'Hors ligne';sv.err=(m==='Failed to fetch'||m==='Load failed')?'Serveur injoignable':m;save();
      if(loud)toast(sv.err);safeRender();
    })
    .then(function(){syncing=false;});
}
function svSettings(){
  var sv=state.sv;
  return '<h4>Garmin (synchronisation automatique)</h4><p>Garmin Connect envoie tes activités à <b>intervals.icu</b> (gratuit) ; l’app les lit et coche tes séances toute seule. Crée un compte sur intervals.icu, connecte-y Garmin, puis copie ta <b>clé API</b> (Réglages → Developer Settings → API Key) dans le champ ci-dessous. Ta clé est enregistrée sur ton téléphone et, chiffrée, dans ton compte, pour que tu n’aies pas à la recoller ailleurs.</p>'+
    '<label class="inp wide"><span>Adresse du serveur<small>laisse vide : serveur par défaut</small></span><input id="sv-url" name="triient-server-url" autocomplete="off" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="https://triient.….workers.dev" value="'+esc(sv.url||'')+'"></label>'+
    '<label class="inp wide"><span>Clé d’accès</span><input id="sv-key" type="text" name="triient-app-key" autocomplete="off" data-lpignore="true" style="-webkit-text-security:disc;text-security:disc" autocapitalize="off" autocorrect="off" spellcheck="false" value="'+esc(sv.key||'')+'"></label>'+
    '<button class="btn pri" data-act="svresync">Tester et resynchroniser</button>'+
    '<p class="small muted">'+(sv.t?'Dernière synchro : '+ago(sv.t)+'. ':'')+esc(sv.err||'')+' '+esc(sv.werr||'')+'</p>';
}
function svResync(){
  if(!state.sv.url||!state.sv.key){toast('Renseigne l’adresse et la clé');return;}
  toast('Lecture d’intervals.icu…');
  svFetch('/api/sync',{method:'POST'}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||('Erreur '+r.status));return j;});})
    .then(function(j){toast(j.count+' activités récupérées');syncActs(true);})
    .catch(function(e){var m=(e&&e.message)||'Échec';toast(m==='Failed to fetch'||m==='Load failed'?'Serveur injoignable':m);});
}

// Compte à rebours en direct
var lastDay=0;
function tick(){
  var el=document.getElementById('cd-d');
  if(today().getTime()!==lastDay&&lastDay){render(true);return;}
  if(!el)return;
  var ms=Math.max(0,new Date(RACE_DATE.getFullYear(),RACE_DATE.getMonth(),RACE_DATE.getDate(),0,0,0)-nowDate()),dd=Math.floor(ms/DAY),hh=Math.floor(ms%DAY/36e5),mm=Math.floor(ms%36e5/6e4),ss=Math.floor(ms%6e4/1e3);
  el.textContent=dd;document.getElementById('cd-u').textContent=dd>1?'jours':'jour';
  document.getElementById('cd-h').textContent=hh;document.getElementById('cd-m').textContent=mm;document.getElementById('cd-s').textContent=ss;
}
setInterval(tick,1000);
document.addEventListener('visibilitychange',function(){if(!document.hidden){render(true);syncActs(false);}});

