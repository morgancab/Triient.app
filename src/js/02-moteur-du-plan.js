/* =====================================================================
   2. LE PLAN D’ENTRAÎNEMENT (généré – 25 semaines, cycles 3 charge + 1 décharge)
   Les jetons {b:z2} {r:im} {s:css} sont remplacés à l’affichage par RPE + zone (+ watts / bpm / allure
   si tu as renseigné tes repères dans les réglages).
   ===================================================================== */
// Par semaine : [natation Mar (m), natation Ven (m), vélo Mer (min), course Jeu (min), vélo long Sam (min), brick Sam (min), sortie longue Dim (min), renfo (min)]
var REF_VOL=[
  [1200,1500, 60,40,105, 0, 60,20],   // 1  reprise
  [1500,1600, 65,45,120, 0, 70,20],   // 2
  [1600,1800, 75,50,135, 0, 80,25],   // 3
  [1200,1400, 55,40, 90, 0, 55,20],   // 4  décharge
  [1800,2000, 80,50,150, 0, 85,25],   // 5
  [2000,2200, 85,55,165,10, 90,25],   // 6
  [2200,2400, 90,55,180,15,100,30],   // 7
  [1600,1800, 60,45,105, 0, 65,20],   // 8  décharge
  [2200,2400, 90,55,195,15,100,30],   // 9
  [2400,2600, 95,60,210,20,110,30],   // 10
  [2600,2800,100,60,225,20,120,30],   // 11
  [1800,2000, 65,45,135, 0, 70,20],   // 12 décharge
  [2600,2800,100,60,240,25,120,30],   // 13
  [2800,3000,105,65,255,30,130,30],   // 14
  [3000,3200,110,65,270,30,140,30],   // 15
  [2000,2200, 70,50,150, 0, 75,20],   // 16 décharge
  [3000,3200,110,70,285,30,140,30],   // 17
  [3200,3400,115,70,300,35,150,30],   // 18
  [3400,3600,120,75,315,40,150,30],   // 19
  [2200,2400, 75,50,165, 0, 80,20],   // 20 décharge
  [3400,3600,120,75,315,40,150,30],   // 21
  [3600,3800,120,75,330,45,150,30],   // 22 pic
  [3000,3200,100,65,240,25,110,25],   // 23 affûtage
  [2000,2200, 70,45,120,15, 60,15],   // 24 affûtage
  [0,0,0,0,0,0,0,0]                   // 25 semaine de course (détaillée à part)
];
var REF_META=[
  ['c1','Reprise douce : on installe la routine'],
  ['c2','Technique avant tout, ne force rien'],
  ['c3','Fin de bloc : la 3e semaine de charge'],
  ['rec','Décharge : absorbe le travail des 3 dernières semaines'],
  ['c1','Relance : le volume monte d’un cran'],
  ['c2','Premiers enchaînements vélo-course'],
  ['c3','Pic de la phase de fondation'],
  ['rec','Décharge : bilan de la fondation'],
  ['c1','Nouvelle phase : on introduit le tempo et le seuil'],
  ['c2','Force-endurance et sorties longues'],
  ['c3','Longues sorties : la nutrition passe en test'],
  ['rec','Décharge : respire avant le bloc suivant'],
  ['c1','Position aéro : première grosse semaine'],
  ['c2','Le volume vélo continue de monter'],
  ['c3','Pic de la phase de développement'],
  ['rec','Décharge : bilan avant la phase spécifique'],
  ['c1','Entrée en phase spécifique Ironman'],
  ['c2','Allure Ironman : blocs vélo et course'],
  ['c3','Grosse sortie : première répétition générale'],
  ['rec','Décharge : dernière récupération majeure'],
  ['c1','Spécifique : eau libre et bricks longs'],
  ['c2','Semaine pic : la plus chargée du programme'],
  ['taper','Affûtage 1/2 : on garde l’intensité, on baisse le volume'],
  ['taper','Affûtage 2/2 : place à la fraîcheur'],
  ['race','Semaine de course : Ironman des Sables d’Olonne']
];
var KIND={c1:'Charge 1/3',c2:'Charge 2/3',c3:'Charge 3/3',rec:'Décharge',taper:'Affûtage',race:'Semaine de course'};
var REF_PHASES=[
  {k:'base',n:'Fondation',a:1,b:8,col:'#48484a',tip:'Priorité à la régularité et à la technique de nage. Introduis la position aéro progressivement pour que le dos et la nuque s’habituent sans douleur.',d:'Technique, base d’endurance, régularité. Tout reste facile : tu construis le moteur et les tendons.'},
  {k:'dev',n:'Développement',a:9,b:16,col:'#6c6c70',tip:'Travaille la position aéro sur de longues durées, y compris face au vent. Premiers enchaînements vélo-course : chaussures prêtes, cadence de course courte et vive dès les premiers pas.',d:'Tempo, seuil et sorties longues. Premiers bricks et mise en place de la nutrition.'},
  {k:'spe',n:'Spécifique Ironman',a:17,b:22,col:'#a1a1a6',tip:'Reproduis la course : mer ou chenal en combinaison, vent latéral à vélo, nutrition identique au jour J. Garde le matériel de course pour les séances clés.',d:'Allure Ironman, position aéro, eau libre, bricks longs. Répétitions générales.'},
  {k:'taper',n:'Affûtage & course',a:23,b:25,col:'#e5e5ea',tip:'Moins de volume, même intensité sur des efforts courts. Dors, mange, hydrate-toi, prépare ton matériel et fais confiance à ton entraînement.',d:'Le volume baisse, le rythme reste. Fraîcheur avant tout.'}
];
var REF_BLOCKS=[
  {a:1,b:4,n:'Bloc 1 · Fondation',g:'Retrouver la routine, nager propre, construire l’endurance de base.'},
  {a:5,b:8,n:'Bloc 2 · Fondation',g:'Le volume monte, premiers petits enchaînements vélo-course.'},
  {a:9,b:12,n:'Bloc 3 · Développement',g:'Tempo, seuil et sorties longues : la force-endurance prend le relais.'},
  {a:13,b:16,n:'Bloc 4 · Développement',g:'Position aéro, bricks plus longs, nutrition testée grandeur nature.'},
  {a:17,b:20,n:'Bloc 5 · Spécifique',g:'Allure Ironman : blocs vélo, course sur jambes fatiguées, eau libre.'},
  {a:21,b:22,n:'Bloc 6 · Pic',g:'Les deux plus grosses semaines : répétitions générales avant l’affûtage.'},
  {a:23,b:25,n:'Bloc 7 · Affûtage & course',g:'On baisse le volume, on garde le rythme. Fraîcheur avant tout.'}
];
/* ---------- Génération du plan pour n semaines ----------
   Le plan de référence (Ironman, 25 semaines) sert de modèle : pour chaque semaine du nouveau plan, on prend la semaine de référence
   de même type (charge 1/2/3, décharge, affûtage) à la position la plus proche, puis on met les volumes à l'échelle (heures au pic)
   et on plafonne les sorties longues selon le format. Pour 25 semaines / Ironman / volume par défaut, le plan est identique au modèle. */
function fk(m){return (m/1000).toFixed(3).replace(/0+$/,'').replace(/\.$/,'').replace('.',',');}
function gx(s){
  if(IS_SABLES||typeof s!=='string')return s;
  return s.replace(/Eau libre \/ chenal/g,'Eau libre').replace(/Idéal en mer ou dans le chenal/g,'Idéal en eau libre').replace(/En mer ou dans le chenal/g,'En eau libre').replace(/mer ou chenal/g,'eau libre')
    .replace(/rafales côtières/g,'rafales').replace(/du marathon Ironman/g,FCLS==='full'?'du marathon':FCLS==='half'?'du semi-marathon':'de course').replace(/départ du marathon/g,FCLS==='full'?'départ du marathon':FCLS==='half'?'départ du semi-marathon':'départ de la course à pied').replace(/3,8 km/g,fk(RACE.swimM)+' km').replace(/178 km/g,fk(RACE.bikeM)+' km').replace(/42,195 km/g,fk(RACE.runM)+' km').replace(/Ironman/g,RL);
}
function rowMin(r){return R5(r[0]*22/1000)+R5(r[1]*22/1000)+r[2]+r[3]+r[4]+r[5]+r[6]+r[7];}
var REF_PEAK=Math.max.apply(null,REF_VOL.map(rowMin));                        // minutes de la semaine la plus chargée du modèle
var CAPS={sprint:[90,60,1800,15],olympic:[150,80,2600,20],half:[240,120,3200,30],full:[0,150,0,0]};   // plafonds [vélo long, sortie longue en minutes, natation en mètres, course après le vélo en minutes]
function genKinds(N,T){
  var B=N-1-T,k=[],i;
  for(i=1;i<=B;i++)k.push(['c1','c2','c3','rec'][(i-1)%4]);
  if(B>0&&k[B-1]==='rec')k[B-1]='c3';                                          // pas de décharge juste avant l'affûtage
  for(i=0;i<T;i++)k.push('taper');
  k.push('race');return k;
}
// Semaines de référence : charge, puis décharge (chacune après la charge d'indice REF_RX). Un plan se place sur cette courbe par interpolation.
var REF_C=[0,1,2,4,5,6,8,9,10,12,13,14,16,17,18,20,21],REF_R=[3,7,11,15,19],REF_RX=[2,5,8,11,14],REF_STEP=1.2;
function refMix(a,b,t){return a.map(function(v,i){var x=v+(b[i]-v)*t;return i<2?Math.round(x/100)*100:R5(x);}).map(function(v,i){return i===5&&v<10?0:v;});}
function refCurve(list,x){var i=Math.max(0,Math.min(list.length-1,Math.floor(x))),j=Math.min(list.length-1,i+1);return refMix(REF_VOL[list[i]],REF_VOL[list[j]],Math.max(0,Math.min(1,x-i)));}
// Pour chaque semaine : le volume de référence, et la semaine du modèle la plus proche (thème, contenu des séances)
function refPlan(kinds){
  var nc=kinds.filter(function(k){return k[0]==='c';}).length,last=REF_C.length-1,gap=Math.max(0,nc-1),span=Math.min(last,gap*REF_STEP),x0=gap*REF_STEP>=last?0:Math.min(6,last-span),step=gap?span/gap:0,j=-1,x=x0,tp=kinds.filter(function(k){return k==='taper';}).length,t=0;
  return kinds.map(function(k){
    if(k[0]==='c'){j++;x=x0+j*step;return {row:refCurve(REF_C,x),ref:REF_C[Math.round(x)]+1};}
    if(k==='rec'){var q=0;while(q<REF_RX.length-1&&REF_RX[q+1]<=x)q++;var f=x<=REF_RX[0]?0:x>=REF_RX[REF_RX.length-1]?q:q+(x-REF_RX[q])/(REF_RX[q+1]-REF_RX[q]);return {row:refCurve(REF_R,f),ref:REF_R[Math.round(f)]+1};}
    if(k==='taper'){var w=tp>1?22+t:22;t++;return {row:REF_VOL[w].slice(),ref:w+1};}
    return {row:REF_VOL[24].slice(),ref:25};
  });
}
// Colonnes de VOL : 0 natation A, 1 natation B, 2 vélo semaine, 3 course semaine, 4 vélo long, 5 brick, 6 sortie longue, 7 renfo
// Moins de séances : on garde d'abord natation A, vélo long et sortie longue, puis la course et le vélo de semaine, la 2e natation, enfin brick / renfo.
var SESS_MAX=12,ALLM=[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];   // ALLM : toutes les colonnes de VOL
function colMask(n,r){
  var x=[n>=9?1:0,n>=10?1:0,n>=11?1:0,n>=12?1:0];
  if(n>=8)return [1,1,1,1,1,1,1,1].concat(x);
  if(n===7)return [1,1,1,1,1,r[5]>0?1:0,1,r[5]>0?0:1].concat(x);
  return ({6:[1,1,1,1,1,0,1,0],5:[1,0,1,1,1,0,1,0],4:[1,0,0,1,1,0,1,0],3:[1,0,0,0,1,0,1,0]}[n]||[1,1,1,1,1,1,1,1]).concat(x);
}
function rowMinM(r,m){return (m[0]?R5(r[0]*22/1000):0)+(m[1]?R5(r[1]*22/1000):0)+(m[2]?r[2]:0)+(m[3]?r[3]:0)+(m[4]?r[4]:0)+(m[5]?r[5]:0)+(m[6]?r[6]:0)+(m[7]?r[7]:0)+
  (m[8]&&r[8]?R5(r[8]*22/1000):0)+(m[9]&&r[9]||0)+(m[10]&&r[10]||0)+(m[11]&&r[11]||0)+
  (m[12]&&r[12]||0)+(m[13]&&r[13]||0)+(m[14]&&r[14]||0)+(m[15]&&r[15]?R5(r[15]*22/1000):0)+(m[16]&&r[16]?R5(r[16]*22/1000):0)+(m[17]&&r[17]||0);}
