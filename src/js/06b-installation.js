/* ---------- Installation de l'app ----------
   1. Navigateurs intégrés (Instagram, Facebook, Messenger, TikTok, WhatsApp…) : on n'y peut ni installer l'app ni se connecter avec Google
      (Google y bloque souvent la connexion). On le dit dès l'arrivée, avec un bouton pour ouvrir le lien dans le vrai navigateur.
   2. Proposition d'installation : sur la présentation qui suit la création du plan, puis en carte sur l'Accueil.
      « Plus tard » la repousse de 7 jours ; elle s'arrête après 3 refus.
   3. Parcours mesuré par les compteurs anonymes (voir le bloc « Installation de l'app » du suivi), une fois par jour et par appareil
      pour les affichages. */
var INST_LATER_DAYS=7,INST_MAX_NO=3;
function uaStr(){try{return navigator.userAgent||'';}catch(e){return '';}}
function isIOS(){var u=uaStr();try{return /iphone|ipad|ipod/i.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);}catch(e){return false;}}
function isAndroid(){return /android/i.test(uaStr());}
// nom de l'appli qui a ouvert le lien dans son propre navigateur ('app' si on ne sait pas laquelle), '' dans un vrai navigateur
function inAppName(){
  var u=uaStr();
  if(isStandalone())return '';
  var L=[['Instagram',/Instagram/],['Messenger',/Messenger|FB_IAB\/MESSENGER/i],['Facebook',/FBAN|FBAV|FB_IAB|FBIOS/],['TikTok',/musical_ly|BytedanceWebview|TikTok/i],
    ['Snapchat',/Snapchat/],['LinkedIn',/LinkedInApp/],['X',/Twitter/],['WhatsApp',/WhatsApp/],['Google',/GSA\//],['Pinterest',/Pinterest/],['WeChat',/MicroMessenger/],['Line',/\bLine\//]];
  for(var i=0;i<L.length;i++)if(L[i][1].test(u))return L[i][0];
  if(isAndroid()&&/; wv\)/.test(u))return 'app';                       // WebView Android
  if(isIOS()&&/AppleWebKit/.test(u)&&!/Safari\//.test(u))return 'app';  // WebView iOS : Safari, Chrome, Firefox et Edge ont « Safari/ »
  return '';
}
// compteur d'affichage : une fois par jour et par appareil pour chaque couple événement / propriété
function trackDay(e,p){var k=e+'|'+p,d=isoDate(today()),m=state.ui.tkd||(state.ui.tkd={});if(m[k]===d)return;m[k]=d;save0();track(e,p);}
function appLink(){return location.origin+location.pathname;}

/* Bandeau compact en haut de page : le geste exact à faire dans l'appli (menu en haut à droite), une flèche vers ce menu,
   et « copie le lien » en secours. iPhone : aucun lien ne peut forcer l'ouverture de Safari depuis Instagram (essayé avec
   x-safari-https://, bloqué), donc pas de bouton. Android : « Ouvrir dans Chrome » passe par un lien intent://. */
function inAppHtml(where){
  var app=inAppName();if(!app)return '';
  trackDay('inapp_view',app.toLowerCase()+':'+where);
  var ios=isIOS(),br=ios?'Safari':'Chrome',meta=app==='Instagram'||app==='Facebook'||app==='Messenger';
  var how=ios?(meta?'Touche <b>•••</b> en haut à droite, puis «&nbsp;Ouvrir dans le navigateur externe&nbsp;»':'Touche <b>•••</b> ou le bouton de partage, puis «&nbsp;Ouvrir dans Safari&nbsp;» ou «&nbsp;Ouvrir dans le navigateur&nbsp;»')
             :'Touche <b>⋮</b> en haut à droite, puis «&nbsp;Ouvrir dans Chrome&nbsp;» ou «&nbsp;Ouvrir dans le navigateur&nbsp;»';
  var arrow='<svg class="inapp-ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  return '<section class="inapp" role="note"><div class="inapp-tx"><b>Pour installer l’app, ouvre Triient dans '+br+'</b>'+
    '<p>'+how+'</p><div class="inapp-bt">'+(ios?'':'<button class="btn pri" data-act="inappopen">Ouvrir dans Chrome</button>')+
    '<button class="inapp-cp" data-act="inappcopy">'+(ios?'Ou copie le lien et colle-le dans Safari':'Copier le lien')+'</button></div></div>'+arrow+'</section>';
}
function inAppOpen(){
  var u=appLink();
  track('inapp_action','chrome');
  location.href='intent://'+u.replace(/^https?:\/\//,'')+'#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url='+encodeURIComponent(u)+';end';
}
function inAppCopy(){
  track('inapp_action','copy');
  var u=appLink(),ok=function(){toast(isIOS()?'Lien copié : colle-le dans Safari':'Lien copié : colle-le dans Chrome');};
  var old=function(){
    try{var t=document.createElement('textarea');t.value=u;t.setAttribute('readonly','');t.style.cssText='position:fixed;opacity:0';document.body.appendChild(t);t.select();t.setSelectionRange(0,u.length);
      var r=document.execCommand('copy');document.body.removeChild(t);if(r){ok();return;}}catch(e){}
    toast(u);
  };
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(ok,old);return;}}catch(e){}
  old();
}

// façon d'installer ici : 'prompt' (bouton du navigateur), 'ios' (Partager → écran d'accueil), 'android' (menu du navigateur), '' (rien à proposer)
function instWay(){
  if(isStandalone()||inAppName()||state.ui.instDone)return '';
  if(deferredInstall)return 'prompt';
  if(isIOS())return 'ios';
  if(isAndroid())return 'android';
  return '';
}
// la carte de l'Accueil revient 7 jours après « Plus tard », jusqu'à 3 refus. L'ancien « Plus tard » définitif compte comme un refus.
function instDue(){
  var l=state.ui.instLater;
  if(state.ui.hideInstall){delete state.ui.hideInstall;if(!l)l=state.ui.instLater={n:1,until:''};save0();}
  return !l||(l.n<INST_MAX_NO&&(!l.until||isoDate(today())>=l.until));
}
function instHtml(where){
  var k=instWay();if(!k)return '';
  trackDay('install_card_view',where+':'+k);
  var why='<p>Ton plan s’ouvre en plein écran depuis l’écran d’accueil, comme une vraie appli, et marche sans connexion, même au bord du bassin.</p>';
  var later='<button class="btn" data-act="instlater">Plus tard</button>';
  if(where==='bienvenue')later='';   // la présentation a déjà son bouton « C’est parti »
  var body=k==='prompt'?'<div class="btns"><button class="btn pri" data-act="doinstall" data-v="'+where+'">Installer l’app</button>'+later+'</div>':
    '<ol class="inst-st">'+(k==='ios'?
      '<li>Touche le bouton <b>Partager</b> '+ic('share',16)+' de Safari, en bas de l’écran ou dans le menu <b>•••</b></li><li>Choisis <b>« Sur l’écran d’accueil »</b></li><li>Touche <b>Ajouter</b></li>':
      '<li>Touche le menu <b>⋮</b> de ton navigateur</li><li>Choisis <b>« Installer l’application »</b> ou <b>« Ajouter à l’écran d’accueil »</b></li>')+'</ol>'+
    (later?'<div class="btns">'+later+'</div>':'');
  return '<section class="card inst"><div class="inst-h">'+ic('share',20)+'<b>Installe Triient sur ton téléphone</b></div>'+why+body+'</section>';
}
function instLater(silent){
  var l=state.ui.instLater||{n:0};l.n++;l.until=isoDate(addDays(today(),INST_LATER_DAYS));state.ui.instLater=l;save();
  if(!silent)track('install_later',String(l.n));
  render(true);
}
