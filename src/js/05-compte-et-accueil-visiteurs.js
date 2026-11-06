/* ---------- Choisir sa course (premier lancement ou changement de course) ---------- */
/* ---------- Sauvegarde cloud chiffrée (sans compte) ----------
   Un « code de récupération » (130 bits, généré ici, jamais envoyé) donne : une adresse (id), une preuve d'écriture (wk) et une clé AES-GCM.
   Le serveur ne stocke qu'un blob chiffré : il ne peut ni lire tes séances ni t'identifier. Perdre le code = perdre la sauvegarde cloud
   (les données restent sur l'appareil). La clé intervals.icu n'est JAMAIS sauvegardée. */
var B32='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function newCode(){
  var b=new Uint8Array(17),i,bits='',out='';crypto.getRandomValues(b);
  for(i=0;i<b.length;i++)bits+=('00000000'+b[i].toString(2)).slice(-8);
  for(i=0;i+5<=130;i+=5)out+=B32[parseInt(bits.slice(i,i+5),2)];
  return out;
}
function normCode(c){return String(c||'').toUpperCase().replace(/O/g,'0').replace(/[IL]/g,'1').replace(/[^0-9A-Z]/g,'').replace(/U/g,'V');}
function fmtCode(c){return c.replace(/(.{5})/g,'$1-').replace(/-$/,'');}
function validCode(c){return c.length===26&&c.split('').every(function(x){return B32.indexOf(x)>=0;});}
function hexOf(buf){return Array.prototype.map.call(new Uint8Array(buf),function(x){return ('0'+x.toString(16)).slice(-2);}).join('');}
function sha(t){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));}
function b64(buf){var s='',a=new Uint8Array(buf),i;for(i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s);}
function unb64(s){var b=atob(s),a=new Uint8Array(b.length),i;for(i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
function cloudKeys(code){
  return Promise.all([sha('id:'+code),sha('w:'+code),sha('enc:'+code)]).then(function(r){
    return crypto.subtle.importKey('raw',r[2],{name:'AES-GCM'},false,['encrypt','decrypt']).then(function(k){return {id:hexOf(r[0]),wk:hexOf(r[1]),key:k};});
  });
}
function cloudBase(){return (state.ui&&state.ui.pubApi)||PUB_API;}
// acc : envoi vers le compte Google, qui garde aussi la connexion Garmin (clé chiffrée par le serveur). Jamais dans la sauvegarde par code.
function cloudPayload(acc){
  var u=state.ui||{},sv=state.sv||{};
  var p={app:'triient',v:1,done:state.done,links:state.links,race:state.race||(SETUP?null:CFG),prof:u.prof||{},lv:u.lvl||{},st:u.steps||[],ms:u.missed||{},away:u.away||[],rc:u.race||{}};
  if(acc){if(sv.key){p.gk=sv.key;if(sv.url&&sv.url!==PUB_API)p.gu=sv.url;}else if(u.gkOff)p.gkx=1;}
  return p;
}
function cloudEncrypt(keys,obj){
  var iv=crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt({name:'AES-GCM',iv:iv},keys.key,new TextEncoder().encode(JSON.stringify(obj))).then(function(ct){
    var all=new Uint8Array(12+ct.byteLength);all.set(iv,0);all.set(new Uint8Array(ct),12);return b64(all);
  });
}
function cloudDecrypt(keys,blob){
  var a=unb64(blob);
  return crypto.subtle.decrypt({name:'AES-GCM',iv:a.slice(0,12)},keys.key,a.slice(12)).then(function(pt){return JSON.parse(new TextDecoder().decode(pt));});
}
function cloudCall(keys,method,body){
  var o={method:method,headers:{'Content-Type':'application/json','X-Sync-Write':keys.wk}};if(body)o.body=JSON.stringify(body);
  return fetch(cloudBase()+'/pub/sync/'+keys.id,o).then(function(r){return r.json().then(function(j){j.status=r.status;return j;});});
}
var cloudTimer=null,cloudBusy=false,cloudDraftCode=null;
function cloudCfg(){return state.ui&&state.ui.cloud;}
function save0(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
function cloudSchedule(){
  if(DEV)return;
  if(acct()){acctSchedule();return;}
  if(!cloudCfg()||cloudCfg().paused)return;
  clearTimeout(cloudTimer);cloudTimer=setTimeout(function(){cloudPush(false);},20000);
}
// envoi : seulement si les données ont changé depuis la dernière sauvegarde
function cloudPush(loud){
  if(DEV)return Promise.resolve();
  var c=cloudCfg();if(!c||cloudBusy)return Promise.resolve();
  var payload=cloudPayload(),sig=JSON.stringify(payload);
  if(!loud&&sig===c.sig)return Promise.resolve();
  cloudBusy=true;
  return cloudKeys(c.code).then(function(keys){
    return cloudEncrypt(keys,payload).then(function(blob){return cloudCall(keys,'PUT',{blob:blob,base:c.v||0});});
  }).then(function(j){
    if(j.status===409){c.conflict=true;c.paused=true;save0();if(loud)toast('Une version plus récente existe dans le cloud');return;}
    if(!j.ok)throw new Error(j.error||('Erreur '+j.status));
    c.v=j.v;c.t=j.updated||Date.now();c.sig=sig;c.err='';c.conflict=false;save0();
    if(loud)toast('Sauvegarde cloud effectuée');
  }).catch(function(e){c.err=(e&&e.message)==='Failed to fetch'?'Hors ligne':String((e&&e.message)||e);save0();if(loud)toast('Sauvegarde cloud impossible : '+c.err);})
  .then(function(){cloudBusy=false;});
}
function cloudApply(p){
  state.done=p.done||{};state.links=p.links||{};
  state.ui.prof=p.prof||{};state.ui.lvl=p.lv||{};state.ui.steps=p.st||[];state.ui.missed=p.ms||{};state.ui.away=p.away||[];state.ui.race=p.rc||{};
  if(p.race&&p.race.date&&p.race.start)state.race=p.race;
  if(p.gk&&p.gk!==(state.sv&&state.sv.key)){state.sv={url:p.gu||PUB_API,key:p.gk};delete state.ui.gkOff;}   // connexion Garmin gardée dans le compte
}
// récupération (nouvel appareil ou restauration) : télécharge, déchiffre et remplace les données locales
function cloudRestore(codeRaw,silent){
  var code=normCode(codeRaw);
  if(!validCode(code)){toast('Code invalide : 26 caractères attendus');return;}
  toast('Récupération…');
  cloudKeys(code).then(function(keys){
    return fetch(cloudBase()+'/pub/sync/'+keys.id).then(function(r){return r.json().then(function(j){j.status=r.status;return j;});}).then(function(j){
      if(j.status===404){toast('Aucune sauvegarde pour ce code');return;}
      if(!j.ok||!j.blob)throw new Error(j.error||'Erreur');
      return cloudDecrypt(keys,j.blob).then(function(p){
        if(!silent&&!confirm('Remplacer les données de cet appareil par la sauvegarde cloud ?'))return;
        cloudApply(p);
        state.ui.cloud={code:code,v:j.v,t:j.updated,sig:JSON.stringify(cloudPayload()),err:'',paused:false};
        track('cloud_restore','');
        save0();location.reload();
      });
    });
  }).catch(function(e){toast((e&&e.name==='OperationError')?'Code incorrect':('Échec : '+((e&&e.message)||e)));});
}
function cloudEnable(){
  var code=cloudDraftCode;if(!code)return;
  cloudKeys(code).then(function(keys){
    return cloudEncrypt(keys,cloudPayload()).then(function(blob){return cloudCall(keys,'PUT',{blob:blob,base:0});});
  }).then(function(j){
    if(!j.ok)throw new Error(j.error||('Erreur '+j.status));
    state.ui.cloud={code:code,v:j.v,t:j.updated,sig:JSON.stringify(cloudPayload()),err:'',paused:false};save0();cloudDraftCode=null;
    track('cloud_enabled','');toast('Sauvegarde cloud activée');openSheet();
  }).catch(function(e){toast('Activation impossible : '+(((e&&e.message)==='Failed to fetch')?'serveur injoignable':((e&&e.message)||e)));});
}
// « Sauvegarder maintenant » (après un conflit : on repart de la version du cloud pour l'écraser sciemment)
function cloudForce(){
  var c=cloudCfg();if(!c)return;
  cloudKeys(c.code).then(function(keys){
    return fetch(cloudBase()+'/pub/sync/'+keys.id+'?meta=1').then(function(r){return r.json();}).then(function(m){if(m&&m.ok)c.v=m.v;return cloudPush(true);});
  }).then(function(){openSheet();});
}
// au démarrage : une version plus récente dans le cloud (autre appareil) ?
function cloudBoot(){
  var c=cloudCfg();if(!c)return;
  cloudKeys(c.code).then(function(keys){return fetch(cloudBase()+'/pub/sync/'+keys.id+'?meta=1').then(function(r){return r.json();});}).then(function(m){
    if(!m||!m.ok)return;
    if(m.v>(c.v||0)){
      c.conflict=true;c.paused=true;save0();
      if(JSON.stringify(cloudPayload())===c.sig)cloudRestore(c.code,true);   // rien de modifié ici : on charge simplement la version plus récente
      else toast('Une version plus récente existe dans le cloud (Réglages → Sauvegarde cloud)');
    }else if(JSON.stringify(cloudPayload())!==c.sig)cloudSchedule();
  }).catch(function(){});
}
function cloudFoldHtml(){
  var c=cloudCfg(),h='';
  if(!c){
    var code=cloudDraftCode||(cloudDraftCode=newCode());
    h+='<p>Retrouve ton plan et tes séances sur un autre téléphone. Tes données sont <b>chiffrées sur ton appareil</b> avant l’envoi : personne, pas même nous, ne peut les lire. Aucun compte, aucun e-mail.</p>'+
      '<p><b>Ton code de récupération</b> (note-le ou copie-le : il est la seule façon de récupérer ta sauvegarde) :</p><div class="rsum" style="font-size:18px;letter-spacing:.04em;text-align:center;font-variant-numeric:tabular-nums;word-break:break-all"><b>'+fmtCode(code)+'</b></div>'+
      '<div class="btns" style="margin-top:10px"><button class="btn" data-act="cloudcopy">Copier le code</button><button class="btn pri" data-act="cloudon">C’est noté, activer</button></div>';
  }else{
    h+='<p>Sauvegarde cloud <b>activée</b>'+(c.t?' · dernière : '+ago(c.t):'')+'. Elle se met à jour automatiquement après chaque changement.</p>'+
      (c.conflict?'<p style="color:#ffd60a">Une version plus récente existe dans le cloud (autre appareil ?). Restaure-la, ou écrase-la avec cet appareil.</p>':'')+(c.err?'<p class="small muted">'+esc(c.err)+'</p>':'')+
      '<div class="btns"><button class="btn pri" data-act="cloudsave">Sauvegarder maintenant</button><button class="btn" data-act="cloudrestore">Restaurer depuis le cloud</button></div>'+
      '<details class="fold" style="margin:10px 0 0" data-fold="cloudcode"><summary><span>Voir mon code de récupération</span></summary><div class="fbody"><div class="rsum" style="font-size:17px;text-align:center;word-break:break-all"><b>'+fmtCode(c.code)+'</b></div><button class="btn" data-act="cloudcopy" style="margin-top:8px">Copier le code</button></div></details>'+
      '<button class="btn dng" data-act="cloudoff" style="margin-top:10px">Désactiver et supprimer la sauvegarde cloud</button>';
  }
  h+='<div class="eyebrow" style="margin:16px 0 6px">Sur un nouvel appareil</div><label class="inp wide"><span>Code de récupération</span><input id="cloud-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-X"></label><button class="btn" data-act="cloudget">Récupérer ma sauvegarde</button>';
  return h;
}
/* ---------- Compte (connexion Google) ----------
   Après « Continuer avec Google », le serveur vérifie l'identité et renvoie une session (90 jours). Le plan, les séances cochées et les
   réglages sont enregistrés dans le compte (lisibles par le service, contrairement à la sauvegarde par code). La clé intervals.icu y est aussi,
   chiffrée par le serveur : se connecter sur un autre appareil (ou une autre adresse de l'app) suffit pour retrouver Garmin. */
/* Connexion obligatoire : tant qu'il n'est pas connecté, l'utilisateur ne voit qu'un écran « Crée ton compte ».
   Garde-fous : jamais en ouverture de fichier (file://, la connexion Google y est impossible) ; si le serveur n'a pas de connexion Google configurée,
   l'app reste ouverte ; un utilisateur déjà connecté n'est jamais bloqué, même hors ligne (la session est locale). */
var LOGIN_REQUIRED=true,gateShown=false,gateTracked=false;
/* ---------- Assistant de connexion Garmin (via intervals.icu) ----------
   Garmin n'ouvre pas son API aux petites applications : intervals.icu (gratuit) fait le lien. L'assistant guide en 3 étapes, valide la clé
   immédiatement (nom du compte, nombre d'activités) et explique quoi faire quand rien n'arrive. Plus tard, l'étape 3 pourra devenir un bouton
   « Se connecter avec intervals.icu » (OAuth) sans changer le reste. */
var wz={step:1,key:'',busy:false,err:'',res:null};
function openWiz(step){wz={step:step||1,key:'',busy:false,err:'',res:null};trackOnce('wiz_start','u');renderWiz();}   // « u » : une fois par appareil (avant : à chaque ouverture)
function renderWiz(){
  var s=wz.step,h='',dots='<div class="wzs" aria-hidden="true">'+[1,2,3].map(function(i){return '<i class="'+(wz.res?'d':i<s?'d':i===s?'c':'')+'"></i>';}).join('')+'</div>';
  if(wz.res){
    var r=wz.res;
    if(r.count>0){
      var l=r.last,lt=l?actDate(l)+' · '+(l.n||l.t):'';
      h=dots+'<div class="wzok"><div class="tick">'+ic('check',34)+'</div><h3>Garmin est connecté</h3><p class="muted" style="margin:0">'+(r.name?esc(r.name)+' · ':'')+'<b style="color:var(--t1)">'+r.count+' activités</b> trouvées'+(lt?'<br>Dernière : '+esc(lt):'')+'</p></div>'+
        '<div class="wzbox"><b>Et maintenant ?</b>Tes séances se cocheront toutes seules dès que tu les fais. Pour recevoir les séances du plan sur ta montre, ouvre une séance et touche « Envoyer vers Garmin ».</div><button class="btn pri" data-act="wzdone">Terminer</button>';
    }else{
      h=dots+'<div class="wzok"><div class="tick" style="background:rgba(255,214,10,.14);color:#ffd60a">'+ic('info',34)+'</div><h3>Clé valide, mais aucune activité</h3><p class="muted" style="margin:0">'+(r.name?esc(r.name)+' · ':'')+'intervals.icu ne contient encore aucune activité.</p></div>'+
        '<ol class="wzl"><li><span>Dans intervals.icu, ouvre <b>Settings</b> puis la section <b>Garmin</b> : la connexion doit être active.</span></li><li><span>Vérifie que ta montre est synchronisée avec l’app <b>Garmin Connect</b> sur ton téléphone.</span></li><li><span>La première récupération peut prendre quelques minutes, parfois davantage pour un long historique. Touche ensuite « Réessayer ».</span></li></ol>'+
        '<button class="btn pri" data-act="wzverify">Réessayer</button><button class="btn" data-act="wzdone">Terminer quand même</button>';
    }
    showSheet('Connecter Garmin',r.count>0?'Terminé':'Presque terminé',h);return;
  }
  if(s===1){
    h=dots+'<div class="wzbox"><b>Pourquoi intervals.icu ?</b>Garmin n’ouvre pas ses données aux petites applications. intervals.icu est un service gratuit, déjà relié à Garmin Connect, qui fait le lien. Tu le configures une seule fois, ensuite tout est automatique.</div>'+
      '<p style="margin:0 0 12px;font-size:15px;line-height:1.45">Crée ton compte sur intervals.icu (gratuit), puis reviens ici.</p>'+
      '<a class="btn pri" href="https://intervals.icu" target="_blank" rel="noopener">Ouvrir intervals.icu</a><button class="btn" data-act="wznext">J’ai mon compte, suivant</button>';
  }else if(s===2){
    h=dots+'<p style="margin:0 0 12px;font-size:15px;line-height:1.45"><b>Relie ta montre à intervals.icu</b></p>'+
      '<ol class="wzl"><li><span>Dans intervals.icu, ouvre <b>Settings</b>, section <b>Garmin</b>, puis touche <b>Connect</b>. Connecte-toi à Garmin Connect et autorise l’accès.</span></li>'+
      '<li><span>Active le téléchargement des activités. Pour recevoir aussi les séances du plan sur ta montre, active <b>Upload planned workouts</b>.</span></li>'+
      '<li><span>Ta montre doit être synchronisée avec l’app <b>Garmin Connect</b>, comme d’habitude.</span></li></ol>'+
      '<a class="btn pri" href="https://intervals.icu/settings" target="_blank" rel="noopener">Ouvrir les réglages d’intervals.icu</a><button class="btn" data-act="wznext">C’est fait, suivant</button><button class="lnk" data-act="wzback" style="margin:0 0 4px">Retour</button>';
  }else{
    h=dots+'<p style="margin:0 0 12px;font-size:15px;line-height:1.45"><b>Copie ta clé API</b></p>'+
      '<ol class="wzl"><li><span>Dans intervals.icu, ouvre <b>Settings</b> puis <b>Developer Settings</b>.</span></li><li><span>Touche <b>Generate API Key</b> (ou copie ta clé existante).</span></li><li><span>Colle-la ci-dessous : elle est vérifiée tout de suite.</span></li></ol>'+
      '<input id="wz-key" class="wzkey" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Colle ta clé API ici" value="'+esc(wz.key)+'"'+(wz.busy?' disabled':'')+'>'+
      (wz.err?'<p class="wzerr">'+esc(wz.err)+'</p>':'')+
      '<div class="btns"><button class="btn" data-act="wzpaste"'+(wz.busy?' disabled':'')+'>Coller</button><button class="btn pri" data-act="wzverify"'+(wz.busy?' disabled':'')+'>'+(wz.busy?'Vérification…':'Vérifier et connecter')+'</button></div>'+
      '<p class="small muted" style="margin:6px 0 10px;line-height:1.5">Ta clé est enregistrée sur ton appareil et, chiffrée, dans ton compte : tu n’auras pas à la recoller sur un autre appareil. Elle sert uniquement à lire tes activités et à envoyer tes séances.</p><button class="lnk" data-act="wzback" style="margin:0">Retour</button>';
  }
  showSheet('Connecter Garmin','Étape '+s+' sur 3',h);
}
function wzVerify(){
  var key=(wz.key||'').trim().replace(/\s+/g,''),base=cloudBase(),H={'X-Icu-Key':key};
  wz.err='';wz.key=key;
  if(!/^[A-Za-z0-9_-]{10,80}$/.test(key)){wz.err='Cette clé ne ressemble pas à une clé API intervals.icu. Copie-la en entier, sans espace.';renderWiz();return;}
  wz.busy=true;renderWiz();
  fetch(base+'/api/status',{headers:H}).then(function(r){return r.json().then(function(j){j.status=r.status;return j;});}).then(function(j){
    if(j.status===401||j.connected===false)throw new Error(/refuse/.test(j.error||'')||j.status===401?'intervals.icu refuse cette clé. Vérifie que tu l’as copiée en entier.':(j.error||'Connexion refusée'));
    return fetch(base+'/api/activities?since='+isoDate(addDays(today(),-400)),{headers:H}).then(function(r){return r.json();}).then(function(a){
      var acts=a.activities||[];
      delete state.ui.gkOff;
      state.sv=Object.assign(state.sv||{},{url:base,key:key,acts:acts,meta:a.meta||null,hrz:(a.meta&&a.meta.hrz)||(state.sv&&state.sv.hrz),conn:true,t:Date.now(),err:'',werr:''});
      save();
      if(acts.length&&!state.ui.gtracked){state.ui.gtracked=1;save();track('garmin_connected','wiz');}   // réussite de l'assistant
      wz.res={ok:true,name:j.athlete||'',count:acts.length,last:acts[0]||null};
    });
  }).catch(function(e){
    var m=(e&&e.message)||'';wz.err=(m==='Failed to fetch'||m==='Load failed')?'Serveur injoignable. Vérifie ta connexion et réessaie.':m||'Échec de la connexion';track('wiz_error','');
  }).then(function(){wz.busy=false;renderWiz();});
}
function wzPaste(){
  try{
    navigator.clipboard.readText().then(function(t){wz.key=String(t||'').trim();renderWiz();if(wz.key.length>=20)wzVerify();},function(){toast('Colle la clé dans le champ');});
  }catch(e){toast('Colle la clé dans le champ');}
}
function svFoldHtml(){
  var sv=state.sv,linked=!!(sv.url&&sv.key),h='';
  if(!linked)h+='<p>Connecte Garmin pour que tes séances se cochent toutes seules à partir de tes activités, et pour envoyer les séances du plan sur ta montre. L’assistant te guide en 3 étapes (via intervals.icu, gratuit).</p><button class="btn pri" data-act="garminwiz">Connecter Garmin</button>';
  else h+='<p>Garmin est <b>connecté</b>'+(sv.t?' · dernière synchro : '+ago(sv.t):'')+'. '+(sv.acts?sv.acts.length+' activités.':'')+'</p>'+(sv.err||sv.werr?'<p class="small muted">'+esc(sv.err||sv.werr)+'</p>':'')+
    '<div class="btns"><button class="btn pri" data-act="svresync">Synchroniser</button><button class="btn" data-act="garminwiz3">Changer de clé</button></div><button class="btn dng" data-act="garminoff" style="margin-top:10px">Déconnecter Garmin</button>';
  return h+mfold('svmanual','Saisie manuelle (avancé)',svSettings());
}
var pubCfg=null,acctTimer=null,acctBusy=false,gsiLoading=false;
/* Parcours d'inscription : écran d'entrée → « Créer mon plan » (state.ui.guest) → choix de la course → « Ton plan est prêt » : connexion Google
   obligatoire (state.ui.pendingRace garde le plan rempli) → le plan est créé et enregistré dans le compte. Sans compte, on ne voit jamais le plan. */
function loginOn(){return !DEV&&LOGIN_REQUIRED&&!acct()&&!/^file:/.test(location.protocol)&&!(pubCfg&&!pubCfg.err&&!pubCfg.googleClientId);}
function loginStepNeeded(){return !!state.ui.pendingRace&&loginOn();}
function renderLoginStep(){
  var vw=document.getElementById('view'),cfg=pubCfg,c=state.ui.pendingRace,rd=parseISO(c.date),F=FORMATS[c.format]||{};
  try{document.body.classList.add('setup');}catch(e){}
  vw.className='';gateShown=true;
  var btn=!cfg?'<div class="g-gbox w"><span class="g-wait">Connexion au serveur…</span></div>':cfg.err?'<p class="small muted" style="margin:0 0 8px">Impossible de joindre le serveur. Vérifie ta connexion.</p><button class="btn" data-act="gateretry">Réessayer</button>':'<div class="g-gbox"><div id="g-btn" style="display:flex;justify-content:center;width:100%"></div></div>';
  var row=function(k,v){return '<div><span>'+k+'</span><b>'+esc(v)+'</b></div>';};
  vw.innerHTML='<div class="gate" style="padding-top:calc(var(--sat) + 40px)"><div class="g-body" style="margin-top:0">'+
    '<div class="g-slogan" style="margin:0">Dernière étape</div><h1 class="g-t" style="margin-top:10px">Ton plan<br>est prêt</h1>'+
    '<div class="lgs-sum">'+row('Course',c.name)+row('Date',rd?fmtLong(rd):'')+row('Format',F.n||'')+row('Durée',c.weeks+' semaines')+row('Séances',(c.sessions||8)+' par semaine')+'</div>'+
    '<div class="g-cta"><div class="g-ctal">Crée ton compte pour le voir</div>'+btn+'<p class="g-fine">Gratuit · sans mot de passe · sans pub<br>Ton plan te suit sur tous tes appareils</p></div>'+
    '<button class="lnk" data-act="editpending" style="margin:0 0 6px;color:var(--t2)">Modifier ma course</button>'+
    '<button class="lnk" data-act="legal" style="margin:0;color:var(--t3)">Mentions légales et confidentialité</button></div></div>';
  if(cfg&&!cfg.err&&cfg.googleClientId)setTimeout(acctRenderBtn,60);
}
function gateNeeded(){
  if(DEV||!LOGIN_REQUIRED||acct()||(state.ui.guest&&SETUP)||/^file:/.test(location.protocol))return false;
  return !(pubCfg&&!pubCfg.err&&!pubCfg.googleClientId);
}
function renderGate(){
  var vw=document.getElementById('view'),cfg=pubCfg,ready=cfg&&!cfg.err&&cfg.googleClientId,body;
  try{document.body.classList.add('setup','gating');}catch(e){}
  vw.className='';gateShown=true;
  if(!gateTracked&&ready){gateTracked=true;trackOnce('gate_view','');}
  body=!cfg?'<div class="g-gbox w"><span class="g-wait">Connexion au serveur…</span></div>':cfg.err?'<p class="small muted" style="margin:0 0 8px">Connexion impossible pour l’instant.</p><button class="btn" data-act="gateretry">Réessayer</button>':'<div class="g-gbox"><div id="g-btn" data-theme="filled_black" style="display:flex;justify-content:center;width:100%"></div></div>';
  /* Page d'accueil (passe « unslop ») : chrome sobre sur le noir de la marque. Le vert ne vit que dans le bouton principal, « TRI »
     et la séance faite, que la vague du logo (la ligne d'eau) marque aussi. La police condensée italique de la charte est réservée au
     logo et au titre. Téléphone : une colonne sous la photo. Ordinateur : texte à gauche, photo et semaine type à droite. */
  var wave=function(c){return '<svg class="'+c+'" viewBox="0 0 120 12" aria-hidden="true"><path d="M2 8c9-6 17-6 26 0s17 6 26 0 17-6 26 0 17 6 26 0 11-4 12-4"/></svg>';};
  var feat=function(icn,t,s){return '<li><span class="ld-fi">'+ic(icn,18)+'</span><div><b>'+t+'</b><p>'+s+'</p></div></li>';};
  // Aperçu d'une semaine type : montre le produit (séances détaillées, cochées par Garmin, envoyées sur la montre)
  var demo=function(sp,icn,day,t,d,st){return '<div class="ld-dr sp-'+sp+'"><span class="ld-di">'+ic(icn,18)+'</span><span class="ld-dt"><small>'+day+'</small><b>'+t+'</b><small>'+d+'</small></span>'+st+'</div>';};
  var photo='Départ d’un triathlon : des dizaines de nageurs s’élancent dans l’eau';
  vw.innerHTML='<div class="gate land" style="--hero:url('+HERO_IMG+')"><div class="ld-band" role="img" aria-label="'+photo+'"></div><div class="ld-in">'+
    '<div class="ld-main"><div class="ld-copy">'+
      '<div class="ld-brand" role="img" aria-label="Triient"><span class="ld-word"><i>TRI</i>IENT</span>'+wave('ld-wave')+'</div>'+
      '<h1 class="ld-t">Ta prépa, <span class="ld-nw">séance par séance</span></h1>'+
      '<p class="ld-s">Choisis ta course de triathlon, ton niveau et tes jours d’entraînement : Triient prépare chaque séance jusqu’au jour J, du sprint à l’Ironman</p>'+
      '<div class="ld-cta" id="g-cta"><button class="btn pri ld-go" data-act="gateguest">Créer mon plan</button>'+
        '<p class="ld-fine">Gratuit et sans pub · ton compte se crée en un clic, une fois ta course choisie</p>'+
        '<div class="ld-or">Déjà un compte ?</div>'+body+'</div>'+
    '</div><div class="ld-show"><div class="ld-photo" role="img" aria-label="'+photo+'"></div>'+
      '<div class="ld-demo" aria-label="Exemple de semaine"><div class="ld-dh"><b>Semaine 6</b><span>Développement</span><em>Exemple</em></div>'+
        demo('swim','swim','Mardi','Natation · Technique','45 min · 2,1 km','<span class="ld-st ok">'+wave('ld-ok')+'Fait</span>')+
        demo('bike','bike','Mercredi','Vélo · Blocs allure course','1h30 · 3 × 12 min','<span class="ld-st">'+ic('watch',16)+'Sur ta montre</span>')+
        demo('run','run','Samedi','Course · Sortie longue','1h05 · facile','<span class="ld-st">À venir</span>')+
        '<p class="ld-dn">Faite avec ta montre Garmin, la séance se coche toute seule</p></div>'+
    '</div></div>'+
    '<ul class="ld-feat">'+feat('race','Toutes les distances','Du sprint à l’Ironman, préparé sur 4 à 52 semaines')+
      feat('watch','Sur ta montre Garmin','Tes séances arrivent sur ta montre avec leurs allures et se cochent une fois faites')+
      feat('week','Au rythme de ta vie','Tu choisis tes séances par semaine ; vacances, week-ends chargés, blessures et courses de préparation sont pris en compte')+'</ul>'+
    '<div class="ld-end"><button class="btn pri ld-go" data-act="gateguest">Créer mon plan</button>'+
      '<button class="lnk" data-act="legal">Mentions légales et confidentialité</button></div>'+
  '</div></div>';
  if(ready)setTimeout(acctRenderBtn,60);
}
function acct(){return state.ui&&state.ui.acct;}
function loadPubCfg(){
  var after=function(){if((gateShown||gateNeeded()||SETUP)&&!typing())render(true);};
  try{fetch(cloudBase()+'/pub/config').then(function(r){return r.json();}).then(function(j){pubCfg=j||{};after();}).catch(function(){pubCfg={err:true};after();});}catch(e){pubCfg={err:true};}
}
function acctCall(method,path,body){
  var a=acct(),o={method:method,headers:{'Content-Type':'application/json','X-Session':a?a.token:''}};if(body)o.body=JSON.stringify(body);
  return fetch(cloudBase()+path,o).then(function(r){return r.json().then(function(j){
    j.status=r.status;
    if(r.status===401&&a){delete state.ui.acct;save0();toast('Session expirée : reconnecte-toi');if(gateNeeded()&&!typing())render(false);}
    return j;
  });});
}
function acctSchedule(){
  if(DEV)return;
  var a=acct();if(!a||a.paused)return;
  clearTimeout(acctTimer);acctTimer=setTimeout(function(){acctPush(false);},15000);
}
/* Visite : dernière visite et progression (au plus toutes les 20 min, ou dès qu'une valeur change).
   Si les statistiques d'usage sont activées, on ajoute pour le suivi propriétaire : appareil et navigateur (« iPhone · Safari »),
   app installée, Garmin connecté, nombre de séances envoyées vers la montre et d'activités Garmin reçues. Jamais l'adresse IP ni le navigateur exact. */
function devInfo(){
  var ua=navigator.userAgent||'',pf=navigator.platform||'',tp=navigator.maxTouchPoints||0,inst=false;
  try{inst=navigator.standalone===true||!!(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);}catch(e){}
  var os=/iPad/.test(ua)||(pf==='MacIntel'&&tp>1)?'iPad':/iPhone|iPod/.test(ua)?'iPhone':/Android/.test(ua)?'Android':/Windows/.test(ua)?'Windows':/Macintosh|Mac OS X/.test(ua)?'Mac':/CrOS/.test(ua)?'Chromebook':/Linux/.test(ua)?'Linux':'Autre';
  var br=/FBAN|FBAV|FB_IAB|Instagram|Snapchat|TikTok|LinkedInApp/.test(ua)?'appli tierce':/SamsungBrowser/.test(ua)?'Samsung Internet':/EdgA?\/|EdgiOS/.test(ua)?'Edge':/OPR\/|OPiOS/.test(ua)?'Opera':/CriOS|Chrome\//.test(ua)?'Chrome':/FxiOS|Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':'navigateur';
  return {dev:os+' · '+(inst?'app installée':br),inst:inst?1:0};
}
var pingTimer=null,pingSig='',pingT=0;
function acctPingSoon(){if(!DEV&&acct()&&!pingTimer)pingTimer=setTimeout(function(){pingTimer=null;acctPing();},5000);}
function acctPing(){
  var a=acct();if(!a)return;
  var t=SETUP?null:stats().t,b=t?{done:t.d,total:t.n}:{};
  if(statsOn()){var di=devInfo(),sv=state.sv||{};b.dev=di.dev;b.inst=di.inst;b.g=sv.url&&sv.key?1:0;b.sent=Object.keys(state.ui.sent||{}).length;b.acts=(sv.acts||[]).length;}
  var sig=JSON.stringify(b);
  if(sig===pingSig&&Date.now()-pingT<12e5)return;
  pingSig=sig;pingT=Date.now();
  acctCall('POST','/pub/account/ping',b).then(function(j){
    var x=acct();
    if(!j||!j.ok)pingSig='';
    if(j&&j.ok&&j.admin&&!state.ui.own){state.ui.own=1;save0();}   // appareil du propriétaire : exclu des compteurs anonymes, même déconnecté
    if(x&&j&&j.ok&&!!x.admin!==!!j.admin){x.admin=!!j.admin;save0();safeRender();}
  }).catch(function(){pingSig='';});
}
function acctPush(loud){
  if(DEV)return Promise.resolve();
  var a=acct();if(!a||acctBusy)return Promise.resolve();
  var payload=cloudPayload(true),sig=JSON.stringify(payload);
  if(!loud&&sig===a.sig)return Promise.resolve();
  acctBusy=true;
  return acctCall('PUT','/pub/account/data',{data:payload,base:a.v||0}).then(function(j){
    if(j.status===409){a.conflict=true;a.paused=true;save0();if(loud)toast('Une version plus récente existe dans ton compte');return;}
    if(!j.ok)throw new Error(j.error||('Erreur '+j.status));
    a.v=j.v;a.t=j.updated||Date.now();a.sig=sig;a.err='';a.conflict=false;save0();
    if(loud)toast('Compte à jour');
  }).catch(function(e){var x=acct();if(!x)return;x.err=(e&&e.message)==='Failed to fetch'?'Hors ligne':String((e&&e.message)||e);save0();if(loud)toast('Synchronisation impossible : '+x.err);})
  .then(function(){acctBusy=false;});
}
function acctLogin(credential){
  return fetch(cloudBase()+'/pub/auth/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:credential})})
    .then(function(r){return r.json().then(function(j){j.status=r.status;return j;});})
    .then(function(j){
      if(!j.ok)throw new Error(j.error||'Connexion refusée');
      state.ui.acct={token:j.token,email:j.user.email,name:j.user.name,v:0,t:0,sig:'',paused:false};save0();
      track('login','');
      return acctAfterLogin();
    }).catch(function(e){toast('Connexion impossible : '+(((e&&e.message)==='Failed to fetch')?'serveur injoignable':((e&&e.message)||e)));});
}
function acctAfterLogin(){
  return acctCall('GET','/pub/account/data').then(function(j){
    var a=acct();if(!a)return;
    if(!j.ok)throw new Error(j.error||'Erreur');
    a.v=j.v;
    var pend=state.ui.pendingRace;   // plan rempli avant la connexion
    if(j.data&&j.data.done){
      var nm=(j.data.race&&j.data.race.name)||'ton plan';
      if(pend?confirm('Un plan existe déjà dans ton compte (« '+nm+' »).\n\nOK : reprendre ce plan.\nAnnuler : le remplacer par ton nouveau plan « '+pend.name+' ».'):(SETUP||confirm('Un plan existe déjà dans ton compte (« '+nm+' »).\n\nOK : le charger sur cet appareil (remplace les données d’ici).\nAnnuler : garder cet appareil et remplacer le plan du compte.'))){
        delete state.ui.pendingRace;cloudApply(j.data);a.sig=JSON.stringify(cloudPayload(true));a.t=j.updated||Date.now();save0();location.reload();return;
      }
    }
    if(pend){state.race=pend;delete state.ui.pendingRace;delete state.ui.guest;save0();return acctPush(true).then(function(){location.reload();});}
    save0();
    if(SETUP){toast('Bienvenue ! Choisis ta course');gateShown=false;trackOnce('setup_view');if(!typing())renderSetup();return;}
    return acctPush(true).then(function(){
      if(gateShown)render(false);
      else if(document.getElementById('sheetbg').classList.contains('on'))openSheet();
      else{render(true);toast('C’est enregistré : ton plan est dans ton compte');}
    });
  }).catch(function(e){toast('Connexion impossible : '+((e&&e.message)||e));});
}
// au démarrage : version plus récente dans le compte (autre appareil) ?
function acctBoot(){
  var a=acct();if(!a)return;
  acctCall('GET','/pub/account/data?meta=1').then(function(m){
    var x=acct();if(!x||!m||!m.ok)return;
    if(m.v>(x.v||0)){
      x.conflict=true;x.paused=true;save0();
      if(JSON.stringify(cloudPayload(true))===x.sig)acctCall('GET','/pub/account/data').then(function(j){if(j.ok&&j.data){cloudApply(j.data);x.v=j.v;x.t=j.updated;x.conflict=false;x.paused=false;x.sig=JSON.stringify(cloudPayload(true));save0();location.reload();}});
      else toast('Une version plus récente existe dans ton compte (Réglages → Compte)');
    }else if(JSON.stringify(cloudPayload(true))!==x.sig)acctSchedule();
  }).catch(function(){});
}
function acctForce(){
  var a=acct();if(!a)return;
  acctCall('GET','/pub/account/data?meta=1').then(function(m){if(m&&m.ok)a.v=m.v;return acctPush(true);}).then(function(){openSheet();});
}
function acctLogout(){
  delete state.ui.acct;save0();try{if(window.google&&google.accounts&&google.accounts.id)google.accounts.id.disableAutoSelect();}catch(e){}
  toast('Déconnecté : tes données restent sur cet appareil');openSheet();
}
function acctExport(){
  acctCall('GET','/pub/account/export').then(function(j){
    if(!j.ok)throw new Error(j.error||'Erreur');
    var txt=JSON.stringify(j.export,null,2);
    try{var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download='mes-donnees-triient.json';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},500);toast('Export téléchargé');}
    catch(e){try{navigator.clipboard.writeText(txt);toast('Export copié dans le presse-papiers');}catch(x){toast('Export impossible');}}
  }).catch(function(e){toast('Export impossible : '+((e&&e.message)||e));});
}
function acctDelete(){
  if(!acct()||!confirm('Supprimer définitivement ton compte et toutes les données enregistrées sur nos serveurs ? Tes données restent sur cet appareil.'))return;
  acctCall('DELETE','/pub/account').then(function(j){
    if(!j.ok&&j.status!==401&&j.status!==404)throw new Error(j.error||'Erreur');
    delete state.ui.acct;save0();track('account_deleted','');toast('Compte supprimé');openSheet();
  }).catch(function(e){toast('Suppression impossible : '+((e&&e.message)||e));});
}
function loadGsi(cb){
  if(window.google&&window.google.accounts&&window.google.accounts.id)return cb();
  if(gsiLoading)return setTimeout(function(){loadGsi(cb);},300);
  gsiLoading=true;
  var s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;
  s.onload=function(){gsiLoading=false;cb();};s.onerror=function(){gsiLoading=false;cb(new Error('gsi'));};
  document.head.appendChild(s);
}
function acctRenderBtn(){
  var el=document.getElementById('g-btn');
  if(!el||!pubCfg||!pubCfg.googleClientId||acct())return;
  loadGsi(function(err){
    if(err||!window.google){el.innerHTML='<p class="small muted">Connexion Google indisponible (bloqueur de contenu ?).</p>';return;}
    google.accounts.id.initialize({client_id:pubCfg.googleClientId,callback:function(r){acctLogin(r.credential);},auto_select:false});
    google.accounts.id.renderButton(el,{theme:el.getAttribute('data-theme')||'outline',size:'large',text:'continue_with',shape:'pill',width:Math.min(340,el.clientWidth||300),locale:'fr',logo_alignment:'left'});
  });
}
function accountFoldHtml(){
  var a=acct();
  if(!a){
    if(!pubCfg||!pubCfg.googleClientId)return '';
    setTimeout(acctRenderBtn,60);
    return '<p>Connecte-toi pour retrouver ton plan sur tous tes appareils. Nous enregistrons ton e-mail, ton nom et ton plan (séances cochées, réglages) dans ton compte. Tu peux tout exporter ou supprimer à tout moment.</p><div id="g-btn" style="display:flex;justify-content:center;min-height:44px"></div>';
  }
  return '<p><b>'+esc(a.name||a.email)+'</b><br><span class="small muted">'+esc(a.email)+'</span></p><p>Ton plan est enregistré dans ton compte'+(a.t?' · dernière synchro : '+ago(a.t):'')+'. Il se met à jour automatiquement.</p>'+
    (a.conflict?'<p style="color:#ffd60a">Une version plus récente existe dans ton compte (autre appareil ?). Charge-la en te reconnectant, ou écrase-la avec cet appareil.</p>':'')+(a.err?'<p class="small muted">'+esc(a.err)+'</p>':'')+
    '<div class="btns"><button class="btn pri" data-act="acctsave">Synchroniser maintenant</button><button class="btn" data-act="acctexport">Exporter mes données</button></div>'+
    '<button class="btn" data-act="acctout" style="margin-top:10px">Se déconnecter</button><button class="btn dng" data-act="acctdel" style="margin-top:10px">Supprimer mon compte</button>';
}
function accountSetupHtml(){
  if(!pubCfg||!pubCfg.googleClientId||acct())return acct()?'<p class="small muted" style="margin:14px 2px 0">Connecté en tant que '+esc(acct().email)+' : ton plan sera enregistré dans ton compte.</p>':'';
  setTimeout(acctRenderBtn,60);
  return '<div class="rsec" style="margin-top:22px"><div class="eyebrow">Déjà un compte ?</div><div id="g-btn" style="display:flex;justify-content:center;min-height:44px"></div></div>';
}
/* Mentions légales : renseigne ici ton nom d'éditeur et un contact (facultatifs) pour qu'ils s'affichent dans l'app. */
var LEGAL={editor:'',contact:''};
function legalHtml(){
  var p=function(t){return '<p style="font-size:14px;line-height:1.55">'+t+'</p>';};
  return '<h4>Éditeur</h4>'+p('Application gratuite, éditée à titre personnel et sans but commercial.'+(LEGAL.editor?' Éditeur : '+esc(LEGAL.editor)+'.':'')+(LEGAL.contact?' Contact : '+esc(LEGAL.contact)+'.':''))+
    p('Hébergement de l’application : Vercel Inc. Serveur relais (recherche de courses, synchronisation Garmin facultative) : Cloudflare, Inc.')+
    '<h4>Confidentialité</h4>'+p('Il n’y a ni publicité ni suivi publicitaire. Pour créer ton plan, tu crées un compte en te connectant avec Google. Ton plan, tes séances cochées et tes réglages sont enregistrés sur ton appareil et dans ton compte, pour que tu les retrouves partout. Pour suivre le service, le propriétaire de l’app peut voir ton nom, ton e-mail, ta course, ta progression (nombre de séances faites) et ta date de dernière visite.')+
    p('Seule la recherche de courses envoie le texte que tu tapes (3 caractères ou plus) à notre serveur relais, qui interroge le calendrier World Triathlon. Rien n’est enregistré à ton nom ; les réponses sont simplement mises en cache quelques heures. Si tu actives la synchronisation Garmin, tes activités passent par intervals.icu et ce serveur relais, sans y être conservées.')+p('Nous comptons de façon <b>anonyme</b> quelques événements (ouverture de l’app, création d’un plan avec son format, course choisie, recherche sans résultat) pour améliorer le service : ce sont de simples compteurs par jour, sans identifiant, sans cookie et sans adresse IP. Tu peux les désactiver dans Réglages → À propos, et ils respectent l’option « Ne pas me suivre » de ton navigateur.')+p('Si tu actives la <b>sauvegarde cloud</b>, une copie de ton plan et de tes séances cochées est envoyée <b>chiffrée</b> (la clé reste dans ton code de récupération, que nous ne connaissons pas) : nous ne pouvons pas la lire. Tu peux la supprimer à tout moment dans Réglages. Ta clé intervals.icu n’y figure jamais.')+p('À la création du compte (connexion avec <b>Google</b>), nous enregistrons ton identifiant Google, ton e-mail, ton nom et les dates de connexion, ainsi que ton plan (course choisie, séances cochées, notes, réglages) pour le retrouver sur tous tes appareils. Si tu connectes Garmin, ta clé intervals.icu y est aussi enregistrée, chiffrée ; « Déconnecter Garmin » l’efface. Si les statistiques d’usage sont activées (Réglages → À propos), ton compte enregistre aussi ton type d’appareil et de navigateur (par exemple « iPhone · Safari »), si l’app est installée, si Garmin est connecté, le nombre de séances envoyées vers ta montre et d’activités Garmin reçues, et la date de tes visites (gardée un an). Elles servent uniquement à améliorer l’app ; les désactiver arrête cet enregistrement. Ces données ne sont ni vendues ni partagées. Tu peux les exporter ou supprimer ton compte à tout moment dans Réglages → Compte.')+
    '<h4>Avertissement</h4>'+p('Les plans proposés sont <b>indicatifs</b> et générés automatiquement : ils ne remplacent ni l’avis d’un médecin, ni celui d’un entraîneur. Consulte un professionnel de santé avant de reprendre ou d’intensifier une pratique sportive, et arrête-toi en cas de douleur ou de malaise. Tu t’entraînes sous ta seule responsabilité.')+
    '<h4>Données des courses</h4>'+p('Les noms, lieux, formats, distances et dates du catalogue sont donnés à titre indicatif, d’après des sources publiques (dont le calendrier de la Fédération Française de Triathlon et World Triathlon). Ils peuvent être incomplets ou changer : vérifie toujours auprès de l’organisateur avant de t’inscrire.')+
    '<h4>Marques et crédits</h4>'+p('IRONMAN et IRONMAN 70.3 sont des marques de leurs propriétaires ; Garmin, intervals.icu et World Triathlon sont cités pour identifier des services. Cette application est indépendante : elle n’est ni affiliée à ces organisations, ni approuvée par elles. Photo d’accueil : départ natation d’un Ironman, U.S. Navy (Chief Journalist Deborah Carson), domaine public.');
}
function openLegal(){showSheet('Mentions légales','Confidentialité, avertissement, crédits',legalHtml());sheetRoute('legal');}