/* Au-delà de 8 séances, 4 colonnes s'ajoutent, déduites de la semaine : 8 natation C (m, endurance), 9 footing facile (min),
   10 vélo d'endurance (min), 11 renforcement prévention (min). Ordre d'ajout : 9e, 10e, 11e, 12e séance.
   Puis, seulement par le réglage sport par sport (CFG.sc) : 12 footing du mardi, 13 footing du vendredi, 14 vélo facile du mardi,
   15 natation du mercredi (m), 16 natation du dimanche (m), 17 vélo facile du jeudi. Un sport n'a jamais deux séances le même jour. */
function extRow(r){
  return r.slice(0,8).concat([r[0]?Math.max(1000,Math.round(Math.min(r[0],r[1]||r[0])*0.8/100)*100):0,r[3]?Math.max(30,R5(r[3]*0.8)):0,r[2]?Math.max(45,R5(r[2]*0.9)):0,r[7]?Math.max(15,R5(r[7]*0.75)):0,
    r[3]?Math.max(30,R5(r[3]*0.75)):0,r[3]?Math.max(30,R5(r[3]*0.7)):0,r[2]?Math.max(45,R5(r[2]*0.8)):0,r[0]?Math.max(1000,Math.round(Math.min(r[0],r[1]||r[0])*0.7/100)*100):0,
    r[0]?Math.max(1000,Math.round(Math.min(r[0],r[1]||r[0])*0.6/100)*100):0,r[2]?Math.max(45,R5(r[2]*0.75)):0]);
}
function scaleRow(r,f,cap,mask){
  mask=mask||[1,1,1,1,1,1,1,1];
  if(r.length>8){   // colonnes 8 à 11 : mises à l'échelle à part, les 8 premières restent calculées comme avant
    // sport de chaque colonne 8 à 17 : s natation (m), r course, b vélo, t renfo ; plafonds : natation cap[2], footing cap[4], vélo cap[5], renfo cap[8]
    var XT='srbtrrbssb',x=r.slice(8),ex=f===1&&!cap?x.slice():x.map(function(v,i){var t=XT[i];return !v?0:t==='s'?Math.max(800,Math.round(v*f/100)*100):t==='r'?Math.max(25,R5(v*f)):t==='b'?Math.max(40,R5(v*f)):Math.max(10,R5(v*f));});
    if(cap)ex=ex.map(function(v,i){var c=cap[{s:2,r:4,b:5,t:8}[XT[i]]];return c&&v?Math.min(v,c):v;});
    var o8=scaleRow(r.slice(0,8),f,cap,mask.slice(0,8));
    if(cap&&cap[6]&&o8[3])o8[3]=Math.min(o8[3],cap[6]);
    if(cap&&cap[8]&&o8[7])o8[7]=Math.min(o8[7],cap[8]);
    if(cap&&cap[7]&&o8[2])o8[2]=Math.min(o8[2],cap[7]);
    return o8.concat(ex.map(function(v,i){return mask[8+i]?v:0;}));
  }
  if(f===1&&!cap)return r.map(function(x,i){return mask[i]?x:0;});
  var o=[Math.max(800,Math.round(r[0]*f/100)*100),Math.max(800,Math.round(r[1]*f/100)*100),Math.max(40,R5(r[2]*f)),Math.max(25,R5(r[3]*f)),Math.max(60,R5(r[4]*f)),r[5]?Math.max(10,R5(r[5]*f)):0,Math.max(35,R5(r[6]*f)),Math.max(15,R5(r[7]*f))];
  if(cap&&cap[0])o[4]=Math.min(o[4],cap[0]);
  if(cap&&cap[1])o[6]=Math.min(o[6],cap[1]);
  if(cap&&cap[2]){o[0]=Math.min(o[0],cap[2]);o[1]=Math.min(o[1],cap[2]);}
  if(cap&&cap[3])o[5]=Math.min(o[5],cap[3]);
  return o.map(function(x,i){return mask[i]?x:0;});
}
// bm : vélo en semaine [durée, récup, nombre] ; bl : blocs de la sortie longue (min) ; bt : blocs d'affûtage à vélo ; rm : course en semaine [durée, nombre] ; rt : blocs d'affûtage en course ; rl : blocs de la sortie longue ; rx : part de la sortie longue à allure de course
var SHORT=FCLS==='sprint'||FCLS==='olympic';
var RPX={sprint:{bm:[6,3,5],bl:10,bt:5,rm:[3,5],rt:2,rl:4},olympic:{bm:[12,4,3],bl:20,bt:10,rm:[5,4],rt:3,rl:8},half:{bm:[15,5,3],bl:40,bt:15,rm:[8,4],rt:4,rl:15},full:{bm:[20,5,3],bl:75,bt:20,rm:[10,4],rt:4,rl:40}}[FCLS]||null;
var T_TAPER=FMT.taper||1,KINDS=genKinds(NW,T_TAPER),REFP=refPlan(KINDS),REFW=REFP.map(function(p){return p.ref;});
/* Séances sport par sport (Plus → Ajuster mon entraînement) : CFG.sc = {swim, bike, run, brick, str}, nombre par semaine.
   Chaque sport prend ses colonnes dans l'ordre d'ajout : natation A, B, C ; vélo long, de semaine, d'endurance ; sortie longue, course de semaine,
   footing ; enchaînement (dès que le plan en prévoit) ; renfo A, B. Sans CFG.sc, le total du formulaire de course décide (colMask). */
var SC_COLS={swim:[0,1,8,15,16],bike:[4,2,10,14,17],run:[6,3,9,12,13],brick:[5],str:[7,11]},SC_MAX={swim:5,bike:5,run:5,brick:1,str:2},SC_MIN={swim:1,bike:1,run:1,brick:0,str:0};
function scMask(sc){var m=ALLM.map(function(){return 0;});Object.keys(SC_COLS).forEach(function(k){SC_COLS[k].slice(0,sc[k]||0).forEach(function(j){m[j]=1;});});return m;}
function scTotal(sc){return Object.keys(SC_COLS).reduce(function(t,k){return t+(sc[k]||0);},0);}
// répartition par défaut d'un total (celle de colMask, enchaînement compris)
function scDefault(n){var m=colMask(n,[1,1,1,1,1,1,1,1]),o={};Object.keys(SC_COLS).forEach(function(k){o[k]=SC_COLS[k].filter(function(j){return m[j];}).length;});return o;}
var NSESS0=Math.max(3,Math.min(SESS_MAX,CFG.sessions||8)),SC=CFG.sc||null,NSESS=SC?scTotal(SC):NSESS0;
// Volumes semaine par semaine. Le plan de base vient du total du formulaire (NSESS0) : au-delà de 8 séances (prépa chargée), plafonds XCAP,
// et le pic demandé est atteint en répartissant le reste sur les autres séances.
// XCAP : [vélo long, sortie longue (min), natation (m), course après le vélo, footing facile, vélo d'endurance, course de qualité, vélo de qualité, renfo] :
// en semaine, les séances restent plus courtes que les sorties longues du week-end.
// sc (réglage sport par sport) : mêmes durées de séance que le plan de base (même échelle, mêmes plafonds), seules les séances présentes
// changent. Ajouter une course ajoute ses minutes sans rien retirer aux autres sports ; en retirer une retire les siennes.
function volPlan(sc){
  var n=NSESS0,mask=function(r){return colMask(n,r);};
  var sub=Math.max.apply(null,REF_VOL.slice(0,24).map(function(r){r=extRow(r);return rowMinM(r,mask(r));}));   // heures du pic de référence avec ces séances (= REF_PEAK pour 8 séances)
  var pk=CFG.peak?CFG.peak*60/sub:1,pf=Math.abs(pk-1)<0.003?1:pk;
  var xcap=n>8?({full:[420,150,5000,75,110,180,120,210,60],half:[CAPS.half[0],CAPS.half[1],4000,CAPS.half[3],85,150,90,150,50],olympic:CAPS.olympic.concat([60,100,70,100,45]),sprint:CAPS.sprint.concat([45,70,50,70,30])})[FCLS]:null;
  var mk=function(f){return KINDS.map(function(k,i){var r=extRow(REFP[i].row);return k==='race'?ALLM.map(function(){return 0;}):scaleRow(r,f,xcap||(f===1&&FCLS==='full'?null:CAPS[FCLS]),mask(r));});};
  var V=mk(pf);
  if(xcap&&CFG.peak)for(var vi=0;vi<5;vi++){
    var vtop=Math.max.apply(null,V.map(function(v,i){return KINDS[i]==='taper'||KINDS[i]==='race'?0:rowMinM(v,ALLM);}));
    if(!vtop||Math.abs(CFG.peak*60/vtop-1)<0.01)break;
    pf*=CFG.peak*60/vtop;V=mk(pf);
  }
  if(sc){mask=function(){return scMask(sc);};V=mk(pf);}
  return V;
}
/* ---------- Volume par sport (Plus → Ajuster mon entraînement) ----------
   CFG.vt = {swim:[a,b], bike:[a,b], run:[a,b]} en minutes par semaine : la semaine de charge la plus légère du sport passe à a, la plus
   chargée à b, les autres suivent la même courbe (mise à l'échelle entre les deux). Décharges et affûtage gardent leur baisse : même facteur
   que la semaine de charge qui précède (affûtage : celui du pic). Chaque séance a un minimum et un plafond ; au plafond, le reste va aux
   autres séances du sport, et si toutes y sont, la cible n'est pas atteinte (l'écran du réglage le signale). Sans CFG.vt, rien ne change. */
