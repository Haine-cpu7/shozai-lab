(function(){
'use strict';
const YEARS=30, START_AGE=35, TIME_BUDGET=70;
const INVEST={
 cash:{label:'💴 現金中心',mu:0,sigma:.01},
 balanced:{label:'⚖️ 現金＋世界株',mu:.025,sigma:.09},
 global:{label:'🌍 世界株中心',mu:.045,sigma:.16}
};
const STRATEGIES={
 full:{label:'仕事全振り',paid:45,unpaid:10,learn:2,desc:'有償労働を厚めにして、お金を優先。'},
 balanced:{label:'バランス',paid:35,unpaid:15,learn:4,desc:'給料・家のこと・学び・自由時間を分ける。'},
 minimum:{label:'最低限だけ稼ぐ',paid:20,unpaid:20,learn:5,desc:'生活費に必要な現金だけ取りに行き、時間を残す。'},
 care:{label:'家事・ケア中心',paid:10,unpaid:35,learn:3,desc:'家の中の仕事を多く引き受け、有償労働は少なめ。'},
 semi:{label:'セミリタイア',paid:10,unpaid:15,learn:5,desc:'資産や他の家計収入を使い、有償労働を小さくする。'},
 zero:{label:'就業ゼロ',paid:0,unpaid:30,learn:5,desc:'給料を得る仕事はしないが、家事・ケアは行う。'}
};
const FOUNDATIONS={
 self:{label:'自分の給料だけ',support:0,startAssets:0,desc:'他の家計収入も資産もほぼない。'},
 shared:{label:'共同家計あり',support:1_500_000,startAssets:5_000_000,desc:'家計から年150万円の共有収入があり、開始資産500万円。'},
 covered:{label:'生活費をほぼ共有でカバー',support:2_400_000,startAssets:5_000_000,desc:'年240万円の共有収入があり、本人の給料がなくても基礎生活費に届く設定。'},
 capital:{label:'資産が厚い',support:0,startAssets:20_000_000,desc:'共有収入はないが、開始資産2000万円。'}
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function mean(a){return a.reduce((s,x)=>s+x,0)/(a.length||1)}
function q(arr,p){if(!arr.length)return 0;const a=arr.slice().sort((x,y)=>x-y),i=(a.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return lo===hi?a[lo]:a[lo]*(hi-i)+a[hi]*(i-lo)}
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0}
function hash(seed,a=0,b=0,c=0){let x=(seed>>>0)^Math.imul((a+1)|0,0x9e3779b1)^Math.imul((b+7)|0,0x85ebca6b)^Math.imul((c+13)|0,0xc2b2ae35);return mix32(x)}
function U(seed,a=0,b=0,c=0){return (hash(seed,a,b,c)+.5)/4294967296}
function N01(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function randomSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}catch(e){return(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}}
function defaultSettings(){return{age:START_AGE,paidHours:35,unpaidHours:15,learningHours:4,hourlyWage:1800,annualNeed:2_400_000,taxRate:.20,support:0,startAssets:5_000_000,invest:'balanced',unpaidReplacementRate:1500,houseworkSavingRate:600}}
function normalize(x={}){return{...defaultSettings(),...x}}
function marketReturn(seed,year,key){const cfg=INVEST[key]||INVEST.balanced;let r=cfg.mu+cfg.sigma*N01(seed,year,11,1);if(key!=='cash'&&U(seed,year,11,3)<.06)r-=.20;return clamp(r,-.55,.40)}
function effectivePaidHours(h){return Math.min(h,40)+Math.max(0,h-40)*.60}
function annualPaidIncome(seed,year,s,wage){let income=effectivePaidHours(s.paidHours)*52*wage;const shock=U(seed,year,21,1);if(shock<.02)income*=.30;else if(shock<.08)income*=.65;return income}
function run(seed,settings={}){
 const s=normalize(settings);let assets=s.startAssets,debt=0,wage=s.hourlyWage,shortfallYears=0,insolventYears=0;
 let paidTotal=0,unpaidTotal=0,learningTotal=0,freeTotal=0,unpaidValue=0,paidGrossTotal=0,supportTotal=0;
 const history=[];
 for(let y=1;y<=YEARS;y++){
  assets=Math.max(0,assets*(1+marketReturn(seed,y,s.invest)));debt*=1.04;
  const paidGross=annualPaidIncome(seed,y,s,wage),paidNet=paidGross*(1-s.taxRate),support=s.support;
  const unpaidSave=Math.min(600_000,s.unpaidHours*52*s.houseworkSavingRate),need=Math.max(1_400_000,s.annualNeed-unpaidSave);
  const cashflow=paidNet+support-need;
  if(cashflow>=0)assets+=cashflow;else{shortfallYears++;let needCash=-cashflow,t=Math.min(assets,needCash);assets-=t;needCash-=t;if(needCash>0){debt+=needCash;insolventYears++}}
  const free=Math.max(0,TIME_BUDGET-s.paidHours-s.unpaidHours-s.learningHours)*52;
  paidTotal+=s.paidHours*52;unpaidTotal+=s.unpaidHours*52;learningTotal+=s.learningHours*52;freeTotal+=free;
  unpaidValue+=s.unpaidHours*52*s.unpaidReplacementRate;paidGrossTotal+=paidGross;supportTotal+=support;
  const growth=.004+Math.min(.008,s.learningHours*.001)+N01(seed,y,31,1)*.012;wage=Math.max(1200,wage*(1+growth));
  history.push({year:y,age:s.age+y,assets,debt,netWorth:assets-debt,paidGross,paidNet,support,need,cashflow,free});
 }
 return{seed,settings:s,history,netWorth:assets-debt,assets,debt,shortfallYears,insolventYears,paidTotal,unpaidTotal,learningTotal,freeTotal,unpaidValue,paidGrossTotal,supportTotal,finalWage:wage};
}
function batch(n,baseSeed,settings={}){const nw=[],short=[],ins=[],free=[],paid=[],unpaid=[];for(let i=0;i<n;i++){const r=run((baseSeed+Math.imul(i,104729))>>>0,settings);nw.push(r.netWorth);short.push(r.shortfallYears);ins.push(r.insolventYears);free.push(r.freeTotal);paid.push(r.paidTotal);unpaid.push(r.unpaidTotal)}return{n,netWorthMedian:q(nw,.5),netWorthBottom10:q(nw,.1),shortfallMedian:q(short,.5),shortfallP90:q(short,.9),insolventRate:mean(ins.map(x=>x>0?1:0)),freeMedian:q(free,.5),paidMedian:q(paid,.5),unpaidMedian:q(unpaid,.5),positiveRate:mean(nw.map(x=>x>=0?1:0))}}
function applyStrategy(key,foundation='self',extra={}){const st=STRATEGIES[key]||STRATEGIES.balanced,f=FOUNDATIONS[foundation]||FOUNDATIONS.self;return{...defaultSettings(),paidHours:st.paid,unpaidHours:st.unpaid,learningHours:st.learn,support:f.support,startAssets:f.startAssets,...extra}}
function compareStrategies(n,seed,foundation='self',extra={}){return Object.entries(STRATEGIES).map(([key,v])=>({key,label:v.label,desc:v.desc,...batch(n,seed,applyStrategy(key,foundation,extra))}))}
window.WorkLab={YEARS,TIME_BUDGET,INVEST,STRATEGIES,FOUNDATIONS,defaultSettings,normalize,run,batch,applyStrategy,compareStrategies,randomSeed,q,mean,clamp};
})();
