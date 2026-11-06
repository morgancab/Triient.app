/* =====================================================================
   5. RENDU, ÉVÉNEMENTS, RÉGLAGES
   ===================================================================== */
var VIEWS={dash:vHome,week:vWeek,data:function(){return topbar('Analyse','Données',false)+vData();},race:function(){return topbar(RNAME,'Course',false)+vRace();},more:vMore,plan:vPlan,admin:vAdmin};
function renderTabs(){
  document.getElementById('tabs').innerHTML=TABS.map(function(t){
    return '<button class="tab" data-act="tab" data-tab="'+t[0]+'" role="tab" aria-selected="'+(t[0]===tabOf(tab))+'"><span class="ti">'+ic(t[2],24)+'</span><span>'+t[1]+'</span></button>';
  }).join('');
}
function render(keep){
  if(gateNeeded()){renderGate();return;}
  try{document.body.classList.remove('gating');}catch(e){}
  if(loginStepNeeded()){renderLoginStep();return;}
  acctPingSoon();
  gateShown=false;
  if(!SETUP){try{document.body.classList.remove('setup');}catch(e){}}
  if(SETUP){renderSetup();return;}
  var y=keep?(window.pageYOffset||0):0;
  computeLinks();
  syncUrl(false);
  var vw=document.getElementById('view');vw.className=keep?'':'enter';vw.innerHTML=VIEWS[tab]();
  renderTabs();
  window.scrollTo(0,y);
  if(!keep&&tab==='plan')setTimeout(function(){var cb=document.querySelector('.pblk.cur');if(cb){var t=cb.getBoundingClientRect().top;if(t>window.innerHeight*0.55)window.scrollBy(0,t-84);}},80);
  if(pendDay!=null){var pd=pendDay;pendDay=null;setTimeout(function(){var el=document.getElementById('day-'+pd);if(el)el.scrollIntoView({block:'start'});},60);}
  lastDay=today().getTime();
  tick();
}
function setTab(t){
  tab=t;state.ui.tab=t;save();
  syncUrl(true);
  render(false);
}
var toastT;
function toast(m){
  var el=document.getElementById('toast');el.textContent=m;el.className='on';
  clearTimeout(toastT);toastT=setTimeout(function(){el.className='';},2600);
}
document.addEventListener('click',function(e){
  var el=e.target.closest?e.target.closest('[data-act]'):null;
  if(!el)return;
  var a=el.getAttribute('data-act'),d=el.dataset;
  if(a==='tab'){setTab(d.tab);}
  else if(a==='gowd'){wv=+d.w;tab='week';state.ui.tab=tab;save();syncUrl(true,+d.d);pendDay=+d.d;render(false);}
  else if(a==='toggle'){
    var la=LK.s2a[d.id];
    if(la){state.links[la.id]=0;delete state.done[d.id];}
    else if(state.done[d.id])delete state.done[d.id];else state.done[d.id]=true;
    save();render(true);
    if(isDone(SBY[d.id])&&navigator.vibrate)try{navigator.vibrate(12);}catch(x){}
  }
  else if(a==='open'){openSet[d.id]=!(openSet[d.id]);var card=el.closest('.sess');card.classList.toggle('open',openSet[d.id]);el.setAttribute('aria-expanded',openSet[d.id]);}
  else if(a==='wkd'){wv=Math.max(1,Math.min(NW,wv+(+d.d)));render(false);}
  else if(a==='wknow'){wv=status().w;render(false);}
  else if(a==='gowk'){wv=+d.w;tab='week';state.ui.tab=tab;save();syncUrl(true);render(false);}
  else if(a==='chart'){
    var r=el.getBoundingClientRect(),W=340,L=26,Rr=4,x=(e.clientX-r.left)/r.width*W,i=Math.floor((x-L)/((W-L-Rr)/NW));
    sel=Math.max(1,Math.min(NW,i+1));render(true);
  }
  else if(a==='doinstall')doInstall();
  else if(a==='shareapp')shareApp();
  else if(a==='hideinstall'){state.ui.hideInstall=true;save();render(true);}
  else if(a==='pickact')openPickAct(d.sid);
  else if(a==='picksess')openPickSess(d.aid);
  else if(a==='link')setLink(d.aid,d.sid);
  else if(a==='unlink'){state.links[d.aid]=0;save();closeSheet();render(true);toast('Activité dissociée');}
  else if(a==='autolink'){delete state.links[d.aid];save();closeSheet();render(true);toast('Association automatique rétablie');}
  else if(a==='syncsv')syncActs(true,true);
  else if(a==='allacts')openAllActs();
  else if(a==='actdetail')openActDetail(d.aid);
  else if(a==='pushsess')pushSession(d.id);
  else if(a==='pushprev')pushPreview();
  else if(a==='clearprev')clearPreview();
  else if(a==='rcscen'){(state.ui.race=state.ui.race||{}).scen=d.v;save();render(true);}
  else if(a==='rcwet'){var rp=state.ui.race=state.ui.race||{};rp.wet=!(rp.wet!==false);save();render(true);}
  else if(a==='dflt'){
    var f=state.ui.dflt=state.ui.dflt||{m:'26w'};
    if(d.v==='custom'&&!f.from){var rr=dRange(dataActs());f.from=isoDate(rr.from);f.to=isoDate(rr.to);}
    f.m=d.v;dsel=null;dcalPend=false;dcalM=null;save();render(true);
  }
  else if(a==='dmetric'){state.ui.dmetric=d.v==='dist'?'dist':'time';save();render(true);}
  else if(a==='dchart'){
    var wl=(el.parentNode.getAttribute('data-wks')||'').split(',').map(Number),cr=el.getBoundingClientRect(),cx=(e.clientX-cr.left)/cr.width*340,ci=Math.floor((cx-30)/((340-30-4)/wl.length));
    dsel=wl[Math.max(0,Math.min(wl.length-1,ci))];render(true);
  }
  else if(a==='togstats'){state.ui.noStats=statsOn();save();openSheet();toast(statsOn()?'Statistiques activées':'Statistiques désactivées');}
  else if(a==='gateretry'){pubCfg=null;render(false);loadPubCfg();}
  else if(a==='editpending'){delete state.ui.pendingRace;save();window.scrollTo(0,0);render(false);}
  else if(a==='gateguest'){state.ui.guest=Date.now();save();trackOnce('guest_start','');window.scrollTo(0,0);render(false);}
  else if(a==='gatetop'){var gc=document.getElementById('g-cta');if(gc)gc.scrollIntoView({behavior:'smooth',block:'center'});}
  else if(a==='acctsave'){var ac=acct();if(ac){if(ac.conflict&&!confirm('Écraser la version du compte avec les données de cet appareil ?'))return;ac.paused=false;ac.conflict=false;acctForce();}}
  else if(a==='acctexport')acctExport();
  else if(a==='acctout')acctLogout();
  else if(a==='acctdel')acctDelete();
  else if(a==='cloudon')cloudEnable();
  else if(a==='cloudsave'){var cc=cloudCfg();if(cc){if(cc.conflict&&!confirm('Écraser la version du cloud avec les données de cet appareil ?'))return;cc.paused=false;cc.conflict=false;cloudForce();}}
  else if(a==='cloudrestore'){var c2=cloudCfg();if(c2)cloudRestore(c2.code,false);}
  else if(a==='cloudget'){var inp=document.getElementById('cloud-code');cloudRestore(inp?inp.value:'',!!SETUP);}
  else if(a==='cloudcopy'){var cd=cloudCfg()?cloudCfg().code:cloudDraftCode;try{navigator.clipboard.writeText(fmtCode(cd||'')).then(function(){toast('Code copié');},function(){toast('Copie impossible : note-le à la main');});}catch(e){toast('Copie impossible : note-le à la main');}}
  else if(a==='cloudoff'){var c3=cloudCfg();if(c3&&confirm('Supprimer la sauvegarde du cloud ? Tes données restent sur cet appareil.')){cloudKeys(c3.code).then(function(k){return cloudCall(k,'DELETE');}).then(function(){delete state.ui.cloud;save0();openSheet();toast('Sauvegarde cloud supprimée');}).catch(function(){toast('Suppression impossible : réessaie en ligne');});}}
  else if(a==='legal')openLegal();
  else if(a==='racechange'){raceDraft=newRaceDraft();raceDraft.format=FCLS==='custom'?'olympic':FCLS;renderSetup();}
  else if(a==='setstart'&&raceDraft){raceDraft.startMode=d.v==='date'?'date':'now';if(raceDraft.startMode==='date'&&!raceDraft.start){var nd0=today();raceDraft.start=isoDate(nd0);raceDraft.scal={y:nd0.getFullYear(),m:nd0.getMonth()};}renderSetup();}
  else if(a==='racepick'&&raceDraft){pickRace((raceDraft.shown||[])[+d.i]);}
  else if(a==='setsess'&&raceDraft){raceDraft.sessions=Math.max(3,Math.min(SESS_MAX,sessOf(raceDraft)+(+d.v)));raceDraft.peak=null;renderSetup();}
  else if(a==='setfmt'&&raceDraft){raceDraft.format=d.v;raceDraft.peak=null;raceDraft.sessions=null;raceDraft.dist=null;if(!raceDraft.date){var lead={sprint:12,olympic:16,half:24,full:32,custom:16}[d.v]||16,tm=addDays(today(),lead*7);raceDraft.cal={y:tm.getFullYear(),m:tm.getMonth()};}renderSetup();}
  else if(a==='setlvl'&&raceDraft){raceDraft.level=+d.v;raceDraft.peak=null;raceDraft.sessions=null;renderSetup();}
  else if(a==='setpeak'&&raceDraft){var cl=raceCls(raceDraft),lim={sprint:[3,12],olympic:[4,16],half:[6,22],full:[8,29]}[cl]||[3,29];lim=[lim[0],Math.max(lim[0],Math.min(lim[1],Math.round(maxPeak(sessOf(raceDraft),cl)+1.5)))];raceDraft.peak=Math.max(lim[0],Math.min(lim[1],Math.round((peakOf(raceDraft)+0.5*(+d.v))*2)/2));renderSetup();}
  else if(a==='racesave'&&raceDraft)saveRace();
  else if(a==='awayopen'){awayDraft=awayCalInit(newAwayDraft(+d.w||wv,d.t||'weekend'));renderAway();}
  else if(a==='awayedit'){var ap=awayList().filter(function(x){return x.id===d.id;})[0];if(ap){awayDraft=awayCalInit(Object.assign({},ap));renderAway();}}
  else if(a==='awaylist')openAwayList();
  else if(a==='vtopen')openVt();
  else if(a==='vtdef'&&vtDraft){vtDraft.vt[d.v]=null;vtDraft.sc[d.v]=scDefault(NSESS0)[d.v];vtPrep();renderVt();}
  else if(a==='vtreset'&&vtDraft){VT_UI.forEach(function(x){vtDraft.vt[x[0]]=null;});vtDraft.sc=scDefault(NSESS0);vtPrep();renderVt();}
  else if(a==='vtsc'&&vtDraft){var sk=d.k;vtDraft.sc[sk]=Math.max(SC_MIN[sk],Math.min(SC_MAX[sk],(vtDraft.sc[sk]||0)+(+d.v)));vtPrep();renderVt();}
  else if(a==='vtapply'&&vtDraft)vtApply();
  else if(a==='awaytype'&&awayDraft&&(d.v==='injury')!==isInj(awayDraft)){   // vers ou depuis la blessure : nouveau brouillon (mêmes dates si déjà choisies)
    var wasInj=isInj(awayDraft),nd2=newAwayDraft(Math.max(1,Math.min(NW,Math.floor(idxOfDate(parseYmd(awayDraft.from))/7)+1)),d.v);
    nd2.id=awayDraft.id;if(awayDraft.touched){nd2.from=awayDraft.from;if(!wasInj||!awayDraft.open)nd2.to=awayDraft.to;if(d.v==='injury'&&!wasInj)nd2.open=false;nd2.touched=true;}
    awayDraft=awayCalInit(nd2);renderAway();
  }
  else if(a==='injopen'&&awayDraft){awayDraft.open=d.v==='1';if(!awayDraft.open&&awayDraft.to<=awayDraft.from)awayDraft.to=isoDate(addDays(parseYmd(awayDraft.from),13));awayDraft.pending=false;awayDraft.touched=true;renderAway();}
  else if(a==='injsp'&&awayDraft){var sx2=awayDraft.stop=awayDraft.stop||{};sx2[d.v]=!sx2[d.v];awayDraft.touched=true;renderAway();}
  else if(a==='injall'&&awayDraft){var al=injAll(awayDraft);awayDraft.stop=al?{}:{swim:true,bike:true,run:true,str:true};awayDraft.touched=true;renderAway();}
  else if(a==='injresume')injResume(d.id);
  else if(a==='injback')injBack(d.id,d.v);
  else if(a==='awaytype'&&awayDraft){awayDraft.type=d.v;awayDraft.label=d.v==='vacances'?'Vacances':'Week-end';if(!awayDraft.touched&&!awayDraft.id){var nd=newAwayDraft(Math.max(1,Math.min(NW,Math.floor(idxOfDate(parseYmd(awayDraft.from))/7)+1)),d.v);awayDraft.from=nd.from;awayDraft.to=nd.to;awayDraft.mode=nd.mode;awayDraft.move=nd.move;awayCalInit(awayDraft);}renderAway();}
  else if(a==='calpreset'&&awayDraft){awayPreset(awayDraft,d.v);renderAway();}
  else if(a==='calnav'){
    var dir=+d.v;
    if(d.ns==='step'&&stepDraft){var nst=new Date(stepDraft.cal.y,stepDraft.cal.m+dir,1);stepDraft.cal={y:nst.getFullYear(),m:nst.getMonth()};renderStep();}
    else if(d.ns==='away'&&awayDraft){var nm=new Date(awayDraft.cal.y,awayDraft.cal.m+dir,1);awayDraft.cal={y:nm.getFullYear(),m:nm.getMonth()};renderAway();}
    else if(d.ns==='rstart'&&raceDraft){var ns2=new Date(raceDraft.scal.y,raceDraft.scal.m+dir,1);raceDraft.scal={y:ns2.getFullYear(),m:ns2.getMonth()};renderSetup();}
    else if(d.ns==='race'&&raceDraft){var nr=new Date(raceDraft.cal.y,raceDraft.cal.m+dir,1);raceDraft.cal={y:nr.getFullYear(),m:nr.getMonth()};renderSetup();}
    else if(d.ns==='data'){var rg=dRange(dataActs()),bs=dcalM||{y:rg.to.getFullYear(),m:rg.to.getMonth()},nd2=new Date(bs.y,bs.m+dir,1);dcalM={y:nd2.getFullYear(),m:nd2.getMonth()};render(true);}
  }
  else if(a==='calday'){
    if(d.ns==='step'&&stepDraft){stepDraft.date=d.d;stepDraft.hint='';renderStep();}
    else if(d.ns==='away'&&awayDraft&&isInj(awayDraft)&&awayDraft.open){awayDraft.from=awayDraft.to=d.d;awayDraft.pending=false;awayDraft.touched=true;renderAway();}   // pause ouverte : seul le début se choisit
    else if(d.ns==='away'&&awayDraft){var r1=calPick(awayDraft.from,awayDraft.to,awayDraft.pending,d.d);awayDraft.from=r1.from;awayDraft.to=r1.to;awayDraft.pending=r1.pending;awayDraft.touched=true;renderAway();}
    else if(d.ns==='rstart'&&raceDraft){raceDraft.start=d.d;renderSetup();}
    else if(d.ns==='race'&&raceDraft){raceDraft.date=d.d;renderSetup();}
    else if(d.ns==='data'){var f2=state.ui.dflt=state.ui.dflt||{m:'custom'},r2=calPick(f2.from||d.d,f2.to||d.d,dcalPend,d.d);f2.from=r2.from;f2.to=r2.to;f2.m='custom';dcalPend=r2.pending;dsel=null;save();render(true);}
  }
  else if(a==='awaymode'&&awayDraft){awayDraft.mode=d.v;awayDraft.touched=true;renderAway();}
  else if(a==='awaymove'&&awayDraft){awayDraft.move=d.v;awayDraft.touched=true;renderAway();}
  else if(a==='awayeq'&&awayDraft){awayDraft[d.v]=!awayDraft[d.v];awayDraft.touched=true;renderAway();}
  else if(a==='awaysave'&&awayDraft)saveAway();
  else if(a==='awaydel')delAway();
  else if(a==='svresync')svResync();
  else if(a==='settings')openSheet();
  else if(a==='missdo')missDo(d.id,d.a);
  else if(a==='missundo')missUndo(d.id);
  else if(a==='missall')missAll();
  else if(a==='plancur'){var pc=document.querySelector('.wkt.cur');if(pc)pc.closest('.pblk').scrollIntoView({block:'start',behavior:'smooth'});}
  else if(a==='admreload')adminLoad();
  else if(a==='admdays'){admDays=+d.v;adminEv=null;render(true);adminLoad();}
  else if(a==='admuser')openAdmUser(d.id);
  else if(a==='steps'){stepDraft=null;openSteps();}
  else if(a==='stepnew'){stepDraft=stepNew();renderStep();}
  else if(a==='stepedit')openStepEdit(d.id);
  else if(a==='stepkind'&&stepDraft){stepDraft.kind=d.v;renderStep();}
  else if(a==='stepfmt'&&stepDraft){stepDraft.format=d.v;renderStep();}
  else if(a==='stepprio'&&stepDraft){stepDraft.prio=d.v;renderStep();}
  else if(a==='steppick'&&stepDraft)stepPick(stepDraft.res[+d.i]);
  else if(a==='stepsave'&&stepDraft)saveStep();
  else if(a==='stepdel')delStep();
  else if(a==='level')openLevel();
  else if(a==='tpick')tpOpen(d.id);
  else if(a==='tpok')tpOk();
  else if(a==='tpclear')tpClear();
  else if(a==='lvd'){var Lk=state.ui.lvl=state.ui.lvl||{},lk=Lk[d.k]=Lk[d.k]||{},was=lk.d>=21000;lk.d=+d.v;if(d.k==='run'){if(was!==(lk.d>=21000))lk.t=0;var tw=document.getElementById('lv-run-tw');if(tw)tw.innerHTML=lvRunTin();}save();lvRefresh();}
  else if(a==='lvclear'){if(confirm('Effacer tes réponses au questionnaire de niveau ?')){state.ui.lvl={};save();closeSheet();render(true);toast('Questionnaire effacé');}}
  else if(a==='welcome')openWelcome();
  else if(a==='welcomeok'){state.ui.welcomed=true;save();closeSheet();}
  else if(a==='welcomegarmin'){state.ui.welcomed=true;save();openWiz(1);}
  else if(a==='garminwiz')openWiz(1);
  else if(a==='hidegtip'){state.ui.hideGTip=1;save();render(true);}
  else if(a==='garminwiz3')openWiz(3);
  else if(a==='wznext'){wz.step=Math.min(3,wz.step+1);renderWiz();}
  else if(a==='wzback'){wz.step=Math.max(1,wz.step-1);renderWiz();}
  else if(a==='wzverify')wzVerify();
  else if(a==='wzpaste')wzPaste();
  else if(a==='wzdone'){closeSheet();render(true);}
  else if(a==='garminoff'){if(confirm('Déconnecter Garmin ? Tes séances ne se cocheront plus automatiquement. Tes données restent dans intervals.icu.')){state.sv={};state.ui.gkOff=1;save();render(true);openSheet();toast('Garmin déconnecté');}}
  else if(a==='closesheet')closeSheet();
  else if(a==='export')doExport();
  else if(a==='import')doImport();
  else if(a==='reset')doReset();
});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t&&/^rc-/.test(t.id||'')){
    var rp=state.ui.race=state.ui.race||{},k=t.id.slice(3),v=t.value.trim();
    if(k==='goal'){var g=parseHM(v);if(g)rp.goal=g;else delete rp.goal;}
    else{var nv=parseFloat(v.replace(',','.'));if(isFinite(nv)&&nv>=0)rp[k]=nv;else delete rp[k];}
    save();render(true);return;
  }
  if(t&&/^vt-[ab]-/.test(t.id||'')&&vtDraft){vtSlide(t);renderVt();return;}   // curseur relâché : aperçu et alertes à jour
  if(t&&(t.id==='away-from'||t.id==='away-to')&&awayDraft){awayDraft[t.id==='away-from'?'from':'to']=t.value;awayDraft.touched=true;if(awayDraft.to<awayDraft.from)awayDraft.to=awayDraft.from;renderAway();return;}
  if(t&&(t.id==='dfrom'||t.id==='dto')){
    var f=state.ui.dflt=state.ui.dflt||{m:'custom'};
    f[t.id==='dfrom'?'from':'to']=t.value;f.m='custom';dsel=null;save();render(true);
  }
});
document.addEventListener('keydown',function(e){
  if(!tpCur)return;
  if(e.key==='Escape'){tpClose();return;}
  if(e.key==='Enter'){e.preventDefault();tpOk();return;}
  var wl=e.target&&e.target.classList&&e.target.classList.contains('tw-list')?e.target:null;
  if(wl&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();wl.scrollTop+=e.key==='ArrowUp'?-40:40;}
});
document.addEventListener('input',function(e){
  if(e.target&&vtSlide(e.target))return;
  if(e.target&&e.target.id==='wz-key'){var prev=wz.key||'';wz.key=e.target.value;if(!wz.busy&&wz.key.trim().length>=20&&prev.length<5){setTimeout(function(){if(wz.step===3&&!wz.busy&&!wz.res)wzVerify();},250);}return;}
  if(e.target&&e.target.id==='st-dist'&&stepDraft){stepDraft.distKm=e.target.value;var spv=document.getElementById('st-pv');if(spv)spv.innerHTML=stepPvHtml(stepDraft);return;}
  if(e.target&&e.target.id==='st-q'&&stepDraft){
    var sd=stepDraft,sq=e.target.value,sres=document.getElementById('st-res');sd.q=sq;sd.name=sq;sd.res=stepSearch(sq);sd.load=false;
    if(sd.picked){sd.picked=false;var shp=document.getElementById('st-help');if(shp)shp.textContent='Pas dans la liste ? Garde simplement le nom que tu as tapé : ça marche pour n’importe quelle course.';}
    clearTimeout(stepQT);
    if(sq.trim().length>=3){
      var sseq=++stepQS;sd.load=true;
      stepQT=setTimeout(function(){remoteRaces(sq.trim(),function(list){if(sseq!==stepQS||stepDraft!==sd)return;sd.load=false;sd.res=sd.res.concat(list.map(function(r){return Object.assign(r,{kind:'tri'});}).filter(function(r){return !sd.res.some(function(c){return normS(c.name)===normS(r.name);});})).slice(0,12);var el=document.getElementById('st-res');if(el)el.innerHTML=stepResHtml(sd);});},400);
    }
    if(sres)sres.innerHTML=stepResHtml(sd);
    return;
  }
  if(e.target&&e.target.id==='rf-q'&&raceDraft){
    var qd=raceDraft,qv=e.target.value;qd.q=qv;qd.name=qv;qd.cres=catSearch(qv);qd.rres=[];qd.rload=false;
    if(qd.picked){qd.picked=false;var hp=e.target.parentNode&&e.target.parentNode.querySelector('p.small');if(hp)hp.textContent='Pas dans la liste ? Garde simplement le nom que tu as tapé : ça marche pour n’importe quelle course.';}
    var qr=document.getElementById('rf-res');if(qr)qr.innerHTML=raceResultsHtml(qd);
    clearTimeout(raceQT);
    if(qv.trim().length>=3){
      var seq=++raceQSeq;qd.rload=true;if(qr)qr.innerHTML=raceResultsHtml(qd);
      raceQT=setTimeout(function(){remoteRaces(qv.trim(),function(list){if(seq!==raceQSeq||!raceDraft)return;raceDraft.rload=false;if(!list.length&&!raceDraft.cres.length)track('search_miss',qv.trim());raceDraft.rres=list.filter(function(r){return !raceDraft.cres.some(function(c){return normS(c.name)===normS(r.name);});}).slice(0,6);var el=document.getElementById('rf-res');if(el)el.innerHTML=raceResultsHtml(raceDraft);});},400);
    }
    return;
  }
  if(e.target&&/^rf-/.test(e.target.id||'')&&raceDraft){var rk={'rf-name':'name','rf-swim':'swimKm','rf-bike':'bikeKm','rf-run':'runKm','rf-bup':'bikeUp','rf-rup':'runUp'}[e.target.id];if(rk){raceDraft[rk]=e.target.value;raceDraft.detail=raceDraft.detail||/bup|rup/.test(e.target.id);if(/swim|bike|run/.test(e.target.id)&&!/bup|rup/.test(e.target.id)){var b=document.querySelector('[data-act=racesave]');if(b){var okc=raceDraft.date&&parseFloat(String(raceDraft.swimKm).replace(',','.'))>0&&parseFloat(String(raceDraft.bikeKm).replace(',','.'))>0&&parseFloat(String(raceDraft.runKm).replace(',','.'))>0;b.disabled=!okc;b.style.opacity=okc?'':'.4';}}}return;}
  if(e.target&&/^sv-/.test(e.target.id||'')){
    var svs=state.sv,sval=e.target.value.trim();
    if(e.target.id==='sv-url'){
      if(sval.indexOf('|')>0){var sp2=sval.split('|');svs.url=sp2[0].trim().replace(/\/+$/,'');svs.key=(sp2[1]||'').trim();document.getElementById('sv-url').value=svs.url;document.getElementById('sv-key').value=svs.key;}
      else svs.url=sval.replace(/\/+$/,'');
    }else{svs.key=sval;if(!svs.url)svs.url=PUB_API;}
    svs.t=0;save();return;
  }
  if(e.target&&e.target.id==='lv-bike-d'){lvInput('bike','d',e.target.value);return;}
  if(e.target&&/^pf-/.test(e.target.id||'')){
    var p=state.ui.prof=state.ui.prof||{},k=e.target.id.slice(3),v=e.target.value;
    p[k]=(k==='thr'||k==='css')?parseT(v):(parseInt(v,10)||0);
    save();render(true);return;
  }
});
/* Semaine : balayage gauche / droite pour changer de semaine (les flèches restent) */
(function(){
  var sx=0,sy=0,st=0,ok=false;
  document.addEventListener('touchstart',function(e){
    var t=e.touches&&e.touches[0],w=window.innerWidth||390;
    ok=!!t&&e.touches.length===1&&tab==='week'&&!document.getElementById('sheetbg').classList.contains('on')&&t.clientX>24&&t.clientX<w-24&&!(e.target.closest&&e.target.closest('input,textarea,select,svg[data-ch]'));
    if(ok){sx=t.clientX;sy=t.clientY;st=Date.now();}
  },{passive:true});
  document.addEventListener('touchend',function(e){
    if(!ok)return;ok=false;
    var t=e.changedTouches&&e.changedTouches[0];if(!t)return;
    var dx=t.clientX-sx,dy=t.clientY-sy;
    if(Date.now()-st>700||Math.abs(dx)<60||Math.abs(dx)<1.6*Math.abs(dy))return;
    var nw=Math.max(1,Math.min(NW,wv+(dx<0?1:-1)));
    if(nw===wv)return;
    wv=nw;render(false);
    var vw=document.getElementById('view');vw.className=dx<0?'slide-l':'slide-r';
  },{passive:true});
})();
/* Tirer vers le bas en haut de page pour actualiser (recharge l'app : données du compte, activités Garmin, nouvelle version).
   Remplace le geste natif, absent de l'app installée et coupé ailleurs par overscroll-behavior. Pas dans une fenêtre ni pendant une saisie. */