var VT_SP={swim:[0,1,8,15,16],bike:[2,4,10,14,17],run:[3,5,6,9,12,13]},VT_MIN={0:800,1:800,8:800,15:800,16:800,2:40,4:60,10:40,14:40,17:40,3:25,5:10,6:35,9:25,12:25,13:25};
function vtCap(j){return ({0:5000,1:5000,8:4000,15:4000,16:4000,2:180,10:180,14:180,17:180,3:90,9:75,12:75,13:75,4:{sprint:180,olympic:240,half:330}[FCLS]||420,5:{sprint:30,olympic:45,half:60}[FCLS]||75,6:{sprint:90,olympic:120,half:150}[FCLS]||180})[j];}
function vtSwim(j){return j===0||j===1||j===8||j===15||j===16;}
function spMin(v,sp){return VT_SP[sp].reduce(function(t,j){return t+(v[j]?(vtSwim(j)?v[j]*22/1000:v[j]):0);},0);}
function isLoad(k){return k==='c1'||k==='c2'||k==='c3';}
// [semaine de charge la plus légère, la plus chargée] du sport, en minutes
function spRange(V,sp){var a=1e9,b=0;V.forEach(function(v,i){if(!isLoad(KINDS[i]))return;var m=spMin(v,sp);if(!m)return;a=Math.min(a,m);b=Math.max(b,m);});return b?[a,b]:null;}
// met les séances du sport à `target` minutes dans la semaine v (modifiée sur place)
function fitSp(v,sp,target){
  var cols=VT_SP[sp].filter(function(j){return v[j]>0;}),fixed={},k;
  var toM=function(j,x){return vtSwim(j)?x*22/1000:x;},fromM=function(j,m){return vtSwim(j)?Math.round(m*1000/22/100)*100:R5(m);};
  for(k=0;k<6;k++){
    var fx=0,fr=0,hit=false;
    cols.forEach(function(j){if(fixed[j])fx+=toM(j,v[j]);else fr+=toM(j,v[j]);});
    if(!fr)break;
    var f=Math.max(0,target-fx)/fr;
    if(Math.abs(f-1)<0.01)break;
    cols.forEach(function(j){
      if(fixed[j])return;
      var x=fromM(j,toM(j,v[j])*f),lo=Math.min(VT_MIN[j],v[j]),hi=Math.max(vtCap(j),v[j]);
      if(f>1&&x>=hi){x=hi;fixed[j]=1;hit=true;}else if(f<1&&x<=lo){x=lo;fixed[j]=1;hit=true;}
      v[j]=x;
    });
    if(!hit)break;
  }
  return v;
}
function adjVol(V0,vt){
  var V=V0.map(function(v){return v.slice();});
  Object.keys(VT_SP).forEach(function(sp){
    var t=vt&&vt[sp],r=spRange(V0,sp);if(!t||!r)return;
    var last=1,top=1,mx=0;
    V0.forEach(function(v0,i){
      var k=KINDS[i],m=spMin(v0,sp),tg;if(k==='race'||!m)return;
      if(isLoad(k)){tg=r[1]-r[0]<5?(t[0]+t[1])/2:t[0]+(m-r[0])/(r[1]-r[0])*(t[1]-t[0]);last=tg/m;if(m>=mx){mx=m;top=last;}}
      else tg=m*(k==='taper'?top:last);
      fitSp(V[i],sp,tg);
    });
  });
  return V;
}
// Une décharge reste sous 80 % de la semaine précédente et l'affûtage sous 75 % du pic, même sur un petit volume où les durées minimales gênent
function normVol(V){
  var all=ALLM,peak=0,top=0;
  var shrink=function(v,f){return v.map(function(x,j){return !x?0:j<2||j===8||j===15||j===16?Math.max(600,Math.round(x*f/100)*100):Math.max(j===5||j===11?5:15,R5(x*f));});};
  V.forEach(function(v,i){
    if(KINDS[i]!=='rec'||!i)return;
    var prev=rowMinM(V[i-1],all),cur=rowMinM(v,all);
    if(cur>prev*0.8)V[i]=shrink(v,prev*0.8/cur);
  });
  V.forEach(function(v,i){var m=rowMinM(v,all);if(KINDS[i]==='taper')top=Math.max(top,m);else if(KINDS[i]!=='race')peak=Math.max(peak,m);});
  if(!peak||top<=peak*0.75)return V;
  var f=peak*0.75/top;
  V.forEach(function(v,i){if(KINDS[i]==='taper')V[i]=shrink(v,f);});
  return V;
}
// plan complet pour un réglage {sc, vt} : séances par sport, puis heures par sport, puis décharges et affûtage
function volFor(sc,vt){var V0=volPlan(sc);return normVol(vt?adjVol(V0,vt):V0);}
var VOL0=volPlan(SC);                                  // volumes avant le réglage des heures (bornes « par défaut » des curseurs)
var VOL=normVol(CFG.vt?adjVol(VOL0,CFG.vt):VOL0.map(function(v){return v.slice();}));
var META=KINDS.map(function(k,i){return k==='race'?['race','Semaine de course : '+RNAME]:[k,k==='taper'&&T_TAPER===1?'Affûtage : on garde l’intensité, on baisse le volume':gx(REF_META[REFW[i]-1][1])];});
var BUILD=NW-1-T_TAPER,PH_E1=Math.max(1,Math.round(BUILD*8/22)),PH_E2=Math.min(BUILD-1,Math.max(PH_E1+1,Math.round(BUILD*16/22)));
var PHASES=REF_PHASES.map(function(p,i){
  var a=i===0?1:i===1?PH_E1+1:i===2?PH_E2+1:BUILD+1,b=i===0?PH_E1:i===1?PH_E2:i===2?BUILD:NW;
  return {k:p.k,n:i===2?'Spécifique '+RL:p.n,a:a,b:b,col:p.col,tip:gx(p.tip),d:gx(p.d)};
});
function phaseOf(w){return w<=PH_E1?PHASES[0]:w<=PH_E2?PHASES[1]:w<=BUILD?PHASES[2]:PHASES[3];}
var BLOCKS=(function(){
  var out=[],a=1,n=0,cnt={base:0,dev:0,spe:0},txt={base:[REF_BLOCKS[0].g,REF_BLOCKS[1].g],dev:[REF_BLOCKS[2].g,REF_BLOCKS[3].g],spe:[REF_BLOCKS[4].g]},nm={base:'Fondation',dev:'Développement',spe:'Spécifique'};
  while(a<=BUILD){
    var b=Math.min(BUILD,a+3),k=phaseOf(a).k,part=(b-a+1<4)&&a>1;
    n++;
    if(part)out.push({a:a,b:b,n:'Bloc '+n+' · Pic',g:gx(REF_BLOCKS[5].g)});
    else{var t=txt[k]||txt.spe;out.push({a:a,b:b,n:'Bloc '+n+' · '+nm[k],g:gx(t[Math.min(cnt[k],t.length-1)])});cnt[k]++;}
    a=b+1;
  }
  out.push({a:BUILD+1,b:NW,n:'Bloc '+(n+1)+' · Affûtage & course',g:gx(REF_BLOCKS[6].g)});
  return out;
})();

function S(sp,title,tag,min,lines,o){var s={sp:sp,title:title,tag:tag,min:min,lines:lines,m:0,sum:'',goal:''};for(var k in (o||{}))s[k]=o[k];return s;}
function blocks(main,blk,rest,maxN){
  var n=Math.max(1,Math.min(maxN,Math.floor((main+rest)/(blk+rest)))),used=n*blk+(n-1)*rest;
  return {n:n,fill:Math.max(0,main-used)};
}
function fill(b,txt){return b.fill>=8?[txt.replace('{x}',b.fill)]:[];}
var WU_BIKE='Échauffement 15 min : 5 min très facile {b:soft}, 5 min progressif jusqu’en zone 2, puis 3 × 1 min à 100 tr/min (récup 1 min)';
var CD_BIKE='Retour au calme 10 min : très souple {b:soft}, cadence 90 tr/min, étire-toi les hanches en descendant du vélo';
var WU_RUN='Échauffement 10 min : 5 min très facile {r:soft} + 5 min en zone 2 {r:z2}, puis gammes (2 × 20 m montées de genoux, talons-fesses, pas chassés)';
var STRIDES='3 accélérations de 15 s progressives jusqu’à ~90 % de ta vitesse max, récup 45 s au pas';

