(()=>{
'use strict';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
function hash(s){let h=2166136261>>>0;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function logistic(x){return 1/(1+Math.exp(-x))}
function median(a){const b=[...a].sort((x,y)=>x-y),n=b.length;return n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2}
function mean(a){return a.reduce((s,x)=>s+x,0)/(a.length||1)}

const MAX_PRICE=19800;
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

function priceCost(price){return Math.log1p(Math.max(0,price)/980)/Math.log1p(19800/980)}
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
 const cost=1.45*w.price*priceCost(offer.price);
 const raw=-1.05+Object.values(positive).reduce((a,b)=>a+b,0)-freePenalty-skepticismPenalty-cost+noise;
 return {raw,positive,freePenalty,skepticismPenalty,cost,prob:logistic(raw)};
}

function simulateProfile(profile,offer,seed,n=120){
 const rng=mulberry32((seed^hash(profile.id))>>>0),rows=[];
 for(let i=0;i<n;i++){
  const stable=(rng()-.5)*.60;
  const p=scoreParts(profile,offer,stable);
  const threshold=rng();
  const bought=threshold<p.prob;
  const drivers=Object.entries(p.positive).sort((a,b)=>b[1]-a[1]);
  const top=drivers[0];
  const reason=bought?driverText(top[0],profile):refusalText(p,profile,offer);
  rows.push({i,bought,prob:p.prob,raw:p.raw,reason,topDriver:top[0],parts:p});
 }
 return {profile,rows,purchaseRate:mean(rows.map(x=>x.bought?1:0)),medianProbability:median(rows.map(x=>x.prob))};
}
function driverText(k,p){
 const map={timeSaving:'「探して比べる時間を減らせるなら、その分には払う。」',guarantee:'「外しても戻せるなら、試す心理コストが下がる。」',authority:'「誰がまとめたかが分かると、自分で全部検証する手間が減る。」',socialProof:'「これだけ選ばれているなら、完全なハズレではなさそう。」',transformation:'「情報そのものより、これで前に進めそうなのが気になる。」',implementation:'「読むだけじゃなく、そのまま使える形なら価値がある。」',scarcity:'「今しかないなら、後回しにしにくい。」'};
 return map[k]||`「${p.short}。」`;
}
function refusalText(parts,p,offer){
 if(offer.freeEquivalent && parts.freePenalty>Math.max(...Object.values(parts.positive)))return '「同じ中身が無料であるなら、まずそっちを見る。」';
 if(parts.cost>1.0)return '「便利そうではあるけど、この価格なら自分で調べる。」';
 if(parts.skepticismPenalty>.55)return '「言い方が強いほど、むしろ一回引いて見る。」';
 return '「今の条件だと、買う理由が価格を超えない。」';
}
function simulate(offer={},seed=20261007,n=120){
 const o={...defaultOffer,...offer};
 o.price=Math.max(0,Math.min(MAX_PRICE,Number(o.price)||0));
 const byProfile=profiles.map(p=>simulateProfile(p,o,seed,n));
 const all=byProfile.flatMap(x=>x.rows);
 const driverCounts={};all.filter(x=>x.bought).forEach(x=>driverCounts[x.topDriver]=(driverCounts[x.topDriver]||0)+1);
 return {seed,offer:o,n,byProfile,overall:mean(all.map(x=>x.bought?1:0)),driverCounts,total:all.length};
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
 const a=simulate(defaultOffer,12345,20),b=simulate(defaultOffer,12345,20),c=simulate(defaultOffer,54321,20);
 const same=JSON.stringify(a.byProfile.map(x=>x.purchaseRate))===JSON.stringify(b.byProfile.map(x=>x.purchaseRate));
 const finite=[a.overall,...a.byProfile.map(x=>x.purchaseRate)].every(Number.isFinite);
 const changed=JSON.stringify(a.byProfile.map(x=>x.purchaseRate))!==JSON.stringify(c.byProfile.map(x=>x.purchaseRate));
 const traits=profiles.every(p=>Object.values(p.w).every(Number.isFinite));
 return {ok:same&&finite&&changed&&traits,sameSeedReproducible:same,finite,differentSeedCanDiffer:changed,traitsFinite:traits};
}
window.InformationPurchaseLab={MAX_PRICE,profiles,defaultOffer,featureLabels,simulate,scenarioSet,ablate,priceSensitivity,seedStudy,selfCheck,scoreParts};
})();
