(()=>{
'use strict';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
function hash(s){let h=2166136261>>>0;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function logistic(x){return 1/(1+Math.exp(-x))}
function mean(a){return a.reduce((s,x)=>s+x,0)/(a.length||1)}
function median(a){const b=[...a].sort((x,y)=>x-y),n=b.length;if(!n)return 0;return n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2}
const MAX_PRICE=19800,MAX_INFO_VALUE=19800;

const profiles=[
 {id:'time',name:'⏱️ 時間不足型',short:'探す・比べる時間を重く見る',w:{time:1.35,anxiety:.35,authority:.25,social:.20,transform:.20,implementation:.80,price:.55,skeptic:.25}},
 {id:'anxiety',name:'🛡️ 不安回避型',short:'不確実性を減らす価値を重く見る',w:{time:.45,anxiety:1.35,authority:.65,social:.55,transform:.25,implementation:.75,price:.70,skeptic:.30}},
 {id:'authority',name:'🎓 権威依存型',short:'誰がまとめたかを重く見る',w:{time:.30,anxiety:.55,authority:1.45,social:.45,transform:.35,implementation:.35,price:.65,skeptic:.15}},
 {id:'social',name:'👥 社会的証明型',short:'他人の選択を手掛かりにする',w:{time:.35,anxiety:.45,authority:.40,social:1.45,transform:.55,implementation:.35,price:.65,skeptic:.20}},
 {id:'transform',name:'✨ 変身期待型',short:'「前に進めそう」を重く見る',w:{time:.35,anxiety:.40,authority:.35,social:.55,transform:1.50,implementation:.65,price:.60,skeptic:.15}},
 {id:'skeptic',name:'🔎 懐疑・自力探索型',short:'無料代替と価格を強く見る',w:{time:.20,anxiety:.20,authority:.15,social:.10,transform:.10,implementation:.45,price:1.25,skeptic:1.20}}
];

const packages=[
 {id:'bare',name:'📄 情報だけ',desc:'知識だけを販売。整理・実行補助・強い訴求は足さない。',f:{time:0,implementation:0,support:0,guarantee:0,authority:0,social:0,transform:0,scarcity:0}},
 {id:'utility',name:'🧰 実用付加',desc:'整理・テンプレ・サポートなど、購入後にも残る使いやすさを足す。',f:{time:1,implementation:1,support:.7,guarantee:.5,authority:0,social:0,transform:0,scarcity:0}},
 {id:'pitch',name:'📣 訴求付加',desc:'権威・口コミ・変化の物語など、購入前の期待を強くする。',f:{time:0,implementation:0,support:0,guarantee:.4,authority:1,social:1,transform:1,scarcity:.5}},
 {id:'bundle',name:'🧰📣 実用＋訴求',desc:'実用価値と訴求を両方足す。',f:{time:1,implementation:1,support:.7,guarantee:.5,authority:1,social:1,transform:1,scarcity:.5}}
];

function practicalValue(p,f){const w=p.w;return 4000*w.time*f.time+3500*w.implementation*f.implementation+2400*(.45*w.anxiety+.55*w.implementation)*f.support+1000*w.anxiety*f.guarantee}
function pitchValue(p,f,rep){const w=p.w;return 1700*w.authority*f.authority+1500*w.social*f.social*(.55+.9*rep)+2500*w.transform*f.transform+500*(1-.55*w.skeptic)*f.scarcity}
function skepticismPenalty(p,f){const w=p.w;return 900*w.skeptic*(.35*f.authority+.30*f.social+.45*f.transform+.25*f.scarcity)}
function perceivedValue(p,f,rep,infoValue,noise){return infoValue+practicalValue(p,f)+pitchValue(p,f,rep)+1600*(rep-.5)*(.35+.65*p.w.social)-skepticismPenalty(p,f)+noise}
function realizedValue(p,f,infoValue,noise){return Math.max(0,infoValue+practicalValue(p,f)+noise)}
function variableCost(f){return 220+100*f.time+140*f.implementation+900*f.support+80*f.guarantee}
function setupCost(f){return 60000+12000*f.time+18000*f.implementation+35000*f.support+8000*f.guarantee+22000*f.authority+18000*f.social+24000*f.transform+8000*f.scarcity}
function acquisitionCostPerProspect(f){return 95+25*(f.authority+f.social+f.transform+f.scarcity)}

function simulate(pkg,opts={},seed=20261008){
 const price=clamp(Number(opts.price??7980)||0,0,MAX_PRICE);
 const infoValue=clamp(Number(opts.infoValue??2500)||0,0,MAX_INFO_VALUE);
 const months=Math.max(1,Math.min(60,Math.round(Number(opts.months??24)||24)));
 const perType=Math.max(5,Math.min(100,Math.round(Number(opts.perType??30)||30)));
 const f=pkg.f,rng=mulberry32((seed^hash(pkg.id))>>>0);
 let reputation=.68,cumProfit=-setupCost(f),sales=0,refunds=0,revenue=0,costs=setupCost(f);
 const allRealized=[],allMoneyROI=[],allSurplus=[],monthRows=[];
 const byProfile=Object.fromEntries(profiles.map(p=>[p.id,{profile:p,prospects:0,sales:0,refunds:0,realized:[],surplus:[]} ]));
 for(let m=1;m<=months;m++){
   let monthSales=0,monthRefunds=0,monthRevenue=0,monthVar=0;const monthRatings=[];
   for(const p of profiles){
     for(let i=0;i<perType;i++){
       const pr=byProfile[p.id];pr.prospects++;
       const perceived=perceivedValue(p,f,reputation,infoValue,(rng()-.5)*1600);
       const priceBurden=price*(.80+.22*p.w.price);
       const buyProb=logistic((perceived-priceBurden)/2600-.25);
       if(rng()<buyProb){
         monthSales++;sales++;pr.sales++;
         const realized=realizedValue(p,f,infoValue,(rng()-.5)*900);
         const ratio=price>0?realized/price:2;
         const disappointment=logistic((.72-ratio)*6);
         const refundProb=clamp(.01+.10*f.guarantee+.42*f.guarantee*disappointment+.16*(1-f.guarantee)*logistic((.38-ratio)*7),0,.75);
         const refunded=rng()<refundProb;
         const rating=clamp(.15+.7*Math.min(1.25,ratio)/1.25+(rng()-.5)*.12,0,1);
         monthRatings.push(rating);
         allRealized.push(realized);allMoneyROI.push(infoValue-price);allSurplus.push(realized-price);pr.realized.push(realized);pr.surplus.push(realized-price);
         monthVar+=variableCost(f);
         if(refunded){monthRefunds++;refunds++;pr.refunds++;}else{monthRevenue+=price;revenue+=price;}
       }
     }
   }
   const prospects=profiles.length*perType;
   const acquisition=prospects*acquisitionCostPerProspect(f);
   const monthCost=monthVar+acquisition;costs+=monthCost;
   const monthProfit=monthRevenue-monthCost;cumProfit+=monthProfit;
   const observed=monthRatings.length?mean(monthRatings):reputation;
   reputation=clamp(.82*reputation+.18*observed-.05*(monthRefunds/Math.max(1,monthSales)),.05,.98);
   monthRows.push({month:m,sales:monthSales,refunds:monthRefunds,revenue:monthRevenue,cost:monthCost,profit:monthProfit,cumProfit,reputation});
 }
 const prospects=profiles.length*perType*months,refundRate=refunds/Math.max(1,sales),purchaseRate=sales/prospects,final6=monthRows.slice(-Math.min(6,months));
 const byProfileRows=profiles.map(p=>{const x=byProfile[p.id];return {profile:p,purchaseRate:x.sales/x.prospects,refundRate:x.refunds/Math.max(1,x.sales),medianRealized:median(x.realized),medianSurplus:median(x.surplus)}});
 return {pkg,price,infoValue,months,prospects,sales,purchaseRate,refunds,refundRate,revenue,costs,profit:cumProfit,margin:revenue?cumProfit/revenue:0,finalReputation:reputation,final6AvgProfit:mean(final6.map(x=>x.profit)),medianRealized:median(allRealized),medianMoneyROI:median(allMoneyROI),medianSurplus:median(allSurplus),byProfile:byProfileRows,monthRows};
}
function compare(opts={},seed=20261008){return packages.map(p=>simulate(p,opts,seed))}
function seedStudy(opts={},seeds=[11,29,47,83,131,197,263,347,431,587]){return seeds.map(seed=>({seed,rows:compare(opts,seed)}))}
function selfCheck(){
 const opts={price:7980,infoValue:2500,months:12,perType:10};
 const a=compare(opts,12345),b=compare(opts,12345),c=compare(opts,54321);
 const snap=x=>JSON.stringify(x.map(r=>[r.sales,r.refunds,Math.round(r.profit),Number(r.finalReputation.toFixed(6))]));
 const same=snap(a)===snap(b),changed=snap(a)!==snap(c);
 const finite=a.flatMap(r=>[r.purchaseRate,r.refundRate,r.profit,r.finalReputation,r.medianRealized,r.medianSurplus]).every(Number.isFinite);
 const bounds=a.every(r=>r.purchaseRate>=0&&r.purchaseRate<=1&&r.refundRate>=0&&r.refundRate<=1&&r.finalReputation>=0&&r.finalReputation<=1);
 return {ok:same&&changed&&finite&&bounds,sameSeedReproducible:same,differentSeedCanDiffer:changed,finite,bounds};
}
window.ProductValueLab={MAX_PRICE,MAX_INFO_VALUE,profiles,packages,simulate,compare,seedStudy,selfCheck,practicalValue,pitchValue};
})();