/* ---- Natation ---- */
// wk = séance structurée (syntaxe d'intervals.icu) : les cibles {S:..} {B:..} {R:..} sont remplacées à l'envoi (voir wkTgt)
function WK(a){return a.join('\n');}
function repW(n,work,rest){return n>1?(n-1)+'x\n'+work+'\n'+rest+'\n\n'+work:work;}
function swimSession(title,tag,goal,segs,sum,extra,wk){
  var tot=0,lines=[];segs.forEach(function(s){lines.push(s[0]);tot+=s[1];});
  return S('swim',title,tag,Math.max(15,R5(tot*22/1000)),lines.concat(extra||[]),{m:tot,sum:sum,goal:goal,wk:wk});
}
function swimA(w,kind,ph,t){
  var n;
  if(kind==='rec'){
    n=Math.max(4,Math.round((t-600)/100));
    return swimSession('Natation · Technique douce','Récup','Garder la sensation d’eau sans fatigue : nage longue, relâchée.',[
      ['Échauffement 500 m : 300 m souple {s:easy} + 4 × 50 m éducatifs (rattrapé, poings fermés), récup 15 s',500],
      ['Corps de séance : '+n+' × 100 m crawl très aisé {s:easy}, récup 15 s. Compte tes mouvements de bras par longueur et garde-le stable',n*100],
      ['Retour au calme 100 m : dos ou nage libre souple',100]],n+' × 100 m très aisé',undefined,
      WK(['Warmup','- 500mtr {S:easy}','','Main',repW(n,'- 100mtr {S:easy}','- 15s rest'),'','Cooldown','- 100mtr {S:easy}']));
  }
  if(kind==='taper'){
    n=Math.max(2,Math.round((t-900)/400));
    return swimSession('Natation · Rythme & fraîcheur','Affûtage','Garder le rythme de course sans fatigue : nage régulière, vive sur les 50 m.',[
      ['Échauffement 400 m souple, dont 4 × 50 m progressifs (de facile à rapide), récup 15 s',400],
      ['Corps de séance : '+n+' × 400 m à allure Ironman {s:im}, récup 30 s. Chaque 400 m au même temps (±3 s)',n*400],
      ['6 × 50 m vifs {s:fast}, récup 20 s : garde la sensation d’eau',300],
      ['Retour au calme 200 m souple {s:easy}',200]],n+' × 400 m allure Ironman',undefined,
      WK(['Warmup','- 400mtr {S:easy}','','Main',repW(n,'- 400mtr {S:im}','- 30s rest'),'',repW(6,'- 50mtr {S:fast}','- 20s rest'),'','Cooldown','- 200mtr {S:easy}']));
  }
  if(ph==='base'){
    n=Math.max(3,Math.round((t-600)/200));
    return swimSession('Natation · Technique & aisance','Technique','Améliorer la glisse et l’efficacité de nage : nager loin en dépensant peu.',[
      ['Échauffement 500 m : 300 m souple {s:easy} + 4 × 50 m éducatifs (rattrapé, poings fermés, 6 temps), récup 15 s',500],
      ['Corps de séance : '+n+' × 200 m crawl aisé {s:end}, récup 20 s. Objectif : même temps sur chaque 200 m',n*200],
      ['Retour au calme 100 m souple',100]],n+' × 200 m aisé',
      ['Points techniques : entrée de main dans l’alignement de l’épaule, expiration complète dans l’eau, rotation des hanches'],
      WK(['Warmup','- 500mtr {S:easy}','','Main',repW(n,'- 200mtr {S:end}','- 20s rest'),'','Cooldown','- 100mtr {S:easy}']));
  }
  if(ph==='dev'){
    n=Math.max(2,Math.round((t-1200)/200));
    return swimSession('Natation · Seuil & vitesse','Qualité','Relever le seuil de nage (CSS) pour tenir un rythme élevé plus longtemps.',[
      ['Échauffement 400 m : 200 m souple + 4 × 50 m progressifs',400],
      ['Série 1 : 6 × 100 m rapide {s:css}, récup 20 s. Les 6 temps à 2 s près',600],
      ['Série 2 : '+n+' × 200 m allure soutenue {s:im}, récup 20 s',n*200],
      ['Retour au calme 200 m souple {s:easy}',200]],'6 × 100 rapide + '+n+' × 200 soutenu',undefined,
      WK(['Warmup','- 400mtr {S:easy}','','Série 1',repW(6,'- 100mtr {S:css}','- 20s rest'),'','Série 2',repW(n,'- 200mtr {S:im}','- 20s rest'),'','Cooldown','- 200mtr {S:easy}']));
  }
  n=Math.max(2,Math.round((t-600)/400));
  return swimSession('Natation · Allure Ironman','Spécifique','Installer le rythme du jour J : régulier, économique, tenable 3,8 km.',[
    ['Échauffement 400 m : 200 m souple + 4 × 50 m progressifs',400],
    ['Corps de séance : '+n+' × 400 m régulier à allure Ironman {s:im}, récup 30 s. Chaque 400 m au même temps (±3 s)',n*400],
    ['Retour au calme 200 m souple {s:easy}',200]],n+' × 400 m allure Ironman',
    ['Sur le dernier 400 m : rythme de course et repérage (tête levée toutes les 8–10 mouvements)'],
    WK(['Warmup','- 400mtr {S:easy}','','Main',repW(n,'- 400mtr {S:im}','- 30s rest'),'','Cooldown','- 200mtr {S:easy}']));
}
function swimB(w,kind,ph,t){
  var n;
  if(kind==='rec'){
    n=Math.max(3,Math.round((t-400)/200));
    return swimSession('Natation · Endurance douce','Récup','Entretenir l’endurance de nage sans fatigue.',[
      ['Échauffement 300 m souple {s:easy}',300],
      ['Corps de séance : '+n+' × 200 m aisé {s:easy}, récup 15 s, pull-buoy optionnel',n*200],
      ['Retour au calme 100 m souple',100]],n+' × 200 m aisé',undefined,
      WK(['Warmup','- 300mtr {S:easy}','','Main',repW(n,'- 200mtr {S:easy}','- 15s rest'),'','Cooldown','- 100mtr {S:easy}']));
  }
  if(kind==='taper'){
    n=Math.max(2,Math.round((t-500)/500));
    return swimSession('Natation · Eau libre, rythme','Affûtage','Dernier contact avec l’eau libre : rythme de course, repérage, confiance.',[
      ['Échauffement 300 m souple {s:easy}',300],
      ['Corps de séance : '+n+' × 500 m régulier à allure Ironman {s:im}, récup 30 s',n*500],
      ['Retour au calme 200 m souple',200]],n+' × 500 m allure Ironman',
      ['Idéal en mer ou dans le chenal, en combinaison, accompagné et avec une bouée de sécurité'],
      WK(['Warmup','- 300mtr {S:easy}','','Main',repW(n,'- 500mtr {S:im}','- 30s rest'),'','Cooldown','- 200mtr {S:easy}']));
  }
  if(ph==='base'){
    n=Math.max(3,Math.round((t-400)/300));
    return swimSession('Natation · Endurance continue','Endurance','Construire l’endurance de base : nager longtemps à allure confortable.',[
      ['Échauffement 300 m souple {s:easy}',300],
      ['Corps de séance : '+n+' × 300 m crawl continu {s:end}, récup 30 s',n*300],
      ['Retour au calme 100 m souple',100]],n+' × 300 m continu',
      ['Dernière série en pull-buoy si tu veux travailler le gainage'],
      WK(['Warmup','- 300mtr {S:easy}','','Main',repW(n,'- 300mtr {S:end}','- 30s rest'),'','Cooldown','- 100mtr {S:easy}']));
  }
  if(ph==='dev'){
    n=Math.max(2,Math.round((t-1000)/400));
    return swimSession('Natation · Endurance & pull','Endurance','Allonger la distance nagée sans perdre la qualité de nage.',[
      ['Échauffement 400 m souple varié (crawl, dos, éducatifs)',400],
      ['Série 1 : '+n+' × 400 m crawl {s:end}, récup 30 s. Chaque 400 m un peu plus vite que le précédent si tu le sens',n*400],
      ['Série 2 : 2 × 200 m en pull-buoy {s:end}, récup 20 s',400],
      ['Retour au calme 200 m souple',200]],n+' × 400 m + 2 × 200 pull',undefined,
      WK(['Warmup','- 400mtr {S:easy}','','Série 1',repW(n,'- 400mtr {S:end}','- 30s rest'),'','Série 2',repW(2,'- 200mtr {S:end}','- 20s rest'),'','Cooldown','- 200mtr {S:easy}']));
  }
  n=Math.max(2,Math.round((t-500)/600));
  return swimSession('Natation · Eau libre / chenal','Spécifique','Reproduire la natation du jour J : repérage, houle, groupe, combinaison.',[
    ['Échauffement 300 m (ou 8 min) souple pour t’habituer à l’eau et à la combinaison {s:easy}',300],
    ['Corps de séance : '+n+' × 600 m régulier à allure Ironman {s:im}, récup 30 s',n*600],
    ['Retour au calme 200 m souple',200]],n+' × 600 m en eau libre',
    ['Idéal : mer ou chenal, avec ta combinaison, toujours accompagné et avec une bouée de sécurité',
     'En mer, raisonne à la durée : 600 m ≈ 12–15 min. Repérage tête levée toutes les 8–10 mouvements, respiration bilatérale, départs en groupe, virages de bouée',
     'Sans accès à l’eau libre : même séance en piscine, tête levée 1 mouvement sur 8 pour simuler le repérage'],
    WK(['Warmup','- 300mtr {S:easy}','','Main',repW(n,'- 600mtr {S:im}','- 30s rest'),'','Cooldown','- 200mtr {S:easy}']));
}