(function(){
  var y0=null,x0=0,pull=0,on=false,busy=false,el=null,TH=64,MAX=96;
  function ind(){
    if(!el){el=document.createElement('div');el.id='ptr';el.setAttribute('aria-hidden','true');
      el.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/></svg>';
      document.body.appendChild(el);}
    return el;
  }
  function show(p){var e=ind(),k=Math.min(p/TH,1);e.style.transition=on?'none':'';e.style.opacity=k;e.style.transform='translate(-50%,'+(p-44)+'px) rotate('+Math.round(p*3)+'deg)';e.classList.toggle('ready',p>=TH);}
  function hide(){if(!el)return;el.style.transition='';el.style.opacity=0;el.style.transform='translate(-50%,-44px)';el.classList.remove('ready');}
  document.addEventListener('touchstart',function(e){
    var t=e.touches&&e.touches[0];
    on=false;y0=null;
    if(busy||!t||e.touches.length!==1||(window.scrollY||document.documentElement.scrollTop)>0||document.getElementById('sheetbg').classList.contains('on')||typing()||(e.target.closest&&e.target.closest('input,textarea,select,svg[data-ch]')))return;
    y0=t.clientY;x0=t.clientX;pull=0;
  },{passive:true});
  document.addEventListener('touchmove',function(e){
    if(y0==null)return;
    var t=e.touches[0],dy=t.clientY-y0,dx=Math.abs(t.clientX-x0);
    if(!on){if(dy<10)return;if(dx>dy||(window.scrollY||0)>0){y0=null;return;}on=true;}
    pull=Math.min(MAX,Math.max(0,dy*0.5));show(pull);
  },{passive:true});
  function end(){
    if(y0==null||!on){y0=null;on=false;return;}
    y0=null;on=false;
    if(pull<TH){hide();return;}
    busy=true;var e=ind();e.style.transition='';e.style.transform='translate(-50%,'+(TH-44)+'px)';e.classList.add('spin');
    setTimeout(function(){location.reload();},250);
  }
  document.addEventListener('touchend',end,{passive:true});
  document.addEventListener('touchcancel',function(){y0=null;on=false;hide();},{passive:true});
})();
document.getElementById('sheetbg').addEventListener('click',function(e){if(e.target.id==='sheetbg'){if(state.ui.welcomed===undefined){state.ui.welcomed=true;save();}closeSheet();}});
document.getElementById('sheet').addEventListener('toggle',function(e){var d=e.target;if(d&&d.getAttribute&&d.getAttribute('data-fold'))sheetFold[d.getAttribute('data-fold')]=d.open;},true);

