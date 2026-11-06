/* =====================================================================
   6. PWA : manifeste généré + service worker (si servi en https)
   ===================================================================== */

if(DEV){
  /* profil de test : pas de cache hors ligne, pour voir les modifications du code tout de suite */
  try{
    if(navigator.serviceWorker)navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});
    if(window.caches)caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k);});});
  }catch(e){}
  var db=document.createElement('div');
  db.id='devbar';
  db.textContent='PROFIL TEST · '+DEV;
  db.setAttribute('style','position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:99999;padding:2px 10px;border-radius:0 0 8px 8px;background:#ff9f0a;color:#000;font:700 10px/1.5 system-ui,sans-serif;letter-spacing:.06em;pointer-events:none');
  document.body.appendChild(db);
}else if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
}

window.IM={fm:fm,fh:fh,hms:hms,PHASES:PHASES,BLOCKS:BLOCKS,KINDS:KINDS,T_TAPER:T_TAPER,stepOps:stepOps,VIEWS:VIEWS,missedList:missedList,missAdvice:missAdvice,missDo:missDo,missUndo:missUndo,missAll:missAll,isMissed:isMissed,openWiz:openWiz,cloudPayload:cloudPayload,cloudApply:cloudApply,devInfo:devInfo,admAnalytics:admAnalytics,admDetail:admDetail,gatePreview:function(c){pubCfg=c;renderGate();},loginPreview:function(c,r){pubCfg=c;state.ui.pendingRace=r;renderLoginStep();},gateNeeded:gateNeeded,acctLogin:acctLogin,catSearch:catSearch,wtResults:wtResults,wtFormat:wtFormat,pickRace:pickRace,NSESS:NSESS,planSpan:planSpan,newRaceDraft:newRaceDraft,raceFormHtml:raceFormHtml,saveRace:saveRace,applyAway:applyAway,VOL:VOL,VOL0:VOL0,volPlan:volPlan,scDefault:scDefault,scTotal:scTotal,vtMove:vtMove,vtScOut:vtScOut,spMin:spMin,spRange:spRange,adjVol:adjVol,openVt:openVt,vtSlide:vtSlide,vtApply:vtApply,awayDesc:awayDesc,awayTo:awayTo,injBack:injBack,injCard:injCard,newAwayDraft:newAwayDraft,adaptFields:adaptFields,estKm:estKm,detailBody:detailBody,wkBlocks:wkBlocks,pushSession:pushSession,pushPreview:pushPreview,clearPreview:clearPreview,wkText:wkText,evOf:evOf,ALLS:ALLS,tx:tx,autoProf:autoProf,estRace:estRace,estAll:estAll,raceParams:raceParams,PLAN:PLAN,stats:stats,status:status,computeLinks:computeLinks,links:function(){return LK;},state:state,actSport:actSport};
applyAway();
try{
  if(RCFG.migrate&&!state.ui.seen){state.ui.seen=1;save();}
  if(!state.ui.seen){state.ui.seen=1;save();track('install');}
  var td=isoDate(today());if(state.ui.lastOpen!==td){state.ui.lastOpen=td;save();track('open');}
  loadPubCfg();
  if(SETUP&&!gateNeeded())trackOnce('setup_view');else if(!SETUP){loadAdminStats();if(acct())acctBoot();else cloudBoot();}
}catch(e){}
try{document.title='Triient · '+RNAME;}catch(e){}
var r0=parseRoute();   // à lire avant le premier rendu, qui réécrit l'adresse
render(false);
if(!SETUP){
  if(r0.p.s&&!gateNeeded()){routing=true;try{openSheetByKey(r0.p.s);}finally{routing=false;}syncUrl(false);}
  if(state.ui.flash){var fl=state.ui.flash;delete state.ui.flash;save0();setTimeout(function(){toast(fl);},300);}   // message laissé avant un rechargement
  if(state.ui.welcomed===undefined){
    if(state.sv.url||Object.keys(state.done).length)state.ui.welcomed=true;
    else setTimeout(openWelcome,350);
  }
  (function(){
    syncActs(true);
    setInterval(function(){syncActs(false);},120000);
  })();
}
})();