/* 3e natation (à partir de 9 séances) : endurance, nage continue et pull-buoy */
function swimC(w,kind,ph,t){
  var n;
  if(kind==='rec'||kind==='taper'){
    n=Math.max(3,Math.round((t-500)/100));
    return swimSession('Natation · Endurance souple',kind==='rec'?'Récup':'Affûtage','Nager pour récupérer : amplitude, glisse, aucune intensité.',[
      ['Échauffement 300 m souple {s:easy}',300],['Corps de séance : '+n+' × 100 m très aisé {s:easy}, récup 15 s, en alternant crawl et dos',n*100],['Retour au calme 200 m souple',200]],n+' × 100 m souple',undefined,
      WK(['Warmup','- 300mtr {S:easy}','','Main',repW(n,'- 100mtr {S:easy}','- 15s rest'),'','Cooldown','- 200mtr {S:easy}']));
  }
  n=Math.max(2,Math.round((t-600)/300));
  return swimSession('Natation · Endurance','Endurance','Accumuler du volume de nage à faible coût : c’est la 3e natation qui fait progresser le plus.',[
    ['Échauffement 400 m : 200 m souple {s:easy} + 4 × 50 m éducatifs, récup 15 s',400],
    ['Corps de séance : '+n+' × 300 m aisé {s:end}, récup 20 s. Un 300 m sur deux avec pull-buoy, respiration tous les 3 mouvements',n*300],
    ['Retour au calme 200 m souple {s:easy}',200]],n+' × 300 m aisé',['Garde la même allure du premier au dernier 300 m : c’est une séance d’endurance, pas de vitesse'],
    WK(['Warmup','- 400mtr {S:easy}','','Main',repW(n,'- 300mtr {S:end}','- 20s rest'),'','Cooldown','- 200mtr {S:easy}']));
}
/* 2e course (à partir de 10 séances) : footing facile, en plus de la séance de qualité et de la sortie longue */
function runEasy(w,kind,ph,t){
  if(kind==='rec'||kind==='taper')return S('run','Course · Footing de récupération',kind==='rec'?'Récup':'Affûtage',t,['Footing très facile {r:soft} : '+fm(t)+', allure conversation','Terrain souple si possible, aucune pression sur l’allure'],{sum:fm(t)+' très facile',goal:'Faire tourner les jambes sans fatigue.',wk:WK(['Main','- '+t+'m {R:soft}'])});
  return S('run','Course · Footing facile','Endurance',t,['Footing en endurance {r:z2} : '+(t-5)+' min, allure conversation',(ph==='base'?'Fin de séance : ':'Au milieu : ')+STRIDES,'Cadence 170–180 pas/min, foulée courte et relâchée'],{sum:fm(t)+' facile',goal:'Ajouter du volume de course en douceur : c’est le footing facile qui construit l’endurance et protège des blessures.',
    wk:WK(['Main','- '+(t-5)+'m {R:z2}','','- 5m {R:soft}'])});
}
/* 2e vélo en semaine (à partir de 11 séances) : endurance pure */
function bikeEasy(w,kind,ph,t){
  if(kind==='rec'||kind==='taper')return S('bike','Vélo · Sortie souple',kind==='rec'?'Récup':'Affûtage',t,[t+' min en endurance facile {b:soft}, cadence 90–95 tr/min','Route plate ou home-trainer, sans forcer'],{sum:t+' min facile',goal:'Faire circuler les jambes pour récupérer.',wk:WK(['Main','- '+t+'m {B:soft}'])});
  return S('bike','Vélo · Endurance','Endurance',t,['Échauffement 10 min très facile {b:soft}','Corps de séance : '+(t-15)+' min en endurance {b:z2}, cadence 85–95 tr/min, régulier','Toutes les 10 min : 1 min en cadence vive (100–105 tr/min), sans forcer','Retour au calme 5 min {b:soft}','Home-trainer ou route plate'],{sum:fm(t)+' endurance',goal:'Ajouter du volume à vélo sans fatigue : le moteur aérobie se construit à basse intensité.',
    wk:WK(['Warmup','- 10m {B:soft}','','Main','- '+(t-15)+'m {B:z2}','','Cooldown','- 5m {B:soft}'])});
}
/* 2e renforcement (12 séances) : prévention des blessures, complète la séance de force du mardi */
function strengthB(w,kind,ph,t){
  if(kind==='rec'||kind==='taper')return S('str','Renforcement · Mobilité','Léger',t,['Mobilité 10 min : hanches, chevilles, épaules, colonne thoracique','Gainage léger × 1 : planche 30 s, gainage latéral 20 s/côté'],{sum:'Mobilité + gainage léger',goal:'Rester souple et récupérer.'});
  return S('str','Renforcement · Prévention','Prévention',t,[
    'Circuit × 2, repos 30 s : montées sur pointes une jambe × 15/côté (lentes), tirage élastique bras tendus × 15, rotations externes d’épaule à l’élastique × 12/côté, Copenhague genou au sol 20 s/côté',
    'Pieds et chevilles : 1 min d’équilibre sur une jambe par côté, puis ramassage de serviette avec les orteils',
    'Gainage 2 × 40 s : planche + gainage latéral'],{sum:'Mollets, épaules, adducteurs + gainage',goal:'Protéger les zones qui encaissent le volume (tendon d’Achille, épaules du nageur, adducteurs).'});
}
/* ---- Renforcement ---- */
function strength(w,kind,ph,t){
  if(kind==='rec'||kind==='taper')
    return S('str','Renforcement · Gainage & mobilité','Léger',t,[
      'Circuit × 2, repos 30 s entre exercices : planche 30 s, gainage latéral 20 s/côté, pont fessier × 12, bird-dog × 8/côté',
      'Mobilité 5 min : fente basse avec rotation (× 5/côté), cercles de hanches, chat-vache, ouverture thoracique'],{sum:'Circuit gainage léger',goal:'Entretenir sans fatiguer : cette séance doit te laisser plus frais qu’avant.'});
  if(ph==='base')
    return S('str','Renforcement · Gainage & stabilité','Base',t,[
      'Circuit × 3, repos 45 s entre exercices : planche 40 s, gainage latéral 30 s/côté, pont fessier × 15, bird-dog × 10/côté',
      'Force au poids du corps × 3 : squats × 15, fentes marchées × 10/jambe, pompes × 10, rowing élastique × 12',
      'Mobilité 5 min : hanches, chevilles, épaules'],{sum:'Gainage + poids du corps',goal:'Solidifier le tronc et les hanches pour tenir la position aéro et protéger le dos.'});
  if(ph==='dev')
    return S('str','Renforcement · Force','Force',t,[
      'Force, 3 × 10, repos 90 s, charge modérée (10 reps avec 2 en réserve) : goblet squat, soulevé de terre roumain (haltères), tirage vertical ou élastique, fentes arrière',
      'Gainage 3 × 45 s : planche + gainage latéral, repos 30 s',
      'Mobilité 5 min : hanches, chevilles, épaules','Jamais jusqu’à l’échec : tu dois pouvoir courir le lendemain'],{sum:'Force charge modérée + gainage',goal:'Gagner en force utile (pédalage, foulée) sans prendre de masse inutile.'});
  return S('str','Renforcement · Entretien','Entretien',t,[
    '2 tours, repos 30 s : goblet squat × 10, pont fessier une jambe × 10/côté, rotation de tronc élastique × 12/côté, montées sur pointes × 15, gainage 45 s',
    'Charge légère à modérée : tu dois garder des jambes fraîches pour le week-end'],{sum:'Entretien + gainage',goal:'Maintenir les acquis de force, sans fatigue résiduelle.'});
}

/* ---- Vélo ---- */
function bikeMid(w,kind,ph,t){
  var WU=15,CD=10,main=t-WU-CD,b,eff,title,tag,sum,goal,extra=[],mainW;
  if(kind==='rec')
    return S('bike','Vélo · Sortie souple','Récup',t,[t+' min en endurance facile {b:soft}, cadence 90 tr/min','Au milieu : 6 × 20 s de cadence vive (100 tr/min et plus), sans forcer, récup 40 s','Route plate ou home-trainer'],{sum:t+' min facile',goal:'Faire circuler les jambes pour récupérer.',wk:WK(['Main','- '+t+'m {B:soft}'])});
  if(kind==='taper'){b=blocks(main,6,3,4);title='Vélo · Activation';tag='Affûtage';goal='Garder les jambes vives et affûtées avant la course.';eff='Corps de séance : '+b.n+' × 6 min à allure Ironman {b:im}, récup 3 min facile {b:soft}';sum=b.n+' × 6 min allure Ironman';mainW=repW(b.n,'- 6m {B:im}','- 3m {B:soft}');}
  else if(ph==='base'){b=blocks(main,8,4,6);title='Vélo · Cadence & force-endurance';tag='Qualité';goal='Gagner en force musculaire spécifique : pousser un gros braquet sans fatigue cardio.';eff='Corps de séance : '+b.n+' × 8 min en force-endurance {b:ft}, assis, 60–70 tr/min, récup 4 min à 90 tr/min {b:soft}';sum=b.n+' × 8 min force-endurance';mainW=repW(b.n,'- 8m {B:ft}','- 4m {B:soft}');}
  else if(ph==='dev'){var len=w<=12?10:15;b=blocks(main,len,5,w<=12?4:3);title='Vélo · Sweet spot';tag='Qualité';goal='Relever ta puissance soutenable : le travail le plus rentable avant la phase spécifique.';eff='Corps de séance : '+b.n+' × '+len+' min en sweet spot {b:sw}, cadence 85–95 tr/min, récup 5 min facile {b:soft}';sum=b.n+' × '+len+' min sweet spot';mainW=repW(b.n,'- '+len+'m {B:sw}','- 5m {B:soft}');}
  else{b=blocks(main,RPX.bm[0],RPX.bm[1],RPX.bm[2]);title='Vélo · Position aéro, allure Ironman';tag='Spécifique';goal='Tenir l’allure Ironman en position aéro, régulier et relâché.';eff='Corps de séance : '+b.n+' × '+RPX.bm[0]+' min en position aéro à allure Ironman {b:im}, cadence 85–90 tr/min, récup '+RPX.bm[1]+' min facile {b:soft}';sum=b.n+' × '+RPX.bm[0]+' min aéro allure Ironman';mainW=repW(b.n,'- '+RPX.bm[0]+'m {B:im}','- '+RPX.bm[1]+'m {B:soft}');extra=['Contrôle : dos plat, tête haute, regard à 10 m, épaules et mains relâchées. Une gorgée toutes les 10 min'];}
  var wk=WK(['Warmup','- 10m {B:soft}','- 5m {B:z2}','','Main',mainW].concat(b.fill>=8?['','- '+b.fill+'m {B:z2}']:[],['','Cooldown','- 10m {B:soft}']));
  return S('bike',title,tag,t,[WU_BIKE,eff].concat(fill(b,'Complète en endurance {b:z2} : {x} min'),extra,[CD_BIKE,'Home-trainer ou route']),{sum:sum,goal:goal,wk:wk});
}
function bikeLong(w,kind,ph,t){
  var b,len,blk;
  if(SHORT&&kind!=='c2')ph=kind==='rec'||kind==='taper'?ph:'base';
  if(kind==='rec')
    return S('bike','Vélo · Sortie longue souple','Récup',t,['Toute la sortie en endurance facile {b:z2}, cadence 85–95 tr/min : '+fm(t),'Route plate : profite, ne cherche aucune performance','Nutrition : 40–60 g de glucides par heure et 500 ml d’eau par heure'],{sum:fm(t)+' facile',goal:'Garder le volume en abaissant la fatigue.',wk:WK(['Main','- '+t+'m {B:z2}'])});
  if(kind==='taper'){
    var tl=RPX.bt;b=blocks(t-45,tl,10,w===23?2:1);
    return S('bike','Vélo · Sortie longue allégée','Affûtage',t,['Échauffement 30 min en endurance {b:z2}, cadence 90 tr/min',
      'Corps de séance : '+b.n+' × '+tl+' min à allure Ironman {b:im} en position aéro'+(b.n>1?', récup 10 min facile {b:soft}':''),
      'Reste de la sortie en endurance facile {b:z2}','Nutrition : applique exactement ton plan de course (60–90 g de glucides/h, 500–750 ml/h)'],{sum:fm(t)+' dont '+b.n+' × '+tl+' min allure Ironman',goal:'Dernière validation de l’allure et de la nutrition de course, sans fatigue.',
      wk:WK(['Warmup','- 30m {B:z2}','','Main',repW(b.n,'- '+tl+'m {B:im}','- 10m {B:soft}'),'','- '+Math.max(5,t-30-(b.n*tl+(b.n-1)*10))+'m {B:z2}'])});
  }
  if(ph==='base'){
    var aero=w<=4?10:w<=8?15:20;
    return S('bike','Vélo · Sortie longue d’endurance','Endurance',t,['Toute la sortie en endurance {b:z2} : '+fm(t)+'. Tu dois pouvoir tenir une conversation',
      'Cadence fluide 85–95 tr/min, relances douces en côte (assis)','Position aéro : '+aero+' min cumulées en tout (par tranches de 5 min), pas plus, pour habituer le dos et la nuque',
      'Nutrition : 60 g de glucides par heure (≈ 1 gel ou ½ barre toutes les 20 min) + 500 ml d’eau par heure'],{sum:fm(t)+' endurance',goal:'Construire la base d’endurance aérobie et les tendons.',wk:WK(['Main','- '+t+'m {B:z2}'])});
  }
  if(ph==='dev'){
    len=Math.min(w<=10?20:w<=12?25:30,RPX.bl/2);
    b=blocks(t-45,len,10,3);
    return S('bike','Vélo · Endurance + blocs allure Ironman','Long',t,['Échauffement 30 min en endurance {b:z2}, cadence 90 tr/min',
      'Corps de séance : '+b.n+' × '+len+' min à allure Ironman {b:im} en position aéro, récup 10 min facile {b:soft}','Entre et après les blocs : endurance {b:z2}',
      'Nutrition : 60 à 90 g de glucides par heure (≈ 20–25 g toutes les 20 min) + 500–750 ml/h. Teste ton plan de course'],{sum:fm(t)+' dont '+b.n+' × '+len+' min allure Ironman',goal:'Apprendre à rouler à allure Ironman en position aéro tout en mangeant.',
      wk:WK(['Warmup','- 30m {B:z2}','','Main',repW(b.n,'- '+len+'m {B:im}','- 10m {B:soft}'),'','- '+Math.max(5,t-30-(b.n*len+(b.n-1)*10))+'m {B:z2}'])});
  }
  blk=Math.min(R5(Math.min(150,t*0.45)/2),RPX.bl);
  return S('bike','Vélo · Sortie longue spécifique','Spécifique',t,['Échauffement 45 min en endurance {b:z2}',
    'Corps de séance : 2 × '+blk+' min à allure Ironman {b:im} en position aéro, récup 15 min facile {b:soft} entre les blocs','Fin de sortie : endurance facile {b:z2}, cadence 90 tr/min',
    'Régularité : puissance stable, pas d’à-coups (variabilité faible). Mange 20–25 g de glucides toutes les 20 min',
    'Nutrition = plan de course exact (boisson, gels, sel : 60–90 g de glucides/h, 500–750 ml/h). Matériel de course : vélo, position, roues',
    'Si possible sur un parcours exposé au vent pour t’habituer aux rafales côtières'],{sum:fm(t)+' dont 2 × '+blk+' min allure Ironman',goal:'Répétition générale : tenir l’allure et la nutrition sur de longues durées.',
    wk:WK(['Warmup','- 45m {B:z2}','','Main',repW(2,'- '+blk+'m {B:im}','- 15m {B:soft}'),'','- '+Math.max(5,t-45-(2*blk+15))+'m {B:z2}'])});
}
function brick(w,kind,ph,t){
  var base='Brick · Enchaînement vélo-course';
  if(SHORT&&kind!=='c2'&&kind!=='taper')ph='base';
  if(kind==='taper')return S('brick',base,'Affûtage',t,[t+' min de course facile {r:z2} juste après le vélo, avec 3 accélérations de 20 s','Transition rapide (moins de 3 min)'],{sum:t+' min facile',goal:'Garder le réflexe de l’enchaînement sans fatigue.',wk:WK(['Main','- '+t+'m {R:z2}'])});
  if(ph==='base')return S('brick',base,'Brick',t,[t+' min de course à pied tout de suite après le vélo (transition < 3 min), allure facile {r:z2}','Foulée courte, cadence vive : les jambes sont lourdes, c’est normal','Prépare tes chaussures de course à portée de main avant de partir'],{sum:t+' min facile',goal:'Habituer les jambes au passage vélo → course.',wk:WK(['Main','- '+t+'m {R:z2}'])});
  if(ph==='dev')return S('brick',base,'Brick',t,[t+' min à allure Ironman {r:im} juste après le vélo','Les 5 premières minutes : laisse les jambes se débloquer, ne pars pas trop vite','Transition rapide : chaussures de course, casquette, c’est parti'],{sum:t+' min allure Ironman',goal:'Trouver ton allure Ironman à pied sur jambes fatiguées.',wk:WK(['Main','- '+t+'m {R:im}'])});
  return S('brick',base,'Spécifique',t,[t+' min à allure Ironman {r:im} juste après le vélo','Simule la transition T2 : casque, chaussures, casquette, nutrition','Cadence 170–180 pas/min, foulée courte, relâché'],{sum:t+' min allure Ironman',goal:'Reproduire le départ du marathon : régulier dès les premiers mètres.',wk:WK(['Main','- '+t+'m {R:im}'])});
}

