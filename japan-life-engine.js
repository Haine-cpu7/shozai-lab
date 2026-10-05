(function(){
'use strict';
const START_YEAR=2025,END_YEAR=2070,YEARS=45;
const POP={
 medium:{label:'出生中位',anchors:[
  {year:2025,total:123.21,child:13.47,work:73.53,elder:36.21},
  {year:2045,total:108.80,child:11.03,work:58.32,elder:39.45},
  {year:2065,total:91.59,child:8.36,work:48.09,elder:35.13},
  {year:2070,total:87.00,child:7.97,work:45.35,elder:33.67}
 ]},
 high:{label:'出生高位',anchors:[
  {year:2025,total:123.21,child:13.47,work:73.53,elder:36.21},
  {year:2045,total:112.03,child:13.21,work:59.37,elder:39.45},
  {year:2065,total:98.85,child:11.28,work:52.44,elder:35.13},
  {year:2070,total:95.49,child:11.15,work:50.67,elder:33.67}
 ]},
 low:{label:'出生低位',anchors:[
  {year:2025,total:123.21,child:13.47,work:73.53,elder:36.21},
  {year:2045,total:106.00,child:9.19,work:57.36,elder:39.45},
  {year:2065,total:85.70,child:6.20,work:44.37,elder:35.13},
  {year:2070,total:80.24,child:5.69,work:40.87,elder:33.67}
 ]}
};
const HOUSING={
 rent:{label:'🏢 賃貸',desc:'住宅を資産化せず、家賃を払い続ける。人口減の家賃影響は小さめに置く。'},
 buySensitive:{label:'🏠 持ち家（人口感応 高）',desc:'人口減で住宅価格・流動性が弱くなりやすい地域を想定するゲーム仮定。'},
 buyResilient:{label:'🏙️ 持ち家（人口感応 低）',desc:'人口減でも需要が比較的残る地域を想定するゲーム仮定。'}
};
const INVEST={
 cash:{label:'💴 現金中心',stockShare:0.10},
 balanced:{label:'⚖️ 現金＋世界株',stockShare:0.50},
 global:{label:'🌍 世界株中心',stockShare:0.80}
};
const SKILL={
 none:{label:'🧍 AI・学び直しなし',premium:.00,cost:0,hours:0,risk:.13},
 use:{label:'🤖 AIを使う・軽く学ぶ',premium:.08,cost:80_000,hours:45,risk:.07},
 deep:{label:'🧠 AI＋技能へ強く投資',premium:.18,cost:180_000,hours:105,risk:.035}
};
const SIDE={
 none:{label:'副業なし'},
 blog:{label:'📝 ブログ'},
 pokemon:{label:'🎴 ポケカ転売'}
};
const PENSION={
 weak:{label:'年金 弱め',replacement:.45},
 standard:{label:'年金 標準',replacement:.52},
 strong:{label:'年金 強め',replacement:.58}
};
const AI_MACRO={
 low:{label:'AI生産性 ほぼ効かない',boost:.000},
 base:{label:'AI生産性 ゆっくり効く',boost:.003},
 high:{label:'AI生産性 強く効く',boost:.007}
};
const LAYERS={
 pop:{label:'① 人口'},wage:{label:'② 賃金'},tax:{label:'③ 税・社会保障'},housing:{label:'④ 住宅'},pension:{label:'⑤ 年金'},ai:{label:'⑥ AI・生産性'}
};
const LAYER_PRESETS={
 pop:{pop:true,wage:false,tax:false,housing:false,pension:false,ai:false},
 wage:{pop:true,wage:true,tax:false,housing:false,pension:false,ai:false},
 tax:{pop:true,wage:true,tax:true,housing:false,pension:false,ai:false},
 housing:{pop:true,wage:true,tax:true,housing:true,pension:false,ai:false},
 pension:{pop:true,wage:true,tax:true,housing:true,pension:true,ai:false},
 ai:{pop:true,wage:true,tax:true,housing:true,pension:true,ai:true}
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function interp(a,b,t){return a+(b-a)*t}
function mean(a){return a.reduce((s,x)=>s+x,0)/(a.length||1)}
function q(arr,p){if(!arr.length)return 0;const a=arr.slice().sort((x,y)=>x-y),i=(a.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return lo===hi?a[lo]:a[lo]*(hi-i)+a[hi]*(i-lo)}
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0}
function hash(seed,a=0,b=0,c=0){let x=(seed>>>0)^Math.imul((a+1)|0,0x9e3779b1)^Math.imul((b+7)|0,0x85ebca6b)^Math.imul((c+13)|0,0xc2b2ae35);return mix32(x)}
function U(seed,a=0,b=0,c=0){return (hash(seed,a,b,c)+.5)/4294967296}
function N01(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function randomSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}catch(e){return (Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}}
function popAt(year,key='medium',enabled=true){if(!enabled)year=START_YEAR;const s=POP[key]||POP.medium,y=clamp(year,START_YEAR,END_YEAR),A=s.anchors;let lo=A[0],hi=A[A.length-1];for(let i=0;i<A.length-1;i++)if(y>=A[i].year&&y<=A[i+1].year){lo=A[i];hi=A[i+1];break}const t=hi.year===lo.year?0:(y-lo.year)/(hi.year-lo.year),o={year:y};for(const k of ['total','child','work','elder'])o[k]=interp(lo[k],hi[k],t);o.childShare=o.child/o.total;o.workShare=o.work/o.total;o.elderShare=o.elder/o.total;o.workPerElder=o.work/(o.elder||1);return o}
function inflation(seed,year){return clamp(.020+N01(seed,year,41,1)*.008,-.005,.05)}
function marketReturn(seed,year){const mu=.060,s=.145;let r=Math.exp((mu-.5*s*s)+s*N01(seed,year,42,1))-1-.0015;if(U(seed,year,42,3)<.07)r-=.16;return clamp(r,-.55,.50)}
function aiCurve(year){return clamp((year-2028)/12,0,1)*clamp((2055-year)/15+.35,.35,1)}
function annuityPayment(principal,annualRate,years){if(principal<=0)return 0;if(annualRate<=0)return principal/years;const r=annualRate;return principal*r/(1-Math.pow(1+r,-years))}
function defaultSettings(){return{popScenario:'medium',startAge:35,retireAge:65,startAssets:5_000_000,startWage:4_300_000,livingCost:2_400_000,housing:'rent',invest:'balanced',skill:'use',side:'none',pension:'standard',aiMacro:'base',layerPreset:'ai'}}
function normalizeSettings(x={}){return{...defaultSettings(),...x}}
function housingInit(s){if(s.housing==='rent')return{homeValue:0,mortgage:0,mortgagePayment:0,purchasePrice:0};const cfg=s.housing==='buySensitive'?{price:28_000_000,elastic:.72}:{price:45_000_000,elastic:.24};const down=cfg.price*.10,principal=cfg.price-down;return{homeValue:cfg.price,mortgage:principal,mortgagePayment:annuityPayment(principal,.018,35),purchasePrice:cfg.price,elastic:cfg.elastic,down}}
function newState(seed,settings={},layers=null){const s=normalizeSettings(settings),L=layers||LAYER_PRESETS[s.layerPreset]||LAYER_PRESETS.ai,inv=INVEST[s.invest],h=housingInit(s);let cash=s.startAssets*(1-inv.stockShare),index=s.startAssets*inv.stockShare;if(L.housing&&s.housing!=='rent'){const d=Math.min(cash+index,h.down);let left=d,t=Math.min(cash,left);cash-=t;left-=t;if(left>0){index=Math.max(0,index-left)}h.downPaid=d;h.mortgage=Math.max(0,h.purchasePrice-d);h.mortgagePayment=annuityPayment(h.mortgage,.018,35)}else{h.homeValue=0;h.mortgage=0;h.mortgagePayment=0}
 return{seed,settings:s,layers:{...L},year:START_YEAR,age:s.startAge,cpi:1,cash,index,debt:0,homeValue:h.homeValue,mortgage:h.mortgage,mortgagePayment:h.mortgagePayment,purchasePrice:h.purchasePrice||0,homeElastic:h.elastic||0,wageReal:s.startWage,pensionReal:0,pensionBaseReal:null,deficitYears:0,extraHours:0,cumTaxReal:0,cumHousingReal:0,cumLivingReal:0,cumTrainingReal:0,cumSideReal:0,cumWageReal:0,history:[]}}
function aiBoost(s,year){if(!s.layers.ai)return 0;return AI_MACRO[s.settings.aiMacro].boost*aiCurve(year)}
function taxRateFor(s,pop){if(!s.layers.tax)return .20;const start=popAt(START_YEAR,s.settings.popScenario,true).workPerElder,pressure=clamp(1-pop.workPerElder/start,0,.5),offset=s.layers.ai?aiBoost(s,s.year)*2:0;return clamp(.20+.12*pressure-offset,.18,.31)}
function wageGrowth(s,pop,nextYear){if(!s.layers.wage)return 0;const age=s.age+1,ageG=age<45?.007:age<55?.002:age<65?-.004:-.010,startWork=popAt(START_YEAR,s.settings.popScenario,true).work,scarcity=clamp(1-pop.work/startWork,0,.55)*.008,base=.003,ai=aiBoost(s,nextYear);return base+ageG+scarcity+ai+N01(s.seed,nextYear,51,1)*.012}
function skillMultiplier(s,nextYear){if(!s.layers.ai)return 1;const sk=SKILL[s.settings.skill],ramp=clamp((nextYear-START_YEAR)/10,0,1);return 1+sk.premium*ramp}
function sideOutcome(s,pop,nextYear){const kind=s.settings.side;if(kind==='none')return{netReal:0,hours:0};const skill=SKILL[s.settings.skill],aiEff=s.layers.ai?(s.settings.skill==='deep'?.60:s.settings.skill==='use'?.78:1):1;if(kind==='blog'){
  const demand=(pop.work+.70*pop.elder+.12*pop.child)/(popAt(START_YEAR,s.settings.popScenario,true).work+.70*popAt(START_YEAR,s.settings.popScenario,true).elder+.12*popAt(START_YEAR,s.settings.popScenario,true).child),maturity=clamp((nextYear-START_YEAR)/5,0,1),gross=420_000*maturity*(.72+.28*demand)*(1+(skill.premium||0)*1.5)*clamp(1+N01(s.seed,nextYear,71,1)*.28,.35,1.75),cost=35_000,hours=(nextYear<=2027?130:65)*aiEff;return{netReal:Math.max(-cost,gross-cost),hours};
 }
 const demand=(.46*pop.child+.42*pop.work+.12*pop.elder)/(.46*popAt(START_YEAR,s.settings.popScenario,true).child+.42*popAt(START_YEAR,s.settings.popScenario,true).work+.12*popAt(START_YEAR,s.settings.popScenario,true).elder),turn=650_000*(.65+.35*demand)*(.78+U(s.seed,nextYear,72,1)*.45),margin=clamp(.16+N01(s.seed,nextYear,72,2)*.06,.02,.30),fees=turn*.112,net=turn*margin-fees,hours=(75+U(s.seed,nextYear,72,3)*55)*aiEff;return{netReal:net,hours};
}
function housingYear(s,pop,nextYear,inf){if(!s.layers.housing)return{costNominal:s.settings.livingCost*0.45*s.cpi,homeReturn:0};if(s.settings.housing==='rent'){
 const start=popAt(START_YEAR,s.settings.popScenario,true),demand=pop.total/start.total,realRent=1_080_000*Math.pow(demand,.20);return{costNominal:realRent*s.cpi,homeReturn:0};
 }
 const start=popAt(START_YEAR,s.settings.popScenario,true),demand=pop.work/start.work,realApp=-s.homeElastic*(1-demand)/Math.max(1,nextYear-START_YEAR)+N01(s.seed,nextYear,61,1)*.018;const nominalRet=inf+realApp;s.homeValue=Math.max(0,s.homeValue*(1+nominalRet));let pay=0;if(s.mortgage>0){const interest=s.mortgage*.018,principal=Math.max(0,Math.min(s.mortgage,s.mortgagePayment-interest));pay=interest+principal;s.mortgage=Math.max(0,s.mortgage-principal)}const maintain=s.homeValue*.010;return{costNominal:pay+maintain,homeReturn:nominalRet};
}
function withdraw(s,amount){let left=amount,t=Math.min(s.cash,left);s.cash-=t;left-=t;if(left>0){t=Math.min(s.index,left);s.index-=t;left-=t}if(left>0){s.debt+=left;left=0}}
function deposit(s,amount){const share=INVEST[s.settings.invest].stockShare;s.index+=amount*share;s.cash+=amount*(1-share)}
function step(state){if(state.year>=END_YEAR)return state;const s=state,next=s.year+1,pop=popAt(next,s.settings.popScenario,s.layers.pop),inf=inflation(s.seed,next);s.cpi*=1+inf;s.index=Math.max(0,s.index*(1+marketReturn(s.seed,next)));s.debt*=1.04;
 const working=(s.age+1)<s.settings.retireAge;let wageReal=0;if(working){s.wageReal=Math.max(1_500_000,s.wageReal*(1+wageGrowth(s,pop,next)));wageReal=s.wageReal*skillMultiplier(s,next);if(s.layers.ai){const sk=SKILL[s.settings.skill],shockProb=sk.risk*aiCurve(next);if(U(s.seed,next,52,1)<shockProb)wageReal*=.86}}
 const taxRate=taxRateFor(s,pop),side=sideOutcome(s,pop,next),taxableReal=Math.max(0,wageReal+Math.max(0,side.netReal)),taxReal=taxableReal*taxRate;
 if(!working&&s.layers.pension){if(s.pensionBaseReal==null){const repl=PENSION[s.settings.pension].replacement,delay=s.settings.retireAge>=70?1.12:1;s.pensionBaseReal=Math.max(0,s.wageReal*(1-taxRate)*repl*delay)}s.pensionReal=s.pensionBaseReal}else s.pensionReal=0;
 const skill=SKILL[s.settings.skill],trainingReal=(s.layers.ai&&working&&next<=START_YEAR+10)?skill.cost:0,trainingHours=(s.layers.ai&&working&&next<=START_YEAR+10)?skill.hours:0;
 const house=housingYear(s,pop,next,inf),livingReal=s.settings.livingCost*(working?1:.92),incomeReal=wageReal+side.netReal+s.pensionReal-taxReal,expenseNominal=(livingReal+trainingReal)*s.cpi+house.costNominal,netNominal=incomeReal*s.cpi-expenseNominal;
 if(netNominal>=0)deposit(s,netNominal);else{withdraw(s,-netNominal);s.deficitYears++}
 s.extraHours+=trainingHours+side.hours;s.cumTaxReal+=taxReal;s.cumHousingReal+=house.costNominal/s.cpi;s.cumLivingReal+=livingReal;s.cumTrainingReal+=trainingReal;s.cumSideReal+=side.netReal;s.cumWageReal+=wageReal;s.year=next;s.age+=1;
 const m=metrics(s,pop,{taxRate,wageReal,sideReal:side.netReal,housingReal:house.costNominal/s.cpi,trainingReal,livingReal,working});s.history.push(m);return s}
function metrics(s,pop=null,extra={}){pop=pop||popAt(s.year,s.settings.popScenario,s.layers.pop);const netWorth=(s.cash+s.index+s.homeValue-s.mortgage-s.debt)/s.cpi,liquid=(s.cash+s.index-s.debt)/s.cpi,annualNeed=s.settings.livingCost*(s.age>=s.settings.retireAge?.92:1)+(s.settings.housing==='rent'&&s.layers.housing?1_080_000:0),pensionCoverage=annualNeed>0?s.pensionReal/annualNeed:0;return{year:s.year,age:s.age,pop,netWorth,liquid,homeReal:s.homeValue/s.cpi,mortgageReal:s.mortgage/s.cpi,debtReal:s.debt/s.cpi,wageReal:extra.wageReal??(s.age<s.settings.retireAge?s.wageReal:0),pensionReal:s.pensionReal,taxRate:extra.taxRate??taxRateFor(s,pop),deficitYears:s.deficitYears,extraHours:s.extraHours,pensionCoverage,cumTaxReal:s.cumTaxReal,cumHousingReal:s.cumHousingReal,cumTrainingReal:s.cumTrainingReal,cumSideReal:s.cumSideReal,...extra}}
function run(seed,settings={},layers=null){const s=newState(seed,settings,layers);while(s.year<END_YEAR)step(s);return s}
function evaluate(s){return metrics(s)}
function layerSequence(seed,settings={}){const out=[];for(const key of ['pop','wage','tax','housing','pension','ai']){const st=run(seed,{...settings,layerPreset:key},LAYER_PRESETS[key]);out.push({key,label:LAYERS[key].label,result:evaluate(st)})}return out}
function batch(n,baseSeed,settings={},layers=null){const nw=[],def=[],hrs=[],cov=[],liq=[];for(let i=0;i<n;i++){const st=run((baseSeed+Math.imul(i,104729))>>>0,settings,layers),e=evaluate(st);nw.push(e.netWorth);def.push(e.deficitYears);hrs.push(e.extraHours);cov.push(e.pensionCoverage);liq.push(e.liquid)}return{n,netWorthMedian:q(nw,.5),netWorthBottom10:q(nw,.1),deficitMedian:q(def,.5),deficitP90:q(def,.9),hoursMedian:q(hrs,.5),pensionCoverageMedian:q(cov,.5),liquidMedian:q(liq,.5),positiveRate:mean(nw.map(x=>x>0?1:0))}}
function gridPlans(side='none'){const arr=[];for(const housing of Object.keys(HOUSING))for(const invest of Object.keys(INVEST))for(const skill of Object.keys(SKILL))arr.push({housing,invest,skill,side});return arr}
function planLabel(p){return `${HOUSING[p.housing].label.replace(/^\S+\s?/,'')} × ${INVEST[p.invest].label.replace(/^\S+\s?/,'')} × ${SKILL[p.skill].label.replace(/^\S+\s?/,'')}`}
window.JapanLifeLab={START_YEAR,END_YEAR,YEARS,POP,HOUSING,INVEST,SKILL,SIDE,PENSION,AI_MACRO,LAYERS,LAYER_PRESETS,clamp,mean,q,randomSeed,popAt,defaultSettings,normalizeSettings,newState,step,run,evaluate,layerSequence,batch,gridPlans,planLabel};
})();