function pv(k){var p=state.ui.prof||{};return p[k]?(k==='thr'||k==='css'?mmss(p[k]):p[k]):'';}
var sheetFold={};
function foldHtml(id,icon,title,sub,body,open,tint){
  var o=sheetFold[id]!==undefined?sheetFold[id]:!!open;
  return '<details class="fold" name="reglages" data-fold="'+id+'"'+(o?' open':'')+'><summary><span class="mi'+(tint?' t-'+tint:'')+'">'+ic(icon,18)+'</span><span>'+title+'<small>'+sub+'</small></span></summary><div class="fbody">'+body+'</div></details>';
}
function openSheet(){
  var sh=document.getElementById('sheet'),linked=!!(state.sv.url&&state.sv.key),grp=function(title,rows){return '<div class="eyebrow sgl">'+title+'</div><div class="scard">'+rows+'</div>';};
  sh.innerHTML='<div class="row shead"><h2>Réglages</h2><span class="sp"></span><button class="iconbtn" data-act="closesheet" aria-label="Fermer" style="background:var(--card3)">'+ic('left',22).replace('m15 18-6-6 6-6','M18 6 6 18M6 6l12 12')+'</button></div>'+
    grp('Ma course',foldHtml('race','race',esc(RNAME),fmtDay(RACE_DATE)+' '+RACE_DATE.getFullYear()+' · '+NW+' semaines','<p>'+esc(fmtLong(RACE_DATE))+'<br>'+FMT.n+' · '+fk(RACE.swimM)+' km · '+fk(RACE.bikeM)+' km · '+fk(RACE.runM)+' km</p><button class="btn" data-act="racechange">Changer de course</button>',false,'red'))+
    grp('Garmin',foldHtml('garmin','bike','Connexion Garmin','<i class="st-dot'+(linked?' on':'')+'"></i>'+(linked?'Connecté · '+ago(state.sv.t):'Non connecté'),svFoldHtml(),false,'green')+
      (linked?foldHtml('send','share','Envoi vers la montre','Séances structurées',pushSettings(),false,'green'):''))+
    grp('Entraînement',foldHtml('prof','gear','Mes repères','FTP, FC max, allures',
      '<p>Facultatif : saisis une valeur seulement pour remplacer le calcul automatique.'+autoSummary()+'</p>'+(lvOffered()?'<button class="btn" data-act="level" style="margin:0 0 12px">'+(lvAny()?'Modifier mon niveau (questionnaire)':'Remplir le questionnaire de niveau')+'</button>':'')+
      '<label class="inp"><span>FTP vélo<small>watts (test 20 min × 0,95)</small></span><input id="pf-ftp" inputmode="numeric" placeholder="ex. 220" value="'+esc(pv('ftp'))+'"></label>'+
      '<label class="inp"><span>FC max<small>bpm</small></span><input id="pf-fc" inputmode="numeric" placeholder="ex. 185" value="'+esc(pv('fc'))+'"></label>'+
      tpField('pf-thr','Allure seuil course','par km (≈ 10 km)')+
      tpField('pf-css','CSS natation','par 100 m'),false,'orange'))+
    grp('Compte et données',(function(){var f=accountFoldHtml();return f?foldHtml('account','home','Compte',acct()?esc(acct().email):'Non connecté',f,!acct(),'blue'):'';})()+
      (acct()?'':foldHtml('cloud','share','Sauvegarde par code',cloudCfg()?'Activée · chiffrée':'Sans compte',cloudFoldHtml(),false,'blue'))+
      foldHtml('backup','notes','Copie de sauvegarde','Exporter ou restaurer',
      '<p>Tout est enregistré automatiquement sur cet appareil. Garde une copie avant de changer de téléphone.</p>'+
      '<div class="btns"><button class="btn pri" data-act="export">Exporter</button><button class="btn" data-act="import">Importer</button></div>'+
      '<textarea id="io" style="min-height:96px;margin-top:10px" placeholder="La sauvegarde apparaît ici après « Exporter ». Pour restaurer, colle-la ici puis touche « Importer »." aria-label="Données de sauvegarde"></textarea>',false,'blue'))+
    grp('À propos',foldHtml('about','info','L’application','Installation, présentation, statistiques',
      '<p><b>Installer sur iPhone</b> : dans Safari, touche Partager, puis « Sur l’écran d’accueil ». L’app s’ouvre alors en plein écran et garde tes données hors connexion.</p>'+
      '<p class="small muted">Les volumes du plan sont indicatifs : adapte-les à ton niveau et à ta fatigue.</p>'+
      '<div class="row" style="margin:0 0 12px"><div style="flex:1"><b style="font-size:14.5px">Statistiques d’usage</b><div class="small muted">Pour améliorer l’app</div></div><button class="chip'+(statsOn()?' hl':'')+'" style="border:0;min-height:36px;padding:0 16px" data-act="togstats" aria-pressed="'+statsOn()+'">'+(statsOn()?'Activées':'Désactivées')+'</button></div>'+
      '<button class="btn" data-act="welcome">Revoir la présentation</button>',false,'grey')+(adminStats?foldHtml('stats','chart','Statistiques d’usage','Réservé au propriétaire',statsHtml(),false,'grey'):''))+
    '<button class="btn dng dng-z" data-act="reset">Tout réinitialiser</button>';
  sh.scrollTop=0;document.getElementById('sheetbg').classList.add('on');sheetRoute('settings');
}
function openWelcome(){
  var sh=document.getElementById('sheet'),linked=!!(state.sv.url&&state.sv.key);
  sh.innerHTML='<div class="wl"><div class="logo">'+ic('race',38).replace('<svg','<svg style="color:#f5f4ef"')+'</div><h2>'+esc(RNAME)+'</h2><p class="lead">Ton plan de '+NW+' semaines pour '+(IS_SABLES?'les Sables d’Olonne':'ta course')+' : chaque séance détaillée, jour par jour.</p>'+
    '<ul><li><span class="mi">'+ic('week',21)+'</span><div><b>Un plan précis, jour par jour</b><span>Zones, allures et conseils pour chaque séance de natation, vélo et course.</span></div></li>'+
    '<li><span class="mi">'+ic('check',21)+'</span><div><b>Coche tes séances</b><span>D’un geste sur le rond de chaque séance, ou toutes seules avec une montre Garmin (facultatif).</span></div></li>'+
    '<li><span class="mi">'+ic('chart',21)+'</span><div><b>Ton temps de course estimé</b><span>À partir de 3 questions rapides, ou de tes vraies sorties si tu connectes Garmin.</span></div></li></ul>'+
    '<button class="btn pri" data-act="welcomeok">C’est parti</button>'+(linked?'':'<button class="btn" data-act="welcomegarmin">J’ai une montre Garmin</button>')+'<p class="small muted" style="margin:12px 0 0">Plans indicatifs, sans avis médical. <button class="lnk" data-act="legal" style="margin:0">Mentions légales</button></p></div>';
  sh.scrollTop=0;document.getElementById('sheetbg').classList.add('on');
}
function closeSheet(){
  document.getElementById('sheetbg').classList.remove('on');
  if(!sheetKey)return;
  sheetKey=null;
  if(routing)return;
  if(sheetDepth>0){var n=sheetDepth;sheetDepth=0;try{history.go(-n);}catch(e){}}
  else syncUrl(false);
}
function payload(){return JSON.stringify({app:'triient',v:1,exported:new Date().toISOString(),done:state.done,links:state.links,prof:state.ui.prof||{},lvl:state.ui.lvl||{},steps:state.ui.steps||[],missed:state.ui.missed||{},away:state.ui.away||[],race:state.race||CFG});}
function doExport(){
  var txt=payload(),ta=document.getElementById('io');ta.value=txt;
  if(navigator.share){navigator.share({title:'Sauvegarde '+RNAME,text:txt}).catch(function(){});return;}
  try{navigator.clipboard.writeText(txt).then(function(){toast('Sauvegarde copiée dans le presse-papiers');},function(){ta.select();toast('Copie la sauvegarde affichée ci-dessous');});}
  catch(e){ta.select();toast('Copie la sauvegarde affichée ci-dessous');}
}
function doImport(){
  var ta=document.getElementById('io'),o;
  try{o=JSON.parse(ta.value);if(!o||(o.app!=='triient'&&o.app!=='ironman-sables-2027')||typeof o.done!=='object')throw 0;   /* ironman-sables-2027 : sauvegardes faites avant le changement de nom */}
  catch(e){toast('Sauvegarde invalide');return;}
  if(!confirm('Remplacer les données actuelles par cette sauvegarde ?'))return;
  state.done=o.done||{};state.links=o.links||{};if(o.prof)state.ui.prof=o.prof;if(o.lvl)state.ui.lvl=o.lvl;if(o.steps)state.ui.steps=o.steps;if(o.missed)state.ui.missed=o.missed;if(o.away){state.ui.away=o.away;applyAway();}if(o.race&&o.race.date&&o.race.start){state.race=o.race;save();location.reload();return;}save();closeSheet();render(false);toast('Sauvegarde restaurée');
}
function doReset(){
  if(!confirm('Effacer toutes les séances cochées ? Cette action est définitive.'))return;
  state.done={};state.links={};state.ui.missed={};state.ui.away=[];state.ui.steps=[];applyAway();save();closeSheet();render(false);toast('Données réinitialisées');
}