/* ---- Course à pied ---- */
function runMid(w,kind,ph,t){
  var b,main;
  if(kind==='rec')return S('run','Course · Footing souple','Récup',t,['Footing très facile {r:soft} : '+t+' min. Tu peux parler sans effort','Fin de séance : 4 × 15 s de lignes droites relâchées, récup 45 s'],{sum:t+' min facile',goal:'Relancer la circulation, sans stress musculaire.',wk:WK(['Main','- '+t+'m {R:soft}'])});
  if(kind==='taper'){main=t-20;b=blocks(main,RPX.rt,2,4);
    return S('run','Course · Footing & rythme','Affûtage',t,[WU_RUN,'Corps de séance : '+b.n+' × '+RPX.rt+' min à allure Ironman {r:im}, récup 2 min au trot {r:soft}'].concat(fill(b,'Complète en footing facile {r:z2} : {x} min'),['Retour au calme 10 min facile {r:soft}']),{sum:b.n+' × '+RPX.rt+' min allure Ironman',goal:'Garder le rythme de course sans fatigue.',
      wk:WK(['Warmup','- 5m {R:soft}','- 5m {R:z2}','','Main',repW(b.n,'- '+RPX.rt+'m {R:im}','- 2m {R:soft}')].concat(b.fill>=8?['','- '+b.fill+'m {R:z2}']:[],['','Cooldown','- 10m {R:soft}']))});}
  if(ph==='base')return S('run','Course · Footing & lignes droites','Endurance',t,[WU_RUN,'Footing en endurance {r:z2} : '+(t-25)+' min','6 × 20 s de lignes droites relâchées (~90 % de ta vitesse max), récup 40 s au trot','Retour au calme 5 min'],{sum:(t-25)+' min endurance + 6 lignes droites',goal:'Entretenir l’endurance et la vivacité de foulée.',
    wk:WK(['Warmup','- 5m {R:soft}','- 5m {R:z2}','','Main','- '+(t-20)+'m {R:z2}','','Cooldown','- 5m {R:soft}'])});
  if(ph==='dev'){main=t-25;b=blocks(main,8,2,4);
    return S('run','Course · Tempo','Qualité',t,[WU_RUN,'Corps de séance : '+b.n+' × 8 min à allure tempo {r:tempo}, soutenue mais contrôlée, récup 2 min au trot {r:soft}'].concat(fill(b,'Complète en footing facile {r:z2} : {x} min'),['Retour au calme 10 min facile {r:soft}']),{sum:b.n+' × 8 min tempo',goal:'Relever l’allure que tu peux tenir longtemps (seuil aérobie).',
      wk:WK(['Warmup','- 10m {R:soft}','- 5m {R:z2}','','Main',repW(b.n,'- 8m {R:tempo}','- 2m {R:soft}')].concat(b.fill>=8?['','- '+b.fill+'m {R:z2}']:[],['','Cooldown','- 10m {R:soft}']))});}
  main=t-(SHORT?20:25);b=blocks(main,RPX.rm[0],2,RPX.rm[1]);
  return S('run','Course · Allure Ironman','Spécifique',t,[WU_RUN,'Corps de séance : '+b.n+' × '+RPX.rm[0]+' min à allure Ironman {r:im}, récup 2 min au trot {r:soft}','Cadence 170–180 pas/min, foulée courte, relâché'].concat(fill(b,'Complète en footing facile {r:z2} : {x} min'),['Retour au calme 10 min facile {r:soft}']),{sum:b.n+' × '+RPX.rm[0]+' min allure Ironman',goal:'Ancrer l’allure du marathon Ironman : régulière et économique.',
    wk:WK(['Warmup',SHORT?'- 5m {R:soft}':'- 10m {R:soft}','- 5m {R:z2}','','Main',repW(b.n,'- '+RPX.rm[0]+'m {R:im}','- 2m {R:soft}')].concat(b.fill>=8?['','- '+b.fill+'m {R:z2}']:[],['','Cooldown','- 10m {R:soft}']))});
}
function runLong(w,kind,ph,t){
  var blk;
  if(SHORT&&kind!=='rec'&&kind!=='taper')ph='base';
  if(kind==='rec')return S('run','Course · Sortie longue facile','Récup',t,['Endurance très facile {r:soft} : '+fm(t),'Marche autorisée si besoin, aucune pression sur l’allure'],{sum:fm(t)+' très facile',goal:'Conserver l’endurance en récupérant.',wk:WK(['Main','- '+t+'m {R:soft}'])});
  if(kind==='taper')return S('run','Course · Sortie longue allégée','Affûtage',t,['Endurance facile {r:z2} : '+fm(t),'Fin de sortie : 4 × 20 s de lignes droites relâchées'],{sum:fm(t)+' facile',goal:'Rester en rythme sans entamer la fraîcheur.',wk:WK(['Main','- '+t+'m {R:z2}'])});
  if(ph==='base')return S('run','Course · Sortie longue','Long',t,['Endurance {r:z2} : '+fm(t)+', allure conversation','Marche d’1 min autorisée toutes les 15–20 min si besoin : ça protège les tendons','Terrain : alterne route et chemin pour varier les appuis','Emporte de l’eau (400–500 ml par heure)'],{sum:fm(t)+' endurance',goal:'Construire la résistance musculaire et tendineuse.',wk:WK(['Main','- '+t+'m {R:z2}'])});
  if(ph==='dev')return S('run','Course · Sortie longue progressive','Long',t,['Durée totale '+fm(t),(t-25)+' min en endurance {r:z2}','Puis 20 min en progressif jusqu’à l’allure tempo {r:tempo}','Dernières 5 min : retour au calme {r:soft}'],{sum:fm(t)+' dont 20 min progressif',goal:'Apprendre à finir plus vite qu’on a commencé.',wk:WK(['Main','- '+(t-25)+'m {R:z2}','- 20m {R:tempo}','- 5m {R:soft}'])});
  if(kind!=='c2')return S('run','Course · Sortie longue sur jambes fatiguées','Long',t,['Endurance {r:z2} : '+fm(t)+', au lendemain du vélo long','Reste facile : c’est la durée et la fatigue du vélo qui font le travail, pas l’allure','Cadence 170–180 pas/min, foulée courte. Marche 1 min si la foulée se dégrade','Nutrition : 30–60 g de glucides/h et 400–500 ml/h, comme le jour J'],{sum:fm(t)+' endurance',goal:'Courir longtemps sur jambes fatiguées sans accumuler trop de fatigue.',wk:WK(['Main','- '+t+'m {R:z2}'])});
  blk=Math.min(R5(t*0.2),RPX.rl);
  return S('run','Course · Longue allure Ironman','Spécifique',t,['Durée totale '+fm(t)+', sur jambes déjà fatiguées par le vélo long de la veille','Échauffement 15 min facile {r:z2}','Corps de séance : 2 × '+blk+' min à allure Ironman {r:im}, récup 5 min au trot {r:soft}','Reste de la sortie en footing facile {r:z2}, cadence 170–180 pas/min','Nutrition : 30–60 g de glucides/h et 400–500 ml/h, comme le jour J'],{sum:fm(t)+' dont 2 × '+blk+' min allure Ironman',goal:'Reproduire la fatigue du marathon Ironman en gardant une foulée propre.',
    wk:WK(['Warmup','- 15m {R:z2}','','Main',repW(2,'- '+blk+'m {R:im}','- 5m {R:soft}'),'','- '+Math.max(5,t-15-(2*blk+5))+'m {R:z2}'])});
}
function restDay(w){
  return S('rest','Repos complet','Récup',0,['Sommeil 8 h si possible, hydratation, repas équilibrés : c’est là que tu progresses','Option : 10 min de mobilité douce ou d’étirements','Pas de cardio aujourd’hui'].concat(w===NW?['Dernière bonne nuit de la semaine : garde ta routine habituelle']:[]),{sum:'Récupération totale',goal:'Absorber la charge de la semaine.'});
}
function raceDays(){
  var rd=(RACE_DATE.getDay()+6)%7,sht=FCLS==='sprint'||FCLS==='olympic',dn=function(m){return fk(m)+' km';};
  var pre=[
    [restDay(NW)],
    [swimSession('Natation · Rappel de vitesse','Affûtage','Réveiller la nage sans fatigue.',[['Échauffement 400 m souple {s:easy}',400],['4 × 200 m à allure Ironman {s:im}, récup 30 s',800],['4 × 50 m vifs {s:fast}, récup 20 s',200],['Retour au calme 200 m souple',200]],'4 × 200 m + 4 × 50 vif',undefined,WK(['Warmup','- 400mtr {S:easy}','','Main',repW(4,'- 200mtr {S:im}','- 30s rest'),'',repW(4,'- 50mtr {S:fast}','- 20s rest'),'','Cooldown','- 200mtr {S:easy}'])),
     S('str','Mobilité & gainage léger','Léger',15,['Circuit × 1 : planche 30 s, gainage latéral 20 s/côté, pont fessier × 12','Mobilité douce : hanches, chevilles, épaules'],{sum:'Gainage + mobilité',goal:'Détendre le corps.'})],
    [S('bike','Vélo · Activation','Affûtage',45,[WU_BIKE,'3 × 4 min à allure Ironman {b:im}, récup 3 min facile','3 × 20 s d’accélérations en cadence vive (110 tr/min)',CD_BIKE,'Vérifie ton vélo : pneus (pression), freins, transmission, batterie des dérailleurs'],{sum:'3 × 4 min allure Ironman',goal:'Dernier réglage des sensations et du matériel.',wk:WK(['Warmup','- 10m {B:soft}','- 5m {B:z2}','','Main',repW(3,'- 4m {B:im}','- 3m {B:soft}'),'','Cooldown','- 10m {B:soft}'])})],
    [S('run','Course · Dernier footing','Affûtage',30,['10 min de footing facile {r:z2}','4 × 20 s de lignes droites relâchées, récup 1 min','Retour au calme 10 min facile {r:soft}'],{sum:'30 min facile + 4 lignes droites',goal:'Se sentir léger, sans fatiguer.',wk:WK(['Main','- 20m {R:z2}','- 10m {R:soft}'])})],
    [S('swim','Natation · Rinçage','Affûtage',20,['15 à 20 min dans l’eau, très souple {s:easy} : repère le site de départ, la sortie, les bouées','En mer ou dans le chenal si les conditions le permettent',sht?'Retrait du dossard et briefing : selon le programme officiel de l’épreuve':'Retrait du dossard, briefing, dépôt des sacs : selon le programme officiel de l’épreuve'],{m:800,sum:'20 min souple en eau libre',goal:'Repérer les lieux et se détendre.',wk:WK(['Main','- 800mtr {S:easy}'])})],
    [S('bike','Vélo · Dernier réglage','Affûtage',20,['10 min facile {b:soft} + 3 × 1 min à allure Ironman {b:im}',sht?'Prépare ton sac et ton vélo : pas besoin de surcharger en glucides pour un effort aussi court':'Dépôt du vélo et des sacs de transition selon le programme officiel',sht?'Repas habituel riche en glucides, hydratation, nuit longue':'Repas riche en glucides (8–10 g/kg sur les dernières 24 h, éprouvé à l’entraînement), hydratation, nuit longue'],{sum:'20 min, 3 × 1 min allure Ironman',goal:'Vérifier que tout fonctionne la veille.',wk:WK(['Warmup','- 10m {B:soft}','','Main',repW(3,'- 1m {B:im}','- 1m {B:soft}'),'','Cooldown','- 5m {B:soft}'])}),
     S('run','Course · Rappel','Affûtage',10,['5 min facile {r:soft} + 3 × 20 s de lignes droites relâchées','Prépare tes affaires de course : check-list complète'],{sum:'10 min facile',goal:'Activer les jambes.',wk:WK(['Main','- 10m {R:z2}'])})]
  ];
  var lines=sht?[
      'Avant le départ : petit-déjeuner 2 h 30 à 3 h avant (1–2 g de glucides/kg, éprouvé à l’entraînement), eau jusqu’à 1 h avant, un gel 15 min avant si besoin',
      'Natation '+dn(RACE.swimM)+' : pars sur ton rythme {s:im}, nage long et régulier, repère-toi toutes les 8–10 mouvements',
      'Vélo '+dn(RACE.bikeM)+' : engage-toi dès le début mais reste régulier, allure course {b:im}. De l’eau et un gel suffisent',
      'Course '+dn(RACE.runM)+' : les premiers kilomètres, tu te retiens {r:im}, puis tu accélères sur la fin si les jambes répondent',
      'Rien de nouveau le jour J : matériel, nutrition et allures éprouvés à l’entraînement']
    :[
      'Avant le départ : petit-déjeuner 2 h 30 à 3 h avant (1–2 g de glucides/kg, éprouvé à l’entraînement), 500 ml de boisson jusqu’à 1 h avant, un gel 15 min avant',
      'Natation '+dn(RACE.swimM)+' : place-toi sur ton rythme {s:im}, nage long et régulier, repère-toi toutes les 8–10 mouvements',
      'Vélo '+dn(RACE.bikeM)+' : les 30 premières minutes plus lentes que prévu. Allure Ironman {b:im}. Mange 20–25 g de glucides toutes les 20 min (60–90 g/h), bois 500–750 ml/h, sel selon la chaleur',
      'Course '+dn(RACE.runM)+' : les 10 premiers km, tu te retiens {r:im}. Aux ravitaillements, marche si besoin, mange, bois, garde le sourire',
      'Rien de nouveau le jour J : matériel, nutrition et allures éprouvés à l’entraînement'];
  var race=S('race',RNAME.toUpperCase(),'Jour J',0,lines,{sum:dn(RACE.swimM)+' · '+dn(RACE.bikeM)+' · '+dn(RACE.runM),goal:'Exécuter le plan : partir prudent, finir fort.',tip:'Tout le travail est fait. Profite de chaque kilomètre.'});
  var days=[[],[],[],[],[],[],[]],i;
  for(i=0;i<6;i++){var di=rd-6+i;if(di>=0)days[di]=pre[i];}                      // le motif se cale sur le jour de course
  days[rd]=[race];
  for(i=rd+1;i<7;i++)days[i]=[S('rest','Repos complet','Récup',0,['Récupère : marche, hydratation, repas équilibrés, sommeil','Félicite-toi : le plus dur est fait'],{sum:'Récupération totale',goal:'Récupérer de la course.'})];
  return days;
}

