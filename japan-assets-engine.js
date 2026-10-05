(function(){
'use strict';
const START_YEAR=2025, END_YEAR=2070, YEARS=45, START_CAPITAL=1_000_000;
const POP={
 medium:{label:'出生中位',tfr:'長期TFR 1.36',anchors:[
  {year:2025,total:123.21,child:13.47,work:73.53,elder:36.21},
  {year:2045,total:108.80,child:11.03,work:58.32,elder:39.45},
  {year:2065,total:91.59,child:8.36,work:48.09,elder:35.13},
  {year:2070,total:87.00,child:7.97,work:45.35,elder:33.67}
 ]},
 high:{label:'出生高位',tfr:'長期TFR 1.64',anchors:[
  {year:2025,total:123.21,child:13.47,work:73.53,elder:36.21},
  {year:2045,total:112.03,child:13.21,work:59.37,elder:39.45},
  {year:2065,total:98.85,child:11.28,work:52.44,elder:35.13},
  {year:2070,total:95.49,child:11.15,work:50.67,elder:33.67}
 ]},
 low:{label:'出生低位',tfr:'長期TFR 1.13',anchors:[
  {year:2025,total:123.21,child:13.47,work:73.53,elder:36.21},
  {year:2045,total:106.00,child:9.19,work:57.36,elder:39.45},
  {year:2065,total:85.70,child:6.20,work:44.37,elder:35.13},
  {year:2070,total:80.24,child:5.69,work:40.87,elder:33.67}
 ]}
};
const ADAPT={
 local:{label:'国内だけで戦う',blog:[.95,.90],pokemon:[.90,.85],desc:'日本の顧客・検索・二次流通への依存を高く置く'},
 adapt:{label:'人口変化に合わせて適応',blog:[.85,.45],pokemon:[.75,.40],desc:'高齢層・別ジャンル・海外販路へ徐々に寄せる'},
 global:{label:'最初から世界市場も使う',blog:[.40,.25],pokemon:[.35,.20],desc:'国内人口への依存を低めに置く'}
};
const STRATEGIES=['blog','pokemon','rolex','index','cash'];
const META={
 blog:{label:'📝 ブログ戦略',short:'ブログ',domestic:'高',labor:'高',global:'低〜中'},
 pokemon:{label:'🎴 ポケカ転売戦略',short:'ポケカ',domestic:'中〜高',labor:'高',global:'中〜高'},
 rolex:{label:'⌚ ロレックス',short:'ロレックス',domestic:'低',labor:'低',global:'高'},
 index:{label:'🌍 世界株のみ',short:'世界株',domestic:'極低',labor:'極低',global:'非常に高'},
 cash:{label:'💴 現金',short:'現金',domestic:'なし',labor:'なし',global:'なし'}
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function interp(a,b,t){return a+(b-a)*t}
function popAt(year,key='medium'){
 const s=POP[key]||POP.medium,y=clamp(year,START_YEAR,END_YEAR),A=s.anchors;let lo=A[0],hi=A[A.length-1];
 for(let i=0;i<A.length-1;i++)if(y>=A[i].year&&y<=A[i+1].year){lo=A[i];hi=A[i+1];break}
 const t=hi.year===lo.year?0:(y-lo.year)/(hi.year-lo.year),o={year:y};for(const k of ['total','child','work','elder'])o[k]=interp(lo[k],hi[k],t);
 o.childShare=o.child/o.total;o.workShare=o.work/o.total;o.elderShare=o.elder/o.total;o.workPerElder=o.work/(o.elder||1);return o;
}
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0}
function hash(seed,a=0,b=0,c=0){let x=(seed>>>0)^Math.imul((a+1)|0,0x9e3779b1)^Math.imul((b+7)|0,0x85ebca6b)^Math.imul((c+13)|0,0xc2b2ae35);return mix32(x)}
function U(seed,a=0,b=0,c=0){return (hash(seed,a,b,c)+.5)/4294967296}
function N01(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function randomSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}catch(e){return (Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}}
function mean(a){return a.reduce((s,x)=>s+x,0)/(a.length||1)}
function q(arr,p){if(!arr.length)return 0;const a=arr.slice().sort((x,y)=>x-y),i=(a.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return lo===hi?a[lo]:a[lo]*(hi-i)+a[hi]*(i-lo)}
function exposure(mode,key,progress){const a=(ADAPT[mode]||ADAPT.adapt)[key];return interp(a[0],a[1],clamp(progress,0,1))}
function marketFactors(pop,competition=.5){
 const start=popAt(2025,'medium');
 const blogDemand=(pop.work+.70*pop.elder+.15*pop.child)/(start.work+.70*start.elder+.15*start.child);
 const pokeDemand=(.45*pop.child+.42*pop.work+.13*pop.elder)/(.45*start.child+.42*start.work+.13*start.elder);
 const comp=Math.pow(Math.max(.45,pop.work/start.work),competition);
 return{blogDemand,pokeDemand,competition:comp};
}
function resolveRegime(seed){return ['normal','early','lost','late'][(seed>>>0)%4]}
function marketReturn(seed,year,regime){let mu=.0635,s=.147;if(regime==='lost'&&year<=2035)mu=.005;let r=Math.exp((mu-.5*s*s)+s*N01(seed,year,500,1))-1-.0015;if(regime==='early'&&year===2026)r=(1+r)*.65-1;if(regime==='late'&&year===2065)r=(1+r)*.65-1;return clamp(r,-.75,.65)}
function inflation(seed,year){return clamp(.020+N01(seed,year,501,1)*.009,-.005,.05)}
function collectibleReturn(seed,year){let r=.018+N01(seed,year,502,1)*.13;if(U(seed,year,502,3)<.07)r-=.18;if(U(seed,year,502,4)<.06)r+=.16;return clamp(r,-.35,.40)}
function rolexReturn(seed,year){return clamp(.010+N01(seed,year,503,1)*.11,-.28,.32)}
function newState(seed,settings={}){
 const popScenario=settings.popScenario||'medium',adapt=settings.adapt||'adapt',competition=+(settings.competition??.5),tax=+(settings.tax??.20),wage=+(settings.wage??1500);
 return{seed,popScenario,adapt,competition,tax,wage,regime:resolveRegime(seed),year:2025,cpi:1,history:[],
  blog:{cash:50_000,index:950_000,effectiveArticles:0,hours:0,lastNet:0,revenue:0,costs:0},
  pokemon:{cash:200_000,index:800_000,inventory:0,hours:0,revenue:0,fees:0,shipping:0},
  rolex:{cash:50_000,watch:950_000,hours:6,costs:0},index:{value:1_000_000,hours:1},cash:{value:1_000_000,hours:0}}
}
function pay(obj,amount){const fromCash=Math.min(obj.cash,amount);obj.cash-=fromCash;let left=amount-fromCash;if(left>0&&obj.index!=null){const take=Math.min(obj.index,left);obj.index-=take;left-=take}return amount-left}
function sweep(obj,reserve){if(obj.cash>reserve&&obj.index!=null){const x=obj.cash-reserve;obj.cash=reserve;obj.index+=x}}
function step(s){if(s.year>=END_YEAR)return s;const next=s.year+1,progress=(next-START_YEAR)/(END_YEAR-START_YEAR),pop=popAt(next,s.popScenario),mf=marketFactors(pop,s.competition),mr=marketReturn(s.seed,next,s.regime),inf=inflation(s.seed,next),cr=collectibleReturn(s.seed,next),rr=rolexReturn(s.seed,next);s.cpi*=1+inf;
 // common global market for every strategy that parks surplus in world equities
 for(const k of ['blog','pokemon'])s[k].index=Math.max(0,s[k].index*(1+mr-.0015));s.index.value=Math.max(0,s.index.value*(1+mr-.0015));
 // blog: build 60 articles over 3 years, then refresh/maintain. Population affects audience, falling creator competition partially offsets it.
 const be=exposure(s.adapt,'blog',progress),blogMarket=(1-be)+be*(mf.blogDemand/Math.max(.55,mf.competition));
 if(next===2026){s.blog.effectiveArticles=60;s.blog.hours+=250}else{const decay=s.adapt==='local'?.80:s.adapt==='adapt'?.86:.88;s.blog.effectiveArticles*=decay;s.blog.effectiveArticles+=8;s.blog.hours+=34}
 const blogCost=18_000;pay(s.blog,blogCost);s.blog.costs+=blogCost;
 const ageAdapt=s.adapt==='local'?1:s.adapt==='adapt'?(1+.08*progress):(1+.12*progress);const blogNoise=clamp(1+N01(s.seed,next,601,1)*.25,.40,1.75);
 const blogGross=Math.max(0,s.blog.effectiveArticles*1_600*blogMarket*ageAdapt*blogNoise);s.blog.cash+=blogGross;s.blog.revenue+=blogGross;s.blog.lastNet=blogGross-blogCost;sweep(s.blog,50_000);
 // pokemon resale: recurring side business. Japan buyer pool matters, but global reach can decouple demand. Competition shrink helps acquisition somewhat; low liquidity hurts exit.
 const pe=exposure(s.adapt,'pokemon',progress),pokeDemand=(1-pe)+pe*mf.pokeDemand,competitionHelp=clamp(1+(1-mf.competition)*.30,1,1.18),liquidity=clamp(.60+.40*pokeDemand,.55,1.08);
 s.pokemon.inventory=Math.max(0,s.pokemon.inventory*(1+cr)*(.97+.03*liquidity));
 const turnover=clamp(520_000*pokeDemand*competitionHelp*(.75+U(s.seed,next,602,1)*.55),180_000,900_000);const grossMargin=clamp(.18*pokeDemand+N01(s.seed,next,602,2)*.08,.02,.38);const grossProfit=turnover*grossMargin,fee=turnover*.10,shipping=turnover*.012;const net=grossProfit-fee-shipping;if(net>=0)s.pokemon.cash+=net;else pay(s.pokemon,-net);s.pokemon.revenue+=turnover;s.pokemon.fees+=fee;s.pokemon.shipping+=shipping;const inventoryAdd=clamp(turnover*.08*(.8+U(s.seed,next,602,3)*.4),20_000,90_000),inventoryPaid=pay(s.pokemon,inventoryAdd);s.pokemon.inventory+=inventoryPaid;s.pokemon.hours+=45+U(s.seed,next,602,4)*45;sweep(s.pokemon,200_000);
 // Rolex: global luxury price path; only a small local-liquidity friction is tied to Japan working-age population.
 s.rolex.watch=Math.max(0,s.rolex.watch*(1+rr));if((next-START_YEAR)%5===0){const m=35_000*s.cpi;const paid=Math.min(s.rolex.cash,m);s.rolex.cash-=paid;s.rolex.costs+=paid}s.rolex.hours+=2;
 // cash stays nominal; cpi handles purchasing power
 s.year=next;s.history.push(snapshot(s,pop,{blogMarket,pokeDemand,liquidity,mr,inf}));return s;
}
function exitValues(s){const pop=popAt(s.year,s.popScenario),progress=(s.year-START_YEAR)/(END_YEAR-START_YEAR),mf=marketFactors(pop,s.competition),pe=exposure(s.adapt,'pokemon',progress),pokeDemand=(1-pe)+pe*mf.pokeDemand,localLiquidity=clamp(.88+.12*(pop.work/popAt(2025,'medium').work),.78,1);
 const site=Math.max(0,s.blog.lastNet)*2.0;const pExit=Math.max(0,s.pokemon.inventory*(.90*clamp(.72+.28*pokeDemand,.6,1.05)));const rExit=Math.max(0,s.rolex.watch*(1-.07)*localLiquidity);
 return{blog:s.blog.cash+s.blog.index+site,pokemon:s.pokemon.cash+s.pokemon.index+pExit,rolex:s.rolex.cash+rExit,index:s.index.value,cash:s.cash.value};
}
function evaluate(s){const v=exitValues(s),out={};for(const k of STRATEGIES){const gain=Math.max(0,v[k]-START_CAPITAL),afterTax=v[k]-gain*s.tax,real=afterTax/s.cpi,hours=s[k].hours||0,adjusted=real-hours*s.wage;out[k]={nominal:v[k],real,adjusted,hours,meta:META[k]}}
 return out;
}
function snapshot(s,pop,extra={}){const e=evaluate(s);return{year:s.year,pop,regime:s.regime,total:pop.total,child:pop.child,work:pop.work,elder:pop.elder,cpi:s.cpi,extra,values:Object.fromEntries(STRATEGIES.map(k=>[k,{real:e[k].real,adjusted:e[k].adjusted,nominal:e[k].nominal}]))}}
function run(seed,settings={}){const s=newState(seed,settings);while(s.year<END_YEAR)step(s);return s}
function batch(n,baseSeed,settings={}){const vals=Object.fromEntries(STRATEGIES.map(k=>[k,[]])),adj=Object.fromEntries(STRATEGIES.map(k=>[k,[]])),wins=Object.fromEntries(STRATEGIES.map(k=>[k,0])),hours=Object.fromEntries(STRATEGIES.map(k=>[k,[]]));for(let i=0;i<n;i++){const s=run((baseSeed+Math.imul(i,104729))>>>0,settings),e=evaluate(s);let w=STRATEGIES[0];for(const k of STRATEGIES){vals[k].push(e[k].real);adj[k].push(e[k].adjusted);hours[k].push(e[k].hours);if(e[k].adjusted>e[w].adjusted)w=k}wins[w]++}const summary={};for(const k of STRATEGIES)summary[k]={median:q(adj[k],.5),bottom10:q(adj[k],.1),realMedian:q(vals[k],.5),hoursMedian:q(hours[k],.5),wins:wins[k]};return{n,baseSeed,settings,summary}}
window.JapanAssetLab={START_YEAR,END_YEAR,YEARS,START_CAPITAL,POP,ADAPT,STRATEGIES,META,clamp,q,mean,randomSeed,popAt,marketFactors,newState,step,exitValues,evaluate,run,batch};
})();