/* ---------- Niveau déclaré (sans historique Garmin) ----------
   Petit questionnaire : un temps récent par discipline, à effort soutenu (course : 5 km, 10 km ou semi ; vélo : une sortie ; natation :
   200 m à 1 500 m). Il sert de repli quand Garmin n'a pas assez de sorties : allures des séances (seuil course, CSS natation, vitesse
   vélo) et estimation du temps de course. Les vraies sorties Garmin passent toujours avant, discipline par discipline.
   Stockage : state.ui.lvl = {run:{d:mètres,t:secondes}, bike:{d:mètres,t:secondes}, swim:{d:mètres,t:secondes}}. */
var LV_RUN=[[5000,'5 km'],[10000,'10 km'],[21097,'Semi']],LV_SWIM=[[200,'200 m'],[400,'400 m'],[1000,'1 000 m'],[1500,'1 500 m']];
function lvGet(k){
  var l=(state.ui.lvl||{})[k];if(!l||!(l.d>0)||!(l.t>0))return null;
  var q=k==='run'?l.t/(l.d/1000):k==='swim'?l.t/l.d*100:l.d/l.t*3.6;
  return (k==='bike'?(q>=8&&q<=50):k==='run'?(q>=150&&q<=600):(q>=50&&q<=300))?l:null;
}
// Le questionnaire n'est proposé que sans Garmin connecté avec des activités
function lvOffered(){var sv=state.sv||{};return !(sv.url&&sv.key&&dataActs().length);}
function lvAny(){return !!(lvGet('run')||lvGet('bike')||lvGet('swim'));}
function lvT(t){t=Math.round(t);return t>=3600?Math.floor(t/3600)+':'+('0'+Math.floor(t%3600/60)).slice(-2)+':'+('0'+t%60).slice(-2):mmss(t);}
function lvTxt(k,l){return (l.d>=1000?fk(l.d)+' km':l.d+' m')+' en '+(k==='bike'?hms(l.t):lvT(l.t));}
function lvPace(k,l){return k==='run'?mmss(l.t/(l.d/1000))+' /km':k==='swim'?mmss(l.t/l.d*100)+' /100 m':(l.d/l.t*3.6).toFixed(1).replace('.',',')+' km/h';}
function riegel(l,D){return l.t*Math.pow(D/l.d,D>21200&&l.d<=21200?1.08:1.06);}
// Temps de course d'une discipline d'après le questionnaire (mêmes pénalités et scénarios que l'estimation Garmin)
function declRace(k,P,sc){
  var l=lvGet(k);if(!l)return null;
  var b0='d’après ton questionnaire ('+lvTxt(k,l)+')';
  if(k==='swim')return {t:riegel(l,RACE.swimM)*1.05*(P.wet?0.97:1)*sc.sw,n:0,conf:'faible',basis:b0+', projeté sur '+fk(RACE.swimM)+' km, +5 % (eau libre, repérage)'+(P.wet?', −3 % combinaison':'')};
  if(k==='run'){
    var vr=Math.max(1000/510,Math.min(1000/270,RACE.runM/riegel(l,RACE.runM)));
    return {t:RACE.runM/vr*sc.rn,n:0,conf:'faible',basis:b0+', projeté sur '+RUNLBL+' ; allure ralentie de '+Math.round((sc.rn-1)*100)+' % (fatigue du vélo, ravitaillements)'};
  }
  var v=l.d/l.t*3.6*Math.max(0.82,Math.min(1.08,Math.pow(l.d/RACE.bikeM,0.06)));
  v=Math.max(14,Math.min(40,v))*sc.bk;
  return {t:RACE.bikeM/(v/3.6)*(1+0.03*FF)+240*FF,n:0,conf:'faible',basis:b0+', projeté sur '+fk(RACE.bikeM)+' km'+(FF>=0.5?' ; +'+Math.round(3*FF*10)/10+' % d’endurance, '+Math.round(4*FF)+' min d’arrêts':'')};
}
// Repères d'allure déduits du questionnaire : seuil course (≈ 10 km) et CSS natation (≈ 1 500 m), au format des repères saisis à la main
var DPc={k:'',v:{}};
function declProf(){
  var k=JSON.stringify(state.ui.lvl||{});if(DPc.k===k)return DPc.v;
  var o={},r=lvGet('run'),s=lvGet('swim');
  if(r)o.thr=Math.round(riegel(r,10000)/10);
  if(s)o.css=Math.round(riegel(s,1500)/15);
  DPc={k:k,v:o};return o;
}
function effProf(ap){var p=state.ui.prof||{};return ap?p:Object.assign({},declProf(),p);}   // repères saisis > Garmin > questionnaire
function declBikeIm(){var d=declRace('bike',raceParams(),RSCEN.real);return d?RACE.bikeM/d.t*3.6:0;}
function lvOut(){
  var P=raceParams(),sc=RSCEN.real,r=declRace('run',P,sc),b=declRace('bike',P,sc),s=declRace('swim',P,sc),rows=[];
  if(s)rows.push(['swim','Natation',paceOf('swim',s.t),s.t]);
  if(b)rows.push(['bike','Vélo',paceOf('bike',b.t),b.t]);
  if(r)rows.push(['run','Course à pied',paceOf('run',r.t),r.t]);
  if(!rows.length)return '<p class="small muted" style="margin:0">Remplis au moins une discipline pour voir ce que l’app en déduit.</p>';
  var h=rows.map(function(x){return '<div class="spr sp-'+x[0]+'"><div class="ico">'+ic(x[0],20)+'</div><div class="bd"><div class="pr-h" style="margin:0"><b>'+x[1]+'</b><span>'+x[2]+' · '+hms(x[3])+'</span></div></div></div>';}).join('');
  if(r&&b&&s)h+='<p class="small muted" style="margin:10px 0 0">Temps de course estimé (scénario réaliste, transitions comprises) : <b style="color:var(--t1)">'+hms(s.t+b.t+r.t+P.t1*60+P.t2*60)+'</b>.</p>';
  else h+='<p class="small muted" style="margin:10px 0 0">Remplis les trois disciplines pour obtenir un temps de course total.</p>';
  return h;
}
function lvChips(k,list){
  var l=(state.ui.lvl||{})[k]||{};
  return '<div class="rng" role="group" aria-label="Distance de référence">'+list.map(function(x){return '<button data-act="lvd" data-k="'+k+'" data-v="'+x[0]+'" aria-pressed="'+(l.d===x[0])+'">'+x[1]+'</button>';}).join('')+'</div>';
}
/* ---------- Sélecteur de durée à molettes (comme les alarmes de l'iPhone) ----------
   Un champ = un bouton qui affiche la valeur ; il ouvre une feuille avec une molette par unité. Valeurs en secondes.
   tpCfg décrit chaque champ : unités et bornes, valeur actuelle, valeur proposée quand c'est vide, enregistrement. */