// Séances ajoutées au-delà de 8 : s.ex = colonne de VOL (8 à 17), pour les adapter (vacances) avec le bon constructeur.
// Placement : mer. vélo + footing, jeu. course + natation C + renfo B, ven. natation + vélo d'endurance (un seul sport par jour et par type).
// Réglage sport par sport : footings mar. et ven., vélo facile mar. puis jeu., natation mer. puis dim. Le lundi reste au repos.
function ex(s,c){s.ex=c;return s;}
function buildPlan(){
  var weeks=[],w,d,i;
  for(w=1;w<=NW;w++){
    var v=VOL[w-1],meta=META[w-1],kind=meta[0],rw=REFW[w-1],ph=phaseOf(w).k,days;
    if(w===NW)days=raceDays();
    else{
      days=[
        [restDay(w)],
        (v[0]>0?[swimA(rw,kind,ph,v[0])]:[]).concat(v[7]>0?[strength(rw,kind,ph,v[7])]:[],v[12]>0?[ex(runEasy(rw,kind,ph,v[12]),12)]:[],v[14]>0?[ex(bikeEasy(rw,kind,ph,v[14]),14)]:[]),
        (v[2]>0?[bikeMid(rw,kind,ph,v[2])]:[]).concat(v[9]>0?[ex(runEasy(rw,kind,ph,v[9]),9)]:[],v[15]>0?[ex(swimC(rw,kind,ph,v[15]),15)]:[]),
        (v[3]>0?[runMid(rw,kind,ph,v[3])]:[]).concat(v[8]>0?[ex(swimC(rw,kind,ph,v[8]),8)]:[],v[11]>0?[ex(strengthB(rw,kind,ph,v[11]),11)]:[],v[17]>0?[ex(bikeEasy(rw,kind,ph,v[17]),17)]:[]),
        (v[1]>0?[swimB(rw,kind,ph,v[1])]:[]).concat(v[10]>0?[ex(bikeEasy(rw,kind,ph,v[10]),10)]:[],v[13]>0?[ex(runEasy(rw,kind,ph,v[13]),13)]:[]),
        (v[4]>0?[bikeLong(rw,kind,ph,v[4])]:[]).concat(v[5]>0?[brick(rw,kind,ph,v[5])]:[]),
        (v[6]>0?[runLong(rw,kind,ph,v[6])]:[]).concat(v[16]>0?[ex(swimC(rw,kind,ph,v[16]),16)]:[])
      ];
      days.forEach(function(l,di){if(!l.length){var rs=restDay(w);rs.fr=1;days[di]=[rs];}});     // jour sans séance : repos (disponible pour recevoir une séance déplacée)
    }
    var start=addDays(PLAN_START,(w-1)*7),wk={n:w,start:start,kind:kind,theme:meta[1],ph:phaseOf(w),days:[],min:0,m:0,count:0};
    for(d=0;d<7;d++){
      var list=days[d];
      for(i=0;i<list.length;i++){
        var s=list[i];s.id=w+'.'+d+'.'+s.sp;s.w=w;s.d=d;
        if(!IS_SABLES){s.title=gx(s.title);s.tag=gx(s.tag);s.sum=gx(s.sum);s.goal=gx(s.goal);if(s.tip)s.tip=gx(s.tip);s.lines=s.lines.map(gx);}
        if(s.sp!=='rest'){wk.count++;wk.min+=s.min;wk.m+=s.m;}
      }
      wk.days.push({i:d,name:DAYS[d],date:addDays(start,d),sessions:list});
    }
    weeks.push(wk);
  }
  return weeks;
}
var PLAN=buildPlan();

