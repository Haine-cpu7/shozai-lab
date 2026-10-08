/* 商材実験室 No.23 — AI副業モデル v2.06
 * All money, visit, conversion and production inputs are hypothetical examples,
 * NOT estimates of Japan's actual market. No guaranteed income claims.
 * Six strategies use paired common market shocks and equal time budgets.
 */
(function(root){
'use strict';
const BASE = Object.freeze({
  article: Object.freeze({label:'記事・アフィリエイト',unit:'記事',hours:10,visits:60,conversion:0.00045,payout:1600,fee:0,support:0.01,competition:1.2,pricePressure:0.8,mature:3.5}),
  image: Object.freeze({label:'AIイラスト・素材販売',unit:'作品',hours:14,visits:18,conversion:0.008,payout:1500,fee:0.12,support:0.13,competition:1.6,pricePressure:1.1,mature:1.5}),
  dev: Object.freeze({label:'アプリ・ツール販売',unit:'作品',hours:95,visits:85,conversion:0.012,payout:3500,fee:0.12,support:0.45,competition:0.8,pricePressure:0.7,mature:2}),
  course: Object.freeze({label:'教材・テンプレ販売',unit:'作品',hours:70,visits:40,conversion:0.010,payout:2800,fee:0.12,support:0.6,competition:1.35,pricePressure:1,mature:2})
});
const ROUTES = Object.freeze([
  {id:'ai_article',label:'✍️ AI記事BOT',kind:'article',ai:true},
  {id:'ai_image',label:'🎨 AIイラストBOT',kind:'image',ai:true},
  {id:'ai_dev',label:'💻 AI開発BOT',kind:'dev',ai:true},
  {id:'ai_course',label:'📚 AI教材BOT',kind:'course',ai:true},
  {id:'human',label:'🧑 人力BOT',kind:'match',ai:false},
  {id:'rest',label:'💤 副業しないBOT',kind:'none',ai:false}
]);
const DEFAULT = Object.freeze({months:24,monthlyHours:40,worlds:100,seed:20261009,kind:'article',competition:0.5,demand:1,aiSpeed:2.0,aiQuality:0.90,aiCost:3000,marketing:0,marketingEffect:0.04,hourValue:1000});
function clamp(x,a,b){return Math.min(b,Math.max(a,x))}
function num(x,d){const n=Number(x);return Number.isFinite(n)?n:d}
function config(overrides){
 const o=Object.assign({},DEFAULT,overrides||{});
 return {
  months:clamp(Math.floor(num(o.months,DEFAULT.months)),6,60), monthlyHours:clamp(num(o.monthlyHours,40),2,160),
  worlds:clamp(Math.floor(num(o.worlds,100)),10,500),seed:Math.floor(num(o.seed,DEFAULT.seed))|0,
  kind:BASE[o.kind]?o.kind:'article', competition:clamp(num(o.competition,.5),0,1),
  demand:clamp(num(o.demand,1),.1,10), aiSpeed:clamp(num(o.aiSpeed,2),1,4),
  aiQuality:clamp(num(o.aiQuality,.90),.5,1.5),aiCost:clamp(num(o.aiCost,3000),0,30000),
  marketing:clamp(num(o.marketing,0),0,40), marketingEffect:clamp(num(o.marketingEffect,.04),0,.15),
  hourValue:clamp(num(o.hourValue,1000),0,5000)
 };
}
function makeRng(seed){let s=(seed|0)>>>0; if(!s)s=0x6d2b79f5;
 return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
function normal(rng){const a=Math.max(rng(),1e-10),b=rng();return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*b)}
function poisson(lambda,rng){
 if(!(lambda>0))return 0;
 if(lambda<26){let p=Math.exp(-lambda),q=1,k=0;do{q*=rng();k++}while(q>p&&k<1000);return k-1}
 return Math.max(0,Math.round(lambda+Math.sqrt(lambda)*normal(rng)));
}
function median(vals){if(!vals.length)return 0;const x=vals.slice().sort((a,b)=>a-b),j=Math.floor(x.length/2);return x.length%2?x[j]:(x[j-1]+x[j])/2}
function pct(vals,condition){return vals.filter(condition).length/Math.max(vals.length,1)}
function routeDef(r,c){const kind=r.kind==='match'?c.kind:r.kind;return {kind,base:BASE[kind]}}
function shockPack(seed,world,months){
 const rng=makeRng((seed^Math.imul((world+1),0x9e3779b1))|0);
 const worldFactor=Math.exp(normal(rng)*0.68-0.68*0.68/2);
 const monthly=[];
 for(let i=0;i<months;i++){const z=normal(rng);monthly.push(Math.exp(z*.34-0.34*0.34/2));}
 return {worldFactor,monthly};
}
function runOne(r,c,world){
 if(r.kind==='none')return {id:r.id,kind:'none',ai:false,cash:0,economic:0,revenue:0,fees:0,cost:0,units:0,visits:0,sales:0,hours:0,contact:0,backlog:0,monthly:Array.from({length:c.months},()=>0)};
 const {kind,base}=routeDef(r,c);
 const pack=shockPack(c.seed,world,c.months);
 const salt={article:1723,image:2243,dev:3319,course:4433}[kind];
 // All routes in the same kind use same idiosyncratic shock, facilitating AI vs human comparison.
 const rng=makeRng(c.seed ^ Math.imul(world+1,0x85ebca6b) ^ salt);
 const events=[];
 const out={id:r.id,kind,ai:r.ai,cash:0,economic:0,revenue:0,fees:0,cost:0,units:0,visits:0,sales:0,hours:0,contact:0,backlog:0,monthly:[]};
 let progress=0,serviceQueue=0;
 for(let m=0;m<c.months;m++){
   const budget=c.monthlyHours;
   const promotion=Math.min(c.marketing,budget*.7);
   let available=budget-promotion;
   const service=Math.min(available,serviceQueue);
   serviceQueue-=service;
   available-=service;
   out.contact+=promotion+service;
   out.hours+=budget;
   const speed=r.ai?c.aiSpeed:1;
   progress+=available*speed/base.hours;
   const newly=Math.floor(progress+1e-10);
   progress-=newly;
   if(newly){events.push({month:m,qty:newly});out.units+=newly}
   let weightedAssets=0;
   for(const ev of events){let age=m-ev.month+1;weightedAssets+=ev.qty*(1-Math.exp(-age/base.mature))*Math.exp(-age/96)}
   const t=(c.months===1?1:m/(c.months-1));
   const exposure=Math.exp(-c.competition*base.competition*t*1.30);
   const priceFactor=Math.exp(-c.competition*base.pricePressure*t*.33);
   const marketingBoost=1+c.marketing*c.marketingEffect;
   const quality=r.ai?c.aiQuality:1;
   const ownShock=Math.exp(normal(rng)*.42-.42*.42/2);
   const viewEstimate=weightedAssets*base.visits*c.demand*pack.worldFactor*pack.monthly[m]*ownShock*exposure*marketingBoost;
   const visits=poisson(viewEstimate,rng);
   const purchase=poisson(visits*base.conversion*quality,rng);
   const gross=purchase*base.payout*priceFactor;
   const fee=gross*base.fee;
   const tool=r.ai?c.aiCost:0;
   const profit=gross-fee-tool;
   out.visits+=visits;out.sales+=purchase;out.revenue+=gross;out.fees+=fee;out.cost+=tool;
   out.cash+=profit;out.monthly.push(profit);
   serviceQueue+=purchase*base.support;
 }
 out.backlog=serviceQueue;
 out.economic=out.cash-out.hours*c.hourValue;
 return out;
}
function simulate(overrides){
 const c=config(overrides), all={};for(const r of ROUTES)all[r.id]=[];
 for(let i=0;i<c.worlds;i++)for(const r of ROUTES)all[r.id].push(runOne(r,c,i));
 const summaries=ROUTES.map(r=>{
   const vals=all[r.id]; const get=k=>median(vals.map(v=>v[k]));
   return {id:r.id,label:r.kind==='match'?'🧑 人力BOT（'+BASE[c.kind].label+'）':r.label,kind:r.kind==='match'?c.kind:r.kind,ai:r.ai,
    cash:get('cash'),economic:get('economic'),revenue:get('revenue'),fees:get('fees'),cost:get('cost'),units:get('units'),visits:get('visits'),sales:get('sales'),hours:get('hours'),contact:get('contact'),backlog:get('backlog'),
    blackRate:pct(vals,v=>v.cash>0),economicBlackRate:pct(vals,v=>v.economic>0),p10:quantile(vals.map(v=>v.cash),.10),p90:quantile(vals.map(v=>v.cash),.90)};
 });
 return {config:c,worlds:all,summaries,baseline:BASE,routes:ROUTES};
}
function quantile(vals,q){const a=vals.slice().sort((x,y)=>x-y);if(!a.length)return 0;const i=(a.length-1)*q,k=Math.floor(i),f=i-k;return a[k]*(1-f)+a[Math.min(k+1,a.length-1)]*f}
function paired(a,b,key='cash'){if(a.length!==b.length)throw Error('world count mismatch');const diffs=a.map((x,i)=>x[key]-b[i][key]);return {median:median(diffs),positive:pct(diffs,d=>d>0),negative:pct(diffs,d=>d<0),equal:pct(diffs,d=>d===0),p10:quantile(diffs,.10),p90:quantile(diffs,.90)}}
function audit(overrides){
 const c=config(overrides),r=simulate(c),oneAi=r.worlds['ai_'+c.kind],oneHuman=r.worlds.human;
 const rr = [];
 const add=(key,title,type,statement,metric,classification)=>rr.push({key,title,type,statement,metric,classification});
 const out=paired(oneAi,oneHuman,'units');
 add('H1','AIで制作量が増える？','設計挙動','同一ジャンル・同一作業時間のAIありとなしを比較。',out,'designed');
 const cash=paired(oneAi,oneHuman,'cash');
 add('H2','AIで純利益も増える？','創発比較','ツール代・売れた件数・市場競争を加えて現金利益の差を見る。',cash,'emergent');
 const noComp=simulate({...c,competition:0});
 const comp=paired(noComp.worlds['ai_'+c.kind],oneAi,'revenue');
 add('H3','競争でAI副業の売上が減る？','設計挙動','競争なしと指定競争度で、同じSeedの売上を比較。',comp,'designed');
 const extraDemand=simulate({...c,demand:c.demand*1.6});
 const dem=paired(extraDemand.worlds['ai_'+c.kind],oneAi,'cash');
 add('H4','集客が1.6倍になれば純利益は増える？','設計挙動','制作能力は固定し、流入倍率のみ増加させて比較。',dem,'designed');
 const loss=oneAi.map(x=>x.cash);
 add('H5','AI副業でも赤字になる世界はある？','創発比較','100世界線のうち現金利益がマイナスの割合。',{median:median(loss),positive:pct(loss,v=>v<0),negative:pct(loss,v=>v>=0),equal:0},'emergent');
 const eco=oneAi.map(x=>x.economic);
 add('H6','時間価値を引いても黒字？','設計・会計定義','現金利益から投入時間×時給換算を引く。',{median:median(eco),positive:pct(eco,v=>v>0),negative:pct(eco,v=>v<=0),equal:0},'accounting');
 return {config:c,sim:r,findings:rr};
}
root.AISideLab={BASE,ROUTES,DEFAULT,config,makeRng,poisson,median,quantile,simulate,audit,paired,runOne};
})(typeof window!=='undefined'?window:globalThis);