var TPU={h:['h','heures'],m:['min','minutes'],s:['s','secondes']},tpCur=null;
function tpCfg(id){
  var ui=state.ui,rc=ui.race||{},L=ui.lvl||{},pf=ui.prof||{},lv=function(k){return L[k]&&L[k].t>0?L[k].t:0;},lvSet=function(k){return function(t){lvInput(k,'t',t);};};
  var rcSet=function(f){return function(t){var r=ui.race=ui.race||{};f(r,t);save();render(true);};},pfSet=function(k){return function(t){var p=ui.prof=ui.prof||{};if(t>0)p[k]=t;else delete p[k];save();render(true);};};
  if(id==='rc-goal')return {t:'Ton objectif de temps',u:{h:[0,30],m:[0,59]},v:rc.goal||0,def:({full:48600,half:19800,olympic:9000,sprint:4800})[FCLS],set:rcSet(function(r,t){if(t>0)r.goal=t;else delete r.goal;})};
  if(id==='lv-run')return {t:'Course à pied · ton temps',u:(L.run||{}).d>=21000?{h:[0,5],m:[0,59],s:[0,59]}:{m:[0,99],s:[0,59]},v:lv('run'),def:(L.run||{}).d>=21000?7200:(L.run||{}).d>=10000?3000:1500,set:lvSet('run')};
  if(id==='lv-bike')return {t:'Vélo · durée',u:{h:[0,12],m:[0,59]},v:lv('bike'),def:5400,set:lvSet('bike')};
  if(id==='lv-swim')return {t:'Natation · ton temps',u:{m:[0,59],s:[0,59]},v:lv('swim'),def:({200:225,400:450,1000:1200,1500:1800})[(L.swim||{}).d]||450,set:lvSet('swim')};
  if(id==='pf-thr')return {t:'Allure seuil course (par km)',u:{m:[2,9],s:[0,59]},v:pf.thr||0,def:290,set:pfSet('thr')};
  if(id==='pf-css')return {t:'CSS natation (par 100 m)',u:{m:[0,4],s:[0,59]},v:pf.css||0,def:110,set:pfSet('css')};
  if(id==='rc-t1'||id==='rc-t2'){
    var k=id.slice(3),P=raceParams();
    return {t:'Transition '+k.toUpperCase(),u:{m:[0,30]},v:Math.round(P[k]*60),def:0,zero:true,clearLbl:'Par défaut',set:rcSet(function(r,t){r[k]=t/60;}),clear:rcSet(function(r){delete r[k];})};
  }
  return null;
}
function tpSplit(u,t){var o={},r=Math.round(t);if(u.h){o.h=Math.floor(r/3600);r-=o.h*3600;}if(u.m){o.m=Math.floor(r/60);r-=o.m*60;}if(u.s)o.s=r;return o;}
function tpTxt(c){
  if(!c.v&&!c.zero)return 'Choisir';
  var o=tpSplit(c.u,c.v);
  if(c.u.h&&c.u.m&&!c.u.s)return fh(c.v/60);
  return Object.keys(c.u).map(function(f,n){return (n===0?o[f]:('0'+o[f]).slice(-2))+' '+TPU[f][0];}).join(' ');
}
function tpField(id,label,hint){
  var c=tpCfg(id);
  return '<div class="inp tp-f"><span>'+label+'<small>'+hint+'</small></span><button type="button" class="tval'+(!c.v&&!c.zero?' unset':'')+'" id="tp-'+id+'" data-act="tpick" data-id="'+id+'" aria-haspopup="dialog">'+tpTxt(c)+'</button></div>';
}
function tpEl(){
  var bg=document.getElementById('tpbg');if(bg)return bg;
  bg=document.createElement('div');bg.id='tpbg';bg.className='tp-bg';
  bg.innerHTML='<div class="tp" role="dialog" aria-modal="true" aria-labelledby="tp-title"><div class="tp-h"><button type="button" data-act="tpclear" id="tp-clear"></button><b id="tp-title"></b><button type="button" class="ok" data-act="tpok">OK</button></div><div class="tp-w" id="tp-w"></div></div>';
  bg.addEventListener('click',function(e){if(e.target===bg)tpClose();});
  var w=bg.querySelector('#tp-w');
  w.addEventListener('scroll',function(e){if(e.target.classList&&e.target.classList.contains('tw-list'))tpMark(e.target);},true);
  w.addEventListener('click',function(e){var it=e.target.closest&&e.target.closest('.tw-item');if(it)it.parentNode.scrollTo({top:Array.prototype.indexOf.call(it.parentNode.children,it)*40,behavior:'smooth'});});
  document.body.appendChild(bg);
  return bg;
}
function tpIdx(wl){return Math.max(0,Math.min(wl.children.length-1,Math.round(wl.scrollTop/40)));}
function tpMark(wl){var i=tpIdx(wl);if(wl.getAttribute('data-i')===String(i))return;wl.setAttribute('data-i',i);Array.prototype.forEach.call(wl.children,function(c,j){c.classList.toggle('on',j===i);if(j===i)c.setAttribute('aria-selected','true');else c.removeAttribute('aria-selected');});}
function tpOpen(id){
  var c=tpCfg(id);if(!c)return;
  var bg=tpEl(),o=tpSplit(c.u,c.v||c.def||0),clr=bg.querySelector('#tp-clear'),w=bg.querySelector('#tp-w');
  tpCur=id;
  bg.querySelector('#tp-title').textContent=c.t;
  clr.textContent=c.clearLbl||'Effacer';clr.style.visibility=(c.v||c.clear)?'visible':'hidden';
  w.innerHTML=Object.keys(c.u).map(function(f,n){
    var r=c.u[f],h='',v;
    for(v=r[0];v<=r[1];v++)h+='<div class="tw-item" role="option">'+(n===0?v:('0'+v).slice(-2))+'</div>';
    return '<div class="tw-col"><div class="tw-list" tabindex="0" role="listbox" aria-label="'+TPU[f][1]+'" data-f="'+f+'" data-min="'+r[0]+'">'+h+'</div><span class="tw-unit">'+TPU[f][0]+'</span></div>';
  }).join('');
  bg.classList.add('on');
  Array.prototype.forEach.call(w.querySelectorAll('.tw-list'),function(wl){
    var f=wl.getAttribute('data-f'),r=c.u[f];
    wl.scrollTop=(Math.max(r[0],Math.min(r[1],o[f]))-r[0])*40;tpMark(wl);
  });
  var first=w.querySelector('.tw-list');if(first)first.focus({preventScroll:true});
}
function tpClose(){
  var bg=document.getElementById('tpbg'),id=tpCur;if(!bg||!id)return;
  bg.classList.remove('on');tpCur=null;
  var b=document.getElementById('tp-'+id);if(b)b.focus({preventScroll:true});
}
function tpSync(id){var b=document.getElementById('tp-'+id),c=tpCfg(id);if(b&&c){b.textContent=tpTxt(c);b.classList.toggle('unset',!c.v&&!c.zero);}}
function tpOk(){
  var id=tpCur,c=id&&tpCfg(id);if(!c)return;
  var t=0;
  Array.prototype.forEach.call(document.querySelectorAll('#tp-w .tw-list'),function(wl){t+=(+wl.getAttribute('data-min')+tpIdx(wl))*({h:3600,m:60,s:1})[wl.getAttribute('data-f')];});
  tpClose();c.set(t);tpSync(id);
}
function tpClear(){
  var id=tpCur,c=id&&tpCfg(id);if(!c)return;
  tpClose();if(c.clear)c.clear();else c.set(0);tpSync(id);
}
function lvTinHint(d){return d>=21000?'sur le semi':d>=10000?'sur 10 km':'sur 5 km';}
function lvRunTin(){return tpField('lv-run','Ton temps',lvTinHint(((state.ui.lvl||{}).run||{}).d));}
function openLevel(){
  var L=state.ui.lvl||{},bk=L.bike||{},h='';
  h+='<p class="small muted" style="margin:0 0 16px">Pas de Garmin, ou pas assez de sorties ? Donne un temps récent sur chaque discipline (effort soutenu, pas un sprint). Tout est facultatif. L’app en déduit tes allures et une estimation de ton temps de course. Tes vraies sorties Garmin les remplacent dès qu’il y en a assez.</p>';
  h+='<div class="rsec"><div class="eyebrow">Course à pied</div>'+lvChips('run',LV_RUN)+'<div id="lv-run-tw">'+lvRunTin()+'</div><div class="small muted" id="lv-run-o"></div></div>';
  h+='<div class="rsec"><div class="eyebrow">Vélo</div><label class="inp"><span>Distance d’une sortie récente<small>km, à rythme soutenu mais tenable</small></span><input id="lv-bike-d" inputmode="decimal" autocomplete="off" placeholder="40" value="'+(bk.d>0?esc(String(bk.d/1000).replace('.',',')):'')+'"></label>'+tpField('lv-bike','Durée','de cette sortie')+'<div class="small muted" id="lv-bike-o"></div></div>';
  h+='<div class="rsec"><div class="eyebrow">Natation</div>'+lvChips('swim',LV_SWIM)+''+tpField('lv-swim','Ton temps','en bassin, sans pause')+'<div class="small muted" id="lv-swim-o"></div></div>';
  h+='<div class="rsec"><div class="eyebrow">Ce que l’app en déduit</div><div id="lv-out"></div></div>';
  h+='<div class="btns"><button class="btn pri" data-act="closesheet">Terminé</button><button class="btn" data-act="lvclear">Tout effacer</button></div>';
  showSheet('Mon niveau','Estime tes allures sans Garmin',h);sheetRoute('level');
  lvRefresh(true);
}
function lvRefresh(noRender){
  var L=state.ui.lvl||{};
  ['run','bike','swim'].forEach(function(k){
    var l=L[k],ok=lvGet(k),el=document.getElementById('lv-'+k+'-o');
    if(el)el.textContent=ok?'≈ '+lvPace(k,ok):(l&&l.d>0&&l.t>0?'Valeur peu probable : vérifie le temps et la distance.':'');
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-act=lvd]'),function(b){var l=L[b.getAttribute('data-k')];b.setAttribute('aria-pressed',String(!!l&&l.d===+b.getAttribute('data-v')));});
  var o=document.getElementById('lv-out');if(o)o.innerHTML=lvOut();
  if(!noRender)render(true);
}
function lvInput(k,f,v){
  var L=state.ui.lvl=state.ui.lvl||{},l=L[k]=L[k]||{};
  if(k==='bike'){if(f==='d'){var n=parseFloat(String(v).replace(',','.'));l.d=n>0?Math.round(n*1000):0;}else l.t=v;}
  else{if(!l.d)l.d=k==='run'?5000:400;l.t=v;}
  if(!(l.d>0)&&!(l.t>0))delete L[k];
  save();lvRefresh();
}

/* ---------- Estimation du temps de course (IRONMAN full distance) ----------
   Natation : allure médiane de tes nages ≥ 1 km. Vélo et course : régression vitesse = f(FC moyenne, dénivelé/km)
   sur tes sorties des 26 dernières semaines, prédite à la FC cible d’Ironman et au relief du parcours, puis
   pénalités de fatigue (endurance sur 178 km, marathon après le vélo) selon le scénario. Pas de puissance : tout repose sur la FC. */
var FF=FMT.fat||1;      // les pénalités de fatigue (endurance vélo, course après le vélo) sont celles de l'Ironman, réduites pour les formats courts
var RSCEN={prud:{n:'Prudent',sw:1.06,bk:0.94,rn:1+0.22*FF},real:{n:'Réaliste',sw:1,bk:1,rn:1+0.12*FF},ambi:{n:'Ambitieux',sw:0.96,bk:1.05,rn:1+0.06*FF}};
function raceParams(){
  var p=state.ui.race||{},m=state.sv&&state.sv.meta||{},lt=m.lthr||(m.maxhr?Math.round(m.maxhr*0.9):172);
  return {bikeUp:p.bikeUp!==undefined?p.bikeUp:(CFG.bikeUp==null?null:CFG.bikeUp),runUp:p.runUp!==undefined?p.runUp:(CFG.runUp==null?null:CFG.runUp),hrB:p.hrB||Math.round(lt*FMT.hr[0]),hrR:p.hrR||Math.round(lt*FMT.hr[1]),
    wet:p.wet!==false,scen:p.scen||'real',t1:p.t1!==undefined?p.t1:({sprint:2,olympic:3,half:5,full:6})[FCLS],t2:p.t2!==undefined?p.t2:({sprint:1,olympic:2,half:3,full:4})[FCLS],goal:p.goal||0,lt:lt};
}
function medianOf(a){var s=a.slice().sort(function(x,y){return x-y;}),n=s.length;return n?(n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2):0;}
function solve3(A,B){
  var M=A.map(function(r,i){return r.concat([B[i]]);}),i,j,k;
  for(i=0;i<3;i++){
    var p=i;for(j=i+1;j<3;j++)if(Math.abs(M[j][i])>Math.abs(M[p][i]))p=j;
    if(Math.abs(M[p][i])<1e-9)return null;
    var t=M[i];M[i]=M[p];M[p]=t;
    for(j=i+1;j<3;j++){var f=M[j][i]/M[i][i];for(k=i;k<4;k++)M[j][k]-=f*M[i][k];}
  }
  var x=[0,0,0];
  for(i=2;i>=0;i--){var s=M[i][3];for(j=i+1;j<3;j++)s-=M[i][j]*x[j];x[i]=s/M[i][i];}
  return x;
}
// Poids d’une activité : divisé par 2 toutes les 8 semaines (les allures cibles suivent ta forme récente)
function wtOf(a,base){return Math.pow(0.5,Math.max(0,base-dayIdx(a))/56);}
function wMedian(vals,ws){
  var a=vals.map(function(v,i){return [v,ws[i]];}).sort(function(x,y){return x[0]-y[0];}),tot=0,acc=0,i;
  a.forEach(function(p){tot+=p[1];});
  for(i=0;i<a.length;i++){acc+=a[i][1];if(acc>=tot/2)return a[i][0];}
  return a.length?a[a.length-1][0]:0;
}
function fitLin(rows){
  var n=rows.length;if(n<8)return null;
  var A=[[0,0,0],[0,0,0],[0,0,0]],B=[0,0,0],ym=0,sw=0,i,j;
  rows.forEach(function(r){var w=r[3]===undefined?1:r[3],x=[1,r[1],r[2]];for(i=0;i<3;i++){for(j=0;j<3;j++)A[i][j]+=w*x[i]*x[j];B[i]+=w*x[i]*r[0];}ym+=w*r[0];sw+=w;});
  var c=solve3(A,B);if(!c)return null;
  ym/=sw;var sst=0,sse=0;
  rows.forEach(function(r){var w=r[3]===undefined?1:r[3],p=c[0]+c[1]*r[1]+c[2]*r[2];sse+=w*(r[0]-p)*(r[0]-p);sst+=w*(r[0]-ym)*(r[0]-ym);});
  return {c:c,r2:sst>0?1-sse/sst:0,n:n};
}
function estRace(all,P,cut){
  var base=cut===null||cut===undefined?idxOfDate(today()):cut,sc=RSCEN[P.scen]||RSCEN.real,out={};
  var win=all.filter(function(a){var d=dayIdx(a);return d<=base&&d>base-182;});
  // natation
  var sw=win.filter(function(a){return /Swim/.test(a.t)&&a.m>=1500&&a.d>0;});
  if(sw.length<3)sw=win.filter(function(a){return /Swim/.test(a.t)&&a.m>=1000&&a.d>0;});
  if(sw.length>=3){
    var sp=wMedian(sw.map(function(a){return a.d/a.m*100;}),sw.map(function(a){return wtOf(a,base);})),st=RACE.swimM/100*sp*1.05*(P.wet?0.97:1)*sc.sw;
    out.swim={t:st,n:sw.length,conf:sw.length>=6?'bonne':'moyenne',basis:'allure médiane (récentes d’abord) de tes '+sw.length+' nages ≥ 1 km ('+mmss(sp)+' /100 m), +5 % (eau libre, repérage, '+fk(RACE.swimM)+' km d’affilée)'+(P.wet?', −3 % combinaison':'')};
  }
  // vélo
  var rb=win.filter(function(a){return a.t!=='VirtualRide'&&/Ride/.test(a.t)&&a.m>=15000&&a.d>=2700&&a.h>0;}).map(function(a){return [a.m/a.d*3.6,a.h,a.z/a.m*1000,wtOf(a,base)];});
  if(rb.length>=3){
    var eB=P.bikeUp==null?medianOf(rb.map(function(r){return r[2];})):P.bikeUp/(RACE.bikeM/1000),fb=fitLin(rb),v,basis,good=fb&&fb.c[1]>0.02&&fb.r2>0.15;
    if(good){v=fb.c[0]+fb.c[1]*P.hrB+fb.c[2]*eB;basis='régression FC / dénivelé (sorties récentes pondérées) sur '+rb.length+' sorties, à '+P.hrB+' bpm et '+Math.round(eB*10)/10+' m/km de D+';}
    else{v=wMedian(rb.map(function(r){return r[0];}),rb.map(function(r){return r[3];}));basis='vitesse médiane de tes '+rb.length+' sorties ('+v.toFixed(1).replace('.',',')+' km/h), données insuffisantes pour une régression';}
    v=Math.max(22,Math.min(38,v))*sc.bk;
    var bt=RACE.bikeM/(v/3.6)*(1+0.03*FF)+240*FF;
    out.bike={t:bt,n:rb.length,conf:good&&rb.length>=15&&fb.r2>=0.35?'bonne':rb.length>=8?'moyenne':'faible',basis:basis+(FF>=0.5?' ; +'+Math.round(3*FF*10)/10+' % d’endurance sur '+fk(RACE.bikeM)+' km, '+Math.round(4*FF)+' min d’arrêts':'')};
  }
  // course à pied (marathon après le vélo)
  var rr=win.filter(function(a){return a.t!=='VirtualRun'&&/Run/.test(a.t)&&a.m>=4000&&a.d>=1500&&a.h>0;}).map(function(a){return [a.m/a.d,a.h,a.z/a.m*1000,wtOf(a,base)];});
  if(rr.length>=3){
    var eR=P.runUp==null?medianOf(rr.map(function(r){return r[2];})):P.runUp/(RACE.runM/1000),fr=fitLin(rr),vr,basisR,goodR=fr&&fr.c[1]>0.005&&fr.r2>0.15;
    if(goodR){vr=fr.c[0]+fr.c[1]*P.hrR+fr.c[2]*eR;basisR='régression FC / dénivelé (sorties récentes pondérées) sur '+rr.length+' sorties, à '+P.hrR+' bpm et '+Math.round(eR*10)/10+' m/km de D+';}
    else{vr=wMedian(rr.map(function(r){return r[0];}),rr.map(function(r){return r[3];}));basisR='allure médiane de tes '+rr.length+' sorties ('+mmss(1000/vr)+' /km), données insuffisantes pour une régression';}
    vr=Math.max(1000/510,Math.min(1000/270,vr));
    var rt=RACE.runM/vr*sc.rn;
    out.run={t:rt,n:rr.length,conf:goodR&&rr.length>=15&&fr.r2>=0.35?'bonne':rr.length>=8?'moyenne':'faible',basis:basisR+' ; allure ralentie de '+Math.round((sc.rn-1)*100)+' % (fatigue du vélo, ravitaillements)'};
  }
  if(cut===null||cut===undefined)['swim','bike','run'].forEach(function(k){if(!out[k]){var dk=declRace(k,P,sc);if(dk)out[k]=dk;}});
  out.t1=P.t1*60;out.t2=P.t2*60;
  out.total=out.swim&&out.bike&&out.run?out.swim.t+out.bike.t+out.run.t+out.t1+out.t2:null;
  return out;
}
function estAll(all,P,cut){var r={};Object.keys(RSCEN).forEach(function(k){r[k]=estRace(all,Object.assign({},P,{scen:k}),cut);});return r;}
function gapTxt(s){return hms(Math.max(60,Math.abs(s)));}
function hms(s){return fh(s/60);}
function parseHM(s){var m=/^\s*(\d{1,2})\s*[:hH]\s*(\d{1,2})?\s*$/.exec(s||'');return m?(+m[1])*3600+(+(m[2]||0))*60:0;}
function paceOf(k,t){return k==='swim'?mmss(t/RACE.swimM*100)+' /100 m':k==='bike'?(RACE.bikeM/t*3.6).toFixed(1).replace('.',',')+' km/h':mmss(t/RACE.runM*1000)+' /km';}
function evoChart(pts){
  var W=340,H=140,L=34,B=20,T=8,R=10,n=pts.length,mn=1e9,mx=0,i;
  pts.forEach(function(p){mn=Math.min(mn,p.t);mx=Math.max(mx,p.t);});
  var lo=Math.floor(mn/3600)-0.5,hi=Math.ceil(mx/3600)+0.5,x=function(i){return n>1?L+i*(W-L-R)/(n-1):L+(W-L-R)/2;},y=function(t){return T+(H-T-B)*(1-(t/3600-lo)/(hi-lo));};
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Évolution du temps de course estimé" data-ch="evo">',v,d='',hp=[];
  for(v=Math.ceil(lo);v<=hi;v+=1)s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v*3600)+'" y2="'+y(v*3600)+'" stroke="#2c2c2e"/><text x="'+(L-6)+'" y="'+(y(v*3600)+3.5)+'" text-anchor="end" font-size="10" fill="#85847d">'+v+' h</text>';
  pts.forEach(function(p,i){d+=(i?'L':'M')+x(i).toFixed(1)+' '+y(p.t).toFixed(1);
    s+='<text x="'+x(i)+'" y="'+(H-5)+'" text-anchor="middle" font-size="10" fill="#85847d">'+p.lab+'</text>';
    hp.push({x:x(i),dots:[[y(p.t),'#f5f4ef']],tip:'<b>'+p.full+'</b><br>Total <b>'+hms(p.t)+'</b><br>Nage '+hms(p.s)+' · Vélo '+hms(p.b)+' · Course '+hms(p.r)});});
  if(n>1)s+='<path d="'+d+'" fill="none" stroke="#f5f4ef" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  pts.forEach(function(p,i){s+='<circle cx="'+x(i)+'" cy="'+y(p.t)+'" r="4" fill="#f5f4ef" stroke="#1c1c1e" stroke-width="2"/>';});
  CH.evo={W:W,H:H,T:T,B:B,pts:hp};
  return s+hvLayer()+'</svg>';
}
function parcoursGen(P){
  var c='style="color:var(--t1)"',bu=P.bikeUp?' pour <b '+c+'>'+fmtInt(P.bikeUp)+' m de D+</b> (≈ '+(Math.round(P.bikeUp/(RACE.bikeM/1000)*10)/10).toString().replace('.',',')+' m/km)':'',ru=P.runUp?' avec <b '+c+'>'+fmtInt(P.runUp)+' m de D+</b>':'';
  return '<section class="card"><h2>Le parcours</h2><ul class="small muted" style="margin:0;padding-left:18px;line-height:1.6"><li>Natation : <b '+c+'>'+fk(RACE.swimM)+' km</b>.</li><li>Vélo : <b '+c+'>'+fk(RACE.bikeM)+' km</b>'+bu+'.</li><li>Course à pied : <b '+c+'>'+RUNLBL+(RUNLBL.indexOf('km')<0?' ('+fk(RACE.runM)+' km)':'')+'</b>'+ru+'.</li><li>Épreuve le '+esc(fmtLong(RACE_DATE))+'.'+(RACE.cutoff?' Limite de temps habituelle : '+String(RACE.cutoff/3600).replace('.',',')+' h.':'')+'</li></ul><p class="small muted" style="margin:10px 0 0">Renseigne le dénivelé dans les hypothèses si tu le connais : l’estimation en tient compte.</p></section>';
}
function rcIn(id,label,unit,val,ph){return '<label class="inp"><span>'+label+'<small>'+unit+'</small></span><input id="rc-'+id+'" inputmode="decimal" autocomplete="off" value="'+esc(val)+'" placeholder="'+esc(ph)+'"></label>';}
function emptyState(icon,title,text,extra,btn){return '<section class="card empty"><div class="mi">'+ic(icon,28)+'</div><h2>'+title+'</h2><p>'+text+'</p>'+(extra||'')+(btn||'')+'</section>';}
function raceNeeds(all){
  var base=idxOfDate(today()),win=all.filter(function(a){var d=dayIdx(a);return d<=base&&d>base-182;});
  var n={swim:win.filter(function(a){return /Swim/.test(a.t)&&a.m>=1000&&a.d>0;}).length,
    bike:win.filter(function(a){return a.t!=='VirtualRide'&&/Ride/.test(a.t)&&a.m>=15000&&a.d>=2700&&a.h>0;}).length,
    run:win.filter(function(a){return a.t!=='VirtualRun'&&/Run/.test(a.t)&&a.m>=4000&&a.d>=1500&&a.h>0;}).length};
  return [['swim','Natation','3 nages d’au moins 1 km',n.swim],['bike','Vélo','3 sorties d’au moins 15 km',n.bike],['run','Course à pied','3 courses d’au moins 4 km',n.run]].map(function(r){
    var ok=r[3]>=3;
    return '<div class="spr sp-'+r[0]+' req"><div class="ico">'+ic(r[0],20)+'</div><div class="bd"><div class="pr-h"><b>'+r[1]+'</b><span>'+(ok?'OK':Math.min(r[3],3)+' / 3')+'</span></div><div class="small muted" style="margin-top:2px">'+r[2]+'</div></div></div>';
  }).join('');
}
function vRace(){
  var all=dataActs(),sv=state.sv,P=raceParams(),h='',st=status();
  if((!(sv.url&&sv.key)||!all.length)&&!lvAny())return emptyState('race','Estime ton temps de course','Elle s’appuie sur tes vraies sorties Garmin (natation, vélo, course) et sur le parcours '+(IS_SABLES?'des Sables d’Olonne':'de ta course')+'. Connecte Garmin pour la calculer, ou réponds à 3 questions rapides.','','<button class="btn pri" data-act="garminwiz">Connecter Garmin</button><button class="btn" data-act="level" style="margin-top:8px">Estimer avec un questionnaire</button>');
  var E=estAll(all,P,null),cur=E[P.scen],rd=diffDays(RACE_DATE,today());
  if(!cur.total){
    return emptyState('race','Estimation bientôt disponible','Il manque quelques sorties récentes (sur les 26 dernières semaines) pour estimer ton temps de course avec fiabilité.',raceNeeds(all),'<button class="btn" data-act="level" style="margin-top:8px">Compléter avec le questionnaire</button>');
  }
  var SCN_HINT={prud:'Scénario prudent : une journée plus difficile que prévu.',real:'Scénario réaliste : ton niveau actuel, un jour normal.',ambi:'Scénario ambitieux : tout se passe bien, tu es en grande forme.'};
  var CONFW={bonne:0,moyenne:1,faible:2},CONFT=['fiable','correcte','à confirmer'];
  var worst=Math.max(CONFW[cur.swim.conf]||0,CONFW[cur.bike.conf]||0,CONFW[cur.run.conf]||0);
  var margin=RACE.cutoff?RACE.cutoff-cur.total:null;
  // 1. Ton temps estimé : les 3 estimations côte à côte
  h+='<section class="card rhero"><div class="eyebrow">Ton temps estimé</div><div class="big">'+hms(cur.total)+'</div><p class="rsub">Si la course avait lieu aujourd’hui. '+SCN_HINT[P.scen]+'</p>'+
    '<div class="scn" role="group" aria-label="Choisis un scénario">'+['ambi','real','prud'].map(function(k){return '<button data-act="rcscen" data-v="'+k+'" aria-pressed="'+(P.scen===k)+'"><span>'+RSCEN[k].n+'</span><b>'+hms(E[k].total)+'</b></button>';}).join('')+'</div>'+
    '<div class="rmeta">'+(rd>0?'<b>J-'+rd+'</b> · ':'')+esc(RNAME)+' · '+fmtDay(RACE_DATE)+' '+RACE_DATE.getFullYear()+
    (margin!==null?'<br>'+(margin>=0?'Marge sur la limite de '+String(RACE.cutoff/3600).replace('.',',')+' h : <b>'+hms(margin)+'</b>':'<span class="warn">Au-dessus de la limite de '+String(RACE.cutoff/3600).replace('.',',')+' h : à travailler.</span>'):'')+
    '<br>Fiabilité de l’estimation : <b>'+CONFT[worst]+'</b>'+(worst>0?' (plus tu enregistres de sorties, plus elle s’affine)':'')+(['swim','bike','run'].some(function(k){return cur[k]&&cur[k].n===0;})?'<br>En partie basée sur ton questionnaire de niveau : les sorties Garmin l’affineront.':'')+'</div></section>';
  // 2. Détail par discipline
  var tot=cur.total,parts=[['swim','Natation',fk(RACE.swimM)+' km',cur.swim],['bike','Vélo',fk(RACE.bikeM)+' km',cur.bike],['run','Course à pied',RUNLBL,cur.run]];
  var bars='<div class="zbar" role="img" aria-label="Répartition du temps de course">'+[['swim',cur.swim],['t1',{t:cur.t1}],['bike',cur.bike],['t2',{t:cur.t2}],['run',cur.run]].map(function(p){return '<span style="flex:'+p[1].t+';background:'+(p[0]==='t1'||p[0]==='t2'?'#48484a':SPCOL[p[0]])+'"></span>';}).join('')+'</div>';
  var rows='',basis='';
  parts.forEach(function(p){
    var k=p[0],o=p[3],lo=E.ambi[k].t,hi=E.prud[k].t;
    rows+='<div class="rline sp-'+k+'"><div class="ico">'+ic(k,20)+'</div><div class="bd"><div class="row"><b style="font-size:15px">'+p[1]+' <span class="muted" style="font-weight:500;font-size:12.5px">'+p[2]+'</span></b><span class="sp"></span><span class="t">'+hms(o.t)+'</span></div>'+
      '<small><b>'+paceOf(k,o.t)+'</b> · entre '+hms(lo)+' et '+hms(hi)+'</small></div></div>';
    basis+='<p class="basis"><b>'+p[1]+'</b> · fiabilité '+CONFT[CONFW[o.conf]||0]+' : '+esc(o.basis)+'.</p>';
  });
  h+='<section class="card"><div class="dtitle"><h2>Détail par discipline</h2></div><p class="dsub">Scénario '+RSCEN[P.scen].n.toLowerCase()+', transitions comprises ('+Math.round(cur.t1/60)+' + '+Math.round(cur.t2/60)+' min).</p>'+bars+'<div style="height:12px"></div>'+rows+
    mfold('rbasis','Comment c’est calculé','<p class="basis">Estimation indicative, sans capteur de puissance : elle repose sur ta fréquence cardiaque et tes sorties récentes (les plus récentes comptent davantage), appliquées au parcours de ta course.</p>'+basis)+'</section>';
  // 3. Ton objectif
  var goalIn=tpField('rc-goal','Ton objectif de temps','facultatif');
  if(P.goal){
    var core=cur.swim.t+cur.bike.t+cur.run.t,f=(P.goal-cur.t1-cur.t2)/core,gap=cur.total-P.goal;
    h+='<section class="card dsum"><div class="eyebrow">Ton objectif · '+hms(P.goal)+'</div>'+(gap>0?'<div class="dbig">'+gapTxt(gap)+'<small>à gagner</small></div>':'<div class="dbig" style="color:#30d158">Atteignable<small>'+gapTxt(gap)+' d’avance</small></div>')+bar(Math.min(100,Math.round(Math.min(P.goal,cur.total)/Math.max(P.goal,cur.total)*100)))+
      '<p class="dsub" style="margin:12px 0">'+(gap>0?'Pour tenir ton objectif, il faut aller <b style="color:var(--t1)">'+Math.round((1-f)*100)+' % plus vite</b> que l’estimation, sur chaque discipline :':'Ton estimation est <b style="color:var(--t1)">'+gapTxt(gap)+'</b> sous ton objectif. Voici les allures à viser :')+'</p>'+
      ['swim','bike','run'].map(function(k){var t=cur[k].t*f;return '<div class="spr sp-'+k+'"><div class="ico">'+ic(k,20)+'</div><div class="bd"><div class="pr-h" style="margin:0"><b>'+SPLBL[k].split(' ')[0]+'</b><span>'+paceOf(k,t)+' · '+hms(t)+'</span></div></div></div>';}).join('')+'<div style="height:10px"></div>'+goalIn+'</section>';
  }else{
    h+='<section class="card"><div class="dtitle"><h2>Fixe-toi un objectif</h2></div><p class="dsub">Indique le temps que tu vises : l’app calcule les allures à tenir sur chaque discipline.</p>'+goalIn+'</section>';
  }
  // 4. Évolution de l'estimation
  var pts=[],first=Infinity,i;
  if(all.length)all.forEach(function(a){first=Math.min(first,dayIdx(a));});
  var t0=today(),cur0=new Date(t0.getFullYear(),t0.getMonth(),1);
  var fd=addDays(PLAN_START,first),m0=new Date(fd.getFullYear(),fd.getMonth()+3,1);
  for(var mm=new Date(m0);mm<=cur0;mm=new Date(mm.getFullYear(),mm.getMonth()+1,1)){
    var end=new Date(mm.getFullYear(),mm.getMonth()+1,0);if(end>t0)end=t0;
    var e=estRace(all,P,idxOfDate(end));
    if(e.total)pts.push({t:e.total,s:e.swim.t,b:e.bike.t,r:e.run.t,lab:MONTHS[mm.getMonth()].replace('.',''),full:MONTHS_L[mm.getMonth()]+' '+mm.getFullYear()+' (au '+fmtDay(end)+')'});
  }
  if(pts.length>=2){
    var dd=pts[pts.length-1].t-pts[0].t,since=pts[0].full.split(' (')[0];
    h+='<section class="card"><div class="dtitle"><h2>Ta progression</h2></div><p class="dsub">'+(Math.abs(dd)<300?'Ton temps estimé est <b style="color:var(--t1)">stable</b> depuis '+since+'.':dd<0?'Ton temps estimé a <b style="color:#30d158">baissé de '+hms(-dd)+'</b> depuis '+since+' : tu progresses.':'Ton temps estimé a <b style="color:#ffd60a">augmenté de '+hms(dd)+'</b> depuis '+since+'. Varie ton entraînement et récupère bien.')+'</p><div class="chartwrap">'+evoChart(pts)+'</div></section>';
  }
  // 5. Affiner l'estimation (hypothèses)
  h+='<section class="card"><div class="dtitle"><h2>Affiner mon estimation</h2></div><p class="dsub">Plus ces informations sont proches de la réalité de ta course, plus l’estimation est juste.</p>'+
    mfold('rhyp','Modifier le parcours et les hypothèses',
      rcIn('bikeUp','Dénivelé vélo','D+ total (m)',P.bikeUp,String(CFG.bikeUp||'ex. 800'))+rcIn('runUp','Dénivelé course','D+ total (m)',P.runUp,String(CFG.runUp||'ex. 150'))+
      rcIn('hrB','FC visée à vélo','bpm',P.hrB,String(P.hrB))+rcIn('hrR','FC visée en course','bpm',P.hrR,String(P.hrR))+
      tpField('rc-t1','Transition T1','natation → vélo')+tpField('rc-t2','Transition T2','vélo → course')+
      '<div class="row" style="margin-top:6px"><div style="flex:1"><b style="font-size:14.5px">Combinaison de natation</b><div class="small muted">−3 % sur la natation (eau froide)</div></div><button class="chip'+(P.wet?' hl':'')+'" style="border:0;min-height:36px;padding:0 16px" data-act="rcwet" aria-pressed="'+P.wet+'">'+(P.wet?'Oui':'Non')+'</button></div>')+(lvOffered()?'<button class="btn" data-act="level" style="margin-top:10px">'+(lvAny()?'Modifier mon niveau (questionnaire)':'Renseigner mon niveau (questionnaire)')+'</button>':'')+'</section>';
  // parcours
  h+=IS_SABLES?'<section class="card"><h2>Le parcours</h2><ul class="small muted" style="margin:0;padding-left:18px;line-height:1.6"><li>Natation : <b style="color:var(--t1)">3,8 km</b>, dans le chenal et l’océan.</li><li>Vélo : <b style="color:var(--t1)">178 km</b> pour <b style="color:var(--t1)">1 334 m de D+</b> (≈ 7,5 m/km, parcours vallonné).</li><li>Course à pied : <b style="color:var(--t1)">marathon (42,195 km)</b> avec <b style="color:var(--t1)">200 m de D+</b> (≈ 4,7 m/km, quasi plat).</li><li>Départ annoncé le '+fmtDay(RACE_DATE)+' '+RACE_DATE.getFullYear()+' à 7 h (source non officielle). Limite de temps : 17 h est la limite habituelle des IRONMAN, à confirmer pour cette course.</li></ul></section>':parcoursGen(P);
  return h;
}

