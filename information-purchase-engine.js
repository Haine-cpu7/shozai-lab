(()=>{
'use strict';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
function hash(s){let h=2166136261>>>0;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function unit(seed,...parts){return mulberry32(((seed>>>0)^hash(parts.join('|')))>>>0)()}
function logistic(x){return 1/(1+Math.exp(-x))}
function median(a){const b=[...a].sort((x,y)=>x-y),n=b.length;return n?n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2:0}
function mean(a){return a.reduce((s,x)=>s+x,0)/(a.length||1)}

const MAX_PRICE=19800;
const WALLET_MIN=750,WALLET_MAX=25000;
const profiles=[
 {id:'time',name:'⏱️ 時間不足型',short:'調べる時間を買う',desc:'無料情報は探せるが、探索・比較・整理に使う時間を重く見る。',w:{time:1.35,anxiety:.35,authority:.25,social:.20,transform:.20,implementation:.80,price:.55,freeSearch:.25,skeptic:.25}},
 {id:'anxiety',name:'🛡️ 不安回避型',short:'間違えない安心を買う',desc:'情報量より「これで大丈夫そう」という不確実性の低下に反応する。',w:{time:.45,anxiety:1.35,authority:.65,social:.55,transform:.25,implementation:.75,price:.70,freeSearch:.45,skeptic:.30}},
 {id:'authority',name:'🎓 権威依存型',short:'誰が言うかを買う',desc:'専門家・実績・肩書きなど、情報源の権威を強く手掛かりにする。',w:{time:.30,anxiety:.55,authority:1.45,social:.45,transform:.35,implementation:.35,price:.65,freeSearch:.40,skeptic:.15}},
 {id:'social',name:'👥 社会的証明型',short:'みんなの選択を買う',desc:'レビュー数・購入者数・周囲の選択を意思決定の手掛かりにする。',w:{time:.35,anxiety:.45,authority:.40,social:1.45,transform:.55,implementation:.35,price:.65,freeSearch:.40,skeptic:.20}},
 {id:'transform',name:'✨ 変身期待型',short:'変われる期待を買う',desc:'知識より「これを買えば前に進める」という自己変化の物語に反応する。',w:{time:.35,anxiety:.40,authority:.35,social:.55,transform:1.50,implementation:.65,price:.60,freeSearch:.35,skeptic:.15}},
 {id:'skeptic',name:'🔎 懐疑・自力探索型',short:'まず無料を探す',desc:'同じ情報が無料なら自分で探す。価格・誇張・権威・希少性を割り引いて見る。',w:{time:.20,anxiety:.20,authority:.15,social:.10,transform:.10,implementation:.45,price:1.25,freeSearch:1.45,skeptic:1.20}}
];

const defaultOffer={price:4980,timeSaving:.55,guarantee:0,authority:0,socialProof:0,transformation:.20,implementation:.35,scarcity:0,freeEquivalent:1};
const featureLabels={timeSaving:'時短・整理',guarantee:'返金保証',authority:'専門家・実績',socialProof:'口コミ・購入者数',transformation:'変われる訴求',implementation:'テンプレ・手順',scarcity:'限定・締切'};

// 「財布」は所得ではなく、その時点でこの種の購入に回せる可処分予算という玩具変数。
// profile に依存させないので、価値観タイプと支払能力を混同しない。
function walletFor(seed,i){const u=unit(seed,'wallet',i);return Math.round(WALLET_MIN+(WALLET_MAX-WALLET_MIN)*Math.pow(u,1.7))}
function scoreParts(profile,offer,noise=0){
 const w=profile.w;
 const positive={
  timeSaving:1.45*w.time*offer.timeSaving,
  guarantee:1.10*w.anxiety*offer.guarantee,
  authority:1.05*w.authority*offer.authority,
  socialProof:1.00*w.social*offer.socialProof,
  transformation:1.05*w.transform*offer.transformation,
  implementation:1.25*w.implementation*offer.implementation,
  scarcity:.45*(1-.55*w.skeptic)*offer.scarcity
 };
 const freePenalty=offer.freeEquivalent*(.85*w.freeSearch)*(1-.62*offer.timeSaving-.28*offer.implementation);
 const skepticismPenalty=w.skeptic*(.28*offer.authority+.24*offer.socialProof+.38*offer.transformation+.35*offer.scarcity);
 const desireRaw=-1.05+Object.values(positive).reduce((a,b)=>a+b,0)-freePenalty-skepticismPenalty+noise;
 const desireProb=logistic(desireRaw);
 return {desireRaw,positive,freePenalty,skepticismPenalty,desireProb};
}
function wtpFor(profile,desireProb,seed,i){
 const heter=.78+.44*unit(seed,'wtp',i);
 const priceTolerance=clamp(1.15-.38*profile.w.price,.55,1.05);
 return Math.round(clamp(MAX_PRICE*desireProb*priceTolerance*heter,0,MAX_PRICE));
}
function simulateProfile(profile,offer,seed,n=120){
 const rows=[];
 for(let i=0;i<n;i++){
  const stable=(unit(seed,'taste',profile.id,i)-.5)*.60;
  const p=scoreParts(profile,offer,stable);
  const wallet=walletFor(seed,i),wtp=wtpFor(profile,p.desireProb,seed,i);
  const wants=unit(seed,'desire-draw',i)<p.desireProb;
  const affordable=offer.price<=wallet;
  const willing=offer.price<=wtp;
  const bought=wants&&affordable&&willing;
  const drivers=Object.entries(p.positive).sort((a,b)=>b[1]-a[1]);
  const top=drivers[0];
  const reason=bought?driverText(top[0],profile):refusalText({p,profile,offer,wants,affordable,willing,wallet,wtp});
  rows.push({i,bought,wants,affordable,willing,wallet,wtp,desireProb:p.desireProb,reason,topDriver:top[0],parts:p});
 }
 const wanted=rows.filter(x=>x.wants);
 return {profile,rows,purchaseRate:mean(rows.map(x=>x.bought?1:0)),desireRate:mean(rows.map(x=>x.wants?1:0)),affordRate:mean(rows.map(x=>x.affordable?1:0)),willingRate:mean(rows.map(x=>x.willing?1:0)),medianProbability:median(rows.map(x=>x.desireProb)),medianWallet:median(rows.map(x=>x.wallet)),medianWtp:median(rows.map(x=>x.wtp)),budgetBlockedRate:wanted.length?mean(wanted.map(x=>x.affordable?0:1)):0,wtpBlockedRate:wanted.length?mean(wanted.map(x=>x.affordable&&!x.willing?1:0)):0};
}
function driverText(k,p){
 const map={timeSaving:'「探して比べる時間を減らせるなら、その分には払う。」',guarantee:'「外しても戻せるなら、試す心理コストが下がる。」',authority:'「誰がまとめたかが分かると、自分で全部検証する手間が減る。」',socialProof:'「これだけ選ばれているなら、完全なハズレではなさそう。」',transformation:'「情報そのものより、これで前に進めそうなのが気になる。」',implementation:'「読むだけじゃなく、そのまま使える形なら価値がある。」',scarcity:'「今しかないなら、後回しにしにくい。」'};
 return map[k]||`「${p.short}。」`;
}
function refusalProfileText(id,kind,value){
 const yen=Number.isFinite(value)?value.toLocaleString('ja-JP'):'';
 const map={
  time:{
   budget:`「時短には価値を感じる。でも今この購入に回せるのは約${yen}円まで。」`,
   wtp:`「便利そう。でも自分の中では約${yen}円を超えると時短代としては高い。」`,
   free:'「整理は助かるけど、無料で探せるならまず自分で集める。」',
   skeptic:'「便利でも、言い方が強すぎると一回距離を置く。」',
   noDesire:'「少し楽にはなりそう。でも今は自分で調べる方を選ぶ。」'
  },
  anxiety:{
   budget:`「安心材料はある。でも今この購入に使える予算は約${yen}円。」`,
   wtp:`「不安は減りそう。でも自分が払える安心料の上限は約${yen}円。」`,
   free:'「まずは無料の情報で不安を減らしてから考える。」',
   skeptic:'「強く勧められるほど、逆に慎重になる。」',
   noDesire:'「悪くなさそう。でも今の不安を解く決め手まではない。」'
  },
  authority:{
   budget:`「信頼できそう。でも今回この購入に回せる予算は約${yen}円。」`,
   wtp:`「情報源は気になる。でも肩書き込みでも自分の上限は約${yen}円。」`,
   free:'「無料でも一次情報や実績を追えそうなら、まずそちらを見る。」',
   skeptic:'「実績があっても、価格に見合う確信までは持てない。」',
   noDesire:'「情報源は気になる。でも今は購入の決め手に届かない。」'
  },
  social:{
   budget:`「選ばれているのは分かる。でも今この購入に使える予算は約${yen}円。」`,
   wtp:`「人気は気になる。でも自分が払っていい上限は約${yen}円。」`,
   free:'「評判は参考になるけど、無料で追えるならまず様子を見る。」',
   skeptic:'「みんなが買っていても、それだけでは押し切られない。」',
   noDesire:'「周りの反応は気になる。でも今は見送る。」'
  },
  transform:{
   budget:`「前に進めそう。でも今この購入に使える予算は約${yen}円。」`,
   wtp:`「変われそうな感じはある。でも自分の上限は約${yen}円。」`,
   free:'「変化のきっかけには見えるけど、まずは無料で試せることからやる。」',
   skeptic:'「変われる物語が強すぎると、少し冷めてしまう。」',
   noDesire:'「悪くないけど、今すぐ買うほど気持ちは動かない。」'
  },
  skeptic:{
   budget:`「買えないというより、今この用途に切れる予算は約${yen}円まで。」`,
   wtp:`「内容は分かる。でもこの条件で払っていい上限は約${yen}円。」`,
   free:'「無料で辿れるなら、まず自分で探す。」',
   skeptic:'「言い方が強いほど、むしろ買わない理由が増える。」',
   noDesire:'「便利さは分かる。でも今は自力で十分。」'
  }
 };
 return (map[id]&&map[id][kind])||'';
}
function refusalText(x){
 const {p,profile,offer,wants,affordable,willing,wallet,wtp}=x;
 if(wants&&!affordable)return refusalProfileText(profile.id,'budget',wallet)||`「欲しい気持ちはある。でも今この購入に使える予算は約${wallet.toLocaleString('ja-JP')}円。」`;
 if(wants&&!willing)return refusalProfileText(profile.id,'wtp',wtp)||`「気にはなる。でも自分が払っていい上限は約${wtp.toLocaleString('ja-JP')}円。」`;
 if(offer.freeEquivalent&&p.freePenalty>Math.max(...Object.values(p.positive)))return refusalProfileText(profile.id,'free')||'「同じ中身が無料であるなら、まずそっちを見る。」';
 if(p.skepticismPenalty>.55)return refusalProfileText(profile.id,'skeptic')||'「言い方が強いほど、むしろ一回引いて見る。」';
 if(!wants)return refusalProfileText(profile.id,'noDesire')||'「便利そうではあるけど、今は買いたいほどではない。」';
 return `「価格${offer.price.toLocaleString('ja-JP')}円が、今の条件では自分の上限を超える。」`;
}
function simulate(offer={},seed=20261007,n=120){
 const o={...defaultOffer,...offer};
 o.price=Math.max(0,Math.min(MAX_PRICE,Number(o.price)||0));
 const byProfile=profiles.map(p=>simulateProfile(p,o,seed,n));
 const all=byProfile.flatMap(x=>x.rows);
 const driverCounts={};all.filter(x=>x.bought).forEach(x=>driverCounts[x.topDriver]=(driverCounts[x.topDriver]||0)+1);
 const wanted=all.filter(x=>x.wants),budgetBlocked=wanted.filter(x=>!x.affordable),wtpBlocked=wanted.filter(x=>x.affordable&&!x.willing);
 return {seed,offer:o,n,byProfile,overall:mean(all.map(x=>x.bought?1:0)),desireRate:mean(all.map(x=>x.wants?1:0)),affordRate:mean(all.map(x=>x.affordable?1:0)),willingRate:mean(all.map(x=>x.willing?1:0)),medianWallet:median(all.map(x=>x.wallet)),medianWtp:median(all.map(x=>x.wtp)),budgetBlocked:budgetBlocked.length,wtpBlocked:wtpBlocked.length,wanted:wanted.length,driverCounts,total:all.length};
}

function scenarioSet(seed=20261007,n=120){
 const scenarios=[
  {id:'bare',name:'情報だけ',offer:{price:4980,timeSaving:0,implementation:0,transformation:0}},
  {id:'cheap',name:'980円',offer:{price:980,timeSaving:.20,implementation:.15,transformation:.10}},
  {id:'time',name:'時短・整理',offer:{price:4980,timeSaving:1}},
  {id:'guarantee',name:'返金保証',offer:{price:4980,guarantee:1}},
  {id:'authority',name:'専門家・実績',offer:{price:4980,authority:1}},
  {id:'social',name:'購入者1万人',offer:{price:4980,socialProof:1}},
  {id:'transform',name:'変われる訴求',offer:{price:4980,transformation:1}},
  {id:'implementation',name:'テンプレ付き',offer:{price:4980,implementation:1}},
  {id:'scarcity',name:'限定100名',offer:{price:4980,scarcity:1}},
  {id:'bundle',name:'全部盛り',offer:{price:9800,timeSaving:1,guarantee:1,authority:1,socialProof:1,transformation:1,implementation:1,scarcity:1}}
 ];
 return scenarios.map(s=>({ ...s, result:simulate({...defaultOffer,...s.offer},seed,n)}));
}
function ablate(seed=20261007,n=120){
 const full={...defaultOffer,price:9800,timeSaving:1,guarantee:1,authority:1,socialProof:1,transformation:1,implementation:1,scarcity:1};
 const base=simulate(full,seed,n);
 const keys=['timeSaving','guarantee','authority','socialProof','transformation','implementation','scarcity'];
 return {base,rows:keys.map(k=>{const o={...full,[k]:0},r=simulate(o,seed,n);return {key:k,label:featureLabels[k],overall:r.overall,drop:base.overall-r.overall,byProfile:r.byProfile.map(x=>({id:x.profile.id,rate:x.purchaseRate}))}})};
}
function priceSensitivity(seed=20261007,n=120){
 const prices=[0,980,2980,4980,9800,19800];
 return prices.map(price=>({price,result:simulate({...defaultOffer,price,timeSaving:.75,implementation:.75,guarantee:.5,authority:.5,socialProof:.5,transformation:.5,scarcity:0},seed,n)}));
}
function seedStudy(seeds=[11,29,47,83,131,197,263,347,431,587],n=120){
 return seeds.map(seed=>({seed,result:simulate({...defaultOffer,price:4980,timeSaving:.75,implementation:.75,guarantee:.5,authority:.5,socialProof:.5,transformation:.5,scarcity:0},seed,n)}));
}
function selfCheck(){
 const a=simulate(defaultOffer,12345,30),b=simulate(defaultOffer,12345,30),c=simulate(defaultOffer,54321,30),hi=simulate({...defaultOffer,price:19800},12345,120),lo=simulate({...defaultOffer,price:980},12345,120);
 const snap=x=>JSON.stringify(x.byProfile.map(v=>[v.purchaseRate,v.desireRate,v.medianWallet,v.medianWtp]));
 const same=snap(a)===snap(b),changed=snap(a)!==snap(c);
 const finite=[a.overall,a.desireRate,a.affordRate,a.willingRate,a.medianWallet,a.medianWtp,...a.byProfile.flatMap(x=>[x.purchaseRate,x.desireRate,x.affordRate,x.willingRate,x.medianWallet,x.medianWtp])].every(Number.isFinite);
 const traits=profiles.every(p=>Object.values(p.w).every(Number.isFinite));
 const bounds=a.byProfile.every(x=>[x.purchaseRate,x.desireRate,x.affordRate,x.willingRate].every(v=>v>=0&&v<=1));
 const priceWorks=hi.overall<lo.overall;
 return {ok:same&&finite&&changed&&traits&&bounds&&priceWorks,sameSeedReproducible:same,finite,differentSeedCanDiffer:changed,traitsFinite:traits,bounds,priceGateWorks:priceWorks};
}
window.InformationPurchaseLab={MAX_PRICE,WALLET_MIN,WALLET_MAX,profiles,defaultOffer,featureLabels,simulate,scenarioSet,ablate,priceSensitivity,seedStudy,selfCheck,scoreParts,walletFor,wtpFor};
})();