/* ---- Repères personnels : jetons {b:z2} {r:im} {s:css} → RPE + zone (+ watts / bpm / allure) ---- */
var BK={soft:['RPE 2–3',0,.55],z2:['RPE 3–4',.56,.75],ft:['RPE 6',.80,.90],im:['RPE 5–6',.70,.76],sw:['RPE 7',.88,.94]};
var RN={soft:['RPE 2–3',0,.69,90,120],z2:['RPE 3–4',.70,.79,70,100],im:['RPE 5',.78,.84,45,65],tempo:['RPE 6–7',.85,.90,10,20]};
var SW={easy:['RPE 3–4',12,20],end:['RPE 4–5',8,14],im:['RPE 5',4,8],css:['RPE 7',-1,1],fast:['RPE 8',-6,-2]};
// L'allure de course dépend de la distance : un sprint se court bien plus vite qu'un Ironman
var RP_IM={sprint:{b:['RPE 8',.92,1],r:['RPE 8–9',.90,.95,-15,-5],s:['RPE 8',-4,-1]},olympic:{b:['RPE 7–8',.88,.95],r:['RPE 8',.87,.92,0,10],s:['RPE 7',-1,2]},half:{b:['RPE 6–7',.78,.85],r:['RPE 6–7',.82,.87,20,35],s:['RPE 6',2,6]}}[FCLS];
if(RP_IM){BK.im=RP_IM.b;RN.im=RP_IM.r;SW.im=RP_IM.s;}
function mmss(s){s=Math.round(s);return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2);}
function parseT(s){var m=/^\s*(\d+)[:'’](\d{1,2})\s*$/.exec(s||'');return m?(+m[1])*60+(+m[2]):0;}
/* ---------- Repères automatiques (Garmin) : zones de FC, allures et vitesses issues de tes activités ----------
   Zones : celles d’intervals.icu (souvent 7 zones de FC, les zones 5 et plus sont regroupées à l’affichage). Allures / vitesses à une FC donnée : régression sur tes sorties des 26
   dernières semaines. Allure « Ironman » : celle de ton estimation de course (onglet Course), scénario réaliste.
   Les repères saisis à la main dans les réglages restent prioritaires, discipline par discipline. */
var APc={k:'',v:null};
function autoProf(){
  var sv=state.sv||{},acts=sv.acts||[],m=sv.meta||{},hz=sv.hrz||m.hrz;
  if(!acts.length||!hz||hz.length<5)return null;
  var key=acts.length+':'+(acts[0]&&acts[0].id)+':'+JSON.stringify(state.ui.race||{})+':'+hz.join(',');
  if(APc.k===key)return APc.v;
  var all=dataActs(),P=raceParams(),E=estRace(all,Object.assign({},P,{scen:'real'}),null),base=idxOfDate(today()),ap={hz:hz,P:P};
  var win=all.filter(function(a){var d=dayIdx(a);return d<=base&&d>base-182;});
  var rr=win.filter(function(a){return a.t!=='VirtualRun'&&/Run/.test(a.t)&&a.m>=4000&&a.d>=1500&&a.h>0;}).map(function(a){return [a.m/a.d,a.h,a.z/a.m*1000,wtOf(a,base)];});
  var fr=fitLin(rr);
  if(fr&&fr.c[1]>0.005&&fr.r2>0.15){var er=medianOf(rr.map(function(r){return r[2];}));ap.runAt=function(hr){var v=fr.c[0]+fr.c[1]*hr+fr.c[2]*er;return v>0.5?Math.max(270,Math.min(540,1000/v)):null;};}
  var rb=win.filter(function(a){return a.t!=='VirtualRide'&&/Ride/.test(a.t)&&a.m>=15000&&a.d>=2700&&a.h>0;}).map(function(a){return [a.m/a.d*3.6,a.h,a.z/a.m*1000,wtOf(a,base)];});
  var fb=fitLin(rb);
  if(fb&&fb.c[1]>0.02&&fb.r2>0.15){var eb=medianOf(rb.map(function(r){return r[2];}));ap.bikeAt=function(hr){var v=fb.c[0]+fb.c[1]*hr+fb.c[2]*eb;return v>8?Math.max(12,Math.min(40,v)):null;};}
  // Allure à viser en séance : le temps estimé compte la fatigue, les arrêts et les ravitaillements du jour J, pas la cible d'un bloc.
  // Elle reste toujours plus rapide que l'endurance, pour qu'un bloc ne soit jamais plus lent que son échauffement.
  if(E.run){ap.imRun=E.run.t/RSCEN.real.rn/RACE.runM*1000;var zr=ap.runAt&&ap.runAt(hz[1]);if(zr)ap.imRun=Math.min(ap.imRun,zr/1.03);}
  if(E.bike){ap.imBike=RACE.bikeM/((E.bike.t-240*FF)/(1+0.03*FF))*3.6;var zb=ap.bikeAt&&ap.bikeAt(hz[1]);if(zb)ap.imBike=Math.max(ap.imBike,zb);}
  if(E.swim)ap.imSwim=E.swim.t/RACE.swimM*100;
  var sw=win.filter(function(a){return /Swim/.test(a.t)&&a.m>=1000&&a.d>0;});
  if(sw.length>=3)ap.css=Math.min.apply(null,sw.map(function(a){return a.d/a.m*100;}))*1.03;
  if(ap.imSwim)ap.css=Math.min(ap.css||ap.imSwim-10,ap.imSwim-8);
  APc={k:key,v:ap};
  return ap;
}
function bpmTxt(a,b){return a?a+'–'+b+' bpm':'≤ '+b+' bpm';}
function autoTok(t,k,ap,p){
  var hz=ap.hz,o=[],lo=function(z){return z<=1?0:hz[z-2]+1;},hi=function(z){return hz[z-1];},d;
  if(t==='r'&&!(p.fc||p.thr)){
    d={soft:['RPE 2–3',0,hi(1)],z2:['RPE 3–4',lo(2),hi(2)],im:[RN.im[0],0,Math.max(ap.P.hrR+3,hi(2)+6)],tempo:['RPE 6–7',lo(4),hi(4)]}[k];
    if(!d)return null;
    o.push(d[0],bpmTxt(d[1],d[2]));
    if(k==='im'){if(ap.imRun)o.push(mmss(ap.imRun*0.97)+'–'+mmss(ap.imRun*1.03)+' /km');}
    else if(ap.runAt){var pa=ap.runAt(d[2]),pb=ap.runAt(d[1]||d[2]-10);if(pa&&pb)o.push((k==='soft'?'plus lent que '+mmss(pa):mmss(pa)+'–'+mmss(pb))+' /km');}
    return '('+o.join(' · ')+')';
  }
  if(t==='b'&&!p.ftp){
    d={soft:['RPE 2–3',0,hi(1)],z2:['RPE 3–4',lo(2),hi(2)],ft:['RPE 6',lo(3),hi(3)],sw:['RPE 7',lo(4),hi(4)],im:[BK.im[0],0,Math.max(ap.P.hrB+3,hi(2)+6)]}[k];
    if(!d)return null;
    o.push(d[0],bpmTxt(d[1],d[2]));
    if(k==='im'){if(ap.imBike)o.push('≈ '+Math.round(ap.imBike)+' km/h');}
    else if(ap.bikeAt&&k!=='soft'){var sa=ap.bikeAt(d[1]),sb=ap.bikeAt(d[2]);if(sa&&sb)o.push(Math.round(sa)+'–'+Math.round(sb)+' km/h');}
    return '('+o.join(' · ')+')';
  }
  if(t==='s'&&!p.css&&ap.imSwim){
    var im=ap.imSwim,cs=ap.css||im-10,r={easy:['RPE 3–4',im+6,im+14],end:['RPE 4–5',im,im+6],im:[SW.im[0],im-3,im+3],css:['RPE 7',cs-1,cs+1],fast:['RPE 8',cs-6,cs-2]}[k];
    if(!r)return null;
    return '('+r[0]+' · '+mmss(r[1])+'–'+mmss(r[2])+' /100 m)';
  }
  return null;
}
function tx(str){
  var ap=autoProf(),p=effProf(ap);
  return str.replace(/\{([brs]):(\w+)\}/g,function(_,t,k){
    if(ap){var at=autoTok(t,k,ap,p);if(at)return at;}
    var z,o=[];
    if(t==='b'){
      z=BK[k];o.push(z[0],(z[1]?Math.round(z[1]*100)+'–':'< ')+Math.round(z[2]*100)+' % FTP');
      if(p.ftp)o.push('≈ '+(z[1]?Math.round(p.ftp*z[1])+'–':'< ')+Math.round(p.ftp*z[2])+' W');
      else if(!ap&&k==='im'){var bi=declBikeIm();if(bi)o.push('≈ '+Math.round(bi)+' km/h');}
    }else if(t==='r'){
      z=RN[k];o.push(z[0],(z[1]?Math.round(z[1]*100)+'–':'< ')+Math.round(z[2]*100)+' % FC max');
      if(p.fc)o.push('≈ '+(z[1]?Math.round(p.fc*z[1])+'–':'< ')+Math.round(p.fc*z[2])+' bpm');
      if(p.thr)o.push('allure indicative '+mmss(p.thr+z[3])+'–'+mmss(p.thr+z[4])+' /km');
    }else{
      z=SW[k];o.push(z[0]);
      if(p.css)o.push(k==='css'?'≈ '+mmss(p.css)+' /100 m':mmss(p.css+z[1])+'–'+mmss(p.css+z[2])+' /100 m');
    }
    return '('+o.join(' · ')+')';
  });
}