/* ---------- Infobulles au survol (souris) et au toucher (écran tactile) ---------- */
var CH={},tipEl=null,tipSvg=null;
function hvLayer(){return '<g class="hv" pointer-events="none" style="display:none"><rect class="hb" y="0" height="0" rx="3" fill="rgba(255,255,255,.09)"/><line class="xh" stroke="rgba(255,255,255,.45)" stroke-width="1"/><circle class="hd" r="4.5" stroke="#1c1c1e" stroke-width="2" style="display:none"/><circle class="hd" r="4.5" stroke="#1c1c1e" stroke-width="2" style="display:none"/></g>';}
function tipHide(){
  if(!tipEl)tipEl=document.getElementById('tip');
  if(tipEl)tipEl.classList.remove('on');
  if(tipSvg){var g=tipSvg.querySelector('.hv');if(g)g.style.display='none';tipSvg=null;}
}
function tipShow(html,cx,cy,touch){
  if(!tipEl)tipEl=document.getElementById('tip');
  tipEl.innerHTML=html;tipEl.classList.add('on');
  var w=tipEl.offsetWidth,hh=tipEl.offsetHeight,vw=window.innerWidth||390,x=cx+14,y=touch?cy-hh-18:cy+16;
  if(x+w>vw-8)x=cx-14-w;
  x=Math.max(8,x);
  if(y<8)y=cy+18;
  tipEl.style.left=x+'px';tipEl.style.top=y+'px';
}
function chartHover(e,svg){
  var c=CH[svg.getAttribute('data-ch')];
  if(!c||!c.pts.length)return;
  var r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*c.W,best=null,bd=1e9;
  c.pts.forEach(function(p){var d=Math.abs(p.x-x);if(d<bd){bd=d;best=p;}});
  if(!best)return;
  if(tipSvg&&tipSvg!==svg){var og=tipSvg.querySelector('.hv');if(og)og.style.display='none';}
  tipSvg=svg;
  var g=svg.querySelector('.hv');if(!g)return;
  g.style.display='';
  var hb=g.querySelector('.hb'),xh=g.querySelector('.xh'),ds=g.querySelectorAll('.hd');
  if(c.band){hb.setAttribute('x',best.x-c.band/2);hb.setAttribute('y',c.T);hb.setAttribute('width',c.band);hb.setAttribute('height',c.H-c.T-c.B);xh.setAttribute('y2',c.T);xh.setAttribute('y1',c.T);}
  else{hb.setAttribute('height',0);xh.setAttribute('x1',best.x);xh.setAttribute('x2',best.x);xh.setAttribute('y1',c.T);xh.setAttribute('y2',c.H-c.B);}
  for(var i=0;i<ds.length;i++){
    var dt=best.dots&&best.dots[i];
    if(dt){ds[i].setAttribute('cx',best.x);ds[i].setAttribute('cy',dt[0]);ds[i].setAttribute('fill',dt[1]);ds[i].style.display='';}else ds[i].style.display='none';
  }
  tipShow(best.tip,e.clientX,e.clientY,e.pointerType==='touch');
}
function svgOf(e){var t=e.target;return t&&t.closest?t.closest('svg[data-ch]'):null;}
document.addEventListener('pointermove',function(e){var s=svgOf(e);if(s)chartHover(e,s);else if(tipSvg)tipHide();});
document.addEventListener('pointerdown',function(e){var s=svgOf(e);if(s)chartHover(e,s);else tipHide();});
document.addEventListener('scroll',tipHide,true);
document.addEventListener('pointerup',function(e){if(e.pointerType==='touch')setTimeout(tipHide,2500);});

